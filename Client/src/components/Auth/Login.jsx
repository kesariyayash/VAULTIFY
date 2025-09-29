import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

const API = import.meta.env.VITE_SERVER_URL;
const Login = ({ setIsAuthenticated }) => {
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  
  // Apply theme from localStorage on component mount
  useEffect(() => {
    const currentTheme = localStorage.getItem('theme') || 'dark-theme';
    document.body.className = currentTheme;
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const response = await axios.post(`${API}/api/users/login`, formData);
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('userId', response.data.userId);
      setIsAuthenticated(true); // 🔑 This line ensures redirect works
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const toggleTheme = () => {
    const currentTheme = document.body.className === 'light-theme' ? 'dark-theme' : 'light-theme';
    document.body.className = currentTheme;
    localStorage.setItem('theme', currentTheme);
  };

  return (
    <div className="auth-container">
      <button className="theme-toggle" onClick={toggleTheme}>
        {document.body.className === 'light-theme' ? '🌙' : '☀️'}
      </button>
      <div className="auth-card animate-fade-in">
        <div className="auth-header">
          <div className="auth-logo">
            <img src="/favicon.png" alt="Vaultify Logo" className="logo-image pulse" />
            <h1 className="logo-text">Vaultify</h1>
          </div>
          <h3 className="auth-title">Beyond Pen Drives, Beyond Hard Drives</h3>
          <p className="auth-subtitle">Lock It. Store It. Access Anywhere.</p>
        </div>
        
        {error && <div className="error-message shake">{error}</div>}
        
        <form onSubmit={handleSubmit} className="register-form">
          <div className="input-group animate-slide-in" style={{animationDelay: '0.3s'}}>
            <span className="input-icon">📧</span>
            <input
              type="email"
              name="email"
              className="modern-input"
              placeholder="Email address"
              value={formData.email}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="input-group animate-slide-in" style={{animationDelay: '0.4s'}}>
            <span className="input-icon">🔒</span>
            <input
              type="password"
              id="password"
              name="password"
              className="modern-input"
              value={formData.password}
              onChange={handleChange}
              placeholder="Password"
              required
            />
          </div>
          
          <button type="submit" className="auth-button gradient-button animate-slide-in" style={{animationDelay: '0.5s'}} disabled={loading}>
            {loading ? 
              <span className="loading-spinner"><span className="spinner"></span>Logging in...</span> : 
              'Log In'
            }
          </button>
          
          <div className="auth-redirect">
            Don't have an account? <Link to="/register" className="text-accent hover-effect">Create Account</Link>
          </div>
        </form>
        
        <div className="security-features">
          <div className="security-badge">
            <span className="security-icon">🔐</span>
            <span>AES-256 Encryption</span>
          </div>
          <div className="security-badge">
            <span className="security-icon">🛡️</span>
            <span>Secure Storage</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
