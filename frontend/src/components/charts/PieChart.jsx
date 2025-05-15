import React from 'react';
import Plot from 'react-plotly.js';

const PieChart = ({ data }) => {
  return (
    <Plot
      data={[
        {
          values: Object.values(data).map(cluster => cluster.count),
          labels: Object.keys(data).map(index => `Cụm ${parseInt(index) + 1}`),
          type: 'pie',
          hole: 0.4,
          marker: {
            colors: Object.values(data).map(cluster => cluster.color)
          },
          textinfo: 'label+percent',
          hoverinfo: 'label+value+percent'
        }
      ]}
      layout={{
        title: 'Phân bố các cụm',
        width: 600,
        height: 500,
        showlegend: true
      }}
      config={{ responsive: true }}
    />
  );
};

export default PieChart;
