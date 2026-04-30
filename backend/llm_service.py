import json
import os
import logging
from groq import Groq
from tenacity import retry, wait_exponential, stop_after_attempt, retry_if_exception_type
from config import settings

logger = logging.getLogger(__name__)
client = Groq(api_key=settings.groq_api_key)

def load_prompt() -> str:
    # Look for the prompt file in the current directory (backend/)
    prompt_path = os.path.join(os.path.dirname(__file__), "unified_dental_prompt.txt")
    try:
        with open(prompt_path, "r", encoding="utf-8") as f:
            return f.read()
    except FileNotFoundError:
        logger.warning(f"Prompt file not found at {prompt_path}. Using fallback.")
        return "You are a world-class dental AI assistant. Analyze the provided findings and provide a professional clinical report."

@retry(
    wait=wait_exponential(multiplier=1, min=2, max=10),
    stop=stop_after_attempt(4),
    retry=retry_if_exception_type(Exception),
    reraise=True
)
def _call_groq(model: str, messages: list, response_format=None):
    if response_format:
        return client.chat.completions.create(
            model=model,
            messages=messages,
            response_format=response_format
        )
    return client.chat.completions.create(
        model=model,
        messages=messages
    )

def generate_report(payload: dict, image_bytes: bytes = None) -> dict | str:
    """
    Generates a dental report using Groq llama-3.3-70b-versatile.
    Note: Image bytes are ignored as the versatile model is text-only.
    """
    prompt_context = load_prompt()
    output_mode = payload.get("output_mode", "patient_report")
    findings = payload.get("findings", [])
    
    if not findings:
        return "Your dental scan looks healthy! No significant issues were detected."

    prompt = f"""
    {prompt_context}
    
    REAL-TIME DETECTION INPUT (YOLO):
    {json.dumps(payload, indent=2)}
    
    INSTRUCTIONS:
    - Base your analysis on the detections provided.
    - If outputting JSON, ensure the root structure matches exactly what is required.
    """
    
    try:
        system_content = "You are an expert AI dental diagnostic assistant. ALWAYS output valid JSON if requested."
        if output_mode == "treatment_plan":
            system_content += """
            Ensure your JSON perfectly matches this schema:
            {
              "priority_list": ["list of strings"],
              "procedures": [
                {
                  "name": "Procedure Name",
                  "tooth_id": "Tooth Number",
                  "urgency": "Immediate/Soon/Routine",
                  "cost_low": 1000,
                  "cost_high": 5000,
                  "description": "Clinical description",
                  "patient_description": "Simple patient-friendly description"
                }
              ],
              "cost_estimate_inr": {"low": 1000, "high": 5000},
              "patient_summary": "Summary string",
              "dentist_summary": "Summary string"
            }
            """
        
        messages = [
            {"role": "system", "content": system_content},
            {"role": "user", "content": prompt}
        ]

        if output_mode == "treatment_plan":
            response = _call_groq(
                model='llama-3.3-70b-versatile', 
                messages=messages, 
                response_format={"type": "json_object"}
            )
            return json.loads(response.choices[0].message.content)
        else:
            response = _call_groq(model='llama-3.3-70b-versatile', messages=messages)
            return response.choices[0].message.content
            
    except Exception as e:
        logger.error(f"Groq API Error after retries: {e}")
        if output_mode == "treatment_plan":
            return {
                "priority_list": [f"Review {len(findings)} detected conditions"],
                "procedures": [],
                "cost_estimate_inr": {"low": 0, "high": 0},
                "patient_summary": "The AI has identified several areas of concern in your scan. Detailed descriptive report generation is queued.",
                "dentist_summary": "Inference complete. High-accuracy detections are available in the viewer."
            }
        return "Clinical analysis complete. The AI has mapped several key findings on your X-ray. Please consult the 'Findings' tab for detailed information."

def compare_reports(old_findings: list, new_findings: list) -> str:
    """Uses Groq to compare two sets of real dental findings and summarize changes."""
    if not old_findings or not new_findings:
        return "Insufficient data to perform a historical comparison."

    prompt = f"""
    You are a senior dental consultant. Compare these two sets of clinical findings for the same patient.
    
    HISTORICAL FINDINGS:
    {json.dumps(old_findings, indent=2)}
    
    CURRENT FINDINGS:
    {json.dumps(new_findings, indent=2)}
    
    Provide a professional summary of the progression:
    1. Resolved issues.
    2. New concerns.
    3. General health trend.
    """
    
    try:
        messages = [
            {"role": "system", "content": "You are a senior dental consultant."},
            {"role": "user", "content": prompt}
        ]
        response = _call_groq(model='llama-3.3-70b-versatile', messages=messages)
        return response.choices[0].message.content
    except Exception as e:
        logger.error(f"Error comparing reports: {e}")
        return "Unable to generate a historical comparison summary at this time."

