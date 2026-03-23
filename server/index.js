const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Raw body for Stripe webhooks
app.use('/api/webhook', express.raw({ type: 'application/json' }));

// Initialize database
const { initDb } = require('./db/migrate');

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

// Initialize and start
async function start() {
  try {
    await initDb();
    console.log('Database initialized');
    
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (err) {
    console.error('Failed to start server:', err);
    process.exit(1);
  }
}

start();
