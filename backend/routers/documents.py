from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import HTMLResponse
from sqlalchemy.orm import Session
from database import get_db
from models.database_models import AadhaarProfile, PANProfile, GSTCompany, User
from routers.auth import get_current_admin

router = APIRouter()

@router.get("/aadhaar/{aadhaar_number}", response_class=HTMLResponse)
def get_aadhaar_document(aadhaar_number: str, db: Session = Depends(get_db), current_admin: User = Depends(get_current_admin)):
    profile = db.query(AadhaarProfile).filter(AadhaarProfile.aadhaar_number == aadhaar_number).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Aadhaar not found")
        
    html_content = f"""
    <html>
        <head>
            <title>Aadhaar Document - {profile.aadhaar_number}</title>
            <style>
                body {{ font-family: sans-serif; padding: 40px; background: #f0f0f0; }}
                .card {{ background: white; padding: 30px; border-radius: 10px; max-width: 500px; margin: auto; box-shadow: 0 4px 6px rgba(0,0,0,0.1); border-top: 5px solid #e11d48; }}
                .header {{ border-bottom: 2px solid #eee; padding-bottom: 10px; margin-bottom: 20px; }}
                .row {{ margin-bottom: 15px; }}
                .label {{ font-size: 12px; color: #666; text-transform: uppercase; }}
                .value {{ font-size: 18px; font-weight: bold; color: #111; }}
                .number {{ font-size: 28px; font-family: monospace; letter-spacing: 4px; text-align: center; background: #f9f9f9; padding: 15px; border-radius: 5px; margin-top: 20px; }}
            </style>
        </head>
        <body>
            <div class="card">
                <div class="header">
                    <h2>Emblem of India</h2>
                    <p style="color: #666; margin:0;">Unique Identification Authority of India</p>
                </div>
                <div class="row">
                    <div class="label">Name</div>
                    <div class="value">{profile.name}</div>
                </div>
                <div class="row">
                    <div class="label">Address</div>
                    <div class="value">{profile.address if profile.address else "Not Provided"}</div>
                </div>
                <div class="number">{profile.aadhaar_number[:4]}-{profile.aadhaar_number[4:8]}-{profile.aadhaar_number[8:]}</div>
            </div>
        </body>
    </html>
    """
    return HTMLResponse(content=html_content, status_code=200)

@router.get("/pan/{pan_number}", response_class=HTMLResponse)
def get_pan_document(pan_number: str, db: Session = Depends(get_db), current_admin: User = Depends(get_current_admin)):
    profile = db.query(PANProfile).filter(PANProfile.pan_number == pan_number).first()
    if not profile:
        raise HTTPException(status_code=404, detail="PAN not found")
        
    aadhaar = profile.aadhaar
        
    html_content = f"""
    <html>
        <head>
            <title>PAN Document - {profile.pan_number}</title>
            <style>
                body {{ font-family: sans-serif; padding: 40px; background: #f0f0f0; }}
                .card {{ background: white; padding: 30px; border-radius: 10px; max-width: 500px; margin: auto; box-shadow: 0 4px 6px rgba(0,0,0,0.1); border-top: 5px solid #2563eb; }}
                .header {{ border-bottom: 2px solid #eee; padding-bottom: 10px; margin-bottom: 20px; }}
                .row {{ margin-bottom: 15px; }}
                .label {{ font-size: 12px; color: #666; text-transform: uppercase; }}
                .value {{ font-size: 18px; font-weight: bold; color: #111; }}
                .number {{ font-size: 24px; font-family: monospace; letter-spacing: 2px; text-align: center; background: #eff6ff; padding: 15px; border-radius: 5px; margin-top: 20px; color: #1e3a8a; border: 1px dashed #bfdbfe; }}
            </style>
        </head>
        <body>
            <div class="card">
                <div class="header">
                    <h2>INCOME TAX DEPARTMENT</h2>
                    <p style="color: #666; margin:0;">GOVT. OF INDIA</p>
                </div>
                <div class="row">
                    <div class="label">Name</div>
                    <div class="value">{aadhaar.name if aadhaar else "Linked Owner"}</div>
                </div>
                <div class="number">{profile.pan_number}</div>
                <div style="text-align:center; font-size:10px; color:#999; margin-top: 20px;">Permanent Account Number</div>
            </div>
        </body>
    </html>
    """
    return HTMLResponse(content=html_content, status_code=200)

@router.get("/gst/{gstin}", response_class=HTMLResponse)
def get_gst_document(gstin: str, db: Session = Depends(get_db), current_admin: User = Depends(get_current_admin)):
    company = db.query(GSTCompany).filter(GSTCompany.gst_number == gstin).first()
    if not company:
        raise HTTPException(status_code=404, detail="GSTIN not found")
        
    html_content = f"""
    <html>
        <head>
            <title>GST Certificate - {company.gst_number}</title>
            <style>
                body {{ font-family: sans-serif; padding: 40px; background: #f0f0f0; }}
                .card {{ background: white; padding: 40px; border-radius: 10px; max-width: 700px; margin: auto; box-shadow: 0 4px 6px rgba(0,0,0,0.1); border: 1px solid #e5e7eb; }}
                .header {{ text-align: center; border-bottom: 2px solid #16a34a; padding-bottom: 20px; margin-bottom: 30px; }}
                .header h1 {{ margin: 0; color: #166534; font-size: 24px; }}
                .header p {{ margin: 5px 0 0 0; color: #666; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; }}
                table {{ width: 100%; border-collapse: collapse; margin-bottom: 30px; }}
                td {{ padding: 12px; border-bottom: 1px solid #f3f4f6; }}
                td.label {{ font-size: 13px; color: #666; width: 40%; font-weight: bold; }}
                td.value {{ font-size: 15px; color: #111; font-weight: 500; }}
                .footer {{ text-align: center; margin-top: 40px; padding-top: 20px; border-top: 1px dashed #ccc; font-size: 12px; color: #999; }}
            </style>
        </head>
        <body>
            <div class="card">
                <div class="header">
                    <h1>Government of India</h1>
                    <p>Form GST REG-06</p>
                    <p style="margin-top: 10px; color: #111; font-weight: bold;">Registration Certificate</p>
                </div>
                <table>
                    <tr>
                        <td class="label">1. Legal Name</td>
                        <td class="value">{company.company_name}</td>
                    </tr>
                    <tr>
                        <td class="label">2. Constitution of Business</td>
                        <td class="value">{company.type.replace('_', ' ')}</td>
                    </tr>
                    <tr>
                        <td class="label">3. Principal Place of Business</td>
                        <td class="value">{company.registered_address if company.registered_address else "State Code: " + company.state_code}</td>
                    </tr>
                    <tr>
                        <td class="label">4. GSTIN</td>
                        <td class="value" style="font-family: monospace; font-size: 18px; letter-spacing: 2px; color: #166534;">{company.gst_number}</td>
                    </tr>
                    <tr>
                        <td class="label">5. Date of Liability</td>
                        <td class="value">{company.created_at.strftime('%d/%m/%Y')}</td>
                    </tr>
                </table>
                <div class="footer">
                    This is a system generated certificate and does not require a physical signature.
                </div>
            </div>
        </body>
    </html>
    """
    return HTMLResponse(content=html_content, status_code=200)
