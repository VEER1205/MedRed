from twilio.rest import Client
from twilio.twiml.voice_response import VoiceResponse
from twilio.base.exceptions import TwilioRestException
import os
from config import Settings
from dotenv import load_dotenv

load_dotenv()

class TwilioService:
    def __init__(self):
        self.account_sid =  os.getenv("TWILIO_SID") or Settings.TWILIO_SID
        self.auth_token = os.getenv("TWILIO_AUTH_TOKEN") or Settings.TWILIO_AUTH_TOKEN
        self.twilio_phone = os.getenv("TWILIO_PHONE_NUMBER") or Settings.TWILIO_PHONE_NUMBER

        if not all([self.account_sid, self.auth_token, self.twilio_phone]):
            print("⚠️ Warning: Twilio credentials not found in environment variables")
            self.client = None
        else:
            self.client = Client(self.account_sid, self.auth_token)
            print("✅ Twilio client initialized")
    
    def send_sms(self, to_phone: str, message: str) -> dict:
        """Send SMS to a phone number"""
        if not self.client:
            return {
                "success": False,
                "error": "Twilio not configured"
            }
        
        try:
            # Ensure phone number has country code
            if not to_phone.startswith('+'):
                to_phone = '+91' + to_phone.replace(' ', '')
            
            # Send SMS
            message_obj = self.client.messages.create(
                body=message,
                from_=self.twilio_phone,
                to=to_phone
            )
            
            print(f"✅ SMS sent! SID: {message_obj.sid}")
            
            return {
                "success": True,
                "sid": message_obj.sid,
                "status": message_obj.status,
                "to": to_phone
            }
            
        except TwilioRestException as e:
            print(f"❌ Twilio Error: {e.msg}")
            return {
                "success": False,
                "error": str(e),
                "code": e.code
            }
        except Exception as e:
            print(f"❌ Error sending SMS: {e}")
            return {
                "success": False,
                "error": str(e)
            }
    
    def send_medicine_reminder(self, to_phone: str, medicine_name: str, 
                               dosage: str, time: str) -> dict:
        """Send medicine reminder SMS"""
        message = f"""🔔 MedRed Reminder

Medicine: {medicine_name}
Dosage: {dosage}
Time: {time}

Don't forget to take your medicine!

- MedRed Team"""
        
        return self.send_sms(to_phone, message)
    
    def get_message_status(self, message_sid: str) -> dict:
        """Check the status of a sent message"""
        if not self.client:
            return {"success": False, "error": "Twilio not configured"}
        
        try:
            message = self.client.messages(message_sid).fetch()
            return {
                "success": True,
                "status": message.status,
                "to": message.to,
                "from": message.from_,
                "date_sent": str(message.date_sent),
                "error_code": message.error_code,
                "error_message": message.error_message
            }
        except Exception as e:
            return {
                "success": False,
                "error": str(e)
            }
    
    def make_call(self, to_phone: str, message: str) -> dict:
   
        if not self.client:
            return {"success": False, "error": "Twilio not configured"}

        try:
            # Ensure phone number has country code
            if not to_phone.startswith('+'):
                to_phone = '+91' + to_phone.replace(' ', '')

            # Make call using TwiML
            call = self.client.calls.create(
                to=to_phone,
                from_=self.twilio_phone,
                twiml=f'<Response><Say voice="alice">{message}</Say></Response>'
            )

            print(f"✅ Call initiated! SID: {call.sid}")
            return {
                "success": True,
                "sid": call.sid,
                "to": to_phone
            }
        except TwilioRestException as e:
            print(f"❌ Twilio Error: {e.msg}")
            return {"success": False, "error": str(e), "code": e.code}
        except Exception as e:
            print(f"❌ Error making call: {e}")
            return {"success": False, "error": str(e)}

    def send_medicine_reminder_call(self, to_phone: str, medicine_name: str, dosage: str, time: str) -> dict:
        if not self.client:
            return {"success": False, "error": "Twilio not configured"}
    
        try:
            if not to_phone.startswith('+'):
                to_phone = '+91' + to_phone.replace(' ', '')

        # Create a TwiML response
            response = VoiceResponse()
            response.say(
                f"Hello! This is your medicine reminder. "
                f"Please take {medicine_name}, dosage {dosage}, at {time}.",
                voice="alice"
            )

            # Make the call
            call = self.client.calls.create(
                twiml=response,
                to=to_phone,
                from_=self.twilio_phone
            )

            return {"success": True, "sid": call.sid, "status": call.status, "to": to_phone}

        except Exception as e:
            return {"success": False, "error": str(e)}



# Create singleton instance
twilio_service = TwilioService()