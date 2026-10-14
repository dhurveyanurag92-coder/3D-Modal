export type ViewSlot = 'front' | 'back' | 'left' | 'right';

export type StageId =
  | 'validation'
  | 'alignment'
  | 'landmarks'
  | 'silhouette'
  | 'depth'
  | 'normals'
  | 'matching'
  | 'solver'
  | 'wireframe'
  | 'projection'
  | 'validation_report';
export type StageStatus = 'waiting' | 'running' | 'completed' | 'warning' | 'failed' | 'stale';

export interface StageDefinition {
  id: StageId;
  order: number;
  title: string;
  shortTitle: string;
  description: string;
  status: StageStatus;
  durationMs?: number;
  outputSummary?: string;
  warningMsg?: string;
  errorMsg?: string;
  isStale?: boolean;
}

export interface ImageAnchor {
  id: string;
  label: string;
  y: number; // 0..1 normalized
  isLocked?: boolean;
}

export interface ReferenceImageTransform {
  scale: number;
  offsetX: number; // in percentage of width
  offsetY: number; // in percentage of height
  rotationDeg: number;
  flipH: boolean;
  opacity: number;
}

export interface ReferenceImageSlot {
  slot: ViewSlot;
  url: string;
  name: string;
  version: string; // Unique image version string / fingerprint
  width: number;
  height: number;
  aspectRatio: number;
  transform: ReferenceImageTransform;
  anchors: {
    headTopY: number;
    eyeLineY: number;
    noseBaseY: number;
    chinY: number;
  };
  isValid: boolean;
  validationNotes: string[];
  error?: string;
}

export type LandmarkCategory =
  | 'cranium'
  | 'face'
  | 'eye'
  | 'nose'
  | 'mouth'
  | 'jaw'
  | 'ear'
  | 'neck';

export interface Landmark2D {
  id: string;
  semanticId: string;
  label: string;
  category: LandmarkCategory;
  view: ViewSlot;
  x: number; // 0..1 normalized
  y: number; // 0..1 normalized
  confidence: number | null; // null if uncalibrated/not measured
  source: 'detected' | 'manual' | 'estimated' | 'starter_template' | 'auto_assisted';
  imageVersion?: string;
  locked?: boolean;
}

export interface SilhouetteData {
  view: ViewSlot;
  imageVersion: string;
  maskDataUrl: string;
  contourPoints: Array<{ x: number; y: number }>;
  horizontalSpans: Array<{ y: number; minX: number; maxX: number; width: number }>;
  areaPixels: number;
  foregroundFraction: number; // 0..1 fraction of total image area
  threshold: number;
  inverted: boolean;
  quality: 'valid' | 'warning' | 'empty';
  notes: string;
}

export interface DepthMapData {
  view: ViewSlot;
  imageVersion: string;
  depthImageUrl: string;
  rawDepthGrid?: number[][]; // normalized 0..1 depth
  minDepth: number;
  maxDepth: number;
  method: 'local_heuristic_radial' | 'local_heuristic_gradient' | 'external_model';
  disclaimer: string;
  notes: string;
}

export interface NormalMapData {
  view: ViewSlot;
  imageVersion: string;
  normalImageUrl: string;
  method: string;
  disclaimer: string;
  notes: string;
}

export interface LandmarkCorrespondence {
  semanticId: string;
  label: string;
  category: LandmarkCategory;
  viewsPresent: ViewSlot[];
  points2D: Partial<Record<ViewSlot, { x: number; y: number; confidence: number | null; source: Landmark2D['source'] }>>;
  matchedCoord3D: [number, number, number]; // [X, Y, Z]
  confidence: number | null; // null if unmeasured
  verticalDisparityPx: number; // disparity in px between coronal and sagittal views
  zMethod: 'bilateral_profile_triangulation' | 'single_profile_ray' | 'unconstrained_estimated';
  status: 'matched' | 'inferred' | 'conflict';
  notes?: string;
}

