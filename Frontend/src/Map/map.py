import json
import os
import sys

# 1. Cấu hình để in được tiếng Việt (nếu terminal hỗ trợ)
try:
    sys.stdout.reconfigure(encoding='utf-8')
except AttributeError:
    pass 

# 2. TỰ ĐỘNG LẤY ĐƯỜNG DẪN CHÍNH XÁC
# Lấy đường dẫn của file code (map.py) đang chạy
current_dir = os.path.dirname(os.path.abspath(__file__))
# Ghép với tên file json để ra đường dẫn tuyệt đối
file_path = os.path.join(current_dir, 'route_geometry.json')

print(f"Dang doc file tai: {file_path}") # In không dấu để tránh lỗi

try:
    # Kiểm tra file có tồn tại không trước khi đọc
    if not os.path.exists(file_path):
        print("LOI: Khong tim thay file route_geometry.json!")
        print(f"Ban can copy file json vao thu muc: {current_dir}")
    else:
        # Đọc file
        with open(file_path, 'r', encoding='utf-8') as f:
            data = json.load(f)
        
        print("--> Doc file THANH CONG!")
        
        # 3. KIỂM TRA XEM CÓ DAY 2 KHÔNG
        keys = list(data.keys())
        print(f"Cac keys tim thay trong file: {keys}")
        
        if "Day 2" in keys:
            print("KET QUA: Co thay 'Day 2' trong file.")
        else:
            print("KET QUA: Chi thay 'Day 1', KHONG CO 'Day 2'.")
            
            # Kiểm tra lồng nhau (trường hợp đặc biệt)
            if "Day 1" in keys and isinstance(data["Day 1"], dict):
                sub_keys = data["Day 1"].keys()
                if "Day 2" in sub_keys:
                    print("PHAT HIEN: 'Day 2' nam long ben trong 'Day 1'.")

except Exception as e:
    # Dùng repr() để in lỗi an toàn, tránh lỗi font
    print(f"Gap loi trong qua trinh xu ly: {repr(e)}")