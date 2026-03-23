const { pool } = require('./index');

const createTables = `
CREATE TABLE IF NOT EXISTS orders (
  id SERIAL PRIMARY KEY,
  room_number VARCHAR(10) NOT NULL,
  guest_name VARCHAR(100) NOT NULL,
  total_usd NUMERIC(10,2) NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'USD',
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending','paid','received','preparing','ready','delivering','delivered','cancelled')),
  stripe_session_id VARCHAR(200),
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS order_items (
  id SERIAL PRIMARY KEY,
  order_id INTEGER REFERENCES orders(id) ON DELETE CASCADE,
  item_id VARCHAR(50) NOT NULL,
  item_name_en VARCHAR(100) NOT NULL,
  item_name_es VARCHAR(100) NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price_usd NUMERIC(10,2) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_session ON orders(stripe_session_id);
`;

async function initDb() {
  try {
    await pool.query(createTables);
    console.log('Database tables created/verified');
  } catch (err) {
    console.error('Database initialization error:', err);
    throw err;
  }
}

module.exports = { initDb };
