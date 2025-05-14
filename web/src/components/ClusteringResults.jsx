import React, { useEffect, useRef, useState } from 'react';
import { Chart, ScatterController, PointElement, LinearScale, CategoryScale, Legend, Tooltip } from 'chart.js';

Chart.register(ScatterController, PointElement, LinearScale, CategoryScale, Legend, Tooltip);

function ClusteringResults({ results }) {
  const chartRef = useRef(null);
  const [chart, setChart] = useState(null);
  const [selectedCluster, setSelectedCluster] = useState(null);
  
  // Tạo mảng màu cho các cụm
  const generateColors = (count) => {
    const colors = [
      'rgba(255, 99, 132, 0.7)',   // Đỏ
      'rgba(54, 162, 235, 0.7)',   // Xanh dương
      'rgba(255, 206, 86, 0.7)',   // Vàng
      'rgba(75, 192, 192, 0.7)',   // Xanh lá
      'rgba(153, 102, 255, 0.7)',  // Tím
      'rgba(255, 159, 64, 0.7)',   // Cam
      'rgba(199, 199, 199, 0.7)'   // Xám
    ];
    
    // Nếu cần nhiều màu hơn, tạo màu ngẫu nhiên
    while (colors.length < count) {
      const r = Math.floor(Math.random() * 255);
      const g = Math.floor(Math.random() * 255);
      const b = Math.floor(Math.random() * 255);
      colors.push(`rgba(${r}, ${g}, ${b}, 0.7)`);
    }
    
    return colors;
  };

  useEffect(() => { 
    if (!results) return;
    
    // Tạo dữ liệu cho biểu đồ
    const clusterCount = Math.max(...results.labels) + 1;
    const colors = generateColors(clusterCount);
    
    // Tổ chức dữ liệu theo cụm
    const datasets = [];
    
    // Chỉ hiển thị các cụm được chọn nếu có
    const activeClusters = selectedCluster !== null ? [selectedCluster] : [...Array(clusterCount).keys()];
    
    // Dữ liệu điểm
    for (let i = 0; i < clusterCount; i++) {
      if (!activeClusters.includes(i)) continue;
      
      const clusterPoints = results.pca_data.filter(point => point.cluster === i);
      
      datasets.push({
        label: `Cụm ${i + 1}`,
        data: clusterPoints.map(point => ({ x: point.x, y: point.y })),
        backgroundColor: colors[i],
        pointRadius: 5,
        borderColor: colors[i].replace('0.7', '1'),
        borderWidth: 1
      });
    }
    
    // Dữ liệu đại diện
    for (let i = 0; i < results.representatives.length; i++) {
      if (!activeClusters.includes(i)) continue;
      
      const repPoints = results.representatives[i];
      
      datasets.push({
        label: `Đại diện cụm ${i + 1}`,
        data: repPoints.map(point => ({ x: point[0], y: point[1] })),
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        pointRadius: 8,
        pointStyle: 'triangle',
        borderColor: colors[i].replace('0.7', '1'),
        borderWidth: 2
      });
    }
    
    // Vẽ biểu đồ
    if (chartRef.current) {
      if (chart) {
        chart.destroy();
      }
      
      const newChart = new Chart(chartRef.current, {
        type: 'scatter',
        data: {
          datasets: datasets
        },
        options: {
          animation: {
            duration: 500
          },
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            legend: {
              position: 'top',
              labels: {
                usePointStyle: true,
                padding: 20
              }
            },
            tooltip: {
              callbacks: {
                label: (context) => {
                  const datasetLabel = context.dataset.label || '';
                  const isRepresentative = datasetLabel.includes('Đại diện');
                  const coordX = context.parsed.x.toFixed(2);
                  const coordY = context.parsed.y.toFixed(2);
                  
                  if (isRepresentative) {
                    return `${datasetLabel}: (${coordX}, ${coordY})`;
                  } else {
                    return `Điểm thuộc ${datasetLabel}: (${coordX}, ${coordY})`;
                  }
                }
              }
            }
          },
          scales: {
            x: {
              title: {
                display: true,
                text: 'Thành phần chính 1',
                font: {
                  weight: 'bold'
                }
              },
              grid: {
                color: 'rgba(0, 0, 0, 0.1)'
              }
            },
            y: {
              title: {
                display: true,
                text: 'Thành phần chính 2',
                font: {
                  weight: 'bold'
                }
              },
              grid: {
                color: 'rgba(0, 0, 0, 0.1)'
              }
            }
          }
        }
      });
      
      setChart(newChart);
    }
    
    return () => {
      if (chart) {
        chart.destroy();
      }
    };
  }, [results, selectedCluster]);

  if (!results) {
    return <div className="alert alert-info">Không có kết quả phân cụm để hiển thị.</div>;
  }

  // Tính số lượng điểm cho mỗi cụm
  const clusterCounts = {};
  results.labels.forEach(label => {
    if (!clusterCounts[label]) {
      clusterCounts[label] = 0;
    }
    clusterCounts[label]++;
  });

  // Tính các thống kê cơ bản cho mỗi cụm
  const clusterStats = {};
  const colors = generateColors(Math.max(...results.labels) + 1);
  
  Object.keys(clusterCounts).forEach(cluster => {
    const clusterIdx = parseInt(cluster);
    const clusterPoints = results.pca_data.filter(point => point.cluster === clusterIdx);
    
    // Tính giá trị trung bình của x và y
    const avgX = clusterPoints.reduce((sum, point) => sum + point.x, 0) / clusterPoints.length;
    const avgY = clusterPoints.reduce((sum, point) => sum + point.y, 0) / clusterPoints.length;
    
    // Tính phương sai
    const varX = clusterPoints.reduce((sum, point) => sum + Math.pow(point.x - avgX, 2), 0) / clusterPoints.length;
    const varY = clusterPoints.reduce((sum, point) => sum + Math.pow(point.y - avgY, 2), 0) / clusterPoints.length;
    
    clusterStats[cluster] = {
      count: clusterCounts[cluster],
      percentage: ((clusterCounts[cluster] / results.labels.length) * 100).toFixed(1),
      avgX: avgX.toFixed(3),
      avgY: avgY.toFixed(3),
      varX: varX.toFixed(3),
      varY: varY.toFixed(3),
      color: colors[clusterIdx],
      representatives: results.representatives[clusterIdx].length
    };
  });

  const handleClusterClick = (clusterIdx) => {
    if (selectedCluster === clusterIdx) {
      setSelectedCluster(null); // Bỏ chọn nếu nhấn vào cụm đã chọn
    } else {
      setSelectedCluster(clusterIdx); // Chọn cụm mới
    }
  };

  return (
    <div className="results-container p-4">
      <h2 className="text-2xl font-bold mb-4">Kết quả phân cụm CURE</h2>
      
      <div className="results-info bg-gray-100 p-3 rounded mb-4">
        <p><span className="font-semibold">Số cụm:</span> {Math.max(...results.labels) + 1}</p>
        <p><span className="font-semibold">Thuộc tính:</span> {results.columns_used.join(', ')}</p>
        <p><span className="font-semibold">Tổng số điểm:</span> {results.labels.length}</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 mb-4">
        <div className="md:col-span-4 bg-white p-4 rounded shadow">
          <h3 className="text-lg font-semibold mb-3">Thống kê các cụm</h3>
          
          <div className="flex flex-wrap gap-2 mb-4">
            <button 
              className={`px-3 py-1 rounded text-white ${selectedCluster === null ? 'bg-gray-700' : 'bg-gray-400'}`}
              onClick={() => setSelectedCluster(null)}
            >
              Tất cả
            </button>
            
            {Object.keys(clusterStats).map(cluster => (
              <button
                key={cluster}
                className={`px-3 py-1 rounded text-white`}
                style={{ 
                  backgroundColor: selectedCluster === parseInt(cluster) 
                    ? clusterStats[cluster].color.replace('0.7', '1') 
                    : clusterStats[cluster].color 
                }}
                onClick={() => handleClusterClick(parseInt(cluster))}
              >
                Cụm {parseInt(cluster) + 1}
              </button>
            ))}
          </div>
          
          <div className="space-y-3">
            {Object.keys(clusterStats)
              .filter(cluster => selectedCluster === null || selectedCluster === parseInt(cluster))
              .map(cluster => (
              <div 
                key={cluster} 
                className="p-3 rounded border"
                style={{ borderColor: clusterStats[cluster].color.replace('0.7', '1') }}
              >
                <h4 className="font-semibold mb-1">Cụm {parseInt(cluster) + 1}</h4>
                <p>Số điểm: {clusterStats[cluster].count} ({clusterStats[cluster].percentage}%)</p>
                <p>Số đại diện: {clusterStats[cluster].representatives}</p>
                <p>Trung tâm (PCA): ({clusterStats[cluster].avgX}, {clusterStats[cluster].avgY})</p>
                <p>Độ phân tán: σ²x={clusterStats[cluster].varX}, σ²y={clusterStats[cluster].varY}</p>
              </div>
            ))}
          </div>
        </div>
        
        <div className="md:col-span-8 bg-white p-4 rounded shadow">
          <h3 className="text-lg font-semibold mb-3">Trực quan hóa kết quả phân cụm</h3>
          <div className="chart-container" style={{ height: '450px' }}>
            <canvas ref={chartRef}></canvas>
          </div>
          <div className="text-sm text-gray-600 mt-2">
            <p>• Các điểm hình tròn: điểm dữ liệu gốc (đã giảm chiều với PCA)</p>
            <p>• Các điểm hình tam giác: điểm đại diện của cụm</p>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ClusteringResults;
