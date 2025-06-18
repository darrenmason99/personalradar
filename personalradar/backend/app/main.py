from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .core.database import Database
from .core.config import settings
from .api.v1 import auth
from .api.v1 import technologies

app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    openapi_url=f"{settings.API_V1_STR}/openapi.json"
)

# Set up CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.BACKEND_CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(auth.router, prefix=f"{settings.API_V1_STR}/auth", tags=["auth"])
app.include_router(technologies.router, prefix=f"{settings.API_V1_STR}/technologies", tags=["technologies"])

@app.on_event("startup")
async def startup_db_client():
    await Database.connect_db()

@app.on_event("shutdown")
async def shutdown_db_client():
    await Database.close_db()

@app.get("/")
async def root():
    return {"message": "Welcome to Personal Radar API"}

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "database": "connected" if Database.client is not None else "disconnected"
    } 