import React from 'react';
import { Download, X } from 'lucide-react';

interface SnapshotModalProps {
  imageSrc: string | null;
  onClose: () => void;
}

export const SnapshotModal: React.FC<SnapshotModalProps> = ({ imageSrc, onClose }) => {
  if (!imageSrc) return null;

  const handleDownload = () => {
    const link = document.createElement('a');
    link.download = `vintage-lantern-3d-${Date.now()}.png`;
    link.href = imageSrc;
    link.click();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/85 backdrop-blur-md animate-in fade-in duration-150">
      <div className="relative max-w-2xl w-full bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden shadow-2xl p-4">
        <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
          <div>
            <h4 className="text-sm font-semibold text-neutral-100">3D Snapshot Render</h4>
            <span className="text-[11px] text-neutral-400">High-resolution viewport capture</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 text-neutral-400 hover:text-white rounded hover:bg-neutral-800"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="py-4 flex justify-center bg-neutral-950 rounded-lg mt-3 overflow-hidden border border-neutral-800">
          <img
            src={imageSrc}
            alt="3D Lantern Snapshot"
            className="max-h-[60vh] object-contain rounded"
          />
        </div>

        <div className="pt-3 flex items-center justify-end gap-2 border-t border-neutral-800 mt-3">
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 text-xs text-neutral-300 hover:text-white bg-neutral-800 hover:bg-neutral-700 rounded font-medium"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-4 py-1.5 text-xs font-semibold text-neutral-950 bg-amber-400 hover:bg-amber-300 rounded shadow-sm"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download High-Res PNG</span>
          </button>
        </div>
      </div>
    </div>
  );
};
