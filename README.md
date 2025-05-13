# Ứng dụng Clustering với React và Python

Đây là ứng dụng web cho phép người dùng tải lên dữ liệu và thực hiện phân cụm (clustering) sử dụng giao diện React và xử lý Python ở backend.

## Yêu cầu hệ thống

- Node.js (phiên bản 16.0 trở lên)
- Python (phiên bản 3.8 trở lên)
- npm hoặc yarn

## Cài đặt

### 1. Cài đặt và kích hoạt môi trường ảo Python

```bash
# Tạo môi trường ảo
python -m venv venv

# Kích hoạt môi trường ảo trên Windows
.\venv\Scripts\Activate.ps1

# Nếu sử dụng Command Prompt thay vì PowerShell
# .\venv\Scripts\activate.bat
```

### 2. Cài đặt các dependencies cho Frontend (React)

```bash
# Di chuyển vào thư mục frontend
cd cure

# Cài đặt các thư viện cần thiết
npm install
```

### 3. Cài đặt các thư viện Python

```bash
# Đảm bảo môi trường ảo đã được kích hoạt (có prefix (venv) trước dòng lệnh)
# Cài đặt các thư viện Python cần thiết
pip install fastapi uvicorn pandas numpy scikit-learn

# Kiểm tra cài đặt thành công
pip list
```

## Khởi động ứng dụng

### 1. Chạy file main.py

### 2. Khởi động Frontend

```bash
# Di chuyển vào thư mục frontend
cd cure

```bash
# Trong thư mục cure
npm run dev
```
Ứng dụng React sẽ chạy tại địa chỉ: http://localhost:5173

### 3. Hướng dẫn sử dụng

1. Mở trình duyệt web và truy cập http://localhost:5173
2. Tải lên file dữ liệu mẫu (định dạng CSV)
3. Cấu hình các thông số clustering
4. Nhấn nút "Run Clustering" để thực hiện phân cụm
5. Kết quả sẽ được hiển thị trực quan trên giao diện

## Lưu ý

- Đảm bảo môi trường ảo Python (venv) được kích hoạt mỗi khi làm việc với dự án
- Đảm bảo file CSV đúng định dạng và chứa dữ liệu phù hợp
- Kiểm tra các thông số clustering phù hợp với dữ liệu của bạn
- Có thể điều chỉnh các tham số trong file cấu hình để tối ưu kết quả

## Xử lý lỗi thường gặp

### Môi trường ảo

1. Nếu gặp lỗi "không thể chạy script" khi kích hoạt môi trường ảo trên PowerShell:
```powershell
Set-ExecutionPolicy -ExecutionPolicy RemoteSigned -Scope CurrentUser
```

2. Để tắt môi trường ảo:
```bash
deactivate
```
