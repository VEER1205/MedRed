from fastapi import APIRouter, Cookie, HTTPException
from controller.auth import getCurrentUserFromCookie
from models import database as db
import datetime
from pydantic import BaseModel
from typing import List
from scheduler import (
    schedule_multiple_times_reminder,
    remove_reminder,
    list_all_jobs
)
from twilio_service import twilio_service

router = APIRouter(tags=["reminders"])

class ReminderRequest(BaseModel):
    medicineName: str
    dosage: str
    time: str

class MultipleReminderRequest(BaseModel):
    medicineName: str
    dosage: str
    times: List[str]

class TestSMSRequest(BaseModel):
    phone: str
    message: str

# ==================== GET REMINDERS ====================

@router.get("/")
async def get_reminders():
    """Get reminders for current time"""
    time = datetime.datetime.now().strftime("%H:%M")
    reminder = db.getReminders(time)
    return {"reminders": reminder}

@router.get("/user")
async def get_user_reminders(token: str = Cookie(None)):
    """Get all reminders for logged-in user"""
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    try:
        user = getCurrentUserFromCookie(token)
        reminders = db.getUserReminders(user["sub"])
        return {"reminders": reminders, "success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ==================== ADD REMINDER WITH SMS ====================

@router.post("/add")
async def add_reminder(reminder: ReminderRequest, token: str = Cookie(None)):
    """Add a reminder with SMS notification"""
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    try:
        user = getCurrentUserFromCookie(token)
        user_id = user["sub"]
        
        # Get user details
        user_details = db.getUserById(user_id)
        if not user_details:
            raise HTTPException(status_code=404, detail="User not found")
        
        mobile_number = user_details.get("mobileNumber")
        
        # Save reminder to database
        result = db.createReminder(
            user_id,
            reminder.medicineName,
            reminder.dosage,
            reminder.time
        )
        
        if not result.get("success"):
            raise HTTPException(status_code=500, detail=result.get("msg", "Failed to create reminder"))
        
        reminder_id = result.get("reminderId")
        
        # Schedule SMS if phone number exists
        job_ids = []
        sms_scheduled = False
        
        if mobile_number:
            try:
                job_ids = schedule_multiple_times_reminder(
                    reminder_id=reminder_id,
                    user_id=user_id,
                    user_phone=str(mobile_number),
                    medicine_name=reminder.medicineName,
                    dosage=reminder.dosage,
                    times_list=[reminder.time]
                )
                sms_scheduled = True
                
                # Send confirmation SMS
                twilio_service.send_sms(
                    to_phone=str(mobile_number),
                    message=f"✅ Reminder created!\n\nMedicine: {reminder.medicineName}\nDosage: {reminder.dosage}\nTime: {reminder.time}\n\nYou'll receive SMS reminders."
                )
            except Exception as sms_error:
                print(f"⚠️ SMS scheduling failed: {sms_error}")
        
        return {
            "success": True,
            "message": "Reminder added successfully",
            "reminder_id": reminder_id,
            "sms_scheduled": sms_scheduled,
            "job_ids": job_ids
        }
        
    except HTTPException as he:
        raise he
    except Exception as e:
        print(f"Error adding reminder: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ==================== DELETE REMINDER ====================

@router.delete("/delete/{reminderId}")
async def delete_reminder(reminderId: str, token: str = Cookie(None)):
    """Delete reminder and cancel scheduled SMS"""
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    try:
        user = getCurrentUserFromCookie(token)
        
        # Get reminder details
        reminder_details = db.getReminderById(reminderId)
        
        # Remove scheduled jobs (try multiple formats)
        jobs_removed = 0
        for i in range(10):
            if remove_reminder(f"reminder_{reminderId}_{i}"):
                jobs_removed += 1
        
        # Delete from database
        result = db.deleteReminder(reminderId)
        
        # Send confirmation SMS
        user_details = db.getUserById(user["sub"])
        if user_details and user_details.get("mobileNumber"):
            try:
                twilio_service.send_sms(
                    to_phone=str(user_details["mobileNumber"]),
                    message=f"❌ Reminder deleted\n\nMedicine: {reminder_details.get('medicineName', 'N/A') if reminder_details else 'N/A'}\n\nSMS notifications cancelled."
                )
            except Exception as sms_error:
                print(f"⚠️ Confirmation SMS failed: {sms_error}")
        
        return {
            "success": True,
            "message": "Reminder deleted successfully",
            "jobs_removed": jobs_removed,
            "result": result
        }
        
    except Exception as e:
        print(f"Error deleting reminder: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ==================== UPDATE REMINDER ====================

@router.put("/update/{reminderId}")
async def update_reminder(
    reminderId: str,
    reminder: ReminderRequest,
    token: str = Cookie(None)
):
    """Update reminder and reschedule SMS"""
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    try:
        user = getCurrentUserFromCookie(token)
        user_id = user["sub"]
        
        # Get user details
        user_details = db.getUserById(user_id)
        
        # Remove old scheduled jobs
        for i in range(10):
            remove_reminder(f"reminder_{reminderId}_{i}")
        
        # Update in database
        result = db.updateReminder(
            reminderId,
            reminder.medicineName,
            reminder.dosage,
            reminder.time
        )
        
        if not result.get("success"):
            raise HTTPException(status_code=500, detail=result.get("msg"))
        
        # Reschedule with new time
        if user_details and user_details.get("mobileNumber"):
            try:
                schedule_multiple_times_reminder(
                    reminder_id=reminderId,
                    user_id=user_id,
                    user_phone=str(user_details["mobileNumber"]),
                    medicine_name=reminder.medicineName,
                    dosage=reminder.dosage,
                    times_list=[reminder.time]
                )
                
                # Send confirmation SMS
                twilio_service.send_sms(
                    to_phone=str(user_details["mobileNumber"]),
                    message=f"✏️ Reminder updated!\n\nMedicine: {reminder.medicineName}\nDosage: {reminder.dosage}\nNew time: {reminder.time}"
                )

                twilio_service.send_medicine_reminder_call(
                    to_phone=str(user_details["mobileNumber"]),
                    medicine_name=reminder.medicineName,
                    dosage=reminder.dosage,
                    time=reminder.time
            )
            except Exception as sms_error:
                print(f"⚠️ SMS rescheduling failed: {sms_error}")
        
        return {
            "success": True,
            "message": "Reminder updated successfully",
            "result": result
        }
        
    except Exception as e:
        print(f"Error updating reminder: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ==================== TEST ENDPOINTS ====================

@router.post("/test-sms")
async def test_sms(data: TestSMSRequest, token: str = Cookie(None)):
    """Test SMS sending"""
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    result = twilio_service.send_sms(data.phone, data.message)
    return result

@router.post("/test-reminder-sms")
async def test_reminder_sms(token: str = Cookie(None)):
    """Send test reminder SMS to logged-in user"""
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    try:
        user = getCurrentUserFromCookie(token)
        user_details = db.getUserById(user["sub"])
        
        if not user_details or not user_details.get("mobileNumber"):
            raise HTTPException(status_code=400, detail="Phone number not found")
        
        result = twilio_service.send_medicine_reminder(
            to_phone=str(user_details["mobileNumber"]),
            medicine_name="Test Medicine",
            dosage="100mg",
            time=datetime.datetime.now().strftime("%H:%M")
        )
        
        return {
            "success": result.get("success", False),
            "message": "Test SMS sent" if result.get("success") else "Failed to send SMS",
            "result": result
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/scheduled")
async def get_scheduled_jobs(token: str = Cookie(None)):
    """Get all scheduled SMS jobs"""
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    jobs = list_all_jobs()
    return {
        "success": True,
        "count": len(jobs),
        "jobs": jobs
    }