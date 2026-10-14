export interface CharacterItem {
  id: string;
  number: number;
  name: string;
  hindiName: string;
  description: string;
  status: 'active' | 'ready_for_input';
  icon: string;
}

export const CHARACTERS_LIST: CharacterItem[] = [
  {
    id: 'character-1',
    number: 1,
    name: 'Vintage Floral Wall Lantern',
    hindiName: 'विंटेज फ्लोरल वॉल लैंप',
    description: '360° 3D Model with four-petal floral filigree, amber glass, and sunlight controls.',
    status: 'active',
    icon: 'Lamp',
  },
  {
    id: 'character-2',
    number: 2,
    name: 'Anime Stylized Male Character',
    hindiName: 'कैरेक्टर 2 (कर्ली बालों वाला बॉय)',
    description: 'Moveable pupils, wind-physics curly hair, 4-view orthographic camera, and blue shirt.',
    status: 'active',
    icon: 'User',
  },
];
