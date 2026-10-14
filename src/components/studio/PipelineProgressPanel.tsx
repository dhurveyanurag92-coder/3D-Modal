import React from 'react';
import {
  CheckCircle2,
  AlertTriangle,
  Loader2,
  Clock,
  X,
  ChevronRight,
  Play,
  Box,
  Layers,
  RotateCcw,
} from 'lucide-react';
import { StageDefinition, StageId } from '../../modules/types';

interface PipelineProgressPanelProps {
  stages: Record<StageId, StageDefinition>;
  isProcessing: boolean;
  onRunPipeline: () => void;
  onOpenStagePage: (stageId: StageId) => void;
  onOpen3DView: () => void;
  className?: string;
}

export const PipelineProgressPanel: React.FC<PipelineProgressPanelProps> = ({
  stages,
  isProcessing,
  onRunPipeline,
  onOpenStagePage,
  onOpen3DView,
  className = '',
}) => {
  const stageList = Object.values(stages).sort((a, b) => a.order - b.order);
  const completedCount = stageList.filter((s) => s.status === 'completed' || s.status === 'warning').length;
  const progressPct = Math.round((completedCount / stageList.length) * 100);

  const getStatusIcon = (status: StageDefinition['status']) => {
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
        return <Clock className="w-3.5 h-3.5 text-slate-500 shrink-0" />;
    }
  };

  return (
    <div className={`bg-slate-950 border border-slate-800 rounded-xl flex flex-col overflow-hidden ${className}`}>
      {/* Header */}
      <div className="p-3.5 border-b border-slate-800 bg-slate-900/50 flex items-center justify-between">
        <div>
          <h2 className="text-xs font-bold text-white tracking-tight flex items-center gap-2">
            <Layers className="w-4 h-4 text-cyan-400" />
            <span>Process Pipeline</span>
          </h2>
          <div className="text-[11px] text-slate-400 mt-0.5">
            {completedCount} of {stageList.length} stages complete ({progressPct}%)
          </div>
        </div>

        <button
          type="button"
          onClick={onRunPipeline}
          disabled={isProcessing}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-md text-xs font-semibold transition-all cursor-pointer ${
            isProcessing
              ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
              : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold shadow-xs'
          }`}
        >
          <Play className={`w-3 h-3 ${isProcessing ? 'animate-spin' : ''}`} />
          <span>{isProcessing ? 'Running...' : 'Generate'}</span>
        </button>
      </div>

      {/* Progress Bar */}
      <div className="w-full bg-slate-800/80 h-1">
        <div
          className="bg-cyan-400 h-1 transition-all duration-300"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      {/* Stage Timeline */}
      <div className="flex-1 overflow-y-auto divide-y divide-slate-800/50 p-1">
        {stageList.map((stage) => {
          const isClickable = stage.status !== 'waiting';
          return (
            <button
              key={stage.id}
              type="button"
              onClick={() => onOpenStagePage(stage.id)}
              disabled={!isClickable}
              className={`w-full p-2.5 flex items-start justify-between gap-3 text-left transition-colors rounded-lg cursor-pointer ${
                isClickable ? 'hover:bg-slate-900/80 cursor-pointer' : 'opacity-60 cursor-not-allowed'
              }`}
            >
              <div className="flex items-start gap-2.5 min-w-0">
                <div className="mt-0.5">{getStatusIcon(stage.status)}</div>
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-slate-200 flex items-center gap-1.5">
                    <span className="truncate">{stage.title}</span>
                  </div>
                  {stage.outputSummary && (
                    <div className="text-[11px] text-slate-400 truncate mt-0.5">
                      {stage.outputSummary}
                    </div>
                  )}
                  {stage.status === 'running' && (
                    <div className="text-[11px] text-cyan-400 animate-pulse mt-0.5">
                      Processing geometry...
                    </div>
                  )}
                </div>
              </div>

              {isClickable && (
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-300 shrink-0 self-center" />
              )}
            </button>
          );
        })}
      </div>

      {/* Bottom 3D View Button */}
      <div className="p-3 border-t border-slate-800 bg-slate-900/30">
        <button
          type="button"
          onClick={onOpen3DView}
          className="w-full py-2 px-3 rounded-lg bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer shadow-sm"
        >
          <Box className="w-4 h-4" />
          <span>Open 3D Viewport</span>
        </button>
      </div>
    </div>
  );
};
