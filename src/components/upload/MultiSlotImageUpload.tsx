import React, { useState, useRef, useEffect } from 'react';
import {
  Upload,
  RotateCcw,
  Maximize2,
  Trash2,
  CheckCircle2,
  Eye,
  Camera,
  FolderOpen,
  X,
  Sparkles,
  Info,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';
import { ReferenceImageSlot, ViewSlot } from '../../modules/types';

export interface MultiSlotImageUploadProps {
  images: Record<ViewSlot, ReferenceImageSlot>;
  onUpdateImage: (slot: ViewSlot, fileUrl: string, name: string, width?: number, height?: number) => void;
  onResetSlot: (slot: ViewSlot) => void;
  onResetAllSlots: () => void;
  onClearSlot: (slot: ViewSlot) => void;
  showLaserGuides?: boolean;
  onToggleLaserGuides?: () => void;
}

interface ImageSlotMeta {
  slot: ViewSlot;
  label: string;
  hindiLabel: string;
  subLabel: string;
  angle: string;
  anatomicalPlane: string;
  description: string;
  hintHindi: string;
}

const SLOT_DEFINITIONS: ImageSlotMeta[] = [
  {
    slot: 'front',
    label: 'Front View',
    hindiLabel: '1. सामने (Front)',
    subLabel: 'Anterior Portrait',
    angle: '0°',
    anatomicalPlane: 'Coronal Plane',
    description: 'Biparietal skull width (X) and facial height (Y)',
    hintHindi: 'चेहरे का सीधा सामने का फोटो (आँखें, नाक, होंठ)',
  },
  {
    slot: 'left',
    label: 'Left Profile',
    hindiLabel: '2. बायाँ प्रोफ़ाइल (Left)',
    subLabel: 'Sinister Profile',
    angle: '90°',
    anatomicalPlane: 'Sagittal Plane',
    description: 'Nasal prominence & occipital cranium depth (Z)',
    hintHindi: 'बायाँ 90° साइड एंगल (नाक का उभार और कान)',
  },
  {
    slot: 'right',
    label: 'Right Profile',
    hindiLabel: '3. दायाँ प्रोफ़ाइल (Right)',
    subLabel: 'Dexter Profile',
    angle: '-90°',
    anatomicalPlane: 'Sagittal Plane',
    description: 'Bilateral depth verification & temple alignment',
    hintHindi: 'दायाँ 90° साइड एंगल (चेहरे का दायाँ प्रोफ़ाइल)',
  },
  {
    slot: 'back',
    label: 'Back View',
    hindiLabel: '4. पीछे का दृश्य (Back)',
    subLabel: 'Posterior Cranium',
    angle: '180°',
    anatomicalPlane: 'Coronal Plane',
    description: 'Occipital volume, inion & cervical neck curvature',
    hintHindi: 'सिर के पीछे का फोटो (बाल, गर्दन और खोपड़ी)',
  },
];

export const MultiSlotImageUpload: React.FC<MultiSlotImageUploadProps> = ({
  images,
  onUpdateImage,
  onResetSlot,
  onResetAllSlots,
  onClearSlot,
  showLaserGuides = true,
  onToggleLaserGuides,
}) => {
  const [dragOverSlot, setDragOverSlot] = useState<ViewSlot | null>(null);
  const [isGlobalDragging, setIsGlobalDragging] = useState(false);
  const [inspectSlot, setInspectSlot] = useState<ViewSlot | null>(null);
  const [batchNotice, setBatchNotice] = useState<string | null>(null);
  // Responsive tab on mobile/tablet ('all' or individual slot)
  const [mobileActiveSlot, setMobileActiveSlot] = useState<'all' | ViewSlot>('all');

  // File input refs for individual slots
  const inputRefs: Record<ViewSlot, React.RefObject<HTMLInputElement | null>> = {
    front: useRef<HTMLInputElement>(null),
    left: useRef<HTMLInputElement>(null),
    right: useRef<HTMLInputElement>(null),
    back: useRef<HTMLInputElement>(null),
  };

  // Camera capture refs for mobile devices
  const cameraRefs: Record<ViewSlot, React.RefObject<HTMLInputElement | null>> = {
    front: useRef<HTMLInputElement>(null),
    left: useRef<HTMLInputElement>(null),
    right: useRef<HTMLInputElement>(null),
    back: useRef<HTMLInputElement>(null),
  };

  const batchInputRef = useRef<HTMLInputElement>(null);

  // Helper to read file and extract dimensions
  const processImageFile = (
    file: File,
    slot: ViewSlot
  ): Promise<void> => {
    return new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const dataUrl = e.target?.result as string;
        if (!dataUrl) return resolve();

        const img = new Image();
        img.onload = () => {
          onUpdateImage(slot, dataUrl, file.name, img.width, img.height);
          resolve();
        };
        img.src = dataUrl;
      };
      reader.readAsDataURL(file);
    });
  };

  // Handle single slot file selection
  const handleSlotFileChange = (slot: ViewSlot, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processImageFile(file, slot);
    }
  };

  // Drag events on individual slot
  const handleSlotDragOver = (slot: ViewSlot, e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverSlot(slot);
  };

  const handleSlotDragLeave = (slot: ViewSlot, e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (dragOverSlot === slot) {
      setDragOverSlot(null);
    }
  };

  const handleSlotDrop = (slot: ViewSlot, e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOverSlot(null);

    const files = Array.from(e.dataTransfer.files).filter((f) =>
      f.type.startsWith('image/')
    );

    if (files.length === 1) {
      processImageFile(files[0], slot);
    } else if (files.length > 1) {
      handleBatchFiles(files);
    }
  };

  // Smart multi-file assignment based on filenames or sequential order
  const handleBatchFiles = async (files: File[]) => {
    const imageFiles = files.filter((f) => f.type.startsWith('image/'));
    if (imageFiles.length === 0) return;

    let assignedCount = 0;
    const assignedSlots = new Set<ViewSlot>();

    // Keyword-based matching
    for (const file of imageFiles) {
      const name = file.name.toLowerCase();
      let targetSlot: ViewSlot | null = null;

      if (name.includes('front') || name.includes('anterior') || name.includes('face') || name.includes('samne')) {
        targetSlot = 'front';
      } else if (name.includes('back') || name.includes('posterior') || name.includes('rear') || name.includes('piche')) {
        targetSlot = 'back';
      } else if (name.includes('left') || name.includes('sinister') || name.includes('profile_l') || name.includes('baya')) {
        targetSlot = 'left';
      } else if (name.includes('right') || name.includes('dexter') || name.includes('profile_r') || name.includes('daya')) {
        targetSlot = 'right';
      }

      if (targetSlot && !assignedSlots.has(targetSlot)) {
        await processImageFile(file, targetSlot);
        assignedSlots.add(targetSlot);
        assignedCount++;
      }
    }

    // Sequential fallback for unmatched files
    const remainingSlots: ViewSlot[] = (['front', 'left', 'right', 'back'] as ViewSlot[]).filter(
      (s) => !assignedSlots.has(s)
    );

    for (const file of imageFiles) {
      if (remainingSlots.length === 0) break;
      const name = file.name.toLowerCase();
      if (
        name.includes('front') ||
        name.includes('back') ||
        name.includes('left') ||
        name.includes('right')
      ) {
        continue;
      }
      const slot = remainingSlots.shift()!;
      await processImageFile(file, slot);
      assignedSlots.add(slot);
      assignedCount++;
    }

    setBatchNotice(`Assigned ${assignedCount} reference images to slots.`);
    setTimeout(() => setBatchNotice(null), 4000);
  };

  // Global batch file chooser handler
  const handleBatchInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      handleBatchFiles(Array.from(e.target.files));
    }
  };

  // Global drag-and-drop listener
  const handleGlobalDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsGlobalDragging(true);
  };

  const handleGlobalDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setIsGlobalDragging(false);
    }
  };

  const handleGlobalDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsGlobalDragging(false);
    const files = Array.from(e.dataTransfer.files).filter((f) =>
      f.type.startsWith('image/')
    );
    if (files.length > 0) {
      handleBatchFiles(files);
    }
  };

  // Clipboard paste support
  useEffect(() => {
    const handlePaste = (e: ClipboardEvent) => {
      const items = e.clipboardData?.items;
      if (!items) return;

      for (let i = 0; i < items.length; i++) {
        if (items[i].type.startsWith('image/')) {
          const file = items[i].getAsFile();
          if (file) {
            const target: ViewSlot =
              mobileActiveSlot !== 'all' ? mobileActiveSlot : inspectSlot || 'front';
            processImageFile(file, target);
            setBatchNotice(`Pasted photo into ${target.toUpperCase()} slot.`);
            setTimeout(() => setBatchNotice(null), 3500);
            break;
          }
        }
      }
    };

    window.addEventListener('paste', handlePaste);
    return () => window.removeEventListener('paste', handlePaste);
  }, [inspectSlot, mobileActiveSlot]);

  // Count active slots
  const filledCount = Object.values(images).filter((img) => !!img.url).length;

  // Filter slots depending on mobile view mode
  const displayedSlots =
    mobileActiveSlot === 'all'
      ? SLOT_DEFINITIONS
      : SLOT_DEFINITIONS.filter((d) => d.slot === mobileActiveSlot);

  return (
    <div
      onDragOver={handleGlobalDragOver}
      onDragLeave={handleGlobalDragLeave}
      onDrop={handleGlobalDrop}
      className="space-y-4 w-full max-w-full relative"
    >
      {/* Hidden batch multi-file input */}
      <input
        type="file"
        ref={batchInputRef}
        onChange={handleBatchInputChange}
        multiple
        accept="image/png,image/jpeg,image/webp"
        className="hidden"
      />

      {/* Global Drag Overlay */}
      {isGlobalDragging && (
        <div className="absolute inset-0 z-40 bg-cyan-950/80 border-2 border-dashed border-cyan-400 rounded-2xl flex flex-col items-center justify-center p-6 backdrop-blur-xs pointer-events-none transition-all">
          <Upload className="w-12 h-12 text-cyan-300 animate-bounce mb-3" />
          <div className="text-base font-bold text-white">फ़ोटो यहाँ छोड़ें (Drop images here)</div>
          <div className="text-xs text-cyan-200 mt-1">
            Files named 'front', 'left', 'right', 'back' are auto-routed!
          </div>
        </div>
      )}

      {/* 1. Primary Ingestion Bar - Prominent and Mobile-Friendly */}
      <div className="bg-slate-900 border border-slate-800 p-3 sm:p-4 rounded-xl flex flex-col gap-3 w-full">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="flex items-center gap-2">
              <span
                className={`w-2.5 h-2.5 rounded-full ${
                  filledCount === 4
                    ? 'bg-emerald-400 ring-2 ring-emerald-400/20'
                    : 'bg-amber-400 ring-2 ring-amber-400/20'
                }`}
              />
              <span className="text-xs sm:text-sm font-bold text-white tracking-tight">
                {filledCount}/4 फ़ोटो तैयार हैं ({filledCount}/4 Reference Photos Loaded)
              </span>
            </div>
            <p className="text-[11px] text-slate-400 mt-0.5">
              सामने, बायाँ, दायाँ और पीछे के 4 कोण अपलोड करें (Front, Left, Right, Back)
            </p>
          </div>

          {/* Quick Action Buttons for all devices */}
          <div className="flex flex-wrap items-center gap-2">
            {/* Multi-file batch upload button */}
            <button
              type="button"
              onClick={() => batchInputRef.current?.click()}
              className="flex-1 sm:flex-initial min-h-[40px] flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-bold transition-all shadow-sm cursor-pointer"
            >
              <FolderOpen className="w-4 h-4 shrink-0" />
              <span>4 फ़ोटो एक साथ चुनें</span>
            </button>

            {/* Reset to sample character button */}
            <button
              type="button"
              onClick={onResetAllSlots}
              title="डिफ़ॉल्ट सैम्पल कैरेक्टर फ़ोटो लोड करें"
              className="min-h-[40px] flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors cursor-pointer"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span className="whitespace-nowrap">सैम्पल कैरेक्टर</span>
            </button>

            {/* Laser Guides toggle */}
            {onToggleLaserGuides && (
              <button
                type="button"
                onClick={onToggleLaserGuides}
                className={`min-h-[40px] flex items-center justify-center gap-1.5 px-2.5 py-2 rounded-lg text-xs font-medium transition-colors cursor-pointer border ${
                  showLaserGuides
                    ? 'bg-cyan-500/15 text-cyan-300 border-cyan-500/30 font-semibold'
                    : 'bg-slate-800 text-slate-400 border-slate-700 hover:text-white'
                }`}
              >
                <Eye className="w-3.5 h-3.5" />
                <span className="hidden xs:inline">गाइड लेज़र</span>
              </button>
            )}
          </div>
        </div>

        {/* 2. Responsive Mobile / Tablet Tab Switcher */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 pt-1 border-t border-slate-800/80 -mx-1 px-1">
          <button
            type="button"
            onClick={() => setMobileActiveSlot('all')}
            className={`min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer shrink-0 ${
              mobileActiveSlot === 'all'
                ? 'bg-cyan-400 text-slate-950 shadow-xs'
                : 'bg-slate-800/80 text-slate-300 hover:text-white'
            }`}
          >
            चारों दृश्य (All 4 Grid)
          </button>

          {SLOT_DEFINITIONS.map((def) => {
            const isLoaded = !!images[def.slot].url;
            return (
              <button
                key={def.slot}
                type="button"
                onClick={() => setMobileActiveSlot(def.slot)}
                className={`min-h-[36px] px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer shrink-0 flex items-center gap-1.5 ${
                  mobileActiveSlot === def.slot
                    ? 'bg-cyan-400 text-slate-950 shadow-xs'
                    : 'bg-slate-800/80 text-slate-300 hover:text-white'
                }`}
              >
                <span>{def.hindiLabel}</span>
                {isLoaded ? (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
                ) : (
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Batch Notification Alert */}
      {batchNotice && (
        <div className="p-3 rounded-lg bg-cyan-950/90 border border-cyan-500/50 text-xs text-cyan-200 flex items-center gap-2 shadow-lg">
          <Info className="w-4 h-4 text-cyan-400 shrink-0" />
          <span>{batchNotice}</span>
        </div>
      )}

      {/* 3. Fluid Grid of Upload Slots (1-col on mobile in focus mode, 2-col on tablet, 4-col on desktop) */}
      <div
        className={`w-full max-w-full ${
          mobileActiveSlot === 'all'
            ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4'
            : 'max-w-2xl mx-auto'
        }`}
      >
        {displayedSlots.map((def) => {
          const imgSlot = images[def.slot];
          const isSlotDragOver = dragOverSlot === def.slot;
          const hasImage = !!imgSlot.url;

          return (
            <div
              key={def.slot}
              onDragOver={(e) => handleSlotDragOver(def.slot, e)}
              onDragLeave={(e) => handleSlotDragLeave(def.slot, e)}
              onDrop={(e) => handleSlotDrop(def.slot, e)}
              className={`bg-slate-900 rounded-xl overflow-hidden border flex flex-col transition-all duration-200 relative group w-full ${
                isSlotDragOver
                  ? 'border-cyan-400 ring-4 ring-cyan-400/20 bg-cyan-950/30'
                  : hasImage
                  ? 'border-slate-800 hover:border-slate-700 shadow-md'
                  : 'border-dashed border-slate-700 bg-slate-900/60'
              }`}
            >
              {/* Native file input */}
              <input
                type="file"
                ref={inputRefs[def.slot]}
                onChange={(e) => handleSlotFileChange(def.slot, e)}
                accept="image/png,image/jpeg,image/webp"
                className="hidden"
              />

              {/* Direct Camera capture input for mobile */}
              <input
                type="file"
                ref={cameraRefs[def.slot]}
                onChange={(e) => handleSlotFileChange(def.slot, e)}
                accept="image/*"
                capture="user"
                className="hidden"
              />

              {/* Slot Header */}
              <div className="p-3 border-b border-slate-800 bg-slate-950/60 flex items-center justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 truncate">
                    <span className="text-xs sm:text-sm font-bold text-white truncate">
                      {def.hindiLabel}
                    </span>
                    <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-slate-800 text-slate-300 shrink-0">
                      {def.angle}
                    </span>
                  </div>
                  <div className="text-[11px] text-slate-400 truncate mt-0.5">{def.hintHindi}</div>
                </div>

                {hasImage ? (
                  <span className="text-[10px] px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-semibold shrink-0 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>अपलोड है</span>
                  </span>
                ) : (
                  <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/30 font-medium shrink-0">
                    खाली
                  </span>
                )}
              </div>

              {/* Image Preview / Tap-to-Upload Dropzone */}
              <div
                onClick={() => {
                  if (!hasImage) {
                    inputRefs[def.slot].current?.click();
                  }
                }}
                className={`relative aspect-square w-full bg-slate-950 flex items-center justify-center overflow-hidden select-none cursor-pointer ${
                  !hasImage ? 'hover:bg-slate-900/90 active:bg-slate-900' : ''
                }`}
              >
                {hasImage ? (
                  <>
                    <img
                      src={imgSlot.url}
                      alt={def.label}
                      className="w-full h-full object-cover transition-transform group-hover:scale-102 duration-300"
                    />

                    {/* Laser Alignment Guides */}
                    {showLaserGuides && (
                      <div className="absolute inset-0 pointer-events-none opacity-45">
                        <div className="absolute top-[12%] left-0 right-0 h-px bg-cyan-400" />
                        <div className="absolute top-[38%] left-0 right-0 h-px bg-emerald-400" />
                        <div className="absolute top-[49%] left-0 right-0 h-px bg-amber-400" />
                        <div className="absolute top-[61%] left-0 right-0 h-px bg-rose-400" />
                        <div className="absolute top-0 bottom-0 left-1/2 w-px bg-cyan-400/40" />
                      </div>
                    )}

                    {/* Quick Fullscreen Inspector Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setInspectSlot(def.slot);
                      }}
                      title="फ़ोटो बड़ा करके देखें"
                      className="absolute top-2 right-2 p-2 rounded-lg bg-slate-950/80 hover:bg-slate-900 text-slate-200 hover:text-white border border-slate-700 transition-opacity cursor-pointer backdrop-blur-xs min-h-[36px] min-w-[36px] flex items-center justify-center"
                    >
                      <Maximize2 className="w-4 h-4" />
                    </button>

                    {/* Pixel Dimensions Tag */}
                    <div className="absolute bottom-2 left-2 px-2 py-0.5 rounded bg-slate-950/80 border border-slate-800 text-[10px] font-mono text-slate-300 pointer-events-none backdrop-blur-xs">
                      {imgSlot.width || 1024}×{imgSlot.height || 1024} px
                    </div>
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center p-4 sm:p-6 text-center text-slate-500 space-y-2.5">
                    <div className="w-14 h-14 rounded-full bg-slate-900 border border-slate-800 flex items-center justify-center group-hover:border-cyan-500/50 group-hover:text-cyan-400 transition-colors">
                      <Upload className="w-6 h-6 text-slate-400 group-hover:text-cyan-400" />
                    </div>
                    <div>
                      <div className="text-xs sm:text-sm font-semibold text-slate-200 group-hover:text-cyan-300">
                        फ़ोटो चुनें या यहाँ डालें
                      </div>
                      <div className="text-[11px] text-slate-400 mt-0.5">
                        Click, Tap or Drag Photo (PNG, JPG, WebP)
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons Bar - Touch-Friendly $\ge 44$px */}
              <div className="p-2 sm:p-2.5 bg-slate-900 border-t border-slate-800 flex flex-wrap items-center justify-between gap-1.5">
                {/* Choose from gallery / file */}
                <button
                  type="button"
                  onClick={() => inputRefs[def.slot].current?.click()}
                  className="flex-1 min-h-[42px] px-3 py-2 rounded-lg bg-cyan-500/15 hover:bg-cyan-500/25 text-cyan-300 hover:text-white border border-cyan-500/30 text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors cursor-pointer active:scale-98"
                >
                  <Upload className="w-4 h-4 shrink-0 text-cyan-400" />
                  <span>{hasImage ? 'बदलें (Replace)' : 'फ़ोटो चुनें (Select)'}</span>
                </button>

                {/* Direct mobile camera capture */}
                <button
                  type="button"
                  onClick={() => cameraRefs[def.slot].current?.click()}
                  title="कैमरे से फोटो खींचें (Take photo with camera)"
                  className="min-h-[42px] px-2.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-300 hover:text-white border border-slate-700 text-xs font-medium flex items-center justify-center gap-1 transition-colors cursor-pointer"
                >
                  <Camera className="w-4 h-4 text-cyan-400 shrink-0" />
                  <span className="hidden xs:inline">कैमरा</span>
                </button>

                {hasImage && (
                  <>
                    <button
                      type="button"
                      onClick={() => onResetSlot(def.slot)}
                      title="सैम्पल फोटो रीसेट करें (Reset to sample photo)"
                      className="min-h-[42px] px-2.5 py-2 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-400 hover:text-white border border-slate-700 transition-colors cursor-pointer"
                    >
                      <RotateCcw className="w-4 h-4 shrink-0" />
                    </button>

                    <button
                      type="button"
                      onClick={() => onClearSlot(def.slot)}
                      title="हटाएं (Clear slot)"
                      className="min-h-[42px] px-2.5 py-2 rounded-lg bg-slate-800 hover:bg-rose-500/20 text-slate-400 hover:text-rose-400 border border-slate-700 transition-colors cursor-pointer"
                    >
                      <Trash2 className="w-4 h-4 shrink-0" />
                    </button>
                  </>
                )}
              </div>

              {/* Fast navigation button in 1-by-1 focus mode */}
              {mobileActiveSlot !== 'all' && (
                <div className="p-2 bg-slate-950 border-t border-slate-800/80 flex items-center justify-between text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      const idx = SLOT_DEFINITIONS.findIndex((s) => s.slot === def.slot);
                      const prevIdx = (idx - 1 + SLOT_DEFINITIONS.length) % SLOT_DEFINITIONS.length;
                      setMobileActiveSlot(SLOT_DEFINITIONS[prevIdx].slot);
                    }}
                    className="flex items-center gap-1 text-slate-400 hover:text-white py-1 px-2 rounded cursor-pointer"
                  >
                    <ChevronLeft className="w-4 h-4" />
                    <span>पिछला (Prev)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const idx = SLOT_DEFINITIONS.findIndex((s) => s.slot === def.slot);
                      const nextIdx = (idx + 1) % SLOT_DEFINITIONS.length;
                      setMobileActiveSlot(SLOT_DEFINITIONS[nextIdx].slot);
                    }}
                    className="flex items-center gap-1 text-cyan-400 font-semibold hover:text-cyan-300 py-1 px-2 rounded cursor-pointer"
                  >
                    <span>अगला स्लॉट (Next)</span>
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Fullscreen Inspector Modal */}
      {inspectSlot && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-4">
          <div className="relative max-w-4xl w-full bg-slate-950 border border-slate-800 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[92vh]">
            <div className="p-3 sm:p-4 border-b border-slate-800 flex items-center justify-between gap-2">
              <div>
                <h3 className="text-xs sm:text-sm font-bold text-white capitalize">
                  {inspectSlot} View - फुल रेज़ोल्यूशन प्रीव्यू
                </h3>
                <div className="text-[11px] text-slate-400">
                  {images[inspectSlot].width || 1024}×{images[inspectSlot].height || 1024} px
                </div>
              </div>

              <button
                type="button"
                onClick={() => setInspectSlot(null)}
                className="min-h-[40px] min-w-[40px] flex items-center justify-center p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-850 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-auto p-3 sm:p-4 flex items-center justify-center bg-[#090d16]">
              {images[inspectSlot].url && (
                <img
                  src={images[inspectSlot].url}
                  alt={inspectSlot}
                  className="max-h-[72vh] w-auto max-w-full object-contain rounded-lg shadow-2xl border border-slate-800"
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
