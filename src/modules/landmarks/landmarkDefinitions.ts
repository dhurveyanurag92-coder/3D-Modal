import { Landmark2D, ViewSlot } from '../types';

export interface SemanticLandmarkMeta {
  semanticId: string;
  label: string;
  category: Landmark2D['category'];
  description: string;
  defaultViews: Partial<Record<ViewSlot, { x: number; y: number }>>;
}

export const SEMANTIC_LANDMARK_REGISTRY: SemanticLandmarkMeta[] = [
  // CRANIUM & FOREHEAD
  {
    semanticId: 'vertex',
    label: 'Cranium Vertex (Crown)',
    category: 'cranium',
    description: 'Highest point of the skull crown along sagittal midline',
    defaultViews: {
      front: { x: 0.50, y: 0.10 },
      left: { x: 0.52, y: 0.10 },
      right: { x: 0.48, y: 0.10 },
      back: { x: 0.50, y: 0.10 },
    },
  },
  {
    semanticId: 'forehead_center',
    label: 'Forehead Midpoint',
    category: 'cranium',
    description: 'Midpoint of frontal bone above glabella',
    defaultViews: {
      front: { x: 0.50, y: 0.28 },
      left: { x: 0.36, y: 0.28 },
      right: { x: 0.64, y: 0.28 },
    },
  },
  {
    semanticId: 'glabella',
    label: 'Glabella',
    category: 'cranium',
    description: 'Smooth prominence between the eyebrows directly above nasion',
    defaultViews: {
      front: { x: 0.50, y: 0.34 },
      left: { x: 0.34, y: 0.34 },
      right: { x: 0.66, y: 0.34 },
    },
  },
  {
    semanticId: 'temple_left',
    label: 'Left Temple (Eurion L)',
    category: 'cranium',
    description: 'Lateral temporal crest boundary on left side',
    defaultViews: {
      front: { x: 0.33, y: 0.35 },
      left: { x: 0.45, y: 0.35 },
    },
  },
  {
    semanticId: 'temple_right',
    label: 'Right Temple (Eurion R)',
    category: 'cranium',
    description: 'Lateral temporal crest boundary on right side',
    defaultViews: {
      front: { x: 0.67, y: 0.35 },
      right: { x: 0.55, y: 0.35 },
    },
  },

  // EYES & BROWS
  {
    semanticId: 'eye_outer_l',
    label: 'Left Eye Outer (Exocanthion L)',
    category: 'eye',
    description: 'Lateral angle of the left palpebral fissure',
    defaultViews: {
      front: { x: 0.37, y: 0.38 },
      left: { x: 0.37, y: 0.38 },
    },
  },
  {
    semanticId: 'pupil_l',
    label: 'Left Pupil Center',
    category: 'eye',
    description: 'Visual optical center of left eye',
    defaultViews: {
      front: { x: 0.42, y: 0.38 },
      left: { x: 0.35, y: 0.38 },
    },
  },
  {
    semanticId: 'eye_inner_l',
    label: 'Left Eye Inner (Endocanthion L)',
    category: 'eye',
    description: 'Medial angle of the left palpebral fissure',
    defaultViews: {
      front: { x: 0.46, y: 0.38 },
    },
  },
  {
    semanticId: 'eye_inner_r',
    label: 'Right Eye Inner (Endocanthion R)',
    category: 'eye',
    description: 'Medial angle of the right palpebral fissure',
    defaultViews: {
      front: { x: 0.54, y: 0.38 },
    },
  },
  {
    semanticId: 'pupil_r',
    label: 'Right Pupil Center',
    category: 'eye',
    description: 'Visual optical center of right eye',
    defaultViews: {
      front: { x: 0.58, y: 0.38 },
      right: { x: 0.65, y: 0.38 },
    },
  },
  {
    semanticId: 'eye_outer_r',
    label: 'Right Eye Outer (Exocanthion R)',
    category: 'eye',
    description: 'Lateral angle of the right palpebral fissure',
    defaultViews: {
      front: { x: 0.63, y: 0.38 },
      right: { x: 0.63, y: 0.38 },
    },
  },

  // NOSE
  {
    semanticId: 'nasion',
    label: 'Nasion (Nose Root)',
    category: 'nose',
    description: 'Midpoint of the suture between frontal and two nasal bones',
    defaultViews: {
      front: { x: 0.50, y: 0.36 },
      left: { x: 0.33, y: 0.36 },
      right: { x: 0.67, y: 0.36 },
    },
  },
  {
    semanticId: 'nose_bridge',
    label: 'Nose Bridge (Rhinion)',
    category: 'nose',
    description: 'Mid-dorsum point of nasal bone articulation',
    defaultViews: {
      front: { x: 0.50, y: 0.42 },
      left: { x: 0.30, y: 0.42 },
      right: { x: 0.70, y: 0.42 },
    },
  },
  {
    semanticId: 'pronasale',
    label: 'Pronasale (Nose Tip)',
    category: 'nose',
    description: 'Most prominent anterior point of nasal tip',
    defaultViews: {
      front: { x: 0.50, y: 0.47 },
      left: { x: 0.27, y: 0.47 },
      right: { x: 0.73, y: 0.47 },
    },
  },
  {
    semanticId: 'subnasale',
    label: 'Subnasale (Nose Base)',
    category: 'nose',
    description: 'Junction where the nasal septum meets upper lip philtrum',
    defaultViews: {
      front: { x: 0.50, y: 0.51 },
      left: { x: 0.32, y: 0.51 },
      right: { x: 0.68, y: 0.51 },
    },
  },
  {
    semanticId: 'alar_base_l',
    label: 'Left Alar Base (Alare L)',
    category: 'nose',
    description: 'Most lateral point on left nasal wing margin',
    defaultViews: {
      front: { x: 0.45, y: 0.49 },
      left: { x: 0.33, y: 0.49 },
    },
  },
  {
    semanticId: 'alar_base_r',
    label: 'Right Alar Base (Alare R)',
    category: 'nose',
    description: 'Most lateral point on right nasal wing margin',
    defaultViews: {
      front: { x: 0.55, y: 0.49 },
      right: { x: 0.67, y: 0.49 },
    },
  },

  // MOUTH & LIPS
  {
    semanticId: 'mouth_corner_l',
    label: 'Left Mouth Corner (Cheilion L)',
    category: 'mouth',
    description: 'Left lateral commissure of oral fissure',
    defaultViews: {
      front: { x: 0.42, y: 0.57 },
      left: { x: 0.35, y: 0.57 },
    },
  },
  {
    semanticId: 'upper_lip_center',
    label: 'Upper Lip Apex (Labiale Superius)',
    category: 'mouth',
    description: 'Midpoint of upper vermilion border',
    defaultViews: {
      front: { x: 0.50, y: 0.55 },
      left: { x: 0.31, y: 0.55 },
      right: { x: 0.69, y: 0.55 },
    },
  },
  {
    semanticId: 'stomion',
    label: 'Stomion (Oral Contact Line)',
    category: 'mouth',
    description: 'Center point where lips close naturally',
    defaultViews: {
      front: { x: 0.50, y: 0.57 },
      left: { x: 0.31, y: 0.57 },
      right: { x: 0.69, y: 0.57 },
    },
  },
  {
    semanticId: 'lower_lip_center',
    label: 'Lower Lip Center (Labiale Inferius)',
    category: 'mouth',
    description: 'Midpoint of lower vermilion border',
    defaultViews: {
      front: { x: 0.50, y: 0.59 },
      left: { x: 0.32, y: 0.59 },
      right: { x: 0.68, y: 0.59 },
    },
  },
  {
    semanticId: 'mouth_corner_r',
    label: 'Right Mouth Corner (Cheilion R)',
    category: 'mouth',
    description: 'Right lateral commissure of oral fissure',
    defaultViews: {
      front: { x: 0.58, y: 0.57 },
      right: { x: 0.65, y: 0.57 },
    },
  },

  // JAW & CHIN
  {
    semanticId: 'pogonion',
    label: 'Pogonion (Chin Apex)',
    category: 'jaw',
    description: 'Most anterior projecting point of mandibular chin',
    defaultViews: {
      front: { x: 0.50, y: 0.66 },
      left: { x: 0.33, y: 0.66 },
      right: { x: 0.67, y: 0.66 },
    },
  },
  {
    semanticId: 'gnathion',
    label: 'Gnathion (Chin Base)',
    category: 'jaw',
    description: 'Lowest median landmark on the lower border of mandible',
    defaultViews: {
      front: { x: 0.50, y: 0.70 },
      left: { x: 0.37, y: 0.70 },
      right: { x: 0.63, y: 0.70 },
    },
  },
  {
    semanticId: 'gonion_l',
    label: 'Left Jaw Angle (Gonion L)',
    category: 'jaw',
    description: 'Posteroinferior point on the angle of left mandible',
    defaultViews: {
      front: { x: 0.36, y: 0.62 },
      left: { x: 0.44, y: 0.62 },
    },
  },
  {
    semanticId: 'gonion_r',
    label: 'Right Jaw Angle (Gonion R)',
    category: 'jaw',
    description: 'Posteroinferior point on the angle of right mandible',
    defaultViews: {
      front: { x: 0.64, y: 0.62 },
      right: { x: 0.56, y: 0.62 },
    },
  },

  // EARS
  {
    semanticId: 'ear_top_l',
    label: 'Left Ear Apex (Otobasion Superius L)',
    category: 'ear',
    description: 'Upper attachment point of left pinna to cranium',
    defaultViews: {
      front: { x: 0.28, y: 0.38 },
      left: { x: 0.54, y: 0.38 },
      back: { x: 0.68, y: 0.38 },
    },
  },
  {
    semanticId: 'ear_lobe_l',
    label: 'Left Ear Lobule (Subaurale L)',
    category: 'ear',
    description: 'Lowest point of left ear lobe',
    defaultViews: {
      front: { x: 0.29, y: 0.50 },
      left: { x: 0.53, y: 0.50 },
      back: { x: 0.67, y: 0.50 },
    },
  },
  {
    semanticId: 'ear_top_r',
    label: 'Right Ear Apex (Otobasion Superius R)',
    category: 'ear',
    description: 'Upper attachment point of right pinna to cranium',
    defaultViews: {
      front: { x: 0.72, y: 0.38 },
      right: { x: 0.46, y: 0.38 },
      back: { x: 0.32, y: 0.38 },
    },
  },
  {
    semanticId: 'ear_lobe_r',
    label: 'Right Ear Lobule (Subaurale R)',
    category: 'ear',
    description: 'Lowest point of right ear lobe',
    defaultViews: {
      front: { x: 0.71, y: 0.50 },
      right: { x: 0.47, y: 0.50 },
      back: { x: 0.33, y: 0.50 },
    },
  },

  // POSTERIOR SKULL & OCCIPUT
  {
    semanticId: 'opisthocranion',
    label: 'Opisthocranion (Occiput Apex)',
    category: 'cranium',
    description: 'Most prominent posterior point on the occipital bone',
    defaultViews: {
      left: { x: 0.68, y: 0.28 },
      right: { x: 0.32, y: 0.28 },
      back: { x: 0.50, y: 0.28 },
    },
  },
  {
    semanticId: 'inion',
    label: 'Inion (External Occipital Protuberance)',
    category: 'cranium',
    description: 'Prominence at base of skull where neck muscles attach',
    defaultViews: {
      left: { x: 0.64, y: 0.45 },
      right: { x: 0.36, y: 0.45 },
      back: { x: 0.50, y: 0.45 },
    },
  },
  {
    semanticId: 'nape_center',
    label: 'Nape Cervical Junction',
    category: 'neck',
    description: 'Posterior midline where neck joins upper spine',
    defaultViews: {
      left: { x: 0.58, y: 0.62 },
      right: { x: 0.42, y: 0.62 },
      back: { x: 0.50, y: 0.62 },
    },
  },
  {
    semanticId: 'neck_left',
    label: 'Left Lateral Neck Border',
    category: 'neck',
    description: 'Lateral left neck contour',
    defaultViews: {
      front: { x: 0.39, y: 0.75 },
      back: { x: 0.61, y: 0.75 },
    },
  },
  {
    semanticId: 'neck_right',
    label: 'Right Lateral Neck Border',
    category: 'neck',
    description: 'Lateral right neck contour',
    defaultViews: {
      front: { x: 0.61, y: 0.75 },
      back: { x: 0.39, y: 0.75 },
    },
  },
];

