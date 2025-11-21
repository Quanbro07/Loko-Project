from fastapi import FastAPI
from pydantic import BaseModel
from typing import List

# Import as package (add main_flow/__init__.py) so static analyzers can resolve it
from main_flow import query as query_module

app = FastAPI()

class QueryRequest(BaseModel):
    provinceName: str
    locationCategoryName: str

# Định nghĩa schema cho từng địa điểm (giống attractions_with_tags.json)
class PlaceItem(BaseModel):
    gg_place_id: str
    location_name: str
    latitude: float
    longitude: float
    open_time: str
    types: List[str]
    average_rating: float
    review_count: int
    province_id: int
    rawImgs: list
    description: str = None

@app.post("/query", response_model=List[PlaceItem])
def query_api(request: QueryRequest):
    # Lấy tọa độ thành phố
    ll_string = query_module.get_city_coordinates(request.provinceName, query_module.API_KEY)
    if not ll_string:
        return []
    # Lấy danh sách địa điểm
    results = query_module.fetch_top_places(request.provinceName, ll_string, request.locationCategoryName)
    return results

@app.get("/ping")
def ping():
    return {"status": "ok"}
