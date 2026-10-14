import React from 'react';
import { Menu, X, Lamp, Sparkles, ChevronRight, PlusCircle, Check } from 'lucide-react';
import { CHARACTERS_LIST, CharacterItem } from '../characters/registry';

interface NavigationDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  activeCharacterId: string;
  onSelectCharacter: (id: string) => void;
}

export const NavigationDrawer: React.FC<NavigationDrawerProps> = ({
  isOpen,
  onClose,
  activeCharacterId,
  onSelectCharacter,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-neutral-950/70 backdrop-blur-xs"
        onClick={onClose}
      />

      {/* Slide-out Menu Panel */}
      <div className="relative w-80 max-w-[85vw] h-full bg-neutral-900 border-r border-neutral-800 shadow-2xl p-5 flex flex-col justify-between z-10 animate-in slide-in-from-left duration-250">
        <div>
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-lg bg-amber-400 flex items-center justify-center text-neutral-950 font-bold text-sm shadow-sm">
                3D
              </div>
              <div>
                <h3 className="text-sm font-bold text-neutral-100">3D Models Menu</h3>
                <span className="text-[11px] text-neutral-400">मॉडल चयन सूची</span>
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Model Directory List */}
          <div className="mt-5 space-y-2">
            <div className="text-[11px] uppercase tracking-wider text-neutral-500 font-semibold px-1 mb-2">
              Available 3D Models (मॉडल लिस्ट)
            </div>

            {CHARACTERS_LIST.map((char) => {
              const isSelected = activeCharacterId === char.id;
              return (
                <button
                  key={char.id}
                  type="button"
                  onClick={() => {
                    onSelectCharacter(char.id);
                    onClose();
                  }}
                  className={`w-full p-3 rounded-xl border text-left transition-all flex items-start gap-3 ${
                    isSelected
                      ? 'bg-amber-400/15 border-amber-400/60 shadow-sm'
                      : 'bg-neutral-950/50 hover:bg-neutral-850 border-neutral-800/80 text-neutral-300'
                  }`}
                >
                  <div
                    className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${
                      isSelected
                        ? 'bg-amber-400 text-neutral-950'
                        : 'bg-neutral-800 text-neutral-400'
                    }`}
                  >
                    {char.number === 1 ? (
                      <Lamp className="w-4 h-4" />
                    ) : (
                      <Sparkles className="w-4 h-4" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-semibold text-neutral-100 truncate">
                        {char.hindiName}
                      </span>
                      {isSelected && (
                        <Check className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      )}
                    </div>
                    <div className="text-[11px] text-neutral-400 truncate mt-0.5">
                      {char.name}
                    </div>
                    <div className="mt-1 flex items-center gap-1.5">
                      <span
                        className={`text-[10px] font-medium px-2 py-0.5 rounded-full ${
                          char.status === 'active'
                            ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30'
                            : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'
                        }`}
                      >
                        {char.status === 'active' ? 'Active 3D Model' : 'Ready for Image'}
                      </span>
                    </div>
                  </div>
                </button>
              );
            })}

            {/* Indicator for upcoming models */}
            <div className="p-3 rounded-xl border border-dashed border-neutral-800 bg-neutral-950/30 text-neutral-500 text-xs flex items-center gap-2.5 mt-3">
              <PlusCircle className="w-4 h-4 text-neutral-500 shrink-0" />
              <span className="text-[11px]">
                आगे जो भी मॉडल बनेंगे, वे यहाँ एक के बाद एक नीचे जुड़ते जाएंगे।
              </span>
            </div>
          </div>
        </div>

        {/* Footer info */}
        <div className="pt-4 border-t border-neutral-800 text-[11px] text-neutral-500">
          <div>Folder Structure:</div>
          <div className="font-mono text-[10px] text-neutral-400 mt-0.5">
            /src/characters/character-1/lamp
            <br />
            /src/characters/character-2/
          </div>
        </div>
      </div>
    </div>
  );
};
