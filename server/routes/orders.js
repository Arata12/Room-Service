const express = require('express');
const router = express.Router();
const { pool } = require('../db');

router.get('/', async (req, res) => {
  try {
    if (req.query.session_id) {
      const result = await pool.query(
        `SELECT o.*, COALESCE(json_agg(json_build_object(
          'item_id', oi.item_id,
          'item_name_en', oi.item_name_en,
          'item_name_es', oi.item_name_es,
          'quantity', oi.quantity,
          'unit_price_usd', oi.unit_price_usd
        )) FILTER (WHERE oi.id IS NOT NULL), '[]'::json) as items
         FROM orders o
         LEFT JOIN order_items oi ON o.id = oi.order_id
         WHERE o.stripe_session_id = $1
         GROUP BY o.id`,
        [req.query.session_id]
      );

      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Order not found' });
      }

      return res.json({ order: result.rows[0] });
    }

    const result = await pool.query(
      `SELECT o.*, COALESCE(json_agg(json_build_object(
        'item_id', oi.item_id,
        'item_name_en', oi.item_name_en,
        'item_name_es', oi.item_name_es,
        'quantity', oi.quantity,
        'unit_price_usd', oi.unit_price_usd
      )) FILTER (WHERE oi.id IS NOT NULL), '[]'::json) as items
        FROM orders o
        LEFT JOIN order_items oi ON o.id = oi.order_id
        GROUP BY o.id
        ORDER BY o.created_at DESC
        LIMIT 50`
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching orders:', err);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT o.*, COALESCE(json_agg(json_build_object(
        'item_id', oi.item_id,
        'item_name_en', oi.item_name_en,
        'item_name_es', oi.item_name_es,
        'quantity', oi.quantity,
        'unit_price_usd', oi.unit_price_usd
      )) FILTER (WHERE oi.id IS NOT NULL), '[]'::json) as items
        FROM orders o
        LEFT JOIN order_items oi ON o.id = oi.order_id
        WHERE o.id = $1
        GROUP BY o.id`,
      [req.params.id]
    );
    
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }
    
    res.json(result.rows[0]);
  } catch (err) {
    console.error('Error fetching order:', err);
    res.status(500).json({ error: 'Failed to fetch order' });
  }
});

module.exports = router;
