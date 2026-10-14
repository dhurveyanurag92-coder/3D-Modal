import React from 'react';
import { Menu, Play, Box, Download, Upload } from 'lucide-react';

interface TopBarProps {
  onOpenMenu: () => void;
  activeView: string;
  onNavigate: (view: string) => void;
  onRunPipeline: () => void;
  isProcessing: boolean;
  onOpen3DView: () => void;
  onResetProject: () => void;
}

export const TopBar: React.FC<TopBarProps> = ({
  onOpenMenu,
  activeView,
  onNavigate,
  onRunPipeline,
  isProcessing,
  onOpen3DView,
}) => {
  return (
    <header className="h-14 bg-slate-950 border-b border-slate-800/80 px-3 sm:px-4 flex items-center justify-between gap-2 sm:gap-6 z-30 shrink-0 w-full max-w-full">
      {/* Zone 1: Brand Wordmark with Hamburger */}
      <div className="flex items-center gap-2 sm:gap-3 min-w-0 shrink">
        <button
          type="button"
          onClick={onOpenMenu}
          aria-label="Open navigation menu"
          className="min-h-[40px] min-w-[40px] flex items-center justify-center p-2 text-slate-400 hover:text-white rounded-lg hover:bg-slate-900 transition-colors cursor-pointer shrink-0"
        >
          <Menu className="w-5 h-5" />
        </button>

        <button
          type="button"
          onClick={() => onNavigate('overview')}
          className="text-xs sm:text-sm font-bold tracking-tight text-white hover:text-cyan-400 transition-colors cursor-pointer flex items-center gap-1.5 sm:gap-2 truncate"
        >
          <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 shrink-0" />
          <span className="truncate">3D Head Wireframe</span>
        </button>
      </div>

      {/* Zone 2: Clean 1-Line Navigation Links (Desktop) */}
      <nav className="hidden xl:flex items-center gap-5 text-xs font-medium text-slate-400 shrink-0">
        <button
          type="button"
          onClick={() => onNavigate('overview')}
          className={`hover:text-white transition-colors whitespace-nowrap cursor-pointer ${
            activeView === 'overview' ? 'text-cyan-400 font-semibold' : ''
          }`}
        >
          References
        </button>
        <button
          type="button"
          onClick={() => onNavigate('stage_landmarks')}
          className={`hover:text-white transition-colors whitespace-nowrap cursor-pointer ${
            activeView === 'stage_landmarks' ? 'text-cyan-400 font-semibold' : ''
          }`}
        >
          Landmarks
        </button>
        <button
          type="button"
          onClick={() => onNavigate('stage_wireframe')}
          className={`hover:text-white transition-colors whitespace-nowrap cursor-pointer ${
            activeView === 'stage_wireframe' ? 'text-cyan-400 font-semibold' : ''
          }`}
        >
          Wireframe
        </button>
        <button
          type="button"
          onClick={() => onNavigate('stage_comparison')}
          className={`hover:text-white transition-colors whitespace-nowrap cursor-pointer ${
            activeView === 'stage_comparison' ? 'text-cyan-400 font-semibold' : ''
          }`}
        >
          4-View Projection
        </button>
        <button
          type="button"
          onClick={() => onNavigate('stage_validation')}
          className={`hover:text-white transition-colors whitespace-nowrap cursor-pointer ${
            activeView === 'stage_validation' ? 'text-cyan-400 font-semibold' : ''
          }`}
        >
          Validation
        </button>
        <button
          type="button"
          onClick={() => onNavigate('manual_editor')}
          className={`hover:text-white transition-colors whitespace-nowrap cursor-pointer ${
            activeView === 'manual_editor' ? 'text-rose-400 font-semibold' : ''
          }`}
        >
          Manual Sculpt (एडिट)
        </button>
        <button
          type="button"
          onClick={() => onNavigate('export')}
          className={`hover:text-white transition-colors whitespace-nowrap cursor-pointer ${
            activeView === 'export' ? 'text-cyan-400 font-semibold' : ''
          }`}
        >
          Export
        </button>
      </nav>

      {/* Zone 3: Primary Actions (Touch-friendly & Responsive) */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        <button
          type="button"
          onClick={() => onNavigate('manual_editor')}
          className={`min-h-[38px] flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
            activeView === 'manual_editor'
              ? 'bg-rose-500 text-white shadow-sm font-bold'
              : 'bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 hover:text-white'
          }`}
          title="Manual Precision Editor (मैन्युअल एडिट)"
        >
          <span className="text-rose-400 font-bold">✏️</span>
          <span className="whitespace-nowrap">Edit</span>
        </button>

        <button
          type="button"
          onClick={onRunPipeline}
          disabled={isProcessing}
          className={`min-h-[38px] flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
            isProcessing
              ? 'bg-slate-800 text-slate-500 cursor-not-allowed'
              : 'bg-slate-900 hover:bg-slate-800 text-slate-200 border border-slate-700 hover:text-white'
          }`}
        >
          <Play className={`w-3.5 h-3.5 ${isProcessing ? 'animate-spin text-cyan-400' : 'text-cyan-400'}`} />
          <span className="whitespace-nowrap hidden sm:inline">
            {isProcessing ? 'Processing...' : 'Run Pipeline'}
          </span>
          <span className="sm:hidden">Run</span>
        </button>

        <button
          type="button"
          onClick={onOpen3DView}
          className="min-h-[38px] flex items-center gap-1.5 px-2.5 sm:px-3.5 py-1.5 text-xs font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg shadow-sm transition-all whitespace-nowrap cursor-pointer active:scale-98"
        >
          <Box className="w-3.5 h-3.5" />
          <span>3D View</span>
        </button>
      </div>
    </header>
  );
};
