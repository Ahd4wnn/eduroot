from fastapi import APIRouter, Depends
from app.dependencies import require_admin
from app.services.supabase import get_supabase

router = APIRouter(prefix="/admin", tags=["admin"])

@router.get("/stats", summary="Admin: dashboard stats")
async def get_stats(
    admin = Depends(require_admin),
    supabase = Depends(get_supabase)
):
    result = supabase.table("admin_stats").select("*").single().execute()
    return {"success": True, "data": result.data}


@router.get("/students", summary="Admin: all students with progress")
async def get_students(
    course_id: str | None = None,
    supabase = Depends(get_supabase),
    admin = Depends(require_admin)
):
    query = supabase.table("admin_student_progress")\
        .select("*")\
        .order("enrolled_at", desc=True)

    if course_id:
        query = query.eq("course_id", course_id)

    result = query.execute()
    return {"success": True, "data": result.data, "total": len(result.data)}


@router.get("/orders", summary="Admin: all orders")
async def get_orders(
    status: str | None = None,
    admin = Depends(require_admin),
    supabase = Depends(get_supabase)
):
    query = supabase.table("orders")\
        .select("*, profiles(full_name), courses(title)")\
        .order("created_at", desc=True)

    if status:
        query = query.eq("status", status)

    result = query.execute()
    return {"success": True, "data": result.data}
