import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './HeroSection.css';

const HeroSection = () => {
  const [readyOrders, setReadyOrders] = useState([]);

  // Fetch orders that are ready for collection
  const fetchReadyOrders = async () => {
    try {
      const res = await axios.get("http://localhost:5000/orders");
      const ready = res.data.filter(order => order.status === 'ready');
      setReadyOrders(ready);
    } catch (err) {
      console.error("Failed to fetch ready orders:", err);
    }
  };

  useEffect(() => {
    fetchReadyOrders();
    
    const interval = setInterval(() => {
      fetchReadyOrders();
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="hero-section">
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
          <button className="cta-button">Order Now</button>
        </div>
        
        <div className="hero-image animate-slide-right">
          <img 
            src="https://images.unsplash.com/photo-1555396273-367ea4eb4db5?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" 
            alt="Delicious Food"
            className="hero-main-image"
          />
          
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
          </div>
        </div>
      </div>

      {/* Ready Orders Table - Moved from FoodMenu */}
      <div className="ready-orders-table-section">
        <h2 className="section-title">📋 Orders Ready for Collection</h2>
        {readyOrders.length === 0 ? (
          <div className="no-orders-message">
            <p>No orders ready for collection yet.</p>
          </div>
        ) : (
          <div className="table-container">
            <table className="ready-orders-table">
              <thead>
                <tr>
                  <th>Order Token</th>
                  <th>Payment ID</th>
                  <th>Time Placed</th>
                </tr>
              </thead>
              <tbody>
                {readyOrders.map(order => (
                  <tr key={order._id}>
                    <td className="token-cell">
                      <span className="token-display">{order.orderToken}</span>
                    </td>
                    <td className="payment-cell">
                      {order.paymentId}
                    </td>
                    <td className="time-cell">
                      {new Date(order.createdAt).toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default HeroSection;