import React, { useState } from 'react';
import { ArrowLeft, Activity, Download, Info, CheckCircle2 } from 'lucide-react';
import { ProjectState, ViewSlot } from '../../modules/types';

interface PageDepthMapProps {
  project: ProjectState;
  onBack: () => void;
}

export const PageDepthMap: React.FC<PageDepthMapProps> = ({ project, onBack }) => {
  const [activeView, setActiveView] = useState<ViewSlot>('front');

  const depthData = project.depthMaps[activeView];
  const origImg = project.images[activeView];

  const handleDownload = () => {
    if (!depthData?.depthImageUrl) return;
    const a = document.createElement('a');
    a.href = depthData.depthImageUrl;
    a.download = `depth_map_${activeView}.png`;
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
            <Activity className="w-4 h-4 text-cyan-400" />
            <span>Relative Cranial Depth Map Generator</span>
          </h2>
        </div>

        {depthData && (
          <button
            type="button"
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-medium transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>Download Depth Map PNG</span>
          </button>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left Column: Depth Map & Original Comparison */}
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

          {/* Dual Comparison Container */}
          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 items-center justify-center bg-slate-900/30 border border-slate-800 rounded-xl p-4 overflow-hidden">
            {/* Reference Photo */}
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

            {/* Generated Depth Map */}
            <div className="flex flex-col items-center">
              <span className="text-xs font-medium text-cyan-400 mb-2">
                Relative Depth Map (Turbo Spectrum)
              </span>
              <div className="aspect-square max-h-[60vh] w-auto rounded-lg overflow-hidden border border-slate-800 shadow-xl bg-slate-950">
                {depthData?.depthImageUrl ? (
                  <img
                    src={depthData.depthImageUrl}
                    alt="depth map"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="flex items-center justify-center h-full text-slate-500 text-xs">
                    Depth map not generated yet
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Scientific Depth Legend & Transparent Metadata */}
        <div className="w-full lg:w-88 border-t lg:border-t-0 lg:border-l border-slate-800 bg-slate-950 p-4 sm:p-5 flex flex-col space-y-4 overflow-y-auto">
          <div>
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Depth Map Metadata & Methodology
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Transparent disclosure of algorithmic pipeline status.
            </p>
          </div>

          {/* Depth Scale Legend */}
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 space-y-2">
            <div className="text-xs font-semibold text-white">Turbo Depth Gradient Legend</div>
            <div className="h-4 rounded-md w-full bg-gradient-to-r from-blue-700 via-emerald-500 via-amber-400 to-red-600 border border-slate-700" />
            <div className="flex justify-between text-[10px] text-slate-400 font-mono">
              <span>Deep / Background (0.0)</span>
              <span>Near / Prominent (1.0)</span>
            </div>
          </div>

          {/* Model Status Card */}
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3.5 space-y-2.5">
            <div className="flex items-center gap-2">
              <Info className="w-4 h-4 text-cyan-400 shrink-0" />
              <div className="text-xs font-semibold text-white">Execution Provenance</div>
            </div>
            {depthData?.disclaimer && (
              <div className="text-[11px] text-amber-300 bg-amber-500/10 border border-amber-500/20 p-2.5 rounded-lg leading-relaxed">
                {depthData.disclaimer}
              </div>
            )}
            <div className="text-xs text-slate-300 leading-relaxed">
              {depthData?.notes ||
                'Generated locally using client-side canvas gradient analysis and ellipsoidal cranial projection. No external server AI weights downloaded.'}
            </div>
            <div className="text-[11px] text-slate-400 border-t border-slate-800 pt-2 font-mono">
              Adapter: <span className="text-cyan-400">Local Heuristic Fallback</span>
            </div>
          </div>

          {/* How to add ONNX Depth Model */}
          <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-3.5 space-y-2 text-xs text-slate-400">
            <div className="font-semibold text-slate-300">Optional Model Adapter</div>
            <p className="text-[11px] leading-relaxed">
              To bind a neural monocular depth estimation model (such as Depth-Anything-V2 ONNX or
              MiDaS small), place the model ONNX weight file into <code className="text-cyan-300">/models/depth/</code>.
              The app automatically loads ONNX WebGL execution when present.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
