from pydantic import BaseModel
from typing import List, Optional

# --- INPUT MODELS (Request) ---

class LocationRoute(BaseModel):
    id: int
    gg_place_id: Optional[str] = None
    latitude: float
    longitude: float

class TripDetailRoute(BaseModel):
    sequenceOrder: int
    locationRoute: LocationRoute

class TripSectionRequest(BaseModel):
    dayNumber: int
    trip_detail_routes: List[TripDetailRoute]

class RouteRequest(BaseModel):
    trip_section_requests: List[TripSectionRequest]
    mode: str = "drive" # drive, bicycle, walk, etc.

# --- OUTPUT MODELS (Response) ---

class RouteSegment(BaseModel):
    distance_meter: float
    duration_second: float
    polyline: str  # List of [lat, lon]

class SectionRouteResponse(BaseModel):
    day_num: int
    route_path: List[Optional[RouteSegment]]

class RouteResponse(BaseModel):
    sections: List[SectionRouteResponse]