export function buildDefaultLandmarks(): Landmark2D[] {
  const result: Landmark2D[] = [];
  const views: ViewSlot[] = ['front', 'back', 'left', 'right'];

  for (const meta of SEMANTIC_LANDMARK_REGISTRY) {
    for (const view of views) {
      const pos = meta.defaultViews[view];
      if (pos) {
        result.push({
          id: `${view}_${meta.semanticId}`,
          semanticId: meta.semanticId,
          label: meta.label,
          category: meta.category,
          view,
          x: pos.x,
          y: pos.y,
          confidence: null, // Unmeasured until calibrated by user or external model
          source: 'starter_template',
          locked: false,
        });
      }
    }
  }

  return result;
}

export interface LandmarkValidationResult {
  totalPoints: number;
  perViewCounts: Record<ViewSlot, number>;
  pointsWithProfileCoverage: number;
  verticalDisparities: Array<{
    semanticId: string;
    label: string;
    views: [ViewSlot, ViewSlot];
    disparityPx: number;
  }>;
  warnings: string[];
}

export function validateLandmarkConsistency(
  landmarks: Landmark2D[],
  imageResolution = 1024
): LandmarkValidationResult {
  const perViewCounts: Record<ViewSlot, number> = {
    front: 0,
    back: 0,
    left: 0,
    right: 0,
  };

  const bySemantic: Record<string, Partial<Record<ViewSlot, Landmark2D>>> = {};
  for (const lm of landmarks) {
    perViewCounts[lm.view]++;
    if (!bySemantic[lm.semanticId]) bySemantic[lm.semanticId] = {};
    bySemantic[lm.semanticId][lm.view] = lm;
  }

  const verticalDisparities: LandmarkValidationResult['verticalDisparities'] = [];
  const warnings: string[] = [];
  let pointsWithProfileCoverage = 0;

  for (const [semanticId, views] of Object.entries(bySemantic)) {
    const meta = SEMANTIC_LANDMARK_REGISTRY.find((m) => m.semanticId === semanticId);
    const label = meta?.label || semanticId;
    const hasProfile = !!(views.left || views.right);
    if (hasProfile) pointsWithProfileCoverage++;

    // Check vertical disparity between Front and Left/Right
    if (views.front && views.left) {
      const disp = Math.abs(views.front.y - views.left.y) * imageResolution;
      if (disp > 25) {
        verticalDisparities.push({
          semanticId,
          label,
          views: ['front', 'left'],
          disparityPx: Number(disp.toFixed(1)),
        });
      }
    }

    if (views.front && views.right) {
      const disp = Math.abs(views.front.y - views.right.y) * imageResolution;
      if (disp > 25) {
        verticalDisparities.push({
          semanticId,
          label,
          views: ['front', 'right'],
          disparityPx: Number(disp.toFixed(1)),
        });
      }
    }

    if (views.left && views.right) {
      const disp = Math.abs(views.left.y - views.right.y) * imageResolution;
      if (disp > 30) {
        verticalDisparities.push({
          semanticId,
          label,
          views: ['left', 'right'],
          disparityPx: Number(disp.toFixed(1)),
        });
      }
    }
  }

  if (verticalDisparities.length > 0) {
    warnings.push(
      `${verticalDisparities.length} landmarks exhibit high vertical disparity (>25px) between orthogonal views. Align Y heights for accurate 3D triangulation.`
    );
  }

  if (pointsWithProfileCoverage < 5) {
    warnings.push(
      'Fewer than 5 landmarks have profile view constraints. Z-depth will be mostly unconstrained.'
    );
  }

  return {
    totalPoints: landmarks.length,
    perViewCounts,
    pointsWithProfileCoverage,
    verticalDisparities,
    warnings,
  };
}
