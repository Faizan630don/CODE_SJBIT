import json
import os
from google import genai
from config import settings

client = genai.Client(api_key=settings.gemini_api_key)

def load_prompt() -> str:
    prompt_path = os.path.join(os.path.dirname(__file__), "prompts", "unified_dental_prompt.txt")
    try:
        with open(prompt_path, "r", encoding="utf-8") as f:
            return f.read()
    except FileNotFoundError:
        return "You are a helpful dental assistant. Generate a report."

def generate_report(payload: dict) -> dict | str:
    prompt_context = load_prompt()
    
    # Construct the JSON prompt string
    prompt = f"""
    {prompt_context}
    
    Given the following input, please generate the output matching the requested mode:
    {json.dumps(payload, indent=2)}
    """
    
    output_mode = payload.get("output_mode", "patient_report")
    
    try:
        if output_mode == "treatment_plan":
            response = client.models.generate_content(
                model='gemini-3-flash-preview',
                contents=prompt,
                config=genai.types.GenerateContentConfig(
                    response_mime_type="application/json",
                )
            )
            return json.loads(response.text)
        else:
            response = client.models.generate_content(
                model='gemini-3-flash-preview',
                contents=prompt,
                config=genai.types.GenerateContentConfig(
                    response_mime_type="text/plain",
                )
            )
            return response.text
    except json.JSONDecodeError:
        return {
            "priority_list": [],
            "procedures": [],
            "cost_estimate_inr": {"low": 0, "high": 0},
            "if_untreated": "Data parsing failed. Review required.",
            "patient_summary": "Failed to generate a precise treatment plan."
        }
    except Exception as e:
        print(f"Error calling Gemini API: {e}")
        if output_mode == "treatment_plan":
            return {
                "priority_list": [],
                "procedures": [],
                "cost_estimate_inr": {"low": 0, "high": 0},
                "if_untreated": f"Error: {e}",
                "patient_summary": "Failed to generate a precise treatment plan."
            }
        return f"Error calling Gemini API: {e}"
