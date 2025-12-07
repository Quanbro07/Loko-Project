import httpx
from datetime import datetime, timedelta
from typing import List, Dict, Any
from app.core.config import settings
# Import hàm map ID -> Tên tỉnh
from app.core.mappings import get_province_name_by_id
from app.schemas.weather_dto import (
    WeatherRequest, WeatherResponse, DayWeatherScope, 
    HourlyWeather, Condition, WeatherAlertDetail
)

class WeatherService:
    def __init__(self):
        self.api_key = settings.WEATHER_API_KEY
        self.base_url = settings.WEATHER_API_BASE_URL  # Mặc định là forecast.json

    async def get_forecast(self, request: WeatherRequest) -> WeatherResponse:
        # 1. Parse dates
        try:
            trip_start_date = datetime.strptime(request.startDate, "%Y-%m-%d")
            trip_end_date = datetime.strptime(request.endDate, "%Y-%m-%d")
            # Lấy ngày hiện tại (bỏ phần giờ phút để so sánh)
            now = datetime.now()
            today_date = now.date()
            
            # Thời gian hoạt động trong ngày
            op_start = datetime.strptime(request.fromOperateTime, "%H:%M").time()
            op_end = datetime.strptime(request.toOperateTime, "%H:%M").time()
            
            is_cross_day = op_end < op_start

        except ValueError as e:
            print(f"❌ Date/Time format error: {e}")
            return WeatherResponse(scopes=[], alerts=[])

        # --- LOGIC MỚI: Lấy tên địa điểm từ ID thay vì dùng trực tiếp provinceName ---
        search_query = get_province_name_by_id(request.provinceId)

        print(f"👉 [WEATHER DEBUG] ID: {request.provinceId} -> Mapped Query: '{search_query}'")
        # ---------------------------------------------------------------------------

        # Chuẩn bị container dữ liệu
        all_hours_map = {} # Key: epoch timestamp, Value: data object
        alerts_response = []

        async with httpx.AsyncClient() as client:
            
            # --- PHASE 1: LẤY DỮ LIỆU QUÁ KHỨ (HISTORY) ---
            # Chỉ chạy nếu startDate < today
            
            # URL cho history (thay thế forecast.json bằng history.json)
            history_base_url = self.base_url.replace("forecast.json", "history.json")
            
            # Duyệt từ ngày bắt đầu chuyến đi đến ngày kết thúc HOẶC ngày hôm qua (tùy cái nào đến trước)
            iter_date = trip_start_date
            
            while iter_date.date() < today_date and iter_date <= trip_end_date:
                # Kiểm tra giới hạn 7 ngày của API: (Today - date) <= 7
                days_ago = (today_date - iter_date.date()).days
                
                if days_ago <= 7:
                    dt_str = iter_date.strftime("%Y-%m-%d")
                    params_hist = {
                        'key': self.api_key,
                        'q': search_query, # Sử dụng tên map từ ID
                        'dt': dt_str,
                        'lang': 'vi'
                    }
                    
                    try:
                        # Gọi API History cho từng ngày
                        resp_hist = await client.get(history_base_url, params=params_hist, timeout=10.0)
                        if resp_hist.status_code == 200:
                            data_hist = resp_hist.json()
                            # Parse data history vào all_hours_map
                            forecast_days = data_hist.get('forecast', {}).get('forecastday', [])
                            for fday in forecast_days:
                                for hour_data in fday.get('hour', []):
                                    all_hours_map[hour_data['time_epoch']] = hour_data
                        else:
                            print(f"⚠️ History API Error for {dt_str}: {resp_hist.text}")
                    except Exception as e:
                        print(f"⚠️ History Connection Error ({dt_str}): {e}")
                
                # Tăng biến chạy
                iter_date += timedelta(days=1)

            # --- PHASE 2: LẤY DỮ LIỆU TƯƠNG LAI (FORECAST) ---
            # Chỉ chạy nếu chuyến đi còn kéo dài đến hôm nay hoặc tương lai
            if trip_end_date.date() >= today_date:
                
                # Tính toán số ngày cần request tính từ Hôm Nay
                days_diff = (trip_end_date - now).days + 2
                days_to_request = max(1, days_diff)

                params_forecast = {
                    'key': self.api_key,
                    'q': search_query, # Sử dụng tên map từ ID
                    'days': days_to_request,
                    'aqi': 'no',
                    'alerts': 'yes',
                    'lang': 'vi'
                }

                try:
                    resp_fore = await client.get(self.base_url, params=params_forecast, timeout=10.0)
                    if resp_fore.status_code == 200:
                        data_fore = resp_fore.json()
                        
                        # 1. Parse Alerts (Chỉ lấy alert từ API forecast hiện tại)
                        if 'alerts' in data_fore and 'alert' in data_fore['alerts']:
                            for alert in data_fore['alerts']['alert']:
                                alerts_response.append(WeatherAlertDetail(
                                    headline=alert.get('headline', ''),
                                    desc=alert.get('desc', ''),
                                    severity=alert.get('severity', ''),
                                    areas=alert.get('areas', '')
                                ))
                        
                        # 2. Parse Hourly Data Forecast
                        forecast_days = data_fore.get('forecast', {}).get('forecastday', [])
                        for fday in forecast_days:
                            for hour_data in fday.get('hour', []):
                                all_hours_map[hour_data['time_epoch']] = hour_data
                    else:
                        print(f"⚠️ Forecast API Error: {resp_fore.text}")

                except Exception as e:
                    print(f"⚠️ Forecast Connection Error: {e}")

        # 3. Xây dựng Scopes theo lịch trình chuyến đi (LOGIC CŨ KHÔNG ĐỔI)
        scopes_response = []
        
        current_date = trip_start_date
        
        while current_date <= trip_end_date:
            scope_start_dt = datetime.combine(current_date.date(), op_start)
            
            if is_cross_day:
                scope_end_dt = datetime.combine(current_date.date() + timedelta(days=1), op_end)
            else:
                scope_end_dt = datetime.combine(current_date.date(), op_end)
            
            hourly_weather_list = []
            
            iter_time = scope_start_dt
            iter_time = iter_time.replace(minute=0, second=0, microsecond=0)
            
            while iter_time <= scope_end_dt:
                ts = int(iter_time.timestamp())
                
                if ts in all_hours_map:
                    h_data = all_hours_map[ts]
                    
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
            
            if hourly_weather_list:
                new_scope_index = len(scopes_response) + 1

                scopes_response.append(DayWeatherScope(
                    scope=new_scope_index,
                    date=current_date.strftime("%Y-%m-%d"),
                    hourly_weather=hourly_weather_list
                ))
            
            current_date += timedelta(days=1)

        return WeatherResponse(scopes=scopes_response, alerts=alerts_response)