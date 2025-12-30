import React from 'react';
import './Footer.css';

const Footer = () => {
  return (
    <footer className="footer">
      <div className="footer-content">
        <div className="footer-section">
          <div className="footer-logo">
            <span className="footer-logo-icon">🍽️</span>
            <span className="footer-logo-text">Campus<span className="footer-logo-highlight">Bites</span></span>
          </div>
          <p className="footer-description">
            Your one-stop solution for campus food management. 
            Order delicious meals with just a few clicks!
          </p>
          
        </div>



      </div>

      <div className="footer-bottom">
        <p>© 2026 CampusBites. All rights reserved.</p>
        <div className="footer-bottom-links">
          <p>Privacy Policy</p>
          <p>Terms of Service</p>
          <p>Cookie Policy</p>
        </div>
      </div>

      <div className="footer-waves">
        <svg viewBox="0 0 1200 120" preserveAspectRatio="none">
          <path d="M321.39,56.44c58-10.79,114.16-30.13,172-41.86,82.39-16.72,168.19-17.73,250.45-.39C823.78,31,906.67,72,985.66,92.83c70.05,18.48,146.53,26.09,214.34,3V0H0V27.35A600.21,600.21,0,0,0,321.39,56.44Z"></path>
        </svg>
      </div>
    </footer>
  );
};

export default Footer;