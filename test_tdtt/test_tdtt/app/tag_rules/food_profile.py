from app.tag_rules.base_profile import BaseProfile

class FoodProfile(BaseProfile):
    def __init__(self):
        super().__init__()
        self.service_time_map = {
            "restaurant": 120,
            "snack": 45,
            "cafe": 90,
            "night market": 150,
            "market": 75,
            "speciality": 45, # Mua đặc sản nhanh
            "hotel": 0,
        }
        self.penalty_map = {
            "hotel": 99999,
            
            # Key Visuals của Food Tour
            "restaurant": 400,
            "night market": 450,
            "speciality": 350,
            "snack": 300,
            "cafe": 250,
            
            # Các thứ khác
            "market": 200,
            "amusement/water park": 100, # Đi food tour thì hạn chế đi công viên
            "zoo": 100
        }
        self.priority_boost = {
            "speciality": 1.2,
            "night market": 1.3
        }