from supabase import create_client, Client
from app.config import get_settings
from functools import lru_cache

@lru_cache()
def get_supabase() -> Client:
    settings = get_settings()
    # Service role key — bypasses RLS, only used server-side
    # NEVER expose this key to the frontend
    return create_client(
        settings.supabase_url,
        settings.supabase_service_role_key
    )
