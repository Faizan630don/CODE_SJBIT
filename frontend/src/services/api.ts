import axios from 'axios';
import type { ScanResult } from '../types';

// ---------------------------------------------------------------------------
// Axios instance — swap base URL to real API when backend is ready
// ---------------------------------------------------------------------------
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:8000/api/v1',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
});

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------
const MOCK_SCAN_RESULT: ScanResult = {
  scan_id: 'scan_001',
  scan_date: new Date().toISOString(),
  patient_name: 'Patient Demo',
  biological_age: 34,
  dental_age: 41,
  xray_image_url: '',  // always overridden by the real uploaded image URL
  xray_dimensions: { width: 1200, height: 580 },
  risk_score: 'High',
  overall_health: 42,
  findings: [
    {
      id: 'f1',
      tooth_id: 'Molar-26',
      condition: 'Cavity (Dental Caries)',
      severity: 'High',
      confidence: 0.87,
      bbox: [760, 244, 58, 82],
      explanation: 'Significant decay detected in the enamel and dentin layers of the upper-left first molar. Periapical lucency suggests possible pulp involvement.',
      patient_explanation: 'You have a deep cavity in your upper-left back tooth. This is causing pain and needs urgent treatment to prevent infection spreading to the nerve.',
      dentist_notes: 'Class II carious lesion extending into dentin with radiographic evidence of pulp proximity. RCT may be indicated. Recommend immediate intervention.',
      timeline_progression: {
        now: 'Cavity confined to dentin. Treatable with root canal or large filling.',
        sixMonths: 'High likelihood of pulp necrosis and periapical abscess formation.',
        oneYear: 'Probable tooth loss. Risk of spreading infection to adjacent teeth.',
      },
      second_opinion: 'agree',
    },
    {
      id: 'f2',
      tooth_id: 'Premolar-14',
      condition: 'Bone Loss (Periodontitis)',
      severity: 'Medium',
      confidence: 0.79,
      bbox: [430, 240, 48, 90],
      explanation: 'Horizontal alveolar bone loss of approximately 30% detected around the upper-right first premolar, consistent with moderate periodontitis.',
      patient_explanation: 'The bone supporting one of your upper-right teeth is shrinking due to gum disease. Without treatment, the tooth may become loose.',
      dentist_notes: 'Horizontal bone loss ~30% of root length. Clinical probing and scaling needed. Stage II Grade B periodontitis suspected.',
      timeline_progression: {
        now: 'Moderate periodontitis. Manageable with deep cleaning (SRP).',
        sixMonths: 'Bone loss may progress to 40-50% without periodontal treatment.',
        oneYear: 'Tooth mobility and possible tooth loss. Advanced periodontitis.',
      },
      second_opinion: 'agree',
    },
    {
      id: 'f3',
      tooth_id: 'Incisor-11',
      condition: 'Fractured Crown',
      severity: 'Medium',
      confidence: 0.73,
      bbox: [540, 236, 48, 88],
      explanation: 'Radiolucent line observed on the mesial aspect of the upper-right central incisor crown. Fracture line does not appear to extend to root.',
      patient_explanation: 'Your upper front tooth has a crack in the crown. It needs to be repaired soon to prevent it from breaking further or becoming sensitive.',
      dentist_notes: 'Crown fracture on #11, mesial aspect. No periapical pathology. Consider porcelain crown or full coverage restoration. Vitality test recommended.',
      timeline_progression: {
        now: 'Crown fracture only. Restorable with crown placement.',
        sixMonths: 'Fracture may extend sub-gingivally, complicating restoration.',
        oneYear: 'Complete fracture risk; extraction may become necessary.',
      },
      second_opinion: 'agree',
    },
    {
      id: 'f4',
      tooth_id: 'Molar-36',
      condition: 'Impacted Wisdom Tooth',
      severity: 'Low',
      confidence: 0.91,
      bbox: [840, 340, 72, 82],
      explanation: 'Lower-left third molar is mesio-angularly impacted against the second molar. No signs of pericoronitis or cyst formation at this time.',
      patient_explanation: 'Your lower-left wisdom tooth is stuck and growing sideways. It is not causing problems right now, but it should be monitored.',
      dentist_notes: "Mesio-angular impaction #38, Winter's classification IIA. No follicular enlargement. Monitor every 6 months. Elective extraction discussable.",
      timeline_progression: {
        now: 'Asymptomatic impaction. Monitor with periodic X-rays.',
        sixMonths: 'Possible development of pericoronitis or cyst formation.',
        oneYear: 'Increased risk of infection or damage to adjacent molar #37.',
      },
      second_opinion: 'disagree',
    },
    {
      id: 'f5',
      tooth_id: 'Premolar-45',
      condition: 'Old Filling Failure',
      severity: 'Low',
      confidence: 0.68,
      bbox: [392, 330, 48, 80],
      explanation: 'Existing amalgam restoration on lower-right second premolar shows marginal breakdown and possible secondary caries at the restoration margins.',
      patient_explanation: 'An old filling in your lower-right tooth is starting to fail. The edge is breaking down, which can let bacteria in. It should be replaced soon.',
      dentist_notes: 'Defective amalgam restoration on #45 with marginal breakdown. Secondary caries possible. Replacement with composite or onlay recommended.',
      timeline_progression: {
        now: 'Marginal breakdown. Replace restoration to prevent secondary decay.',
        sixMonths: 'Secondary caries likely to develop beneath old filling.',
        oneYear: 'Deeper decay potentially reaching pulp. Higher risk of fracture.',
      },
      second_opinion: 'pending',
    },
  ],
  treatment: {
    priority_list: [
      'Root Canal Treatment — Molar-26 (Urgent)',
      'Periodontal Scaling & Root Planing — Premolar-14',
      'Crown Placement — Incisor-11',
      'Filling Replacement — Premolar-45',
      'Radiographic Monitoring — Molar-36 (Wisdom tooth)',
    ],
    procedures: [
      {
        name: 'Root Canal Treatment (RCT)',
        tooth_id: 'Molar-26',
        urgency: 'Immediate',
        cost_low: 4000,
        cost_high: 8000,
        description: 'Endodontic therapy to remove infected pulp tissue, clean root canals, and seal with inert material. Crown placement post-RCT recommended.',
        patient_description: 'The infected nerve of your tooth will be removed so the pain stops. The tooth is then sealed and protected with a cap.',
      },
      {
        name: 'Periodontal Scaling & Root Planing',
        tooth_id: 'Premolar-14',
        urgency: 'Soon',
        cost_low: 1500,
        cost_high: 3500,
        description: 'Deep cleaning procedure to remove subgingival calculus and biofilm. May require multiple sessions and local anesthesia.',
        patient_description: 'A deep cleaning below the gum line to remove hardened plaque (tartar) that is causing bone loss. Usually done in 2-4 appointments.',
      },
      {
        name: 'Porcelain Crown',
        tooth_id: 'Incisor-11',
        urgency: 'Soon',
        cost_low: 3000,
        cost_high: 6000,
        description: 'Full coverage crown restoration to protect fractured tooth structure and restore aesthetics and function of the central incisor.',
        patient_description: 'A tooth-coloured cap placed over your cracked front tooth to protect it and make it look natural again.',
      },
      {
        name: 'Composite Restoration',
        tooth_id: 'Premolar-45',
        urgency: 'Routine',
        cost_low: 800,
        cost_high: 1500,
        description: 'Removal of failed amalgam restoration and placement of tooth-colored composite resin restoration with proper bonding protocol.',
        patient_description: 'Your old silver filling will be replaced with a new, tooth-coloured filling that looks and feels natural.',
      },
    ],
    cost_estimate_inr: { low: 9300, high: 19000 },
    patient_summary:
      'You have 5 dental issues that need attention. The most urgent is a deep cavity in your back tooth that may be close to the nerve. Getting treatment soon will save your tooth and prevent pain from getting worse.',
    dentist_summary:
      'Findings indicate Stage II Grade B periodontitis, acute carious lesion with possible pulp involvement on #26, crown fracture on #11, defective restoration on #45, and asymptomatic mesio-angular impaction on #38. Immediate endodontic intervention for #26 is the clinical priority.',
  },
};

// ---------------------------------------------------------------------------
// Service functions — replace with real API calls when backend is ready
// ---------------------------------------------------------------------------

/**
 * Simulates uploading an X-ray file.
 * Replace with: return api.post('/scans/upload', formData)
 */
export const uploadXray = async (_file: File): Promise<{ scan_id: string }> => {
  await new Promise((resolve) => setTimeout(resolve, 2800));
  return { scan_id: 'scan_001' };
};

/**
 * Fetches results for a given scan ID.
 * Replace with: return api.get(`/scans/${scanId}/results`)
 */
export const getScanResults = async (_scanId: string): Promise<ScanResult> => {
  await new Promise((resolve) => setTimeout(resolve, 400));
  return MOCK_SCAN_RESULT;
};

export default api;
