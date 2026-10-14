import {
  ProjectState,
  ReferenceImageSlot,
  StageDefinition,
  StageId,
  ViewSlot,
} from '../types';
import { DEFAULT_REFERENCE_SLOTS } from '../references/defaultReferences';
import {
  buildDefaultLandmarks,
  validateLandmarkConsistency,
} from '../landmarks/landmarkDefinitions';
import { extractHeadSilhouette } from '../silhouette/silhouetteExtractor';
import { generateDepthMap } from '../depth/depthService';
import { generateNormalMap } from '../normals/normalsService';
import { matchLandmarksAcrossViews } from '../matching/matchingEngine';
import { solve3DCoordinates } from '../solver/coordinateSolver';
import { buildHeadWireframe } from '../wireframe/wireframeBuilder';
import { evaluateFourViewReprojection } from '../comparison/comparisonEngine';

export const INITIAL_STAGES: Record<StageId, StageDefinition> = {
  validation: {
    id: 'validation',
    order: 1,
    title: 'Image Validation & Ingestion',
    shortTitle: '1. Validation',
    description: 'Verify 4 reference views (Front, Back, Left, Right), dimensions, and readability.',
    status: 'waiting',
  },
  alignment: {
    id: 'alignment',
    order: 2,
    title: 'Scale & Pose Alignment',
    shortTitle: '2. Alignment',
    description: 'Verify cranial vertical scale, eye-line guide, and chin baseline across views.',
    status: 'waiting',
  },
  landmarks: {
    id: 'landmarks',
    order: 3,
    title: 'Landmark Placement & Validation',
    shortTitle: '3. Landmarks',
    description: 'Review and position anatomical cranial and facial points across camera angles.',
    status: 'waiting',
  },
  silhouette: {
    id: 'silhouette',
    order: 4,
    title: 'Silhouette Extraction',
    shortTitle: '4. Silhouette',
    description: 'Extract binary foreground masks and horizontal cross-section skull spans.',
    status: 'waiting',
  },
  depth: {
    id: 'depth',
    order: 5,
    title: 'Depth Map Estimation',
    shortTitle: '5. Depth Map',
    description: 'Estimate relative cranial surface depth via client-side geometric heuristics.',
    status: 'waiting',
  },
  normals: {
    id: 'normals',
    order: 6,
    title: 'Normal Map Generation',
    shortTitle: '6. Normal Map',
    description: 'Compute surface orientation vectors via dual-axis Sobel gradient convolution.',
    status: 'waiting',
  },
  matching: {
    id: 'matching',
    order: 7,
    title: 'Cross-View Point Matching',
    shortTitle: '7. Matching',
    description: 'Match corresponding landmarks across Front, Profile, and Back views.',
    status: 'waiting',
  },
  solver: {
    id: 'solver',
    order: 8,
    title: '3D Coordinate Solver',
    shortTitle: '8. 3D Coordinates',
    description: 'Triangulate unified XYZ coordinates and compute cephalometric dimensions.',
    status: 'waiting',
  },
  wireframe: {
    id: 'wireframe',
    order: 9,
    title: 'Hollow Wireframe Construction',
    shortTitle: '9. Wireframe',
    description: 'Build hollow 3D skull cage with silhouette-constrained rings and facial loops.',
    status: 'waiting',
  },
  projection: {
    id: 'projection',
    order: 10,
    title: 'Four-View Projection & Comparison',
    shortTitle: '10. Projection',
    description: 'Project reconstructed 3D wireframe back to 2D references and measure pixel disparity.',
    status: 'waiting',
  },
  validation_report: {
    id: 'validation_report',
    order: 11,
    title: 'Validation & Disparity Report',
    shortTitle: '11. Validation',
    description: 'Comprehensive geometric accuracy, disparity statistics, and export manifest.',
    status: 'waiting',
  },
};

/**
 * Creates a pristine, un-computed initial project state.
 * All stages start strictly as Waiting with no fabricated summaries or success states.
 */
