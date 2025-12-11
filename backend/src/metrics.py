"""
Prometheus metrics for BizRay application.

This module defines custom business metrics and provides instrumentation
for monitoring application health, performance, and usage patterns.
"""

from prometheus_client import Counter, Histogram, Gauge, Info
from typing import Optional
import time

# Application Info

app_info = Info('bizray_app', 'BizRay application information')
app_info.info({
    'version': '1.0.0',
    'environment': 'production'
})

# Business Metrics - API Usage

# Company search metrics
company_searches_total = Counter(
    'bizray_company_searches_total',
    'Total number of company searches',
    ['has_city_filter']
)

company_detail_views_total = Counter(
    'bizray_company_detail_views_total',
    'Total number of company detail page views'
)

search_suggestions_total = Counter(
    'bizray_search_suggestions_total',
    'Total number of search suggestion requests'
)

# Premium features
network_graph_requests_total = Counter(
    'bizray_network_graph_requests_total',
    'Total number of network graph requests (premium feature)',
    ['user_role']
)

pdf_exports_total = Counter(
    'bizray_pdf_exports_total',
    'Total number of PDF exports'
)

recommendations_requests_total = Counter(
    'bizray_recommendations_requests_total',
    'Total number of recommendations endpoint requests'
)

# Authentication Metrics

user_registrations_total = Counter(
    'bizray_user_registrations_total',
    'Total number of user registrations'
)

user_logins_total = Counter(
    'bizray_user_logins_total',
    'Total number of successful user logins'
)

failed_logins_total = Counter(
    'bizray_failed_logins_total',
    'Total number of failed login attempts'
)

password_changes_total = Counter(
    'bizray_password_changes_total',
    'Total number of password changes'
)

subscription_toggles_total = Counter(
    'bizray_subscription_toggles_total',
    'Total number of subscription toggles',
    ['from_role', 'to_role']
)

# Cache Metrics

cache_hits_total = Counter(
    'bizray_cache_hits_total',
    'Total number of cache hits',
    ['entity_type']
)

cache_misses_total = Counter(
    'bizray_cache_misses_total',
    'Total number of cache misses',
    ['entity_type']
)

cache_errors_total = Counter(
    'bizray_cache_errors_total',
    'Total number of cache operation errors',
    ['operation']
)

redis_connected = Gauge(
    'bizray_redis_connected',
    'Redis connection status (1=connected, 0=disconnected)'
)

# Visit tracking metrics
visit_tracking_total = Counter(
    'bizray_visit_tracking_total',
    'Total number of company visits tracked'
)

visit_tracking_errors_total = Counter(
    'bizray_visit_tracking_errors_total',
    'Total number of visit tracking errors'
)

# Database Metrics

db_connections_active = Gauge(
    'bizray_db_connections_active',
    'Number of active database connections'
)

db_query_duration = Histogram(
    'bizray_db_query_duration_seconds',
    'Database query duration in seconds',
    ['operation']
)

# External API Metrics (Justiz/SOAP)

external_api_requests_total = Counter(
    'bizray_external_api_requests_total',
    'Total number of external API requests',
    ['api_name', 'operation']
)

external_api_errors_total = Counter(
    'bizray_external_api_errors_total',
    'Total number of external API errors',
    ['api_name', 'operation']
)

external_api_duration = Histogram(
    'bizray_external_api_duration_seconds',
    'External API request duration in seconds',
    ['api_name', 'operation']
)

# Admin Operations Metrics

admin_user_operations_total = Counter(
    'bizray_admin_user_operations_total',
    'Total number of admin user operations',
    ['operation']  # 'list', 'get', 'update', 'delete'
)

# Error Metrics

http_errors_total = Counter(
    'bizray_http_errors_total',
    'Total number of HTTP errors',
    ['status_code', 'endpoint']
)

# Helper Functions

def track_cache_operation(hit: bool, entity_type: str = "api") -> None:
    """
    Track cache hit or miss.

    Args:
        hit: True if cache hit, False if cache miss
        entity_type: Type of entity ('api', 'db', 'network', 'risk')
    """
    if hit:
        cache_hits_total.labels(entity_type=entity_type).inc()
    else:
        cache_misses_total.labels(entity_type=entity_type).inc()


def track_cache_error(operation: str) -> None:
    """
    Track cache operation error.

    Args:
        operation: Operation type ('get', 'set', 'delete')
    """
    cache_errors_total.labels(operation=operation).inc()


def track_external_api_call(api_name: str, operation: str, duration: Optional[float] = None, error: bool = False) -> None:
    """
    Track external API call metrics.

    Args:
        api_name: Name of the external API (e.g., 'justiz')
        operation: Operation name (e.g., 'SUCHEURKUNDE', 'URKUNDE')
        duration: Duration of the call in seconds
        error: Whether the call resulted in an error
    """
    external_api_requests_total.labels(api_name=api_name, operation=operation).inc()

    if error:
        external_api_errors_total.labels(api_name=api_name, operation=operation).inc()

    if duration is not None:
        external_api_duration.labels(api_name=api_name, operation=operation).observe(duration)


class DatabaseQueryTimer:
    """Context manager for timing database queries."""

    def __init__(self, operation: str):
        self.operation = operation
        self.start_time = None

    def __enter__(self):
        self.start_time = time.time()
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        duration = time.time() - self.start_time
        db_query_duration.labels(operation=self.operation).observe(duration)
