from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .core.database import Database

app = FastAPI(
    title="Personal Tech Radar",
    description="AI-powered technology assessment and visualization platform",
    version="0.1.0"
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],  # React frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.on_event("startup")
async def startup_db_client():
    await Database.connect_db()

@app.on_event("shutdown")
async def shutdown_db_client():
    await Database.close_db()

@app.get("/")
async def root():
    return {
        "message": "Welcome to Personal Tech Radar API",
        "version": "0.1.0"
    }

@app.get("/health")
async def health_check():
    return {
        "status": "healthy",
        "database": "connected" if Database.client is not None else "disconnected"
    } 