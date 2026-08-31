import React, { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { 
  ShoppingBag, Search, Plus, Trash2, CheckCircle2, 
  Lock, Phone, MapPin, LogOut, ChevronRight, Store, ArrowRight,
  ShieldCheck, AlertCircle, ShoppingCart, X, Filter, Settings, Navigation
} from 'lucide-react';

const API_BASE = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

// Haversine formula to compute distance in kilometers between two lat/lng coordinates
function getDistanceFromLatLonInKm(lat1, lon1, lat2, lon2) {
  const R = 6371; // Radius of the earth in km
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default function App() {
  const location = useLocation();
  const navigate = useNavigate();

  const [currentUser, setCurrentUser] = useState(null);
  const [view, setView] = useState('store'); // 'store' | 'admin'
  const [adminTab, setAdminTab] = useState('orders'); // 'orders' | 'products' | 'categories' | 'settings'
  
  // Store Settings (Location & Radius)
  const [storeSettings, setStoreSettings] = useState({
    storeName: 'Dream Mega Mart',
    lat: 28.6139,
    lng: 77.2090,
    radiusKm: 10
  });

  // Data States
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [orders, setOrders] = useState([]);
  
  // Filters & Search
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Cart & Checkout
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [checkoutModal, setCheckoutModal] = useState(false);
  const [checkoutForm, setCheckoutForm] = useState({
    name: '',
    phone: '',
    addressText: ''
  });

  // Customer Map State
  const [userLocation, setUserLocation] = useState({ lat: 28.6139, lng: 77.2090 });
  const [calculatedDistance, setCalculatedDistance] = useState(0);
  const [isWithinRadius, setIsWithinRadius] = useState(true);

  // Auth Modal for Admin (/ayushnav)
  const [authModal, setAuthModal] = useState(false);
  const [loginCreds, setLoginCreds] = useState({ userId: '', password: '' });

  // Admin Form States
  const [newCat, setNewCat] = useState({ name: '', image: '' });
  const [newProd, setNewProd] = useState({ name: '', category: '', price: '', description: '', image: '', stock: 50 });
  const [adminSettingsForm, setAdminSettingsForm] = useState({ storeName: '', lat: 28.6139, lng: 77.2090, radiusKm: 10 });

  // Notifications
  const [notification, setNotification] = useState('');

  // Dynamic SEO Page Title
  useEffect(() => {
    if (view === 'admin') {
      document.title = 'Admin Dashboard | Dream Mega Mart';
    } else {
      document.title = 'Dream Mega Mart | Fresh Grocery & Essentials Delivery';
    }
  }, [view]);

  useEffect(() => {
    fetchStoreSettings();
    fetchCategories();
    fetchProducts();
  }, []);


  useEffect(() => {
    if (location.pathname === '/ayushnav') {
      if (currentUser?.role === 'admin') {
        setView('admin');
      } else {
        setAuthModal('login');
      }
    }
  }, [location.pathname, currentUser]);

  useEffect(() => {
    if (view === 'admin') {
      fetchOrders();
    }
  }, [view]);

  // Calculate distance whenever user location or store settings change
  useEffect(() => {
    if (storeSettings.lat && storeSettings.lng && userLocation.lat && userLocation.lng) {
      const dist = getDistanceFromLatLonInKm(
        storeSettings.lat,
        storeSettings.lng,
        userLocation.lat,
        userLocation.lng
      );
      setCalculatedDistance(Number(dist.toFixed(2)));
      setIsWithinRadius(dist <= storeSettings.radiusKm);
    }
  }, [userLocation, storeSettings]);

  const showNotify = (msg) => {
    setNotification(msg);
    setTimeout(() => setNotification(''), 4000);
  };

  const fetchStoreSettings = async () => {
    try {
      const res = await axios.get(`${API_BASE}/settings`);
      if (res.data) {
        setStoreSettings(res.data);
        setAdminSettingsForm(res.data);
        setUserLocation({ lat: res.data.lat, lng: res.data.lng });
      }
    } catch (err) { console.error(err); }
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

  const fetchOrders = async () => {
    try {
      const res = await axios.get(`${API_BASE}/admin/orders`);
      setOrders(res.data);
    } catch (err) { console.error(err); }
  };

  // Admin Login
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
      alert(err.response?.data?.message || 'Admin login failed');
    }
  };

  const handleLogout = () => {
    setCurrentUser(null);
    setView('store');
    navigate('/');
    showNotify('Logged out successfully');
  };

  // Cart operations (No Login Required!)
  const addToCart = (product) => {
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

  // Customer GEOLOCATION trigger
  const handleGetLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          setUserLocation({ lat, lng });
          showNotify('📍 Current location detected!');
        },
        () => {
          alert('Location access denied or unavailable. Please click on the map to set your delivery location.');
        }
      );
    } else {
      alert('Geolocation is not supported by your browser.');
    }
  };

  // Checkout submission
  const handleOrderSubmit = async (e) => {
    e.preventDefault();
    if (cart.length === 0) return;

    if (!isWithinRadius) {
      return alert(`Sorry! We only deliver within ${storeSettings.radiusKm} km radius from our store. Selected location is ${calculatedDistance} km away.`);
    }

    try {
      const totalAmount = cart.reduce((acc, item) => acc + (item.price * item.qty), 0);
      await axios.post(`${API_BASE}/orders`, {
        customerName: checkoutForm.name,
        customerPhone: checkoutForm.phone,
        items: cart.map(i => ({ product: i._id, name: i.name, quantity: i.qty, price: i.price })),
        totalAmount,
        shippingAddress: {
          addressText: checkoutForm.addressText,
          lat: userLocation.lat,
          lng: userLocation.lng,
          distanceKm: calculatedDistance
        }
      });

      setCart([]);
      setIsCartOpen(false);
      setCheckoutModal(false);
      setCheckoutForm({ name: '', phone: '', addressText: '' });
      showNotify('🎉 Order confirmed & placed successfully!');
    } catch (err) {
      alert(err.response?.data?.message || 'Checkout failed');
    }
  };

  // Admin Category & Product Handlers
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

  // Admin Settings Save (Store Location & Radius)
  const handleSaveStoreSettings = async (e) => {
    e.preventDefault();
    try {
      const res = await axios.post(`${API_BASE}/admin/settings`, adminSettingsForm);
      setStoreSettings(res.data);
      showNotify('Store location and radius settings updated successfully!');
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update settings');
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
          
          {/* Logo */}
          <div className="flex items-center gap-6">
            <div 
              onClick={() => { setView('store'); navigate('/'); }}
              className="flex items-center gap-2.5 cursor-pointer group"
            >
              <div className="bg-emerald-600 group-hover:bg-emerald-700 text-white p-2 rounded-xl transition-all shadow-md shadow-emerald-600/20">
                <Store className="w-6 h-6" />
              </div>
              <div>
                <span className="font-extrabold text-xl tracking-tight text-slate-900 block leading-none">
                  Dream<span className="text-emerald-600"> Mega Mart</span>
                </span>
                <span className="text-[10px] text-slate-500 font-semibold tracking-wider uppercase">Direct Delivery Store</span>
              </div>
            </div>

            {currentUser?.role === 'admin' && (
              <div className="hidden sm:flex bg-slate-100 p-1 rounded-xl border border-slate-200">
                <button
                  onClick={() => { setView('store'); navigate('/'); }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    view === 'store' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Store Front
                </button>
                <button
                  onClick={() => { setView('admin'); navigate('/ayushnav'); }}
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

          {/* Search bar */}
          {view === 'store' && (
            <div className="flex-1 max-w-md hidden md:block relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search products, groceries..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-slate-100 border border-transparent rounded-xl text-sm focus:outline-none focus:bg-white focus:border-emerald-500 transition-all"
              />
            </div>
          )}

          {/* Cart & Controls */}
          <div className="flex items-center gap-3">
            {view === 'store' && (
              <button
                onClick={() => setIsCartOpen(true)}
                className="relative p-2.5 bg-slate-100 hover:bg-slate-200 rounded-xl transition-all text-slate-700 flex items-center gap-2"
              >
                <ShoppingCart className="w-5 h-5" />
                <span className="text-xs font-bold hidden sm:inline">Cart</span>
                {cart.length > 0 && (
                  <span className="bg-emerald-600 text-white text-[11px] font-bold w-5 h-5 rounded-full flex items-center justify-center">
                    {cart.reduce((a, b) => a + b.qty, 0)}
                  </span>
                )}
              </button>
            )}

            {currentUser && (
              <div className="flex items-center gap-2 bg-slate-100 px-3 py-1.5 rounded-xl border border-slate-200">
                <span className="text-xs font-bold text-slate-900">{currentUser.name} (Admin)</span>
                <button onClick={handleLogout} title="Logout" className="p-1 hover:bg-slate-200 rounded-lg text-slate-600">
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* MAIN STORE FRONT */}
      {view === 'store' ? (
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
          
          {/* Banner Hero */}
          <div className="relative rounded-3xl overflow-hidden bg-gradient-to-r from-emerald-800 to-teal-900 text-white p-8 sm:p-12 mb-10 shadow-xl">
            <div className="relative z-10 max-w-xl">
              <span className="inline-block px-3 py-1 bg-emerald-500/20 text-emerald-300 text-xs font-bold rounded-full mb-3 backdrop-blur-md">
                📍 Radius Delivery Service ({storeSettings.radiusKm} KM Range)
              </span>
              <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight mb-4 leading-tight">
                Fresh Items Delivered Directly To Your Door.
              </h1>
              <p className="text-emerald-100/90 text-sm sm:text-base mb-6 font-medium">
                No login required! Add products to cart, enter your phone number, and pinpoint your address on the map during checkout.
              </p>
            </div>
          </div>

          {/* Categories */}
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
            <h2 className="text-xl font-bold text-slate-900 mb-6">Store Items</h2>

            {filteredProducts.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-3xl border border-dashed border-slate-200">
                <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
                <h3 className="text-base font-bold text-slate-700">No products found</h3>
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
                          {product.description || 'Fresh quality stock.'}
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
        /* ADMIN DASHBOARD VIEW */
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
          
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl font-black text-slate-900 flex items-center gap-2">
                <ShieldCheck className="w-7 h-7 text-emerald-600" /> Admin Dashboard
              </h1>
              <p className="text-xs text-slate-500 font-medium mt-1">
                Configure delivery radius, manage customer orders & store inventory.
              </p>
            </div>

            {/* Admin Tabs */}
            <div className="flex bg-slate-200/70 p-1 rounded-2xl self-start md:self-auto border border-slate-300/50">
              {[
                { id: 'orders', label: `Orders (${orders.length})` },
                { id: 'settings', label: `Delivery Radius Settings` },
                { id: 'products', label: `Products (${products.length})` },
                { id: 'categories', label: `Categories (${categories.length})` }
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

          {/* TAB 1: ORDERS */}
          {adminTab === 'orders' && (
            <div className="bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6">
              <h2 className="text-base font-bold text-slate-900 mb-4">Customer Orders & Delivery Coordinates</h2>
              {orders.length === 0 ? (
                <p className="text-xs text-slate-500 py-6 text-center">No orders placed yet.</p>
              ) : (
                <div className="space-y-4">
                  {orders.map(order => (
                    <div key={order._id} className="p-5 border border-slate-100 rounded-2xl bg-slate-50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-bold text-xs text-slate-900">Order #{order._id.slice(-6)}</span>
                          <span className="text-[10px] px-2 py-0.5 bg-emerald-100 text-emerald-800 font-extrabold rounded-full">{order.status}</span>
                        </div>
                        <div className="text-xs text-slate-700">
                          Customer: <b>{order.customerName}</b> • Phone: <b>{order.customerPhone}</b>
                        </div>
                        <div className="text-xs text-slate-600 mt-1">
                          Address: <i>{order.shippingAddress?.addressText || 'Not specified'}</i>
                        </div>
                        <div className="text-[11px] text-emerald-700 font-semibold mt-1">
                          📍 Distance from Store: <b>{order.shippingAddress?.distanceKm ?? 'N/A'} km</b> (Lat: {order.shippingAddress?.lat?.toFixed(4)}, Lng: {order.shippingAddress?.lng?.toFixed(4)})
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

          {/* TAB 2: STORE DELIVERY RADIUS & COORDINATES SETTINGS */}
          {adminTab === 'settings' && (
            <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-sm max-w-2xl">
              <h2 className="text-base font-bold text-slate-900 mb-2 flex items-center gap-2">
                <Settings className="w-5 h-5 text-emerald-600" /> Delivery Radius & Store Coordinates
              </h2>
              <p className="text-xs text-slate-500 mb-6">
                Set your physical store latitude/longitude and maximum delivery radius in kilometers.
              </p>

              <form onSubmit={handleSaveStoreSettings} className="space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Store Name</label>
                  <input
                    type="text"
                    required
                    value={adminSettingsForm.storeName}
                    onChange={e => setAdminSettingsForm({ ...adminSettingsForm, storeName: e.target.value })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-emerald-600"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Store Latitude</label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={adminSettingsForm.lat}
                      onChange={e => setAdminSettingsForm({ ...adminSettingsForm, lat: parseFloat(e.target.value) })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-emerald-600"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Store Longitude</label>
                    <input
                      type="number"
                      step="any"
                      required
                      value={adminSettingsForm.lng}
                      onChange={e => setAdminSettingsForm({ ...adminSettingsForm, lng: parseFloat(e.target.value) })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-emerald-600"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Allowed Delivery Radius (in Kilometers)</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    required
                    value={adminSettingsForm.radiusKm}
                    onChange={e => setAdminSettingsForm({ ...adminSettingsForm, radiusKm: parseFloat(e.target.value) })}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-emerald-600"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-emerald-600/20"
                >
                  Save Store Delivery Settings
                </button>
              </form>
            </div>
          )}

          {/* TAB 3: PRODUCTS */}
          {adminTab === 'products' && (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
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
                        value={newProd.price}
                        onChange={e => setNewProd({ ...newProd, price: e.target.value })}
                        className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-emerald-600"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 mb-1">Stock</label>
                      <input
                        type="number"
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
                      value={newProd.image}
                      onChange={e => setNewProd({ ...newProd, image: e.target.value })}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:border-emerald-600"
                    />
                  </div>
                  <button
                    type="submit"
                    className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-all shadow-md shadow-emerald-600/20"
                  >
                    Save Product
                  </button>
                </form>
              </div>

              <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200/80 shadow-sm overflow-hidden divide-y divide-slate-100">
                {products.map(p => (
                  <div key={p._id} className="p-4 flex items-center justify-between gap-4 hover:bg-slate-50">
                    <div className="flex items-center gap-4">
                      <img src={p.image} alt="" className="w-12 h-12 rounded-xl object-cover border border-slate-200" />
                      <div>
                        <h4 className="font-bold text-slate-900 text-xs">{p.name}</h4>
                        <span className="text-[11px] text-slate-500 font-medium">₹{p.price} • Stock: {p.stock}</span>
                      </div>
                    </div>
                    <button onClick={() => handleDeleteProduct(p._id)} className="p-2 text-rose-500 hover:bg-rose-50 rounded-xl">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: CATEGORIES */}
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
                      value={newCat.name}
                      onChange={e => setNewCat({ ...newCat, name: e.target.value })}
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

              <div className="lg:col-span-2 bg-white rounded-3xl border border-slate-200/80 shadow-sm p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
                {categories.map(c => (
                  <div key={c._id} className="flex items-center justify-between p-3 border border-slate-100 rounded-2xl bg-slate-50">
                    <span className="font-bold text-slate-900 text-xs">{c.name}</span>
                    <button onClick={() => handleDeleteCategory(c._id)} className="p-1.5 text-rose-500 hover:bg-rose-50 rounded-lg">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}
        </main>
      )}

      {/* SHOPPING CART DRAWER */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex justify-end">
          <div className="bg-white w-full max-w-md h-full flex flex-col shadow-2xl animate-in slide-in-from-right duration-300">
            
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-slate-900 text-base">Your Shopping Cart</h3>
              </div>
              <button onClick={() => setIsCartOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100">
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
                      <button onClick={() => updateCartQty(item._id, -1)} className="text-slate-500 font-bold hover:text-slate-900 text-xs px-1">-</button>
                      <span className="text-xs font-bold text-slate-900 w-4 text-center">{item.qty}</span>
                      <button onClick={() => updateCartQty(item._id, 1)} className="text-slate-500 font-bold hover:text-slate-900 text-xs px-1">+</button>
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
                  onClick={() => {
                    setIsCartOpen(false);
                    setCheckoutModal(true);
                  }}
                  className="w-full py-3.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs transition-all shadow-lg shadow-emerald-600/20"
                >
                  Proceed to Checkout
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CHECKOUT MODAL WITH NO LOGIN & MAP RADIUS VERIFICATION */}
      {checkoutModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white w-full max-w-lg rounded-3xl p-6 sm:p-8 shadow-2xl relative my-8">
            <button
              onClick={() => setCheckoutModal(false)}
              className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <MapPin className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Checkout & Address Location</h3>
              <p className="text-xs text-slate-500 mt-1">Enter your details and confirm your location on the map.</p>
            </div>

            <form onSubmit={handleOrderSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Full Name *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Rahul Sharma"
                  value={checkoutForm.name}
                  onChange={e => setCheckoutForm({ ...checkoutForm, name: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Mobile Number *</label>
                <input
                  type="tel"
                  required
                  placeholder="9876543210"
                  value={checkoutForm.phone}
                  onChange={e => setCheckoutForm({ ...checkoutForm, phone: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-emerald-600"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Street Address / Landmark</label>
                <input
                  type="text"
                  required
                  placeholder="House no, Street name, Village"
                  value={checkoutForm.addressText}
                  onChange={e => setCheckoutForm({ ...checkoutForm, addressText: e.target.value })}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-emerald-600"
                />
              </div>

              {/* Map Coordinates & GPS Auto Detect */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-xs font-bold text-slate-700">Delivery Location Pin</label>
                  <button
                    type="button"
                    onClick={handleGetLocation}
                    className="text-xs font-bold text-emerald-600 hover:text-emerald-700 flex items-center gap-1 bg-emerald-50 px-2.5 py-1 rounded-lg border border-emerald-200"
                  >
                    <Navigation className="w-3.5 h-3.5" /> Detect My GPS Location
                  </button>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-2">
                  <div>
                    <span className="text-[10px] text-slate-400 block font-semibold">Latitude</span>
                    <input
                      type="number"
                      step="any"
                      required
                      value={userLocation.lat}
                      onChange={e => setUserLocation({ ...userLocation, lat: parseFloat(e.target.value) })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
                    />
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block font-semibold">Longitude</span>
                    <input
                      type="number"
                      step="any"
                      required
                      value={userLocation.lng}
                      onChange={e => setUserLocation({ ...userLocation, lng: parseFloat(e.target.value) })}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
                    />
                  </div>
                </div>

                {/* Radius Distance Status Badge */}
                <div className={`p-3.5 rounded-2xl text-xs border flex items-center gap-3 ${
                  isWithinRadius 
                    ? 'bg-emerald-50 border-emerald-200 text-emerald-800' 
                    : 'bg-rose-50 border-rose-200 text-rose-800'
                }`}>
                  <MapPin className={`w-5 h-5 flex-shrink-0 ${isWithinRadius ? 'text-emerald-600' : 'text-rose-600'}`} />
                  <div>
                    {isWithinRadius ? (
                      <p>
                        <b>Address Confirmed!</b> Distance to store: <b>{calculatedDistance} km</b> (Within {storeSettings.radiusKm} km limit).
                      </p>
                    ) : (
                      <p>
                        <b>Delivery Not Available!</b> Distance: <b>{calculatedDistance} km</b>. We only deliver within <b>{storeSettings.radiusKm} km</b> of our store.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <button
                type="submit"
                disabled={!isWithinRadius}
                className={`w-full py-3.5 font-bold rounded-xl text-xs transition-all shadow-lg flex items-center justify-center gap-2 ${
                  isWithinRadius
                    ? 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-emerald-600/20'
                    : 'bg-slate-300 text-slate-500 cursor-not-allowed shadow-none'
                }`}
              >
                {isWithinRadius ? 'Confirm & Place Order' : `Only Delivery Under ${storeSettings.radiusKm} KM Radius`}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* ADMIN LOGIN MODAL (/ayushnav) */}
      {authModal === 'login' && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-md rounded-3xl p-6 sm:p-8 shadow-2xl relative">
            <button onClick={() => setAuthModal(false)} className="absolute top-5 right-5 p-2 text-slate-400 hover:text-slate-600 rounded-full hover:bg-slate-100">
              <X className="w-5 h-5" />
            </button>

            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto mb-3">
                <Lock className="w-6 h-6" />
              </div>
              <h3 className="text-xl font-bold text-slate-900">Admin Login</h3>
              <p className="text-xs text-slate-500 mt-1">Sign in with admin credentials to manage store settings.</p>
            </div>

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">User ID</label>
                <input
                  type="text"
                  required
                  placeholder="admin"
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
                Sign In to Dashboard
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 mt-auto py-6">
        <div className="max-w-7xl mx-auto px-4 text-center text-xs text-slate-400">
          Dream Mega Mart E-Commerce & Admin Platform © {new Date().getFullYear()}
        </div>
      </footer>

    </div>
  );
}
