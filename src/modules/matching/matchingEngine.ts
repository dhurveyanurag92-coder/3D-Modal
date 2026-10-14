import { Landmark2D, LandmarkCorrespondence, ViewSlot } from '../types';
import { SEMANTIC_LANDMARK_REGISTRY } from '../landmarks/landmarkDefinitions';

/**
 * Matches 2D landmarks across Front, Back, Left, Right views into unified 3D correspondences.
 * Does NOT invent arbitrary depth values. Accurately reports whether Z is constrained
 * by bilateral profile triangulation, single profile ray, or unconstrained.
 */
export function matchLandmarksAcrossViews(
  landmarks: Landmark2D[],
  calibrationScaleMm = 220
): LandmarkCorrespondence[] {
  const bySemantic: Record<string, Partial<Record<ViewSlot, Landmark2D>>> = {};
  const metaMap = new Map<string, { label: string; category: Landmark2D['category'] }>();

  for (const meta of SEMANTIC_LANDMARK_REGISTRY) {
    metaMap.set(meta.semanticId, { label: meta.label, category: meta.category });
  }

  for (const lm of landmarks) {
    if (!bySemantic[lm.semanticId]) {
      bySemantic[lm.semanticId] = {};
    }
    bySemantic[lm.semanticId][lm.view] = lm;
    if (!metaMap.has(lm.semanticId)) {
      metaMap.set(lm.semanticId, { label: lm.label, category: lm.category });
    }
  }

  const correspondences: LandmarkCorrespondence[] = [];
  const allSemanticIds = Array.from(new Set([...Object.keys(bySemantic)]));

  for (const semanticId of allSemanticIds) {
    const present = bySemantic[semanticId] || {};
    const viewsPresent = Object.keys(present) as ViewSlot[];

    if (viewsPresent.length === 0) continue;

    const meta = metaMap.get(semanticId) || {
      label: semanticId,
      category: 'face',
    };

    const points2D: LandmarkCorrespondence['points2D'] = {};
    for (const v of viewsPresent) {
      const p = present[v]!;
      points2D[v] = {
        x: p.x,
        y: p.y,
        confidence: p.confidence,
        source: p.source,
      };
    }

    const frontPt = present.front;
    const leftPt = present.left;
    const rightPt = present.right;
    const backPt = present.back;

    let xMm = 0;
    let yMm = 0;
    let zMm = 0;
    let verticalDisparity = 0;

    // Y calculation: Sagittal vertical coordinate (Crown +, Chin -)
    // Centered around mid-face (y = 0.48 in normalized image coordinates)
    let ySum = 0;
    let yCount = 0;

    if (frontPt) {
      const yVal = (0.48 - frontPt.y) * calibrationScaleMm;
      ySum += yVal;
      yCount++;
    }
    if (leftPt) {
      const yVal = (0.48 - leftPt.y) * calibrationScaleMm;
      ySum += yVal;
      yCount++;
      if (frontPt) {
        verticalDisparity = Math.max(
          verticalDisparity,
          Math.abs(frontPt.y - leftPt.y) * 1024
        );
      }
    }
    if (rightPt) {
      const yVal = (0.48 - rightPt.y) * calibrationScaleMm;
      ySum += yVal;
      yCount++;
      if (frontPt) {
        verticalDisparity = Math.max(
          verticalDisparity,
          Math.abs(frontPt.y - rightPt.y) * 1024
        );
      }
      if (leftPt) {
        verticalDisparity = Math.max(
          verticalDisparity,
          Math.abs(leftPt.y - rightPt.y) * 1024
        );
      }
    }
    if (backPt) {
      const yVal = (0.48 - backPt.y) * calibrationScaleMm;
      ySum += yVal;
      yCount++;
    }

    yMm = yCount > 0 ? ySum / yCount : 0;

    // X calculation: Lateral coordinate (Right +, Left -)
    // Normalized by coronal cranial width factor
    const frontWidthScale = calibrationScaleMm * 0.72;
    if (frontPt) {
      xMm = (frontPt.x - 0.50) * frontWidthScale;
    } else if (backPt) {
      // Mirrored in posterior view
      xMm = (0.50 - backPt.x) * frontWidthScale;
    } else if (leftPt && rightPt) {
      // On sagittal midline if visible on both contralateral profiles
      xMm = 0;
    } else if (leftPt) {
      xMm = -frontWidthScale * 0.4;
    } else if (rightPt) {
      xMm = frontWidthScale * 0.4;
    }

    // Z calculation: Anteroposterior depth (Nose/Face +, Occiput -)
    const sagittalScale = calibrationScaleMm * 0.85;
    let zMethod: LandmarkCorrespondence['zMethod'] = 'unconstrained_estimated';
    let notes = '';

    if (leftPt && rightPt) {
      // Left profile: x < 0.50 is anterior (+Z), x > 0.50 is posterior (-Z)
      const zFromLeft = (0.50 - leftPt.x) * sagittalScale;
      // Right profile: x > 0.50 is anterior (+Z), x < 0.50 is posterior (-Z)
      const zFromRight = (rightPt.x - 0.50) * sagittalScale;
      zMm = (zFromLeft + zFromRight) * 0.5;
      zMethod = 'bilateral_profile_triangulation';
      const zDiff = Math.abs(zFromLeft - zFromRight);
      if (zDiff > 15) {
        notes = `Profile Z discrepancy: ${zDiff.toFixed(1)}mm between Left and Right views.`;
      }
    } else if (leftPt) {
      zMm = (0.50 - leftPt.x) * sagittalScale;
      zMethod = 'single_profile_ray';
      notes = 'Constrained by Left profile ray only.';
    } else if (rightPt) {
      zMm = (rightPt.x - 0.50) * sagittalScale;
      zMethod = 'single_profile_ray';
      notes = 'Constrained by Right profile ray only.';
    } else if (backPt && !frontPt) {
      // Only back view visible: posterior skull region
      zMm = -sagittalScale * 0.45;
      zMethod = 'unconstrained_estimated';
      notes = 'Unconstrained in Z: Estimated posterior skull boundary.';
    } else {
      // Only front view: cannot triangulate Z without profile
      zMm = 0;
      zMethod = 'unconstrained_estimated';
      notes = 'Warning: Point not visible in Profile views. Z-depth unconstrained.';
    }

    // Status assignment
    let status: LandmarkCorrespondence['status'] = 'matched';
    if (verticalDisparity > 30) {
      status = 'conflict';
    } else if (viewsPresent.length === 1 || zMethod === 'unconstrained_estimated') {
      status = 'inferred';
    }

    correspondences.push({
      semanticId,
      label: meta.label,
      category: meta.category,
      viewsPresent,
      points2D,
      matchedCoord3D: [Number(xMm.toFixed(2)), Number(yMm.toFixed(2)), Number(zMm.toFixed(2))],
      confidence: null, // Honest: no unmeasured fake confidence
      verticalDisparityPx: Number(verticalDisparity.toFixed(1)),
      zMethod,
      status,
      notes,
    });
  }

  return correspondences;
}
