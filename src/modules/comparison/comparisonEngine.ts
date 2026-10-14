import {
  Landmark2D,
  Point3D,
  ReprojectionErrorItem,
  ValidationReport,
  ViewReprojectionReport,
  ViewSlot,
  WireframeModel,
} from '../types';

/**
 * Projects a 3D coordinate (X, Y, Z in mm) into 2D normalized screen space [0..1]
 * for a specific orthographic camera view.
 */
export function project3DTo2D(
  pt: { x: number; y: number; z: number },
  view: ViewSlot,
  calibrationScaleMm = 220
): { x: number; y: number } {
  const frontWidthScale = calibrationScaleMm * 0.72;
  const sagittalScale = calibrationScaleMm * 0.85;

  let normX = 0.5;
  let normY = 0.48 - pt.y / calibrationScaleMm;

  if (view === 'front') {
    normX = 0.50 + pt.x / frontWidthScale;
  } else if (view === 'back') {
    normX = 0.50 - pt.x / frontWidthScale; // Mirrored
  } else if (view === 'left') {
    // Facing left: +Z is leftward (< 0.50)
    normX = 0.50 - pt.z / sagittalScale;
  } else if (view === 'right') {
    // Facing right: +Z is rightward (> 0.50)
    normX = 0.50 + pt.z / sagittalScale;
  }

  return {
    x: Math.max(0, Math.min(1, normX)),
    y: Math.max(0, Math.min(1, normY)),
  };
}

/**
 * Evaluates reprojection errors by projecting the reconstructed 3D landmarks
 * back into all 4 reference cameras and comparing against original 2D landmarks.
 */
export function evaluateFourViewReprojection(
  wireframe: WireframeModel,
  landmarks: Landmark2D[],
  imageResolution = 1024,
  calibrationScaleMm = 220
): ValidationReport {
  const views: ViewSlot[] = ['front', 'back', 'left', 'right'];
  const perViewReports: Record<ViewSlot, ViewReprojectionReport> = {
    front: { view: 'front', meanErrorPixels: 0, maxErrorPixels: 0, pointsEvaluated: 0, items: [] },
    back: { view: 'back', meanErrorPixels: 0, maxErrorPixels: 0, pointsEvaluated: 0, items: [] },
    left: { view: 'left', meanErrorPixels: 0, maxErrorPixels: 0, pointsEvaluated: 0, items: [] },
    right: { view: 'right', meanErrorPixels: 0, maxErrorPixels: 0, pointsEvaluated: 0, items: [] },
  };

  const pointMap = new Map<string, Point3D>();
  for (const v of wireframe.vertices) {
    if (v.semanticId) {
      pointMap.set(v.semanticId, v);
    }
  }

  let totalErrorSum = 0;
  let totalEvaluatedCount = 0;
  const warnings: string[] = [];
  const anomaliesDetected: string[] = [];

  for (const view of views) {
    const viewLandmarks = landmarks.filter((l) => l.view === view);
    let viewSum = 0;
    let viewMax = 0;

    for (const lm of viewLandmarks) {
      const pt3D = pointMap.get(lm.semanticId);
      if (!pt3D) continue;

      const proj = project3DTo2D(pt3D, view, calibrationScaleMm);
      const dx = (proj.x - lm.x) * imageResolution;
      const dy = (proj.y - lm.y) * imageResolution;
      const errorPx = Math.sqrt(dx * dx + dy * dy);

      const item: ReprojectionErrorItem = {
        semanticId: lm.semanticId,
        label: lm.label,
        errorPixels: Number(errorPx.toFixed(1)),
        measured2D: { x: lm.x, y: lm.y },
        projected2D: { x: Number(proj.x.toFixed(4)), y: Number(proj.y.toFixed(4)) },
      };

      perViewReports[view].items.push(item);
      viewSum += errorPx;
      if (errorPx > viewMax) viewMax = errorPx;

      if (errorPx > 35) {
        anomaliesDetected.push(
          `High reprojection disparity on ${view.toUpperCase()} view: ${lm.label} (${errorPx.toFixed(1)}px)`
        );
      }
    }

    const count = perViewReports[view].items.length;
    perViewReports[view].pointsEvaluated = count;
    perViewReports[view].meanErrorPixels = count > 0 ? Number((viewSum / count).toFixed(1)) : 0;
    perViewReports[view].maxErrorPixels = Number(viewMax.toFixed(1));

    totalErrorSum += viewSum;
    totalEvaluatedCount += count;
  }

  const overallMean =
    totalEvaluatedCount > 0 ? Number((totalErrorSum / totalEvaluatedCount).toFixed(1)) : 0;

  let overallStatus: ValidationReport['overallStatus'] = 'valid';
  if (overallMean > 24) {
    overallStatus = 'warning';
    warnings.push('Mean reprojection disparity exceeds 24px threshold. Manual landmark refinement recommended.');
  } else if (overallMean > 38) {
    overallStatus = 'critical';
    warnings.push('High reprojection disparity (>38px). Review camera scale alignment and profile landmarks.');
  }

  // Check bilateral profile consistency
  const leftReport = perViewReports.left;
  const rightReport = perViewReports.right;
  let bothProfilesConsistent = true;
  if (leftReport.pointsEvaluated > 0 && rightReport.pointsEvaluated > 0) {
    const profileDiff = Math.abs(leftReport.meanErrorPixels - rightReport.meanErrorPixels);
    if (profileDiff > 12) {
      bothProfilesConsistent = false;
      warnings.push(`Asymmetry detected: Profile mean error differs by ${profileDiff.toFixed(1)}px between Left and Right views.`);
    }
  }

  // Check rear skull coverage
  const opisthocranion = pointMap.get('opisthocranion');
  const hasRear = !!opisthocranion;
  if (!hasRear) {
    warnings.push('Posterior cranium not fully constrained; rear occipital landmarks missing.');
  }

  const landmarkCoveragePct =
    landmarks.length > 0
      ? Number(((totalEvaluatedCount / landmarks.length) * 100).toFixed(1))
      : 0;

  const constrainedVertexPct =
    wireframe.totalPoints > 0
      ? Number(((wireframe.constrainedVerticesCount / wireframe.totalPoints) * 100).toFixed(1))
      : 0;

  return {
    overallConfidence: null, // Honest: no uncalibrated arbitrary percentage score
    overallStatus,
    reprojectionMeanError: overallMean,
    perViewReports,
    warnings,
    anomaliesDetected,
    coverageStats: {
      landmarkCoveragePct,
      constrainedVertexPct,
      rearOccipitalPresent: hasRear,
      bothProfilesConsistent,
    },
    generatedAt: new Date().toISOString(),
  };
}
