import { ReferenceImageSlot, ViewSlot } from '../types';

import refFrontUrl from '../../assets/images/ref_head_front_1791881409767.jpg';
import refLeftUrl from '../../assets/images/ref_head_left_1791881432783.jpg';
import refRightUrl from '../../assets/images/ref_head_right_1791881456890.jpg';
import refBackUrl from '../../assets/images/ref_head_back_1791881457569.jpg';

export const DEFAULT_REFERENCE_SLOTS: Record<ViewSlot, ReferenceImageSlot> = {
  front: {
    slot: 'front',
    url: refFrontUrl,
    name: 'Front Portrait (Anterior)',
    version: 'default_ref_v1_front',
    width: 1024,
    height: 1024,
    aspectRatio: 1,
    transform: {
      scale: 1.0,
      offsetX: 0,
      offsetY: 0,
      rotationDeg: 0,
      flipH: false,
      opacity: 1.0,
    },
    anchors: {
      headTopY: 0.12,
      eyeLineY: 0.38,
      noseBaseY: 0.49,
      chinY: 0.61,
    },
    isValid: true,
    validationNotes: ['High resolution (1024x1024)', 'Clear facial landmarks visible', 'Balanced studio lighting'],
  },
  left: {
    slot: 'left',
    url: refLeftUrl,
    name: 'Left Profile (Sinister)',
    version: 'default_ref_v1_left',
    width: 1024,
    height: 1024,
    aspectRatio: 1,
    transform: {
      scale: 1.0,
      offsetX: 0,
      offsetY: 0,
      rotationDeg: 0,
      flipH: false,
      opacity: 1.0,
    },
    anchors: {
      headTopY: 0.12,
      eyeLineY: 0.38,
      noseBaseY: 0.49,
      chinY: 0.61,
    },
    isValid: true,
    validationNotes: ['Clean 90° lateral profile', 'Nose prominence & occipital curvature visible'],
  },
  right: {
    slot: 'right',
    url: refRightUrl,
    name: 'Right Profile (Dexter)',
    version: 'default_ref_v1_right',
    width: 1024,
    height: 1024,
    aspectRatio: 1,
    transform: {
      scale: 1.0,
      offsetX: 0,
      offsetY: 0,
      rotationDeg: 0,
      flipH: false,
      opacity: 1.0,
    },
    anchors: {
      headTopY: 0.12,
      eyeLineY: 0.38,
      noseBaseY: 0.49,
      chinY: 0.61,
    },
    isValid: true,
    validationNotes: ['Matching 90° contralateral profile', 'Consistent scale with Left profile'],
  },
  back: {
    slot: 'back',
    url: refBackUrl,
    name: 'Back Head (Posterior)',
    version: 'default_ref_v1_back',
    width: 1024,
    height: 1024,
    aspectRatio: 1,
    transform: {
      scale: 1.0,
      offsetX: 0,
      offsetY: 0,
      rotationDeg: 0,
      flipH: false,
      opacity: 1.0,
    },
    anchors: {
      headTopY: 0.12,
      eyeLineY: 0.38,
      noseBaseY: 0.49,
      chinY: 0.61,
    },
    isValid: true,
    validationNotes: ['Posterior cranial crown and neck nape clearly visible', 'Enables 360° closed wireframe volume'],
  },
};
