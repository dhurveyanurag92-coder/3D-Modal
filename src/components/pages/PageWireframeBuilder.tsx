import React from 'react';
import { ArrowLeft, Box, Download, Sliders, Eye, RefreshCw, CheckCircle2 } from 'lucide-react';
import { ProjectState, WireframeDensity } from '../../modules/types';
import { ThreeWireframeCanvas } from '../viewport/ThreeWireframeCanvas';
import { exportToOBJ, triggerDownload } from '../../modules/project/exportService';

interface PageWireframeBuilderProps {
  project: ProjectState;
  onUpdateSettings: (settings: Partial<ProjectState['settings']>) => void;
  onRebuildWireframe: () => void;
  onOpen3DView: () => void;
  onBack: () => void;
}

export const PageWireframeBuilder: React.FC<PageWireframeBuilderProps> = ({
  project,
  onUpdateSettings,
  onRebuildWireframe,
  onOpen3DView,
  onBack,
}) => {
  const wireframe = project.wireframe;
  const settings = project.settings;

  const handleDownloadOBJ = () => {
    if (!wireframe) return;
    const obj = exportToOBJ(wireframe, project.projectName);
    triggerDownload(obj, `${project.projectName}_hollow_wireframe.obj`, 'text/plain');
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
            <Box className="w-4 h-4 text-cyan-400" />
            <span>Hollow 3D Head Wireframe Construction</span>
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleDownloadOBJ}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-medium transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>Download .OBJ</span>
          </button>
          <button
            type="button"
            onClick={onOpen3DView}
            className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-cyan-400 hover:bg-cyan-300 text-slate-950 text-xs font-bold transition-all cursor-pointer shadow-sm"
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Full-Screen 3D View</span>
          </button>
        </div>
      </div>

      {/* Main Content: Left 3D Viewport, Right Cage Controls */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left Column: Interactive 3D Canvas */}
        <div className="flex-1 relative bg-slate-950 p-2 sm:p-4 flex flex-col">
          <div className="flex-1 rounded-xl overflow-hidden border border-slate-800 relative bg-[#090d16]">
            <ThreeWireframeCanvas
              wireframe={wireframe}
              showPoints={settings.showPoints}
              showEdges={settings.showEdges}
              showSkullRings={settings.showSkullRings}
              showFacialLoops={settings.showFacialLoops}
              pointSize={settings.pointSize}
              themeColor={settings.activeColorTheme}
              autoRotate={false}
            />

            {!wireframe ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-10 bg-slate-950/90 backdrop-blur-xs">
                <Box className="w-12 h-12 text-slate-600 mb-3" />
                <h3 className="text-sm font-bold text-white">Wireframe Reconstruction Pending</h3>
                <p className="text-xs text-slate-400 max-w-md mt-1 mb-4 leading-relaxed">
                  The hollow 3D wireframe has not been computed yet. Run the pipeline or click below to build the wire cage from current inputs.
                </p>
                <button
                  type="button"
                  onClick={onRebuildWireframe}
                  className="px-4 py-2 rounded-lg bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-xs transition-colors cursor-pointer shadow-sm"
                >
                  Generate Wireframe
                </button>
              </div>
            ) : (
              /* Floating Hint Overlay */
              <div className="absolute bottom-3 left-3 pointer-events-none px-2.5 py-1 rounded-md bg-slate-900/80 border border-slate-800 text-[10px] text-slate-400 backdrop-blur-xs">
                Drag to orbit 360° · Scroll to zoom · {wireframe.constrainedVerticesCount} constrained vertices
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Cage Settings & Topology Controls */}
        <div className="w-full lg:w-96 border-t lg:border-t-0 lg:border-l border-slate-800 bg-slate-950 p-4 sm:p-5 flex flex-col space-y-5 overflow-y-auto">
          <div>
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Wireframe Topology Controls
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Control horizontal cross-section rings and facial loops.
            </p>
          </div>

          {/* Density Selector */}
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-slate-300">Wireframe Density</label>
            <div className="grid grid-cols-3 gap-2">
              {(['low', 'medium', 'high'] as WireframeDensity[]).map((d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => {
                    const rings = d === 'low' ? 10 : d === 'high' ? 22 : 15;
                    const meridians = d === 'low' ? 12 : d === 'high' ? 24 : 16;
                    onUpdateSettings({ density: d, ringsCount: rings, meridiansCount: meridians });
                  }}
                  className={`py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors cursor-pointer ${
                    settings.density === d
                      ? 'bg-cyan-500 text-slate-950 font-bold'
                      : 'bg-slate-900 text-slate-300 hover:bg-slate-850'
                  }`}
                >
                  {d}
                </button>
              ))}
            </div>
          </div>

          {/* Ring Count Slider */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Horizontal Skull Rings</span>
              <span className="font-mono text-cyan-400 font-semibold">{settings.ringsCount}</span>
            </div>
            <input
              type="range"
              min="8"
              max="24"
              value={settings.ringsCount}
              onChange={(e) => onUpdateSettings({ ringsCount: parseInt(e.target.value) })}
              className="w-full accent-cyan-400 cursor-pointer"
            />
          </div>

          {/* Meridians Count Slider */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Longitudinal Meridians</span>
              <span className="font-mono text-cyan-400 font-semibold">{settings.meridiansCount}</span>
            </div>
            <input
              type="range"
              min="8"
              max="24"
              value={settings.meridiansCount}
              onChange={(e) => onUpdateSettings({ meridiansCount: parseInt(e.target.value) })}
              className="w-full accent-cyan-400 cursor-pointer"
            />
          </div>

          {/* Layer Toggles */}
          <div className="space-y-2 pt-2 border-t border-slate-800">
            <div className="text-xs font-semibold text-slate-300">Feature Layer Toggles</div>
            <label className="flex items-center justify-between text-xs text-slate-300 cursor-pointer">
              <span>Horizontal Skull Rings</span>
              <input
                type="checkbox"
                checked={settings.showSkullRings}
                onChange={(e) => onUpdateSettings({ showSkullRings: e.target.checked })}
                className="rounded border-slate-700 bg-slate-900 text-cyan-400"
              />
            </label>
            <label className="flex items-center justify-between text-xs text-slate-300 cursor-pointer">
              <span>Facial Anatomical Loops (Eyes, Nose, Mouth)</span>
              <input
                type="checkbox"
                checked={settings.showFacialLoops}
                onChange={(e) => onUpdateSettings({ showFacialLoops: e.target.checked })}
                className="rounded border-slate-700 bg-slate-900 text-cyan-400"
              />
            </label>
            <label className="flex items-center justify-between text-xs text-slate-300 cursor-pointer">
              <span>Connecting Line Edges</span>
              <input
                type="checkbox"
                checked={settings.showEdges}
                onChange={(e) => onUpdateSettings({ showEdges: e.target.checked })}
                className="rounded border-slate-700 bg-slate-900 text-cyan-400"
              />
            </label>
            <label className="flex items-center justify-between text-xs text-slate-300 cursor-pointer">
              <span>Vertex Points</span>
              <input
                type="checkbox"
                checked={settings.showPoints}
                onChange={(e) => onUpdateSettings({ showPoints: e.target.checked })}
                className="rounded border-slate-700 bg-slate-900 text-cyan-400"
              />
            </label>
          </div>

          {/* Point Size Slider */}
          <div className="space-y-1.5 pt-2 border-t border-slate-800">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Vertex Point Size</span>
              <span className="font-mono text-cyan-400 font-semibold">{settings.pointSize}px</span>
            </div>
            <input
              type="range"
              min="1.5"
              max="6.0"
              step="0.5"
              value={settings.pointSize}
              onChange={(e) => onUpdateSettings({ pointSize: parseFloat(e.target.value) })}
              className="w-full accent-cyan-400 cursor-pointer"
            />
          </div>

          {/* Topology Stats */}
          {wireframe && (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 space-y-1.5 text-xs font-mono">
              <div className="text-slate-400 flex justify-between">
                <span>Total Vertices:</span>
                <span className="text-white font-bold">{wireframe.totalPoints}</span>
              </div>
              <div className="text-slate-400 flex justify-between">
                <span>Total Line Edges:</span>
                <span className="text-white font-bold">{wireframe.totalEdges}</span>
              </div>
              <div className="text-slate-400 flex justify-between">
                <span>Solid Faces:</span>
                <span className="text-emerald-400 font-bold">0 (Hollow Cage)</span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
