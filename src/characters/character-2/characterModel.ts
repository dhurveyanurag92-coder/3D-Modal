import * as THREE from 'three';
import {
  EyeGazeSettings,
  ExpressionSettings,
  HairPhysicsSettings,
  TextureMode,
  FacialSculptSettings,
  WireframeSettings,
  DisplayShadingMode,
} from './types';
import irisTextureImg from '../../assets/images/character2_iris_texture_1791824686995.jpg';
import faceTextureImg from '../../assets/images/char2_face_texture_1791869743638.jpg';
import hairTextureImg from '../../assets/images/char2_hair_texture_1791869771241.jpg';

export interface HairLockData {
  mesh: THREE.Object3D;
  baseRot: THREE.Euler;
  basePos: THREE.Vector3;
  phase: number;
  flexibility: number;
  layer: 'frontBangs' | 'crownWaves' | 'sideburns' | 'backNape';
}

export interface Character2ModelStructure {
  rootGroup: THREE.Group;
  headGroup: THREE.Group;
  faceMesh: THREE.Mesh;
  leftEyeball: THREE.Group;
  rightEyeball: THREE.Group;
  leftUpperLid: THREE.Mesh;
  rightUpperLid: THREE.Mesh;
  leftEyebrow: THREE.Mesh;
  rightEyebrow: THREE.Mesh;
  mouthMesh: THREE.Mesh;
  hairGroup: THREE.Group;
  hairLocks: HairLockData[];
  shirtGroup: THREE.Group;
  updateGaze: (gaze: EyeGazeSettings) => void;
  updateHairWind: (time: number, settings: HairPhysicsSettings) => void;
  updateExpression: (exp: ExpressionSettings) => void;
  setTextureMode: (mode: TextureMode) => void;
  setWireframe: (wf: boolean) => void;
  updateFacialSculpt: (sculpt: FacialSculptSettings) => void;
  setWireframeSettings: (settings: WireframeSettings) => void;
  setDisplayShadingMode: (mode: DisplayShadingMode) => void;
  exportOBJ: () => string;
}

