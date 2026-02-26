from fastapi import APIRouter, Depends, HTTPException
from typing import List
import random
import string
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import os
from database import get_db
from models.database_models import AadhaarProfile, PANProfile, OTPLog, AuditLog, User
from models.schemas import AadhaarCreate, AadhaarResponse, PANCreate, PANResponse, OTPRequest, OTPVerifyRequest
from services.otp_service import generate_otp, send_otp

from routers.auth import get_current_admin

router = APIRouter()

ENVIRONMENT = os.getenv("ENVIRONMENT", "PROD")

@router.get("/aadhaar/{aadhaar_number}", response_model=AadhaarResponse)
def get_aadhaar_by_number(aadhaar_number: str, db: Session = Depends(get_db), current_admin: User = Depends(get_current_admin)):
    profile = db.query(AadhaarProfile).filter(AadhaarProfile.aadhaar_number == aadhaar_number).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Aadhaar profile not found")
    return profile

@router.get("/search/aadhaar", response_model=List[AadhaarResponse])
def search_aadhaar(query: str, unlinked_pan: bool = False, db: Session = Depends(get_db), current_admin: User = Depends(get_current_admin)):
    search_query = db.query(AadhaarProfile).filter(AadhaarProfile.name.ilike(f"%{query}%"))
    
    if unlinked_pan:
        # Get IDs of all Aadhaar profiles that have a linked PAN
        linked_ids = db.query(PANProfile.aadhaar_id).all()
        linked_ids_list = [r[0] for r in linked_ids]
        search_query = search_query.filter(AadhaarProfile.id.notin_(linked_ids_list))
        
    return search_query.limit(20).all()

@router.get("/pan/{pan_number}", response_model=PANResponse)
def get_pan_by_number(pan_number: str, db: Session = Depends(get_db), current_admin: User = Depends(get_current_admin)):
    profile = db.query(PANProfile).filter(PANProfile.pan_number == pan_number).first()
    if not profile:
        raise HTTPException(status_code=404, detail="PAN profile not found")
    return profile

@router.post("/aadhaar", response_model=AadhaarResponse)
def create_aadhaar(aadhaar: AadhaarCreate, db: Session = Depends(get_db), current_admin: User = Depends(get_current_admin)):
    # Verify OTP first
    otp_log = db.query(OTPLog).filter(
        OTPLog.identity_type == "PHONE",
        OTPLog.identity_value == aadhaar.phone,
        OTPLog.verified == True,
        OTPLog.is_used == False
    ).order_by(OTPLog.expiry_time.desc()).first()
    
    if not otp_log:
        raise HTTPException(status_code=400, detail="Phone number not verified via OTP or OTP already used")

    db_aadhaar = db.query(AadhaarProfile).filter(AadhaarProfile.phone == aadhaar.phone).first()
    if db_aadhaar:
        raise HTTPException(status_code=400, detail="Phone already registered to an Aadhaar")
    
    # Generate 12-digit unique Aadhaar
    while True:
        first_digit = str(random.randint(1, 9))
        remaining = ''.join(random.choices(string.digits, k=11))
        new_number = first_digit + remaining
        if not db.query(AadhaarProfile).filter(AadhaarProfile.aadhaar_number == new_number).first():
            break

    try:
        new_aadhaar = AadhaarProfile(
            name=aadhaar.name,
            aadhaar_number=new_number,
            phone=aadhaar.phone,
            email=aadhaar.email,
            address=aadhaar.address,
            photo_url=aadhaar.photo_url,
            blacklist_flag=False,
            kyc_status="VERIFIED"
        )
        db.add(new_aadhaar)
        
        # Mark OTP as used
        otp_log.is_used = True
        
        db.flush() # flush to get generated ID
        
        audit_entry = AuditLog(
            actor="ADMIN",
            action="CREATE_AADHAAR",
            entity="AadhaarProfile",
            entity_id=new_aadhaar.id
        )
        db.add(audit_entry)
        
        # Atomic commit
        db.commit()
        db.refresh(new_aadhaar)
        return new_aadhaar
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Atomic transaction failed: {str(e)}")

