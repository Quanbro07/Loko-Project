from pydantic import BaseModel
from typing import List, Optional

# --- INPUT (Request) ---

class WeatherRequest(BaseModel):
    provinceId: int
    provinceName: str
    startDate: str          # Format: YYYY-MM-DD
    endDate: str            # Format: YYYY-MM-DD
    fromOperateTime: str    # Format: HH:MM
    toOperateTime: str      # Format: HH:MM

# --- OUTPUT (Response) ---

class Condition(BaseModel):
    text: str
    icon: str

class HourlyWeather(BaseModel):
    time: str               # "2025-11-30 08:00"
    temp_c: float
    condition: Condition
    will_it_rain: int       # 0 or 1

class DayWeatherScope(BaseModel):
    scope: str              # "Day1", "Day2"
    date: str               # "2025-11-30"
    hourly_weather: List[HourlyWeather]

class WeatherAlertDetail(BaseModel):
    headline: str
    desc: str
    severity: str
    areas: str

class WeatherResponse(BaseModel):
    scopes: List[DayWeatherScope]
    alerts: List[WeatherAlertDetail]