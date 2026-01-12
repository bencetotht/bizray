# BizRay Helm Chart

A Helm chart for deploying the BizRay application stack (frontend and backend) on Kubernetes.

## Overview

This Helm chart deploys a full-stack application consisting of:
- **Frontend**: React application served via Nginx
- **Backend**: FastAPI Python application
- **Ingress**: Traefik IngressRoute configuration
- **Monitoring**: Prometheus ServiceMonitor for observability

**Note**: This chart does not include PostgreSQL or Redis. These dependencies must be provisioned externally before deploying the application.

## Prerequisites

- Kubernetes 1.20+
- Helm 3.x
- External PostgreSQL 16+ database
- External Redis 7+ cache
- Container registry access (GCP Artifact Registry credentials)
- Traefik ingress controller (if using IngressRoute)
- Prometheus Operator (if using ServiceMonitor)

## Installation

### Step 1: Create Namespace

```bash
kubectl create namespace bizray
```

### Step 2: Configure Secrets

Create the required Kubernetes secrets before installation:

```bash
# Image pull secret for GCP Artifact Registry
kubectl create secret docker-registry regcred-bizray \
  --docker-server=europe-west3-docker.pkg.dev \
  --docker-username=_json_key \
  --docker-password="$(cat /path/to/key.json)" \
  -n bizray

# Application secrets
kubectl create secret generic bizray-creds \
  --from-literal=JWT_SECRET='your-jwt-secret-key' \
  --from-literal=API_KEY='your-austrian-court-api-key' \
  --from-literal=WSDL_URL='https://your-wsdl-endpoint' \
  --from-literal=REDIS_PASSWORD='your-redis-password' \
  -n bizray
```

### Step 3: Customize Values

Review and modify `values.yaml` to match your environment:

```bash
# Edit values.yaml
vim values.yaml
```

Key values to update:
- Image tags for frontend and backend
- Database connection URL
- Redis host configuration
- Ingress hostnames
- Resource limits and requests

### Step 4: Install Chart

```bash
# From the chart directory
helm install bizray . -n bizray

# Or specify a custom values file
helm install bizray . -n bizray -f custom-values.yaml
```

### Step 5: Verify Deployment

```bash
# Check pod status
kubectl get pods -n bizray

# Check services
kubectl get svc -n bizray

# View Helm release status
helm status bizray -n bizray

# View application logs
kubectl logs -f deployment/bizray-backend -n bizray
kubectl logs -f deployment/bizray-frontend -n bizray
```

## Configuration

### Global Settings

| Parameter | Description | Default |
|-----------|-------------|---------|
| `global.namespace` | Kubernetes namespace for resources | `bizray` |
| `global.imagePullSecrets[0].name` | Image pull secret name | `regcred-bizray` |
| `global.labels.env.skip` | Environment label for resource filtering | `cloud` |

### Service Account

| Parameter | Description | Default |
|-----------|-------------|---------|
| `serviceAccount.create` | Create service account | `true` |
| `serviceAccount.name` | Service account name | `bizray-svc-a` |
| `serviceAccount.labels` | Additional labels for service account | `{"env.skip": "cloud"}` |

### Frontend Configuration

| Parameter | Description | Default |
|-----------|-------------|---------|
| `frontend.enabled` | Enable frontend deployment | `true` |
| `frontend.replicaCount` | Number of frontend replicas | `1` |
| `frontend.image.repository` | Frontend image repository | `europe-west3-docker.pkg.dev/bnbdevelopment/bizray/bizray-frontend` |
| `frontend.image.tag` | Frontend image tag | `1.0.39` |
| `frontend.image.pullPolicy` | Image pull policy | `Always` |
| `frontend.service.name` | Service name | `bizray-frontend-svc` |
| `frontend.service.type` | Service type | `ClusterIP` |
| `frontend.service.port` | Service port | `80` |
| `frontend.service.targetPort` | Container port | `80` |
| `frontend.service.portName` | Port name | `frontend-open` |
| `frontend.resources.limits.cpu` | CPU limit | `1000m` |
| `frontend.resources.limits.memory` | Memory limit | `2Gi` |
| `frontend.resources.requests.cpu` | CPU request | `500m` |
| `frontend.resources.requests.memory` | Memory request | `1Gi` |
| `frontend.env` | Environment variables | See values.yaml |
| `frontend.securityContext.allowPrivilegeEscalation` | Security context | `false` |
| `frontend.strategy.type` | Update strategy | `RollingUpdate` |

### Backend Configuration

