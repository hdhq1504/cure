import React from 'react';
import Plot from 'react-plotly.js';

const ScatterPlot = ({ data, colors, selectedCluster }) => {
  // Tạo dữ liệu cho từng cụm
  const traces = Object.keys(data).map(clusterIndex => {
    const clusterPoints = data[clusterIndex];
    const cluster = parseInt(clusterIndex);
    
    // Nếu có selectedCluster và không phải cluster được chọn thì ẩn đi
    if (selectedCluster !== null && cluster !== selectedCluster) {
      return null;
    }

    return {
      x: clusterPoints.map(point => point.x),
      y: clusterPoints.map(point => point.y),
      mode: 'markers',
      type: 'scatter',
      name: `Cụm ${cluster + 1}`,
      marker: {
        color: colors[cluster],
        size: 10
      }
    };
  }).filter(trace => trace !== null);

  return (
    <Plot
      data={traces}
      layout={{
        title: 'Biểu đồ phân tán các cụm',
        xaxis: { title: 'Thành phần chính 1' },
        yaxis: { title: 'Thành phần chính 2' },
        hovermode: 'closest',
        width: 800,
        height: 600
      }}
      config={{ responsive: true }}
    />
  );
};

export default ScatterPlot;
