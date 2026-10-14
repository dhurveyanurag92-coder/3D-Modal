import { Landmark2D, SilhouetteData, ViewSlot } from '../types';
import { SEMANTIC_LANDMARK_REGISTRY } from './landmarkDefinitions';

export interface AutoRefineResult {
  refinedLandmarks: Landmark2D[];
  changesCount: number;
  summary: string[];
}

/**
 * Intelligent Software Assistance (Auto-Refine / Snap)
 * Helps the user fix landmark alignment issues on request:
 * 1. Enforces bilateral symmetry on Front view (matching eye heights, equalizing distance from facial midline).
 * 2. Aligns sagittal midline landmarks along a true vertical axis.
 * 3. Resolves vertical disparities between orthogonal views (Front vs Profile).
 * 4. Snaps outer landmarks to silhouette bounds if available.
 * 
 * Crucial: Only invoked on explicit user button click, with full undo capability.
 */
export function autoRefineLandmarks(
  landmarks: Landmark2D[],
  silhouettes?: Partial<Record<ViewSlot, SilhouetteData>>
): AutoRefineResult {
  const updated = landmarks.map((l) => ({ ...l }));
  const summary: string[] = [];
  let changesCount = 0;

  const getLm = (id: string, view: ViewSlot) =>
    updated.find((l) => l.semanticId === id && l.view === view);

  // 1. Sagittal Midline Alignment for Front View
  const frontMidlineIds = [
    'vertex',
    'forehead_center',
    'glabella',
    'nasion',
    'pronasale',
    'subnasale',
    'lip_top',
    'stomion',
    'lip_bottom',
    'gnathion',
    'cervical_base',
  ];

  const frontMidlinePoints = frontMidlineIds
    .map((id) => getLm(id, 'front'))
    .filter((p): p is Landmark2D => !!p);

  let midlineX = 0.50;
  if (frontMidlinePoints.length > 0) {
    const xVals = frontMidlinePoints.map((p) => p.x).sort((a, b) => a - b);
    midlineX = xVals[Math.floor(xVals.length / 2)];
  }

  let midlineAdjusted = 0;
  for (const pt of frontMidlinePoints) {
    if (Math.abs(pt.x - midlineX) > 0.003) {
      pt.x = Number(midlineX.toFixed(4));
      pt.source = 'auto_assisted';
      midlineAdjusted++;
      changesCount++;
    }
  }
  if (midlineAdjusted > 0) {
    summary.push(`Centered ${midlineAdjusted} sagittal midline landmarks on vertical axis (X=${midlineX})`);
  }

  // 2. Bilateral Symmetry Alignment on Front View
  const bilateralPairs: Array<[string, string]> = [
    ['eye_outer_l', 'eye_outer_r'],
    ['pupil_l', 'pupil_r'],
    ['eye_inner_l', 'eye_inner_r'],
    ['eye_top_l', 'eye_top_r'],
    ['eye_bottom_l', 'eye_bottom_r'],
    ['brow_inner_l', 'brow_inner_r'],
    ['brow_peak_l', 'brow_peak_r'],
    ['brow_outer_l', 'brow_outer_r'],
    ['alare_left', 'alare_right'],
    ['mouth_corner_l', 'mouth_corner_r'],
    ['gonion_l', 'gonion_r'],
    ['temple_left', 'temple_right'],
    ['zygion_left', 'zygion_right'],
    ['ear_top_l', 'ear_top_r'],
    ['tragus_l', 'tragus_r'],
    ['ear_lobule_l', 'ear_lobule_r'],
  ];

  let pairsSymmetrized = 0;
  for (const [idL, idR] of bilateralPairs) {
    const pL = getLm(idL, 'front');
    const pR = getLm(idR, 'front');
    if (!pL || !pR) continue;

    let modified = false;

    // A. Vertical leveling (equalize Y)
    const avgY = (pL.y + pR.y) / 2;
    if (Math.abs(pL.y - avgY) > 0.002 || Math.abs(pR.y - avgY) > 0.002) {
      pL.y = Number(avgY.toFixed(4));
      pR.y = Number(avgY.toFixed(4));
      modified = true;
    }

    // B. Horizontal symmetric distance from midline
    const distL = Math.abs(midlineX - pL.x);
    const distR = Math.abs(pR.x - midlineX);
    const avgDist = (distL + distR) / 2;

    const expectedXL = Number((midlineX - avgDist).toFixed(4));
    const expectedXR = Number((midlineX + avgDist).toFixed(4));

    if (Math.abs(pL.x - expectedXL) > 0.002 || Math.abs(pR.x - expectedXR) > 0.002) {
      pL.x = expectedXL;
      pR.x = expectedXR;
      modified = true;
    }

    if (modified) {
      pL.source = 'auto_assisted';
      pR.source = 'auto_assisted';
      pairsSymmetrized++;
      changesCount += 2;
    }
  }

  if (pairsSymmetrized > 0) {
    summary.push(`Symmetrized ${pairsSymmetrized} bilateral landmark pairs (equalized heights & widths)`);
  }

  // 3. Epipolar Vertical Disparity Alignment across Orthogonal Views
  let disparityCorrections = 0;
  const uniqueSemanticIds = Array.from(new Set(updated.map((l) => l.semanticId)));
  for (const semId of uniqueSemanticIds) {
    const front = getLm(semId, 'front');
    const left = getLm(semId, 'left');
    const right = getLm(semId, 'right');

    const viewsWithY = [front, left, right].filter((p): p is Landmark2D => !!p);
    if (viewsWithY.length > 1) {
      const avgY = viewsWithY.reduce((sum, p) => sum + p.y, 0) / viewsWithY.length;
      for (const p of viewsWithY) {
        if (Math.abs(p.y - avgY) > 0.005) {
          p.y = Number(avgY.toFixed(4));
          p.source = 'auto_assisted';
          disparityCorrections++;
          changesCount++;
        }
      }
    }
  }

  if (disparityCorrections > 0) {
    summary.push(`Aligned ${disparityCorrections} profile view heights to match Front epipolar level`);
  }

  // 4. Snapping Cranium & Jaw to Silhouette (if silhouette is present)
  if (silhouettes?.front?.horizontalSpans && silhouettes.front.horizontalSpans.length > 0) {
    const spans = silhouettes.front.horizontalSpans;
    const minY = spans[0].y;
    const maxY = spans[spans.length - 1].y;

    const vertex = getLm('vertex', 'front');
    if (vertex && Math.abs(vertex.y - minY) > 0.02) {
      vertex.y = Number(Math.max(0.05, minY + 0.01).toFixed(4));
      vertex.source = 'auto_assisted';
      changesCount++;
      summary.push('Snapped Cranium Crown to detected top silhouette contour');
    }

    const chin = getLm('gnathion', 'front');
    if (chin && Math.abs(chin.y - maxY) > 0.04) {
      chin.y = Number(Math.min(0.95, maxY - 0.02).toFixed(4));
      chin.source = 'auto_assisted';
      changesCount++;
      summary.push('Snapped Chin boundary to lower silhouette curve');
    }
  }

  if (summary.length === 0) {
    summary.push('Landmarks are already well-balanced; no major corrections required.');
  }

  return {
    refinedLandmarks: updated,
    changesCount,
    summary,
  };
}