| Parameter | Description | Default |
|-----------|-------------|---------|
| `backend.enabled` | Enable backend deployment | `true` |
| `backend.replicaCount` | Number of backend replicas | `1` |
| `backend.image.repository` | Backend image repository | `europe-west3-docker.pkg.dev/bnbdevelopment/bizray/bizray-backend` |
| `backend.image.tag` | Backend image tag | `1.0.46` |
| `backend.image.pullPolicy` | Image pull policy | `Always` |
| `backend.service.name` | Service name | `bizray-backend-svc` |
| `backend.service.type` | Service type | `ClusterIP` |
| `backend.service.port` | Service port | `3000` |
| `backend.service.targetPort` | Container port | `3000` |
| `backend.service.portName` | Port name | `backend-open` |
| `backend.resources.limits.cpu` | CPU limit | `1000m` |
| `backend.resources.limits.memory` | Memory limit | `2Gi` |
| `backend.resources.requests.cpu` | CPU request | `500m` |
| `backend.resources.requests.memory` | Memory request | `1Gi` |
| `backend.env` | Environment variables | See values.yaml |
| `backend.secrets` | Secret references | See values.yaml |
| `backend.securityContext.allowPrivilegeEscalation` | Security context | `false` |
| `backend.strategy.type` | Update strategy | `RollingUpdate` |

#### Backend Environment Variables

The backend requires the following environment variables:

```yaml
backend:
  env:
    - name: NODE_ENV
      value: "production"
    - name: DATABASE_URL
      value: "postgresql+psycopg://admin:admin@192.168.88.46:5432/bizray"
    - name: REDIS_HOST
      value: "192.168.88.46"

  secrets:
    - name: JWT_SECRET
      secretName: bizray-creds
      key: JWT_SECRET
    - name: API_KEY
      secretName: bizray-creds
      key: API_KEY
    - name: WSDL_URL
      secretName: bizray-creds
      key: WSDL_URL
    - name: REDIS_PASSWORD
      secretName: bizray-creds
      key: REDIS_PASSWORD
```

### Ingress Configuration (Traefik)

| Parameter | Description | Default |
|-----------|-------------|---------|
| `ingressRoute.enabled` | Enable Traefik IngressRoute | `true` |
| `ingressRoute.name` | IngressRoute name | `bizray-ingressroute` |
| `ingressRoute.annotations` | Annotations | `{"kubernetes.io/ingress.class": "traefik-external"}` |
| `ingressRoute.entryPoints` | Entry points | `["web", "websecure"]` |
| `ingressRoute.routes` | Route configurations | See values.yaml |

### Service Monitor Configuration (Prometheus)

| Parameter | Description | Default |
|-----------|-------------|---------|
| `serviceMonitor.enabled` | Enable Prometheus ServiceMonitor | `true` |
| `serviceMonitor.name` | ServiceMonitor name | `bizray-backend` |
| `serviceMonitor.namespace` | Target namespace for ServiceMonitor | `monitoring` |
| `serviceMonitor.labels` | Labels for service discovery | See values.yaml |
| `serviceMonitor.selector` | Pod selector | `{"matchLabels": {"app": "bizray-backend"}}` |
| `serviceMonitor.namespaceSelector` | Namespace selector | `{"matchNames": ["bnb"]}` |
| `serviceMonitor.endpoints[0].port` | Metrics port name | `backend-open` |
| `serviceMonitor.endpoints[0].path` | Metrics path | `/metrics` |
| `serviceMonitor.endpoints[0].interval` | Scrape interval | `30s` |

## Upgrading

### Update Application Version

To upgrade the application to a new version:

```bash
# Update image tags in values.yaml or use --set
helm upgrade bizray . -n bnb \
  --set frontend.image.tag=1.0.40 \
  --set backend.image.tag=1.0.47
```

### Update Configuration

To update configuration values:

```bash
# Edit values.yaml, then upgrade
helm upgrade bizray . -n bnb -f values.yaml
```

### View Upgrade History

```bash
helm history bizray -n bnb
```

### Rollback

To rollback to a previous version:

```bash
# Rollback to previous revision
helm rollback bizray -n bnb

# Rollback to specific revision
helm rollback bizray 2 -n bnb
```

## Uninstallation

To remove the BizRay deployment:

```bash
# Uninstall the Helm release
helm uninstall bizray -n bnb

# Optionally, delete the namespace
kubectl delete namespace bnb
```

**Note**: This will not delete the secrets or persistent data in external PostgreSQL and Redis instances.


## Advanced Configuration

### Pod Anti-Affinity

To distribute pods across nodes for high availability:

```yaml
backend:
  affinity:
    podAntiAffinity:
      preferredDuringSchedulingIgnoredDuringExecution:
        - weight: 100
          podAffinityTerm:
            labelSelector:
              matchExpressions:
                - key: app
                  operator: In
                  values:
                    - bizray-backend
            topologyKey: kubernetes.io/hostname
```

### Node Selector

To schedule pods on specific nodes:

```yaml
backend:
  nodeSelector:
    workload-type: api

frontend:
  nodeSelector:
    workload-type: web
```

### Tolerations

To allow pods on tainted nodes:

```yaml
backend:
  tolerations:
    - key: "dedicated"
      operator: "Equal"
      value: "backend"
      effect: "NoSchedule"
```

## Chart Information

- **Chart Version**: 1.0.0
- **App Version**: 1.0.46
- **Kubernetes Version**: 1.20+
- **Helm Version**: 3.x
