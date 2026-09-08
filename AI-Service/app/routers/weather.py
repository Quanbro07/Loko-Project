from fastapi import APIRouter, HTTPException, Depends
from app.schemas.weather_dto import WeatherRequest, WeatherResponse
from app.services.weather_service import WeatherService

router = APIRouter()

def get_weather_service():
    return WeatherService()

@router.post("/forecast", response_model=WeatherResponse)
async def get_trip_weather(
    request: WeatherRequest,
    service: WeatherService = Depends(get_weather_service)
):
    """
    Lấy thông tin dự báo thời tiết theo lịch trình và khung giờ hoạt động.
    - Tự động handle việc lấy đúng ngày trong chuyến đi.
    - Cắt khung giờ (kể cả qua đêm).
    - Trả về cảnh báo thiên tai nếu có.
    """
    try:
        return await service.get_forecast(request)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))