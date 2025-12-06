from fastapi import APIRouter, HTTPException
from app.schemas.schedule_dto import ScheduleRequest, ScheduleResponse
from app.services.schedule_service import ScheduleService
from app.services.activity_service import ActivityService 

router = APIRouter()
schedule_service = ScheduleService()
activity_service = ActivityService() 

@router.post("/generate", response_model=ScheduleResponse)
async def generate_schedule(request: ScheduleRequest):
    try:
        if not request.locations:
            raise HTTPException(status_code=400, detail="Locations list cannot be empty")
            
        # 1. Tạo lịch trình thô (Logic toán học, chưa có Activity Description xịn)
        # Hàm này bây giờ trả về ScheduleResponse object
        schedule_response = schedule_service.create_schedule(request)
        
        # 2. Gọi AI để điền Activity Description (Logic thông minh)
        # Hàm này nhận ScheduleResponse -> trả về ScheduleResponse đã update
        final_response = await activity_service.fill_schedule_with_activities(schedule_response)
        
        return final_response
        
    except Exception as e:
        import traceback
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")