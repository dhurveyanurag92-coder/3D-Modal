import { ViewSlot } from '../types';

export interface ContourSegment {
  id: string;
  name: string;
  category: 'sagittal' | 'eyes' | 'brows' | 'nose' | 'mouth' | 'jaw' | 'ears' | 'cranium';
  color: string;
  views: ViewSlot[];
  pointIds: string[];
  isClosed?: boolean;
}

export const LANDMARK_2D_CONTOURS: ContourSegment[] = [
  // Front & Profile Midline Sagittal Profile
  {
    id: 'sagittal_midline',
    name: 'Midline Profile',
    category: 'sagittal',
    color: '#38bdf8', // sky cyan
    views: ['front', 'left', 'right'],
    pointIds: [
      'vertex',
      'forehead_center',
      'glabella',
      'nasion',
      'rhinion',
      'pronasale',
      'subnasale',
      'lip_top',
      'stomion',
      'lip_bottom',
      'gnathion',
      'cervical_base',
    ],
    isClosed: false,
  },

  // Posterior Sagittal Profile (profile views)
  {
    id: 'posterior_cranial',
    name: 'Rear Cranium & Occiput',
    category: 'cranium',
    color: '#818cf8', // indigo
    views: ['left', 'right', 'back'],
    pointIds: ['vertex', 'opisthocranion', 'inion', 'cervical_base'],
    isClosed: false,
  },

  // Left Eye Loop
  {
    id: 'eye_left_loop',
    name: 'Left Eye Contour',
    category: 'eyes',
    color: '#fbbf24', // amber
    views: ['front', 'left'],
    pointIds: ['eye_inner_l', 'eye_top_l', 'eye_outer_l', 'eye_bottom_l'],
    isClosed: true,
  },

  // Right Eye Loop
  {
    id: 'eye_right_loop',
    name: 'Right Eye Contour',
    category: 'eyes',
    color: '#fbbf24', // amber
    views: ['front', 'right'],
    pointIds: ['eye_inner_r', 'eye_top_r', 'eye_outer_r', 'eye_bottom_r'],
    isClosed: true,
  },

  // Eyebrows
  {
    id: 'brow_left',
    name: 'Left Eyebrow',
    category: 'brows',
    color: '#f59e0b', // amber dark
    views: ['front', 'left'],
    pointIds: ['glabella', 'brow_inner_l', 'brow_peak_l', 'brow_outer_l'],
    isClosed: false,
  },
  {
    id: 'brow_right',
    name: 'Right Eyebrow',
    category: 'brows',
    color: '#f59e0b', // amber dark
    views: ['front', 'right'],
    pointIds: ['glabella', 'brow_inner_r', 'brow_peak_r', 'brow_outer_r'],
    isClosed: false,
  },

  // Nose Wings & Alar Base
  {
    id: 'nose_wings',
    name: 'Nose Wings & Tip',
    category: 'nose',
    color: '#34d399', // emerald
    views: ['front', 'left', 'right'],
    pointIds: ['alare_left', 'pronasale', 'alare_right', 'subnasale'],
    isClosed: true,
  },

  // Lips & Mouth Contour
  {
    id: 'mouth_outer',
    name: 'Mouth & Lips Contour',
    category: 'mouth',
    color: '#f43f5e', // rose
    views: ['front', 'left', 'right'],
    pointIds: ['mouth_corner_l', 'lip_top', 'mouth_corner_r', 'lip_bottom'],
    isClosed: true,
  },
  {
    id: 'mouth_center',
    name: 'Mouth Aperture',
    category: 'mouth',
    color: '#f43f5e', // rose
    views: ['front', 'left', 'right'],
    pointIds: ['mouth_corner_l', 'stomion', 'mouth_corner_r'],
    isClosed: false,
  },

  // Mandible Jawline & Chin
  {
    id: 'jawline_chin',
    name: 'Jawline & Chin Arch',
    category: 'jaw',
    color: '#a78bfa', // purple
    views: ['front'],
    pointIds: ['gonion_l', 'gnathion', 'gonion_r'],
    isClosed: false,
  },
  {
    id: 'jaw_left_profile',
    name: 'Left Jawline Profile',
    category: 'jaw',
    color: '#a78bfa',
    views: ['left'],
    pointIds: ['gnathion', 'gonion_l', 'cervical_base'],
    isClosed: false,
  },
  {
    id: 'jaw_right_profile',
    name: 'Right Jawline Profile',
    category: 'jaw',
    color: '#a78bfa',
    views: ['right'],
    pointIds: ['gnathion', 'gonion_r', 'cervical_base'],
    isClosed: false,
  },

  // Cranial Dome Arch (Front & Back)
  {
    id: 'cranial_dome_front',
    name: 'Front Cranial Arch',
    category: 'cranium',
    color: '#06b6d4', // cyan
    views: ['front'],
    pointIds: ['temple_left', 'forehead_center', 'vertex', 'temple_right'],
    isClosed: false,
  },
  {
    id: 'zygomatic_cheeks',
    name: 'Cheekbone Arch',
    category: 'jaw',
    color: '#38bdf8',
    views: ['front'],
    pointIds: ['zygion_left', 'alare_left', 'alare_right', 'zygion_right'],
    isClosed: false,
  },

  // Ears
  {
    id: 'ear_left_contour',
    name: 'Left Ear Contour',
    category: 'ears',
    color: '#0284c7',
    views: ['front', 'left'],
    pointIds: ['ear_top_l', 'tragus_l', 'ear_lobule_l'],
    isClosed: false,
  },
  {
    id: 'ear_right_contour',
    name: 'Right Ear Contour',
    category: 'ears',
    color: '#0284c7',
    views: ['front', 'right'],
    pointIds: ['ear_top_r', 'tragus_r', 'ear_lobule_r'],
    isClosed: false,
  },
];
