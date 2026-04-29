import { useState, useEffect, useRef } from 'react';
import { Clock, TrendingUp, AlertTriangle, DollarSign } from 'lucide-react';
import type { ScanResult } from '../../types';
import { useApp } from '../../context/AppContext';

interface Props { result: ScanResult }

const TIME_LABELS = ['Now', '6 Months', '1 Year'];

// Each finding's health score and color at each time step [now, 6mo, 1yr]
const FINDING_PROGRESSION = [
  {
    id: 'f1', tooth: 'Molar-26', label: 'Cavity',
    scores: [72, 38, 10],
    colors: ['#f59e0b', '#ef4444', '#7f1d1d'],
    costMultiplier: [1, 1.6, 2.8],
  },
  {
    id: 'f2', tooth: 'Premolar-14', label: 'Bone Loss',
    scores: [62, 40, 22],
    colors: ['#f59e0b', '#ef4444', '#991b1b'],
    costMultiplier: [1, 1.4, 2.2],
  },
  {
    id: 'f3', tooth: 'Incisor-11', label: 'Fracture',
    scores: [68, 50, 28],
    colors: ['#f59e0b', '#f97316', '#dc2626'],
    costMultiplier: [1, 1.3, 2.0],
  },
  {
    id: 'f4', tooth: 'Molar-36', label: 'Impaction',
    scores: [82, 68, 50],
    colors: ['#10b981', '#f59e0b', '#ef4444'],
    costMultiplier: [1, 1.1, 1.5],
  },
  {
    id: 'f5', tooth: 'Premolar-45', label: 'Old Filling',
    scores: [74, 55, 32],
    colors: ['#10b981', '#f59e0b', '#dc2626'],
    costMultiplier: [1, 1.2, 1.8],
  },
];

// Simplified SVG tooth arch positions [cx, cy, rx, ry, isUpper]
const ARCH_TEETH: { id: string; cx: number; cy: number; rx: number; ry: number; upper: boolean; findingId?: string }[] = [
  // Upper arch (left to right as radiograph = patient's right to left)
  { id: 'u18', cx: 58,  cy: 72,  rx: 10, ry: 13, upper: true },
  { id: 'u17', cx: 82,  cy: 60,  rx: 11, ry: 14, upper: true },
  { id: 'u16', cx: 108, cy: 52,  rx: 13, ry: 15, upper: true },
  { id: 'u15', cx: 135, cy: 47,  rx: 10, ry: 13, upper: true },
  { id: 'u14', cx: 158, cy: 44,  rx: 10, ry: 13, upper: true, findingId: 'f2' },
  { id: 'u13', cx: 180, cy: 42,  rx: 9,  ry: 14, upper: true },
  { id: 'u12', cx: 200, cy: 40,  rx: 8,  ry: 13, upper: true },
  { id: 'u11', cx: 220, cy: 39,  rx: 9,  ry: 14, upper: true, findingId: 'f3' },
  { id: 'u21', cx: 240, cy: 39,  rx: 9,  ry: 14, upper: true },
  { id: 'u22', cx: 260, cy: 40,  rx: 8,  ry: 13, upper: true },
  { id: 'u23', cx: 280, cy: 42,  rx: 9,  ry: 14, upper: true },
  { id: 'u24', cx: 300, cy: 44,  rx: 10, ry: 13, upper: true },
  { id: 'u25', cx: 322, cy: 47,  rx: 10, ry: 13, upper: true },
  { id: 'u26', cx: 348, cy: 52,  rx: 13, ry: 15, upper: true, findingId: 'f1' },
  { id: 'u27', cx: 374, cy: 60,  rx: 11, ry: 14, upper: true },
  { id: 'u28', cx: 398, cy: 72,  rx: 10, ry: 13, upper: true },
  // Lower arch
  { id: 'l48', cx: 58,  cy: 130, rx: 10, ry: 13, upper: false },
  { id: 'l47', cx: 82,  cy: 142, rx: 11, ry: 14, upper: false },
  { id: 'l46', cx: 108, cy: 150, rx: 13, ry: 15, upper: false },
  { id: 'l45', cx: 135, cy: 155, rx: 10, ry: 13, upper: false, findingId: 'f5' },
  { id: 'l44', cx: 158, cy: 158, rx: 10, ry: 13, upper: false },
  { id: 'l43', cx: 180, cy: 160, rx: 9,  ry: 14, upper: false },
  { id: 'l42', cx: 200, cy: 162, rx: 8,  ry: 13, upper: false },
  { id: 'l41', cx: 220, cy: 163, rx: 9,  ry: 14, upper: false },
  { id: 'l31', cx: 240, cy: 163, rx: 9,  ry: 14, upper: false },
  { id: 'l32', cx: 260, cy: 162, rx: 8,  ry: 13, upper: false },
  { id: 'l33', cx: 280, cy: 160, rx: 9,  ry: 14, upper: false },
  { id: 'l34', cx: 300, cy: 158, rx: 10, ry: 13, upper: false },
  { id: 'l35', cx: 322, cy: 155, rx: 10, ry: 13, upper: false },
  { id: 'l36', cx: 348, cy: 150, rx: 13, ry: 15, upper: false, findingId: 'f4' },
  { id: 'l37', cx: 374, cy: 142, rx: 11, ry: 14, upper: false },
  { id: 'l38', cx: 398, cy: 130, rx: 10, ry: 13, upper: false },
];

