import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { LayoutDashboard, ArrowLeft, Upload, User2 } from 'lucide-react';
import { useApp } from '../context/AppContext';
import api from '../services/api';
import XrayViewer from '../components/viewer/XrayViewer';
import FindingsList from '../components/viewer/FindingsList';

export default function Viewer() {
  const navigate = useNavigate();
  const { scanResult, setScanResult, uploadedImageUrl } = useApp();
  const fetchedRef = useRef(false);

  useEffect(() => {
    if (!scanResult) {
      navigate('/');
      return;
    }

    if (!fetchedRef.current && scanResult.findings.some(f => f.second_opinion === 'pending')) {
      fetchedRef.current = true;
      api.fetchSecondOpinion(scanResult.findings).then((soResult) => {
        if (soResult && soResult.consensus) {
          const updatedFindings = scanResult.findings.map(f => {
            const agree = soResult.consensus.agreements?.find((a: any) => a.id === f.id);
            const disagree = soResult.consensus.disagreements?.find((d: any) => d.id === f.id);
            if (agree) return { ...f, second_opinion: 'agree' as const };
            if (disagree) return { ...f, second_opinion: 'disagree' as const };
            return f;
          });
          setScanResult({ ...scanResult, findings: updatedFindings });
        }
      }).catch(err => {
        console.error("Second opinion fetch failed:", err);
      });
    }
  }, [scanResult, navigate, setScanResult]);

  if (!scanResult) return null;

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col animate-fade-in">
      {/* Top toolbar */}
      <div className="flex items-center justify-between px-4 py-2.5 border-b border-surface-border bg-surface-card shrink-0">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate('/')} className="btn-secondary !py-1.5 !px-3 text-xs gap-1.5">
            <ArrowLeft className="w-3.5 h-3.5" />
            Re-upload
          </button>
          <div>
            <h1 className="text-sm font-bold text-white">X-ray Analysis Viewer</h1>
            <p className="text-[11px] text-gray-500">
              {scanResult.findings.length} findings detected · {scanResult.scan_date ? new Date(scanResult.scan_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }) : ''}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-4 mr-4">
            {(['High', 'Medium', 'Low'] as const).map((s) => {
              const count = scanResult.findings.filter((f) => {
                if (s === 'High') return f.severity >= 4;
                if (s === 'Medium') return f.severity === 3;
                return f.severity <= 2;
              }).length;
              const colors: Record<string, string> = {
                High: 'text-red-400 bg-red-950/50 border-red-800/50',
                Medium: 'text-amber-400 bg-amber-950/50 border-amber-800/50',
                Low: 'text-emerald-400 bg-emerald-950/50 border-emerald-800/50',
              };
              return (
                <div key={s} className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold ${colors[s]}`}>
                  <span>{count}</span>
                  <span>{s}</span>
                </div>
              );
            })}
          </div>
          <button
            onClick={() => navigate('/patient')}
            className="btn-secondary !py-1.5 !px-4 text-xs hidden sm:flex"
          >
            <User2 className="w-3.5 h-3.5" />
            Patient View
          </button>
          <button
            onClick={() => navigate('/dashboard')}
            className="btn-primary !py-1.5 !px-4 text-xs"
          >
            <LayoutDashboard className="w-3.5 h-3.5" />
            View Report
          </button>
        </div>
      </div>

      {/* Main layout: viewer + findings panel */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* X-ray viewer — takes most space */}
        <div className="flex-1 min-w-0 border-r border-surface-border">
          <XrayViewer
            imageUrl={scanResult.xray_image_url || uploadedImageUrl}
            findings={scanResult.findings}
          />
        </div>

        {/* Findings panel — fixed width sidebar */}
        <div className="w-[340px] shrink-0 overflow-y-auto flex flex-col bg-surface-card">
          <FindingsList findings={scanResult.findings} />
        </div>
      </div>
    </div>
  );
}
