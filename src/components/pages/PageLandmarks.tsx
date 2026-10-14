import React, { useState, useRef } from 'react';
import {
  ArrowLeft,
  Sparkles,
  Download,
  RotateCcw,
  Plus,
  Trash2,
  Lock,
  Unlock,
  Eye,
  CheckCircle2,
  AlertTriangle,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Undo2,
  Palette,
} from 'lucide-react';
import { Landmark2D, LandmarkCategory, ProjectState, ViewSlot } from '../../modules/types';
import { triggerDownload } from '../../modules/project/exportService';
import {
  SEMANTIC_LANDMARK_REGISTRY,
  validateLandmarkConsistency,
} from '../../modules/landmarks/landmarkDefinitions';
import { LANDMARK_2D_CONTOURS } from '../../modules/landmarks/landmark2DContours';
import { ANATOMICAL_COLORS, getLandmarkColor } from '../../modules/landmarks/landmarkColors';

interface PageLandmarksProps {
  project: ProjectState;
  onUpdateLandmark: (updated: Landmark2D) => void;
  onAddLandmark?: (newLm: Landmark2D) => void;
  onDeleteLandmark?: (id: string) => void;
  onUndo?: () => void;
  canUndo?: boolean;
  onOpenManualEditor?: () => void;
  onResetLandmarks: () => void;
  onBack: () => void;
}

