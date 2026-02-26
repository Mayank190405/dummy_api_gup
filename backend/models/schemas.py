from pydantic import BaseModel, EmailStr, Field
from typing import Optional, List
from enum import Enum
from datetime import datetime

class KycStatus(str, Enum):
    PENDING = "PENDING"
    VERIFIED = "VERIFIED"
    FAILED = "FAILED"

class CompanyType(str, Enum):
    SOLE_PROP = "SOLE_PROP"
    PARTNERSHIP = "PARTNERSHIP"
    PVT_LTD = "PVT_LTD"
    LTD = "LTD"

class InvoiceStatus(str, Enum):
    PAID = "PAID"
    UNPAID = "UNPAID"
    DEFAULTED = "DEFAULTED"

class OTPRequest(BaseModel):
    identity_value: str
    identity_type: str = "AADHAAR"

class OTPVerifyRequest(BaseModel):
    identity_value: str
    identity_type: str = "AADHAAR"
    otp: str

# --- Auth Schemas ---
class UserCreate(BaseModel):
    email: EmailStr
    password: str
    role: str = "ADMIN"

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None
    role: Optional[str] = None

# --- Aadhaar Schemas ---
class AadhaarCreate(BaseModel):
    name: str
    phone: str
    email: Optional[EmailStr] = None
    address: Optional[str] = None
    photo_url: Optional[str] = None

class AadhaarResponse(BaseModel):
    id: str
    name: str
    aadhaar_number: str
    phone: str
    email: Optional[str] = None
    address: Optional[str] = None
    photo_url: Optional[str] = None
    kyc_status: str
    blacklist_flag: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

# --- PAN Schemas ---
class PANCreate(BaseModel):
    aadhaar_number: str
    photo_url: Optional[str] = None

class PANResponse(BaseModel):
    id: str
    pan_number: str
    photo_url: Optional[str] = None
    aadhaar_id: str
    is_linked: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

# --- Verification Schemas ---
class VerificationCheckRequest(BaseModel):
    gst_number: str
    aadhaar_number: str
    pan_number: str
    invoice_id: Optional[str] = None

# --- Business / GST Schemas ---
class CompanyCreate(BaseModel):
    company_name: str
    type: CompanyType
    registered_address: Optional[str] = None
    address_proof_url: Optional[str] = None
    state_code: str
    aadhaar_numbers: List[str]

class CompanyResponse(BaseModel):
    id: str
    gst_number: str
    company_name: str
    type: str
    is_suspended: bool
    created_at: datetime
    
    class Config:
        from_attributes = True

class InvoiceCreate(BaseModel):
    company_id: str
    invoice_number: str
    buyer_gstin: str
    date: datetime
    total_taxable: float
    total_tax: float
    grand_total: float
    status: InvoiceStatus = InvoiceStatus.UNPAID
    delay_days: int = 0

class InvoiceResponse(BaseModel):
    id: str
    company_id: str
    invoice_number: str
    buyer_gstin: str
    date: datetime
    total_taxable: float
    total_tax: float
    grand_total: float
    status: InvoiceStatus
    delay_days: int
    created_at: datetime

    class Config:
        from_attributes = True

class ReturnCreate(BaseModel):
    company_id: str
    compliance_score: int

class ReturnResponse(BaseModel):
    id: str
    company_id: str
    filed_date: datetime
    compliance_score: int

    class Config:
        from_attributes = True

