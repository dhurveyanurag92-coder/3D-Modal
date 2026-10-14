import React, { useState } from 'react';
import {
  Play,
  Box,
  Eye,
  Sliders,
  Sparkles,
  CheckCircle2,
  FileText,
  Layers,
  Info,
} from 'lucide-react';
import { ProjectState, StageId, ViewSlot } from '../../modules/types';
import { PipelineProgressPanel } from '../studio/PipelineProgressPanel';
import { MultiSlotImageUpload } from '../upload/MultiSlotImageUpload';

interface PageOverviewProps {
  project: ProjectState;
  onUpdateImage: (slot: ViewSlot, fileUrl: string, name: string, width?: number, height?: number) => void;
  onResetImage: (slot: ViewSlot) => void;
  onResetAllImages: () => void;
  onClearImage: (slot: ViewSlot) => void;
  onRunPipeline: () => void;
  isProcessing: boolean;
  onOpenStagePage: (stageId: StageId) => void;
  onOpen3DView: () => void;
  onNavigate: (view: string) => void;
}

export const PageOverview: React.FC<PageOverviewProps> = ({
  project,
  onUpdateImage,
  onResetImage,
  onResetAllImages,
  onClearImage,
  onRunPipeline,
  isProcessing,
  onOpenStagePage,
  onOpen3DView,
  onNavigate,
}) => {
  const [showLaserGuides, setShowLaserGuides] = useState(true);

  return (
    <div className="flex-1 flex flex-col lg:flex-row w-full max-w-full bg-slate-950">
      {/* Left / Center: Multi-Slot Reference Upload & Diagnostics */}
      <div className="flex-1 w-full max-w-full p-3 sm:p-4 md:p-6 space-y-4 sm:space-y-6">
        {/* Banner */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">
              Multi-View 3D Head Reconstruction
            </div>
            <h1 className="text-lg sm:text-xl font-bold text-white tracking-tight mt-0.5">
              Reference Ingestion & Multi-Slot Camera Setup
            </h1>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl leading-relaxed">
              Provide synchronized reference photographs in the four labeled camera slots: Front, Left Profile,
              Right Profile, and Back. The pipeline aligns scale, detects 36+ anatomical landmarks, extracts
              head silhouettes, and reconstructs a rotatable, hollow 3D wireframe.
            </p>
          </div>

          <div className="flex items-center gap-2.5 shrink-0">
            <button
              type="button"
              onClick={onRunPipeline}
              disabled={isProcessing}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                isProcessing
                  ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
                  : 'bg-cyan-400 hover:bg-cyan-300 text-slate-950 shadow-md shadow-cyan-950/40'
              }`}
            >
              <Play className={`w-4 h-4 ${isProcessing ? 'animate-spin' : ''}`} />
              <span>{isProcessing ? 'Reconstructing...' : 'Run Pipeline'}</span>
            </button>
          </div>
        </div>

        {/* Dedicated Multi-Slot Image Upload Component */}
        <MultiSlotImageUpload
          images={project.images}
          onUpdateImage={onUpdateImage}
          onResetSlot={onResetImage}
          onResetAllSlots={onResetAllImages}
          onClearSlot={onClearImage}
          showLaserGuides={showLaserGuides}
          onToggleLaserGuides={() => setShowLaserGuides(!showLaserGuides)}
        />

        {/* Quick Diagnostics & Specs Card */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Anatomical Landmarks
            </div>
            <div className="text-xl font-bold text-white mt-1">
              {project.landmarks.length} Points
            </div>
            <div className="text-xs text-slate-400 mt-0.5">
              Across 4 views · Manual / Template placement
            </div>
            <button
              type="button"
              onClick={() => onNavigate('stage_landmarks')}
              className="mt-3 text-xs text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1 cursor-pointer"
            >
              <span>Inspect landmarks</span> →
            </button>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Hollow Wireframe
            </div>
            <div className="text-xl font-bold text-white mt-1">
              {project.wireframe
                ? `${project.wireframe.totalPoints} Vertices · ${project.wireframe.totalEdges} Edges`
                : 'Pending Generation'}
            </div>
            <div className="text-xs text-slate-400 mt-0.5">
              {project.wireframe
                ? `${project.wireframe.constrainedVerticesCount} constrained · ${project.wireframe.interpolatedVerticesCount} interpolated`
                : 'Click "Run Pipeline" to build 3D cage'}
            </div>
            <button
              type="button"
              onClick={onOpen3DView}
              className="mt-3 text-xs text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1 cursor-pointer"
            >
              <span>Open 3D Viewport</span> →
            </button>
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
            <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              Cephalometric Calibration
            </div>
            <div className="text-xl font-bold text-white mt-1">
              {project.measurements
                ? `${project.measurements.headHeightMm} ${project.settings.isCustomCalibrated ? 'mm' : 'units'}`
                : 'Pending 3D Solve'}
            </div>
            <div className="text-xs text-slate-400 mt-0.5">
              {project.measurements
                ? `Cranial Index: ${project.measurements.cranialIndex} (${project.measurements.cranialClassification})`
                : 'Reference height: ~220mm standard'}
            </div>
            <button
              type="button"
              onClick={() => onNavigate('stage_solver')}
              className="mt-3 text-xs text-cyan-400 hover:text-cyan-300 font-semibold flex items-center gap-1 cursor-pointer"
            >
              <span>View 3D measurements</span> →
            </button>
          </div>
        </div>
      </div>

      {/* Right Column: 11-Stage Pipeline Progress Timeline */}
      <div className="w-full lg:w-84 border-t lg:border-t-0 lg:border-l border-slate-800 shrink-0 p-4 bg-slate-950 flex flex-col">
        <PipelineProgressPanel
          stages={project.stages}
          isProcessing={isProcessing}
          onRunPipeline={onRunPipeline}
          onOpenStagePage={onOpenStagePage}
          onOpen3DView={onOpen3DView}
          className="h-full"
        />
      </div>
    </div>
  );
};
