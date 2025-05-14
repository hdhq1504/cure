import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import Papa from 'papaparse';

function ClusteringConfig({ uploadedFile, columns, setClusteringResults, setIsLoading, isLoading }) {
  const [numClusters, setNumClusters] = useState(3);
  const [numRepresentatives, setNumRepresentatives] = useState(10);
  const [shrinkingFactor, setShrinkingFactor] = useState(0.2);
  const [selectedColumns, setSelectedColumns] = useState([]);
  const [numericColumns, setNumericColumns] = useState([]);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  // Kiểm tra và phân loại các cột số
  useEffect(() => {
    if (uploadedFile) {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const text = e.target.result;
        Papa.parse(text, {
          header: true,
          dynamicTyping: true,
          skipEmptyLines: true,
          complete: (results) => {
            const numeric = columns.filter(column => {
              const values = results.data.map(row => row[column]).filter(val => val !== '' && val !== undefined && val !== null);
              return values.length > 0 && values.every(val => !isNaN(val) && val !== true && val !== false);
            });
            setNumericColumns(numeric);
            console.log('Numeric columns detected:', numeric);
            
            // Tự động chọn các cột số (tối đa 5 cột)
            if (numeric.length > 0) {
              setSelectedColumns(numeric.slice(0, Math.min(5, numeric.length)));
            }
          }
        });
      };
      reader.readAsText(uploadedFile);
    }
  }, [uploadedFile, columns]);

  const handleColumnToggle = (column) => {
    const newSelectedColumns = selectedColumns.includes(column) 
      ? selectedColumns.filter(col => col !== column)
      : [...selectedColumns, column];
    
    setSelectedColumns(newSelectedColumns);
  };

  const handleSelectAllColumns = () => {
    setSelectedColumns([...numericColumns]);
  };

  const handleClearSelection = () => {
    setSelectedColumns([]);
  };

  const handleSubmit = async () => {
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

  return (
    <div className="config-container p-4 bg-gray-50 rounded-lg shadow">
      <h2 className="text-2xl font-bold mb-4 text-blue-700">Cấu hình thuật toán CURE</h2>
      
      <div className="config-section mb-6 bg-white p-4 rounded shadow">
        <h3 className="text-lg font-semibold mb-3 text-gray-800">Tham số thuật toán</h3>
        
        <div className="form-group mb-3">
          <label htmlFor="num-clusters" className="block text-sm font-medium text-gray-700 mb-1">Số lượng cụm (2-10):</label>
          <input
            id="num-clusters"
            type="number"
            min="2"
            max="20"
            value={numClusters}
            onChange={(e) => setNumClusters(parseInt(e.target.value))}
            className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        
        <div className="form-group mb-3">
          <label htmlFor="num-representatives" className="block text-sm font-medium text-gray-700 mb-1">Số điểm đại diện mỗi cụm (5-20):</label>
          <input
            id="num-representatives"
            type="number"
            min="1"
            max="50"
            value={numRepresentatives}
            onChange={(e) => setNumRepresentatives(parseInt(e.target.value))}
            className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
        
        <div className="form-group mb-3">
          <label htmlFor="shrinking-factor" className="block text-sm font-medium text-gray-700 mb-1">Hệ số co (0-1):</label>
          <input
            id="shrinking-factor"
            type="number"
            min="0"
            max="1"
            step="0.1"
            value={shrinkingFactor}
            onChange={(e) => setShrinkingFactor(parseFloat(e.target.value))}
            className="px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>
      
      <div className="config-section mb-6 bg-white p-4 rounded shadow">
        <h3 className="text-lg font-semibold mb-3 text-gray-800">Chọn các thuộc tính số cho phân cụm</h3>
        
        <div className="mb-3 flex gap-2">
          <button 
            onClick={handleSelectAllColumns}
            className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700"
            disabled={numericColumns.length === 0}
          >
            Chọn tất cả
          </button>
          <button 
            onClick={handleClearSelection}
            className="px-3 py-1 text-sm bg-gray-600 text-white rounded hover:bg-gray-700"
            disabled={selectedColumns.length === 0}
          >
            Bỏ chọn tất cả
          </button>
        </div>
        
        <div className="columns-list grid grid-cols-2 md:grid-cols-3 gap-2">
          {columns.map(column => (
            <div key={column} className={`column-item p-2 rounded ${numericColumns.includes(column) ? 'bg-gray-50' : 'bg-gray-100'}`}>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id={`col-${column}`}
                  checked={selectedColumns.includes(column)}
                  onChange={() => handleColumnToggle(column)}
                  disabled={!numericColumns.includes(column)}
                  className="mr-2 h-4 w-4 text-blue-600 focus:ring-blue-500 rounded"
                />
                <label htmlFor={`col-${column}`} className={`text-sm ${!numericColumns.includes(column) ? 'text-gray-500' : ''}`}>
                  {column} 
                  {!numericColumns.includes(column) && <span className="block text-xs text-red-500">(không phải dữ liệu số)</span>}
                </label>
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-4 text-sm text-gray-700">
          <p>Đã chọn {selectedColumns.length}/{numericColumns.length} cột số.</p>
          {selectedColumns.length > 0 && (
            <p className="mt-1">Các cột đã chọn: {selectedColumns.join(', ')}</p>
          )}
        </div>
      </div>
      
      {error && <p className="error p-3 bg-red-100 text-red-700 rounded mb-4">{error}</p>}
      
      <button 
        className={`submit-button py-2 px-6 rounded font-medium text-white 
          ${isLoading || selectedColumns.length < 2 ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`} 
        onClick={handleSubmit}
        disabled={isLoading || selectedColumns.length < 2}
      >
        {isLoading ? 'Đang xử lý...' : `Thực hiện phân cụm (${selectedColumns.length} cột đã chọn)`}
      </button>
    </div>
  );
}

export default ClusteringConfig;