from fastapi import FastAPI, Depends, UploadFile, File, HTTPException, Header
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from supabase import create_client, Client

from config import settings
from model_service import cnn_service
from llm_service import generate_report

app = FastAPI(title="DentalVision AI API")

# Initialize Supabase client
supabase: Client = create_client(settings.supabase_url, settings.supabase_key)

# Pydantic Models
class Finding(BaseModel):
    tooth_id: int
    condition: str
    severity: str
    confidence: float
    bbox: List[int]

class ReportRequest(BaseModel):
    output_mode: str
    patient_name: str = "Dummy Patient"
    patient_age: int = 30
    findings: List[Finding]
    treatment_recommended: str = "dummy_treatment"
    cost_est_inr: int = 1000

class SaveReportRequest(BaseModel):
    findings: List[Dict[str, Any]]
    generated_report: Any
    triage: str

# Authentication Middleware
def get_current_user(authorization: str = Header(None)) -> str:
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=401, detail="Invalid or missing authorization header")
    
    token = authorization.split(" ")[1]
    
    try:
        user_response = supabase.auth.get_user(token)
        if not user_response or not user_response.user:
            raise HTTPException(status_code=401, detail="Invalid token")
        return user_response.user.id
    except Exception as e:
        raise HTTPException(status_code=401, detail=f"Authentication failed: {str(e)}")


@app.post("/analyze")
async def analyze_xray(file: UploadFile = File(...)):
    if not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="File must be an image")
    
    image_bytes = await file.read()
    
    try:
        findings, triage, report = await cnn_service.predict(image_bytes)
        return {"findings": findings, "triage": triage, "report": report}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error analyzing image: {str(e)}")

@app.post("/generate-report")
async def generate_patient_report(request: ReportRequest):
    payload = request.model_dump()
    report = generate_report(payload)
    return {"report": report}

@app.post("/save-report")
async def save_report(request: SaveReportRequest, user_id: str = Depends(get_current_user)):
    try:
        data = {
            "user_id": user_id,
            "findings": request.findings,
            "generated_report": request.generated_report,
            "triage": request.triage
        }
        response = supabase.table("reports").insert(data).execute()
        return {"status": "success", "data": response.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save report: {str(e)}")

@app.get("/reports")
async def get_reports(user_id: str = Depends(get_current_user)):
    try:
        response = supabase.table("reports").select("*").eq("user_id", user_id).execute()
        return {"reports": response.data}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch reports: {str(e)}")