export interface Point3D {
  id: string;
  semanticId?: string;
  label: string;
  category: LandmarkCategory | 'skull_ring' | 'meridian' | 'silhouette_boundary';
  x: number; // Left (-) to Right (+)
  y: number; // Chin (-) to Crown (+)
  z: number; // Back (-) to Front (+)
  confidence: number | null;
  provenance:
    | 'triangulation'
    | 'profile_ray'
    | 'silhouette_constrained'
    | 'landmark_constrained'
    | 'spline_interpolation'
    | 'manual_edit';
  constrainingViews?: ViewSlot[];
  locked?: boolean;
}

export interface Edge3D {
  id: string;
  sourceId: string;
  targetId: string;
  category: 'skull_ring' | 'meridian' | 'facial_loop' | 'inferred';
  color?: string;
}

export type WireframeDensity = 'low' | 'medium' | 'high';

export interface WireframeModel {
  vertices: Point3D[];
  edges: Edge3D[];
  ringsCount: number;
  meridiansCount: number;
  density: WireframeDensity;
  constrainedVerticesCount: number;
  interpolatedVerticesCount: number;
  inputImageVersions: Record<ViewSlot, string>;
  scaleUnit: 'arbitrary_normalized' | 'user_calibrated_mm';
  scaleAssumption: string;
  boundingBox: {
    min: [number, number, number];
    max: [number, number, number];
    size: [number, number, number];
  };
  totalPoints: number;
  totalEdges: number;
  generatedAt: string;
}

export interface ReprojectionErrorItem {
  semanticId: string;
  label: string;
  errorPixels: number;
  measured2D: { x: number; y: number };
  projected2D: { x: number; y: number };
}

export interface ViewReprojectionReport {
  view: ViewSlot;
  meanErrorPixels: number;
  maxErrorPixels: number;
  pointsEvaluated: number;
  items: ReprojectionErrorItem[];
}

export interface CephalometricMeasurements {
  headHeightMm: number; // Vertex to Gnathion
  headWidthMm: number;  // Biparietal breadth (Left Eurion to Right Eurion)
  headDepthMm: number;  // Glabella to Opisthocranion
  cranialIndex: number; // (Width / Depth) * 100
  cranialClassification: 'Dolichocephalic (Narrow)' | 'Mesocephalic (Medium)' | 'Brachycephalic (Broad)';
  facialIndex: number;  // (Height / Width) * 100
  intercanthalDistanceMm: number; // Inner canthus to inner canthus
  outerEyeDistanceMm: number;    // Outer canthus to outer canthus
  noseProminenceMm: number;      // Pronasale depth from subnasale plane
  jawWidthMm: number;            // Bigonial breadth
  isCalibrated: boolean;
  calibrationDimensionMm: number;
  calibrationReference: string;
}

export interface ValidationReport {
  overallConfidence: number | null; // null if unmeasured
  overallStatus: 'valid' | 'acceptable' | 'warning' | 'critical';
  reprojectionMeanError: number;
  perViewReports: Record<ViewSlot, ViewReprojectionReport>;
  warnings: string[];
  anomaliesDetected: string[];
  coverageStats: {
    landmarkCoveragePct: number;
    constrainedVertexPct: number;
    rearOccipitalPresent: boolean;
    bothProfilesConsistent: boolean;
  };
  generatedAt: string;
}

export interface ProjectState {
  version: string;
  projectName: string;
  createdAt: string;
  updatedAt: string;
  images: Record<ViewSlot, ReferenceImageSlot>;
  stages: Record<StageId, StageDefinition>;
  activeStageId: StageId;
  landmarks: Landmark2D[];
  silhouettes: Partial<Record<ViewSlot, SilhouetteData>>;
  depthMaps: Partial<Record<ViewSlot, DepthMapData>>;
  normalMaps: Partial<Record<ViewSlot, NormalMapData>>;
  correspondences: LandmarkCorrespondence[];
  wireframe: WireframeModel | null;
  measurements: CephalometricMeasurements | null;
  validationReport: ValidationReport | null;
  settings: {
    density: WireframeDensity;
    ringsCount: number;
    meridiansCount: number;
    showPoints: boolean;
    showEdges: boolean;
    showSkullRings: boolean;
    showFacialLoops: boolean;
    showLandmarks: boolean;
    pointSize: number;
    lineWidth: number;
    calibrationMm: number;
    isCustomCalibrated: boolean;
    activeColorTheme: 'cyan' | 'amber' | 'emerald' | 'monochrome';
  };
}
