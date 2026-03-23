# Agent Instructions

Repository: Room Service App (Esmeralda Beach Resort) - React + Express + PostgreSQL

## Build & Development Commands

### Client (React + Vite)
```bash
cd client
npm install
npm run dev          # Start dev server (port 5173)
npm run build        # Production build
cd ..
```

### Server (Express)
```bash
cd server
npm install
npm run dev          # Start with nodemon (auto-reload)
npm start            # Production start
cd ..
```

### Docker (Full Stack)
```bash
docker-compose up -d           # Start all services
docker-compose up --build -d   # Rebuild and start
docker-compose logs -f         # View logs
docker-compose down            # Stop all
```

### Database
```bash
docker-compose exec postgres psql -U admin -d roomservice
```

## Code Style Guidelines

### JavaScript/React (Client)

**Imports:**
- Group: React imports → Library imports → Relative imports
- Use ES modules (`import/export`)
- Named imports preferred: `import { useState } from 'react'`

**Components:**
- Functional components only
- Props destructuring: `function Card({ title, onClick })`
- Hooks order: useState → useEffect → custom hooks

**Styling:**
- Inline `styles` object for component-specific styles
- CSS classes for media queries and pseudo-selectors
- Use `clamp()` for responsive font sizes
- Min touch target: 44px

**Naming:**
- Components: PascalCase (`MenuCard.jsx`)
- Functions: camelCase (`handleAdd`)
- Constants: UPPER_SNAKE_CASE for true constants
- Files: Match component name

**Error Handling:**
- Try/catch in async functions
- Log errors with `console.error`
- User-friendly error messages in UI

### JavaScript (Server)

**Imports:**
- CommonJS (`require`)
- Group: Core modules → External modules → Internal modules

**Routes:**
- Async route handlers with try/catch
- Return JSON responses: `res.json({ data })` or `res.status(500).json({ error })`

**Database:**
- Use parameterized queries only (`$1, $2`)
- Pool connections via `require('./db')`

**Naming:**
- Variables: camelCase
- Route files: kebab-case (`checkout.js`)
- Constants: UPPER_SNAKE_CASE

### General

**Formatting:**
- 2-space indentation
- Semicolons required
- Single quotes for strings
- Trailing commas in multi-line objects/arrays

**Comments:**
- JSDoc for functions
- Inline comments for complex logic
- Section headers for file organization

**Environment Variables:**
- Access via `process.env.VAR_NAME`
- Provide defaults: `process.env.PORT || 3001`
- Never commit `.env` files

## Project Structure

```
client/src/
  components/     # Reusable UI (MenuCard, Navbar, Footer)
  pages/          # Route components (MenuPage, CartPage)
  i18n/           # Translations (en.json, es.json)
  CartContext.jsx # Global state
  App.jsx         # Routes

server/
  routes/         # API endpoints
  db/             # Database connection & migrations
  printer/        # ESC/POS printing logic
  index.js        # Entry point
```

## Key Patterns

**i18n Language Helper:**
```javascript
const getLang = (lang) => lang.split('-')[0];
// Use: item.name[getLang(i18n.language)]
```

**Color Palette (Emerald Theme):**
- Background: #FAF9F7
- Text: #1E3A5F
- Primary: #10B981
- Primary Dark: #059669
- Accent: #34D399
- Border: #E8E3DB

**Responsive Breakpoints:**
- Mobile: < 600px
- Tablet: 600px - 960px
- Desktop: > 960px

## Testing

No test framework currently configured. To add tests:
1. Install Jest/Vitest + React Testing Library (client)
2. Install Jest + Supertest (server)
3. Run: `npm test`

## Environment Files

Root `.env`:
```bash
TEST_MODE=true
STRIPE_SECRET_KEY=sk_...
STRIPE_PUBLIC_KEY=pk_...
DB_PASSWORD=secret
```

Client `client/.env`:
```bash
VITE_STRIPE_PUBLIC_KEY=pk_...
VITE_API_URL=http://localhost:3001
```
