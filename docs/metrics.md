# BizRay Metrics Documentation

This document provides comprehensive documentation for all Prometheus metrics exported by the BizRay application.

## Architecture

The metrics system consists of two layers:

1. **Automatic HTTP Metrics** - Provided by `prometheus-fastapi-instrumentator`
   - Request counts, latency, status codes
   - Automatically tracks all HTTP endpoints

2. **Custom Business Metrics** - Defined in `src/metrics.py`
   - Application-specific metrics
   - Business logic tracking
   - Resource utilization

## Automatic HTTP Metrics

These metrics are automatically collected for all HTTP endpoints:

### `http_requests_total`
**Type**: Counter
**Labels**: `method`, `handler`, `status`
**Description**: Total number of HTTP requests received

**Example**:
```
http_requests_total{method="GET",handler="/api/v1/company",status="2xx"} 1523
```

**Queries**:
```promql
# Request rate by endpoint
rate(http_requests_total[5m])

# Error rate percentage
sum(rate(http_requests_total{status=~"4xx|5xx"}[5m])) / sum(rate(http_requests_total[5m])) * 100
```

---

### `http_request_duration_seconds`
**Type**: Histogram
**Labels**: `method`, `handler`
**Buckets**: Default histogram buckets
**Description**: HTTP request latency in seconds

**Example**:
```
http_request_duration_seconds_bucket{method="GET",handler="/api/v1/company",le="0.5"} 1450
```

**Queries**:
```promql
# p95 latency by endpoint
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))

# p99 latency
histogram_quantile(0.99, rate(http_request_duration_seconds_bucket[5m]))

# Average latency
rate(http_request_duration_seconds_sum[5m]) / rate(http_request_duration_seconds_count[5m])
```

---

### `bizray_http_requests_inprogress`
**Type**: Gauge
**Labels**: `method`, `handler`
**Description**: Number of HTTP requests currently being processed

**Example**:
```
bizray_http_requests_inprogress{method="GET",handler="/api/v1/company"} 3
```

**Queries**:
```promql
# Current in-flight requests
sum(bizray_http_requests_inprogress)

# In-flight requests by endpoint
bizray_http_requests_inprogress by (handler)
```

---

## Application Metrics

### `bizray_app_info`
**Type**: Info
**Labels**: `version`, `environment`
**Description**: Application metadata and version information

**Example**:
```
bizray_app_info{version="1.0.0",environment="production"} 1
```

---

## API Usage Metrics

### `bizray_company_searches_total`
**Type**: Counter
**Labels**: `has_city_filter`
**Description**: Total number of company search requests

**Example**:
```
bizray_company_searches_total{has_city_filter="True"} 523
bizray_company_searches_total{has_city_filter="False"} 1847
```

**Queries**:
```promql
# Search rate
rate(bizray_company_searches_total[5m])

# Percentage of filtered searches
sum(rate(bizray_company_searches_total{has_city_filter="True"}[5m])) / sum(rate(bizray_company_searches_total[5m])) * 100
```

---

### `bizray_company_detail_views_total`
**Type**: Counter
**Description**: Total number of company detail page views (tracking individual company access)

**Example**:
```
bizray_company_detail_views_total 4521
```

**Queries**:
```promql
# Views per minute
rate(bizray_company_detail_views_total[1m]) * 60

# Total views last hour
increase(bizray_company_detail_views_total[1h])
```

---

### `bizray_search_suggestions_total`
**Type**: Counter
**Description**: Total number of search suggestion/autocomplete requests

**Example**:
```
bizray_search_suggestions_total 2341
```

**Queries**:
```promql
# Suggestion requests per second
rate(bizray_search_suggestions_total[5m])
```

---

### `bizray_network_graph_requests_total`
**Type**: Counter
**Labels**: `user_role`
**Description**: Total number of network graph requests (premium feature)

**Example**:
```
bizray_network_graph_requests_total{user_role="subscriber"} 234
bizray_network_graph_requests_total{user_role="admin"} 45
```

**Queries**:
```promql
# Network graph usage by role
sum(rate(bizray_network_graph_requests_total[1h])) by (user_role)

# Premium feature adoption rate
sum(rate(bizray_network_graph_requests_total{user_role="subscriber"}[1h]))
```

---

### `bizray_pdf_exports_total`
**Type**: Counter
**Description**: Total number of PDF report exports

**Example**:
```
bizray_pdf_exports_total 178
```

**Queries**:
```promql
# PDF exports per hour
rate(bizray_pdf_exports_total[1h]) * 3600
```

---

### `bizray_recommendations_requests_total`
**Type**: Counter
**Description**: Total number of recommendations endpoint requests

