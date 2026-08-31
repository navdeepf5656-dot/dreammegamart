require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const path = require('path');

const app = express();

app.use(cors());
app.use(express.json());

// Models
const UserSchema = new mongoose.Schema({
  userId: { type: String, required: true, unique: true },
  name: { type: String, required: true },
  phone: { type: String, required: true },
  village: { type: String, required: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'customer'], default: 'customer' }
}, { timestamps: true });

const UserRequestSchema = new mongoose.Schema({
  name: { type: String, required: true },
  phone: { type: String, required: true },
  village: { type: String, required: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  generatedUserId: { type: String },
  generatedPassword: { type: String }
}, { timestamps: true });

const CategorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  image: { type: String, default: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=400' }
}, { timestamps: true });

const ProductSchema = new mongoose.Schema({
  name: { type: String, required: true },
  category: { type: mongoose.Schema.Types.ObjectId, ref: 'Category', required: true },
  price: { type: Number, required: true },
  description: { type: String },
  stock: { type: Number, default: 50 },
  image: { type: String, default: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=400' }
}, { timestamps: true });

const StoreSettingsSchema = new mongoose.Schema({
  storeName: { type: String, default: 'Dream Mega Mart' },
  lat: { type: Number, default: 28.6139 }, // Default Delhi
  lng: { type: Number, default: 77.2090 },
  radiusKm: { type: Number, default: 10 } // Default 10km radius
}, { timestamps: true });

const OrderSchema = new mongoose.Schema({
  customerName: { type: String, required: true },
  customerPhone: { type: String, required: true },
  items: [{
    product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    name: String,
    quantity: Number,
    price: Number
  }],
  totalAmount: Number,
  shippingAddress: {
    addressText: String,
    lat: Number,
    lng: Number,
    distanceKm: Number
  },
  status: { type: String, enum: ['pending', 'processing', 'completed'], default: 'pending' }
}, { timestamps: true });

const User = mongoose.model('User', UserSchema);
const UserRequest = mongoose.model('UserRequest', UserRequestSchema);
const Category = mongoose.model('Category', CategorySchema);
const Product = mongoose.model('Product', ProductSchema);
const Order = mongoose.model('Order', OrderSchema);
const StoreSettings = mongoose.model('StoreSettings', StoreSettingsSchema);


// Memory storage fallback if MongoDB URI not specified
const MEMORY_DB = {
  users: [
    {
      _id: 'admin123',
      userId: 'admin',
      name: 'Store Manager',
      phone: '9876543210',
      village: 'Central Admin',
      password: 'admin',
      role: 'admin'
    }
  ],
  userRequests: [],
  categories: [
    { _id: 'cat1', name: 'Groceries', image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=600' },
    { _id: 'cat2', name: 'Fresh Vegetables', image: 'https://images.unsplash.com/photo-1597362925123-77861d3fbac7?auto=format&fit=crop&q=80&w=600' },
    { _id: 'cat3', name: 'Dairy & Bakery', image: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&q=80&w=600' },
    { _id: 'cat4', name: 'Personal Care', image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&q=80&w=600' }
  ],
  products: [
    { _id: 'prod1', name: 'Premium Basmati Rice 5kg', category: 'cat1', price: 450, description: 'Long grain aromatic rice perfect for everyday cooking.', stock: 30, image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&q=80&w=600' },
    { _id: 'prod2', name: 'Pure Mustard Oil 1L', category: 'cat1', price: 180, description: 'Cold-pressed traditional mustard oil.', stock: 50, image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&q=80&w=600' },
    { _id: 'prod3', name: 'Farm Fresh Tomatoes 1kg', category: 'cat2', price: 40, description: 'Organic farm picked ripe tomatoes.', stock: 100, image: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&q=80&w=600' },
    { _id: 'prod4', name: 'Fresh Potatoes 2kg', category: 'cat2', price: 60, description: 'High quality village farm potatoes.', stock: 80, image: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&q=80&w=600' },
    { _id: 'prod5', name: 'Pure Cow Ghee 500g', category: 'cat3', price: 340, description: 'Desi pure cow ghee with rich aroma.', stock: 25, image: 'https://images.unsplash.com/photo-1628088062854-d1870b4553da?auto=format&fit=crop&q=80&w=600' }
  ],
  orders: []
};

let useMemory = true;

const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/villagestore';
mongoose.connect(MONGO_URI)
  .then(async () => {
    console.log('Successfully connected to MongoDB Atlas / Database!');
    useMemory = false;

    // Seed default admin user & demo products/categories if database is empty
    try {
      const userCount = await User.countDocuments();
      if (userCount === 0) {
        await User.create({
          userId: 'admin',
          name: 'Store Manager',
          phone: '9876543210',
          village: 'Central Admin',
          password: 'admin',
          role: 'admin'
        });
        console.log('Seeded default admin user (User ID: admin, Password: admin)');
      }

      const catCount = await Category.countDocuments();
      if (catCount === 0) {
        const cat1 = await Category.create({ name: 'Groceries', image: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=600' });
        const cat2 = await Category.create({ name: 'Fresh Vegetables', image: 'https://images.unsplash.com/photo-1597362925123-77861d3fbac7?auto=format&fit=crop&q=80&w=600' });
        const cat3 = await Category.create({ name: 'Dairy & Bakery', image: 'https://images.unsplash.com/photo-1528735602780-2552fd46c7af?auto=format&fit=crop&q=80&w=600' });
        const cat4 = await Category.create({ name: 'Personal Care', image: 'https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&q=80&w=600' });

        await Product.create([
          { name: 'Premium Basmati Rice 5kg', category: cat1._id, price: 450, description: 'Long grain aromatic rice perfect for everyday cooking.', stock: 30, image: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&q=80&w=600' },
          { name: 'Pure Mustard Oil 1L', category: cat1._id, price: 180, description: 'Cold-pressed traditional mustard oil.', stock: 50, image: 'https://images.unsplash.com/photo-1474979266404-7eaacbcd87c5?auto=format&fit=crop&q=80&w=600' },
          { name: 'Farm Fresh Tomatoes 1kg', category: cat2._id, price: 40, description: 'Organic farm picked ripe tomatoes.', stock: 100, image: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&q=80&w=600' },
          { name: 'Fresh Potatoes 2kg', category: cat2._id, price: 60, description: 'High quality village farm potatoes.', stock: 80, image: 'https://images.unsplash.com/photo-1518977676601-b53f82aba655?auto=format&fit=crop&q=80&w=600' },
          { name: 'Pure Cow Ghee 500g', category: cat3._id, price: 340, description: 'Desi pure cow ghee with rich aroma.', stock: 25, image: 'https://images.unsplash.com/photo-1628088062854-d1870b4553da?auto=format&fit=crop&q=80&w=600' }
        ]);
        console.log('Seeded initial categories & products into MongoDB!');
      }
    } catch (e) {
      console.error('Seeding error:', e.message);
    }
  })
  .catch(err => {
    console.log('MongoDB connection skipped/failed, using in-memory database fallback.');
    useMemory = true;
  });

// API Routes

// Authentication & Request Routes
app.post('/api/auth/login', async (req, res) => {
  const { userId, password } = req.body;
  
  if (useMemory) {
    const user = MEMORY_DB.users.find(u => u.userId === userId && u.password === password);
    if (!user) return res.status, res.status(400).json({ message: 'Invalid User ID or Password' });
    return res.json({ user: { id: user._id, userId: user.userId, name: user.name, role: user.role, village: user.village, phone: user.phone } });
  }

  try {
    const user = await User.findOne({ userId, password });
    if (!user) return res.status(400).json({ message: 'Invalid User ID or Password' });
    res.json({ user: { id: user._id, userId: user.userId, name: user.name, role: user.role, village: user.village, phone: user.phone } });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// User Registration Request (Phone, Name, Village)
app.post('/api/requests/create', async (req, res) => {
  const { name, phone, village } = req.body;
  if (!name || !phone || !village) {
    return res.status(400).json({ message: 'Name, Phone and Village selection are required' });
  }

  if (useMemory) {
    const exists = MEMORY_DB.userRequests.find(r => r.phone === phone && r.status === 'pending');
    if (exists) return res.status(400).json({ message: 'Request already submitted for this phone number' });

    const newReq = {
      _id: Date.now().toString(),
      name,
      phone,
      village,
      status: 'pending',
      createdAt: new Date()
    };
    MEMORY_DB.userRequests.unshift(newReq);
    return res.json({ message: 'Account request submitted successfully! Admin will create your User ID and send via WhatsApp.', request: newReq });
  }

  try {
    const newReq = new UserRequest({ name, phone, village });
    await newReq.save();
    res.json({ message: 'Account request submitted successfully! Admin will create your User ID and send via WhatsApp.', request: newReq });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Admin API to fetch requests
app.get('/api/admin/requests', async (req, res) => {
  if (useMemory) return res.json(MEMORY_DB.userRequests);
  try {
    const requests = await UserRequest.find().sort({ createdAt: -1 });
    res.json(requests);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Admin API to Approve Request & Create User Credentials
app.post('/api/admin/requests/approve', async (req, res) => {
  const { requestId, customUserId, password } = req.body;

  if (useMemory) {
    const reqItem = MEMORY_DB.userRequests.find(r => r._id === requestId);
    if (!reqItem) return res.status(404).json({ message: 'Request not found' });

    const finalUserId = customUserId || ('USR' + Math.floor(1000 + Math.random() * 9000));
    const finalPassword = password || Math.random().toString(36).slice(-6);

    reqItem.status = 'approved';
    reqItem.generatedUserId = finalUserId;
    reqItem.generatedPassword = finalPassword;

    const newUser = {
      _id: 'user_' + Date.now(),
      userId: finalUserId,
      name: reqItem.name,
      phone: reqItem.phone,
      village: reqItem.village,
      password: finalPassword,
      role: 'customer'
    };
    MEMORY_DB.users.push(newUser);

    return res.json({
      message: 'User created successfully',
      credentials: { userId: finalUserId, password: finalPassword, phone: reqItem.phone, name: reqItem.name },
      request: reqItem
    });
  }

  try {
    const reqItem = await UserRequest.findById(requestId);
    if (!reqItem) return res.status(404).json({ message: 'Request not found' });

    const finalUserId = customUserId || ('USR' + Math.floor(1000 + Math.random() * 9000));
    const finalPassword = password || Math.random().toString(36).slice(-6);

    reqItem.status = 'approved';
    reqItem.generatedUserId = finalUserId;
    reqItem.generatedPassword = finalPassword;
    await reqItem.save();

    const newUser = new User({
      userId: finalUserId,
      name: reqItem.name,
      phone: reqItem.phone,
      village: reqItem.village,
      password: finalPassword,
      role: 'customer'
    });
    await newUser.save();

    res.json({
      message: 'User created successfully',
      credentials: { userId: finalUserId, password: finalPassword, phone: reqItem.phone, name: reqItem.name },
      request: reqItem
    });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Category APIs
app.get('/api/categories', async (req, res) => {
  if (useMemory) return res.json(MEMORY_DB.categories);
  try {
    const categories = await Category.find();
    res.json(categories);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/categories', async (req, res) => {
  const { name, image } = req.body;
  if (useMemory) {
    const newCat = { _id: 'cat_' + Date.now(), name, image: image || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=400' };
    MEMORY_DB.categories.push(newCat);
    return res.json(newCat);
  }
  try {
    const newCat = new Category({ name, image });
    await newCat.save();
    res.json(newCat);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.delete('/api/categories/:id', async (req, res) => {
  if (useMemory) {
    MEMORY_DB.categories = MEMORY_DB.categories.filter(c => c._id !== req.params.id);
    return res.json({ message: 'Category deleted' });
  }
  try {
    await Category.findByIdAndDelete(req.params.id);
    res.json({ message: 'Category deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Product APIs
app.get('/api/products', async (req, res) => {
  if (useMemory) return res.json(MEMORY_DB.products);
  try {
    const products = await Product.find().populate('category');
    res.json(products);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/products', async (req, res) => {
  const { name, category, price, description, image, stock } = req.body;
  if (useMemory) {
    const newProd = {
      _id: 'prod_' + Date.now(),
      name,
      category,
      price: Number(price),
      description,
      image: image || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?auto=format&fit=crop&q=80&w=400',
      stock: Number(stock) || 50
    };
    MEMORY_DB.products.push(newProd);
    return res.json(newProd);
  }
  try {
    const newProd = new Product({ name, category, price, description, image, stock });
    await newProd.save();
    res.json(newProd);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.delete('/api/products/:id', async (req, res) => {
  if (useMemory) {
    MEMORY_DB.products = MEMORY_DB.products.filter(p => p._id !== req.params.id);
    return res.json({ message: 'Product deleted' });
  }
  try {
    await Product.findByIdAndDelete(req.params.id);
    res.json({ message: 'Product deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Store Settings APIs
app.get('/api/settings', async (req, res) => {
  if (useMemory) {
    if (!MEMORY_DB.settings) {
      MEMORY_DB.settings = { storeName: 'Dream Mega Mart', lat: 28.6139, lng: 77.2090, radiusKm: 10 };
    }
    return res.json(MEMORY_DB.settings);
  }
  try {
    let settings = await StoreSettings.findOne();
    if (!settings) {
      settings = await StoreSettings.create({ storeName: 'Dream Mega Mart', lat: 28.6139, lng: 77.2090, radiusKm: 10 });
    }
    res.json(settings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.post('/api/admin/settings', async (req, res) => {
  const { storeName, lat, lng, radiusKm } = req.body;
  if (useMemory) {
    MEMORY_DB.settings = {
      storeName: storeName || 'Dream Mega Mart',
      lat: Number(lat) || 28.6139,
      lng: Number(lng) || 77.2090,
      radiusKm: Number(radiusKm) || 10
    };
    return res.json(MEMORY_DB.settings);
  }
  try {
    let settings = await StoreSettings.findOne();
    if (!settings) {
      settings = new StoreSettings({ storeName, lat, lng, radiusKm });
    } else {
      if (storeName !== undefined) settings.storeName = storeName;
      if (lat !== undefined) settings.lat = Number(lat);
      if (lng !== undefined) settings.lng = Number(lng);
      if (radiusKm !== undefined) settings.radiusKm = Number(radiusKm);
    }
    await settings.save();
    res.json(settings);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Order APIs
app.post('/api/orders', async (req, res) => {
  const { customerName, customerPhone, items, totalAmount, shippingAddress } = req.body;
  if (!customerName || !customerPhone) {
    return res.status(400).json({ message: 'Customer Name and Mobile Number are required.' });
  }

  if (useMemory) {
    const newOrder = {
      _id: 'order_' + Date.now(),
      customerName,
      customerPhone,
      items,
      totalAmount,
      shippingAddress,
      status: 'pending',
      createdAt: new Date()
    };
    MEMORY_DB.orders.unshift(newOrder);
    return res.json(newOrder);
  }
  try {
    const newOrder = new Order({ customerName, customerPhone, items, totalAmount, shippingAddress });
    await newOrder.save();
    res.json(newOrder);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

app.get('/api/admin/orders', async (req, res) => {
  if (useMemory) return res.json(MEMORY_DB.orders);
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Admin update order status API
app.put('/api/admin/orders/:id/status', async (req, res) => {
  const { status } = req.body;
  if (useMemory) {
    const order = MEMORY_DB.orders.find(o => o._id === req.params.id);
    if (!order) return res.status(404).json({ message: 'Order not found' });
    order.status = status;
    return res.json(order);
  }
  try {
    const order = await Order.findByIdAndUpdate(req.params.id, { status }, { new: true });
    if (!order) return res.status(404).json({ message: 'Order not found' });
    res.json(order);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Customer track orders by phone number API
app.get('/api/orders/track/:phone', async (req, res) => {
  const phone = req.params.phone.replace(/[^0-9]/g, '');
  if (useMemory) {
    const customerOrders = MEMORY_DB.orders.filter(o => o.customerPhone && o.customerPhone.replace(/[^0-9]/g, '') === phone);
    return res.json(customerOrders);
  }
  try {
    const orders = await Order.find({ customerPhone: { $regex: phone } }).sort({ createdAt: -1 });
    res.json(orders);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});



const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
