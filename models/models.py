from pydantic import BaseModel
from fastapi import Form, Depends
from controller.auth import getCurrentUserFromCookie
from typing import Optional

class UserLogin(BaseModel):
    email: str
    password: str

class Info(BaseModel):
    mobileNumber: str = Form(...),
    emergencyContactNumber: str = Form(...),
    birthDate: str = Form(...),
    city: str = Form(...),
    gender: str = Form(...),
    streetAddress: str = Form(...),
    state: str = Form(...),
    pinCode: str = Form(...),  
    country: str = Form(...),
    bloodGroup: str = Form(...),
    medicalConditions: Optional[str] = Form(""),
    allergies: Optional[str] = Form("") 
    

