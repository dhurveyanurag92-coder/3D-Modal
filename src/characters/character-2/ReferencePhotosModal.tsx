import React, { useState, useRef } from 'react';
import { X, Check, Camera, Compass, Sparkles, Upload, Eye, Sliders, Scan, RefreshCw, Layers } from 'lucide-react';
import { Character2CameraPreset, MultiViewPhotos } from './types';
import faceTextureImg from '../../assets/images/char2_face_texture_1791869743638.jpg';
import hairTextureImg from '../../assets/images/char2_hair_texture_1791869771241.jpg';

interface ReferencePhotosModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSnapToAngle: (preset: Character2CameraPreset) => void;
  customPhotos?: MultiViewPhotos;
  onUpdatePhoto?: (slot: 'front' | 'left' | 'right' | 'back', url: string) => void;
  onOpenDepthVisualizer?: () => void;
}

export const ReferencePhotosModal: React.FC<ReferencePhotosModalProps> = ({
  isOpen,
  onClose,
  onSnapToAngle,
  customPhotos,
  onUpdatePhoto,
  onOpenDepthVisualizer,
}) => {
  const [showLaserGuides, setShowLaserGuides] = useState(true);
  const [localPhotos, setLocalPhotos] = useState<MultiViewPhotos>({
    front: customPhotos?.front || faceTextureImg,
    left: customPhotos?.left || faceTextureImg,
    right: customPhotos?.right || faceTextureImg,
    back: customPhotos?.back || hairTextureImg,
  });

  const fileInputRefs = {
    front: useRef<HTMLInputElement>(null),
    left: useRef<HTMLInputElement>(null),
    right: useRef<HTMLInputElement>(null),
    back: useRef<HTMLInputElement>(null),
  };

  if (!isOpen) return null;

  const handleFileUpload = (slot: 'front' | 'left' | 'right' | 'back', e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setLocalPhotos((prev) => ({ ...prev, [slot]: dataUrl }));
        if (onUpdatePhoto) onUpdatePhoto(slot, dataUrl);
      }
    };
    reader.readAsDataURL(file);
  };

  const views = [
    {
      id: 'front' as Character2CameraPreset,
      slot: 'front' as const,
      name: '1. सामने का दृश्य (Front View)',
      angle: '0°',
      imgSrc: localPhotos.front,
      desc: 'आँखें, मुस्कुराहट, चेहरे की समरूपता और फ्रंट कॉलर',
    },
    {
      id: 'left_profile' as Character2CameraPreset,
      slot: 'left' as const,
      name: '2. बायाँ प्रोफ़ाइल (Left Profile)',
      angle: '-90°',
      imgSrc: localPhotos.left,
      desc: 'नाक की लंबाई, जबड़े की लाइन, कान और साइड के बाल',
    },
    {
      id: 'right_profile' as Character2CameraPreset,
      slot: 'right' as const,
      name: '3. दायाँ प्रोफ़ाइल (Right Profile)',
      angle: '+90°',
      imgSrc: localPhotos.right,
      desc: 'दायाँ प्रोफाइल, जबड़े का कोण और गर्दन का आकार',
    },
    {
      id: 'back' as Character2CameraPreset,
      slot: 'back' as const,
      name: '4. पीछे का दृश्य (Back View)',
      angle: '180°',
      imgSrc: localPhotos.back,
      desc: 'सिर का पिछला भाग, घुंघराले बाल और शर्ट की बैक',
    },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-neutral-950/85 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl p-5 sm:p-6 text-neutral-200 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between pb-4 border-b border-neutral-800">
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-300 border border-amber-400/30 uppercase tracking-wider">
                Multi-View 3D Pipeline (Points 1, 2, 22)
              </span>
              <span className="text-xs font-mono text-neutral-400">Orthographic Studio</span>
            </div>
            <h3 className="text-lg font-bold text-neutral-100 mt-1">
              4-View Image Upload & Laser Alignment Studio
            </h3>
            <p className="text-xs text-neutral-400 mt-0.5">
              चारों कोणों की तस्वीरों को संरेखित करें, नई तस्वीरें अपलोड करें या 3D कैमरे को तुरंत स्नैप करें:
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

        {/* Alignment Laser Guide Controls */}
        <div className="my-3.5 p-3 rounded-xl bg-neutral-950/70 border border-neutral-800 flex flex-wrap items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2">
            <Scan className="w-4 h-4 text-amber-400" />
            <span className="font-semibold text-neutral-200">
              Alignment Laser Guides (अलाइनमेंट लेज़र ग्रिड)
            </span>
          </div>

          <div className="flex items-center gap-2">
            {onOpenDepthVisualizer && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenDepthVisualizer();
                }}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-500 text-white transition-all flex items-center gap-1.5 shadow-sm"
              >
                <Layers className="w-3.5 h-3.5" />
                <span>फोटो डेप्थ मैप देखें (Z-Depth)</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => setShowLaserGuides(!showLaserGuides)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center gap-1.5 ${
                showLaserGuides
                  ? 'bg-amber-400 text-neutral-950 shadow-sm'
                  : 'bg-neutral-800 text-neutral-400 hover:text-white'
              }`}
            >
              <span>लेज़र ग्रिड: {showLaserGuides ? 'ON' : 'OFF'}</span>
            </button>
          </div>
        </div>

        {/* 4 Cards Grid with Image Previews & Laser Guidelines */}
        <div className="relative grid grid-cols-2 sm:grid-cols-4 gap-3 my-4">
          {/* Global Laser Overlay Lines spanning across all 4 cards if enabled */}
          {showLaserGuides && (
            <div className="absolute inset-0 pointer-events-none z-20 flex flex-col justify-between py-6">
              {/* Crown Line */}
              <div className="w-full border-t border-rose-500/70 relative">
                <span className="absolute -top-3.5 left-2 text-[9px] font-mono text-rose-400 bg-neutral-950/90 px-1 rounded">
                  ── Head Top (सिर का शीर्ष)
                </span>
              </div>
              {/* Eye Line */}
              <div className="w-full border-t border-sky-400/70 relative">
                <span className="absolute -top-3.5 left-2 text-[9px] font-mono text-sky-300 bg-neutral-950/90 px-1 rounded">
                  ── Eye Level (आँखें)
                </span>
              </div>
              {/* Nose Base */}
              <div className="w-full border-t border-emerald-400/70 relative">
                <span className="absolute -top-3.5 left-2 text-[9px] font-mono text-emerald-300 bg-neutral-950/90 px-1 rounded">
                  ── Nose Base (नाक आधार)
                </span>
              </div>
              {/* Chin Line */}
              <div className="w-full border-t border-amber-400/70 relative">
                <span className="absolute -top-3.5 left-2 text-[9px] font-mono text-amber-300 bg-neutral-950/90 px-1 rounded">
                  ── Chin Level (ठोड़ी)
                </span>
              </div>
            </div>
          )}

          {views.map((v) => (
            <div
              key={v.id}
              className="p-3 rounded-xl bg-neutral-950/90 border border-neutral-800 flex flex-col justify-between hover:border-amber-500/50 transition-all relative overflow-hidden group"
            >
              {/* Image Preview Thumbnail */}
              <div className="relative w-full h-32 sm:h-36 rounded-lg overflow-hidden bg-neutral-900 border border-neutral-800 mb-2.5">
                <img
                  src={v.imgSrc}
                  alt={v.name}
                  className="w-full h-full object-cover object-top"
                />
                <span className="absolute top-1.5 right-1.5 text-[9px] font-mono font-bold bg-neutral-950/80 text-amber-300 px-1.5 py-0.5 rounded border border-white/10">
                  {v.angle}
                </span>

                {/* Upload Overlay on Hover */}
                <button
                  type="button"
                  onClick={() => fileInputRefs[v.slot].current?.click()}
                  className="absolute inset-0 bg-neutral-950/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-1 text-[11px] font-semibold text-amber-300 backdrop-blur-xs"
                >
                  <Upload className="w-4 h-4" />
                  <span>नई फ़ोटो अपलोड करें</span>
                </button>
              </div>

              {/* Hidden File Input */}
              <input
                ref={fileInputRefs[v.slot]}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFileUpload(v.slot, e)}
              />

              <div className="flex-1">
                <div className="text-xs font-semibold text-amber-300 mb-0.5 truncate">{v.name}</div>
                <p className="text-[10px] text-neutral-400 line-clamp-2 leading-relaxed">{v.desc}</p>
              </div>

              <div className="mt-2.5 space-y-1.5">
                {/* Upload Button */}
                <button
                  type="button"
                  onClick={() => fileInputRefs[v.slot].current?.click()}
                  className="w-full py-1 px-2 rounded-lg bg-neutral-800/80 hover:bg-neutral-800 text-neutral-300 hover:text-white text-[10px] font-medium transition-colors flex items-center justify-center gap-1 border border-neutral-700/60"
                >
                  <Upload className="w-3 h-3 text-amber-400" />
                  <span>फ़ोटो बदलें</span>
                </button>

                {/* Snap Camera Button */}
                <button
                  type="button"
                  onClick={() => {
                    onSnapToAngle(v.id);
                    onClose();
                  }}
                  className="w-full py-1.5 px-2 rounded-lg bg-amber-400/15 hover:bg-amber-400 hover:text-neutral-950 text-amber-300 font-semibold text-[11px] transition-colors flex items-center justify-center gap-1 border border-amber-400/30"
                >
                  <Compass className="w-3.5 h-3.5" />
                  <span>3D कैमरा स्नैप</span>
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Verification Checkpoints from Pipeline */}
        <div className="p-3.5 rounded-xl bg-amber-400/10 border border-amber-400/20 text-xs text-neutral-300 space-y-2">
          <div className="font-semibold text-amber-300 flex items-center gap-1.5">
            <Sparkles className="w-4 h-4" />
            <span>एनाटॉमिकल 3D रिकंस्ट्रक्शन गाइड (How It Works):</span>
          </div>
          <ul className="space-y-1 text-[11px] list-disc list-inside text-neutral-300">
            <li>
              <strong>Front View (सामने):</strong> आँखों की स्थिति, पुतलियाँ और होंठों का फैलाव लॉक करता है।
            </li>
            <li>
              <strong>Side Profiles (प्रोफाइल):</strong> नाक का Z-उभार, जबड़े का V-कोण और कान की गहराई तय करता है।
            </li>
            <li>
              <strong>Back View (पीछे):</strong> सिर के पिछले हिस्से की गोलाई और घने घुंघराले बालों की लेयर्स बनाता है।
            </li>
            <li>
              <strong>लोकेलाइज्ड फाइन-ट्यूनिंग:</strong> अगर किसी एंगल में नाक या ठोड़ी को और उभारना हो, तो कंट्रोल्स मेन्यू में <strong>"बनावट (Sculpt)"</strong> स्लाइडर्स का उपयोग करें।
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

