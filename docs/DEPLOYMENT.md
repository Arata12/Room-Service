# Production Deployment Guide

Guide to deploying the Room Service App in production.

## Prerequisites

- Server with Docker and Docker Compose installed
- Domain name (recommended)
- SSL certificate (Let's Encrypt recommended)
- Stripe account with live keys

## Pre-Deployment Checklist

- [ ] Stripe account activated
- [ ] Live API keys generated
- [ ] Webhook endpoint configured
- [ ] Domain name configured
- [ ] SSL certificate ready
- [ ] Printer configured (if using)
- [ ] Database backup strategy planned

## Deployment Options

### Option 1: Docker Compose on VPS (Recommended)

**Best for:** Single server deployments, small to medium hotels

**Requirements:**
- 2GB RAM minimum
- 20GB storage
- Ubuntu 20.04+ or similar

#### Step 1: Provision Server

Create a VPS (DigitalOcean, Linode, AWS, etc.):
- Ubuntu 22.04 LTS
- 2GB RAM / 1 CPU
- 25GB SSD

#### Step 2: Install Docker

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Add user to docker group
sudo usermod -aG docker $USER
newgrp docker
```

#### Step 3: Configure Domain

Point your domain to the server IP:
```
A record: roomservice.yourhotel.com → YOUR_SERVER_IP
```

#### Step 4: Deploy Application

```bash
# Clone repository
git clone <your-repo-url>
cd room-service-app

# Create production .env
cp .env.example .env
nano .env
```

Production `.env`:
```bash
# Server
NODE_ENV=production
PORT=3001

# Database
DB_HOST=postgres
DB_PORT=5432
DB_NAME=roomservice
DB_USER=admin
DB_PASSWORD=<STRONG_RANDOM_PASSWORD>

# Stripe LIVE keys
STRIPE_SECRET_KEY=sk_live_your_live_key
STRIPE_PUBLIC_KEY=pk_live_your_live_key
STRIPE_WEBHOOK_SECRET=whsec_your_webhook_secret
VITE_STRIPE_PUBLIC_KEY=pk_live_your_live_key

# Printer (optional)
PRINTER_HOST=192.168.1.100
PRINTER_PORT=9100

# Currency
DEFAULT_CURRENCY=USD
USD_TO_MXN_RATE=17.50
```

#### Step 5: Start Services

```bash
docker-compose up -d

# Check status
docker-compose ps
docker-compose logs -f
```

#### Step 6: Configure Stripe Webhook

In Stripe Dashboard:
1. Go to Developers → Webhooks
2. Add endpoint: `https://roomservice.yourhotel.com/api/webhook`
3. Select events: `checkout.session.completed`
4. Copy signing secret to `.env`
5. Restart server: `docker-compose restart server`

#### Step 7: SSL with Let's Encrypt

```bash
# Install Certbot
sudo apt install certbot

# Generate certificate
sudo certbot certonly --standalone -d roomservice.yourhotel.com

# Certificates at:
# /etc/letsencrypt/live/roomservice.yourhotel.com/fullchain.pem
# /etc/letsencrypt/live/roomservice.yourhotel.com/privkey.pem
```

#### Step 8: Setup Reverse Proxy (Nginx)

Install Nginx on host:
```bash
sudo apt install nginx
```

Create config:
```bash
sudo nano /etc/nginx/sites-available/room-service
```

```nginx
server {
    listen 80;
    server_name roomservice.yourhotel.com;
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name roomservice.yourhotel.com;

    ssl_certificate /etc/letsencrypt/live/roomservice.yourhotel.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/roomservice.yourhotel.com/privkey.pem;

    # Frontend
    location / {
        proxy_pass http://localhost:80;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    # API
    location /api {
        proxy_pass http://localhost:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

Enable site:
```bash
sudo ln -s /etc/nginx/sites-available/room-service /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

### Option 2: Cloud Deployment

#### AWS ECS/Fargate

Use AWS Elastic Container Service with Fargate for serverless containers.

Benefits:
- Automatic scaling
- No server management
- Integrated with AWS services

#### Google Cloud Run

Deploy containers directly to Cloud Run.

Benefits:
- Pay per use
- Automatic HTTPS
- Global load balancing

#### Railway / Render / Fly.io

Platform-as-a-Service options with Docker support.

Benefits:
- Easy deployment
- Automatic HTTPS
- Managed databases

## Database Backup Strategy

### Automated Backups

Create backup script:
```bash
#!/bin/bash
# backup.sh

BACKUP_DIR="/var/backups/room-service"
DATE=$(date +%Y%m%d_%H%M%S)
DB_NAME="roomservice"
DB_USER="admin"

# Create backup
docker-compose exec -T postgres pg_dump -U $DB_USER $DB_NAME > $BACKUP_DIR/backup_$DATE.sql

# Keep only last 7 days
find $BACKUP_DIR -name "backup_*.sql" -mtime +7 -delete
```

Schedule with cron:
```bash
# Edit crontab
crontab -e

# Add line for daily backup at 2 AM
0 2 * * * /path/to/backup.sh
```

### Restore from Backup

```bash
# Stop services
docker-compose down

# Restore database
docker-compose up -d postgres
sleep 5
docker-compose exec -T postgres psql -U admin roomservice < backup_20240115_020000.sql

# Start all services
docker-compose up -d
```

## Monitoring

### Basic Health Checks

Add to crontab:
```bash
*/5 * * * * curl -f https://roomservice.yourhotel.com/api/health || echo "Health check failed" >> /var/log/room-service-health.log
```

### Log Rotation

Configure logrotate:
```bash
sudo nano /etc/logrotate.d/room-service
```

```
/var/log/room-service/*.log {
    daily
    rotate 7
    compress
    delaycompress
    missingok
    notifempty
    create 0644 root root
}
```

## Security Hardening

### Firewall

```bash
# Allow only necessary ports
sudo ufw default deny incoming
sudo ufw default allow outgoing
sudo ufw allow ssh
sudo ufw allow http
sudo ufw allow https
sudo ufw enable
```

### Docker Security

```bash
# Run containers as non-root (already configured)
# Limit container resources
docker-compose up -d --memory=1g --cpus=1
```

### Database Security

- Use strong password
- Don't expose port 5432 publicly
- Regular security updates

## Updates and Maintenance

### Updating the Application

```bash
# Pull latest changes
git pull

# Rebuild and restart
docker-compose down
docker-compose up --build -d

# Verify
docker-compose ps
```

### Database Migrations

If schema changes:
```bash
# Backup first
./backup.sh

# Run migrations
docker-compose exec server node db/migrate.js
```

## Troubleshooting Production Issues

### Check Logs

```bash
# All services
docker-compose logs -f --tail=100

# Specific service
docker-compose logs -f server
```

### Restart Services

```bash
docker-compose restart server
docker-compose restart client
```

### Check Disk Space

```bash
df -h
docker system df

# Clean up if needed
docker system prune -a
```

### Database Connection Issues

```bash
# Check database is running
docker-compose ps postgres

# Check logs
docker-compose logs postgres

# Restart
docker-compose restart postgres
```

## Rollback Plan

If deployment fails:

```bash
# Stop new version
docker-compose down

# Checkout previous version
git checkout <previous-commit>

# Start previous version
docker-compose up -d

# Restore database if needed
docker-compose exec -T postgres psql -U admin roomservice < backup_before_deploy.sql
```

## SSL Certificate Renewal

Let's Encrypt certificates expire every 90 days. Automate renewal:

```bash
# Test renewal
sudo certbot renew --dry-run

# Add to crontab
0 3 * * * sudo certbot renew --quiet && sudo systemctl reload nginx
```

## Performance Tuning

### Database

```sql
-- Add indexes for common queries
CREATE INDEX CONCURRENTLY idx_orders_created_at ON orders(created_at DESC);
CREATE INDEX CONCURRENTLY idx_orders_status ON orders(status);
```

### Nginx

```nginx
# Add to nginx.conf
gzip on;
gzip_types text/plain text/css application/json application/javascript;

client_body_timeout 12s;
client_header_timeout 12s;
keepalive_timeout 15s;
```

## Cost Estimation

### VPS (DigitalOcean/Linode)

- Droplet: $12-24/month (2-4GB RAM)
- Backups: $2-4/month
- **Total: ~$15-30/month**

### AWS

- EC2 t3.small: ~$15/month
- RDS db.t3.micro: ~$13/month
- Data transfer: ~$5/month
- **Total: ~$35/month**

### Railway/Render

- Pro plan: $5-25/month per service
- **Total: ~$20-50/month**

## Support and Maintenance

### Regular Tasks

- Daily: Check logs for errors
- Weekly: Review order volume
- Monthly: Update dependencies
- Quarterly: Security audit

### Emergency Contacts

- Hosting provider support
- Stripe support
- Domain registrar
