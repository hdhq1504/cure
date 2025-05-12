import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function ClusteringConfig({ uploadedFile, columns, setClusteringResults, setIsLoading, isLoading }) {
  const [numClusters, setNumClusters] = useState(3);
  const [numRepresentatives, setNumRepresentatives] = useState(10);
  const [shrinkingFactor, setShrinkingFactor] = useState(0.2);
  const [selectedColumns, setSelectedColumns] = useState([]);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    console.log('Available columns:', columns);
    console.log('Selected columns:', selectedColumns);
    console.log('isLoading:', isLoading);
    console.log('Button should be enabled:', !isLoading && selectedColumns.length >= 2);
  }, [columns, selectedColumns, isLoading]);

  const handleColumnToggle = (column) => {
    const newSelectedColumns = selectedColumns.includes(column) 
      ? selectedColumns.filter(col => col !== column)
      : [...selectedColumns, column];
    
    console.log('Toggling column:', column);
    console.log('Previous selected columns:', selectedColumns);
    console.log('New selected columns:', newSelectedColumns);
    
    setSelectedColumns(newSelectedColumns);
  };

  const handleSubmit = async () => {
    console.log('Selected columns:', selectedColumns);
    console.log('Number of selected columns:', selectedColumns.length);
    
    if (selectedColumns.length < 2) {
      setError('Vui lòng chọn ít nhất 2 cột số để phân cụm');
      return;
    }

    setIsLoading(true);
    setError('');

    const formData = new FormData();
    formData.append('file', uploadedFile);
    
    const config = {
      n_clusters: numClusters,
      n_representatives: numRepresentatives,
      shrinking_factor: shrinkingFactor,
      numeric_columns: selectedColumns
    };
    
    formData.append('config', JSON.stringify(config));

    try {
      const response = await axios.post(
        'http://localhost:8000/api/upload-and-cluster/',
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      
      setClusteringResults(response.data);
      setIsLoading(false);
      navigate('/results');
    } catch (error) {
      setIsLoading(false);
      setError(`Lỗi: ${error.response?.data?.detail || error.message}`);
    }
  };

  useEffect(() => {
    console.log('Selected columns updated:', selectedColumns);
  }, [selectedColumns]);

  useEffect(() => {
    console.log('ClusteringConfig State Update:');
    console.log('- Selected Columns:', selectedColumns);
    console.log('- Selected Count:', selectedColumns.length);
    console.log('- isLoading:', isLoading);
    console.log('- Button should be enabled:', !isLoading && selectedColumns.length >= 2);
  }, [selectedColumns, isLoading]);

  return (
    <div className="config-container">
      <h2>Cấu hình thuật toán CURE</h2>
      
      <div className="config-section">
        <h3>Tham số thuật toán</h3>
        
        <div className="form-group">
          <label htmlFor="num-clusters">Số lượng cụm:</label>
          <input
            id="num-clusters"
            type="number"
            min="2"
            max="20"
            value={numClusters}
            onChange={(e) => setNumClusters(parseInt(e.target.value))}
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="num-representatives">Số điểm đại diện mỗi cụm:</label>
          <input
            id="num-representatives"
            type="number"
            min="1"
            max="50"
            value={numRepresentatives}
            onChange={(e) => setNumRepresentatives(parseInt(e.target.value))}
          />
        </div>
        
        <div className="form-group">
          <label htmlFor="shrinking-factor">Hệ số co (0-1):</label>
          <input
            id="shrinking-factor"
            type="number"
            min="0"
            max="1"
            step="0.1"
            value={shrinkingFactor}
            onChange={(e) => setShrinkingFactor(parseFloat(e.target.value))}
          />
        </div>
      </div>
      
      <div className="config-section">
        <h3>Chọn các thuộc tính số cho phân cụm</h3>
        <div className="columns-list">
          {columns.map(column => (
            <div key={column} className="column-item">
              <input
                type="checkbox"
                id={`col-${column}`}
                checked={selectedColumns.includes(column)}
                onChange={() => handleColumnToggle(column)}
              />
              <label htmlFor={`col-${column}`}>{column}</label>
            </div>
          ))}
        </div>
      </div>
      
      {error && <p className="error">{error}</p>}
      
      <button 
        className="submit-button" 
        onClick={handleSubmit}
        disabled={isLoading || selectedColumns.length < 2}
      >
        {isLoading ? 'Đang xử lý...' : `Thực hiện phân cụm (${selectedColumns.length} cột đã chọn)`}
      </button>
    </div>
  );
}

export default ClusteringConfig;