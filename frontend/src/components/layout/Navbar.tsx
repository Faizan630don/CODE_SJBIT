import { Link, useLocation } from 'react-router-dom';
import { Activity, Brain, ChevronRight } from 'lucide-react';
import ModeToggle from '../ModeToggle';

const steps = [
  { label: 'Upload', path: '/' },
  { label: 'Viewer', path: '/viewer' },
  { label: 'Report', path: '/dashboard' },
];

export default function Navbar() {
  const { pathname } = useLocation();
  const currentStep = steps.findIndex((s) => s.path === pathname);

  return (
    <header className="sticky top-0 z-50 border-b border-surface-border glass">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-6">
        {/* Brand */}
        <Link to="/" className="flex items-center gap-2.5 shrink-0 group">
          <div className="w-9 h-9 rounded-xl bg-brand-600/20 border border-brand-600/30 flex items-center justify-center group-hover:bg-brand-600/30 transition-colors">
            <Brain className="w-5 h-5 text-brand-400" />
          </div>
          <div>
            <span className="font-extrabold text-white tracking-tight leading-none text-[15px]">
              DentalVision
            </span>
            <span className="text-brand-400 font-extrabold text-[15px]"> AI</span>
            <div className="flex items-center gap-1 mt-0.5">
              <Activity className="w-2.5 h-2.5 text-emerald-400 animate-pulse-slow" />
              <span className="text-[10px] text-emerald-400 font-medium tracking-wide">LIVE ANALYSIS</span>
            </div>
          </div>
        </Link>

        {/* Step breadcrumb */}
        <nav className="hidden md:flex items-center gap-1 text-sm">
          {steps.map((step, i) => {
            const isActive = i === currentStep;
            const isDone = i < currentStep;
            return (
              <div key={step.path} className="flex items-center gap-1">
                {i > 0 && <ChevronRight className="w-3.5 h-3.5 text-gray-600" />}
                <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-brand-600/20 text-brand-300 border border-brand-600/30'
                    : isDone
                    ? 'text-gray-400'
                    : 'text-gray-600'
                }`}>
                  <span className={`w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold ${
                    isActive ? 'bg-brand-600 text-white' : isDone ? 'bg-emerald-500/20 text-emerald-400' : 'bg-surface-raised text-gray-600'
                  }`}>
                    {isDone ? '✓' : i + 1}
                  </span>
                  {step.label}
                </div>
              </div>
            );
          })}
        </nav>

        {/* Mode toggle */}
        <ModeToggle />
      </div>
    </header>
  );
}
