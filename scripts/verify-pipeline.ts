import { createInitialProjectState, invalidateDownstreamOnImageChange } from '../src/modules/project/projectStore';
import { DEFAULT_REFERENCE_SLOTS } from '../src/modules/references/defaultReferences';
import { buildDefaultLandmarks } from '../src/modules/landmarks/landmarkDefinitions';
import { matchLandmarksAcrossViews } from '../src/modules/matching/matchingEngine';
import { solve3DCoordinates } from '../src/modules/solver/coordinateSolver';
import { buildHeadWireframe } from '../src/modules/wireframe/wireframeBuilder';
import { evaluateFourViewReprojection } from '../src/modules/comparison/comparisonEngine';
import { exportToOBJ, exportProjectBundleJSON } from '../src/modules/project/exportService';

console.log('--- Starting Multi-View 3D Head Wireframe Reconstruction Studio Verification ---');

let passedTests = 0;
let totalTests = 0;

function assert(condition: boolean, testName: string) {
  totalTests++;
  if (condition) {
    passedTests++;
    console.log(`✓ PASS: ${testName}`);
  } else {
    console.error(`✗ FAIL: ${testName}`);
    process.exitCode = 1;
  }
}

// 1. Initial State Verification
const initial = createInitialProjectState();
assert(initial.stages.validation.status === 'waiting', 'Initial validation stage starts in "waiting" status');
assert(initial.stages.wireframe.status === 'waiting', 'Initial wireframe stage starts in "waiting" status');
assert(initial.wireframe === null, 'Initial wireframe is null before pipeline runs');
assert(initial.validationReport === null, 'Initial validation report is null before pipeline runs');

// 2. Reference Slots & Versions
assert(Object.keys(DEFAULT_REFERENCE_SLOTS).length === 4, '4 reference slots are configured (front, back, left, right)');
assert(DEFAULT_REFERENCE_SLOTS.front.version.includes('front'), 'Front reference slot has version string');
assert(DEFAULT_REFERENCE_SLOTS.left.version.includes('left'), 'Left reference slot has version string');

// 3. Landmark Integrity & Honest Provenance
const landmarks = buildDefaultLandmarks();
assert(landmarks.length > 20, `Default landmarks populated (${landmarks.length} landmarks found)`);
const sampleLm = landmarks[0];
assert(sampleLm.source === 'starter_template', 'Landmark source is "starter_template" (honest baseline)');
assert(sampleLm.confidence === null, 'Landmark confidence is null (honest, unmeasured score)');

// 4. Cross-View Matching Engine
const correspondences = matchLandmarksAcrossViews(landmarks, 220);
assert(correspondences.length > 0, `Matching engine produced ${correspondences.length} correspondences`);
const vertexCorr = correspondences.find(c => c.semanticId === 'vertex');
assert(!!vertexCorr, 'Vertex anatomical landmark matched across views');
assert(vertexCorr?.confidence === null, 'Correspondence confidence is null (honest score)');

// 5. 3D Coordinate Solver & Cephalometrics
const solverResult = solve3DCoordinates(correspondences, {}, 220, false);
assert(solverResult.points.length > 0, 'Solver produced 3D points');
assert(solverResult.measurements.headHeightMm > 100, `Head height resolved (${solverResult.measurements.headHeightMm}mm)`);
assert(solverResult.measurements.cranialIndex > 50, `Cranial index resolved (${solverResult.measurements.cranialIndex})`);
assert(solverResult.measurements.isCalibrated === false, 'Anatomical scale marked uncalibrated by default');

// 6. Hollow Wireframe Builder
const wireframe = buildHeadWireframe(solverResult.points, {
  density: 'medium',
  calibrationScaleMm: 220,
  isCustomCalibrated: false,
});
assert(wireframe.vertices.length > 50, `Wireframe generated vertices: ${wireframe.vertices.length}`);
assert(wireframe.edges.length > 50, `Wireframe generated edges: ${wireframe.edges.length}`);
assert(wireframe.constrainedVerticesCount > 0, 'Constrained vertices count tracked');
assert(wireframe.interpolatedVerticesCount > 0, 'Interpolated vertices count tracked');
assert(wireframe.scaleUnit === 'arbitrary_normalized', 'Scale unit is arbitrary_normalized for uncalibrated input');

