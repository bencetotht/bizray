Key Performance Indicators (KPIs)

  Request Rate & Latency

  # Total request rate (requests/second)
  rate(http_requests_total[5m])

  # Request rate by endpoint
  sum(rate(http_requests_total[5m])) by (handler)

  # P50 latency
  histogram_quantile(0.50, rate(http_request_duration_seconds_bucket[5m]))

  # P95 latency
  histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m]))

  # P99 latency
  histogram_quantile(0.99, rate(http_request_duration_seconds_bucket[5m]))

  # Average response time by endpoint
  rate(http_request_duration_seconds_sum[5m]) / rate(http_request_duration_seconds_count[5m])

  Cache Performance

  # Cache hit ratio (%)
  100 * sum(rate(bizray_cache_hits_total[5m])) /
  (sum(rate(bizray_cache_hits_total[5m])) + sum(rate(bizray_cache_misses_total[5m])))

  # Cache hit ratio by entity type
  100 * sum(rate(bizray_cache_hits_total[5m])) by (entity_type) /
  (sum(rate(bizray_cache_hits_total[5m])) by (entity_type) +
   sum(rate(bizray_cache_misses_total[5m])) by (entity_type))

  # Cache error rate
  rate(bizray_cache_errors_total[5m])

  # Redis connection status (1 = connected, 0 = disconnected)
  bizray_redis_connected

  Error Tracking

  # Overall error rate (%)
  100 * sum(rate(http_requests_total{status=~"5.."}[5m])) /
  sum(rate(http_requests_total[5m]))

  # Error rate by endpoint
  sum(rate(bizray_http_errors_total[5m])) by (endpoint, status_code)

  # 4xx vs 5xx errors
  sum(rate(http_requests_total{status=~"4.."}[5m]))
  sum(rate(http_requests_total{status=~"5.."}[5m]))

  # External API error rate
  rate(bizray_external_api_errors_total[5m])

  # External API error rate by service
  sum(rate(bizray_external_api_errors_total[5m])) by (api_name, operation)

  Business Metrics

  # Company searches per minute
  rate(bizray_company_searches_total[1m]) * 60

  # Search breakdown (filtered vs unfiltered)
  sum(rate(bizray_company_searches_total[5m])) by (has_city_filter)

  # Most popular features (request rate)
  rate(bizray_company_detail_views_total[5m])
  rate(bizray_search_suggestions_total[5m])
  rate(bizray_network_graph_requests_total[5m])
  rate(bizray_pdf_exports_total[5m])

  # Premium feature usage by role
  sum(rate(bizray_network_graph_requests_total[5m])) by (user_role)

  User Authentication & Security

  # User registration rate
  rate(bizray_user_registrations_total[1h])

  # Login success vs failure rate
  rate(bizray_user_logins_total[5m])
  rate(bizray_failed_logins_total[5m])

  # Failed login spike detection (potential attack)
  increase(bizray_failed_logins_total[5m]) > 10

  # Password change frequency
  rate(bizray_password_changes_total[5m])

  # Role upgrade tracking
  sum(rate(bizray_subscription_toggles_total[1h])) by (from_role, to_role)

  Database Performance

  # Active database connections
  bizray_db_connections_active

  # Database query duration P95
  histogram_quantile(0.95, rate(bizray_db_query_duration_seconds_bucket[5m]))

  # Slow queries by operation
  histogram_quantile(0.95, rate(bizray_db_query_duration_seconds_bucket[5m])) by (operation) > 1

  External API Monitoring

  # External API request rate
  rate(bizray_external_api_requests_total[5m])

  # External API latency by service
  histogram_quantile(0.95, rate(bizray_external_api_duration_seconds_bucket[5m])) by (api_name)

  # External API error rate (%)
  100 * sum(rate(bizray_external_api_errors_total[5m])) by (api_name) /
  sum(rate(bizray_external_api_requests_total[5m])) by (api_name)

  Recommended Alert Conditions

  # Alert: Cache hit ratio below 70%
  (sum(rate(bizray_cache_hits_total[5m])) /
  (sum(rate(bizray_cache_hits_total[5m])) + sum(rate(bizray_cache_misses_total[5m])))) < 0.7

  # Alert: Redis disconnected
  bizray_redis_connected == 0

  # Alert: High error rate (>5%)
  (sum(rate(http_requests_total{status=~"5.."}[5m])) / sum(rate(http_requests_total[5m]))) > 0.05

  # Alert: P95 latency > 2 seconds
  histogram_quantile(0.95, rate(http_request_duration_seconds_bucket[5m])) > 2

  # Alert: External API error rate > 10%
  (sum(rate(bizray_external_api_errors_total[5m])) /
  sum(rate(bizray_external_api_requests_total[5m]))) > 0.1

  # Alert: Failed login spike (>20 in 5 min)
  increase(bizray_failed_logins_total[5m]) > 20

  Visit Tracking (Recommendations Feature)

  # Successful visit tracking rate
  rate(bizray_visit_tracking_total[5m])

  # Visit tracking error rate
  rate(bizray_visit_tracking_errors_total[5m])

  # Recommendation requests
  rate(bizray_recommendations_requests_total[5m])

  These queries cover the main monitoring areas. For a Grafana dashboard, I recommend creating:

  1. Overview Dashboard: Request rate, latency percentiles, error rate, active users
  2. Cache Dashboard: Hit ratio, errors, Redis status
  3. Business Metrics Dashboard: Feature usage, user engagement, premium adoption
  4. Performance Dashboard: Database connections, query duration, external API latency
  5. Security Dashboard: Login attempts, failed logins, registration trends