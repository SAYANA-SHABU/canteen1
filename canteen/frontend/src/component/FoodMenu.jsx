import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './FoodMenu.css';
import MockRazorpay from './MockRazorpay';

const FoodMenu = () => {
  // Generate floating particles dynamically (unique background effect, matching HeroSection)
  const particles = Array.from({ length: 15 }, (_, i) => (
    <div
      key={i}
      className="food-particle"
      style={{
        left: `${Math.random() * 100}%`,
        animationDelay: `${Math.random() * 8}s`,
        animationDuration: `${6 + Math.random() * 4}s`,
      }}
    />
  ));

  const [foodItems, setFoodItems] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [isOrderMode, setIsOrderMode] = useState(false);
  const [cart, setCart] = useState([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [orderDetails, setOrderDetails] = useState({
    token: '',
    paymentId: '',
    totalAmount: 0
  });
  const [readyOrders, setReadyOrders] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState('card');
  const [categories, setCategories] = useState([]);

  // Category icons mapping
  const categoryIcons = {
    'icecream': '🍨',
    'soup': '🥣',
    'snacks': '🍟',
    'maincourse': '🍛',
    'desserts': '🍰',
    'beverages': '🥤',
    'starters': '🥗',
    'breakfast': '🍳',
    'lunch': '🍱',
    'dinner': '🍽️',
    'pizza': '🍕',
    'burgers': '🍔',
    'sandwiches': '🥪',
    'salads': '🥗',
    'pasta': '🍝',
    'seafood': '🐟',
    'chicken': '🍗',
    'vegetarian': '🥦',
    'vegan': '🌱',
    'indian': '🇮🇳',
    'chinese': '🇨🇳',
    'italian': '🇮🇹',
    'mexican': '🇲🇽',
    'thai': '🇹🇭',
    'japanese': '🇯🇵'
  };

  // Category colors mapping
  const categoryColors = {
    'icecream': '#4CAF50',
    'soup': '#FF9800',
    'snacks': '#9C27B0',
    'maincourse': '#2196F3',
    'desserts': '#E91E63',
    'beverages': '#00BCD4',
    'starters': '#8BC34A',
    'breakfast': '#FF5722',
    'lunch': '#3F51B5',
    'dinner': '#795548',
    'default': '#667eea'
  };

  // Fetch food items and categories from backend
  const fetchFoodItems = async () => {
    try {
      const res = await axios.get("http://localhost:5000/menu");
      setFoodItems(res.data);
      
      // Extract categories with item counts
      const categoryCounts = {};
      res.data.forEach(item => {
        if (item.category) {
          const cat = item.category.toLowerCase();
          categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
        }
      });
      
      // Create categories array with only those that have items
      const categoryArray = Object.entries(categoryCounts)
        .map(([category, count]) => ({
          id: category,
          name: category.charAt(0).toUpperCase() + category.slice(1),
          icon: categoryIcons[category] || '🍽️',
          color: categoryColors[category] || categoryColors.default,
          count: count
        }))
        .sort((a, b) => a.name.localeCompare(b.name));
      
      // Add "All" category at the beginning
      setCategories([
        { 
          id: 'all', 
          name: 'All Items', 
          icon: '🍽️', 
          color: categoryColors.default,
          count: res.data.length 
        },
        ...categoryArray
      ]);
    } catch (err) {
      console.error("Failed to fetch menu items:", err);
      setCategories([
        { id: 'all', name: 'All Items', icon: '🍽️', color: categoryColors.default, count: 0 }
      ]);
    }
  };

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
    fetchFoodItems();
    fetchReadyOrders();
    
    const interval = setInterval(() => {
      fetchReadyOrders();
    }, 5000);
    
    return () => clearInterval(interval);
  }, []);

  // Calculate total whenever cart changes
  useEffect(() => {
    const total = cart.reduce((sum, item) => {
      return sum + (item.price * item.quantityInCart);
    }, 0);
    setTotalAmount(total);
  }, [cart]);

  // Generate 6-digit numeric token
  const generateNumericToken = () => {
    return Math.floor(100000 + Math.random() * 900000).toString();
  };

  const generatePaymentId = () => {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return paymentMethod === 'cash' ? `CASH-${timestamp}` : `PAY${timestamp}${random}`;
  };

  const handleOrderNowClick = () => {
    setIsOrderMode(true);
  };

  const handleAddToCart = (item) => {
    const existingItem = cart.find(cartItem => cartItem._id === item._id);
    
    if (existingItem) {
      if (existingItem.quantityInCart >= item.quantity) {
        alert(`Only ${item.quantity} items available in stock!`);
        return;
      }
      setCart(cart.map(cartItem => 
        cartItem._id === item._id 
          ? { ...cartItem, quantityInCart: cartItem.quantityInCart + 1 }
          : cartItem
      ));
    } else {
      if (item.quantity <= 0) {
        alert("This item is out of stock!");
        return;
      }
      setCart([...cart, { ...item, quantityInCart: 1 }]);
    }
  };

  const handleRemoveFromCart = (itemId) => {
    const existingItem = cart.find(item => item._id === itemId);
    
    if (existingItem.quantityInCart > 1) {
      setCart(cart.map(cartItem => 
        cartItem._id === itemId 
          ? { ...cartItem, quantityInCart: cartItem.quantityInCart - 1 }
          : cartItem
      ));
    } else {
      setCart(cart.filter(item => item._id !== itemId));
    }
  };

  const handleBuyItem = async (itemId, quantity = 1) => {
    try {
      await axios.put(`http://localhost:5000/menu/update/${itemId}`, {
        $inc: { quantity: -quantity }
      });
      fetchFoodItems();
    } catch (err) {
      console.error("Failed to update stock:", err);
      throw err;
    }
  };

  const handleCheckout = () => {
    if (cart.length === 0) {
      alert("Your cart is empty!");
      return;
    }
    
    if (paymentMethod === 'cash') {
      handleCashPayment();
    } else {
      setShowPaymentModal(true);
    }
  };

  const handleCashPayment = async () => {
    setIsProcessingPayment(true);
    
    try {
      const orderToken = generateNumericToken();
      const paymentId = generatePaymentId();
      
      for (const item of cart) {
        await handleBuyItem(item._id, item.quantityInCart);
      }
      
      const orderData = {
        items: cart.map(item => ({
          name: item.name,
          price: item.price,
          quantity: item.quantityInCart,
          itemId: item._id
        })),
        totalAmount: totalAmount,
        status: 'confirmed',
        paymentMethod: 'cash'
      };
      
      const orderRes = await axios.post('http://localhost:5000/orders/create', orderData);
      
      setOrderDetails({
        token: orderRes.data.orderToken || orderToken,
        paymentId: orderRes.data.paymentId || paymentId,
        totalAmount: totalAmount
      });
      
      setShowSuccessPopup(true);
      setCart([]);
      setIsOrderMode(false);
      fetchReadyOrders();
    } catch (error) {
      console.error("Order processing error:", error);
      alert("Order processing failed. Please try again.");
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handlePaymentSuccess = async (paymentDetails) => {
    setIsProcessingPayment(true);
    setShowPaymentModal(false);
    
    try {
      const orderToken = generateNumericToken();
      const paymentId = generatePaymentId();
      
      alert(`✅ Payment Successful!\n\nProcessing your order...`);
      
      for (const item of cart) {
        await handleBuyItem(item._id, item.quantityInCart);
      }
      
      const orderData = {
        items: cart.map(item => ({
          name: item.name,
          price: item.price,
          quantity: item.quantityInCart,
          itemId: item._id
        })),
        totalAmount: totalAmount,
        status: 'confirmed',
        paymentMethod: 'card'
      };
      
      const orderRes = await axios.post('http://localhost:5000/orders/create', orderData);
      
      setOrderDetails({
        token: orderRes.data.orderToken || orderToken,
        paymentId: orderRes.data.paymentId || paymentId,
        totalAmount: totalAmount
      });
      
      setShowSuccessPopup(true);
      setCart([]);
      setIsOrderMode(false);
      fetchReadyOrders();
    } catch (error) {
      console.error("Order processing error:", error);
      alert("Payment successful but order processing failed. Please contact support.");
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handlePaymentCancel = () => {
    setShowPaymentModal(false);
  };

  const handleCloseSuccessPopup = () => {
    setShowSuccessPopup(false);
  };

  // Filter items based on search and category
  const filteredItems = foodItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || 
                          (item.category && item.category.toLowerCase() === selectedCategory.toLowerCase());
    return matchesSearch && matchesCategory;
  });

  const getCartQuantity = (itemId) => {
    const cartItem = cart.find(item => item._id === itemId);
    return cartItem ? cartItem.quantityInCart : 0;
  };

  return (
    <div className="food-menu">
      {/* Unique particle background (matching HeroSection) */}
      <div className="food-particles">
        {particles}
      </div>
      
      {showPaymentModal && (
        <MockRazorpay 
          amount={totalAmount}
          onSuccess={handlePaymentSuccess}
          onClose={handlePaymentCancel}
          onError={() => alert("Payment failed. Please try again.")}
        />
      )}

      {/* Success Popup Modal */}
      {showSuccessPopup && (
        <div className="success-popup-overlay">
          <div className="success-popup-container">
            <div className="success-popup-content">
              <div className="success-popup-header">
                <h3 className="success-popup-title">🎉 Order Confirmed!</h3>
                <p className="success-popup-subtitle">Your order has been placed successfully</p>
              </div>
              
              <div className="order-details-card">
                <div className="order-detail-row">
                  <span className="detail-label">Order Token:</span>
                  <span className="detail-value token-value">{orderDetails.token}</span>
                </div>
                
                <div className="order-detail-row">
                  <span className="detail-label">Payment ID:</span>
                  <span className="detail-value payment-id">{orderDetails.paymentId}</span>
                </div>
                
                <div className="order-detail-row">
                  <span className="detail-label">Total Amount:</span>
                  <span className="detail-value amount-value">₹{orderDetails.totalAmount}</span>
                </div>
                
                <div className="order-detail-row">
                  <span className="detail-label">Payment Method:</span>
                  <span className="detail-value">{paymentMethod === 'cash' ? 'Cash 💵' : 'Card 💳'}</span>
                </div>
              </div>
              
              <div className="order-instructions">
                <p>• Please show your order token at the counter</p>
                <p>• We'll notify you when your order is ready</p>
                <p>• Keep your payment ID for any queries</p>
              </div>
              
              <button 
                className="success-popup-ok-btn"
                onClick={handleCloseSuccessPopup}
              >
                OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Ready Orders Table */}
      <div className="ready-orders-table-section animate-slide-up">
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

      <div className="menu-header animate-fade-in">
        <h2 className="menu-title">
          🍽️ Our <span className="highlight">Menu</span>
        </h2>
        <p className="menu-subtitle">Freshly prepared with love and care</p>
        
        {!isOrderMode && (
          <button className="start-order-btn animate-scale-in" onClick={handleOrderNowClick}>
            🚀 START ORDERING
          </button>
        )}
      </div>

      <div className="menu-controls animate-slide-right">
        <div className="search-bar">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search for dishes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      {/* Category Tabs - Only show categories with items */}
      {categories.length > 0 && (
        <div className="category-tabs-section animate-fade-in">
          <h3 className="category-tabs-title">Browse by Category</h3>
          <div className="category-tabs-container">
            <div className="category-tabs">
              {categories.map(category => (
                <button
                  key={category.id}
                  className={`category-tab ${selectedCategory === category.id ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(category.id)}
                  style={{
                    '--category-color': category.color
                  }}
                >
                  <span className="category-tab-icon">{category.icon}</span>
                  <span className="category-tab-text">
                    {category.name} ({category.count})
                  </span>
                  {selectedCategory === category.id && (
                    <span className="category-tab-indicator"></span>
                  )}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Category Display Section */}
      <div className="category-display-section animate-slide-up">
        <div className="category-header">
          <h3 className="selected-category-title">
            {selectedCategory === 'all' 
              ? 'All Menu Items' 
              : categories.find(c => c.id === selectedCategory)?.name || 'Selected Category'}
          </h3>
          <span className="item-count-badge">
            {filteredItems.length} items
          </span>
        </div>

        {/* Display cart summary */}
        {isOrderMode && cart.length > 0 && (
          <div className="cart-summary">
            <div className="cart-header">
              <h3>🛒 Your Order</h3>
              <span className="item-count">
                {cart.reduce((sum, item) => sum + item.quantityInCart, 0)} items
              </span>
            </div>
            
            {cart.map(item => (
              <div key={item._id} className="cart-item">
                <span className="cart-item-name">{item.name}</span>
                <div className="cart-item-controls">
                  <button 
                    onClick={() => handleRemoveFromCart(item._id)}
                    className="cart-btn minus"
                  >
                    −
                  </button>
                  <span className="cart-item-qty">{item.quantityInCart}</span>
                  <button 
                    onClick={() => handleAddToCart(item)}
                    className="cart-btn plus"
                  >
                    +
                  </button>
                  <span className="cart-item-price">₹{item.price * item.quantityInCart}</span>
                </div>
              </div>
            ))}
            
            <div className="cart-total-section">
              <div className="payment-method-selector">
                <h4>Payment Method:</h4>
                <div className="payment-options">
                  <label className="payment-option">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="card"
                      checked={paymentMethod === 'card'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                    />
                    <span className="payment-label">💳 Card</span>
                  </label>
                  <label className="payment-option">
                    <input
                      type="radio"
                      name="paymentMethod"
                      value="cash"
                      checked={paymentMethod === 'cash'}
                      onChange={(e) => setPaymentMethod(e.target.value)}
                    />
                    <span className="payment-label">💵 Cash</span>
                  </label>
                </div>
              </div>
              
              <div className="checkout-section">
                <div className="total-amount">
                  <h4>Total: ₹{totalAmount}</h4>
                  {paymentMethod === 'cash' && (
                    <p className="cash-note">Pay at counter when collecting order</p>
                  )}
                </div>
                <button 
                  className="checkout-btn" 
                  onClick={handleCheckout}
                  disabled={isProcessingPayment}
                >
                  {isProcessingPayment ? (
                    <>
                      <span className="payment-processing">⏳</span>
                      Processing...
                    </>
                  ) : paymentMethod === 'cash' ? (
                    "Place Cash Order"
                  ) : (
                    "Pay with Card"
                  )}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Menu Items Grid */}
        <div className="menu-container">
          <div className="menu-grid">
            {filteredItems.length === 0 ? (
              <div className="no-items-message">
                <div className="no-items-icon">🍽️</div>
                <h4>No items found</h4>
                <p>
                  {selectedCategory === 'all' 
                    ? "Try searching for something different." 
                    : `No ${categories.find(c => c.id === selectedCategory)?.name} items found. Try another category.`}
                </p>
                <button 
                  className="reset-filter-btn"
                  onClick={() => {
                    setSelectedCategory('all');
                    setSearchQuery('');
                  }}
                >
                  Show All Items
                </button>
              </div>
            ) : (
              filteredItems.map(item => {
                const cartQuantity = getCartQuantity(item._id);
                const categoryName = item.category || 'maincourse';
                const categoryIcon = categoryIcons[categoryName] || '🍽️';
                const categoryColor = categoryColors[categoryName] || categoryColors.default;
                
                return (
                  <div key={item._id} className="menu-card animate-scale-in">
                    <div className="menu-card-image-container">
                      <img 
                        src={item.image || "https://images.unsplash.com/photo-1565958011703-44f9829ba187?w=300&h=200&fit=crop"} 
                        alt={item.name} 
                        className="menu-item-image"
                      />
                      <div 
                        className="menu-item-category-badge"
                        style={{ backgroundColor: categoryColor }}
                      >
                        {categoryIcon} {categoryName.charAt(0).toUpperCase() + categoryName.slice(1)}
                      </div>
                    </div>
                    <div className="menu-card-content">
                      <div className="menu-item-header">
                        <h3 className="menu-item-name">{item.name}</h3>
                        <span className="menu-item-price">₹{item.price}</span>
                      </div>
                      <p className="menu-item-stock">
                        {item.quantity > 0 ? (
                          <span className="in-stock">✓ {item.quantity} available</span>
                        ) : (
                          <span className="out-of-stock">✗ Out of stock</span>
                        )}
                      </p>
                      
                      {isOrderMode && item.quantity > 0 && (
                        <div className="order-controls">
                          {cartQuantity > 0 ? (
                            <div className="quantity-controls">
                              <button 
                                onClick={() => handleRemoveFromCart(item._id)}
                                className="qty-btn minus"
                              >
                                −
                              </button>
                              <span className="qty-display">{cartQuantity}</span>
                              <button 
                                onClick={() => handleAddToCart(item)}
                                className="qty-btn plus"
                                disabled={item.quantity <= cartQuantity}
                              >
                                +
                              </button>
                              <span className="item-total-price">₹{item.price * cartQuantity}</span>
                            </div>
                          ) : (
                            <button 
                              onClick={() => handleAddToCart(item)}
                              className="add-to-cart-btn"
                            >
                              <span className="cart-icon">🛒</span> Add to Order
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default FoodMenu;