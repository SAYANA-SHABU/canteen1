import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './FoodMenu.css';
import MockRazorpay from './MockRazorpay';

const FoodMenu = () => {
  const [foodItems, setFoodItems] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isOrderMode, setIsOrderMode] = useState(false);
  const [cart, setCart] = useState([]);
  const [totalAmount, setTotalAmount] = useState(0);
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showSuccessPopup, setShowSuccessPopup] = useState(false);
  const [orderDetails, setOrderDetails] = useState({
    token: '',
    paymentId: '',
    totalAmount: 0,
    paymentMethod: ''
  });
  const [readyOrders, setReadyOrders] = useState([]);
  const [paymentMethod, setPaymentMethod] = useState('online'); // Default to online payment

  // Fetch food items from backend
  const fetchFoodItems = async () => {
    try {
      const res = await axios.get("http://localhost:5000/menu");
      setFoodItems(res.data);
    } catch (err) {
      console.error("Failed to fetch menu items:", err);
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

  // Generate random token (6 characters)
  const generateToken = () => {
  const chars = '0123456789';
  let token = '';
  for (let i = 0; i < 3; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
};

  // Generate payment ID (10 characters)
  const generatePaymentId = () => {
    const timestamp = Date.now().toString().slice(-6);
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `PAY${timestamp}${random}`;
  };

  // Start Ordering button handler
  const handleOrderNowClick = () => {
    setIsOrderMode(true);
  };

  const handleAddToCart = (item) => {
    const existingItem = cart.find(cartItem => cartItem._id === item._id);
    
    if (existingItem) {
      // Check if adding more than available stock
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

  const handleBuyItem = async (itemId) => {
    try {
      await axios.put(`http://localhost:5000/menu/buy/${itemId}`);
      fetchFoodItems();
    } catch (err) {
      console.error("Failed to purchase item:", err);
      alert("Failed to process purchase. Please try again.");
    }
  };

  const handlePlaceOrder = () => {
    console.log("Place Order clicked, cart items:", cart.length);
    if (cart.length === 0) {
      alert("Your cart is empty!");
      return;
    }

    if (paymentMethod === 'online') {
      console.log("Setting showPaymentModal to true");
      setShowPaymentModal(true);
    } else {
      // Handle cash payment directly
      handleCashPayment();
    }
  };

  const handleCashPayment = async () => {
    setIsProcessingPayment(true);
    
    try {
      // Generate order details for cash payment
      const orderToken = generateToken();
      const cashPaymentId = generatePaymentId();
      
      // Process all items in cart
      for (const item of cart) {
        for (let i = 0; i < item.quantityInCart; i++) {
          await handleBuyItem(item._id);
        }
      }
      
      // Create order in backend for cash payment
      const orderData = {
        items: cart.map(item => ({
          name: item.name,
          price: item.price,
          quantity: item.quantityInCart,
          itemId: item._id
        })),
        totalAmount: totalAmount,
        paymentMethod: 'cash'
      };
      
      const orderRes = await axios.post('http://localhost:5000/orders/create', orderData);
      
      // Set order details for popup
      setOrderDetails({
        token: orderRes.data.orderToken || orderToken,
        paymentId: orderRes.data.paymentId || cashPaymentId,
        totalAmount: totalAmount,
        paymentMethod: 'cash'
      });
      
      // Show success popup
      setShowSuccessPopup(true);
      
      // Reset cart and order mode
      setCart([]);
      setIsOrderMode(false);
      fetchReadyOrders();
    } catch (error) {
      console.error("Order processing error:", error);
      alert("Order processing failed. Please contact support.");
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const handlePaymentSuccess = async (paymentDetails) => {
    setIsProcessingPayment(true);
    setShowPaymentModal(false);
    
    try {
      // Generate order details
      const orderToken = generateToken();
      const paymentId = generatePaymentId();
      
      // Show payment success message
      alert(`✅ Payment Successful!\n\nProcessing your order...`);
      
      // Process all items in cart
      for (const item of cart) {
        for (let i = 0; i < item.quantityInCart; i++) {
          await handleBuyItem(item._id);
        }
      }
      
      // Create order in backend
      const orderData = {
        items: cart.map(item => ({
          name: item.name,
          price: item.price,
          quantity: item.quantityInCart,
          itemId: item._id
        })),
        totalAmount: totalAmount,
        paymentMethod: 'online'
      };
      
      const orderRes = await axios.post('http://localhost:5000/orders/create', orderData);
      
      // Set order details for popup
      setOrderDetails({
        token: orderRes.data.orderToken || orderToken,
        paymentId: orderRes.data.paymentId || paymentId,
        totalAmount: totalAmount,
        paymentMethod: 'online'
      });
      
      // Show success popup
      setShowSuccessPopup(true);
      
      // Reset cart and order mode
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

  // Close success popup
  const handleCloseSuccessPopup = () => {
    setShowSuccessPopup(false);
  };

  // Filter items based on search
  const filteredItems = foodItems.filter(item => {
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  const getCartQuantity = (itemId) => {
    const cartItem = cart.find(item => item._id === itemId);
    return cartItem ? cartItem.quantityInCart : 0;
  };

  return (
    <div className="food-menu">
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
                  <span className="detail-value payment-method">
                    {orderDetails.paymentMethod === 'online' ? '💳 Online Payment' : '💰 Cash on Counter'}
                  </span>
                </div>
                
                <div className="order-detail-row">
                  <span className="detail-label">Status:</span>
                  <span className="detail-value status-confirmed">Confirmed ✓</span>
                </div>
              </div>
              
              
          
                {orderDetails.paymentMethod === 'cash' && (
                  <p>• Please pay ₹{orderDetails.totalAmount} in cash when collecting</p>
                )}
              
              
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

      {/* Menu Header WITH START ORDERING BUTTON */}
      <div className="menu-header">
        <h2 className="menu-title">Our Delicious Menu</h2>
        <p className="menu-subtitle">Freshly prepared with love and care</p>
        
        {/* Start Ordering Button - Only shows when NOT in order mode */}
        {!isOrderMode && (
          <button className="start-order-btn" onClick={handleOrderNowClick}>
            🚀 START ORDERING
          </button>
        )}
      </div>

      <div className="menu-controls">
        <div className="search-bar">
        
          <input
            type="text"
            placeholder="    Search for dishes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="search-input"
          />
        </div>
      </div>

      {/* Display cart summary - Only shows when in order mode AND cart has items */}
      {isOrderMode && cart.length > 0 && (
        <div className="cart-summary">
          <div className="cart-header">
            <h3>Your Order</h3>
          </div>
          
          {cart.map(item => (
            <div key={item._id} className="cart-item">
              <span>{item.name}</span>
              <div className="cart-item-controls">
                <button onClick={() => handleRemoveFromCart(item._id)}>-</button>
                <span>{item.quantityInCart}</span>
                <button onClick={() => handleAddToCart(item)}>+</button>
                <span className="cart-item-price">₹{item.price * item.quantityInCart}</span>
              </div>
            </div>
          ))}
          
          {/* Payment Method Selection */}
          <div className="payment-method-selector">
            <h4>Payment Method</h4>
            <div className="payment-options">
              <label className="payment-option">
                <input
                  type="radio"
                  value="online"
                  checked={paymentMethod === 'online'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                />
                <span className="payment-label">💳 Online Payment</span>
              </label>
              <label className="payment-option">
                <input
                  type="radio"
                  value="cash"
                  checked={paymentMethod === 'cash'}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                />
                <span className="payment-label">💰 Cash on Counter</span>
              </label>
            </div>
          </div>
          
          <div className="cart-total-section">
            <div className="checkout-section">
              <div className="total-amount">
                <h4>Total: ₹{totalAmount}</h4>
                {paymentMethod === 'cash' && (
                  <p className="cash-note">Pay at counter when collecting</p>
                )}
              </div>
              <button 
                className="checkout-btn" 
                onClick={handlePlaceOrder}
                disabled={isProcessingPayment}
              >
                {isProcessingPayment ? (
                  <>
                    <span className="payment-processing">⏳</span>
                    Processing...
                  </>
                ) : (
                  `Place Order${paymentMethod === 'cash' ? ' (Cash)' : ''}`
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Menu Grid - Add to cart buttons only show when in order mode */}
      {/* Menu Grid - Responsive layout */}
<div className="menu-container">
  {filteredItems.length === 0 ? (
    <div className="no-items-message">
      <div className="no-items-icon">🔍</div>
      <h4>No items found</h4>
      <p>Try adjusting your search or check back later</p>
    </div>
  ) : (
    <div className="menu-grid">
      {filteredItems.map(item => {
        const cartQuantity = getCartQuantity(item._id);
        
        return (
          <div key={item._id} className="menu-card">
            <div className="menu-card-image-container">
              <img 
                src={item.image || "https://via.placeholder.com/300x150"} 
                alt={item.name} 
                className="menu-item-image"
                onError={(e) => {
                  e.target.src = "https://via.placeholder.com/300x150";
                }}
              />
            </div>
            <div className="menu-card-content">
              <div className="menu-item-header">
                <h3 className="menu-item-name">{item.name}</h3>
                <div className="menu-item-price">₹{item.price}</div>
              </div>
              
              <div className="menu-item-stock">
                {item.quantity > 0 ? (
                  <span className="in-stock">✅ In stock: {item.quantity}</span>
                ) : (
                  <span className="out-of-stock">❌ Out of stock</span>
                )}
              </div>
              
              {/* ADD TO CART CONTROLS - Only show when in order mode */}
              {isOrderMode && item.quantity > 0 && (
                <div className="order-controls">
                  {cartQuantity > 0 ? (
                    <div className="quantity-controls">
                      <button 
                        onClick={() => handleRemoveFromCart(item._id)}
                        className="qty-btn"
                      >
                        -
                      </button>
                      <span className="qty-display">{cartQuantity}</span>
                      <button 
                        onClick={() => handleAddToCart(item)}
                        className="qty-btn"
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
              
              {/* Out of stock message - Only show when in order mode */}
              {isOrderMode && item.quantity <= 0 && (
                <button className="add-to-cart-btn" disabled>
                  Out of Stock
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  )}
</div>
    </div>
  );
};

export default FoodMenu;