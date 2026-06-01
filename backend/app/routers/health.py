from fastapi import APIRouter
from app.services.supabase import get_supabase

router = APIRouter(prefix="/health", tags=["health"])

@router.get("")
async def health_check():
    return {
        "status": "ok",
        "service": "eduroot-api",
        "version": "1.0.0"
    }

@router.get("/db")
async def db_check():
    try:
        supabase = get_supabase()
        result = supabase.table("courses").select("id").limit(1).execute()
        return { "status": "ok", "db": "connected" }
    except Exception as e:
        return { "status": "error", "db": str(e) }
