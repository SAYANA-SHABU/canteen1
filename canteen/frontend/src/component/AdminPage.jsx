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

  const loadItems = async () => {
    const res = await axios.get("http://localhost:5000/menu");
    const itemsData = res.data;
    setItems(itemsData);
    setFilteredItems(itemsData);
    
    // Extract existing categories from items
    const categories = [...new Set(itemsData.map(item => item.category).filter(Boolean))];
    setExistingCategories(categories.sort());
  };

  const loadOrders = async () => {
    try {
      const res = await axios.get("http://localhost:5000/orders");
      const ordersData = res.data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
      setOrders(ordersData);
      setFilteredOrders(ordersData.filter(order => order.status !== 'collected'));
    } catch (err) {
      console.error("Error loading orders:", err);
    }
  };

  useEffect(() => {
    loadItems();
    loadOrders();
  }, []);

  // Filter orders when search changes
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

  // Filter items when search or category filter changes
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
      alert(`Order ${token} marked as ready!`);
    } catch (err) {
      alert("Failed to update order status.");
    }
  };

  const markOrderCollected = async (token) => {
    try {
      await axios.put(`http://localhost:5000/orders/${token}/status`, { status: 'collected' });
      loadOrders();
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

  // Calculate statistics
  const pendingOrders = orders.filter(o => o.status === 'confirmed' || o.status === 'preparing').length;
  const readyOrders = orders.filter(o => o.status === 'ready').length;
  const totalRevenue = orders.reduce((sum, order) => sum + order.totalAmount, 0);

  return (
    <div className="admin-dashboard">
      {/* Professional Header */}
     <header className="dashboard-header">
  <div className="header-content">
    <div className="header-left">
      <div className="header-text">
        <h1 style={{ fontSize: '50px', fontFamily: 'Aparajita' }}>
          Admin Dashboard
        </h1>
      </div>
    </div>
    <button 
    className="logout-btn" 
      onClick={handleLogout}
      style={{ fontFamily: 'Aparajita', fontSize: '25px' ,fontStyle: 'bold'}}
    > Logout
    </button>
  </div>
</header>

      {/* Tab Navigation */}
      <div className="tab-navigation">
        <div className="tab-container">
          <button 
            className={`tab-btn ${activeTab === 'orders' ? 'active' : ''}`}
            onClick={() => setActiveTab('orders')}
          >
            <span>📦</span>
            <span>Orders</span>
            <span className="tab-badge">{filteredOrders.length}</span>
          </button>
          <button 
            className={`tab-btn ${activeTab === 'menu' ? 'active' : ''}`}
            onClick={() => setActiveTab('menu')}
          >
            <span>🍽️</span>
            <span>Menu</span>
            <span className="tab-badge">{items.length}</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <main className="dashboard-main">
        {activeTab === 'orders' ? (
          <div className="orders-section">
            <div className="section-header">
              <h2>Active Orders</h2>
              <button className="refresh-btn" onClick={loadOrders}>
                <span>↻</span> Refresh
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
              <button className="search-btn">
                Search
              </button>
            </div>

            {/* Statistics Cards */}
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon">
                  ⏳
                </div>
                <div className="stat-content">
                  <div className="stat-label">Pending Orders</div>
                  <div className="stat-number">{pendingOrders}</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">
                  ✅
                </div>
                <div className="stat-content">
                  <div className="stat-label">Ready for Pickup</div>
                  <div className="stat-number">{readyOrders}</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">
                  💰
                </div>
                <div className="stat-content">
                  <div className="stat-label">Total Revenue</div>
                  <div className="stat-number">₹{totalRevenue}</div>
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
                        No active orders found
                      </td>
                    </tr>
                  ) : (
                    filteredOrders.map(order => (
                      <tr key={order._id}>
                        <td className="token-cell">
                          {order.orderToken}
                        </td>
                        <td className="payment-cell">
                          {order.paymentId}
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
                          ₹{order.totalAmount}
                        </td>
                        <td className="time-cell">
                          {new Date(order.createdAt).toLocaleTimeString([], { 
                            hour: '2-digit', 
                            minute: '2-digit' 
                          })}
                        </td>
                        <td className="status-cell">
                          <span className={`status-badge ${order.status}`}>
                            {order.status.toUpperCase()}
                          </span>
                        </td>
                        <td className="actions-cell">
                          <div className="action-buttons">
                            {(order.status === 'confirmed' || order.status === 'preparing') ? (
                              <button 
                                className="action-btn ready-btn"
                                onClick={() => markOrderReady(order.orderToken)}
                              >
                                <span>✓</span> Ready
                              </button>
                            ) : order.status === 'ready' ? (
                              <button 
                                className="action-btn collected-btn"
                                onClick={() => markOrderCollected(order.orderToken)}
                              >
                                <span>✓</span> Collected
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
            {/* Add/Edit Item Form */}
            <div className="form-card">
              <h3>{editId ? 'Edit Item' : 'Add New Item'}</h3>
              <div className="form-grid">
                <input
                  placeholder="Item Name"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  className="form-input"
                />
                <input
                  placeholder="Price (₹)"
                  type="number"
                  min="0"
                  step="0.01"
                  value={form.price}
                  onChange={e => setForm({ ...form, price: e.target.value })}
                  className="form-input"
                />
                <input
                  placeholder="Image URL"
                  value={form.image}
                  onChange={e => setForm({ ...form, image: e.target.value })}
                  className="form-input"
                />
                <input
                  placeholder="Quantity in Stock"
                  type="number"
                  min="0"
                  value={form.quantity}
                  onChange={e => setForm({ ...form, quantity: e.target.value })}
                  className="form-input"
                />
                
                {/* Category Input */}
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
                
                {/* Quick Categories */}
                <div className="quick-categories">
                  <span className="quick-categories-label">Quick select:</span>
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
                
                {/* Form Actions */}
                <div className="form-actions">
                  <button onClick={saveItem} className="save-btn">
                    {editId ? 'Update Item' : 'Add Item'}
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
                      Cancel
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Menu Items List */}
            <div className="menu-items-card">
              <div className="menu-header-with-stats">
                <h3>Menu Items</h3>
                <div className="category-stats">
                  <span className="category-count">
                    {filteredItems.length} items
                  </span>
                  <span className="category-count">
                    {existingCategories.length} categories
                  </span>
                </div>
              </div>
              
              {/* Search and Filter Bar */}
              <div className="search-bar" style={{ marginBottom: '1rem' }}>
                <input
                  type="text"
                  placeholder="Search items by name or category..."
                  value={menuSearch}
                  onChange={(e) => setMenuSearch(e.target.value)}
                  className="search-input"
                />
                <button className="search-btn">
                  Search
                </button>
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
              
              {/* Items Grid - 4 cards per row */}
              <div className="items-grid">
                {filteredItems.length === 0 ? (
                  <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '2rem', color: '#999' }}>
                    No items found
                  </div>
                ) : (
                  filteredItems.map(item => (
                    <div className="menu-item" key={item._id}>
                      <img 
                        src={item.image || "https://via.placeholder.com/300x150?text=No+Image"} 
                        alt={item.name}
                        className="item-img"
                      />
                      <div className="item-info">
                        <div className="item-header">
                          <h4>{item.name}</h4>
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
                            <span>✏️</span> Edit
                          </button>
                          <button className="delete-btn" onClick={() => deleteItem(item._id)}>
                            <span>🗑️</span> Delete
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