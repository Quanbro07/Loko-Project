import requests
import json
import math
import time
from typing import List, Dict, Any
from app.core.config import settings

class MatrixService:
    def __init__(self):
        self.api_key = settings.GEOAPIFY_API_KEY
        self.url = f"https://api.geoapify.com/v1/routematrix?apiKey={self.api_key}"

    def get_time_matrix(self, locations: List[Dict[str, float]]) -> List[List[int]]:
        """
        Tạo ma trận thời gian từ danh sách dict {'latitude': ..., 'longitude': ...}
        Áp dụng logic batching < 1000 phần tử như logic cũ.
        """
        api_locations = []
        for loc in locations:
            if loc.get('latitude') and loc.get('longitude'):
                api_locations.append({"location": [loc['longitude'], loc['latitude']]})
            else:
                api_locations.append(None) # Placeholder

        num_locations = len(api_locations)
        if num_locations == 0:
            return []

        valid_locations = [loc for loc in api_locations if loc is not None]
        valid_indices = [i for i, loc in enumerate(api_locations) if loc is not None]
        
        if not valid_locations:
            return [[0] * num_locations for _ in range(num_locations)]

        num_valid = len(valid_locations)
        
        # Logic chia lô (batching) giữ nguyên
        max_elements_per_request = 1000
        max_rows_per_request = max(1, max_elements_per_request // num_valid)
        
        q, r = divmod(num_valid, max_rows_per_request)
        
        valid_matrix = []
        
        print(f"Call Geoapify: {num_valid} valid locs. Batching...")

        for i in range(q + (1 if r > 0 else 0)):
            start = i * max_rows_per_request
            end = (i + 1) * max_rows_per_request if i < q else num_valid
            origin_locations = valid_locations[start:end]
            
            headers = {"Content-Type": "application/json"}
            body = {
                "mode": "drive",
                "sources": origin_locations,
                "targets": valid_locations
            }

            try:
                response = requests.post(self.url, headers=headers, json=body)
                response.raise_for_status()
                data = response.json()
                
                rows = self._build_rows(data)
                valid_matrix.extend(rows)
            except Exception as e:
                print(f"Error Geoapify: {e}")
                # Fallback: fill with dummy values or max values
                for _ in origin_locations:
                    valid_matrix.append([-1] * num_valid)

        # Re-inflate ma trận (khôi phục vị trí các điểm None/Lỗi)
        full_matrix = [[0] * num_locations for _ in range(num_locations)]
        
        for i, valid_i in enumerate(valid_indices):
            for j, valid_j in enumerate(valid_indices):
                if i < len(valid_matrix) and j < len(valid_matrix[i]):
                     # Geoapify trả về giây -> đổi ra phút (ceil)
                     val = valid_matrix[i][j]
                     if val == -1: val = 30 * 60 # Mặc định 30p nếu lỗi
                     full_matrix[valid_i][valid_j] = math.ceil(val / 60)
        
        return full_matrix

    def _build_rows(self, response_json):
        matrix_rows = []
        results = response_json.get('sources_to_targets')
        if not results: return []

        for row in results:
            row_durations = []
            for element in row:
                time_value = element.get('time') if element else None
                row_durations.append(time_value if time_value is not None else -1)
            matrix_rows.append(row_durations)
        return matrix_rows