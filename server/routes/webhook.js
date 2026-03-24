const express = require('express');
const router = express.Router();
const stripe = process.env.TEST_MODE === 'true' ? null : require('stripe')(process.env.STRIPE_SECRET_KEY);
const db = require('../db');
const { printTicket } = require('../printer/print');

const endpointSecret = process.env.STRIPE_WEBHOOK_SECRET;
const TEST_MODE = process.env.TEST_MODE === 'true';

async function getOrderItems(orderId) {
  return db.all(
    `SELECT item_name_en, item_name_es, quantity, unit_price_usd
     FROM order_items WHERE order_id = ?`,
    [orderId]
  );
}

async function buildOrderResponse(orderId) {
  const order = await db.get(`SELECT * FROM orders WHERE id = ?`, [orderId]);
  if (!order) return null;
  const items = await getOrderItems(orderId);
  return { ...order, items };
}

router.post('/', async (req, res) => {
  if (TEST_MODE) {
    return res.json({ received: true });
  }

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
      await db.run(
        `UPDATE orders SET status = 'paid', updated_at = datetime('now') WHERE stripe_session_id = ?`,
        [session.id]
      );

      const orderId = await db.get(
        `SELECT id FROM orders WHERE stripe_session_id = ?`,
        [session.id]
      );

      if (orderId) {
        const order = await buildOrderResponse(orderId.id);
        if (order) {
          try {
            await printTicket(order);
            console.log(`Ticket printed for order ${order.id}`);
          } catch (printErr) {
            console.error('Failed to print ticket:', printErr);
          }
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
