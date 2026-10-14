import React, { useEffect } from 'react';
import {
  X,
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Clock,
  Box,
  Download,
  Image,
  Sliders,
  Sparkles,
  Layers,
  Activity,
  Maximize2,
  Compass,
  FileText,
  RotateCcw,
} from 'lucide-react';
import { ProjectState, StageDefinition, StageId } from '../../modules/types';

interface SlideOutDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  stages: Record<StageId, StageDefinition>;
  activeView: string;
  onSelectView: (view: string) => void;
  onResetProject: () => void;
}

export const SlideOutDrawer: React.FC<SlideOutDrawerProps> = ({
  isOpen,
  onClose,
  stages,
  activeView,
  onSelectView,
  onResetProject,
}) => {
  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const renderStatusIcon = (status: StageDefinition['status']) => {
    switch (status) {
      case 'completed':
        return <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />;
      case 'running':
        return <Loader2 className="w-4 h-4 text-cyan-400 animate-spin shrink-0" />;
      case 'stale':
        return <RotateCcw className="w-4 h-4 text-amber-400 shrink-0" />;
      case 'failed':
        return <X className="w-4 h-4 text-rose-500 shrink-0" />;
      case 'waiting':
      default:
        return <Clock className="w-4 h-4 text-slate-500 shrink-0" />;
    }
  };

  const stageItems: Array<{ stageId: StageId; viewKey: string; icon: React.ReactNode }> = [
    { stageId: 'validation', viewKey: 'stage_validation_input', icon: <Image className="w-4 h-4" /> },
    { stageId: 'alignment', viewKey: 'stage_alignment', icon: <Sliders className="w-4 h-4" /> },
    { stageId: 'landmarks', viewKey: 'stage_landmarks', icon: <Sparkles className="w-4 h-4" /> },
    { stageId: 'silhouette', viewKey: 'stage_silhouette', icon: <Layers className="w-4 h-4" /> },
    { stageId: 'depth', viewKey: 'stage_depth', icon: <Activity className="w-4 h-4" /> },
    { stageId: 'normals', viewKey: 'stage_normals', icon: <Compass className="w-4 h-4" /> },
    { stageId: 'matching', viewKey: 'stage_matching', icon: <Maximize2 className="w-4 h-4" /> },
    { stageId: 'solver', viewKey: 'stage_solver', icon: <Sliders className="w-4 h-4" /> },
    { stageId: 'wireframe', viewKey: 'stage_wireframe', icon: <Box className="w-4 h-4" /> },
    { stageId: 'projection', viewKey: 'stage_comparison', icon: <Layers className="w-4 h-4" /> },
    { stageId: 'validation_report', viewKey: 'stage_validation', icon: <FileText className="w-4 h-4" /> },
  ];

  return (
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Slide-out panel */}
      <div className="relative w-84 max-w-[85vw] h-full bg-slate-950 border-r border-slate-800 text-slate-200 flex flex-col shadow-2xl z-10 overflow-hidden">
        {/* Header */}
        <div className="p-4 border-b border-slate-800/80 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-cyan-400" />
            <span className="text-sm font-bold text-white tracking-tight">Studio Pipeline</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close menu"
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-900 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable stage list */}
        <div className="flex-1 overflow-y-auto p-3 space-y-6">
          {/* Main Views */}
          <div>
            <div className="text-[11px] font-semibold text-slate-400 px-2 mb-1.5 uppercase tracking-wider">
              Main Workspaces
            </div>
            <div className="space-y-1">
              <button
                type="button"
                onClick={() => {
                  onSelectView('overview');
                  onClose();
                }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors text-left cursor-pointer ${
                  activeView === 'overview'
                    ? 'bg-cyan-500/15 text-cyan-300 font-semibold border border-cyan-500/30'
                    : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                }`}
              >
                <Image className="w-4 h-4 text-cyan-400" />
                <span>Reference Uploads</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onSelectView('3d_view');
                  onClose();
                }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors text-left cursor-pointer ${
                  activeView === '3d_view'
                    ? 'bg-cyan-500/15 text-cyan-300 font-semibold border border-cyan-500/30'
                    : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                }`}
              >
                <Box className="w-4 h-4 text-cyan-400" />
                <span>Full-Screen 3D View</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  onSelectView('manual_editor');
                  onClose();
                }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors text-left cursor-pointer ${
                  activeView === 'manual_editor'
                    ? 'bg-rose-500/15 text-rose-300 font-semibold border border-rose-500/30'
                    : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                }`}
              >
                <span className="text-sm">✏️</span>
                <span>Manual Sculpt & Nudge (मैन्युअल एडिट)</span>
              </button>
            </div>
          </div>

          {/* 11 Pipeline Stages */}
          <div>
            <div className="text-[11px] font-semibold text-slate-400 px-2 mb-1.5 uppercase tracking-wider">
              Pipeline Stages (11)
            </div>
            <div className="space-y-1">
              {stageItems.map((item) => {
                const stage = stages[item.stageId];
                const isActive = activeView === item.viewKey;
                return (
                  <button
                    key={item.stageId}
                    type="button"
                    onClick={() => {
                      onSelectView(item.viewKey);
                      onClose();
                    }}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs transition-colors text-left cursor-pointer ${
                      isActive
                        ? 'bg-slate-800 text-cyan-300 font-semibold border border-cyan-500/30'
                        : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 truncate">
                      <span className="text-slate-400">{item.icon}</span>
                      <span className="truncate">{stage.title}</span>
                    </div>
                    {renderStatusIcon(stage.status)}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Output & Project Management */}
          <div>
            <div className="text-[11px] font-semibold text-slate-400 px-2 mb-1.5 uppercase tracking-wider">
              Output & Storage
            </div>
            <div className="space-y-1">
              <button
                type="button"
                onClick={() => {
                  onSelectView('export');
                  onClose();
                }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium transition-colors text-left cursor-pointer ${
                  activeView === 'export'
                    ? 'bg-cyan-500/15 text-cyan-300 font-semibold border border-cyan-500/30'
                    : 'text-slate-300 hover:bg-slate-900 hover:text-white'
                }`}
              >
                <Download className="w-4 h-4 text-cyan-400" />
                <span>Export & Downloads</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  if (confirm('Reset all alignment, landmarks, and reconstruction data to factory defaults?')) {
                    onResetProject();
                    onClose();
                  }
                }}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 transition-colors text-left cursor-pointer"
              >
                <RotateCcw className="w-4 h-4" />
                <span>Reset to Defaults</span>
              </button>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="p-3 border-t border-slate-800/80 text-[11px] text-slate-400 flex items-center justify-between">
          <span>Hollow 3D Head Engine</span>
          <span className="font-mono text-slate-400">v1.2.0</span>
        </div>
      </div>
    </div>
  );
};
