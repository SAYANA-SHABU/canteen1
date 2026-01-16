import { useState, useEffect } from "react";
import axios from "axios";
import "./AdminPage.css";

export default function AdminPage() {
  const [items, setItems] = useState([]);
  const [orders, setOrders] = useState([]);
  const [form, setForm] = useState({
    name: "",
    price: "",
    image: "",
    quantity: "",
    category: ""
  });
  const [editId, setEditId] = useState(null);
  const [activeTab, setActiveTab] = useState("orders");
  const [existingCategories, setExistingCategories] = useState([]);
  const [newCategoryInput, setNewCategoryInput] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [orderSearch, setOrderSearch] = useState("");
  const [menuSearch, setMenuSearch] = useState("");
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    readyOrders: 0,
    totalRevenue: 0
  });

  const loadItems = async () => {
    const res = await axios.get("http://localhost:5000/menu");
    const itemsData = res.data;
    setItems(itemsData);
    setFilteredItems(itemsData);
    
    const categories = [...new Set(itemsData.map(item => item.category).filter(Boolean))];
    setExistingCategories(categories.sort());
  };

  const loadOrders = async () => {
    try {
      const res = await axios.get("http://localhost:5000/orders");
      const ordersData = res.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setOrders(ordersData);
      setFilteredOrders(ordersData.filter(order => order.status !== 'collected'));
      
      // Calculate statistics
      const pendingOrders = ordersData.filter(o => o.status === 'confirmed' || o.status === 'preparing').length;
      const readyOrders = ordersData.filter(o => o.status === 'ready').length;
      const totalRevenue = ordersData.reduce((sum, order) => sum + order.totalAmount, 0);
      
      setStats({
        totalOrders: ordersData.length,
        pendingOrders,
        readyOrders,
        totalRevenue
      });
    } catch (err) {
      console.error("Error loading orders:", err);
    }
  };

  const loadStats = async () => {
    try {
      const res = await axios.get("http://localhost:5000/admin/stats");
      setStats(res.data);
    } catch (err) {
      console.error("Error loading stats:", err);
    }
  };

  useEffect(() => {
    loadItems();
    loadOrders();
    loadStats();
  }, []);

  useEffect(() => {
    if (!orderSearch.trim()) {
      setFilteredOrders(orders.filter(order => order.status !== 'collected'));
    } else {
      const searchLower = orderSearch.toLowerCase();
      const filtered = orders.filter(order => 
        order.status !== 'collected' && (
          order.orderToken.toLowerCase().includes(searchLower) ||
          order.paymentId.toLowerCase().includes(searchLower) ||
          order.items.some(item => item.name.toLowerCase().includes(searchLower))
        )
      );
      setFilteredOrders(filtered);
    }
  }, [orderSearch, orders]);

  useEffect(() => {
    let result = items;
    
    if (selectedFilter !== 'all') {
      result = result.filter(item => item.category === selectedFilter);
    }
    
    if (menuSearch.trim()) {
      const searchLower = menuSearch.toLowerCase();
      result = result.filter(item => 
        item.name.toLowerCase().includes(searchLower) ||
        (item.category && item.category.toLowerCase().includes(searchLower))
      );
    }
    
    setFilteredItems(result);
  }, [selectedFilter, menuSearch, items]);

  const saveItem = async () => {
    try {
      if (!form.name.trim()) {
        alert("Please enter item name");
        return;
      }
      if (!form.price || form.price <= 0) {
        alert("Please enter a valid price");
        return;
      }
      if (!form.category.trim()) {
        alert("Please select or enter a category");
        return;
      }
      
      const categoryData = {
        ...form,
        category: form.category.toLowerCase().trim(),
        price: parseFloat(form.price),
        quantity: parseInt(form.quantity) || 0
      };

      if (editId) {
        await axios.put(`http://localhost:5000/menu/update/${editId}`, categoryData);
        setEditId(null);
      } else {
        await axios.post("http://localhost:5000/menu/add", categoryData);
      }
      setForm({ name: "", price: "", image: "", quantity: "", category: "" });
      setNewCategoryInput("");
      loadItems();
    } catch (err) {
      console.error("Error saving item:", err);
      alert("Failed to save item.");
    }
  };

  const editItem = (item) => {
    setForm(item);
    setEditId(item._id);
    setNewCategoryInput(item.category || "");
  };

  const deleteItem = async (id) => {
    if (window.confirm("Are you sure you want to delete this item?")) {
      await axios.delete(`http://localhost:5000/menu/delete/${id}`);
      loadItems();
    }
  };

  const markOrderReady = async (token) => {
    try {
      await axios.put(`http://localhost:5000/orders/${token}/status`, { status: 'ready' });
      loadOrders();
      loadStats();
      alert(`Order ${token} marked as ready!`);
    } catch (err) {
      alert("Failed to update order status.");
    }
  };

  const markOrderCollected = async (token) => {
    try {
      await axios.put(`http://localhost:5000/orders/${token}/status`, { status: 'collected' });
      loadOrders();
      loadStats();
      alert(`Order ${token} marked as collected!`);
    } catch (err) {
      alert("Failed to mark order as collected.");
    }
  };

  const handleCategoryChange = (value) => {
    setForm({ ...form, category: value.toLowerCase().trim() });
    setNewCategoryInput(value);
  };

  const handleSelectCategory = (category) => {
    setForm({ ...form, category: category });
    setNewCategoryInput(category);
  };

  const handleLogout = () => {
    localStorage.removeItem('adminToken');
    window.location.href = '/';
  };

  return (
    <div className="admin-dashboard">
      {/* Elegant Header */}
      <header className="dashboard-header">
        <div className="header-content">
          <div className="header-left">
            <div className="header-text">
              <h1 className="dashboard-title">Admin Dashboard</h1>
              <p className="dashboard-subtitle">Manage your restaurant operations efficiently</p>
            </div>
          </div>
          <button 
            className="logout-btn" 
            onClick={handleLogout}
          >
            
            <span className="logout-text">Logout</span>
          </button>
        </div>
      </header>

      {/* Professional Tab Navigation */}
      <div className="tab-navigation">
        <div className="tab-container">
          <button 
            className={`tab-btn ${activeTab === 'orders' ? 'active' : ''}`}
            onClick={() => setActiveTab('orders')}
          >
            <span className="tab-icon">📦</span>
            <span className="tab-label">Orders</span>
            <span className="tab-badge">{filteredOrders.length}</span>
          </button>
          <button 
            className={`tab-btn ${activeTab === 'menu' ? 'active' : ''}`}
            onClick={() => setActiveTab('menu')}
          >
            <span className="tab-icon">🍽️</span>
            <span className="tab-label">Menu</span>
            <span className="tab-badge">{items.length}</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <main className="dashboard-main">
        {activeTab === 'orders' ? (
          <div className="orders-section">
            <div className="section-header">
              <div>
                <h2>Active Orders</h2>
                <p className="section-subtitle">Manage and track order progress</p>
              </div>
              <button className="refresh-btn" onClick={loadOrders}>
                <span className="refresh-icon">⟳</span>
                <span className="refresh-text">Refresh</span>
              </button>
            </div>

            {/* Search Bar */}
            <div className="search-bar">
              
              <input
                type="text"
                placeholder="Search by token, payment ID, or item name..."
                value={orderSearch}
                onChange={(e) => setOrderSearch(e.target.value)}
                className="search-input"
              />
            </div>

            {/* Professional Statistics Cards */}
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon">
                  📊
                </div>
                <div className="stat-content">
                  <div className="stat-label">Total Orders</div>
                  <div className="stat-number">{stats.totalOrders}</div>
                  <div className="stat-trend">All time</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">
                  ⏳
                </div>
                <div className="stat-content">
                  <div className="stat-label">Pending Orders</div>
                  <div className="stat-number">{stats.pendingOrders}</div>
                  <div className="stat-trend">Require attention</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">
                  ✅
                </div>
                <div className="stat-content">
                  <div className="stat-label">Ready for Pickup</div>
                  <div className="stat-number">{stats.readyOrders}</div>
                  <div className="stat-trend">Awaiting collection</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">
                  💰
                </div>
                <div className="stat-content">
                  <div className="stat-label">Total Revenue</div>
                  <div className="stat-number">₹{stats.totalRevenue.toLocaleString()}</div>
                  <div className="stat-trend">Current period</div>
                </div>
              </div>
            </div>

            {/* Orders Table */}
            <div className="orders-table-container">
              <table className="orders-table">
                <thead>
                  <tr>
                    <th>Token</th>
                    <th>Payment ID</th>
                    <th>Items</th>
                    <th>Amount</th>
                    <th>Time</th>
                    <th>Status</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredOrders.length === 0 ? (
                    <tr>
                      <td colSpan="7" className="empty-state">
                        <div className="empty-icon">📭</div>
                        <div className="empty-text">No active orders found</div>
                        <div className="empty-subtext">New orders will appear here</div>
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map(order => (
                      <tr key={order._id}>
                        <td className="token-cell">
                          <div className="token-value">{order.orderToken}</div>
                        </td>
                        <td className="payment-cell">
                          <div className="payment-value">{order.paymentId}</div>
                        </td>
                        <td className="items-cell">
                          <div className="items-list">
                            {order.items.map((item, index) => (
                              <div key={index} className="item-row">
                                <span className="item-name">{item.name}</span>
                                <span className="item-qty">×{item.quantity}</span>
                                <span className="item-price">₹{item.price * item.quantity}</span>
                              </div>
                            ))}
                          </div>
                        </td>
                        <td className="amount-cell">
                          <div className="amount-value">₹{order.totalAmount}</div>
                        </td>
                        <td className="time-cell">
                          <div className="time-value">{new Date(order.createdAt).toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}</div>
                          <div className="date-value">{new Date(order.createdAt).toLocaleDateString()}</div>
                        </td>
                        <td className="status-cell">
                          <span className={`status-badge ${order.status}`}>
                            {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                          </span>
                        </td>
                        <td className="actions-cell">
                          <div className="action-buttons">
                            {(order.status === 'confirmed' || order.status === 'preparing') ? (
                              <button 
                                className="action-btn ready-btn"
                                onClick={() => markOrderReady(order.orderToken)}
                              >
                                <span className="action-icon">✓</span>
                                <span className="action-text">Mark Ready</span>
                              </button>
                            ) : order.status === 'ready' ? (
                              <button 
                                className="action-btn collected-btn"
                                onClick={() => markOrderCollected(order.orderToken)}
                              >
                                <span className="action-icon">✓</span>
                                <span className="action-text">Mark Collected</span>
                              </button>
                            ) : null}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="menu-section">
            {/* Professional Add/Edit Form */}
            <div className="form-card">
              <h3>{editId ? 'Edit Menu Item' : 'Add New Menu Item'}</h3>
              <p className="form-subtitle">{editId ? 'Update item details' : 'Create a new menu item with details below'}</p>
              
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">Item Name *</label>
                  <input
                    placeholder="Enter item name"
                    value={form.name}
                    onChange={e => setForm({ ...form, name: e.target.value })}
                    className="form-input"
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Price (₹) *</label>
                  <input
                    placeholder="0.00"
                    type="number"
                    min="0"
                    step="0.01"
                    value={form.price}
                    onChange={e => setForm({ ...form, price: e.target.value })}
                    className="form-input"
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Image URL</label>
                  <input
                    placeholder="https://example.com/image.jpg"
                    value={form.image}
                    onChange={e => setForm({ ...form, image: e.target.value })}
                    className="form-input"
                  />
                </div>
                
                <div className="form-group">
                  <label className="form-label">Stock Quantity</label>
                  <input
                    placeholder="0"
                    type="number"
                    min="0"
                    value={form.quantity}
                    onChange={e => setForm({ ...form, quantity: e.target.value })}
                    className="form-input"
                  />
                </div>
                
                <div className="form-group full-width">
                  <label className="form-label">Category *</label>
                  <div className="category-input-group">
                    <input
                      list="category-options"
                      placeholder="Enter or select category"
                      value={newCategoryInput}
                      onChange={e => handleCategoryChange(e.target.value)}
                      className="form-input"
                    />
                    <datalist id="category-options">
                      {existingCategories.map((category, index) => (
                        <option key={index} value={category} />
                      ))}
                    </datalist>
                  </div>
                </div>
                
                <div className="form-group full-width">
                  <label className="form-label">Quick Categories</label>
                  <div className="quick-categories">
                    {existingCategories.slice(0, 6).map((category) => (
                      <button
                        key={category}
                        type="button"
                        className={`quick-category-btn ${form.category === category ? 'active' : ''}`}
                        onClick={() => handleSelectCategory(category)}
                      >
                        {category}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="form-actions">
                  <button onClick={saveItem} className="save-btn">
                    <span className="btn-icon">{editId ? '✏️' : '➕'}</span>
                    <span className="btn-text">{editId ? 'Update Item' : 'Add Item'}</span>
                  </button>
                  {editId && (
                    <button 
                      onClick={() => {
                        setForm({ name: "", price: "", image: "", quantity: "", category: "" });
                        setNewCategoryInput("");
                        setEditId(null);
                      }}
                      className="cancel-btn"
                    >
                      <span className="btn-icon">✕</span>
                      <span className="btn-text">Cancel</span>
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Menu Items Grid */}
            <div className="menu-items-card">
              <div className="menu-header-with-stats">
                <div>
                  <h3>Menu Items</h3>
                  <p className="menu-subtitle">Manage your restaurant menu</p>
                </div>
                <div className="category-stats">
                  <span className="category-count">
                    <span className="stat-number">{filteredItems.length}</span>
                    <span className="stat-label">items</span>
                  </span>
                  <span className="category-count">
                    <span className="stat-number">{existingCategories.length}</span>
                    <span className="stat-label">categories</span>
                  </span>
                </div>
              </div>
              
              {/* Search and Filter */}
              <div className="search-filter-bar">
                <div className="search-bar">
                  
                  <input
                    type="text"
                    placeholder="Search items by name or category..."
                    value={menuSearch}
                    onChange={(e) => setMenuSearch(e.target.value)}
                    className="search-input"
                  />
                </div>
              </div>
              
              {/* Category Filter */}
              <div className="admin-category-filter">
                <button 
                  className={`category-filter-btn ${selectedFilter === 'all' ? 'active' : ''}`}
                  onClick={() => setSelectedFilter('all')}
                >
                  All ({items.length})
                </button>
                {existingCategories.map(category => {
                  const categoryItems = items.filter(item => item.category === category);
                  return (
                    <button 
                      key={category}
                      className={`category-filter-btn ${selectedFilter === category ? 'active' : ''}`}
                      onClick={() => setSelectedFilter(category)}
                    >
                      {category} ({categoryItems.length})
                    </button>
                  );
                })}
              </div>
              
              {/* Items Grid */}
              <div className="items-grid">
                {filteredItems.length === 0 ? (
                  <div className="empty-menu-state">
                    <div className="empty-icon">🍽️</div>
                    <div className="empty-text">No items found</div>
                    <div className="empty-subtext">Try adjusting your search or add new items</div>
                  </div>
                ) : (
                  filteredItems.map(item => (
                    <div className="menu-item" key={item._id}>
                      <div className="item-image-container">
                        <img 
                          src={item.image || "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&h-250&fit=crop"} 
                          alt={item.name}
                          className="item-img"
                          onError={(e) => {
                            e.target.src = "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&h-250&fit=crop";
                          }}
                        />
                        <div className="item-overlay">
                          <button className="edit-btn-overlay" onClick={() => editItem(item)}>
                            ✏️ Edit
                          </button>
                        </div>
                      </div>
                      <div className="item-info">
                        <div className="item-header">
                          <h4 className="item-title">{item.name}</h4>
                          <span className="item-category-badge">
                            {item.category || "Uncategorized"}
                          </span>
                        </div>
                        <div className="item-details">
                          <span className="price">₹{item.price}</span>
                          <span className={`stock ${item.quantity > 0 ? 'in-stock' : 'out-of-stock'}`}>
                            {item.quantity > 0 ? `${item.quantity} in stock` : "Out of stock"}
                          </span>
                        </div>
                        <div className="item-actions">
                          <button className="edit-btn" onClick={() => editItem(item)}>
                            <span className="action-icon">✏️</span>
                            <span className="action-text">Edit</span>
                          </button>
                          <button className="delete-btn" onClick={() => deleteItem(item._id)}>
                            <span className="action-icon">🗑️</span>
                            <span className="action-text">Delete</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}