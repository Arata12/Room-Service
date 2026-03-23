# API Documentation

Complete reference for the Room Service API.

## Base URL

```
Local: http://localhost:3001/api
Production: https://yourdomain.com/api
```

## Authentication

Currently, the API is open (no authentication required). For production, consider adding API key authentication.

## Endpoints

### Health Check

Check if the server is running.

```http
GET /api/health
```

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

---

### Get Menu

Retrieve the full menu with categories, items, and pricing.

```http
GET /api/menu
```

**Response:**
```json
{
  "categories": [
    {
      "id": "food",
      "name": {
        "en": "Food",
        "es": "Comida"
      },
      "subcategories": [
        {
          "id": "starters",
          "name": {
            "en": "Starters",
            "es": "Entradas"
          },
          "items": [
            {
              "id": "garden-salad",
              "name": {
                "en": "Garden Salad",
                "es": "Ensalada de la Casa"
              },
              "description": {
                "en": "Fresh mixed greens...",
                "es": "Mix de hojas verdes..."
              },
              "price": 8.00
            }
          ]
        }
      ]
    }
  ]
}
```

---

### Create Checkout Session

Create a Stripe checkout session for payment.

```http
POST /api/checkout
Content-Type: application/json
```

**Request Body:**
```json
{
  "items": [
    {
      "id": "garden-salad",
      "name": {
        "en": "Garden Salad",
        "es": "Ensalada de la Casa"
      },
      "price": 8.00,
      "quantity": 2
    }
  ],
  "roomNumber": "204",
  "guestName": "John Doe",
  "notes": "No onions please",
  "currency": "USD"
}
```

**Response:**
```json
{
  "url": "https://checkout.stripe.com/c/pay/cs_test_..."
}
```

**Error Response:**
```json
{
  "error": "Failed to create checkout session"
}
```

**Notes:**
- The `url` is a Stripe Checkout page where the customer completes payment
- After payment, Stripe redirects to the success URL configured in your Stripe Dashboard
- The order is created with status "pending" and updated to "paid" via webhook

---

### Stripe Webhook

Stripe sends event notifications to this endpoint.

```http
POST /api/webhook
Content-Type: application/json
Stripe-Signature: t=...,v1=...
```

**Request Body:** (from Stripe)
```json
{
  "id": "evt_...",
  "object": "event",
  "type": "checkout.session.completed",
  "data": {
    "object": {
      "id": "cs_test_...",
      "metadata": {
        "orderId": "123"
      }
    }
  }
}
```

**Response:**
```json
{ "received": true }
```

**Notes:**
- This endpoint validates the Stripe signature
- On successful payment, the order status is updated to "paid"
- If a printer is configured, a ticket is printed automatically

---

### List Orders

Get all orders with optional filtering.

```http
GET /api/orders
```

**Query Parameters:**
| Parameter | Type | Description |
|-----------|------|-------------|
| `status` | string | Filter by status (pending, paid, cancelled) |
| `limit` | number | Maximum results (default: 50) |
| `offset` | number | Pagination offset |

**Response:**
```json
{
  "orders": [
    {
      "id": 1,
      "room_number": "204",
      "guest_name": "John Doe",
      "items": [
        {
          "id": "garden-salad",
          "name": {
            "en": "Garden Salad",
            "es": "Ensalada de la Casa"
          },
          "price": 8.00,
          "quantity": 2
        }
      ],
      "total": 16.00,
      "currency": "USD",
      "status": "paid",
      "notes": "No onions please",
      "stripe_session_id": "cs_test_...",
      "created_at": "2024-01-15T10:30:00.000Z"
    }
  ],
  "total": 1
}
```

---

### Get Order

Get a specific order by ID.

```http
GET /api/orders/:id
```

**Response:**
```json
{
  "id": 1,
  "room_number": "204",
  "guest_name": "John Doe",
  "items": [...],
  "total": 16.00,
  "currency": "USD",
  "status": "paid",
  "notes": "No onions please",
  "stripe_session_id": "cs_test_...",
  "created_at": "2024-01-15T10:30:00.000Z"
}
```

**Error Response:**
```json
{
  "error": "Order not found"
}
```

---

### Update Order Status

Update the status of an order.

```http
PATCH /api/orders/:id
Content-Type: application/json
```

**Request Body:**
```json
{
  "status": "completed"
}
```

**Valid Status Values:**
- `pending` - Order created, awaiting payment
- `paid` - Payment confirmed
- `preparing` - Kitchen is preparing
- `ready` - Order ready for delivery
- `delivered` - Order delivered to room
- `cancelled` - Order cancelled

**Response:**
```json
{
  "id": 1,
  "status": "completed",
  "updated_at": "2024-01-15T10:35:00.000Z"
}
```

---

## Error Handling

All errors follow this format:

```json
{
  "error": "Error message",
  "code": "ERROR_CODE",
  "details": {} // Optional additional info
}
```

**Common HTTP Status Codes:**

| Code | Meaning |
|------|---------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request - Invalid input |
| 404 | Not Found |
| 500 | Server Error |

## Data Types

### Order Object

```typescript
{
  id: number;
  room_number: string;
  guest_name: string;
  items: OrderItem[];
  total: number;
  currency: string;
  status: 'pending' | 'paid' | 'preparing' | 'ready' | 'delivered' | 'cancelled';
  notes: string | null;
  stripe_session_id: string;
  created_at: string; // ISO 8601
}
```

### Order Item

```typescript
{
  id: string;
  name: {
    en: string;
    es: string;
  };
  price: number;
  quantity: number;
}
```

### Menu Item

```typescript
{
  id: string;
  name: {
    en: string;
    es: string;
  };
  description: {
    en: string;
    es: string;
  };
  price: number;
}
```

## Rate Limiting

Currently, no rate limiting is implemented. For production, consider adding:
- Express rate limit middleware
- Stripe webhook signature verification (already implemented)

## CORS

CORS is enabled for all origins in development. For production, configure specific origins:

```javascript
// server/index.js
app.use(cors({
  origin: ['https://yourdomain.com', 'https://app.yourdomain.com']
}));
```

## Testing the API

### Using cURL

```bash
# Health check
curl http://localhost:3001/api/health

# Get menu
curl http://localhost:3001/api/menu

# List orders
curl http://localhost:3001/api/orders

# Create checkout
curl -X POST http://localhost:3001/api/checkout \
  -H "Content-Type: application/json" \
  -d '{
    "items": [{"id":"garden-salad","name":{"en":"Garden Salad","es":"Ensalada"},"price":8.00,"quantity":1}],
    "roomNumber": "101",
    "guestName": "Test Guest",
    "currency": "USD"
  }'
```

### Using Postman

1. Import the API base URL: `http://localhost:3001/api`
2. Create requests for each endpoint
3. Set headers: `Content-Type: application/json`
4. For webhooks, use Stripe CLI to forward events
