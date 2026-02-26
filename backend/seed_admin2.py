import os
import sys

# Add current dir to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import SessionLocal, engine, Base
from models.database_models import User
from services.auth_service import get_password_hash

def seed():
    Base.metadata.create_all(bind=engine)
    db = SessionLocal()
    try:
        admin = db.query(User).filter(User.email == "admin@gov.in").first()
        if not admin:
            # Hash directly to avoid passlib issues if there are any
            import bcrypt
            pwd = "password123".encode('utf-8')
            salt = bcrypt.gensalt()
            hashed = bcrypt.hashpw(pwd, salt).decode('utf-8')
            
            admin = User(email="admin@gov.in", password_hash=hashed, role="ADMIN")
            db.add(admin)
            db.commit()
            print("ADMIN_CREATED")
        else:
            print("ADMIN_EXISTS")
    except Exception as e:
        print("ERROR:", e)
    finally:
        db.close()

if __name__ == "__main__":
    seed()
