from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field

class TechnologyBase(BaseModel):
    name: str
    quadrant: str  # Techniques, Tools, Platforms, Languages & Frameworks
    ring: str      # Hold, Assess, Trial, Adopt
    description: Optional[str] = None
    source: Optional[str] = None
    date_of_assessment: Optional[datetime] = None
    uri: Optional[str] = None

class TechnologyCreate(TechnologyBase):
    pass

class TechnologyInDB(TechnologyBase):
    id: str = Field(alias="_id")
    created_at: datetime
    updated_at: datetime

class Technology(TechnologyBase):
    id: str = Field(alias="_id")
    created_at: datetime
    updated_at: datetime

    class Config:
        populate_by_name = True
        json_encoders = {
            datetime: lambda v: v.isoformat()
        } 