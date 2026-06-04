from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.util import get_remote_address
from slowapi.errors import RateLimitExceeded
from contextlib import asynccontextmanager

from app.config import get_settings
from app.routers import health, courses, enrollments, admin, email

limiter = Limiter(key_func=get_remote_address)

@asynccontextmanager
async def lifespan(app: FastAPI):
    print("[eduroot API] starting up...")
    yield
    print("[eduroot API] shutting down...")

app = FastAPI(
    title="eduroot API",
    description="Backend API for eduroot.online course platform",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs" if get_settings().environment == "development" else None,
    redoc_url=None
)

# ─── RATE LIMITING ─────────────────────────────────────────────────────────────
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# ─── CORS ──────────────────────────────────────────────────────────────────────
settings = get_settings()
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        settings.frontend_url,
        "https://eduroot.online",
        "https://www.eduroot.online",
        "http://localhost:3000",
        "http://localhost:5173"
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    allow_headers=["*"],
)

# ─── GLOBAL ERROR HANDLER ──────────────────────────────────────────────────────
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    print(f"Global unhandled error: {str(exc)}")  # helpful console log for local checks
    return JSONResponse(
        status_code=500,
        content={"success": False, "error": f"Internal server error: {str(exc)}"}
    )

# ─── ROUTERS ───────────────────────────────────────────────────────────────────
app.include_router(health.router)
app.include_router(courses.router, prefix="/api/v1")
app.include_router(enrollments.router, prefix="/api/v1")
app.include_router(admin.router, prefix="/api/v1")
app.include_router(email.router, prefix="/api/v1")

@app.get("/")
async def root():
    return {"service": "eduroot-api", "status": "running", "version": "1.0.0"}
