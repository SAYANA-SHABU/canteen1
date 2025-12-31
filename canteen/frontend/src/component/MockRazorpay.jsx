import React, { useState, useEffect } from 'react';
import './FoodMenu.css';

const MockRazorpay = ({ amount, onSuccess, onClose, onError }) => {
  const [selectedMethod, setSelectedMethod] = useState('card');
  const [cardNumber, setCardNumber] = useState('4111 1111 1111 1111');
  const [expiry, setExpiry] = useState('12/25');
  const [cvv, setCvv] = useState('123');
  const [name, setName] = useState('John Doe');
  const [upiId, setUpiId] = useState('success@razorpay');
  const [otp, setOtp] = useState('123456');
  const [step, setStep] = useState(1); // 1: select method, 2: enter details, 3: OTP
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    // Prevent body scroll when modal is open
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);

  const paymentMethods = [
    { id: 'card', name: 'Credit/Debit Card', icon: '💳' },
    { id: 'upi', name: 'UPI', icon: '📱' },
    { id: 'wallet', name: 'Wallet', icon: '👛' },
    { id: 'netbanking', name: 'Net Banking', icon: '🏦' }
  ];

  const handleMethodSelect = (methodId) => {
    setSelectedMethod(methodId);
    setStep(2);
  };

  const handleProceed = () => {
    if (step === 2) {
      setIsProcessing(true);
      // Simulate API call
      setTimeout(() => {
        setIsProcessing(false);
        setStep(3);
      }, 1500);
    } else if (step === 3) {
      setIsProcessing(true);
      // Simulate payment processing
      setTimeout(() => {
        setIsProcessing(false);
        // Generate mock payment details
        const mockPayment = {
          razorpay_payment_id: 'pay_' + Math.random().toString(36).substr(2, 9),
          razorpay_order_id: 'order_' + Math.random().toString(36).substr(2, 9),
          razorpay_signature: 'sig_' + Math.random().toString(36).substr(2, 16)
        };
        onSuccess(mockPayment);
      }, 2000);
    }
  };

  const handleCancel = () => {
    onClose();
  };

  return (
    <div className="mock-razorpay-modal">
      <div className="mock-razorpay-overlay" onClick={handleCancel}></div>
      
      <div className="mock-razorpay-container">
        <div className="mock-razorpay-header">
          <div className="mock-razorpay-logo">
            <img 
              src="https://cdn.razorpay.com/logos/FFATTsJeURNMxx_medium.png" 
              alt="Razorpay" 
              width="120"
            />
          </div>
          <button className="mock-razorpay-close" onClick={handleCancel}>
            ×
          </button>
        </div>

        <div className="mock-razorpay-content">
          <div className="mock-razorpay-amount">
            <h3>Pay ₹{amount}</h3>
            <p>Demo Food Order System</p>
          </div>

          {step === 1 && (
            <>
              <div className="mock-payment-methods">
                {paymentMethods.map(method => (
                  <div 
                    key={method.id}
                    className={`mock-method-card ${selectedMethod === method.id ? 'selected' : ''}`}
                    onClick={() => handleMethodSelect(method.id)}
                  >
                    <span className="mock-method-icon">{method.icon}</span>
                    <span className="mock-method-name">{method.name}</span>
                  </div>
                ))}
              </div>
              
              
            </>
          )}

          {step === 2 && selectedMethod === 'card' && (
            <div className="mock-card-form">
              <h4>Enter Card Details</h4>
              
              <div className="mock-form-group">
                <label>Card Number</label>
                <input 
                  type="text" 
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  placeholder="1234 5678 9012 3456"
                />
              </div>
              
              <div className="mock-form-row">
                <div className="mock-form-group">
                  <label>Expiry (MM/YY)</label>
                  <input 
                    type="text" 
                    value={expiry}
                    onChange={(e) => setExpiry(e.target.value)}
                    placeholder="MM/YY"
                  />
                </div>
                
                <div className="mock-form-group">
                  <label>CVV</label>
                  <input 
                    type="text" 
                    value={cvv}
                    onChange={(e) => setCvv(e.target.value)}
                    placeholder="123"
                  />
                </div>
              </div>
              
              <div className="mock-form-group">
                <label>Name on Card</label>
                <input 
                  type="text" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                />
              </div>
            </div>
          )}

          {step === 2 && selectedMethod === 'upi' && (
            <div className="mock-upi-form">
              <h4>Enter UPI ID</h4>
              <div className="mock-form-group">
                <label>UPI ID</label>
                <input 
                  type="text" 
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  placeholder="success@razorpay"
                />
                <small>Use "success@razorpay" for successful payment</small>
              </div>
            </div>
          )}

          {step === 2 && (selectedMethod === 'wallet' || selectedMethod === 'netbanking') && (
            <div className="mock-other-methods">
              <h4>Select {selectedMethod === 'wallet' ? 'Wallet' : 'Bank'}</h4>
              <div className="mock-bank-list">
                {selectedMethod === 'wallet' ? (
                  <>
                    <div className="mock-bank-option">Paytm</div>
                    <div className="mock-bank-option">PhonePe</div>
                    <div className="mock-bank-option">Google Pay</div>
                  </>
                ) : (
                  <>
                    <div className="mock-bank-option">HDFC Bank</div>
                    <div className="mock-bank-option">ICICI Bank</div>
                    <div className="mock-bank-option">SBI Bank</div>
                  </>
                )}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="mock-otp-form">
              <h4>Enter OTP</h4>
              <p>Enter the OTP sent to your registered mobile number</p>
              <div className="mock-form-group">
                <label>OTP</label>
                <input 
                  type="text" 
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                  placeholder="123456"
                />
                <small>Use "123456" for successful payment</small>
              </div>
            </div>
          )}

          <div className="mock-razorpay-footer">
            {step > 1 && (
              <button 
                className="mock-back-btn" 
                onClick={() => setStep(step - 1)}
                disabled={isProcessing}
              >
                Back
              </button>
            )}
            
            <button 
              className="mock-proceed-btn"
              onClick={handleProceed}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <span className="mock-processing-spinner"></span>
                  Processing...
                </>
              ) : step === 3 ? (
                'Verify & Pay'
              ) : (
                'Proceed'
              )}
            </button>
          </div>

          <div className="mock-security-notice">
            🔒 <strong>Secure Payment</strong> - This is a demo system. No real transactions occur.
          </div>
        </div>
      </div>
    </div>
  );
};

export default MockRazorpay;
