const escpos = require('escpos');
const Network = require('escpos-network');

const PRINTER_HOST = process.env.PRINTER_HOST;
const PRINTER_PORT = process.env.PRINTER_PORT || 9100;

const USD_TO_MXN_RATE = parseFloat(process.env.USD_TO_MXN_RATE) || 17.50;

function formatCurrency(amount, currency) {
  const symbol = currency === 'MXN' ? 'MX$' : '$';
  return `${symbol}${amount.toFixed(2)} ${currency}`;
}

function toDisplayAmount(amount, currency) {
  return currency === 'MXN' ? amount * USD_TO_MXN_RATE : amount;
}

async function printTicket(order) {
  if (!PRINTER_HOST) {
    console.log('Printer not configured, skipping print');
    console.log('Order details:', JSON.stringify(order, null, 2));
    return;
  }

  return new Promise((resolve, reject) => {
    try {
      const device = new Network(PRINTER_HOST, PRINTER_PORT);
      const printer = new escpos.Printer(device);

      device.open((error) => {
        if (error) {
          console.error('Printer connection error:', error);
          reject(error);
          return;
        }

        const date = new Date(order.created_at).toLocaleString();
        const items = order.items || [];
        const displayTotal = toDisplayAmount(order.total_usd, order.currency);

        printer
          .font('a')
          .align('ct')
          .style('bu')
          .size(2, 2)
          .text('ROOM SERVICE')
          .text('')
          .size(1, 1)
          .style('normal')
          .align('lt')
          .text(`Room: ${order.room_number}`)
          .text(`Guest: ${order.guest_name}`)
          .text(`Date: ${date}`)
          .text(`Currency: ${order.currency}`)
          .text('')
          .text('--------------------------------')
          .text('');

        // Print items
        items.forEach(item => {
          const itemTotal = item.quantity * item.unit_price_usd;
          const displayItemTotal = toDisplayAmount(itemTotal, order.currency);
          
          printer
            .text(`${item.quantity}x ${item.item_name_en}`)
            .align('rt')
            .text(formatCurrency(displayItemTotal, order.currency))
            .align('lt');
        });

        printer
          .text('')
          .text('--------------------------------')
          .align('rt')
          .style('b')
          .text(`TOTAL: ${formatCurrency(displayTotal, order.currency)}`)
          .style('normal')
          .align('ct')
          .text('')
          .text('Thank you! Enjoy your stay')
          .text('')
          .text('================================')
          .cut()
          .close(() => {
            resolve();
          });
      });
    } catch (err) {
      console.error('Print error:', err);
      reject(err);
    }
  });
}

module.exports = { printTicket };
