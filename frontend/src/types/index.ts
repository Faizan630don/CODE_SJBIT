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
  severity: Severity;
  confidence: number;
  bbox: [number, number, number, number]; // [x, y, width, height]
  explanation: string;
  patient_explanation: string;
  dentist_notes: string;
  timeline_progression: {
    now: string;
    sixMonths: string;
    oneYear: string;
  };
  second_opinion?: 'agree' | 'disagree' | 'pending';
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
