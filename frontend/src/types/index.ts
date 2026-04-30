// Core data types for the DentalVision AI platform

export interface BBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

export type Severity = 'Low' | 'Medium' | 'High';
export type RiskLevel = 'Low' | 'Medium' | 'High';
export type AppMode = 'patient' | 'dentist';

export interface Finding {
  id: string;
  tooth_id: string;
  condition: string;
  severity: 1 | 2 | 3 | 4 | 5;
  confidence: number;
  bbox: BBox;
  triage: 'RED' | 'YELLOW' | 'GREEN';
  explanation: string;
  patient_explanation: string;
  dentist_notes: string;
  timeline_progression: {
    now: string;
    sixMonths: string;
    oneYear: string;
  };
  clinical_name?: string;
  second_opinion?: 'agree' | 'disagree' | 'pending';
  icdas_code?: string;
}

export interface TreatmentProcedure {
  name: string;
  tooth_id: string;
  urgency: 'Immediate' | 'Soon' | 'Routine';
  cost_low: number;
  cost_high: number;
  description: string;
  patient_description: string;
}

export interface ScanResult {
  scan_id: string;
  scan_date: string;
  patient_name: string;
  biological_age: number;
  dental_age: number;
  findings: Finding[];
  risk_score: RiskLevel;
  overall_health: number; // 0-100
  treatment: {
    priority_list: string[];
    procedures: TreatmentProcedure[];
    cost_estimate_inr: { low: number; high: number };
    patient_summary: string;
    dentist_summary: string;
  };
  xray_image_url: string;
  xray_dimensions: { width: number; height: number };
}

export interface ScanSummary {
  scan_id: string;
  patient_name: string;
  patient_age: number;
  scan_date: string;          // ISO string
  overall_triage: 'RED' | 'YELLOW' | 'GREEN';
  finding_count: number;
  high_count: number;
  medium_count: number;
  low_count: number;
  conditions_preview: string[]; // first 3 condition names
  thumbnail_url?: string;       // optional, show X-ray thumb if available
}

export type ChangeType = 'new' | 'resolved' | 'worsened' | 'improved' | 'stable';

export interface FindingChange {
  tooth_id: string;
  condition: string;
  changeType: ChangeType;
  scanA_severity?: 1 | 2 | 3 | 4 | 5;
  scanB_severity?: 1 | 2 | 3 | 4 | 5;
  scanA_confidence?: number;
  scanB_confidence?: number;
  severityDelta: number;        // positive = worse, negative = better, 0 = stable
  changeLabel: string;          // human-readable
}

export interface ComparisonResult {
  scanA_date: string;
  scanB_date: string;
  scanA_triage: 'RED' | 'YELLOW' | 'GREEN';
  scanB_triage: 'RED' | 'YELLOW' | 'GREEN';
  
  changes: FindingChange[];
  
  // Aggregates
  new_findings: FindingChange[];
  resolved_findings: FindingChange[];
  worsened_findings: FindingChange[];
  improved_findings: FindingChange[];
  stable_findings: FindingChange[];

  // Scores
  progression_score: number;     // -100 to +100
  health_trend: 'improving' | 'worsening' | 'stable';
  
  // LLM output
  ai_narrative: string;
  ai_recommendations: string[];
  urgency_change: string;
}

