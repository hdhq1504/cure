import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';

function FileUpload({ setUploadedFile, setColumns }) {
  const [file, setFile] = useState(null);
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile && selectedFile.type === 'text/csv') {
      setFile(selectedFile);
      setError('');
    } else {
      setFile(null);
      setError('Vui lòng chọn file CSV');
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Vui lòng chọn file trước khi tải lên');
      return;
    }

    setIsLoading(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const response = await axios.post('http://localhost:8000/api/columns/', formData);
      setColumns(response.data);
      setUploadedFile(file);
      setIsLoading(false);
      navigate('/config');
    } catch (error) {
      setIsLoading(false);
      setError(`Lỗi: ${error.response?.data?.detail || error.message}`);
    }
  };

  return (
    <div className="upload-container">
      <h2>Tải lên dữ liệu khách hàng</h2>
      <p>Vui lòng chọn file CSV chứa dữ liệu khách hàng để thực hiện phân cụm với thuật toán CURE.</p>
      
      <div className="file-input">
        <input
          type="file"
          id="csv-file"
          accept=".csv"
          onChange={handleFileChange}
        />
        <label htmlFor="csv-file">Chọn file CSV</label>
        {file && <span className="file-name">{file.name}</span>}
      </div>
      
      {error && <p className="error">{error}</p>}
      
      <button 
        className="upload-button" 
        onClick={handleUpload} 
        disabled={!file || isLoading}
      >
        {isLoading ? 'Đang xử lý...' : 'Tải lên'}
      </button>
    </div>
  );
}

export default FileUpload;