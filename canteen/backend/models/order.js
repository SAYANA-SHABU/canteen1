import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
  orderToken: { type: String, required: true },
  paymentId: { type: String, required: true },
  
  paymentMethod: { type: String, required: true, enum: ['online', 'cash'] },
  items: [
    {
      name: String,
      price: Number,
      quantity: Number,
      itemId: String
    }
  ],
  
  totalAmount: { type: Number, required: true },
  status: { 
    type: String, 
    required: true, 
    enum: ['confirmed', 'preparing', 'ready', 'collected'],
    default: 'confirmed'
  },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
  collectedAt: {
    type: Date
  },
 
}, {
  timestamps: true

});

const Order = mongoose.model('Order', orderSchema);
export default Order;