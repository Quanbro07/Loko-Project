import httpx
from typing import List, Tuple, Any, Optional
from app.core.config import settings
from app.schemas.routing_dto import RouteRequest, RouteResponse, SectionRouteResponse, RouteSegment

class RoutingService:
    def __init__(self):
        self.api_key = settings.GEOAPIFY_API_KEY
        self.base_url = settings.GEOAPIFY_BASE_URL

    # --- HELPER: Polyline Encoding ---
    def _encode_polyline(self, points: List[List[float]]) -> str:
        result = []
        last_lat = 0
        last_lng = 0

        for point in points:
            lat = int(round(point[0] * 1e5))
            lng = int(round(point[1] * 1e5))

            d_lat = lat - last_lat
            d_lng = lng - last_lng

            self._encode_value(d_lat, result)
            self._encode_value(d_lng, result)

            last_lat = lat
            last_lng = lng

        return "".join(result)

    def _encode_value(self, value: int, result: list):
        value = ~(value << 1) if value < 0 else (value << 1)
        while value >= 0x20:
            result.append(chr((0x20 | (value & 0x1f)) + 63))
            value >>= 5
        result.append(chr(value + 63))

    # ---------------------------------

    async def _get_route_for_day(self, client: httpx.AsyncClient, waypoints: List[Tuple[float, float]], mode: str) -> List[RouteSegment]:
        if len(waypoints) < 2:
            return []

        waypoints_str = "|".join([f"{lat},{lon}" for lat, lon in waypoints])
        
        params = {
            'waypoints': waypoints_str,
            'mode': mode,
            'apiKey': self.api_key,
            'units': 'metric'
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

                    segments_coords = []
                    if geom_type == 'LineString':
                        segments_coords = [all_coords]
                    elif geom_type == 'MultiLineString':
                        segments_coords = all_coords
                    
                    if len(legs) != len(segments_coords):
                        return self._create_straight_line_segments(waypoints)

                    route_segments = []
                    for i, leg in enumerate(legs):
                        dist = float(leg.get('distance', 0))
                        dur = float(leg.get('time', 0))
                        
                        path_segment = segments_coords[i]
                        path_lat_lon = [[coord[1], coord[0]] for coord in path_segment]
                        
                        encoded_path = self._encode_polyline(path_lat_lon)

                        route_segments.append(RouteSegment(
                            distance_meter=dist,
                            duration_second=dur,
                            polyline=encoded_path
                        ))
                    
                    return route_segments

        except Exception as e:
            print(f"⚠️ Lỗi kết nối Geoapify: {e}")

        return self._create_straight_line_segments(waypoints)

    def _create_straight_line_segments(self, waypoints: List[Tuple[float, float]]) -> List[RouteSegment]:
        segments = []
        for i in range(len(waypoints) - 1):
            start = waypoints[i]
            end = waypoints[i+1]
            raw_path = [[start[0], start[1]], [end[0], end[1]]]
            encoded_path = self._encode_polyline(raw_path)

            segments.append(RouteSegment(
                distance_meter=0, 
                duration_second=0,
                polyline=encoded_path
            ))
        return segments

    async def generate_route(self, request_data: RouteRequest) -> RouteResponse:
        sections_response = []
        
        async with httpx.AsyncClient() as client:
            for section in request_data.trip_section_requests:
                waypoints_data = section.trip_detail_routes
                
                sorted_waypoints = sorted(waypoints_data, key=lambda x: x.sequenceOrder)
                
                points = [
                    (wp.locationRoute.latitude, wp.locationRoute.longitude) 
                    for wp in sorted_waypoints
                ]
                
                # Nếu không đủ điểm tạo đường, vẫn trả về list chứa [None]
                if len(points) < 2:
                    sections_response.append(SectionRouteResponse(
                        day_num=section.dayNumber,
                        route_path=[None] # [CHANGED] Luôn có None ở đầu
                    ))
                    continue

                day_segments = await self._get_route_for_day(client, points, request_data.mode)
                
                # [CHANGED] Chèn None vào vị trí đầu tiên (index 0)
                # Để đoạn đường từ P1->P2 sẽ nằm ở index 1 (element thứ 2)
                day_segments_with_null: List[Optional[RouteSegment]] = [None] + day_segments
                
                sections_response.append(SectionRouteResponse(
                    day_num=section.dayNumber,
                    route_path=day_segments_with_null
                ))

        return RouteResponse(sections=sections_response)