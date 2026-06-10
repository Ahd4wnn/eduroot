import razorpay
import hmac
import hashlib
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from app.dependencies import get_current_user
from app.services.supabase import get_supabase
from app.services.email import send_enrollment_confirmation
from app.config import get_settings
import asyncio

router = APIRouter(prefix="/orders", tags=["orders"])


def get_razorpay_client():
    settings = get_settings()
    return razorpay.Client(
        auth=(settings.razorpay_key_id, settings.razorpay_key_secret)
    )


# ─── Create order ─────────────────────────────────────────────────────────────
class CreateOrderRequest(BaseModel):
    course_id: str


@router.post("/create", summary="Create Razorpay order for a course")
async def create_order(
    payload: CreateOrderRequest,
    user=Depends(get_current_user),
    supabase=Depends(get_supabase),
):
    settings = get_settings()

    # 1. Check not already enrolled
    existing_enrollment = supabase.table("enrollments")\
        .select("id")\
        .eq("user_id", user["id"])\
        .eq("course_id", payload.course_id)\
        .execute()

    if existing_enrollment.data:
        raise HTTPException(
            status_code=409,
            detail="Already enrolled in this course"
        )

    # 2. Fetch course price
    course = supabase.table("courses")\
        .select("id, title, slug, price, is_published")\
        .eq("id", payload.course_id)\
        .eq("is_published", True)\
        .single()\
        .execute()

    if not course.data:
        raise HTTPException(status_code=404, detail="Course not found")

    # 3. Amount in paise (INR × 100)
    amount_paise = course.data["price"] * 100

    # 4. Create Razorpay order
    try:
        rz_client = get_razorpay_client()
        rz_order = rz_client.order.create({
            "amount":   amount_paise,
            "currency": "INR",
            "receipt":  f"eduroot_{user['id'][:8]}_{payload.course_id[:8]}",
            "notes": {
                "user_id":   user["id"],
                "course_id": payload.course_id,
                "email":     user["email"],
            }
        })
    except Exception as e:
        raise HTTPException(
            status_code=500,
            detail=f"Razorpay order creation failed: {str(e)}"
        )

    # 5. Save order to DB
    supabase.table("orders").insert({
        "user_id":           user["id"],
        "course_id":         payload.course_id,
        "razorpay_order_id": rz_order["id"],
        "amount":            amount_paise,
        "currency":          "INR",
        "status":            "created",
    }).execute()

    return {
        "success":          True,
        "order_id":         rz_order["id"],
        "amount":           amount_paise,
        "currency":         "INR",
        "course_title":     course.data["title"],
        "razorpay_key_id":  settings.razorpay_key_id,
    }


# ─── Verify payment ───────────────────────────────────────────────────────────
class VerifyPaymentRequest(BaseModel):
    razorpay_order_id:   str
    razorpay_payment_id: str
    razorpay_signature:  str
    course_id:           str


@router.post("/verify", summary="Verify payment and enroll student")
async def verify_payment(
    payload: VerifyPaymentRequest,
    user=Depends(get_current_user),
    supabase=Depends(get_supabase),
):
    settings = get_settings()

    # 1. Verify HMAC signature
    # Razorpay signs: order_id + "|" + payment_id
    body = f"{payload.razorpay_order_id}|{payload.razorpay_payment_id}"

    expected_signature = hmac.new(
        settings.razorpay_key_secret.encode("utf-8"),
        body.encode("utf-8"),
        hashlib.sha256
    ).hexdigest()

    if expected_signature != payload.razorpay_signature:
        # Mark order as failed
        supabase.table("orders")\
            .update({"status": "failed"})\
            .eq("razorpay_order_id", payload.razorpay_order_id)\
            .execute()

        raise HTTPException(
            status_code=400,
            detail="Payment verification failed — invalid signature"
        )

    # 2. Signature valid → update order to paid
    from datetime import datetime, timezone
    supabase.table("orders").update({
        "status":              "paid",
        "razorpay_payment_id": payload.razorpay_payment_id,
        "razorpay_signature":  payload.razorpay_signature,
        "paid_at":             datetime.now(timezone.utc).isoformat(),
    }).eq("razorpay_order_id", payload.razorpay_order_id).execute()

    # 3. Enroll student
    # Upsert to handle edge case of duplicate verify calls
    supabase.table("enrollments").upsert({
        "user_id":   user["id"],
        "course_id": payload.course_id,
    }, on_conflict="user_id,course_id").execute()

    # 4. Send confirmation email (fire and forget)
    try:
        enrolled_user = supabase.auth.admin.get_user_by_id(user["id"])
        profile = supabase.table("profiles")\
            .select("full_name")\
            .eq("id", user["id"])\
            .single()\
            .execute()
        course = supabase.table("courses")\
            .select("title, slug")\
            .eq("id", payload.course_id)\
            .single()\
            .execute()

        asyncio.create_task(
            send_enrollment_confirmation(
                to_email=enrolled_user.user.email,
                student_name=profile.data.get("full_name", "Student"),
                course_title=course.data.get("title", ""),
                course_slug=course.data.get("slug", ""),
            )
        )
    except Exception as e:
        print(f"Post-payment email failed to queue: {e}")

    return {
        "success":    True,
        "enrolled":   True,
        "message":    "Payment verified and enrollment confirmed",
        "course_id":  payload.course_id,
    }


# ─── Payment failure handler ──────────────────────────────────────────────────
class FailOrderRequest(BaseModel):
    razorpay_order_id: str
    error_description: str = ""


@router.post("/failed", summary="Mark an order as failed")
async def mark_order_failed(
    payload: FailOrderRequest,
    user=Depends(get_current_user),
    supabase=Depends(get_supabase),
):
    supabase.table("orders").update({
        "status": "failed",
    }).eq("razorpay_order_id", payload.razorpay_order_id)\
      .eq("user_id", user["id"])\
      .execute()

    return {"success": True, "message": "Order marked as failed"}
