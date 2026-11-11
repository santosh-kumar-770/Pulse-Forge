import os
import sys

# Ensure current api directory is in sys.path for both local uvicorn and Vercel serverless runs
_api_dir = os.path.dirname(os.path.abspath(__file__))
if _api_dir not in sys.path:
    sys.path.insert(0, _api_dir)

from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import text

from app.database import engine, Base
from app.seed import seed_data
from app.routers import auth, rooms, tasks, important, achievements, timeline, messages

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize DB schema safely
    try:
        async with engine.begin() as conn:
            # 1. Create any missing tables (room_join_requests, messages, etc.)
            await conn.run_sync(Base.metadata.create_all)
            
            # 2. Add columns if they do not exist
            try:
                await conn.execute(text("ALTER TABLE rooms ADD COLUMN IF NOT EXISTS is_private BOOLEAN DEFAULT FALSE"))
                await conn.execute(text("ALTER TABLE rooms ADD COLUMN IF NOT EXISTS requires_approval BOOLEAN DEFAULT TRUE"))
                await conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS is_verified BOOLEAN DEFAULT TRUE"))
                await conn.execute(text("ALTER TABLE users ADD COLUMN IF NOT EXISTS last_login_at TIMESTAMP WITH TIME ZONE"))
            except Exception:
                pass

        # 3. Seed data
        await seed_data()
    except Exception as e:
        print(f"Database initialization warning on startup: {e}")
    yield

app = FastAPI(
    title="PulseForge API",
    description="High-velocity workspace and war-room tracker built for hackathons and early-stage startup teams.",
    version="1.1.0",
    lifespan=lifespan
)

# CORS configuration for React + Vite development server & production
origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:3000",
    "*"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include API Routers
app.include_router(auth.router)
app.include_router(rooms.router)
app.include_router(tasks.router)
app.include_router(important.router)
app.include_router(achievements.router)
app.include_router(timeline.router)
app.include_router(messages.router)

@app.get("/")
async def root():
    return {
        "app": "PulseForge API",
        "status": "operational",
        "version": "1.1.0",
        "docs": "/docs",
        "description": "High-velocity war-room tracker for hackathons and startups"
    }

@app.get("/api/health")
async def health():
    db_status = "connected"
    try:
        async with engine.connect() as conn:
            await conn.execute(text("SELECT 1"))
    except Exception as e:
        db_status = f"error: {str(e)}"
    return {
        "status": "ok",
        "service": "pulseforge-backend",
        "database": db_status
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
