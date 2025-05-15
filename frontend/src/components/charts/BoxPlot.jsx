import React from 'react';
import Plot from 'react-plotly.js';

const BoxPlot = ({ data, features }) => {
  if (!features || Object.keys(features).length === 0) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        Không có dữ liệu thuộc tính để hiển thị biểu đồ hộp
      </div>
    );
  }

  const featureNames = Object.keys(features);
  const clusters = Object.keys(data);
  const traces = [];

  // Tạo một trace cho mỗi thuộc tính
  featureNames.forEach(feature => {
    clusters.forEach(cluster => {
      const clusterPoints = data[cluster];
      const featureValues = clusterPoints.map(point => features[feature][point.index]);

      if (!Array.isArray(featureValues) || featureValues.length === 0) {
        return;
      }

      traces.push({
        type: 'box',
        y: featureValues,
        name: `Cụm ${parseInt(cluster) + 1}`,
        boxpoints: 'outliers',
        marker: {
          color: data[cluster].color
        },
        line: {
          color: data[cluster].color
        },
        xaxis: `x${parseInt(feature) + 1}`,
        showlegend: parseInt(feature) === 0 // Chỉ hiện legend ở biểu đồ đầu tiên
      });
    });
  });

  // Tạo layout với subplot cho mỗi thuộc tính
  const layout = {
    title: 'Phân phối các thuộc tính theo cụm',
    grid: {
      rows: Math.ceil(featureNames.length / 2),
      columns: 2,
      pattern: 'independent'
    },
    height: Math.max(600, featureNames.length * 200),
    width: 1000,
    showlegend: true,
    margin: {
      l: 50,
      r: 50,
      t: 100,
      b: 50
    }
  };

  // Thiết lập tiêu đề cho mỗi subplot
  featureNames.forEach((feature, index) => {
    layout[`xaxis${index + 1}`] = {
      title: '',
      showticklabels: false
    };
    layout[`yaxis${index + 1}`] = {
      title: feature,
      zeroline: false
    };
  });

  return (
    <Plot
      data={traces}
      layout={layout}
      config={{
        responsive: true,
        displayModeBar: true,
        displaylogo: false,
        modeBarButtonsToRemove: ['lasso2d', 'select2d']
      }}
    />
  );
};

export default BoxPlot;
