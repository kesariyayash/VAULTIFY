import { useState, useEffect } from 'react';
import axios from 'axios';
// Ensure you have @heroicons/react installed: npm install @heroicons/react
import { TrashIcon } from '@heroicons/react/24/outline';

const API = import.meta.env.VITE_SERVER_URL;

// Helper function to truncate text (for file names)
const truncateFileName = (fileName, maxLength = 15) => {
  if (fileName.length <= maxLength) {
    return fileName;
  }
  const parts = fileName.split('.');
  const extension = parts.length > 1 ? parts.pop() : '';
  const name = parts.join('.');

  if (name.length <= maxLength - 3) { // Enough space for "..."
    return `${name.substring(0, maxLength - 3)}...${extension}`;
  }
  return `${name.substring(0, maxLength - 3)}...`; // If name is still too long, just truncate name
};


const ImageList = ({ images, onImageDeleteSuccess }) => {
  const [selectedImage, setSelectedImage] = useState(null);
  const [decryptionKey, setDecryptionKey] = useState('');
  const [decryptedImageSrc, setDecryptedImageSrc] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false); // General loading state for decrypt/delete

  const token = localStorage.getItem('token');

  const handleImageSelect = (image) => {
    setSelectedImage(image);
    setDecryptedImageSrc(null); // Clear previous decrypted image
    setDecryptionKey('');
    setError(''); // Clear any previous errors when selecting a new image
  };

  const handleDecryptionKeyChange = (e) => {
    setDecryptionKey(e.target.value);
  };

  const handleDecrypt = async (e) => {
    e.preventDefault();

    if (!selectedImage) {
      setError('Please select an image to decrypt.');
      return;
    }

    if (!decryptionKey) {
      setError('Please provide a decryption key.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Send selectedImage.gridFsFileId in the URL for decryption
      const response = await axios.post(`${API}/api/storage/view/${selectedImage.gridFsFileId}`, {
        encryptionKey: decryptionKey // Ensure key name matches backend (encryptionKey)
      }, {
        headers: { Authorization: `Bearer ${token}` },
        responseType: 'blob' // Tell Axios to expect binary data (Blob)
      });

      // Create an object URL from the Blob response for displaying the image
      const imageUrl = URL.createObjectURL(response.data);
      setDecryptedImageSrc(imageUrl);

    } catch (err) {
      console.error('Decryption error:', err.response || err);
      if (err.response) {
        // If the server sends an error, it might be JSON within a Blob
        if (err.response.data instanceof Blob) {
            const reader = new FileReader();
            reader.onload = function() {
                try {
                    const errorJson = JSON.parse(reader.result);
                    setError(errorJson.message || 'Failed to decrypt image. Please check your key and try again.');
                } catch (parseError) {
                    setError('Failed to decrypt image. An unknown error occurred.');
                }
            };
            reader.readAsText(err.response.data); // Read blob as text to parse JSON error
        } else {
            // Direct JSON error response
            setError(err.response.data.message || 'Failed to decrypt image. Please check your key and try again.');
        }
      } else if (err.request) {
        setError('No response from server. Check network connection or server status.');
      } else {
        setError('An unexpected error occurred during decryption.');
      }
    } finally {
      setLoading(false);
    }
  };

  // NEW: handle delete image function
  const handleDeleteImage = async (e, imageGridFsFileId, originalFileName) => {
    e.stopPropagation(); // Prevent triggering handleImageSelect when clicking the delete button
    if (!window.confirm(`Are you sure you want to delete "${originalFileName}"? This action cannot be undone.`)) {
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Send image.gridFsFileId for deletion
      const response = await axios.delete(`${API}/api/storage/${imageGridFsFileId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('Delete successful:', response.data);

      // Notify parent component (Dashboard) to refresh the image list
      if (onImageDeleteSuccess) {
        onImageDeleteSuccess();
      }

      // If the deleted image was currently selected for decryption, clear its details
      if (selectedImage?.gridFsFileId === imageGridFsFileId) {
        setSelectedImage(null);
        setDecryptedImageSrc(null);
      }
    } catch (err) {
      console.error('Delete error:', err.response || err);
      setError(err.response?.data?.message || 'Failed to delete image. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  // Clean up the object URL when the component unmounts or image changes
  useEffect(() => {
    return () => {
      if (decryptedImageSrc) {
        URL.revokeObjectURL(decryptedImageSrc);
      }
    };
  }, [decryptedImageSrc]);

  if (images.length === 0) {
    return (
      <div className="image-list-empty">
        <h2>Your Images</h2>
        <p>You haven't uploaded any images yet. Use the form above to upload your first encrypted image.</p>
      </div>
    );
  }

  return (
    <div className="image-list-container">
      <h2>Your Images</h2>

      {/* Display general error for both decrypt and delete */}
      {error && <div className="error-message">{error}</div>}

      <div className="image-grid">
        {images.map((image) => (
          <div
            key={image._id} // Use the metadata _id as key
            className={`image-item ${selectedImage?.gridFsFileId === image.gridFsFileId ? 'selected' : ''}`} // Compare gridFsFileId for selection highlight
            onClick={() => handleImageSelect(image)}
          >
            <div className="image-placeholder">
              {/* Display truncated file name */}
              <p className="file-name-display">{truncateFileName(image.originalFileName)}</p>
              <span>Encrypted Image</span>
              <span className="encryption-type">{image.encryptionType}</span>
            </div>
            <div className="image-info">
              <p>Uploaded: {new Date(image.uploadedAt).toLocaleDateString()}</p>
              {/* Delete Button */}
              <button
                className="delete-button red"
                onClick={(e) => handleDeleteImage(e, image.gridFsFileId, image.originalFileName)}
                disabled={loading} // Disable if any loading (decrypt/delete) is happening
              >
                <span>Delete</span>
              </button>
            </div>
          </div>
        ))}
      </div>

      {selectedImage && (
        <div className="image-detail">
          <h3>Decrypt Image</h3>

          {error && <div className="error-message">{error}</div>}

          <div className="image-info-detail">
            <p><strong>Original File:</strong> {selectedImage.originalFileName}</p>
            <p><strong>Encryption Type:</strong> {selectedImage.encryptionType}</p>
            <p><strong>Uploaded:</strong> {new Date(selectedImage.uploadedAt).toLocaleString()}</p>
          </div>

          <form onSubmit={handleDecrypt} className="decrypt-form">
            <div className="form-group">
              <label htmlFor="decryptionKey">Decryption Key</label>
              <input
                type="password"
                id="decryptionKey"
                value={decryptionKey}
                onChange={handleDecryptionKeyChange}
                required
                placeholder="Enter your decryption key"
              />
            </div>

            <button type="submit" className="decrypt-button" disabled={loading}>
              {loading ? 'Decrypting...' : 'Decrypt Image'}
            </button>
          </form>

          {decryptedImageSrc && (
            <div className="decrypted-image">
              <h4>Decrypted Image</h4>
              <img src={decryptedImageSrc} alt="Decrypted" style={{ maxWidth: '100%', height: 'auto' }} />
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ImageList;