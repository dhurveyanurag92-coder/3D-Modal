import React, { useState } from 'react';
import { ArrowLeft, Sliders, RotateCcw, Check, Eye } from 'lucide-react';
import { ProjectState, ReferenceImageTransform, ViewSlot } from '../../modules/types';

interface PageAlignmentProps {
  project: ProjectState;
  onUpdateTransform: (slot: ViewSlot, transform: ReferenceImageTransform) => void;
  onResetTransforms: () => void;
  onBack: () => void;
}

export const PageAlignment: React.FC<PageAlignmentProps> = ({
  project,
  onUpdateTransform,
  onResetTransforms,
  onBack,
}) => {
  const [selectedSlot, setSelectedSlot] = useState<ViewSlot>('front');
  const [showLaserGuides, setShowLaserGuides] = useState(true);

  const slots: ViewSlot[] = ['front', 'left', 'right', 'back'];
  const currentImg = project.images[selectedSlot];

  const handleSliderChange = (
    key: keyof ReferenceImageTransform,
    value: number | boolean
  ) => {
    onUpdateTransform(selectedSlot, {
      ...currentImg.transform,
      [key]: value,
    });
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-slate-950">
      {/* Top Header */}
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
            <Sliders className="w-4 h-4 text-cyan-400" />
            <span>Multi-View Scale & Pose Alignment</span>
          </h2>
        </div>

        <button
          type="button"
          onClick={onResetTransforms}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-medium transition-colors cursor-pointer"
        >
          <RotateCcw className="w-3.5 h-3.5 text-cyan-400" />
          <span>Reset All Transforms</span>
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left Column: 4-View Synchronized Comparison Strip */}
        <div className="flex-1 p-4 sm:p-6 overflow-y-auto space-y-4">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-slate-300">
              Synchronized Height Landmarks & Laser Reticle
            </span>
            <label className="flex items-center gap-2 text-xs text-slate-400 cursor-pointer">
              <input
                type="checkbox"
                checked={showLaserGuides}
                onChange={(e) => setShowLaserGuides(e.target.checked)}
                className="rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-0"
              />
              <span>Show Alignment Lasers</span>
            </label>
          </div>

          {/* 4 Views Side-by-Side */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {slots.map((slot) => {
              const img = project.images[slot];
              const isSelected = selectedSlot === slot;
              return (
                <div
                  key={slot}
                  onClick={() => setSelectedSlot(slot)}
                  className={`bg-slate-900 rounded-xl overflow-hidden border cursor-pointer transition-all ${
                    isSelected
                      ? 'border-cyan-400 ring-2 ring-cyan-400/20 shadow-xl'
                      : 'border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="p-2 border-b border-slate-800 bg-slate-950/40 text-[11px] font-semibold text-slate-300 capitalize flex items-center justify-between">
                    <span>{slot} View</span>
                    {isSelected && <span className="text-[10px] text-cyan-400">Editing</span>}
                  </div>

                  <div className="relative aspect-square bg-slate-950 overflow-hidden">
                    <img
                      src={img.url}
                      alt={slot}
                      style={{
                        transform: `scale(${img.transform.scale}) translate(${img.transform.offsetX}%, ${img.transform.offsetY}%) rotate(${img.transform.rotationDeg}deg) ${
                          img.transform.flipH ? 'scaleX(-1)' : ''
                        }`,
                        opacity: img.transform.opacity,
                      }}
                      className="w-full h-full object-cover transition-transform"
                    />

                    {/* Laser Guides */}
                    {showLaserGuides && (
                      <div className="absolute inset-0 pointer-events-none">
                        {/* Cranium Crown Laser */}
                        <div className="absolute top-[12%] left-0 right-0 h-px bg-cyan-400/80 shadow-xs" />
                        {/* Eye Line Laser */}
                        <div className="absolute top-[38%] left-0 right-0 h-px bg-emerald-400/80 shadow-xs" />
                        {/* Nose Base Laser */}
                        <div className="absolute top-[49%] left-0 right-0 h-px bg-amber-400/80 shadow-xs" />
                        {/* Chin Level Laser */}
                        <div className="absolute top-[61%] left-0 right-0 h-px bg-rose-400/80 shadow-xs" />
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 text-xs text-slate-400 space-y-1.5">
            <div className="font-semibold text-white">Laser Alignment Legend</div>
            <div className="flex flex-wrap items-center gap-4 text-[11px]">
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-0.5 bg-cyan-400" />
                <span>Cranium Crown (Y=12%)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-0.5 bg-emerald-400" />
                <span>Eye Line (Y=38%)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-0.5 bg-amber-400" />
                <span>Nose Base (Y=49%)</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2.5 h-0.5 bg-rose-400" />
                <span>Chin Gnathion (Y=61%)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Transform Sliders */}
        <div className="w-full lg:w-80 border-t lg:border-t-0 lg:border-l border-slate-800 bg-slate-950 p-4 sm:p-5 flex flex-col space-y-5">
          <div>
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              {selectedSlot.toUpperCase()} View Transform
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Adjust scale and offsets without altering original file.
            </p>
          </div>

          {/* Scale Slider */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Scale</span>
              <span className="font-mono text-cyan-400 font-semibold">
                {currentImg.transform.scale.toFixed(2)}x
              </span>
            </div>
            <input
              type="range"
              min="0.7"
              max="1.3"
              step="0.01"
              value={currentImg.transform.scale}
              onChange={(e) => handleSliderChange('scale', parseFloat(e.target.value))}
              className="w-full accent-cyan-400 cursor-pointer"
            />
          </div>

          {/* Offset Y (Vertical) */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Vertical Offset (Y)</span>
              <span className="font-mono text-cyan-400 font-semibold">
                {currentImg.transform.offsetY}%
              </span>
            </div>
            <input
              type="range"
              min="-20"
              max="20"
              step="0.5"
              value={currentImg.transform.offsetY}
              onChange={(e) => handleSliderChange('offsetY', parseFloat(e.target.value))}
              className="w-full accent-cyan-400 cursor-pointer"
            />
          </div>

          {/* Offset X (Horizontal) */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Horizontal Offset (X)</span>
              <span className="font-mono text-cyan-400 font-semibold">
                {currentImg.transform.offsetX}%
              </span>
            </div>
            <input
              type="range"
              min="-20"
              max="20"
              step="0.5"
              value={currentImg.transform.offsetX}
              onChange={(e) => handleSliderChange('offsetX', parseFloat(e.target.value))}
              className="w-full accent-cyan-400 cursor-pointer"
            />
          </div>

          {/* Rotation */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Rotation</span>
              <span className="font-mono text-cyan-400 font-semibold">
                {currentImg.transform.rotationDeg}°
              </span>
            </div>
            <input
              type="range"
              min="-15"
              max="15"
              step="0.5"
              value={currentImg.transform.rotationDeg}
              onChange={(e) => handleSliderChange('rotationDeg', parseFloat(e.target.value))}
              className="w-full accent-cyan-400 cursor-pointer"
            />
          </div>

          {/* Opacity */}
          <div className="space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-slate-400">Opacity</span>
              <span className="font-mono text-cyan-400 font-semibold">
                {Math.round(currentImg.transform.opacity * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0.2"
              max="1.0"
              step="0.05"
              value={currentImg.transform.opacity}
              onChange={(e) => handleSliderChange('opacity', parseFloat(e.target.value))}
              className="w-full accent-cyan-400 cursor-pointer"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
