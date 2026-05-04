"""
Configuration management for Arena backend
"""
from pydantic_settings import BaseSettings
from functools import lru_cache


class Settings(BaseSettings):
    """Application settings loaded from environment variables"""
    
    # Google Gemini API
    google_api_key: str = ""
    
    # Database
    database_url: str = "sqlite+aiosqlite:///./arena.db"
    
    # API Configuration
    api_host: str = "0.0.0.0"
    api_port: int = 8000
    cors_origins: str = "http://localhost:3000,http://127.0.0.1:3000"
    cors_origin_regex: str = (
        r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$|^https://.*\.vercel\.app$"
    )
    
    # Rate Limiting
    max_debates_per_minute: int = 1
    max_concurrent_debates: int = 5
    
    # AI Model Configuration
    default_model: str = "gemini-3.1-flash-lite-preview"
    consensus_model: str = "gemini-3-flash-preview"
    max_output_tokens: int = 300
    temperature: float = 0.8
    thinking_budget: int = 1024
    ai_request_timeout: float = 60.0
    
    # Cache Configuration
    cache_ttl: int = 3600
    cache_max_size: int = 1000
    
    class Config:
        env_file = ".env"
        case_sensitive = False
        extra = "ignore"


@lru_cache()
def get_settings() -> Settings:
    """
    Get cached settings instance.
    Use lru_cache to avoid reading .env file multiple times.
    """
    return Settings()
