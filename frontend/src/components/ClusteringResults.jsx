import React, { useState } from 'react';
import ScatterPlot from './charts/ScatterPlot';
import PieChart from './charts/PieChart';
import HeatmapPlot from './charts/HeatmapPlot';
import BoxPlot from './charts/BoxPlot';

function ClusteringResults({ results }) {
  const [selectedCluster, setSelectedCluster] = useState(null);
  const [activeTab, setActiveTab] = useState('scatter');
  
  if (!results) return null;

  // Tạo mảng màu cho các cụm
  const generateColors = (count) => {
    const colors = [
      'rgb(255, 99, 132)',    // Đỏ
      'rgb(54, 162, 235)',    // Xanh dương
      'rgb(255, 206, 86)',    // Vàng
      'rgb(75, 192, 192)',    // Xanh lá
      'rgb(153, 102, 255)',   // Tím
      'rgb(255, 159, 64)',    // Cam
      'rgb(199, 199, 199)'    // Xám
    ];
    
    while (colors.length < count) {
      const r = Math.floor(Math.random() * 255);
      const g = Math.floor(Math.random() * 255);
      const b = Math.floor(Math.random() * 255);
      colors.push(`rgb(${r}, ${g}, ${b})`);
    }
    
    return colors;
  };

  // Chuẩn bị dữ liệu
  const clusterCount = Math.max(...results.labels) + 1;
  const colors = generateColors(clusterCount);
  
  // Tổ chức dữ liệu theo cụm
  const clusterData = {};
  results.labels.forEach((label, idx) => {
    if (!clusterData[label]) {
      clusterData[label] = [];
    }
    clusterData[label].push({
      x: results.pca_data[idx].x,
      y: results.pca_data[idx].y,
      index: idx
    });
  });

  // Thêm màu vào dữ liệu cụm
  Object.keys(clusterData).forEach((cluster, index) => {
    clusterData[cluster].color = colors[index];
    clusterData[cluster].count = clusterData[cluster].length;
  });

  const handleClusterClick = (cluster) => {
    setSelectedCluster(selectedCluster === cluster ? null : cluster);
  };

  const renderChart = () => {
    switch (activeTab) {
      case 'scatter':
        return (
          <ScatterPlot
            data={clusterData}
            colors={colors}
            selectedCluster={selectedCluster}
          />
        );
      case 'pie':
        return <PieChart data={clusterData} />;
      case 'heatmap':
        return <HeatmapPlot data={clusterData} features={results.features} />;
      case 'boxplot':
        return <BoxPlot data={clusterData} features={results.features} />;
      default:
        return null;
    }
  };

  return (
    <div className="clustering-results">
      <div className="chart-controls">
        <div className="tabs">
          <button
            className={activeTab === 'scatter' ? 'active' : ''}
            onClick={() => setActiveTab('scatter')}
          >
            Biểu đồ phân tán
          </button>
          <button
            className={activeTab === 'pie' ? 'active' : ''}
            onClick={() => setActiveTab('pie')}
          >
            Biểu đồ tròn
          </button>
          <button
            className={activeTab === 'heatmap' ? 'active' : ''}
            onClick={() => setActiveTab('heatmap')}
          >
            Biểu đồ nhiệt
          </button>
          <button
            className={activeTab === 'boxplot' ? 'active' : ''}
            onClick={() => setActiveTab('boxplot')}
          >
            Biểu đồ hộp
          </button>
        </div>
      </div>
      
      <div className="chart-container">
        {renderChart()}
      </div>
      
      <div className="cluster-legend">
        {Object.keys(clusterData).map((cluster) => (
          <div
            key={cluster}
            className={`cluster-item ${selectedCluster === parseInt(cluster) ? 'selected' : ''}`}
            onClick={() => handleClusterClick(parseInt(cluster))}
          >
            <span
              className="color-dot"
              style={{ backgroundColor: colors[cluster] }}
            ></span>
            <span className="cluster-name">Cụm {parseInt(cluster) + 1}</span>
            <span className="cluster-count">({clusterData[cluster].length} điểm)</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ClusteringResults;