import {
  CephalometricMeasurements,
  Landmark2D,
  ProjectState,
  ValidationReport,
  WireframeModel,
} from '../types';

/**
 * Exports hollow wireframe as standard Wavefront .OBJ file with line elements ('l v1 v2')
 */
export function exportToOBJ(wireframe: WireframeModel, projectName = 'Head_Wireframe'): string {
  const lines: string[] = [
    `# Multi-View 3D Head Wireframe Reconstruction Studio`,
    `# Project: ${projectName}`,
    `# Generated: ${wireframe.generatedAt}`,
    `# Coordinate convention: Y Up (+), X Right (+), Z Front (+)`,
    `# Units: Millimeters (mm)`,
    `# Structure: Hollow line-and-point wireframe (Vertices & Line segments only)`,
    `# Vertices: ${wireframe.vertices.length}`,
    `# Edges: ${wireframe.edges.length}`,
    `o ${projectName}_Wireframe`,
    '',
  ];

  // Map vertex id to 1-based OBJ index
  const indexMap = new Map<string, number>();

  for (let i = 0; i < wireframe.vertices.length; i++) {
    const v = wireframe.vertices[i];
    indexMap.set(v.id, i + 1);
    lines.push(`v ${v.x.toFixed(4)} ${v.y.toFixed(4)} ${v.z.toFixed(4)}`);
  }

  lines.push('');
  lines.push('# Line segments connecting vertices');

  // Group edges by category for clarity
  for (const edge of wireframe.edges) {
    const idx1 = indexMap.get(edge.sourceId);
    const idx2 = indexMap.get(edge.targetId);
    if (idx1 !== undefined && idx2 !== undefined) {
      lines.push(`l ${idx1} ${idx2}`);
    }
  }

  return lines.join('\n');
}

/**
 * Exports hollow wireframe as Stanford ASCII .PLY file with edges
 */
export function exportToPLY(wireframe: WireframeModel, projectName = 'Head_Wireframe'): string {
  const lines: string[] = [
    'ply',
    'format ascii 1.0',
    `comment Multi-View 3D Head Wireframe - ${projectName}`,
    `element vertex ${wireframe.vertices.length}`,
    'property float x',
    'property float y',
    'property float z',
    `element edge ${wireframe.edges.length}`,
    'property int vertex1',
    'property int vertex2',
    'end_header',
  ];

  const indexMap = new Map<string, number>();

  for (let i = 0; i < wireframe.vertices.length; i++) {
    const v = wireframe.vertices[i];
    indexMap.set(v.id, i); // 0-indexed in PLY
    lines.push(`${v.x.toFixed(4)} ${v.y.toFixed(4)} ${v.z.toFixed(4)}`);
  }

  for (const edge of wireframe.edges) {
    const idx1 = indexMap.get(edge.sourceId);
    const idx2 = indexMap.get(edge.targetId);
    if (idx1 !== undefined && idx2 !== undefined) {
      lines.push(`${idx1} ${idx2}`);
    }
  }

  return lines.join('\n');
}

/**
 * Triggers a client-side file download for any string / blob content
 */
