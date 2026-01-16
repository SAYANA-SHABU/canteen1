import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Navbar.css';

const Navbar = () => {
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const toggleMenu = () => {
    setIsMenuOpen(!isMenuOpen);
  };

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

  return (
    <nav className="navbar">
      <div className="nav-container">
     
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

        {/* Center: Tagline */}
        <div className="navbar-center">
          <div className="navbar-tagline">
            <span className="tagline-text">Fresh Food, Zero Delay, Just Eat.</span>
          </div>
        </div>

        {/* Right: Admin Login */}
        <div className="navbar-right">
          <div className="desktop-nav">
            <Link to="/admin/login" className="nav-link">
              <span className="nav-link-text">Admin Login</span>
            </Link>
          </div>
          {/* Mobile Menu Button */}
          <button className={`menu-button ${isMenuOpen ? 'active' : ''}`} onClick={toggleMenu}>
            <span className="menu-icon"></span>
            <span className="menu-icon"></span>
            <span className="menu-icon"></span>
          </button>
          {/* Dropdown Menu for Mobile */}
          <div className={`dropdown-menu ${isMenuOpen ? 'active' : ''}`}>
            <Link to="/admin/login" className="dropdown-item">
              <span className="dropdown-icon">🔑</span>
              <span className="dropdown-text">Admin Login</span>
              <span className="dropdown-arrow">→</span>
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;