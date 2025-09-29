import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import ImageUpload from './ImageUpload';
import ImageList from './ImageList';

const API = import.meta.env.VITE_SERVER_URL;
const Dashboard = () => {
  const [images, setImages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [userData, setUserData] = useState(null);
  const navigate = useNavigate();

  const token = localStorage.getItem('token');
  const userId = localStorage.getItem('userId');

  // Function to fetch user's images
  const fetchImages = async () => {
    setLoading(true); // Set loading true before fetch
    setError(''); // Clear any previous errors
    console.log('Frontend: fetchImages called.');
    console.log('Frontend: Token in localStorage:', token);
    console.log('Frontend: userId in localStorage:', userId);

    try {
      const response = await axios.get(`${API}/api/storage/my-images`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      console.log('Frontend: Image fetch response:', response.data);
      setImages(response.data.images || []);
    } catch (err) {
      console.error('Frontend: Failed to load images error:', err);
      setError(err.response?.data?.message || 'Failed to load images. Please try again.');
      if (err.response?.status === 401) {
        // Token expired or invalid
        localStorage.removeItem('token');
        localStorage.removeItem('userId');
        navigate('/login');
      }
    } finally {
      setLoading(false);
    }
  };

  // Function to fetch user data
  const fetchUserData = async () => {
    try {
      const response = await axios.get(`${API}/api/users/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      setUserData(response.data);
    } catch (err) {
      console.error('Error fetching user data:', err);
    }
  };

  // useEffect to check authentication and fetch images on component mount
  useEffect(() => {
    console.log('Frontend: Dashboard useEffect running.');
    // Check if user is authenticated
    if (!token || !userId) {
      console.log('Frontend: No token or userId found, navigating to login.');
      navigate('/login');
      return;
    }

    // Fetch user data and images
    fetchUserData();
    console.log('Frontend: Calling fetchImages.');
    fetchImages();
  }, [token, userId, navigate]); // Dependencies for useEffect

  // Handler for user logout
  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userId');
    navigate('/login');
  };

  // Handler for successful image upload (to refresh the list)
  const handleImageUploadSuccess = () => {
    fetchImages(); // Refresh the image list after upload
  };

  // NEW: Handler for successful image deletion (to refresh the list)
  const handleImageDeleteSuccess = () => {
    fetchImages(); // Refresh the image list after deletion
  };

  // const fname = userData.firstName.charAt(0).toUpperCase() + userData?.firstName?.slice(1);

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <div className="welcome-container">
          <h1 className="welcome-message">
            {userData ? `Welcome back, ${userData.firstName}!` : 'Welcome to Vaultify!'}
          </h1>
          <p className="welcome-subtitle">Your secure encrypted vaultify dashboard.</p>
        </div>
        <button onClick={handleLogout} className="logout-button">
          Logout
        </button>
      </header>

      {error && <div className="error-message">{error}</div>}

      <div className="dashboard-content">
        {/* Pass the upload success handler to ImageUpload component */}
        <ImageUpload onUploadSuccess={handleImageUploadSuccess} />

        {/* Conditionally render loading message or ImageList */}
        {loading ? (
          <div className="loading-message">Loading your images...</div>
        ) : (
          // UPDATED: Pass the delete success handler to ImageList component
          <ImageList images={images} onImageDeleteSuccess={handleImageDeleteSuccess} />
        )}
      </div>
    </div>
  );
};

export default Dashboard;