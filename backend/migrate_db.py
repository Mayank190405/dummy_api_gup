import os
import sys

sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import engine

def apply_migrations():
    print("Applying missing columns to Supabase PostgreSQL...")
    with engine.begin() as conn:
        try:
            # Aadhaar table
            conn.exec_driver_sql("ALTER TABLE aadhaar ADD COLUMN IF NOT EXISTS name VARCHAR DEFAULT 'Unknown';")
            conn.exec_driver_sql("ALTER TABLE aadhaar ADD COLUMN IF NOT EXISTS address VARCHAR;")
            print("Aadhaar columns added")
        except Exception as e:
            print(f"Aadhaar err: {str(e)}")
            
        try:
            # PAN table
            conn.exec_driver_sql("ALTER TABLE pan ADD COLUMN IF NOT EXISTS photo_url VARCHAR;")
            print("PAN columns added")
        except Exception as e:
            print(f"PAN err: {str(e)}")
            
        try:
            # Company table
            conn.exec_driver_sql("ALTER TABLE company ADD COLUMN IF NOT EXISTS registered_address VARCHAR;")
            conn.exec_driver_sql("ALTER TABLE company ADD COLUMN IF NOT EXISTS address_proof_url VARCHAR;")
            print("Company columns added")
        except Exception as e:
            print(f"Company err: {str(e)}")
            
        try:
            # VerificationLogs table
            conn.exec_driver_sql("ALTER TABLE verification_logs ADD COLUMN IF NOT EXISTS owner_score INTEGER;")
            conn.exec_driver_sql("ALTER TABLE verification_logs ADD COLUMN IF NOT EXISTS company_score INTEGER;")
            conn.exec_driver_sql("ALTER TABLE verification_logs ADD COLUMN IF NOT EXISTS transaction_score INTEGER;")
            print("VerificationLog columns added")
        except Exception as e:
            print(f"VerificationLogs err: {str(e)}")
            
    print("Migration complete!")

if __name__ == "__main__":
    apply_migrations()
