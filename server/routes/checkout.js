const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const { printTicket } = require('../printer/print');

const TEST_MODE = process.env.TEST_MODE === 'true';
const stripe = TEST_MODE ? null : require('stripe')(process.env.STRIPE_SECRET_KEY);

const DEFAULT_CURRENCY = process.env.DEFAULT_CURRENCY || 'USD';
const USD_TO_MXN_RATE = parseFloat(process.env.USD_TO_MXN_RATE) || 17.50;

function convertToUSD(amount, currency) {
  if (currency === 'MXN') {
    return amount / USD_TO_MXN_RATE;
  }
  return amount;
}

router.post('/', async (req, res) => {
  try {
    const { items, roomNumber, guestName, notes, currency } = req.body;
    
    if (!items || items.length === 0) {
      return res.status(400).json({ error: 'No items in cart' });
    }

    const selectedCurrency = currency || DEFAULT_CURRENCY;
    
    // Calculate totals
    const totalUSD = items.reduce((sum, item) => {
      return sum + (item.price * item.quantity);
    }, 0);
    
    const displayTotal = selectedCurrency === 'MXN' 
      ? totalUSD * USD_TO_MXN_RATE 
      : totalUSD;

    // Create order in database
    const orderResult = await pool.query(
      `INSERT INTO orders (room_number, guest_name, total_usd, currency, status, notes)
       VALUES ($1, $2, $3, $4, $5, $6) RETURNING id`,
      [roomNumber, guestName, totalUSD, selectedCurrency, 'pending', notes]
    );
    
    const orderId = orderResult.rows[0].id;

    // Insert order items
    for (const item of items) {
      await pool.query(
        `INSERT INTO order_items (order_id, item_id, item_name_en, item_name_es, quantity, unit_price_usd)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [orderId, item.id, item.name.en, item.name.es, item.quantity, item.price]
      );
    }

    if (TEST_MODE) {
      await pool.query('UPDATE orders SET status = $1 WHERE id = $2', ['paid', orderId]);
      const orderResult = await pool.query(
        `SELECT o.*, json_agg(json_build_object(
          'item_name_en', oi.item_name_en,
          'item_name_es', oi.item_name_es,
          'quantity', oi.quantity,
          'unit_price_usd', oi.unit_price_usd
        )) as items
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
          product_data: { name: item.name.en, description: item.name.es },
          unit_amount: Math.round((selectedCurrency === 'MXN' ? item.price * USD_TO_MXN_RATE : item.price) * 100),
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
