import React from 'react';
import Plot from 'react-plotly.js';

const RadarChart = ({ data, features }) => {
  if (!features || Object.keys(features).length === 0) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        Không có dữ liệu thuộc tính để hiển thị biểu đồ radar
      </div>
    );
  }

  const featureNames = Object.keys(features);
  const clusters = Object.keys(data);
  const traces = [];

  // Tính giá trị trung bình cho mỗi thuộc tính trong mỗi cụm
  clusters.forEach(cluster => {
    const clusterPoints = data[cluster];
    const clusterIndices = clusterPoints.map(point => point.index);
    
    // Tính giá trị trung bình cho mỗi thuộc tính trong cụm hiện tại
    const meanValues = featureNames.map(feature => {
      const featureValues = clusterIndices.map(idx => features[feature][idx]);
      return featureValues.reduce((sum, val) => sum + val, 0) / featureValues.length;
    });

    // Chuẩn hóa dữ liệu để hiển thị đẹp hơn (scale về 0-1)
    const normalizedValues = featureNames.map((feature, idx) => {
      const allValues = features[feature];
      const max = Math.max(...allValues);
      const min = Math.min(...allValues);
      return (meanValues[idx] - min) / (max - min);
    });

    // Thêm trace cho cụm
    traces.push({
      type: 'scatterpolar',
      r: [...normalizedValues, normalizedValues[0]], // Thêm giá trị đầu tiên vào cuối để khép kín radar
      theta: [...featureNames, featureNames[0]], // Thêm thuộc tính đầu tiên vào cuối để khép kín radar
      fill: 'toself',
      name: `Cụm ${parseInt(cluster) + 1}`,
      line: {
        color: data[cluster].color
      },
      fillcolor: data[cluster].color,
      opacity: 0.6
    });
  });

  return (
    <Plot
      data={traces}
      layout={{
        title: 'Biểu đồ radar cho các cụm',
        polar: {
          radialaxis: {
            visible: true,
            range: [0, 1]
          }
        },
        showlegend: true,
        width: 700,
        height: 700
      }}
      config={{ responsive: true }}
    />
  );
};

export default RadarChart;