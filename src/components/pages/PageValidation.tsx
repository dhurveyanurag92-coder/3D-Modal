import React from 'react';
import { ArrowLeft, FileText, Download, CheckCircle2, AlertTriangle, ShieldCheck } from 'lucide-react';
import { ProjectState } from '../../modules/types';
import { exportReportToText, triggerDownload } from '../../modules/project/exportService';

interface PageValidationProps {
  project: ProjectState;
  onBack: () => void;
}

export const PageValidation: React.FC<PageValidationProps> = ({ project, onBack }) => {
  const report = project.validationReport;
  const measurements = project.measurements;

  const handleDownloadReport = () => {
    if (!report) return;
    const txt = exportReportToText(report, measurements);
    triggerDownload(txt, `${project.projectName}_validation_report.txt`, 'text/plain');
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
            <ShieldCheck className="w-4 h-4 text-cyan-400" />
            <span>Reconstruction Quality & Disparity Audit</span>
          </h2>
        </div>

        {report && (
          <button
            type="button"
            onClick={handleDownloadReport}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-750 text-slate-200 text-xs font-medium transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5 text-cyan-400" />
            <span>Download Report TXT</span>
          </button>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-6 max-w-5xl mx-auto w-full">
        {/* Quality Banner Card */}
        {report ? (
          <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6">
            <div>
              <div className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">
                Reconstruction Reprojection Disparity
              </div>
              <div className="flex items-baseline gap-3 mt-1">
                <span className="text-3xl sm:text-4xl font-extrabold text-white">
                  {report.reprojectionMeanError} px
                </span>
                <span
                  className={`text-xs font-bold uppercase px-2 py-0.5 rounded ${
                    report.overallStatus === 'valid'
                      ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                      : report.overallStatus === 'warning'
                      ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                  }`}
                >
                  {report.overallStatus}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-1 max-w-xl">
                Measured by projecting reconstructed 3D vertices back through orthographic virtual camera
                frustums onto the 4 uploaded reference photos and calculating pixel Euclidean disparity.
              </p>
            </div>

            <div className="bg-slate-950/80 border border-slate-800 rounded-lg p-3 text-xs font-mono space-y-1 shrink-0">
              <div className="text-slate-400">
                Landmark Coverage:{' '}
                <span className="text-emerald-400 font-bold">{report.coverageStats.landmarkCoveragePct}%</span>
              </div>
              <div className="text-slate-400">
                Constrained Vertices:{' '}
                <span className="text-cyan-400 font-bold">{report.coverageStats.constrainedVertexPct}%</span>
              </div>
              <div className="text-slate-400">
                Profile Consistency:{' '}
                <span className={report.coverageStats.bothProfilesConsistent ? 'text-emerald-400 font-bold' : 'text-amber-400 font-bold'}>
                  {report.coverageStats.bothProfilesConsistent ? 'Symmetric' : 'Disparity Delta'}
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-12 text-center text-slate-400 bg-slate-900/40 border border-slate-800 rounded-xl">
            <ShieldCheck className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <h3 className="text-sm font-bold text-white">Validation Report Pending</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
              The quality and disparity audit is computed once the reconstruction pipeline executes. Run the pipeline from Overview.
            </p>
          </div>
        )}

        {/* Per-View Reprojection Breakdown Cards */}
        {report && (
          <div>
            <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">
              Per-View Reprojection Accuracy
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
              {Object.entries(report.perViewReports).map(([view, rep]) => (
                <div key={view} className="bg-slate-900/60 border border-slate-800 rounded-xl p-4">
                  <div className="text-xs font-bold text-white uppercase">{view} View</div>
                  <div className="text-2xl font-bold text-cyan-400 mt-2 font-mono">
                    {rep.meanErrorPixels} px
                  </div>
                  <div className="text-[11px] text-slate-400 mt-0.5">Mean Reprojection Error</div>
                  <div className="mt-3 pt-3 border-t border-slate-800 text-xs font-mono text-slate-400 flex justify-between">
                    <span>Peak Disparity:</span>
                    <span className="text-slate-200">{rep.maxErrorPixels} px</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Warnings & Diagnostic Feedback */}
        {report && (
          <div className="bg-slate-900/40 border border-slate-800 rounded-xl p-5 space-y-3">
            <h3 className="text-xs font-bold text-slate-300 uppercase tracking-wider">
              Diagnostic Integrity Checks
            </h3>

            {report.warnings.length === 0 ? (
              <div className="flex items-center gap-2 text-xs text-emerald-400">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>All geometric consistency invariant checks passed without warnings.</span>
              </div>
            ) : (
              <div className="space-y-2">
                {report.warnings.map((w, idx) => (
                  <div key={idx} className="flex items-start gap-2 text-xs text-amber-300">
                    <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
                    <span>{w}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
