# Configuration Guide

Complete guide to configuring the Room Service App.

## Table of Contents

- [Environment Variables](#environment-variables)
- [Stripe Configuration](#stripe-configuration)
- [Database Setup](#database-setup)
- [Printer Configuration](#printer-configuration)
- [Currency Settings](#currency-settings)
- [Development vs Production](#development-vs-production)

## Environment Variables

Create a `.env` file in the project root. See `.env.example` for a template.

### Required Variables

#### Stripe (for payments)

| Variable | Description | Where to Get |
|----------|-------------|--------------|
| `STRIPE_SECRET_KEY` | Secret API key for server-side operations | Stripe Dashboard > Developers > API Keys |
| `STRIPE_PUBLIC_KEY` | Publishable key for client-side | Stripe Dashboard > Developers > API Keys |
| `STRIPE_WEBHOOK_SECRET` | Webhook endpoint secret | Stripe Dashboard > Developers > Webhooks |

**Important:** Never commit your `.env` file or expose secret keys in client-side code.

### Optional Variables

#### Database

| Variable | Default | Description |
|----------|---------|-------------|
| `DB_HOST` | `postgres` | Database hostname |
| `DB_PORT` | `5432` | Database port |
| `DB_NAME` | `roomservice` | Database name |
| `DB_USER` | `admin` | Database user |
| `DB_PASSWORD` | `secret` | Database password |

#### Printer

| Variable | Default | Description |
|----------|---------|-------------|
| `PRINTER_HOST` | - | Thermal printer IP address |
| `PRINTER_PORT` | `9100` | Printer TCP port |

#### Currency

| Variable | Default | Description |
|----------|---------|-------------|
| `DEFAULT_CURRENCY` | `USD` | Default display currency |
| `USD_TO_MXN_RATE` | `17.50` | Exchange rate for conversions |

#### Server

| Variable | Default | Description |
|----------|---------|-------------|
| `PORT` | `3001` | Server port |
| `NODE_ENV` | `development` | Environment mode |

## Stripe Configuration

### 1. Create Stripe Account

1. Go to [stripe.com](https://stripe.com) and sign up
2. Complete your account setup

### 2. Get API Keys

1. Go to Stripe Dashboard → Developers → API Keys
2. Copy the **Secret key** (starts with `sk_test_` for test mode)
3. Copy the **Publishable key** (starts with `pk_test_` for test mode)

Add to your `.env`:
```bash
STRIPE_SECRET_KEY=sk_test_your_secret_key_here
STRIPE_PUBLIC_KEY=pk_test_your_publishable_key_here
VITE_STRIPE_PUBLIC_KEY=pk_test_your_publishable_key_here
```

### 3. Set Up Webhooks

Webhooks notify your server when payments are completed.

#### Local Development (Stripe CLI)

1. Install Stripe CLI: https://stripe.com/docs/stripe-cli
2. Login: `stripe login`
3. Start webhook forwarding:
   ```bash
   stripe listen --forward-to localhost:3001/api/webhook
   ```
4. Copy the webhook signing secret (starts with `whsec_`)
5. Add to `.env`:
   ```bash
   STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret_here
   ```

#### Production

1. Go to Stripe Dashboard → Developers → Webhooks
2. Add endpoint: `https://yourdomain.com/api/webhook`
3. Select events: `checkout.session.completed`
4. Copy the signing secret to your production `.env`

### 4. Test Mode vs Live Mode

**Test Mode:**
- Use test API keys (start with `sk_test_` and `pk_test_`)
- Use test card numbers: https://stripe.com/docs/testing#cards
- No real charges are made

**Live Mode:**
- Use live API keys (start with `sk_live_` and `pk_live_`)
- Real charges are processed
- Requires activated Stripe account

## Database Setup

### With Docker (Recommended)

The database is automatically set up by Docker Compose:

```yaml
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: roomservice
      POSTGRES_USER: admin
      POSTGRES_PASSWORD: secret
```

### Without Docker

1. Install PostgreSQL 16+
2. Create database:
   ```sql
   CREATE DATABASE roomservice;
   CREATE USER admin WITH PASSWORD 'secret';
   GRANT ALL PRIVILEGES ON DATABASE roomservice TO admin;
   ```
3. Update `.env`:
   ```bash
   DB_HOST=localhost
   DB_PORT=5432
   DB_NAME=roomservice
   DB_USER=admin
   DB_PASSWORD=secret
   ```

### Database Schema

Tables are automatically created on first run:

```sql
-- Orders table
CREATE TABLE orders (
  id SERIAL PRIMARY KEY,
  room_number VARCHAR(10) NOT NULL,
  guest_name VARCHAR(100) NOT NULL,
  items JSONB NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  currency VARCHAR(3) DEFAULT 'USD',
  status VARCHAR(20) DEFAULT 'pending',
  notes TEXT,
  stripe_session_id VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Optional: Order status history
CREATE TABLE order_status_history (
  id SERIAL PRIMARY KEY,
  order_id INTEGER REFERENCES orders(id),
  status VARCHAR(20) NOT NULL,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

## Printer Configuration

### Supported Printers

Any ESC/POS compatible thermal printer with network (Ethernet) support:
- EPSON TM-T20, TM-T88
- Star TSP100, TSP650
- Generic ESC/POS printers

### Network Setup

1. Connect printer to your network
2. Set a static IP address (e.g., 192.168.1.100)
3. Verify port 9100 is open

### Configuration

Add to `.env`:
```bash
PRINTER_HOST=192.168.1.100
PRINTER_PORT=9100
```

### Testing the Printer

From your server, test connectivity:
```bash
telnet 192.168.1.100 9100
```

If connected, the printer should print a test page or show connection in its display.

### Printer Behavior

- Prints automatically when payment is confirmed
- Prints in kitchen-friendly format with:
  - Room number
  - Guest name
  - Item list with quantities
  - Special notes
  - Order timestamp
- If printer is unavailable, order is still saved and logged

## Currency Settings

### Default Currency

Set the default display currency:
```bash
DEFAULT_CURRENCY=USD  # or MXN
```

### Exchange Rate

Set the conversion rate:
```bash
USD_TO_MXN_RATE=17.50
```

Users can toggle between currencies in the UI. Prices are:
- Stored in USD in the database
- Converted on-the-fly for display
- Charged in the selected currency via Stripe

## Development vs Production

### Development

```bash
NODE_ENV=development
PORT=3001
DB_HOST=localhost

# Stripe test keys
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLIC_KEY=pk_test_...
```

### Production

```bash
NODE_ENV=production
PORT=3001
DB_HOST=postgres

# Stripe live keys
STRIPE_SECRET_KEY=sk_live_...
STRIPE_PUBLIC_KEY=pk_live_...

# Strong database password
DB_PASSWORD=your_strong_password_here
```

### Production Checklist

- [ ] Use Stripe live keys
- [ ] Set strong database password
- [ ] Enable HTTPS (use reverse proxy)
- [ ] Set up firewall rules
- [ ] Configure proper webhook endpoint
- [ ] Enable database backups
- [ ] Set up monitoring/logging

## Docker Compose Configuration

### Default Configuration

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: ${DB_NAME:-roomservice}
      POSTGRES_USER: ${DB_USER:-admin}
      POSTGRES_PASSWORD: ${DB_PASSWORD:-secret}
    volumes:
      - postgres_data:/var/lib/postgresql/data
    ports:
      - "5432:5432"

  server:
    build: ./server
    environment:
      - NODE_ENV=production
      - PORT=3001
      - DB_HOST=postgres
      # ... other env vars
    ports:
      - "3001:3001"
    depends_on:
      - postgres

  client:
    build: ./client
    ports:
      - "80:80"
    depends_on:
      - server
```

### Customizing Ports

To use different ports, edit `docker-compose.yml`:

```yaml
server:
  ports:
    - "8080:3001"  # Host:8080 → Container:3001

client:
  ports:
    - "8081:80"    # Host:8081 → Container:80
```

Then update client `.env`:
```bash
VITE_API_URL=http://localhost:8080
```

## Troubleshooting Configuration

### Environment variables not loading

- Ensure `.env` file is in the correct location
- Check file permissions
- Restart the server after changes

### Stripe payments failing

- Verify keys are correct (test vs live)
- Check webhook secret matches
- Ensure webhook endpoint is accessible

### Database connection refused

- Verify PostgreSQL is running
- Check host/port in `.env`
- For Docker, ensure service name matches (`postgres`)

### Printer not connecting

- Verify IP address and port
- Check network connectivity (`ping`/`telnet`)
- Ensure printer is online and accepting connections
