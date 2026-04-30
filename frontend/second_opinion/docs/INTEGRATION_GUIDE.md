# 🛠️ Integration Guide: Second Opinion AI

Follow these steps to deploy the Second Opinion AI system into your DentalVision AI platform.

## Step 1: Backend Setup (Python)
1. **Copy Implementation**: Place `second_opinion_implementation.py` into your `backend/services/` folder.
2. **Install Deps**:
   ```bash
   pip install google-generativeai anthropic
   ```
3. **Register Endpoint**: In your `main.py` or `api.py`:
   ```python
   @app.post("/analyze-second-opinion")
   async def second_opinion(finding_id: str):
       finding = db.get_finding(finding_id)
       result = await SecondOpinionAI().analyze(finding)
       return result
   ```

## Step 2: Frontend Integration (React)
1. **Component Placement**: Place `SecondOpinionComponent.jsx` in `frontend/src/components/findings/`.
2. **Hook up Context**: In your `Viewer.tsx` or `FindingsList.tsx`, ensure the `Finding` object is updated when the second opinion finishes.
3. **Trigger Logic**: Trigger the second opinion call automatically when a finding is selected, or batch process them in the background.

## Step 3: API Configuration
- **Model Choice**: We recommend `gemini-1.5-pro` or `claude-3-5-sonnet` for the Adjudicator role as they have the best clinical reasoning capabilities.
- **Temperature**: Keep at `0.2` for the Adjudicator but `0.7` for the Challenger.

## Step 4: Testing & Validation
1. **The "Gold Standard" Test**: Upload a scan with a known subtle issue. Verify that the Challenger (Model B) identifies the nuance.
2. **UI Verification**: Ensure the "Review Required" status is impossible for a dentist to miss.

## 📉 Monitoring & Analytics
Log all 'disagree' cases. These are your most valuable data points for training future models or for case studies in clinical accuracy.

## ✅ Validation Checklist
- [ ] Finding ID passes correctly to the backend.
- [ ] LLM response is valid JSON.
- [ ] UI displays the 'agree' status immediately after completion.
- [ ] Mobile view handles the expanded detail panel correctly.
