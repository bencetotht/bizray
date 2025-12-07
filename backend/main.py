from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from api import api_router
from admin_api import admin_router
from src.cache import init


@asynccontextmanager
async def lifespan(app: FastAPI):
    try:
        init()
        print("Redis cache initialized successfully")
    except Exception as e:
        print(f"Warning: Redis cache initialization failed: {e}. Continuing without cache.")
    yield
    pass


app = FastAPI(lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
    expose_headers=["*"],
    max_age=3600,
)

app.include_router(api_router)
app.include_router(admin_router)

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=3000)
