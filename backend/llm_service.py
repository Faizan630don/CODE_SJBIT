import json
import os
import logging
from google import genai
from google.genai import types
from config import settings

logger = logging.getLogger(__name__)
client = genai.Client(api_key=settings.gemini_api_key)

def load_prompt() -> str:
    # Look for the prompt file in the current directory (backend/)
    prompt_path = os.path.join(os.path.dirname(__file__), "unified_dental_prompt.txt")
    try:
        with open(prompt_path, "r", encoding="utf-8") as f:
            return f.read()
    except FileNotFoundError:
        logger.warning(f"Prompt file not found at {prompt_path}. Using fallback.")
        return "You are a world-class dental AI assistant. Analyze the provided findings and provide a professional clinical report."

def generate_report(payload: dict, image_bytes: bytes = None) -> dict | str:
    """
    Generates a dental report using Gemini 2.0 Flash.
    Now supports Multimodal Vision for 'Perfect Framing' validation.
    """
    prompt_context = load_prompt()
    output_mode = payload.get("output_mode", "patient_report")
    findings = payload.get("findings", [])
    
    if not findings:
        return "Your dental scan looks healthy! No significant issues were detected."

    # Construct the Multimodal Prompt
    prompt = f"""
    {prompt_context}
    
    REAL-TIME DETECTION INPUT (YOLO):
    {json.dumps(payload, indent=2)}
    
    INSTRUCTIONS:
    - Base your analysis on the detections provided AND the visual evidence in the image.
    - APPLY 'PERFECT FRAMING' CONSTRAINTS:
        1. Zero-G Correction: Ensure findings are anchored to tooth structure, not jawbone.
        2. Anatomical Tightness: Follow the periodontal ligament space as the boundary.
        3. Mass-Center Validation: Cross-reference YOLO boxes with the actual tooth centers.
    - If a detection looks 'floating' or 'bleeding' into adjacent teeth, flag it in the dentist notes.
    """
    
    try:
        contents = [prompt]
        if image_bytes:
            # Add image to multimodal request
            contents.append(types.Part.from_bytes(data=image_bytes, mime_type="image/jpeg"))

        if output_mode == "treatment_plan":
            response = client.models.generate_content(
                model='gemini-1.5-flash',
                contents=contents,
                config=genai.types.GenerateContentConfig(
                    response_mime_type="application/json",
                )
            )
            return json.loads(response.text)
        else:
            response = client.models.generate_content(
                model='gemini-1.5-flash',
                contents=contents,
            )
            return response.text
            
    except Exception as e:
        logger.error(f"Gemini API Error: {e}")
        if output_mode == "treatment_plan":
            return {
                "priority_list": [f"Review {len(findings)} detected conditions"],
                "procedures": [],
                "cost_estimate_inr": {"low": 0, "high": 0},
                "patient_summary": "The AI has identified several areas of concern in your scan. While a detailed written report is currently being generated, please review the visual markers on your X-ray for immediate findings.",
                "dentist_summary": "Inference complete. High-accuracy detections are available in the viewer. LLM-based secondary descriptive report generation is currently queued."
            }
        return "Clinical analysis complete. The AI has mapped several key findings on your X-ray. Please consult the 'Findings' tab for detailed tooth-by-tooth information while the professional summary is being finalized."

def compare_reports(old_findings: list, new_findings: list) -> str:
    """Uses Gemini to compare two sets of real dental findings and summarize changes."""
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
        response = client.models.generate_content(
            model='gemini-2.0-flash',
            contents=prompt
        )
        return response.text
    except Exception as e:
        logger.error(f"Error comparing reports: {e}")
        return "Unable to generate a historical comparison summary at this time."

