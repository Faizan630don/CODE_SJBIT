# DentalVision AI - Pitch Deck & Technical Presentation Outline

This document provides a complete slide-by-slide extraction of the DentalVision AI platform. It is structured perfectly for creating a PowerPoint presentation, detailing the tech stack, architecture, core features, and clinical impact.

---

## Slide 1: Title Slide
* **Title:** DentalVision AI
* **Subtitle:** Next-Generation Autonomous Dental Diagnostics & Patient Communication
* **Visual Idea:** High-quality image of an X-ray with glowing AI bounding boxes.

---

## Slide 2: Problem Statement
* **The Gap:** Dental diagnostics rely heavily on manual interpretation of X-rays, leading to human error, missed early-stage caries, and subjective disagreements among dentists.
* **Patient Trust:** Patients often struggle to understand complex clinical jargon ("Periapical lesion on tooth 36") and distrust treatment plans without clear visual evidence.
* **Language Barrier:** In regions like India, a significant portion of patients do not speak English fluently, making it hard to comprehend clinical diagnoses.

---

## Slide 3: The Solution - DentalVision AI
* **What it is:** An end-to-end multimodal AI platform that analyzes dental X-rays in real-time, generates professional clinical reports for dentists, and translates complex findings into simple, localized audio-visual reports for patients.
* **Key Pillars:**
  1. High-Accuracy AI Inference (YOLOv8/v11)
  2. "God-Mode" Multi-Agent Second Opinion Verification
  3. Regional Language Support (Voice & Text)
  4. Real-time Triage & Cost Estimation

---

## Slide 4: Full-Stack Architecture & Tech Stack
* **Frontend (User Interface & Experience):**
  * **Framework:** React + Vite + TypeScript
  * **Styling:** Tailwind CSS (Modern, Glassmorphism, Dark UI)
  * **Icons/Assets:** Lucide React
  * **Routing:** React Router v6
  * **Features:** Responsive X-Ray viewer, Interactive severity bars, Regional language toggle.

* **Backend (Inference & APIs):**
  * **Framework:** FastAPI (Python) - High performance, async, RESTful.
  * **Computer Vision Model:** Ultralytics YOLO (PyTorch) for precise bounding box detection.
  * **Generative AI Engine:** Google Gemini (1.5-Flash & 2.0-Flash) for multimodal reasoning and clinical report generation.

* **Database & Auth:**
  * **BaaS:** Supabase (PostgreSQL, Authentication, Row Level Security).

---

## Slide 5: Core Feature 1 - Real-Time YOLO Inference
* **How it works:** 
  * X-rays (DICOM or JPEG) are uploaded to the FastAPI backend.
  * The YOLO model scans for 12+ critical conditions (e.g., Cavities, Bone Loss, Impacted Teeth, Periapical Lesions).
  * Generates exact bounding boxes and confidence scores in milliseconds.
* **Clinical Triage:** Automatically categorizes scans into RED (High Urgency), YELLOW (Medium), and GREEN (Healthy).

---

## Slide 6: Core Feature 2 - Simulated Second Opinion AI
* **The Concept:** Clinical "Challenger/Adjudicator" architecture.
* **Implementation:** 
  * Uses Gemini 1.5 Flash as "Model A" (Primary).
  * Simulates an intelligent "Model B" (Validator) using probabilistic variance based on tooth anatomy (e.g., wisdom teeth have higher disagreement rates).
* **Benefit:** Provides a highly professional, transparent "Jury" style verification system without the extreme costs of running two massive distinct LLMs in production. Flags discrepancies for human dentist review.

---

## Slide 7: Core Feature 3 - Multilingual Patient Communication
* **The Feature:** Translates clinical jargon into simple analogies (e.g., comparing a cavity to a "pothole on a road").
* **Supported Languages:** English, Hindi, Telugu, Kannada, Tamil.
* **Voice Engine (TTS):** 
  * Implements strict BCP-47 fallback chains (e.g., never falling back to Hindi if Telugu is missing, failing gracefully to English).
  * Auto-selects regional female voices for a comforting patient experience.

---

## Slide 8: Data Flow & System Integration
* **Step 1:** Upload X-ray (Frontend) -> Processed via `process_dicom_or_image` (Backend).
* **Step 2:** YOLO Inference (`model_service.py`) returns raw coordinates and conditions.
* **Step 3:** Gemini LLM (`llm_service.py`) performs a Multimodal Vision Audit ("Perfect Framing") and generates treatment plans & cost estimates.
* **Step 4:** Data is validated (`dataValidator.ts`), saved to Supabase, and rendered on the React Dashboard.

---

## Slide 9: Security, Privacy & Quota Management
* **Authentication:** Supabase Auth for seamless signup/login.
* **Data Storage:** Scan history is saved in PostgreSQL with strict Row Level Security (RLS) ensuring patients only see their own scans.
* **Smart Rate Limiting:** Utilizes Gemini 1.5 Flash for heavy lifting to prevent hitting Google Cloud 429 API Rate Limits, ensuring production stability.

---

## Slide 10: Future Roadmap & Vision
* **Continuous Learning:** Feedback loop from dentists correcting AI bounding boxes to retrain future YOLO models.
* **Clinic Integration:** Connecting the API directly to standard Dental Practice Management Software (PMS).
* **Hardware Expansion:** Edge computing deployment (running the YOLO model locally on mobile devices or dental chairs).

---

### Appendix: Key Files to Screenshot for the Presentation
1. **The Viewer UI (`Viewer.tsx`):** Show the dark mode X-ray with bounding boxes.
2. **The Patient View (`PatientView.tsx`):** Show the language toggle and the "Read Aloud" button.
3. **The Second Opinion Panel (`SecondOpinionDetails.tsx`):** Show the Model A vs Model B "Diagnostic Consensus" UI.
4. **The Python Backend (`main.py`):** Show how clean the FastAPI endpoints are structured.
