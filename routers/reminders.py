from fastapi import APIRouter, Cookie, HTTPException
from controller.auth import getCurrentUserFromCookie
from models import database as db
import datetime
from pydantic import BaseModel
from typing import List, Optional
from scheduler import (
    schedule_multiple_times_reminder,
    remove_reminder,
    list_all_jobs
)
from twilio_service import twilio_service

router = APIRouter(tags=["reminders"])

# Define request models
class ReminderRequest(BaseModel):
    medicineName: str
    dosage: str
    time: str  # Single time: "08:00"

class MultipleReminderRequest(BaseModel):
    medicineName: str
    dosage: str
    times: List[str]  # Multiple times: ["08:00", "14:00", "20:00"]

class TestSMSRequest(BaseModel):
    phone: str
    message: str

# ==================== EXISTING ENDPOINTS ====================

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
    
    user = getCurrentUserFromCookie(token)
    reminders = db.getUserReminders(user["sub"])
    return {"reminders": reminders}

# ==================== ENHANCED ADD REMINDER WITH SMS ====================

@router.post("/add")
async def add_reminder(reminder: ReminderRequest, token: str = Cookie(None)):
    """
    Add a single reminder with SMS notification
    """
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    try:
        user = getCurrentUserFromCookie(token)
        user_id = user["sub"]
        
        # Get user details (phone number)
        user_details = db.getUserById(user_id)
        if not user_details or not user_details.get("mobileNumber"):
            raise HTTPException(status_code=400, detail="User phone number not found")
        
        # Save reminder to database
        result = db.createReminder(
            user_id, 
            reminder.medicineName, 
            reminder.dosage, 
            reminder.time
        )
        
        # Get the reminder ID from result
        reminder_id = result.get("reminderId") or result.get("id")
        
        if not reminder_id:
            raise HTTPException(status_code=500, detail="Failed to create reminder")
        
        # Schedule SMS notification
        job_id = schedule_multiple_times_reminder(
            reminder_id=reminder_id,
            user_id=user_id,
            user_phone=user_details["mobileNumber"],
            medicine_name=reminder.medicineName,
            dosage=reminder.dosage,
            times_list=[reminder.time]
        )
        
        # Send confirmation SMS
        confirmation_result = twilio_service.send_sms(
            to_phone=user_details["mobileNumber"],
            message=f"✅ Reminder created!\n\nMedicine: {reminder.medicineName}\nDosage: {reminder.dosage}\nTime: {reminder.time}\n\nYou'll receive SMS reminders at scheduled times."
        )
        
        return {
            "success": True,
            "message": "Reminder added successfully with SMS notifications",
            "reminder": result,
            "job_id": job_id[0] if isinstance(job_id, list) else job_id,
            "sms_sent": confirmation_result.get("success", False)
        }
        
    except HTTPException as he:
        raise he
    except Exception as e:
        print(f"Error adding reminder: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to add reminder: {str(e)}")

# ==================== ADD MULTIPLE TIME REMINDERS ====================