**Example**:
```
bizray_recommendations_requests_total 892
```

**Queries**:
```promql
# Recommendation feature usage
rate(bizray_recommendations_requests_total[5m])
```

---

## Authentication Metrics

### `bizray_user_registrations_total`
**Type**: Counter
**Description**: Total number of new user registrations

**Example**:
```
bizray_user_registrations_total 156
```

**Queries**:
```promql
# New users per day
increase(bizray_user_registrations_total[24h])

# Registration rate
rate(bizray_user_registrations_total[1h])
```

---

### `bizray_user_logins_total`
**Type**: Counter
**Description**: Total number of successful user login attempts

**Example**:
```
bizray_user_logins_total 3421
```

**Queries**:
```promql
# Logins per hour
rate(bizray_user_logins_total[1h]) * 3600
```

---

### `bizray_failed_logins_total`
**Type**: Counter
**Description**: Total number of failed login attempts

**Example**:
```
bizray_failed_logins_total 89
```

**Queries**:
```promql
# Failed login rate (potential security concern)
rate(bizray_failed_logins_total[5m])

# Failed login percentage
sum(rate(bizray_failed_logins_total[5m])) / (sum(rate(bizray_user_logins_total[5m])) + sum(rate(bizray_failed_logins_total[5m]))) * 100
```

**Alerts**:
```yaml
- alert: HighFailedLoginRate
  expr: rate(bizray_failed_logins_total[5m]) > 5
  annotations:
    summary: "High failed login rate detected (potential attack)"
```

---

### `bizray_password_changes_total`
**Type**: Counter
**Description**: Total number of password change operations

**Example**:
```
bizray_password_changes_total 23
```

---

### `bizray_subscription_toggles_total`
**Type**: Counter
**Labels**: `from_role`, `to_role`
**Description**: Total number of subscription role changes

**Example**:
```
bizray_subscription_toggles_total{from_role="registered",to_role="subscriber"} 34
bizray_subscription_toggles_total{from_role="subscriber",to_role="registered"} 5
```

**Queries**:
```promql
# Upgrade rate (registered -> subscriber)
rate(bizray_subscription_toggles_total{from_role="registered",to_role="subscriber"}[1h])

# Downgrade rate
rate(bizray_subscription_toggles_total{from_role="subscriber",to_role="registered"}[1h])

# Net subscription growth
sum(rate(bizray_subscription_toggles_total{to_role="subscriber"}[1h])) - sum(rate(bizray_subscription_toggles_total{from_role="subscriber"}[1h]))
```

---

## Cache Performance Metrics

### `bizray_cache_hits_total`
**Type**: Counter
**Labels**: `entity_type`
**Description**: Total number of cache hits

**Entity Types**: `api`, `db`, `network`, `risk`

**Example**:
```
bizray_cache_hits_total{entity_type="api"} 15234
bizray_cache_hits_total{entity_type="db"} 8921
```

**Queries**:
```promql
# Cache hit rate by type
sum(rate(bizray_cache_hits_total[5m])) by (entity_type) /
(sum(rate(bizray_cache_hits_total[5m])) by (entity_type) + sum(rate(bizray_cache_misses_total[5m])) by (entity_type))

# Overall cache hit ratio
sum(rate(bizray_cache_hits_total[5m])) /
(sum(rate(bizray_cache_hits_total[5m])) + sum(rate(bizray_cache_misses_total[5m])))
```

---

### `bizray_cache_misses_total`
**Type**: Counter
**Labels**: `entity_type`
**Description**: Total number of cache misses

**Example**:
```
bizray_cache_misses_total{entity_type="api"} 3421
```

**Queries**:
```promql
# Cache miss rate
rate(bizray_cache_misses_total[5m])
```

---

### `bizray_cache_errors_total`
**Type**: Counter
**Labels**: `operation`
**Description**: Total number of cache operation errors

**Operations**: `get`, `set`, `delete`

**Example**:
```
bizray_cache_errors_total{operation="get"} 12
bizray_cache_errors_total{operation="set"} 5
```

**Queries**:
```promql
# Cache error rate
rate(bizray_cache_errors_total[5m])
```

**Alerts**:
```yaml
- alert: HighCacheErrorRate
  expr: rate(bizray_cache_errors_total[5m]) > 0.1
  annotations:
    summary: "Cache errors detected - check Redis connection"
```

---

### `bizray_redis_connected`
**Type**: Gauge
**Description**: Redis connection status (1=connected, 0=disconnected)

**Example**:
```
bizray_redis_connected 1
```

