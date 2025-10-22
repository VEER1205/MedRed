from fastapi import APIRouter, Request, HTTPException, Depends, Cookie
from starlette.config import Config
from jose import jwt
from passlib.context import CryptContext    
# from app.crud import user_crud
from config import settings
from datetime import datetime, timedelta



from jose import jwt
from config import settings

def verifyToken(token: str):
    try:
        # Decode the JWT token to get the payload as a Python dictionary
        payload = jwt.decode(token, settings.JWT_SECRET_KEY, algorithms=[settings.JWT_ALGORITHM])
        
        # Extract the 'sub' from the decoded payload (sub should be a string)
        sub = payload.get("sub")
        user= payload.get("user")
        if sub is None:
            raise ValueError("The 'sub' field is missing from the token.") 
        # You can now use 'sub' as a string (e.g., email, user ID)
        return {"user": user, "sub": sub}
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")


    
def getCurrentUserFromCookie(access_token: str = Cookie(None)):
    if not access_token:
        raise HTTPException(status_code=401, detail="Not authenticated - No token provided")
    return verifyToken(access_token)

pwd_context = CryptContext(schemes= ["argon2"],deprecated= "auto")
def createAccessToken(data:dict,expires_delta: timedelta):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(hours=1)
    to_encode.update({"exp":expire})
    encode_jwt = jwt.encode(to_encode, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)
    return encode_jwt

def verifyPassword(plain_password:str,hashed_password:str)->bool:
    return pwd_context.verify(plain_password,hashed_password)

def getPasswordHash(password:str)->str:
    return pwd_context.hash(password)