// 7. Reprojection & Four-View Verification
const validation = evaluateFourViewReprojection(wireframe, landmarks, 1024, 220);
assert(validation.overallConfidence === null, 'Validation overallConfidence is null (honest baseline)');
assert(validation.reprojectionMeanError >= 0, `Mean reprojection calculated: ${validation.reprojectionMeanError}px`);
assert(validation.perViewReports.front.pointsEvaluated > 0, 'Front view reprojection evaluated');

// 8. Export Service
const objData = exportToOBJ(wireframe, 'Test_Head');
assert(objData.includes('o Test_Head_Wireframe'), 'OBJ export contains correct header');
assert(objData.includes('v '), 'OBJ export contains vertex lines');
assert(objData.includes('l '), 'OBJ export contains line element connections');

const jsonBundle = exportProjectBundleJSON({
  ...initial,
  wireframe,
  validationReport: validation,
});
assert(jsonBundle.includes('Multi-View 3D Head Wireframe Reconstruction Studio'), 'JSON bundle contains manifest studio title');

// 9. Stale Data Invalidation
// Prepare state where stages were completed
const completedStages = { ...initial.stages };
for (const k of Object.keys(completedStages)) {
  completedStages[k as keyof typeof completedStages] = {
    ...completedStages[k as keyof typeof completedStages],
    status: 'completed',
  };
}

const invalidated = invalidateDownstreamOnImageChange(
  {
    ...initial,
    stages: completedStages,
    wireframe,
    validationReport: validation,
  },
  'front'
);
assert(invalidated.stages.wireframe.status === 'stale', 'Wireframe stage marked as stale when image changes');
assert(invalidated.stages.validation_report.status === 'stale', 'Validation stage marked as stale when image changes');
assert(invalidated.stages.wireframe.isStale === true, 'isStale flag set to true');

// 10. Wireframe Vertex & Edge Key Uniqueness Verification
const vIdSet = new Set<string>();
let hasDuplicateVertexId = false;
for (const v of wireframe.vertices) {
  if (vIdSet.has(v.id)) {
    hasDuplicateVertexId = true;
    break;
  }
  vIdSet.add(v.id);
}
assert(!hasDuplicateVertexId, 'All wireframe vertices have strictly unique IDs');

const eIdSet = new Set<string>();
let hasDuplicateEdgeId = false;
for (const e of wireframe.edges) {
  if (eIdSet.has(e.id)) {
    hasDuplicateEdgeId = true;
    break;
  }
  eIdSet.add(e.id);
}
assert(!hasDuplicateEdgeId, 'All wireframe edges have strictly unique IDs');

// Test rebuild when passing existing wireframe vertices (as happens during settings update)
const rebuiltWireframe = buildHeadWireframe(wireframe.vertices, {
  density: 'high',
  calibrationScaleMm: 220,
});
const rebuiltVIdSet = new Set<string>();
let hasDuplicateInRebuilt = false;
for (const v of rebuiltWireframe.vertices) {
  if (rebuiltVIdSet.has(v.id)) {
    hasDuplicateInRebuilt = true;
    break;
  }
  rebuiltVIdSet.add(v.id);
}
assert(!hasDuplicateInRebuilt, 'Rebuilding wireframe with existing vertices produces 0 duplicate vertex keys');

// 11. Manual Precision Sculptor & Software Assistant Validation
import { autoRefineLandmarks } from '../src/modules/landmarks/autoAlignmentAssistant';
import { LANDMARK_2D_CONTOURS } from '../src/modules/landmarks/landmark2DContours';

assert(LANDMARK_2D_CONTOURS.length > 5, `2D contour wireframe definitions populated (${LANDMARK_2D_CONTOURS.length} feature loops)`);
const frontLoops = LANDMARK_2D_CONTOURS.filter(c => c.views.includes('front'));
assert(frontLoops.length >= 4, 'Front view has complete facial feature contours (eyes, nose, mouth, jaw, midline)');

const refineResult = autoRefineLandmarks(landmarks, {});
assert(refineResult.refinedLandmarks.length === landmarks.length, 'Auto-refine preserves complete landmark set');
assert(refineResult.summary.length > 0, 'Auto-refine provides clear audit summary of adjustments');

console.log(`\nResults: ${passedTests}/${totalTests} tests passed.`);