@router.post("/pan", response_model=PANResponse)
def create_pan(pan: PANCreate, db: Session = Depends(get_db), current_admin: User = Depends(get_current_admin)):
    db_aadhaar = db.query(AadhaarProfile).filter(AadhaarProfile.aadhaar_number == pan.aadhaar_number).first()
    if not db_aadhaar:
        raise HTTPException(status_code=404, detail="Aadhaar not found")
        
    db_pan = db.query(PANProfile).filter(PANProfile.aadhaar_id == db_aadhaar.id).first()
    if db_pan:
        raise HTTPException(status_code=400, detail="PAN already linked to this Aadhaar")

    # Verify OTP first
    otp_log = db.query(OTPLog).filter(
        OTPLog.identity_type == "PHONE", # For PAN, we sent OTP to the registered phone
        OTPLog.identity_value == db_aadhaar.phone,
        OTPLog.verified == True,
        OTPLog.is_used == False
    ).order_by(OTPLog.expiry_time.desc()).first()
    
    if not otp_log:
        raise HTTPException(status_code=400, detail="Aadhaar not verified via OTP or OTP used")

    # Generate format: ABCDE1234F
    while True:
        letters1 = ''.join(random.choices(string.ascii_uppercase, k=5))
        digits = ''.join(random.choices(string.digits, k=4))
        letter2 = random.choice(string.ascii_uppercase)
        new_pan = letters1 + digits + letter2
        
        if not db.query(PANProfile).filter(PANProfile.pan_number == new_pan).first():
            break

    try:
        new_pan_record = PANProfile(
            pan_number=new_pan,
            aadhaar_id=db_aadhaar.id,
            is_linked=True,
            photo_url=pan.photo_url
        )
        db.add(new_pan_record)
        
        otp_log.is_used = True
        
        db.flush()
        
        audit_entry = AuditLog(
            actor="ADMIN",
            action="CREATE_PAN",
            entity="PANProfile",
            entity_id=new_pan_record.id
        )
        db.add(audit_entry)
        
        db.commit()
        db.refresh(new_pan_record)
        return new_pan_record
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Atomic transaction failed: {str(e)}")

@router.post("/generate-otp")
def request_otp(req: OTPRequest, db: Session = Depends(get_db)):
    otp = generate_otp(req.identity_value)
    
    # In DEV mode, return the OTP so the user can easily copy it from Swagger UI/Console
    dev_otp = otp if ENVIRONMENT == "DEV" else None
    
    # Save to db
    expiry = datetime.utcnow() + timedelta(minutes=5)
    otp_log = OTPLog(
        identity_type=req.identity_type,
        identity_value=req.identity_value,
        otp=otp,
        expiry_time=expiry
    )
    db.add(otp_log)
    db.commit()
    
    send_otp(req.identity_value, otp)
    
    response = {
        "message": f"OTP sent to {req.identity_type} {req.identity_value}",
        "expires_in": "5 minutes"
    }
    
    if dev_otp:
        response["dev_otp"] = dev_otp
        
    return response

@router.post("/verify-otp")
def verify_otp_endpoint(req: OTPVerifyRequest, db: Session = Depends(get_db)):
    otp_log = db.query(OTPLog).filter(
        OTPLog.identity_type == req.identity_type,
        OTPLog.identity_value == req.identity_value,
        OTPLog.verified == False,
        OTPLog.is_used == False,
        OTPLog.expiry_time > datetime.utcnow()
    ).order_by(OTPLog.expiry_time.desc()).first()
    
    if not otp_log:
        raise HTTPException(status_code=400, detail="Invalid, used, or expired OTP")
        
    if otp_log.otp != req.otp:
        otp_log.attempt_count += 1
        db.commit()
        raise HTTPException(status_code=400, detail="Incorrect OTP")
        
    otp_log.verified = True
    db.commit()
    
    # Find associated identity details (but keep masked depending on requirements)
    # For now, just return verified status
    
    return {
        "verified": True,
        "message": "Identity successfully verified via OTP",
        "identity": req.identity_value
    }