const BASE_COST = 9300;

function lerp(a: number, b: number, t: number) {
  return Math.round(a + (b - a) * t);
}

function hexToRgb(hex: string) {
  const r = parseInt(hex.slice(1,3), 16);
  const g = parseInt(hex.slice(3,5), 16);
  const b = parseInt(hex.slice(5,7), 16);
  return { r, g, b };
}

function lerpColor(c1: string, c2: string, t: number) {
  const a = hexToRgb(c1);
  const b = hexToRgb(c2);
  return `rgb(${lerp(a.r, b.r, t)},${lerp(a.g, b.g, t)},${lerp(a.b, b.b, t)})`;
}

// Animated counter hook
function useAnimatedValue(target: number, duration = 600) {
  const [display, setDisplay] = useState(target);
  const raf = useRef<number>(0);
  const startRef = useRef<number>(0);
  const fromRef = useRef<number>(target);

  useEffect(() => {
    cancelAnimationFrame(raf.current);
    fromRef.current = display;
    startRef.current = performance.now();
    const animate = (now: number) => {
      const elapsed = now - startRef.current;
      const t = Math.min(elapsed / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(fromRef.current + (target - fromRef.current) * eased));
      if (t < 1) raf.current = requestAnimationFrame(animate);
    };
    raf.current = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(raf.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [target]);

  return display;
}

export default function RiskTimeline({ result }: Props) {
  const { mode } = useApp();
  const isDentist = mode === 'dentist';
  const [rawStep, setRawStep] = useState(0); // 0..2
  const [animStep, setAnimStep] = useState(0.0); // 0.0..2.0 continuous

  // Animate animStep towards rawStep
  const animRef = useRef<number>(0);
  const animFrom = useRef(0);
  const animStart = useRef(0);

  useEffect(() => {
    cancelAnimationFrame(animRef.current);
    animFrom.current = animStep;
    animStart.current = performance.now();
    const duration = 700;
    const target = rawStep;
    const run = (now: number) => {
      const t = Math.min((now - animStart.current) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      const v = animFrom.current + (target - animFrom.current) * eased;
      setAnimStep(v);
      if (t < 1) animRef.current = requestAnimationFrame(run);
    };
    animRef.current = requestAnimationFrame(run);
    return () => cancelAnimationFrame(animRef.current);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rawStep]);

  // Compute costs at each step
  const computeCost = (step: number) => {
    const s0 = Math.floor(step);
    const s1 = Math.min(s0 + 1, 2);
    const frac = step - s0;
    let mult = 0;
    FINDING_PROGRESSION.forEach(fp => {
      mult += fp.costMultiplier[s0] + (fp.costMultiplier[s1] - fp.costMultiplier[s0]) * frac;
    });
    return Math.round(BASE_COST * (mult / FINDING_PROGRESSION.length));
  };

  const animatedCost = useAnimatedValue(computeCost(animStep), 600);

  // Get color for a tooth finding at current animStep
  const getToothColor = (findingId: string) => {
    const fp = FINDING_PROGRESSION.find(f => f.id === findingId);
    if (!fp) return '#888';
    const s0 = Math.floor(animStep);
    const s1 = Math.min(s0 + 1, 2);
    const frac = animStep - s0;
    return lerpColor(fp.colors[s0], fp.colors[s1], frac);
  };

  const getToothGlow = (findingId: string) => {
    const color = getToothColor(findingId);
    return `drop-shadow(0 0 4px ${color})`
  };

  // Get health score for a finding at animStep
  const getScore = (fp: typeof FINDING_PROGRESSION[0]) => {
    const s0 = Math.floor(animStep);
    const s1 = Math.min(s0 + 1, 2);
    const frac = animStep - s0;
    return Math.round(fp.scores[s0] + (fp.scores[s1] - fp.scores[s0]) * frac);
  };

  const progressionWarning = [
    '',
    '⚠️ At 6 months — treatment costs rise significantly. Bone loss becomes harder to reverse.',
    '🚨 At 1 year — multiple teeth at risk of loss. Emergency interventions likely needed.',
  ];

  const stepLabel = rawStep === 0 ? 'Current State' : rawStep === 1 ? '6 Months Without Treatment' : '1 Year Without Treatment';
  const stepColor = rawStep === 0 ? 'text-emerald-400' : rawStep === 1 ? 'text-amber-400' : 'text-red-400';
  const stepBg = rawStep === 0 ? 'bg-emerald-950/50 border-emerald-800/50' : rawStep === 1 ? 'bg-amber-950/50 border-amber-800/50' : 'bg-red-950/50 border-red-800/50';

  return (
    <div className="card p-5 space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Clock className="w-4 h-4 text-brand-400" />
          <div>
            <h3 className="font-bold text-white text-sm">Risk Timeline</h3>
            <p className="text-[11px] text-gray-500">
              {isDentist ? 'Projected clinical deterioration' : 'How your dental health changes without treatment'}
            </p>
          </div>
        </div>
        {/* Live cost counter */}
        <div className="text-right">
          <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold flex items-center gap-1 justify-end">
            <DollarSign className="w-3 h-3" /> Est. Cost
          </p>
          <p className="text-xl font-extrabold text-brand-400 tabular-nums transition-all">
            ₹{animatedCost.toLocaleString('en-IN')}
          </p>
        </div>
      </div>

      {/* === DENTAL ARCH SVG DIAGRAM === */}
      <div className="relative bg-black/40 rounded-2xl border border-surface-border p-4 overflow-hidden">
        <p className="text-[10px] text-gray-600 uppercase tracking-widest font-semibold mb-2 text-center">
          Dental Arch — Affected Teeth
        </p>
        <svg
          viewBox="0 0 456 200"
          className="w-full"
          style={{ maxHeight: 200 }}
        >
          {/* Arch guides */}
          <path d="M30 100 Q228 -10 426 100" fill="none" stroke="#2a2820" strokeWidth="2" />
          <path d="M30 102 Q228 190 426 102" fill="none" stroke="#2a2820" strokeWidth="2" />
          {/* Midline */}
          <line x1="228" y1="28" x2="228" y2="172" stroke="#2a2820" strokeWidth="1" strokeDasharray="3 4" />
          {/* Labels */}
          <text x="20" y="100" fill="#444" fontSize="8" fontFamily="monospace">R</text>
          <text x="432" y="100" fill="#444" fontSize="8" fontFamily="monospace">L</text>
          <text x="208" y="22" fill="#444" fontSize="7" fontFamily="monospace">UPPER</text>
          <text x="206" y="188" fill="#444" fontSize="7" fontFamily="monospace">LOWER</text>

          {ARCH_TEETH.map((t) => {
            const hasFinding = !!t.findingId;
            const color = hasFinding ? getToothColor(t.findingId!) : '#3a3830';
            const glowFilter = hasFinding ? getToothGlow(t.findingId!) : undefined;
            const fp = hasFinding ? FINDING_PROGRESSION.find(f => f.id === t.findingId) : null;
            const score = fp ? getScore(fp) : 100;
            const isActivelyWorsening = hasFinding && rawStep > 0 && score < 60;

            return (
              <g key={t.id}>
                {/* Glow ring for affected teeth */}
                {hasFinding && (
                  <ellipse
                    cx={t.cx} cy={t.cy} rx={t.rx + 4} ry={t.ry + 4}
                    fill={color}
                    opacity={0.15 + (1 - score / 100) * 0.3}
                    style={{ filter: `blur(4px)`, transition: 'all 0.4s ease' }}
                  />
                )}
                {/* Tooth body */}
                <ellipse
                  cx={t.cx} cy={t.cy}
                  rx={t.rx} ry={t.ry}
                  fill={hasFinding ? color : '#2a2820'}
                  stroke={hasFinding ? color : '#3a3830'}
                  strokeWidth={hasFinding ? 1.5 : 1}
                  opacity={hasFinding ? 1 : 0.6}
                  style={{
                    filter: hasFinding ? glowFilter : undefined,
                    transition: 'fill 0.4s ease, stroke 0.4s ease, filter 0.4s ease',
                  }}
                />
                {/* Pulse ring for actively worsening */}
                {isActivelyWorsening && (
                  <ellipse
                    cx={t.cx} cy={t.cy} rx={t.rx + 2} ry={t.ry + 2}
                    fill="none" stroke={color} strokeWidth={1.5}
                    opacity={0.5}
                    className="bbox-ring"
                    style={{ transition: 'stroke 0.4s ease' }}
                  />
                )}
                {/* Tooth ID label for affected teeth */}
                {hasFinding && (
                  <text
                    x={t.cx} y={t.upper ? t.cy - t.ry - 4 : t.cy + t.ry + 10}
                    textAnchor="middle"
                    fontSize={7} fill={color}
                    fontFamily="monospace"
                    fontWeight={700}
                    style={{ transition: 'fill 0.4s ease' }}
                  >
                    {t.id.replace('u','').replace('l','')}
                  </text>
                )}
              </g>
            );
          })}
        </svg>

        {/* Legend */}
        <div className="flex items-center justify-center gap-4 mt-1">
          {[
            { color: '#10b981', label: 'Stable' },
            { color: '#f59e0b', label: 'Warning' },
            { color: '#ef4444', label: 'Critical' },
          ].map(item => (
            <div key={item.label} className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: item.color }} />
              <span className="text-[10px] text-gray-500">{item.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Slider */}
      <div>
        <div className="flex justify-between text-xs font-semibold mb-2">
          {TIME_LABELS.map((l, i) => (
            <span key={l} className={`transition-colors duration-300 ${rawStep === i ? stepColor : 'text-gray-600'}`}>
              {l}
            </span>
          ))}
        </div>
        <input
          type="range" min={0} max={2} step={1}
          value={rawStep}
          onChange={(e) => setRawStep(Number(e.target.value))}
          className="w-full cursor-pointer"
        />
        {/* Current step badge */}
        <div className="flex justify-center mt-3">
          <span className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-bold border transition-all duration-300 ${stepBg} ${stepColor}`}>
            <TrendingUp className="w-3.5 h-3.5" />
            {stepLabel}
          </span>
        </div>
      </div>

      {/* Per-finding health bars */}
      <div className="space-y-3">
        {FINDING_PROGRESSION.map((fp) => {
          const score = getScore(fp);
          const finding = result.findings.find(f => f.id === fp.id);
          const s0 = Math.floor(animStep);
          const s1 = Math.min(s0 + 1, 2);
          const frac = animStep - s0;
          const barColor = lerpColor(fp.colors[s0], fp.colors[s1], frac);

          return (
            <div key={fp.id}>
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs font-semibold text-gray-300 font-mono">{fp.tooth}</span>
                  <span className="text-[10px] text-gray-600">· {fp.label}</span>
                </div>
                <span className="text-xs font-bold tabular-nums" style={{ color: barColor, transition: 'color 0.4s ease' }}>
                  {score}%
                </span>
              </div>
              <div className="h-2 bg-surface-raised rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{
                    width: `${score}%`,
                    backgroundColor: barColor,
                    transition: 'width 0.05s linear, background-color 0.05s linear',
                  }}
                />
              </div>
              {rawStep > 0 && finding && (
                <p className="text-[10px] text-gray-500 mt-0.5 leading-relaxed">
                  {isDentist
                    ? finding.timeline_progression[rawStep === 1 ? 'sixMonths' : 'oneYear']
                    : finding.timeline_progression[rawStep === 1 ? 'sixMonths' : 'oneYear'].split('.')[0] + '.'}
                </p>
              )}
            </div>
          );
        })}
      </div>

      {/* Warning banner — appears after step 0 */}
      {rawStep > 0 && (
        <div className={`flex items-start gap-2 p-3 rounded-xl border animate-fade-in ${
          rawStep === 1
            ? 'bg-amber-950/30 border-amber-900/40 text-amber-300'
            : 'bg-red-950/30 border-red-900/40 text-red-300'
        }`}>
          <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
          <p className="text-xs leading-relaxed font-medium">
            {progressionWarning[rawStep]}
          </p>
        </div>
      )}
    </div>
  );
}
