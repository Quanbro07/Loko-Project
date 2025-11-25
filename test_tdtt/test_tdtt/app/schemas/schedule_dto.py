from pydantic import BaseModel, Field
from typing import List, Optional, Any

class CategoryDTO(BaseModel):
    id: int
    categoryName: str

class ImageDTO(BaseModel):
    id: Optional[int] = None
    img_url: Optional[str] = None
    description: Optional[str] = None

class LocationDTO(BaseModel):
    id: int
    latitude: float
    longitude: float
    gg_place_id: Optional[str] = None
    location_name: str
    open_time: Optional[str] = None
    close_time: Optional[str] = None
    avg_visit_time: Optional[int] = None
    ticket_price: Optional[float] = None
    average_rating: Optional[float] = 0.0
    review_count: Optional[int] = 0
    province_id: Optional[int] = None
    description: Optional[str] = None
    categories: List[CategoryDTO] = []
    imgs: List[Any] = []

class ScheduleRequest(BaseModel):
    startDate: str
    endDate: str
    province: str
    hobby: str  # Enum: AMUSEMENT, FOOD, ADVENTURE...
    isAlone: bool
    isChildren: bool
    numChildren: int
    numAdults: int
    isElder: bool
    numElders: int
    fromOperateTime: str = "08:00"
    toOperateTime: str = "22:00"
    locations: List[LocationDTO]

# --- Output Schemas ---

class TripDetailLocationDTO(LocationDTO):
    # Kế thừa để tái sử dụng, hoặc định nghĩa lại nếu muốn trả về ít trường hơn
    pass

class TripDetailDTO(BaseModel):
    sequenceOrder: int
    startTime: str
    endTime: str
    description: str
    activity: Optional[str] = None # Trường activity được sinh thêm
    location: Optional[dict] = None

class TripSectionDTO(BaseModel):
    dayNumber: int
    title: str
    tripDetails: List[TripDetailDTO]

class ScheduleResponse(BaseModel):
    userId: int = 1
    tripName: str
    startDate: str
    endDate: str
    numAdult: int
    numChild: int
    numElder: int
    tripSections: List[TripSectionDTO]