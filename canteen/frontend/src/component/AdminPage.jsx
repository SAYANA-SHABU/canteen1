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
  
  // New states for revenue analytics
  const [revenueData, setRevenueData] = useState([]);
  const [revenuePeriod, setRevenuePeriod] = useState("day");
  const [revenueStats, setRevenueStats] = useState({
    today: 0,
    thisMonth: 0,
    thisYear: 0,
    total: 0
  });

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
      
      // Calculate revenue stats
      calculateRevenueStats(ordersData);
    } catch (err) {
      console.error("Error loading orders:", err);
    }
  };

  const loadRevenueAnalytics = async (period) => {
    try {
      const res = await axios.get(`http://localhost:5000/admin/revenue/analytics?period=${period}`);
      setRevenueData(res.data);
    } catch (err) {
      console.error("Error loading revenue analytics:", err);
    }
  };

  const calculateRevenueStats = (ordersData) => {
    const now = new Date();
    const today = now.toISOString().split('T')[0];
    const thisMonth = now.getMonth();
    const thisYear = now.getFullYear();
    
    let todayRevenue = 0;
    let monthRevenue = 0;
    let yearRevenue = 0;
    let totalRevenue = 0;
    
    ordersData.forEach(order => {
      if (order.status === 'collected') {
        const orderDate = new Date(order.collectedAt || order.updatedAt);
        const orderDay = orderDate.toISOString().split('T')[0];
        const orderMonth = orderDate.getMonth();
        const orderYear = orderDate.getFullYear();
        
        totalRevenue += order.totalAmount;
        
        if (orderYear === thisYear) {
          yearRevenue += order.totalAmount;
          
          if (orderMonth === thisMonth) {
            monthRevenue += order.totalAmount;
            
            if (orderDay === today) {
              todayRevenue += order.totalAmount;
            }
          }
        }
      }
    });
    
    setRevenueStats({
      today: todayRevenue,
      thisMonth: monthRevenue,
      thisYear: yearRevenue,
      total: totalRevenue
    });
  };

  useEffect(() => {
    loadItems();
    loadOrders();
  }, []);

  useEffect(() => {
    if (activeTab === 'revenue') {
      loadRevenueAnalytics(revenuePeriod);
    }
  }, [activeTab, revenuePeriod]);

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
      if (activeTab === 'revenue') {
        loadRevenueAnalytics(revenuePeriod);
      }
      alert(`Order ${token} marked as collected! Revenue updated.`);
    } catch (err) {
      alert("Failed to mark order as collected.");
    }
  };
