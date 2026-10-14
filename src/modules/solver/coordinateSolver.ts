import {
  CephalometricMeasurements,
  LandmarkCorrespondence,
  Point3D,
  SilhouetteData,
  ViewSlot,
} from '../types';

export interface SolverResult {
  points: Point3D[];
  measurements: CephalometricMeasurements;
  boundingDimensions: { width: number; height: number; depth: number };
}

export function solve3DCoordinates(
  correspondences: LandmarkCorrespondence[],
  silhouettes: Partial<Record<ViewSlot, SilhouetteData>>,
  calibrationMm = 220,
  isCustomCalibrated = false
): SolverResult {
  const points: Point3D[] = [];

  // 1. Add all matched anatomical landmarks as primary 3D anchor points
  for (const corr of correspondences) {
    let provenance: Point3D['provenance'] = 'landmark_constrained';
    if (corr.zMethod === 'bilateral_profile_triangulation') {
      provenance = 'triangulation';
    } else if (corr.zMethod === 'single_profile_ray') {
      provenance = 'profile_ray';
    }

    points.push({
      id: `pt_${corr.semanticId}`,
      semanticId: corr.semanticId,
      label: corr.label,
      category: corr.category,
      x: corr.matchedCoord3D[0],
      y: corr.matchedCoord3D[1],
      z: corr.matchedCoord3D[2],
      confidence: corr.confidence,
      provenance,
      constrainingViews: corr.viewsPresent,
      locked: false,
    });
  }

  // 2. Extract key anatomical distance measurements
  const getPt = (semanticId: string) => points.find((p) => p.semanticId === semanticId);

  const vertex = getPt('vertex');
  const gnathion = getPt('gnathion');
  const templeL = getPt('temple_left');
  const templeR = getPt('temple_right');
  const glabella = getPt('glabella');
  const opisthocranion = getPt('opisthocranion');
  const eyeInL = getPt('eye_inner_l');
  const eyeInR = getPt('eye_inner_r');
  const eyeOutL = getPt('eye_outer_l');
  const eyeOutR = getPt('eye_outer_r');
  const pronasale = getPt('pronasale');
  const subnasale = getPt('subnasale');
  const gonionL = getPt('gonion_l');
  const gonionR = getPt('gonion_r');

  // Height: Vertex to Gnathion
  const heightMm =
    vertex && gnathion
      ? Math.abs(vertex.y - gnathion.y)
      : calibrationMm;

  // Width: Left Temple to Right Temple or Gonion to Gonion
  const widthMm =
    templeL && templeR
      ? Math.abs(templeR.x - templeL.x)
      : calibrationMm * 0.68;

  // Depth: Glabella to Opisthocranion
  const depthMm =
    glabella && opisthocranion
      ? Math.abs(glabella.z - opisthocranion.z)
      : calibrationMm * 0.86;

  const cranialIndex = Number(((widthMm / depthMm) * 100).toFixed(1));

  let cranialClassification: CephalometricMeasurements['cranialClassification'] = 'Mesocephalic (Medium)';
  if (cranialIndex < 75) {
    cranialClassification = 'Dolichocephalic (Narrow)';
  } else if (cranialIndex > 80) {
    cranialClassification = 'Brachycephalic (Broad)';
  }

  const facialIndex = Number(((heightMm / widthMm) * 100).toFixed(1));

  const intercanthal =
    eyeInL && eyeInR
      ? Math.sqrt(Math.pow(eyeInR.x - eyeInL.x, 2) + Math.pow(eyeInR.y - eyeInL.y, 2))
      : 32;

  const outerEyeDist =
    eyeOutL && eyeOutR
      ? Math.sqrt(Math.pow(eyeOutR.x - eyeOutL.x, 2) + Math.pow(eyeOutR.y - eyeOutL.y, 2))
      : 96;

  const noseProminence =
    pronasale && subnasale
      ? Math.max(0, pronasale.z - subnasale.z)
      : 22;

  const jawWidth =
    gonionL && gonionR
      ? Math.abs(gonionR.x - gonionL.x)
      : 110;

  const measurements: CephalometricMeasurements = {
    headHeightMm: Number(heightMm.toFixed(1)),
    headWidthMm: Number(widthMm.toFixed(1)),
    headDepthMm: Number(depthMm.toFixed(1)),
    cranialIndex,
    cranialClassification,
    facialIndex,
    intercanthalDistanceMm: Number(intercanthal.toFixed(1)),
    outerEyeDistanceMm: Number(outerEyeDist.toFixed(1)),
    noseProminenceMm: Number(noseProminence.toFixed(1)),
    jawWidthMm: Number(jawWidth.toFixed(1)),
    isCalibrated: isCustomCalibrated,
    calibrationDimensionMm: calibrationMm,
    calibrationReference: isCustomCalibrated
      ? `User-Calibrated Physical Scale (${calibrationMm}mm)`
      : 'Normalized anatomical scale (arbitrary units referenced to ~220mm cranial height standard)',
  };

  return {
    points,
    measurements,
    boundingDimensions: {
      width: Number(widthMm.toFixed(1)),
      height: Number(heightMm.toFixed(1)),
      depth: Number(depthMm.toFixed(1)),
    },
  };
}
