from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import engine, Base
from app.seed import seed_data
from app.routers import auth, rooms, tasks, important, achievements, timeline

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Initialize DB schema safely
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        await seed_data()
    except Exception as e:
        print(f"Database initialization warning on startup: {e}")
    yield

app = FastAPI(
    title="PulseForge API",
    description="High-velocity workspace and war-room tracker built for hackathons and early-stage startup teams.",
    version="1.0.0",
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

@app.get("/")
async def root():
    return {
        "app": "PulseForge API",
        "status": "operational",
        "version": "1.0.0",
        "docs": "/docs",
        "description": "High-velocity war-room tracker for hackathons and startups"
    }

@app.get("/api/health")
async def health():
    db_status = "connected"
    try:
        async with engine.connect() as conn:
            from sqlalchemy import text
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
