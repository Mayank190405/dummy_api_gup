import os
import sys

# Add current dir to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from database import SessionLocal
from models.database_models import User
from services.auth_service import verify_password, get_password_hash

try:
    db = SessionLocal()
    admin = db.query(User).filter(User.email == "admin@gov.in").first()
    if admin:
        print("Found admin hash:", admin.password_hash)
        res = verify_password("password123", admin.password_hash)
        print("Verify result:", res)
    else:
        print("Admin user not found in DB")
except Exception as e:
    import traceback
    traceback.print_exc()
finally:
    db.close()
