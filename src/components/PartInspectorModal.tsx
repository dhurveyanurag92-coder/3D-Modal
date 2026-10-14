import React from 'react';
import { X, CheckCircle2, ChevronRight, Layers } from 'lucide-react';
import { LANTERN_PARTS } from '../data/partsData';

interface PartInspectorModalProps {
  selectedPartId: string | null;
  onClose: () => void;
  onSelectPart: (id: string) => void;
}

export const PartInspectorModal: React.FC<PartInspectorModalProps> = ({
  selectedPartId,
  onClose,
  onSelectPart,
}) => {
  if (!selectedPartId) return null;

  const part = LANTERN_PARTS[selectedPartId] || {
    id: selectedPartId,
    name: 'Lantern Assembly Component',
    hindiName: 'लैंप कंपोनेंट',
    description: 'Precision architectural component engineered for outdoor weather resistance and durability.',
    specs: 'Material: Die-cast Metal Alloy · Weatherproof Sealed',
  };

  return (
    <div className="fixed top-20 left-6 z-20 w-88 max-w-[calc(100vw-2rem)] bg-neutral-900/95 backdrop-blur-md border border-neutral-800 rounded-xl shadow-2xl p-4.5 text-neutral-200 animate-in fade-in zoom-in-95 duration-150">
      <div className="flex items-start justify-between pb-3 border-b border-neutral-800">
        <div>
          <div className="text-[11px] font-medium text-amber-400 uppercase tracking-wider">
            Component Blueprint
          </div>
          <h3 className="text-base font-semibold text-neutral-100">{part.name}</h3>
          <div className="text-xs text-neutral-400 mt-0.5 font-medium">{part.hindiName}</div>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="p-1 text-neutral-400 hover:text-neutral-100 rounded hover:bg-neutral-800"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="py-3 space-y-2.5 text-xs">
        <p className="text-neutral-300 leading-relaxed">{part.description}</p>

        <div className="p-2.5 rounded-lg bg-neutral-950/70 border border-neutral-800/80 space-y-1">
          <div className="text-[10px] uppercase tracking-wider text-neutral-500 font-semibold">
            Engineering Specs
          </div>
          <div className="font-mono text-[11px] text-amber-300/90">{part.specs}</div>
        </div>
      </div>

      <div className="pt-2 border-t border-neutral-800">
        <div className="text-[11px] text-neutral-400 mb-1.5 font-medium">Quick Select Parts:</div>
        <div className="flex flex-wrap gap-1">
          {Object.entries(LANTERN_PARTS).map(([id, p]) => (
            <button
              key={id}
              type="button"
              onClick={() => onSelectPart(id)}
              className={`px-2 py-0.5 rounded text-[10px] font-medium transition-colors ${
                selectedPartId === id
                  ? 'bg-amber-400 text-neutral-950 font-semibold'
                  : 'bg-neutral-950 border border-neutral-800 text-neutral-400 hover:text-neutral-200'
              }`}
            >
              {p.hindiName.split(' ')[0]}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
