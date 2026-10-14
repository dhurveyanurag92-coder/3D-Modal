import React, { useState, useEffect } from 'react';
import {
  ProjectState,
  ReferenceImageTransform,
  StageId,
  ViewSlot,
  Landmark2D,
} from '../../modules/types';
import {
  createInitialProjectState,
  invalidateDownstreamOnImageChange,
  runFullPipeline,
} from '../../modules/project/projectStore';
import { DEFAULT_REFERENCE_SLOTS } from '../../modules/references/defaultReferences';
import { buildDefaultLandmarks } from '../../modules/landmarks/landmarkDefinitions';
import { buildHeadWireframe } from '../../modules/wireframe/wireframeBuilder';
import { solve3DCoordinates } from '../../modules/solver/coordinateSolver';
import { matchLandmarksAcrossViews } from '../../modules/matching/matchingEngine';
import { evaluateFourViewReprojection } from '../../modules/comparison/comparisonEngine';
import { TopBar } from './TopBar';
import { SlideOutDrawer } from './SlideOutDrawer';
import { PageOverview } from '../pages/PageOverview';
import { PageLandmarks } from '../pages/PageLandmarks';
import { PageAlignment } from '../pages/PageAlignment';
import { PageSilhouette } from '../pages/PageSilhouette';
import { PageDepthMap } from '../pages/PageDepthMap';
import { PageNormalMap } from '../pages/PageNormalMap';
import { PageMatching } from '../pages/PageMatching';
import { PageCoordinates } from '../pages/PageCoordinates';
import { PageWireframeBuilder } from '../pages/PageWireframeBuilder';
import { PageComparison } from '../pages/PageComparison';
import { PageValidation } from '../pages/PageValidation';
import { Page3DView } from '../pages/Page3DView';
import { PageExport } from '../pages/PageExport';
import { ManualPrecisionEditor } from '../editor/ManualPrecisionEditor';

const STORAGE_KEY = 'HEAD_WIREFRAME_STUDIO_STATE_V1';

