from datetime import datetime
from typing import Optional
from pydantic import BaseModel, EmailStr, Field

class UserBase(BaseModel):
    email: EmailStr
    full_name: str
    picture: Optional[str] = None

class UserCreate(UserBase):
    google_id: str

class UserInDB(UserBase):
    id: str = Field(alias="_id")
    google_id: str
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)
    is_active: bool = True

class User(UserBase):
    id: str = Field(alias="_id")
    created_at: datetime
    updated_at: datetime
    is_active: bool

    class Config:
        populate_by_name = True
        json_encoders = {
            datetime: lambda v: v.isoformat()
        } 