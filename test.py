import sys
import os

print("--- Thư mục hiện tại (CWD) ---")
print(os.getcwd())

print("\n--- Python đang tìm kiếm module ở các đường dẫn này (sys.path) ---")
for path in sys.path:
    print(path)

print("\n--- Thử tìm module 'app' ---")
try:
    import app
    print("✅ Đã tìm thấy module 'app' tại:", app)
except ImportError as e:
    print("❌ Không tìm thấy module 'app'. Lỗi:", e)