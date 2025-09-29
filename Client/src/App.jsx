import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import Login from './components/Auth/Login'
import Register from './components/Auth/Register'
import Dashboard from './components/Dashboard/Dashboard'
import Home from './components/Home'
import LandingAnimation from './components/LandingAnimation'
import './index.css'

function App() {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [theme, setTheme] = useState('dark-theme');
  const [showLanding, setShowLanding] = useState(true);
  
  useEffect(() => {
    const token = localStorage.getItem('token');
    const userId = localStorage.getItem('userId');
    
    if (token && userId) {
      setIsAuthenticated(true);
    }
    
    // Check for saved theme preference
    const savedTheme = localStorage.getItem('theme') || 'dark-theme';
    setTheme(savedTheme);
    document.body.className = savedTheme;
    
    // Hide landing animation after first visit
    const hasVisited = sessionStorage.getItem('hasVisited');
    if (hasVisited) {
      setShowLanding(false);
    } else {
      sessionStorage.setItem('hasVisited', 'true');
    }
  }, []);
  
  const toggleTheme = () => {
    const newTheme = theme === 'dark-theme' ? 'light-theme' : 'dark-theme';
    setTheme(newTheme);
    document.body.className = newTheme;
    localStorage.setItem('theme', newTheme);
  };
  
  const ProtectedRoute = ({ children }) => {
    return isAuthenticated ? children : <Navigate to="/login" />;
  };
  
  return (
    <Router>
      {showLanding && <LandingAnimation />}
      
      <div className="theme-toggle" onClick={toggleTheme}>
        {theme === 'dark-theme' ? '☀️' : '🌙'}
      </div>
      
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login setIsAuthenticated={setIsAuthenticated} />} />
        <Route path="/register" element={<Register />} />
        <Route 
          path="/dashboard" 
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          } 
        />
      </Routes>
    </Router>
  )
}

export default App;
