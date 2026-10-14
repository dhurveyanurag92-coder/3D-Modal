import React, { useState } from 'react';
import { ArrowLeft, Layers, Download, CheckCircle2 } from 'lucide-react';
import { ProjectState, ViewSlot } from '../../modules/types';
import { triggerDownload } from '../../modules/project/exportService';

interface PageSilhouetteProps {
  project: ProjectState;
  onBack: () => void;
}

export const PageSilhouette: React.FC<PageSilhouetteProps> = ({ project, onBack }) => {
  const [activeView, setActiveView] = useState<ViewSlot>('front');
  const [displayMode, setDisplayMode] = useState<'mask' | 'contour' | 'overlay'>('overlay');

  const sil = project.silhouettes[activeView];
  const imgSlot = project.images[activeView];

  const handleDownloadMask = () => {
    if (!sil?.maskDataUrl) return;
    const a = document.createElement('a');
    a.href = sil.maskDataUrl;
    a.download = `silhouette_mask_${activeView}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-slate-950">
      {/* Top Header */}
      <div className="h-14 border-b border-slate-800 px-4 sm:px-6 flex items-center justify-between gap-4 bg-slate-900/50 shrink-0">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-200 hover:text-white text-xs font-semibold transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-cyan-400" />
            <span>Back to Studio</span>
          </button>
          <div className="h-4 w-px bg-slate-800" />
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            <span>Head Silhouette & Cross-Section Spans</span>
          </h2>
        </div>

        {sil && (
          <button
            type="button"
            onClick={handleDownloadMask}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-medium transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>Download Mask PNG</span>
          </button>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left Column: Image / Mask Canvas Viewport */}
        <div className="flex-1 flex flex-col p-4 sm:p-6 overflow-hidden">
          {/* View Selector & Display Mode Toggles */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-4 shrink-0">
            <div className="flex items-center gap-2">
              {(['front', 'left', 'right', 'back'] as ViewSlot[]).map((slot) => (
                <button
                  key={slot}
                  type="button"
                  onClick={() => setActiveView(slot)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors cursor-pointer ${
                    activeView === slot
                      ? 'bg-cyan-500 text-slate-950 font-bold'
                      : 'bg-slate-900 text-slate-300 hover:bg-slate-850 hover:text-white'
                  }`}
                >
                  {slot} View
                </button>
              ))}
            </div>

            <div className="flex items-center gap-1 bg-slate-900 p-1 rounded-lg border border-slate-800 text-xs">
              <button
                type="button"
                onClick={() => setDisplayMode('overlay')}
                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                  displayMode === 'overlay' ? 'bg-slate-800 text-cyan-300 font-semibold' : 'text-slate-400 hover:text-white'
                }`}
              >
                Outline Overlay
              </button>
              <button
                type="button"
                onClick={() => setDisplayMode('mask')}
                className={`px-2.5 py-1 rounded-md transition-colors cursor-pointer ${
                  displayMode === 'mask' ? 'bg-slate-800 text-cyan-300 font-semibold' : 'text-slate-400 hover:text-white'
                }`}
              >
                Binary Mask
              </button>
            </div>
          </div>

          {/* Visualizer Container */}
          <div className="flex-1 flex items-center justify-center bg-slate-900/40 border border-slate-800 rounded-xl overflow-hidden p-3 relative">
            <div className="relative aspect-square max-h-[75vh] w-auto max-w-full rounded-lg overflow-hidden border border-slate-800 shadow-2xl">
              {displayMode === 'mask' && sil?.maskDataUrl ? (
                <img
                  src={sil.maskDataUrl}
                  alt={`Silhouette mask ${activeView}`}
                  className="w-full h-full object-contain bg-slate-950"
                />
              ) : (
                <div className="relative w-full h-full">
                  <img
                    src={imgSlot.url}
                    alt={`${activeView} view`}
                    className="w-full h-full object-contain"
                  />
                  {sil?.maskDataUrl && displayMode === 'overlay' && (
                    <img
                      src={sil.maskDataUrl}
                      alt="mask overlay"
                      className="absolute inset-0 w-full h-full object-contain mix-blend-screen opacity-50 pointer-events-none"
                    />
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Cross-Section Breadth Profile Graph */}
        <div className="w-full lg:w-88 border-t lg:border-t-0 lg:border-l border-slate-800 bg-slate-950 p-4 sm:p-5 flex flex-col space-y-4 overflow-y-auto">
          <div>
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Cranial Cross-Section Profile
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Horizontal skull span measurements computed from head silhouette.
            </p>
          </div>

          {sil ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-2 text-xs bg-slate-900 p-3 rounded-lg border border-slate-800 font-mono">
                <div>
                  <div className="text-slate-400">Foreground Area:</div>
                  <div className="text-white font-semibold">{sil.areaPixels.toLocaleString()} px</div>
                </div>
                <div>
                  <div className="text-slate-400">Mask Coverage:</div>
                  <div className="text-cyan-400 font-semibold">
                    {Math.round(sil.foregroundFraction * 100)}% of frame
                  </div>
                </div>
              </div>

              <div className="text-[11px] text-slate-400 p-3 rounded-lg bg-slate-900/80 border border-slate-800 space-y-1">
                <div className="font-semibold text-slate-300 flex items-center gap-1.5">
                  <span className={`w-2 h-2 rounded-full ${sil.quality === 'valid' ? 'bg-emerald-400' : 'bg-amber-400'}`} />
                  <span>Local Color-Contrast Fallback</span>
                </div>
                <div className="leading-relaxed">{sil.notes}</div>
              </div>

              {/* Horizontal Breadth Bar Visualizer */}
              <div>
                <div className="text-xs font-semibold text-slate-300 mb-2">
                  Horizontal Breadth vs Vertical Height
                </div>
                <div className="space-y-1 bg-slate-900/60 p-3 rounded-lg border border-slate-800 max-h-80 overflow-y-auto">
                  {sil.horizontalSpans
                    .filter((_, idx) => idx % 6 === 0)
                    .map((span, idx) => (
                      <div key={idx} className="flex items-center gap-2 text-[10px] font-mono">
                        <span className="text-slate-400 w-10 shrink-0">
                          Y: {Math.round(span.y * 100)}%
                        </span>
                        <div className="flex-1 bg-slate-800 h-2 rounded-full overflow-hidden">
                          <div
                            className="bg-cyan-400 h-full rounded-full"
                            style={{ width: `${Math.min(100, span.width * 160)}%` }}
                          />
                        </div>
                        <span className="text-slate-300 w-12 text-right">
                          {Math.round(span.width * 220)}mm
                        </span>
                      </div>
                    ))}
                </div>
              </div>

              <div className="text-[11px] text-slate-400 bg-slate-900/40 p-3 rounded-lg border border-slate-800">
                These horizontal breadths are fed directly into the Wireframe Builder to construct
                the anatomical diameters of the skull rings.
              </div>
            </div>
          ) : (
            <div className="text-xs text-slate-400 py-6 text-center">
              Run the reconstruction pipeline to extract silhouettes for this view.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
