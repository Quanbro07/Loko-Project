from fastapi import APIRouter, HTTPException
from app.schemas.schedule_dto import ScheduleRequest, ScheduleResponse
from app.services.schedule_service import ScheduleService

router = APIRouter()
schedule_service = ScheduleService()

@router.post("/generate", response_model=ScheduleResponse)
async def generate_schedule(request: ScheduleRequest):
    try:
        # Validate input cơ bản nếu cần
        if not request.locations:
            raise HTTPException(status_code=400, detail="Locations list cannot be empty")
            
        result = schedule_service.create_schedule(request)
        return result
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")