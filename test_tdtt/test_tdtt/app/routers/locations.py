# app/routers/locations.py
from fastapi import APIRouter
from typing import List
from app.schemas.location_dto import CategorySyncRequest, PlaceItem
from app.services.crawler_service import process_location_sync

router = APIRouter()

@router.post("/sync-locations", response_model=List[PlaceItem]) 
async def sync_locations(payload: CategorySyncRequest):
    # Lấy Province ID và Category ID
    p_id = payload.provinceId if payload.provinceId is not None else 0
    cat_id = payload.locationCategoryId if payload.locationCategoryId is not None else 0
    
    # --- THAY ĐỔI: Chỉ truyền ID vào service ---
    # Không truyền payload.provinceName nữa
    results = process_location_sync(p_id, cat_id)
    # -------------------------------------------
    
    return results