import React from 'react';
import {
  Rotate3d,
  Sun,
  Moon,
  Layers,
  Lightbulb,
  Sliders,
  Sparkles,
  Flame,
  Palette,
  Compass,
  X,
} from 'lucide-react';
import {
  CameraPreset,
  EnvironmentType,
  FinishType,
  FINISH_PRESETS,
  LightingMode,
  LightSettings,
} from '../types/lantern';

interface ControlsOverlayProps {
  isOpen: boolean;
  onClose: () => void;
  finish: FinishType;
  setFinish: (f: FinishType) => void;
  environment: EnvironmentType;
  setEnvironment: (env: EnvironmentType) => void;
  lightingMode: LightingMode;
  setLightingMode: (m: LightingMode) => void;
  sunBrightness: number;
  setSunBrightness: (b: number) => void;
  lightSettings: LightSettings;
  setLightSettings: React.Dispatch<React.SetStateAction<LightSettings>>;
  explodeAmount: number;
  setExplodeAmount: (v: number) => void;
  isWireframe: boolean;
  setIsWireframe: (w: boolean) => void;
  autoRotate: boolean;
  setAutoRotate: (r: boolean) => void;
  autoRotateSpeed: number;
  setAutoRotateSpeed: (s: number) => void;
  onCameraPreset: (preset: CameraPreset) => void;
}

