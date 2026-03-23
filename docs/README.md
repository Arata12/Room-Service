# Room Service App Documentation

Welcome to the Room Service App documentation. Choose a guide below:

## Getting Started

- **[Quick Start](../README.md#quick-start-with-docker)** - Get running in 5 minutes
- **[Configuration Guide](CONFIGURATION.md)** - Environment variables and setup
- **[Development Setup](../README.md#development-setup-without-docker)** - Run without Docker

## Using the App

- **[Menu Customization](MENU.md)** - Modify food and drink offerings
- **[API Reference](API.md)** - Integration and endpoints
- **[Troubleshooting](TROUBLESHOOTING.md)** - Common issues and fixes

## Deployment

- **[Production Deployment](DEPLOYMENT.md)** - Go live guide
- **[System Architecture](ARCHITECTURE.md)** - How it works

## Quick Reference

### Environment Variables

```bash
# Required
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLIC_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...

# Optional
DB_PASSWORD=secret
PRINTER_HOST=192.168.1.100
DEFAULT_CURRENCY=USD
```

### Docker Commands

```bash
# Start everything
docker-compose up -d

# View logs
docker-compose logs -f

# Restart
docker-compose restart

# Stop
docker-compose down
```

### URLs

| Service | URL |
|---------|-----|
| Web App | http://localhost |
| API | http://localhost:3001 |
| Database | localhost:5432 |

### File Locations

| Purpose | Path |
|---------|------|
| Menu | `client/src/menu.json` |
| Translations | `client/src/i18n/*.json` |
| Environment | `.env` |
| Docker Config | `docker-compose.yml` |

## Need Help?

- Check the [Troubleshooting Guide](TROUBLESHOOTING.md)
- Review [Configuration](CONFIGURATION.md)
- Open an issue on GitHub
