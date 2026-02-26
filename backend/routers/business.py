from fastapi import APIRouter, Depends, HTTPException
from typing import List
import random
import string
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import get_db
from models.database_models import GSTCompany, Invoice, GSTReturn, User, AadhaarProfile, PANProfile, CompanyOwner, AuditLog
from models.schemas import CompanyCreate, CompanyResponse, InvoiceCreate, ReturnCreate, InvoiceResponse, InvoiceStatus, ReturnResponse
from routers.auth import get_current_admin

router = APIRouter()

@router.get("/company/{gst_number}", response_model=CompanyResponse)
def get_company_by_gstin(gst_number: str, db: Session = Depends(get_db)):
    db_company = db.query(GSTCompany).filter(GSTCompany.gst_number == gst_number).first()
    if not db_company:
        raise HTTPException(status_code=404, detail="Company not found")
    return db_company

@router.get("/search/company", response_model=List[CompanyResponse])
def search_company(query: str, db: Session = Depends(get_db), current_admin: User = Depends(get_current_admin)):
    return db.query(GSTCompany).filter(GSTCompany.company_name.ilike(f"%{query}%")).limit(20).all()

@router.post("/register", response_model=CompanyResponse)
def register_company(company: CompanyCreate, db: Session = Depends(get_db), current_admin: User = Depends(get_current_admin)):
    
    # 1. Verification of owners
    if not company.aadhaar_numbers:
        raise HTTPException(status_code=400, detail="At least one Aadhaar number is required")
        
    if company.type == "SOLE_PROP" and len(company.aadhaar_numbers) > 1:
        raise HTTPException(status_code=400, detail="Sole Proprietorship can only have 1 owner")
        
    valid_owners = []
    primary_pan = None
    
    for aadhaar_num in company.aadhaar_numbers:
        # Check Aadhaar exists & OTP (skipping strict OTP here for brevity, assume admin verified)
        db_aadhaar = db.query(AadhaarProfile).filter(AadhaarProfile.aadhaar_number == aadhaar_num).first()
        if not db_aadhaar:
            raise HTTPException(status_code=404, detail=f"Aadhaar {aadhaar_num} not found")
            
        db_pan = db.query(PANProfile).filter(PANProfile.aadhaar_id == db_aadhaar.id).first()
        if not db_pan:
            raise HTTPException(status_code=400, detail=f"PAN not linked to Aadhaar {aadhaar_num}")
            
        valid_owners.append({"aadhaar_id": db_aadhaar.id, "pan_id": db_pan.id})
        if not primary_pan:
            primary_pan = db_pan.pan_number

    # 2. Generate GSTIN (StateCode + PAN + EntityNumber + Z + Checksum)
    entity_code = str(random.randint(1, 9))
    checksum = random.choice(string.ascii_uppercase + string.digits)
    gstin = f"{company.state_code}{primary_pan}{entity_code}Z{checksum}"
    
    db_company = db.query(GSTCompany).filter(GSTCompany.gst_number == gstin).first()
    if db_company:
        raise HTTPException(status_code=400, detail="Generated GSTIN conflict. Try again.")

    try:
        # 3. Save Company
        new_company = GSTCompany(
            gst_number=gstin,
            company_name=company.company_name,
            type=company.type.value,
            state_code=company.state_code,
            registered_address=company.registered_address,
            address_proof_url=company.address_proof_url,
        )
        db.add(new_company)
        db.flush()
        
        # 4. Save Owners mapping
        for owner in valid_owners:
            mapping = CompanyOwner(
                company_id=new_company.id,
                aadhaar_id=owner["aadhaar_id"],
                pan_id=owner["pan_id"]
            )
            db.add(mapping)
            
        audit_entry = AuditLog(
            actor="ADMIN",
            action="CREATE_COMPANY",
            entity="GSTCompany",
            entity_id=new_company.id
        )
        db.add(audit_entry)
            
        db.commit()
        db.refresh(new_company)
        return new_company
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Atomic transaction failed: {str(e)}")

@router.post("/add-return")
def add_return(ret: ReturnCreate, db: Session = Depends(get_db), current_admin: User = Depends(get_current_admin)):
    new_return = GSTReturn(
        company_id=ret.company_id,
        compliance_score=ret.compliance_score
    )
    db.add(new_return)
    db.commit()
    db.refresh(new_return)
    return {"message": "Return added successfully", "return_id": new_return.id}

