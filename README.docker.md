# Docker Compose Setup

This guide explains how to run BizRay using Docker Compose for local development and testing.

## Prerequisites

- Docker Engine 20.10+
- Docker Compose V2

## Quick Start

1. **Copy the environment template:**
   ```bash
   cp .env.example .env
   ```

2. **Edit `.env` and fill in required secrets:**
   - `JWT_SECRET` - Generate using: `openssl rand -hex 32`
   - `API_KEY` - Your Austrian Court Register API key
   - `WSDL_URL` - Your WSDL endpoint URL
   - `REDIS_PASSWORD` - A secure password for Redis
   - `POSTGRES_PASSWORD` - A secure password for PostgreSQL

3. **Start all services:**
   ```bash
   docker compose up -d
   ```

4. **View logs:**
   ```bash
   docker compose logs -f
   ```

5. **Access the application:**
   - Frontend: http://localhost (port 80)
   - Backend API: http://localhost:3000
   - Backend API Docs: http://localhost:3000/docs

## Services

The Docker Compose setup includes:

- **postgres** - PostgreSQL 16 database
  - Port: 5432
  - Default credentials: admin/admin (change in .env)
  - Data persisted in `postgres_data` volume

- **redis** - Redis 7 cache
  - Port: 6379
  - Password-protected (set in .env)
  - Data persisted in `redis_data` volume

- **backend** - FastAPI application
  - Port: 3000
  - Built from `./backend/Dockerfile`
  - Waits for postgres and redis to be healthy

- **frontend** - React + Nginx application
  - Port: 80
  - Built from `./frontend/Dockerfile`
  - Serves static files via Nginx

## Database Initialization

On first run, the backend will automatically create database tables using SQLAlchemy migrations. If you need to reset the database:

```bash
docker compose down -v  # Removes volumes (data will be lost!)
docker compose up -d
```

## Configuration

### Port Customization

Change ports in `.env`:

```env
POSTGRES_PORT=5432
REDIS_PORT=6379
BACKEND_PORT=3000
FRONTEND_PORT=80
```

### Database Pool Settings

Adjust connection pool size for performance:

```env
BIZRAY_DB_POOL_SIZE=20
BIZRAY_DB_MAX_OVERFLOW=40
```

### JWT Token Expiration

Default is 7 days (168 hours):

```env
JWT_EXPIRATION_HOURS=168
```

## Useful Commands

### Stop all services
```bash
docker compose down
```

### Rebuild after code changes
```bash
docker compose up -d --build
```

### View service status
```bash
docker compose ps
```

### Execute commands in backend container
```bash
docker compose exec backend bash
```

### View backend logs
```bash
docker compose logs -f backend
```

### Access PostgreSQL
```bash
docker compose exec postgres psql -U admin -d bizray
```

### Access Redis CLI
```bash
docker compose exec redis redis-cli -a <your_redis_password>
```

## Development Workflow

For active development, you may prefer running services individually:

```bash
# Start only postgres and redis
docker compose up -d postgres redis

# Run backend locally
cd backend
uvicorn main:app --host 0.0.0.0 --port 3000 --reload

# Run frontend locally
cd frontend
npm run dev
```

This allows hot-reloading while using containerized databases.

## Troubleshooting

### Backend fails to start

Check if postgres is ready:
```bash
docker compose logs postgres
```

### Frontend can't reach backend

Ensure backend is healthy:
```bash
docker compose ps backend
curl http://localhost:3000/health
```

### Port already in use

Change ports in `.env` or stop conflicting services:
```bash
lsof -ti:3000 | xargs kill -9  # Free port 3000
```

### Clear all data and restart fresh

```bash
docker compose down -v
docker compose up -d --build
```

## Production Notes

This Docker Compose setup is intended for **development and testing only**. For production:

- Use Kubernetes manifests in `/jegyrendszer-infra/apps/base/bnbdevelopment/`
- Images are published to GCP Artifact Registry
- Use secrets management (not .env files)
- Configure proper CORS restrictions
- Use managed PostgreSQL and Redis services
- Enable SSL/TLS termination
- Set up proper monitoring and logging
