from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from prometheus_fastapi_instrumentator import Instrumentator
from api import api_router
from admin_api import admin_router
from src.cache import init
from src.metrics import redis_connected


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize Redis cache
    try:
        init()
        redis_connected.set(1)
        print("Redis cache initialized successfully")
    except Exception as e:
        redis_connected.set(0)
        print(f"Warning: Redis cache initialization failed: {e}. Continuing without cache.")
    yield
    # Cleanup on shutdown
    redis_connected.set(0)


app = FastAPI(lifespan=lifespan)

# Configure CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=3600,
)

# Configure Prometheus metrics
instrumentator = Instrumentator(
    should_group_status_codes=True,
    should_instrument_requests_inprogress=True,
    excluded_handlers=["/metrics"],
    inprogress_name="bizray_http_requests_inprogress",
)

# Instrument the app and expose metrics endpoint
instrumentator.instrument(app).expose(app, endpoint="/metrics")

# Include API routers
app.include_router(api_router)
app.include_router(admin_router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=3000)