**Queries**:
```promql
# Redis connection status
bizray_redis_connected
```

**Alerts**:
```yaml
- alert: RedisDisconnected
  expr: bizray_redis_connected == 0
  for: 1m
  annotations:
    summary: "Redis connection lost"
```

---

## Visit Tracking Metrics

### `bizray_visit_tracking_total`
**Type**: Counter
**Description**: Total number of successful company visit tracking events (for recommendations)

**Example**:
```
bizray_visit_tracking_total 4521
```

---

### `bizray_visit_tracking_errors_total`
**Type**: Counter
**Description**: Total number of failed visit tracking attempts

**Example**:
```
bizray_visit_tracking_errors_total 3
```

**Queries**:
```promql
# Visit tracking error rate
rate(bizray_visit_tracking_errors_total[5m]) / rate(bizray_visit_tracking_total[5m])
```

---

## Database Metrics

### `bizray_db_connections_active`
**Type**: Gauge
**Description**: Number of active database connections from the connection pool

**Example**:
```
bizray_db_connections_active 8
```

**Queries**:
```promql
# Current active connections
bizray_db_connections_active

# Connection pool utilization (assuming pool_size=20)
bizray_db_connections_active / 20 * 100
```

**Alerts**:
```yaml
- alert: DatabaseConnectionPoolExhausted
  expr: bizray_db_connections_active > 18
  for: 2m
  annotations:
    summary: "Database connection pool near capacity"
```

---

### `bizray_db_query_duration_seconds`
**Type**: Histogram
**Labels**: `operation`
**Description**: Database query duration in seconds

**Example**:
```
bizray_db_query_duration_seconds_bucket{operation="get_company",le="0.1"} 1234
```

**Queries**:
```promql
# p95 query latency by operation
histogram_quantile(0.95, rate(bizray_db_query_duration_seconds_bucket[5m]))

# Slow queries (>1 second)
sum(rate(bizray_db_query_duration_seconds_bucket{le="1.0"}[5m])) by (operation)
```

---

## External API Metrics

### `bizray_external_api_requests_total`
**Type**: Counter
**Labels**: `api_name`, `operation`
**Description**: Total number of external API requests (e.g., Austrian Justiz SOAP API)

**Example**:
```
bizray_external_api_requests_total{api_name="justiz",operation="SUCHEURKUNDE"} 234
bizray_external_api_requests_total{api_name="justiz",operation="URKUNDE"} 187
```

**Queries**:
```promql
# External API request rate
rate(bizray_external_api_requests_total[5m])
```

---

### `bizray_external_api_errors_total`
**Type**: Counter
**Labels**: `api_name`, `operation`
**Description**: Total number of external API errors

**Example**:
```
bizray_external_api_errors_total{api_name="justiz",operation="SUCHEURKUNDE"} 5
```

**Queries**:
```promql
# External API error rate
sum(rate(bizray_external_api_errors_total[5m])) by (api_name, operation)

# Error percentage
sum(rate(bizray_external_api_errors_total[5m])) / sum(rate(bizray_external_api_requests_total[5m])) * 100
```

**Alerts**:
```yaml
- alert: HighExternalAPIErrorRate
  expr: sum(rate(bizray_external_api_errors_total[5m])) / sum(rate(bizray_external_api_requests_total[5m])) > 0.1
  annotations:
    summary: "External API error rate above 10%"
```

---

### `bizray_external_api_duration_seconds`
**Type**: Histogram
**Labels**: `api_name`, `operation`
**Description**: External API request duration in seconds

**Example**:
```
bizray_external_api_duration_seconds_bucket{api_name="justiz",operation="URKUNDE",le="2.0"} 156
```

**Queries**:
```promql
# p95 external API latency
histogram_quantile(0.95, rate(bizray_external_api_duration_seconds_bucket[5m]))
```

---

## Admin Operations Metrics

### `bizray_admin_user_operations_total`
**Type**: Counter
**Labels**: `operation`
**Description**: Total number of admin user management operations

**Operations**: `list`, `get`, `update`, `delete`

**Example**:
```
bizray_admin_user_operations_total{operation="list"} 45
bizray_admin_user_operations_total{operation="update"} 12
bizray_admin_user_operations_total{operation="delete"} 3
```

**Queries**:
```promql
# Admin activity by operation type
sum(rate(bizray_admin_user_operations_total[1h])) by (operation)
```

---

## Error Tracking Metrics

### `bizray_http_errors_total`
**Type**: Counter
**Labels**: `status_code`, `endpoint`
**Description**: Total number of HTTP error responses

