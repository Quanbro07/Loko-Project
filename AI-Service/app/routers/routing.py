from fastapi import APIRouter, HTTPException, Depends
from app.schemas.routing_dto import RouteRequest, RouteResponse
from app.services.routing_service import RoutingService

router = APIRouter()

# Dependency Injection helper
def get_routing_service():
    return RoutingService()

@router.post("/generate", response_model=RouteResponse)
async def generate_route_info(
    request: RouteRequest,
    service: RoutingService = Depends(get_routing_service)
):
    """
    API tính toán lộ trình chi tiết giữa các điểm du lịch.
    - Input: Danh sách điểm theo ngày (latitude, longitude).
    - Output: Đường đi chi tiết (path coordinates), khoảng cách (distance), thời gian (duration).
    - Nếu không tìm thấy đường (ví dụ qua biển), sẽ trả về đường thẳng nối 2 điểm.
    """
    try:
        result = await service.generate_route(request)
        return result
    except Exception as e:
        # Log lỗi ra console server để debug
        print(f"❌ Error in generate_route_info: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal Server Error: {str(e)}")