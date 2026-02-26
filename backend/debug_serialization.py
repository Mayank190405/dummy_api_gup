import json
from database import SessionLocal
from models.database_models import Invoice
from models.schemas import InvoiceResponse
from typing import List
from pydantic import TypeAdapter

db = SessionLocal()
invoices = db.query(Invoice).all()
adapter = TypeAdapter(List[InvoiceResponse])
serialized = adapter.validate_python(invoices)
print(json.dumps([s.model_dump() for s in serialized], indent=2, default=str))
db.close()
