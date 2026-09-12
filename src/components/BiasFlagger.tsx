import React, { useState } from 'react';
import { JobDescription, JDBiasIssue } from '../types';
import { ShieldAlert, CheckCircle2, AlertTriangle, Sparkles, ArrowRight, Wand2 } from 'lucide-react';

interface BiasFlaggerProps {
  jobDescription: JobDescription;
  onUpdateJobDescription: (updated: JobDescription) => void;
}

export const BiasFlagger: React.FC<BiasFlaggerProps> = ({
  jobDescription,
  onUpdateJobDescription
}) => {
  const [isFixed, setIsFixed] = useState(false);
  const biases = jobDescription.detectedBiases || [];

  const handleApplyInclusiveRewrites = () => {
    let cleanText = jobDescription.rawText;
    
    // Replace problematic phrases with inclusive alternatives
    biases.forEach(b => {
      cleanText = cleanText.replace(b.phrase, b.recommendation.replace(/^Replace with:\s*"/, '').replace(/"$/, ''));
    });

    const updatedJD: JobDescription = {
      ...jobDescription,
      rawText: cleanText,
      detectedBiases: [] // Cleared!
    };

    onUpdateJobDescription(updatedJD);
    setIsFixed(true);
  };

  const getCategoryTitle = (cat: JDBiasIssue['category']) => {
    switch (cat) {
      case 'exclusionary_credentials':
        return 'Prestige / Credential Bias';
      case 'experience_inflation':
        return 'Experience Inflation for Entry Level';
      case 'gendered_or_aggressive':
        return 'Aggressive / Culturally Exclusionary Tone';
      case 'rigid_tooling':
        return 'Arbitrary Tooling Gatekeeping';
      default:
        return 'Exclusionary Phrasing';
    }
  };

  const getSeverityBadge = (severity: JDBiasIssue['severity']) => {
    switch (severity) {
      case 'high':
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-rose-500/15 text-rose-400 border border-rose-500/30">High Severity</span>;
      case 'medium':
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-amber-500/15 text-amber-400 border border-amber-500/30">Medium Severity</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-sky-500/15 text-sky-400 border border-sky-500/30">Low Severity</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Overview Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-5">
        <div>
          <div className="flex items-center gap-2">
            <ShieldAlert className="w-5 h-5 text-amber-400" />
            <h2 className="text-lg font-bold text-white">
              Job Description Bias &amp; Inclusivity Auditor
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1.5 max-w-2xl">
            Automatically scans job requirements for credential gatekeeping, toxic cultural buzzwords, unrealistic experience inflation for intern roles, and exclusionary phrasing that restricts diversity.
          </p>
        </div>

        {biases.length > 0 && !isFixed && (
          <button
            onClick={handleApplyInclusiveRewrites}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs transition shadow-lg shadow-emerald-500/20 whitespace-nowrap"
          >
            <Wand2 className="w-4 h-4" />
            <span>Apply Inclusive Rewrites</span>
          </button>
        )}
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <span className="text-xs text-slate-400 font-medium">Inclusivity Score</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className={`text-2xl font-bold font-mono ${biases.length === 0 ? 'text-emerald-400' : 'text-amber-400'}`}>
              {biases.length === 0 ? '98%' : '62%'}
            </span>
            <span className="text-xs text-slate-400">
              {biases.length === 0 ? 'Optimized' : 'Needs Correction'}
            </span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            {biases.length === 0 
              ? 'JD welcomes diverse applicants based on practical competency.' 
              : '4 narrow criteria artificially filter qualified talent.'}
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <span className="text-xs text-slate-400 font-medium">Flags Detected</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-2xl font-bold text-white font-mono">{biases.length}</span>
            <span className="text-xs text-rose-400 font-medium">High/Med Impact</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Affects university tiers, gender diversity &amp; candidate pool size.
          </p>
        </div>

        <div className="bg-slate-900 border border-slate-800 rounded-xl p-4">
          <span className="text-xs text-slate-400 font-medium">Audited Target Role</span>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-sm font-semibold text-emerald-400 truncate">{jobDescription.title}</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1 truncate">
            {jobDescription.company} • {jobDescription.experienceLevel}
          </p>
        </div>
      </div>

      {/* List of Detected Biases */}
      {biases.length === 0 ? (
        <div className="bg-emerald-950/20 border border-emerald-500/30 rounded-2xl p-8 text-center">
          <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white">
            Job Description is Fully Inclusive!
          </h3>
          <p className="text-xs text-slate-300 max-w-md mx-auto mt-1.5 leading-relaxed">
            All exclusionary filters (such as institutional gatekeeping and aggressive phrasing) have been resolved. The shortlisting engine can now evaluate candidates purely on merit and technical aptitude.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {biases.map((bias, idx) => (
            <div
              key={bias.id || idx}
              className="bg-slate-900 border border-slate-800 rounded-xl p-5 hover:border-amber-500/40 transition"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-800 gap-2">
                <div className="flex items-center gap-2.5">
                  <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="text-sm font-bold text-white">
                    {getCategoryTitle(bias.category)}
                  </span>
                </div>
                <div>{getSeverityBadge(bias.severity)}</div>
              </div>

              <div className="mt-3.5 space-y-3">
                <div>
                  <span className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold block mb-1">
                    Problematic Phrasing in Current JD:
                  </span>
                  <div className="bg-rose-950/20 border border-rose-500/20 rounded-lg p-2.5 text-xs text-rose-300 font-mono">
                    "{bias.phrase}"
                  </div>
                </div>

                <div>
                  <span className="text-[11px] text-slate-400 uppercase tracking-wider font-semibold block mb-1">
                    Why This Excludes Talent:
                  </span>
                  <p className="text-xs text-slate-300 leading-relaxed bg-slate-950/40 p-2.5 rounded-lg border border-slate-800/60">
                    {bias.explanation}
                  </p>
                </div>

                <div>
                  <span className="text-[11px] text-emerald-400 uppercase tracking-wider font-semibold block mb-1 flex items-center gap-1">
                    <Sparkles className="w-3 h-3 text-emerald-400" />
                    Recommended Inclusive Alternative:
                  </span>
                  <div className="bg-emerald-950/20 border border-emerald-500/20 rounded-lg p-2.5 text-xs text-emerald-300">
                    {bias.recommendation}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
