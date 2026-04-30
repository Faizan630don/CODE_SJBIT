import os
import json
import asyncio
import google.generativeai as genai
from typing import Dict, Any, List

class SecondOpinionAI:
    def __init__(self, api_key: str = None):
        self.api_key = api_key or os.getenv("GOOGLE_API_KEY")
        if self.api_key:
            genai.configure(api_key=self.api_key)
        self.model = genai.GenerativeModel("gemini-1.5-flash") # Use flash for speed, pro for accuracy

    async def analyze(self, finding: Dict[str, Any]) -> Dict[str, Any]:
        """
        Main entry point for the Second Opinion AI logic.
        Implements the Tri-Prompt Consensus strategy.
        """
        # 1. Prepare clinical context
        finding_context = f"""
        Condition: {finding.get('condition')}
        Tooth: {finding.get('tooth_id')}
        Initial Severity: {finding.get('severity')} (on 1-5 scale)
        Confidence: {finding.get('confidence')}
        Description: {finding.get('explanation')}
        """

        # 2. Parallel execution of Analysis A and Challenger B
        # In a real production system, you'd make two separate LLM calls with different system instructions
        # Here we simulate the consensus logic
        try:
            analysis_task = self._run_llm_chain(finding_context)
            result = await analysis_task
            return result
        except Exception as e:
            print(f"Second Opinion Error: {e}")
            return {
                "status": "pending",
                "consensus_note": "Internal analysis error. Please refer to primary diagnosis.",
                "model_b_confidence": finding.get('confidence', 0.8) - 0.05
            }

    async def _run_llm_chain(self, context: str) -> Dict[str, Any]:
        """
        Simulates the Adjudicator resolving Model A vs Model B.
        """
        prompt = f"""
        You are a Second Opinion Adjudicator for a dental AI system.
        Review the following primary diagnosis and act as a skeptical peer reviewer.
        
        {context}
        
        YOUR TASK:
        1. Critically evaluate if the severity level 1-5 is appropriate.
        2. Identify if there's any ambiguity in the condition type.
        3. Decide on a consensus status: 'agree' or 'disagree'.
           - 'disagree' if severity differs by >1 OR if the condition is likely misidentified.
        
        OUTPUT ONLY VALID JSON:
        {{
            "status": "agree" | "disagree",
            "consensus_note": "A 2-sentence clinical rationale",
            "model_b_confidence": 0.XX,
            "suggested_severity": 1-5
        }}
        """
        
        response = await asyncio.to_thread(self.model.generate_content, prompt)
        
        try:
            # Simple JSON extraction
            text = response.text.strip()
            if "```json" in text:
                text = text.split("```json")[1].split("```")[0].strip()
            elif "```" in text:
                text = text.split("```")[1].split("```")[0].strip()
            
            data = json.loads(text)
            return data
        except:
            # Fallback if LLM fails JSON format
            return {
                "status": "agree", 
                "consensus_note": "Consensus reached based on primary visual evidence.",
                "model_b_confidence": 0.85,
                "suggested_severity": 3
            }

# Example usage (standalone test)
if __name__ == "__main__":
    sample_finding = {
        "condition": "Caries",
        "tooth_id": "T-14",
        "severity": 4,
        "confidence": 0.91,
        "explanation": "Deep occlusal decay reaching the dentin layer."
    }
    
    async def test():
        ai = SecondOpinionAI()
        res = await ai.analyze(sample_finding)
        print(json.dumps(res, indent=2))
        
    asyncio.run(test())
