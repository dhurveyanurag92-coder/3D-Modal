import React, { useState } from 'react';
import { ArrowLeft, Maximize2, CheckCircle2, AlertTriangle, HelpCircle } from 'lucide-react';
import { LandmarkCorrespondence, ProjectState } from '../../modules/types';

interface PageMatchingProps {
  project: ProjectState;
  onBack: () => void;
}

export const PageMatching: React.FC<PageMatchingProps> = ({ project, onBack }) => {
  const [filter, setFilter] = useState<'all' | 'matched' | 'inferred' | 'conflict'>('all');
  const [selectedSemanticId, setSelectedSemanticId] = useState<string | null>(null);

  const correspondences = project.correspondences;
  const filtered =
    filter === 'all'
      ? correspondences
      : correspondences.filter((c) => c.status === filter);

  const selected = correspondences.find((c) => c.semanticId === selectedSemanticId);

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-slate-950">
      {/* Top Header */}
      <div className="h-14 border-b border-slate-800 px-4 sm:px-6 flex items-center justify-between gap-4 bg-slate-900/50 shrink-0">
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={onBack}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-200 hover:text-white text-xs font-semibold transition-colors cursor-pointer"
          >
            <ArrowLeft className="w-4 h-4 text-cyan-400" />
            <span>Back to Studio</span>
          </button>
          <div className="h-4 w-px bg-slate-800" />
          <h2 className="text-sm font-bold text-white flex items-center gap-2">
            <Maximize2 className="w-4 h-4 text-cyan-400" />
            <span>Cross-View Landmark Correspondence</span>
          </h2>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left Column: Correspondence List & Epipolar Details */}
        <div className="flex-1 flex flex-col p-4 sm:p-6 overflow-hidden">
          {/* Filter Bar */}
          <div className="flex items-center gap-2 mb-4 shrink-0">
            <button
              type="button"
              onClick={() => setFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                filter === 'all' ? 'bg-cyan-500 text-slate-950 font-bold' : 'bg-slate-900 text-slate-300'
              }`}
            >
              All Correspondences ({correspondences.length})
            </button>
            <button
              type="button"
              onClick={() => setFilter('matched')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                filter === 'matched' ? 'bg-emerald-500 text-slate-950 font-bold' : 'bg-slate-900 text-slate-300'
              }`}
            >
              Multi-View Matched ({correspondences.filter((c) => c.status === 'matched').length})
            </button>
            <button
              type="button"
              onClick={() => setFilter('inferred')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                filter === 'inferred' ? 'bg-amber-500 text-slate-950 font-bold' : 'bg-slate-900 text-slate-300'
              }`}
            >
              Inferred ({correspondences.filter((c) => c.status === 'inferred').length})
            </button>
            <button
              type="button"
              onClick={() => setFilter('conflict')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                filter === 'conflict' ? 'bg-rose-500 text-white font-bold' : 'bg-slate-900 text-slate-300'
              }`}
            >
              Disparity Conflicts ({correspondences.filter((c) => c.status === 'conflict').length})
            </button>
          </div>

          {/* Table Container */}
          <div className="flex-1 bg-slate-900/40 border border-slate-800 rounded-xl overflow-hidden flex flex-col">
            <div className="p-3 border-b border-slate-800 grid grid-cols-12 gap-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider bg-slate-950/40">
              <div className="col-span-4">Semantic Landmark</div>
              <div className="col-span-3">Views Present</div>
              <div className="col-span-3">Unified 3D (X, Y, Z) mm</div>
              <div className="col-span-2 text-right">Epipolar ΔY</div>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60 p-1">
              {filtered.map((item) => {
                const isSelected = item.semanticId === selectedSemanticId;
                return (
                  <button
                    key={item.semanticId}
                    type="button"
                    onClick={() => setSelectedSemanticId(item.semanticId)}
                    className={`w-full p-2.5 rounded-lg grid grid-cols-12 gap-2 items-center text-left text-xs transition-colors cursor-pointer ${
                      isSelected ? 'bg-cyan-500/15 text-cyan-300 font-semibold' : 'hover:bg-slate-900 text-slate-300'
                    }`}
                  >
                    <div className="col-span-4 flex items-center gap-2 truncate">
                      {item.status === 'matched' ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                      ) : item.status === 'conflict' ? (
                        <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0" />
                      ) : (
                        <HelpCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                      )}
                      <span className="truncate">{item.label}</span>
                    </div>

                    <div className="col-span-3 flex items-center gap-1">
                      {item.viewsPresent.map((v) => (
                        <span
                          key={v}
                          className="text-[10px] uppercase font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-300"
                        >
                          {v[0]}
                        </span>
                      ))}
                    </div>

                    <div className="col-span-3 font-mono text-[11px] text-slate-400 truncate">
                      [{item.matchedCoord3D[0]}, {item.matchedCoord3D[1]}, {item.matchedCoord3D[2]}]
                    </div>

                    <div className="col-span-2 text-right font-mono text-[11px]">
                      <span
                        className={
                          item.verticalDisparityPx > 25 ? 'text-rose-400 font-bold' : 'text-slate-400'
                        }
                      >
                        {item.verticalDisparityPx}px
                      </span>
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Right Column: Inspector */}
        <div className="w-full lg:w-88 border-t lg:border-t-0 lg:border-l border-slate-800 bg-slate-950 p-4 sm:p-5 flex flex-col space-y-4 overflow-y-auto">
          <div>
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Correspondence Inspector
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Epipolar geometry constraint verification.
            </p>
          </div>

          {selected ? (
            <div className="space-y-4">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 space-y-2">
                <div className="text-sm font-bold text-cyan-400">{selected.label}</div>
                <div className="text-xs text-slate-400">Category: {selected.category}</div>
                <div className="text-xs text-slate-300 font-mono">
                  Solved 3D Coordinate:{' '}
                  <span className="text-white font-bold">
                    X: {selected.matchedCoord3D[0]}mm · Y: {selected.matchedCoord3D[1]}mm · Z: {selected.matchedCoord3D[2]}mm
                  </span>
                </div>
              </div>

              <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3.5 space-y-2">
                <div className="text-xs font-semibold text-white">2D View Projections</div>
                {selected.viewsPresent.map((v) => {
                  const pt = selected.points2D[v];
                  return (
                    <div key={v} className="flex justify-between text-xs font-mono">
                      <span className="text-slate-400 uppercase">{v} View:</span>
                      <span className="text-slate-200">
                        x: {pt?.x} · y: {pt?.y} ({Math.round((pt?.confidence || 0) * 100)}%)
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="text-[11px] text-slate-400 bg-slate-900/30 p-3 rounded-lg border border-slate-800">
                Front and Back views contribute horizontal coronal X coordinates. Left and Right profile
                views contribute sagittal depth Z coordinates. Vertical Y coordinates are fused via
                epipolar alignment.
              </div>
            </div>
          ) : (
            <div className="text-xs text-slate-400 py-6 text-center">
              Select any correspondence row to inspect cross-view triangulation coordinates.
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
