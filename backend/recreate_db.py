import os
from dotenv import load_dotenv
from sqlalchemy import text
from database import engine, Base
from models.database_models import User, AadhaarProfile, PANProfile, GSTCompany, CompanyOwner, Invoice, GSTReturn, OTPLog, AuditLog, ExternalConsumer, VerificationLog

load_dotenv()

print("Dropping all existing tables...")
Base.metadata.drop_all(bind=engine)
print("Creating new tables...")
Base.metadata.create_all(bind=engine)

# Create a default partition for the Invoice table if using PostgreSQL
if "postgresql" in str(engine.url):
    with engine.connect() as conn:
        conn.execute(text("CREATE TABLE IF NOT EXISTS invoice_default PARTITION OF invoice DEFAULT;"))
        conn.commit()

print("Database Schema Rebuilt Successfully.")
