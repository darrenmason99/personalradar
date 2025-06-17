from datetime import datetime, timedelta
from typing import Optional
from jose import JWTError, jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import OAuth2PasswordBearer
from motor.motor_asyncio import AsyncIOMotorClient
from ..models.user import User, UserCreate, UserInDB
from ..core.config import settings

oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

class AuthService:
    def __init__(self, db: AsyncIOMotorClient):
        self.db = db
        self.collection = db.users

    async def get_user_by_google_id(self, google_id: str) -> Optional[User]:
        user_data = await self.collection.find_one({"google_id": google_id})
        if user_data:
            user_data["_id"] = str(user_data["_id"])
            return User(**user_data)
        return None

    async def get_user_by_email(self, email: str) -> Optional[User]:
        user_data = await self.collection.find_one({"email": email})
        if user_data:
            user_data["_id"] = str(user_data["_id"])
            return User(**user_data)
        return None

    async def create_user(self, user_data: UserCreate) -> User:
        user_dict = user_data.model_dump()
        user_dict["created_at"] = datetime.utcnow()
        user_dict["updated_at"] = datetime.utcnow()
        user_dict["is_active"] = True

        result = await self.collection.insert_one(user_dict)
        user_dict["_id"] = str(result.inserted_id)
        return User(**user_dict)

    async def update_user(self, user_id: str, update_data: dict) -> Optional[User]:
        update_data["updated_at"] = datetime.utcnow()
        result = await self.collection.update_one(
            {"_id": user_id},
            {"$set": update_data}
        )
        if result.modified_count:
            user_data = await self.collection.find_one({"_id": user_id})
            if user_data:
                user_data["_id"] = str(user_data["_id"])
                return User(**user_data)
        return None

    def create_access_token(self, data: dict, expires_delta: Optional[timedelta] = None) -> str:
        to_encode = data.copy()
        if expires_delta:
            expire = datetime.utcnow() + expires_delta
        else:
            expire = datetime.utcnow() + timedelta(minutes=15)
        to_encode.update({"exp": expire})
        encoded_jwt = jwt.encode(
            to_encode, 
            settings.SECRET_KEY, 
            algorithm=settings.ALGORITHM
        )
        return encoded_jwt

    async def verify_token(self, token: str = Depends(oauth2_scheme)) -> User:
        credentials_exception = HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )
        try:
            payload = jwt.decode(
                token, 
                settings.SECRET_KEY, 
                algorithms=[settings.ALGORITHM]
            )
            user_id: str = payload.get("sub")
            if user_id is None:
                raise credentials_exception
        except JWTError:
            raise credentials_exception

        user = await self.get_user_by_id(user_id)
        if user is None:
            raise credentials_exception
        return user

    async def get_user_by_id(self, user_id: str) -> Optional[User]:
        user_data = await self.collection.find_one({"_id": user_id})
        if user_data:
            user_data["_id"] = str(user_data["_id"])
            return User(**user_data)
        return None 