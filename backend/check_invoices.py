from database import SessionLocal
from models.database_models import Invoice

db = SessionLocal()
invoices = db.query(Invoice).all()
for inv in invoices:
    print(f"ID: {inv.id}, Number: {inv.invoice_number}, Status: {inv.status}")
db.close()
