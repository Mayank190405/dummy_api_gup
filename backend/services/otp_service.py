import random
import os
import requests

OTP_PROVIDER = os.getenv("OTP_PROVIDER", "MOCK")

def generate_otp(identity_value: str) -> str:
    """Generates a 6-digit OTP"""
    return str(random.randint(100000, 999999))

def send_otp(identity_value: str, otp: str):
    """
    Sends the OTP using the configured provider.
    Supports MOCK, TWILIO, and AUTOMATEX.
    """
    if OTP_PROVIDER == "MOCK":
        print(f"[MOCK OTP] Sending OTP {otp} to {identity_value}")
        return {"status": "success", "provider": "mock"}
    elif OTP_PROVIDER == "TWILIO":
        # Placeholder for Twilio integration
        print(f"[TWILIO] Sending OTP {otp} to {identity_value}")
        return {"status": "success", "provider": "twilio"}
    elif OTP_PROVIDER == "AUTOMATEX":
        api_token = os.getenv("AUTOMATEX_API_TOKEN")
        phone_id = os.getenv("AUTOMATEX_PHONE_NUMBER_ID")
        template_id = os.getenv("AUTOMATEX_TEMPLATE_ID")
        
        url = "https://automatexindia.com/api/v1/whatsapp/send/template"
        payload = {
            "apiToken": api_token,
            "phone_number_id": phone_id,
            "template_id": template_id,
            "templateVariable-calling-1": otp,
            "phone_number": identity_value
        }
        
        try:
            print(f"[AUTOMATEX] Sending OTP {otp} to {identity_value} via WhatsApp...")
            response = requests.post(url, data=payload)
            response.raise_for_status()
            return {"status": "success", "provider": "automatex", "data": response.json()}
        except Exception as e:
            print(f"[AUTOMATEX ERROR] {str(e)}")
            return {"status": "error", "message": str(e)}
    else:
        raise ValueError(f"Unknown OTP provider: {OTP_PROVIDER}")
