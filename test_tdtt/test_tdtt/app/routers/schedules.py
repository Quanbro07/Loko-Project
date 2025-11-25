# app/routers/schedules.py
from fastapi import APIRouter

router = APIRouter()

@router.post("/generate")
async def create_schedule():
    # Sau này bạn sẽ gọi code trong thư mục solvers/ ở đây
    return {"message": "Tính năng đang phát triển, sẽ gọi Solver ở đây"}