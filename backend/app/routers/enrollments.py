from fastapi import APIRouter, Depends, HTTPException
from app.dependencies import get_current_user, require_admin
from app.services.supabase import get_supabase

router = APIRouter(prefix="/enrollments", tags=["enrollments"])

@router.get("/me", summary="Get current user's enrollments with progress")
async def my_enrollments(
    user = Depends(get_current_user),
    supabase = Depends(get_supabase)
):
    result = supabase.table("enrollments")\
        .select("""
            enrolled_at,
            courses (
                id, title, slug, category,
                thumbnail_url, total_lessons, price
            )
        """)\
        .eq("user_id", user["id"])\
        .execute()

    progress = supabase.table("course_progress_view")\
        .select("*")\
        .eq("user_id", user["id"])\
        .execute()

    progress_map = {
        p["course_id"]: p["progress_pct"]
        for p in (progress.data or [])
    }

    return {
        "success": True,
        "data": result.data,
        "progress": progress_map
    }


@router.get("/me/check/{course_id}", summary="Check if user is enrolled")
async def check_enrollment(
    course_id: str,
    user = Depends(get_current_user),
    supabase = Depends(get_supabase)
):
    result = supabase.table("enrollments")\
        .select("id")\
        .eq("user_id", user["id"])\
        .eq("course_id", course_id)\
        .execute()

    return {"enrolled": bool(result.data)}


@router.post("/admin/enroll", summary="Admin: manually enroll a user")
async def admin_enroll(
    user_id: str,
    course_id: str,
    admin = Depends(require_admin),
    supabase = Depends(get_supabase)
):
    # Check not already enrolled
    existing = supabase.table("enrollments")\
        .select("id")\
        .eq("user_id", user_id)\
        .eq("course_id", course_id)\
        .execute()

    if existing.data:
        raise HTTPException(status_code=409, detail="User already enrolled")

    result = supabase.table("enrollments").insert({
        "user_id": user_id,
        "course_id": course_id
    }).execute()

    return {"success": True, "data": result.data[0]}


@router.delete("/admin/{enrollment_id}", summary="Admin: remove enrollment")
async def admin_unenroll(
    enrollment_id: str,
    admin = Depends(require_admin),
    supabase = Depends(get_supabase)
):
    supabase.table("enrollments")\
        .delete()\
        .eq("id", enrollment_id)\
        .execute()
    return {"success": True, "message": "Enrollment removed"}
