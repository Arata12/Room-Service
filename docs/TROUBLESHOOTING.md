# Troubleshooting Guide

Common issues and solutions for the Room Service App.

## Quick Diagnostics

Check service status:
```bash
docker-compose ps
```

View logs:
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f server
docker-compose logs -f client
docker-compose logs -f postgres
```

## Installation Issues

### Docker Compose fails to build

**Error:** `Cannot locate specified Dockerfile`

**Solution:**
```bash
# Ensure you're in the project root
cd /path/to/room-service-app

# Rebuild with no cache
docker-compose build --no-cache
```

### Port already in use

**Error:** `bind: address already in use`

**Solution:**
```bash
# Find what's using the port
sudo lsof -i :3001
sudo lsof -i :5432
sudo lsof -i :80

# Kill the process or change ports in docker-compose.yml
```

### Permission denied on Docker socket

**Error:** `permission denied while trying to connect to Docker daemon`

**Solution:**
```bash
# Add user to docker group
sudo usermod -aG docker $USER
newgrp docker
```

---

## Database Issues

### Database connection refused

**Error:** `connect ECONNREFUSED 127.0.0.1:5432`

**Causes & Solutions:**

1. **PostgreSQL container not running:**
   ```bash
   docker-compose up -d postgres
   docker-compose logs postgres
   ```

2. **Wrong host in .env:**
   - Docker: Use `DB_HOST=postgres`
   - Local: Use `DB_HOST=localhost`

3. **Database not initialized:**
   ```bash
   # Reset database volume (WARNING: deletes all data)
   docker-compose down -v
   docker-compose up -d postgres
   ```

### Authentication failed

**Error:** `password authentication failed for user "admin"`

**Solution:**
```bash
# Check credentials match
cat .env | grep DB_

# Reset database with new credentials
docker-compose down -v
docker-compose up --build
```

### Database migration fails

**Error:** `relation "orders" does not exist`

**Solution:**
```bash
# Run migrations manually
docker-compose exec server node db/migrate.js
```

---

## Stripe Issues

### Invalid API key

**Error:** `Invalid API Key provided`

**Solution:**
1. Check keys in `.env`:
   ```bash
   cat .env | grep STRIPE
   ```
2. Ensure no extra spaces or quotes
3. Verify you're using test keys for development
4. Check key hasn't been revoked in Stripe Dashboard

### Webhook signature verification failed

**Error:** `No signatures found matching the expected signature`

**Solution:**
1. Verify webhook secret matches:
   ```bash
   # For local dev with Stripe CLI
   stripe listen --forward-to localhost:3001/api/webhook
   # Copy the whsec_ secret to .env
   ```

2. Check webhook endpoint URL in Stripe Dashboard matches your actual URL

3. Ensure raw body is being sent (not parsed JSON)

### Payment fails in test mode

**Error:** `Your card was declined`

**Solution:**
Use Stripe test card numbers:
- Successful payment: `4242 4242 4242 4242`
- Declined: `4000 0000 0000 0002`
- Requires 3D Secure: `4000 0025 0000 3155`

Full list: https://stripe.com/docs/testing#cards

### Webhook not receiving events

**Symptom:** Payment succeeds but order status doesn't update

**Solutions:**

1. **Local development:**
   ```bash
   # Ensure Stripe CLI is running
   stripe listen --forward-to localhost:3001/api/webhook
   ```

2. **Production:**
   - Verify webhook endpoint is publicly accessible
   - Check Stripe Dashboard for failed webhook attempts
   - Ensure HTTPS is used (Stripe requires HTTPS in production)

---

## Printer Issues

### Printer not printing

**Symptom:** Payment confirmed but no receipt printed

**Diagnostics:**
```bash
# Test printer connectivity
telnet PRINTER_IP 9100

