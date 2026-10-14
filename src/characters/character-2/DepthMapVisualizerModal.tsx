import React, { useState, useEffect, useRef } from 'react';
import {
  X,
  Layers,
  Sparkles,
  Download,
  Eye,
  Sliders,
  Maximize2,
  RefreshCw,
  Sun,
  Scan,
  Compass,
  ArrowRight,
  Upload,
} from 'lucide-react';
import { MultiViewPhotos, DisplayShadingMode } from './types';
import faceTextureImg from '../../assets/images/char2_face_texture_1791869743638.jpg';
import hairTextureImg from '../../assets/images/char2_hair_texture_1791869771241.jpg';

interface DepthMapVisualizerModalProps {
  isOpen: boolean;
  onClose: () => void;
  customPhotos?: MultiViewPhotos;
  currentShadingMode?: DisplayShadingMode;
  onSetShadingMode?: (mode: DisplayShadingMode) => void;
}

type VisualizationMode = 'split_slider' | 'side_by_side' | 'grayscale_only' | 'depth_heatmap' | 'contour_topography';

export const DepthMapVisualizerModal: React.FC<DepthMapVisualizerModalProps> = ({
  isOpen,
  onClose,
  customPhotos,
  currentShadingMode = 'photographic',
  onSetShadingMode,
}) => {
  const [selectedSlot, setSelectedSlot] = useState<'front' | 'left' | 'right' | 'back'>('front');
  const [visMode, setVisMode] = useState<VisualizationMode>('split_slider');
  const [splitPos, setSplitPos] = useState<number>(50); // percentage 0-100
  const [contrast, setContrast] = useState<number>(1.3); // 0.5 to 2.5
  const [convexityBias, setConvexityBias] = useState<number>(0.55); // 0 to 1
  const [smoothing, setSmoothing] = useState<number>(1); // 0 to 3
  const [invertDepth, setInvertDepth] = useState<boolean>(false);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [depthDataUrl, setDepthDataUrl] = useState<string>('');
  const [heatmapDataUrl, setHeatmapDataUrl] = useState<string>('');
  const [contourDataUrl, setContourDataUrl] = useState<string>('');

  const fileInputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);

  const [photos, setPhotos] = useState<MultiViewPhotos>({
    front: customPhotos?.front || faceTextureImg,
    left: customPhotos?.left || faceTextureImg,
    right: customPhotos?.right || faceTextureImg,
    back: customPhotos?.back || hairTextureImg,
  });

  useEffect(() => {
    if (customPhotos) {
      setPhotos({
        front: customPhotos.front || faceTextureImg,
        left: customPhotos.left || faceTextureImg,
        right: customPhotos.right || faceTextureImg,
        back: customPhotos.back || hairTextureImg,
      });
    }
  }, [customPhotos]);

  const activePhotoSrc = photos[selectedSlot];

  // Process 2D Photo into Grayscale Depth Map
  useEffect(() => {
    if (!isOpen || !activePhotoSrc) return;

    setIsProcessing(true);
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.src = activePhotoSrc;

    img.onload = () => {
      try {
        const width = 360;
        const height = 360;

        // Canvas for processing
        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;

        // Draw image scaled
        ctx.drawImage(img, 0, 0, width, height);
        const imgData = ctx.getImageData(0, 0, width, height);
        const pixels = imgData.data;

        // Secondary buffers
        const depthBuffer = new Float32Array(width * height);
        const centerX = width * 0.5;
        const centerY = height * 0.48; // Facial center roughly at 48% height
        const maxDist = Math.hypot(centerX, centerY);

        // Stage 1: Luminance extraction + Facial Convexity Prior
        for (let y = 0; y < height; y++) {
          for (let x = 0; x < width; x++) {
            const idx = (y * width + x) * 4;
            const r = pixels[idx];
            const g = pixels[idx + 1];
            const b = pixels[idx + 2];

            // Perceived luminance (Photometric formula)
            const lum = (0.299 * r + 0.587 * g + 0.114 * b) / 255.0;

            // Organic facial convexity prior (Nose & center plane protrude towards camera)
            const dx = (x - centerX) / centerX;
            const dy = (y - centerY) / centerY;
            const distNorm = Math.sqrt(dx * dx * 1.2 + dy * dy * 0.9);
            const convexity = Math.max(0, 1.0 - Math.pow(Math.min(distNorm, 1.0), 1.6));

            // Combined surface elevation
            let depthVal = lum * 0.65 + convexity * convexityBias * 0.75;

            // Contrast enhancement
            depthVal = Math.pow(depthVal, contrast);
            depthVal = Math.max(0, Math.min(1.0, depthVal));

            depthBuffer[y * width + x] = depthVal;
          }
        }

        // Stage 2: Spatial smoothing filter if enabled
        const smoothed = new Float32Array(width * height);
        if (smoothing > 0) {
          const radius = smoothing;
          for (let y = 0; y < height; y++) {
            for (let x = 0; x < width; x++) {
              let sum = 0;
              let count = 0;
              for (let dy = -radius; dy <= radius; dy++) {
                for (let dx = -radius; dx <= radius; dx++) {
                  const ny = y + dy;
                  const nx = x + dx;
                  if (nx >= 0 && nx < width && ny >= 0 && ny < height) {
                    sum += depthBuffer[ny * width + nx];
                    count++;
                  }
                }
              }
              smoothed[y * width + x] = sum / count;
            }
          }
        } else {
          smoothed.set(depthBuffer);
        }

        // Stage 3: Render Pure Grayscale Depth Map
        const grayscaleData = ctx.createImageData(width, height);
        for (let i = 0; i < width * height; i++) {
          let val = smoothed[i];
          if (invertDepth) val = 1.0 - val;
          const byteVal = Math.round(val * 255);
          const pIdx = i * 4;
          grayscaleData.data[pIdx] = byteVal;
          grayscaleData.data[pIdx + 1] = byteVal;
          grayscaleData.data[pIdx + 2] = byteVal;
          grayscaleData.data[pIdx + 3] = 255;
        }
        ctx.putImageData(grayscaleData, 0, 0);
        setDepthDataUrl(canvas.toDataURL('image/png'));

        // Stage 4: Render False-Color Heatmap (Turbo/Spectral)
        const heatmapData = ctx.createImageData(width, height);
        for (let i = 0; i < width * height; i++) {
          let val = smoothed[i];
          if (invertDepth) val = 1.0 - val;
          // False color gradient: Deep Blue -> Cyan -> Green -> Yellow -> Orange -> Crimson White
          let r = 0, g = 0, b = 0;
          if (val < 0.25) {
            const t = val / 0.25;
            r = Math.round(15 + 20 * t);
            g = Math.round(20 + 120 * t);
            b = Math.round(90 + 165 * t);
          } else if (val < 0.5) {
            const t = (val - 0.25) / 0.25;
            r = Math.round(35 + 30 * t);
            g = Math.round(140 + 115 * t);
            b = Math.round(255 * (1 - t * 0.7));
          } else if (val < 0.75) {
            const t = (val - 0.5) / 0.25;
            r = Math.round(65 + 190 * t);
            g = Math.round(255 - 40 * t);
            b = Math.round(75 * (1 - t));
          } else {
            const t = (val - 0.75) / 0.25;
            r = 255;
            g = Math.round(215 * (1 - t * 0.5));
            b = Math.round(220 * t);
          }

          const pIdx = i * 4;
          heatmapData.data[pIdx] = r;
          heatmapData.data[pIdx + 1] = g;
          heatmapData.data[pIdx + 2] = b;
          heatmapData.data[pIdx + 3] = 255;
        }
        ctx.putImageData(heatmapData, 0, 0);
        setHeatmapDataUrl(canvas.toDataURL('image/png'));

        // Stage 5: Render Contour Topography
        const contourData = ctx.createImageData(width, height);
        for (let i = 0; i < width * height; i++) {
          let val = smoothed[i];
          if (invertDepth) val = 1.0 - val;
          // Rings every 0.1 elevation interval
          const ring = Math.abs((val * 10) % 1.0);
          const isLine = ring < 0.12 || ring > 0.88;
          const byteVal = Math.round(val * 180);
          const pIdx = i * 4;
          if (isLine) {
            contourData.data[pIdx] = 255;
            contourData.data[pIdx + 1] = 215;
            contourData.data[pIdx + 2] = 0; // gold contour lines
          } else {
            contourData.data[pIdx] = byteVal;
            contourData.data[pIdx + 1] = byteVal;
            contourData.data[pIdx + 2] = byteVal;
          }
          contourData.data[pIdx + 3] = 255;
        }
        ctx.putImageData(contourData, 0, 0);
        setContourDataUrl(canvas.toDataURL('image/png'));

        setIsProcessing(false);
      } catch (err) {
        console.error('Depth extraction error:', err);
        setIsProcessing(false);
      }
    };
  }, [activePhotoSrc, contrast, convexityBias, smoothing, invertDepth, isOpen]);

  // Handle Dragging Slider for Split Screen
  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!isDragging || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = Math.max(0, Math.min(rect.width, e.clientX - rect.left));
    setSplitPos((x / rect.width) * 100);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (!isDragging || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const touch = e.touches[0];
    const x = Math.max(0, Math.min(rect.width, touch.clientX - rect.left));
    setSplitPos((x / rect.width) * 100);
  };

  const handleCustomUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      if (dataUrl) {
        setPhotos((prev) => ({ ...prev, [selectedSlot]: dataUrl }));
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDownloadDepthPNG = () => {
    if (!depthDataUrl) return;
    const a = document.createElement('a');
    a.href = depthDataUrl;
    a.download = `surface_depth_map_${selectedSlot}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  if (!isOpen) return null;

  const viewSlots = [
    { id: 'front' as const, name: 'सामने (Front)', angle: '0°' },
    { id: 'left' as const, name: 'बायाँ (Left)', angle: '-90°' },
    { id: 'right' as const, name: 'दायाँ (Right)', angle: '+90°' },
    { id: 'back' as const, name: 'पीछे (Back)', angle: '180°' },
  ];

  const currentDisplayDepthImg =
    visMode === 'depth_heatmap'
      ? heatmapDataUrl
      : visMode === 'contour_topography'
      ? contourDataUrl
      : depthDataUrl;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-neutral-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl p-5 sm:p-6 text-neutral-200 max-h-[94vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-neutral-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-300 border border-blue-500/30 uppercase tracking-wider">
                2D to 3D Surface Interpretation
              </span>
              <span className="text-xs font-mono text-neutral-400">Z-Depth Visualizer</span>
            </div>
            <h3 className="text-lg font-bold text-neutral-100 mt-1">
              फोटो से 3D ग्रे-स्केल डेप्थ मैप विज़ुअलाइज़र (Depth Map Engine)
            </h3>
            <p className="text-xs text-neutral-400 mt-0.5">
              देखें कि सिस्टम आपकी 2D फ़ोटो से सतह का 3D उभार (सफेद = नाक/गाल का उभार) और गहराई (काला = आँखें/गड्ढे) कैसे निकालता है:
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* View Selection & Shading Action Bar */}
        <div className="my-3 p-3 rounded-xl bg-neutral-950/80 border border-neutral-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Slot Tabs */}
          <div className="flex items-center gap-1.5">
            <span className="text-[11px] font-medium text-neutral-400 mr-1">फोटो स्लॉट:</span>
            {viewSlots.map((slot) => (
              <button
                key={slot.id}
                type="button"
                onClick={() => setSelectedSlot(slot.id)}
                className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  selectedSlot === slot.id
                    ? 'bg-amber-400 text-neutral-950 shadow-sm'
                    : 'bg-neutral-800 text-neutral-300 hover:text-white'
                }`}
              >
                <span>{slot.name}</span>
              </button>
            ))}
          </div>

          {/* Quick 3D Shading Mode Apply */}
          {onSetShadingMode && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => onSetShadingMode('depth_map')}
                className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                  currentShadingMode === 'depth_map'
                    ? 'bg-blue-500 text-white shadow-md shadow-blue-500/20'
                    : 'bg-neutral-800 text-blue-300 hover:bg-blue-500/20 border border-blue-500/30'
                }`}
                title="मुख्य 3D मॉडल पर ग्रे-स्केल डेप्थ शेडर लागू करें"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>
                  {currentShadingMode === 'depth_map'
                    ? '✓ 3D मॉडल पर डेप्थ शेडिंग एक्टिव'
                    : '3D मॉडल पर डेप्थ शेडिंग लागू करें'}
                </span>
              </button>
            </div>
          )}
        </div>

        {/* Mode Selector */}
        <div className="flex flex-wrap items-center gap-1.5 mb-3 p-1.5 bg-neutral-950/60 rounded-xl text-xs">
          <span className="text-[11px] text-neutral-400 px-2 font-medium">विज़ुअलाइज़ेशन:</span>
          <button
            type="button"
            onClick={() => setVisMode('split_slider')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              visMode === 'split_slider'
                ? 'bg-amber-400 text-neutral-950 font-bold'
                : 'text-neutral-300 hover:text-white'
            }`}
          >
            ↔️ स्प्लिट कंपेयर स्लाइडर
          </button>
          <button
            type="button"
            onClick={() => setVisMode('side_by_side')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              visMode === 'side_by_side'
                ? 'bg-amber-400 text-neutral-950 font-bold'
                : 'text-neutral-300 hover:text-white'
            }`}
          >
            ⏹️ साइड-बाय-साइड
          </button>
          <button
            type="button"
            onClick={() => setVisMode('grayscale_only')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              visMode === 'grayscale_only'
                ? 'bg-amber-400 text-neutral-950 font-bold'
                : 'text-neutral-300 hover:text-white'
            }`}
          >
            🔲 शुद्ध ग्रे-स्केल Z-डेप्थ
          </button>
          <button
            type="button"
            onClick={() => setVisMode('depth_heatmap')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              visMode === 'depth_heatmap'
                ? 'bg-amber-400 text-neutral-950 font-bold'
                : 'text-neutral-300 hover:text-white'
            }`}
          >
            🌈 थर्मल हीटमैप (False Color)
          </button>
          <button
            type="button"
            onClick={() => setVisMode('contour_topography')}
            className={`px-3 py-1.5 rounded-lg font-medium transition-all ${
              visMode === 'contour_topography'
                ? 'bg-amber-400 text-neutral-950 font-bold'
                : 'text-neutral-300 hover:text-white'
            }`}
          >
            📈 टोपोग्राफिकल रिंग्स
          </button>
        </div>

        {/* Main Display Area */}
        <div className="relative w-full rounded-xl bg-neutral-950 border border-neutral-800 p-3 sm:p-4 mb-4">
          {visMode === 'split_slider' ? (
            /* Split Screen Comparison with Draggable Slider */
            <div
              ref={containerRef}
              className="relative w-full h-72 sm:h-96 rounded-xl overflow-hidden select-none cursor-ew-resize border border-neutral-800"
              onMouseDown={() => setIsDragging(true)}
              onMouseUp={() => setIsDragging(false)}
              onMouseLeave={() => setIsDragging(false)}
              onMouseMove={handleMouseMove}
              onTouchStart={() => setIsDragging(true)}
              onTouchEnd={() => setIsDragging(false)}
              onTouchMove={handleTouchMove}
            >
              {/* Background Layer: Grayscale Depth Map */}
              <div className="absolute inset-0 w-full h-full bg-black flex items-center justify-center">
                {currentDisplayDepthImg ? (
                  <img
                    src={currentDisplayDepthImg}
                    alt="Depth Map Interpretation"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="text-xs text-neutral-500">डेप्थ मैप प्रोसेस हो रहा है...</div>
                )}
                <span className="absolute bottom-3 right-3 text-[10px] font-mono bg-neutral-950/80 px-2 py-1 rounded text-blue-300 border border-blue-500/30">
                  🔲 Computed 3D Z-Depth
                </span>
              </div>

              {/* Foreground Layer: Original 2D Photo (Clipped by split position) */}
              <div
                className="absolute inset-y-0 left-0 overflow-hidden bg-neutral-950 border-r-2 border-amber-400 shadow-2xl"
                style={{ width: `${splitPos}%` }}
              >
                <div
                  className="absolute inset-0 flex items-center justify-center"
                  style={{ width: containerRef.current?.clientWidth || '100%', height: '100%' }}
                >
                  <img
                    src={activePhotoSrc}
                    alt="Original 2D Reference Photo"
                    className="w-full h-full object-contain"
                  />
                </div>
                <span className="absolute bottom-3 left-3 text-[10px] font-mono bg-neutral-950/80 px-2 py-1 rounded text-amber-300 border border-amber-400/30">
                  📸 Original 2D Photo
                </span>
              </div>

              {/* Slider Divider Handle */}
              <div
                className="absolute top-0 bottom-0 -ml-3 flex flex-col items-center justify-center pointer-events-none z-20"
                style={{ left: `${splitPos}%` }}
              >
                <div className="w-6 h-6 rounded-full bg-amber-400 text-neutral-950 font-bold text-[10px] flex items-center justify-center shadow-lg border-2 border-white">
                  ↔
                </div>
              </div>

              {/* Hint badge */}
              <div className="absolute top-3 left-1/2 -translate-x-1/2 pointer-events-none px-2.5 py-1 rounded-full bg-neutral-950/80 backdrop-blur-xs text-[10px] text-neutral-300 border border-white/10">
                स्लाइडर को बाएँ-दाएँ खींचकर 2D फोटो और 3D डेप्थ की तुलना करें
              </div>
            </div>
          ) : visMode === 'side_by_side' ? (
            /* Side-by-Side Comparison */
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 h-72 sm:h-96">
              <div className="relative rounded-xl overflow-hidden bg-neutral-900 border border-neutral-800 flex items-center justify-center">
                <img
                  src={activePhotoSrc}
                  alt="Original 2D Photo"
                  className="w-full h-full object-contain"
                />
                <span className="absolute bottom-2 left-2 text-[10px] font-mono bg-neutral-950/80 px-2 py-0.5 rounded text-amber-300 border border-amber-400/30">
                  📸 Original 2D Photo
                </span>
              </div>

              <div className="relative rounded-xl overflow-hidden bg-black border border-neutral-800 flex items-center justify-center">
                {currentDisplayDepthImg ? (
                  <img
                    src={currentDisplayDepthImg}
                    alt="3D Surface Depth"
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="text-xs text-neutral-500">डेप्थ मैप प्रोसेस हो रहा है...</div>
                )}
                <span className="absolute bottom-2 left-2 text-[10px] font-mono bg-neutral-950/80 px-2 py-0.5 rounded text-blue-300 border border-blue-500/30">
                  🔲 Interpreted 3D Surface Depth
                </span>
              </div>
            </div>
          ) : (
            /* Full Single Mode (Grayscale, Heatmap, or Contour) */
            <div className="relative w-full h-72 sm:h-96 rounded-xl overflow-hidden bg-black border border-neutral-800 flex items-center justify-center">
              {currentDisplayDepthImg ? (
                <img
                  src={currentDisplayDepthImg}
                  alt="3D Surface Depth Map"
                  className="w-full h-full object-contain"
                />
              ) : (
                <div className="text-xs text-neutral-500">डेप्थ मैप प्रोसेस हो रहा है...</div>
              )}
              <span className="absolute bottom-3 left-3 text-[10px] font-mono bg-neutral-950/80 px-2.5 py-1 rounded text-neutral-200 border border-white/10">
                {visMode === 'depth_heatmap'
                  ? '🌈 Surface Heatmap (Red/Yellow = Protruding Height, Blue = Deep Cavities)'
                  : visMode === 'contour_topography'
                  ? '📈 Topographical Elevation Rings (Gold = Elevation Steps)'
                  : '🔲 Pure Grayscale Depth Buffer (White = Near 3D Surface, Dark = Recessed)'}
              </span>
            </div>
          )}
        </div>

        {/* Depth Interpretation Guide Legend */}
        <div className="mb-4 p-3.5 rounded-xl bg-neutral-950/60 border border-neutral-800 text-xs">
          <div className="font-semibold text-neutral-200 mb-1.5 flex items-center gap-1.5">
            <Scan className="w-4 h-4 text-amber-400" />
            <span>सिस्टम इस 2D फोटो को 3D में कैसे समझता है? (Depth Reading Guide)</span>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[11px] text-neutral-400">
            <div className="p-2 rounded-lg bg-neutral-900 border border-neutral-800">
              <span className="font-bold text-white block mb-0.5">⚪ सफेद / चमकदार (Bright White):</span>
              नाक की नोक (Nose Tip), चीकबोन का उभार, माथे का केंद्र। यह सतह कैमरे के सबसे करीब और उभरी हुई मानी जाती है।
            </div>
            <div className="p-2 rounded-lg bg-neutral-900 border border-neutral-800">
              <span className="font-bold text-neutral-300 block mb-0.5">🔘 मध्यम ग्रे (Mid Gray):</span>
              गाल, होंठ, जबड़े की ढलान और गर्दन का ऊपरी भाग। यह चेहरे की सामान्य ढलान को दर्शाता है।
            </div>
            <div className="p-2 rounded-lg bg-neutral-900 border border-neutral-800">
              <span className="font-bold text-neutral-500 block mb-0.5">⚫ काला / गहरा ग्रे (Dark Black):</span>
              आँखों के गड्ढे (Eye Sockets), नाक के दोनों किनारे, कान के पीछे और बैकग्राउंड। यह सबसे पीछे जाने वाली गहराई है।
            </div>
          </div>
        </div>

        {/* Real-time Adjustment Sliders */}
        <div className="p-3.5 rounded-xl bg-neutral-950 border border-neutral-800 mb-4">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-bold text-neutral-200 flex items-center gap-1.5">
              <Sliders className="w-4 h-4 text-amber-400" />
              <span>डेप्थ एक्सट्रैक्शन ट्यूनिंग (Depth Parameters)</span>
            </span>
            <button
              type="button"
              onClick={() => {
                setContrast(1.3);
                setConvexityBias(0.55);
                setSmoothing(1);
                setInvertDepth(false);
              }}
              className="text-[10px] text-neutral-400 hover:text-white flex items-center gap-1"
            >
              <RefreshCw className="w-3 h-3" />
              <span>रीसेट</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs">
            {/* Contrast / Height Dynamic Range */}
            <div>
              <div className="flex justify-between text-[11px] mb-1">
                <span className="text-neutral-300">उभार का कंट्रास्ट (Contrast):</span>
                <span className="font-mono text-amber-300">{contrast.toFixed(2)}x</span>
              </div>
              <input
                type="range"
                min="0.6"
                max="2.4"
                step="0.05"
                value={contrast}
                onChange={(e) => setContrast(parseFloat(e.target.value))}
                className="w-full accent-amber-400 cursor-pointer"
              />
              <span className="text-[10px] text-neutral-500 block mt-0.5">उभरी और गहरी सतह में अंतर</span>
            </div>

            {/* Convexity / Facial Field Prior */}
            <div>
              <div className="flex justify-between text-[11px] mb-1">
                <span className="text-neutral-300">चेहरे का उभार बल (Convexity Bias):</span>
                <span className="font-mono text-amber-300">{(convexityBias * 100).toFixed(0)}%</span>
              </div>
              <input
                type="range"
                min="0.1"
                max="1.0"
                step="0.05"
                value={convexityBias}
                onChange={(e) => setConvexityBias(parseFloat(e.target.value))}
                className="w-full accent-amber-400 cursor-pointer"
              />
              <span className="text-[10px] text-neutral-500 block mt-0.5">नाक और चेहरे के केंद्र का उभार</span>
            </div>

            {/* Smoothing Filter */}
            <div>
              <div className="flex justify-between text-[11px] mb-1">
                <span className="text-neutral-300">स्मूथिंग फ़िल्टर (Noise Filter):</span>
                <span className="font-mono text-amber-300">{smoothing}px</span>
              </div>
              <input
                type="range"
                min="0"
                max="3"
                step="1"
                value={smoothing}
                onChange={(e) => setSmoothing(parseInt(e.target.value))}
                className="w-full accent-amber-400 cursor-pointer"
              />
              <span className="text-[10px] text-neutral-500 block mt-0.5">त्वचा की सतह को चिकना करता है</span>
            </div>
          </div>

          <div className="mt-3 pt-3 border-t border-neutral-900 flex items-center justify-between">
            <label className="flex items-center gap-2 cursor-pointer text-xs text-neutral-300">
              <input
                type="checkbox"
                checked={invertDepth}
                onChange={(e) => setInvertDepth(e.target.checked)}
                className="rounded accent-amber-400"
              />
              <span>डेप्थ मैप इनवर्ट करें (Invert Z-Buffer: काला = पास, सफेद = दूर)</span>
            </label>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-neutral-800">
          <div className="flex items-center gap-2">
            {/* Custom Photo Upload */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleCustomUpload}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold flex items-center gap-1.5 transition-all"
            >
              <Upload className="w-4 h-4 text-amber-400" />
              <span>नई फ़ोटो अपलोड करके टेस्ट करें</span>
            </button>

            {/* Download Grayscale Depth PNG */}
            <button
              type="button"
              onClick={handleDownloadDepthPNG}
              disabled={!depthDataUrl}
              className="px-3 py-2 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-200 text-xs font-semibold flex items-center gap-1.5 transition-all disabled:opacity-50"
            >
              <Download className="w-4 h-4 text-blue-400" />
              <span>डेप्थ मैप डाउनलोड करें (.PNG)</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-xl bg-amber-400 hover:bg-amber-300 text-neutral-950 font-bold text-xs transition-all shadow-md shadow-amber-400/20"
          >
            पूर्ण (Done)
          </button>
        </div>
      </div>
    </div>
  );
};
