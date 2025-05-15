import React from 'react';
import Plot from 'react-plotly.js';

const RepresentativesPlot = ({ data, representatives }) => {
  if (!representatives || !Array.isArray(representatives) || representatives.length === 0) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        Không có dữ liệu về các điểm đại diện để hiển thị
      </div>
    );
  }

  const traces = [];

  // Thêm các trace cho các điểm dữ liệu gốc (với độ mờ cao)
  Object.keys(data).forEach(cluster => {
    const clusterPoints = data[cluster];
    const clusterColor = data[cluster].color;
    
    traces.push({
      x: clusterPoints.map(point => point.x),
      y: clusterPoints.map(point => point.y),
      mode: 'markers',
      type: 'scatter',
      name: `Cụm ${parseInt(cluster) + 1} (Điểm dữ liệu)`,
      marker: {
        color: clusterColor,
        size: 8,
        opacity: 0.2
      },
      showlegend: false,
      hoverinfo: 'skip'
    });
  });

  // Thêm các trace cho các điểm đại diện (nếu có)
  representatives.forEach((repPoints, clusterIdx) => {
    if (repPoints && repPoints.length > 0) {
      const clusterColor = data[clusterIdx] ? data[clusterIdx].color : `rgb(${Math.random() * 255}, ${Math.random() * 255}, ${Math.random() * 255})`;
      
      traces.push({
        x: repPoints.map(point => point[0]),
        y: repPoints.map(point => point[1]),
        mode: 'markers',
        type: 'scatter',
        name: `Cụm ${clusterIdx + 1} (Điểm đại diện)`,
        marker: {
          color: clusterColor,
          size: 14,
          symbol: 'diamond',
          line: {
            color: 'white',
            width: 2
          }
        }
      });
    }
  });

  return (
    <Plot
      data={traces}
      layout={{
        title: 'Biểu đồ điểm đại diện CURE',
        xaxis: { title: 'Thành phần chính 1' },
        yaxis: { title: 'Thành phần chính 2' },
        hovermode: 'closest',
        width: 800,
        height: 600,
        legend: {
          x: 1,
          xanchor: 'right',
          y: 1
        }
      }}
      config={{ responsive: true }}
    />
  );
};

export default RepresentativesPlot;