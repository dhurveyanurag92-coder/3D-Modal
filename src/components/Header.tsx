import React from 'react';
import { Camera, Image as ImageIcon, RotateCcw, Eye, Menu } from 'lucide-react';

interface HeaderProps {
  onOpenMenu: () => void;
  onResetView: () => void;
  onOpenPhotoModal: () => void;
  onCaptureSnapshot: () => void;
  pureMode: boolean;
  onTogglePureMode: () => void;
  activeCharacterTitle: string;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenMenu,
  onResetView,
  onOpenPhotoModal,
  onCaptureSnapshot,
  pureMode,
  onTogglePureMode,
  activeCharacterTitle,
}) => {
  if (pureMode) return null;

  return (
    <header className="fixed top-0 left-0 right-0 z-20 flex items-center justify-between gap-3 px-3 sm:px-6 py-2.5 bg-neutral-950/80 backdrop-blur-md border-b border-neutral-800/80 transition-opacity">
      {/* Zone 1: 3-Line Hamburger Menu & Title */}
      <div className="flex items-center gap-2.5 shrink-0">
        {/* 3-LINE MENU BUTTON (तीन लाइन कोने में) */}
        <button
          type="button"
          onClick={onOpenMenu}
          title="3D Models Menu (3 लाइन्स मेनू)"
          className="p-1.5 sm:px-2.5 sm:py-1.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-700/80 text-amber-400 hover:text-amber-300 flex items-center gap-1.5 transition-all shadow-sm"
        >
          <Menu className="w-5 h-5" />
          <span className="hidden sm:inline text-xs font-semibold text-neutral-200">
            Menu
          </span>
        </button>

        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-amber-400 flex items-center justify-center text-neutral-950 font-bold text-xs shadow-sm">
            3D
          </div>
          <span className="text-sm font-semibold tracking-tight text-neutral-100 whitespace-nowrap hidden xs:inline">
            {activeCharacterTitle}
          </span>
        </div>
      </div>

      {/* Zone 2: Quick Actions */}
      <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
        <button
          type="button"
          onClick={onOpenPhotoModal}
          className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-neutral-300 hover:text-white bg-neutral-900/80 hover:bg-neutral-800 border border-neutral-800 rounded-lg transition-colors whitespace-nowrap"
        >
          <ImageIcon className="w-3.5 h-3.5 text-amber-400" />
          <span>Photo Ref</span>
        </button>

        <button
          type="button"
          onClick={onResetView}
          title="Reset to 3/4 photo angle"
          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-neutral-300 hover:text-white bg-neutral-900/80 hover:bg-neutral-800 border border-neutral-800 rounded-lg transition-colors whitespace-nowrap"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          <span className="hidden xs:inline">Reset</span>
        </button>

        <button
          type="button"
          onClick={onTogglePureMode}
          title="सिर्फ मॉडल देखें (Hide all UI)"
          className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-amber-300 bg-amber-400/15 hover:bg-amber-400/25 border border-amber-400/30 rounded-lg transition-colors whitespace-nowrap"
        >
          <Eye className="w-3.5 h-3.5" />
          <span>सिर्फ मॉडल</span>
        </button>

        <button
          type="button"
          onClick={onCaptureSnapshot}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-neutral-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors shadow-sm whitespace-nowrap"
        >
          <Camera className="w-3.5 h-3.5" />
          <span className="hidden sm:inline">Snapshot</span>
        </button>
      </div>
    </header>
  );
};
