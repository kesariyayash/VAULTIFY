import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import axios from 'axios';

const API = import.meta.env.VITE_SERVER_URL;
const Register = () => {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  
  // Apply theme from localStorage on component mount
  useEffect(() => {
    const currentTheme = localStorage.getItem('theme') || 'dark-theme';
    document.body.className = currentTheme;
  }, []);
  
  const toggleTheme = () => {
    const currentTheme = document.body.className === 'light-theme' ? 'dark-theme' : 'light-theme';
    document.body.className = currentTheme;
    localStorage.setItem('theme', currentTheme);
  };

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
    
    // Validate passwords match
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      setLoading(false);
      return;
    }
    
    try {
      await axios.post(`${API}/api/users/signup`, {
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        password: formData.password
      });
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
    }
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
          <h2 className="auth-title">Create Your Account</h2>
          <p className="auth-subtitle">Secure your files with military-grade encryption</p>
        </div>
        
        {error && <div className="error-message shake">{error}</div>}
        
        <form onSubmit={handleSubmit} className="register-form">
          <div className="form-row">
            <div className="form-column">
              <div className="input-group animate-slide-in" style={{animationDelay: '0.1s'}}>
                <span className="input-icon">👤</span>
                <input
                  type="text"
                  name="firstName"
                  className="modern-input"
                  placeholder="First Name"
                  value={formData.firstName}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
            <div className="form-column">
              <div className="input-group animate-slide-in" style={{animationDelay: '0.2s'}}>
                <span className="input-icon">👤</span>
                <input
                  type="text"
                  name="lastName"
                  className="modern-input"
                  placeholder="Last Name"
                  value={formData.lastName}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>
          </div>
          
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
              placeholder="Password (min 8 characters)"
              required
              minLength="8"
            />
          </div>
          
          <div className="input-group animate-slide-in" style={{animationDelay: '0.5s'}}>
            <span className="input-icon">🔒</span>
            <input
              type="password"
              id="confirmPassword"
              name="confirmPassword"
              className="modern-input"
              value={formData.confirmPassword}
              onChange={handleChange}
              placeholder="Confirm password"
              required
              minLength="8"
            />
          </div>
          
          <button type="submit" className="auth-button gradient-button animate-slide-in" style={{animationDelay: '0.6s'}} disabled={loading}>
            {loading ? 
              <span className="loading-spinner"><span className="spinner"></span>Creating Account...</span> : 
              'Create Account'
            }
          </button>
          
          <div className="auth-redirect">
            Already have an account? <Link to="/login" className="text-accent hover-effect">Log In</Link>
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

export default Register;