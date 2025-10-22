from fastapi import APIRouter, Depends, HTTPException, Request, status, Response, Cookie, Form, Body
from fastapi.responses import RedirectResponse
from controller.auth import verifyPassword, createAccessToken, getCurrentUserFromCookie
from models import database as db
import datetime


router = APIRouter()

@router.get("/reminders/")
async def get_reminders():
    time = datetime.datetime.now().strftime("%H:%M")
    reminder = db.getReminders(time)
    return {"reminders": reminder}

@router.post("/reminders/add")
async def add_reminder(medicineName: str, dosage: str, time: str,token: str = Cookie(None)):
    user = getCurrentUserFromCookie(token)
    mess =  db.createReminder(user["sub"], medicineName, dosage, time)
    return mess

@router.get("/reminders/user")
async def get_user_reminders(token: str = Cookie(None)):
    user = getCurrentUserFromCookie(token)
    reminders = db.getUserReminders(user["sub"])
    return {"reminders": reminders}

@router.delete("/reminders/delete/{reminderId}")
async def delete_reminder(reminderId: str, token: str = Cookie(None)):
    user = getCurrentUserFromCookie(token)
    mess = db.deleteReminder(reminderId)
    return mess