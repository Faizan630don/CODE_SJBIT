import { useRef, useState, useEffect, useCallback } from 'react';
import { ZoomIn, ZoomOut, RotateCcw, Maximize2 } from 'lucide-react';
import type { Finding } from '../../types';
import { useApp } from '../../context/AppContext';

interface Props {
  imageUrl: string;
  findings: Finding[];
  naturalWidth: number;
  naturalHeight: number;
}

const SEVERITY_COLORS: Record<string, { stroke: string; fill: string }> = {
  High:   { stroke: '#ef4444', fill: 'rgba(239,68,68,0.12)' },
  Medium: { stroke: '#f59e0b', fill: 'rgba(245,158,11,0.12)' },
  Low:    { stroke: '#10b981', fill: 'rgba(16,185,129,0.12)' },
};

export default function XrayViewer({ imageUrl, findings, naturalWidth, naturalHeight }: Props) {
  const { selectedFinding, setSelectedFinding } = useApp();
  const wrapperRef = useRef<HTMLDivElement>(null);
  const imgRef = useRef<HTMLImageElement>(null);
  const [rendered, setRendered] = useState({ w: 0, h: 0 });
  const [zoom, setZoom] = useState(1);
  const [imgLoaded, setImgLoaded] = useState(false);

  const hasImage = Boolean(imageUrl && imageUrl.length > 0);

  const measureImage = useCallback(() => {
    const img = imgRef.current;
    if (!img || !imgLoaded) return;
    setRendered({ w: img.offsetWidth, h: img.offsetHeight });
  }, [imgLoaded]);

  useEffect(() => {
    measureImage();
    const ro = new ResizeObserver(measureImage);
    if (wrapperRef.current) ro.observe(wrapperRef.current);
    return () => ro.disconnect();
  }, [measureImage]);

  const scaleX = rendered.w / naturalWidth;
  const scaleY = rendered.h / naturalHeight;

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center justify-between px-3 py-2 border-b border-surface-border bg-surface-card shrink-0">
        <div className="flex items-center gap-1">
          <button
            onClick={() => setZoom(z => Math.min(z + 0.25, 3))}
            disabled={!hasImage}
            className="p-1.5 rounded-lg hover:bg-surface-raised text-gray-400 hover:text-white transition-colors disabled:opacity-30"
            title="Zoom in"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            onClick={() => setZoom(z => Math.max(z - 0.25, 0.5))}
            disabled={!hasImage}
            className="p-1.5 rounded-lg hover:bg-surface-raised text-gray-400 hover:text-white transition-colors disabled:opacity-30"
            title="Zoom out"
          >
            <ZoomOut className="w-4 h-4" />
          </button>
          <button
            onClick={() => setZoom(1)}
            disabled={!hasImage}
            className="p-1.5 rounded-lg hover:bg-surface-raised text-gray-400 hover:text-white transition-colors disabled:opacity-30"
            title="Reset"
          >
            <RotateCcw className="w-4 h-4" />
          </button>
          <span className="ml-2 text-xs text-gray-500 font-mono">{Math.round(zoom * 100)}%</span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[10px] text-gray-600 font-medium tracking-widest uppercase">Panoramic OPG</span>
          <Maximize2 className="w-3.5 h-3.5 text-gray-600" />
        </div>
      </div>

      {/* Main content area */}
      {!hasImage ? (
        /* No-image placeholder */
        <div className="flex-1 flex flex-col items-center justify-center bg-black gap-4">
          <div className="w-20 h-20 rounded-2xl border-2 border-dashed border-gray-700 flex items-center justify-center">
            <span className="text-4xl">🦷</span>
          </div>
          <div className="text-center">
            <p className="text-gray-400 font-semibold text-sm">No X-ray image uploaded</p>
            <p className="text-gray-600 text-xs mt-1">AI findings are ready — upload a real X-ray to see overlays</p>
          </div>
        </div>
      ) : (
        /* Viewer area */
        <div
          ref={wrapperRef}
          className="relative flex-1 overflow-auto bg-black flex items-center justify-center"
          style={{ minHeight: 0 }}
        >
          <div
            style={{
              transform: `scale(${zoom})`,
              transformOrigin: 'center center',
              transition: 'transform 0.2s ease',
              position: 'relative',
              display: 'inline-block',
            }}
          >
            {/* X-ray image */}
            <img
              ref={imgRef}
              src={imageUrl}
              alt="Dental panoramic X-ray (OPG)"
              draggable={false}
              className="block select-none"
              style={{
                maxWidth: '100%',
                maxHeight: 'calc(100vh - 220px)',
                filter: 'brightness(1.1) contrast(1.15)',
                display: imgLoaded ? 'block' : 'none',
              }}
              onLoad={() => {
                setImgLoaded(true);
                requestAnimationFrame(measureImage);
              }}
            />

            {/* Loading state */}
            {!imgLoaded && (
              <div className="w-[700px] h-[340px] bg-black flex items-center justify-center">
                <div className="text-center space-y-3">
                  <div className="w-10 h-10 border-2 border-brand-600/30 border-t-brand-400 rounded-full animate-spin mx-auto" />
                  <p className="text-sm text-gray-500">Loading X-ray…</p>
                </div>
              </div>
            )}

            {/* SVG overlay — same size as rendered image */}
            {imgLoaded && rendered.w > 0 && (
              <svg
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: rendered.w,
                  height: rendered.h,
                  pointerEvents: 'none',
                }}
                viewBox={`0 0 ${rendered.w} ${rendered.h}`}
              >
                {findings.map((f) => {
                  const [nx, ny, nw, nh] = f.bbox;
                  const sx = nx * scaleX;
                  const sy = ny * scaleY;
                  const sw = nw * scaleX;
                  const sh = nh * scaleY;
                  const col = SEVERITY_COLORS[f.severity] || SEVERITY_COLORS.Low;
                  const isSelected = selectedFinding?.id === f.id;
                  const labelW = Math.max(sw, 90);

                  return (
                    <g
                      key={f.id}
                      style={{ pointerEvents: 'all', cursor: 'pointer' }}
                      onClick={() => setSelectedFinding(isSelected ? null : f)}
                    >
                      {isSelected && (
                        <rect
                          x={sx - 5} y={sy - 5} width={sw + 10} height={sh + 10}
                          rx={7} fill="none"
                          stroke={col.stroke} strokeWidth={1.5} strokeDasharray="5 4"
                          opacity={0.6}
                          className="bbox-ring"
                        />
                      )}
                      <rect
                        x={sx} y={sy} width={sw} height={sh}
                        rx={4}
                        fill={isSelected ? col.fill : 'rgba(0,0,0,0.01)'}
                        stroke={col.stroke}
                        strokeWidth={isSelected ? 2.5 : 1.8}
                        opacity={isSelected ? 1 : 0.75}
                      />
                      <rect
                        x={sx} y={Math.max(sy - 22, 2)}
                        width={labelW} height={20}
                        rx={4} fill={col.stroke} opacity={0.92}
                      />
                      <text
                        x={sx + 6} y={Math.max(sy - 7, 16)}
                        fontSize={10} fontWeight={700} fill="white"
                        fontFamily="'Plus Jakarta Sans', Inter, sans-serif"
                      >
                        {f.tooth_id} · {f.severity}
                      </text>
                      <circle
                        cx={sx + sw - 6} cy={sy + 6} r={4}
                        fill={col.stroke} opacity={0.85}
                      />
                    </g>
                  );
                })}
              </svg>
            )}
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="flex items-center gap-5 px-4 py-2 border-t border-surface-border bg-surface-card shrink-0">
        <span className="text-[10px] text-gray-600 uppercase tracking-wider font-semibold">Severity:</span>
        {(['High', 'Medium', 'Low'] as const).map((s) => (
          <div key={s} className="flex items-center gap-1.5">
            <div
              className="w-3 h-3 rounded-sm border-2"
              style={{ borderColor: SEVERITY_COLORS[s].stroke, backgroundColor: SEVERITY_COLORS[s].fill }}
            />
            <span className="text-[11px] text-gray-400">{s}</span>
          </div>
        ))}
        <span className="ml-auto text-[10px] text-gray-600 italic">Click any box to inspect</span>
      </div>
    </div>
  );
}
