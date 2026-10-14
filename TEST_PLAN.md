# AI-Assisted Multi-View 3D Character Creation System
## Quality Assurance & Test Plan (TEST_PLAN.md)
*Version 1.0*

---

### 1. Test Strategy & Objectives
This test plan ensures that all geometric algorithms, reference alignments, state transitions, and export pipelines remain robust, deterministic, and free of regressions across both mobile and desktop environments.

---

### 2. Testing Levels & Matrix

| Test Level | Scope | Tools / Command | Frequency |
| :--- | :--- | :--- | :--- |
| **Level 1: Static Type Check** | TypeScript compilation, strict null checks, import validity | `npm run lint` (`tsc --noEmit`) | Every code edit |
| **Level 2: Unit Tests** | Geometry calculation, UV projection formulas, Undo/Redo stack, Image transforms | Automated test suites (`tsx scripts/test-runner.ts`) | Pre-commit / Each milestone |
| **Level 3: Integration Tests** | Full pipeline: Image load → Alignment → 3D sculpt → GLB export | Automated integration specs | Each phase completion |
| **Level 4: Visual Regression & Cross-Device** | Touch controls, quad-viewport rendering, 60 FPS mobile performance | Manual protocol on actual mobile & desktop | Phase milestones |

---

### 3. Unit Test Specifications

#### Test Suite 1: Reference Transform & Anchor Math
- **UT-1.1**: Image transform scaling preserves aspect ratio.
- **UT-1.2**: Pan offsets stay normalized within $[-2.0, 2.0]$.
- **UT-1.3**: Horizontal flip toggles X-scale sign without distorting image coordinates.
- **UT-1.4**: Anchor distance calculation: Verify head-to-chin distance accurately computes normalized vertical scale factor.

#### Test Suite 2: Geometry Generation & Mesh Quality
- **UT-2.1**: Vertex deformation produces 0 `NaN`, `null`, or infinite values across all vertex positions and normals.
- **UT-2.2**: Bounding box sanity: Head mesh dimensions strictly remain within expected bounds ($X \in [-1.5, 1.5], Y \in [0, 2.5], Z \in [-1.5, 1.5]$).
- **UT-2.3**: UV coordinate clamping: All generated UV coordinates are strictly within $[0.0, 1.0]$.
- **UT-2.4**: Polygon count tracking: Low LOD $\le 20,000$ triangles, High LOD $\le 75,000$ triangles.

#### Test Suite 3: State Management & Undo/Redo Stack
- **UT-3.1**: Applying a command increments undo stack depth.
- **UT-3.2**: Calling `undo()` precisely restores previous state snapshot.
- **UT-3.3**: Calling `redo()` after undo restores changed state.
- **UT-3.4**: A new action after undo clears the redo history.
- **UT-3.5**: Serialization to JSON and deserialization back reproduces identical state.

---

### 4. Integration & End-to-End Test Protocol

#### E2E Scenario 1: Reference Manager to 3D Alignment
1. Open Reference Manager panel.
2. Verify Front, Left, Right, and Back slots show correct images.
3. Adjust Front view opacity slider to $50\%$.
4. Verify reference overlay renders behind 3D mesh with $50\%$ transparency.
5. Drag alignment guides to align head top and chin.
6. Verify 3D model features align with reference overlay features.

#### E2E Scenario 2: Parametric Sculpting & 4-View Coherence
1. Select Front Orthographic view.
2. Adjust `jawTaper` slider from $1.0$ to $0.7$ (narrower jaw).
3. Verify chin and jaw narrow smoothly in Front View.
4. Switch to Left Profile view (-90°).
5. Verify jaw angle remains anatomically coherent without gaps or mesh tearing.
6. Adjust `noseProjection` slider from $1.0$ to $1.3$.
7. Verify nose tip extends along Z-axis matching the Left Profile reference.
8. Switch back to Front View; verify nose looks natural and centered.

#### E2E Scenario 3: GLB Model Export & Re-import
1. Click **"Export 3D Model (.glb)"**.
2. Download the `.glb` binary file.
3. Load the exported `.glb` file using Three.js `GLTFLoader`.
4. Verify mesh hierarchies, vertex count, and diffuse textures match source scene.

---

### 5. Regression Protection Checklist
- [ ] **Character 1 (Vintage Wall Lantern)** remains accessible via top navigation menu.
- [ ] Lamp finish presets (Matte Black, Bronze, Brass), amber glass, and sunlight controls continue to work without error.
- [ ] Mobile navigation (single-finger drag to rotate, on-screen zoom buttons) operates without layout jumps or horizontal overflow.
- [ ] Dev server and production build (`npm run build`) pass with zero compile warnings.
