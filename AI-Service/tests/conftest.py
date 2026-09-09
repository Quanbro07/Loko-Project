"""
Fixture dung chung cho test cua tang solver.

Cac test o day chi kiem tra *mo hinh toi uu* (rang buoc OR-Tools), khong goi
API ngoai (Gemini / Geoapify / WeatherAPI). Nho vay test chay offline va
khong can API key.
"""
import os
import sys

import pytest

# Cho phep `import app...` khi chay pytest tu thu muc AI-Service/
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


def make_time_matrix(n, travel=30):
    """Ma tran thoi gian doi xung: di giua 2 diem bat ky mat `travel` phut."""
    return [[0 if i == j else travel for j in range(n)] for i in range(n)]


def make_instance(
    num_places=5,
    travel=30,
    service_time=60,
    max_duration=840,
    time_windows=None,
    penalties=None,
    tags=None,
    lunch_nodes=None,
    night_nodes=None,
):
    """
    Dung mot instance dung hinh dang ma ScheduleService._create_instance tra ve.

    Quy uoc: node 0 luon la depot (khach san), moc thoi gian tinh bang *phut
    ke tu luc bat dau ngay* chu khong phai gio tuyet doi.
    """
    if time_windows is None:
        time_windows = [[0, max_duration] for _ in range(num_places)]
    if penalties is None:
        # penalty = "cai gia phai tra khi bo qua diem nay" => cang cao cang uu tien
        penalties = [0] + [500] * (num_places - 1)
    if tags is None:
        tags = [["hotel"]] + [["attraction"] for _ in range(num_places - 1)]

    locations_data = [
        {
            "id": i,
            "location_name": f"Place {i}",
            "tags": tags[i],
            "average_rating": 4.0,
            "open_time": "00:00",
            "close_time": "23:59",
        }
        for i in range(num_places)
    ]

    return {
        "locations_data": locations_data,
        "time_matrix": make_time_matrix(num_places, travel),
        "service_time": [0] + [service_time] * (num_places - 1),
        "time_windows": time_windows,
        "penalties": penalties,
        "lunch_nodes": lunch_nodes if lunch_nodes is not None else [],
        "night_nodes": night_nodes if night_nodes is not None else [],
        "num_places": num_places,
        "depot": 0,
    }


def make_context(max_duration=840, day_start_mins=8 * 60, **overrides):
    """
    Context mo phong mot ngay 08:00 -> 22:00.
    Moc bua an la thoi gian *tuong doi* so voi day_start_mins, giong
    ScheduleService tinh truoc khi day xuong solver.
    """
    ctx = {
        "max_duration": max_duration,
        "day_start_mins": day_start_mins,
        "day_end_mins": day_start_mins + max_duration,
        "lunch_start": 11 * 60 - day_start_mins,   # 11:00
        "lunch_end": 13 * 60 - day_start_mins,     # 13:00
        "dinner_start": 18 * 60 - day_start_mins,  # 18:00
        "dinner_end": 20 * 60 - day_start_mins,    # 20:00
    }
    ctx.update(overrides)
    return ctx


class DummyProfile:
    """Profile toi thieu: solver goc khong dung toi trong cac test nay."""

    def get_service_time(self, tags):
        return 60

    def get_penalty(self, tags, rating):
        return 500


def route_of(solver, solution):
    """
    Tra ve [(node, thoi_diem_den)] theo dung thu tu solver xep, bo depot dau/cuoi.

    Dung IndexToNode (khong phai NodeToIndex) khi doc nguoc tu index -> node.
    """
    result = []
    index = solver.routing.Start(0)
    while not solver.routing.IsEnd(index):
        node = solver.manager.IndexToNode(index)
        arrival = solution.Value(solver.time_dim.CumulVar(index))
        result.append((node, arrival))
        index = solution.Value(solver.routing.NextVar(index))
    return result


def visited_nodes(solver, solution):
    """Cac node thuc su duoc ghe tham (khong tinh depot)."""
    return [node for node, _ in route_of(solver, solution) if node != solver.depot]


@pytest.fixture
def profile():
    return DummyProfile()
