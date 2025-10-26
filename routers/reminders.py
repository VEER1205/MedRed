from fastapi import APIRouter, Cookie, Body
from controller.auth import getCurrentUserFromCookie
from models import database as db
import datetime
from pydantic import BaseModel

router = APIRouter(tags=["reminders"])

# Define request model
class ReminderRequest(BaseModel):
    medicineName: str
    dosage: str
    time: str

@router.get("/")
async def get_reminders():
    time = datetime.datetime.now().strftime("%H:%M")
    reminder = db.getReminders(time)
    return {"reminders": reminder}

@router.post("/add")
async def add_reminder(reminder: ReminderRequest, token: str = Cookie(None)):
    user = getCurrentUserFromCookie(token)
    mess = db.createReminder(user["sub"], reminder.medicineName, reminder.dosage, reminder.time)
    return mess

@router.get("/user")
async def get_user_reminders(token: str = Cookie(None)):
    user = getCurrentUserFromCookie(token)
    reminders = db.getUserReminders(user["sub"])
    return {"reminders": reminders}

@router.delete("/delete/{reminderId}")
async def delete_reminder(reminderId: str, token: str = Cookie(None)):
    user = getCurrentUserFromCookie(token)
    mess = db.deleteReminder(reminderId)
    return mess