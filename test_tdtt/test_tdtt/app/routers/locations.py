# app/routers/locations.py
from fastapi import APIRouter
from typing import List
from app.schemas.location_dto import CategorySyncRequest, PlaceItem
from app.services.crawler_service import process_location_sync

router = APIRouter()

@router.post("/sync-locations", response_model=List[PlaceItem]) 
async def sync_locations(payload: CategorySyncRequest):
    # TRUYỀN THÊM payload.provinceId VÀO ĐÂY
    # Nếu payload.provinceId là None (không có) thì mặc định là 0
    p_id = payload.provinceId if payload.provinceId is not None else 0
    
    results = process_location_sync(payload.provinceName, payload.locationCategoryName, p_id)
    return results