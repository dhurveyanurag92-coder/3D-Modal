import React, { useState } from 'react';
import { ArrowLeft, Layers, AlertTriangle, CheckCircle2, Sliders } from 'lucide-react';
import { ProjectState, ViewSlot } from '../../modules/types';
import { project3DTo2D } from '../../modules/comparison/comparisonEngine';

interface PageComparisonProps {
  project: ProjectState;
  onOpenEditor?: () => void;
  onBack: () => void;
}

export const PageComparison: React.FC<PageComparisonProps> = ({ project, onOpenEditor, onBack }) => {
  const [activeView, setActiveView] = useState<ViewSlot>('front');
  const [wireframeOpacity, setWireframeOpacity] = useState(0.85);
  const [showErrorLines, setShowErrorLines] = useState(true);

  const img = project.images[activeView];
  const validation = project.validationReport;
  const viewReport = validation?.perViewReports[activeView];
  const wireframe = project.wireframe;

  // Project all wireframe vertices for the active camera view
  const projectedVertices =
    wireframe?.vertices.map((v) => ({
      id: v.id,
      label: v.label,
      category: v.category,
      proj: project3DTo2D(v, activeView, project.settings.calibrationMm),
    })) || [];

  const vertexProjMap = new Map<string, { x: number; y: number }>();
  projectedVertices.forEach((p) => vertexProjMap.set(p.id, p.proj));

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
            <span>Four-View Orthographic Projection & Comparison</span>
          </h2>
        </div>

        {onOpenEditor && (
          <button
            type="button"
            onClick={onOpenEditor}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all cursor-pointer shadow-sm active:scale-95"
            title="Open Precision D-Pad Sculptor to adjust points"
          >
            <span className="text-sm">✏️</span>
            <span>Manual Sculpt (मैन्युअल एडिट)</span>
          </button>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left Column: Projected Wireframe Overlay on Reference Photo */}
        <div className="flex-1 flex flex-col p-4 sm:p-6 overflow-hidden">
          {/* Controls Bar */}
          <div className="flex flex-wrap items-center justify-between gap-4 mb-4 shrink-0">
            {/* View Selector */}
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

            {/* Wireframe Opacity Slider */}
            <div className="flex items-center gap-3 bg-slate-900 px-3 py-1.5 rounded-lg border border-slate-800 text-xs">
              <span className="text-slate-400">Overlay Opacity:</span>
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.05"
                value={wireframeOpacity}
                onChange={(e) => setWireframeOpacity(parseFloat(e.target.value))}
                className="w-24 accent-cyan-400 cursor-pointer"
              />
              <span className="font-mono text-cyan-300 w-8">{Math.round(wireframeOpacity * 100)}%</span>
            </div>
          </div>

          {/* Interactive Projected Canvas */}
          <div className="flex-1 flex items-center justify-center bg-slate-900/40 border border-slate-800 rounded-xl overflow-hidden p-3 relative">
            <div className="relative aspect-square max-h-[75vh] w-auto max-w-full rounded-lg overflow-hidden border border-slate-800 shadow-2xl bg-slate-950">
              {/* 1. Underlying Reference Photo */}
              {img.url ? (
                <img
                  src={img.url}
                  alt={`${activeView} view`}
                  className="w-full h-full object-contain pointer-events-none"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-500 text-xs">
                  No image loaded in {activeView} view.
                </div>
              )}

              {!wireframe && (
                <div className="absolute top-3 left-3 px-3 py-1.5 rounded-lg bg-slate-900/90 border border-slate-700 text-xs text-amber-300 backdrop-blur-xs flex items-center gap-2">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400" />
                  <span>Wireframe projection pending pipeline generation</span>
                </div>
              )}

              {/* 2. Projected 3D Wireframe SVG Overlay */}
              <svg
                className="absolute inset-0 w-full h-full pointer-events-none"
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
                style={{ opacity: wireframeOpacity }}
              >
                {/* SVG Line Edges */}
                {wireframe?.edges.map((edge, idx) => {
                  const pA = vertexProjMap.get(edge.sourceId);
                  const pB = vertexProjMap.get(edge.targetId);
                  if (!pA || !pB) return null;

                  return (
                    <line
                      key={`${edge.id}_${idx}`}
                      x1={pA.x * 100}
                      y1={pA.y * 100}
                      x2={pB.x * 100}
                      y2={pB.y * 100}
                      stroke={edge.category === 'facial_loop' ? '#f59e0b' : '#38bdf8'}
                      strokeWidth={edge.category === 'facial_loop' ? '0.45' : '0.25'}
                      strokeOpacity="0.85"
                    />
                  );
                })}

                {/* SVG Vertex Points */}
                {projectedVertices.map((pv, idx) => (
                  <circle
                    key={`${pv.id}_${idx}`}
                    cx={pv.proj.x * 100}
                    cy={pv.proj.y * 100}
                    r={pv.category === 'skull_ring' ? '0.35' : '0.55'}
                    fill={pv.category === 'skull_ring' ? '#38bdf8' : '#f59e0b'}
                  />
                ))}

                {/* Reprojection Disparity Error Vectors */}
                {showErrorLines &&
                  viewReport?.items
                    .filter((item) => item.errorPixels > 8)
                    .map((item) => (
                      <line
                        key={`err_${item.semanticId}`}
                        x1={item.measured2D.x * 100}
                        y1={item.measured2D.y * 100}
                        x2={item.projected2D.x * 100}
                        y2={item.projected2D.y * 100}
                        stroke="#ef4444"
                        strokeWidth="0.5"
                        strokeDasharray="1,1"
                      />
                    ))}
              </svg>
            </div>
          </div>
        </div>

        {/* Right Column: Reprojection Disparity Inspector */}
        <div className="w-full lg:w-96 border-t lg:border-t-0 lg:border-l border-slate-800 bg-slate-950 p-4 sm:p-5 flex flex-col space-y-4 overflow-y-auto">
          <div>
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Reprojection Error Disparity
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Pixel distance between measured 2D landmark and projected 3D wireframe.
            </p>
          </div>

          {viewReport && (
            <div className="grid grid-cols-2 gap-2 text-xs bg-slate-900 p-3 rounded-lg border border-slate-800 font-mono">
              <div>
                <div className="text-slate-400">Mean Disparity:</div>
                <div className="text-cyan-400 font-bold text-sm">
                  {viewReport.meanErrorPixels} px
                </div>
              </div>
              <div>
                <div className="text-slate-400">Peak Disparity:</div>
                <div
                  className={`font-bold text-sm ${
                    viewReport.maxErrorPixels > 25 ? 'text-amber-400' : 'text-emerald-400'
                  }`}
                >
                  {viewReport.maxErrorPixels} px
                </div>
              </div>
            </div>
          )}

          {/* Point Disparity Table */}
          <div className="flex-1 bg-slate-900/40 border border-slate-800 rounded-xl overflow-hidden flex flex-col max-h-96">
            <div className="p-2.5 border-b border-slate-800 text-[11px] font-bold text-slate-400 uppercase tracking-wider bg-slate-950/40 flex justify-between">
              <span>Landmark</span>
              <span>Disparity</span>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60 p-1">
              {viewReport?.items.map((item) => (
                <div
                  key={item.semanticId}
                  className="p-2 rounded-lg flex items-center justify-between text-xs hover:bg-slate-900 transition-colors"
                >
                  <span className="text-slate-300 truncate">{item.label}</span>
                  <span
                    className={`font-mono font-semibold ml-2 ${
                      item.errorPixels > 25
                        ? 'text-rose-400'
                        : item.errorPixels > 15
                        ? 'text-amber-400'
                        : 'text-emerald-400'
                    }`}
                  >
                    {item.errorPixels} px
                  </span>
                </div>
              ))}
            </div>
          </div>

          <div className="text-[11px] text-slate-400 bg-slate-900/30 p-3 rounded-lg border border-slate-800">
            Disparities below 20px indicate high geometric agreement between the 2D photographs and
            the 3D wireframe volume.
          </div>
        </div>
      </div>
    </div>
  );
};
