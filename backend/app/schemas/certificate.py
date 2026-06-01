from pydantic import BaseModel
from datetime import datetime
from typing import Optional

class CertificateResponseSchema(BaseModel):
    id: str
    user_id: str
    course_id: str
    certificate_id: str
    issued_at: datetime
    course_title: Optional[str] = None
    student_name: Optional[str] = None
