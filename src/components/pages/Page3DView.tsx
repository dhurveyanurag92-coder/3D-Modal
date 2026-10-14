import React, { useRef, useState } from 'react';
import {
  ArrowLeft,
  RotateCcw,
  Rotate3d,
  Layers,
  Sliders,
  Camera,
  Download,
  Eye,
  Maximize2,
  ZoomIn,
  ZoomOut,
} from 'lucide-react';
import { ProjectState } from '../../modules/types';
import { ThreeWireframeCanvas, ThreeWireframeCanvasRef } from '../viewport/ThreeWireframeCanvas';
import { exportToOBJ, triggerDownload } from '../../modules/project/exportService';

interface Page3DViewProps {
  project: ProjectState;
  onUpdateSettings: (settings: Partial<ProjectState['settings']>) => void;
  onOpenValidation: () => void;
  onBack: () => void;
}

export const Page3DView: React.FC<Page3DViewProps> = ({
  project,
  onUpdateSettings,
  onOpenValidation,
  onBack,
}) => {
  const canvasRef = useRef<ThreeWireframeCanvasRef>(null);

  const [autoRotate, setAutoRotate] = useState(false);
  const [showControlsDrawer, setShowControlsDrawer] = useState(false);
  const [snapshotUrl, setSnapshotUrl] = useState<string | null>(null);

  const wireframe = project.wireframe;
  const settings = project.settings;

  const handleCaptureSnapshot = () => {
    const url = canvasRef.current?.captureScreenshot();
    if (url) {
      setSnapshotUrl(url);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${project.projectName}_3D_wireframe_snapshot.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    }
  };

  const handleDownloadOBJ = () => {
    if (!wireframe) return;
    const obj = exportToOBJ(wireframe, project.projectName);
    triggerDownload(obj, `${project.projectName}_hollow_wireframe.obj`, 'text/plain');
  };

  return (
    <div className="relative w-screen h-screen overflow-hidden bg-[#090d16] flex flex-col select-none">
      {/* 1. Dedicated Top Bar with Back Button */}
      <div className="absolute top-0 left-0 right-0 h-14 bg-slate-950/80 backdrop-blur-md border-b border-white/10 px-4 flex items-center justify-between z-30">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900/90 hover:bg-slate-800 text-slate-200 hover:text-white text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-cyan-400" />
            <span>Back</span>
          </button>
          <div className="h-4 w-px bg-slate-800" />
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-cyan-400" />
            <span className="text-sm font-bold text-white tracking-tight">
              3D Head Wireframe Inspector
            </span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleCaptureSnapshot}
            title="Download PNG snapshot"
            className="p-2 rounded-lg bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 transition-colors cursor-pointer"
          >
            <Camera className="w-4 h-4 text-cyan-400" />
          </button>

          <button
            type="button"
            onClick={handleDownloadOBJ}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-900/90 hover:bg-slate-800 text-slate-200 hover:text-white border border-slate-700 text-xs font-semibold transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Export .OBJ</span>
          </button>

          <button
            type="button"
            onClick={() => setShowControlsDrawer(!showControlsDrawer)}
            className="p-2 rounded-lg bg-slate-900/90 hover:bg-slate-800 text-slate-300 hover:text-white border border-slate-700 transition-colors cursor-pointer"
          >
            <Sliders className="w-4 h-4 text-cyan-400" />
          </button>
        </div>
      </div>

      {/* 2. Fullscreen Three.js WebGL Canvas */}
      <main className="w-full h-full relative">
        <ThreeWireframeCanvas
          ref={canvasRef}
          wireframe={wireframe}
          showPoints={settings.showPoints}
          showEdges={settings.showEdges}
          showSkullRings={settings.showSkullRings}
          showFacialLoops={settings.showFacialLoops}
          pointSize={settings.pointSize}
          themeColor={settings.activeColorTheme}
          autoRotate={autoRotate}
        />

        {!wireframe && (
          <div className="absolute inset-0 flex flex-col items-center justify-center p-6 text-center z-10 bg-slate-950/90 backdrop-blur-xs">
            <div className="w-16 h-16 rounded-2xl bg-slate-900 border border-slate-800 flex items-center justify-center mb-4 text-slate-500 shadow-xl">
              <Rotate3d className="w-8 h-8 text-cyan-400" />
            </div>
            <h2 className="text-base font-bold text-white tracking-tight">
              3D Wireframe Reconstruction Pending
            </h2>
            <p className="text-xs text-slate-400 max-w-md mt-1.5 mb-6 leading-relaxed">
              No active 3D wireframe exists. To construct the model, ensure all 4 reference views are uploaded and run the pipeline from Overview.
            </p>
            <button
              type="button"
              onClick={onBack}
              className="px-4 py-2.5 rounded-xl bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-xs transition-colors cursor-pointer shadow-md"
            >
              Return to Overview
            </button>
          </div>
        )}
      </main>

      {/* 3. Floating View Preset Toolbar */}
      <div className="absolute top-16 sm:top-18 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1 p-1 bg-slate-950/90 backdrop-blur-md border border-white/10 rounded-xl shadow-2xl max-w-[calc(100vw-1rem)] overflow-x-auto">
        <button
          type="button"
          onClick={() => canvasRef.current?.setCameraPreset('front')}
          className="px-2.5 py-1 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
        >
          Front
        </button>
        <button
          type="button"
          onClick={() => canvasRef.current?.setCameraPreset('left')}
          className="px-2.5 py-1 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
        >
          Left
        </button>
        <button
          type="button"
          onClick={() => canvasRef.current?.setCameraPreset('right')}
          className="px-2.5 py-1 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
        >
          Right
        </button>
        <button
          type="button"
          onClick={() => canvasRef.current?.setCameraPreset('back')}
          className="px-2.5 py-1 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
        >
          Back
        </button>
        <button
          type="button"
          onClick={() => canvasRef.current?.setCameraPreset('top')}
          className="px-2.5 py-1 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
        >
          Top
        </button>
        <button
          type="button"
          onClick={() => canvasRef.current?.setCameraPreset('bottom')}
          className="px-2.5 py-1 rounded-lg text-xs font-medium text-slate-300 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
        >
          Bottom
        </button>
        <button
          type="button"
          onClick={() => canvasRef.current?.setCameraPreset('perspective')}
          className="px-2.5 py-1 rounded-lg text-xs font-semibold text-cyan-400 hover:bg-slate-800 transition-colors cursor-pointer shrink-0"
        >
          3/4 Angle
        </button>
      </div>

      {/* 4. Bottom Controls Floating HUD */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 sm:gap-2 p-1.5 bg-slate-950/90 backdrop-blur-md border border-white/10 rounded-2xl shadow-2xl max-w-[calc(100vw-1rem)] overflow-x-auto">
        {/* 360 Turntable Toggle */}
        <button
          type="button"
          onClick={() => setAutoRotate(!autoRotate)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            autoRotate
              ? 'bg-cyan-400 text-slate-950 font-bold shadow-sm'
              : 'bg-slate-900 text-slate-300 hover:text-white'
          }`}
        >
          <Rotate3d className="w-4 h-4" />
          <span>{autoRotate ? 'Rotating' : '360° Orbit'}</span>
        </button>

        {/* Skull Cage Toggle */}
        <button
          type="button"
          onClick={() => onUpdateSettings({ showSkullRings: !settings.showSkullRings })}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            settings.showSkullRings
              ? 'bg-slate-800 text-cyan-300 border border-cyan-400/30'
              : 'bg-slate-900 text-slate-500'
          }`}
        >
          <Layers className="w-4 h-4" />
          <span>Rings</span>
        </button>

        {/* Facial Loops Toggle */}
        <button
          type="button"
          onClick={() => onUpdateSettings({ showFacialLoops: !settings.showFacialLoops })}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all cursor-pointer ${
            settings.showFacialLoops
              ? 'bg-slate-800 text-amber-300 border border-amber-400/30'
              : 'bg-slate-900 text-slate-500'
          }`}
        >
          <span>Face Loops</span>
        </button>

        {/* Reset Camera */}
        <button
          type="button"
          onClick={() => canvasRef.current?.resetCamera()}
          className="p-2 rounded-xl bg-slate-900 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          title="Reset Camera View"
        >
          <RotateCcw className="w-4 h-4" />
        </button>
      </div>

      {/* 5. Slide-Out Settings Panel */}
      {showControlsDrawer && (
        <div className="absolute top-16 right-4 z-40 w-76 bg-slate-950/95 backdrop-blur-md border border-slate-800 rounded-xl p-4 shadow-2xl space-y-4 text-xs text-slate-200">
          <div className="flex justify-between items-center pb-2 border-b border-slate-800">
            <span className="font-bold text-white uppercase text-[11px] tracking-wider">
              Display Adjustments
            </span>
            <button
              type="button"
              onClick={() => setShowControlsDrawer(false)}
              className="text-slate-400 hover:text-white cursor-pointer"
            >
              ✕
            </button>
          </div>

          <div className="space-y-1.5">
            <div className="flex justify-between text-slate-400">
              <span>Vertex Point Size:</span>
              <span className="font-mono text-cyan-400">{settings.pointSize}px</span>
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

          <div className="space-y-2 pt-2 border-t border-slate-800">
            <label className="flex items-center justify-between text-slate-300 cursor-pointer">
              <span>Show Vertex Points</span>
              <input
                type="checkbox"
                checked={settings.showPoints}
                onChange={(e) => onUpdateSettings({ showPoints: e.target.checked })}
                className="rounded border-slate-700 bg-slate-900 text-cyan-400"
              />
            </label>
            <label className="flex items-center justify-between text-slate-300 cursor-pointer">
              <span>Show Line Edges</span>
              <input
                type="checkbox"
                checked={settings.showEdges}
                onChange={(e) => onUpdateSettings({ showEdges: e.target.checked })}
                className="rounded border-slate-700 bg-slate-900 text-cyan-400"
              />
            </label>
          </div>

          <button
            type="button"
            onClick={onOpenValidation}
            className="w-full py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-semibold transition-colors cursor-pointer"
          >
            View Validation Report
          </button>
        </div>
      )}
    </div>
  );
};
