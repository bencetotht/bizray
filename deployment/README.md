# BizRay Deployment Guide

This document outlines the available deployment methods for the BizRay platform, an Austrian company registry search and risk analysis application.

## Table of Contents

- [External Dependencies](#external-dependencies)
- [Deployment Methods](#deployment-methods)
  - [Docker Compose](#docker-compose)
  - [Kubernetes with Helm](#kubernetes-with-helm)
- [Prerequisites](#prerequisites)
- [Configuration](#configuration)

## External Dependencies

BizRay requires the following external services to function properly:

### PostgreSQL Database
- **Version**: 16 or higher
- **Purpose**: Primary relational database for storing company data, user accounts, and risk indicators
- **Required Schema**: Automatically created by SQLAlchemy on first run
- **Connection Pool**: Configurable (default: 20 base connections, 40 max overflow)

### Redis Cache
- **Version**: 7 or higher
- **Purpose**: Caching layer for API responses, database queries, and risk calculations
- **Authentication**: Password-protected (required)
- **Persistence**: Recommended for production environments

### External API Access
- **Austrian Court Register (Justiz) SOAP API**: Required for fetching company registry data and balance sheets
- **Credentials**: API key and WSDL URL must be configured

## Deployment Methods

### Docker Compose

Docker Compose provides a simple all-in-one deployment solution that includes all services (application and dependencies) in a single orchestrated environment.

#### Quick Start

1. Navigate to the deployment directory:
   ```bash
   cd /path/to/bizray/deployment
   ```

2. Create a `.env` file in the deployment directory with required secrets (you can copy from `.env.example`):
   ```bash
   cp .env.example .env
   # Then edit .env with your actual values
   ```

   Required configuration:
   ```bash
   # Database Configuration
   POSTGRES_DB=bizray
   POSTGRES_USER=admin
   POSTGRES_PASSWORD=your_secure_password
   POSTGRES_PORT=5432

   # Redis Configuration
   REDIS_PASSWORD=your_redis_password
   REDIS_PORT=6379

   # Application Configuration
   JWT_SECRET=your_jwt_secret_key
   API_KEY=your_austrian_court_api_key
   WSDL_URL=https://your_wsdl_endpoint

   # Optional Configuration
   NODE_ENV=production
   JWT_EXPIRATION_HOURS=168
   BIZRAY_DB_POOL_SIZE=20
   BIZRAY_DB_MAX_OVERFLOW=40
   FRONTEND_PORT=80
   BACKEND_PORT=3000
   ```

3. Start all services:
   ```bash
   docker-compose up -d
   ```

4. Verify deployment:
   ```bash
   docker-compose ps
   ```

> [!NOTE]
> You may use the `compose.gcp.yml` file, which references cloud images published by the CD pipeline. Be aware that these images may be archived in the future; if that happens, revert to using the default self-built compose file.

#### Services Included

- **PostgreSQL**: Database service with persistent volume
- **Redis**: Cache service with persistent volume
- **Backend**: FastAPI application on port 3000
- **Frontend**: React application served via Nginx on port 80

#### Management Commands

```bash
# View logs
docker-compose logs -f [service_name]

# Stop services
docker-compose stop

# Restart services
docker-compose restart

# Remove services and volumes
docker-compose down -v
```

#### Production Considerations

- Update default credentials in the `.env` file
- Configure proper backup strategies for PostgreSQL and Redis volumes
- Implement reverse proxy with SSL/TLS termination
- Configure resource limits in docker-compose.yml
- Enable log aggregation and monitoring

### Kubernetes with Helm

Helm chart deployment is recommended for production Kubernetes environments. This method assumes external PostgreSQL and Redis services are already provisioned.

#### Prerequisites

- Kubernetes cluster (version 1.20+)
- Helm 3.x installed
- kubectl configured with cluster access
- External PostgreSQL and Redis instances
- Container registry access (GCP Artifact Registry or equivalent)

#### Quick Start

1. Navigate to the chart directory:
   ```bash
   cd deployment/chart
   ```

2. Review and customize `values.yaml` according to your environment.

3. Create the namespace and required secrets:
   ```bash
   kubectl create namespace bnb

   # Create image pull secret (if using private registry)
   kubectl create secret docker-registry regcred-bnb \
     --docker-server=europe-west3-docker.pkg.dev \
     --docker-username=_json_key \
     --docker-password="$(cat key.json)" \
     -n bnb

   # Create application secrets
   kubectl create secret generic bizray-creds \
     --from-literal=JWT_SECRET='your_jwt_secret' \
     --from-literal=API_KEY='your_api_key' \
     --from-literal=WSDL_URL='your_wsdl_url' \
     --from-literal=REDIS_PASSWORD='your_redis_password' \
     -n bnb
   ```

4. Install the Helm chart:
   ```bash
   helm install bizray . -n bnb
   ```

5. Verify deployment:
   ```bash
   kubectl get pods -n bnb
   helm status bizray -n bnb
   ```

#### Features

- Separate frontend and backend deployments
- Rolling update strategy with zero downtime
- Resource limits and requests pre-configured
- Traefik IngressRoute support for external access
- Prometheus ServiceMonitor for metrics collection
- ConfigMap and Secret management
- Service account with proper RBAC

#### Management Commands

```bash
# Upgrade deployment
helm upgrade bizray . -n bnb

# Rollback to previous version
helm rollback bizray -n bnb

# Uninstall
helm uninstall bizray -n bnb

# View rendered templates
helm template bizray . -n bnb
```

For detailed Helm chart configuration, refer to [chart/README.md](./chart/README.md).

## Prerequisites

### For Docker Compose

- Docker Engine 20.10+
- Docker Compose 2.0+
- Minimum 4GB RAM available
- 10GB free disk space

### For Kubernetes Deployment

- Kubernetes cluster with at least 2 nodes
- 2 CPU cores and 4GB RAM per node (minimum)
- Persistent volume provisioner (for StatefulSets if deploying dependencies)
- Ingress controller (Traefik recommended)
- Prometheus Operator (optional, for monitoring)

## Configuration

### Environment Variables

Both deployment methods require the following configuration:

#### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `JWT_SECRET` | Secret key for JWT token signing | `your-secret-key-here` |
| `API_KEY` | Austrian Court Register API key | `your-api-key` |
| `WSDL_URL` | SOAP WSDL endpoint URL | `https://api.example.com/wsdl` |
| `REDIS_PASSWORD` | Redis authentication password | `secure-redis-password` |
| `DATABASE_URL` | PostgreSQL connection string | `postgresql+psycopg://user:pass@host:5432/db` |

#### Optional Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `NODE_ENV` | `production` | Application environment |
| `JWT_EXPIRATION_HOURS` | `168` | JWT token validity (7 days) |
| `BIZRAY_DB_POOL_SIZE` | `20` | Database connection pool size |
| `BIZRAY_DB_MAX_OVERFLOW` | `40` | Maximum overflow connections |
| `REDIS_HOST` | `localhost` | Redis server hostname |

### Network Ports

| Service | Port | Protocol | Purpose |
|---------|------|----------|---------|
| Frontend | 80 | HTTP | Web interface |
| Backend | 3000 | HTTP | REST API |
| PostgreSQL | 5432 | TCP | Database connection |
| Redis | 6379 | TCP | Cache connection |

## Security Considerations

1. **Secrets Management**: Never commit secrets to version control. Use Kubernetes Secrets, Docker secrets, or external secret managers.

2. **Database Access**: Restrict PostgreSQL access to application pods only. Use strong passwords and consider SSL/TLS connections.

3. **Redis Security**: Always enable password authentication. Consider using Redis ACLs for fine-grained access control.

4. **API Endpoints**: Implement rate limiting and authentication for public-facing endpoints.

5. **Container Security**: Run containers as non-root users. The provided Dockerfiles already implement this.

6. **Network Policies**: In Kubernetes, implement NetworkPolicies to restrict inter-pod communication.

## Monitoring and Observability

### Metrics

The backend exposes Prometheus metrics at `/metrics` endpoint:
- HTTP request metrics (latency, count, status codes)
- Cache hit/miss ratios
- Database connection pool utilization
- External API call performance
- Business metrics (searches, registrations, exports)

### Health Checks

Both applications expose health check endpoints:
- Backend: `/health`
- Frontend: Root path `/`

### Logging

Application logs are sent to stdout/stderr and can be collected using:
- Docker Compose: `docker-compose logs`
- Kubernetes: `kubectl logs` or log aggregation tools (ELK, Loki)