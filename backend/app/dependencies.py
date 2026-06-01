from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from jose import jwt, JWTError
from app.config import get_settings
from app.services.supabase import get_supabase

bearer_scheme = HTTPBearer()

def verify_token(
    credentials: HTTPAuthorizationCredentials = Depends(bearer_scheme),
) -> dict:
    """
    Verify Supabase JWT token sent by the frontend.
    Returns the decoded payload with sub (user_id) and other claims.
    Raises 401 if token is invalid or expired.
    """
    settings = get_settings()
    token = credentials.credentials
    try:
        payload = jwt.decode(
            token,
            settings.supabase_jwt_secret,
            algorithms=["HS256"],
            options={"verify_aud": False}
        )
        user_id: str = payload.get("sub")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token: missing subject"
            )
        return payload
    except JWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Token verification failed: {str(e)}"
        )

def get_current_user(payload: dict = Depends(verify_token)) -> dict:
    """Returns user_id and email from verified token payload."""
    return {
        "id": payload.get("sub"),
        "email": payload.get("email"),
        "role": payload.get("role", "authenticated")
    }

async def require_admin(
    user: dict = Depends(get_current_user),
    supabase = Depends(get_supabase)
) -> dict:
    """
    Checks profiles table for admin role.
    Raises 403 if user is not an admin.
    """
    result = supabase.table("profiles")\
        .select("role")\
        .eq("id", user["id"])\
        .single()\
        .execute()

    if not result.data or result.data.get("role") != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required"
        )
    return user
