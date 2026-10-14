import React, { useState } from 'react';
import { ArrowLeft, Compass, Download, Info } from 'lucide-react';
import { ProjectState, ViewSlot } from '../../modules/types';

interface PageNormalMapProps {
  project: ProjectState;
  onBack: () => void;
}

export const PageNormalMap: React.FC<PageNormalMapProps> = ({ project, onBack }) => {
  const [activeView, setActiveView] = useState<ViewSlot>('front');

  const normalData = project.normalMaps[activeView];
  const origImg = project.images[activeView];

  const handleDownload = () => {
    if (!normalData?.normalImageUrl) return;
    const a = document.createElement('a');
    a.href = normalData.normalImageUrl;
    a.download = `normal_map_${activeView}.png`;
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
            <Compass className="w-4 h-4 text-cyan-400" />
            <span>Surface Normal Map Vectors (Sobel Convolution)</span>
          </h2>
        </div>

        {normalData && (
          <button
            type="button"
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-medium transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>Download Normal Map PNG</span>
          </button>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left Column: Normal Map & Original Photo */}
        <div className="flex-1 flex flex-col p-4 sm:p-6 overflow-hidden">
          {/* View Selector */}
          <div className="flex items-center gap-2 mb-4 shrink-0">
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

          {/* Dual Viewports */}
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 items-center justify-center bg-slate-900/30 border border-slate-800 rounded-xl p-4 overflow-hidden">
            <div className="flex flex-col items-center">
              <span className="text-xs font-medium text-slate-400 mb-2">Original Reference Photo</span>
              <div className="aspect-square max-h-[60vh] w-auto rounded-lg overflow-hidden border border-slate-800 shadow-xl bg-slate-950">
                <img
                  src={origImg.url}
                  alt="original"
                  className="w-full h-full object-contain"
                />
              </div>
            </div>

            <div className="flex flex-col items-center">
              <span className="text-xs font-medium text-cyan-400 mb-2">
                Estimated Normal Map (Tangent Space RGB)
              </span>
              <div className="aspect-square max-h-[60vh] w-auto rounded-lg overflow-hidden border border-slate-800 shadow-xl bg-slate-950">
                {normalData?.normalImageUrl ? (
                  <img
                    src={normalData.normalImageUrl}
                    alt="normal map"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-slate-500 text-xs">
                    Normal map not generated yet
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Normal Channel Explanation */}
        <div className="w-full lg:w-88 border-t lg:border-t-0 lg:border-l border-slate-800 bg-slate-950 p-4 sm:p-5 flex flex-col space-y-4 overflow-y-auto">
          <div>
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Normal Vector Encoding
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Standard tangent space coordinate mapping.
            </p>
          </div>

          <div className="space-y-2 bg-slate-900 border border-slate-800 rounded-xl p-3.5 text-xs">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-red-500 shrink-0" />
              <div>
                <span className="font-semibold text-white">Red Channel (X):</span>{' '}
                <span className="text-slate-400">Horizontal gradient (+Right / -Left)</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-emerald-500 shrink-0" />
              <div>
                <span className="font-semibold text-white">Green Channel (Y):</span>{' '}
                <span className="text-slate-400">Vertical gradient (+Up / -Down)</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded bg-blue-500 shrink-0" />
              <div>
                <span className="font-semibold text-white">Blue Channel (Z):</span>{' '}
                <span className="text-slate-400">Surface perpendicular facing viewer (+Z)</span>
              </div>
            </div>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3.5 space-y-2 text-xs text-slate-300 leading-relaxed">
            <div className="font-semibold text-white flex items-center gap-1.5">
              <Info className="w-4 h-4 text-cyan-400" />
              <span>Constraint Usage</span>
            </div>
            {normalData?.disclaimer && (
              <div className="text-[11px] text-amber-300 bg-amber-500/10 border border-amber-500/20 p-2.5 rounded-lg leading-relaxed">
                {normalData.disclaimer}
              </div>
            )}
            <p className="text-[11px]">
              {normalData?.notes ||
                'Calculated via dual-axis 3x3 Sobel kernel filtering. Used as secondary curvature constraints for cross-section ellipse orientation.'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
