import { SelectedPartInfo } from '../types/lantern';

export const LANTERN_PARTS: Record<string, SelectedPartInfo> = {
  wall_plate: {
    id: 'wall_plate',
    name: 'Cast Wall Mounting Escutcheon',
    hindiName: 'वॉल माउंटिंग बेस प्लेट',
    description:
      'Heavy-duty circular backplate with stepped beveled flange, interior silicone weatherproof gasket, and knurled side-locking hex fasteners.',
    specs: 'Diameter: 135mm · Thickness: 24mm · Material: Die-cast Aluminum Alloy',
  },
  sconce_arm: {
    id: 'sconce_arm',
    name: 'Gooseneck Sconce Bracket Arm',
    hindiName: 'कर्व्ड सकॉन्स ब्रैकेट आर्म',
    description:
      'Sweeping cast architectural curved arm providing 220mm wall projection, featuring flared reinforcement collars at both terminal joints.',
    specs: 'Projection: 220mm · Load Capacity: 15kg · Internal Wire Conduit: 12mm',
  },
  floral_filigree: {
    id: 'floral_filigree',
    name: 'Floral Clover Rosette Filigree Grille',
    hindiName: '4-पंखुड़ी फ्लोरल नक्काशीदार जाली',
    description:
      'The defining signature feature from the original photo: intricate 4-petal intersecting clover floral wire tracery with central bud and vertical mullion struts.',
    specs: 'Wire Gauge: 3.5mm · Pattern: Quad-Petal Floral Clover · Finish: Satin Black',
  },
  glass_panels: {
    id: 'glass_panels',
    name: 'Tempered Hexagonal Glass Panes',
    hindiName: '6-पहलू टेम्पर्ड ग्लास पैनल्स',
    description:
      'Six custom trapezoidal clear tempered glass panels with beveled perimeter seals to deliver 360-degree radiant light dispersion.',
    specs: 'Panels: 6 Facets · Thickness: 3.2mm · Light Transmission: 92% · UV Stabilized',
  },
  bulb_assembly: {
    id: 'bulb_assembly',
    name: 'Vintage Filament Bulb & Socket',
    hindiName: 'विंटेज एडिसन बल्ब और होल्डर',
    description:
      'E26/E27 porcelain screw socket with brass accents housing an ST64 vintage Edison filament bulb producing authentic warm atmospheric illumination.',
    specs: 'Socket: E26/E27 Base · Output: 600 Lumens · Color Temp: 2200K - 4000K',
  },
  cage_frame: {
    id: 'cage_frame',
    name: 'Hexagonal Tapered Lantern Cage',
    hindiName: 'हेक्सागोनल कैरिज केज फ्रेम',
    description:
      'Six-sided architectural tapered coach cage with precision corner pillars, lower water-drainage collar, and top structural frieze band.',
    specs: 'Width: 210mm · Height: 340mm · Hexagonal Geometry (6 Vertices)',
  },
  roof_hood: {
    id: 'roof_hood',
    name: 'Pagoda Canopy Hood & Flared Eaves',
    hindiName: 'पगोडा स्टाइल रूफ हुड और छतरी',
    description:
      'Stepped pagoda roof with extended protective eaves overhang to shed torrential rainwater and prevent moisture infiltration into the lamp cavity.',
    specs: 'Overhang: 245mm · IP Rating: IP65 Outdoor Weatherproof Rating',
  },
  top_finial: {
    id: 'top_finial',
    name: 'Crowning Acorn Spire Top Finial',
    hindiName: 'शीर्ष एकॉर्न स्पायर फिनियल',
    description:
      'Architectural conical spire finial with turned concentric decorative rings crowning the peak of the pagoda hood.',
    specs: 'Height: 85mm · Solid Cast Pinnacle · Threaded Top Mount',
  },
  bottom_finial: {
    id: 'bottom_finial',
    name: 'Lower Teardrop Drop Finial',
    hindiName: 'निचला ड्रॉप फिनियल और कॉलर',
    description:
      'Decorative turned receiver cup and tapered drop finial anchoring the underside of the lantern carriage assembly.',
    specs: 'Drop Length: 75mm · Concentric Bead Rings · Die-cast Metal',
  },
};
