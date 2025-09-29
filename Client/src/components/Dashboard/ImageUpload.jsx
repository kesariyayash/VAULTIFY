import { useState } from 'react';
import axios from 'axios';

const API = import.meta.env.VITE_SERVER_URL;

const ImageUpload = ({ onUploadSuccess }) => {
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState(null);
  const [encryptionType, setEncryptionType] = useState('AES'); // Default to AES
  const [encryptionKey, setEncryptionKey] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const token = localStorage.getItem('token'); // Get token from localStorage

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      // Validate file type
      const validTypes = ['image/jpeg', 'image/png', 'image/jpg', 'image/gif'];
      if (!validTypes.includes(selectedFile.type)) {
        setError('Invalid file type. Only JPG, PNG, and GIF images are allowed.');
        setFile(null);
        setPreview(null);
        e.target.value = '';
        return;
      }
      
      // Validate file size (5MB limit)
      const maxSize = 5 * 1024 * 1024; // 5MB in bytes
      if (selectedFile.size > maxSize) {
        setError('File size exceeds 5MB limit. Please select a smaller image.');
        setFile(null);
        setPreview(null);
        e.target.value = '';
        return;
      }
      
      setFile(selectedFile);
      // Create a preview URL for the selected image
      const previewUrl = URL.createObjectURL(selectedFile);
      setPreview(previewUrl);
      setError(''); // Clear any previous errors
    } else {
      setFile(null);
      setPreview(null);
    }
  };

  const handleEncryptionTypeChange = (e) => {
    setEncryptionType(e.target.value);
    setError('');
  };

  const handleEncryptionKeyChange = (e) => {
    setEncryptionKey(e.target.value);
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!file) {
      setError('Please select an image to upload.');
      return;
    }

    if (!encryptionKey) {
      setError('Please provide an encryption key.');
      return;
    }

    setLoading(true);
    setError('');

    const formData = new FormData();
    formData.append('imageFile', file); // Append the actual file
    formData.append('encryptionType', encryptionType);
    formData.append('encryptionKey', encryptionKey);

    try {
      const response = await axios.post(`${API}/api/storage/upload`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data', // Axios handles this automatically with FormData, but good to know
          'Authorization': `Bearer ${token}` // Send the token
        },
      });

      console.log('Upload successful:', response.data);
      // Reset form after successful upload
      setFile(null);
      setPreview(null);
      setEncryptionKey('');
      document.getElementById('image').value = ''; // Clear file input display

      // Notify parent component of successful upload
      onUploadSuccess();

    } catch (err) {
      console.error('Upload error:', err.response || err);
      if (err.response) {
        setError(err.response.data.message || 'Failed to upload image. Please try again.');
      } else if (err.request) {
        setError('No response from server. Check network connection or server status.');
      } else {
        setError('An unexpected error occurred during upload.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="upload-container">
      <h2>Upload Encrypted Image</h2>

      {error && <div className="error-message">{error}</div>}

      <form onSubmit={handleSubmit} className="upload-form">
        <div className="form-group">
          <label htmlFor="image">
            <div className="file-upload-label">
              <span className="file-icon">📁</span>
              <span className="file-specs">Select Image</span>
              <span className="file-specs">Formats: PNG, JPG, JPEG, GIF • Max size: 5MB</span>
            </div>
          </label>
          <input
            type="file"
            id="image"
            accept="image/png, image/jpeg, image/jpg, image/gif"
            onChange={handleFileChange}
            required
            className="file-input"
          />
        </div>

        {preview && (
          <div className="image-preview">
            <h3>Preview</h3>
            <img src={preview} alt="Preview" style={{ maxWidth: '100%', maxHeight: '200px', objectFit: 'contain' }} />
            <div className="image-info">
              {file && <span>{file.name} ({Math.round(file.size / 1024)} KB)</span>}
            </div>
          </div>
        )}

        <div className="form-group">
          <label htmlFor="encryptionType">Encryption Type</label>
          <div className="encryption-badge">
            <span className="encryption-icon">🔒</span>
            <span>AES-256 Encryption</span>
          </div>
          <input
            type="hidden"
            id="encryptionType"
            value="AES"
            name="encryptionType"
          />
        </div>

        <div className="form-group">
          <label htmlFor="encryptionKey">Encryption Key</label>
          <input
            type="password"
            id="encryptionKey"
            value={encryptionKey}
            onChange={handleEncryptionKeyChange}
            required
            placeholder="Enter your encryption key"
          />
        </div>

        <button type="submit" className="upload-button" disabled={loading}>
          {loading ? 'Uploading...' : 'Upload Image'}
        </button>
      </form>
    </div>
  );
};

export default ImageUpload;