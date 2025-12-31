import express from "express";
import cors from "cors";
import connectDB from "./connection.js";
import Menu from "./models/menu.js";
import Order from "./models/order.js";

connectDB();

const app = express();
app.use(cors());
app.use(express.json());

// Helper function to generate unique tokens (3 digits)
const generateToken = () => {
  const chars = '0123456789';
  let token = '';
  for (let i = 0; i < 3; i++) {
    token += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return token;
};

// Or use this version that ensures 3 digits with leading zeros:
// const generateToken = () => {
//   const token = Math.floor(Math.random() * 1000); // 0-999
//   return token.toString().padStart(3, '0'); // Ensures 3 digits with leading zeros
// };

// Generate payment ID (10 characters)
const generatePaymentId = () => {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return `PAY${timestamp}${random}`;
};

// Admin login route
app.post('/admin/login', async (req, res) => {
  try {
    const { username, password } = req.body
    
    if (username === 'admin' && password === '12345') {
      res.json({ message: 'Admin login successful' })
    } else {
      res.status(401).json({ message: 'Invalid admin credentials' })
    }
  } catch (error) {
    console.error('Admin login error:', error)
    res.status(500).json({ message: 'Server error during admin login' })
  }
})

// Get all categories
app.get("/menu/categories", async (req, res) => {
  try {
    const categories = await Menu.distinct("category");
    const nonEmptyCategories = await Promise.all(
      categories.map(async (category) => {
        const count = await Menu.countDocuments({ category });
        return { name: category, count };
      })
    );
    res.json(nonEmptyCategories);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch categories" });
  }
});

// Add menu item
app.post("/menu/add", async (req, res) => {
  try {
    const item = new Menu(req.body);
    await item.save();
    res.json({ message: "Item added", item });
  } catch (error) {
    res.status(500).json({ error: "Failed to add item" });
  }
});

// Get all menu items
app.get("/menu", async (req, res) => {
  try {
    const items = await Menu.find();
    res.json(items);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch items" });
  }
});

// Create order with payment
app.post("/orders/create", async (req, res) => {
  try {
    const { items, totalAmount, paymentMethod } = req.body;
    
    // Generate unique token and payment ID
    const orderToken = generateToken(); // This now returns 3-digit number
    const paymentId = generatePaymentId();
    
    // Create order
    const order = new Order({
      orderToken,
      paymentId,
      items,
      totalAmount,
      paymentMethod: paymentMethod || 'online',
      status: 'confirmed'
    });
    
    await order.save();
    
    // Update stock for each item
    for (const item of items) {
      await Menu.findByIdAndUpdate(item.itemId, {
        $inc: { quantity: -item.quantity }
      });
    }
    
    res.json({
      success: true,
      orderToken, // Now this is a 3-digit number
      paymentId,
      totalAmount,
      paymentMethod: paymentMethod || 'online',
      message: "Order created successfully"
    });
    
  } catch (error) {
    console.error("Order creation error:", error);
    res.status(500).json({ error: "Failed to create order" });
  }
});

// Buy item (decrease stock) - Keep for backward compatibility
app.put("/menu/buy/:id", async (req, res) => {
  try {
    const item = await Menu.findById(req.params.id);
    if (!item) return res.status(404).json({ error: "Item not found" });
    if (item.quantity <= 0) return res.status(400).json({ error: "Out of stock" });

    item.quantity -= 1;
    await item.save();
    res.json({ message: "Purchase successful", item });
  } catch (error) {
    res.status(500).json({ error: "Failed to update stock" });
  }
});

// Update menu item
app.put("/menu/update/:id", async (req, res) => {
  try {
    const item = await Menu.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!item) return res.status(404).json({ error: "Item not found" });
    res.json({ message: "Item updated", item });
  } catch (error) {
    res.status(500).json({ error: "Failed to update item" });
  }
});

// Delete menu item
app.delete("/menu/delete/:id", async (req, res) => {
  try {
    const item = await Menu.findByIdAndDelete(req.params.id);
    if (!item) return res.status(404).json({ error: "Item not found" });
    res.json({ message: "Item deleted", item });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete item" });
  }
});

// Get order by token
app.get("/orders/:token", async (req, res) => {
  try {
    const order = await Order.findOne({ orderToken: req.params.token });
    if (!order) return res.status(404).json({ error: "Order not found" });
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch order" });
  }
});

// Get all orders (for admin)
app.get("/orders", async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch orders" });
  }
});

