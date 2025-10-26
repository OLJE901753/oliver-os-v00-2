"""
Oliver-OS AI Services Configuration
Environment settings and configuration management
"""

import os
from typing import Optional
from pydantic_settings import BaseSettings
from pydantic import Field


class Settings(BaseSettings):
    """Application settings loaded from environment variables"""
    
    # API Keys
    openai_api_key: Optional[str] = Field(default=None, env="OPENAI_API_KEY")
    anthropic_api_key: Optional[str] = Field(default=None, env="ANTHROPIC_API_KEY")
    
    # Database URLs
    postgres_url: str = Field(
        default="postgresql://postgres:postgres@localhost:5432/oliver_os",
        env="POSTGRES_URL"
    )
    redis_url: str = Field(
        default="redis://localhost:6379",
        env="REDIS_URL"
    )
    neo4j_url: str = Field(
        default="bolt://localhost:7687",
        env="NEO4J_URL"
    )
    neo4j_user: str = Field(default="neo4j", env="NEO4J_USER")
    neo4j_password: str = Field(default="password", env="NEO4J_PASSWORD")
    
    # ChromaDB settings
    chroma_host: str = Field(default="localhost", env="CHROMA_HOST")
    chroma_port: int = Field(default=8000, env="CHROMA_PORT")
    
    # Elasticsearch settings
    elasticsearch_url: str = Field(
        default="http://localhost:9200",
        env="ELASTICSEARCH_URL"
    )
    
    # AI Model settings
    default_model: str = Field(default="gpt-4", env="DEFAULT_MODEL")
    max_tokens: int = Field(default=2000, env="MAX_TOKENS")
    temperature: float = Field(default=0.7, env="TEMPERATURE")
    
    # LLM Provider settings
    llm_provider: str = Field(default="ollama", env="LLM_PROVIDER")
    ollama_base_url: str = Field(default="http://localhost:11434", env="OLLAMA_BASE_URL")
    ollama_model: str = Field(default="llama3.1:8b", env="OLLAMA_MODEL")
    
    # Application settings
    debug: bool = Field(default=False, env="DEBUG")
    log_level: str = Field(default="INFO", env="LOG_LEVEL")
    
    # Security settings
    secret_key: str = Field(
        default="your-secret-key-change-in-production",
        env="SECRET_KEY"
    )
    
    # Rate limiting
    rate_limit_requests: int = Field(default=100, env="RATE_LIMIT_REQUESTS")
    rate_limit_window: int = Field(default=3600, env="RATE_LIMIT_WINDOW")  # seconds
    
    # Additional settings (to allow extra fields from environment)
    database_url: Optional[str] = Field(default=None, env="DATABASE_URL")
    ai_services_url: Optional[str] = Field(default=None, env="AI_SERVICES_URL")
    jwt_secret: Optional[str] = Field(default=None, env="JWT_SECRET")
    jwt_refresh_secret: Optional[str] = Field(default=None, env="JWT_REFRESH_SECRET")
    jwt_access_expiry: Optional[str] = Field(default=None, env="JWT_ACCESS_EXPIRY")
    jwt_refresh_expiry: Optional[str] = Field(default=None, env="JWT_REFRESH_EXPIRY")
    cors_origin: Optional[str] = Field(default=None, env="CORS_ORIGIN")
    port: Optional[int] = Field(default=None, env="PORT")
    node_env: Optional[str] = Field(default=None, env="NODE_ENV")
    
    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"
        extra = "allow"  # Allow extra fields from environment
        case_sensitive = False


# Global settings instance
settings = Settings()
