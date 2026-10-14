import React, { useEffect, useRef, useState, useImperativeHandle, forwardRef } from 'react';
import * as THREE from 'three';
import { Point3D, WireframeModel } from '../../modules/types';

export interface ThreeWireframeCanvasRef {
  setCameraPreset: (preset: 'front' | 'back' | 'left' | 'right' | 'top' | 'bottom' | 'perspective') => void;
  resetCamera: () => void;
  captureScreenshot: () => string;
}

interface ThreeWireframeCanvasProps {
  wireframe: WireframeModel | null;
  selectedPointId?: string | null;
  onSelectPoint?: (point: Point3D | null) => void;
  autoRotate?: boolean;
  autoRotateSpeed?: number;
  showPoints?: boolean;
  showEdges?: boolean;
  showSkullRings?: boolean;
  showFacialLoops?: boolean;
  showAxes?: boolean;
  showGrid?: boolean;
  pointSize?: number;
  themeColor?: 'cyan' | 'amber' | 'emerald' | 'monochrome';
}

export const ThreeWireframeCanvas = forwardRef<ThreeWireframeCanvasRef, ThreeWireframeCanvasProps>(
  (
    {
      wireframe,
      selectedPointId,
      onSelectPoint,
      autoRotate = false,
      autoRotateSpeed = 1.0,
      showPoints = true,
      showEdges = true,
      showSkullRings = true,
      showFacialLoops = true,
      showAxes = true,
      showGrid = true,
      pointSize = 3.5,
      themeColor = 'cyan',
    },
    ref
  ) => {
    const containerRef = useRef<HTMLDivElement>(null);
    const sceneRef = useRef<THREE.Scene | null>(null);
    const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
    const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
    const wireframeGroupRef = useRef<THREE.Group | null>(null);

    // Orbit control state (manual smooth implementation without external orbit dependency)
    const isDraggingRef = useRef(false);
    const isPanningRef = useRef(false);
    const previousMousePositionRef = useRef({ x: 0, y: 0 });
    const sphericalRef = useRef({ radius: 320, theta: 0.6, phi: 1.3 });
    const targetRef = useRef(new THREE.Vector3(0, -10, 0));

    const [hoveredPoint, setHoveredPoint] = useState<Point3D | null>(null);

    // Camera preset helper
    const applyPreset = (preset: 'front' | 'back' | 'left' | 'right' | 'top' | 'bottom' | 'perspective') => {
      targetRef.current.set(0, -10, 0);
      switch (preset) {
        case 'front':
          sphericalRef.current = { radius: 300, theta: 0, phi: Math.PI / 2 };
          break;
        case 'back':
          sphericalRef.current = { radius: 300, theta: Math.PI, phi: Math.PI / 2 };
          break;
        case 'left':
          sphericalRef.current = { radius: 300, theta: -Math.PI / 2, phi: Math.PI / 2 };
          break;
        case 'right':
          sphericalRef.current = { radius: 300, theta: Math.PI / 2, phi: Math.PI / 2 };
          break;
        case 'top':
          sphericalRef.current = { radius: 300, theta: 0, phi: 0.05 };
          break;
        case 'bottom':
          sphericalRef.current = { radius: 300, theta: 0, phi: Math.PI - 0.05 };
          break;
        case 'perspective':
        default:
          sphericalRef.current = { radius: 320, theta: 0.6, phi: 1.3 };
          break;
      }
      updateCameraFromSpherical();
    };

    const updateCameraFromSpherical = () => {
      if (!cameraRef.current) return;
      const { radius, theta, phi } = sphericalRef.current;
      const x = radius * Math.sin(phi) * Math.sin(theta);
      const y = radius * Math.cos(phi);
      const z = radius * Math.sin(phi) * Math.cos(theta);

      cameraRef.current.position.set(
        targetRef.current.x + x,
        targetRef.current.y + y,
        targetRef.current.z + z
      );
      cameraRef.current.lookAt(targetRef.current);
    };

    useImperativeHandle(ref, () => ({
      setCameraPreset: applyPreset,
      resetCamera: () => applyPreset('perspective'),
      captureScreenshot: () => {
        if (!rendererRef.current) return '';
        rendererRef.current.render(sceneRef.current!, cameraRef.current!);
        return rendererRef.current.domElement.toDataURL('image/png');
      },
    }));

    // Initialize Three.js scene
    useEffect(() => {
      const container = containerRef.current;
      if (!container) return;

      const width = container.clientWidth || 800;
      const height = container.clientHeight || 600;

      const scene = new THREE.Scene();
      scene.background = new THREE.Color(0x090d16); // Deep slate canvas
      sceneRef.current = scene;

      const camera = new THREE.PerspectiveCamera(40, width / height, 1, 2000);
      cameraRef.current = camera;
      updateCameraFromSpherical();

      const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
      renderer.setSize(width, height);
      renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
      rendererRef.current = renderer;

      container.replaceChildren(renderer.domElement);

      // Grid helper
      const grid = new THREE.GridHelper(300, 20, 0x1e293b, 0x0f172a);
      grid.position.y = -125;
      grid.name = 'gridHelper';
      scene.add(grid);

      // Coordinate axes
      const axes = new THREE.AxesHelper(60);
      axes.position.set(-110, -120, -110);
      axes.name = 'axesHelper';
      scene.add(axes);

      // Wireframe group
      const wireframeGroup = new THREE.Group();
      scene.add(wireframeGroup);
      wireframeGroupRef.current = wireframeGroup;

      let animationFrameId: number;

      const animate = () => {
        animationFrameId = requestAnimationFrame(animate);

        if (autoRotate) {
          sphericalRef.current.theta += 0.005 * autoRotateSpeed;
          updateCameraFromSpherical();
        }

        renderer.render(scene, camera);
      };

      animate();

      const handleResize = () => {
        if (!container || !renderer || !camera) return;
        const w = container.clientWidth;
        const h = container.clientHeight;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      };

      window.addEventListener('resize', handleResize);

      return () => {
        window.removeEventListener('resize', handleResize);
        cancelAnimationFrame(animationFrameId);
        renderer.dispose();
      };
    }, []);

    // Rebuild wireframe Three.js geometry whenever wireframe data or display options change
    useEffect(() => {
      const group = wireframeGroupRef.current;
      if (!group) return;

      // Clear existing geometry
      while (group.children.length > 0) {
        const obj = group.children[0];
        group.remove(obj);
        if (obj instanceof THREE.Points || obj instanceof THREE.LineSegments) {
          obj.geometry.dispose();
          if (Array.isArray(obj.material)) {
            obj.material.forEach((m) => m.dispose());
          } else {
            obj.material.dispose();
          }
        }
      }

      if (!wireframe) return;

      const vertexMap = new Map<string, Point3D>();
      for (const v of wireframe.vertices) {
        vertexMap.set(v.id, v);
      }

      // 1. Build Edges (Lines)
      if (showEdges) {
        const skullEdges: number[] = [];
        const facialEdges: number[] = [];
        const meridianEdges: number[] = [];
        const inferredEdges: number[] = [];

        for (const edge of wireframe.edges) {
          const ptA = vertexMap.get(edge.sourceId);
          const ptB = vertexMap.get(edge.targetId);
          if (!ptA || !ptB) continue;

          if (edge.category === 'skull_ring') {
            if (showSkullRings) {
              skullEdges.push(ptA.x, ptA.y, ptA.z, ptB.x, ptB.y, ptB.z);
            }
          } else if (edge.category === 'meridian') {
            if (showSkullRings) {
              meridianEdges.push(ptA.x, ptA.y, ptA.z, ptB.x, ptB.y, ptB.z);
            }
          } else if (edge.category === 'facial_loop') {
            if (showFacialLoops) {
              facialEdges.push(ptA.x, ptA.y, ptA.z, ptB.x, ptB.y, ptB.z);
            }
          } else {
            inferredEdges.push(ptA.x, ptA.y, ptA.z, ptB.x, ptB.y, ptB.z);
          }
        }

        // Add Skull Rings lines
        if (skullEdges.length > 0) {
          const geom = new THREE.BufferGeometry();
          geom.setAttribute('position', new THREE.Float32BufferAttribute(skullEdges, 3));
          const mat = new THREE.LineBasicMaterial({
            color: themeColor === 'cyan' ? 0x38bdf8 : themeColor === 'amber' ? 0xf59e0b : 0x10b981,
            linewidth: 1,
            transparent: true,
            opacity: 0.85,
          });
          group.add(new THREE.LineSegments(geom, mat));
        }

        // Add Longitudinal Meridians lines
        if (meridianEdges.length > 0) {
          const geom = new THREE.BufferGeometry();
          geom.setAttribute('position', new THREE.Float32BufferAttribute(meridianEdges, 3));
          const mat = new THREE.LineBasicMaterial({
            color: 0x0284c7,
            linewidth: 1,
            transparent: true,
            opacity: 0.45,
          });
          group.add(new THREE.LineSegments(geom, mat));
        }

        // Add Facial Feature Loops lines
        if (facialEdges.length > 0) {
          const geom = new THREE.BufferGeometry();
          geom.setAttribute('position', new THREE.Float32BufferAttribute(facialEdges, 3));
          const mat = new THREE.LineBasicMaterial({
            color: 0xf59e0b, // Vibrant Gold
            linewidth: 2,
            transparent: true,
            opacity: 0.95,
          });
          group.add(new THREE.LineSegments(geom, mat));
        }

        // Add Inferred Lines
        if (inferredEdges.length > 0) {
          const geom = new THREE.BufferGeometry();
          geom.setAttribute('position', new THREE.Float32BufferAttribute(inferredEdges, 3));
          const mat = new THREE.LineBasicMaterial({
            color: 0x94a3b8,
            linewidth: 1,
            transparent: true,
            opacity: 0.5,
          });
          group.add(new THREE.LineSegments(geom, mat));
        }
      }

      // 2. Build Vertices (Points)
      if (showPoints) {
        const coords: number[] = [];
        const colors: number[] = [];

        for (const pt of wireframe.vertices) {
          coords.push(pt.x, pt.y, pt.z);

          // Color-code point categories
          if (pt.id === selectedPointId) {
            colors.push(1.0, 0.2, 0.2); // Red for selected
          } else if (pt.category === 'skull_ring') {
            colors.push(0.22, 0.74, 0.97); // Cyan
          } else if (pt.category === 'eye' || pt.category === 'nose' || pt.category === 'mouth') {
            colors.push(0.96, 0.62, 0.04); // Amber
          } else {
            colors.push(0.06, 0.78, 0.58); // Emerald
          }
        }

        const pointGeom = new THREE.BufferGeometry();
        pointGeom.setAttribute('position', new THREE.Float32BufferAttribute(coords, 3));
        pointGeom.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));

        const pointMat = new THREE.PointsMaterial({
          size: pointSize,
          vertexColors: true,
          sizeAttenuation: true,
          transparent: true,
          opacity: 0.9,
        });

        const pointsObj = new THREE.Points(pointGeom, pointMat);
        pointsObj.name = 'wireframePoints';
        group.add(pointsObj);
      }
    }, [
      wireframe,
      showPoints,
      showEdges,
      showSkullRings,
      showFacialLoops,
      pointSize,
      themeColor,
      selectedPointId,
    ]);

    // Visibility toggles for grid and axes
    useEffect(() => {
      const scene = sceneRef.current;
      if (!scene) return;
      const grid = scene.getObjectByName('gridHelper');
      if (grid) grid.visible = showGrid;
      const axes = scene.getObjectByName('axesHelper');
      if (axes) axes.visible = showAxes;
    }, [showGrid, showAxes]);

    // Mouse & Touch Orbit Interactions
    const handleMouseDown = (e: React.MouseEvent) => {
      if (e.button === 2) {
        isPanningRef.current = true;
      } else {
        isDraggingRef.current = true;
      }
      previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
    };

    const handleMouseMove = (e: React.MouseEvent) => {
      const dx = e.clientX - previousMousePositionRef.current.x;
      const dy = e.clientY - previousMousePositionRef.current.y;
      previousMousePositionRef.current = { x: e.clientX, y: e.clientY };

      if (isDraggingRef.current) {
        sphericalRef.current.theta -= dx * 0.008;
        sphericalRef.current.phi = Math.max(
          0.05,
          Math.min(Math.PI - 0.05, sphericalRef.current.phi - dy * 0.008)
        );
        updateCameraFromSpherical();
      } else if (isPanningRef.current) {
        targetRef.current.x -= dx * 0.25;
        targetRef.current.y += dy * 0.25;
        updateCameraFromSpherical();
      }
    };

    const handleMouseUp = () => {
      isDraggingRef.current = false;
      isPanningRef.current = false;
    };

    const handleWheel = (e: React.WheelEvent) => {
      sphericalRef.current.radius = Math.max(
        80,
        Math.min(800, sphericalRef.current.radius + e.deltaY * 0.4)
      );
      updateCameraFromSpherical();
    };

    // Touch event handlers for mobile
    const touchStartRef = useRef<{ x: number; y: number; dist: number }>({ x: 0, y: 0, dist: 0 });

    const handleTouchStart = (e: React.TouchEvent) => {
      if (e.touches.length === 1) {
        isDraggingRef.current = true;
        touchStartRef.current = {
          x: e.touches[0].clientX,
          y: e.touches[0].clientY,
          dist: 0,
        };
      } else if (e.touches.length === 2) {
        isDraggingRef.current = false;
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        touchStartRef.current.dist = Math.sqrt(dx * dx + dy * dy);
      }
    };

    const handleTouchMove = (e: React.TouchEvent) => {
      if (e.touches.length === 1 && isDraggingRef.current) {
        const dx = e.touches[0].clientX - touchStartRef.current.x;
        const dy = e.touches[0].clientY - touchStartRef.current.y;
        touchStartRef.current.x = e.touches[0].clientX;
        touchStartRef.current.y = e.touches[0].clientY;

        sphericalRef.current.theta -= dx * 0.01;
        sphericalRef.current.phi = Math.max(
          0.05,
          Math.min(Math.PI - 0.05, sphericalRef.current.phi - dy * 0.01)
        );
        updateCameraFromSpherical();
      } else if (e.touches.length === 2) {
        const dx = e.touches[0].clientX - e.touches[1].clientX;
        const dy = e.touches[0].clientY - e.touches[1].clientY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const delta = touchStartRef.current.dist - dist;
        touchStartRef.current.dist = dist;

        sphericalRef.current.radius = Math.max(
          80,
          Math.min(800, sphericalRef.current.radius + delta * 0.8)
        );
        updateCameraFromSpherical();
      }
    };

    const handleTouchEnd = () => {
      isDraggingRef.current = false;
    };

    return (
      <div
        ref={containerRef}
        className="relative w-full h-full cursor-grab active:cursor-grabbing select-none overflow-hidden"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onContextMenu={(e) => e.preventDefault()}
      >
        {/* Hover Point Tooltip */}
        {hoveredPoint && (
          <div className="absolute top-4 left-4 pointer-events-none z-10 px-3 py-1.5 rounded-lg bg-slate-900/90 border border-slate-700 text-xs text-slate-200 shadow-xl backdrop-blur-md">
            <span className="font-semibold text-cyan-400">{hoveredPoint.label}</span>
            <div className="text-[11px] font-mono text-slate-400">
              X: {hoveredPoint.x}mm · Y: {hoveredPoint.y}mm · Z: {hoveredPoint.z}mm
            </div>
          </div>
        )}
      </div>
    );
  }
);