const deleteOrder = async (token) => {
  if (!window.confirm("Are you sure you want to delete this order? This action cannot be undone.")) {
    return;
  }
  
  try {
    await axios.delete(`http://localhost:5000/orders/${token}`);
    loadOrders();
    alert(`Order ${token} deleted successfully!`);
  } catch (err) {
    console.error("Error deleting order:", err);
    alert("Failed to delete order.");
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

  // Calculate statistics - Only include collected orders in revenue
  const pendingOrders = orders.filter(o => o.status === 'confirmed' || o.status === 'preparing').length;
  const readyOrders = orders.filter(o => o.status === 'ready').length;
  const totalRevenue = orders
    .filter(o => o.status === 'collected')
    .reduce((sum, order) => sum + order.totalAmount, 0);

  // Format date based on period
  const formatDate = (dateString, period) => {
    try {
      // Handle different date formats
      let date;
      if (period === 'year') {
        // If it's just a year string
        if (/^\d{4}$/.test(dateString)) {
          return dateString;
        }
      } else if (period === 'month') {
        // If it's in YYYY-MM format
        if (/^\d{4}-\d{2}$/.test(dateString)) {
          const [year, month] = dateString.split('-');
          return new Date(year, month - 1).toLocaleDateString('en-IN', { 
            month: 'long', 
            year: 'numeric' 
          });
        }
      } else if (period === 'day') {
        // If it's in YYYY-MM-DD format
        if (/^\d{4}-\d{2}-\d{2}$/.test(dateString)) {
          const [year, month, day] = dateString.split('-');
          date = new Date(year, month - 1, day);
        } else {
          date = new Date(dateString);
        }
        return date.toLocaleDateString('en-IN', { 
          day: 'numeric', 
          month: 'short', 
          year: 'numeric' 
        });
      }
      
      // Fallback
      return dateString;
    } catch (error) {
      return dateString;
    }
  };

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
            style={{ fontFamily: 'Aparajita', fontSize: '25px', fontStyle: 'bold' }}
          > 
            Logout
          </button>
        </div>
      </header>

      {/* Tab Navigation - Added Revenue Tab */}
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
          <button 
            className={`tab-btn ${activeTab === 'revenue' ? 'active' : ''}`}
            onClick={() => setActiveTab('revenue')}
          >
            <span>💰</span>
            <span>Revenue</span>
            <span className="tab-badge"></span>
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

            {/* Statistics Cards - Updated to only show collected revenue */}
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
                  <div className="stat-label">Collected Revenue</div>
                  <div className="stat-number">₹{totalRevenue.toFixed(2)}</div>
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
  <div className="action-buttons" style={{ display: 'flex', gap: '0.5rem', flexDirection: 'column' }}>
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
    
    {/* Add delete button for all orders */}
    <button 
      className="action-btn delete-btn"
      onClick={() => deleteOrder(order.orderToken)}
      style={{ background: 'linear-gradient(135deg, #f44336 0%, #d32f2f 100%)', color: 'white' }}
    >
      <span>🗑️</span> Delete
    </button>
  </div>
</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        ) : activeTab === 'menu' ? (
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
        ) : (
          /* Revenue Analytics Tab */
          <div className="revenue-section">
            <div className="revenue-header">
              <h2>Revenue Analytics</h2>
              <button className="refresh-btn" onClick={() => loadRevenueAnalytics(revenuePeriod)}>
                <span>↻</span> Refresh
              </button>
            </div>

            {/* Revenue Statistics Cards */}
            <div className="revenue-stats">
              <div className="revenue-stat-card">
                <div className="revenue-stat-value">₹{revenueStats.today.toFixed(2)}</div>
                <div className="revenue-stat-label">Today's Revenue</div>
              </div>
              <div className="revenue-stat-card green">
                <div className="revenue-stat-value">₹{revenueStats.thisMonth.toFixed(2)}</div>
                <div className="revenue-stat-label">This Month</div>
              </div>
              <div className="revenue-stat-card blue">
                <div className="revenue-stat-value">₹{revenueStats.thisYear.toFixed(2)}</div>
                <div className="revenue-stat-label">This Year</div>
              </div>
              <div className="revenue-stat-card orange">
                <div className="revenue-stat-value">₹{revenueStats.total.toFixed(2)}</div>
                <div className="revenue-stat-label">Total Revenue</div>
              </div>
            </div>

            {/* Period Selector */}
            <div className="period-selector">
              <button 
                className={`period-btn ${revenuePeriod === 'day' ? 'active' : ''}`}
                onClick={() => setRevenuePeriod('day')}
              >
                Daily
              </button>
              <button 
                className={`period-btn ${revenuePeriod === 'month' ? 'active' : ''}`}
                onClick={() => setRevenuePeriod('month')}
              >
                Monthly
              </button>
              <button 
                className={`period-btn ${revenuePeriod === 'year' ? 'active' : ''}`}
                onClick={() => setRevenuePeriod('year')}
              >
                Yearly
              </button>
            </div>

            {/* Revenue Table */}
            <div className="revenue-table-container">
              <table className="revenue-table">
                <thead>
                  <tr>
                    <th>Period</th>
                    <th>Total Revenue</th>
                    <th>Orders</th>
                    <th>Average Order Value</th>
                  </tr>
                </thead>
                <tbody>
                  {revenueData.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="no-data">
                        No revenue data available
                      </td>
                    </tr>
                  ) : (
                    revenueData.map((item, index) => (
                      <tr key={index}>
                        <td className="date-cell">
                          {formatDate(item._id, revenuePeriod)}
                        </td>
                        <td className="revenue-amount">
                          ₹{item.totalRevenue.toFixed(2)}
                        </td>
                        <td>
                          <span className="order-count">{item.orderCount} orders</span>
                        </td>
                        <td className="average-order">
                          ₹{item.averageOrderValue ? item.averageOrderValue.toFixed(2) : '0.00'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}