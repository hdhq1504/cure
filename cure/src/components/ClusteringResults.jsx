import React, { useEffect, useRef, useState } from 'react';
import { Chart, ScatterController, PointElement, LinearScale, CategoryScale, Legend, Tooltip } from 'chart.js';

Chart.register(ScatterController, PointElement, LinearScale, CategoryScale, Legend, Tooltip);

function ClusteringResults({ results }) {
  const chartRef = useRef(null);
  const [chart, setChart] = useState(null);
  
  // Tạo mảng màu cho các cụm
  const generateColors = (count) => {
    const colors = [
      'rgba(255, 99, 132, 0.7)',
      'rgba(54, 162, 235, 0.7)',
      'rgba(255, 206, 86, 0.7)',
      'rgba(75, 192, 192, 0.7)',
      'rgba(153, 102, 255, 0.7)',
      'rgba(255, 159, 64, 0.7)',
      'rgba(199, 199, 199, 0.7)'
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
    
    // Dữ liệu điểm
    for (let i = 0; i < clusterCount; i++) {
      const clusterPoints = results.pca_data.filter(point => point.cluster === i);
      
      datasets.push({
        label: `Cụm ${i + 1}`,
        data: clusterPoints.map(point => ({ x: point.x, y: point.y })),
        backgroundColor: colors[i],
        pointRadius: 5
      });
    }
    
    // Dữ liệu đại diện
    for (let i = 0; i < results.representatives.length; i++) {
      const repPoints = results.representatives[i];
      
      datasets.push({
        label: `Đại diện cụm ${i + 1}`,
        data: repPoints.map(point => ({ x: point[0], y: point[1] })),
        backgroundColor: 'rgba(0, 0, 0, 0.7)',
        pointRadius: 8,
        pointStyle: 'triangle'
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
          plugins: {
            tooltip: {
              callbacks: {
                label: (context) => {
                  return `Điểm (${context.parsed.x.toFixed(2)}, ${context.parsed.y.toFixed(2)})`;
                }
              }
            }
          },
          scales: {
            x: {
              title: {
                display: true,
                text: 'Thành phần chính 1'
              }
            },
            y: {
              title: {
                display: true,
                text: 'Thành phần chính 2'
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
  }, [results]);

  if (!results) {
    return <div>Không có kết quả phân cụm để hiển thị.</div>;
  }

  // Tính số lượng điểm cho mỗi cụm
  const clusterCounts = {};
  results.labels.forEach(label => {
    if (!clusterCounts[label]) {
      clusterCounts[label] = 0;
    }
    clusterCounts[label]++;
  });

  return (
    <div className="results-container">
      <h2>Kết quả phân cụm CURE</h2>
      
      <div className="results-info">
        <p>Đã phân cụm dữ liệu thành {Math.max(...results.labels) + 1} cụm.</p>
        <p>Sử dụng các thuộc tính: {results.columns_used.join(', ')}</p>
      </div>
      
      <div className="cluster-statistics">
        <h3>Thống kê các cụm</h3>
        <ul>
          {Object.keys(clusterCounts).map(cluster => (
            <li key={cluster}>
              Cụm {parseInt(cluster) + 1}: {clusterCounts[cluster]} điểm 
              ({((clusterCounts[cluster] / results.labels.length) * 100).toFixed(1)}%)
            </li>
          ))}
        </ul>
      </div>
      
      <div className="chart-container">
        <h3>Trực quan hóa kết quả phân cụm</h3>
        <canvas ref={chartRef} width="800" height="500"></canvas>
      </div>
    </div>
  );
}

export default ClusteringResults;