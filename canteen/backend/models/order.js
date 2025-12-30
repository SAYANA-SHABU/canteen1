import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
  orderToken: {
    type: String,
    required: true,
    unique: true
  },
  paymentId: {
    type: String,
    required: true,
    unique: true
  },
  items: [{
    itemId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Menu',
      required: true
    },
    name: String,
    price: Number,
    quantity: Number
  }],
  totalAmount: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'confirmed', 'preparing', 'ready', 'completed'],
    default: 'confirmed'
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const Order = mongoose.model('Order', orderSchema);

export default Order;