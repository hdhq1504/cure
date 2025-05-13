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

# Thuật toán CURE
class CURE:
    def __init__(self, n_clusters=2, n_representatives=10, shrinking_factor=0.2):
        self.n_clusters = n_clusters
        self.n_representatives = n_representatives
        self.shrinking_factor = shrinking_factor
        self.representatives = []
        self.labels_ = None
        
    def fit(self, X):
        n_samples, n_features = X.shape
        
        # Bước 1: Khởi tạo mỗi điểm là một cụm riêng biệt
        clusters = []
        for i in range(n_samples):
            clusters.append({
                'points': [X[i]],
                'representatives': [X[i]],
                'centroid': X[i]
            })
            
        # Thuật toán tham lam cho phân cụm phân tầng
        while len(clusters) > self.n_clusters:
            # Tìm cặp cụm gần nhất
            min_dist = float('inf')
            merge_i, merge_j = 0, 0
            
            for i in range(len(clusters)):
                for j in range(i+1, len(clusters)):
                    # Tính khoảng cách giữa các đại diện
                    min_rep_dist = float('inf')
                    for rep_i in clusters[i]['representatives']:
                        for rep_j in clusters[j]['representatives']:
                            dist = np.linalg.norm(rep_i - rep_j)
                            min_rep_dist = min(min_rep_dist, dist)
                    
                    if min_rep_dist < min_dist:
                        min_dist = min_rep_dist
                        merge_i, merge_j = i, j
            
            # Hợp nhất 2 cụm gần nhất
            new_cluster = self._merge_clusters(clusters[merge_i], clusters[merge_j])
            
            # Xóa 2 cụm cũ và thêm cụm mới
            if merge_i > merge_j:
                del clusters[merge_i]
                del clusters[merge_j]
            else:
                del clusters[merge_j]
                del clusters[merge_i]
            
            clusters.append(new_cluster)
            
        # Lưu trữ đại diện cuối cùng cho mỗi cụm
        self.representatives = [cluster['representatives'] for cluster in clusters]
        
        # Xác định nhãn cho từng điểm dữ liệu
        self.labels_ = np.zeros(n_samples, dtype=int)
        for i, point in enumerate(X):
            min_dist = float('inf')
            best_cluster = 0
            
            for cluster_idx, cluster in enumerate(clusters):
                for rep in cluster['representatives']:
                    dist = np.linalg.norm(point - rep)
                    if dist < min_dist:
                        min_dist = dist
                        best_cluster = cluster_idx
                        
            self.labels_[i] = best_cluster
            
        return self
    
    def _merge_clusters(self, cluster1, cluster2):
        # Kết hợp các điểm
        merged_points = cluster1['points'] + cluster2['points']
        
        # Tính tâm mới
        merged_centroid = np.mean(merged_points, axis=0)
        
        # Chọn đại diện mới
        all_points = np.array(merged_points)
        if len(all_points) <= self.n_representatives:
            representatives = all_points
        else:
            # Chọn những điểm cách xa nhau nhất làm đại diện
            representatives = [all_points[0]]
            
            while len(representatives) < self.n_representatives and len(representatives) < len(all_points):
                max_min_dist = -1
                farthest_point = None
                
                for point in all_points:
                    if any(np.array_equal(point, rep) for rep in representatives):
                        continue
                        
                    min_dist = min(np.linalg.norm(point - rep) for rep in representatives)
                    
                    if min_dist > max_min_dist:
                        max_min_dist = min_dist
                        farthest_point = point
                        
                if farthest_point is not None:
                    representatives.append(farthest_point)
                else:
                    break
            
            representatives = np.array(representatives)
        
        # Thu gọn các điểm đại diện về phía tâm cụm
        shrunk_representatives = []
        for rep in representatives:
            shrunk_rep = rep + self.shrinking_factor * (merged_centroid - rep)
            shrunk_representatives.append(shrunk_rep)
        
        return {
            'points': merged_points,
            'representatives': shrunk_representatives,
            'centroid': merged_centroid
        }
    
    def predict(self, X):
        labels = np.zeros(len(X), dtype=int)
        
        for i, point in enumerate(X):
            min_dist = float('inf')
            best_cluster = 0
            
            for cluster_idx, reps in enumerate(self.representatives):
                for rep in reps:
                    dist = np.linalg.norm(point - rep)
                    if dist < min_dist:
                        min_dist = dist
                        best_cluster = cluster_idx
                        
            labels[i] = best_cluster
            
        return labels

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
        
        # Chuẩn hóa dữ liệu
        X = df[numeric_columns].values
        scaler = StandardScaler()
        X_scaled = scaler.fit_transform(X)
        
        # Áp dụng thuật toán CURE
        cure = CURE(
            n_clusters=cure_config.n_clusters,
            n_representatives=cure_config.n_representatives,
            shrinking_factor=cure_config.shrinking_factor
        )
        cure.fit(X_scaled)
        print('Cluster labels:\n', cure.labels_)
        print('Cluster representatives:\n', cure.representatives)
        
        # Giảm chiều dữ liệu để trực quan hóa
        pca = PCA(n_components=2)
        X_pca = pca.fit_transform(X_scaled)
        print('PCA data:\n', X_pca)
        
        # Chuẩn bị dữ liệu trả về
        pca_data = []
        for i, (x, y) in enumerate(X_pca):
            pca_data.append({
                "x": float(x),
                "y": float(y),
                "cluster": int(cure.labels_[i])
            })
        
        # Chuẩn bị dữ liệu đại diện cho các cụm
        reps_pca = []
        for cluster_idx, reps in enumerate(cure.representatives):
            cluster_reps_pca = []
            for rep in reps:
                # Chuyển đổi đại diện sang không gian 2D
                rep_pca = pca.transform([rep])[0]
                cluster_reps_pca.append([float(rep_pca[0]), float(rep_pca[1])])
            reps_pca.append(cluster_reps_pca)
        
        return ClusterResult(
            labels=cure.labels_.tolist(),
            representatives=reps_pca,
            pca_data=pca_data,
            columns_used=numeric_columns
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