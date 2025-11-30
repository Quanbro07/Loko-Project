import httpx
from datetime import datetime, timedelta
from typing import List, Dict, Any
from app.core.config import settings
from app.schemas.weather_dto import (
    WeatherRequest, WeatherResponse, DayWeatherScope, 
    HourlyWeather, Condition, WeatherAlertDetail
)

class WeatherService:
    def __init__(self):
        self.api_key = settings.WEATHER_API_KEY
        self.base_url = settings.WEATHER_API_BASE_URL

    async def get_forecast(self, request: WeatherRequest) -> WeatherResponse:
        # 1. Parse dates
        try:
            trip_start_date = datetime.strptime(request.startDate, "%Y-%m-%d")
            trip_end_date = datetime.strptime(request.endDate, "%Y-%m-%d")
            today = datetime.now()
            
            # Thời gian hoạt động trong ngày
            op_start = datetime.strptime(request.fromOperateTime, "%H:%M").time()
            op_end = datetime.strptime(request.toOperateTime, "%H:%M").time()
            
            # Kiểm tra xem có qua đêm không (ví dụ 08:00 đến 02:00 sáng hôm sau)
            is_cross_day = op_end < op_start

        except ValueError as e:
            print(f"❌ Date/Time format error: {e}")
            return WeatherResponse(scopes=[], alerts=[])

        # 2. Tính toán số ngày cần gọi API
        # WeatherAPI tính 'days' bắt đầu từ hôm nay.
        # Ví dụ: Nay 28, đi ngày 30->02. Cần forecast ít nhất đến ngày 02.
        # Days needed = (TripEnd - Today).days + 1 + buffer
        days_diff = (trip_end_date - today).days + 2 # +2 để chắc chắn cover hết múi giờ/qua đêm
        
        # Free tier thường max 3 ngày, Paid tier 10-14 ngày.
        # Ta cứ request số ngày cần thiết, API sẽ tự truncate nếu quá giới hạn gói.
        days_to_request = max(1, days_diff) 

        params = {
            'key': self.api_key,
            'q': request.provinceName, # Search theo tên tỉnh
            'days': days_to_request,
            'aqi': 'no',
            'alerts': 'yes',
            'lang': 'vi'
        }

        async with httpx.AsyncClient() as client:
            try:
                response = await client.get(self.base_url, params=params, timeout=10.0)
                if response.status_code != 200:
                    print(f"⚠️ WeatherAPI Error: {response.text}")
                    return WeatherResponse(scopes=[], alerts=[])
                
                data = response.json()
            except Exception as e:
                print(f"⚠️ Connection Error: {e}")
                return WeatherResponse(scopes=[], alerts=[])

        # 3. Xử lý Alerts
        alerts_response = []
        if 'alerts' in data and 'alert' in data['alerts']:
            for alert in data['alerts']['alert']:
                alerts_response.append(WeatherAlertDetail(
                    headline=alert.get('headline', ''),
                    desc=alert.get('desc', ''),
                    severity=alert.get('severity', ''),
                    areas=alert.get('areas', '')
                ))

        # 4. Gom tất cả hourly data từ API vào một Dictionary để tra cứu nhanh
        # Key: timestamp (epoch), Value: data object
        all_hours_map = {}
        forecast_days = data.get('forecast', {}).get('forecastday', [])
        
        for fday in forecast_days:
            for hour_data in fday.get('hour', []):
                all_hours_map[hour_data['time_epoch']] = hour_data

        # 5. Xây dựng Scopes theo lịch trình chuyến đi
        scopes_response = []
        
        # Duyệt qua từng ngày của chuyến đi
        current_date = trip_start_date
        day_count = 1
        
        while current_date <= trip_end_date:
            # Xác định khung giờ cần lấy cho ngày hiện tại (Day X)
            
            # Start: Ngày hiện tại + fromOperateTime
            scope_start_dt = datetime.combine(current_date.date(), op_start)
            
            # End: Ngày hiện tại (hoặc hôm sau) + toOperateTime
            if is_cross_day:
                scope_end_dt = datetime.combine(current_date.date() + timedelta(days=1), op_end)
            else:
                scope_end_dt = datetime.combine(current_date.date(), op_end)
            
            hourly_weather_list = []
            
            # Loop qua từng giờ trong khung giờ này
            # Lưu ý: scope_end_dt là mốc chặn trên, ta lấy <=
            iter_time = scope_start_dt
            # Làm tròn xuống giờ chẵn để khớp với API (vd: 08:15 -> 08:00 để tìm, hoặc duyệt từng giờ)
            # WeatherAPI trả về các mốc chẵn giờ: 00:00, 01:00...
            # Ta sẽ duyệt iter_time += 1 hour
            
            # Chỉnh iter_time về đầu giờ gần nhất (VD 08:15 -> 08:00)
            iter_time = iter_time.replace(minute=0, second=0, microsecond=0)
            
            while iter_time <= scope_end_dt:
                # Nếu giờ thực tế < fromTime (do làm tròn xuống), bỏ qua nếu muốn chặt chẽ
                # Nhưng thường lấy dư 1 chút cũng được. Ở đây ta lấy logic >= scope_start_dt
                
                # Check logic chặt:
                # if iter_time < scope_start_dt and iter_time + timedelta(hours=1) <= scope_start_dt:
                #     iter_time += timedelta(hours=1)
                #     continue

                ts = int(iter_time.timestamp())
                
                if ts in all_hours_map:
                    h_data = all_hours_map[ts]
                    
                    # Map dữ liệu
                    hourly_weather_list.append(HourlyWeather(
                        time=h_data.get('time'),
                        temp_c=h_data.get('temp_c'),
                        condition=Condition(
                            text=h_data.get('condition', {}).get('text'),
                            icon=h_data.get('condition', {}).get('icon')
                        ),
                        will_it_rain=h_data.get('will_it_rain', 0)
                    ))
                
                iter_time += timedelta(hours=1)
            
            # Chỉ thêm Scope nếu có dữ liệu (API trả về ngày đó)
            if hourly_weather_list:
                scopes_response.append(DayWeatherScope(
                    scope=f"Day{day_count}",
                    date=current_date.strftime("%Y-%m-%d"),
                    hourly_weather=hourly_weather_list
                ))
            
            current_date += timedelta(days=1)
            day_count += 1

        return WeatherResponse(scopes=scopes_response, alerts=alerts_response)