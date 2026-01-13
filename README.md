# BizRay

**Austrian Company Registry Search and Risk Analysis Platform**

BizRay is a full-stack web application designed to provide comprehensive search capabilities and financial risk assessment for companies registered in the Austrian court registry (Firmenbuch). The platform integrates with the Austrian Justiz SOAP API to retrieve company data, balance sheets, and registry documents, then applies quantitative risk analysis algorithms to provide actionable business intelligence.

## Overview

BizRay enables users to:

- Search and discover Austrian companies by name, location, and registry number
- View detailed company profiles including legal structure, registered addresses, and partners
- Analyze financial risk indicators derived from balance sheet data
- Visualize corporate network relationships through interactive graphs
- Export company reports and risk assessments
- Track search history and receive personalized recommendations

The platform implements role-based access control with three user tiers (registered, subscriber, admin) and includes comprehensive monitoring via Prometheus metrics integration for production observability.

## Key Features

### Core Functionality
- **Company Search Engine**: Full-text search with filtering by city, pagination, and autocomplete suggestions
- **Risk Assessment**: Automated calculation of debt-to-equity ratios, concentration risk, balance sheet volatility, and fiscal irregularities
- **Network Graph Visualization**: Interactive ReactFlow-based visualization of corporate relationships and partner networks
- **Document Retrieval**: Integration with Austrian court registry for official company documents and balance sheets
- **PDF Export**: Generate downloadable company risk reports
- **User Authentication**: JWT-based authentication with bcrypt password hashing

### Technical Features
- **Multi-layer Caching**: Redis-backed caching with entity-specific TTLs (1-24 hours) and graceful degradation
- **Connection Pooling**: Optimized PostgreSQL connection management (20 base + 40 overflow)
- **Prometheus Metrics**: Comprehensive instrumentation for HTTP requests, cache performance, database queries, and business KPIs
- **Role-Based Authorization**: Fine-grained access control with admin-only endpoints and premium feature gating
- **API Rate Limiting**: Protection against abuse for public-facing endpoints
- **CI/CD Pipeline**: Automated testing, linting, and Docker image publishing to GCP Artifact Registry

## Technology Stack

### Backend
- **Framework**: Python 3.13, FastAPI
- **Database**: PostgreSQL 16+ with SQLAlchemy ORM
- **Cache**: Redis 7+ with typed key prefixes
- **External Integration**: Zeep SOAP client for Austrian Justiz API
- **Authentication**: JWT tokens (HS256) with 7-day expiration
- **Monitoring**: prometheus-fastapi-instrumentator

### Frontend
- **Framework**: React 19.2 with Vite 7.1
- **UI Library**: Material-UI 7.3, TailwindCSS 4.1
- **Visualization**: ReactFlow (network graphs), Chart.js (risk charts)
- **Routing**: React Router v6

### Infrastructure
- **Containerization**: Docker multi-stage builds with non-root users
- **Orchestration**: Kubernetes with Helm charts, Docker Compose for local development
- **CI/CD**: GitHub Actions with automated testing and GCP deployment
- **Reverse Proxy**: Nginx (frontend), Traefik (Kubernetes ingress)

## Architecture

BizRay follows a traditional three-tier architecture:

1. **Presentation Layer**: React SPA with client-side routing and responsive design
2. **Application Layer**: FastAPI REST API with separated public (`/api/v1/*`) and admin (`/api/v1/admin/*`) routers
3. **Data Layer**: PostgreSQL for persistent storage, Redis for caching, external SOAP API for registry data

The backend implements a controller pattern (`src/controller.py`) to abstract database operations from API endpoints, with comprehensive error handling and cache-first data retrieval strategies.

## Project Structure

```
bizray/
├── backend/              # Python FastAPI application
│   ├── src/             # Source code
│   │   ├── api/         # SOAP client integration
│   │   ├── auth.py      # JWT and password handling
│   │   ├── cache.py     # Redis cache abstraction
│   │   ├── controller.py # Business logic layer
│   │   ├── db.py        # SQLAlchemy models
│   │   ├── indicators.py # Risk calculation engine
│   │   └── metrics.py   # Prometheus metrics
│   ├── tests/           # Pytest test suite
│   └── main.py          # Application entry point
├── frontend/            # React application
│   ├── src/
│   │   ├── components/  # Reusable UI components
│   │   ├── pages/       # Route-level components
│   │   └── utils/       # Helper functions
│   └── public/          # Static assets
├── deployment/          # Deployment configurations
│   ├── chart/          # Helm chart for Kubernetes
│   ├── compose.yml     # Docker Compose setup
│   └── README.md       # Deployment guide
├── docs/               # Documentation
│   ├── apidocs.md      # API endpoint specifications
│   ├── USER_ROLES.md   # Authorization model
│   ├── metrics.md      # Monitoring guide
│   └── indicators.md   # Risk calculation methodology
└── .github/workflows/  # CI/CD pipelines
```

