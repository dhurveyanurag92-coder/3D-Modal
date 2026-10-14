import React, { useState } from 'react';
import {
  Rotate3d,
  Sun,
  Eye,
  Wind,
  Compass,
  Sliders,
  Sparkles,
  Camera,
  Layers,
  ChevronRight,
  Smile,
  X,
  Download,
  Box,
  RotateCcw,
  ScanFace,
} from 'lucide-react';
import {
  Character2CameraPreset,
  LightingPreset,
  EyeGazeSettings,
  HairPhysicsSettings,
  ExpressionSettings,
  TextureMode,
  FacialSculptSettings,
  WireframeSettings,
  DisplayShadingMode,
} from './types';

interface Character2ControlsProps {
  isOpen: boolean;
  onClose: () => void;
  textureMode: TextureMode;
  setTextureMode: (tm: TextureMode) => void;
  lightingPreset: LightingPreset;
  setLightingPreset: (lp: LightingPreset) => void;
  sculptSettings: FacialSculptSettings;
  setSculptSettings: React.Dispatch<React.SetStateAction<FacialSculptSettings>>;
  wireframeSettings: WireframeSettings;
  setWireframeSettings: React.Dispatch<React.SetStateAction<WireframeSettings>>;
  shadingMode: DisplayShadingMode;
  setShadingMode: (mode: DisplayShadingMode) => void;
  gazeSettings: EyeGazeSettings;
  setGazeSettings: React.Dispatch<React.SetStateAction<EyeGazeSettings>>;
  hairSettings: HairPhysicsSettings;
  setHairSettings: React.Dispatch<React.SetStateAction<HairPhysicsSettings>>;
  expressionSettings: ExpressionSettings;
  setExpressionSettings: React.Dispatch<React.SetStateAction<ExpressionSettings>>;
  isWireframe: boolean;
  setIsWireframe: (wf: boolean) => void;
  autoRotate: boolean;
  setAutoRotate: (ar: boolean) => void;
  autoRotateSpeed: number;
  setAutoRotateSpeed: (ars: number) => void;
  onCameraPreset: (preset: Character2CameraPreset) => void;
  onOpenPhotosModal: () => void;
  onOpenDepthVisualizer?: () => void;
  onExportOBJ?: () => void;
}

