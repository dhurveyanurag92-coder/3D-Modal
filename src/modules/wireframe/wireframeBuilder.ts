import {
  Edge3D,
  Point3D,
  SilhouetteData,
  ViewSlot,
  WireframeDensity,
  WireframeModel,
} from '../types';

export interface WireframeBuildOptions {
  density?: WireframeDensity;
  customRingsCount?: number;
  customMeridiansCount?: number;
  includeFacialLoops?: boolean;
  includeSkullRings?: boolean;
  includeMeridians?: boolean;
  calibrationScaleMm?: number;
  isCustomCalibrated?: boolean;
  silhouettes?: Partial<Record<ViewSlot, SilhouetteData>>;
  imageVersions?: Record<ViewSlot, string>;
}

/**
 * Builds an editable, hollow 3D head wireframe (vertices + line edges only, no solid faces)
 * derived from actual multi-view input silhouettes and triangulated landmarks.
 */
export function buildHeadWireframe(
  anchorPoints: Point3D[],
  options?: WireframeBuildOptions
): WireframeModel {
  const density: WireframeDensity = options?.density || 'medium';
  const ringsCount =
    options?.customRingsCount ||
    (density === 'low' ? 10 : density === 'high' ? 22 : 15);
  const meridiansCount =
    options?.customMeridiansCount ||
    (density === 'low' ? 12 : density === 'high' ? 24 : 16);

  const calibrationScaleMm = options?.calibrationScaleMm || 220;
  const isCustomCalibrated = options?.isCustomCalibrated || false;
  const silhouettes = options?.silhouettes || {};

  const frontWidthScale = calibrationScaleMm * 0.72;
  const sagittalScale = calibrationScaleMm * 0.85;

  const vertices: Point3D[] = [];
  const edges: Edge3D[] = [];
  const seenVertexIds = new Set<string>();
  const seenEdgeIds = new Set<string>();

  // Map of anchor points by semanticId for fast lookup
  const anchorMap = new Map<string, Point3D>();
  for (const pt of anchorPoints) {
    // If pt is an already generated ring vertex, skip it to prevent duplication on rebuild
    if (pt.category === 'skull_ring' || pt.id.startsWith('ring_')) {
      continue;
    }
    if (!seenVertexIds.has(pt.id)) {
      seenVertexIds.add(pt.id);
      vertices.push({ ...pt });
      if (pt.semanticId) {
        anchorMap.set(pt.semanticId, pt);
      }
    }
  }

  // 1. Determine bounding height span from landmarks or default cranial bounds
  const vertexPt = anchorMap.get('vertex');
  const gnathionPt = anchorMap.get('gnathion');
  const cervicalPt = anchorMap.get('cervical_base');

  const yTop = vertexPt ? vertexPt.y : calibrationScaleMm * 0.40;
  const yBottom = cervicalPt
    ? cervicalPt.y
    : gnathionPt
    ? gnathionPt.y - 25
    : -calibrationScaleMm * 0.50;

  const ringYStep = (yTop - yBottom) / (ringsCount + 1);

  // Helper to query silhouette horizontal span at a given world Y
  const getSpanAtY = (sil: SilhouetteData | undefined, worldY: number) => {
    if (!sil || !sil.horizontalSpans || sil.horizontalSpans.length === 0) return null;
    // Map world Y back to normalized image Y (where y = (0.48 - imgY) * calibrationScaleMm)
    const normImgY = 0.48 - worldY / calibrationScaleMm;
    if (normImgY < 0.05 || normImgY > 0.95) return null;

    // Find nearest span in horizontalSpans
    let closestSpan = sil.horizontalSpans[0];
    let minDiff = Math.abs(closestSpan.y - normImgY);
    for (let i = 1; i < sil.horizontalSpans.length; i++) {
      const diff = Math.abs(sil.horizontalSpans[i].y - normImgY);
      if (diff < minDiff) {
        minDiff = diff;
        closestSpan = sil.horizontalSpans[i];
      }
    }

    if (minDiff > 0.08) return null;
    return closestSpan;
  };

  const frontSil = silhouettes.front;
  const leftSil = silhouettes.left;
  const rightSil = silhouettes.right;

  // Grid for ring vertex IDs to connect meridians: [ringIndex][meridianIndex]
  const ringGrid: string[][] = [];

  if (options?.includeSkullRings !== false) {
    for (let r = 0; r < ringsCount; r++) {
      const y = yTop - (r + 1) * ringYStep;
      const normalizedHeight = (y - yBottom) / (yTop - yBottom); // 1.0 down to 0.0

      // Query input silhouette spans
      const frontSpan = getSpanAtY(frontSil, y);
      const leftSpan = getSpanAtY(leftSil, y);
      const rightSpan = getSpanAtY(rightSil, y);

      let rx: number;
      let rz: number;
      let xCenter = 0;
      let zCenter = 0;
      let isConstrainedBySilhouette = false;

      if (frontSpan && (leftSpan || rightSpan)) {
        // True dual-axis input constraint!
        const xMin = (frontSpan.minX - 0.50) * frontWidthScale;
        const xMax = (frontSpan.maxX - 0.50) * frontWidthScale;
        rx = Math.max(15, (xMax - xMin) * 0.5);
        xCenter = (xMin + xMax) * 0.5;

        const profSpan = leftSpan || rightSpan!;
        if (leftSpan) {
          // Left view: minX is anterior (+Z), maxX is posterior (-Z)
          const zMax = (0.50 - leftSpan.minX) * sagittalScale;
          const zMin = (0.50 - leftSpan.maxX) * sagittalScale;
          rz = Math.max(15, (zMax - zMin) * 0.5);
          zCenter = (zMin + zMax) * 0.5;
        } else {
          // Right view: maxX is anterior (+Z), minX is posterior (-Z)
          const zMax = (rightSpan!.maxX - 0.50) * sagittalScale;
          const zMin = (rightSpan!.minX - 0.50) * sagittalScale;
          rz = Math.max(15, (zMax - zMin) * 0.5);
          zCenter = (zMin + zMax) * 0.5;
        }
        isConstrainedBySilhouette = true;
      } else if (frontSpan) {
        // Only front silhouette available
        const xMin = (frontSpan.minX - 0.50) * frontWidthScale;
        const xMax = (frontSpan.maxX - 0.50) * frontWidthScale;
        rx = Math.max(15, (xMax - xMin) * 0.5);
        xCenter = (xMin + xMax) * 0.5;
        rz = rx * 1.15; // Ellipsoidal cranial proportion
        zCenter = -10;
        isConstrainedBySilhouette = true;
      } else if (leftSpan || rightSpan) {
        // Only profile silhouette available
        const profSpan = leftSpan || rightSpan!;
        const zMax = (0.50 - profSpan.minX) * sagittalScale;
        const zMin = (0.50 - profSpan.maxX) * sagittalScale;
        rz = Math.max(15, (zMax - zMin) * 0.5);
        zCenter = (zMin + zMax) * 0.5;
        rx = rz * 0.85;
        isConstrainedBySilhouette = true;
      } else {
        // Geometric starter interpolation fallbacks based on normalized cranial height
        if (normalizedHeight > 0.80) {
          const dome = Math.sin((normalizedHeight - 0.80) * Math.PI * 2.5);
          rx = 40 + (1 - dome) * 25;
          rz = 48 + (1 - dome) * 32;
          zCenter = -15;
        } else if (normalizedHeight > 0.40) {
          rx = 68;
          rz = 82;
          zCenter = -8;
        } else if (normalizedHeight > 0.18) {
          const taper = (0.40 - normalizedHeight) / 0.22;
          rx = 65 - taper * 25;
          rz = 78 - taper * 22;
          zCenter = -8 + taper * 8;
        } else {
          rx = 38;
          rz = 42;
          zCenter = -18;
        }
      }

      const ringRow: string[] = [];

      for (let m = 0; m < meridiansCount; m++) {
        const theta = (m / meridiansCount) * Math.PI * 2;
        // theta = 0 points anteriorly (+Z), theta = PI/2 points to left (-X)
        const vx = xCenter + rx * Math.sin(theta);
        const vz = zCenter + rz * Math.cos(theta);

        const vId = `ring_${r}_m_${m}`;
        ringRow.push(vId);

        if (!seenVertexIds.has(vId)) {
          seenVertexIds.add(vId);
          vertices.push({
            id: vId,
            label: `Ring ${r + 1} (${Math.round(theta * (180 / Math.PI))}°)`,
            category: 'skull_ring',
            x: Number(vx.toFixed(2)),
            y: Number(y.toFixed(2)),
            z: Number(vz.toFixed(2)),
            confidence: null,
            provenance: isConstrainedBySilhouette
              ? 'silhouette_constrained'
              : 'spline_interpolation',
            locked: false,
          });
        }

        // Edge connecting consecutive vertices in the horizontal ring
        const nextM = (m + 1) % meridiansCount;
        const eId = `e_ring_${r}_${m}_${nextM}`;
        if (!seenEdgeIds.has(eId)) {
          seenEdgeIds.add(eId);
          edges.push({
            id: eId,
            sourceId: vId,
            targetId: `ring_${r}_m_${nextM}`,
            category: 'skull_ring',
          });
        }
      }

      ringGrid.push(ringRow);
    }
  }

  // 2. Build Longitudinal Meridians connecting vertically adjacent rings
  if (options?.includeMeridians !== false && ringGrid.length > 1) {
    for (let r = 0; r < ringGrid.length - 1; r++) {
      for (let m = 0; m < meridiansCount; m++) {
        const eId = `e_meridian_${r}_${r + 1}_m_${m}`;
        if (!seenEdgeIds.has(eId)) {
          seenEdgeIds.add(eId);
          edges.push({
            id: eId,
            sourceId: ringGrid[r][m],
            targetId: ringGrid[r + 1][m],
            category: 'meridian',
          });
        }
      }
    }
  }

  // 3. Build Semantic Facial & Cranial Loops from anchor points
  if (options?.includeFacialLoops !== false) {
    const addLoop = (pointIds: string[], loopCategory: Edge3D['category'] = 'facial_loop') => {
      for (let i = 0; i < pointIds.length - 1; i++) {
        const p1 = anchorMap.get(pointIds[i]);
        const p2 = anchorMap.get(pointIds[i + 1]);
        if (p1 && p2) {
          const eId = `e_loop_${pointIds[i]}_${pointIds[i + 1]}`;
          if (!seenEdgeIds.has(eId)) {
            seenEdgeIds.add(eId);
            edges.push({
              id: eId,
              sourceId: `pt_${pointIds[i]}`,
              targetId: `pt_${pointIds[i + 1]}`,
              category: loopCategory,
            });
          }
        }
      }
    };

    // Sagittal Midline Profile
    addLoop([
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
    ]);

    // Posterior Sagittal Contour
    addLoop(['vertex', 'opisthocranion', 'inion', 'cervical_base']);

    // Eye Orbit Left
    addLoop(['eye_inner_l', 'eye_top_l', 'eye_outer_l', 'eye_bottom_l', 'eye_inner_l']);

    // Eye Orbit Right
    addLoop(['eye_inner_r', 'eye_top_r', 'eye_outer_r', 'eye_bottom_r', 'eye_inner_r']);

    // Eyebrow Arches
    addLoop(['glabella', 'brow_inner_l', 'brow_peak_l', 'brow_outer_l']);
    addLoop(['glabella', 'brow_inner_r', 'brow_peak_r', 'brow_outer_r']);

    // Nose Wing Contour
    addLoop(['alare_left', 'pronasale', 'alare_right', 'subnasale', 'alare_left']);

    // Mouth Loop
    addLoop(['mouth_corner_l', 'lip_top', 'mouth_corner_r', 'lip_bottom', 'mouth_corner_l']);

    // Jawline & Chin Contour
    addLoop(['gonion_l', 'gnathion', 'gonion_r']);

    // Ear Left & Right
    addLoop(['ear_top_l', 'tragus_l', 'ear_lobule_l']);
    addLoop(['ear_top_r', 'tragus_r', 'ear_lobule_r']);
  }

  // Calculate bounding box
  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;
  let minZ = Infinity, maxZ = -Infinity;

  let constrainedCount = 0;
  let interpolatedCount = 0;

  for (const v of vertices) {
    if (v.x < minX) minX = v.x;
    if (v.x > maxX) maxX = v.x;
    if (v.y < minY) minY = v.y;
    if (v.y > maxY) maxY = v.y;
    if (v.z < minZ) minZ = v.z;
    if (v.z > maxZ) maxZ = v.z;

    if (
      v.provenance === 'triangulation' ||
      v.provenance === 'profile_ray' ||
      v.provenance === 'silhouette_constrained' ||
      v.provenance === 'landmark_constrained' ||
      v.provenance === 'manual_edit'
    ) {
      constrainedCount++;
    } else {
      interpolatedCount++;
    }
  }

  const defaultVersions: Record<ViewSlot, string> = {
    front: options?.imageVersions?.front || 'default',
    back: options?.imageVersions?.back || 'default',
    left: options?.imageVersions?.left || 'default',
    right: options?.imageVersions?.right || 'default',
  };

  return {
    vertices,
    edges,
    ringsCount,
    meridiansCount,
    density,
    constrainedVerticesCount: constrainedCount,
    interpolatedVerticesCount: interpolatedCount,
    inputImageVersions: defaultVersions,
    scaleUnit: isCustomCalibrated ? 'user_calibrated_mm' : 'arbitrary_normalized',
    scaleAssumption: isCustomCalibrated
      ? `Calibrated physical scale (${calibrationScaleMm} mm)`
      : 'Normalized anatomical units (~220mm reference cranial height standard)',
    boundingBox: {
      min: [
        Number((minX === Infinity ? 0 : minX).toFixed(2)),
        Number((minY === Infinity ? 0 : minY).toFixed(2)),
        Number((minZ === Infinity ? 0 : minZ).toFixed(2)),
      ],
      max: [
        Number((maxX === -Infinity ? 0 : maxX).toFixed(2)),
        Number((maxY === -Infinity ? 0 : maxY).toFixed(2)),
        Number((maxZ === -Infinity ? 0 : maxZ).toFixed(2)),
      ],
      size: [
        Number((maxX - minX || 0).toFixed(2)),
        Number((maxY - minY || 0).toFixed(2)),
        Number((maxZ - minZ || 0).toFixed(2)),
      ],
    },
    totalPoints: vertices.length,
    totalEdges: edges.length,
    generatedAt: new Date().toISOString(),
  };
}