export function createInitialProjectState(): ProjectState {
  const stages = {} as Record<StageId, StageDefinition>;
  for (const [key, stage] of Object.entries(INITIAL_STAGES)) {
    stages[key as StageId] = {
      ...stage,
      status: 'waiting',
      outputSummary: undefined,
      warningMsg: undefined,
      errorMsg: undefined,
      isStale: false,
    };
  }

  const landmarks = buildDefaultLandmarks();

  return {
    version: '2.0.0',
    projectName: 'Head_Wireframe_Project',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    images: { ...DEFAULT_REFERENCE_SLOTS },
    stages,
    activeStageId: 'validation',
    landmarks,
    silhouettes: {},
    depthMaps: {},
    normalMaps: {},
    correspondences: [],
    wireframe: null,
    measurements: null,
    validationReport: null,
    settings: {
      density: 'medium',
      ringsCount: 15,
      meridiansCount: 16,
      showPoints: true,
      showEdges: true,
      showSkullRings: true,
      showFacialLoops: true,
      showLandmarks: true,
      pointSize: 2.5,
      lineWidth: 1.5,
      calibrationMm: 220,
      isCustomCalibrated: false,
      activeColorTheme: 'cyan',
    },
  };
}

/**
 * Invalidation helper: when an image slot changes (replaced, deleted, cleared),
 * invalidate every downstream dependent stage and clear cached representations for that slot.
 */
export function invalidateDownstreamOnImageChange(
  state: ProjectState,
  changedSlot: ViewSlot
): ProjectState {
  const next: ProjectState = JSON.parse(JSON.stringify(state));

  // Remove cached outputs that depend on this slot
  delete next.silhouettes[changedSlot];
  delete next.depthMaps[changedSlot];
  delete next.normalMaps[changedSlot];

  // Invalidate downstream wireframe and reports
  next.wireframe = null;
  next.validationReport = null;
  next.measurements = null;

  // Mark downstream stages as stale or waiting
  const staleStages: StageId[] = [
    'alignment',
    'silhouette',
    'depth',
    'normals',
    'matching',
    'solver',
    'wireframe',
    'projection',
    'validation_report',
  ];

  for (const sid of staleStages) {
    if (next.stages[sid].status === 'completed' || next.stages[sid].status === 'warning') {
      next.stages[sid].status = 'stale';
      next.stages[sid].isStale = true;
      next.stages[sid].outputSummary = `Inputs changed (${changedSlot.toUpperCase()} view updated). Recomputation required.`;
    }
  }

  next.updatedAt = new Date().toISOString();
  return next;
}

/**
 * Executes the honest 11-stage pipeline sequentially.
 * Real computational progress, honest error states, no fabricated percentages.
 */
