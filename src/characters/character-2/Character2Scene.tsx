import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import {
  Character2CameraPreset,
  LightingPreset,
  EyeGazeSettings,
  HairPhysicsSettings,
  ExpressionSettings,
  TextureMode,
  FacialSculptSettings,
  WireframeSettings,
  DisplayShadingMode,
} from './types';
import { buildCharacter2Model, Character2ModelStructure } from './characterModel';

export interface Character2SceneRef {
  setCameraPreset: (preset: Character2CameraPreset) => void;
  resetCamera: () => void;
  captureScreenshot: () => string | null;
  exportOBJ: () => string | null;
}

interface Character2SceneProps {
  lightingPreset: LightingPreset;
  textureMode: TextureMode;
  shadingMode?: DisplayShadingMode;
  sculptSettings?: FacialSculptSettings;
  wireframeSettings?: WireframeSettings;
  gazeSettings: EyeGazeSettings;
  hairSettings: HairPhysicsSettings;
  expressionSettings: ExpressionSettings;
  isWireframe: boolean;
  autoRotate: boolean;
  autoRotateSpeed: number;
}

export const Character2Scene = forwardRef<Character2SceneRef, Character2SceneProps>(
  (
    {
      lightingPreset,
      textureMode,
      shadingMode = 'photographic',
      sculptSettings,
      wireframeSettings,
      gazeSettings,
      hairSettings,
      expressionSettings,
      isWireframe,
      autoRotate,
      autoRotateSpeed,
    },
    ref
  ) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const sceneRef = useRef<THREE.Scene | null>(null);
    const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
    const controlsRef = useRef<OrbitControls | null>(null);
    const modelStructureRef = useRef<Character2ModelStructure | null>(null);

    // Lights
    const hemiLightRef = useRef<THREE.HemisphereLight | null>(null);
    const sunLightRef = useRef<THREE.DirectionalLight | null>(null);
    const fillLightRef = useRef<THREE.DirectionalLight | null>(null);
    const rimLightRef = useRef<THREE.DirectionalLight | null>(null);

    // Camera animation target
    const targetCamPos = useRef<THREE.Vector3 | null>(null);
    const targetLookAt = useRef<THREE.Vector3 | null>(null);

    // Mouse tracking for gaze follow
    const mousePos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });
    const [isLoading, setIsLoading] = useState(true);

    useImperativeHandle(ref, () => ({
      resetCamera: () => {
        applyCameraPreset('front');
      },
      setCameraPreset: (preset: Character2CameraPreset) => {
        applyCameraPreset(preset);
      },
      captureScreenshot: () => {
        if (!rendererRef.current || !sceneRef.current || !cameraRef.current) return null;
        rendererRef.current.render(sceneRef.current, cameraRef.current);
        return rendererRef.current.domElement.toDataURL('image/png');
      },
      exportOBJ: () => {
        if (!modelStructureRef.current) return null;
        return modelStructureRef.current.exportOBJ();
      },
    }));

    const applyCameraPreset = (preset: Character2CameraPreset) => {
      if (!cameraRef.current || !controlsRef.current) return;
      const isMobile = window.innerWidth < 768;
      const zoom = isMobile ? 1.25 : 1.0;

      switch (preset) {
        case 'front':
          // Front View (Matches Front View reference image)
          targetCamPos.current = new THREE.Vector3(0, 1.05, 3.8 * zoom);
          targetLookAt.current = new THREE.Vector3(0, 1.05, 0);
          break;
        case 'left_profile':
          // Left Profile (Matches Left side reference image)
          targetCamPos.current = new THREE.Vector3(-4.0 * zoom, 1.05, 0);
          targetLookAt.current = new THREE.Vector3(0, 1.05, 0);
          break;
        case 'right_profile':
          // Right Profile (Matches Right side reference image)
          targetCamPos.current = new THREE.Vector3(4.0 * zoom, 1.05, 0);
          targetLookAt.current = new THREE.Vector3(0, 1.05, 0);
          break;
        case 'back':
          // Back View (Matches Back View reference image)
          targetCamPos.current = new THREE.Vector3(0, 1.05, -4.0 * zoom);
          targetLookAt.current = new THREE.Vector3(0, 1.05, 0);
          break;
        case 'closeup_face':
          // Close-up Macro on Eyes, Nose & Hair Bangs
          targetCamPos.current = new THREE.Vector3(0, 1.15, 1.9);
          targetLookAt.current = new THREE.Vector3(0, 1.1, 0.4);
          break;
        case 'three_quarter':
        default:
          targetCamPos.current = new THREE.Vector3(2.2 * zoom, 1.35, 3.2 * zoom);
          targetLookAt.current = new THREE.Vector3(0, 1.05, 0);
          break;
      }
    };

    useEffect(() => {
      const container = containerRef.current;
      if (!container) return;

      const width = container.clientWidth || window.innerWidth;
      const height = container.clientHeight || window.innerHeight;
      const isPortrait = width < height;

      const scene = new THREE.Scene();
      scene.background = new THREE.Color('#f0f4f8'); // Clean anime studio backdrop
      sceneRef.current = scene;

      const fov = isPortrait ? 48 : 42;
      const initialDist = isPortrait ? 4.6 : 3.8;
      const camera = new THREE.PerspectiveCamera(fov, width / height, 0.1, 50);
      camera.position.set(0, 1.05, initialDist);
      cameraRef.current = camera;

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

      const controls = new OrbitControls(camera, renderer.domElement);
      controls.enableDamping = true;
      controls.dampingFactor = 0.06;
      controls.target.set(0, 1.05, 0);
      controls.minDistance = 1.4;
      controls.maxDistance = 8.5;
      controls.maxPolarAngle = Math.PI - 0.1;
      controls.minPolarAngle = 0.1;
      controlsRef.current = controls;

      // Studio Lighting System calibrated for anime stylized characters
      const hemiLight = new THREE.HemisphereLight(0xfff8ee, 0xd8e4f0, 1.35);
      hemiLight.position.set(0, 10, 0);
      scene.add(hemiLight);
      hemiLightRef.current = hemiLight;

      const sunLight = new THREE.DirectionalLight(0xfff6e6, 2.4);
      sunLight.position.set(4, 7, 5);
      sunLight.castShadow = true;
      sunLight.shadow.mapSize.width = 2048;
      sunLight.shadow.mapSize.height = 2048;
      sunLight.shadow.bias = -0.0004;
      scene.add(sunLight);
      sunLightRef.current = sunLight;

      const fillLight = new THREE.DirectionalLight(0xe8f2fc, 1.2);
      fillLight.position.set(-5, 4, 3);
      scene.add(fillLight);
      fillLightRef.current = fillLight;

      const rimLight = new THREE.DirectionalLight(0xffffff, 1.6);
      rimLight.position.set(0, 6, -5);
      scene.add(rimLight);
      rimLightRef.current = rimLight;

      // Pedestal Base
      const daisGeom = new THREE.CylinderGeometry(1.6, 1.8, 0.2, 48);
      const daisMat = new THREE.MeshStandardMaterial({
        color: '#e2e8f0',
        roughness: 0.5,
        metalness: 0.1,
      });
      const daisMesh = new THREE.Mesh(daisGeom, daisMat);
      daisMesh.position.set(0, -1.5, 0);
      daisMesh.receiveShadow = true;
      scene.add(daisMesh);

      // Build 3D Character Model with UV Photographic Texture Mapping by default
      const characterModel = buildCharacter2Model(textureMode);
      scene.add(characterModel.rootGroup);
      modelStructureRef.current = characterModel;

      setIsLoading(false);

      // Mouse Move Tracking for Follow-Cursor Mode
      const handlePointerMove = (e: MouseEvent) => {
        const rect = renderer.domElement.getBoundingClientRect();
        mousePos.current.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
        mousePos.current.y = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      };

      window.addEventListener('pointermove', handlePointerMove);

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

      // Animation Loop
      let animId: number;
      let clock = new THREE.Clock();
      let lastBlinkTime = 0;
      let blinkDuration = 0.18;
      let isBlinking = false;

      const animate = () => {
        animId = requestAnimationFrame(animate);

        const delta = clock.getDelta();
        const time = clock.getElapsedTime();

        // Camera smooth transition
        if (targetCamPos.current && targetLookAt.current) {
          camera.position.lerp(targetCamPos.current, 0.08);
          controls.target.lerp(targetLookAt.current, 0.08);

          if (camera.position.distanceTo(targetCamPos.current) < 0.02) {
            targetCamPos.current = null;
            targetLookAt.current = null;
          }
        }

        // Auto-rotation in 360 degrees
        if (autoRotate && modelStructureRef.current) {
          modelStructureRef.current.rootGroup.rotation.y += autoRotateSpeed * 0.015;
        }

        // Hair wind physics update
        if (modelStructureRef.current) {
          modelStructureRef.current.updateHairWind(time, hairSettings);
        }

        // Eye gaze tracking
        if (modelStructureRef.current) {
          let currentLookX = gazeSettings.lookX;
          let currentLookY = gazeSettings.lookY;

          if (gazeSettings.followCursor) {
            currentLookX = THREE.MathUtils.clamp(mousePos.current.x * 1.5, -1, 1);
            currentLookY = THREE.MathUtils.clamp(mousePos.current.y * 1.5, -1, 1);
          }

          // Natural auto-blink
          let blinkVal = gazeSettings.blinkAmount;
          if (gazeSettings.autoBlink) {
            if (time - lastBlinkTime > 3.8 && !isBlinking) {
              isBlinking = true;
              lastBlinkTime = time;
            }

            if (isBlinking) {
              const blinkProgress = (time - lastBlinkTime) / blinkDuration;
              if (blinkProgress < 0.5) {
                blinkVal = blinkProgress * 2;
              } else if (blinkProgress < 1.0) {
                blinkVal = 2.0 - blinkProgress * 2;
              } else {
                isBlinking = false;
                blinkVal = 0;
              }
            }
          }

          modelStructureRef.current.updateGaze({
            ...gazeSettings,
            lookX: currentLookX,
            lookY: currentLookY,
            blinkAmount: blinkVal,
          });
        }

        controls.update();
        renderer.render(scene, camera);
      };

      animate();

      return () => {
        cancelAnimationFrame(animId);
        window.removeEventListener('pointermove', handlePointerMove);
        window.removeEventListener('resize', handleResize);
        renderer.dispose();
      };
    }, []);

    // Sync Expressions
    useEffect(() => {
      if (!modelStructureRef.current) return;
      modelStructureRef.current.updateExpression(expressionSettings);
    }, [expressionSettings]);

    // Sync Wireframe
    useEffect(() => {
      if (!modelStructureRef.current) return;
      if (wireframeSettings) {
        modelStructureRef.current.setWireframeSettings(wireframeSettings);
      } else {
        modelStructureRef.current.setWireframe(isWireframe);
      }
    }, [isWireframe, wireframeSettings]);

    // Sync Facial Sculpt Parameters
    useEffect(() => {
      if (!modelStructureRef.current || !sculptSettings) return;
      modelStructureRef.current.updateFacialSculpt(sculptSettings);
    }, [sculptSettings]);

    // Sync Shading Mode (photographic, clay_sculpt, wireframe_only)
    useEffect(() => {
      if (!modelStructureRef.current) return;
      modelStructureRef.current.setDisplayShadingMode(shadingMode);
      if (sceneRef.current) {
        if (shadingMode === 'wireframe_only') {
          sceneRef.current.background = new THREE.Color('#0a0d14'); // Pure dark backdrop matching featured-2.jpg
        } else if (shadingMode === 'clay_sculpt') {
          sceneRef.current.background = new THREE.Color('#cbd5e1'); // Neutral clay studio backdrop
        }
      }
    }, [shadingMode]);

    // Sync Texture Mode (UV Photographic vs Sculpted 3D)
    useEffect(() => {
      if (!modelStructureRef.current) return;
      modelStructureRef.current.setTextureMode(textureMode);
    }, [textureMode]);

    // Sync Lighting Presets
    useEffect(() => {
      if (!sceneRef.current || !hemiLightRef.current || !sunLightRef.current || !fillLightRef.current || !rimLightRef.current) return;

      if (lightingPreset === 'sunlight') {
        sceneRef.current.background = new THREE.Color('#eef3f8');
        hemiLightRef.current.intensity = 1.35;
        hemiLightRef.current.color.set('#fff8ee');
        sunLightRef.current.intensity = 2.4;
        sunLightRef.current.color.set('#fff6e6');
        fillLightRef.current.intensity = 1.2;
        rimLightRef.current.intensity = 1.6;
      } else if (lightingPreset === 'anime_studio') {
        sceneRef.current.background = new THREE.Color('#f5f7fb');
        hemiLightRef.current.intensity = 1.5;
        hemiLightRef.current.color.set('#ffffff');
        sunLightRef.current.intensity = 1.8;
        sunLightRef.current.color.set('#ffffff');
        fillLightRef.current.intensity = 1.4;
        rimLightRef.current.intensity = 1.2;
      } else {
        // Dramatic Rim Light
        sceneRef.current.background = new THREE.Color('#0d1117');
        hemiLightRef.current.intensity = 0.4;
        hemiLightRef.current.color.set('#38bdf8');
        sunLightRef.current.intensity = 0.9;
        sunLightRef.current.color.set('#fde047');
        fillLightRef.current.intensity = 0.5;
        rimLightRef.current.intensity = 3.2;
        rimLightRef.current.color.set('#60a5fa');
      }
    }, [lightingPreset]);

    return (
      <div className="relative w-full h-full select-none overflow-hidden">
        <div ref={containerRef} className="w-full h-full cursor-grab active:cursor-grabbing" />
        {isLoading && (
          <div className="absolute inset-0 flex items-center justify-center bg-neutral-900/40 backdrop-blur-sm z-30">
            <div className="flex flex-col items-center gap-3 text-neutral-800">
              <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
              <span className="text-sm font-semibold tracking-wide">Sculpting 3D Character...</span>
            </div>
          </div>
        )}
      </div>
    );
  }
);

Character2Scene.displayName = 'Character2Scene';
