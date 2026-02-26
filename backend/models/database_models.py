from sqlalchemy import Column, String, Integer, Boolean, Float, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from database import Base
import uuid

def generate_uuid():
    return str(uuid.uuid4())

class User(Base):
    __tablename__ = "users"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    role = Column(String, default="ADMIN") # ADMIN ONLY system
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class AadhaarProfile(Base):
    __tablename__ = "aadhaar_profiles"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    name = Column(String, nullable=False)
    aadhaar_number = Column(String, unique=True, index=True, nullable=False)
    phone = Column(String, unique=True, nullable=False)
    email = Column(String, nullable=True)
    address = Column(String, nullable=True)
    photo_url = Column(String, nullable=True)
    kyc_status = Column(String, default="VERIFIED")
    blacklist_flag = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class PANProfile(Base):
    __tablename__ = "pan_profiles"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    pan_number = Column(String, unique=True, index=True, nullable=False)
    aadhaar_id = Column(String, ForeignKey("aadhaar_profiles.id"), unique=True, nullable=False)
    is_linked = Column(Boolean, default=True)
    photo_url = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    
    aadhaar = relationship("AadhaarProfile")

class GSTCompany(Base):
    __tablename__ = "gst_companies"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    gst_number = Column(String, unique=True, index=True, nullable=False)
    type = Column(String, nullable=False) # SOLE_PROP | PARTNERSHIP | PVT_LTD | LTD
    company_name = Column(String, nullable=False)
    state_code = Column(String, nullable=False)
    registered_address = Column(String, nullable=True)
    address_proof_url = Column(String, nullable=True)
    is_suspended = Column(Boolean, default=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class CompanyOwner(Base):
    __tablename__ = "company_owners"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    company_id = Column(String, ForeignKey("gst_companies.id"), nullable=False)
    aadhaar_id = Column(String, ForeignKey("aadhaar_profiles.id"), nullable=True)
    pan_id = Column(String, ForeignKey("pan_profiles.id"), nullable=True)
    
    company = relationship("GSTCompany")
    aadhaar = relationship("AadhaarProfile")
    pan = relationship("PANProfile")

class Invoice(Base):
    __tablename__ = "invoice"
    __table_args__ = (
        {"postgresql_partition_by": "RANGE (date)"},
    )
    
    id = Column(String, primary_key=True, default=generate_uuid)
    company_id = Column(String, ForeignKey("gst_companies.id"), nullable=False)
    invoice_number = Column(String, nullable=False)
    buyer_gstin = Column(String, nullable=False)
    date = Column(DateTime(timezone=True), primary_key=True, nullable=False) # Part of PK for Partitioning
    total_taxable = Column(Float, nullable=False)
    total_tax = Column(Float, nullable=False)
    grand_total = Column(Float, nullable=False)
    status = Column(String, default="UNPAID") # PAID, UNPAID, DEFAULTED
    delay_days = Column(Integer, default=0)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class GSTReturn(Base):
    __tablename__ = "gst_return"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    company_id = Column(String, ForeignKey("gst_companies.id"), nullable=False)
    filed_date = Column(DateTime(timezone=True), server_default=func.now())
    compliance_score = Column(Integer, default=0) # 0-100

class OTPLog(Base):
    __tablename__ = "otp_logs"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    identity_type = Column(String, nullable=False) # AADHAAR, PHONE
    identity_value = Column(String, nullable=False)
    otp = Column(String, nullable=False)
    expiry_time = Column(DateTime(timezone=True), nullable=False)
    attempt_count = Column(Integer, default=0)
    verified = Column(Boolean, default=False)
    is_used = Column(Boolean, default=False)

class AuditLog(Base):
    __tablename__ = "audit_logs"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    actor = Column(String, nullable=False) # e.g., 'ADMIN'
    action = Column(String, nullable=False) # e.g., 'CREATE_AADHAAR'
    entity = Column(String, nullable=False) # e.g., 'AadhaarProfile'
    entity_id = Column(String, nullable=False) # ID of the created entity
    timestamp = Column(DateTime(timezone=True), server_default=func.now())

class ExternalConsumer(Base):
    __tablename__ = "external_consumers"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    api_key = Column(String, unique=True, index=True, nullable=False)
    webhook_secret = Column(String, nullable=False)
    name = Column(String, nullable=False)
    created_at = Column(DateTime(timezone=True), server_default=func.now())

class VerificationLog(Base):
    __tablename__ = "verification_logs"
    
    id = Column(String, primary_key=True, default=generate_uuid)
    gst_number = Column(String, nullable=True)
    aadhaar_number = Column(String, nullable=True)
    pan_number = Column(String, nullable=True)
    owner_score = Column(Integer, nullable=True)
    company_score = Column(Integer, nullable=True)
    transaction_score = Column(Integer, nullable=True)
    credit_score = Column(Integer, nullable=True)
    risk_category = Column(String, nullable=True)
    recommendation = Column(String, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