export const PageLandmarks: React.FC<PageLandmarksProps> = ({
  project,
  onUpdateLandmark,
  onAddLandmark,
  onDeleteLandmark,
  onUndo,
  canUndo,
  onOpenManualEditor,
  onResetLandmarks,
  onBack,
}) => {
  const [activeView, setActiveView] = useState<ViewSlot>('front');
  const [selectedLandmarkId, setSelectedLandmarkId] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [isDragging, setIsDragging] = useState(false);
  const [zoomLevel, setZoomLevel] = useState(1.0);
  const [isAddMode, setIsAddMode] = useState(false);
  const [newSemanticId, setNewSemanticId] = useState('vertex');
  const [showColorLegend, setShowColorLegend] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);

  const viewLandmarks = project.landmarks.filter((l) => l.view === activeView);
  const filteredLandmarks =
    categoryFilter === 'all'
      ? viewLandmarks
      : viewLandmarks.filter((l) => l.category === categoryFilter);

  const activeImg = project.images[activeView];
  const selectedLm = project.landmarks.find((l) => l.id === selectedLandmarkId);

  // Compute live validation
  const validation = validateLandmarkConsistency(project.landmarks);

  // Compute connecting contour lines for the active view
  const viewContours = React.useMemo(() => {
    const lmsMap = new Map<string, Landmark2D>();
    for (const lm of viewLandmarks) {
      lmsMap.set(lm.semanticId, lm);
    }
    const segments: Array<{ id: string; color: string; pathD: string }> = [];
    for (const contour of LANDMARK_2D_CONTOURS) {
      if (!contour.views.includes(activeView)) continue;
      const pts = contour.pointIds.map((id) => lmsMap.get(id)).filter((p): p is Landmark2D => !!p);
      if (pts.length < 2) continue;
      let d = `M ${pts[0].x * 100} ${pts[0].y * 100}`;
      for (let i = 1; i < pts.length; i++) {
        d += ` L ${pts[i].x * 100} ${pts[i].y * 100}`;
      }
      if (contour.isClosed) d += ' Z';
      segments.push({ id: contour.id, color: contour.color, pathD: d });
    }
    return segments;
  }, [viewLandmarks, activeView]);

  const handlePointerDown = (lm: Landmark2D, e: React.PointerEvent) => {
    e.stopPropagation();
    if (isAddMode) return;
    setSelectedLandmarkId(lm.id);
    setIsDragging(true);
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging || !selectedLm || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));

    onUpdateLandmark({
      ...selectedLm,
      x: Number(x.toFixed(4)),
      y: Number(y.toFixed(4)),
      source: 'manual',
    });
  };

  const handlePointerUp = () => {
    setIsDragging(false);
  };

  const handleCanvasClick = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isAddMode || !containerRef.current || !onAddLandmark) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width));
    const y = Math.max(0, Math.min(1, (e.clientY - rect.top) / rect.height));

    const meta = SEMANTIC_LANDMARK_REGISTRY.find((m) => m.semanticId === newSemanticId);
    const label = meta ? meta.label : newSemanticId;
    const category = meta ? meta.category : 'face';

    const newPt: Landmark2D = {
      id: `${activeView}_${newSemanticId}_${Date.now().toString(36)}`,
      semanticId: newSemanticId,
      label,
      category,
      view: activeView,
      x: Number(x.toFixed(4)),
      y: Number(y.toFixed(4)),
      confidence: null,
      source: 'manual',
      locked: false,
    };

    onAddLandmark(newPt);
    setSelectedLandmarkId(newPt.id);
    setIsAddMode(false);
  };

  const handleDeleteSelected = () => {
    if (!selectedLandmarkId || !onDeleteLandmark) return;
    onDeleteLandmark(selectedLandmarkId);
    setSelectedLandmarkId(null);
  };

  const handleDownloadJSON = () => {
    const json = JSON.stringify(project.landmarks, null, 2);
    triggerDownload(json, `${project.projectName}_landmarks.json`, 'application/json');
  };

  const categories: Array<{ id: string; label: string }> = [
    { id: 'all', label: 'All Points' },
    { id: 'cranium', label: 'Cranium' },
    { id: 'eye', label: 'Eyes' },
    { id: 'nose', label: 'Nose' },
    { id: 'mouth', label: 'Mouth' },
    { id: 'jaw', label: 'Jaw & Chin' },
    { id: 'ear', label: 'Ears' },
    { id: 'neck', label: 'Neck' },
  ];

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-slate-950">
      {/* Top Header Bar with Consistent Back Button */}
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
            <Sparkles className="w-4 h-4 text-cyan-400" />
            <span>Landmark Placement & 2D Annotation</span>
          </h2>
        </div>

        <div className="flex items-center gap-2">
          {onUndo && (
            <button
              type="button"
              onClick={onUndo}
              disabled={!canUndo}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition-colors cursor-pointer ${
                canUndo
                  ? 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
                  : 'bg-slate-900 text-slate-600 border-slate-800 cursor-not-allowed'
              }`}
              title="Undo last landmark change"
            >
              <Undo2 className="w-3.5 h-3.5 text-cyan-400" />
              <span className="hidden sm:inline">Undo</span>
            </button>
          )}

          {onOpenManualEditor && (
            <button
              type="button"
              onClick={onOpenManualEditor}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold transition-all cursor-pointer shadow-sm active:scale-95"
              title="Open Manual Arrow D-Pad Sculptor (मैन्युअल एडिट)"
            >
              <span className="text-sm">✏️</span>
              <span>D-Pad Sculptor (मैन्युअल एडिट)</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => setShowColorLegend(!showColorLegend)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
              showColorLegend
                ? 'bg-purple-600 text-white border-purple-500 shadow-sm'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
            }`}
            title="रंग गाइड देखें (Color Legend)"
          >
            <Palette className="w-3.5 h-3.5 text-pink-400" />
            <span className="hidden sm:inline">रंग गाइड</span>
          </button>

          <button
            type="button"
            onClick={handleDownloadJSON}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-medium transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span className="hidden sm:inline">Download JSON</span>
          </button>
        </div>
      </div>

      {/* Expandable Anatomical Color Legend Bar */}
      {showColorLegend && (
        <div className="bg-slate-900 border-b border-purple-500/30 p-3 shrink-0 text-xs">
          <div className="max-w-6xl mx-auto">
            <div className="flex items-center justify-between mb-2">
              <div className="font-bold text-white flex items-center gap-1.5">
                <Palette className="w-4 h-4 text-pink-400" />
                <span>डॉट्स के रंगों का विवरण (Anatomical Color Legend Guide)</span>
              </div>
              <button
                type="button"
                onClick={() => setShowColorLegend(false)}
                className="text-slate-400 hover:text-white text-xs cursor-pointer"
              >
                बंद करें ✕
              </button>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
              {Object.entries(ANATOMICAL_COLORS).map(([key, meta]) => (
                <div
                  key={key}
                  onClick={() => {
                    if (key !== 'selected') setCategoryFilter(key);
                  }}
                  className={`p-2 rounded-lg border bg-slate-950/80 cursor-pointer transition-all hover:border-slate-600 ${
                    categoryFilter === key
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

      {/* Main Content: Left Canvas, Right Inspector & Table */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left Column: Interactive Image Canvas */}
        <div className="flex-1 flex flex-col p-3 sm:p-5 overflow-hidden">
          {/* View Tabs & Zoom Controls */}
          <div className="flex flex-wrap items-center justify-between gap-3 mb-3 shrink-0">
            <div className="flex items-center gap-1.5">
              {(['front', 'left', 'right', 'back'] as ViewSlot[]).map((slot) => (
                <button
                  key={slot}
                  type="button"
                  onClick={() => {
                    setActiveView(slot);
                    setSelectedLandmarkId(null);
                  }}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize transition-colors cursor-pointer ${
                    activeView === slot
                      ? 'bg-cyan-500 text-slate-950 font-bold shadow-sm'
                      : 'bg-slate-900 text-slate-300 hover:bg-slate-850 hover:text-white'
                  }`}
                >
                  {slot} ({project.landmarks.filter((l) => l.view === slot).length})
                </button>
              ))}
            </div>

            {/* Canvas Actions */}
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setIsAddMode(!isAddMode)}
                className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  isAddMode
                    ? 'bg-emerald-500 text-slate-950 shadow-sm'
                    : 'bg-slate-800 text-slate-300 hover:text-white'
                }`}
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isAddMode ? 'Click on Photo to Place' : 'Add Point'}</span>
              </button>

              <div className="flex items-center gap-1 bg-slate-900 border border-slate-800 rounded-lg p-0.5">
                <button
                  type="button"
                  onClick={() => setZoomLevel((z) => Math.max(0.6, z - 0.2))}
                  className="p-1 text-slate-400 hover:text-white rounded transition-colors cursor-pointer"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-3.5 h-3.5" />
                </button>
                <span className="text-[10px] text-slate-400 px-1 font-mono">
                  {Math.round(zoomLevel * 100)}%
                </span>
                <button
                  type="button"
                  onClick={() => setZoomLevel((z) => Math.min(2.5, z + 0.2))}
                  className="p-1 text-slate-400 hover:text-white rounded transition-colors cursor-pointer"
                  title="Zoom In"
                >
                  <ZoomIn className="w-3.5 h-3.5" />
                </button>
                <button
                  type="button"
                  onClick={() => setZoomLevel(1.0)}
                  className="px-1.5 py-0.5 text-[10px] text-slate-400 hover:text-white rounded transition-colors cursor-pointer"
                  title="Reset Zoom"
                >
                  1:1
                </button>
              </div>
            </div>
          </div>

          {/* Validation Notice Bar */}
          {validation.warnings.length > 0 && (
            <div className="mb-2 px-3 py-1.5 rounded-lg bg-amber-500/10 border border-amber-500/30 text-amber-300 text-xs flex items-center gap-2 shrink-0">
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />
              <span className="truncate">{validation.warnings[0]}</span>
            </div>
          )}

          {/* Canvas Container */}
          <div className="flex-1 flex items-center justify-center bg-slate-900/40 border border-slate-800 rounded-xl overflow-auto p-2 relative">
            <div
              ref={containerRef}
              onPointerMove={handlePointerMove}
              onPointerUp={handlePointerUp}
              onClick={handleCanvasClick}
              style={{
                transform: `scale(${zoomLevel})`,
                transformOrigin: 'center center',
                transition: isDragging ? 'none' : 'transform 0.15s ease-out',
              }}
              className={`relative aspect-square max-h-[75vh] w-auto max-w-full select-none rounded-lg overflow-hidden border border-slate-700/60 shadow-2xl ${
                isAddMode ? 'cursor-crosshair ring-2 ring-emerald-400' : 'cursor-default'
              }`}
            >
              {activeImg.url ? (
                <img
                  src={activeImg.url}
                  alt={`${activeView} view`}
                  className="w-full h-full object-contain pointer-events-none"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-slate-500 text-xs">
                  No image loaded in {activeView} slot.
                </div>
              )}

              {/* Feature Contour Lines Overlay */}
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
                    stroke={seg.color}
                    strokeWidth="0.4"
                    strokeOpacity="0.75"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                ))}
              </svg>

              {/* Landmark Pins */}
              {filteredLandmarks.map((lm) => {
                const isSelected = lm.id === selectedLandmarkId;
                const colorInfo = getLandmarkColor(lm.category, isSelected);

                return (
                  <div
                    key={lm.id}
                    onPointerDown={(e) => handlePointerDown(lm, e)}
                    style={{
                      left: `${lm.x * 100}%`,
                      top: `${lm.y * 100}%`,
                    }}
                    className={`absolute -translate-x-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing group transition-transform ${
                      isSelected ? 'scale-125 z-20' : 'z-10 hover:scale-115'
                    }`}
                  >
                    <div
                      className={`w-3.5 h-3.5 rounded-full border-2 transition-all ${
                        isSelected
                          ? 'bg-rose-500 border-white ring-2 ring-rose-500/50 shadow-lg'
                          : `${colorInfo.bgClass} ${colorInfo.borderClass} shadow-sm`
                      }`}
                    />

                    {/* Tooltip on hover or selection */}
                    <div
                      className={`absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-0.5 rounded bg-slate-950/95 border border-slate-800 text-[10px] text-white whitespace-nowrap shadow-xl pointer-events-none transition-opacity ${
                        isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
                      }`}
                    >
                      {lm.label} ({colorInfo.labelHi})
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Selected Landmark Inspector & Landmark Table */}
        <div className="w-full lg:w-96 border-t lg:border-t-0 lg:border-l border-slate-800 bg-slate-950 flex flex-col overflow-hidden">
          {/* Selected Landmark Card */}
          <div className="p-4 border-b border-slate-800 bg-slate-900/40">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                Point Inspector
              </h3>
              {selectedLm && onDeleteLandmark && (
                <button
                  type="button"
                  onClick={handleDeleteSelected}
                  className="flex items-center gap-1 text-[11px] text-rose-400 hover:text-rose-300 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete Point</span>
                </button>
              )}
            </div>

            {selectedLm ? (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="font-semibold text-sm text-cyan-400 truncate">
                    {selectedLm.label}
                  </div>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 font-medium capitalize shrink-0">
                    {selectedLm.category}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs bg-slate-950/80 p-2.5 rounded-lg border border-slate-800 font-mono">
                  <div>
                    <span className="text-slate-400">X (norm):</span>{' '}
                    <span className="text-white font-semibold">{selectedLm.x}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Y (norm):</span>{' '}
                    <span className="text-white font-semibold">{selectedLm.y}</span>
                  </div>
                  <div>
                    <span className="text-slate-400">Confidence:</span>{' '}
                    <span className="text-slate-300 font-semibold">
                      {selectedLm.confidence !== null ? `${Math.round(selectedLm.confidence * 100)}%` : 'Not measured'}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400">Origin:</span>{' '}
                    <span className="text-emerald-400 capitalize">{selectedLm.source}</span>
                  </div>
                </div>

                <div className="text-[11px] text-slate-400">
                  Drag the pin on the reference photo to adjust coordinates. Changes propagate
                  directly into 3D wireframe cross-sections and reprojection.
                </div>
              </div>
            ) : isAddMode ? (
              <div className="space-y-2 py-2">
                <div className="text-xs text-emerald-400 font-semibold flex items-center gap-1.5">
                  <Plus className="w-4 h-4" />
                  <span>Select Landmark to Place:</span>
                </div>
                <select
                  value={newSemanticId}
                  onChange={(e) => setNewSemanticId(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg p-2 text-xs text-slate-200"
                >
                  {SEMANTIC_LANDMARK_REGISTRY.map((m) => (
                    <option key={m.semanticId} value={m.semanticId}>
                      {m.label} ({m.category})
                    </option>
                  ))}
                </select>
                <p className="text-[11px] text-slate-400">
                  Click anywhere on the {activeView} image to pin this point.
                </p>
              </div>
            ) : (
              <div className="text-xs text-slate-400 py-3 text-center">
                Click any landmark on the image to inspect or drag it.
              </div>
            )}
          </div>

          {/* Filter Categories */}
          <div className="p-2.5 border-b border-slate-800 flex items-center gap-1.5 overflow-x-auto shrink-0">
            {categories.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategoryFilter(cat.id)}
                className={`px-2.5 py-1 rounded-md text-[11px] whitespace-nowrap transition-colors cursor-pointer ${
                  categoryFilter === cat.id
                    ? 'bg-slate-800 text-cyan-300 font-semibold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Table List of Landmarks */}
          <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60 p-2">
            {filteredLandmarks.map((lm) => {
              const meta = getLandmarkColor(lm.category, false);
              return (
                <button
                  key={lm.id}
                  type="button"
                  onClick={() => setSelectedLandmarkId(lm.id)}
                  className={`w-full p-2 rounded-lg flex items-center justify-between text-left text-xs transition-colors cursor-pointer ${
                    selectedLandmarkId === lm.id
                      ? 'bg-cyan-500/10 text-cyan-300 font-semibold'
                      : 'text-slate-300 hover:bg-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <span
                      className="w-2.5 h-2.5 rounded-full shrink-0 border border-white/40"
                      style={{ backgroundColor: meta.hex }}
                    />
                    <div className="truncate">
                      <div className="truncate font-medium">{lm.label}</div>
                      <div className="text-[10px] text-slate-400 font-mono">
                        ({lm.x}, {lm.y}) • {meta.labelHi}
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 capitalize ml-2 shrink-0">
                    {lm.source}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};