## Getting Started

### Prerequisites

- Docker Engine 20.10+ and Docker Compose 2.0+ (for containerized deployment)
- Python 3.13+ and Node.js 18+ (for local development)
- PostgreSQL 16+ and Redis 7+ (if running services locally)
- Austrian Justiz API credentials (API key and WSDL URL)

### Quick Start with Docker Compose

1. Clone the repository:
   ```bash
   git clone https://github.com/yourusername/bizray.git
   cd bizray
   ```

2. Configure environment variables:
   ```bash
   cd deployment
   cp .env.example .env
   # Edit .env with your credentials
   ```

3. Start all services:
   ```bash
   docker-compose up -d
   ```

4. Access the application:
   - Frontend: http://localhost:80
   - Backend API: http://localhost:3000
   - API Documentation: http://localhost:3000/docs

### Local Development

#### Backend
```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --host 0.0.0.0 --port 3000 --reload
```

#### Frontend
```bash
cd frontend
npm ci
npm run dev
```

Refer to `CLAUDE.md` for detailed development commands, testing procedures, and code patterns.

## Deployment

BizRay supports two production deployment methods:

### Docker Compose
Suitable for single-server deployments or development environments. Includes PostgreSQL and Redis services with persistent volumes.

See [deployment/README.md](./deployment/README.md) for complete setup instructions.

### Kubernetes with Helm
Recommended for production environments with high availability requirements. Assumes external PostgreSQL and Redis instances.

The Helm chart includes:
- Separate frontend and backend deployments with rolling updates
- Traefik IngressRoute for external access
- Prometheus ServiceMonitor for metrics collection
- ConfigMap and Secret management
- Resource limits and autoscaling support

See [deployment/chart/README.md](./deployment/chart/README.md) for Helm chart configuration details.

### CI/CD Pipeline

Automated workflows handle testing, linting, and deployment:
- **Continuous Integration** (`.github/workflows/ci.yml`): Runs on all PRs and pushes
  - Backend: pylint + pytest
  - Frontend: ESLint (max 5 warnings)
  - Custom checks: emoji detection
- **Continuous Deployment** (`.github/workflows/cd-*.yaml`): Builds and pushes Docker images to GCP Artifact Registry
  - Triggered on push to main branch
  - Tags images as `latest` and `1.0.<build_number>`

## Documentation

- **[API Documentation](./docs/apidocs.md)**: Complete REST API reference with request/response examples
- **[User Roles](./docs/USER_ROLES.md)**: Authorization model and role-based access control
- **[Risk Indicators](./docs/indicators.md)**: Methodology for financial risk calculations
- **[Metrics Guide](./docs/metrics.md)**: Prometheus metrics reference and Grafana dashboard setup
- **[Development Guide](./CLAUDE.md)**: Code patterns, architecture details, and contribution guidelines
- **[Deployment Guide](./deployment/README.md)**: Production deployment instructions

## Security Considerations

- JWT tokens use HS256 signing with configurable expiration (default 7 days)
- Passwords are hashed using bcrypt with salt rounds
- Database queries use parameterized statements to prevent SQL injection
- CORS configuration should be restricted for production deployments
- All Docker containers run as non-root users
- Secrets are managed via Kubernetes Secrets or environment variables (never committed to version control)

## Development Guidelines

- Never force-push to the main branch
- All cache operations must gracefully degrade on failure
- Database sessions must be closed in `finally` blocks
- Admin endpoints require explicit `require_role("admin")` decorator
- Premium features (network graphs) require `require_any_role("subscriber", "admin")`
- Update API documentation when adding new endpoints
- Maintain test coverage for business logic in controller layer

## Project Context

This project was developed as a group project for university coursework, demonstrating full-stack development capabilities, external API integration, and production-ready deployment practices.

## License

This project is provided as-is for educational purposes.
