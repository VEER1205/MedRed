from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
import pytz
from twilio_service import twilio_service
from models import database as db

# Initialize scheduler
scheduler = BackgroundScheduler(timezone=pytz.timezone('Asia/Kolkata'))

def start_scheduler():
    """Start the scheduler"""
    if not scheduler.running:
        scheduler.start()
        print("✅ Scheduler started successfully!")

def shutdown_scheduler():
    """Shutdown the scheduler"""
    if scheduler.running:
        scheduler.shutdown()
        print("⏹️ Scheduler stopped!")

def send_reminder_notification(user_id: str, user_phone: str, medicine_name: str, 
                               dosage: str, time: str):
    """
    Send reminder notification via SMS
    """
    print(f"🔔 Sending reminder to user {user_id}: {medicine_name} - {dosage}")
    
    try:
        # Send SMS via Twilio
        result = twilio_service.send_medicine_reminder(
            to_phone=user_phone,
            medicine_name=medicine_name,
            dosage=dosage,
            time=time
        )
        
        if result['success']:
            print(f"✅ SMS sent successfully to {user_phone}")
        else:
            print(f"❌ Failed to send SMS: {result.get('error')}")
        
        return result
    except Exception as e:
        print(f"❌ Error in send_reminder_notification: {e}")
        return {"success": False, "error": str(e)}

def schedule_multiple_times_reminder(reminder_id: str, user_id: str, user_phone: str,
                                     medicine_name: str, dosage: str, times_list: list):
    """
    Schedule a reminder at multiple times per day
    times_list: ["08:00", "14:00", "20:00"]
    """
    job_ids = []
    
    for i, time_str in enumerate(times_list):
        try:
            hour, minute = map(int, time_str.split(':'))
            job_id = f"reminder_{reminder_id}_{i}"
            
            scheduler.add_job(
                func=send_reminder_notification,
                trigger=CronTrigger(hour=hour, minute=minute),
                args=[user_id, user_phone, medicine_name, dosage, time_str],
                id=job_id,
                replace_existing=True,
                name=f"{medicine_name} at {time_str}"
            )
            
            job_ids.append(job_id)
            print(f"✅ Scheduled reminder {job_id} at {time_str}")
        except Exception as e:
            print(f"❌ Error scheduling reminder {job_id}: {e}")
    
    return job_ids

def remove_reminder(job_id: str):
    """Remove a scheduled job"""
    try:
        scheduler.remove_job(job_id)
        print(f"❌ Removed reminder {job_id}")
        return True
    except Exception as e:
        print(f"⚠️ Error removing job {job_id}: {e}")
        return False

def list_all_jobs():
    """Get all scheduled jobs"""
    jobs = scheduler.get_jobs()
    return [
        {
            "id": job.id,
            "name": job.name,
            "next_run_time": job.next_run_time.strftime("%Y-%m-%d %H:%M:%S") if job.next_run_time else None
        }
        for job in jobs
    ]

def load_existing_reminders():
    """Load all existing reminders from database on startup"""
    try:
        reminders = db.getAllActiveReminders()
        print(f"📋 Loading {len(reminders)} existing reminders...")
        
        for reminder in reminders:
            schedule_multiple_times_reminder(
                reminder_id=reminder["reminderId"],
                user_id=reminder["userId"],
                user_phone=reminder["mobileNumber"],
                medicine_name=reminder["medicineName"],
                dosage=reminder["dosage"],
                times_list=[reminder["time"]]
            )
        
        print(f"✅ Successfully loaded {len(reminders)} reminders!")
        return len(reminders)
    except Exception as e:
        print(f"⚠️ Error loading existing reminders: {e}")
        return 0