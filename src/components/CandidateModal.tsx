import React from 'react';
import { CandidateResume, CandidateScoreBreakdown, JobDescription, RankingWeights } from '../types';
import { X, Trophy, CheckCircle2, AlertTriangle, FileText, Cpu, Check, AlertCircle } from 'lucide-react';

interface CandidateModalProps {
  candidate: CandidateResume;
  breakdown: CandidateScoreBreakdown;
  jobDescription: JobDescription;
  weights: RankingWeights;
  onClose: () => void;
}

export const CandidateModal: React.FC<CandidateModalProps> = ({
  candidate,
  breakdown,
  jobDescription,
  weights,
  onClose
}) => {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="relative w-full max-w-4xl bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="bg-slate-950 border-b border-slate-800 px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center justify-center font-bold text-sm">
              #{breakdown.rank}
            </span>
            <div>
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                {candidate.candidateName}
                <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 font-mono">
                  {breakdown.fitCategory}
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                {candidate.education} • {candidate.email || 'No email provided'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-white transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Mathematical Formula Card */}
          <div className="bg-slate-950/80 border border-emerald-500/30 rounded-xl p-4">
            <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider mb-2 flex items-center gap-2">
              <Cpu className="w-4 h-4 text-emerald-400" />
              Scoring Formula Verification &amp; Math Audit
            </h3>
            <div className="p-3 bg-slate-900 rounded-lg border border-slate-800 font-mono text-xs text-slate-200">
              <div className="text-slate-400 mb-1">Formula:</div>
              <div className="text-emerald-300 font-semibold">
                Final Score = ({breakdown.semanticScore}% × {weights.semanticWeight}) + ({breakdown.keywordScore}% × {weights.keywordWeight})
              </div>
              <div className="text-white font-bold mt-1 text-sm">
                = {Math.round(breakdown.semanticScore * weights.semanticWeight * 10) / 10} + {Math.round(breakdown.keywordScore * weights.keywordWeight * 10) / 10} = <span className="text-emerald-400">{breakdown.finalScore}%</span>
              </div>
            </div>
          </div>

          {/* Scores Overview */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
              <span className="text-xs text-teal-400 font-semibold uppercase">
                Semantic Match
              </span>
              <div className="text-2xl font-bold text-white font-mono mt-1">
                {breakdown.semanticScore}%
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Cosine similarity between candidate experience/projects &amp; JD requirements.
              </p>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
              <span className="text-xs text-indigo-400 font-semibold uppercase">
                Keyword Overlap
              </span>
              <div className="text-2xl font-bold text-white font-mono mt-1">
                {breakdown.keywordScore}%
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Explicit skills token match with synonym &amp; typo normalization.
              </p>
            </div>

            <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
              <span className="text-xs text-amber-400 font-semibold uppercase">
                Formatting Health
              </span>
              <div className="text-2xl font-bold text-white font-mono mt-1">
                {candidate.formattingQuality?.score || 90}%
              </div>
              <p className="text-[11px] text-slate-400 mt-1">
                Robustness index against typos, OCR quirks, and inconsistent dates.
              </p>
            </div>
          </div>

          {/* Skills Breakdown */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-slate-950/70 border border-emerald-600/20 rounded-xl p-4">
              <h4 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4" />
                Matched Required Skills ({breakdown.matchedRequiredSkills.length})
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {breakdown.matchedRequiredSkills.map((s) => (
                  <span
                    key={s}
                    className="text-xs px-2.5 py-1 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-medium"
                  >
                    {s}
                  </span>
                ))}
              </div>
            </div>

            <div className="bg-slate-950/70 border border-rose-600/20 rounded-xl p-4">
              <h4 className="text-xs font-semibold text-rose-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                <AlertCircle className="w-4 h-4" />
                Missing Required Skills ({breakdown.missingRequiredSkills.length})
              </h4>
              <div className="flex flex-wrap gap-1.5">
                {breakdown.missingRequiredSkills.length > 0 ? (
                  breakdown.missingRequiredSkills.map((s) => (
                    <span
                      key={s}
                      className="text-xs px-2.5 py-1 rounded bg-rose-500/15 text-rose-300 border border-rose-500/30 font-medium"
                    >
                      {s}
                    </span>
                  ))
                ) : (
                  <span className="text-xs text-slate-400 italic">None • 100% Core Requirements Met</span>
                )}
              </div>
            </div>
          </div>

          {/* Formatting & Typo Audit */}
          {candidate.formattingQuality && candidate.formattingQuality.detectedTypos.length > 0 && (
            <div className="bg-amber-950/20 border border-amber-500/30 rounded-xl p-4">
              <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider mb-1 flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                Detected Typos Normalization (Handled Gracefully):
              </h4>
              <p className="text-xs text-slate-300 mb-2">
                {candidate.formattingQuality.notes}
              </p>
              <div className="flex flex-wrap gap-2">
                {candidate.formattingQuality.detectedTypos.map((t, idx) => (
                  <span
                    key={idx}
                    className="text-xs px-2 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 font-mono"
                  >
                    Normalized: {t}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Raw Resume Text */}
          <div className="bg-slate-950 border border-slate-800 rounded-xl p-4">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 flex items-center gap-2">
              <FileText className="w-4 h-4 text-slate-400" />
              Raw Extracted Resume Text (Normalized)
            </h4>
            <div className="bg-slate-900 p-4 rounded-lg border border-slate-800/80 max-h-60 overflow-y-auto text-xs font-mono text-slate-300 whitespace-pre-line leading-relaxed">
              {candidate.rawText}
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="bg-slate-950 border-t border-slate-800 px-6 py-3 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
          >
            Close Inspector
          </button>
        </div>
      </div>
    </div>
  );
};
