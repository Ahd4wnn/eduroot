from pydantic_settings import BaseSettings
from functools import lru_cache

class Settings(BaseSettings):
    supabase_url: str
    supabase_service_role_key: str
    supabase_jwt_secret: str
    razorpay_key_id: str
    razorpay_key_secret: str
    frontend_url: str = "http://localhost:5173"
    environment: str = "development"
    brevo_smtp_host: str = "smtp-relay.brevo.com"
    brevo_smtp_port: int = 587
    brevo_smtp_user: str = ""
    brevo_smtp_pass: str = ""
    email_from: str = "noreply@eduroot.online"
    email_from_name: str = "eduroot"

    class Config:

        env_file = ".env"
        case_sensitive = False

@lru_cache()
def get_settings() -> Settings:
    return Settings()
