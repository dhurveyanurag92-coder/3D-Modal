import * as THREE from 'three';
import { FinishType, FINISH_PRESETS } from '../types/lantern';

// Cache texture loader
const textureLoader = new THREE.TextureLoader();

export function createLanternMaterials(finish: FinishType, wireframe: boolean = false) {
  const preset = FINISH_PRESETS[finish];

  // Cast metal material (used for backplate, arm, cage frame, finials, roof)
  const metalMaterial = new THREE.MeshStandardMaterial({
    color: new THREE.Color(preset.color),
    metalness: preset.metalness,
    roughness: preset.roughness,
    wireframe: wireframe,
  });

  // Floral filigree material (slightly higher metallic sheen for the fine wirework)
  const filigreeMaterial = new THREE.MeshStandardMaterial({
    color: new THREE.Color(preset.color),
    metalness: Math.min(1, preset.metalness + 0.1),
    roughness: Math.max(0.2, preset.roughness - 0.1),
    wireframe: wireframe,
  });

  // Brass/gold accents (screw nuts, inner socket holder)
  const brassAccentMaterial = new THREE.MeshStandardMaterial({
    color: new THREE.Color('#d4af37'),
    metalness: 0.85,
    roughness: 0.25,
    wireframe: wireframe,
  });

  // Glass material for the 6 facets (sealed carriage glass with warm amber translucency)
  const glassMaterial = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color('#fff9ee'),
    emissive: new THREE.Color('#38220c'),
    emissiveIntensity: 0.2,
    transmission: 0.82,
    opacity: 1,
    transparent: true,
    roughness: 0.18,
    ior: 1.52,
    thickness: 0.45,
    reflectivity: 0.75,
    clearcoat: 0.4,
    wireframe: wireframe,
    side: THREE.DoubleSide,
  });

  // Bulb glass
  const bulbGlassMaterial = new THREE.MeshPhysicalMaterial({
    color: new THREE.Color('#ffffff'),
    transmission: 0.96,
    opacity: 1,
    transparent: true,
    roughness: 0.05,
    ior: 1.5,
    thickness: 0.2,
    wireframe: wireframe,
    side: THREE.DoubleSide,
  });

  // Glowing filament
  const filamentMaterial = new THREE.MeshBasicMaterial({
    color: new THREE.Color('#fff4cc'),
    wireframe: wireframe,
  });

  return {
    metalMaterial,
    filigreeMaterial,
    brassAccentMaterial,
    glassMaterial,
    bulbGlassMaterial,
    filamentMaterial,
  };
}

export function loadWallTexture(url: string, onLoad?: (texture: THREE.Texture) => void) {
  return textureLoader.load(url, (tex) => {
    tex.wrapS = THREE.RepeatWrapping;
    tex.wrapT = THREE.RepeatWrapping;
    tex.repeat.set(2, 2);
    if (onLoad) onLoad(tex);
  });
}
