const express = require('express');
const router = express.Router();
const db = require('../db');

/**
 * Helper: fetch items for a given order_id from order_items table.
 * Works identically for both SQLite and PostgreSQL.
 */
async function getOrderItems(orderId) {
  const rows = await db.all(
    `SELECT item_id, item_name_en, item_name_es, quantity, unit_price_usd
     FROM order_items
     WHERE order_id = ?`,
    [orderId]
  );
  return rows;
}

/**
 * Helper: attach items array to each order row.
 * For PostgreSQL the items come from the JOIN; for SQLite we fetch them separately.
 */
async function attachItems(orders) {
  if (!Array.isArray(orders)) orders = [orders];
  const result = [];
  for (const order of orders) {
    const items = await getOrderItems(order.id);
    result.push({ ...order, items });
  }
  return orders.length === 1 ? result[0] : result;
}

router.get('/', async (req, res) => {
  try {
    if (req.query.session_id) {
      const order = await db.get(
        `SELECT * FROM orders WHERE stripe_session_id = ?`,
        [req.query.session_id]
      );
      if (!order) return res.status(404).json({ error: 'Order not found' });
      const withItems = await attachItems(order);
      return res.json({ order: withItems });
    }

    const orders = await db.all(
      `SELECT * FROM orders ORDER BY created_at DESC LIMIT 50`
    );
    const withItems = await attachItems(orders);
    res.json(withItems);
  } catch (err) {
    console.error('Error fetching orders:', err);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const order = await db.get(`SELECT * FROM orders WHERE id = ?`, [req.params.id]);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    const withItems = await attachItems(order);
    res.json(withItems);
  } catch (err) {
    console.error('Error fetching order:', err);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

module.exports = router;
