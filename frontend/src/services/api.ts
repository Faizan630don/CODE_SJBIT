/**
 * api.ts — DentalVision AI Frontend
 * Orchestrates real-time communication with the FastAPI backend and validates AI results.
 */

import { validateAnalysisResult, logValidationIssues } from '../utils/dataValidator';
import type { ScanResult } from '../types';

const USE_MOCK = false; 
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// Local cache for performance
const resultCache: Record<string, ScanResult> = {};

/**
 * Sends an X-ray to the backend and returns the validated, high-accuracy analysis.
 */
export async function analyzeScan(
  file: File, 
  patientInfo: { name: string; age: number; sex: string } = { name: 'Patient', age: 30, sex: 'M' }
): Promise<ScanResult> {
  if (USE_MOCK) {
    throw new Error("Mock mode is disabled. Please ensure backend is running.");
  }

  const formData = new FormData();
  formData.append('file', file);
  formData.append('patient_name', patientInfo.name);
  formData.append('patient_age', String(patientInfo.age));
  formData.append('patient_sex', patientInfo.sex);

  try {
    const res = await fetch(`${BASE_URL}/analyze`, {
      method: 'POST',
      body: formData,
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(errorData.detail || `Backend error: ${res.status}`);
    }

    let rawData = await res.json();

    // ── CRITICAL: Validate and normalize backend data ────────────────────
    // This ensures bounding boxes are normalized and FDI numbers are valid.
    const validatedData = validateAnalysisResult(rawData);

    // Log any validation issues for clinical auditing
    validatedData.findings.forEach((f: any) => logValidationIssues(f));

    // Store in cache
    resultCache[validatedData.scan_id] = validatedData;

    return validatedData;
  } catch (error) {
    console.error('API error:', error);
    throw error;
  }
}

/**
 * Compatibility wrapper for existing upload flows.
 */
export async function uploadXray(
  file: File, 
  patientInfo?: { name: string; age: number; sex: string }
): Promise<{ scan_id: string }> {
  const result = await analyzeScan(file, patientInfo);
  return { scan_id: result.scan_id };
}


/**
 * Retrieves cached or fresh scan results.
 */
export async function getScanResults(scanId: string): Promise<ScanResult> {
  if (resultCache[scanId]) return resultCache[scanId];
  throw new Error(`Scan ${scanId} not found in local cache.`);
}

export async function fetchSecondOpinion(findings: any[]): Promise<any> {
  try {
    const res = await fetch(`${BASE_URL}/api/second-opinion`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ findings }),
    });

    if (!res.ok) throw new Error(`Second opinion failed: ${res.status}`);
    return await res.json();
  } catch (error) {
    console.error('Second opinion error:', error);
    throw error;
  }
}

/**
 * Checks if the backend inference engine is online.
 */
export async function checkBackendHealth(): Promise<boolean> {
  try {
    const res = await fetch(`${BASE_URL}/health`);
    return res.ok;
  } catch {
    return false;
  }
}

// ── PERSISTENCE (History & Comparison) ───────────────────────────────────

import type { ScanSummary } from '../types';

/**
 * After every successful analysis, save to localStorage.
 */
export function saveScanToHistory(result: ScanResult) {
  const history: ScanSummary[] = JSON.parse(
    localStorage.getItem('scan_history') ?? '[]'
  );
  
  const summary: ScanSummary = {
    scan_id: result.scan_id,
    patient_name: result.patient_name,
    patient_age: result.biological_age,
    scan_date: result.scan_date ?? new Date().toISOString(),
    overall_triage: result.findings.length > 0 ? (result.findings.some(f => f.triage === 'RED') ? 'RED' : result.findings.some(f => f.triage === 'YELLOW') ? 'YELLOW' : 'GREEN') : 'GREEN',
    finding_count: result.findings.length,
    high_count: result.findings.filter(f => f.triage === 'RED').length,
    medium_count: result.findings.filter(f => f.triage === 'YELLOW').length,
    low_count: result.findings.filter(f => f.triage === 'GREEN').length,
    conditions_preview: Array.from(new Set(result.findings.map(f => f.condition))).slice(0, 3),
  };
  
  // Save summary (for history list)
  const existing = history.findIndex(h => h.scan_id === result.scan_id);
  if (existing >= 0) history[existing] = summary;
  else history.unshift(summary);  // newest first
  
  localStorage.setItem('scan_history', JSON.stringify(history.slice(0, 20)));
  
  // Save full result (for comparison detail)
  localStorage.setItem(`scan_full_${result.scan_id}`, JSON.stringify(result));
}

/**
 * Loads full findings for a specific scan.
 */
export function loadFullScan(scanId: string): ScanResult | null {
  const raw = localStorage.getItem(`scan_full_${scanId}`);
  return raw ? JSON.parse(raw) : null;
}

/**
 * Retrieves the summary list of all recent scans.
 */
export function loadScanHistory(): ScanSummary[] {
  return JSON.parse(localStorage.getItem('scan_history') ?? '[]');
}

export default { 
  analyzeScan, 
  uploadXray, 
  getScanResults, 
  fetchSecondOpinion, 
  checkBackendHealth, 
  saveScanToHistory, 
  loadFullScan, 
  loadScanHistory 
};