export const ControlsOverlay: React.FC<ControlsOverlayProps> = ({
  isOpen,
  onClose,
  finish,
  setFinish,
  environment,
  setEnvironment,
  lightingMode,
  setLightingMode,
  sunBrightness,
  setSunBrightness,
  lightSettings,
  setLightSettings,
  explodeAmount,
  setExplodeAmount,
  isWireframe,
  setIsWireframe,
  autoRotate,
  setAutoRotate,
  autoRotateSpeed,
  setAutoRotateSpeed,
  onCameraPreset,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-neutral-950/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full sm:max-w-md bg-neutral-900/95 backdrop-blur-md border border-neutral-800 rounded-t-2xl sm:rounded-2xl shadow-2xl p-5 text-neutral-200 max-h-[85vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-neutral-800 mb-4">
          <div className="flex items-center gap-2">
            <Sliders className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-semibold text-neutral-100">3D Studio Settings & Customizer</h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="space-y-4 text-xs">
          {/* 1. Sunlight & Atmosphere (सूर्य की रोशनी) */}
          <div className="p-3 rounded-xl bg-neutral-950/60 border border-neutral-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="font-semibold text-amber-300 flex items-center gap-1.5">
                <Sun className="w-4 h-4 text-amber-400" />
                <span>Illumination Mode (उजाला)</span>
              </span>
              <span className="text-[11px] text-neutral-400">
                {lightingMode === 'sunlight' ? 'Bright Sun' : lightingMode === 'studio' ? 'White Studio' : 'Night'}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-1.5">
              <button
                type="button"
                onClick={() => setLightingMode('sunlight')}
                className={`py-2 px-2 rounded-lg font-medium text-[11px] flex flex-col items-center gap-1 border transition-colors ${
                  lightingMode === 'sunlight'
                    ? 'bg-amber-400 text-neutral-950 font-bold border-amber-300 shadow-sm'
                    : 'bg-neutral-900 border-neutral-800 text-neutral-300 hover:text-white'
                }`}
              >
                <Sun className="w-3.5 h-3.5" />
                <span>धूप (Sunlight)</span>
              </button>
              <button
                type="button"
                onClick={() => setLightingMode('studio')}
                className={`py-2 px-2 rounded-lg font-medium text-[11px] flex flex-col items-center gap-1 border transition-colors ${
                  lightingMode === 'studio'
                    ? 'bg-amber-400 text-neutral-950 font-bold border-amber-300 shadow-sm'
                    : 'bg-neutral-900 border-neutral-800 text-neutral-300 hover:text-white'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>स्टूडियो (Studio)</span>
              </button>
              <button
                type="button"
                onClick={() => setLightingMode('night')}
                className={`py-2 px-2 rounded-lg font-medium text-[11px] flex flex-col items-center gap-1 border transition-colors ${
                  lightingMode === 'night'
                    ? 'bg-amber-400 text-neutral-950 font-bold border-amber-300 shadow-sm'
                    : 'bg-neutral-900 border-neutral-800 text-neutral-300 hover:text-white'
                }`}
              >
                <Moon className="w-3.5 h-3.5" />
                <span>रात (Night)</span>
              </button>
            </div>

            {/* Sunlight Brightness Slider */}
            {lightingMode === 'sunlight' && (
              <div className="space-y-1 pt-1.5 border-t border-neutral-800/80">
                <div className="flex justify-between text-[11px] text-neutral-400">
                  <span>Sun Brightness (धूप की तीव्रता)</span>
                  <span className="font-mono text-amber-300">{Math.round(sunBrightness * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.8"
                  max="2.0"
                  step="0.1"
                  value={sunBrightness}
                  onChange={(e) => setSunBrightness(parseFloat(e.target.value))}
                  className="w-full accent-amber-400 h-1.5 bg-neutral-800 rounded-lg cursor-pointer"
                />
              </div>
            )}
          </div>

          {/* 2. 360 Turntable Auto-spin */}
          <div className="p-3 rounded-xl bg-neutral-950/60 border border-neutral-800 space-y-2">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Rotate3d className="w-4 h-4 text-amber-400" />
                <div>
                  <div className="font-medium text-neutral-200">360° Auto Turntable</div>
                  <div className="text-[11px] text-neutral-400">लगातार 360 में घूमेगा</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setAutoRotate(!autoRotate)}
                className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${
                  autoRotate
                    ? 'bg-amber-400 text-neutral-950'
                    : 'bg-neutral-800 text-neutral-400'
                }`}
              >
                {autoRotate ? 'ON' : 'OFF'}
              </button>
            </div>

            {autoRotate && (
              <div className="space-y-1 pt-1">
                <div className="flex justify-between text-[11px] text-neutral-400">
                  <span>Rotation Speed</span>
                  <span className="font-mono">{autoRotateSpeed.toFixed(1)}x</span>
                </div>
                <input
                  type="range"
                  min="0.4"
                  max="3.0"
                  step="0.2"
                  value={autoRotateSpeed}
                  onChange={(e) => setAutoRotateSpeed(parseFloat(e.target.value))}
                  className="w-full accent-amber-400 h-1.5 bg-neutral-800 rounded-lg cursor-pointer"
                />
              </div>
            )}
          </div>

          {/* 3. Camera View Angles */}
          <div className="p-3 rounded-xl bg-neutral-950/60 border border-neutral-800 space-y-2">
            <div className="flex items-center gap-1.5 font-medium text-neutral-300">
              <Compass className="w-3.5 h-3.5 text-amber-400" />
              <span>Camera Angles (देखने का कोण)</span>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              <button
                type="button"
                onClick={() => {
                  onCameraPreset('photo_match');
                  onClose();
                }}
                className="py-1.5 px-2 bg-neutral-900 hover:bg-neutral-800 border border-amber-500/30 text-amber-300 rounded font-medium text-[11px] transition-colors text-left flex justify-between items-center"
              >
                <span>Photo Match</span>
                <span className="text-[10px] text-amber-400/80">3/4 Sconce</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  onCameraPreset('front');
                  onClose();
                }}
                className="py-1.5 px-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 rounded font-medium text-[11px] transition-colors text-left"
              >
                Front Face
              </button>
              <button
                type="button"
                onClick={() => {
                  onCameraPreset('side');
                  onClose();
                }}
                className="py-1.5 px-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 rounded font-medium text-[11px] transition-colors text-left"
              >
                Side Profile
              </button>
              <button
                type="button"
                onClick={() => {
                  onCameraPreset('detail_filigree');
                  onClose();
                }}
                className="py-1.5 px-2 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 rounded font-medium text-[11px] transition-colors text-left"
              >
                Floral Macro
              </button>
            </div>
          </div>

          {/* 4. Bulb Light & Dimmer */}
          <div className="p-3 rounded-xl bg-neutral-950/60 border border-neutral-800 space-y-2.5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Lightbulb
                  className={`w-4 h-4 ${
                    lightSettings.isOn ? 'text-amber-400' : 'text-neutral-500'
                  }`}
                />
                <div>
                  <div className="font-medium text-neutral-200">Edison Bulb (अंदर का बल्ब)</div>
                  <div className="text-[11px] text-neutral-400">Warm glowing filament</div>
                </div>
              </div>
              <button
                type="button"
                onClick={() =>
                  setLightSettings((prev) => ({ ...prev, isOn: !prev.isOn }))
                }
                className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${
                  lightSettings.isOn
                    ? 'bg-amber-400 text-neutral-950'
                    : 'bg-neutral-800 text-neutral-400'
                }`}
              >
                {lightSettings.isOn ? 'ON' : 'OFF'}
              </button>
            </div>

            {lightSettings.isOn && (
              <div className="space-y-1">
                <div className="flex justify-between text-[11px] text-neutral-400">
                  <span>Bulb Intensity</span>
                  <span className="font-mono">{Math.round(lightSettings.intensity * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0.2"
                  max="1.5"
                  step="0.05"
                  value={lightSettings.intensity}
                  onChange={(e) =>
                    setLightSettings((prev) => ({
                      ...prev,
                      intensity: parseFloat(e.target.value),
                    }))
                  }
                  className="w-full accent-amber-400 h-1.5 bg-neutral-800 rounded-lg cursor-pointer"
                />
              </div>
            )}
          </div>

          {/* 5. Metal Finish & Materials */}
          <div className="p-3 rounded-xl bg-neutral-950/60 border border-neutral-800 space-y-2">
            <div className="flex items-center gap-1.5 font-medium text-neutral-300">
              <Palette className="w-3.5 h-3.5 text-amber-400" />
              <span>Metal Finish (धातु का रंग)</span>
            </div>
            <div className="grid grid-cols-2 gap-1.5">
              {Object.entries(FINISH_PRESETS).map(([key, preset]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setFinish(key as FinishType)}
                  className={`py-1.5 px-2 rounded-lg text-[11px] font-medium border text-left flex items-center gap-2 transition-colors ${
                    finish === key
                      ? 'bg-amber-400/10 border-amber-400 text-amber-300 font-semibold'
                      : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-neutral-200'
                  }`}
                >
                  <span
                    className="w-3 h-3 rounded-full border border-white/20 shrink-0"
                    style={{ backgroundColor: preset.color }}
                  />
                  <span className="truncate">{preset.name.split(' (')[0]}</span>
                </button>
              ))}
            </div>
          </div>

          {/* 6. Exploded Anatomy View */}
          <div className="p-3 rounded-xl bg-neutral-950/60 border border-neutral-800 space-y-2">
            <div className="flex justify-between items-center">
              <span className="font-medium text-neutral-200">Exploded Anatomy (पार्ट्स अलग करके देखें)</span>
              <span className="font-mono text-amber-400">
                {Math.round(explodeAmount * 100)}%
              </span>
            </div>
            <input
              type="range"
              min="0"
              max="1"
              step="0.02"
              value={explodeAmount}
              onChange={(e) => setExplodeAmount(parseFloat(e.target.value))}
              className="w-full accent-amber-400 h-1.5 bg-neutral-800 rounded-lg cursor-pointer"
            />
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-neutral-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2 text-xs font-semibold text-neutral-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors text-center"
          >
            Apply & Return to Pure 3D View
          </button>
        </div>
      </div>
    </div>
  );
};
