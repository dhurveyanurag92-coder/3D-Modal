import * as THREE from 'three';
import { FinishType, LightSettings } from '../types/lantern';
import { createLanternMaterials } from './materials';

export interface LanternModelStructure {
  rootGroup: THREE.Group;
  wallMountGroup: THREE.Group;
  armGroup: THREE.Group;
  bottomFinialGroup: THREE.Group;
  cageFrameGroup: THREE.Group;
  glassPanelsGroup: THREE.Group;
  filigreeGroup: THREE.Group;
  bulbGroup: THREE.Group;
  roofGroup: THREE.Group;
  topFinialGroup: THREE.Group;
  glassEnclosureMesh: THREE.Mesh;
  bulbLight: THREE.PointLight;
  filamentMesh: THREE.Mesh;
  bulbGlassMesh: THREE.Mesh;
  interactiveParts: THREE.Mesh[];
  updateMaterials: (finish: FinishType, wireframe: boolean) => void;
  updateExplode: (t: number) => void;
  updateLight: (settings: LightSettings) => void;
}

export function buildLanternModel(finish: FinishType, wireframe: boolean = false): LanternModelStructure {
  const rootGroup = new THREE.Group();
  rootGroup.name = 'LanternRoot';

  let currentMaterials = createLanternMaterials(finish, wireframe);
  const interactiveParts: THREE.Mesh[] = [];

  // Groups for exploded view
  const wallMountGroup = new THREE.Group();
  const armGroup = new THREE.Group();
  const bottomFinialGroup = new THREE.Group();
  const cageFrameGroup = new THREE.Group();
  const glassPanelsGroup = new THREE.Group();
  const filigreeGroup = new THREE.Group();
  const bulbGroup = new THREE.Group();
  const roofGroup = new THREE.Group();
  const topFinialGroup = new THREE.Group();

  rootGroup.add(
    wallMountGroup,
    armGroup,
    bottomFinialGroup,
    cageFrameGroup,
    glassPanelsGroup,
    filigreeGroup,
    bulbGroup,
    roofGroup,
    topFinialGroup
  );

  const registerMesh = (mesh: THREE.Mesh, partId: string) => {
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    mesh.userData = { partId };
    interactiveParts.push(mesh);
    return mesh;
  };

  // ==========================================
  // 1. WALL ESCUTCHEON / BASE PLATE
  // ==========================================
  const wallX = -2.1;
  const wallY = -0.6;

  // Base circular plate
  const plateBaseGeom = new THREE.CylinderGeometry(0.68, 0.68, 0.09, 36);
  plateBaseGeom.rotateZ(Math.PI / 2);
  const plateBaseMesh = new THREE.Mesh(plateBaseGeom, currentMaterials.metalMaterial);
  plateBaseMesh.position.set(wallX + 0.045, wallY, 0);
  wallMountGroup.add(registerMesh(plateBaseMesh, 'wall_plate'));

  // Stepped bevel tier
  const plateBevelGeom = new THREE.CylinderGeometry(0.58, 0.66, 0.13, 36);
  plateBevelGeom.rotateZ(Math.PI / 2);
  const plateBevelMesh = new THREE.Mesh(plateBevelGeom, currentMaterials.metalMaterial);
  plateBevelMesh.position.set(wallX + 0.13, wallY, 0);
  wallMountGroup.add(registerMesh(plateBevelMesh, 'wall_plate'));

  // Raised central hub
  const plateHubGeom = new THREE.CylinderGeometry(0.44, 0.52, 0.15, 36);
  plateHubGeom.rotateZ(Math.PI / 2);
  const plateHubMesh = new THREE.Mesh(plateHubGeom, currentMaterials.metalMaterial);
  plateHubMesh.position.set(wallX + 0.23, wallY, 0);
  wallMountGroup.add(registerMesh(plateHubMesh, 'wall_plate'));

  // Side decorative screw / cap nut
  const screwGeom = new THREE.CylinderGeometry(0.045, 0.045, 0.11, 16);
  screwGeom.rotateZ(Math.PI / 2);
  const screwMesh = new THREE.Mesh(screwGeom, currentMaterials.brassAccentMaterial);
  screwMesh.position.set(wallX + 0.2, wallY + 0.02, 0.56);
  wallMountGroup.add(registerMesh(screwMesh, 'wall_screw'));

  // Flared collar where arm connects to base plate
  const armCollarGeom = new THREE.CylinderGeometry(0.2, 0.32, 0.18, 24);
  armCollarGeom.rotateZ(Math.PI / 2);
  const armCollarMesh = new THREE.Mesh(armCollarGeom, currentMaterials.metalMaterial);
  armCollarMesh.position.set(wallX + 0.36, wallY, 0);
  armGroup.add(registerMesh(armCollarMesh, 'sconce_arm'));

  // ==========================================
  // 2. SCONCE BRACKET ARM (GOOSENECK CURVE)
  // ==========================================
  const armCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(wallX + 0.42, wallY, 0),
    new THREE.Vector3(-1.45, wallY - 0.03, 0),
    new THREE.Vector3(-0.95, -0.76, 0),
    new THREE.Vector3(-0.45, -0.86, 0),
    new THREE.Vector3(-0.02, -0.87, 0),
  ]);
  const armTubeGeom = new THREE.TubeGeometry(armCurve, 40, 0.115, 20, false);
  const armTubeMesh = new THREE.Mesh(armTubeGeom, currentMaterials.metalMaterial);
  armGroup.add(registerMesh(armTubeMesh, 'sconce_arm'));

  const gussetGeom = new THREE.CylinderGeometry(0.07, 0.14, 0.45, 16);
  gussetGeom.rotateZ(Math.PI / 4);
  const gussetMesh = new THREE.Mesh(gussetGeom, currentMaterials.metalMaterial);
  gussetMesh.position.set(-1.4, -0.68, 0);
  armGroup.add(registerMesh(gussetMesh, 'sconce_arm'));

  // ==========================================
  // 3. BOTTOM FINIAL & LOWER SOCKET COLLAR
  // ==========================================
  const lowerCupGeom = new THREE.CylinderGeometry(0.38, 0.28, 0.42, 32);
  const lowerCupMesh = new THREE.Mesh(lowerCupGeom, currentMaterials.metalMaterial);
  lowerCupMesh.position.set(0, -0.75, 0);
  bottomFinialGroup.add(registerMesh(lowerCupMesh, 'bottom_finial'));

  const lowerRingGeom1 = new THREE.TorusGeometry(0.29, 0.045, 16, 32);
  lowerRingGeom1.rotateX(Math.PI / 2);
  const lowerRingMesh1 = new THREE.Mesh(lowerRingGeom1, currentMaterials.metalMaterial);
  lowerRingMesh1.position.set(0, -0.96, 0);
  bottomFinialGroup.add(registerMesh(lowerRingMesh1, 'bottom_finial'));

  const lowerRingGeom2 = new THREE.TorusGeometry(0.22, 0.04, 16, 32);
  lowerRingGeom2.rotateX(Math.PI / 2);
  const lowerRingMesh2 = new THREE.Mesh(lowerRingGeom2, currentMaterials.metalMaterial);
  lowerRingMesh2.position.set(0, -1.1, 0);
  bottomFinialGroup.add(registerMesh(lowerRingMesh2, 'bottom_finial'));

  const lowerBeadGeom = new THREE.SphereGeometry(0.18, 24, 16);
  lowerBeadGeom.scale(1, 0.7, 1);
  const lowerBeadMesh = new THREE.Mesh(lowerBeadGeom, currentMaterials.metalMaterial);
  lowerBeadMesh.position.set(0, -1.22, 0);
  bottomFinialGroup.add(registerMesh(lowerBeadMesh, 'bottom_finial'));

  const lowerSpireGeom = new THREE.ConeGeometry(0.16, 0.42, 24);
  lowerSpireGeom.rotateX(Math.PI);
  const lowerSpireMesh = new THREE.Mesh(lowerSpireGeom, currentMaterials.metalMaterial);
  lowerSpireMesh.position.set(0, -1.48, 0);
  bottomFinialGroup.add(registerMesh(lowerSpireMesh, 'bottom_finial'));

  // ==========================================
  // 4. LANTERN CAGE & SEAMLESS ENCLOSED GLASS
  // ==========================================
  const sides = 6;
  const bottomY = -0.52;
  const topY = 1.25;
  const bottomR = 0.74;
  const topR = 1.08;
  const cageHeight = topY - bottomY;
  const centerY = (bottomY + topY) / 2;

  // Bottom hexagonal base rim/frieze
  const bottomRimGeom = new THREE.CylinderGeometry(bottomR + 0.06, bottomR + 0.08, 0.16, sides);
  const bottomRimMesh = new THREE.Mesh(bottomRimGeom, currentMaterials.metalMaterial);
  bottomRimMesh.position.set(0, bottomY, 0);
  cageFrameGroup.add(registerMesh(bottomRimMesh, 'cage_frame'));

  // Bottom interior floor
  const bottomFloorGeom = new THREE.CylinderGeometry(bottomR, bottomR, 0.05, sides);
  const bottomFloorMesh = new THREE.Mesh(bottomFloorGeom, currentMaterials.metalMaterial);
  bottomFloorMesh.position.set(0, bottomY + 0.05, 0);
  cageFrameGroup.add(registerMesh(bottomFloorMesh, 'cage_frame'));

  // Top hexagonal rim/frieze
  const topRimGeom = new THREE.CylinderGeometry(topR + 0.08, topR + 0.04, 0.18, sides);
  const topRimMesh = new THREE.Mesh(topRimGeom, currentMaterials.metalMaterial);
  topRimMesh.position.set(0, topY, 0);
  cageFrameGroup.add(registerMesh(topRimMesh, 'cage_frame'));

  // 6 Vertical Structural Framing Corner Posts
  const cornerAngles: number[] = [];
  for (let i = 0; i < sides; i++) {
    const angle = (i * 2 * Math.PI) / sides;
    cornerAngles.push(angle);

    const bX = Math.cos(angle) * bottomR;
    const bZ = Math.sin(angle) * bottomR;
    const tX = Math.cos(angle) * topR;
    const tZ = Math.sin(angle) * topR;

    const postCurve = new THREE.LineCurve3(
      new THREE.Vector3(bX, bottomY + 0.06, bZ),
      new THREE.Vector3(tX, topY - 0.06, tZ)
    );
    const postGeom = new THREE.TubeGeometry(postCurve, 8, 0.054, 12, false);
    const postMesh = new THREE.Mesh(postGeom, currentMaterials.metalMaterial);
    cageFrameGroup.add(registerMesh(postMesh, 'cage_frame'));

    const jointCapTop = new THREE.BoxGeometry(0.13, 0.16, 0.13);
    jointCapTop.rotateY(angle);
    const jointMeshTop = new THREE.Mesh(jointCapTop, currentMaterials.metalMaterial);
    jointMeshTop.position.set(tX, topY, tZ);
    cageFrameGroup.add(registerMesh(jointMeshTop, 'cage_frame'));
  }

  // --- SEAMLESS ENCLOSED HEXAGONAL GLASS ENCLOSURE ---
  // The glass sits slightly recessed inside the outer cage framing
  const glassTopR = topR * 0.935;
  const glassBottomR = bottomR * 0.935;
  const glassHeight = cageHeight - 0.06;
  const glassGeom = new THREE.CylinderGeometry(
    glassTopR,
    glassBottomR,
    glassHeight,
    sides,
    1,
    true
  );
  const glassEnclosureMesh = new THREE.Mesh(glassGeom, currentMaterials.glassMaterial);
  glassEnclosureMesh.position.set(0, centerY, 0);
  glassEnclosureMesh.renderOrder = 0;
  glassPanelsGroup.add(registerMesh(glassEnclosureMesh, 'glass_panels'));

  // ==========================================
  // 5. SIGNATURE FLORAL CLOVER CIRCULAR GRILLE (MOUNTED CLEARLY ON OUTSIDE)
  // ==========================================
  // We place the filigree explicitly on the EXTERIOR of the glass plane
  const filigreeFacetList: THREE.Group[] = [];
  const slopeAlpha = Math.atan((topR - bottomR) / cageHeight);

  // Exact distance to the outer glass surface at mid-height
  const glassMidApothem = ((glassBottomR + glassTopR) / 2) * Math.cos(Math.PI / sides);
  // Filigree stands proudly on the OUTSIDE face (+0.035 units clearance)
  const filigreeMidApothem = glassMidApothem + 0.034;

  for (let i = 0; i < sides; i++) {
    const a1 = cornerAngles[i];
    const a2 = cornerAngles[(i + 1) % sides];
    const midAngle = (a1 + a2) / 2;

    const uN = new THREE.Vector3(Math.cos(midAngle), 0, Math.sin(midAngle));
    const uT = new THREE.Vector3(-Math.sin(midAngle), 0, Math.cos(midAngle));
    const uY = new THREE.Vector3(
      uN.x * Math.sin(slopeAlpha),
      Math.cos(slopeAlpha),
      uN.z * Math.sin(slopeAlpha)
    );
    const uNorm = new THREE.Vector3(
      uN.x * Math.cos(slopeAlpha),
      -Math.sin(slopeAlpha),
      uN.z * Math.cos(slopeAlpha)
    );

    const facetGroup = new THREE.Group();
    const rotMatrix = new THREE.Matrix4().makeBasis(uT, uY, uNorm);
    facetGroup.setRotationFromMatrix(rotMatrix);
    // Placed strictly on the exterior surface
    facetGroup.position.set(uN.x * filigreeMidApothem, centerY, uN.z * filigreeMidApothem);
    facetGroup.renderOrder = 2;

    // Dimensions of the floral design
    const flowerCenterY = 0.28; // Centered in the upper half of the face
    const petalRadius = 0.17;   // Diameter ~0.34
    const wireRadius = 0.022;   // Substantial cast iron wire thickness

    // A. 4 FULLY CLOSED CIRCULAR PETAL RINGS (पूरी तरह बंद गोल-गोल लूप्स)
    // Creating the signature four-leaf flower rosette from the original photo!
    const closedCirclePositions = [
      { x: 0, y: flowerCenterY + 0.13 },  // Top closed circle
      { x: 0, y: flowerCenterY - 0.13 },  // Bottom closed circle
      { x: -0.135, y: flowerCenterY },    // Left closed circle
      { x: 0.135, y: flowerCenterY },     // Right closed circle
    ];

    closedCirclePositions.forEach((pos) => {
      // Math.PI * 2: 100% Complete Closed Loop!
      const ringGeom = new THREE.TorusGeometry(petalRadius, wireRadius, 16, 48, Math.PI * 2);
      const ringMesh = new THREE.Mesh(ringGeom, currentMaterials.filigreeMaterial);
      ringMesh.position.set(pos.x, pos.y, 0.024); // Positioned clearly ON TOP of the glass
      facetGroup.add(registerMesh(ringMesh, 'floral_filigree'));
    });

    // B. CENTRAL CLOSED MEDALLION RING & CENTER BUTTON
    // Where the 4 circles intersect in the center
    const centerRingGeom = new THREE.TorusGeometry(petalRadius * 0.52, wireRadius * 1.1, 16, 36, Math.PI * 2);
    const centerRingMesh = new THREE.Mesh(centerRingGeom, currentMaterials.filigreeMaterial);
    centerRingMesh.position.set(0, flowerCenterY, 0.026);
    facetGroup.add(registerMesh(centerRingMesh, 'floral_filigree'));

    const centerBudGeom = new THREE.SphereGeometry(0.048, 16, 12);
    centerBudGeom.scale(1, 1, 0.5);
    const centerBudMesh = new THREE.Mesh(centerBudGeom, currentMaterials.filigreeMaterial);
    centerBudMesh.position.set(0, flowerCenterY, 0.03);
    facetGroup.add(registerMesh(centerBudMesh, 'floral_filigree'));

    // C. 2 CLOSED DIAGONAL INTERSECTING RINGS (DIAMOND CLOVER PETALS)
    // Fully closed rings completing the outer leaf tips
    const diagRingL = new THREE.TorusGeometry(petalRadius * 1.14, wireRadius, 16, 48, Math.PI * 2);
    const diagMeshL = new THREE.Mesh(diagRingL, currentMaterials.filigreeMaterial);
    diagMeshL.rotation.z = Math.PI / 4;
    diagMeshL.position.set(0, flowerCenterY, 0.024);
    facetGroup.add(registerMesh(diagMeshL, 'floral_filigree'));

    const diagRingR = new THREE.TorusGeometry(petalRadius * 1.14, wireRadius, 16, 48, Math.PI * 2);
    const diagMeshR = new THREE.Mesh(diagRingR, currentMaterials.filigreeMaterial);
    diagMeshR.rotation.z = -Math.PI / 4;
    diagMeshR.position.set(0, flowerCenterY, 0.024);
    facetGroup.add(registerMesh(diagMeshR, 'floral_filigree'));

    // D. VERTICAL LOWER MULLION BARS (Extending below the circles to the bottom rim)
    // 1. Center vertical bar
    const centerStemHeight = 0.72;
    const centerStemGeom = new THREE.CylinderGeometry(wireRadius * 1.3, wireRadius * 1.3, centerStemHeight, 12);
    const centerStemMesh = new THREE.Mesh(centerStemGeom, currentMaterials.filigreeMaterial);
    centerStemMesh.position.set(0, -0.42, 0.024);
    facetGroup.add(registerMesh(centerStemMesh, 'floral_filigree'));

    // 2. Left vertical side bar
    const sideStemHeight = 0.56;
    const leftStemGeom = new THREE.CylinderGeometry(wireRadius * 1.15, wireRadius * 1.15, sideStemHeight, 10);
    const leftStemMesh = new THREE.Mesh(leftStemGeom, currentMaterials.filigreeMaterial);
    leftStemMesh.position.set(-0.21, -0.5, 0.024);
    facetGroup.add(registerMesh(leftStemMesh, 'floral_filigree'));

    // 3. Right vertical side bar
    const rightStemGeom = new THREE.CylinderGeometry(wireRadius * 1.15, wireRadius * 1.15, sideStemHeight, 10);
    const rightStemMesh = new THREE.Mesh(rightStemGeom, currentMaterials.filigreeMaterial);
    rightStemMesh.position.set(0.21, -0.5, 0.024);
    facetGroup.add(registerMesh(rightStemMesh, 'floral_filigree'));

    // E. TOP VERTICAL CONNECTOR BAR (Connecting flower top to the upper frieze rim)
    const topStemHeight = 0.36;
    const topStemGeom = new THREE.CylinderGeometry(wireRadius * 1.3, wireRadius * 1.3, topStemHeight, 12);
    const topStemMesh = new THREE.Mesh(topStemGeom, currentMaterials.filigreeMaterial);
    topStemMesh.position.set(0, 0.65, 0.024);
    facetGroup.add(registerMesh(topStemMesh, 'floral_filigree'));

    filigreeGroup.add(facetGroup);
    filigreeFacetList.push(facetGroup);
  }

  // ==========================================
  // 6. INTERNAL EDISON FILAMENT BULB
  // ==========================================
  const socketStemGeom = new THREE.CylinderGeometry(0.06, 0.08, 0.45, 16);
  const socketStemMesh = new THREE.Mesh(socketStemGeom, currentMaterials.metalMaterial);
  socketStemMesh.position.set(0, bottomY + 0.25, 0);
  bulbGroup.add(registerMesh(socketStemMesh, 'bulb_assembly'));

  const socketCupGeom = new THREE.CylinderGeometry(0.12, 0.11, 0.22, 24);
  const socketCupMesh = new THREE.Mesh(socketCupGeom, currentMaterials.brassAccentMaterial);
  socketCupMesh.position.set(0, bottomY + 0.52, 0);
  bulbGroup.add(registerMesh(socketCupMesh, 'bulb_assembly'));

  // ST64 Vintage Edison Bulb
  const bulbPoints: THREE.Vector2[] = [];
  const bulbSteps = 24;
  for (let s = 0; s <= bulbSteps; s++) {
    const t = s / bulbSteps;
    const y = t * 0.75;
    let r = 0;
    if (t < 0.2) {
      r = 0.1 + t * 0.4;
    } else if (t < 0.65) {
      const angle = ((t - 0.2) / 0.45) * Math.PI;
      r = 0.18 + Math.sin(angle) * 0.16;
    } else {
      const angle = ((t - 0.65) / 0.35) * (Math.PI / 2);
      r = 0.18 * Math.cos(angle);
    }
    bulbPoints.push(new THREE.Vector2(Math.max(0.01, r), y));
  }
  const bulbLatheGeom = new THREE.LatheGeometry(bulbPoints, 28);
  const bulbGlassMesh = new THREE.Mesh(bulbLatheGeom, currentMaterials.bulbGlassMaterial);
  bulbGlassMesh.position.set(0, bottomY + 0.62, 0);
  bulbGroup.add(registerMesh(bulbGlassMesh, 'bulb_assembly'));

  // Glowing tungsten filament wire
  const filamentCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.04, bottomY + 0.8, 0),
    new THREE.Vector3(-0.05, bottomY + 1.05, 0.03),
    new THREE.Vector3(0, bottomY + 1.15, 0),
    new THREE.Vector3(0.05, bottomY + 1.05, -0.03),
    new THREE.Vector3(0.04, bottomY + 0.8, 0),
  ]);
  const filamentGeom = new THREE.TubeGeometry(filamentCurve, 32, 0.012, 10, false);
  const filamentMesh = new THREE.Mesh(filamentGeom, currentMaterials.filamentMaterial);
  bulbGroup.add(registerMesh(filamentMesh, 'bulb_assembly'));

  const bulbLight = new THREE.PointLight('#ffb355', 2.0, 15, 1.8);
  bulbLight.position.set(0, bottomY + 1.02, 0);
  bulbLight.castShadow = true;
  bulbLight.shadow.mapSize.width = 1024;
  bulbLight.shadow.mapSize.height = 1024;
  bulbLight.shadow.bias = -0.002;
  bulbGroup.add(bulbLight);

  const innerGlowGeom = new THREE.SphereGeometry(0.14, 16, 16);
  const innerGlowMat = new THREE.MeshBasicMaterial({
    color: '#ffc870',
    transparent: true,
    opacity: 0.65,
  });
  const innerGlowMesh = new THREE.Mesh(innerGlowGeom, innerGlowMat);
  innerGlowMesh.position.copy(bulbLight.position);
  bulbGroup.add(innerGlowMesh);

  // ==========================================
  // 7. PAGODA ROOF CANOPY & TOP FINIAL
  // ==========================================
  const eaveRadius = topR + 0.28;
  const roofEaveGeom = new THREE.CylinderGeometry(eaveRadius, eaveRadius, 0.09, sides);
  const roofEaveMesh = new THREE.Mesh(roofEaveGeom, currentMaterials.metalMaterial);
  roofEaveMesh.position.set(0, topY + 0.08, 0);
  roofGroup.add(registerMesh(roofEaveMesh, 'roof_hood'));

  const roofStepGeom = new THREE.CylinderGeometry(eaveRadius - 0.08, eaveRadius - 0.04, 0.08, sides);
  const roofStepMesh = new THREE.Mesh(roofStepGeom, currentMaterials.metalMaterial);
  roofStepMesh.position.set(0, topY + 0.16, 0);
  roofGroup.add(registerMesh(roofStepMesh, 'roof_hood'));

  const roofCanopyGeom = new THREE.ConeGeometry(eaveRadius - 0.1, 0.95, sides);
  const roofCanopyMesh = new THREE.Mesh(roofCanopyGeom, currentMaterials.metalMaterial);
  roofCanopyMesh.position.set(0, topY + 0.64, 0);
  roofGroup.add(registerMesh(roofCanopyMesh, 'roof_hood'));

  const neckRing1 = new THREE.TorusGeometry(0.26, 0.05, 16, 32);
  neckRing1.rotateX(Math.PI / 2);
  const neckRingMesh1 = new THREE.Mesh(neckRing1, currentMaterials.metalMaterial);
  neckRingMesh1.position.set(0, topY + 1.15, 0);
  roofGroup.add(registerMesh(neckRingMesh1, 'roof_hood'));

  const neckRing2 = new THREE.TorusGeometry(0.2, 0.045, 16, 32);
  neckRing2.rotateX(Math.PI / 2);
  const neckRingMesh2 = new THREE.Mesh(neckRing2, currentMaterials.metalMaterial);
  neckRingMesh2.position.set(0, topY + 1.26, 0);
  roofGroup.add(registerMesh(neckRingMesh2, 'roof_hood'));

  const spireBaseGeom = new THREE.SphereGeometry(0.18, 24, 16);
  spireBaseGeom.scale(1, 0.8, 1);
  const spireBaseMesh = new THREE.Mesh(spireBaseGeom, currentMaterials.metalMaterial);
  spireBaseMesh.position.set(0, topY + 1.36, 0);
  topFinialGroup.add(registerMesh(spireBaseMesh, 'top_finial'));

  const topSpireGeom = new THREE.ConeGeometry(0.24, 0.65, 24);
  const topSpireMesh = new THREE.Mesh(topSpireGeom, currentMaterials.metalMaterial);
  topSpireMesh.position.set(0, topY + 1.72, 0);
  topFinialGroup.add(registerMesh(topSpireMesh, 'top_finial'));

  const crownTipGeom = new THREE.SphereGeometry(0.04, 12, 12);
  const crownTipMesh = new THREE.Mesh(crownTipGeom, currentMaterials.metalMaterial);
  crownTipMesh.position.set(0, topY + 2.05, 0);
  topFinialGroup.add(registerMesh(crownTipMesh, 'top_finial'));

  // ==========================================
  // DYNAMIC UPDATE FUNCTIONS
  // ==========================================
  const updateMaterials = (newFinish: FinishType, isWireframe: boolean) => {
    currentMaterials = createLanternMaterials(newFinish, isWireframe);

    interactiveParts.forEach((m) => {
      const partId = m.userData.partId;
      if (partId === 'glass_panels') {
        m.material = currentMaterials.glassMaterial;
      } else if (partId === 'floral_filigree') {
        m.material = currentMaterials.filigreeMaterial;
      } else if (partId === 'wall_screw') {
        m.material = currentMaterials.brassAccentMaterial;
      } else if (partId === 'bulb_assembly') {
        if (m === bulbGlassMesh) {
          m.material = currentMaterials.bulbGlassMaterial;
        } else if (m === filamentMesh) {
          m.material = currentMaterials.filamentMaterial;
        } else {
          m.material = currentMaterials.brassAccentMaterial;
        }
      } else {
        m.material = currentMaterials.metalMaterial;
      }
    });
  };

  const updateExplode = (t: number) => {
    wallMountGroup.position.x = -t * 1.5;
    armGroup.position.x = -t * 0.7;
    bottomFinialGroup.position.y = -t * 1.2;
    roofGroup.position.y = t * 1.3;
    topFinialGroup.position.y = t * 2.5;

    glassEnclosureMesh.scale.set(1 + t * 0.4, 1, 1 + t * 0.4);

    filigreeFacetList.forEach((group, idx) => {
      const angle = (idx * 2 * Math.PI) / sides + Math.PI / sides;
      const explodeR = filigreeMidApothem + t * 0.8;
      group.position.x = Math.cos(angle) * explodeR;
      group.position.z = Math.sin(angle) * explodeR;
    });

    bulbGroup.position.y = t * 0.25;
  };

  const updateLight = (settings: LightSettings) => {
    bulbLight.visible = settings.isOn;
    innerGlowMesh.visible = settings.isOn;

    const glassMat = currentMaterials.glassMaterial;

    if (!settings.isOn) {
      (filamentMesh.material as THREE.MeshBasicMaterial).color.set('#443322');
      glassMat.emissive.set('#000000');
      glassMat.emissiveIntensity = 0;
      return;
    }

    let colorHex = '#ffaa44';
    if (settings.colorTemp === 'candle') colorHex = '#ff8822';
    if (settings.colorTemp === 'warm') colorHex = '#ffb355';
    if (settings.colorTemp === 'soft') colorHex = '#ffdeb0';
    if (settings.colorTemp === 'daylight') colorHex = '#eaf0ff';

    bulbLight.color.set(colorHex);
    bulbLight.intensity = settings.intensity * 2.2;

    (filamentMesh.material as THREE.MeshBasicMaterial).color.set(colorHex);
    innerGlowMat.color.set(colorHex);
    innerGlowMat.opacity = Math.min(0.85, settings.intensity * 0.55);

    glassMat.emissive.set(colorHex);
    glassMat.emissiveIntensity = Math.min(0.45, settings.intensity * 0.28);
  };

  return {
    rootGroup,
    wallMountGroup,
    armGroup,
    bottomFinialGroup,
    cageFrameGroup,
    glassPanelsGroup,
    filigreeGroup,
    bulbGroup,
    roofGroup,
    topFinialGroup,
    glassEnclosureMesh,
    bulbLight,
    filamentMesh,
    bulbGlassMesh,
    interactiveParts,
    updateMaterials,
    updateExplode,
    updateLight,
  };
}
