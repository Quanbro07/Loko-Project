"""
Test cho BaseSolver - lop dat nen mo hinh VRPTW dung chung cho ca 8 profile.

Kiem tra 4 rang buoc coi loi cua mo hinh:
  1. Khung gio mo/dong cua (time window) khong bi vi pham.
  2. Thoi gian tham quan (service time) + di chuyen duoc cong don dung.
  3. Tong thoi luong mot ngay khong vuot max_duration.
  4. Disjunction: diem khong kip gio thi bi bo, va penalty quyet dinh
     diem nao duoc uu tien giu lai.
"""
from app.solvers.base_solver import BaseSolver

from conftest import (
    DummyProfile,
    make_context,
    make_instance,
    route_of,
    visited_nodes,
)


def solve(instance, context, time_limit=3):
    solver = BaseSolver(instance, DummyProfile(), context)
    solution = solver.solve(time_limit_seconds=time_limit)
    return solver, solution


def test_solver_tra_ve_loi_giai_cho_instance_kha_thi():
    instance = make_instance(num_places=5)
    solver, solution = solve(instance, make_context())

    assert solution is not None, "Instance kha thi ma solver khong tim ra loi giai"
    assert len(visited_nodes(solver, solution)) > 0


def test_moi_diem_duoc_ghe_deu_nam_trong_khung_gio():
    """
    Node 2 chi mo cua tu 09:00 den 10:00 (tuong doi: 60 -> 120 phut sau 08:00).
    Neu solver chon ghe node 2 thi gio den bat buoc phai nam trong khoang do.
    """
    max_duration = 840
    time_windows = [[0, max_duration] for _ in range(5)]
    time_windows[2] = [60, 120]

    instance = make_instance(num_places=5, time_windows=time_windows)
    solver, solution = solve(instance, make_context(max_duration=max_duration))

    assert solution is not None
    for node, arrival in route_of(solver, solution):
        if node == solver.depot:
            continue
        start, end = instance["time_windows"][node]
        assert start <= arrival <= end, (
            f"Node {node} den luc {arrival} phut, ngoai khung gio [{start}, {end}]"
        )


def test_service_time_va_travel_time_duoc_cong_don():
    """
    Gio den diem ke tiep phai >= gio den diem hien tai
    + thoi gian tham quan tai do + thoi gian di chuyen giua hai diem.
    """
    instance = make_instance(num_places=5, travel=30, service_time=60)
    solver, solution = solve(instance, make_context())
    assert solution is not None

    route = route_of(solver, solution)
    matrix = instance["time_matrix"]
    service = instance["service_time"]

    for (node, arrival), (next_node, next_arrival) in zip(route, route[1:]):
        min_next = arrival + service[node] + matrix[node][next_node]
        assert next_arrival >= min_next, (
            f"Di tu node {node} (den luc {arrival}) sang node {next_node}: "
            f"gio den {next_arrival} < moc toi thieu {min_next}"
        )


def test_khong_vuot_qua_thoi_luong_toi_da_cua_ngay():
    """max_duration = 300 phut (08:00 -> 13:00) thi khong diem nao duoc xep sau moc do."""
    max_duration = 300
    instance = make_instance(num_places=8, travel=30, service_time=60,
                             max_duration=max_duration)
    solver, solution = solve(instance, make_context(max_duration=max_duration))

    assert solution is not None
    for node, arrival in route_of(solver, solution):
        assert arrival <= max_duration, (
            f"Node {node} duoc xep luc {arrival} phut, vuot max_duration={max_duration}"
        )


def test_diem_khong_the_den_kip_thi_bi_bo_qua():
    """
    Node 3 dong cua luc phut thu 10, trong khi di tu khach san toi day
    da mat 120 phut => bat kha thi. Disjunction phai bo node nay
    thay vi lam ca instance vo nghiem.
    """
    instance = make_instance(num_places=5, travel=120)
    instance["time_windows"][3] = [0, 10]

    solver, solution = solve(instance, make_context())

    assert solution is not None, "Solver phai bo node bat kha thi thay vi that bai"
    assert 3 not in visited_nodes(solver, solution)


def test_penalty_cao_hon_thi_duoc_uu_tien_giu_lai():
    """
    Chi du thoi gian cho 1 diem. Node 1 co penalty 5000 (rat dang di),
    node 2 co penalty 10 (bo cung duoc) => solver phai chon node 1.

    Day dung la co che xep hang do thi cua he thong: penalty duoc tinh tu
    rating + so thich nguoi dung, roi dua thang vao AddDisjunction.
    """
    max_duration = 130  # chi du cho 1 diem: 30 di + 60 choi + 30 ve
    instance = make_instance(num_places=3, travel=30, service_time=60,
                             max_duration=max_duration)
    instance["penalties"] = [0, 5000, 10]

    solver, solution = solve(instance, make_context(max_duration=max_duration))

    assert solution is not None
    visited = visited_nodes(solver, solution)
    assert visited == [1], f"Ky vong chi ghe node 1 (penalty cao), thuc te: {visited}"