@router.post("/add-invoice")
def add_invoice(inv: InvoiceCreate, db: Session = Depends(get_db), current_admin: User = Depends(get_current_admin)):
    # Validate that buyer and seller are different
    db_company = db.query(GSTCompany).filter(GSTCompany.id == inv.company_id).first()
    if not db_company:
        raise HTTPException(status_code=404, detail="Issuing company not found")
        
    if db_company.gst_number == inv.buyer_gstin:
        raise HTTPException(status_code=400, detail="Seller and Buyer GSTINs cannot be the same")

    new_invoice = Invoice(
        company_id=inv.company_id,
        invoice_number=inv.invoice_number,
        buyer_gstin=inv.buyer_gstin,
        date=inv.date,
        total_taxable=inv.total_taxable,
        total_tax=inv.total_tax,
        grand_total=inv.grand_total,
        status=inv.status.value,
        delay_days=inv.delay_days
    )
    db.add(new_invoice)
    db.commit()
    db.refresh(new_invoice)
    return {"message": "Invoice added successfully", "invoice_id": new_invoice.id}

@router.get("/invoices", response_model=List[InvoiceResponse])
def get_invoices(db: Session = Depends(get_db), current_admin: User = Depends(get_current_admin)):
    return db.query(Invoice).order_by(Invoice.created_at.desc()).all()

@router.patch("/invoices/{invoice_id}/status")
def update_invoice_status(invoice_id: str, status: InvoiceStatus, delay_days: int = 0, db: Session = Depends(get_db), current_admin: User = Depends(get_current_admin)):
    # Try finding by internal ID first
    db_invoice = db.query(Invoice).filter(Invoice.id == invoice_id).first()
    
    # Fallback to finding by invoice_number if not found (helps with manual testing/UI mismatches)
    if not db_invoice:
        db_invoice = db.query(Invoice).filter(Invoice.invoice_number == invoice_id).first()
        
    if not db_invoice:
        raise HTTPException(status_code=404, detail="Invoice Not Found in Registry")
    
    db_invoice.status = status.value
    db_invoice.delay_days = delay_days
    
    audit_entry = AuditLog(
        actor="ADMIN",
        action=f"UPDATE_INVOICE_{status.value}",
        entity="Invoice",
        entity_id=db_invoice.id
    )
    db.add(audit_entry)
    
    db.commit()
    return {"message": "Invoice status updated", "new_status": status.value}

@router.get("/{gst_number}/summary")
def get_summary(gst_number: str, db: Session = Depends(get_db)):
    db_company = db.query(GSTCompany).filter(GSTCompany.gst_number == gst_number).first()
    if not db_company:
        raise HTTPException(status_code=404, detail="Company not found")
        
    # calculate average compliance
    avg_compliance = db.query(func.avg(GSTReturn.compliance_score)).filter(GSTReturn.company_id == db_company.id).scalar()
    
    return {
        "gst_number": gst_number,
        "company_name": db_company.company_name,
        "is_suspended": db_company.is_suspended,
        "compliance_average": int(avg_compliance) if avg_compliance else 0
    }

@router.get("/company/{gst_number}/unpaid-invoices", response_model=List[InvoiceResponse])
def get_unpaid_invoices_by_gst(gst_number: str, db: Session = Depends(get_db), current_admin: User = Depends(get_current_admin)):
    db_company = db.query(GSTCompany).filter(GSTCompany.gst_number == gst_number).first()
    if not db_company:
        raise HTTPException(status_code=404, detail="Company not found")
        
    return db.query(Invoice).filter(
        Invoice.company_id == db_company.id,
        Invoice.status == "UNPAID"
    ).all()

@router.get("/company/{gst_number}/returns", response_model=List[ReturnResponse])
def get_returns_by_gst(gst_number: str, db: Session = Depends(get_db), current_admin: User = Depends(get_current_admin)):
    db_company = db.query(GSTCompany).filter(GSTCompany.gst_number == gst_number).first()
    if not db_company:
        raise HTTPException(status_code=404, detail="Company not found")
        
    return db.query(GSTReturn).filter(GSTReturn.company_id == db_company.id).order_by(GSTReturn.filed_date.desc()).all()
