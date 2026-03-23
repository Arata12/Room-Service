const express = require('express');
const router = express.Router();
const { pool } = require('../db');

const VALID_STATUSES = ['pending', 'paid', 'received', 'preparing', 'ready', 'delivering', 'delivered', 'cancelled'];

router.get('/orders', async (req, res) => {
  try {
    const { status, limit = 20, offset = 0 } = req.query;
    const filters = [];
    const values = [];
    if (status) { filters.push(`o.status = $${values.length + 1}`); values.push(status); }
    const where = filters.length ? `WHERE ${filters.join(' AND ')}` : '';
    const result = await pool.query(
      `SELECT o.*, COALESCE(json_agg(json_build_object(
        'item_name_en', oi.item_name_en,
        'item_name_es', oi.item_name_es,
        'quantity', oi.quantity,
        'unit_price_usd', oi.unit_price_usd
      )) FILTER (WHERE oi.id IS NOT NULL), '[]') AS items
       FROM orders o
       LEFT JOIN order_items oi ON o.id = oi.order_id
       ${where}
       GROUP BY o.id
       ORDER BY o.created_at DESC
       LIMIT $${values.length + 1} OFFSET $${values.length + 2}`,
      [...values, Number(limit), Number(offset)]
    );
    const countResult = await pool.query(`SELECT COUNT(*)::int AS total FROM orders o ${where}`, values);
    res.json({ orders: result.rows, total: countResult.rows[0].total });
  } catch (err) {
    console.error('Admin orders error:', err);
    res.status(500).json({ error: 'Failed to fetch admin orders' });
  }
});

router.patch('/orders/:id', async (req, res) => {
  try {
    const { status } = req.body;
    if (!VALID_STATUSES.includes(status)) return res.status(400).json({ error: 'Invalid status' });
    const result = await pool.query('UPDATE orders SET status = $1 WHERE id = $2 RETURNING *', [status, req.params.id]);
    if (!result.rows.length) return res.status(404).json({ error: 'Order not found' });
    res.json({ success: true, order: result.rows[0] });
  } catch (err) { res.status(500).json({ error: 'Failed to update order' }); }
});

router.delete('/orders/:id', async (req, res) => {
  try {
    await pool.query('DELETE FROM orders WHERE id = $1', [req.params.id]);
    res.json({ success: true });
  } catch (err) { res.status(500).json({ error: 'Failed to delete order' }); }
});

module.exports = router;
