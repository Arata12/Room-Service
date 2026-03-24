const express = require('express');
const router = express.Router();
const db = require('../db');
const auth = require('../middleware/auth');

const VALID_STATUSES = ['pending', 'paid', 'received', 'preparing', 'ready', 'delivering', 'delivered', 'cancelled'];

router.use(auth);

/** Helper: attach items to an order (same pattern as orders.js) */
async function getOrderItems(orderId) {
  return db.all(
    `SELECT item_name_en, item_name_es, quantity, unit_price_usd
     FROM order_items WHERE order_id = ?`,
    [orderId]
  );
}

async function attachItems(orders) {
  if (!Array.isArray(orders)) orders = [orders];
  const result = [];
  for (const order of orders) {
    const items = await getOrderItems(order.id);
    result.push({ ...order, items });
  }
  return orders.length === 1 ? result[0] : result;
}

router.get('/orders', async (req, res) => {
  try {
    const { status, limit = 20, offset = 0, search = '' } = req.query;
    if (typeof search === 'string' && search.length > 50) {
      return res.status(400).json({ error: 'Search term too long' });
    }

    const filters = [];
    const values = [];
    if (status) { filters.push(`status = ?`); values.push(status); }
    if (search && String(search).trim()) {
      filters.push(`(room_number LIKE ? OR guest_name LIKE ?)`);
      const term = `%${String(search).trim()}%`;
      values.push(term, term);
    }
    const where = filters.length ? `WHERE ${filters.join(' AND ')}` : '';

    const orders = await db.all(
      `SELECT * FROM orders ${where} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
      [...values, Number(limit), Number(offset)]
    );
    const countResult = await db.get(
      `SELECT COUNT(*) as total FROM orders ${where}`,
      values
    );

    const withItems = await attachItems(orders);
    res.json({ orders: withItems, total: countResult.total });
  } catch (err) {
    console.error('Admin orders error:', err);
    res.status(500).json({ error: 'Failed to fetch admin orders' });
  }
});

router.patch('/orders/:id', async (req, res) => {
  try {
    const { status } = req.body;
    if (!VALID_STATUSES.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }
    const order = await db.run(
      `UPDATE orders SET status = ?, updated_at = datetime('now') WHERE id = ?`,
      [status, req.params.id]
    );
    if (!order.rowCount) return res.status(404).json({ error: 'Order not found' });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to update order' });
  }
});

router.delete('/orders/:id', async (req, res) => {
  try {
    await db.run(`DELETE FROM orders WHERE id = ?`, [req.params.id]);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: 'Failed to delete order' });
  }
});

module.exports = router;
