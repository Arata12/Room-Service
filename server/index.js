const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const rateLimit = require('express-rate-limit');

dotenv.config();

const app = express();

const corsOptions = {
  origin: process.env.NODE_ENV === 'production'
    ? process.env.ALLOWED_ORIGIN || 'http://localhost'
    : '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
};

// Middleware
app.use('/api/webhook', express.raw({ type: 'application/json' }));
app.use(cors(corsOptions));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 100 }));
app.use('/api/checkout', rateLimit({ windowMs: 15 * 60 * 1000, max: 10 }));
app.use(express.json());

// Routes
const menuRoutes = require('./routes/menu');
const checkoutRoutes = require('./routes/checkout');
const webhookRoutes = require('./routes/webhook');
const ordersRoutes = require('./routes/orders');
const adminRoutes = require('./routes/admin');

app.use('/api/menu', menuRoutes);
app.use('/api/checkout', checkoutRoutes);
app.use('/api/webhook', webhookRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/admin', adminRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

const PORT = process.env.PORT || 3001;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
