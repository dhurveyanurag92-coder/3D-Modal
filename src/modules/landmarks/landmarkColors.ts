import { LandmarkCategory } from '../types';

export interface CategoryColorMeta {
  category: LandmarkCategory | 'selected';
  hex: string;
  bgClass: string;
  borderClass: string;
  ringClass: string;
  labelHi: string;
  labelEn: string;
  descriptionHi: string;
}

export const ANATOMICAL_COLORS: Record<LandmarkCategory | 'selected', CategoryColorMeta> = {
  selected: {
    category: 'selected',
    hex: '#f43f5e',
    bgClass: 'bg-rose-500',
    borderClass: 'border-white',
    ringClass: 'ring-rose-400',
    labelHi: 'चुना हुआ बिंदु (एक्टिव)',
    labelEn: 'Active Selected Point',
    descriptionHi: 'जिस बिंदु को आप अभी ऐरो से हिला रहे हैं (Target Point)',
  },
  cranium: {
    category: 'cranium',
    hex: '#22d3ee',
    bgClass: 'bg-cyan-400',
    borderClass: 'border-slate-950',
    ringClass: 'ring-cyan-400',
    labelHi: 'सिर / खोपड़ी व माथा',
    labelEn: 'Cranium, Crown & Forehead',
    descriptionHi: 'सिर का ऊपरी क्राउन (Vertex), माथा और हेयरलाइन सीमा',
  },
  eye: {
    category: 'eye',
    hex: '#fbbf24',
    bgClass: 'bg-amber-400',
    borderClass: 'border-slate-950',
    ringClass: 'ring-amber-400',
    labelHi: 'आंखें व भौंहें',
    labelEn: 'Eyes & Eyebrows',
    descriptionHi: 'आंखों के कोने, पुतली, पलकें और भौंहें',
  },
  nose: {
    category: 'nose',
    hex: '#34d399',
    bgClass: 'bg-emerald-400',
    borderClass: 'border-slate-950',
    ringClass: 'ring-emerald-400',
    labelHi: 'नाक',
    labelEn: 'Nose & Nostrils',
    descriptionHi: 'नोज़ ब्रिज (Nasion), नोज़ टिप (Pronasale) और नथुने (Alare)',
  },
  mouth: {
    category: 'mouth',
    hex: '#ec4899',
    bgClass: 'bg-pink-500',
    borderClass: 'border-slate-950',
    ringClass: 'ring-pink-400',
    labelHi: 'होंठ व मुंह',
    labelEn: 'Lips & Mouth',
    descriptionHi: 'ऊपरी व निचला होंठ, मुंह के कोने (Cheilion)',
  },
  jaw: {
    category: 'jaw',
    hex: '#a855f7',
    bgClass: 'bg-purple-500',
    borderClass: 'border-slate-950',
    ringClass: 'ring-purple-400',
    labelHi: 'ठोड़ी व जबड़ा',
    labelEn: 'Jawline & Chin',
    descriptionHi: 'ठोड़ी का सबसे निचला बिंदु (Gnathion/Menton) और जबड़े की हड्डी (Gonion)',
  },
  ear: {
    category: 'ear',
    hex: '#fb923c',
    bgClass: 'bg-orange-400',
    borderClass: 'border-slate-950',
    ringClass: 'ring-orange-400',
    labelHi: 'कान',
    labelEn: 'Ears',
    descriptionHi: 'कान का ऊपरी भाग, ईयर लोब और ट्रैगस',
  },
  neck: {
    category: 'neck',
    hex: '#6366f1',
    bgClass: 'bg-indigo-500',
    borderClass: 'border-slate-950',
    ringClass: 'ring-indigo-400',
    labelHi: 'गला व गर्दन',
    labelEn: 'Neck & Throat',
    descriptionHi: 'गले की बेस, सर्वाइकल जंक्शन और गर्दन की सीमा',
  },
  face: {
    category: 'face',
    hex: '#38bdf8',
    bgClass: 'bg-sky-400',
    borderClass: 'border-slate-950',
    ringClass: 'ring-sky-400',
    labelHi: 'चेहरा व चीकबोन्स',
    labelEn: 'Face & Cheekbones',
    descriptionHi: 'चीकबोन्स (Zygomatic) और चेहरे का मध्य भाग',
  },
};

export function getLandmarkColor(category: string, isSelected: boolean) {
  if (isSelected) return ANATOMICAL_COLORS.selected;
  const match = ANATOMICAL_COLORS[category as LandmarkCategory];
  return match || ANATOMICAL_COLORS.cranium;
}
