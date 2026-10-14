import React from 'react';
import { X, Check, Sparkles, Sliders } from 'lucide-react';
import referencePhotoImg from '../assets/images/reference_lantern_view_1791821633231.jpg';

interface PhotoCompareModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectPhotoAngle: () => void;
}

export const PhotoCompareModal: React.FC<PhotoCompareModalProps> = ({
  isOpen,
  onClose,
  onSelectPhotoAngle,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/80 backdrop-blur-md animate-in fade-in duration-200">
      <div className="relative w-full max-w-4xl bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col md:flex-row max-h-[90vh]">
        {/* Left: Reference Photograph Card */}
        <div className="md:w-1/2 p-6 flex flex-col items-center justify-center bg-neutral-950/60 border-b md:border-b-0 md:border-r border-neutral-800">
          <div className="w-full flex items-center justify-between mb-3 text-xs">
            <span className="font-semibold text-amber-400 uppercase tracking-wider">
              Original Reference
            </span>
            <span className="text-neutral-400 font-mono text-[11px]">Outdoor Wall Sconce</span>
          </div>

          <div className="relative rounded-xl overflow-hidden border border-neutral-800 shadow-xl max-h-[55vh] flex items-center justify-center bg-neutral-950">
            <img
              src={referencePhotoImg}
              alt="Reference Vintage Wall Lantern with Floral Filigree"
              className="object-contain max-h-[55vh] w-auto"
              referrerPolicy="no-referrer"
            />
            <div className="absolute bottom-2 left-2 px-2.5 py-1 rounded bg-black/60 backdrop-blur-md text-[10px] text-neutral-300 font-medium border border-white/10">
              Cast Black · Floral Clover Tracery
            </div>
          </div>
        </div>

        {/* Right: Architectural Breakdown & Verification */}
        <div className="md:w-1/2 p-6 flex flex-col justify-between overflow-y-auto">
          <div>
            <div className="flex items-start justify-between">
              <div>
                <span className="text-xs font-semibold text-amber-400 uppercase tracking-wider">
                  3D Model Verification
                </span>
                <h3 className="text-lg font-bold text-neutral-100 mt-0.5">
                  Design Fidelity Breakdown
                </h3>
                <p className="text-xs text-neutral-400 mt-1">
                  हर एक डिटेल को मूल फोटो के अनुसार 3D में तैयार किया गया है:
                </p>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mt-5 space-y-3 text-xs text-neutral-300">
              <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-neutral-950/50 border border-neutral-800">
                <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-neutral-100">
                    4-Petal Floral Clover Filigree (फ्लोरल जाली)
                  </div>
                  <div className="text-[11px] text-neutral-400 mt-0.5">
                    प्रत्येक ग्लास पैनल पर 4-पंखुड़ी वाले फूल और क्रॉसिंग आर्क्स की असली 3D मेटल वायर जाली।
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-neutral-950/50 border border-neutral-800">
                <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-neutral-100">
                    Sconce Gooseneck Bracket Arm (कर्व्ड ब्रैकेट)
                  </div>
                  <div className="text-[11px] text-neutral-400 mt-0.5">
                    सर्कुलर वॉल एस्कचियन प्लेट से जुड़ती हुई स्मूथ आर्किटेक्चरल कास्ट गोसनेक आर्म।
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-neutral-950/50 border border-neutral-800">
                <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-neutral-100">
                    Pagoda Hood & Acorn Spire (पगोडा हुड व क्राउन)
                  </div>
                  <div className="text-[11px] text-neutral-400 mt-0.5">
                    छतरी के ड्रिपिंग ईव्स और शीर्ष पर नुकीला स्पायर फिनियल और टर्न्ड रिंग्स।
                  </div>
                </div>
              </div>

              <div className="flex items-start gap-2.5 p-2.5 rounded-lg bg-neutral-950/50 border border-neutral-800">
                <Check className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
                <div>
                  <div className="font-semibold text-neutral-100">
                    Internal Edison Filament Glow (वार्म एम्बर रोशनी)
                  </div>
                  <div className="text-[11px] text-neutral-400 mt-0.5">
                    अंदर जलता हुआ 2700K वार्म फिलामेंट बल्ब जो ग्लास और जाली के आर-पार छायाएं बनाता है।
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-neutral-800 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={() => {
                onSelectPhotoAngle();
                onClose();
              }}
              className="flex-1 py-2 px-3 text-xs font-semibold text-neutral-950 bg-amber-400 hover:bg-amber-300 rounded-lg transition-colors text-center shadow-sm"
            >
              Align 3D View to Reference Angle
            </button>
            <button
              type="button"
              onClick={onClose}
              className="py-2 px-4 text-xs font-medium text-neutral-300 hover:text-white bg-neutral-800 hover:bg-neutral-700 rounded-lg transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