// Update order status (for admin)
app.put("/orders/:token/status", async (req, res) => {
  try {
    const { status } = req.body;
    
    // Validate status
    const validStatuses = ['confirmed', 'preparing', 'ready', 'collected'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }
    
    const order = await Order.findOneAndUpdate(
      { orderToken: req.params.token },
      { status, updatedAt: new Date() },
      { new: true }
    );
    
    if (!order) return res.status(404).json({ error: "Order not found" });
    res.json({ message: "Order status updated", order });
  } catch (error) {
    res.status(500).json({ error: "Failed to update order status" });
  }
});

// Get dashboard statistics
app.get("/admin/stats", async (req, res) => {
  try {
    const totalOrders = await Order.countDocuments();
    const pendingOrders = await Order.countDocuments({
      status: { $in: ['confirmed', 'preparing'] }
    });
    const readyOrders = await Order.countDocuments({ status: 'ready' });
    const totalRevenue = await Order.aggregate([
      { $match: { status: { $ne: 'cancelled' } } },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);
    
    res.json({
      totalOrders,
      pendingOrders,
      readyOrders,
      totalRevenue: totalRevenue[0]?.total || 0
    });
  } catch (Error) {
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});

// Add this endpoint after the existing /admin/stats endpoint

// Get revenue analytics by date range
app.get("/admin/revenue/analytics", async (req, res) => {
  try {
    const { period } = req.query; // 'day', 'month', 'year'
    
    let groupFormat, dateFormat;
    
    switch(period) {
      case 'day':
        groupFormat = { $dateToString: { format: "%Y-%m-%d", date: "$updatedAt" } };
        dateFormat = "%Y-%m-%d";
        break;
      case 'month':
        groupFormat = { $dateToString: { format: "%Y-%m", date: "$updatedAt" } };
        dateFormat = "%Y-%m";
        break;
      case 'year':
        groupFormat = { $dateToString: { format: "%Y", date: "$updatedAt" } };
        dateFormat = "%Y";
        break;
      default:
        groupFormat = { $dateToString: { format: "%Y-%m-%d", date: "$updatedAt" } };
        dateFormat = "%Y-%m-%d";
    }
    
    const revenueData = await Order.aggregate([
      { $match: { status: 'collected' } },
      {
        $group: {
          _id: groupFormat,
          totalRevenue: { $sum: "$totalAmount" },
          orderCount: { $sum: 1 },
          averageOrderValue: { $avg: "$totalAmount" }
        }
      },
      { $sort: { _id: 1 } }
    ]);
    
    res.json(revenueData);
  } catch (error) {
    console.error("Revenue analytics error:", error);
    res.status(500).json({ error: "Failed to fetch revenue analytics" });
  }
});

// Delete order by token
app.delete("/orders/:token", async (req, res) => {
  try {
    const order = await Order.findOneAndDelete({ orderToken: req.params.token });
    
    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }
    
    // Restore stock for each item if order was collected
    if (order.status === 'collected') {
      for (const item of order.items) {
        await Menu.findByIdAndUpdate(item.itemId, {
          $inc: { quantity: item.quantity }
        });
      }
    }
    
    res.json({ 
      message: "Order deleted successfully",
      order 
    });
  } catch (error) {
    console.error("Delete order error:", error);
    res.status(500).json({ error: "Failed to delete order" });
  }
});

// Change the totalRevenue aggregation in /admin/stats endpoint to:
const totalRevenue = await Order.aggregate([
  { $match: { status: 'collected' } },
  { $group: { _id: null, total: { $sum: '$totalAmount' } } }
]);

// Update the order status endpoint to add timestamp when collected
app.put("/orders/:token/status", async (req, res) => {
  try {
    const { status } = req.body;
    
    // Validate status
    const validStatuses = ['confirmed', 'preparing', 'ready', 'collected'];
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: "Invalid status" });
    }
    
    const updateData = { 
      status, 
      updatedAt: new Date() 
    };
    
    // Add collectedAt timestamp when status becomes 'collected'
    if (status === 'collected') {
      updateData.collectedAt = new Date();
    }
    
    const order = await Order.findOneAndUpdate(
      { orderToken: req.params.token },
      updateData,
      { new: true }
    );
    
    if (!order) return res.status(404).json({ error: "Order not found" });
    res.json({ message: "Order status updated", order });
  } catch (error) {
    res.status(500).json({ error: "Failed to update order status" });
  }
});

app.listen(5000, () => {
  console.log("Server running on port 5000");
});