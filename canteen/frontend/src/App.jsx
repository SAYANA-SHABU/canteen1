import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import './App.css';

import AnimatedLogo from './component/AnimatedLogo';
import Navbar from './component/Navbar';
import HeroSection from './component/HeroSection';

import FoodMenu from './component/FoodMenu';
import Footer from './component/Footer';
import AdminLogin from './component/AdminLogin';
import AdminPage from './component/AdminPage';
import Feedback from './component/FeedbackWidget';
import FeedbackWidget from './component/FeedbackWidget';

// Remove useNavigate from here and create a separate component
function HomePage() {
  const [cart, setCart] = useState([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isOrderMode, setIsOrderMode] = useState(false);

  // Mock food data
  const foodItems = [
    {
      id: 1,
      name: "Chicken Burger",
      description: "Juicy grilled chicken with fresh veggies and special sauce",
      price: 12.99,
      image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
      category: "Burgers",
      available: true,
      rating: 4.5,
      calories: 450,
      preparationTime: "15-20 min",
      quantity: 10
    },
    {
      id: 2,
      name: "Margherita Pizza",
      description: "Classic pizza with fresh tomato sauce and mozzarella",
      price: 14.99,
      image: "https://images.unsplash.com/photo-1604068549290-dea0e4a305ca?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
      category: "Pizza",
      available: true,
      rating: 4.7,
      calories: 850,
      preparationTime: "20-25 min",
      quantity: 8
    },
    {
      id: 3,
      name: "Caesar Salad",
      description: "Fresh romaine lettuce with Caesar dressing and croutons",
      price: 9.99,
      image: "https://images.unsplash.com/photo-1546793665-c74683f339c1?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
      category: "Salads",
      available: true,
      rating: 4.3,
      calories: 320,
      preparationTime: "10-15 min",
      quantity: 15
    },
    {
      id: 4,
      name: "French Fries",
      description: "Crispy golden fries with special seasoning",
      price: 5.99,
      image: "https://images.unsplash.com/photo-1576107232684-1279f390859f?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
      category: "Sides",
      available: true,
      rating: 4.2,
      calories: 365,
      preparationTime: "8-12 min",
      quantity: 20
    },
    {
      id: 5,
      name: "Chocolate Milkshake",
      description: "Creamy chocolate milkshake with whipped cream",
      price: 6.99,
      image: "https://images.unsplash.com/photo-1577805947697-89e18249d767?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
      category: "Drinks",
      available: true,
      rating: 4.6,
      calories: 420,
      preparationTime: "5-8 min",
      quantity: 12
    },
    {
      id: 6,
      name: "Vegetable Biryani",
      description: "Aromatic rice with mixed vegetables and spices",
      price: 11.99,
      image: "https://images.unsplash.com/photo-1563379091339-03246963d9d6?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
      category: "Main Course",
      available: true,
      rating: 4.4,
      calories: 550,
      preparationTime: "25-30 min",
      quantity: 6
    },
    {
      id: 7,
      name: "BBQ Chicken Wings",
      description: "Spicy BBQ chicken wings with ranch dip",
      price: 13.99,
      image: "https://images.unsplash.com/photo-1567620832903-9fc6debc209f?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
      category: "Appetizers",
      available: true,
      rating: 4.8,
      calories: 480,
      preparationTime: "18-22 min",
      quantity: 9
    },
    {
      id: 8,
      name: "Veggie Wrap",
      description: "Fresh vegetables with hummus in whole wheat wrap",
      price: 8.99,
      image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ca4b?ixlib=rb-4.0.3&auto=format&fit=crop&w=600&q=80",
      category: "Healthy",
      available: true,
      rating: 4.1,
      calories: 320,
      preparationTime: "10-15 min",
      quantity: 14
    }
  ];

  // Calculate total whenever cart changes
  useEffect(() => {
    const total = cart.reduce((sum, item) => {
      return sum + (item.price * item.quantityInCart);
    }, 0);
    setTotalAmount(total);
  }, [cart]);

  // Handle order button click
  const handleOrderNowClick = () => {
    setIsOrderMode(true);
    // Scroll to menu section
    const menuSection = document.querySelector('.food-menu');
    if (menuSection) {
      menuSection.scrollIntoView({ behavior: 'smooth' });
    }
  };

  // Handle adding items to cart with quantity
  const handleAddToCart = (item) => {
    const existingItem = cart.find(cartItem => cartItem.id === item.id);
    
    if (existingItem) {
      // If item already in cart, increase quantity
      setCart(cart.map(cartItem => 
        cartItem.id === item.id 
          ? { ...cartItem, quantityInCart: cartItem.quantityInCart + 1 }
          : cartItem
      ));
    } else {
      // If item not in cart, add with quantity 1
      setCart([...cart, { ...item, quantityInCart: 1 }]);
    }
  };

  // Handle removing items from cart
  const handleRemoveFromCart = (itemId) => {
    const existingItem = cart.find(item => item.id === itemId);
    
    if (existingItem && existingItem.quantityInCart > 1) {
      // Decrease quantity
      setCart(cart.map(cartItem => 
        cartItem.id === itemId 
          ? { ...cartItem, quantityInCart: cartItem.quantityInCart - 1 }
          : cartItem
      ));
    } else {
      // Remove item completely
      setCart(cart.filter(item => item.id !== itemId));
    }
  };

  // Handle order placement
  const handlePlaceOrder = () => {
    if (cart.length === 0) {
      alert('Please add items to your cart first!');
      return;
    }
    
    setIsLoading(true);
    // Simulate order processing
    setTimeout(() => {
      alert(`Order placed successfully! Total: $${totalAmount.toFixed(2)}`);
      setCart([]);
      setIsLoading(false);
      setIsOrderMode(false);
      alert('Order placed! Check your email for confirmation.');
    }, 1000);
  };

  // Calculate total items in cart
  const cartItemCount = cart.reduce((total, item) => total + item.quantityInCart, 0);

  // Get cart quantity for a specific item
  const getCartQuantity = (itemId) => {
    const cartItem = cart.find(item => item.id === itemId);
    return cartItem ? cartItem.quantityInCart : 0;
  };

  return (
    <>
      <Navbar 
        cartItems={cart}
        cartTotal={totalAmount}
        cartItemCount={cartItemCount}
        foodItems={foodItems}
        onRemoveFromCart={handleRemoveFromCart}
        onPlaceOrder={handlePlaceOrder}
        isOrderMode={isOrderMode}
      />
      <HeroSection />
      <div className="order-section">
       
      </div>
      
      {/* Cart Summary Banner when in order mode */}
      {isOrderMode && cart.length > 0 && (
        <div className="cart-summary-banner">
          <div className="cart-summary-content">
            <h3>Your Order ({cartItemCount} items)</h3>
            <div className="cart-items-preview">
              {cart.slice(0, 3).map(item => (
                <div key={item.id} className="cart-preview-item">
                  <span>{item.name} × {item.quantityInCart}</span>
                  <span className="cart-item-price">${(item.price * item.quantityInCart).toFixed(2)}</span>
                </div>
              ))}
              {cart.length > 3 && (
                <div className="more-items">+{cart.length - 3} more items</div>
              )}
            </div>
            <div className="cart-total-section">
              <h4>Total: ${totalAmount.toFixed(2)}</h4>
              <button className="checkout-btn" onClick={handlePlaceOrder}>
                PLACE ORDER
              </button>
            </div>
          </div>
        </div>
      )}
      
      <FoodMenu 
        foodItems={foodItems}
        onAddToCart={handleAddToCart}
        onRemoveFromCart={handleRemoveFromCart}
        isOrderMode={isOrderMode}
        cart={cart}
        getCartQuantity={getCartQuantity}
      />
    <FeedbackWidget/>
      <Footer />
      
      {/* Floating Cart Icon for Mobile */}
      {cartItemCount > 0 && (
        <div className="floating-cart-indicator">
          <span className="cart-count-badge">{cartItemCount}</span>
          <span className="cart-total-text">${totalAmount.toFixed(2)}</span>
        </div>
      )}
    </>
  );
}

// Main App component
function App() {
  const [showLogo, setShowLogo] = useState(true);

  // Simulate loading animation for 3 seconds
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowLogo(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  // If still showing animated logo
  if (showLogo) {
    return <AnimatedLogo/>;
  }

  return (
    <Router>
      <div className="App">
        <Routes>
          {/* Home Route */}
          <Route path="/" element={<HomePage />} />
          
          {/* Admin Routes */}
          <Route path="/admin/login" element={<AdminLogin />} />
          <Route path="/admin/dashboard" element={<AdminPage />} />
        </Routes>
      </div>
    </Router>
  );
}

export default App;