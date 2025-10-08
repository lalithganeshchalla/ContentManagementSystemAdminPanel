import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';

// ✅ CORRECT API BASE - Change this if your backend is on different port
const API_BASE = 'http://localhost:2148/api';

function App() {
  const [content, setContent] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    image: null
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [serverStatus, setServerStatus] = useState('checking...');

  // ✅ Check server health
  const checkServerHealth = async () => {
    try {
      const response = await axios.get(`${API_BASE}/health`);
      if (response.data.success) {
        setServerStatus('✅ Connected');
        console.log('✅ Server is running:', response.data);
      }
    } catch (error) {
      setServerStatus('❌ Disconnected');
      console.error('❌ Server health check failed:', error);
    }
  };

  // ✅ Fetch all content
  const fetchContent = async () => {
    try {
      console.log('🔄 Fetching content from:', `${API_BASE}/content`);
      const response = await axios.get(`${API_BASE}/content`);
      
      if (response.data.success) {
        console.log('✅ Content fetched successfully');
        setContent(response.data.data);
        setMessage('');
      } else {
        setMessage('Server error: ' + (response.data.message || 'Unknown error'));
      }
    } catch (error) {
      console.error('❌ Error fetching content:', error);
      if (error.response) {
        setMessage(`Error: ${error.response.status} - ${error.response.statusText}`);
      } else if (error.request) {
        setMessage('Cannot connect to server. Make sure backend is running on port 2148!');
      } else {
        setMessage('Error: ' + error.message);
      }
    }
  };

  useEffect(() => {
    checkServerHealth();
    fetchContent();
  }, []);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle file input
  const handleFileChange = (e) => {
    setFormData(prev => ({
      ...prev,
      image: e.target.files[0]
    }));
  };

  // Handle form submission
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.title || !formData.description || !formData.image) {
      setMessage('Please fill all fields and select an image');
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const data = new FormData();
      data.append('title', formData.title);
      data.append('description', formData.description);
      data.append('image', formData.image);

      const response = await axios.post(`${API_BASE}/content`, data, {
        headers: {
          'Content-Type': 'multipart/form-data'
        }
      });

      if (response.data.success) {
        setMessage('✅ Content added successfully!');
        setFormData({ title: '', description: '', image: null });
        
        // Clear file input
        const fileInput = document.getElementById('imageInput');
        if (fileInput) fileInput.value = '';
        
        // Update content list immediately
        setContent(prevContent => [response.data.data, ...prevContent]);
      }
    } catch (error) {
      console.error('Error adding content:', error);
      setMessage('❌ Error adding content: ' + (error.response?.data?.message || error.message));
    } finally {
      setLoading(false);
    }
  };

  // Delete content
  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this item?')) {
      try {
        const response = await axios.delete(`${API_BASE}/content/${id}`);
        if (response.data.success) {
          setMessage('✅ Content deleted successfully!');
          setContent(prevContent => prevContent.filter(item => item.id !== id));
        }
      } catch (error) {
        setMessage('❌ Error deleting content: ' + error.message);
      }
    }
  };

  return (
    <div className="App">
      <header className="app-header">
        <h1>📱 Content Management Admin</h1>
        <p>Add content here, it will appear in the Flutter app</p>
        <div className="server-info">
          <div className="server-status">
            <strong>Server:</strong> {API_BASE.replace('/api', '')}
          </div>
          <div className="server-status">
            <strong>Status:</strong> {serverStatus}
          </div>
        </div>
      </header>

      {/* Add Content Form */}
      <div className="form-section">
        <h2>➕ Add New Content</h2>
        
        {message && (
          <div className={`message ${message.includes('✅') ? 'success' : 'error'}`}>
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="content-form">
          <div className="form-group">
            <label>Title:</label>
            <input
              type="text"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="Enter title..."
              required
            />
          </div>

          <div className="form-group">
            <label>Description:</label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Enter description..."
              rows="4"
              required
            />
          </div>

          <div className="form-group">
            <label>Image:</label>
            <input
              id="imageInput"
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              required
            />
          </div>

          <button type="submit" disabled={loading} className="submit-btn">
            {loading ? '⏳ Adding...' : '📤 Add Content'}
          </button>
        </form>
      </div>

      {/* Content List */}
      <div className="content-section">
        <div className="section-header">
          <h2>📋 Managed Content ({content.length} items)</h2>
          <button onClick={fetchContent} className="refresh-btn">
            🔄 Refresh
          </button>
        </div>
        
        {content.length === 0 ? (
          <div className="no-content">
            <p>No content yet. Add some above!</p>
            <div className="help-text">
              <p><strong>Having connection issues?</strong></p>
              <ul>
                <li>Make sure backend server is running on port 2148</li>
                <li>Check if the URL is correct: {API_BASE}/content</li>
                <li>Ensure no firewall is blocking the connection</li>
              </ul>
            </div>
          </div>
        ) : (
          <div className="content-grid">
            {content.map(item => (
              <div key={item.id} className="content-card">
                <div className="card-image">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.title} />
                  ) : (
                    <div className="no-image">📷 No Image</div>
                  )}
                </div>
                <div className="card-content">
                  <h3>{item.title}</h3>
                  <p>{item.description}</p>
                  <div className="card-meta">
                    <small>Added: {new Date(item.createdAt).toLocaleDateString()}</small>
                    <small>ID: {item.id}</small>
                  </div>
                </div>
                <div className="card-actions">
                  <button 
                    onClick={() => handleDelete(item.id)}
                    className="delete-btn"
                  >
                    🗑️ Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default App;