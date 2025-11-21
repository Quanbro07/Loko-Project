# app/routers/locations.py
from fastapi import APIRouter
from typing import List
from app.schemas.location_dto import CategorySyncRequest, PlaceItem
from app.services.crawler_service import process_location_sync

router = APIRouter()

@router.post("/sync-locations", response_model=List[PlaceItem])
async def sync_locations(payload: CategorySyncRequest):
    """
    API này Backend gọi để lấy danh sách địa điểm (Crawler + AI Tagging)
    """
    results = process_location_sync(payload.provinceName, payload.locationCategoryName)
    return results