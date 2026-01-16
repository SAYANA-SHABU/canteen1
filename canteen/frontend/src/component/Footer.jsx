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

    
    </footer>
  );
};

export default Footer;