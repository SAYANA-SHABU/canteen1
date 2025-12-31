import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Navbar.css';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.nav-container') && !event.target.closest('.menu-button')) {
        setIsMenuOpen(false);
      }
    };

    if (isMenuOpen) {
      document.addEventListener('click', handleClickOutside);
    }

    return () => {
      document.removeEventListener('click', handleClickOutside);
    };
  }, [isMenuOpen]);

  // Generate floating particles dynamically
  const particles = Array.from({ length: 15 }, (_, i) => (
    <div
      key={i}
      className="particle"
      style={{
        left: `${Math.random() * 100}%`,
        animationDelay: `${Math.random() * 8}s`,
      }}
    />
  ));

  return (
    <nav className="navbar">
      <div className="floating-particles">
        {particles}
      </div>
      <div className="nav-container">
        {/* Left: Logo + Name */}
        <Link to="/" className="logo-link">
          <div className="logo-section">
            <div className="logo-image-container">
              <img 
                src='/img.png' 
                alt="CampusBites Logo"
                className="logo-image"
              />
            </div>
            <div className="logo-text-container">
              <span className="logo-text">Campus</span>
              <span className="logo-highlight">Bites</span>
            </div>
          </div>
        </Link>

        {/* Center: Tagline */}
        <div className="navbar-center">
          <div className="navbar-tagline">
            <span className="tagline-text"><i>Fresh Food, Zero Delay, Just Eat..</i></span>
          </div>
        </div>

        
        <div className="navbar-right">
          <div className="desktop-nav">
            <Link to="/admin/login" className="nav-link">
              <span className="nav-link-text">Admin Login</span>
            </Link>
          </div>
        </div> 
      </div>
    </nav>
  );
};


export default Navbar;
