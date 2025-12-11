"""Test script to verify metrics endpoint is registered"""
from main import app

print("Registered routes:")
for route in app.routes:
    if hasattr(route, 'path'):
        print(f"  {route.path} - {route.name if hasattr(route, 'name') else 'N/A'}")

# Check specifically for metrics
metrics_route = [r for r in app.routes if hasattr(r, 'path') and '/metrics' in r.path]
if metrics_route:
    print("\n /metrics endpoint is registered!")
else:
    print("\n /metrics endpoint NOT found!")