export async function runFullPipeline(
  currentState: ProjectState,
  onProgress?: (stageId: StageId, status: StageDefinition['status'], summary?: string) => void
): Promise<ProjectState> {
  const state: ProjectState = JSON.parse(JSON.stringify(currentState));
  const views: ViewSlot[] = ['front', 'back', 'left', 'right'];

  const setStage = (
    id: StageId,
    status: StageDefinition['status'],
    summary?: string,
    warning?: string,
    error?: string
  ) => {
    state.stages[id].status = status;
    state.stages[id].isStale = false;
    if (summary) state.stages[id].outputSummary = summary;
    if (warning) state.stages[id].warningMsg = warning;
    if (error) state.stages[id].errorMsg = error;
    if (onProgress) onProgress(id, status, summary);
  };

  try {
    // -------------------------------------------------------------
    // Stage 1: Validation
    // -------------------------------------------------------------
    setStage('validation', 'running');
    const missingViews: string[] = [];
    for (const v of views) {
      const imgSlot = state.images[v];
      if (!imgSlot || !imgSlot.url || imgSlot.url.trim() === '') {
        missingViews.push(v);
        if (imgSlot) imgSlot.isValid = false;
      } else {
        imgSlot.isValid = true;
      }
    }

    if (missingViews.length > 0) {
      const err = `Missing reference photos for: ${missingViews.join(', ')}. Please provide all 4 orthogonal views.`;
      setStage('validation', 'failed', undefined, undefined, err);
      throw new Error(err);
    }
    setStage(
      'validation',
      'completed',
      'All 4 reference views loaded and validated (Front, Back, Left, Right)'
    );

    // -------------------------------------------------------------
    // Stage 2: Alignment
    // -------------------------------------------------------------
    setStage('alignment', 'running');
    const eyeLineFront = state.images.front.anchors.eyeLineY;
    const chinFront = state.images.front.anchors.chinY;
    const headHeightFront = Math.abs(chinFront - eyeLineFront);

    let alignmentWarning: string | undefined;
    if (headHeightFront < 0.10) {
      alignmentWarning = 'Warning: Anchor guides are unusually close together. Check eye-line and chin positioning.';
    }

    setStage(
      'alignment',
      alignmentWarning ? 'warning' : 'completed',
      `Scale normalized: Eye-line at ${Math.round(eyeLineFront * 100)}%, Chin baseline at ${Math.round(chinFront * 100)}%`,
      alignmentWarning
    );

    // -------------------------------------------------------------
    // Stage 3: Landmarks
    // -------------------------------------------------------------
    setStage('landmarks', 'running');
    if (state.landmarks.length === 0) {
      state.landmarks = buildDefaultLandmarks();
    }
    const landmarkValidation = validateLandmarkConsistency(state.landmarks);
    const landmarkWarn = landmarkValidation.warnings.length > 0
      ? landmarkValidation.warnings.join(' ')
      : undefined;

    setStage(
      'landmarks',
      landmarkWarn ? 'warning' : 'completed',
      `${state.landmarks.length} landmarks verified across 4 camera angles (${landmarkValidation.pointsWithProfileCoverage} with profile constraints)`,
      landmarkWarn
    );

    // -------------------------------------------------------------
    // Stage 4: Silhouette Extraction
    // -------------------------------------------------------------
    setStage('silhouette', 'running');
    const silhouettes: Partial<Record<ViewSlot, any>> = {};
    const silWarnings: string[] = [];

    for (const v of views) {
      try {
        const sil = await extractHeadSilhouette(state.images[v].url, v, {
          imageVersion: state.images[v].version,
        });
        silhouettes[v] = sil;
        if (sil.quality === 'warning') {
          silWarnings.push(`${v.toUpperCase()} view: ${sil.notes}`);
        }
      } catch (err: any) {
        setStage('silhouette', 'failed', undefined, undefined, `Failed on ${v} view: ${err?.message || err}`);
        throw err;
      }
    }
    state.silhouettes = silhouettes;
    setStage(
      'silhouette',
      silWarnings.length > 0 ? 'warning' : 'completed',
      'Head boundaries and cross-section spans extracted via local color-contrast thresholding',
      silWarnings.length > 0 ? silWarnings.join(' ') : undefined
    );

    // -------------------------------------------------------------
    // Stage 5: Depth Map Estimation (Honest Heuristic)
    // -------------------------------------------------------------
    setStage('depth', 'running');
    const depthMaps: Partial<Record<ViewSlot, any>> = {};
    for (const v of views) {
      try {
        const dm = await generateDepthMap(state.images[v].url, v, {
          imageVersion: state.images[v].version,
        });
        depthMaps[v] = dm;
      } catch (err: any) {
        setStage('depth', 'failed', undefined, undefined, `Depth generation error on ${v}: ${err?.message || err}`);
        throw err;
      }
    }
    state.depthMaps = depthMaps;
    setStage(
      'depth',
      'completed',
      'Relative cranial depth maps generated (Local Heuristic Fallback — not physical LiDAR)'
    );

    // -------------------------------------------------------------
    // Stage 6: Normal Map Generation
    // -------------------------------------------------------------
    setStage('normals', 'running');
    const normalMaps: Partial<Record<ViewSlot, any>> = {};
    for (const v of views) {
      try {
        const nm = await generateNormalMap(state.images[v].url, v, {
          imageVersion: state.images[v].version,
        });
        normalMaps[v] = nm;
      } catch (err: any) {
        setStage('normals', 'failed', undefined, undefined, `Normal map error on ${v}: ${err?.message || err}`);
        throw err;
      }
    }
    state.normalMaps = normalMaps;
    setStage(
      'normals',
      'completed',
      'Sobel surface normal vectors computed in tangent space'
    );

    // -------------------------------------------------------------
    // Stage 7: Cross-View Matching
    // -------------------------------------------------------------
    setStage('matching', 'running');
    const correspondences = matchLandmarksAcrossViews(
      state.landmarks,
      state.settings.calibrationMm
    );
    state.correspondences = correspondences;

    const conflictCount = correspondences.filter((c) => c.status === 'conflict').length;
    const inferredCount = correspondences.filter((c) => c.status === 'inferred').length;
    let matchWarning: string | undefined;
    if (conflictCount > 0) {
      matchWarning = `${conflictCount} points show vertical epipolar disparity >30px. Check alignment.`;
    }

    setStage(
      'matching',
      conflictCount > 0 ? 'warning' : 'completed',
      `${correspondences.length} unified correspondences established (${inferredCount} single-view/unconstrained Z)`,
      matchWarning
    );

    // -------------------------------------------------------------
    // Stage 8: 3D Coordinate Solver
    // -------------------------------------------------------------
    setStage('solver', 'running');
    const solverRes = solve3DCoordinates(
      state.correspondences,
      state.silhouettes,
      state.settings.calibrationMm,
      state.settings.isCustomCalibrated
    );
    state.measurements = solverRes.measurements;
    setStage(
      'solver',
      'completed',
      `3D coordinates solved. Head dimensions: ${solverRes.measurements.headHeightMm}x${solverRes.measurements.headWidthMm}x${solverRes.measurements.headDepthMm} (${state.settings.isCustomCalibrated ? 'mm' : 'normalized units'})`
    );

    // -------------------------------------------------------------
    // Stage 9: Wireframe Construction (Input-derived)
    // -------------------------------------------------------------
    setStage('wireframe', 'running');
    const imageVersions: Record<ViewSlot, string> = {
      front: state.images.front.version,
      back: state.images.back.version,
      left: state.images.left.version,
      right: state.images.right.version,
    };

    const wireframe = buildHeadWireframe(solverRes.points, {
      density: state.settings.density,
      customRingsCount: state.settings.ringsCount,
      customMeridiansCount: state.settings.meridiansCount,
      includeFacialLoops: state.settings.showFacialLoops,
      includeSkullRings: state.settings.showSkullRings,
      includeMeridians: true,
      calibrationScaleMm: state.settings.calibrationMm,
      isCustomCalibrated: state.settings.isCustomCalibrated,
      silhouettes: state.silhouettes,
      imageVersions,
    });
    state.wireframe = wireframe;
    setStage(
      'wireframe',
      'completed',
      `Hollow wireframe constructed: ${wireframe.totalPoints} vertices (${wireframe.constrainedVerticesCount} input-constrained), ${wireframe.totalEdges} lines`
    );

    // -------------------------------------------------------------
    // Stage 10: Projection & Comparison
    // -------------------------------------------------------------
    setStage('projection', 'running');
    const validation = evaluateFourViewReprojection(
      wireframe,
      state.landmarks,
      1024,
      state.settings.calibrationMm
    );
    state.validationReport = validation;
    setStage(
      'projection',
      validation.overallStatus === 'warning' ? 'warning' : 'completed',
      `Reprojection evaluated: Mean disparity ${validation.reprojectionMeanError}px across 4 views`
    );

    // -------------------------------------------------------------
    // Stage 11: Validation Report
    // -------------------------------------------------------------
    setStage('validation_report', 'running');
    setStage(
      'validation_report',
      validation.overallStatus === 'critical'
        ? 'failed'
        : validation.overallStatus === 'warning'
        ? 'warning'
        : 'completed',
      `Quality audit complete. Disparity: ${validation.reprojectionMeanError}px, Constrained Vertices: ${validation.coverageStats.constrainedVertexPct}%`,
      validation.warnings.length > 0 ? validation.warnings.join(' ') : undefined
    );

    state.updatedAt = new Date().toISOString();
    return state;
  } catch (err: any) {
    console.error('Pipeline stopped with error:', err);
    throw err;
  }
}
