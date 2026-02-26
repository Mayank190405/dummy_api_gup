from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List
from database import get_db
from models.database_models import AadhaarProfile, PANProfile, GSTCompany, Invoice, AuditLog, User
from routers.auth import get_current_admin

router = APIRouter()

@router.get("/stats")
def get_system_stats(db: Session = Depends(get_db), current_admin: User = Depends(get_current_admin)):
    stats = {
        "aadhaar_count": db.query(AadhaarProfile).count(),
        "pan_count": db.query(PANProfile).count(),
        "gst_count": db.query(GSTCompany).count(),
        "invoices": db.query(Invoice).count(),
        "system_load": "Optimal",
        "security_breaches": 0
    }
    return stats

@router.get("/logs")
def get_audit_logs(db: Session = Depends(get_db), current_admin: User = Depends(get_current_admin)):
    logs = db.query(AuditLog).order_by(AuditLog.timestamp.desc()).limit(20).all()
    # Format logs for frontend consumption if needed
    formatted_logs = []
    for log in logs:
        formatted_logs.append({
            "actor": log.actor,
            "action": log.action.replace("_", " ").title(),
            "entity": log.entity,
            "entity_id": log.entity_id,
            "timestamp": log.timestamp,
            "color": "emerald" if "CREATE" in log.action else "blue" if "UPDATE" in log.action else "orange",
            "code": log.action[:10].upper()
        })
    return formatted_logs
