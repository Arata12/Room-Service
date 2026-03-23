# System Architecture

Overview of the Room Service App architecture and data flow.

## System Overview

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│   Customer      │────▶│   Web Browser   │────▶│   Nginx         │
│   (Hotel Guest) │     │                 │     │   (Port 80)     │
└─────────────────┘     └─────────────────┘     └────────┬────────┘
                                                         │
                              ┌─────────────────────────┘
                              ▼
                    ┌─────────────────┐
                    │   React Client  │
                    │   (Port 5173)   │
                    └────────┬────────┘
                             │ HTTP/JSON
                             ▼
                    ┌─────────────────┐
                    │   Express API   │
                    │   (Port 3001)   │
                    └────────┬────────┘
                             │
          ┌──────────────────┼──────────────────┐
          │                  │                  │
          ▼                  ▼                  ▼
┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐
│   PostgreSQL    │  │   Stripe API    │  │   ESC/POS       │
│   (Port 5432)   │  │                 │  │   Printer       │
└─────────────────┘  └─────────────────┘  └─────────────────┘
```

## Component Details

### Frontend (React + Vite)

**Purpose:** Customer-facing ordering interface

**Key Technologies:**
- React 18 (functional components + hooks)
- Vite (build tool)
- React Router (navigation)
- i18next (internationalization)

**Structure:**
```
client/src/
├── App.jsx           # Root component with routing
├── main.jsx          # Entry point
├── CartContext.jsx   # Global cart state
├── components/       # Reusable UI components
│   ├── MenuCard.jsx  # Individual menu item
│   ├── Navbar.jsx    # Navigation bar
│   └── GuestForm.jsx # Checkout form
├── pages/            # Page-level components
│   ├── MenuPage.jsx  # Menu browsing
│   ├── CartPage.jsx  # Cart review
│   └── SuccessPage.jsx # Order confirmation
└── i18n/             # Translations
    ├── en.json
    └── es.json
```

**State Management:**
- CartContext: Global cart state with localStorage persistence
- useState: Local component state
- No Redux (simple enough for Context API)

### Backend (Express + Node.js)

**Purpose:** API server, payment processing, order management

**Key Technologies:**
- Express.js (web framework)
- PostgreSQL (pg library)
- Stripe SDK (payments)
- ESC/POS (printing)

**Structure:**
```
server/
├── index.js          # Entry point, middleware setup
├── routes/
│   ├── menu.js       # GET /api/menu
│   ├── checkout.js   # POST /api/checkout
│   ├── webhook.js    # POST /api/webhook
│   └── orders.js     # GET /api/orders
├── db/
│   ├── index.js      # Database connection
│   └── migrate.js    # Schema setup
├── printer/
│   └── print.js      # ESC/POS printing logic
└── data/
    └── menu.json     # Server-side menu copy
```

### Database (PostgreSQL)

**Purpose:** Persist orders and payment data

**Schema:**
```sql
orders
├── id (SERIAL PRIMARY KEY)
├── room_number (VARCHAR)
├── guest_name (VARCHAR)
├── items (JSONB)
├── total (DECIMAL)
├── currency (VARCHAR)
├── status (VARCHAR)
├── notes (TEXT)
├── stripe_session_id (VARCHAR)
└── created_at (TIMESTAMP)
```

**Why PostgreSQL:**
- JSONB support for flexible item storage
- Reliable and well-supported
- Easy Docker deployment

### Payment Processing (Stripe)

**Flow:**
1. Customer clicks "Pay Now"
2. Server creates Stripe Checkout Session
3. Customer redirected to Stripe
4. Customer completes payment on Stripe
5. Stripe redirects back to success page
6. Stripe sends webhook to server
7. Server confirms payment and updates order
8. Receipt is printed (if configured)

**Security:**
- Server-side API keys only
- Webhook signature verification
- No card data touches our servers

### Kitchen Printing (ESC/POS)

**Purpose:** Print order tickets for kitchen staff

**Protocol:** ESC/POS over TCP (port 9100)

**Print Trigger:** Webhook confirmation of payment

**Ticket Format:**
```
ROOM SERVICE ORDER
==================
Room: 204
Guest: John Doe
Time: 10:30 AM

ITEMS:
2x Garden Salad
1x Beef Burger

NOTES:
No onions please

Total: $42.00
==================
```

## Data Flow

### Order Flow

```
1. Browse Menu
   Client ──GET /api/menu──▶ Server
   Client ◀──menu.json───── Server

2. Add to Cart
   Client (localStorage + state)

3. Checkout
   Client ──POST /api/checkout──▶ Server
   Client ◀──stripe URL────────── Server
   Client ──redirect────────────▶ Stripe

4. Payment
   Customer ──pays──▶ Stripe

5. Webhook
   Stripe ──POST /api/webhook──▶ Server
   Server ──update order───────▶ Database
   Server ──print ticket───────▶ Printer (optional)

6. Confirmation
   Stripe ──redirect──▶ Client (success page)
```

### Cart State Flow

```
User Action
    │
    ▼
CartContext (addToCart, removeFromCart, etc.)
    │
    ├──▶ React State (immediate UI update)
    │
    └──▶ localStorage (persistence across refreshes)
```

### Language/Currency Flow

```
User selects language/currency
    │
    ▼
i18n.changeLanguage() / setCurrency()
    │
    ├──▶ localStorage (preference saved)
    │
    ├──▶ React State (re-render components)
    │
    └──▶ Menu display updates
```

## Request Lifecycle

### Typical API Request

```
1. Request arrives at Nginx (port 80)
   └── If /api/* → forward to server:3001
   └── Else → serve static React build

2. Express receives request
   └── CORS middleware
   └── JSON body parser
   └── Route matching

3. Route handler executes
   └── Validation
   └── Database query (if needed)
   └── External API call (if needed)

4. Response sent
   └── JSON response
   └── Error handling (if failed)
```

### Payment Webhook Lifecycle

```
1. Stripe POSTs to /api/webhook
   └── Raw body preserved for signature check

2. Signature verification
   └── Compare computed signature with header
   └── Reject if mismatch (security)

3. Event processing
   └── Parse event type
   └── Handle checkout.session.completed
   └── Ignore other events

4. Order update
   └── Update status to 'paid'
   └── Save payment confirmation

5. Print receipt
   └── Connect to printer
   └── Format ticket
   └── Send ESC/POS commands
   └── Log if printer unavailable
```

## Security Considerations

### Authentication

Current: No authentication (designed for hotel guests)

Future: Could add:
- Room number + last name verification
- QR codes in rooms
- SMS verification

### Data Protection

- Stripe handles all payment data (PCI compliance)
- No credit card numbers stored
- HTTPS in production
- Webhook signatures verified

### CORS

Development: Allow all origins
Production: Restrict to known domains

## Scalability

### Current Design

- Single server instance
- Single database
- Suitable for small to medium hotels

### Scaling Options

1. **Horizontal Scaling:**
   - Multiple server containers behind load balancer
   - Shared database
   - Session-less design (no server-side sessions)

2. **Database Scaling:**
   - Read replicas for menu fetching
   - Connection pooling

3. **Caching:**
   - Redis for menu data
   - CDN for static assets

## Monitoring

### Logs

- Docker: `docker-compose logs -f`
- Application: Console logs in containers

### Health Checks

- `/api/health` - Basic server health
- Database connection status
- Stripe API connectivity

### Metrics (Future)

- Order volume
- Payment success rate
- Average order value
- Popular items
