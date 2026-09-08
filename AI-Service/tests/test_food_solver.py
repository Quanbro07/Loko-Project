"""
Test cho FoodSolver - profile phuc tap nhat vi no ghi de toan bo rang buoc
an uong cua BaseSolver.

Luu y ve mo hinh: dimension "Time" duoc khai bao voi slack toi da 60 phut
(BaseSolver._add_time_dimension), nghia la lich trinh khong the "cho khong"
qua 1 tieng o moi diem. Vi vay cac test duoi day dung instance nhieu diem
de dong ho thuc su chay toi buoi toi, giong mot ngay di choi that.
"""
from app.solvers.food_solver import FoodSolver

from conftest import DummyProfile, make_context, make_instance, route_of

DAY_START = 8 * 60  # 08:00


def arrival_of(solver, solution, node):
    """Gio den node (phut ke tu dau ngay), hoac None neu node bi bo qua."""
    for visited, arrival in route_of(solver, solution):
        if visited == node:
            return arrival
    return None


def solve(instance, context, time_limit=3):
    solver = FoodSolver(instance, DummyProfile(), context)
    return solver, solver.solve(time_limit_seconds=time_limit)


def full_day_instance(num_places, special_node, special_tags, **kwargs):
    """Mot ngay day dac: du diem tham quan de dong ho chay den toi."""
    tags = [["hotel"]] + [["attraction"] for _ in range(num_places - 1)]
    tags[special_node] = special_tags

    instance = make_instance(
        num_places=num_places,
        travel=30,
        service_time=60,
        tags=tags,
        **kwargs,
    )
    # Diem dac biet duoc uu tien giu lai gap nhieu lan cac diem thuong
    penalties = [0] + [500] * (num_places - 1)
    penalties[special_node] = 50000
    instance["penalties"] = penalties
    return instance


def test_cho_dem_bi_day_xuong_sau_19h():
    """
    Cho dem chi hop ly khi di vao buoi toi. FoodSolver dat soft lower bound
    tai moc 19:00 voi penalty 300/phut, nen loi giai phai xep no tu 19:00 tro di
    thay vi nhet vao buoi sang cho gan duong.
    """
    night_node = 9
    instance = full_day_instance(
        num_places=10,
        special_node=night_node,
        special_tags=["night market"],
        night_nodes=[night_node],
    )

    solver, solution = solve(instance, make_context(day_start_mins=DAY_START))
    assert solution is not None

    arrival = arrival_of(solver, solution, night_node)
    assert arrival is not None, "Cho dem bi bo qua du penalty rat cao"

    night_start_relative = 19 * 60 - DAY_START
    clock = (arrival + DAY_START) / 60
    assert arrival >= night_start_relative, (
        f"Cho dem duoc xep luc ~{clock:.1f}h, le ra phai tu 19:00 tro di"
    )


def test_quan_chi_mo_buoi_toi_roi_vao_khung_an_toi():
    """
    Quan mo tu 17:00 (open_mins = 1020 > 960) duoc FoodSolver phan loai
    'strict dinner' va rang buoc vao khung an toi 18:00-20:00,
    thay vi bi xep vao gio an trua.
    """
    dinner_node = 9
    instance = full_day_instance(
        num_places=10,
        special_node=dinner_node,
        special_tags=["restaurant"],
        lunch_nodes=[dinner_node],
    )
    instance["locations_data"][dinner_node]["open_time"] = "17:00"
    instance["locations_data"][dinner_node]["close_time"] = "23:00"

    context = make_context(day_start_mins=DAY_START)
    solver, solution = solve(instance, context)
    assert solution is not None

    arrival = arrival_of(solver, solution, dinner_node)
    assert arrival is not None, "Quan an bi bo qua du penalty rat cao"

    clock = (arrival + DAY_START) / 60
    assert arrival >= context["dinner_start"], (
        f"Quan chi mo buoi toi lai duoc xep luc ~{clock:.1f}h, "
        f"truoc moc an toi 18:00"
    )


def test_quan_binh_thuong_nam_trong_khoang_trua_den_toi():
    """
    Quan mo ca ngay roi vao nhanh 'else': rang buoc mem tu lunch_start
    den dinner_end, tuc khong duoc xep truoc 11:00.
    """
    food_node = 9
    instance = full_day_instance(
        num_places=10,
        special_node=food_node,
        special_tags=["restaurant"],
        lunch_nodes=[food_node],
    )

    context = make_context(day_start_mins=DAY_START)
    solver, solution = solve(instance, context)
    assert solution is not None

    arrival = arrival_of(solver, solution, food_node)
    assert arrival is not None, "Quan an bi bo qua du penalty rat cao"

    clock = (arrival + DAY_START) / 60
    assert arrival >= context["lunch_start"], (
        f"Quan an duoc xep luc ~{clock:.1f}h, truoc gio an trua 11:00"
    )
