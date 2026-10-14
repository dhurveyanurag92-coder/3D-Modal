import React, { useState, useRef, useEffect, useMemo } from 'react';
import {
  ArrowLeft,
  ZoomIn,
  ZoomOut,
  ChevronLeft,
  ChevronRight,
  ArrowUp,
  ArrowDown,
  Compass,
  Move,
  Undo2,
  Box,
  CheckCircle2,
  Minimize2,
  Maximize2,
  Wand2,
  Palette,
  Info,
  Layers,
  Search,
} from 'lucide-react';
import { Landmark2D, ProjectState, ViewSlot } from '../../modules/types';
import { LANDMARK_2D_CONTOURS } from '../../modules/landmarks/landmark2DContours';
import { autoRefineLandmarks } from '../../modules/landmarks/autoAlignmentAssistant';
import { ThreeWireframeCanvas } from '../viewport/ThreeWireframeCanvas';
import { ANATOMICAL_COLORS, getLandmarkColor } from '../../modules/landmarks/landmarkColors';

interface ManualPrecisionEditorProps {
  project: ProjectState;
  onUpdateLandmark: (updated: Landmark2D) => void;
  onBatchUpdateLandmarks?: (updatedList: Landmark2D[]) => void;
  onUndo?: () => void;
  canUndo?: boolean;
  onBack: () => void;
  onOpen3DView?: () => void;
}

type ControlMode = 'nudge_point' | 'pan_screen';
type StepSize = 'fine' | 'normal' | 'coarse';

const STEP_VALUES: Record<StepSize, number> = {
  fine: 0.002, // ~2px on 1024
  normal: 0.008, // ~8px on 1024
  coarse: 0.025, // ~25px on 1024
};

const STEP_LABELS: Record<StepSize, { labelEn: string; labelHi: string; pixels: string }> = {
  fine: { labelEn: 'Fine', labelHi: 'बारीक', pixels: '1px' },
  normal: { labelEn: 'Normal', labelHi: 'साधारण', pixels: '5px' },
  coarse: { labelEn: 'Coarse', labelHi: 'बड़ा', pixels: '15px' },
};

