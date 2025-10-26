from fastapi import APIRouter, Depends, HTTPException, Request, status, Response, Cookie, Form, Body
from fastapi.responses import RedirectResponse
from controller.auth import verifyPassword, createAccessToken, getCurrentUserFromCookie
from models import database as db
from controller import auth
from typing import Optional

router = APIRouter(tags=["auth"])

@router.post("/login")
async def login(email: str = Form(...), password: str = Form(...)):
    user = db.getUser(email)
    if not user:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="user not found")
    if not verifyPassword(password, user["password"]):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="incorrect password")
    del user["password"]  # Remove password before creating token
    token = createAccessToken(data={"sub": user["userId"], "user": user}, expires_delta=None)

    response = RedirectResponse(url="/", status_code=302)
    response.set_cookie(
        key="token",
        value=token,
        httponly=True,
        secure=True,  # ⚠️ Use False locally if needed
        samesite="Strict"
    )
    return response


@router.post("/register/")
def register(username: str = Form(...), email: str = Form(...), password: str = Form(...)):
    existing_user = db.getUser(email)
    if existing_user:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Email already registered")
    try:
        fname, lname = username.split(" ")
        hashed_password = auth.getPasswordHash(password)
        mess = db.createUser(fname, lname, email, hashed_password)
        print(mess)
        token = createAccessToken(data={"sub": mess["userId"], "user": {"email": email, "fname": fname, "lname": lname}}, expires_delta=None)
        response = RedirectResponse(url="/info", status_code=302)
        response.set_cookie(
            key="token",
            value=token,
            httponly=True,
            secure=False,  # ⚠️ Use False locally if needed
            samesite="Strict"
        )
        return response
    except Exception as e:
        return {"error": str(e)}

    
@router.put("/updateUser/")
async def updateUser(
    request: Request,
    data = Depends(getCurrentUserFromCookie),
    mobileNumber: str = Form(...),
    emergencyContactNumber: str = Form(...),
    birthDate: str = Form(...),
    city: str = Form(...),
    gender: str = Form(...),
    streetAddress: str = Form(...),
    state: str = Form(...),
    pinCode: str = Form(...),  # Changed to str for easier handling
    country: str = Form(...),
    bloodGroup: str = Form(...),
    medicalConditions: Optional[str] = Form(""),  # Optional with default
    allergies: Optional[str] = Form("")  # Optional with default
):
    # Validate token first
    if not data:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail="Not authenticated - No token provided"
        )
    
    # try:
    #     data = getCurrentUserFromCookie(token)
    # except Exception as e:
    #     raise HTTPException(
    #         status_code=status.HTTP_401_UNAUTHORIZED, 
    #         detail=f"Invalid token: {str(e)}"
    #     )
    
    user = data.get("user")
    sub = data.get("sub")
    
    if not user or not sub:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail="Not authenticated - Invalid user data"
        )

    # Validate mobile numbers
    if not mobileNumber or len(mobileNumber) != 10 or not mobileNumber.isdigit():
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Mobile number must be exactly 10 digits"
        )
    
    if emergencyContactNumber and (len(emergencyContactNumber) != 10 or not emergencyContactNumber.isdigit()):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Emergency contact number must be exactly 10 digits"
        )

    # Convert pinCode to int and validate
    try:
        pin_code_int = int(pinCode)
        if pin_code_int < 100000 or pin_code_int > 999999:
            raise ValueError("PIN code must be 6 digits")
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid PIN code: {str(e)}"
        )

    try:
        result = db.updateUser(
            userId=sub,
            mobileNumber=mobileNumber,
            gender=gender,
            bloodGroup=bloodGroup,
            emergencyContactNumber=emergencyContactNumber,
            allergies=allergies,
            medicalConditions=medicalConditions,
            birthDate=birthDate,
            streetAddress=streetAddress,
            city=city,
            state=state,
            pinCode=pin_code_int,  # Pass as int
            country=country
        )
        
        print(f"Update result: {result}")
        
        if "error" in result:
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
                detail=result["error"]
            )
        
        # Return JSON response instead of redirect for AJAX
        return {
            "success": True,
            "message": "User information updated successfully",
            "data": result
        }
        
    except HTTPException:
        raise  # Re-raise HTTP exceptions
    except Exception as e:
        print(f"Error updating user: {str(e)}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR, 
            detail=f"Failed to update user information: {str(e)}"
        )


@router.get("/info")
async def getUserInfo(token: str = Cookie(None)):
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail="Not authenticated - No token provided"
        )
    
    try:
        data = getCurrentUserFromCookie(token)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail=f"Invalid token: {str(e)}"
        )
    
    userId = data.get("sub")    
    if not userId:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail="Not authenticated - Invalid user data"
        )
    user_info = db.getUserForDashboard(userId)
    return user_info
@router.get("/me")
async def get_me(token: str = Cookie(None)):
    if not token:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail="Not authenticated - No token provided"
        )
    
    try:
        data = getCurrentUserFromCookie(token)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail=f"Invalid token: {str(e)}"
        )
    
    user = data.get("user")
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED, 
            detail="Not authenticated - Invalid user data"
        )
    
    return {
        "email": user.get("email"),
        "fname": user.get("fname"),
        "lname": user.get("lname"),
    }

@router.get("/logout")
async def logout():
    response = RedirectResponse(url="/", status_code=302)
    response.delete_cookie(key="token")
    return response

