import { useRef, useState, useLayoutEffect } from 'react';
import { useApp } from '../../context/AppContext';
import type { Finding } from '../../types';

interface XRayViewerProps {
  imageUrl: string;
  findings: Finding[];
  activeFindingId?: string;
  onFindingClick?: (finding: Finding) => void;
  showHeatmap?: boolean;
  heatmapUrl?: string;
}

export default function XRayViewer({
  imageUrl,
  findings,
  activeFindingId,
  onFindingClick,
  showHeatmap,
  heatmapUrl,
}: XRayViewerProps) {
  const { mode } = useApp();
  const isDentist = mode === 'dentist';
  const imgRef = useRef<HTMLImageElement>(null);
  const [imgDims, setImgDims] = useState({ 
    width: 0, 
    height: 0, 
    left: 0, 
    top: 0, 
    naturalWidth: 0, 
    naturalHeight: 0,
    isReady: false 
  });

  // Calculate the exact position of the image within the container
  const updateDimensions = () => {
    const img = imgRef.current;
    if (img && img.complete) {
      // getBoundingClientRect gives us the exact rendered pixels on screen
      const rect = img.getBoundingClientRect();
      const parentRect = img.parentElement?.getBoundingClientRect();

      setImgDims({
        width: rect.width,
        height: rect.height,
        left: rect.left - (parentRect?.left || 0),
        top: rect.top - (parentRect?.top || 0),
        naturalWidth: img.naturalWidth,
        naturalHeight: img.naturalHeight,
        isReady: true,
      });
    }
  };

  // Update on mount, image load, and window resize
  useLayoutEffect(() => {
    window.addEventListener('resize', updateDimensions);
    return () => window.removeEventListener('resize', updateDimensions);
  }, []);

  const getSeverityColor = (finding: Finding): string => {
    const triage = finding.triage;
    if (triage === 'RED') return '#EF4444';
    if (triage === 'YELLOW') return '#F59E0B';
    if (triage === 'GREEN') return '#22C55E';
    return '#0EA5E9';
  };

  return (
    <div className="relative w-full h-full bg-black rounded-xl overflow-hidden shadow-2xl border border-white/5 flex items-center justify-center">
      {/* Base X-ray image */}
      <img
        ref={imgRef}
        src={imageUrl}
        alt="Dental X-ray"
        className="max-w-full max-h-full object-contain"
        onLoad={updateDimensions}
      />

      {/* Heatmap overlay - Tied to rendered dimensions */}
      {showHeatmap && heatmapUrl && imgDims.isReady && (
        <img
          src={heatmapUrl}
          alt="Grad-CAM Heatmap"
          className="absolute pointer-events-none"
          style={{ 
            mixBlendMode: 'multiply', 
            opacity: 0.5,
            width: imgDims.width,
            height: imgDims.height,
            left: imgDims.left,
            top: imgDims.top,
          }}
        />
      )}

      {/* SVG Overlay - Strictly matched to the image's physical location */}
      {imgDims.isReady && (
        <div 
          className="absolute pointer-events-none"
          style={{
            width: imgDims.width,
            height: imgDims.height,
            left: imgDims.left,
            top: imgDims.top,
          }}
        >
          <svg
            // The viewBox uses natural coordinates, making the math simple
            viewBox={`0 0 ${imgDims.naturalWidth} ${imgDims.naturalHeight}`}
            className="w-full h-full pointer-events-auto"
            preserveAspectRatio="xMidYMid meet"
          >
            {findings.map((finding) => {
              const { bbox } = finding;
              if (!bbox) return null;

              // Simply scale normalized 0-1 coords to natural pixel values
              const x = bbox.x * imgDims.naturalWidth;
              const y = bbox.y * imgDims.naturalHeight;
              const w = bbox.width * imgDims.naturalWidth;
              const h = bbox.height * imgDims.naturalHeight;

              const color = getSeverityColor(finding);
              const isActive = activeFindingId === finding.id;
              
              return (
                <g
                  key={finding.id}
                  onClick={() => onFindingClick?.(finding)}
                  className="cursor-pointer group"
                >
                  {/* Bounding Box */}
                  <rect
                    x={x}
                    y={y}
                    width={w}
                    height={h}
                    fill="transparent"
                    stroke={color}
                    strokeWidth={imgDims.naturalWidth * 0.003} // Scale stroke thickness
                    className="transition-all duration-200"
                    style={{ 
                      filter: isActive ? `drop-shadow(0 0 10px ${color})` : 'none',
                      strokeOpacity: isActive ? 1 : 0.8
                    }}
                  />
                  
                  {/* Label Group */}
                  <g transform={`translate(${x}, ${y - (imgDims.naturalHeight * 0.02)})`}>
                    <rect
                      width={imgDims.naturalWidth * 0.08}
                      height={imgDims.naturalHeight * 0.03}
                      fill={color}
                      rx={2}
                    />
                    <text
                      x={imgDims.naturalWidth * 0.005}
                      y={imgDims.naturalHeight * 0.02}
                      fill="white"
                      style={{ 
                        fontSize: `${imgDims.naturalWidth * 0.012}px`, 
                        fontWeight: 'bold',
                        fontFamily: 'sans-serif'
                      }}
                    >
                      T{finding.tooth_id} • {Math.round(finding.confidence * 100)}%
                    </text>
                  </g>
                </g>
              );
            })}
          </svg>
        </div>
      )}

      {/* Legend */}
      <div className="absolute bottom-3 right-3 flex gap-4 text-[10px] font-bold bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 z-20 pointer-events-none">
        <span className="flex items-center gap-1.5" style={{ color: '#EF4444' }}>
          <div className="w-2 h-2 rounded-full bg-[#EF4444]" /> URGENT
        </span>
        <span className="flex items-center gap-1.5" style={{ color: '#F59E0B' }}>
          <div className="w-2 h-2 rounded-full bg-[#F59E0B]" /> MONITOR
        </span>
        <span className="flex items-center gap-1.5" style={{ color: '#22C55E' }}>
          <div className="w-2 h-2 rounded-full bg-[#22C55E]" /> MILD
        </span>
      </div>
    </div>
  );
}
