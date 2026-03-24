const express = require('express');
const path = require('path');
const fs = require('fs');
const router = express.Router();
const { pool } = require('../db');
const { printTicket } = require('../printer/print');

const TEST_MODE = process.env.TEST_MODE === 'true';
const stripe = TEST_MODE ? null : require('stripe')(process.env.STRIPE_SECRET_KEY);

const DEFAULT_CURRENCY = process.env.DEFAULT_CURRENCY || 'USD';
const USD_TO_MXN_RATE = parseFloat(process.env.USD_TO_MXN_RATE) || 17.50;
const menu = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/menu.json'), 'utf8'));
const menuItems = menu.categories.flatMap(category => category.subcategories).flatMap(subcategory => subcategory.items);
const menuItemMap = menuItems.reduce((acc, item) => {
  acc[item.id] = item;
  return acc;
}, {});

function validateCheckoutInput(body) {
  const details = [];
  const { roomNumber, guestName, notes, items } = body;

  if (typeof roomNumber !== 'string' || !roomNumber.trim() || roomNumber.length > 10 || !/^[A-Za-z0-9-]+$/.test(roomNumber)) {
    details.push('roomNumber must be a non-empty alphanumeric string with hyphens, max 10 chars');
  }
  if (typeof guestName !== 'string' || !guestName.trim() || guestName.length > 100) {
    details.push('guestName must be a non-empty string, max 100 chars');
  }
  if (notes !== undefined && (typeof notes !== 'string' || notes.length > 500)) {
    details.push('notes must be an optional string, max 500 chars');
  }
  if (!Array.isArray(items) || items.length === 0) {
    details.push('items must be a non-empty array');
  } else {
    items.forEach((item, index) => {
      if (!item || typeof item.id !== 'string') details.push(`items[${index}].id must be a string`);
      if (!Number.isInteger(item.quantity) || item.quantity <= 0) details.push(`items[${index}].quantity must be a positive integer`);
    });
  }

  return details;
}

router.post('/', async (req, res) => {
  try {
    const { items, roomNumber, guestName, notes, currency } = req.body;
    const validationDetails = validateCheckoutInput(req.body);
    if (validationDetails.length) {
      return res.status(400).json({ error: 'validation_error', details: validationDetails });
    }

    for (const item of items) {
      if (!(item.id in menuItemMap)) {
        return res.status(400).json({ error: 'validation_error', details: [`Unknown item id: ${item.id}`] });
      }
      if (item.price !== menuItemMap[item.id].price) {
        return res.status(400).json({ error: 'validation_error', details: [`Price mismatch for item id: ${item.id}`] });
      }
    }

    const selectedCurrency = currency || DEFAULT_CURRENCY;
    
    // Calculate totals
    const totalUSD = items.reduce((sum, item) => sum + (menuItemMap[item.id].price * item.quantity), 0);

    // Create order in database
    const client = await pool.connect();
    let orderId;
    try {
      await client.query('BEGIN');
      const orderResult = await client.query(
        `INSERT INTO orders (room_number, guest_name, total_usd, currency, status, notes)
         VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
        [roomNumber, guestName, totalUSD, selectedCurrency, 'pending', notes]
      );
      orderId = orderResult.rows[0].id;

      for (const item of items) {
        await client.query(
          `INSERT INTO order_items (order_id, item_id, item_name_en, item_name_es, quantity, unit_price_usd)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [orderId, item.id, menuItemMap[item.id].name.en, menuItemMap[item.id].name.es, item.quantity, menuItemMap[item.id].price]
          );
      }
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }

    if (TEST_MODE) {
      await pool.query('UPDATE orders SET status = $1 WHERE id = $2', ['paid', orderId]);
      const orderResult = await pool.query(
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
        [orderId]
      );
      const order = orderResult.rows[0];
      try { await printTicket(order); } catch (e) { console.error('Failed to print ticket:', e); }
      return res.json({ success: true, demoMode: true, url: `${req.headers.origin}/success?demo=1&order_id=${orderId}` , order });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      line_items: items.map(item => ({
        price_data: {
          currency: selectedCurrency.toLowerCase(),
          product_data: { name: menuItemMap[item.id].name.en, description: menuItemMap[item.id].name.es },
          unit_amount: Math.round((selectedCurrency === 'MXN' ? menuItemMap[item.id].price * USD_TO_MXN_RATE : menuItemMap[item.id].price) * 100),
        },
        quantity: item.quantity,
      })),
      mode: 'payment',
      success_url: `${req.headers.origin}/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${req.headers.origin}/cart`,
      metadata: { order_id: orderId.toString(), room_number: roomNumber, guest_name: guestName },
    });

    await pool.query('UPDATE orders SET stripe_session_id = $1 WHERE id = $2', [session.id, orderId]);
    res.json({ url: session.url });
  } catch (err) {
    console.error('Checkout error:', err);
    res.status(500).json({ error: 'Failed to create checkout session' });
  }
});

module.exports = router;