@router.post("/add-multiple")
async def add_multiple_reminders(reminder: MultipleReminderRequest, token: str = Cookie(None)):
    """
    Add a reminder with multiple times (e.g., 3 times a day)
    """
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    try:
        user = getCurrentUserFromCookie(token)
        user_id = user["sub"]
        
        # Get user details
        user_details = db.getUserById(user_id)
        if not user_details or not user_details.get("mobileNumber"):
            raise HTTPException(status_code=400, detail="User phone number not found")
        
        # Save each reminder to database
        reminder_ids = []
        for time in reminder.times:
            result = db.createReminder(
                user_id,
                reminder.medicineName,
                reminder.dosage,
                time
            )
            reminder_id = result.get("reminderId") or result.get("id")
            reminder_ids.append(reminder_id)
        
        # Schedule all SMS notifications
        job_ids = schedule_multiple_times_reminder(
            reminder_id=reminder_ids[0],  # Use first reminder ID as base
            user_id=user_id,
            user_phone=user_details["mobileNumber"],
            medicine_name=reminder.medicineName,
            dosage=reminder.dosage,
            times_list=reminder.times
        )
        
        # Send confirmation SMS
        times_str = ", ".join(reminder.times)
        twilio_service.send_sms(
            to_phone=user_details["mobileNumber"],
            message=f"✅ Multiple reminders created!\n\nMedicine: {reminder.medicineName}\nDosage: {reminder.dosage}\nTimes: {times_str}\n\nYou'll receive {len(reminder.times)} SMS reminders daily."
        )
        
        return {
            "success": True,
            "message": f"Created {len(reminder.times)} reminders with SMS notifications",
            "reminder_ids": reminder_ids,
            "job_ids": job_ids,
            "times": reminder.times
        }
        
    except Exception as e:
        print(f"Error adding multiple reminders: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ==================== DELETE REMINDER ====================

@router.delete("/delete/{reminderId}")
async def delete_reminder(reminderId: str, token: str = Cookie(None)):
    """
    Delete reminder and cancel scheduled SMS
    """
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    try:
        user = getCurrentUserFromCookie(token)
        
        # Get reminder details before deleting
        reminder_details = db.getReminderById(reminderId)
        
        if not reminder_details:
            raise HTTPException(status_code=404, detail="Reminder not found")
        
        # Remove scheduled job(s)
        # Try to remove job with different possible formats
        job_removed = False
        for i in range(10):  # Try up to 10 possible job IDs
            job_id = f"reminder_{reminderId}_{i}"
            if remove_reminder(job_id):
                job_removed = True
        
        # Also try single job ID format
        if remove_reminder(f"daily_reminder_{reminderId}"):
            job_removed = True
        
        # Delete from database
        result = db.deleteReminder(reminderId)
        
        # Send confirmation SMS
        user_details = db.getUserById(user["sub"])
        if user_details and user_details.get("mobileNumber"):
            twilio_service.send_sms(
                to_phone=user_details["mobileNumber"],
                message=f"❌ Reminder deleted\n\nMedicine: {reminder_details.get('medicineName', 'N/A')}\n\nSMS notifications have been cancelled."
            )
        
        return {
            "success": True,
            "message": "Reminder deleted successfully",
            "job_removed": job_removed,
            "result": result
        }
        
    except HTTPException as he:
        raise he
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
    """
    Update reminder and reschedule SMS
    """
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    try:
        user = getCurrentUserFromCookie(token)
        user_id = user["sub"]
        
        # Get user details
        user_details = db.getUserById(user_id)
        if not user_details or not user_details.get("mobileNumber"):
            raise HTTPException(status_code=400, detail="User phone number not found")
        
        # Remove old scheduled job
        for i in range(10):
            remove_reminder(f"reminder_{reminderId}_{i}")
        remove_reminder(f"daily_reminder_{reminderId}")
        
        # Update in database
        result = db.updateReminder(
            reminderId,
            reminder.medicineName,
            reminder.dosage,
            reminder.time
        )
        
        # Reschedule with new time
        job_id = schedule_multiple_times_reminder(
            reminder_id=reminderId,
            user_id=user_id,
            user_phone=user_details["mobileNumber"],
            medicine_name=reminder.medicineName,
            dosage=reminder.dosage,
            times_list=[reminder.time]
        )
        
        # Send confirmation SMS
        twilio_service.send_sms(
            to_phone=user_details["mobileNumber"],
            message=f"✏️ Reminder updated!\n\nMedicine: {reminder.medicineName}\nDosage: {reminder.dosage}\nNew time: {reminder.time}"
        )
        
        return {
            "success": True,
            "message": "Reminder updated successfully",
            "result": result,
            "job_id": job_id
        }
        
    except Exception as e:
        print(f"Error updating reminder: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# ==================== GET SCHEDULED JOBS ====================

@router.get("/scheduled")
async def get_scheduled_jobs(token: str = Cookie(None)):
    """
    Get all scheduled SMS jobs
    """
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    try:
        jobs = list_all_jobs()
        return {
            "success": True,
            "count": len(jobs),
            "jobs": jobs
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ==================== TEST SMS ====================

@router.post("/test-sms")
async def test_sms(data: TestSMSRequest, token: str = Cookie(None)):
    """
    Test SMS sending (for development/testing)
    """
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    try:
        result = twilio_service.send_sms(data.phone, data.message)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ==================== SEND TEST REMINDER SMS ====================

@router.post("/test-reminder-sms")
async def test_reminder_sms(token: str = Cookie(None)):
    """
    Send a test reminder SMS to logged-in user
    """
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    try:
        user = getCurrentUserFromCookie(token)
        user_details = db.getUserById(user["sub"])
        
        if not user_details or not user_details.get("mobileNumber"):
            raise HTTPException(status_code=400, detail="User phone number not found")
        
        result = twilio_service.send_medicine_reminder(
            to_phone=user_details["mobileNumber"],
            medicine_name="Test Medicine",
            dosage="100mg",
            time=datetime.datetime.now().strftime("%H:%M")
        )
        
        return {
            "success": result.get("success", False),
            "message": "Test SMS sent",
            "result": result
        }
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# ==================== GET SMS STATUS ====================

@router.get("/sms-status/{message_sid}")
async def get_sms_status(message_sid: str, token: str = Cookie(None)):
    """
    Check the delivery status of a sent SMS
    """
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    
    try:
        result = twilio_service.get_message_status(message_sid)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))