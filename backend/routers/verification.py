from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from datetime import datetime
from database import get_db
from models.database_models import AadhaarProfile, PANProfile, GSTCompany, Invoice, GSTReturn, VerificationLog, OTPLog, AuditLog
from models.schemas import VerificationCheckRequest
from services.credit_engine import calculate_owner_score, calculate_company_score, calculate_transaction_score, calculate_final_credit_score

router = APIRouter()

@router.post("/full-check")
def verify_full_check(request: VerificationCheckRequest, db: Session = Depends(get_db)):
    
    # 1. Verification of identity & linkage
    db_aadhaar = db.query(AadhaarProfile).filter(AadhaarProfile.aadhaar_number == request.aadhaar_number).first()
    
    # Secure OTP Check
    otp_log = db.query(OTPLog).filter(
        OTPLog.identity_type == "AADHAAR",
        OTPLog.identity_value == request.aadhaar_number,
        OTPLog.verified == True
    ).order_by(OTPLog.expiry_time.desc()).first()
    
    if not otp_log:
        raise HTTPException(status_code=400, detail="Aadhaar OTP verification is required before full check")

    db_pan = db.query(PANProfile).filter(PANProfile.pan_number == request.pan_number).first()
    db_gst = db.query(GSTCompany).filter(GSTCompany.gst_number == request.gst_number).first()
    
    identity_verified = False
    pan_linked = False
    blacklist_flag = False
    
    if db_aadhaar:
        identity_verified = (db_aadhaar.kyc_status == "VERIFIED")
        blacklist_flag = db_aadhaar.blacklist_flag
    
    if db_pan and db_aadhaar:
        pan_linked = db_pan.is_linked and (db_pan.aadhaar_id == db_aadhaar.id)
        
    gst_active = False
    is_suspended = False
    company_age = 0
    if db_gst:
        gst_active = True
        is_suspended = db_gst.is_suspended
        company_age = (datetime.utcnow().date() - db_gst.created_at.date()).days // 365
        
    # Owner Score Calculation
    # For now, mocking defaults count to 0. Can be expanded if we track historical    defaults_count = 0 # In a real system, you'd check a table of past defaults for this Aadhaar
    mismatch = False
    if db_pan and db_pan.aadhaar_id != db_aadhaar.id:
        mismatch = True

    owner_score = calculate_owner_score(
        aadhaar_verified=True, # We hit this endpoint securely
        pan_linked=db_pan.is_linked if db_pan else False,
        blacklist_flag=db_aadhaar.blacklist_flag,
        defaults_count=defaults_count,
        mismatch=mismatch
    )
    
    # 2. Company Score (40%)
    company_score = 600
    if db_gst: # Changed db_company to db_gst to match existing variable
        returns = db.query(GSTReturn).filter(GSTReturn.company_id == db_gst.id).all()
        compliance_avg = sum(r.compliance_score for r in returns) / len(returns) if returns else 0
        
        # calculate age
        created_year = db_gst.created_at.year if db_gst.created_at else datetime.now().year
        age_years = datetime.now().year - created_year
        
        company_score = calculate_company_score(
            gst_active=True,
            compliance_avg=compliance_avg,
            company_age_years=age_years,
            is_suspended=db_gst.is_suspended
        )
        
    # 3. Transaction Score (20%)
    transaction_score = 650
    if db_gst: # Changed db_company to db_gst to match existing variable
        invoices = db.query(Invoice).filter(Invoice.company_id == db_gst.id).all()
        total_inv = len(invoices)
        if total_inv > 0:
            paid_count = sum(1 for i in invoices if i.status == "PAID") # Changed "paid" to "PAID" to match existing data
            default_count = sum(1 for i in invoices if i.status == "DEFAULTED") # Changed "defaulted" to "DEFAULTED" to match existing data
            
            paid_ratio = paid_count / total_inv
            default_ratio = default_count / total_inv
            
            avg_delay = sum(i.delay_days for i in invoices) / total_inv
            
            transaction_score = calculate_transaction_score(
                total_invoices=total_inv,
                paid_ratio=paid_ratio,
                default_ratio=default_ratio,
                avg_delay_days=avg_delay
            )
    
    # Final Score
    credit_score = calculate_final_credit_score(owner_score, company_score, transaction_score)
    
    # Helper functions for risk category and recommendation
    def get_risk_category(score):
        if score <= 300:
            return "HIGH_RISK"
        elif score <= 600:
            return "MEDIUM_RISK"
        elif score <= 800:
            return "LOW_RISK"
        else:
            return "EXCELLENT"

    def get_recommendation(risk_cat):
        if risk_cat in ["HIGH_RISK", "MEDIUM_RISK"]:
            return "REJECT"
        else:
            return "APPROVE"

    risk_category = get_risk_category(credit_score)
    recommendation = get_recommendation(risk_category)
    
    # Verification Decision Logic
    is_verified = True
    reason = []
    
    if db_aadhaar and db_aadhaar.blacklist_flag: # Added check for db_aadhaar existence
        is_verified = False
        reason.append("AADHAAR_BLACKLISTED")
        recommendation = "REJECT"
        
    if db_gst and db_gst.is_suspended: # Changed db_company to db_gst to match existing variable
        is_verified = False
        reason.append("GST_SUSPENDED")
        recommendation = "REJECT"
        
    if credit_score < 350:
        is_verified = False
        reason.append("LOW_CREDIT_SCORE")
        recommendation = "REJECT"
        
    # Build Payload
    payload = {
        "verification_complete": True,
        "verified": is_verified,
        "credit_score": credit_score,
        "risk_category": risk_category,
        "recommendation": recommendation,
        "owner_score": owner_score,
        "company_score": company_score,
        "transaction_score": transaction_score,
    }
    
    if not is_verified:
        payload["reason"] = ", ".join(reason)
        
    # Log the verification attempt
    log_entry = VerificationLog(
        gst_number=request.gst_number,
        aadhaar_number=request.aadhaar_number,
        pan_number=request.pan_number,
        owner_score=owner_score,
        company_score=company_score,
        transaction_score=transaction_score,
        credit_score=credit_score,
        risk_category=risk_category,
        recommendation=recommendation
    )
    db.add(log_entry)
    
    audit_entry = AuditLog(
        actor="EXTERNAL_GATEWAY",
        action="EVALUATE_CREDIT",
        entity="GSTCompany",
        entity_id=request.gst_number
    )
    db.add(audit_entry)
    
    db.commit()

    response = {
        "verification_complete": True,
        "verified": is_verified,
        "credit_score": credit_score,
        "risk_category": risk_category,
        "recommendation": recommendation,
        "owner_score": owner_score,
        "company_score": company_score,
        "transaction_score": transaction_score,
        "flags": [] if not reason else reason
    }
    
    if not is_verified:
        response["reason"] = ", ".join(reason)

    return response
