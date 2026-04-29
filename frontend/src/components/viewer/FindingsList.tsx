import { AlertTriangle, CheckCircle, Info, ChevronRight } from 'lucide-react';
import type { Finding } from '../../types';
import { useApp } from '../../context/AppContext';
import SecondOpinionPanel from './SecondOpinionPanel';

interface Props {
  findings: Finding[];
}

const SEVERITY_ICONS = {
  High:   <AlertTriangle className="w-4 h-4 text-red-400" />,
  Medium: <Info className="w-4 h-4 text-amber-400" />,
  Low:    <CheckCircle className="w-4 h-4 text-emerald-400" />,
};

const SEVERITY_BADGE = {
  High:   'badge-high',
  Medium: 'badge-medium',
  Low:    'badge-low',
};

export default function FindingsList({ findings }: Props) {
  const { mode, selectedFinding, setSelectedFinding } = useApp();
  const isDentist = mode === 'dentist';

  return (
    <div className="flex flex-col h-full">
      <div className="px-4 py-3 border-b border-surface-border">
        <h2 className="font-bold text-white text-sm">
          AI Findings
          <span className="ml-2 inline-flex items-center justify-center w-5 h-5 rounded-full bg-red-500/20 text-red-400 text-[10px] font-bold">
            {findings.length}
          </span>
        </h2>
        <p className="text-[11px] text-gray-500 mt-0.5">
          {isDentist ? 'Clinical findings with confidence scores' : 'Click any finding to see it on the X-ray'}
        </p>
      </div>

      {isDentist && <SecondOpinionPanel findings={findings} />}

      <div className="flex-1 overflow-y-auto divide-y divide-surface-border/50">
        {findings.map((f, idx) => {
          const isSelected = selectedFinding?.id === f.id;
          return (
            <button
              key={f.id}
              id={`finding-${f.id}`}
              onClick={() => setSelectedFinding(isSelected ? null : f)}
              className={`w-full text-left px-4 py-3.5 transition-all duration-150 group ${
                isSelected
                  ? 'bg-brand-600/10 border-l-2 border-brand-500'
                  : 'hover:bg-surface-raised border-l-2 border-transparent'
              }`}
            >
              <div className="flex items-start gap-3">
                {/* Number */}
                <div className={`shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold mt-0.5 ${
                  isSelected ? 'bg-brand-600 text-white' : 'bg-surface-raised text-gray-500'
                }`}>
                  {idx + 1}
                </div>

                <div className="flex-1 min-w-0">
                  {/* Header row */}
                  <div className="flex items-center gap-2 flex-wrap">
                    {SEVERITY_ICONS[f.severity]}
                    <span className="font-semibold text-white text-sm truncate">
                      {isDentist ? f.condition : f.condition.split('(')[0].trim()}
                    </span>
                    <span className={SEVERITY_BADGE[f.severity]}>
                      {f.severity}
                    </span>
                  </div>

                  {/* Tooth ID */}
                  <p className="text-[11px] text-gray-500 mt-0.5 font-mono">{f.tooth_id}</p>

                  {/* Explanation */}
                  <p className="text-xs text-gray-400 mt-1.5 leading-relaxed line-clamp-2">
                    {isDentist ? f.explanation : f.patient_explanation}
                  </p>

                  {/* Dentist: confidence score */}
                  {isDentist && (
                    <div className="mt-2 flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-surface-raised rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-brand-600 to-cyan-500"
                          style={{ width: `${f.confidence * 100}%` }}
                        />
                      </div>
                      <span className="text-[10px] text-gray-500 font-mono shrink-0">
                        {Math.round(f.confidence * 100)}% conf.
                      </span>
                    </div>
                  )}
                </div>

                <ChevronRight className={`w-4 h-4 shrink-0 mt-1 transition-transform ${
                  isSelected ? 'rotate-90 text-brand-400' : 'text-gray-600 group-hover:text-gray-400'
                }`} />
              </div>

              {/* Expanded detail panel */}
              {isSelected && (
                <div className="mt-3 ml-9 p-3 rounded-xl bg-surface-raised border border-surface-border animate-fade-in">
                  {isDentist && (
                    <div className="mb-2">
                      <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold mb-1">Clinical Notes</p>
                      <p className="text-xs text-gray-300 leading-relaxed">{f.dentist_notes}</p>
                    </div>
                  )}
                  <p className="text-[10px] text-gray-500 uppercase tracking-wider font-semibold mb-1">
                    {isDentist ? 'Patient Summary' : 'What this means'}
                  </p>
                  <p className="text-xs text-gray-300 leading-relaxed">{f.patient_explanation}</p>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
