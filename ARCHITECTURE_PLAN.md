# Multi-View 3D Head Wireframe Reconstruction Studio
## Comprehensive Architecture & Specification Document (`ARCHITECTURE_PLAN.md`)
*Version 2.0 — Final Integrated Specification*

---

### 1. Mission & System Overview
The **Multi-View 3D Head Wireframe Reconstruction Studio** takes four reference photographs of a subject's head—**FRONT, BACK, LEFT PROFILE, and RIGHT PROFILE**—and reconstructs one unified, rotatable, hollow 3D head wireframe composed strictly of 3D vertices (points) and line segments (edges).

**Key System Invariants:**
1. **Hollow Wireframe Construction**: Vertices and lines only. No solid mesh, sculpted surfaces, textures, hair cards, or opaque geometry.
2. **Four-View Multi-Camera Triangulation**:
   - Coronal horizontal $X$ coordinates solved from Front & Back views.
   - Sagittal depth $Z$ coordinates solved from Left & Right profile views.
   - Vertical $Y$ coordinates aligned across all four camera views via epipolar constraint matching.
3. **Dual Topology Structure**:
   - **Horizontal Skull Cage Rings**: 10 to 24 stacked elliptical rings from crown vertex down to chin gnathion and neck cylinder, connected with longitudinal meridians.
   - **Semantic Facial Anatomical Loops**: Distinct networks for eye orbits, nose bridge/pronasale, mouth vermilion, mandibular jawline, ear contours, and posterior sagittal midline.
4. **Honest Transparent Provenance**: Clear distinction between measured ground truth, model predictions, client-side heuristic fallbacks, and inferred coordinates.
5. **Zero Forced Paid Dependencies**: Runs completely locally in browser via Three.js WebGL and HTML5 Canvas.

---

### 2. Systematic Module Architecture

```
src/
├── modules/
│   ├── types.ts                    # Universal schema: Slots, Stages, Landmarks, Points, Edges, Wireframe, Measurements
│   ├── references/
│   │   └── defaultReferences.ts    # Default 4-view photorealistic calibrated reference set
│   ├── landmarks/
│   │   └── landmarkDefinitions.ts  # 36 anatomical landmark definitions & preset coordinates
│   ├── silhouette/
│   │   └── silhouetteExtractor.ts  # Canvas color-contrast boundary extraction & horizontal span calculator
│   ├── depth/
│   │   └── depthService.ts         # Relative cranial depth estimation (Turbo/Grayscale) & fallback adapter
│   ├── normals/
│   │   └── normalsService.ts       # 3x3 Sobel kernel convolution normal vector encoder
│   ├── matching/
│   │   └── matchingEngine.ts       # Cross-view epipolar correspondence matcher & disparity checker
│   ├── solver/
│   │   └── coordinateSolver.ts     # Unified 3D XYZ coordinate triangulation & cephalometric calculator
│   ├── wireframe/
│   │   └── wireframeBuilder.ts     # Hollow line-and-point wireframe builder with rings and facial loops
│   ├── comparison/
│   │   └── comparisonEngine.ts     # Four-view orthographic reprojection & Euclidean error measurement
│   └── project/
│       ├── projectStore.ts         # 11-stage pipeline orchestrator & localStorage persistence
│       └── exportService.ts        # .OBJ, .PLY, .CSV, .JSON, .TXT and Master Archive exporter
│
├── components/
│   ├── viewport/
│   │   └── ThreeWireframeCanvas.tsx# Three.js WebGL canvas with orbit controls, camera presets, and point picking
│   ├── studio/
│   │   ├── TopBar.tsx              # Strict 3-zone Top Bar Contract (Wordmark, Nav links, Action CTA)
│   │   ├── SlideOutDrawer.tsx      # Hamburger slide-out navigation drawer with 11 stage status badges
│   │   ├── PipelineProgressPanel.tsx# Interactive 11-stage progress timeline with live execution status
│   │   └── StudioLayout.tsx        # Central workspace container coordinating pages and persistent state
│   └── pages/
│       ├── PageOverview.tsx        # Main 4-slot reference upload and pipeline launchpad
│       ├── PageLandmarks.tsx       # Interactive 2D landmark editor with pin drag and confidence inspector
│       ├── PageAlignment.tsx       # Synchronized laser guides and transform adjustment sliders
│       ├── PageSilhouette.tsx      # Extracted binary mask, contour boundary, and skull breadth profile
│       ├── PageDepthMap.tsx        # Generated depth maps, colormaps, and fallback documentation
│       ├── PageNormalMap.tsx       # Tangent-space normal maps (Sobel) and orientation guide
│       ├── PageMatching.tsx        # Cross-view landmark correspondence and epipolar disparity table
│       ├── PageCoordinates.tsx     # 3D XYZ coordinate table and cephalometric index calculator
│       ├── PageWireframeBuilder.tsx# Wireframe density, ring count, and feature layer toggles
│       ├── PageComparison.tsx      # Four-view projected wireframe overlay on reference photos
│       ├── PageValidation.tsx      # Overall quality confidence score and disparity error audit
│       ├── Page3DView.tsx          # Full-screen 3D viewport with presets, 360° turntable, and snapshot
│       └── PageExport.tsx          # Download center for .OBJ, .PLY, .CSV, and Master Archive
```

