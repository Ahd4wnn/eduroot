from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel, EmailStr
from app.dependencies import require_admin, get_current_user
from app.services.email import (
    send_enrollment_confirmation,
    send_course_completion,
    send_certificate_email,
    send_email,
)
from app.services.supabase import get_supabase

router = APIRouter(prefix="/email", tags=["email"])


# ─── Test endpoint (dev only) ──────────────────────────────────────────────────
@router.post("/test", summary="Admin: send a test email to yourself")
async def test_email(admin=Depends(require_admin)):
    from app.config import get_settings
    settings = get_settings()

    if settings.environment != "development":
        raise HTTPException(status_code=403, detail="Test endpoint is dev only")

    success = await send_email(
        to_email=settings.brevo_smtp_user,
        to_name="Admin",
        subject="✅ eduroot email test",
        html_content="""
          <div style="font-family:sans-serif;padding:32px;text-align:center;">
            <h2 style="color:#0F3D2E;">Email is working! 🎉</h2>
            <p style="color:#5F6368;">Brevo SMTP is configured correctly.</p>
          </div>
        """,
    )
    if not success:
        raise HTTPException(status_code=500, detail="Email send failed. Check logs.")
    return {"success": True, "message": "Test email sent"}


# ─── Admin: send certificate email ────────────────────────────────────────────
class SendCertificateRequest(BaseModel):
    user_id: str
    course_id: str
    note: str = ""


@router.post("/send-certificate", summary="Admin: send certificate email to student")
async def admin_send_certificate(
    payload: SendCertificateRequest,
    admin=Depends(require_admin),
    supabase=Depends(get_supabase),
):
    # Fetch student details
    profile = supabase.table("profiles")\
        .select("full_name")\
        .eq("id", payload.user_id)\
        .single()\
        .execute()

    user = supabase.auth.admin.get_user_by_id(payload.user_id)

    course = supabase.table("courses")\
        .select("title")\
        .eq("id", payload.course_id)\
        .single()\
        .execute()

    if not profile.data or not course.data:
        raise HTTPException(status_code=404, detail="Student or course not found")

    student_email = user.user.email
    student_name  = profile.data.get("full_name", "Student")
    course_title  = course.data.get("title", "")

    success = await send_certificate_email(
        to_email=student_email,
        student_name=student_name,
        course_title=course_title,
        certificate_note=payload.note,
    )

    return {"success": success, "sent_to": student_email}


# ─── Admin: manually send enrollment email ────────────────────────────────────
class ResendEnrollmentRequest(BaseModel):
    user_id: str
    course_id: str


@router.post("/resend-enrollment",
             summary="Admin: resend enrollment confirmation")
async def resend_enrollment_email(
    payload: ResendEnrollmentRequest,
    admin=Depends(require_admin),
    supabase=Depends(get_supabase),
):
    profile = supabase.table("profiles")\
        .select("full_name")\
        .eq("id", payload.user_id)\
        .single()\
        .execute()

    user   = supabase.auth.admin.get_user_by_id(payload.user_id)
    course = supabase.table("courses")\
        .select("title, slug")\
        .eq("id", payload.course_id)\
        .single()\
        .execute()

    success = await send_enrollment_confirmation(
        to_email=user.user.email,
        student_name=profile.data.get("full_name", "Student"),
        course_title=course.data.get("title", ""),
        course_slug=course.data.get("slug", ""),
    )

    return {"success": success}
