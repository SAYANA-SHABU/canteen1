import express from "express";
import cors from "cors";
import connectDB from "./connection.js";
import Menu from "./models/menu.js";
import Order from "./models/order.js";

connectDB();

const app = express();
app.use(cors());
app.use(express.json());

// Helper function to generate numeric tokens (6 digits)
const generateToken = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

const generatePaymentId = (paymentMethod = 'card') => {
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.random().toString(36).substring(2, 6).toUpperCase();
  return paymentMethod === 'cash' ? `CASH-${timestamp}` : `PAY${timestamp}${random}`;
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
    const { items, totalAmount, paymentMethod = 'card' } = req.body;
    
    // Generate unique numeric token and payment ID
    const orderToken = generateToken();
    const paymentId = generatePaymentId(paymentMethod);
    
    // Create order
    const order = new Order({
      orderToken,
      paymentId,
      items,
      totalAmount,
      status: 'confirmed',
      paymentMethod: paymentMethod || 'card'
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
      orderToken,
      paymentId,
      totalAmount,
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
    let updateData = req.body;
    
    // Handle MongoDB update operators
    if (updateData.$inc) {
      const item = await Menu.findById(req.params.id);
      if (!item) return res.status(404).json({ error: "Item not found" });
      
      if (updateData.$inc.quantity < 0 && item.quantity < Math.abs(updateData.$inc.quantity)) {
        return res.status(400).json({ error: "Insufficient stock" });
      }
      
      item.quantity += updateData.$inc.quantity;
      await item.save();
      res.json({ message: "Item stock updated", item });
    } else {
      const item = await Menu.findByIdAndUpdate(req.params.id, updateData, { new: true });
      if (!item) return res.status(404).json({ error: "Item not found" });
      res.json({ message: "Item updated", item });
    }
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
    const orders = await Order.find().sort({ createdAt: -1 }); // Sort by latest first
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
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});
// Add this route to get detailed statistics
app.get("/admin/detailed-stats", async (req, res) => {
  try {
    const [totalOrders, pendingOrders, readyOrders, revenueResult] = await Promise.all([
      Order.countDocuments(),
      Order.countDocuments({
        status: { $in: ['confirmed', 'preparing'] }
      }),
      Order.countDocuments({ status: 'ready' }),
      Order.aggregate([
        { $match: { status: { $ne: 'cancelled' } } },
        { $group: { _id: null, total: { $sum: '$totalAmount' } } }
      ])
    ]);
    
    // Get today's revenue
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayRevenue = await Order.aggregate([
      { 
        $match: { 
          status: { $ne: 'cancelled' },
          createdAt: { $gte: today }
        }
      },
      { $group: { _id: null, total: { $sum: '$totalAmount' } } }
    ]);
    
    res.json({
      totalOrders,
      pendingOrders,
      readyOrders,
      totalRevenue: revenueResult[0]?.total || 0,
      todayRevenue: todayRevenue[0]?.total || 0
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to fetch stats" });
  }
});
app.listen(5000, () => {
  console.log("Server running on port 5000");
});