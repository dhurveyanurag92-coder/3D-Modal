export type FinishType = 'matte_black' | 'oil_bronze' | 'antique_brass' | 'gunmetal';

export type EnvironmentType = 'sunlit_stone' | 'sunlit_brick' | 'bright_studio' | 'night_patio';

export type LightingMode = 'sunlight' | 'studio' | 'night';

export type CameraPreset = 'photo_match' | 'front' | 'side' | 'perspective' | 'detail_filigree' | 'top';

export interface LightSettings {
  isOn: boolean;
  intensity: number; // 0 to 2
  colorTemp: 'candle' | 'warm' | 'soft' | 'daylight';
  flickerEffect: boolean;
}

export interface MaterialProperties {
  name: string;
  color: string;
  metalness: number;
  roughness: number;
  clearcoat?: number;
}

export const FINISH_PRESETS: Record<FinishType, MaterialProperties> = {
  matte_black: {
    name: 'Cast Textured Black (Original)',
    color: '#2b2c30',
    metalness: 0.35,
    roughness: 0.48,
  },
  oil_bronze: {
    name: 'Oil-Rubbed Bronze',
    color: '#3a2e26',
    metalness: 0.65,
    roughness: 0.4,
  },
  antique_brass: {
    name: 'Antique Vintage Brass',
    color: '#9c7b44',
    metalness: 0.8,
    roughness: 0.3,
  },
  gunmetal: {
    name: 'Brushed Gunmetal',
    color: '#3c424a',
    metalness: 0.85,
    roughness: 0.28,
  },
};

export interface SelectedPartInfo {
  id: string;
  name: string;
  hindiName: string;
  description: string;
  specs: string;
}