# Check printer IP in .env
cat .env | grep PRINTER
```

**Solutions:**

1. **Connection refused:**
   - Verify printer IP address is correct
   - Ensure printer is on the same network
   - Check printer is powered on and online

2. **Wrong port:**
   - Default ESC/POS port is 9100
   - Check printer manual for correct port
   - Some printers use 9101 or other ports

3. **Firewall blocking:**
   ```bash
   # Check firewall rules
   sudo ufw status
   sudo iptables -L
   
   # Allow printer port
   sudo ufw allow 9100/tcp
   ```

### Garbled print output

**Symptom:** Printer prints but text is unreadable

**Cause:** Printer doesn't support ESC/POS or wrong encoding

**Solution:**
- Verify printer supports ESC/POS commands
- Check printer manual for command set
- Try different encoding (ESC/POS vs Star)

### Partial prints

**Symptom:** Receipt cuts off or is incomplete

**Solutions:**
- Check printer paper level
- Verify printer buffer isn't full
- Increase timeout in printer configuration

---

## Frontend Issues

### Blank page / White screen

**Symptom:** App loads but shows blank page

**Diagnostics:**
```bash
# Check browser console (F12)
# Look for JavaScript errors
```

**Solutions:**

1. **Build failed:**
   ```bash
   # Rebuild client
   docker-compose build --no-cache client
   docker-compose up -d client
   ```

2. **API not accessible:**
   - Verify server is running: `docker-compose ps`
   - Check browser console for CORS errors
   - Verify `VITE_API_URL` in client environment

### Language not changing

**Symptom:** Switching language does nothing

**Solution:**
- Check browser console for i18next errors
- Verify translation files exist in `client/src/i18n/`
- Check localStorage isn't corrupted:
  ```javascript
  localStorage.clear() // In browser console
  ```

### Cart not persisting

**Symptom:** Items disappear on page refresh

**Solution:**
```javascript
// Check localStorage in browser console
localStorage.getItem('cart')

// Clear if corrupted
localStorage.removeItem('cart')
```

### Currency toggle not working

**Symptom:** Prices don't change when switching currency

**Solution:**
- Verify `USD_TO_MXN_RATE` is set in `.env`
- Check that items have prices as numbers (not strings)
- Clear browser cache and refresh

---

## Network Issues

### Client can't connect to API

**Error:** `Failed to fetch` or `Network Error`

**Solutions:**

1. **Check server is running:**
   ```bash
   curl http://localhost:3001/api/health
   ```

2. **CORS error:**
   - Server must allow requests from client origin
   - Check CORS configuration in server/index.js

3. **Wrong API URL:**
   - Verify `VITE_API_URL` in client/.env
   - For Docker: use `http://server:3001` (internal) or `http://localhost:3001` (external)

### Container can't reach database

**Error:** `getaddrinfo ENOTFOUND postgres`

**Solution:**
- Ensure service name in docker-compose.yml matches `DB_HOST` in .env
- Check both containers are on same network:
  ```bash
  docker network ls
  docker inspect room-service_default
  ```

---

## Performance Issues

### Slow page load

**Solutions:**
1. Enable gzip compression in nginx
2. Optimize images if any are used
3. Use production build: `npm run build`

### Database queries slow

**Solutions:**
1. Add indexes:
   ```sql
   CREATE INDEX idx_orders_status ON orders(status);
   CREATE INDEX idx_orders_created ON orders(created_at);
   ```

2. Check connection pool settings

### Memory issues

**Error:** `JavaScript heap out of memory`

**Solution:**
```bash
# Increase Node.js memory limit
NODE_OPTIONS="--max-old-space-size=4096" npm start
```

---

## Common Error Messages

### "Cannot find module"

**Solution:**
```bash
# Reinstall dependencies
cd server && npm install
cd ../client && npm install

# Or rebuild containers
docker-compose down
docker-compose up --build
```

### "EACCES: permission denied"

**Solution:**
```bash
# Fix permissions on project directory
sudo chown -R $USER:$USER .

# For Docker volumes
docker-compose down -v
docker-compose up -d
```

### "Connection reset by peer"

**Cause:** Client closed connection before server responded

**Solutions:**
- Check server isn't hanging on database query
- Increase timeout settings
- Check for infinite loops in code

---

## Getting Help

If you can't resolve an issue:

1. **Check logs:**
   ```bash
   docker-compose logs -f > logs.txt
   ```

2. **Enable debug mode:**
   ```bash
   # Server
   DEBUG=* npm run dev
   
   # Client
   VITE_DEBUG=true npm run dev
   ```

3. **Collect information:**
   - Docker version: `docker --version`
   - Docker Compose version: `docker-compose --version`
   - OS and version
   - Browser and version
   - Relevant log excerpts

4. **Report issue:**
   Include the above information and steps to reproduce
