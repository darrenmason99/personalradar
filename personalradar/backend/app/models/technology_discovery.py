from datetime import datetime
from typing import Optional
from pydantic import BaseModel, Field

class TechnologyDiscoveryBase(BaseModel):
    name: str
    description: str
    source_url: str
    news_source_id: str
    discovered_at: datetime
    article_title: Optional[str] = None
    article_url: Optional[str] = None
    confidence_score: float = Field(ge=0.0, le=1.0, description="AI confidence in technology detection")
    category: Optional[str] = None  # e.g., "AI/ML", "Programming Language", "Framework", "Tool"
    status: str = "discovered"  # discovered, assessed, ignored

class TechnologyDiscoveryCreate(TechnologyDiscoveryBase):
    pass

class TechnologyDiscoveryInDB(TechnologyDiscoveryBase):
    id: str = Field(alias="_id")
    created_at: datetime
    updated_at: datetime

class TechnologyDiscovery(TechnologyDiscoveryBase):
    id: str = Field(alias="_id")
    created_at: datetime
    updated_at: datetime

    class Config:
        populate_by_name = True
        json_encoders = {
            datetime: lambda v: v.isoformat()
        } 