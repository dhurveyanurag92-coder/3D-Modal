import React from 'react';
import {
  ArrowLeft,
  Download,
  Box,
  FileText,
  Layers,
  Sparkles,
  Sliders,
  Archive,
  CheckCircle2,
} from 'lucide-react';
import { ProjectState } from '../../modules/types';
import {
  exportCoordinatesToCSV,
  exportProjectBundleJSON,
  exportReportToText,
  exportToOBJ,
  exportToPLY,
  triggerDownload,
} from '../../modules/project/exportService';

interface PageExportProps {
  project: ProjectState;
  onBack: () => void;
}

export const PageExport: React.FC<PageExportProps> = ({ project, onBack }) => {
  const wireframe = project.wireframe;
  const validation = project.validationReport;
  const measurements = project.measurements;

  // 1-Click Master Export All Archive
  const handleExportAll = () => {
    const bundleJSON = exportProjectBundleJSON(project);
    triggerDownload(
      bundleJSON,
      `${project.projectName}_complete_reconstruction_archive.json`,
      'application/json'
    );
  };

  const handleDownloadOBJ = () => {
    if (!wireframe) return;
    const obj = exportToOBJ(wireframe, project.projectName);
    triggerDownload(obj, `${project.projectName}_wireframe.obj`, 'text/plain');
  };

  const handleDownloadPLY = () => {
    if (!wireframe) return;
    const ply = exportToPLY(wireframe, project.projectName);
    triggerDownload(ply, `${project.projectName}_wireframe.ply`, 'text/plain');
  };

  const handleDownloadCSV = () => {
    if (!wireframe) return;
    const csv = exportCoordinatesToCSV(wireframe);
    triggerDownload(csv, `${project.projectName}_3d_coordinates.csv`, 'text/csv');
  };

  const handleDownloadLandmarksJSON = () => {
    const json = JSON.stringify(project.landmarks, null, 2);
    triggerDownload(json, `${project.projectName}_landmarks.json`, 'application/json');
  };

  const handleDownloadReport = () => {
    if (!validation) return;
    const report = exportReportToText(validation, measurements);
    triggerDownload(report, `${project.projectName}_validation_report.txt`, 'text/plain');
  };

  const exportCards = [
    {
      title: 'Hollow 3D Wireframe (.OBJ)',
      description: 'Standard Wavefront geometry with 3D vertices (v) and line segments (l). Compatible with all 3D software.',
      icon: <Box className="w-5 h-5 text-cyan-400" />,
      action: handleDownloadOBJ,
      format: '.OBJ',
      stats: `${wireframe?.totalPoints || 0} vertices · ${wireframe?.totalEdges || 0} line edges`,
    },
    {
      title: 'Stanford Polygon File (.PLY)',
      description: 'ASCII PLY point cloud and edge elements for CAD, MeshLab, and engineering inspection.',
      icon: <Box className="w-5 h-5 text-cyan-400" />,
      action: handleDownloadPLY,
      format: '.PLY',
      stats: 'ASCII Header & Edge Topology',
    },
    {
      title: '3D Coordinates Table (.CSV)',
      description: 'Spreadsheet of every reconstructed 3D vertex with X, Y, Z coordinates in millimeters, confidence, and provenance.',
      icon: <Sliders className="w-5 h-5 text-cyan-400" />,
      action: handleDownloadCSV,
      format: '.CSV',
      stats: `${wireframe?.vertices.length || 0} rows`,
    },
    {
      title: '2D Landmark Annotations (.JSON)',
      description: 'All 36 anatomical facial landmarks with 2D normalized image coordinates and detection confidence.',
      icon: <Sparkles className="w-5 h-5 text-cyan-400" />,
      action: handleDownloadLandmarksJSON,
      format: '.JSON',
      stats: `${project.landmarks.length} landmark records`,
    },
    {
      title: 'Cephalometric & Disparity Report (.TXT)',
      description: 'Human-readable quality report with cranial index, facial index, and 4-view reprojection disparities.',
      icon: <FileText className="w-5 h-5 text-cyan-400" />,
      action: handleDownloadReport,
      format: '.TXT',
      stats: validation ? `Mean Disparity: ${validation.reprojectionMeanError}px (${validation.overallStatus.toUpperCase()})` : 'Pending Validation Report',
    },
  ];

  const hasStale = Object.values(project.stages).some((s) => s.status === 'stale');

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
            <Download className="w-4 h-4 text-cyan-400" />
            <span>Download & Export Center</span>
          </h2>
        </div>

        {/* Master Export All Button */}
        <button
          type="button"
          onClick={handleExportAll}
          className="flex items-center gap-2 px-4 py-1.5 rounded-lg bg-cyan-400 hover:bg-cyan-300 text-slate-950 text-xs font-bold transition-all shadow-sm cursor-pointer"
        >
          <Archive className="w-4 h-4" />
          <span>Export All (Master Archive)</span>
        </button>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 max-w-5xl mx-auto w-full">
        {hasStale && (
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex items-center gap-3 text-amber-300 text-xs">
            <CheckCircle2 className="w-5 h-5 text-amber-400 shrink-0" />
            <div>
              <span className="font-bold">Input images were modified:</span> Some downstream outputs are stale. We recommend clicking "Run Pipeline" on the Overview page before exporting final assets.
            </div>
          </div>
        )}

        {/* Banner */}
        <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-base font-bold text-white">Reconstruction Deliverables</h1>
            <p className="text-xs text-slate-400 mt-1 max-w-2xl">
              Download individual wireframe assets, raw 3D coordinate point clouds, anatomical
              landmarks, or export the complete project bundle with metadata manifest.
            </p>
          </div>

          <div className="text-xs font-mono text-cyan-400 bg-slate-950 border border-slate-800 px-3 py-1.5 rounded-lg shrink-0">
            {wireframe ? 'Geometry Solved & Validated' : 'Pending Reconstruction'}
          </div>
        </div>

        {/* Export Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {exportCards.map((item, idx) => (
            <div
              key={idx}
              className="bg-slate-900 border border-slate-800 rounded-xl p-4 sm:p-5 flex flex-col justify-between space-y-4 hover:border-slate-700 transition-colors"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2.5">
                    {item.icon}
                    <h3 className="text-sm font-bold text-white">{item.title}</h3>
                  </div>
                  <span className="text-[11px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-semibold">
                    {item.format}
                  </span>
                </div>
                <p className="text-xs text-slate-400 leading-relaxed">{item.description}</p>
                <div className="text-[11px] font-mono text-slate-400">{item.stats}</div>
              </div>

              <button
                type="button"
                onClick={item.action}
                className="w-full py-2 px-3 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-200 hover:text-white text-xs font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer border border-slate-700"
              >
                <Download className="w-3.5 h-3.5 text-cyan-400" />
                <span>Download {item.format}</span>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
