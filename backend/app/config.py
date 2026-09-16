import os
from pydantic import BaseModel

class Settings(BaseModel):
    PROJECT_NAME: str = "RecoverLens"
    VERSION: str = "2.0.0"
    API_PREFIX: str = "/api"
    SECRET_KEY: str = os.getenv("SECRET_KEY", "recoverlens-super-secret-jwt-key-2026")
    ALGORITHM: str = "HS256"
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60 * 24 * 7  # 7 days for demo
    # On Vercel / AWS Lambda, use /tmp which is the only writable filesystem
    DATABASE_URL: str = os.getenv(
        "DATABASE_URL",
        "sqlite:////tmp/recoverlens.db" if (os.getenv("VERCEL") or os.getenv("AWS_LAMBDA_FUNCTION_NAME")) else "sqlite:///./recoverlens.db"
    )
    GEMINI_API_KEY: str = os.getenv("GEMINI_API_KEY", "")

settings = Settings()
