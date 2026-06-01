from pydantic import BaseModel, Field
from typing import Optional
from datetime import date, datetime

class LessonSchema(BaseModel):
    id: Optional[str] = None
    module_id: Optional[str] = None
    title: str
    video_url: Optional[str] = None   # External URL only — no uploads
    duration_mins: int = 0
    is_preview: bool = False
    order_index: int

class ModuleSchema(BaseModel):
    id: Optional[str] = None
    course_id: Optional[str] = None
    title: str
    order_index: int
    lessons: list[LessonSchema] = []

class CourseCreateSchema(BaseModel):
    title: str = Field(..., min_length=3, max_length=120)
    slug: str = Field(..., min_length=3, max_length=80,
                      pattern=r'^[a-z0-9-]+$')
    short_desc: Optional[str] = Field(None, max_length=150)
    long_desc: Optional[str] = None
    thumbnail_url: Optional[str] = None
    preview_video_url: Optional[str] = None  # External URL only
    category: str = Field(...,
        pattern=r'^(digital-marketing|graphic-designing|video-editing)$')
    price: int = Field(4999, ge=0)
    original_price: int = Field(6999, ge=0)
    is_published: bool = False
    skill_level: str = "Beginner"
    language: str = "English"
    last_updated: Optional[date] = None
    modules: list[ModuleSchema] = []

class CourseUpdateSchema(CourseCreateSchema):
    title: Optional[str] = None
    slug: Optional[str] = None
    category: Optional[str] = None

class CourseResponseSchema(BaseModel):
    id: str
    title: str
    slug: str
    short_desc: Optional[str]
    long_desc: Optional[str]
    thumbnail_url: Optional[str]
    preview_video_url: Optional[str]
    category: str
    price: int
    original_price: int
    is_published: bool
    total_lessons: int
    total_duration_mins: int
    skill_level: str
    language: str
    last_updated: Optional[date]
    created_at: datetime
    modules: list[ModuleSchema] = []
