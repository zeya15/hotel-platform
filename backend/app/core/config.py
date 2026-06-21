from pydantic_settings import BaseSettings, SettingsConfigDict
from pydantic import field_validator


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    # App
    ENVIRONMENT: str = "development"
    DEBUG: bool = True
    ALLOWED_ORIGINS: list[str] = ["http://localhost:3000"]

    # Database
    DATABASE_URL: str
    DATABASE_URL_SYNC: str

    # Redis
    REDIS_URL: str = "redis://localhost:6379/0"

    # Security
    SECRET_KEY: str
    ACCESS_TOKEN_EXPIRE_MINUTES: int = 60
    REFRESH_TOKEN_EXPIRE_DAYS: int = 30
    ALGORITHM: str = "HS256"

    # Celery
    CELERY_BROKER_URL: str = "redis://localhost:6379/1"
    CELERY_RESULT_BACKEND: str = "redis://localhost:6379/2"

    # Payments — Stripe
    STRIPE_SECRET_KEY: str = ""
    STRIPE_WEBHOOK_SECRET: str = ""
    PAYPAL_CLIENT_ID: str = ""
    PAYPAL_CLIENT_SECRET: str = ""

    # Payments — ONVO (Costa Rica)
    ONVO_API_KEY: str = ""
    ONVO_SECRET_KEY: str = ""
    ONVO_WEBHOOK_SECRET: str = ""
    ONVO_BASE_URL: str = "https://api.onvopay.com"

    # Email
    SMTP_HOST: str = "smtp.gmail.com"
    SMTP_PORT: int = 587
    SMTP_USER: str = ""
    SMTP_PASSWORD: str = ""
    EMAILS_FROM_NAME: str = "Hotel Reservas"
    EMAILS_FROM_EMAIL: str = "reservas@hotel.com"

    # Exchange Rate
    EXCHANGE_RATE_API_KEY: str = ""
    EXCHANGE_RATE_BASE_CURRENCY: str = "USD"

    # Booking — 15 minutos para que el huésped complete el pago
    BOOKING_LOCK_TTL_SECONDS: int = 900
    # Rate limiting para el endpoint de disponibilidad (peticiones/minuto por IP)
    AVAILABILITY_RATE_LIMIT: str = "60/minute"

    @field_validator("ALLOWED_ORIGINS", mode="before")
    @classmethod
    def parse_origins(cls, v: str | list) -> list[str]:
        if isinstance(v, str):
            return [origin.strip() for origin in v.split(",")]
        return v


settings = Settings()