export const ManualPrecisionEditor: React.FC<ManualPrecisionEditorProps> = ({
  project,
  onUpdateLandmark,
  onBatchUpdateLandmarks,
  onUndo,
  canUndo,
  onBack,
  onOpen3DView,
}) => {
  const [activeView, setActiveView] = useState<ViewSlot>('front');
  const [selectedPointId, setSelectedPointId] = useState<string | null>(null);
  const [controlMode, setControlMode] = useState<ControlMode>('nudge_point');
  const [stepSize, setStepSize] = useState<StepSize>('normal');
  const [zoomLevel, setZoomLevel] = useState<number>(1.0);
  const [panOffset, setPanOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [showLines, setShowLines] = useState<boolean>(true);
  const [showMini3D, setShowMini3D] = useState<boolean>(false);
  const [showColorLegend, setShowColorLegend] = useState<boolean>(false);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [assistToast, setAssistToast] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  const activeImg = project.images[activeView];
  const viewLandmarks = useMemo(
    () => project.landmarks.filter((l) => l.view === activeView),
    [project.landmarks, activeView]
  );

  const filteredLandmarks = useMemo(() => {
    if (filterCategory === 'all') return viewLandmarks;
    return viewLandmarks.filter((l) => l.category === filterCategory);
  }, [viewLandmarks, filterCategory]);

  // Select initial point if none selected
  useEffect(() => {
    if (!selectedPointId && viewLandmarks.length > 0) {
      const defaultPt =
        viewLandmarks.find((l) => l.semanticId === 'pronasale') ||
        viewLandmarks.find((l) => l.semanticId === 'nasion') ||
        viewLandmarks[0];
      setSelectedPointId(defaultPt.id);
    } else if (selectedPointId && !viewLandmarks.some((l) => l.id === selectedPointId)) {
      if (viewLandmarks.length > 0) {
        setSelectedPointId(viewLandmarks[0].id);
      } else {
        setSelectedPointId(null);
      }
    }
  }, [activeView, viewLandmarks, selectedPointId]);

  const selectedLm = useMemo(
    () => project.landmarks.find((l) => l.id === selectedPointId),
    [project.landmarks, selectedPointId]
  );

  // Navigate to previous / next point
  const handleNextPoint = (dir: 1 | -1) => {
    if (viewLandmarks.length === 0) return;
    const currentIndex = viewLandmarks.findIndex((l) => l.id === selectedPointId);
    let nextIndex = currentIndex + dir;
    if (nextIndex < 0) nextIndex = viewLandmarks.length - 1;
    if (nextIndex >= viewLandmarks.length) nextIndex = 0;
    setSelectedPointId(viewLandmarks[nextIndex].id);
  };

  // Nudge point by dx, dy
  const handleNudgePoint = (dx: number, dy: number) => {
    if (!selectedLm) return;
    const step = STEP_VALUES[stepSize];
    const newX = Math.max(0.01, Math.min(0.99, Number((selectedLm.x + dx * step).toFixed(4))));
    const newY = Math.max(0.01, Math.min(0.99, Number((selectedLm.y + dy * step).toFixed(4))));

    onUpdateLandmark({
      ...selectedLm,
      x: newX,
      y: newY,
      source: 'manual',
    });
  };

  // Pan screen by dx, dy in pixels
  const handlePanScreen = (dxPx: number, dyPx: number) => {
    setPanOffset((prev) => ({
      x: Math.round(prev.x + dxPx),
      y: Math.round(prev.y + dyPx),
    }));
  };

  // Unified D-Pad handler
  const handleDpadPress = (dx: number, dy: number) => {
    if (controlMode === 'nudge_point') {
      handleNudgePoint(dx, dy);
    } else {
      const panStepPx = stepSize === 'fine' ? 15 : stepSize === 'normal' ? 40 : 100;
      handlePanScreen(dx * panStepPx, dy * panStepPx);
    }
  };

  // Reset view pan/zoom
  const handleResetPanZoom = () => {
    setPanOffset({ x: 0, y: 0 });
    setZoomLevel(1.0);
  };

  // Auto-Refine / Soft AI-Assisted Alignment
  const handleAutoAssist = () => {
    const result = autoRefineLandmarks(project.landmarks, project.silhouettes);
    if (onBatchUpdateLandmarks) {
      onBatchUpdateLandmarks(result.refinedLandmarks);
    } else {
      result.refinedLandmarks.forEach((lm) => onUpdateLandmark(lm));
    }
    const message = result.summary.slice(0, 2).join(' • ');
    setAssistToast(message || 'सॉफ्टवेयर ने सिमिट्री व मिडलाइन ठीक कर दी!');
    setTimeout(() => setAssistToast(null), 5000);
  };

  // Compute 2D SVG contour lines for the active view
  const viewContours = useMemo(() => {
    const lmsMap = new Map<string, Landmark2D>();
    for (const lm of viewLandmarks) {
      lmsMap.set(lm.semanticId, lm);
    }

    const segments: Array<{
      id: string;
      color: string;
      pathD: string;
      isHighlighted: boolean;
    }> = [];

    for (const contour of LANDMARK_2D_CONTOURS) {
      if (!contour.views.includes(activeView)) continue;

      const pts = contour.pointIds
        .map((id) => lmsMap.get(id))
        .filter((p): p is Landmark2D => !!p);

      if (pts.length < 2) continue;

      let d = `M ${pts[0].x * 100} ${pts[0].y * 100}`;
      for (let i = 1; i < pts.length; i++) {
        d += ` L ${pts[i].x * 100} ${pts[i].y * 100}`;
      }
      if (contour.isClosed) {
        d += ' Z';
      }

      const isHighlighted = !!selectedLm && contour.pointIds.includes(selectedLm.semanticId);

      segments.push({
        id: contour.id,
        color: contour.color,
        pathD: d,
        isHighlighted,
      });
    }

    return segments;
  }, [viewLandmarks, activeView, selectedLm]);

  // Keyboard arrow keys listener for Blender-like workflow
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(e.key)) {
        e.preventDefault();
        if (e.key === 'ArrowUp') handleDpadPress(0, -1);
        if (e.key === 'ArrowDown') handleDpadPress(0, 1);
        if (e.key === 'ArrowLeft') handleDpadPress(-1, 0);
        if (e.key === 'ArrowRight') handleDpadPress(1, 0);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedLm, stepSize, controlMode]);

  const activeColorMeta = selectedLm
    ? getLandmarkColor(selectedLm.category, true)
    : ANATOMICAL_COLORS.selected;

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-slate-950 select-none text-slate-100">
      {/* ======================================================== */}
      {/* 1. TOP HEADER (ऊपर की पहली पट्टी): Navigation & Actions   */}
      {/* ======================================================== */}
      <header className="border-b border-slate-800/90 px-3 sm:px-5 py-2 flex flex-wrap items-center justify-between gap-2 bg-slate-900/80 shrink-0 z-20">
        {/* Left: Back & Title */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-200 hover:text-white text-xs font-semibold transition-colors cursor-pointer shrink-0"
            title="Back to Studio (वापस स्टूडियो)"
          >
            <ArrowLeft className="w-4 h-4 text-cyan-400" />
            <span className="hidden sm:inline">स्टूडियो</span>
          </button>
          <div className="h-4 w-px bg-slate-800 hidden sm:block" />
          <div className="flex items-center gap-1.5 truncate">
            <span className="text-xs sm:text-sm font-bold text-white truncate">
              मैन्युअल एडिट (Blender D-Pad Editor)
            </span>
          </div>
        </div>

        {/* Center: View Slot Switcher (Front / Left / Right / Back) */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-lg border border-slate-800 shrink-0">
          {(['front', 'left', 'right', 'back'] as ViewSlot[]).map((slot) => {
            const count = project.landmarks.filter((l) => l.view === slot).length;
            return (
              <button
                key={slot}
                type="button"
                onClick={() => {
                  setActiveView(slot);
                  setSelectedPointId(null);
                }}
                className={`px-2.5 py-1 rounded-md text-xs font-semibold capitalize transition-all cursor-pointer ${
                  activeView === slot
                    ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                {slot} <span className="text-[10px] opacity-75">({count})</span>
              </button>
            );
          })}
        </div>

        {/* Right: Tools & Helper Actions */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {onUndo && (
            <button
              type="button"
              onClick={onUndo}
              disabled={!canUndo}
              className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                canUndo
                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                  : 'bg-slate-900 text-slate-600 border-slate-800 cursor-not-allowed opacity-50'
              }`}
              title="Undo last change (पूर्ववत)"
            >
              <Undo2 className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden md:inline">Undo</span>
            </button>
          )}

          {/* Software Auto-Assist Button */}
          <button
            type="button"
            onClick={handleAutoAssist}
            className="flex items-center gap-1 px-2.5 sm:px-3 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 hover:text-emerald-200 text-xs font-bold transition-all cursor-pointer shadow-sm active:scale-95"
            title="सॉफ्टवेयर द्वारा सिमिट्री और अलाइनमेंट ठीक करें (Auto-Align Symmetry)"
          >
            <Wand2 className="w-3.5 h-3.5 text-emerald-400" />
            <span className="hidden sm:inline">सॉफ्टवेयर अलाइन मदद</span>
            <span className="sm:hidden">अलाइन मदद</span>
          </button>

          {/* Color Legend Toggle */}
          <button
            type="button"
            onClick={() => setShowColorLegend(!showColorLegend)}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
              showColorLegend
                ? 'bg-purple-600 text-white border-purple-500 shadow-sm'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
            }`}
            title="रंग गाइड देखें (Color Legend)"
          >
            <Palette className="w-3.5 h-3.5 text-pink-400" />
            <span className="hidden sm:inline">रंग गाइड</span>
          </button>

          {/* Toggle Live 3D Preview */}
          <button
            type="button"
            onClick={() => setShowMini3D(!showMini3D)}
            className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
              showMini3D
                ? 'bg-cyan-500 text-slate-950 border-cyan-400 font-bold shadow-sm'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
            }`}
            title="3D वायरफ्रेम प्रिव्यू ऑन/ऑफ करें"
          >
            <Box className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">3D प्रिव्यू</span>
          </button>
        </div>
      </header>

      {/* ======================================================== */}
      {/* 2. TOP SUB-BAR (ऊपर की दूसरी पट्टी): Zoom & Filter Controls */}
      {/* Zero buttons hover over the photo! All are placed here. */}
      {/* ======================================================== */}
      <div className="border-b border-slate-800 bg-slate-900/50 px-3 sm:px-5 py-2 flex flex-wrap items-center justify-between gap-2 shrink-0 z-10 text-xs">
        {/* Left: Zoom Controls & Line Toggle */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <div className="flex items-center gap-1 bg-slate-950 border border-slate-800 rounded-lg p-0.5">
            <button
              type="button"
              onClick={() => setZoomLevel((z) => Math.max(0.6, Number((z - 0.25).toFixed(2))))}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors cursor-pointer"
              title="Zoom Out (-)"
            >
              <ZoomOut className="w-3.5 h-3.5" />
            </button>
            <span className="text-[11px] font-mono text-cyan-300 px-1 font-bold min-w-[42px] text-center">
              {Math.round(zoomLevel * 100)}%
            </span>
            <button
              type="button"
              onClick={() => setZoomLevel((z) => Math.min(3.5, Number((z + 0.25).toFixed(2))))}
              className="p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 rounded transition-colors cursor-pointer"
              title="Zoom In (+)"
            >
              <ZoomIn className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={handleResetPanZoom}
              className="px-2 py-1 text-[11px] font-semibold text-slate-300 hover:text-white hover:bg-slate-800 rounded transition-colors cursor-pointer"
              title="Reset Zoom & Pan (1:1 Fit)"
            >
              Fit 1:1
            </button>
          </div>

          <div className="h-4 w-px bg-slate-800" />

          {/* Toggle Connecting Lines */}
          <button
            type="button"
            onClick={() => setShowLines(!showLines)}
            className={`px-2.5 py-1 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
              showLines
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
            }`}
            title="Toggle connecting feature contour lines"
          >
            लाइंस: {showLines ? 'चालू' : 'बंद'}
          </button>
        </div>

        {/* Right: Anatomical Category Quick-Filter Chips */}
        <div className="flex items-center gap-1 overflow-x-auto py-0.5 max-w-full">
          <span className="text-[11px] text-slate-500 shrink-0 mr-1 hidden md:inline">फ़िल्टर:</span>
          {[
            { id: 'all', label: 'सभी', color: '#94a3b8' },
            { id: 'cranium', label: 'सिर/माथा', color: '#22d3ee' },
            { id: 'eye', label: 'आंखें', color: '#fbbf24' },
            { id: 'nose', label: 'नाक', color: '#34d399' },
            { id: 'mouth', label: 'होंठ', color: '#ec4899' },
            { id: 'jaw', label: 'ठोड़ी/जबड़ा', color: '#a855f7' },
            { id: 'ear', label: 'कान', color: '#fb923c' },
            { id: 'neck', label: 'गला', color: '#6366f1' },
          ].map((cat) => (
            <button
              key={cat.id}
              type="button"
              onClick={() => setFilterCategory(cat.id)}
              className={`px-2 py-0.5 rounded text-[11px] font-medium transition-colors cursor-pointer shrink-0 flex items-center gap-1 ${
                filterCategory === cat.id
                  ? 'bg-slate-800 text-white font-bold border border-slate-700 shadow-sm'
                  : 'text-slate-400 hover:text-slate-200 bg-slate-950/60'
              }`}
            >
              <span
                className="w-2 h-2 rounded-full shrink-0"
                style={{ backgroundColor: cat.color }}
              />
              <span>{cat.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Assist Toast Notification (Integrated into header area, NOT blocking image) */}
      {assistToast && (
        <div className="bg-emerald-950/90 border-b border-emerald-500/40 text-emerald-200 text-xs px-4 py-2 flex items-center justify-between gap-2 shrink-0 animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
            <span>{assistToast}</span>
          </div>
          <button
            type="button"
            onClick={() => setAssistToast(null)}
            className="text-emerald-400 hover:text-white text-[11px] font-bold"
          >
            ✕
          </button>
        </div>
      )}

      {/* Expandable Color Legend Bar */}
      {showColorLegend && (
        <div className="bg-slate-900 border-b border-purple-500/30 p-3 shrink-0 text-xs">
          <div className="max-w-5xl mx-auto">
            <div className="flex items-center justify-between mb-2">
              <div className="font-bold text-white flex items-center gap-1.5">
                <Palette className="w-4 h-4 text-pink-400" />
                <span>डॉट्स के रंगों का विवरण (Anatomical Color Legend Guide)</span>
              </div>
              <button
                type="button"
                onClick={() => setShowColorLegend(false)}
                className="text-slate-400 hover:text-white text-xs"
              >
                बंद करें ✕
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
              {Object.entries(ANATOMICAL_COLORS).map(([key, meta]) => (
                <div
                  key={key}
                  onClick={() => {
                    if (key !== 'selected') setFilterCategory(key);
                  }}
                  className={`p-2 rounded-lg border bg-slate-950/80 cursor-pointer transition-all hover:border-slate-600 ${
                    filterCategory === key
                      ? 'border-cyan-400 ring-1 ring-cyan-400/50'
                      : 'border-slate-800'
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <span
                      className="w-3 h-3 rounded-full shrink-0 border border-white/40 shadow-sm"
                      style={{ backgroundColor: meta.hex }}
                    />
                    <span className="font-bold text-[11px] text-white truncate">
                      {meta.labelHi}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 leading-tight">
                    {meta.labelEn}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* 3. CENTER VIEWPORT: 100% CLEAN IMAGE CANVAS              */}
      {/* ZERO BUTTONS OVERLAYING THE IMAGE! STRICTLY THE PHOTO.   */}
      {/* ======================================================== */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden relative">
        <div className="flex-1 relative flex items-center justify-center overflow-hidden bg-[#050811] p-1 sm:p-3">
          {/* Main Photo & Interactive Dots Stage */}
          <div
            ref={containerRef}
            style={{
              transform: `translate(${panOffset.x}px, ${panOffset.y}px) scale(${zoomLevel})`,
              transformOrigin: 'center center',
              transition: 'transform 0.08s ease-out',
            }}
            className="relative aspect-square max-h-[75vh] w-auto max-w-full rounded-xl overflow-hidden border border-slate-800 shadow-2xl bg-slate-950 select-none"
          >
            {/* 1. Underlying Reference Photo */}
            {activeImg.url ? (
              <img
                ref={imageRef}
                src={activeImg.url}
                alt={`${activeView} view`}
                className="w-full h-full object-contain pointer-events-none select-none"
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-slate-500 text-xs p-6 text-center">
                <span>{activeView} स्लॉट में कोई फोटो अपलोड नहीं है।</span>
              </div>
            )}

            {/* 2. Interactive SVG Wireframe Lines Layer */}
            {showLines && (
              <svg
                className="absolute inset-0 w-full h-full pointer-events-none"
                viewBox="0 0 100 100"
                preserveAspectRatio="none"
              >
                {viewContours.map((seg) => (
                  <path
                    key={seg.id}
                    d={seg.pathD}
                    fill="none"
                    stroke={seg.isHighlighted ? '#f43f5e' : seg.color}
                    strokeWidth={seg.isHighlighted ? 0.75 : 0.4}
                    strokeOpacity={seg.isHighlighted ? 1.0 : 0.7}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                ))}
              </svg>
            )}

            {/* 3. Landmark Points Pins Layer */}
            {filteredLandmarks.map((lm) => {
              const isSelected = lm.id === selectedPointId;
              const colorInfo = getLandmarkColor(lm.category, isSelected);

              return (
                <div
                  key={lm.id}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedPointId(lm.id);
                  }}
                  style={{
                    left: `${lm.x * 100}%`,
                    top: `${lm.y * 100}%`,
                  }}
                  className={`absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-transform ${
                    isSelected ? 'z-30 scale-125' : 'z-10 hover:scale-120'
                  }`}
                  title={`${lm.label} (${colorInfo.labelHi})`}
                >
                  {/* Selected Reticle Target Crosshair for precision targeting */}
                  {isSelected && (
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none -m-3">
                      <span className="absolute w-8 h-8 rounded-full border border-rose-500/80 animate-ping opacity-75" />
                      <span className="absolute w-6 h-6 rounded-full border border-rose-400 bg-rose-500/10" />
                      <div className="absolute w-8 h-px bg-rose-400/80" />
                      <div className="absolute h-8 w-px bg-rose-400/80" />
                    </div>
                  )}

                  {/* Dot Pin styled strictly with Anatomical Category Color */}
                  <div
                    className={`rounded-full transition-all border shadow-md ${
                      isSelected
                        ? 'w-4 h-4 bg-rose-500 border-white ring-2 ring-rose-400/90 scale-110'
                        : `w-3 h-3 ${colorInfo.bgClass} ${colorInfo.borderClass}`
                    }`}
                  />
                </div>
              );
            })}
          </div>
        </div>

        {/* Live 3D Wireframe Split-Panel (Positioned OUTSIDE photo area) */}
        {showMini3D && (
          <div className="w-full lg:w-80 h-64 lg:h-auto border-t lg:border-t-0 lg:border-l border-slate-800 bg-slate-950 p-2 sm:p-4 flex flex-col relative shrink-0">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-white">
                <Box className="w-4 h-4 text-cyan-400" />
                <span>3D वायरफ्रेम रिस्पॉन्स</span>
              </div>
              <button
                type="button"
                onClick={() => setShowMini3D(false)}
                className="text-slate-400 hover:text-white p-1 text-xs"
              >
                ✕ बंद
              </button>
            </div>
            <div className="flex-1 rounded-xl overflow-hidden border border-slate-800 relative bg-[#070b14]">
              <ThreeWireframeCanvas
                wireframe={project.wireframe}
                showPoints={true}
                showEdges={true}
                showSkullRings={true}
                showFacialLoops={true}
                pointSize={2}
                themeColor="cyan"
                autoRotate={false}
              />
              <div className="absolute bottom-2 left-2 text-[10px] text-slate-400 bg-slate-900/80 px-2 py-0.5 rounded border border-slate-800 pointer-events-none">
                नीचे तीर दबाते ही 3D तुरंत अपडेट होगा
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ======================================================== */}
      {/* 4. BOTTOM CONTROL DECK (नीचे की पट्टी): D-Pad & Controls  */}
      {/* ======================================================== */}
      <footer className="w-full border-t border-slate-800/90 bg-slate-950/95 backdrop-blur-xl px-3 py-2 z-30 shrink-0">
        <div className="max-w-4xl mx-auto flex flex-col gap-2">
          {/* Row 1: Selected Point Selector, Mode Switch & Step Size */}
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            {/* Point Stepper & Label */}
            <div className="flex items-center gap-1.5 min-w-0">
              <button
                type="button"
                onClick={() => handleNextPoint(-1)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer"
                title="Previous Point (पिछला बिंदु)"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              <div className="bg-slate-900 border border-slate-800 px-3 py-1 rounded-lg flex items-center gap-2 truncate">
                <span
                  className="w-2.5 h-2.5 rounded-full shrink-0 border border-white/60 animate-pulse"
                  style={{
                    backgroundColor: selectedLm
                      ? getLandmarkColor(selectedLm.category, false).hex
                      : '#f43f5e',
                  }}
                />
                <span className="font-bold text-white text-xs truncate">
                  {selectedLm ? selectedLm.label : 'बिंदु चुनें'}
                </span>
                {selectedLm && (
                  <span className="text-[10px] font-mono text-cyan-400">
                    [{Math.round(selectedLm.x * 100)}%, {Math.round(selectedLm.y * 100)}%]
                  </span>
                )}
              </div>

              <button
                type="button"
                onClick={() => handleNextPoint(1)}
                className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 transition-colors cursor-pointer"
                title="Next Point (अगला बिंदु)"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>

            {/* Mode Switcher: Point Nudge vs Pan Screen */}
            <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-0.5 rounded-lg">
              <button
                type="button"
                onClick={() => setControlMode('nudge_point')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                  controlMode === 'nudge_point'
                    ? 'bg-rose-600 text-white shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Move className="w-3.5 h-3.5" />
                <span>बिंदु हिलाएं</span>
              </button>
              <button
                type="button"
                onClick={() => setControlMode('pan_screen')}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
                  controlMode === 'pan_screen'
                    ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                <Compass className="w-3.5 h-3.5" />
                <span>स्क्रीन खिसकाएं</span>
              </button>
            </div>

            {/* Step Size Selector (1px / 5px / 15px) */}
            <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 p-0.5 rounded-lg">
              {(['fine', 'normal', 'coarse'] as StepSize[]).map((sz) => (
                <button
                  key={sz}
                  type="button"
                  onClick={() => setStepSize(sz)}
                  className={`px-2 py-0.5 rounded text-[11px] font-semibold transition-all cursor-pointer ${
                    stepSize === sz
                      ? 'bg-slate-750 text-cyan-300 border border-cyan-500/30'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {STEP_LABELS[sz].pixels} ({STEP_LABELS[sz].labelHi})
                </button>
              ))}
            </div>
          </div>

          {/* Row 2: Tactical D-Pad Arrow Keys and Quick Reset */}
          <div className="flex items-center justify-between gap-3 pt-1">
            {/* Category badge */}
            <div className="hidden sm:flex items-center gap-2 text-xs text-slate-400">
              {selectedLm && (
                <div className="flex items-center gap-1.5 bg-slate-900 px-2.5 py-1 rounded-lg border border-slate-800">
                  <span
                    className="w-2.5 h-2.5 rounded-full"
                    style={{
                      backgroundColor: getLandmarkColor(selectedLm.category, false).hex,
                    }}
                  />
                  <span className="font-medium text-white">
                    अंग: {getLandmarkColor(selectedLm.category, false).labelHi}
                  </span>
                </div>
              )}
            </div>

            {/* D-Pad Arrows Controller */}
            <div className="flex items-center justify-center mx-auto">
              <div className="grid grid-cols-3 gap-1.5 p-1.5 bg-slate-900/90 border border-slate-800 rounded-xl shadow-lg">
                <div />
                {/* UP Arrow */}
                <button
                  type="button"
                  onClick={() => handleDpadPress(0, -1)}
                  className={`w-12 h-10 rounded-lg flex items-center justify-center font-bold text-white transition-all cursor-pointer active:scale-90 shadow-sm ${
                    controlMode === 'nudge_point'
                      ? 'bg-rose-600 hover:bg-rose-500 text-white'
                      : 'bg-cyan-600 hover:bg-cyan-500 text-slate-950'
                  }`}
                  aria-label="ऊपर करें (Up)"
                  title="ऊपर करें (Up)"
                >
                  <ArrowUp className="w-5 h-5 stroke-[2.5]" />
                </button>
                <div />

                {/* LEFT Arrow */}
                <button
                  type="button"
                  onClick={() => handleDpadPress(-1, 0)}
                  className={`w-12 h-10 rounded-lg flex items-center justify-center font-bold text-white transition-all cursor-pointer active:scale-90 shadow-sm ${
                    controlMode === 'nudge_point'
                      ? 'bg-rose-600 hover:bg-rose-500 text-white'
                      : 'bg-cyan-600 hover:bg-cyan-500 text-slate-950'
                  }`}
                  aria-label="बाएं करें (Left)"
                  title="बाएं करें (Left)"
                >
                  <ChevronLeft className="w-5 h-5 stroke-[2.5]" />
                </button>

                {/* CENTER Button: Step Cycle Toggle */}
                <button
                  type="button"
                  onClick={() => {
                    setStepSize((s) => (s === 'fine' ? 'normal' : s === 'normal' ? 'coarse' : 'fine'));
                  }}
                  className="w-12 h-10 rounded-lg bg-slate-800 hover:bg-slate-750 border border-slate-700 flex flex-col items-center justify-center text-[9px] font-bold text-cyan-300 transition-all cursor-pointer active:scale-95"
                  title="स्टेप साइज बदलें"
                >
                  <span>स्टेप</span>
                  <span className="text-[10px] text-white">
                    {STEP_LABELS[stepSize].pixels}
                  </span>
                </button>

                {/* RIGHT Arrow */}
                <button
                  type="button"
                  onClick={() => handleDpadPress(1, 0)}
                  className={`w-12 h-10 rounded-lg flex items-center justify-center font-bold text-white transition-all cursor-pointer active:scale-90 shadow-sm ${
                    controlMode === 'nudge_point'
                      ? 'bg-rose-600 hover:bg-rose-500 text-white'
                      : 'bg-cyan-600 hover:bg-cyan-500 text-slate-950'
                  }`}
                  aria-label="दाएं करें (Right)"
                  title="दाएं करें (Right)"
                >
                  <ChevronRight className="w-5 h-5 stroke-[2.5]" />
                </button>

                <div />
                {/* DOWN Arrow */}
                <button
                  type="button"
                  onClick={() => handleDpadPress(0, 1)}
                  className={`w-12 h-10 rounded-lg flex items-center justify-center font-bold text-white transition-all cursor-pointer active:scale-90 shadow-sm ${
                    controlMode === 'nudge_point'
                      ? 'bg-rose-600 hover:bg-rose-500 text-white'
                      : 'bg-cyan-600 hover:bg-cyan-500 text-slate-950'
                  }`}
                  aria-label="नीचे करें (Down)"
                  title="नीचे करें (Down)"
                >
                  <ArrowDown className="w-5 h-5 stroke-[2.5]" />
                </button>
                <div />
              </div>
            </div>

            {/* Quick Reset View Button */}
            <div className="flex flex-col gap-1 items-end shrink-0">
              <button
                type="button"
                onClick={handleResetPanZoom}
                className="px-2.5 py-1 rounded-lg bg-slate-900 hover:bg-slate-800 border border-slate-800 text-[11px] text-slate-300 hover:text-white transition-colors cursor-pointer"
              >
                रीसेट व्यू
              </button>
              <div className="text-[10px] text-slate-500 hidden sm:block">
                कीबोर्ड तीर भी काम करते हैं
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};
