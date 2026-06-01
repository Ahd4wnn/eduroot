from fastapi import APIRouter, Depends, HTTPException, Query, Path
from app.dependencies import get_current_user, require_admin
from app.services.supabase import get_supabase
from app.schemas.course import (
    CourseCreateSchema, CourseUpdateSchema, CourseResponseSchema
)
from app.schemas.common import SuccessResponse

router = APIRouter(prefix="/courses", tags=["courses"])

# ─── PUBLIC ENDPOINTS ──────────────────────────────────────────────────────────

@router.get("", summary="List all published courses")
async def list_courses(
    category: str | None = Query(None),
    supabase = Depends(get_supabase)
):
    query = supabase.table("courses")\
        .select("*")\
        .eq("is_published", True)\
        .order("created_at")

    if category:
        query = query.eq("category", category)

    result = query.execute()
    return {"success": True, "data": result.data, "total": len(result.data)}


@router.get("/{slug}", summary="Get one course by slug with modules + lessons")
async def get_course(
    slug: str = Path(...),
    supabase = Depends(get_supabase)
):
    result = supabase.table("courses")\
        .select("""
            *,
            modules (
                id, title, order_index,
                lessons (
                    id, title, video_url,
                    duration_mins, is_preview, order_index
                )
            )
        """)\
        .eq("slug", slug)\
        .eq("is_published", True)\
        .single()\
        .execute()

    if not result.data:
        raise HTTPException(status_code=404, detail="Course not found")

    # Sort modules and lessons by order_index
    course = result.data
    if course.get("modules"):
        course["modules"].sort(key=lambda m: m["order_index"])
        for module in course["modules"]:
            if module.get("lessons"):
                module["lessons"].sort(key=lambda l: l["order_index"])

    return {"success": True, "data": course}


# ─── ADMIN ENDPOINTS ───────────────────────────────────────────────────────────

@router.get("/admin/all", summary="Admin: list all courses including drafts")
async def admin_list_courses(
    admin = Depends(require_admin),
    supabase = Depends(get_supabase)
):
    result = supabase.table("courses")\
        .select("*, modules(id, lessons(id))")\
        .order("created_at", desc=True)\
        .execute()
    return {"success": True, "data": result.data}


@router.post("", summary="Admin: create a new course")
async def create_course(
    payload: CourseCreateSchema,
    admin = Depends(require_admin),
    supabase = Depends(get_supabase)
):
    # Check slug uniqueness
    existing = supabase.table("courses")\
        .select("id")\
        .eq("slug", payload.slug)\
        .execute()
    if existing.data:
        raise HTTPException(status_code=409, detail="Slug already in use")

    modules = payload.modules
    course_data = payload.model_dump(exclude={"modules"})
    course_data["last_updated"] = str(course_data.get("last_updated") or "")

    # Calculate totals from modules
    all_lessons = [l for m in modules for l in m.lessons]
    course_data["total_lessons"] = len(all_lessons)
    course_data["total_duration_mins"] = sum(
        l.duration_mins for l in all_lessons
    )

    result = supabase.table("courses").insert(course_data).execute()
    if not result.data:
        raise HTTPException(status_code=500, detail="Failed to create course")

    course_id = result.data[0]["id"]

    # Insert modules + lessons
    await _upsert_modules(supabase, course_id, modules)

    return {"success": True, "data": result.data[0], "message": "Course created"}


@router.put("/{course_id}", summary="Admin: update a course")
async def update_course(
    course_id: str,
    payload: CourseUpdateSchema,
    admin = Depends(require_admin),
    supabase = Depends(get_supabase)
):
    modules = payload.modules
    course_data = payload.model_dump(exclude={"modules"}, exclude_none=True)

    all_lessons = [l for m in modules for l in m.lessons]
    course_data["total_lessons"] = len(all_lessons)
    course_data["total_duration_mins"] = sum(
        l.duration_mins for l in all_lessons
    )

    result = supabase.table("courses")\
        .update(course_data)\
        .eq("id", course_id)\
        .execute()

    if not result.data:
        raise HTTPException(status_code=404, detail="Course not found")

    await _upsert_modules(supabase, course_id, modules)

    return {"success": True, "data": result.data[0], "message": "Course updated"}


@router.patch("/{course_id}/publish", summary="Admin: toggle publish status")
async def toggle_publish(
    course_id: str,
    admin = Depends(require_admin),
    supabase = Depends(get_supabase)
):
    current = supabase.table("courses")\
        .select("is_published")\
        .eq("id", course_id)\
        .single()\
        .execute()
    if not current.data:
        raise HTTPException(status_code=404, detail="Course not found")

    new_status = not current.data["is_published"]
    supabase.table("courses")\
        .update({"is_published": new_status})\
        .eq("id", course_id)\
        .execute()

    return {
        "success": True,
        "is_published": new_status,
        "message": "Published" if new_status else "Unpublished"
    }


@router.delete("/{course_id}", summary="Admin: delete a course")
async def delete_course(
    course_id: str,
    admin = Depends(require_admin),
    supabase = Depends(get_supabase)
):
    # Cascade delete handled by DB foreign keys
    supabase.table("courses").delete().eq("id", course_id).execute()
    return {"success": True, "message": "Course deleted"}


# ─── HELPER ────────────────────────────────────────────────────────────────────

async def _upsert_modules(supabase, course_id: str, modules: list):
    """
    Upsert modules and their lessons for a given course_id.
    Modules/lessons with temp IDs (starting with 'temp-') are inserted fresh.
    """
    for module in modules:
        module_id = module.id

        if not module_id or module_id.startswith("temp-"):
            # Insert new module
            mod_result = supabase.table("modules").insert({
                "course_id": course_id,
                "title": module.title,
                "order_index": module.order_index
            }).execute()
            module_id = mod_result.data[0]["id"]
        else:
            # Update existing
            supabase.table("modules").update({
                "title": module.title,
                "order_index": module.order_index
            }).eq("id", module_id).execute()

        for lesson in module.lessons:
            lesson_id = lesson.id
            lesson_data = {
                "module_id": module_id,
                "title": lesson.title,
                "video_url": lesson.video_url,  # External URL only
                "duration_mins": lesson.duration_mins,
                "is_preview": lesson.is_preview,
                "order_index": lesson.order_index
            }
            if not lesson_id or lesson_id.startswith("temp-"):
                supabase.table("lessons").insert(lesson_data).execute()
            else:
                supabase.table("lessons")\
                    .update(lesson_data)\
                    .eq("id", lesson_id)\
                    .execute()
