import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { CameraPreset, EnvironmentType, FinishType, LightingMode, LightSettings } from '../types/lantern';
import { buildLanternModel, LanternModelStructure } from '../utils/lanternModel';

// Pre-loaded generated texture paths
import stoneWallImg from '../assets/images/wall_stone_exterior_1791821191754.jpg';
import brickWallImg from '../assets/images/wall_brick_exterior_1791821201937.jpg';
import nightPatioImg from '../assets/images/night_patio_backdrop_1791821218426.jpg';

export interface LanternSceneRef {
  resetCamera: () => void;
  setCameraPreset: (preset: CameraPreset) => void;
  captureScreenshot: () => string | null;
}

interface LanternSceneProps {
  finish: FinishType;
  environment: EnvironmentType;
  lightingMode: LightingMode;
  lightSettings: LightSettings;
  explodeAmount: number;
  isWireframe: boolean;
  autoRotate: boolean;
  autoRotateSpeed: number;
  sunBrightness: number;
  onSelectPart: (partId: string | null) => void;
}

export const LanternScene = forwardRef<LanternSceneRef, LanternSceneProps>(
  (
    {
      finish,
      environment,
      lightingMode,
      lightSettings,
      explodeAmount,
      isWireframe,
      autoRotate,
      autoRotateSpeed,
      sunBrightness,
      onSelectPart,
    },
    ref
  ) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const sceneRef = useRef<THREE.Scene | null>(null);
    const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
    const controlsRef = useRef<OrbitControls | null>(null);
    const lanternStructureRef = useRef<LanternModelStructure | null>(null);
    const wallMeshRef = useRef<THREE.Mesh | null>(null);
    const backdropMeshRef = useRef<THREE.Mesh | null>(null);

    // Light references
    const hemiLightRef = useRef<THREE.HemisphereLight | null>(null);
    const ambientLightRef = useRef<THREE.AmbientLight | null>(null);
    const sunLightRef = useRef<THREE.DirectionalLight | null>(null);
    const fillLightRef = useRef<THREE.DirectionalLight | null>(null);
    const rimLightRef = useRef<THREE.DirectionalLight | null>(null);

    // Target camera lerping
    const targetCamPos = useRef<THREE.Vector3 | null>(null);
    const targetLookAt = useRef<THREE.Vector3 | null>(null);

    // Textures cache
    const texturesRef = useRef<Record<string, THREE.Texture>>({});
    const [isLoading, setIsLoading] = useState(true);

    // Expose imperative methods to parent
    useImperativeHandle(ref, () => ({
      resetCamera: () => {
        applyCameraPreset('photo_match');
      },
      setCameraPreset: (preset: CameraPreset) => {
        applyCameraPreset(preset);
      },
      captureScreenshot: () => {
        if (!rendererRef.current || !sceneRef.current || !cameraRef.current) return null;
        rendererRef.current.render(sceneRef.current, cameraRef.current);
        return rendererRef.current.domElement.toDataURL('image/png');
      },
    }));

    const applyCameraPreset = (preset: CameraPreset) => {
      if (!controlsRef.current || !cameraRef.current) return;
      const isMobile = window.innerWidth < 768;
      const zoomFactor = isMobile ? 1.25 : 1.0;

      switch (preset) {
        case 'photo_match':
          // Recreates the exact camera perspective of the reference photo:
          targetCamPos.current = new THREE.Vector3(-2.6 * zoomFactor, 0.45, 4.4 * zoomFactor);
          targetLookAt.current = new THREE.Vector3(-0.35, 0.35, 0);
          break;
        case 'front':
          // Straight-on view of the lantern cage facet
          targetCamPos.current = new THREE.Vector3(0, 0.45, 4.8 * zoomFactor);
          targetLookAt.current = new THREE.Vector3(0, 0.35, 0);
          break;
        case 'side':
          // Wall mount side profile
          targetCamPos.current = new THREE.Vector3(-5.0 * zoomFactor, 0.3, 0);
          targetLookAt.current = new THREE.Vector3(-0.7, 0.2, 0);
          break;
        case 'detail_filigree':
          // Macro zoom on the floral clover rosette fretwork
          targetCamPos.current = new THREE.Vector3(0.6, 0.75, 2.2);
          targetLookAt.current = new THREE.Vector3(0, 0.65, 0);
          break;
        case 'top':
          // Bird's eye view of pagoda roof and eave canopy
          targetCamPos.current = new THREE.Vector3(0, 5.0 * zoomFactor, 1.8 * zoomFactor);
          targetLookAt.current = new THREE.Vector3(0, 0.8, 0);
          break;
        case 'perspective':
        default:
          targetCamPos.current = new THREE.Vector3(2.6 * zoomFactor, 1.2, 4.2 * zoomFactor);
          targetLookAt.current = new THREE.Vector3(0, 0.4, 0);
          break;
      }
    };

    // Initialize Three.js Scene
    useEffect(() => {
      const container = containerRef.current;
      if (!container) return;

      const width = container.clientWidth || window.innerWidth;
      const height = container.clientHeight || window.innerHeight;
      const isPortrait = width < height;

      // 1. Scene setup
      const scene = new THREE.Scene();
      scene.background = new THREE.Color('#eef2f6'); // Clean bright daylight background by default
      sceneRef.current = scene;

      // 2. Camera setup - calibrated for both mobile portrait and desktop
      const fov = isPortrait ? 48 : 42;
      const initialDist = isPortrait ? 5.5 : 4.8;
      const camera = new THREE.PerspectiveCamera(fov, width / height, 0.1, 50);
      camera.position.set(-2.5 * (initialDist / 4.8), 0.45, 4.2 * (initialDist / 4.8));
      cameraRef.current = camera;

      // 3. Renderer setup
      const renderer = new THREE.WebGLRenderer({
        antialias: true,
        alpha: true,
        preserveDrawingBuffer: true,
        powerPreference: 'high-performance',
      });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      renderer.shadowMap.enabled = true;
      renderer.shadowMap.type = THREE.PCFSoftShadowMap;
      renderer.toneMapping = THREE.ACESFilmicToneMapping;
      renderer.toneMappingExposure = 1.15;
      renderer.outputColorSpace = THREE.SRGBColorSpace;
      rendererRef.current = renderer;

      container.replaceChildren(renderer.domElement);

      // 4. OrbitControls setup
      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.06;
      controls.target.set(-0.35, 0.35, 0);
      controls.minDistance = 1.4;
      controls.maxDistance = 12;
      controls.maxPolarAngle = Math.PI - 0.05; // allow full 360 vertical & horizontal inspection
      controls.minPolarAngle = 0.05;
      controlsRef.current = controls;

      // 5. Sun & Daylight Lighting System ("Sun ki Roshni type")
      // Hemisphere Light (Sky illumination from above + warm earth bounce from below)
      const hemiLight = new THREE.HemisphereLight(0xfff7ea, 0xdfe6ee, 1.4);
      hemiLight.position.set(0, 10, 0);
      scene.add(hemiLight);
      hemiLightRef.current = hemiLight;

      // Soft ambient daylight fill
      const ambientLight = new THREE.AmbientLight(0xffffff, 0.85);
      scene.add(ambientLight);
      ambientLightRef.current = ambientLight;

      // Main Sun Light (Warm, direct sun from upper front-right)
      const sunLight = new THREE.DirectionalLight(0xfff5e0, 2.8);
      sunLight.position.set(5, 8, 5);
      sunLight.castShadow = true;
      sunLight.shadow.mapSize.width = 2048;
      sunLight.shadow.mapSize.height = 2048;
      sunLight.shadow.bias = -0.0004;
      sunLight.shadow.camera.near = 1;
      sunLight.shadow.camera.far = 20;
      sunLight.shadow.camera.left = -3.5;
      sunLight.shadow.camera.right = 3.5;
      sunLight.shadow.camera.top = 3.5;
      sunLight.shadow.camera.bottom = -3.5;
      scene.add(sunLight);
      sunLightRef.current = sunLight;

      // Fill Daylight (Diffuse sky light from opposite side so dark metal has rich tonal depth)
      const fillLight = new THREE.DirectionalLight(0xe5eff8, 1.3);
      fillLight.position.set(-6, 4, 3);
      scene.add(fillLight);
      fillLightRef.current = fillLight;

      // Rim Light (Sharp specular highlights outlining the pagoda roof and floral filigree)
      const rimLight = new THREE.DirectionalLight(0xffffff, 1.8);
      rimLight.position.set(0, 5, -5);
      scene.add(rimLight);
      rimLightRef.current = rimLight;

      // 6. Wall & Ground Environment Setup
      const textureLoader = new THREE.TextureLoader();

      const stoneTex = textureLoader.load(stoneWallImg);
      stoneTex.wrapS = THREE.RepeatWrapping;
      stoneTex.wrapT = THREE.RepeatWrapping;
      stoneTex.repeat.set(3, 3);
      texturesRef.current['stone'] = stoneTex;

      const brickTex = textureLoader.load(brickWallImg);
      brickTex.wrapS = THREE.RepeatWrapping;
      brickTex.wrapT = THREE.RepeatWrapping;
      brickTex.repeat.set(3, 3);
      texturesRef.current['brick'] = brickTex;

      const patioTex = textureLoader.load(nightPatioImg);
      patioTex.colorSpace = THREE.SRGBColorSpace;
      texturesRef.current['patio'] = patioTex;

      // Wall Mesh (Plane representing the wall at X = -2.15 flush against baseplate)
      const wallGeometry = new THREE.PlaneGeometry(16, 16);
      wallGeometry.rotateY(Math.PI / 2);
      const wallMaterial = new THREE.MeshStandardMaterial({
        color: '#e4dfd5',
        map: stoneTex,
        roughness: 0.85,
        metalness: 0.05,
      });
      const wallMesh = new THREE.Mesh(wallGeometry, wallMaterial);
      wallMesh.position.set(-2.15, 0.5, 0);
      wallMesh.receiveShadow = true;
      scene.add(wallMesh);
      wallMeshRef.current = wallMesh;

      // Backdrop for night patio mode
      const backdropGeom = new THREE.PlaneGeometry(24, 14);
      backdropGeom.rotateY(Math.PI / 2);
      const backdropMat = new THREE.MeshBasicMaterial({
        map: patioTex,
        side: THREE.DoubleSide,
      });
      const backdropMesh = new THREE.Mesh(backdropGeom, backdropMat);
      backdropMesh.position.set(-6, 1, 0);
      backdropMesh.visible = false;
      scene.add(backdropMesh);
      backdropMeshRef.current = backdropMesh;

      // 7. Build Lantern 3D Model
      const lanternStructure = buildLanternModel(finish, isWireframe);
      scene.add(lanternStructure.rootGroup);
      lanternStructureRef.current = lanternStructure;

      setIsLoading(false);

      // 8. Raycasting for hover & click inspection
      const raycaster = new THREE.Raycaster();
      const mouse = new THREE.Vector2();

      const handleClick = (event: MouseEvent) => {
        const rect = renderer.domElement.getBoundingClientRect();
        mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
        mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

        raycaster.setFromCamera(mouse, camera);
        const intersects = raycaster.intersectObjects(lanternStructure.interactiveParts, false);

        if (intersects.length > 0) {
          const hit = intersects[0].object as THREE.Mesh;
          if (hit.userData?.partId) {
            onSelectPart(hit.userData.partId);
          }
        } else {
          onSelectPart(null);
        }
      };

      renderer.domElement.addEventListener('click', handleClick);

      // 9. Resize Handling
      const handleResize = () => {
        if (!containerRef.current || !rendererRef.current || !cameraRef.current) return;
        const w = containerRef.current.clientWidth;
        const h = containerRef.current.clientHeight;
        const portrait = w < h;
        cameraRef.current.fov = portrait ? 48 : 42;
        cameraRef.current.aspect = w / h;
        cameraRef.current.updateProjectionMatrix();
        rendererRef.current.setSize(w, h);
      };

      window.addEventListener('resize', handleResize);

      const handleContextLost = (e: Event) => {
        e.preventDefault();
        console.warn('WebGL context lost.');
      };

      const handleContextRestored = () => {
        console.info('WebGL context restored.');
        handleResize();
      };

      renderer.domElement.addEventListener('webglcontextlost', handleContextLost);
      renderer.domElement.addEventListener('webglcontextrestored', handleContextRestored);

      // 10. Animation Loop
      let animationFrameId: number;
      let clock = new THREE.Clock();

      const animate = () => {
        animationFrameId = requestAnimationFrame(animate);

        const delta = clock.getDelta();
        const time = clock.getElapsedTime();

        // Smooth camera lerp when preset changed
        if (targetCamPos.current && targetLookAt.current) {
          camera.position.lerp(targetCamPos.current, 0.08);
          controls.target.lerp(targetLookAt.current, 0.08);

          if (camera.position.distanceTo(targetCamPos.current) < 0.02) {
            targetCamPos.current = null;
            targetLookAt.current = null;
          }
        }

        // Auto-rotation in 360 degrees
        if (autoRotate && lanternStructureRef.current) {
          lanternStructureRef.current.rootGroup.rotation.y += autoRotateSpeed * 0.015;
        }

        // Filament flicker simulation if enabled
        if (lightSettings.isOn && lightSettings.flickerEffect && lanternStructureRef.current) {
          const flickerNoise = Math.sin(time * 24) * 0.05 + Math.cos(time * 41) * 0.04;
          lanternStructureRef.current.bulbLight.intensity = Math.max(
            0.5,
            (lightSettings.intensity + flickerNoise) * 2.0
          );
        }

        controls.update();
        renderer.render(scene, camera);
      };

      animate();

      return () => {
        cancelAnimationFrame(animationFrameId);
        window.removeEventListener('resize', handleResize);
        if (renderer.domElement) {
          renderer.domElement.removeEventListener('click', handleClick);
          renderer.domElement.removeEventListener('webglcontextlost', handleContextLost);
          renderer.domElement.removeEventListener('webglcontextrestored', handleContextRestored);
        }
        renderer.dispose();
      };
    }, []);

    // Synchronize Material Finish & Wireframe
    useEffect(() => {
      if (!lanternStructureRef.current) return;
      lanternStructureRef.current.updateMaterials(finish, isWireframe);
    }, [finish, isWireframe]);

    // Synchronize Exploded View
    useEffect(() => {
      if (!lanternStructureRef.current) return;
      lanternStructureRef.current.updateExplode(explodeAmount);
    }, [explodeAmount]);

    // Synchronize Bulb Lighting
    useEffect(() => {
      if (!lanternStructureRef.current) return;
      lanternStructureRef.current.updateLight(lightSettings);
    }, [lightSettings]);

    // Synchronize Lighting Mode & Sun Brightness ("Sun ki Roshni type")
    useEffect(() => {
      if (
        !sceneRef.current ||
        !wallMeshRef.current ||
        !ambientLightRef.current ||
        !sunLightRef.current ||
        !hemiLightRef.current ||
        !fillLightRef.current ||
        !rimLightRef.current
      )
        return;

      const scene = sceneRef.current;
      const wallMat = wallMeshRef.current.material as THREE.MeshStandardMaterial;

      if (lightingMode === 'sunlight') {
        // Bright radiant sunlight mode
        const multiplier = sunBrightness || 1.0;
        scene.background = new THREE.Color('#eef2f7');
        hemiLightRef.current.intensity = 1.4 * multiplier;
        hemiLightRef.current.color.set('#fff9ee');
        hemiLightRef.current.groundColor.set('#d8e2ec');

        ambientLightRef.current.intensity = 0.9 * multiplier;
        ambientLightRef.current.color.set('#ffffff');

        sunLightRef.current.intensity = 2.8 * multiplier;
        sunLightRef.current.color.set('#fff6df');

        fillLightRef.current.intensity = 1.3 * multiplier;
        fillLightRef.current.color.set('#eaf2fc');

        rimLightRef.current.intensity = 1.8 * multiplier;
        rimLightRef.current.color.set('#ffffff');

        if (rendererRef.current) rendererRef.current.toneMappingExposure = 1.18 * multiplier;

        // Wall material lighting
        if (environment === 'sunlit_stone') {
          wallMeshRef.current.visible = true;
          if (backdropMeshRef.current) backdropMeshRef.current.visible = false;
          wallMat.map = texturesRef.current['stone'] || null;
          wallMat.color.set('#f4efe6');
          wallMat.needsUpdate = true;
        } else if (environment === 'sunlit_brick') {
          wallMeshRef.current.visible = true;
          if (backdropMeshRef.current) backdropMeshRef.current.visible = false;
          wallMat.map = texturesRef.current['brick'] || null;
          wallMat.color.set('#d88975');
          wallMat.needsUpdate = true;
        } else {
          // Bright clean neutral studio wall
          wallMeshRef.current.visible = false;
          if (backdropMeshRef.current) backdropMeshRef.current.visible = false;
        }
      } else if (lightingMode === 'studio') {
        // Soft diffuse studio white lighting
        scene.background = new THREE.Color('#f1f5f9');
        hemiLightRef.current.intensity = 1.2;
        hemiLightRef.current.color.set('#ffffff');
        hemiLightRef.current.groundColor.set('#e2e8f0');

        ambientLightRef.current.intensity = 1.1;
        ambientLightRef.current.color.set('#ffffff');

        sunLightRef.current.intensity = 2.0;
        sunLightRef.current.color.set('#ffffff');

        fillLightRef.current.intensity = 1.4;
        fillLightRef.current.color.set('#f8fafc');

        rimLightRef.current.intensity = 1.6;
        rimLightRef.current.color.set('#ffffff');

        if (rendererRef.current) rendererRef.current.toneMappingExposure = 1.12;

        wallMeshRef.current.visible = environment !== 'bright_studio';
        wallMat.color.set('#e2e8f0');
      } else {
        // Night mode with dramatic glowing lantern
        scene.background = new THREE.Color('#0b0e14');
        hemiLightRef.current.intensity = 0.2;
        hemiLightRef.current.color.set('#1e293b');
        hemiLightRef.current.groundColor.set('#0f172a');

        ambientLightRef.current.intensity = 0.25;
        ambientLightRef.current.color.set('#1e293b');

        sunLightRef.current.intensity = 0.6;
        sunLightRef.current.color.set('#64748b');

        fillLightRef.current.intensity = 0.35;
        fillLightRef.current.color.set('#334155');

        rimLightRef.current.intensity = 1.2;
        rimLightRef.current.color.set('#94a3b8');

        if (rendererRef.current) rendererRef.current.toneMappingExposure = 1.05;

        if (environment === 'night_patio') {
          wallMeshRef.current.visible = true;
          wallMat.color.set('#2f2a24');
          if (backdropMeshRef.current) backdropMeshRef.current.visible = true;
        } else {
          wallMeshRef.current.visible = environment !== 'bright_studio';
          wallMat.color.set('#3b404d');
          if (backdropMeshRef.current) backdropMeshRef.current.visible = false;
        }
      }
    }, [lightingMode, environment, sunBrightness]);

    return (
      <div className="relative w-full h-full select-none overflow-hidden">
        {/* Three.js Canvas Container */}
        <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />

        {/* Loading Spinner */}
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-neutral-900/40 backdrop-blur-sm z-30">
            <div className="flex flex-col items-center gap-3 text-neutral-800">
              <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm font-semibold tracking-wide">Loading 3D Lantern Studio...</span>
            </div>
          </div>
        )}
      </div>
    );
  }
);

LanternScene.displayName = 'LanternScene';
