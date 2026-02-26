from fastapi import APIRouter, Depends, HTTPException, Header, Request
from fastapi.responses import JSONResponse
import hmac
import hashlib
import time
import json
from sqlalchemy.orm import Session
from database import get_db
from models.database_models import ExternalConsumer
from models.schemas import VerificationCheckRequest
from routers.verification import verify_full_check
import secrets

router = APIRouter()

@router.post("/generate-keys")
def generate_api_keys(name: str, db: Session = Depends(get_db)):
    # Generate secure random strings
    api_key = f"api_{secrets.token_hex(16)}"
    secret = f"sec_{secrets.token_hex(24)}"
    
    consumer = ExternalConsumer(
        name=name,
        api_key=api_key,
        webhook_secret=secret
    )
    db.add(consumer)
    db.commit()
    db.refresh(consumer)
    
    return {
        "api_key": api_key,
        "webhook_secret": secret
    }

def verify_hmac(request_body: bytes, timestamp: str, secret: str, signature: str):
    try:
        # Prevent replay attacks > 60 seconds
        if abs(int(time.time()) - int(timestamp)) > 60:
            raise HTTPException(status_code=401, detail="Request expired (Timestamp > 60s window)")
    except ValueError:
        raise HTTPException(status_code=400, detail="Invalid timestamp format")
    
    msg = f"{timestamp}.".encode() + request_body
    expected_signature = hmac.new(
        secret.encode(),
        msg,
        hashlib.sha256
    ).hexdigest()
    
    # Constant time compare for security
    if not hmac.compare_digest(expected_signature, signature):
        raise HTTPException(status_code=401, detail="Invalid HMAC signature")

@router.post("/v1/credit-evaluate")
async def evaluate_credit(
    request: Request,
    x_api_key: str = Header(..., alias="X-API-KEY"),
    x_timestamp: str = Header(..., alias="X-TIMESTAMP"),
    x_signature: str = Header(..., alias="X-SIGNATURE"),
    db: Session = Depends(get_db)
):
    consumer = db.query(ExternalConsumer).filter(ExternalConsumer.api_key == x_api_key).first()
    if not consumer:
        raise HTTPException(status_code=401, detail="Invalid X-API-KEY")
        
    body = await request.body()
    verify_hmac(body, x_timestamp, consumer.webhook_secret, x_signature)
    
    try:
        data = json.loads(body)
        verify_req = VerificationCheckRequest(**data)
    except Exception as e:
        raise HTTPException(status_code=400, detail="Invalid JSON body or missing fields")
        
    return verify_full_check(verify_req, db)
