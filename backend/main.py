from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routers import identity, business, verification, auth, external, documents, admin
import os
from dotenv import load_dotenv
from database import engine, Base
from models.database_models import AadhaarProfile, PANProfile, GSTCompany, CompanyOwner, Invoice, GSTReturn, OTPLog, VerificationLog, AuditLog, ExternalConsumer

load_dotenv()

# Create tables if they don't exist
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Government Identity & Credit Verification API",
    description="Simulation Platform for Identity, GST Compliance, and Credit Scoring",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/auth", tags=["Authentication"])
app.include_router(admin.router, prefix="/admin", tags=["Admin Infrastructure"])
app.include_router(identity.router, prefix="/identity", tags=["Identity (Aadhaar/PAN)"])
app.include_router(business.router, prefix="/business", tags=["Business & GST"])
app.include_router(verification.router, prefix="/verification", tags=["Master Verification"])
app.include_router(external.router, prefix="/external", tags=["External API Consumers"])
app.include_router(documents.router, prefix="/documents", tags=["Document Generation"])

@app.get("/")
def read_root():
    return {"message": "Government Identity & Credit Verification API Running", "status": "VERIFIED"}
