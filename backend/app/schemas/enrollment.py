from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class EnrollmentCreateSchema(BaseModel):
    course_id: str

class EnrollmentResponseSchema(BaseModel):
    id: str
    user_id: str
    course_id: str
    enrolled_at: datetime