**Example**:
```
bizray_http_errors_total{status_code="404",endpoint="/api/v1/company"} 23
bizray_http_errors_total{status_code="500",endpoint="/api/v1/network"} 2
```

**Queries**:
```promql
# 4xx error rate
sum(rate(bizray_http_errors_total{status_code=~"4.."}[5m]))

# 5xx error rate
sum(rate(bizray_http_errors_total{status_code=~"5.."}[5m]))

# Error rate by endpoint
sum(rate(bizray_http_errors_total[5m])) by (endpoint, status_code)
```

**Alerts**:
```yaml
- alert: High5xxErrorRate
  expr: sum(rate(bizray_http_errors_total{status_code=~"5.."}[5m])) / sum(rate(http_requests_total[5m])) > 0.05
  annotations:
    summary: "5xx error rate above 5%"
```

---

## Grafana Dashboard Configuration

### Recommended Panels

#### 1. Request Rate & Latency
```promql
# Request Rate
sum(rate(http_requests_total[5m])) by (handler)

# P95 Latency
histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))

# P99 Latency
histogram_quantile(0.99, rate(http_request_duration_seconds_bucket[5m]))
```

#### 2. Cache Performance
```promql
# Cache Hit Ratio
sum(rate(bizray_cache_hits_total[5m])) /
(sum(rate(bizray_cache_hits_total[5m])) + sum(rate(bizray_cache_misses_total[5m])))

# Cache Hit Ratio by Type
sum(rate(bizray_cache_hits_total[5m])) by (entity_type) /
(sum(rate(bizray_cache_hits_total[5m])) by (entity_type) +
 sum(rate(bizray_cache_misses_total[5m])) by (entity_type))
```

#### 3. Error Rates
```promql
# Overall Error Rate
sum(rate(http_requests_total{status=~"4xx|5xx"}[5m])) / sum(rate(http_requests_total[5m])) * 100

# Errors by Status Code
sum(rate(http_requests_total[5m])) by (status)
```

#### 4. User Engagement
```promql
# Daily New Users
increase(bizray_user_registrations_total[24h])

# Active Users (logins per hour)
rate(bizray_user_logins_total[1h]) * 3600

# Failed Login Rate
rate(bizray_failed_logins_total[5m])
```

#### 5. Business Metrics
```promql
# Feature Usage
sum(rate(bizray_company_searches_total[5m]))
sum(rate(bizray_pdf_exports_total[5m]))
sum(rate(bizray_network_graph_requests_total[5m])) by (user_role)

# Premium Feature Adoption
sum(bizray_network_graph_requests_total{user_role="subscriber"}) /
sum(bizray_user_logins_total) * 100
```

#### 6. Infrastructure Health
```promql
# Redis Status
bizray_redis_connected

# Database Connections
bizray_db_connections_active

# In-Flight Requests
sum(bizray_http_requests_inprogress)
```

---

<!-- ## Alert Rules

### Critical Alerts

```yaml
groups:
  - name: bizray_critical
    interval: 30s
    rules:
      - alert: RedisDown
        expr: bizray_redis_connected == 0
        for: 1m
        labels:
          severity: critical
        annotations:
          summary: "Redis connection lost"
          description: "Application cannot connect to Redis cache"

      - alert: HighErrorRate
        expr: sum(rate(http_requests_total{status=~"5.."}[5m])) / sum(rate(http_requests_total[5m])) > 0.05
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: "5xx error rate above 5%"

      - alert: DatabaseConnectionsExhausted
        expr: bizray_db_connections_active > 18
        for: 2m
        labels:
          severity: critical
        annotations:
          summary: "Database connection pool nearly exhausted"
```

### Warning Alerts

```yaml
  - name: bizray_warnings
    interval: 1m
    rules:
      - alert: LowCacheHitRatio
        expr: sum(rate(bizray_cache_hits_total[5m])) / (sum(rate(bizray_cache_hits_total[5m])) + sum(rate(bizray_cache_misses_total[5m]))) < 0.7
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "Cache hit ratio below 70%"

      - alert: HighLatency
        expr: histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 2
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "P95 latency above 2 seconds"

      - alert: HighFailedLoginRate
        expr: rate(bizray_failed_logins_total[5m]) > 5
        for: 2m
        labels:
          severity: warning
        annotations:
          summary: "High failed login rate - potential brute force attack"

      - alert: ExternalAPIErrors
        expr: sum(rate(bizray_external_api_errors_total[5m])) / sum(rate(bizray_external_api_requests_total[5m])) > 0.1
        for: 5m
        labels:
          severity: warning
        annotations:
          summary: "External API error rate above 10%"
```

--- -->
