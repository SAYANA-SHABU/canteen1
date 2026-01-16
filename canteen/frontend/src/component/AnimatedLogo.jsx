import React, { useState, useEffect, useRef } from 'react';
import './AnimatedLogo.css';

const AnimatedLogo = ({ onAnimationComplete, theme = 'peacock-blue' }) => {
  const [showTitle, setShowTitle] = useState(false);
  const [showSubtitle, setShowSubtitle] = useState(false);
  const [isVideoLoaded, setIsVideoLoaded] = useState(false);
  const [isVisible, setIsVisible] = useState(true);
  const videoRef = useRef(null);
  const containerRef = useRef(null);

  useEffect(() => {
    // Start animations after video loads or after timeout
    const timer = setTimeout(() => {
      setShowTitle(true);
      setTimeout(() => setShowSubtitle(true), 600);
    }, isVideoLoaded ? 400 : 1200);

    // Auto-hide after 5 seconds
    const hideTimer = setTimeout(() => {
      setIsVisible(false);
      if (onAnimationComplete) {
        onAnimationComplete();
      }
    }, 5000);

    return () => {
      clearTimeout(timer);
      clearTimeout(hideTimer);
    };
  }, [isVideoLoaded, onAnimationComplete]);

  const handleVideoLoad = () => {
    setIsVideoLoaded(true);
  };

  const handleVideoError = () => {
    console.warn('Video failed to load, using fallback');
    setIsVideoLoaded(true);
  };

  // Generate floating particles dynamically
  const particles = Array.from({ length: 20 }, (_, i) => (
    <div
      key={i}
      className="particle"
      style={{
        left: `${Math.random() * 100}%`,
        animationDelay: `${Math.random() * 10}s`,
      }}
    />
  ));

  if (!isVisible) return null;

  return (
    <div 
      ref={containerRef}
      className={`animated-logo-container ${!isVisible ? 'hidden' : ''}`}
      data-theme={theme}
    >
      <div className="floating-particles">
        {particles}
      </div>
      <div className="logo-content">
        <div className="video-container">
          <video 
            ref={videoRef}
            autoPlay 
            muted 
            loop 
            playsInline
            className="round-video"
            onLoadedData={handleVideoLoad}
            onError={handleVideoError}
            preload="auto"
          >
            <source src="/video.mp4" type="video/mp4" />
            <source src="/video.webm" type="video/webm" />
            <img 
              src="https://ai-images.s3.eu-central-1.wasabisys.com/29707693/1013247/e4b06c54-a275-495c-9bbb-df8b0158b-03.png" 
              alt="CampusBites Logo"
              onLoad={handleVideoLoad}
            />
          </video>
        </div>
        
        <h1 className={`logo-title ${showTitle ? '' : ''}`}>
          Campus<span className="logo-highlight">Bites</span>
        </h1>
        
        <p className={`logo-subtitle ${showSubtitle ? '' : ''}`}>
          Smart Canteen Management System
        </p>
        
        <div className="loading-bar">
          <div className="loading-progress"></div>
        </div>
      </div>
    </div>
  );
};

export default AnimatedLogo;