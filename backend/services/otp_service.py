import random
import os

OTP_PROVIDER = os.getenv("OTP_PROVIDER", "MOCK")

def generate_otp(identity_value: str) -> str:
    """Generates a 6-digit OTP"""
    return str(random.randint(100000, 999999))

def send_otp(identity_value: str, otp: str):
    """
    Sends the OTP using the configured provider.
    Supports MOCK for simulation.
    """
    if OTP_PROVIDER == "MOCK":
        print(f"[MOCK OTP] Sending OTP {otp} to {identity_value}")
        return {"status": "success", "provider": "mock"}
    elif OTP_PROVIDER == "TWILIO":
        # Placeholder for Twilio integration
        print(f"[TWILIO] Sending OTP {otp} to {identity_value}")
        return {"status": "success", "provider": "twilio"}
    else:
        raise ValueError(f"Unknown OTP provider: {OTP_PROVIDER}")
