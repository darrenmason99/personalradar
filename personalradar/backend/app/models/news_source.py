from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field

class NewsSourceBase(BaseModel):
    name: str
    url: str
    description: Optional[str] = None
    cadence_days: int = Field(ge=1, le=365, description="How often to check this source in days")
    is_active: bool = True
    last_checked: Optional[datetime] = None

class NewsSourceCreate(NewsSourceBase):
    pass

class NewsSourceInDB(NewsSourceBase):
    id: str = Field(alias="_id")
    created_at: datetime
    updated_at: datetime

class NewsSource(NewsSourceBase):
    id: str = Field(alias="_id")
    created_at: datetime
    updated_at: datetime

    class Config:
        populate_by_name = True
        json_encoders = {
            datetime: lambda v: v.isoformat()
        } 