export const Character2Controls: React.FC<Character2ControlsProps> = ({
  isOpen,
  onClose,
  textureMode,
  setTextureMode,
  lightingPreset,
  setLightingPreset,
  sculptSettings,
  setSculptSettings,
  wireframeSettings,
  setWireframeSettings,
  shadingMode,
  setShadingMode,
  gazeSettings,
  setGazeSettings,
  hairSettings,
  setHairSettings,
  expressionSettings,
  setExpressionSettings,
  isWireframe,
  setIsWireframe,
  autoRotate,
  setAutoRotate,
  autoRotateSpeed,
  setAutoRotateSpeed,
  onCameraPreset,
  onOpenPhotosModal,
  onOpenDepthVisualizer,
  onExportOBJ,
}) => {
  const [activeTab, setActiveTab] = useState<'sculpt' | 'wireframe' | 'eyes' | 'hair' | 'camera' | 'light'>('sculpt');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-40 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-neutral-950/40 backdrop-blur-xs animate-in fade-in duration-150">
      <div className="relative w-full sm:max-w-md bg-neutral-900/95 backdrop-blur-md border border-neutral-800 rounded-t-2xl sm:rounded-2xl shadow-2xl p-5 text-neutral-200 max-h-[85vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-neutral-800 mb-3">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            <h3 className="text-sm font-semibold text-neutral-100">
              Character 2: 3D & UV Controls
            </h3>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* UV Photographic Texture Mapping Hero Card */}
        <div className="p-3.5 rounded-xl bg-gradient-to-br from-amber-950/40 via-neutral-950/80 to-blue-950/40 border border-amber-500/30 mb-4 shadow-inner">
          <div className="flex items-center justify-between mb-1.5">
            <div className="flex items-center gap-2">
              <Camera className="w-4 h-4 text-amber-400" />
              <span className="text-xs font-bold text-neutral-100">UV Photographic Texture Mode</span>
            </div>
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30">
              {textureMode === 'uv_photographic' ? '📸 Active (Photorealistic)' : '🎨 3D Mesh'}
            </span>
          </div>
          <p className="text-[11px] text-neutral-300 leading-relaxed mb-2.5">
            आपकी 4 इमेजेस (Front, Left, Right, Back) के अनुसार फोटोग्राफिक टेक्सचर चेहरे, आँखों और घुंघराले बालों पर मैप किया गया है।
          </p>
          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={() => setTextureMode('uv_photographic')}
              className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                textureMode === 'uv_photographic'
                  ? 'bg-amber-400 text-neutral-950 font-bold shadow-md shadow-amber-400/25'
                  : 'bg-neutral-800/80 text-neutral-300 hover:text-white hover:bg-neutral-800'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>📸 UV Photo Texture</span>
            </button>
            <button
              type="button"
              onClick={() => setTextureMode('sculpted_3d')}
              className={`px-3 py-2 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-all ${
                textureMode === 'sculpted_3d'
                  ? 'bg-blue-500 text-white font-bold shadow-md shadow-blue-500/25'
                  : 'bg-neutral-800/80 text-neutral-300 hover:text-white hover:bg-neutral-800'
              }`}
            >
              <Layers className="w-3.5 h-3.5" />
              <span>🎨 Sculpted 3D</span>
            </button>
          </div>
        </div>

        {/* Tab Switcher - 6 Studio Tabs */}
        <div className="grid grid-cols-3 sm:grid-cols-6 gap-1 p-1 bg-neutral-950/70 rounded-xl mb-4 text-[11px] font-medium">
          <button
            type="button"
            onClick={() => setActiveTab('sculpt')}
            className={`py-1.5 px-1 rounded-lg transition-colors flex items-center justify-center gap-1 ${
              activeTab === 'sculpt'
                ? 'bg-amber-400 text-neutral-950 font-bold shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <ScanFace className="w-3 h-3" />
            <span>बनावट</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('wireframe')}
            className={`py-1.5 px-1 rounded-lg transition-colors flex items-center justify-center gap-1 ${
              activeTab === 'wireframe'
                ? 'bg-amber-400 text-neutral-950 font-bold shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Box className="w-3 h-3" />
            <span>मेश व जाल</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('eyes')}
            className={`py-1.5 px-1 rounded-lg transition-colors flex items-center justify-center gap-1 ${
              activeTab === 'eyes'
                ? 'bg-amber-400 text-neutral-950 font-bold shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Eye className="w-3 h-3" />
            <span>आँखें</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('hair')}
            className={`py-1.5 px-1 rounded-lg transition-colors flex items-center justify-center gap-1 ${
              activeTab === 'hair'
                ? 'bg-amber-400 text-neutral-950 font-bold shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Wind className="w-3 h-3" />
            <span>बाल</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('camera')}
            className={`py-1.5 px-1 rounded-lg transition-colors flex items-center justify-center gap-1 ${
              activeTab === 'camera'
                ? 'bg-amber-400 text-neutral-950 font-bold shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Compass className="w-3 h-3" />
            <span>4-Views</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('light')}
            className={`py-1.5 px-1 rounded-lg transition-colors flex items-center justify-center gap-1 ${
              activeTab === 'light'
                ? 'bg-amber-400 text-neutral-950 font-bold shadow-sm'
                : 'text-neutral-400 hover:text-white'
            }`}
          >
            <Sun className="w-3 h-3" />
            <span>लाइटिंग</span>
          </button>
        </div>

        {/* TAB 0: SCULPT (चेहरे की बनावट व गहराई - Localized Fine-Tuner Point 24) */}
        {activeTab === 'sculpt' && (
          <div className="space-y-3.5 text-xs">
            <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/25 flex items-center justify-between">
              <div>
                <span className="font-semibold text-amber-300 block">3D Parametric Sculptor (लोकेलाइज्ड टूल)</span>
                <span className="text-[11px] text-neutral-400">अपनी तस्वीरों के अनुसार नाक, जबड़ा और चेहरे की गहराई बदलें</span>
              </div>
              <button
                type="button"
                onClick={() =>
                  setSculptSettings({
                    noseDepth: 0.5,
                    noseBridgeWidth: 0.5,
                    noseTipLift: 0.5,
                    jawWidth: 0.5,
                    chinSharpness: 0.5,
                    chinDepth: 0.5,
                    cheekboneHeight: 0.5,
                    eyeSocketDepth: 0.5,
                    eyeSpacing: 0.5,
                  })
                }
                className="p-1.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white flex items-center gap-1 text-[10px]"
                title="रीसेट करें"
              >
                <RotateCcw className="w-3 h-3 text-amber-400" />
                <span>रीसेट</span>
              </button>
            </div>

            {/* Nose Controls */}
            <div className="p-3 rounded-xl bg-neutral-950/60 border border-neutral-800 space-y-3">
              <div className="font-semibold text-neutral-200 flex items-center justify-between">
                <span>👃 नाक की 3D गहराई व चौड़ाई (Nose Shape)</span>
                <span className="text-[10px] text-amber-400 font-mono">{Math.round(sculptSettings.noseDepth * 100)}%</span>
              </div>
              <div>
                <div className="flex justify-between text-[11px] text-neutral-400 mb-1">
                  <span>नाक उभार (Protrusion Depth):</span>
                  <span>{sculptSettings.noseDepth > 0.5 ? 'अधिक उभरी हुई' : 'सपाट'}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.02"
                  value={sculptSettings.noseDepth}
                  onChange={(e) =>
                    setSculptSettings((prev) => ({ ...prev, noseDepth: parseFloat(e.target.value) }))
                  }
                  className="w-full accent-amber-400 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-[11px] text-neutral-400 mb-1">
                  <span>नाक की चौड़ाई (Bridge Width):</span>
                  <span>{Math.round(sculptSettings.noseBridgeWidth * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.02"
                  value={sculptSettings.noseBridgeWidth}
                  onChange={(e) =>
                    setSculptSettings((prev) => ({ ...prev, noseBridgeWidth: parseFloat(e.target.value) }))
                  }
                  className="w-full accent-amber-400 cursor-pointer"
                />
              </div>
            </div>

            {/* Jaw & Chin Controls */}
            <div className="p-3 rounded-xl bg-neutral-950/60 border border-neutral-800 space-y-3">
              <div className="font-semibold text-neutral-200 flex items-center justify-between">
                <span>📐 जबड़ा व ठोड़ी का कंटूर (Jaw & Chin)</span>
                <span className="text-[10px] text-amber-400 font-mono">{Math.round(sculptSettings.jawWidth * 100)}%</span>
              </div>
              <div>
                <div className="flex justify-between text-[11px] text-neutral-400 mb-1">
                  <span>जबड़े की चौड़ाई (Jawline Width):</span>
                  <span>{sculptSettings.jawWidth > 0.5 ? 'चौड़ा' : 'V-शेप पतला'}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.02"
                  value={sculptSettings.jawWidth}
                  onChange={(e) =>
                    setSculptSettings((prev) => ({ ...prev, jawWidth: parseFloat(e.target.value) }))
                  }
                  className="w-full accent-amber-400 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-[11px] text-neutral-400 mb-1">
                  <span>ठोड़ी का नुकीलापन (Chin Sharpness):</span>
                  <span>{sculptSettings.chinSharpness > 0.5 ? 'नुकीली (Sharp)' : 'गोल (Round)'}</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.02"
                  value={sculptSettings.chinSharpness}
                  onChange={(e) =>
                    setSculptSettings((prev) => ({ ...prev, chinSharpness: parseFloat(e.target.value) }))
                  }
                  className="w-full accent-amber-400 cursor-pointer"
                />
              </div>
            </div>

            {/* Cheeks & Eye Sockets */}
            <div className="p-3 rounded-xl bg-neutral-950/60 border border-neutral-800 space-y-3">
              <div className="font-semibold text-neutral-200">
                👁️ आँखों के सॉकेट्स व गाल (Cheeks & Orbital Depth)
              </div>
              <div>
                <div className="flex justify-between text-[11px] text-neutral-400 mb-1">
                  <span>आँखों के गड्ढे की गहराई (Orbital Socket Depth):</span>
                  <span>{Math.round(sculptSettings.eyeSocketDepth * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.02"
                  value={sculptSettings.eyeSocketDepth}
                  onChange={(e) =>
                    setSculptSettings((prev) => ({ ...prev, eyeSocketDepth: parseFloat(e.target.value) }))
                  }
                  className="w-full accent-amber-400 cursor-pointer"
                />
              </div>

              <div>
                <div className="flex justify-between text-[11px] text-neutral-400 mb-1">
                  <span>गालों की हड्डियों का उभार (Cheekbone Prominence):</span>
                  <span>{Math.round(sculptSettings.cheekboneHeight * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.02"
                  value={sculptSettings.cheekboneHeight}
                  onChange={(e) =>
                    setSculptSettings((prev) => ({ ...prev, cheekboneHeight: parseFloat(e.target.value) }))
                  }
                  className="w-full accent-amber-400 cursor-pointer"
                />
              </div>
            </div>
          </div>
        )}

        {/* TAB 0.5: WIREFRAME & 3D EXPORT (पॉलीगॉन जाल व 3D डाउनलोड - Point 9 & featured-2.jpg) */}
        {activeTab === 'wireframe' && (
          <div className="space-y-3.5 text-xs">
            {/* Shading Mode Switcher */}
            <div className="p-3 rounded-xl bg-neutral-950/60 border border-neutral-800 space-y-2">
              <div className="font-semibold text-neutral-200">शेडिंग व रेंडर मोड (Display Mode)</div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                <button
                  type="button"
                  onClick={() => setShadingMode('photographic')}
                  className={`py-2 px-1 rounded-lg text-center text-[10px] font-semibold border transition-all ${
                    shadingMode === 'photographic'
                      ? 'bg-amber-400 text-neutral-950 border-amber-300 shadow-sm'
                      : 'bg-neutral-900 border-neutral-800 text-neutral-300 hover:text-white'
                  }`}
                >
                  📸 1. UV फ़ोटो
                </button>
                <button
                  type="button"
                  onClick={() => setShadingMode('clay_sculpt')}
                  className={`py-2 px-1 rounded-lg text-center text-[10px] font-semibold border transition-all ${
                    shadingMode === 'clay_sculpt'
                      ? 'bg-amber-400 text-neutral-950 border-amber-300 shadow-sm'
                      : 'bg-neutral-900 border-neutral-800 text-neutral-300 hover:text-white'
                  }`}
                >
                  🗿 2. क्ले स्कल्पचर
                </button>
                <button
                  type="button"
                  onClick={() => setShadingMode('depth_map')}
                  className={`py-2 px-1 rounded-lg text-center text-[10px] font-semibold border transition-all ${
                    shadingMode === 'depth_map'
                      ? 'bg-blue-500 text-white border-blue-400 shadow-md shadow-blue-500/30'
                      : 'bg-neutral-900 border-neutral-800 text-blue-300 hover:text-white'
                  }`}
                >
                  🔲 3. डेप्थ मैप
                </button>
                <button
                  type="button"
                  onClick={() => setShadingMode('wireframe_only')}
                  className={`py-2 px-1 rounded-lg text-center text-[10px] font-semibold border transition-all ${
                    shadingMode === 'wireframe_only'
                      ? 'bg-amber-400 text-neutral-950 border-amber-300 shadow-sm'
                      : 'bg-neutral-900 border-neutral-800 text-neutral-300 hover:text-white'
                  }`}
                >
                  🌐 4. सिर्फ वायरफ्रेम
                </button>
              </div>
            </div>

            {/* 2D Photo to Depth Map Visualizer Card */}
            {onOpenDepthVisualizer && (
              <div className="p-3 rounded-xl bg-gradient-to-r from-blue-950/60 to-indigo-950/40 border border-blue-500/30 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-blue-300 block">2D Photo ➔ 3D Depth Map Visualizer</span>
                  <span className="text-[11px] text-neutral-400">फ़ोटो से निकाला गया ग्रे-स्केल Z-Depth व हीटमैप देखें</span>
                </div>
                <button
                  type="button"
                  onClick={onOpenDepthVisualizer}
                  className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-md shadow-blue-600/30 transition-all shrink-0"
                >
                  <Layers className="w-3.5 h-3.5" />
                  <span>विज़ुअलाइज़र</span>
                </button>
              </div>
            )}

            {/* Wireframe Grid Toggle & Colors */}
            <div className="p-3 rounded-xl bg-neutral-950/60 border border-neutral-800 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-neutral-200">Wireframe Mesh Overlay</div>
                  <div className="text-[11px] text-neutral-400">खानों और लाइनों का जाल (जैसा आपकी फोटो में था)</div>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setWireframeSettings((prev) => ({ ...prev, enabled: !prev.enabled }))
                  }
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors ${
                    wireframeSettings.enabled
                      ? 'bg-amber-400 text-neutral-950 shadow-sm'
                      : 'bg-neutral-800 text-neutral-400 hover:text-white'
                  }`}
                >
                  {wireframeSettings.enabled ? 'ON' : 'OFF'}
                </button>
              </div>

              {/* Wireframe Colors */}
              <div>
                <span className="text-[11px] text-neutral-400 block mb-2">वायरफ्रेम लाइन का रंग (Color):</span>
                <div className="flex items-center gap-2">
                  {[
                    { color: '#ff2d55', name: 'नियॉन पिंक (Pink)' },
                    { color: '#00f0ff', name: 'साइबर स्यान (Cyan)' },
                    { color: '#ffb800', name: 'एम्बर गोल्ड (Gold)' },
                    { color: '#00ff66', name: 'एमराल्ड (Lime)' },
                    { color: '#ffffff', name: 'प्योर व्हाइट (White)' },
                  ].map((c) => (
                    <button
                      key={c.color}
                      type="button"
                      onClick={() =>
                        setWireframeSettings((prev) => ({ ...prev, color: c.color, enabled: true }))
                      }
                      className={`w-7 h-7 rounded-full border-2 transition-transform ${
                        wireframeSettings.color === c.color ? 'scale-110 border-white shadow-lg' : 'border-transparent opacity-75 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: c.color }}
                      title={c.name}
                    />
                  ))}
                </div>
              </div>
            </div>

            {/* 3D Model Download Button (.OBJ Universal File) */}
            <div className="p-3.5 rounded-xl bg-gradient-to-r from-blue-950/60 to-neutral-950/90 border border-blue-500/30 space-y-2">
              <div className="flex items-center gap-2">
                <Download className="w-4 h-4 text-blue-400" />
                <span className="font-semibold text-neutral-100">1-क्लिक 3D मॉडल डाउनलोड (.OBJ)</span>
              </div>
              <p className="text-[11px] text-neutral-300 leading-relaxed">
                यह पूरा 3D मॉडल (चेहरा, बाल और कपड़े) मानक <strong>Wavefront .OBJ</strong> फॉर्मेट में आपके कंप्यूटर/फोन में सेव हो जाएगा, जिसे आप Blender, Maya, Unity या Unreal Engine में सीधे इस्तेमाल कर सकते हैं।
              </p>
              <button
                type="button"
                onClick={() => {
                  if (onExportOBJ) onExportOBJ();
                }}
                className="w-full mt-2 py-2.5 px-3 rounded-lg bg-blue-500 hover:bg-blue-400 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-blue-500/25 transition-all"
              >
                <Download className="w-4 h-4" />
                <span>3D मॉडल (.OBJ) डाउनलोड करें</span>
              </button>
            </div>
          </div>
        )}

        {/* TAB 1: EYES & PUPILS (आँखें और पुतलियाँ) */}
        {activeTab === 'eyes' && (
          <div className="space-y-3.5 text-xs">
            {/* 3D Moving Pupils Overlay Toggle (Especially for UV Photographic Mode) */}
            <div className="p-3 rounded-xl bg-neutral-950/60 border border-neutral-800 flex items-center justify-between">
              <div>
                <div className="font-semibold text-neutral-100 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>Interactive 3D Pupils (चलने वाली पुतलियाँ)</span>
                </div>
                <div className="text-[11px] text-neutral-400 mt-0.5">
                  {gazeSettings.show3DPupils !== false
                    ? '3D पुतलियाँ चालू हैं (दिशा व कर्सर अनुसार हिलेंगी)'
                    : 'फ़ोटो की स्थिर आँखें सक्रिय हैं'}
                </div>
              </div>
              <button
                type="button"
                onClick={() =>
                  setGazeSettings((prev) => ({
                    ...prev,
                    show3DPupils: prev.show3DPupils === false ? true : false,
                  }))
                }
                className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${
                  gazeSettings.show3DPupils !== false
                    ? 'bg-amber-400 text-neutral-950 shadow-sm'
                    : 'bg-neutral-800 text-neutral-400 hover:text-white'
                }`}
              >
                {gazeSettings.show3DPupils !== false ? '3D Active' : 'Off'}
              </button>
            </div>

            {/* Follow Cursor Toggle */}
            <div className="p-3 rounded-xl bg-neutral-950/60 border border-neutral-800 flex items-center justify-between">
              <div>
                <div className="font-semibold text-neutral-100 flex items-center gap-1.5">
                  <Eye className="w-4 h-4 text-amber-400" />
                  <span>Follow Cursor (माउस की ओर देखें)</span>
                </div>
                <div className="text-[11px] text-neutral-400 mt-0.5">
                  पुतलियाँ आपकी उंगली या माउस के साथ घूमेंगी
                </div>
              </div>
              <button
                type="button"
                onClick={() =>
                  setGazeSettings((prev) => ({
                    ...prev,
                    followCursor: !prev.followCursor,
                  }))
                }
                className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${
                  gazeSettings.followCursor
                    ? 'bg-amber-400 text-neutral-950 shadow-sm'
                    : 'bg-neutral-800 text-neutral-400 hover:text-white'
                }`}
              >
                {gazeSettings.followCursor ? 'Active' : 'Off'}
              </button>
            </div>

            {/* Manual Eye Joystick Sliders (When not following cursor) */}
            {!gazeSettings.followCursor && (
              <div className="p-3 rounded-xl bg-neutral-950/60 border border-neutral-800 space-y-2.5">
                <div className="font-semibold text-amber-300">
                  Manual Pupil Direction (पुतलियों की दिशा)
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] text-neutral-400">
                    <span>Horizontal (बाएँ ⇄ दाएँ)</span>
                    <span className="font-mono">
                      {gazeSettings.lookX < -0.2
                        ? 'बाएँ (Left)'
                        : gazeSettings.lookX > 0.2
                        ? 'दाएँ (Right)'
                        : 'Center'}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="-1"
                    max="1"
                    step="0.05"
                    value={gazeSettings.lookX}
                    onChange={(e) =>
                      setGazeSettings((prev) => ({
                        ...prev,
                        lookX: parseFloat(e.target.value),
                      }))
                    }
                    className="w-full accent-amber-400 h-1.5 bg-neutral-800 rounded-lg cursor-pointer"
                  />
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] text-neutral-400">
                    <span>Vertical (ऊपर ⇄ नीचे)</span>
                    <span className="font-mono">
                      {gazeSettings.lookY > 0.2
                        ? 'ऊपर (Up)'
                        : gazeSettings.lookY < -0.2
                        ? 'नीचे (Down)'
                        : 'Center'}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="-1"
                    max="1"
                    step="0.05"
                    value={gazeSettings.lookY}
                    onChange={(e) =>
                      setGazeSettings((prev) => ({
                        ...prev,
                        lookY: parseFloat(e.target.value),
                      }))
                    }
                    className="w-full accent-amber-400 h-1.5 bg-neutral-800 rounded-lg cursor-pointer"
                  />
                </div>

                <div className="flex gap-1.5 pt-1">
                  <button
                    type="button"
                    onClick={() =>
                      setGazeSettings((prev) => ({ ...prev, lookX: -0.8, lookY: 0 }))
                    }
                    className="flex-1 py-1 bg-neutral-900 border border-neutral-800 rounded text-[10px] text-neutral-300 hover:text-white"
                  >
                    बाएँ (Left)
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setGazeSettings((prev) => ({ ...prev, lookX: 0, lookY: 0 }))
                    }
                    className="flex-1 py-1 bg-neutral-900 border border-neutral-800 rounded text-[10px] text-neutral-300 hover:text-white"
                  >
                    सीधे (Center)
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setGazeSettings((prev) => ({ ...prev, lookX: 0.8, lookY: 0 }))
                    }
                    className="flex-1 py-1 bg-neutral-900 border border-neutral-800 rounded text-[10px] text-neutral-300 hover:text-white"
                  >
                    दाएँ (Right)
                  </button>
                </div>
              </div>
            )}

            {/* Eyelid Blink Control */}
            <div className="p-3 rounded-xl bg-neutral-950/60 border border-neutral-800 space-y-2">
              <div className="flex items-center justify-between">
                <div>
                  <div className="font-semibold text-neutral-100">Natural Auto-Blink (पलकें झपकना)</div>
                  <div className="text-[11px] text-neutral-400">हर 3-4 सेकंड में प्राकृतिक रूप से झपकेगी</div>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    setGazeSettings((prev) => ({ ...prev, autoBlink: !prev.autoBlink }))
                  }
                  className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${
                    gazeSettings.autoBlink
                      ? 'bg-amber-400 text-neutral-950'
                      : 'bg-neutral-800 text-neutral-400'
                  }`}
                >
                  {gazeSettings.autoBlink ? 'Active' : 'Off'}
                </button>
              </div>

              {!gazeSettings.autoBlink && (
                <div className="space-y-1 pt-1.5 border-t border-neutral-800/80">
                  <div className="flex justify-between text-[11px] text-neutral-400">
                    <span>Manual Blink (पलकें बंद/खुली)</span>
                    <span className="font-mono">
                      {Math.round(gazeSettings.blinkAmount * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="1"
                    step="0.05"
                    value={gazeSettings.blinkAmount}
                    onChange={(e) =>
                      setGazeSettings((prev) => ({
                        ...prev,
                        blinkAmount: parseFloat(e.target.value),
                      }))
                    }
                    className="w-full accent-amber-400 h-1.5 bg-neutral-800 rounded-lg cursor-pointer"
                  />
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: MODULAR HAIR & WIND (बाल और हवा का एनीमेशन) */}
        {activeTab === 'hair' && (
          <div className="space-y-3.5 text-xs">
            {/* Wind Physics Toggle */}
            <div className="p-3 rounded-xl bg-neutral-950/60 border border-neutral-800 flex items-center justify-between">
              <div>
                <div className="font-semibold text-neutral-100 flex items-center gap-1.5">
                  <Wind className="w-4 h-4 text-amber-400" />
                  <span>Wind Sway Physics (हवा में बाल हिलना)</span>
                </div>
                <div className="text-[11px] text-neutral-400 mt-0.5">
                  अलग-अलग लटें (Strands) हवा के साथ लहराएँगी
                </div>
              </div>
              <button
                type="button"
                onClick={() =>
                  setHairSettings((prev) => ({
                    ...prev,
                    windEnabled: !prev.windEnabled,
                  }))
                }
                className={`px-3 py-1 rounded text-xs font-semibold transition-colors ${
                  hairSettings.windEnabled
                    ? 'bg-amber-400 text-neutral-950 shadow-sm'
                    : 'bg-neutral-800 text-neutral-400'
                }`}
              >
                {hairSettings.windEnabled ? 'Active' : 'Off'}
              </button>
            </div>

            {/* Wind Strength & Speed Sliders */}
            {hairSettings.windEnabled && (
              <div className="p-3 rounded-xl bg-neutral-950/60 border border-neutral-800 space-y-3">
                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] text-neutral-400">
                    <span>Wind Strength (हवा का ज़ोर)</span>
                    <span className="font-mono text-amber-300">
                      {Math.round(hairSettings.windStrength * 100)}%
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.1"
                    max="1.5"
                    step="0.05"
                    value={hairSettings.windStrength}
                    onChange={(e) =>
                      setHairSettings((prev) => ({
                        ...prev,
                        windStrength: parseFloat(e.target.value),
                      }))
                    }
                    className="w-full accent-amber-400 h-1.5 bg-neutral-800 rounded-lg cursor-pointer"
                  />
                  <div className="flex justify-between text-[10px] text-neutral-500">
                    <span>हल्की हवा (Breeze)</span>
                    <span>तेज हवा (Strong)</span>
                  </div>
                </div>

                <div className="space-y-1">
                  <div className="flex justify-between text-[11px] text-neutral-400">
                    <span>Wind Speed (गति)</span>
                    <span className="font-mono text-amber-300">
                      {hairSettings.windSpeed.toFixed(1)}x
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0.5"
                    max="2.5"
                    step="0.1"
                    value={hairSettings.windSpeed}
                    onChange={(e) =>
                      setHairSettings((prev) => ({
                        ...prev,
                        windSpeed: parseFloat(e.target.value),
                      }))
                    }
                    className="w-full accent-amber-400 h-1.5 bg-neutral-800 rounded-lg cursor-pointer"
                  />
                </div>
              </div>
            )}

            {/* Separate Hair Layer Isolators */}
            <div className="p-3 rounded-xl bg-neutral-950/60 border border-neutral-800 space-y-2">
              <div className="font-semibold text-neutral-200 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-amber-400" />
                <span>Modular Hair Layers (बालों की अलग-अलग लेयर्स)</span>
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                {[
                  { key: 'frontBangs', label: 'आगे की लटें (Front Bangs)' },
                  { key: 'crownWaves', label: 'ऊपर के घुंघराले बाल (Crown)' },
                  { key: 'sideburns', label: 'कानों के पास (Sideburns)' },
                  { key: 'backNape', label: 'पीछे गर्दन के बाल (Back Nape)' },
                ].map((layer) => (
                  <button
                    key={layer.key}
                    type="button"
                    onClick={() =>
                      setHairSettings((prev) => ({
                        ...prev,
                        showLayers: {
                          ...prev.showLayers,
                          [layer.key]: !prev.showLayers[layer.key as keyof typeof prev.showLayers],
                        },
                      }))
                    }
                    className={`py-1.5 px-2 rounded-lg text-[11px] font-medium border text-left transition-colors ${
                      hairSettings.showLayers[layer.key as keyof typeof hairSettings.showLayers]
                        ? 'bg-amber-400/15 border-amber-400/50 text-amber-300'
                        : 'bg-neutral-900 border-neutral-800 text-neutral-500'
                    }`}
                  >
                    {layer.label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: 4-VIEWS CAMERA (Front, Left, Right, Back) */}
        {activeTab === 'camera' && (
          <div className="space-y-3.5 text-xs">
            <div className="p-3 rounded-xl bg-neutral-950/60 border border-neutral-800 space-y-2">
              <div className="font-semibold text-amber-300">
                4-Orthographic View Presets (चारों दिशाओं के कैमरे)
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    onCameraPreset('front');
                    onClose();
                  }}
                  className="p-2.5 bg-neutral-900 hover:bg-neutral-850 border border-amber-500/40 text-amber-300 rounded-xl text-left"
                >
                  <div className="font-bold text-xs">सामने (Front View)</div>
                  <div className="text-[10px] text-neutral-400 mt-0.5">0°正面 - चेहरा और मुस्कान</div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onCameraPreset('left_profile');
                    onClose();
                  }}
                  className="p-2.5 bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 hover:border-neutral-700 text-neutral-200 rounded-xl text-left"
                >
                  <div className="font-bold text-xs">बायाँ (Left Profile)</div>
                  <div className="text-[10px] text-neutral-400 mt-0.5">-90° - नाक और जबड़ा</div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onCameraPreset('right_profile');
                    onClose();
                  }}
                  className="p-2.5 bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 hover:border-neutral-700 text-neutral-200 rounded-xl text-left"
                >
                  <div className="font-bold text-xs">दायाँ (Right Profile)</div>
                  <div className="text-[10px] text-neutral-400 mt-0.5">+90° - कान और प्रोफ़ाइल</div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onCameraPreset('back');
                    onClose();
                  }}
                  className="p-2.5 bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 hover:border-neutral-700 text-neutral-200 rounded-xl text-left"
                >
                  <div className="font-bold text-xs">पीछे (Back View)</div>
                  <div className="text-[10px] text-neutral-400 mt-0.5">180° - घुंघराले बाल व गर्दन</div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onCameraPreset('closeup_face');
                    onClose();
                  }}
                  className="col-span-2 p-2 bg-neutral-900 hover:bg-neutral-850 border border-neutral-800 text-neutral-300 rounded-lg text-center"
                >
                  क्लोज़-अप मैक्रो (Closeup Face & Eyes)
                </button>
              </div>
            </div>

            {/* View Original Photos button */}
            <button
              type="button"
              onClick={onOpenPhotosModal}
              className="w-full py-2 px-3 rounded-xl bg-amber-400/20 hover:bg-amber-400/30 border border-amber-400/40 text-amber-300 font-semibold text-center flex items-center justify-center gap-2"
            >
              <Camera className="w-4 h-4" />
              <span>4 मूल फ़ोटो से तुलना करें (Compare Photos)</span>
            </button>
          </div>
        )}

        {/* TAB 4: LIGHTING & 360 TURNTABLE */}
        {activeTab === 'light' && (
          <div className="space-y-3.5 text-xs">
            {/* 360 Turntable */}
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
                    min="0.3"
                    max="3.0"
                    step="0.1"
                    value={autoRotateSpeed}
                    onChange={(e) => setAutoRotateSpeed(parseFloat(e.target.value))}
                    className="w-full accent-amber-400 h-1.5 bg-neutral-800 rounded-lg cursor-pointer"
                  />
                </div>
              )}
            </div>

            {/* Lighting Preset */}
            <div className="p-3 rounded-xl bg-neutral-950/60 border border-neutral-800 space-y-2">
              <div className="font-semibold text-neutral-200">Lighting Ambiance (उजाला)</div>
              <div className="grid grid-cols-3 gap-1.5">
                <button
                  type="button"
                  onClick={() => setLightingPreset('sunlight')}
                  className={`py-2 px-1 rounded-lg text-[11px] font-medium border text-center ${
                    lightingPreset === 'sunlight'
                      ? 'bg-amber-400 text-neutral-950 font-bold border-amber-300'
                      : 'bg-neutral-900 border-neutral-800 text-neutral-300'
                  }`}
                >
                  धूप (Sunlight)
                </button>
                <button
                  type="button"
                  onClick={() => setLightingPreset('anime_studio')}
                  className={`py-2 px-1 rounded-lg text-[11px] font-medium border text-center ${
                    lightingPreset === 'anime_studio'
                      ? 'bg-amber-400 text-neutral-950 font-bold border-amber-300'
                      : 'bg-neutral-900 border-neutral-800 text-neutral-300'
                  }`}
                >
                  स्टूडियो (Studio)
                </button>
                <button
                  type="button"
                  onClick={() => setLightingPreset('dramatic_rim')}
                  className={`py-2 px-1 rounded-lg text-[11px] font-medium border text-center ${
                    lightingPreset === 'dramatic_rim'
                      ? 'bg-amber-400 text-neutral-950 font-bold border-amber-300'
                      : 'bg-neutral-900 border-neutral-800 text-neutral-300'
                  }`}
                >
                  रिम लाइट (Rim)
                </button>
              </div>
            </div>

            {/* Polygon Wireframe */}
            <div className="p-3 rounded-xl bg-neutral-950/60 border border-neutral-800 flex items-center justify-between">
              <div>
                <div className="font-medium text-neutral-200">3D Wireframe Mesh</div>
                <div className="text-[11px] text-neutral-400">ज्योमेट्री पॉलीगॉन देखें</div>
              </div>
              <button
                type="button"
                onClick={() => setIsWireframe(!isWireframe)}
                className={`px-3 py-1 rounded text-xs font-semibold ${
                  isWireframe ? 'bg-amber-400 text-neutral-950' : 'bg-neutral-800 text-neutral-400'
                }`}
              >
                {isWireframe ? 'ON' : 'OFF'}
              </button>
            </div>
          </div>
        )}

        <div className="mt-4 pt-3 border-t border-neutral-800 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="w-full py-2 text-xs font-semibold text-neutral-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors text-center"
          >
            Done & Return to 3D View
          </button>
        </div>
      </div>
    </div>
  );
};
