import React from 'react';
import Plot from 'react-plotly.js';

const HeatmapPlot = ({ data, features }) => {
  if (!features || Object.keys(features).length === 0) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        Không có dữ liệu thuộc tính để hiển thị ma trận tương quan
      </div>
    );
  }

  // Tính toán ma trận tương quan
  const correlationMatrix = [];
  const featureNames = Object.keys(features);

  for (let i = 0; i < featureNames.length; i++) {
    const row = [];
    for (let j = 0; j < featureNames.length; j++) {
      const feature1 = featureNames[i];
      const feature2 = featureNames[j];
      const values1 = features[feature1];
      const values2 = features[feature2];

      if (!Array.isArray(values1) || !Array.isArray(values2) || values1.length === 0 || values2.length === 0) {
        row.push(0);
        continue;
      }

      // Tính hệ số tương quan Pearson
      const mean1 = values1.reduce((a, b) => a + b, 0) / values1.length;
      const mean2 = values2.reduce((a, b) => a + b, 0) / values2.length;
      
      const deviation1 = values1.map(x => x - mean1);
      const deviation2 = values2.map(x => x - mean2);
      
      const sum = deviation1.reduce((a, b, i) => a + b * deviation2[i], 0);
      const sqrtSum1 = Math.sqrt(deviation1.reduce((a, b) => a + b * b, 0));
      const sqrtSum2 = Math.sqrt(deviation2.reduce((a, b) => a + b * b, 0));
      
      const correlation = sqrtSum1 === 0 || sqrtSum2 === 0 ? 0 : sum / (sqrtSum1 * sqrtSum2);
      row.push(correlation);
    }
    correlationMatrix.push(row);
  }

  return (
    <Plot
      data={[
        {
          z: correlationMatrix,
          x: featureNames,
          y: featureNames,
          type: 'heatmap',
          colorscale: 'RdBu',
          zmin: -1,
          zmax: 1,
          hoverongaps: false,
          colorbar: {
            title: 'Hệ số tương quan'
          }
        }
      ]}
      layout={{
        title: 'Ma trận tương quan giữa các thuộc tính',
        width: 800,
        height: 800,
        xaxis: {
          side: 'bottom',
          tickangle: 45
        },
        yaxis: {
          autorange: 'reversed'
        },
        annotations: correlationMatrix.map((row, i) => 
          row.map((val, j) => ({
            x: j,
            y: i,
            text: val.toFixed(2),
            font: {
              color: Math.abs(val) > 0.5 ? 'white' : 'black'
            },
            showarrow: false
          }))
        ).flat()
      }}
      config={{ responsive: true }}
    />
  );
};

export default HeatmapPlot;
