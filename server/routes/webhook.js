const express = require('express');
const router = express.Router();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);
const { pool } = require('../db');
const { printTicket } = require('../printer/print');

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;

router.post('/', async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, endpointSecret);
  } catch (err) {
    console.error('Webhook signature verification failed:', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    
    try {
      // Update order status
      await pool.query(
        'UPDATE orders SET status = $1 WHERE stripe_session_id = $2',
        ['paid', session.id]
      );

      // Get full order details
      const orderResult = await pool.query(
        `SELECT o.*, json_agg(json_build_object(
          'item_name_en', oi.item_name_en,
          'item_name_es', oi.item_name_es,
          'quantity', oi.quantity,
          'unit_price_usd', oi.unit_price_usd
        )) as items
         FROM orders o
         LEFT JOIN order_items oi ON o.id = oi.order_id
         WHERE o.stripe_session_id = $1
         GROUP BY o.id`,
        [session.id]
      );

      if (orderResult.rows.length > 0) {
        const order = orderResult.rows[0];
        
        // Print ticket
        try {
          await printTicket(order);
          console.log(`Ticket printed for order ${order.id}`);
        } catch (printErr) {
          console.error('Failed to print ticket:', printErr);
          // Don't fail the webhook if printing fails
        }
      }
    } catch (err) {
      console.error('Error processing webhook:', err);
      return res.status(500).json({ error: 'Failed to process webhook' });
    }
  }

  res.json({ received: true });
});

module.exports = router;
