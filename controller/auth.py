from fastapi import APIRouter, Request, HTTPException, Depends, Cookie
from starlette.config import Config
import jwt
from passlib.context import CryptContext    
# from app.crud import user_crud
from config import settings
from datetime import datetime, timedelta



def verifyToken(token: str):
    try:
        payload = jwt.decode(
            token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM]
        )
        return payload  # e.g., { "sub": "user@example.com", ... }
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")
    
def getCurrentUserFromCookie(access_token: str = Cookie(None)):
    if not access_token:
        raise HTTPException(status_code=401, detail="Not authenticated")

    return verifyToken(access_token)

pwd_context = CryptContext(schemes= ["bcrypt"],deprecated= "auto")
def createAccessToken(data:dict,expires_delta: timedelta):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(hours=1)
    to_encode.update({"exp":expire})
    encode_jwt = jwt.encode(to_encode, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
    return encode_jwt

def verify_password(plain_password:str,hashed_password:str)->bool:
    return pwd_context.verify(plain_password,hashed_password)
