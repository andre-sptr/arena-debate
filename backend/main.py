"""
Arena - AI Debate & Consensus Platform
FastAPI Backend Entry Point
"""

from fastapi import FastAPI, Response, status
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import uvicorn
import logging

from routers import debate, history
from database import check_db_health, init_db
from config import get_settings

logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Lifecycle manager for startup and shutdown events"""

    logger.info("🚀 Arena Backend Starting...")
    logger.info("Initializing database...")
    try:
        await init_db()
        logger.info("Database initialized successfully")
    except Exception as e:
        logger.exception(f"Error initializing database: {e}")
        raise
    
    yield

    logger.info("👋 Arena Backend Shutting Down...")


app = FastAPI(
    title="Arena API",
    description="AI Debate & Consensus Platform Backend",
    version="1.0.0",
    lifespan=lifespan
)

settings = get_settings()
cors_origins = [
    origin.strip()
    for origin in settings.cors_origins.split(",")
    if origin.strip()
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=cors_origins,
    allow_origin_regex=settings.cors_origin_regex,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(debate.router, prefix="/debate", tags=["debate"])
app.include_router(history.router, prefix="/history", tags=["history"])


@app.get("/")
async def root():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "Arena API",
        "version": "1.0.0"
    }


@app.get("/health")
async def health_check(response: Response):
    """Detailed health check"""
    database_healthy, database_error = await check_db_health()
    response.status_code = (
        status.HTTP_200_OK
        if database_healthy
        else status.HTTP_503_SERVICE_UNAVAILABLE
    )

    payload = {
        "status": "healthy" if database_healthy else "unhealthy",
        "services": {
            "api": "operational",
            "vertex_ai": "ready",
            "database": "connected" if database_healthy else "unreachable",
        },
    }
    if database_error:
        payload["error"] = database_error
    return payload


if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