---

### 3. Eleven-Stage Process Pipeline

| Stage | Name | Input | Output | Verification Criteria |
|---|---|---|---|---|
| **01** | Image Validation & Loading | 4 Image Files / URLs | Validated Dimension & Format | 1024x1024 RGB, Aspect 1:1 verified |
| **02** | Scale & Pose Alignment | Transforms & Anchors | Normalized Height Baseline | Eye line at 38%, Chin at 61% |
| **03** | Landmark Detection & Annotation | 2D Pixel Positions | 36+ Categorized Points | Confidence score $\ge 0.85$ per point |
| **04** | Silhouette Extraction | Contrast & Threshold | Mask PNG + Horizontal Spans | Binary boundary and cranium width graph |
| **05** | Depth Map Generation | Luminance & Surface Falloff | Relative Depth Map PNG | Turbo spectrum + transparent fallback notice |
| **06** | Normal Map Generation | 3x3 Sobel Filtering | RGB Normal Vector Map PNG | Tangent-space normal vector encoding |
| **07** | Cross-View Point Matching | 2D Points across 4 Views | Unified Correspondences | Vertical disparity check $\Delta Y \le 35$ px |
| **08** | 3D Coordinate Estimation | Matched Points + Spans | Unified $X, Y, Z$ Coordinates (mm) | Cephalometric ratios & physical scale |
| **09** | Wireframe Construction | 3D Anchor Points | Hollow Wireframe Model | Elliptical rings + facial loops, 0 solid faces |
| **10** | Four-View Reprojection | Wireframe + 4 Cameras | Projected 2D Overlays + Errors | Euclidean reprojection disparity computed |
| **11** | Validation & Quality Report | Reprojection Disparities | Quality Score & Manifest | Mean disparity $< 25$ px, confidence $> 90\%$ |

---

### 4. Mathematical Conventions & Geometry

1. **Coordinate System**:
   - Cartesian Right-Handed convention.
   - $+Y$: Superior (Up toward vertex crown).
   - $-Y$: Inferior (Down toward chin gnathion and neck).
   - $+X$: Lateral Right (Dexter).
   - $-X$: Lateral Left (Sinister).
   - $+Z$: Anterior (Forward projecting, nasal dorsum).
   - $-Z$: Posterior (Backward projecting, occiput and inion).
2. **Units & Calibration**:
   - Default physiological human skull standard: Height $= 220$ mm (Vertex to Gnathion).
   - User-adjustable physical scale calibration via custom dimension input.
3. **Cranial Indices**:
   - **Cranial Index (CI)**: $\text{Width} / \text{Depth} \times 100$
     - $< 75.0$: Dolichocephalic (Elongated / Narrow skull).
     - $75.0 - 80.0$: Mesocephalic (Medium skull).
     - $> 80.0$: Brachycephalic (Broad / Round skull).
   - **Facial Index (FI)**: $\text{Height} / \text{Width} \times 100$

---

### 5. Export Deliverables & Formats
- **Wavefront OBJ (`.obj`)**: Vertices `v X Y Z` and Line segments `l v1 v2`.
- **Stanford Polygon (`.ply`)**: ASCII point cloud and edge elements.
- **Coordinate Point Cloud (`.csv` / `.json`)**: Tabular list of every vertex with coordinates, confidence, and provenance.
- **Landmark Coordinates (`.json`)**: 2D pixel positions and semantic tags.
- **Validation Audit (`.txt`)**: Text report of cephalometric measurements and disparity statistics.
- **Master Archive (`.json`)**: Unified JSON bundle containing full manifest and all stage outputs.
