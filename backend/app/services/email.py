import aiosmtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from email.utils import formataddr
from jinja2 import Environment, FileSystemLoader, select_autoescape
from pathlib import Path
from app.config import get_settings

# ─── Template engine setup ────────────────────────────────────────────────────
TEMPLATES_DIR = Path(__file__).parent.parent / "templates" / "emails"

env = Environment(
    loader=FileSystemLoader(str(TEMPLATES_DIR)),
    autoescape=select_autoescape(['html']),
)

# ─── Core send function ───────────────────────────────────────────────────────
async def send_email(
    to_email: str,
    to_name: str,
    subject: str,
    html_content: str,
) -> bool:
    """
    Send a single email via Brevo SMTP.
    Returns True on success, False on failure (never raises — always silent fail).
    Emails should never crash the main request flow.
    """
    settings = get_settings()

    try:
        message = MIMEMultipart("alternative")
        message["Subject"] = subject
        message["From"]    = formataddr(
            (settings.email_from_name, settings.email_from)
        )
        message["To"]      = formataddr((to_name, to_email))

        html_part = MIMEText(html_content, "html", "utf-8")
        message.attach(html_part)

        await aiosmtplib.send(
            message,
            hostname=settings.brevo_smtp_host,
            port=settings.brevo_smtp_port,
            username=settings.brevo_smtp_user,
            password=settings.brevo_smtp_pass,
            start_tls=True,
        )

        print(f"✉️  Email sent to {to_email} — {subject}")
        return True

    except Exception as e:
        # Log but never crash — email is non-critical
        print(f"❌ Email failed to {to_email}: {str(e)}")
        return False


# ─── Render helpers ───────────────────────────────────────────────────────────
def render_template(template_name: str, context: dict) -> str:
    template = env.get_template(template_name)
    return template.render(**context)


# ─── Named email senders ─────────────────────────────────────────────────────

async def send_enrollment_confirmation(
    to_email: str,
    student_name: str,
    course_title: str,
    course_slug: str,
) -> bool:
    html = render_template("enrollment.html", {
        "student_name": student_name,
        "course_title": course_title,
        "course_url":   f"https://eduroot.online/learn/{course_slug}",
        "dashboard_url": "https://eduroot.online/dashboard",
    })
    return await send_email(
        to_email=to_email,
        to_name=student_name,
        subject=f"You're enrolled in {course_title} 🎉",
        html_content=html,
    )


async def send_course_completion(
    to_email: str,
    student_name: str,
    course_title: str,
    total_xp: int,
) -> bool:
    html = render_template("course_complete.html", {
        "student_name":  student_name,
        "course_title":  course_title,
        "total_xp":      total_xp,
        "dashboard_url": "https://eduroot.online/dashboard",
    })
    return await send_email(
        to_email=to_email,
        to_name=student_name,
        subject=f"You completed {course_title}! 🏆",
        html_content=html,
    )


async def send_certificate_email(
    to_email: str,
    student_name: str,
    course_title: str,
    certificate_note: str = "",
) -> bool:
    """
    Admin manually triggers this to send a certificate.
    The actual PDF is attached manually by admin via email client.
    This just sends a heads-up notification.
    """
    html = render_template("send_certificate.html", {
        "student_name":     student_name,
        "course_title":     course_title,
        "certificate_note": certificate_note,
        "dashboard_url":    "https://eduroot.online/dashboard",
    })
    return await send_email(
        to_email=to_email,
        to_name=student_name,
        subject=f"Your certificate for {course_title} is here! 🎓",
        html_content=html,
    )
