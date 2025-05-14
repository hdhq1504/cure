import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import FileUpload from './components/FileUpload';
import ClusteringConfig from './components/ClusteringConfig';
import ClusteringResults from './components/ClusteringResults';
import './App.css';

function App() {
  const [uploadedFile, setUploadedFile] = useState(null);
  const [columns, setColumns] = useState([]);
  const [clusteringResults, setClusteringResults] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  return (
    <Router>
      <div className="app">
        <header className="app-header">
          <h1>Phân cụm dữ liệu khách hàng với CURE</h1>
          <nav>
            <ul>
              <li><Link to="/">Tải dữ liệu</Link></li>
              {uploadedFile && <li><Link to="/config">Cấu hình phân cụm</Link></li>}
              {clusteringResults && <li><Link to="/results">Kết quả</Link></li>}
            </ul>
          </nav>
        </header>
        
        <main className="app-content">
          <Routes>
            <Route path="/" element={
              <FileUpload 
                setUploadedFile={setUploadedFile} 
                setColumns={setColumns}
              />
            } />
            <Route path="/config" element={
              <ClusteringConfig 
                uploadedFile={uploadedFile}
                columns={columns}
                setClusteringResults={setClusteringResults}
                setIsLoading={setIsLoading}
                isLoading={isLoading}
              />
            } />
            <Route path="/results" element={
              <ClusteringResults results={clusteringResults} />
            } />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;