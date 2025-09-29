import React, { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import '../index.css';

const LandingAnimation = () => {
  const [animationComplete, setAnimationComplete] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  
  useEffect(() => {
    // Complete animation after 2.5 seconds
    const timer = setTimeout(() => {
      setAnimationComplete(true);
      
      // Redirect to login or the original intended route
      const intendedPath = location.state?.from || '/login';
      navigate(intendedPath, { replace: true });
    }, 2500);
    
    return () => clearTimeout(timer);
  }, [navigate, location]);
  
  return (
    <div className="landing-animation">
      <div className="logo-container">
        <svg className="logo-svg" xmlns="http://www.w3.org/2000/svg" width="120" height="120" viewBox="0 0 64 64">
          <defs>
            <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#4a00e0" />
              <stop offset="100%" stopColor="#8e2de2" />
            </linearGradient>
          </defs>
          <circle className="logo-circle" cx="32" cy="32" r="30" fill="url(#gradient)" stroke="#ffffff" strokeWidth="2" />
          <path className="logo-path" d="M32 18c-7.732 0-14 6.268-14 14 0 7.732 6.268 14 14 14 7.732 0 14-6.268 14-14 0-7.732-6.268-14-14-14zm0 4c5.523 0 10 4.477 10 10 0 5.523-4.477 10-10 10-5.523 0-10-4.477-10-10 0-5.523 4.477-10 10-10zm0 4c-3.314 0-6 2.686-6 6s2.686 6 6 6 6-2.686 6-6-2.686-6-6-6zm0 3c1.657 0 3 1.343 3 3s-1.343 3-3 3-3-1.343-3-3 1.343-3 3-3z" fill="white" />
        </svg>
        <h1 className="app-name">Vaultify</h1>
        <p className="tagline">Secure. Encrypted. Protected.</p>
      </div>
    </div>
  );
};

export default LandingAnimation;