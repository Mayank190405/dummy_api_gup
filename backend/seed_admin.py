import os
from database import SessionLocal, engine, Base
from models.database_models import User
from services.auth_service import get_password_hash

# Ensure tables are created
Base.metadata.create_all(bind=engine)

def seed_admin():
    db = SessionLocal()
    try:
        admin_email = "admin@gov.in"
        admin_password = "password123"
        
        # Check if admin already exists
        existing_admin = db.query(User).filter(User.email == admin_email).first()
        if existing_admin:
            print(f"Admin user already exists with email: {admin_email}")
            return
            
        hashed_password = get_password_hash(admin_password)
        new_admin = User(
            email=admin_email,
            password_hash=hashed_password,
            role="ADMIN"
        )
        
        db.add(new_admin)
        db.commit()
        print(f"Successfully created admin user!")
        print(f"Email: {admin_email}")
        print(f"Password: {admin_password}")
    except Exception as e:
        print(f"Error seeding admin: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_admin()
