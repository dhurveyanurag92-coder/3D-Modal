export type Character2CameraPreset = 'front' | 'left_profile' | 'right_profile' | 'back' | 'three_quarter' | 'closeup_face';

export type LightingPreset = 'sunlight' | 'anime_studio' | 'dramatic_rim';

export type TextureMode = 'uv_photographic' | 'sculpted_3d';

export type DisplayShadingMode = 'photographic' | 'clay_sculpt' | 'wireframe_only' | 'depth_map';

export interface FacialSculptSettings {
  noseDepth: number; // 0 to 1 (0.5 default)
  noseBridgeWidth: number; // 0 to 1
  noseTipLift: number; // 0 to 1
  jawWidth: number; // 0 to 1
  chinSharpness: number; // 0 to 1
  chinDepth: number; // 0 to 1
  cheekboneHeight: number; // 0 to 1
  eyeSocketDepth: number; // 0 to 1
  eyeSpacing: number; // 0 to 1
}

export interface WireframeSettings {
  enabled: boolean;
  color: string; // e.g. '#ff2d55' (neon pink), '#00f0ff' (cyan), '#ffb800' (gold)
  overlayOnShaded: boolean;
  density: 'low' | 'medium' | 'high';
}

export interface MultiViewPhotos {
  front: string;
  left: string;
  right: string;
  back: string;
}

export interface EyeGazeSettings {
  lookX: number; // -1 (left) to 1 (right)
  lookY: number; // -1 (down) to 1 (up)
  followCursor: boolean;
  autoBlink: boolean;
  blinkAmount: number; // 0 (open) to 1 (closed)
  show3DPupils?: boolean; // Toggle interactive 3D pupils overlay
}

export interface HairPhysicsSettings {
  windEnabled: boolean;
  windStrength: number; // 0 to 1
  windSpeed: number; // 0.5 to 3
  windDirection: number; // angle in radians
  showLayers: {
    frontBangs: boolean;
    crownWaves: boolean;
    sideburns: boolean;
    backNape: boolean;
  };
}

export interface ExpressionSettings {
  smileAmount: number; // 0 to 1
  eyebrowRaise: number; // -0.5 to 0.5
  winkLeft: boolean;
  winkRight: boolean;
}

