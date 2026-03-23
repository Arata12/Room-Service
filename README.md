# Room Service Web App

A complete room service ordering system with Stripe payments, thermal printer integration, and bilingual support (English/Spanish).

## Features

- 🍽️ **Full Menu**: Food and drinks with categories and descriptions
- 💳 **Stripe Payments**: Secure checkout with Stripe
- 🌐 **Bilingual**: English and Spanish language support
- 💱 **Dual Currency**: USD and MXN with configurable exchange rate
- 🖨️ **Thermal Printing**: Automatic ticket printing to kitchen
- 🐳 **Docker Ready**: Complete docker-compose setup
- 📱 **Responsive**: Works on mobile and desktop

## Quick Links

- [Quick Start Guide](#quick-start-with-docker)
- [Development Setup](#development-setup-without-docker)
- [Configuration Guide](docs/CONFIGURATION.md)
- [API Documentation](docs/API.md)
- [Menu Customization](docs/MENU.md)
- [Troubleshooting](docs/TROUBLESHOOTING.md)

## Tech Stack

- **Frontend**: React 18 + Vite + i18next
- **Backend**: Node.js + Express
- **Database**: PostgreSQL
- **Payments**: Stripe Checkout
- **Printing**: ESC/POS over TCP
- **Containerization**: Docker + Docker Compose

## Project Structure

```
room-service/
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── pages/          # Page components
│   │   ├── i18n/           # Translations (EN/ES)
│   │   └── menu.json       # Sample menu data
│   ├── Dockerfile
│   └── nginx.conf
├── server/                 # Express backend
│   ├── routes/             # API routes
│   ├── db/                 # Database connection & migrations
│   ├── printer/            # ESC/POS printing logic
│   └── Dockerfile
├── docker-compose.yml
├── .env.example
└── README.md
```

## Quick Start with Docker

1. **Clone and navigate to the project:**
   ```bash
   cd room-service
   ```

2. **Create your environment file:**
   ```bash
   cp .env.example .env
   ```

3. **Edit `.env` with your configuration:**
   ```env
   # Stripe (required for payments)
   STRIPE_SECRET_KEY=sk_test_your_key
   STRIPE_WEBHOOK_SECRET=whsec_your_secret
   STRIPE_PUBLIC_KEY=pk_test_your_key
   VITE_STRIPE_PUBLIC_KEY=pk_test_your_key

   # Printer (optional - can be configured later)
   PRINTER_HOST=192.168.1.100
   PRINTER_PORT=9100

   # Currency
   DEFAULT_CURRENCY=USD
   USD_TO_MXN_RATE=17.50
   ```

4. **Build and run:**
   ```bash
   docker-compose up --build
   ```

5. **Access the app:**
   - Web app: http://localhost
   - API: http://localhost:3001

## Development Setup (Without Docker)

### Prerequisites
- Node.js 20+
- PostgreSQL 16+

### Server Setup

```bash
cd server
npm install

# Set up PostgreSQL database
# Then run:
npm start
```

### Client Setup

```bash
cd client
npm install
npm run dev
```

## Configuration

See [Configuration Guide](docs/CONFIGURATION.md) for detailed setup instructions.

### Stripe Setup

For local development, you need to forward Stripe webhooks:

```bash
# Install Stripe CLI
# Then run:
stripe listen --forward-to localhost:3001/api/webhook

# Copy the webhook signing secret to your .env
```

### Thermal Printer Setup

Edit your `.env` file:

```env
PRINTER_HOST=192.168.1.100    # Your printer's IP address
PRINTER_PORT=9100              # Usually 9100 for ESC/POS
```

The app will automatically print tickets when payments are confirmed. If no printer is configured, order details will be logged to the console.

## Menu Customization

Edit `client/src/menu.json` to add/remove items. Each item needs:

```json
{
  "id": "unique-id",
  "name": {
    "en": "English Name",
    "es": "Spanish Name"
  },
  "description": {
    "en": "English description",
    "es": "Spanish description"
  },
  "price": 10.00
}
```

See [Menu Documentation](docs/MENU.md) for the complete menu structure and customization options.

## API Documentation

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/menu` | Get menu items |
| POST | `/api/checkout` | Create Stripe checkout session |
| POST | `/api/webhook` | Stripe webhook handler |
| GET | `/api/orders` | List all orders |
| GET | `/api/orders/:id` | Get specific order |
| GET | `/api/health` | Health check |

See [API Documentation](docs/API.md) for detailed request/response examples.

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `STRIPE_SECRET_KEY` | Yes | - | Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | Yes | - | Stripe webhook secret |
| `STRIPE_PUBLIC_KEY` | Yes | - | Stripe publishable key |
| `PRINTER_HOST` | No | - | Printer IP address |
| `PRINTER_PORT` | No | 9100 | Printer port |
| `DEFAULT_CURRENCY` | No | USD | Default currency (USD/MXN) |
| `USD_TO_MXN_RATE` | No | 17.50 | Exchange rate |
| `DB_HOST` | No | postgres | Database host |
| `DB_PORT` | No | 5432 | Database port |
| `DB_NAME` | No | roomservice | Database name |
| `DB_USER` | No | admin | Database user |
| `DB_PASSWORD` | No | secret | Database password |

See [Configuration Guide](docs/CONFIGURATION.md) for all available options.

## User Flow

1. Guest browses the menu (switches language/currency as needed)
2. Guest adds items to cart
3. Guest reviews cart and enters room number + name
4. Guest clicks "Pay Now" → redirected to Stripe
5. Guest completes payment
6. Stripe sends webhook → order marked as paid
7. Thermal printer prints ticket for kitchen
8. Guest sees success confirmation

## Troubleshooting

See [Troubleshooting Guide](docs/TROUBLESHOOTING.md) for common issues and solutions.

### Quick Fixes

**Printer not printing:**
- Verify `PRINTER_HOST` and `PRINTER_PORT` in `.env`
- Ensure printer is on the same network
- Check printer accepts ESC/POS commands on port 9100

**Stripe webhook errors:**
- Verify `STRIPE_WEBHOOK_SECRET` matches your Stripe dashboard
- Ensure webhook endpoint is publicly accessible
- Check Stripe CLI is forwarding correctly

**Database connection errors:**
- Verify PostgreSQL is running
- Check database credentials in `.env`
- For Docker, ensure postgres service is healthy before starting server

## Documentation Index

| Document | Description |
|----------|-------------|
| [Configuration](docs/CONFIGURATION.md) | Environment variables and setup |
| [API Reference](docs/API.md) | API endpoints and examples |
| [Menu Structure](docs/MENU.md) | Customizing the menu |
| [Troubleshooting](docs/TROUBLESHOOTING.md) | Common issues and fixes |
| [Architecture](docs/ARCHITECTURE.md) | System architecture overview |
| [Deployment](docs/DEPLOYMENT.md) | Production deployment guide |

## License

MIT

---

**Need help?** Check the [Troubleshooting Guide](docs/TROUBLESHOOTING.md) or open an issue.
