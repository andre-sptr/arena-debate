"""
Database configuration and session management using SQLAlchemy
"""
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import declarative_base
from sqlalchemy.pool import StaticPool
import os
from dotenv import load_dotenv

load_dotenv()

# Get database URL from environment
DATABASE_URL = os.getenv("DATABASE_URL", "sqlite+aiosqlite:///./arena.db")

# Create async engine
if "sqlite" in DATABASE_URL:
    engine = create_async_engine(
        DATABASE_URL,
        connect_args={
            "check_same_thread": False,
            "timeout": 20
        },
        poolclass=StaticPool,
        echo=False, 
    )
else:
    # For PostgreSQL or other databases
    engine = create_async_engine(
        DATABASE_URL,
        echo=False, 
        pool_pre_ping=True,
    )

# Create async session factory
AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
    autocommit=False,
    autoflush=False,
)

# Base class for models
Base = declarative_base()


# Dependency to get database session
async def get_db():
    """
    Dependency function to get database session.
    Use with FastAPI's Depends.
    """
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


# Initialize database tables
async def init_db():
    """
    Create all database tables.
    Call this on application startup.
    """
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)


# Close database connections
async def close_db():
    """
    Close all database connections.
    Call this on application shutdown.
    """
    await engine.dispose()
