# 📝 Quick Reference: Second Opinion AI

### 💡 Core Concept
Instead of running two separate models, we use one powerful model in three distinct "turns":
1. **Model A (Primary)**: Standard diagnostic pass.
2. **Model B (Challenger)**: Forced skeptical pass (looking for what Model A missed or got wrong).
3. **Adjudicator**: Resolves conflicts and provides a final "Consensus" or "Flag for Review" status.

### ⚡ The Three Prompts (TL;DR)
- **Prompt A**: "Analyze this finding as a conservative radiologist."
- **Prompt B**: "You are a skeptical peer reviewer. Find reasons why the primary diagnosis might be incorrect or incomplete."
- **Prompt C**: "Compare Analysis A and B. If there is a meaningful clinical difference, status is 'disagree'. Otherwise, 'agree'."

### 🚀 30-Second Implementation
```python
from second_opinion_implementation import SecondOpinionAI
so_ai = SecondOpinionAI(api_key="...")
result = so_ai.analyze(finding_data, image_context)
# Returns: { "status": "agree" | "disagree", "confidence": 0.92, "notes": "..." }
```

### ⚙️ Configuration Tweaks
- **Aggressive Review**: Set `temperature=0.7` for Model B to encourage "outside the box" thinking.
- **Strict Consensus**: Set adjudicator instructions to flag 'disagree' even for minor severity differences.

### 💰 Cost Breakdown (Estimated)
- **Tokens per scan**: ~1,500 - 2,500
- **Cost per scan (Claude 3.5 Sonnet)**: ~$0.01 - $0.03
- **Value**: Provides "multi-model" reliability at a fraction of the infrastructure cost.

### ❌ Common Failure Modes
- **Hallucination**: Model B invents issues that aren't there. *Fix: Ground prompts in specific pixel coordinates or visual evidence.*
- **Systematic Bias**: Adjudicator always sides with Model A. *Fix: Randomize the order of A and B when presenting to the adjudicator.*

### ✅ Success Checklist
1. Finding status mapped to UI (Green/Amber dots).
2. "Review" flag triggers a prominent UI warning.
3. Patient view simplified; Dentist view detailed.
