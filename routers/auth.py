from fastapi import APIRouter,Depends,HTTPException, Request,status, Response, Cookie
from controller.auth import verifyPassword, createAccessToken, getCurrentUserFromCookie

router = APIRouter()


@router.post("/login/")
async def login(response: Response, username: str, password: str, db: Session = Depends(get_db)):
    # Check if the user exists in the database
    user = db.query(User).filter(User.username == username).first()
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect username or password")

    # Verify password
    if not verifyPassword(password, user.hashed_password):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Incorrect username or password")

    # Create JWT token (no expiration set, so it will be a session cookie)
    access_token = createAccessToken(
        data={"sub": user.username},
        expires_delta=None,  # No expiration set since it's a session cookie
    )

    # Set the JWT token as a session cookie (expires when browser is closed)
    response.set_cookie(key="access_token", value=access_token, httponly=True, secure=True, samesite="Strict")

    return {"access_token": access_token, "token_type": "bearer"}

@router.get("/me")
async def get_me(user=Depends(getCurrentUserFromCookie)):
    email = user["sub"]
    db_user = await user_crud.get_user_by_email(email)
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")

    return {
        "email": db_user["email"],
        "name": db_user["name"],
    }