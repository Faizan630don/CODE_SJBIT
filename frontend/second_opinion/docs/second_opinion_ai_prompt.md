# 🧠 Second Opinion AI: Prompt Strategy

This document details the "Why" and "How" of the prompt engineering that powers independent verification.

## 🎭 The Psychology of the Challenger
The key to a true second opinion without a second model is **Role-Based Adversarial Prompting**. Humans are prone to confirmation bias; LLMs are even more so. To break this, we must force the model to adopt a persona that is professionally incentivized to find errors.

## 📝 The Full Prompt Suite

### Prompt A: The Primary Analyst
> "You are a Senior Dental Radiologist. Analyze the provided dental finding. Be precise, conservative, and identify the condition, severity (1-5), and location. Provide a clinical justification based strictly on the visual evidence."

### Prompt B: The Skeptical Peer Reviewer
> "You are a skeptical peer reviewer assigned to audit a diagnosis. Your goal is to find reasons why the primary diagnosis might be an over-diagnosis or an under-diagnosis. Look for subtle visual cues that contradict a standard interpretation. If you find a potential discrepancy, explain it in detail."

### Prompt C: The Adjudicator
> "You are the Lead Clinical Consultant. You have two reports: Analysis A and Audit B. 
> 
> Your Task:
> 1. Determine if there is a 'Clinical Consensus'. Consensus is LOST if there is a difference in severity >= 2 levels OR if the condition itself is disputed.
> 2. If consensus is lost, output 'disagree'. 
> 3. If they agree on the core clinical path, output 'agree'.
> 
> Response Format (JSON):
> { 'status': 'agree' | 'disagree', 'consensus_note': '...', 'final_severity': N }"

## 🪄 Key Tricks & Techniques
1. **Evidence Forcing**: Ask the model to list the "3 weakest points" of Analysis A.
2. **Context Blindness**: Don't tell Model B what Model A found until *after* its first internal pass (Chain of Thought).
3. **Thresholding**: Use numeric thresholds for "agreement" rather than just boolean labels.

## 🧪 Testing Strategies
- **Negative Testing**: Provide clear, healthy images and ensure Model B doesn't "hallucinate" problems just to be adversarial.
- **Ambiguity Testing**: Provide borderline cases (e.g., incipient caries) and verify that the system correctly flags them as 'disagree/review'.

## 🛠️ Implementation Patterns
- **Parallel Execution**: Run Prompt A and Prompt B in parallel to reduce latency, then feed both to C.
- **Batched Adjudication**: If you have 10 findings, send all 10 pairs of A/B to a single Adjudicator call to save on input tokens.
