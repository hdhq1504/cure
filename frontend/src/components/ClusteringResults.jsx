import React, { useEffect, useRef, useState } from 'react';
import { Chart, ScatterController, PointElement, LinearScale, CategoryScale, Legend, Tooltip, 
         BarElement, BarController, PieController, ArcElement, RadarController, RadialLinearScale, 
         LineController, LineElement } from 'chart.js';

// Đăng ký tất cả các controller và elements cần thiết
Chart.register(
  ScatterController, 
  PointElement, 
  LinearScale, 
  CategoryScale, 
  Legend, 
  Tooltip,
  BarElement,
  BarController,
  PieController,
  ArcElement,
  RadarController,
  RadialLinearScale,
  LineController,
  LineElement
);

function ClusteringResults({ results }) {
  const scatterChartRef = useRef(null);
  const barChartRef = useRef(null);
  const pieChartRef = useRef(null);
  const radarChartRef = useRef(null);
  const [charts, setCharts] = useState({});
  const [selectedCluster, setSelectedCluster] = useState(null);
  const [activeTab, setActiveTab] = useState('scatter');
  
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

  const destroyCharts = React.useCallback(() => {
    Object.values(charts).forEach(chart => {
      if (chart) chart.destroy();
    });
  }, [charts]);

  useEffect(() => {
    return () => {
      destroyCharts();
    };
  }, [destroyCharts]);

  useEffect(() => { 
    if (!results) return;
    
    // Tạo dữ liệu cho biểu đồ
    const clusterCount = Math.max(...results.labels) + 1;
    const colors = generateColors(clusterCount);
    
    // Hủy các biểu đồ hiện tại
    destroyCharts();
    const newCharts = {};
    
    // Tổ chức dữ liệu theo cụm
    const activeClusters = selectedCluster !== null ? [selectedCluster] : [...Array(clusterCount).keys()];
    
    // ===== BIỂU ĐỒ SCATTER (PHÂN TÁN) =====
    if (scatterChartRef.current) {
      const scatterDatasets = [];
      
      // Dữ liệu điểm
      for (let i = 0; i < clusterCount; i++) {
        if (!activeClusters.includes(i)) continue;
        
        const clusterPoints = results.pca_data.filter(point => point.cluster === i);
        
        scatterDatasets.push({
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
        
        scatterDatasets.push({
          label: `Đại diện cụm ${i + 1}`,
          data: repPoints.map(point => ({ x: point[0], y: point[1] })),
          backgroundColor: 'rgba(0, 0, 0, 0.7)',
          pointRadius: 8,
          pointStyle: 'triangle',
          borderColor: colors[i].replace('0.7', '1'),
          borderWidth: 2
        });
      }
      
      newCharts.scatter = new Chart(scatterChartRef.current, {
        type: 'scatter',
        data: {
          datasets: scatterDatasets
        },
        options: {
          animation: { duration: 500 },
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            title: {
              display: true,
              text: 'Phân bố các cụm trong không gian PCA',
              font: { size: 16, weight: 'bold' }
            },
            legend: {
              position: 'top',
              labels: { usePointStyle: true, padding: 20 }
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
                font: { weight: 'bold' }
              },
              grid: { color: 'rgba(0, 0, 0, 0.1)' }
            },
            y: {
              title: {
                display: true,
                text: 'Thành phần chính 2',
                font: { weight: 'bold' }
              },
              grid: { color: 'rgba(0, 0, 0, 0.1)' }
            }
          }
        }
      });
    }
    
    // ===== BIỂU ĐỒ BAR (CỘT) =====
    if (barChartRef.current) {
      // Tính số lượng điểm cho mỗi cụm
      const clusterCounts = {};
      const clusterLabels = [];
      const countData = [];
      const backgroundColors = [];
      
      for (let i = 0; i < clusterCount; i++) {
        const count = results.labels.filter(label => label === i).length;
        clusterLabels.push(`Cụm ${i + 1}`);
        countData.push(count);
        backgroundColors.push(colors[i]);
      }
      
      newCharts.bar = new Chart(barChartRef.current, {
        type: 'bar',
        data: {
          labels: clusterLabels,
          datasets: [{
            label: 'Số lượng điểm',
            data: countData,
            backgroundColor: backgroundColors,
            borderColor: backgroundColors.map(color => color.replace('0.7', '1')),
            borderWidth: 1
          }]
        },
        options: {
          animation: { duration: 500 },
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            title: {
              display: true,
              text: 'Phân phối số lượng điểm trong các cụm',
              font: { size: 16, weight: 'bold' }
            },
            legend: { display: false },
            tooltip: {
              callbacks: {
                label: (context) => {
                  const value = context.raw;
                  const total = results.labels.length;
                  const percentage = ((value / total) * 100).toFixed(1);
                  return `${value} điểm (${percentage}%)`;
                }
              }
            }
          },
          scales: {
            y: {
              beginAtZero: true,
              title: {
                display: true,
                text: 'Số lượng điểm',
                font: { weight: 'bold' }
              }
            },
            x: {
              title: {
                display: true,
                text: 'Các cụm',
                font: { weight: 'bold' }
              }
            }
          }
        }
      });
    }
    
    // ===== BIỂU ĐỒ PIE (HÌNH TRÒN) =====
    if (pieChartRef.current) {
      const clusterLabels = [];
      const countData = [];
      const backgroundColors = [];
      
      for (let i = 0; i < clusterCount; i++) {
        const count = results.labels.filter(label => label === i).length;
        clusterLabels.push(`Cụm ${i + 1}`);
        countData.push(count);
        backgroundColors.push(colors[i]);
      }
      
      newCharts.pie = new Chart(pieChartRef.current, {
        type: 'pie',
        data: {
          labels: clusterLabels,
          datasets: [{
            data: countData,
            backgroundColor: backgroundColors,
            borderColor: backgroundColors.map(color => color.replace('0.7', '1')),
            borderWidth: 1
          }]
        },
        options: {
          animation: { duration: 500 },
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            title: {
              display: true,
              text: 'Tỷ lệ phần trăm các cụm',
              font: { size: 16, weight: 'bold' }
            },
            tooltip: {
              callbacks: {
                label: (context) => {
                  const value = context.raw;
                  const total = results.labels.length;
                  const percentage = ((value / total) * 100).toFixed(1);
                  return `${context.label}: ${value} điểm (${percentage}%)`;
                }
              }
            }
          }
        }
      });
    }
    
    // ===== BIỂU ĐỒ RADAR =====
    if (radarChartRef.current && results.columns_used && results.columns_used.length > 0) {
      // Chỉ hiển thị đặc trưng của trung tâm các cụm
      const radarDatasets = [];
      
      // Tính trung bình các thuộc tính theo cụm
      for (let i = 0; i < clusterCount; i++) {
        if (!activeClusters.includes(i)) continue;
        
        // Lấy các điểm dữ liệu trong cụm
        const clusterIndices = [];
        for (let j = 0; j < results.labels.length; j++) {
          if (results.labels[j] === i) {
            clusterIndices.push(j);
          }
        }
        
        const data = {};
        results.columns_used.forEach(column => {
          // Giả định rằng có dữ liệu ban đầu được lưu theo cột ở đâu đó
          // Nếu không có, cần cập nhật API để cung cấp dữ liệu này
          // Trong trường hợp này, chúng ta sẽ sử dụng giá trị PCA làm minh họa
          const values = clusterIndices.map(idx => results.pca_data[idx].x);
          data[column] = values.reduce((sum, val) => sum + val, 0) / values.length;
        });
        
        radarDatasets.push({
          label: `Cụm ${i + 1}`,
          data: results.columns_used.map(column => data[column]),
          backgroundColor: colors[i].replace('0.7', '0.2'),
          borderColor: colors[i].replace('0.7', '1'),
          borderWidth: 2,
          pointBackgroundColor: colors[i],
          pointBorderColor: '#fff',
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: colors[i]
        });
      }
      
      newCharts.radar = new Chart(radarChartRef.current, {
        type: 'radar',
        data: {
          labels: results.columns_used,
          datasets: radarDatasets
        },
        options: {
          animation: { duration: 500 },
          responsive: true,
          maintainAspectRatio: false,
          plugins: {
            title: {
              display: true,
              text: 'Đặc trưng của các cụm theo thuộc tính',
              font: { size: 16, weight: 'bold' }
            },
            legend: {
              position: 'top',
              labels: { usePointStyle: true }
            },
            tooltip: {
              callbacks: {
                label: (context) => {
                  return `${context.dataset.label}: ${context.raw.toFixed(2)}`;
                }
              }
            }
          },
          scales: {
            r: {
              beginAtZero: true,
              ticks: {
                display: false
              }
            }
          }
        }
      });
    }
    
    setCharts(newCharts);
  }, [results, selectedCluster, activeTab, destroyCharts]);

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
    const avgX = clusterPoints.length > 0 
      ? clusterPoints.reduce((sum, point) => sum + (point.x || 0), 0) / clusterPoints.length 
      : 0;
    const avgY = clusterPoints.length > 0 
      ? clusterPoints.reduce((sum, point) => sum + (point.y || 0), 0) / clusterPoints.length 
      : 0;
    
    // Tính phương sai với kiểm tra số không hợp lệ
    const varX = clusterPoints.length > 0 
      ? clusterPoints.reduce((sum, point) => sum + Math.pow((point.x || 0) - avgX, 2), 0) / clusterPoints.length 
      : 0;
    const varY = clusterPoints.length > 0 
      ? clusterPoints.reduce((sum, point) => sum + Math.pow((point.y || 0) - avgY, 2), 0) / clusterPoints.length 
      : 0;
    
    clusterStats[cluster] = {
      count: clusterCounts[cluster] || 0,
      percentage: ((clusterCounts[cluster] / results.labels.length) * 100).toFixed(1),
      avgX: avgX.toFixed(3),
      avgY: avgY.toFixed(3),
      varX: varX.toFixed(3),
      varY: varY.toFixed(3),
      color: colors[clusterIdx],
      representatives: results.representatives[clusterIdx]?.length || 0
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
          
          <div className="chart-tabs flex border-b mb-4">
            <button 
              className={`py-2 px-4 ${activeTab === 'scatter' ? 'border-b-2 border-blue-500 text-blue-500 font-medium' : 'text-gray-600'}`}
              onClick={() => setActiveTab('scatter')}
            >
              Phân tán (Scatter)
            </button>
            <button 
              className={`py-2 px-4 ${activeTab === 'bar' ? 'border-b-2 border-blue-500 text-blue-500 font-medium' : 'text-gray-600'}`}
              onClick={() => setActiveTab('bar')}
            >
              Cột (Bar)
            </button>
            <button 
              className={`py-2 px-4 ${activeTab === 'pie' ? 'border-b-2 border-blue-500 text-blue-500 font-medium' : 'text-gray-600'}`}
              onClick={() => setActiveTab('pie')}
            >
              Hình tròn (Pie)
            </button>
            <button 
              className={`py-2 px-4 ${activeTab === 'radar' ? 'border-b-2 border-blue-500 text-blue-500 font-medium' : 'text-gray-600'}`}
              onClick={() => setActiveTab('radar')}
            >
              Radar
            </button>
          </div>
          
          <div className="chart-container" style={{ height: '450px' }}>
            <div className={activeTab === 'scatter' ? 'block' : 'hidden'}>
              <canvas ref={scatterChartRef}></canvas>
              <div className="text-sm text-gray-600 mt-2">
                <p>• Các điểm hình tròn: điểm dữ liệu gốc (đã giảm chiều với PCA)</p>
                <p>• Các điểm hình tam giác: điểm đại diện của cụm</p>
              </div>
            </div>
            
            <div className={activeTab === 'bar' ? 'block' : 'hidden'}>
              <canvas ref={barChartRef}></canvas>
              <div className="text-sm text-gray-600 mt-2">
                <p>• Biểu đồ thể hiện số lượng điểm dữ liệu trong mỗi cụm</p>
              </div>
            </div>
            
            <div className={activeTab === 'pie' ? 'block' : 'hidden'}>
              <canvas ref={pieChartRef}></canvas>
              <div className="text-sm text-gray-600 mt-2">
                <p>• Biểu đồ thể hiện tỷ lệ phần trăm số lượng điểm dữ liệu trong mỗi cụm</p>
              </div>
            </div>
            
            <div className={activeTab === 'radar' ? 'block' : 'hidden'}>
              <canvas ref={radarChartRef}></canvas>
              <div className="text-sm text-gray-600 mt-2">
                <p>• Biểu đồ thể hiện đặc trưng của các cụm theo từng thuộc tính</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ClusteringResults;