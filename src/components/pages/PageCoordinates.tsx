import React, { useState } from 'react';
import { ArrowLeft, Sliders, Download, Ruler, CheckCircle2 } from 'lucide-react';
import { ProjectState } from '../../modules/types';
import { exportCoordinatesToCSV, triggerDownload } from '../../modules/project/exportService';

interface PageCoordinatesProps {
  project: ProjectState;
  onUpdateCalibration: (calibrationMm: number) => void;
  onBack: () => void;
}

export const PageCoordinates: React.FC<PageCoordinatesProps> = ({
  project,
  onUpdateCalibration,
  onBack,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [calibrationInput, setCalibrationInput] = useState(
    project.settings.calibrationMm.toString()
  );

  const points = project.wireframe?.vertices || [];
  const measurements = project.measurements;

  const filteredPoints = points.filter(
    (p) =>
      p.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      p.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.semanticId && p.semanticId.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleDownloadCSV = () => {
    if (!project.wireframe) return;
    const csv = exportCoordinatesToCSV(project.wireframe);
    triggerDownload(csv, 'head_3d_coordinates.csv', 'text/csv');
  };

  const handleDownloadJSON = () => {
    if (!project.wireframe) return;
    const json = JSON.stringify(project.wireframe.vertices, null, 2);
    triggerDownload(json, 'head_3d_coordinates.json', 'application/json');
  };

  const handleApplyCalibration = (e: React.FormEvent) => {
    e.preventDefault();
    const val = parseFloat(calibrationInput);
    if (!isNaN(val) && val > 50 && val < 500) {
      onUpdateCalibration(val);
    }
  };

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
            <Sliders className="w-4 h-4 text-cyan-400" />
            <span>Unified 3D Coordinates & Cephalometrics</span>
          </h2>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={handleDownloadCSV}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-medium transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>Download CSV</span>
          </button>
          <button
            type="button"
            onClick={handleDownloadJSON}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-medium transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>JSON</span>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden">
        {/* Left Column: 3D Coordinate Table */}
        <div className="flex-1 flex flex-col p-4 sm:p-6 overflow-hidden">
          {/* Search bar */}
          <div className="mb-4 shrink-0">
            <input
              type="text"
              placeholder="Filter by label or category (e.g. nose, eye, cranium, ring)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-900 border border-slate-800 rounded-lg px-3.5 py-2 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
            />
          </div>

          {/* Coordinate Data Grid */}
          <div className="flex-1 bg-slate-900/40 border border-slate-800 rounded-xl overflow-hidden flex flex-col">
            <div className="p-3 border-b border-slate-800 grid grid-cols-12 gap-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider bg-slate-950/40">
              <div className="col-span-5">Point ID / Label</div>
              <div className="col-span-2">Category</div>
              <div className="col-span-3 text-right font-mono">
                X, Y, Z ({project.wireframe?.scaleUnit === 'user_calibrated_mm' ? 'mm' : 'norm'})
              </div>
              <div className="col-span-2 text-right">Provenance</div>
            </div>

            <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60 p-1">
              {filteredPoints.length === 0 ? (
                <div className="p-6 text-center text-xs text-slate-500">
                  No 3D points available. Run the pipeline to solve coordinates.
                </div>
              ) : (
                filteredPoints.map((pt, idx) => (
                  <div
                    key={`${pt.id}_${idx}`}
                    className="p-2.5 rounded-lg grid grid-cols-12 gap-2 items-center text-xs hover:bg-slate-900/80 transition-colors"
                  >
                    <div className="col-span-5 truncate">
                      <span className="font-semibold text-slate-200 truncate">{pt.label}</span>
                      <span className="text-[10px] text-slate-400 ml-2 font-mono">({pt.id})</span>
                    </div>

                    <div className="col-span-2">
                      <span className="text-[10px] capitalize px-1.5 py-0.5 rounded bg-slate-800 text-slate-300">
                        {pt.category}
                      </span>
                    </div>

                    <div className="col-span-3 text-right font-mono text-[11px] text-cyan-300">
                      [{pt.x}, {pt.y}, {pt.z}]
                    </div>

                    <div className="col-span-2 text-right font-mono text-[11px] text-slate-300 truncate capitalize">
                      {pt.provenance.replace('_', ' ')}
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Cephalometric Ratios & Physical Calibration */}
        <div className="w-full lg:w-96 border-t lg:border-t-0 lg:border-l border-slate-800 bg-slate-950 p-4 sm:p-5 flex flex-col space-y-5 overflow-y-auto">
          <div>
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Cephalometric Anatomy
            </h3>
            <p className="text-[11px] text-slate-400 mt-0.5">
              Standard cranial indices computed from solved 3D point cloud.
            </p>
          </div>

          {/* Measurements Cards */}
          {measurements && (
            <div className="space-y-3">
              <div className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 space-y-2">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Head Height (Vertex - Gnathion):</span>
                  <span className="font-bold text-white font-mono">{measurements.headHeightMm} mm</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Head Width (Biparietal):</span>
                  <span className="font-bold text-white font-mono">{measurements.headWidthMm} mm</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Head Depth (Anteroposterior):</span>
                  <span className="font-bold text-white font-mono">{measurements.headDepthMm} mm</span>
                </div>
              </div>

              {/* Cranial Index Card */}
              <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3.5 space-y-1.5">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-slate-400">Cranial Index (CI):</span>
                  <span className="font-bold text-cyan-400 font-mono text-sm">
                    {measurements.cranialIndex}
                  </span>
                </div>
                <div className="text-[11px] text-emerald-400 font-medium">
                  Classification: {measurements.cranialClassification}
                </div>
                <div className="text-[10px] text-slate-400">
                  Formula: (Biparietal Width / Cranial Depth) × 100
                </div>
              </div>

              <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3.5 space-y-2 text-xs">
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Intercanthal Distance:</span>
                  <span className="font-mono text-slate-200">{measurements.intercanthalDistanceMm} mm</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Outer Eye Distance:</span>
                  <span className="font-mono text-slate-200">{measurements.outerEyeDistanceMm} mm</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Nose Prominence:</span>
                  <span className="font-mono text-slate-200">{measurements.noseProminenceMm} mm</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-slate-400">Mandibular Jaw Width:</span>
                  <span className="font-mono text-slate-200">{measurements.jawWidthMm} mm</span>
                </div>
              </div>
            </div>
          )}

          {/* Physical Scale Calibration Form */}
          <form
            onSubmit={handleApplyCalibration}
            className="bg-slate-900 border border-slate-800 rounded-xl p-3.5 space-y-3"
          >
            <div className="flex items-center gap-2">
              <Ruler className="w-4 h-4 text-cyan-400" />
              <div className="text-xs font-semibold text-white">Physical Scale Calibration</div>
            </div>

            <p className="text-[11px] text-slate-400 leading-relaxed">
              Enter known subject head height (Vertex to Chin Gnathion) in millimeters to scale all 3D
              coordinates to true physical dimensions.
            </p>

            <div className="flex items-center gap-2">
              <input
                type="number"
                min="100"
                max="350"
                value={calibrationInput}
                onChange={(e) => setCalibrationInput(e.target.value)}
                className="w-24 bg-slate-950 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none focus:border-cyan-400"
              />
              <span className="text-xs text-slate-400">mm</span>
              <button
                type="submit"
                className="flex-1 py-1.5 px-3 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs transition-colors cursor-pointer"
              >
                Apply Scale
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
