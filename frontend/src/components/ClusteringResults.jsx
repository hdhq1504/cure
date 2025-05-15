import React, { useState } from 'react';
import ScatterPlot from './charts/ScatterPlot';
import PieChart from './charts/PieChart';
import HeatmapPlot from './charts/HeatmapPlot';
import BoxPlot from './charts/BoxPlot';
import RadarChart from './charts/RadarChart';
import RepresentativesPlot from './charts/RepresentativesPlot';

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
        if (!results.features) {
          return <div className="p-4 bg-yellow-100 text-yellow-800 rounded">
            Không có dữ liệu thuộc tính để hiển thị biểu đồ nhiệt. Vui lòng cập nhật API để trả về thuộc tính features.
          </div>;
        }
        return <HeatmapPlot data={clusterData} features={results.features} />;
      case 'boxplot':
        if (!results.features) {
          return <div className="p-4 bg-yellow-100 text-yellow-800 rounded">
            Không có dữ liệu thuộc tính để hiển thị biểu đồ hộp. Vui lòng cập nhật API để trả về thuộc tính features.
          </div>;
        }
        return <BoxPlot data={clusterData} features={results.features} />;
      case 'radar':
        if (!results.features) {
          return <div className="p-4 bg-yellow-100 text-yellow-800 rounded">
            Không có dữ liệu thuộc tính để hiển thị biểu đồ radar. Vui lòng cập nhật API để trả về thuộc tính features.
          </div>;
        }
        return <RadarChart data={clusterData} features={results.features} />;
      case 'representatives':
        if (!results.representatives || results.representatives.length === 0) {
          return <div className="p-4 bg-yellow-100 text-yellow-800 rounded">
            Không có dữ liệu về các điểm đại diện. Vui lòng kiểm tra lại kết quả trả về từ API.
          </div>;
        }
        return <RepresentativesPlot data={clusterData} representatives={results.representatives} />;
      default:
        return null;
    }
  };

  return (
    <div className="clustering-results p-4">
      <h2 className="text-2xl font-bold mb-4 text-blue-700">Kết quả phân cụm</h2>
      
      <div className="chart-controls mb-4">
        <div className="tabs flex flex-wrap gap-2">
          <button
            className={`px-3 py-2 rounded ${activeTab === 'scatter' ? 'bg-blue-600 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}
            onClick={() => setActiveTab('scatter')}
          >
            Biểu đồ phân tán
          </button>
          <button
            className={`px-3 py-2 rounded ${activeTab === 'pie' ? 'bg-blue-600 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}
            onClick={() => setActiveTab('pie')}
          >
            Biểu đồ tròn
          </button>
          <button
            className={`px-3 py-2 rounded ${activeTab === 'heatmap' ? 'bg-blue-600 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}
            onClick={() => setActiveTab('heatmap')}
          >
            Biểu đồ nhiệt
          </button>
          <button
            className={`px-3 py-2 rounded ${activeTab === 'boxplot' ? 'bg-blue-600 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}
            onClick={() => setActiveTab('boxplot')}
          >
            Biểu đồ hộp
          </button>
          <button
            className={`px-3 py-2 rounded ${activeTab === 'radar' ? 'bg-blue-600 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}
            onClick={() => setActiveTab('radar')}
          >
            Biểu đồ radar
          </button>
          <button
            className={`px-3 py-2 rounded ${activeTab === 'representatives' ? 'bg-blue-600 text-white' : 'bg-gray-200 hover:bg-gray-300'}`}
            onClick={() => setActiveTab('representatives')}
          >
            Điểm đại diện
          </button>
        </div>
      </div>
      
      <div className="chart-container bg-white p-4 rounded-lg shadow mb-4">
        {renderChart()}
      </div>
      
      <div className="cluster-legend flex flex-wrap gap-3">
        {Object.keys(clusterData).map((cluster) => (
          <div
            key={cluster}
            className={`cluster-item flex items-center gap-2 px-3 py-2 rounded cursor-pointer ${
              selectedCluster === parseInt(cluster) ? 'bg-gray-200' : 'hover:bg-gray-100'
            }`}
            onClick={() => handleClusterClick(parseInt(cluster))}
          >
            <span
              className="color-dot w-4 h-4 rounded-full"
              style={{ backgroundColor: colors[cluster] }}
            ></span>
            <span className="cluster-name font-medium">Cụm {parseInt(cluster) + 1}</span>
            <span className="cluster-count text-sm text-gray-600">({clusterData[cluster].length} điểm)</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default ClusteringResults;