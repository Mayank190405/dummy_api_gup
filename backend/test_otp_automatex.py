import os
import sys
from dotenv import load_dotenv

# Add the current directory to sys.path so we can import from services
sys.path.append(os.path.join(os.getcwd(), "backend"))

load_dotenv(dotenv_path="backend/.env")

from backend.services.otp_service import generate_otp, send_otp

def test_otp_flow():
    print(f"Current OTP_PROVIDER: {os.getenv('OTP_PROVIDER')}")
    
    test_phone = "919876543210" # Example phone number
    otp = generate_otp(test_phone)
    print(f"Generated OTP: {otp}")
    
    print("Testing send_otp (this will attempt a real API call if configured)...")
    # result = send_otp(test_phone, otp)
    # print(f"Result: {result}")
    print("Test script ready. Uncomment the send_otp call to perform a real test.")

if __name__ == "__main__":
    test_otp_flow()
