"""
Example usage:
# Initialize connection
init()

# Cache an API request
set("company_123", {"name": "Example Corp"}, entity_type="api", ttl=3600)

# Cache a DB query result
set("search_companies_query", [{"id": 1, "name": "Test"}], entity_type="db")

# Cache a risk score (JSON)
risk_data = {"risk_score": 0.75, "indicators": {...}}
set("company_123_risk", risk_data, entity_type="risk", ttl=7200)

# Retrieve from cache
api_result = get("company_123", entity_type="api")
risk_result = get("company_123_risk", entity_type="risk")
"""

import json
import os
from typing import Any, Optional
import redis

# Redis connection instance
_redis_client: Optional[redis.Redis] = None

# Key prefixes for different entity types
KEY_PREFIX_API = "api:"
KEY_PREFIX_DB = "db:"
KEY_PREFIX_NETWORK = "network:"
KEY_PREFIX_RISK = "risk:"

def init(
    host: Optional[str] = None,
    port: int = 6379,
    db: int = 0,
    password: Optional[str] = None,
    decode_responses: bool = True,
) -> None:
    """
    Initialize Redis connection.
    
    Args:
        host: Redis host (defaults to REDIS_HOST env var or 'localhost')
        port: Redis port (defaults to 6379)
        db: Redis database number (defaults to 0)
        password: Redis password (defaults to REDIS_PASSWORD env var or None)
        decode_responses: Whether to decode responses as strings (defaults to True)
    """
    global _redis_client
    
    if host is None:
        host = os.getenv("REDIS_HOST", "localhost")
    
    if password is None:
        password = os.getenv("REDIS_PASSWORD")
    
    _redis_client = redis.Redis(
        host=host,
        port=port,
        db=db,
        password=password,
        decode_responses=decode_responses,
        socket_connect_timeout=5,
        socket_timeout=5,
    )
    
    try:
        _redis_client.ping()
    except redis.ConnectionError as e:
        raise ConnectionError(f"Failed to connect to Redis: {e}") from e

def get_cache(
    key: str,
    entity_type: str = "api",
) -> Optional[Any]:
    """
    Retrieve a value from the cache.
    
    Args:
        key: The cache key (without prefix)
        entity_type: Type of entity ('api', 'db', 'network', or 'risk')
    
    Returns:
        The cached value if found, None otherwise.
        For 'risk' type, returns parsed JSON.
        For 'api' and 'db' types, returns the stored value as-is.
    """
    if _redis_client is None:
        raise RuntimeError("Redis cache not initialized. Call init() first.")
    
    # Determine the appropriate prefix
    prefix_map = {
        "api": KEY_PREFIX_API,
        "db": KEY_PREFIX_DB,
        "network": KEY_PREFIX_NETWORK,
        "risk": KEY_PREFIX_RISK,
    }
    
    prefix = prefix_map.get(entity_type.lower(), KEY_PREFIX_API)
    full_key = f"{prefix}{key}"
    
    try:
        value = _redis_client.get(full_key)
        if value is None:
            return None
        
        # For risk scores, parse JSON
        if entity_type.lower() == "risk":
            return json.loads(value)
        
        # For API and DB queries, return as-is (or try to parse if it's JSON)
        try:
            return json.loads(value)
        except (json.JSONDecodeError, TypeError):
            return value
    
    except redis.RedisError as e:
        # Log error but don't fail - return None to allow fallback
        print(f"Redis error during get: {e}")
        return None

def set_cache(
    key: str,
    value: Any,
    entity_type: str = "api",
    ttl: Optional[int] = None,
) -> bool:
    """
    Store a key-value pair in Redis cache.
    
    Args:
        key: The cache key (without prefix)
        value: The value to store
        entity_type: Type of entity ('api', 'db', 'network', or 'risk')
        ttl: Time to live in seconds (optional)
    
    Returns:
        True if successful, False otherwise.
    """
    if _redis_client is None:
        raise RuntimeError("Redis cache not initialized. Call init() first.")
    
    # Determine the appropriate prefix
    prefix_map = {
        "api": KEY_PREFIX_API,
        "db": KEY_PREFIX_DB,
        "network": KEY_PREFIX_NETWORK,
        "risk": KEY_PREFIX_RISK,
    }
    
    prefix = prefix_map.get(entity_type.lower(), KEY_PREFIX_API)
    full_key = f"{prefix}{key}"
    
    try:
        # For risk scores and complex objects, serialize to JSON
        if entity_type.lower() in ["risk", "network"] or isinstance(value, (dict, list)):
            serialized_value = json.dumps(value)
        else:
            # For simple types, convert to string
            serialized_value = str(value)
        
        if ttl is not None:
            result = _redis_client.setex(full_key, ttl, serialized_value)
        else:
            result = _redis_client.set(full_key, serialized_value)
        
        return bool(result)

    except (redis.RedisError, TypeError, ValueError) as e:
        print(f"Redis error during set: {e}")
        return False