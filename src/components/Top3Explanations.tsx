import React from 'react';
import { CandidateResume, CandidateScoreBreakdown, JobDescription } from '../types';
import { Trophy, CheckCircle2, AlertCircle, HelpCircle, Sparkles, RefreshCw, ArrowRight } from 'lucide-react';

interface Top3ExplanationsProps {
  rankings: CandidateScoreBreakdown[];
  candidates: CandidateResume[];
  jobDescription: JobDescription;
  onSelectCandidate: (candidate: CandidateResume, breakdown: CandidateScoreBreakdown) => void;
  onRefreshExplanations: () => void;
  isGenerating: boolean;
}

export const Top3Explanations: React.FC<Top3ExplanationsProps> = ({
  rankings,
  candidates,
  jobDescription,
  onSelectCandidate,
  onRefreshExplanations,
  isGenerating
}) => {
  const top3 = rankings.slice(0, 3);
  const candidatesMap = new Map<string, CandidateResume>();
  candidates.forEach(c => candidatesMap.set(c.id, c));

  const getMedalStyles = (rank: number) => {
    if (rank === 1) {
      return {
        badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
        cardBorder: 'border-amber-500/40 shadow-amber-500/10',
        title: 'Rank #1 • Top Pick (Gold Match)',
        iconColor: 'text-amber-400'
      };
    }
    if (rank === 2) {
      return {
        badgeBg: 'bg-slate-300/20 text-slate-200 border-slate-400/40',
        cardBorder: 'border-slate-500/40 shadow-slate-500/10',
        title: 'Rank #2 • Runner Up (Silver Match)',
        iconColor: 'text-slate-300'
      };
    }
    return {
      badgeBg: 'bg-amber-700/20 text-amber-400 border-amber-600/40',
      cardBorder: 'border-amber-700/40 shadow-amber-700/10',
      title: 'Rank #3 • Shortlisted (Bronze Match)',
      iconColor: 'text-amber-500'
    };
  };

  return (
    <div className="space-y-6">
      {/* Header explanation banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-5 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-emerald-400" />
            <h2 className="text-lg font-bold text-white">
              Top 3 Shortlisted Candidate Explanations
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Objective, auditable reasoning detailing matched required skills, missing qualifications, and architectural depth for the top candidates competing for "{jobDescription.title}".
          </p>
        </div>

        <button
          onClick={onRefreshExplanations}
          disabled={isGenerating}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-semibold text-xs transition shadow-lg shadow-emerald-600/20"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isGenerating ? 'animate-spin' : ''}`} />
          <span>{isGenerating ? 'Generating Explanations...' : 'Refresh with Gemini'}</span>
        </button>
      </div>

      {/* Top 3 Cards Grid */}
      <div className="grid grid-cols-1 gap-6">
        {top3.map((item) => {
          const candidate = candidatesMap.get(item.candidateId);
          const medal = getMedalStyles(item.rank);

          const defaultSummary = item.explanation?.summary || 
            `${item.candidateName} earned Rank #${item.rank} with a composite score of ${item.finalScore}%. Demonstrates high dual alignment between practical project experience (${item.semanticScore}% semantic similarity) and core required tools (${item.keywordScore}% keyword overlap).`;

          const defaultWhy = item.explanation?.whyRankedHere || 
            `Successfully matched ${item.matchedRequiredSkills.length} of ${jobDescription.requiredHardSkills.length} required hard skills: ${item.matchedRequiredSkills.join(', ')}. ` +
            (item.missingRequiredSkills.length > 0 
              ? `Minor gap in ${item.missingRequiredSkills.join(', ')}.` 
              : 'Zero missing required skills.');

          const strengths = item.explanation?.keyStrengths || [
            `Strong hands-on experience in ${item.matchedRequiredSkills.slice(0, 3).join(', ')}`,
            `Demonstrated full-stack architectural understanding in university and personal projects`,
            `High semantic relevance to the core responsibilities outlined in the JD`
          ];

          const gaps = item.explanation?.criticalGaps || (
            item.missingRequiredSkills.length > 0
              ? item.missingRequiredSkills.map(s => `Requires verification of practical proficiency in ${s}`)
              : ['Verify depth of high-concurrency microservice scaling during technical rounds']
          );

          const questions = item.explanation?.recommendedInterviewQuestions || [
            `Can you walk us through the database schema modeling you implemented in your primary full-stack project?`,
            `How did you architect authentication and error handling in your RESTful API endpoints?`,
            `What trade-offs did you consider when structuring frontend state in React?`
          ];

          return (
            <div
              key={item.candidateId}
              className={`bg-slate-900 border rounded-2xl p-6 shadow-xl transition-all ${medal.cardBorder}`}
            >
              {/* Card Header */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 gap-3">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center border font-bold text-base ${medal.badgeBg}`}>
                    #{item.rank}
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                      {medal.title}
                    </span>
                    <h3 className="text-xl font-bold text-white">
                      {item.candidateName}
                    </h3>
                  </div>
                </div>

                {/* Score breakdown metrics */}
                <div className="flex items-center gap-4 bg-slate-950/80 border border-slate-800/80 rounded-xl px-4 py-2">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase block font-medium">Final Fit</span>
                    <span className="text-lg font-bold text-emerald-400 font-mono">{item.finalScore}%</span>
                  </div>
                  <div className="h-6 w-px bg-slate-800" />
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase block font-medium">Semantic (60%)</span>
                    <span className="text-sm font-semibold text-teal-400 font-mono">{item.semanticScore}%</span>
                  </div>
                  <div className="h-6 w-px bg-slate-800" />
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase block font-medium">Keyword (40%)</span>
                    <span className="text-sm font-semibold text-indigo-400 font-mono">{item.keywordScore}%</span>
                  </div>
                </div>
              </div>

              {/* Body: Summary & Reasoning */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mt-6">
                {/* Left 2 Cols: Why Ranked Here & Skills */}
                <div className="lg:col-span-2 space-y-4">
                  <div>
                    <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                      Executive Summary
                    </h4>
                    <p className="text-sm text-slate-200 leading-relaxed bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/70">
                      {defaultSummary}
                    </p>
                  </div>

                  <div>
                    <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                      Why Ranked Here (Skills Overlap vs Gaps)
                    </h4>
                    <p className="text-xs sm:text-sm text-slate-300 leading-relaxed bg-slate-950/40 p-3.5 rounded-xl border border-slate-800/50">
                      {defaultWhy}
                    </p>
                  </div>

                  {/* Skills Grid */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                    <div className="bg-emerald-950/20 border border-emerald-600/20 rounded-xl p-3.5">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-400 mb-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                        <span>Matched Required Skills ({item.matchedRequiredSkills.length})</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {item.matchedRequiredSkills.map(skill => (
                          <span
                            key={skill}
                            className="text-xs px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-medium"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    </div>

                    <div className="bg-rose-950/20 border border-rose-600/20 rounded-xl p-3.5">
                      <div className="flex items-center gap-1.5 text-xs font-semibold text-rose-400 mb-2">
                        <AlertCircle className="w-4 h-4 text-rose-400" />
                        <span>Missing Required Skills ({item.missingRequiredSkills.length})</span>
                      </div>
                      <div className="flex flex-wrap gap-1.5">
                        {item.missingRequiredSkills.length > 0 ? (
                          item.missingRequiredSkills.map(skill => (
                            <span
                              key={skill}
                              className="text-xs px-2 py-0.5 rounded bg-rose-500/15 text-rose-300 border border-rose-500/30 font-medium"
                            >
                              {skill}
                            </span>
                          ))
                        ) : (
                          <span className="text-xs text-slate-400 italic">None • Complete hard requirements match</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Right Col: Strengths, Gaps & Suggested Questions */}
                <div className="space-y-4 bg-slate-950/60 p-4 rounded-xl border border-slate-800/80">
                  <div>
                    <h5 className="text-xs font-semibold text-emerald-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      Key Strengths
                    </h5>
                    <ul className="space-y-1.5 text-xs text-slate-300">
                      {strengths.map((str, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <span className="text-emerald-400 font-bold">•</span>
                          <span>{str}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-2 border-t border-slate-800">
                    <h5 className="text-xs font-semibold text-amber-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <AlertCircle className="w-3.5 h-3.5" />
                      Critical Gaps / Verification
                    </h5>
                    <ul className="space-y-1.5 text-xs text-slate-300">
                      {gaps.map((gap, i) => (
                        <li key={i} className="flex items-start gap-1.5">
                          <span className="text-amber-400 font-bold">•</span>
                          <span>{gap}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="pt-2 border-t border-slate-800">
                    <h5 className="text-xs font-semibold text-sky-400 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                      <HelpCircle className="w-3.5 h-3.5" />
                      Recommended Interview Probe
                    </h5>
                    <p className="text-xs text-slate-300 italic bg-slate-900 p-2.5 rounded-lg border border-slate-800">
                      "{questions[0]}"
                    </p>
                  </div>

                  {candidate && (
                    <button
                      onClick={() => onSelectCandidate(candidate, item)}
                      className="w-full mt-2 py-2 px-3 text-xs font-semibold rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 flex items-center justify-center gap-1.5 transition"
                    >
                      <span>Inspect Candidate Deep Breakdown</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