export const StudioLayout: React.FC = () => {
  const [project, setProject] = useState<ProjectState>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.version && parsed.images) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Failed to restore saved project state:', e);
    }
    return createInitialProjectState();
  });

  const [activeView, setActiveView] = useState<string>('overview');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [landmarkHistory, setLandmarkHistory] = useState<Landmark2D[][]>([]);

  // Save to localStorage on state change
  useEffect(() => {
    try {
      const toSave = {
        ...project,
        updatedAt: new Date().toISOString(),
      };
      localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
    } catch (e) {
      console.warn('LocalStorage save failed:', e);
    }
  }, [project]);

  // Handle running the full 11-stage pipeline
  const handleRunPipeline = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    try {
      const updated = await runFullPipeline(project, (stageId, status, summary) => {
        setProject((prev) => {
          const next = { ...prev };
          next.stages[stageId] = {
            ...next.stages[stageId],
            status,
            outputSummary: summary || next.stages[stageId].outputSummary,
          };
          return next;
        });
      });
      setProject(updated);
    } catch (err) {
      console.error('Pipeline execution error:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  // Rebuild wireframe when settings or landmarks change
  const recomputeWireframe = (updatedLandmarks?: Landmark2D[], newCalibration?: number) => {
    const lms = updatedLandmarks || project.landmarks;
    const cal = newCalibration || project.settings.calibrationMm;
    const correspondences = matchLandmarksAcrossViews(lms, cal);
    const solverRes = solve3DCoordinates(
      correspondences,
      project.silhouettes,
      cal,
      project.settings.isCustomCalibrated
    );
    const wireframe = buildHeadWireframe(solverRes.points, {
      density: project.settings.density,
      customRingsCount: project.settings.ringsCount,
      customMeridiansCount: project.settings.meridiansCount,
      includeFacialLoops: project.settings.showFacialLoops,
      includeSkullRings: project.settings.showSkullRings,
      includeMeridians: true,
      calibrationScaleMm: cal,
      isCustomCalibrated: project.settings.isCustomCalibrated,
      silhouettes: project.silhouettes,
    });
    const validation = evaluateFourViewReprojection(wireframe, lms, 1024, cal);

    setProject((prev) => ({
      ...prev,
      landmarks: lms,
      correspondences,
      wireframe,
      measurements: solverRes.measurements,
      validationReport: validation,
      settings: {
        ...prev.settings,
        calibrationMm: cal,
      },
    }));
  };

  // Handle uploading/replacing an image in a slot
  const handleUpdateImage = (
    slot: ViewSlot,
    fileUrl: string,
    name: string,
    width?: number,
    height?: number
  ) => {
    const newVersion = `img_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    setProject((prev) => {
      const updatedState: ProjectState = {
        ...prev,
        images: {
          ...prev.images,
          [slot]: {
            ...prev.images[slot],
            url: fileUrl,
            name,
            version: newVersion,
            width: width || prev.images[slot].width || 1024,
            height: height || prev.images[slot].height || 1024,
            isValid: true,
          },
        },
      };
      return invalidateDownstreamOnImageChange(updatedState, slot);
    });
  };

  // Reset a slot to default reference
  const handleResetImage = (slot: ViewSlot) => {
    setProject((prev) => {
      const updatedState: ProjectState = {
        ...prev,
        images: {
          ...prev.images,
          [slot]: { ...DEFAULT_REFERENCE_SLOTS[slot], version: `reset_${slot}_${Date.now()}` },
        },
      };
      return invalidateDownstreamOnImageChange(updatedState, slot);
    });
  };

  // Reset all 4 slots to calibrated default reference
  const handleResetAllImages = () => {
    setProject((prev) => {
      let state: ProjectState = {
        ...prev,
        images: { ...DEFAULT_REFERENCE_SLOTS },
      };
      for (const slot of ['front', 'left', 'right', 'back'] as ViewSlot[]) {
        state = invalidateDownstreamOnImageChange(state, slot);
      }
      return state;
    });
  };

  // Clear an image slot
  const handleClearImage = (slot: ViewSlot) => {
    setProject((prev) => {
      const updatedState: ProjectState = {
        ...prev,
        images: {
          ...prev.images,
          [slot]: {
            ...prev.images[slot],
            url: '',
            name: '',
            version: `cleared_${slot}_${Date.now()}`,
            isValid: false,
          },
        },
      };
      return invalidateDownstreamOnImageChange(updatedState, slot);
    });
  };

  // Update image alignment transform
  const handleUpdateTransform = (slot: ViewSlot, transform: ReferenceImageTransform) => {
    setProject((prev) => ({
      ...prev,
      images: {
        ...prev.images,
        [slot]: {
          ...prev.images[slot],
          transform,
        },
      },
    }));
  };

  // Push landmark history snapshot
  const pushLandmarkHistory = () => {
    setLandmarkHistory((h) => [...h.slice(-15), JSON.parse(JSON.stringify(project.landmarks))]);
  };

  // Update landmark point
  const handleUpdateLandmark = (updated: Landmark2D) => {
    pushLandmarkHistory();
    const newLms = project.landmarks.map((l) => (l.id === updated.id ? updated : l));
    if (project.wireframe) {
      recomputeWireframe(newLms);
    } else {
      setProject((p) => ({ ...p, landmarks: newLms }));
    }
  };

  // Batch update landmarks (from AI auto-refine / alignment assistant)
  const handleBatchUpdateLandmarks = (updatedLms: Landmark2D[]) => {
    pushLandmarkHistory();
    if (project.wireframe) {
      recomputeWireframe(updatedLms);
    } else {
      setProject((p) => ({ ...p, landmarks: updatedLms }));
    }
  };

  // Add landmark point
  const handleAddLandmark = (newLm: Landmark2D) => {
    pushLandmarkHistory();
    const newLms = [...project.landmarks, newLm];
    if (project.wireframe) {
      recomputeWireframe(newLms);
    } else {
      setProject((p) => ({ ...p, landmarks: newLms }));
    }
  };

  // Delete landmark point
  const handleDeleteLandmark = (id: string) => {
    pushLandmarkHistory();
    const newLms = project.landmarks.filter((l) => l.id !== id);
    if (project.wireframe) {
      recomputeWireframe(newLms);
    } else {
      setProject((p) => ({ ...p, landmarks: newLms }));
    }
  };

  // Undo landmark edit
  const handleUndoLandmark = () => {
    if (landmarkHistory.length === 0) return;
    const previous = landmarkHistory[landmarkHistory.length - 1];
    setLandmarkHistory((h) => h.slice(0, -1));
    if (project.wireframe) {
      recomputeWireframe(previous);
    } else {
      setProject((p) => ({ ...p, landmarks: previous }));
    }
  };

  // Update wireframe settings
  const handleUpdateSettings = (newSettings: Partial<ProjectState['settings']>) => {
    setProject((prev) => {
      const merged = { ...prev.settings, ...newSettings };
      let wireframe = prev.wireframe;
      if (prev.wireframe) {
        const anchorOnly = prev.wireframe.vertices.filter(
          (v) => v.category !== 'skull_ring' && !v.id.startsWith('ring_')
        );
        wireframe = buildHeadWireframe(anchorOnly, {
          density: merged.density,
          customRingsCount: merged.ringsCount,
          customMeridiansCount: merged.meridiansCount,
          includeFacialLoops: merged.showFacialLoops,
          includeSkullRings: merged.showSkullRings,
          includeMeridians: true,
          calibrationScaleMm: merged.calibrationMm,
          isCustomCalibrated: merged.isCustomCalibrated,
          silhouettes: prev.silhouettes,
        });
      }
      return {
        ...prev,
        settings: merged,
        wireframe,
      };
    });
  };

  // Map stage IDs to view keys
  const handleOpenStagePage = (stageId: StageId) => {
    const map: Record<StageId, string> = {
      validation: 'overview',
      alignment: 'stage_alignment',
      landmarks: 'stage_landmarks',
      silhouette: 'stage_silhouette',
      depth: 'stage_depth',
      normals: 'stage_normals',
      matching: 'stage_matching',
      solver: 'stage_solver',
      wireframe: 'stage_wireframe',
      projection: 'stage_comparison',
      validation_report: 'stage_validation',
    };
    setActiveView(map[stageId] || 'overview');
  };

  const handleResetProject = () => {
    localStorage.removeItem(STORAGE_KEY);
    setProject(createInitialProjectState());
    setActiveView('overview');
  };

  return (
    <div className="w-full min-h-dvh flex flex-col bg-slate-950 font-sans text-slate-100 overflow-x-hidden relative">
      {/* 1. Universal Top Navigation Bar adhering to 3-zone contract */}
      <TopBar
        onOpenMenu={() => setIsMenuOpen(true)}
        activeView={activeView}
        onNavigate={(view) => setActiveView(view)}
        onRunPipeline={handleRunPipeline}
        isProcessing={isProcessing}
        onOpen3DView={() => setActiveView('3d_view')}
        onResetProject={handleResetProject}
      />

      {/* 2. Slide-Out Hamburger Navigation Drawer */}
      <SlideOutDrawer
        isOpen={isMenuOpen}
        onClose={() => setIsMenuOpen(false)}
        stages={project.stages}
        activeView={activeView}
        onSelectView={(view) => setActiveView(view)}
        onResetProject={handleResetProject}
      />

      {/* 3. Main Workspace Router (Scrollable on mobile/tablet without clipping) */}
      <main className="flex-1 flex flex-col w-full min-h-0 overflow-y-auto overflow-x-hidden pb-16 lg:pb-0">
        {activeView === 'overview' && (
          <PageOverview
            project={project}
            onUpdateImage={handleUpdateImage}
            onResetImage={handleResetImage}
            onResetAllImages={handleResetAllImages}
            onClearImage={handleClearImage}
            onRunPipeline={handleRunPipeline}
            isProcessing={isProcessing}
            onOpenStagePage={handleOpenStagePage}
            onOpen3DView={() => setActiveView('3d_view')}
            onNavigate={(view) => setActiveView(view)}
          />
        )}

        {activeView === 'stage_alignment' && (
          <PageAlignment
            project={project}
            onUpdateTransform={handleUpdateTransform}
            onResetTransforms={() => {
              setProject((prev) => {
                const next = { ...prev };
                for (const slot of ['front', 'left', 'right', 'back'] as ViewSlot[]) {
                  next.images[slot].transform = { ...DEFAULT_REFERENCE_SLOTS[slot].transform };
                }
                return next;
              });
            }}
            onBack={() => setActiveView('overview')}
          />
        )}

        {activeView === 'stage_landmarks' && (
          <PageLandmarks
            project={project}
            onUpdateLandmark={handleUpdateLandmark}
            onAddLandmark={handleAddLandmark}
            onDeleteLandmark={handleDeleteLandmark}
            onUndo={handleUndoLandmark}
            canUndo={landmarkHistory.length > 0}
            onOpenManualEditor={() => setActiveView('manual_editor')}
            onResetLandmarks={() => {
              pushLandmarkHistory();
              const defaults = buildDefaultLandmarks();
              if (project.wireframe) {
                recomputeWireframe(defaults);
              } else {
                setProject((p) => ({ ...p, landmarks: defaults }));
              }
            }}
            onBack={() => setActiveView('overview')}
          />
        )}

        {(activeView === 'manual_editor' || activeView === 'stage_editor') && (
          <ManualPrecisionEditor
            project={project}
            onUpdateLandmark={handleUpdateLandmark}
            onBatchUpdateLandmarks={handleBatchUpdateLandmarks}
            onUndo={handleUndoLandmark}
            canUndo={landmarkHistory.length > 0}
            onBack={() => setActiveView('overview')}
            onOpen3DView={() => setActiveView('3d_view')}
          />
        )}

        {activeView === 'stage_silhouette' && (
          <PageSilhouette
            project={project}
            onBack={() => setActiveView('overview')}
          />
        )}

        {activeView === 'stage_depth' && (
          <PageDepthMap
            project={project}
            onBack={() => setActiveView('overview')}
          />
        )}

        {activeView === 'stage_normals' && (
          <PageNormalMap
            project={project}
            onBack={() => setActiveView('overview')}
          />
        )}

        {activeView === 'stage_matching' && (
          <PageMatching
            project={project}
            onBack={() => setActiveView('overview')}
          />
        )}

        {activeView === 'stage_solver' && (
          <PageCoordinates
            project={project}
            onUpdateCalibration={(calMm) => recomputeWireframe(undefined, calMm)}
            onBack={() => setActiveView('overview')}
          />
        )}

        {activeView === 'stage_wireframe' && (
          <PageWireframeBuilder
            project={project}
            onUpdateSettings={handleUpdateSettings}
            onRebuildWireframe={() => recomputeWireframe()}
            onOpen3DView={() => setActiveView('3d_view')}
            onBack={() => setActiveView('overview')}
          />
        )}

        {activeView === 'stage_comparison' && (
          <PageComparison
            project={project}
            onOpenEditor={() => setActiveView('manual_editor')}
            onBack={() => setActiveView('overview')}
          />
        )}

        {activeView === 'stage_validation' && (
          <PageValidation
            project={project}
            onBack={() => setActiveView('overview')}
          />
        )}

        {activeView === '3d_view' && (
          <Page3DView
            project={project}
            onUpdateSettings={handleUpdateSettings}
            onOpenValidation={() => setActiveView('stage_validation')}
            onBack={() => setActiveView('overview')}
          />
        )}

        {activeView === 'export' && (
          <PageExport
            project={project}
            onBack={() => setActiveView('overview')}
          />
        )}
      </main>

      {/* 4. Mobile & Tablet Sticky Bottom Navigation Bar (Hidden on desktop) */}
      <nav aria-label="Mobile Navigation" className="fixed bottom-0 left-0 right-0 z-40 bg-slate-950/95 border-t border-slate-800 backdrop-blur-md px-1 py-1 flex items-center justify-around lg:hidden shadow-2xl">
        <button
          type="button"
          onClick={() => setActiveView('overview')}
          className={`flex flex-col items-center gap-0.5 py-1 px-1.5 rounded-lg text-[9px] font-semibold transition-colors cursor-pointer min-h-[44px] justify-center ${
            activeView === 'overview' ? 'text-cyan-400 font-bold' : 'text-slate-400 hover:text-white'
          }`}
        >
          <span className="text-sm">📸</span>
          <span>अपलोड</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveView('manual_editor')}
          className={`flex flex-col items-center gap-0.5 py-1 px-1.5 rounded-lg text-[9px] font-semibold transition-colors cursor-pointer min-h-[44px] justify-center ${
            activeView === 'manual_editor' ? 'text-rose-400 font-bold' : 'text-slate-400 hover:text-white'
          }`}
        >
          <span className="text-sm">✏️</span>
          <span>एडिट</span>
        </button>

        <button
          type="button"
          onClick={handleRunPipeline}
          disabled={isProcessing}
          className="flex flex-col items-center gap-0.5 py-1 px-1.5 rounded-lg text-[9px] font-semibold transition-colors cursor-pointer min-h-[44px] justify-center text-cyan-300 hover:text-white"
        >
          <span className="text-sm">{isProcessing ? '⏳' : '⚡'}</span>
          <span>{isProcessing ? 'चालू...' : 'बनाएं'}</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveView('3d_view')}
          className={`flex flex-col items-center gap-0.5 py-1 px-1.5 rounded-lg text-[9px] font-semibold transition-colors cursor-pointer min-h-[44px] justify-center ${
            activeView === '3d_view' ? 'text-cyan-400 font-bold' : 'text-slate-400 hover:text-white'
          }`}
        >
          <span className="text-sm">🧊</span>
          <span>3D व्यू</span>
        </button>

        <button
          type="button"
          onClick={() => setIsMenuOpen(true)}
          className="flex flex-col items-center gap-0.5 py-1 px-1.5 rounded-lg text-[9px] font-semibold transition-colors cursor-pointer min-h-[44px] justify-center text-slate-400 hover:text-white"
        >
          <span className="text-sm">☰</span>
          <span>मेन्यू</span>
        </button>
      </nav>
    </div>
  );
};
