import httpx
from typing import List, Tuple, Any
from app.core.config import settings
from app.schemas.routing_dto import RouteRequest, RouteResponse, SectionRouteResponse, RouteSegment

class RoutingService:
    def __init__(self):
        self.api_key = settings.GEOAPIFY_API_KEY
        self.base_url = settings.GEOAPIFY_BASE_URL

    async def _get_route_for_day(self, client: httpx.AsyncClient, waypoints: List[Tuple[float, float]], mode: str) -> List[RouteSegment]:
        """
        Gọi API Geoapify 1 lần cho toàn bộ danh sách điểm của ngày.
        Input: List[(lat, lon)]
        Output: List[RouteSegment] tương ứng với các chặng (legs).
        """
        if len(waypoints) < 2:
            return []

        # 1. Tạo chuỗi waypoints: "lon,lat|lon,lat|..."
        # Lưu ý: Geoapify dùng [lon, lat], input của mình là [lat, lon]
        waypoints_str = "|".join([f"{lat},{lon}" for lat, lon in waypoints])
        
        params = {
            'waypoints': waypoints_str,
            'mode': mode,
            'apiKey': self.api_key,
            'units': 'metric' # Đảm bảo trả về mét
        }

        try:
            response = await client.get(self.base_url, params=params, timeout=15.0)
            
            if response.status_code == 200:
                data = response.json()
                if 'features' in data and len(data['features']) > 0:
                    feature = data['features'][0]
                    properties = feature.get('properties', {})
                    geometry = feature.get('geometry', {})
                    
                    legs = properties.get('legs', [])
                    geom_type = geometry.get('type')
                    all_coords = geometry.get('coordinates', [])

                    # Chuẩn hóa coordinates về dạng List[List[Point]] để khớp với legs
                    # Nếu là LineString (chỉ 1 chặng), nó là List[Point], cần bọc lại thành [List[Point]]
                    segments_coords = []
                    if geom_type == 'LineString':
                        segments_coords = [all_coords]
                    elif geom_type == 'MultiLineString':
                        segments_coords = all_coords
                    
                    # Kiểm tra độ lệch giữa legs và coords (đề phòng)
                    if len(legs) != len(segments_coords):
                        print(f"⚠️ Warning: Số lượng legs ({len(legs)}) khác số lượng đoạn đường ({len(segments_coords)})")
                        # Fallback: Nếu không khớp, trả về list rỗng để code chạy fallback đường thẳng bên dưới
                        return self._create_straight_line_segments(waypoints)

                    route_segments = []
                    for i, leg in enumerate(legs):
                        # Lấy distance/time từ leg
                        dist = float(leg.get('distance', 0))
                        dur = float(leg.get('time', 0))
                        
                        # Lấy path và đảo ngược [lon, lat] -> [lat, lon]
                        path_segment = segments_coords[i]
                        path_lat_lon = [[coord[1], coord[0]] for coord in path_segment]
                        
                        route_segments.append(RouteSegment(
                            distance_meter=dist,
                            duration_second=dur,
                            path=path_lat_lon
                        ))
                    
                    return route_segments

            else:
                print(f"❌ API Error {response.status_code}: {response.text}")

        except Exception as e:
            print(f"⚠️ Lỗi kết nối Geoapify: {e}")

        # --- FALLBACK ---
        # Nếu lỗi, trả về đường thẳng cho từng đoạn
        return self._create_straight_line_segments(waypoints)

    def _create_straight_line_segments(self, waypoints: List[Tuple[float, float]]) -> List[RouteSegment]:
        """Tạo các đoạn đường thẳng nối điểm (Fallback khi API lỗi)"""
        segments = []
        for i in range(len(waypoints) - 1):
            start = waypoints[i]
            end = waypoints[i+1]
            segments.append(RouteSegment(
                distance_meter=0, # Hoặc tính Haversine
                duration_second=0,
                path=[[start[0], start[1]], [end[0], end[1]]]
            ))
        return segments

    async def generate_route(self, request_data: RouteRequest) -> RouteResponse:
        sections_response = []
        
        async with httpx.AsyncClient() as client:
            for section in request_data.trip_section_requests:
                waypoints_data = section.trip_detail_routes
                
                # Sort theo sequenceOrder
                sorted_waypoints = sorted(waypoints_data, key=lambda x: x.sequenceOrder)
                
                # Lấy list (lat, lon)
                points = [
                    (wp.locationRoute.latitude, wp.locationRoute.longitude) 
                    for wp in sorted_waypoints
                ]
                
                if len(points) < 2:
                    # Nếu chỉ có 1 điểm hoặc 0 điểm, không có đường đi
                    sections_response.append(SectionRouteResponse(
                        day_num=section.dayNumber,
                        route_path=[]
                    ))
                    continue

                # Gọi API xử lý cả ngày
                day_segments = await self._get_route_for_day(client, points, request_data.mode)
                
                sections_response.append(SectionRouteResponse(
                    day_num=section.dayNumber,
                    route_path=day_segments
                ))

        return RouteResponse(sections=sections_response)