from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from google.oauth2 import id_token
from google.auth.transport import requests
from datetime import timedelta
from ...core.auth import AuthService
from ...core.config import settings
from ...core.database import get_database
from ...models.user import User, UserCreate
from pydantic import BaseModel
import logging
from typing import Dict, Any

router = APIRouter()

class GoogleAuthRequest(BaseModel):
    token: str

@router.post("/google")
async def google_auth(request: GoogleAuthRequest, db=Depends(get_database)) -> Dict[str, Any]:
    try:
        token = request.token
        logging.warning(f"Received Google login request with token: {token[:20]}... (truncated)")
        logging.warning(f"Using GOOGLE_CLIENT_ID: {settings.GOOGLE_CLIENT_ID}")
        # Verify the Google token
        idinfo = id_token.verify_oauth2_token(
            token, 
            requests.Request(), 
            settings.GOOGLE_CLIENT_ID
        )
        logging.warning(f"Google token verified. idinfo: {idinfo}")

        if idinfo['iss'] not in ['accounts.google.com', 'https://accounts.google.com']:
            logging.warning(f"Invalid issuer: {idinfo['iss']}")
            raise ValueError('Invalid issuer.')

        # Get or create user
        auth_service = AuthService(db)
        user = await auth_service.get_user_by_google_id(idinfo['sub'])
        
        if not user:
            # Create new user
            user_data = UserCreate(
                email=idinfo['email'],
                full_name=idinfo['name'],
                picture=idinfo.get('picture'),
                google_id=idinfo['sub']
            )
            user = await auth_service.create_user(user_data)
            logging.warning(f"Created new user: {user}")
        else:
            logging.warning(f"Found existing user: {user}")

        # Create access token
        access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
        access_token = auth_service.create_access_token(
            data={"sub": str(user.id)},
            expires_delta=access_token_expires
        )
        logging.warning(f"Returning access token for user {user.id}")

        return {
            "access_token": access_token,
            "token_type": "bearer",
            "user": user
        }

    except Exception as e:
        logging.error(f"Google login failed: {e}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=str(e),
            headers={"WWW-Authenticate": "Bearer"},
        )

async def get_current_user(db=Depends(get_database), token: str = Depends(OAuth2PasswordRequestForm)) -> User:
    auth_service = AuthService(db)
    return await auth_service.verify_token(token)

@router.get("/me", response_model=User)
async def read_users_me(current_user: User = Depends(get_current_user)) -> User:
    return current_user 