import React from 'react';
import './HeroSection.css';

const HeroSection = () => {
  // Generate floating particles dynamically (unique background effect)
  const particles = Array.from({ length: 20 }, (_, i) => (
    <div
      key={i}
      className="hero-particle"
      style={{
        left: `${Math.random() * 100}%`,
        animationDelay: `${Math.random() * 10}s`,
        animationDuration: `${5 + Math.random() * 5}s`,
      }}
    />
  ));

  return (
    <div className="hero-section">
      {/* Unique particle background */}
      <div className="hero-particles">
        {particles}
      </div>
      
      <div className="hero-content">
        <div className="hero-text">
          <h1 className="hero-title animate-slide-up">
            Delicious <span className="highlight">Food</span> 
            <br />Just a Click Away!
          </h1>
          <p className="hero-subtitle animate-fade-in">
            Order your favorite meals from campus canteen with our 
            smart management system. Fast delivery, fresh food, 
            and amazing discounts!
          </p>
        
        </div>
        
        <div className="hero-image animate-slide-right">
          <img 
            src="https://images.unsplash.com/photo-1555396273-367ea4eb4db5?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" 
            alt="Delicious Food"
            className="hero-main-image"
          />
          
          {/* Enhanced floating images with unique icons */}
          <div className="floating-images">
            <img 
              src="https://images.unsplash.com/photo-1513104890138-7c749659a591?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80" 
              alt="Pizza"
              className="floating-image floating-1"
            />
            <img 
              src="https://images.unsplash.com/photo-1559715745-e1b33a271c8f?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80" 
              alt="Burger"
              className="floating-image floating-2"
            />
            <img 
              src="https://images.unsplash.com/photo-1565958011703-44f9829ba187?ixlib=rb-4.0.3&auto=format&fit=crop&w=300&q=80" 
              alt="Salad"
              className="floating-image floating-3"
            />
            
            {/* New: Floating food icons for uniqueness */}
            <div className="floating-icon floating-icon-1">🍕</div>
            <div className="floating-icon floating-icon-2">🍔</div>
            <div className="floating-icon floating-icon-3">🥗</div>
          </div>
        </div>
      </div>
    
    </div>
  );
};

export default HeroSection;