export function buildCharacter2Model(initialTextureMode: TextureMode = 'uv_photographic'): Character2ModelStructure {
  const rootGroup = new THREE.Group();
  rootGroup.name = 'Character2Root';

  const headGroup = new THREE.Group();
  headGroup.name = 'HeadGroup';
  rootGroup.add(headGroup);

  const textureLoader = new THREE.TextureLoader();

  // Load High-Res Textures
  const irisTexture = textureLoader.load(irisTextureImg);
  irisTexture.colorSpace = THREE.SRGBColorSpace;

  const faceTexture = textureLoader.load(faceTextureImg);
  faceTexture.colorSpace = THREE.SRGBColorSpace;
  faceTexture.generateMipmaps = true;
  faceTexture.minFilter = THREE.LinearMipmapLinearFilter;
  faceTexture.magFilter = THREE.LinearFilter;

  const hairTexture = textureLoader.load(hairTextureImg);
  hairTexture.colorSpace = THREE.SRGBColorSpace;
  hairTexture.wrapS = THREE.RepeatWrapping;
  hairTexture.wrapT = THREE.RepeatWrapping;
  hairTexture.repeat.set(1.5, 3.0);

  // ==========================================
  // 1. MATERIALS DEFINITION
  // ==========================================
  // UV Photographic Face Material (shows the actual illustrated face from the photos)
  const facePhotographicMaterial = new THREE.MeshStandardMaterial({
    map: faceTexture,
    roughness: 0.42,
    metalness: 0.04,
  });

  // Plain Sculpted Skin Material (fallback/alternative)
  const skinPlainMaterial = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#fedcc6'),
    roughness: 0.52,
    metalness: 0.02,
  });

  const skinShadowMaterial = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#f4c4a8'),
    roughness: 0.55,
    metalness: 0.02,
  });

  // Hair Material with glossy dark chocolate curly texture
  const hairTexturedMaterial = new THREE.MeshStandardMaterial({
    map: hairTexture,
    color: new THREE.Color('#382820'),
    roughness: 0.35,
    metalness: 0.1,
  });

  const hairPlainMaterial = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#221a15'),
    roughness: 0.4,
    metalness: 0.08,
  });

  const lipsMaterial = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#d98068'),
    roughness: 0.45,
    metalness: 0.05,
  });

  const eyelashMaterial = new THREE.MeshBasicMaterial({
    color: new THREE.Color('#1c1613'),
  });

  const scleraMaterial = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#faf9f6'),
    roughness: 0.2,
    metalness: 0.0,
  });

  const irisMaterial = new THREE.MeshBasicMaterial({
    map: irisTexture,
  });

  const shirtMaterial = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#1d59d6'),
    roughness: 0.65,
    metalness: 0.02,
  });

  const buttonMaterial = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#f0f0f2'),
    roughness: 0.3,
    metalness: 0.2,
  });

  // ==========================================
  // 2. UNIFIED SCULPTED HEAD & FACE WITH UV PROJECTION
  // ==========================================
  // We deform a high-density 64x64 sphere into an anatomically accurate anime young male head
  const headSubdivisions = 64;
  const headGeom = new THREE.SphereGeometry(0.96, headSubdivisions, headSubdivisions);
  const posAttr = headGeom.attributes.position;
  const uvAttr = headGeom.attributes.uv;

  // Sculpting vertices and recalculating UVs for photographic mapping
  for (let i = 0; i < posAttr.count; i++) {
    let x = posAttr.getX(i);
    let y = posAttr.getY(i);
    let z = posAttr.getZ(i);

    // Anatomical Deformations matching the reference images:
    // 1. Chin tapering (pointed anime chin at front-bottom)
    if (y < -0.1 && z > 0) {
      const chinFactor = Math.max(0, 1 - (y + 0.9) * 1.1);
      x *= 0.65 + 0.35 * (1 - chinFactor);
      if (y < -0.4) {
        z += 0.12 * Math.cos(x * 3);
      }
    }

    // 2. Jawline V-shape
    if (y < 0.2 && y > -0.6) {
      const taper = 0.8 + 0.2 * ((y + 0.6) / 0.8);
      x *= taper;
    }

    // 3. Nose protrusion (bridge & tip) matching profile photos
    const noseYDist = Math.abs(y - 0.05);
    const noseXDist = Math.abs(x);
    if (z > 0.4 && noseYDist < 0.35 && noseXDist < 0.28) {
      const noseBell = Math.exp(-(noseXDist * noseXDist * 40 + noseYDist * noseYDist * 16));
      z += noseBell * 0.32;
    }

    // 4. Cheeks subtle fullness
    if (y > -0.1 && y < 0.25 && Math.abs(x) > 0.25 && z > 0.3) {
      z += 0.05 * Math.sin(Math.abs(x) * 2.5);
    }

    // 5. Cranium volume (back and crown)
    if (z < 0) {
      z *= 1.08;
    }
    if (y > 0.4) {
      y *= 1.04;
    }

    posAttr.setXYZ(i, x, y, z);

    // UV Mapping Projection:
    // Map frontal UV texture map accurately over the front face surface
    // Texture center is at (0.5, 0.46)
    if (z > -0.3) {
      const u = 0.5 + (x / 1.75);
      const v = 0.46 + ((y - 0.0) / 1.85);
      uvAttr.setXY(i, THREE.MathUtils.clamp(u, 0, 1), THREE.MathUtils.clamp(v, 0, 1));
    } else {
      // Back of head wraps around smoothly
      const angle = Math.atan2(x, -z);
      const u = 0.5 + (angle / Math.PI) * 0.5;
      const v = 0.46 + ((y - 0.0) / 1.85);
      uvAttr.setXY(i, THREE.MathUtils.clamp(u, 0, 1), THREE.MathUtils.clamp(v, 0, 1));
    }
  }

  headGeom.computeVertexNormals();
  const baseHeadPositions = Float32Array.from(headGeom.attributes.position.array);

  // Additional Shading Materials:
  // Clay Sculpt Material (Matte gray 3D sculpture for inspecting anatomical curves)
  const clayMaterial = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#94a3b8'),
    roughness: 0.65,
    metalness: 0.05,
  });

  // Wireframe-Only Material (Neon glowing lines on black matching featured-2.jpg)
  const wireframeMaterial = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#ff2d55'), // Neon pink default
    wireframe: true,
    roughness: 0.4,
    metalness: 0.1,
    emissive: new THREE.Color('#ff2d55'),
    emissiveIntensity: 0.6,
  });

  // Grayscale Depth Map Material (Z-Depth visualizer: white at protruding features like nose tip, darker for recesses)
  const depthMaterial = new THREE.ShaderMaterial({
    vertexShader: `
      varying vec3 vViewPos;
      varying vec3 vNorm;
      void main() {
        vNorm = normalize(normalMatrix * normal);
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        vViewPos = -mvPosition.xyz;
        gl_Position = projectionMatrix * mvPosition;
      }
    `,
    fragmentShader: `
      varying vec3 vViewPos;
      varying vec3 vNorm;
      void main() {
        // Linearized depth interpretation between near (closer to camera) and far
        float d = clamp((vViewPos.z - 2.8) / 2.2, 0.0, 1.0);
        float depthVal = 1.0 - d;
        // Blend with subtle surface normal facing camera to capture crisp curvature & surface relief
        float facing = clamp(dot(vNorm, vec3(0.0, 0.0, 1.0)), 0.0, 1.0);
        float combined = clamp(depthVal * 0.70 + facing * 0.30, 0.0, 1.0);
        gl_FragColor = vec4(vec3(combined), 1.0);
      }
    `,
  });

  const faceMesh = new THREE.Mesh(
    headGeom,
    initialTextureMode === 'uv_photographic' ? facePhotographicMaterial : skinPlainMaterial
  );
  faceMesh.position.set(0, 1.05, 0);
  faceMesh.castShadow = true;
  faceMesh.receiveShadow = true;
  headGroup.add(faceMesh);

  // Skull Cap with Hair Texture (ensures seamless hair base beneath curl locks)
  const hairCapGeom = new THREE.SphereGeometry(0.98, 32, 24, 0, Math.PI * 2, 0, Math.PI * 0.65);
  hairCapGeom.scale(1.02, 1.06, 1.08);
  const hairCapMesh = new THREE.Mesh(hairCapGeom, hairTexturedMaterial);
  hairCapMesh.position.set(0, 1.15, -0.06);
  hairCapMesh.castShadow = true;
  headGroup.add(hairCapMesh);

  // ==========================================
  // 3. 3D NOSE & LIPS ACCENTS (Physical depth over texture)
  // ==========================================
  const noseCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, 1.25, 0.78),
    new THREE.Vector3(0, 1.12, 0.84),
    new THREE.Vector3(0, 0.98, 0.98),
    new THREE.Vector3(0, 0.88, 1.05),
    new THREE.Vector3(0, 0.82, 0.92),
  ]);
  const noseBridgeGeom = new THREE.TubeGeometry(noseCurve, 20, 0.05, 10, false);
  const noseBridgeMesh = new THREE.Mesh(noseBridgeGeom, skinPlainMaterial);
  noseBridgeMesh.visible = initialTextureMode === 'sculpted_3d';
  headGroup.add(noseBridgeMesh);

  // Mouth smile line accent
  const mouthCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.25, 0.69, 0.78),
    new THREE.Vector3(-0.12, 0.66, 0.84),
    new THREE.Vector3(0, 0.67, 0.88),
    new THREE.Vector3(0.12, 0.66, 0.84),
    new THREE.Vector3(0.25, 0.69, 0.78),
  ]);
  const upperLipGeom = new THREE.TubeGeometry(mouthCurve, 20, 0.02, 8, false);
  const upperLipMesh = new THREE.Mesh(upperLipGeom, lipsMaterial);
  upperLipMesh.visible = initialTextureMode === 'sculpted_3d';
  headGroup.add(upperLipMesh);

  // ==========================================
  // 4. INTERACTIVE 3D EYEBALLS (Optional Gaze Overlay)
  // ==========================================
  const eyeRadius = 0.22;
  const leftEyePos = new THREE.Vector3(-0.35, 1.15, 0.72);
  const rightEyePos = new THREE.Vector3(0.35, 1.15, 0.72);

  const createEyeball = (pos: THREE.Vector3) => {
    const eyePivotGroup = new THREE.Group();
    eyePivotGroup.position.copy(pos);

    const scleraGeom = new THREE.SphereGeometry(eyeRadius, 24, 20);
    const scleraMesh = new THREE.Mesh(scleraGeom, scleraMaterial);
    eyePivotGroup.add(scleraMesh);

    const irisGeom = new THREE.CircleGeometry(eyeRadius * 0.68, 32);
    const irisMesh = new THREE.Mesh(irisGeom, irisMaterial);
    irisMesh.position.set(0, 0, eyeRadius * 0.98);
    eyePivotGroup.add(irisMesh);

    const pupilGeom = new THREE.CircleGeometry(eyeRadius * 0.32, 24);
    const pupilMesh = new THREE.Mesh(
      pupilGeom,
      new THREE.MeshBasicMaterial({ color: '#0d0a08' })
    );
    pupilMesh.position.set(0, 0, eyeRadius * 0.99);
    eyePivotGroup.add(pupilMesh);

    // Anime catchlight
    const catchlightGeom = new THREE.CircleGeometry(eyeRadius * 0.16, 16);
    const catchlightMesh = new THREE.Mesh(
      catchlightGeom,
      new THREE.MeshBasicMaterial({ color: '#ffffff' })
    );
    catchlightMesh.position.set(-eyeRadius * 0.22, eyeRadius * 0.22, eyeRadius * 1.0);
    eyePivotGroup.add(catchlightMesh);

    return eyePivotGroup;
  };

  const leftEyeball = createEyeball(leftEyePos);
  const rightEyeball = createEyeball(rightEyePos);
  leftEyeball.visible = initialTextureMode === 'sculpted_3d';
  rightEyeball.visible = initialTextureMode === 'sculpted_3d';
  headGroup.add(leftEyeball);
  headGroup.add(rightEyeball);

  // Upper Eyelids
  const leftUpperLidGeom = new THREE.SphereGeometry(eyeRadius * 1.04, 20, 16, 0, Math.PI, 0, Math.PI / 2);
  leftUpperLidGeom.rotateX(-Math.PI / 2);
  const leftUpperLid = new THREE.Mesh(leftUpperLidGeom, skinPlainMaterial);
  leftUpperLid.position.copy(leftEyePos);
  leftUpperLid.scale.set(1, 0.05, 1);
  leftUpperLid.visible = initialTextureMode === 'sculpted_3d';
  headGroup.add(leftUpperLid);

  const rightUpperLidGeom = new THREE.SphereGeometry(eyeRadius * 1.04, 20, 16, 0, Math.PI, 0, Math.PI / 2);
  rightUpperLidGeom.rotateX(-Math.PI / 2);
  const rightUpperLid = new THREE.Mesh(rightUpperLidGeom, skinPlainMaterial);
  rightUpperLid.position.copy(rightEyePos);
  rightUpperLid.scale.set(1, 0.05, 1);
  rightUpperLid.visible = initialTextureMode === 'sculpted_3d';
  headGroup.add(rightUpperLid);

  // Eyebrows
  const leftBrowCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.16, 1.34, 0.86),
    new THREE.Vector3(-0.36, 1.44, 0.87),
    new THREE.Vector3(-0.56, 1.33, 0.77),
  ]);
  const leftBrowGeom = new THREE.TubeGeometry(leftBrowCurve, 16, 0.038, 10, false);
  const leftEyebrow = new THREE.Mesh(leftBrowGeom, eyelashMaterial);
  leftEyebrow.visible = initialTextureMode === 'sculpted_3d';
  headGroup.add(leftEyebrow);

  const rightBrowCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(0.16, 1.34, 0.86),
    new THREE.Vector3(0.36, 1.44, 0.87),
    new THREE.Vector3(0.56, 1.33, 0.77),
  ]);
  const rightBrowGeom = new THREE.TubeGeometry(rightBrowCurve, 16, 0.038, 10, false);
  const rightEyebrow = new THREE.Mesh(rightBrowGeom, eyelashMaterial);
  rightEyebrow.visible = initialTextureMode === 'sculpted_3d';
  headGroup.add(rightEyebrow);

  // ==========================================
  // 5. EARS (Sculpted with Left & Right Profile Accuracy)
  // ==========================================
  const createEar = (isLeft: boolean) => {
    const earGroup = new THREE.Group();
    const sign = isLeft ? -1 : 1;
    earGroup.position.set(sign * 0.84, 1.02, -0.05);
    earGroup.rotation.y = sign * 0.15;

    const earHelixCurve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0.32, 0.05),
      new THREE.Vector3(sign * 0.12, 0.22, -0.06),
      new THREE.Vector3(sign * 0.16, 0, -0.1),
      new THREE.Vector3(sign * 0.08, -0.22, -0.06),
      new THREE.Vector3(0, -0.32, 0),
    ]);
    const earHelixGeom = new THREE.TubeGeometry(earHelixCurve, 16, 0.045, 10, false);
    const earHelixMesh = new THREE.Mesh(earHelixGeom, skinPlainMaterial);
    earGroup.add(earHelixMesh);

    const conchaGeom = new THREE.SphereGeometry(0.18, 16, 12);
    conchaGeom.scale(0.7, 1.1, 0.5);
    const conchaMesh = new THREE.Mesh(conchaGeom, skinShadowMaterial);
    conchaMesh.position.set(sign * 0.03, 0, -0.02);
    earGroup.add(conchaMesh);

    return earGroup;
  };

  headGroup.add(createEar(true));
  headGroup.add(createEar(false));

  // ==========================================
  // 6. NECK & ROYAL BLUE SHIRT
  // ==========================================
  const shirtGroup = new THREE.Group();
  rootGroup.add(shirtGroup);

  const neckGeom = new THREE.CylinderGeometry(0.42, 0.48, 0.9, 24);
  const neckMesh = new THREE.Mesh(neckGeom, skinPlainMaterial);
  neckMesh.position.set(0, 0.15, -0.06);
  neckMesh.castShadow = true;
  shirtGroup.add(neckMesh);

  // Collar Stand
  const collarStandGeom = new THREE.CylinderGeometry(0.52, 0.58, 0.32, 28);
  const collarStandMesh = new THREE.Mesh(collarStandGeom, shirtMaterial);
  collarStandMesh.position.set(0, -0.08, -0.06);
  shirtGroup.add(collarStandMesh);

  // Left & Right Collar Wings
  const leftWingShape = new THREE.Shape();
  leftWingShape.moveTo(0, 0);
  leftWingShape.lineTo(-0.45, -0.42);
  leftWingShape.lineTo(-0.15, -0.48);
  leftWingShape.lineTo(0.12, -0.15);
  leftWingShape.closePath();
  const leftWingGeom = new THREE.ShapeGeometry(leftWingShape);
  const leftWingMesh = new THREE.Mesh(leftWingGeom, shirtMaterial);
  leftWingMesh.position.set(-0.25, -0.02, 0.46);
  leftWingMesh.rotation.set(-0.35, 0.45, 0.1);
  shirtGroup.add(leftWingMesh);

  const rightWingShape = new THREE.Shape();
  rightWingShape.moveTo(0, 0);
  rightWingShape.lineTo(0.45, -0.42);
  rightWingShape.lineTo(0.15, -0.48);
  rightWingShape.lineTo(-0.12, -0.15);
  rightWingShape.closePath();
  const rightWingGeom = new THREE.ShapeGeometry(rightWingShape);
  const rightWingMesh = new THREE.Mesh(rightWingGeom, shirtMaterial);
  rightWingMesh.position.set(0.25, -0.02, 0.46);
  rightWingMesh.rotation.set(-0.35, -0.45, -0.1);
  shirtGroup.add(rightWingMesh);

  // Button
  const buttonGeom = new THREE.CylinderGeometry(0.045, 0.045, 0.02, 16);
  buttonGeom.rotateX(Math.PI / 2);
  const buttonMesh = new THREE.Mesh(buttonGeom, buttonMaterial);
  buttonMesh.position.set(0, -0.32, 0.52);
  shirtGroup.add(buttonMesh);

  // Torso / Shoulders
  const torsoGeom = new THREE.CylinderGeometry(0.68, 1.45, 1.2, 32);
  torsoGeom.scale(1.4, 1.0, 0.75);
  const torsoMesh = new THREE.Mesh(torsoGeom, shirtMaterial);
  torsoMesh.position.set(0, -0.85, -0.08);
  torsoMesh.castShadow = true;
  torsoMesh.receiveShadow = true;
  shirtGroup.add(torsoMesh);

  // ==========================================
  // 7. RICH TEXTURED CURLY HAIR SYSTEM
  // ==========================================
  const hairGroup = new THREE.Group();
  hairGroup.name = 'ModularHairSystem';
  headGroup.add(hairGroup);

  const hairLocks: HairLockData[] = [];

  const createCurlyHairLock = (
    curvePoints: THREE.Vector3[],
    radiusStart: number,
    radiusEnd: number,
    layer: 'frontBangs' | 'crownWaves' | 'sideburns' | 'backNape',
    flexibility: number
  ) => {
    const pivot = new THREE.Group();
    const anchor = curvePoints[0].clone();
    pivot.position.copy(anchor);

    const relPoints = curvePoints.map((p) => p.clone().sub(anchor));
    const curve = new THREE.CatmullRomCurve3(relPoints);

    const tubeGeom = new THREE.TubeGeometry(curve, 20, (radiusStart + radiusEnd) / 2, 10, false);
    const mesh = new THREE.Mesh(tubeGeom, hairTexturedMaterial);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    pivot.add(mesh);

    hairGroup.add(pivot);

    hairLocks.push({
      mesh: pivot,
      baseRot: pivot.rotation.clone(),
      basePos: pivot.position.clone(),
      phase: Math.random() * Math.PI * 2,
      flexibility,
      layer,
    });
  };

  // 1. FRONT BANGS (Swept to the right, matching front view photo)
  createCurlyHairLock(
    [
      new THREE.Vector3(-0.05, 1.82, 0.75),
      new THREE.Vector3(0.12, 1.62, 0.92),
      new THREE.Vector3(0.24, 1.42, 0.88),
      new THREE.Vector3(0.28, 1.28, 0.82),
    ],
    0.09, 0.04, 'frontBangs', 1.0
  );

  createCurlyHairLock(
    [
      new THREE.Vector3(-0.25, 1.80, 0.72),
      new THREE.Vector3(-0.18, 1.58, 0.88),
      new THREE.Vector3(-0.08, 1.38, 0.92),
      new THREE.Vector3(0.04, 1.22, 0.85),
    ],
    0.085, 0.035, 'frontBangs', 0.95
  );

  createCurlyHairLock(
    [
      new THREE.Vector3(0.25, 1.78, 0.70),
      new THREE.Vector3(0.42, 1.58, 0.82),
      new THREE.Vector3(0.52, 1.38, 0.76),
      new THREE.Vector3(0.56, 1.24, 0.68),
    ],
    0.08, 0.035, 'frontBangs', 0.9
  );

  createCurlyHairLock(
    [
      new THREE.Vector3(-0.45, 1.72, 0.65),
      new THREE.Vector3(-0.52, 1.52, 0.78),
      new THREE.Vector3(-0.48, 1.34, 0.80),
      new THREE.Vector3(-0.38, 1.22, 0.76),
    ],
    0.075, 0.03, 'frontBangs', 0.85
  );

  // 2. CROWN WAVES (Dense top volume from 4-view images)
  const crownAngles = [0, 0.5, 1.0, 1.5, 2.0, 2.5, 3.0, 3.5, 4.0, 4.5, 5.0, 5.5];
  crownAngles.forEach((ang) => {
    const rx = Math.sin(ang) * 0.65;
    const rz = Math.cos(ang) * 0.65 - 0.1;
    createCurlyHairLock(
      [
        new THREE.Vector3(rx, 1.95, rz),
        new THREE.Vector3(rx * 1.25, 2.12, rz * 1.25),
        new THREE.Vector3(rx * 1.45, 1.92, rz * 1.45),
        new THREE.Vector3(rx * 1.52, 1.75, rz * 1.52),
      ],
      0.09, 0.035, 'crownWaves', 0.8
    );
  });

  // 3. SIDEBURNS & TEMPLE CURLS (Framing both ears)
  // Left Sideburns
  createCurlyHairLock(
    [
      new THREE.Vector3(-0.75, 1.52, 0.28),
      new THREE.Vector3(-0.92, 1.32, 0.22),
      new THREE.Vector3(-0.96, 1.10, 0.15),
      new THREE.Vector3(-0.85, 0.95, 0.05),
    ],
    0.08, 0.035, 'sideburns', 0.7
  );

  // Right Sideburns
  createCurlyHairLock(
    [
      new THREE.Vector3(0.75, 1.52, 0.28),
      new THREE.Vector3(0.92, 1.32, 0.22),
      new THREE.Vector3(0.96, 1.10, 0.15),
      new THREE.Vector3(0.85, 0.95, 0.05),
    ],
    0.08, 0.035, 'sideburns', 0.7
  );

  // 4. BACK NAPE & OCCIPITAL CURLS (Dense curls shown in Back view photo)
  const backOffsets = [-0.55, -0.35, -0.15, 0, 0.15, 0.35, 0.55];
  backOffsets.forEach((bx, idx) => {
    createCurlyHairLock(
      [
        new THREE.Vector3(bx, 1.45, -0.85),
        new THREE.Vector3(bx * 1.15, 1.25, -1.05),
        new THREE.Vector3(bx * 1.1, 1.05, -1.02),
        new THREE.Vector3(bx * 0.9, 0.85, -0.92),
      ],
      0.085, 0.04, 'backNape', 0.65 + (idx % 3) * 0.1
    );
  });

  // Additional lower nape curls touching collar
  [-0.4, -0.2, 0, 0.2, 0.4].forEach((bx) => {
    createCurlyHairLock(
      [
        new THREE.Vector3(bx, 1.05, -0.88),
        new THREE.Vector3(bx * 1.1, 0.88, -0.96),
        new THREE.Vector3(bx * 0.95, 0.72, -0.90),
      ],
      0.075, 0.035, 'backNape', 0.6
    );
  });

  let currentTextureMode: TextureMode = initialTextureMode;
  let show3DPupilsOverlay: boolean = true;

  // ==========================================
  // 8. INTERACTIVE METHODS
  // ==========================================
  const updateGaze = (gaze: EyeGazeSettings) => {
    const maxRotH = 0.45;
    const maxRotV = 0.35;
    const rotY = -gaze.lookX * maxRotH;
    const rotX = -gaze.lookY * maxRotV;

    leftEyeball.rotation.set(rotX, rotY, 0);
    rightEyeball.rotation.set(rotX, rotY, 0);

    const blinkScaleY = Math.max(0.05, 1.0 - gaze.blinkAmount * 0.95);
    leftUpperLid.scale.y = blinkScaleY;
    rightUpperLid.scale.y = blinkScaleY;

    if (gaze.show3DPupils !== undefined) {
      show3DPupilsOverlay = gaze.show3DPupils;
      if (currentTextureMode === 'uv_photographic') {
        leftEyeball.visible = show3DPupilsOverlay;
        rightEyeball.visible = show3DPupilsOverlay;
      }
    }
  };

  const updateHairWind = (time: number, settings: HairPhysicsSettings) => {
    if (!settings.windEnabled || settings.windStrength <= 0) {
      hairLocks.forEach((lock) => {
        lock.mesh.rotation.copy(lock.baseRot);
      });
      return;
    }

    const speed = settings.windSpeed * 3.5;
    const str = settings.windStrength * 0.35;

    hairLocks.forEach((lock) => {
      lock.mesh.visible = settings.showLayers[lock.layer];
      if (!lock.mesh.visible) return;

      const phase = lock.phase;
      const flex = lock.flexibility;

      const swayZ = Math.sin(time * speed + phase) * str * flex;
      const swayX = Math.cos(time * speed * 0.85 + phase * 1.3) * str * flex * 0.6;
      const swayY = Math.sin(time * speed * 1.4 + phase) * str * flex * 0.25;

      lock.mesh.rotation.z = lock.baseRot.z + swayZ;
      lock.mesh.rotation.x = lock.baseRot.x + swayX;
      lock.mesh.rotation.y = lock.baseRot.y + swayY;
    });
  };

  const updateExpression = (exp: ExpressionSettings) => {
    leftEyebrow.position.y = exp.eyebrowRaise * 0.08;
    rightEyebrow.position.y = exp.eyebrowRaise * 0.08;

    if (exp.winkLeft) leftUpperLid.scale.y = 0.05;
    if (exp.winkRight) rightUpperLid.scale.y = 0.05;
  };

  const setTextureMode = (mode: TextureMode) => {
    currentTextureMode = mode;
    if (mode === 'uv_photographic') {
      faceMesh.material = facePhotographicMaterial;
      noseBridgeMesh.visible = false;
      upperLipMesh.visible = false;
      leftEyeball.visible = show3DPupilsOverlay;
      rightEyeball.visible = show3DPupilsOverlay;
      leftUpperLid.visible = false;
      rightUpperLid.visible = false;
      leftEyebrow.visible = false;
      rightEyebrow.visible = false;
    } else {
      faceMesh.material = skinPlainMaterial;
      noseBridgeMesh.visible = true;
      upperLipMesh.visible = true;
      leftEyeball.visible = true;
      rightEyeball.visible = true;
      leftUpperLid.visible = true;
      rightUpperLid.visible = true;
      leftEyebrow.visible = true;
      rightEyebrow.visible = true;
    }
  };

  const setWireframe = (wf: boolean) => {
    facePhotographicMaterial.wireframe = wf;
    skinPlainMaterial.wireframe = wf;
    clayMaterial.wireframe = wf;
    hairTexturedMaterial.wireframe = wf;
    hairPlainMaterial.wireframe = wf;
    shirtMaterial.wireframe = wf;
  };

  const updateFacialSculpt = (sculpt: FacialSculptSettings) => {
    const pos = headGeom.attributes.position;
    const count = pos.count;
    // Map sculpt parameters (0 to 1, default 0.5) to offsets
    const noseDepthFactor = (sculpt.noseDepth - 0.5) * 0.45;
    const noseWidthFactor = (sculpt.noseBridgeWidth - 0.5) * 0.4;
    const noseTipFactor = (sculpt.noseTipLift - 0.5) * 0.2;
    const jawFactor = (sculpt.jawWidth - 0.5) * 0.35;
    const chinSharpFactor = (sculpt.chinSharpness - 0.5) * 0.3;
    const chinDepthFactor = (sculpt.chinDepth - 0.5) * 0.25;
    const cheekFactor = (sculpt.cheekboneHeight - 0.5) * 0.2;
    const socketFactor = (sculpt.eyeSocketDepth - 0.5) * 0.25;

    for (let i = 0; i < count; i++) {
      const idx = i * 3;
      let x = baseHeadPositions[idx];
      let y = baseHeadPositions[idx + 1];
      let z = baseHeadPositions[idx + 2];

      // Nose deformation
      const noseYDist = Math.abs(y - 0.05);
      const noseXDist = Math.abs(x);
      if (z > 0.4 && noseYDist < 0.35 && noseXDist < 0.28) {
        const bell = Math.exp(-(noseXDist * noseXDist * 40 + noseYDist * noseYDist * 16));
        z += bell * noseDepthFactor;
        x *= 1 + bell * noseWidthFactor;
        if (noseYDist < 0.15) {
          y += bell * noseTipFactor;
        }
      }

      // Jaw width
      if (y < 0.2 && y > -0.6) {
        x *= 1 + jawFactor;
      }

      // Chin sharpness & depth
      if (y < -0.3 && z > 0) {
        const chinWeight = Math.max(0, -y - 0.3);
        x *= Math.max(0.2, 1 - chinSharpFactor * chinWeight);
        z += chinDepthFactor * chinWeight;
      }

      // Cheekbone height & prominence
      if (y > -0.1 && y < 0.3 && Math.abs(x) > 0.25 && z > 0.25) {
        y += cheekFactor * 0.4;
        x *= 1 + cheekFactor * 0.25;
      }

      // Eye sockets indentation
      if (y > 0.08 && y < 0.45 && Math.abs(x) > 0.15 && Math.abs(x) < 0.55 && z > 0.4) {
        z -= socketFactor * 0.7;
      }

      pos.setXYZ(i, x, y, z);
    }
    pos.needsUpdate = true;
    headGeom.computeVertexNormals();
  };

  const setWireframeSettings = (settings: WireframeSettings) => {
    const wireColor = new THREE.Color(settings.color);
    wireframeMaterial.color = wireColor;
    wireframeMaterial.emissive = wireColor;
    facePhotographicMaterial.wireframe = settings.enabled;
    skinPlainMaterial.wireframe = settings.enabled;
    clayMaterial.wireframe = settings.enabled;
    hairTexturedMaterial.wireframe = settings.enabled;
    hairPlainMaterial.wireframe = settings.enabled;
    shirtMaterial.wireframe = settings.enabled;
  };

  const setDisplayShadingMode = (mode: DisplayShadingMode) => {
    if (mode === 'clay_sculpt') {
      faceMesh.material = clayMaterial;
      hairCapMesh.material = clayMaterial;
      hairLocks.forEach((l) => {
        const m = l.mesh.children[0] as THREE.Mesh;
        if (m && m.material) m.material = clayMaterial;
      });
      torsoMesh.material = clayMaterial;
      leftEyeball.visible = false;
      rightEyeball.visible = false;
    } else if (mode === 'wireframe_only') {
      faceMesh.material = wireframeMaterial;
      hairCapMesh.material = wireframeMaterial;
      hairLocks.forEach((l) => {
        const m = l.mesh.children[0] as THREE.Mesh;
        if (m && m.material) m.material = wireframeMaterial;
      });
      torsoMesh.material = wireframeMaterial;
      leftEyeball.visible = false;
    } else if (mode === 'depth_map') {
      faceMesh.material = depthMaterial as unknown as THREE.MeshStandardMaterial;
      hairCapMesh.material = depthMaterial as unknown as THREE.MeshStandardMaterial;
      hairLocks.forEach((l) => {
        const m = l.mesh.children[0] as THREE.Mesh;
        if (m && m.material) m.material = depthMaterial as unknown as THREE.Material;
      });
      torsoMesh.material = depthMaterial as unknown as THREE.MeshStandardMaterial;
      leftEyeball.visible = false;
      rightEyeball.visible = false;
    } else {
      // photographic mode
      setTextureMode(currentTextureMode);
      hairCapMesh.material = hairTexturedMaterial;
      hairLocks.forEach((l) => {
        const m = l.mesh.children[0] as THREE.Mesh;
        if (m && m.material) m.material = hairTexturedMaterial;
      });
      torsoMesh.material = shirtMaterial;
    }
  };

  const exportOBJ = (): string => {
    let output = `# Wavefront OBJ File - Exported from AI 3D Character Studio\\n# 4-View Photographic Reconstructed 3D Head & Hair\\n\\n`;
    let vertexOffset = 1;
    let uvOffset = 1;
    let normalOffset = 1;

    const exportMesh = (mesh: THREE.Mesh, objName: string) => {
      output += `o ${objName}\\n`;
      const geom = mesh.geometry;
      const pos = geom.getAttribute('position');
      const uvs = geom.getAttribute('uv');
      const normals = geom.getAttribute('normal');
      const matrix = mesh.matrixWorld;

      if (!pos) return;

      const vCount = pos.count;
      const tempVec = new THREE.Vector3();

      for (let i = 0; i < vCount; i++) {
        tempVec.fromBufferAttribute(pos, i).applyMatrix4(matrix);
        output += `v ${tempVec.x.toFixed(4)} ${tempVec.y.toFixed(4)} ${tempVec.z.toFixed(4)}\\n`;
      }

      if (uvs) {
        for (let i = 0; i < uvs.count; i++) {
          output += `vt ${uvs.getX(i).toFixed(4)} ${uvs.getY(i).toFixed(4)}\\n`;
        }
      }

      if (normals) {
        for (let i = 0; i < normals.count; i++) {
          tempVec.fromBufferAttribute(normals, i).transformDirection(matrix);
          output += `vn ${tempVec.x.toFixed(4)} ${tempVec.y.toFixed(4)} ${tempVec.z.toFixed(4)}\\n`;
        }
      }

      const index = geom.getIndex();
      if (index) {
        for (let i = 0; i < index.count; i += 3) {
          const a = index.getX(i) + vertexOffset;
          const b = index.getX(i + 1) + vertexOffset;
          const c = index.getX(i + 2) + vertexOffset;
          if (uvs && normals) {
            const uva = index.getX(i) + uvOffset;
            const uvb = index.getX(i + 1) + uvOffset;
            const uvc = index.getX(i + 2) + uvOffset;
            const na = index.getX(i) + normalOffset;
            const nb = index.getX(i + 1) + normalOffset;
            const nc = index.getX(i + 2) + normalOffset;
            output += `f ${a}/${uva}/${na} ${b}/${uvb}/${nb} ${c}/${uvc}/${nc}\\n`;
          } else {
            output += `f ${a} ${b} ${c}\\n`;
          }
        }
      } else {
        for (let i = 0; i < vCount; i += 3) {
          const a = i + vertexOffset;
          const b = i + 1 + vertexOffset;
          const c = i + 2 + vertexOffset;
          output += `f ${a} ${b} ${c}\\n`;
        }
      }

      vertexOffset += vCount;
      if (uvs) uvOffset += uvs.count;
      if (normals) normalOffset += normals.count;
    };

    rootGroup.updateMatrixWorld(true);
    exportMesh(faceMesh, 'CharacterFace');
    exportMesh(hairCapMesh, 'CharacterHairBase');
    hairLocks.forEach((lock, idx) => {
      const child = lock.mesh.children[0];
      if (child instanceof THREE.Mesh) {
        exportMesh(child, `HairCurl_${idx}`);
      }
    });
    if (torsoMesh instanceof THREE.Mesh) {
      exportMesh(torsoMesh, 'CharacterShirt');
    }

    return output;
  };

  return {
    rootGroup,
    headGroup,
    faceMesh,
    leftEyeball,
    rightEyeball,
    leftUpperLid,
    rightUpperLid,
    leftEyebrow,
    rightEyebrow,
    mouthMesh: upperLipMesh,
    hairGroup,
    hairLocks,
    shirtGroup,
    updateGaze,
    updateHairWind,
    updateExpression,
    setTextureMode,
    setWireframe,
    updateFacialSculpt,
    setWireframeSettings,
    setDisplayShadingMode,
    exportOBJ,
  };
}
