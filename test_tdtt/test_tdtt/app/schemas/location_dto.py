# app/schemas/location_dto.py
from pydantic import BaseModel
from typing import List, Optional

# Request từ Backend gửi sang
class CategorySyncRequest(BaseModel):
    provinceId: Optional[int] = None
    locationCategoryId: Optional[int] = None
    provinceName: str
    locationCategoryName: str
    # Các trường khác có thể optional nếu không dùng để query
    usageCount: Optional[int] = None
    lastSyncedAt: Optional[str] = None

# Response trả về cho Backend
class PlaceImage(BaseModel):
    img_url: str
    description: Optional[str]

class PlaceItem(BaseModel):
    gg_place_id: Optional[str]
    location_name: Optional[str]
    latitude: Optional[float]
    longitude: Optional[float]
    open_time: Optional[str]
    types: List[str] = []
    average_rating: Optional[float]
    review_count: int = 0
    province_id: int = 0
    rawImgs: List[PlaceImage] = []
    description: Optional[str] = None
    categories: List[str] = [] # AI đã gắn tag