export function triggerDownload(content: string, filename: string, mimeType: string) {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Exports 3D point cloud coordinates to CSV
 */
export function exportCoordinatesToCSV(wireframe: WireframeModel): string {
  const rows: string[] = [
    'ID,Semantic_Label,Category,X,Y,Z,Unit,Confidence,Provenance',
  ];

  for (const v of wireframe.vertices) {
    const confStr = v.confidence !== null && v.confidence !== undefined
      ? v.confidence.toFixed(2)
      : 'unmeasured';
    rows.push(
      `"${v.id}","${v.label}","${v.category}",${v.x.toFixed(2)},${v.y.toFixed(2)},${v.z.toFixed(2)},"${wireframe.scaleUnit}","${confStr}","${v.provenance}"`
    );
  }

  return rows.join('\n');
}

/**
 * Exports human-readable validation & cephalometric report to text
 */
export function exportReportToText(
  validation: ValidationReport,
  measurements: CephalometricMeasurements | null
): string {
  const lines: string[] = [
    '========================================================================',
    'MULTI-VIEW 3D HEAD WIREFRAME RECONSTRUCTION REPORT',
    '========================================================================',
    `Generated At: ${validation.generatedAt}`,
    `Overall Status: ${validation.overallStatus.toUpperCase()}`,
    `Overall Confidence Rating: ${validation.overallConfidence !== null ? `${validation.overallConfidence}%` : 'Not Measured (Uncalibrated Baseline)'}`,
    `Mean 4-View Reprojection Disparity: ${validation.reprojectionMeanError} px`,
    `Constrained Vertex Coverage: ${validation.coverageStats.constrainedVertexPct}%`,
    `Bilateral Profiles Consistent: ${validation.coverageStats.bothProfilesConsistent ? 'Yes' : 'No (Disparity Discrepancy)'}`,
    '',
    '------------------------------------------------------------------------',
    '1. CEPHALOMETRIC MEASUREMENTS',
    '------------------------------------------------------------------------',
  ];

  if (measurements) {
    lines.push(`Head Height (Vertex to Gnathion): ${measurements.headHeightMm}`);
    lines.push(`Head Width (Biparietal Breadth):   ${measurements.headWidthMm}`);
    lines.push(`Head Depth (Glabella-Opisthocranion): ${measurements.headDepthMm}`);
    lines.push(`Cranial Index (Width / Depth * 100): ${measurements.cranialIndex} -> ${measurements.cranialClassification}`);
    lines.push(`Facial Index (Height / Width * 100):  ${measurements.facialIndex}`);
    lines.push(`Intercanthal Distance:               ${measurements.intercanthalDistanceMm}`);
    lines.push(`Nasal Prominence Depth:              ${measurements.noseProminenceMm}`);
    lines.push(`Bigonial Mandibular Width:           ${measurements.jawWidthMm}`);
    lines.push(`Physical Calibration Status:         ${measurements.isCalibrated ? 'User Calibrated' : 'Normalized Uncalibrated'}`);
    lines.push(`Scale Reference:                     ${measurements.calibrationReference}`);
  } else {
    lines.push('Cephalometric measurements pending coordinate solve.');
  }

  lines.push('');
  lines.push('------------------------------------------------------------------------');
  lines.push('2. FOUR-VIEW REPROJECTION ERROR DISPARITY');
  lines.push('------------------------------------------------------------------------');

  for (const [view, rep] of Object.entries(validation.perViewReports)) {
    lines.push(`[${view.toUpperCase()} VIEW]`);
    lines.push(`  Points Evaluated:   ${rep.pointsEvaluated}`);
    lines.push(`  Mean Reprojection:  ${rep.meanErrorPixels} px`);
    lines.push(`  Peak Disparity:     ${rep.maxErrorPixels} px`);
  }

  if (validation.warnings.length > 0) {
    lines.push('');
    lines.push('------------------------------------------------------------------------');
    lines.push('3. PIPELINE WARNINGS & CALIBRATION NOTES');
    lines.push('------------------------------------------------------------------------');
    for (const w of validation.warnings) {
      lines.push(`- WARNING: ${w}`);
    }
  }

  lines.push('');
  lines.push('========================================================================');
  lines.push('End of Report');
  return lines.join('\n');
}

/**
 * Creates a complete JSON project archive bundle
 */
export function exportProjectBundleJSON(projectState: ProjectState): string {
  const isStale = Object.values(projectState.stages).some((s) => s.status === 'stale');

  const bundle = {
    manifest: {
      studio: 'Multi-View 3D Head Wireframe Reconstruction Studio',
      version: projectState.version,
      exportedAt: new Date().toISOString(),
      projectName: projectState.projectName,
      isStale,
      methods: {
        silhouette: 'Local Color-Contrast Euclidean Distance Thresholding',
        depth: 'Local Algorithmic Heuristic Fallback (Radial Curvature Projection)',
        normals: 'Dual-Axis Sobel Gradient Convolution in Tangent Space',
        wireframe: 'Multi-View Silhouette-Constrained Cross-Section Rings & Anatomical Loops',
      },
      scaleUnits: projectState.wireframe?.scaleUnit || 'arbitrary_normalized',
      scaleAssumption: projectState.wireframe?.scaleAssumption || 'Uncalibrated',
      stagesCompleted: Object.values(projectState.stages).filter(
        (s) => s.status === 'completed'
      ).length,
      totalVertices: projectState.wireframe?.totalPoints || 0,
      constrainedVertices: projectState.wireframe?.constrainedVerticesCount || 0,
      interpolatedVertices: projectState.wireframe?.interpolatedVerticesCount || 0,
      totalEdges: projectState.wireframe?.totalEdges || 0,
    },
    images: {
      slots: Object.keys(projectState.images),
      versions: Object.fromEntries(
        Object.entries(projectState.images).map(([k, v]) => [k, { version: v.version, name: v.name, isValid: v.isValid }])
      ),
      transforms: Object.fromEntries(
        Object.entries(projectState.images).map(([k, v]) => [k, { ...v.transform, anchors: v.anchors }])
      ),
    },
    stages: projectState.stages,
    landmarks: projectState.landmarks,
    correspondences: projectState.correspondences,
    measurements: projectState.measurements,
    validationReport: projectState.validationReport,
    wireframe: projectState.wireframe,
  };

  return JSON.stringify(bundle, null, 2);
}
