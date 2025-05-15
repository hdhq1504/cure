from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
import pandas as pd
import numpy as np
from sklearn.preprocessing import StandardScaler
from typing import List, Dict, Any
import json
from pydantic import BaseModel
import io
from sklearn.decomposition import PCA
from pyclustering.cluster.cure import cure

app = FastAPI()

# Thiết lập CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class CUREConfig(BaseModel):
    n_clusters: int
    n_representatives: int
    shrinking_factor: float
    numeric_columns: List[str]

class ClusterResult(BaseModel):
    labels: List[int]
    representatives: List[List[List[float]]]
    pca_data: List[Dict[str, float]]
    columns_used: List[str]
    features: Dict[str, List[float]]

def preprocess_data(df: pd.DataFrame, numeric_columns: List[str]) -> tuple:
    """
    Tiền xử lý dữ liệu trước khi thực hiện phân cụm
    """
    # Chuyển đổi kiểu dữ liệu cho các cột số
    for col in numeric_columns:
        df[col] = pd.to_numeric(df[col], errors='coerce')
        
    # Xử lý missing values nếu có
    df[numeric_columns] = df[numeric_columns].fillna(df[numeric_columns].mean())
    
    # Chuẩn hóa dữ liệu
    scaler = StandardScaler()
    scaled_data = scaler.fit_transform(df[numeric_columns])
    
    # Giảm chiều dữ liệu xuống 2D để visualization
    pca = PCA(n_components=2)
    pca_data = pca.fit_transform(scaled_data)
    
    return scaled_data, pca_data, pca

@app.post("/cluster/")
async def create_cluster(
    file: UploadFile = File(...),
    config: str = Form(...),
):
    try:
        # Đọc cấu hình
        config_data = json.loads(config)
        cure_config = CUREConfig(**config_data)
        
        # Đọc file CSV
        content = await file.read()
        df = pd.read_csv(io.StringIO(content.decode('utf-8')))
        
        # Tiền xử lý dữ liệu
        scaled_data, pca_data, _ = preprocess_data(df, cure_config.numeric_columns)
        
        # Tạo instance CURE từ thư viện pyclustering
        cure_instance = cure(
            data=scaled_data.tolist(),
            number_cluster=cure_config.n_clusters,
            number_represent_points=cure_config.n_representatives,
            compression=cure_config.shrinking_factor
        )
        
        # Thực hiện phân cụm
        cure_instance.process()
        
        # Lấy clusters
        clusters = cure_instance.get_clusters()
        
        # Lấy nhãn cho từng điểm dữ liệu
        labels = np.zeros(len(scaled_data), dtype=int)
        for cluster_idx, cluster in enumerate(clusters):
            for point_idx in cluster:
                labels[point_idx] = cluster_idx
        
        # Lấy đại diện của các cụm
        representatives = cure_instance.get_representors()
        representatives_list = []
        
        # Chuyển đổi định dạng representatives
        for i in range(cure_config.n_clusters):
            # Đảm bảo đủ số lượng cụm
            if i < len(representatives):
                representatives_list.append([rep.tolist() for rep in representatives[i]])
            else:
                representatives_list.append([])
        
        # Chuyển đổi dữ liệu PCA thành định dạng JSON
        pca_results = [
            {"x": float(point[0]), "y": float(point[1]), "cluster": int(labels[i])}
            for i, point in enumerate(pca_data)
        ]
        
        return ClusterResult(
            labels=labels.tolist(),
            representatives=representatives_list,
            pca_data=pca_results,
            columns_used=cure_config.numeric_columns
        )
        
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@app.post("/api/upload-and-cluster/", response_model=ClusterResult)
async def upload_and_cluster(
    file: UploadFile = File(...),
    config: str = Form(...)
):
    try:
        # Parse config
        config_dict = json.loads(config)
        cure_config = CUREConfig(**config_dict)
        
        # Đọc file CSV
        content = await file.read()
        df = pd.read_csv(io.BytesIO(content))
        
        # Trích xuất các cột số cần dùng cho phân cụm
        numeric_columns = cure_config.numeric_columns
        if not all(col in df.columns for col in numeric_columns):
            raise HTTPException(status_code=400, detail="Một số cột không tồn tại trong dữ liệu")
        
        # Tiền xử lý dữ liệu
        scaled_data, _, pca = preprocess_data(df, numeric_columns)
        
        # Khởi tạo thuật toán CURE
        cure_instance = cure(
            data=scaled_data.tolist(),
            number_cluster=cure_config.n_clusters,
            number_represent_points=cure_config.n_representatives,
            compression=cure_config.shrinking_factor,
            ccore=True  # Sử dụng C-core implementation nếu có
        )
        
        # Thực hiện phân cụm
        cure_instance.process()
        
        # Lấy clusters
        clusters = cure_instance.get_clusters()
        
        # Lấy nhãn cho từng điểm dữ liệu
        labels = np.zeros(len(scaled_data), dtype=int)
        for cluster_idx, cluster in enumerate(clusters):
            for point_idx in cluster:
                labels[point_idx] = cluster_idx
        
        # Lấy đại diện của các cụm
        representatives = cure_instance.get_representors()
        
        # Tính PCA cho dữ liệu
        X_pca = pca.transform(scaled_data)
        
        # Chuẩn bị dữ liệu PCA
        pca_data = []
        for i, (x, y) in enumerate(X_pca):
            pca_data.append({
                "x": float(x),
                "y": float(y),
                "cluster": int(labels[i])
            })
        
        # Chuẩn bị dữ liệu đại diện cho các cụm
        reps_pca = []
        for cluster_reps in representatives:
            # Chuyển đổi đại diện sang không gian 2D
            cluster_reps_np = np.array(cluster_reps)
            if len(cluster_reps) > 0:
                reps_transformed = pca.transform(cluster_reps_np)
                reps_pca.append(reps_transformed.tolist())
            else:
                reps_pca.append([])
        
        # Trích xuất các giá trị thuộc tính cho mỗi cột được sử dụng
        features = {}
        for col in numeric_columns:
            features[col] = df[col].tolist()

        return ClusterResult(
            labels=labels.tolist(),
            representatives=reps_pca,
            pca_data=pca_data,
            columns_used=numeric_columns,
            features=features
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi xử lý: {str(e)}")

@app.post("/api/columns/", response_model=List[str])
async def get_columns(file: UploadFile = File(...)):
    try:
        content = await file.read()
        df = pd.read_csv(io.BytesIO(content))
        return df.columns.tolist()
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Lỗi đọc file: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)