from pydantic import BaseModel
from typing import Optional, Any

class SuccessResponse(BaseModel):
    success: bool = True
    message: str = "OK"
    data: Optional[Any] = None

class ErrorResponse(BaseModel):
    success: bool = False
    error: str

class PaginatedResponse(BaseModel):
    items: list
    total: int
    page: int
    page_size: int
