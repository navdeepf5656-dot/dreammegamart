import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { 
  ShoppingBag, Search, User as UserIcon, Plus, Trash2, CheckCircle2, 
  Send, Lock, Phone, Home, LogOut, ChevronRight, Store, ArrowRight,
  ShieldCheck, AlertCircle, ShoppingCart, X, Filter
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

const VILLAGES = [
  'Rampur', 'Sundarpur', 'Kishanpur', 'Govindpur', 'Akbarpur', 
  'Chandpur', 'Shivpur', 'Devpur', 'Madhavpur', 'Other'
];

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [view, setView] = useState('store'); // 'store' | 'admin'
  const [adminTab, setAdminTab] = useState('requests'); // 'requests' | 'products' | 'categories' | 'orders'
  
  // Data States
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [userRequests, setUserRequests] = useState([]);
  const [orders, setOrders] = useState([]);
  
  // Filters & Search
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Cart
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);

  // Auth & Request Modals
  const [authModal, setAuthModal] = useState(false); // false | 'login' | 'request' | 'pending'
  const [loginCreds, setLoginCreds] = useState({ userId: '', password: '' });
  const [requestData, setRequestData] = useState({ name: '', phone: '', village: VILLAGES[0] });
  const [submittedReqInfo, setSubmittedReqInfo] = useState(null);

  // Admin Form States
  const [newCat, setNewCat] = useState({ name: '', image: '' });
  const [newProd, setNewProd] = useState({ name: '', category: '', price: '', description: '', image: '', stock: 50 });
  const [approvalModal, setApprovalModal] = useState(null); // request object to approve
  const [customCreds, setCustomCreds] = useState({ userId: '', password: '' });

  // Notifications / Feedback
  const [notification, setNotification] = useState('');

  useEffect(() => {
    fetchCategories();
    fetchProducts();
  }, []);

  useEffect(() => {
    if (view === 'admin') {
      fetchUserRequests();
      fetchOrders();
    }
  }, [view]);

  const showNotify = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(''), 4000);
  };

  const fetchCategories = async () => {
    try {
      const res = await axios.get(`${API_BASE}/categories`);
      setCategories(res.data);
    } catch (err) { console.error(err); }
  };

  const fetchProducts = async () => {
    try {
      const res = await axios.get(`${API_BASE}/products`);
      setProducts(res.data);
    } catch (err) { console.error(err); }
  };

  const fetchUserRequests = async () => {
    try {
      const res = await axios.get(`${API_BASE}/admin/requests`);
      setUserRequests(res.data);
    } catch (err) { console.error(err); }
  };

  const fetchOrders = async () => {
    try {
      const res = await axios.get(`${API_BASE}/admin/orders`);
      setOrders(res.data);
    } catch (err) { console.error(err); }
  };

  // Auth Handlers
  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API_BASE}/auth/login`, loginCreds);
      setCurrentUser(res.data.user);
      setAuthModal(false);
      showNotify(`Welcome back, ${res.data.user.name}!`);
      if (res.data.user.role === 'admin') {
        setView('admin');
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Login failed');
    }
  };

  const handleRequestSubmit = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API_BASE}/requests/create`, requestData);
      setSubmittedReqInfo(res.data.request);
      setAuthModal('pending');
    } catch (err) {
      alert(err.response?.data?.message || 'Request submission failed');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setView('store');
    showNotify('Logged out successfully');
  };

  // Admin Category CRUD
  const handleCreateCategory = async (e) => {
    e.preventDefault();
    if (!newCat.name) return;
    try {
      await axios.post(`${API_BASE}/categories`, newCat);
      setNewCat({ name: '', image: '' });
      fetchCategories();
      showNotify('Category created!');
    } catch (err) { console.error(err); }
  };

  const handleDeleteCategory = async (id) => {
    if (!confirm('Delete this category?')) return;
    try {
      await axios.delete(`${API_BASE}/categories/${id}`);
      fetchCategories();
      showNotify('Category deleted');
    } catch (err) { console.error(err); }
  };

  // Admin Product CRUD
  const handleCreateProduct = async (e) => {
    e.preventDefault();
    if (!newProd.name || !newProd.category || !newProd.price) {
      return alert('Please fill in required fields');
    }
    try {
      await axios.post(`${API_BASE}/products`, newProd);
      setNewProd({ name: '', category: '', price: '', description: '', image: '', stock: 50 });
      fetchProducts();
      showNotify('Product created successfully!');
    } catch (err) { console.error(err); }
  };

  const handleDeleteProduct = async (id) => {
    if (!confirm('Delete this product?')) return;
    try {
      await axios.delete(`${API_BASE}/products/${id}`);
      fetchProducts();
      showNotify('Product deleted');
    } catch (err) { console.error(err); }
  };

  // Admin Approve User Access & Generate Credentials
  const handleApproveUser = async (e) => {
    e.preventDefault();
    if (!approvalModal) return;

    try {
      const res = await axios.post(`${API_BASE}/admin/requests/approve`, {
        requestId: approvalModal._id,
        customUserId: customCreds.userId || undefined,
        password: customCreds.password || undefined
      });

      const { userId, password, phone, name } = res.data.credentials;
      
      // WhatsApp link preparation
      const waMessage = encodeURIComponent(
        `Hello ${name},\n\nYour account request for Village SuperStore has been APPROVED! 🎉\n\nLogin Details:\nUser ID: ${userId}\nPassword: ${password}\n\nLogin & shop here: http://localhost:5173`
      );
      const cleanPhone = phone.replace(/[^0-9]/g, '');
      const waUrl = `https://api.whatsapp.com/send?phone=91${cleanPhone}&text=${waMessage}`;

      // Open WhatsApp in new window/tab
      window.open(waUrl, '_blank');

      setApprovalModal(null);
      setCustomCreds({ userId: '', password: '' });
      fetchUserRequests();
      showNotify(`User approved! Credentials generated: ID (${userId}). WhatsApp window opened.`);
    } catch (err) {
      alert(err.response?.data?.message || 'Approval failed');
    }
  };

  // Cart operations
  const addToCart = (product) => {
    if (!currentUser) {
      setAuthModal('login');
      return;
    }
    const existing = cart.find(item => item._id === product._id);
    if (existing) {
      setCart(cart.map(item => item._id === product._id ? { ...item, qty: item.qty + 1 } : item));
    } else {
      setCart([...cart, { ...product, qty: 1 }]);
    }
    showNotify(`${product.name} added to cart!`);
  };

  const updateCartQty = (id, delta) => {
    setCart(cart.map(item => {
      if (item._id === id) {
        const newQty = item.qty + delta;
        return newQty > 0 ? { ...item, qty: newQty } : null;
      }
      return item;
    }).filter(Boolean));
  };

  const handleCheckout = async () => {
    if (!currentUser) {
      setAuthModal('login');
      return;
    }
    if (cart.length === 0) return;

    try {
      const totalAmount = cart.reduce((acc, item) => acc + (item.price * item.qty), 0);
      await axios.post(`${API_BASE}/orders`, {
        userId: currentUser.id,
        items: cart.map(i => ({ product: i._id, name: i.name, quantity: i.qty, price: i.price })),
        totalAmount,
        shippingAddress: {
          name: currentUser.name,
          phone: currentUser.phone,
          village: currentUser.village,
          details: `Village: ${currentUser.village}`
        }
      });

      setCart([]);
      setIsCartOpen(false);
      showNotify('🎉 Order placed successfully!');
    } catch (err) {
      alert(err.response?.data?.message || 'Checkout failed');
    }
  };

  // Filtered Products
  const filteredProducts = products.filter(p => {
    const pCat = typeof p.category === 'object' ? p.category._id : p.category;
    const matchesCat = selectedCategory === 'all' || pCat === selectedCategory;
    const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCat && matchesSearch;
  });

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      
      {/* Toast Notification */}
      {notification && (
        <div className="fixed top-4 right-4 z-50 bg-slate-900 text-white px-5 py-3 rounded-xl shadow-2xl flex items-center gap-3 animate-bounce">
          <CheckCircle2 className="w-5 h-5 text-emerald-400" />
          <span className="font-medium text-sm">{notification}</span>
        </div>
      )}

      {/* Navigation Header */}
      <header className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-slate-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          
          {/* Logo & View Toggle */}
          <div className="flex items-center gap-6">
            <div 
              onClick={() => setView('store')}
              className="flex items-center gap-2.5 cursor-pointer group"
            >
              <div className="bg-emerald-600 group-hover:bg-emerald-700 text-white p-2 rounded-xl transition-all shadow-md shadow-emerald-600/20">
                <Store className="w-6 h-6" />
              </div>
              <div>
                <span className="font-extrabold text-xl tracking-tight text-slate-900 block leading-none">
                  Village<span className="text-emerald-600">Store</span>
                </span>
                <span className="text-[10px] text-slate-500 font-semibold tracking-wider uppercase">Direct Supply</span>
              </div>
            </div>

            {currentUser?.role === 'admin' && (
              <div className="hidden sm:flex bg-slate-100 p-1 rounded-xl border border-slate-200">
                <button
                  onClick={() => setView('store')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    view === 'store' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Store Front
                </button>
                <button
                  onClick={() => setView('admin')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                    view === 'admin' ? 'bg-emerald-600 text-white shadow-sm' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <ShieldCheck className="w-3.5 h-3.5" />
                  Admin Panel
                </button>
              </div>
            )}
          </div>

          {/* Search bar (Only on store view) */}
          {view === 'store' && (
            <div className="flex-1 max-w-md hidden md:block relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search fresh groceries, vegetables..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-100 border border-transparent rounded-xl text-sm focus:outline-none focus:bg-white focus:border-emerald-500 transition-all"
              />
            </div>
          )}

          {/* User Controls */}
          <div className="flex items-center gap-3">
            {view === 'store' && (
              <button
                onClick={() => setIsCartOpen(true)}
                className="relative p-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all text-slate-700"
              >
                <ShoppingCart className="w-5 h-5" />
                {cart.length > 0 && (
                  <span className="absolute -top-1 -right-1 bg-emerald-600 text-white text-[11px] font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-white">
                    {cart.reduce((a, b) => a + b.qty, 0)}
                  </span>
                )}
              </button>
            )}

            {currentUser ? (
              <div className="flex items-center gap-3 bg-slate-100 pl-3 pr-1 py-1 rounded-xl">
                <div className="text-right hidden sm:block">
                  <div className="text-xs font-bold text-slate-900">{currentUser.name}</div>
                  <div className="text-[10px] text-slate-500 font-medium">ID: {currentUser.userId} ({currentUser.village})</div>
                </div>
                <button
                  onClick={handleLogout}
                  title="Logout"
                  className="p-2 hover:bg-slate-200 rounded-lg text-slate-600 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setAuthModal('login')}
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl transition-all shadow-md shadow-emerald-600/20"
                >
                  Sign In / Request ID
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* MAIN CONTENT AREA */}
      {view === 'store' ? (
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
          
          {/* Banner Hero */}
          <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-emerald-800 to-teal-900 text-white p-8 sm:p-12 mb-10 shadow-xl">
            <div className="relative z-10 max-w-xl">
              <span className="inline-block px-3 py-1 bg-emerald-500/20 text-emerald-300 text-xs font-bold rounded-full mb-3 backdrop-blur-md">
                🌾 Direct Village Delivery
              </span>
              <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight mb-4 leading-tight">
                Fresh Supplies Delivered To Your Village.
              </h1>
              <p className="text-emerald-100/90 text-sm sm:text-base mb-6 font-medium">
                No ID? Request access with your Phone Number & Village selection to get your login ID via WhatsApp.
              </p>
              {!currentUser && (
                <button
                  onClick={() => setAuthModal('request')}
                  className="px-6 py-3 bg-white text-emerald-900 hover:bg-emerald-50 text-xs font-extrabold uppercase tracking-wider rounded-xl shadow-lg transition-all flex items-center gap-2"
                >
                  Request User ID Now <ArrowRight className="w-4 h-4" />
                </button>
              )}
            </div>
            <div className="absolute right-0 bottom-0 top-0 w-1/2 opacity-20 pointer-events-none bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-white via-transparent to-transparent"></div>
          </div>

          {/* Category Pills Slider */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                <Filter className="w-4 h-4 text-emerald-600" /> Categories
              </h2>
              {selectedCategory !== 'all' && (
                <button 
                  onClick={() => setSelectedCategory('all')}
                  className="text-xs text-emerald-600 font-semibold hover:underline"
                >
                  Clear Filter
                </button>
              )}
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
              <button
                onClick={() => setSelectedCategory('all')}
                className={`px-5 py-2.5 rounded-2xl text-xs font-bold whitespace-nowrap transition-all border ${
                  selectedCategory === 'all'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/20'
                    : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                }`}
              >
                All Products
              </button>
              {categories.map((cat) => (
                <button
                  key={cat._id}
                  onClick={() => setSelectedCategory(cat._id)}
                  className={`px-4 py-2 rounded-2xl text-xs font-bold whitespace-nowrap transition-all flex items-center gap-2 border ${
                    selectedCategory === cat._id
                      ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/20'
                      : 'bg-white text-slate-700 border-slate-200 hover:border-slate-300'
                  }`}
                >
                  {cat.image && (
                    <img src={cat.image} alt="" className="w-5 h-5 rounded-full object-cover" />
                  )}
                  {cat.name}
                </button>
              ))}
            </div>
          </div>

          {/* Product Grid */}
          <div className="mb-12">
            <h2 className="text-xl font-bold text-slate-900 mb-6">Available Items</h2>

            {filteredProducts.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-slate-200">
                <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-base font-bold text-slate-700">No products found</h3>
                <p className="text-xs text-slate-500 mt-1">Try selecting a different category or clear your search.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                {filteredProducts.map((product) => (
                  <div 
                    key={product._id} 
                    className="bg-white rounded-3xl border border-slate-100 overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 flex flex-col group"
                  >
                    <div className="relative aspect-square overflow-hidden bg-slate-100">
                      <img 
                        src={product.image} 
                        alt={product.name} 
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" 
                      />
                      <div className="absolute top-3 right-3 bg-white/90 backdrop-blur-md px-2.5 py-1 rounded-full text-[11px] font-extrabold text-emerald-700 border border-white/50">
                        ₹{product.price}
                      </div>
                    </div>
                    
                    <div className="p-5 flex-1 flex flex-col justify-between">
                      <div>
                        <h3 className="font-bold text-slate-900 text-sm mb-1 group-hover:text-emerald-600 transition-colors line-clamp-1">
                          {product.name}
                        </h3>
                        <p className="text-xs text-slate-500 line-clamp-2 mb-4">
                          {product.description || 'Fresh quality stock from trusted suppliers.'}
                        </p>
                      </div>

                      <div className="flex items-center justify-between gap-3 pt-3 border-t border-slate-50">
                        <div>
                          <span className="text-[10px] text-slate-400 font-semibold block uppercase">Price</span>
                          <span className="text-base font-extrabold text-slate-900">₹{product.price}</span>
                        </div>
                        <button
                          onClick={() => addToCart(product)}
                          className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-600/20 active:scale-95 flex items-center gap-1.5"
                        >
                          <Plus className="w-4 h-4" /> Add
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </main>
      ) : (
        /* ADMIN PANEL VIEW */
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-7 h-7 text-emerald-600" /> Admin Control Dashboard
              </h1>
              <p className="text-xs text-slate-500 font-medium mt-1">
                Manage user requests, dispatch login IDs via WhatsApp, and control store inventory.
              </p>
            </div>

            {/* Admin Tabs */}
            <div className="flex bg-slate-200/70 p-1 rounded-2xl self-start md:self-auto border border-slate-300/50">
              {[
                { id: 'requests', label: `User Requests (${userRequests.filter(r => r.status === 'pending').length})` },
                { id: 'products', label: `Products (${products.length})` },
                { id: 'categories', label: `Categories (${categories.length})` },
                { id: 'orders', label: `Orders (${orders.length})` }
              ].map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setAdminTab(tab.id)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                    adminTab === tab.id 
                      ? 'bg-white text-slate-900 shadow-md shadow-slate-200' 
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* TAB 1: USER REQUESTS MANAGEMENT & WHATSAPP DISPATCH */}
          {adminTab === 'requests' && (
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-100 flex items-center justify-between">
                <div>
                  <h2 className="text-base font-bold text-slate-900">User Account Requests</h2>
                  <p className="text-xs text-slate-500">Approve requests to create User ID & Password and send instantly via WhatsApp.</p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-bold uppercase border-b border-slate-100">
                    <tr>
                      <th className="px-6 py-4">Customer Name</th>
                      <th className="px-6 py-4">Phone Number</th>
                      <th className="px-6 py-4">Village</th>
                      <th className="px-6 py-4">Status</th>
                      <th className="px-6 py-4">Generated Credentials</th>
                      <th className="px-6 py-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {userRequests.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="px-6 py-12 text-center text-slate-400 font-medium">
                          No registration requests submitted yet.
                        </td>
                      </tr>
                    ) : (
                      userRequests.map((req) => (
                        <tr key={req._id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="px-6 py-4 font-bold text-slate-900">{req.name}</td>
                          <td className="px-6 py-4 font-semibold text-slate-700">{req.phone}</td>
                          <td className="px-6 py-4 font-medium text-slate-600">
                            <span className="px-2.5 py-1 bg-slate-100 rounded-lg border border-slate-200">
                              📍 {req.village}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wide ${
                              req.status === 'approved' 
                                ? 'bg-emerald-100 text-emerald-800' 
                                : 'bg-amber-100 text-amber-800'
                            }`}>
                              {req.status}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            {req.generatedUserId ? (
                              <div className="font-mono text-[11px] text-slate-800">
                                <div><span className="text-slate-400">ID:</span> <b>{req.generatedUserId}</b></div>
                                <div><span className="text-slate-400">Pass:</span> <b>{req.generatedPassword}</b></div>
                              </div>
                            ) : (
                              <span className="text-slate-400 italic">Not generated</span>
                            )}
                          </td>
                          <td className="px-6 py-4 text-right">
                            {req.status === 'pending' ? (
                              <button
                                onClick={() => {
                                  setApprovalModal(req);
                                  setCustomCreds({
                                    userId: 'USR' + Math.floor(1000 + Math.random() * 9000),
                                    password: Math.random().toString(36).slice(-6)
                                  });
                                }}
                                className="px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-md shadow-emerald-600/20 transition-all flex items-center gap-1.5 ml-auto"
                              >
                                <Send className="w-3.5 h-3.5" /> Generate & Send WhatsApp
                              </button>
                            ) : (
                              <button
                                onClick={() => {
                                  const waMessage = encodeURIComponent(
                                    `Hello ${req.name},\n\nReminder of your Village SuperStore Login Details:\nUser ID: ${req.generatedUserId}\nPassword: ${req.generatedPassword}\n\nLogin & shop here: http://localhost:5173`
                                  );
                                  const cleanPhone = req.phone.replace(/[^0-9]/g, '');
                                  window.open(`https://api.whatsapp.com/send?phone=91${cleanPhone}&text=${waMessage}`, '_blank');
                                }}
                                className="px-3 py-1.5 bg-slate-100 hover:bg-emerald-50 text-emerald-700 hover:text-emerald-800 border border-slate-200 hover:border-emerald-300 font-bold rounded-xl text-[11px] transition-all flex items-center gap-1.5 ml-auto"
                              >
                                <Send className="w-3 h-3 text-emerald-600" /> Resend WhatsApp
                              </button>
                            )}
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 2: PRODUCTS MANAGEMENT */}
          {adminTab === 'products' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Product Creation Form */}
              <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm h-fit">
                <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <Plus className="w-5 h-5 text-emerald-600" /> Add New Product
                </h2>
                <form onSubmit={handleCreateProduct} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Product Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Fresh Mustard Oil 1L"
                      value={newProd.name}
                      onChange={e => setNewProd({ ...newProd, name: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-emerald-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Category *</label>
                    <select
                      required
                      value={newProd.category}
                      onChange={e => setNewProd({ ...newProd, category: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-emerald-600"
                    >
                      <option value="">Select Category</option>
                      {categories.map(c => (
                        <option key={c._id} value={c._id}>{c.name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Price (₹) *</label>
                      <input
                        type="number"
                        required
                        placeholder="180"
                        value={newProd.price}
                        onChange={e => setNewProd({ ...newProd, price: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-emerald-600"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Stock</label>
                      <input
                        type="number"
                        placeholder="50"
                        value={newProd.stock}
                        onChange={e => setNewProd({ ...newProd, stock: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-emerald-600"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Image URL</label>
                    <input
                      type="url"
                      placeholder="https://..."
                      value={newProd.image}
                      onChange={e => setNewProd({ ...newProd, image: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-emerald-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Description</label>
                    <textarea
                      rows="3"
                      placeholder="Brief details about the product..."
                      value={newProd.description}
                      onChange={e => setNewProd({ ...newProd, description: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-emerald-600"
                    ></textarea>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-emerald-600/20"
                  >
                    Save Product
                  </button>
                </form>
              </div>

              {/* Product List */}
              <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden">
                <div className="p-6 border-b border-slate-100">
                  <h2 className="text-base font-bold text-slate-900">Current Store Products</h2>
                </div>
                <div className="divide-y divide-slate-100">
                  {products.map(p => (
                    <div key={p._id} className="p-4 flex items-center justify-between gap-4 hover:bg-slate-50">
                      <div className="flex items-center gap-4">
                        <img src={p.image} alt="" className="w-12 h-12 rounded-xl object-cover border border-slate-200" />
                        <div>
                          <h4 className="font-bold text-slate-900 text-xs">{p.name}</h4>
                          <span className="text-[11px] text-slate-500 font-medium">₹{p.price} • Stock: {p.stock}</span>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteProduct(p._id)}
                        className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: CATEGORIES MANAGEMENT */}
          {adminTab === 'categories' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm h-fit">
                <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
                  <Plus className="w-5 h-5 text-emerald-600" /> Create Category
                </h2>
                <form onSubmit={handleCreateCategory} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Category Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Spices & Oils"
                      value={newCat.name}
                      onChange={e => setNewCat({ ...newCat, name: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-emerald-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Cover Image URL</label>
                    <input
                      type="url"
                      placeholder="https://..."
                      value={newCat.image}
                      onChange={e => setNewCat({ ...newCat, image: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-emerald-600"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-emerald-600/20"
                  >
                    Save Category
                  </button>
                </form>
              </div>

              <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden p-6">
                <h2 className="text-base font-bold text-slate-900 mb-4">Existing Categories</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {categories.map(c => (
                    <div key={c._id} className="flex items-center justify-between p-3 border border-slate-100 rounded-2xl bg-slate-50">
                      <div className="flex items-center gap-3">
                        <img src={c.image} alt="" className="w-10 h-10 rounded-xl object-cover" />
                        <span className="font-bold text-slate-900 text-xs">{c.name}</span>
                      </div>
                      <button
                        onClick={() => handleDeleteCategory(c._id)}
                        className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: ORDERS */}
          {adminTab === 'orders' && (
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6">
              <h2 className="text-base font-bold text-slate-900 mb-4">Customer Orders</h2>
              {orders.length === 0 ? (
                <p className="text-xs text-slate-500 py-6 text-center">No orders placed yet.</p>
              ) : (
                <div className="space-y-4">
                  {orders.map(order => (
                    <div key={order._id} className="p-4 border border-slate-100 rounded-2xl bg-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-xs text-slate-900">Order #{order._id.slice(-6)}</span>
                          <span className="text-[10px] px-2 py-0.5 bg-emerald-100 text-emerald-800 font-extrabold rounded-full">{order.status}</span>
                        </div>
                        <div className="text-xs text-slate-600">
                          Customer: <b>{order.shippingAddress?.name || 'User'}</b> (Phone: {order.shippingAddress?.phone}, Village: {order.shippingAddress?.village})
                        </div>
                        <div className="text-[11px] text-slate-500 mt-1">
                          Items: {order.items?.map(i => `${i.name} (${i.quantity}x)`).join(', ')}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-xs text-slate-400 font-medium">Total Amount</div>
                        <div className="text-lg font-black text-slate-900">₹{order.totalAmount}</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </main>
      )}

      {/* MODAL: AUTHENTICATION / REQUEST ID */}
      {authModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 sm:p-8 shadow-2xl relative">
            <button
              onClick={() => setAuthModal(false)}
              className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            {authModal === 'login' && (
              <div>
                <div className="text-center mb-6">
                  <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <Lock className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">Customer Login</h3>
                  <p className="text-xs text-slate-500 mt-1">Enter your assigned User ID and Password to sign in.</p>
                </div>

                <form onSubmit={handleLogin} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">User ID</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. USR4921 or admin"
                      value={loginCreds.userId}
                      onChange={e => setLoginCreds({ ...loginCreds, userId: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-emerald-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Password</label>
                    <input
                      type="password"
                      required
                      placeholder="••••••••"
                      value={loginCreds.password}
                      onChange={e => setLoginCreds({ ...loginCreds, password: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-emerald-600"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-all shadow-lg shadow-emerald-600/20"
                  >
                    Sign In
                  </button>
                </form>

                <div className="mt-6 pt-6 border-t border-slate-100 text-center">
                  <p className="text-xs text-slate-600 mb-2">Don't have a User ID & Password?</p>
                  <button
                    onClick={() => setAuthModal('request')}
                    className="text-xs font-bold text-emerald-600 hover:text-emerald-700 hover:underline flex items-center justify-center gap-1 mx-auto"
                  >
                    Request New Account ID <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            )}

            {authModal === 'request' && (
              <div>
                <div className="text-center mb-6">
                  <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
                    <UserIcon className="w-6 h-6" />
                  </div>
                  <h3 className="text-xl font-bold text-slate-900">Request User Account ID</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    Fill details below. Admin will generate your User ID and send it directly to your WhatsApp!
                  </p>
                </div>

                <form onSubmit={handleRequestSubmit} className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Your Full Name *</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Gurpreet Singh"
                      value={requestData.name}
                      onChange={e => setRequestData({ ...requestData, name: e.target.value })}
                      className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-emerald-600"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">WhatsApp Phone Number *</label>
                    <div className="relative">
                      <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <input
                        type="tel"
                        required
                        placeholder="9876543210"
                        value={requestData.phone}
                        onChange={e => setRequestData({ ...requestData, phone: e.target.value })}
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-emerald-600"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Select Village Location *</label>
                    <div className="relative">
                      <Home className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                      <select
                        required
                        value={requestData.village}
                        onChange={e => setRequestData({ ...requestData, village: e.target.value })}
                        className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-emerald-600 appearance-none"
                      >
                        {VILLAGES.map(v => (
                          <option key={v} value={v}>{v}</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-all shadow-lg shadow-emerald-600/20"
                  >
                    Submit Access Request
                  </button>
                </form>

                <div className="mt-6 pt-4 border-t border-slate-100 text-center">
                  <button
                    onClick={() => setAuthModal('login')}
                    className="text-xs font-bold text-slate-600 hover:text-slate-900"
                  >
                    ← Already have User ID? Sign In
                  </button>
                </div>
              </div>
            )}

            {authModal === 'pending' && (
              <div className="text-center py-4">
                <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
                  <Send className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Request Submitted!</h3>
                <p className="text-xs text-slate-600 mb-6 leading-relaxed">
                  Thank you <b>{submittedReqInfo?.name}</b>! Your access request for <b>{submittedReqInfo?.village}</b> has been received. 
                  Our Store Admin will process your request and send your <b>User ID & Password</b> to your WhatsApp number (<b>{submittedReqInfo?.phone}</b>).
                </p>

                <button
                  onClick={() => setAuthModal(false)}
                  className="w-full py-3 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl text-xs transition-all"
                >
                  Got It, Continue Browsing
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL: ADMIN APPROVAL & CREDENTIAL GENERATION */}
      {approvalModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 sm:p-8 shadow-2xl relative">
            <button
              onClick={() => setApprovalModal(null)}
              className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Send className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Approve & Dispatch Credentials</h3>
              <p className="text-xs text-slate-500 mt-1">
                Generate credentials for <b>{approvalModal.name}</b> ({approvalModal.village}).
              </p>
            </div>

            <form onSubmit={handleApproveUser} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Assign User ID</label>
                <input
                  type="text"
                  required
                  value={customCreds.userId}
                  onChange={e => setCustomCreds({ ...customCreds, userId: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold font-mono focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Assign Password</label>
                <input
                  type="text"
                  required
                  value={customCreds.password}
                  onChange={e => setCustomCreds({ ...customCreds, password: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold font-mono focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-3.5 text-[11px] text-emerald-800">
                💡 Submitting will save the user account and automatically open <b>WhatsApp</b> with the login message prefilled for phone: <b>+91 {approvalModal.phone}</b>.
              </div>

              <button
                type="submit"
                className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-all shadow-lg shadow-emerald-600/20 flex items-center justify-center gap-2"
              >
                <Send className="w-4 h-4" /> Save User & Open WhatsApp
              </button>
            </form>
          </div>
        </div>
      )}

      {/* SHOPPING CART DRAWER */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex justify-end">
          <div className="bg-white w-full max-w-md h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
            
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-slate-900 text-base">Your Cart</h3>
              </div>
              <button
                onClick={() => setIsCartOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {cart.length === 0 ? (
                <div className="text-center py-16">
                  <ShoppingCart className="w-12 h-12 text-slate-200 mx-auto mb-3" />
                  <p className="text-xs text-slate-400 font-medium">Your shopping cart is empty.</p>
                </div>
              ) : (
                cart.map(item => (
                  <div key={item._id} className="flex items-center justify-between gap-4 p-3 border border-slate-100 rounded-2xl bg-slate-50">
                    <img src={item.image} alt="" className="w-14 h-14 rounded-xl object-cover" />
                    <div className="flex-1">
                      <h4 className="font-bold text-xs text-slate-900 line-clamp-1">{item.name}</h4>
                      <span className="text-xs font-black text-slate-700">₹{item.price}</span>
                    </div>

                    <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-xl px-2 py-1">
                      <button 
                        onClick={() => updateCartQty(item._id, -1)}
                        className="text-slate-500 font-bold hover:text-slate-900 text-xs px-1"
                      >
                        -
                      </button>
                      <span className="text-xs font-bold text-slate-900 w-4 text-center">{item.qty}</span>
                      <button 
                        onClick={() => updateCartQty(item._id, 1)}
                        className="text-slate-500 font-bold hover:text-slate-900 text-xs px-1"
                      >
                        +
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {cart.length > 0 && (
              <div className="p-6 border-t border-slate-100 bg-slate-50">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs font-bold text-slate-500 uppercase">Subtotal</span>
                  <span className="text-xl font-black text-slate-900">
                    ₹{cart.reduce((a, b) => a + (b.price * b.qty), 0)}
                  </span>
                </div>

                <button
                  onClick={handleCheckout}
                  className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-all shadow-lg shadow-emerald-600/20"
                >
                  Complete Order
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-auto py-6">
        <div className="max-w-7xl mx-auto px-4 text-center text-xs text-slate-400">
          Village Store MERN Stack E-Commerce & Admin Platform © {new Date().getFullYear()}
        </div>
      </footer>

    </div>
  );
}
