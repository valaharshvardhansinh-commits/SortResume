import React, { useState, useMemo } from 'react';
import { CandidateResume, CandidateScoreBreakdown, JobDescription, RankingWeights } from '../types';
import {
  Trophy,
  Search,
  Filter,
  AlertTriangle,
  CheckCircle2,
  ChevronRight,
  BarChart2,
  Check,
  X,
  ShieldAlert,
  FileText,
  Sparkles,
  UploadCloud,
  ArrowRight,
  Info
} from 'lucide-react';

interface ShortlistTableProps {
  rankings: CandidateScoreBreakdown[];
  candidates: CandidateResume[];
  jobDescription: JobDescription;
  weights: RankingWeights;
  onSelectCandidate: (candidate: CandidateResume, breakdown: CandidateScoreBreakdown) => void;
  onSwitchToTab: (tab: string) => void;
}

export const ShortlistTable: React.FC<ShortlistTableProps> = ({
  rankings,
  candidates,
  jobDescription,
  weights,
  onSelectCandidate,
  onSwitchToTab
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterFit, setFilterFit] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'final' | 'semantic' | 'keyword'>('final');
  const [showTop3Highlight, setShowTop3Highlight] = useState<boolean>(true);

  const candidatesMap = useMemo(() => {
    const map = new Map<string, CandidateResume>();
    candidates.forEach(c => map.set(c.id, c));
    return map;
  }, [candidates]);

  const filteredAndSorted = useMemo(() => {
    let list = rankings.filter(r => {
      const candidate = candidatesMap.get(r.candidateId);
      const filenameMatch = (r.filename || candidate?.filename || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchesSearch =
        r.candidateName.toLowerCase().includes(searchTerm.toLowerCase()) ||
        filenameMatch ||
        r.matchedRequiredSkills.some(s => s.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (candidate?.extractedSkills || []).some(s => s.toLowerCase().includes(searchTerm.toLowerCase()));

      const matchesFit = filterFit === 'all' || r.fitCategory.toLowerCase().replace(/\s+/g, '-') === filterFit;
      return matchesSearch && matchesFit;
    });

    return list.sort((a, b) => {
      if (sortBy === 'semantic') return b.semanticScore - a.semanticScore;
      if (sortBy === 'keyword') return b.keywordScore - a.keywordScore;
      return b.finalScore - a.finalScore;
    });
  }, [rankings, candidatesMap, searchTerm, filterFit, sortBy]);

  const stats = useMemo(() => {
    const total = rankings.length;
    const strong = rankings.filter(r => r.finalScore >= 75).length;
    const moderate = rankings.filter(r => r.finalScore >= 50 && r.finalScore < 75).length;
    const weak = rankings.filter(r => r.finalScore < 50).length;
    const avgScore = total > 0 ? Math.round(rankings.reduce((acc, r) => acc + r.finalScore, 0) / total) : 0;
    return { total, strong, moderate, weak, avgScore };
  }, [rankings]);

  const top3 = useMemo(() => {
    return rankings.slice(0, 3);
  }, [rankings]);

  const getRankBadge = (rank: number) => {
    if (rank === 1) {
      return (
        <span className="w-8 h-8 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center justify-center font-bold text-sm shadow-md shadow-amber-500/10">
          <Trophy className="w-4 h-4 text-amber-400" />
        </span>
      );
    }
    if (rank === 2) {
      return (
        <span className="w-8 h-8 rounded-lg bg-slate-300/20 text-slate-200 border border-slate-400/40 flex items-center justify-center font-bold text-sm">
          #2
        </span>
      );
    }
    if (rank === 3) {
      return (
        <span className="w-8 h-8 rounded-lg bg-amber-700/20 text-amber-400 border border-amber-600/40 flex items-center justify-center font-bold text-sm">
          #3
        </span>
      );
    }
    return (
      <span className="w-8 h-8 rounded-lg bg-slate-800/80 text-slate-400 border border-slate-700/60 flex items-center justify-center font-medium text-xs font-mono">
        #{rank}
      </span>
    );
  };

  const getFitBadge = (fitCategory: string) => {
    switch (fitCategory) {
      case 'Strong Fit':
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">Strong Fit</span>;
      case 'Moderate Fit':
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-sky-500/15 text-sky-400 border border-sky-500/30">Moderate Fit</span>;
      case 'Weak Fit':
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-500/15 text-amber-400 border border-amber-500/30">Weak Fit</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[11px] font-semibold bg-rose-500/15 text-rose-400 border border-rose-500/30">Not a Fit</span>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Overview Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4">
          <p className="text-xs text-slate-400 font-medium">Ranked Candidate Pool</p>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-bold text-white">{stats.total} Resumes</span>
            <button
              onClick={() => onSwitchToTab('upload')}
              className="text-[11px] text-emerald-400 hover:underline font-medium"
            >
              + Batch Upload
            </button>
          </div>
          <p className="text-[11px] text-slate-400 mt-1 truncate">
            Target: {jobDescription.title}
          </p>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4">
          <p className="text-xs text-emerald-400 font-medium">Strong Matches</p>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-bold text-emerald-300">{stats.strong}</span>
            <span className="text-xs text-emerald-400 font-mono">≥ 75% Score</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Ready for technical interview
          </p>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4">
          <p className="text-xs text-sky-400 font-medium">Moderate Matches</p>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-2xl font-bold text-sky-300">{stats.moderate}</span>
            <span className="text-xs text-sky-400 font-mono">50% - 74%</span>
          </div>
          <p className="text-[11px] text-slate-400 mt-1">
            Transferable skills / training needed
          </p>
        </div>

        <div className="bg-slate-900/90 border border-slate-800 rounded-xl p-4">
          <p className="text-xs text-slate-400 font-medium">Dual-Scoring Formula</p>
          <div className="flex items-baseline justify-between mt-1">
            <span className="text-sm font-semibold text-white font-mono">
              {Math.round(weights.semanticWeight * 100)}% Sem + {Math.round(weights.keywordWeight * 100)}% KW
            </span>
            <span className="text-xs text-slate-400 font-mono">Avg {stats.avgScore}%</span>
          </div>
          <p className="text-[11px] text-emerald-400/90 mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3 text-emerald-400" />
            Deterministic math (Cosine + Jaccard)
          </p>
        </div>
      </div>

      {/* Bias notice banner if detected in JD */}
      {jobDescription.detectedBiases && jobDescription.detectedBiases.length > 0 && (
        <div className="bg-amber-950/30 border border-amber-600/30 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-amber-200">
          <div className="flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-semibold text-amber-300">
                JD Exclusionary Phrases Detected ({jobDescription.detectedBiases.length} flags)
              </p>
              <p className="text-xs text-amber-200/80 mt-0.5">
                The current Job Description contains restrictive phrasing (Tier-1 college requirement, 2+ years intern experience, rockstar/ninja culture) that unfairly penalizes qualified candidates.
              </p>
            </div>
          </div>
          <button
            onClick={() => onSwitchToTab('bias')}
            className="text-xs font-semibold px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 whitespace-nowrap transition"
          >
            Review &amp; Fix Bias Flags →
          </button>
        </div>
      )}

      {/* Top 3 Candidate Explainability Cards Section */}
      {showTop3Highlight && top3.length > 0 && (
        <div className="bg-slate-900 border border-emerald-500/30 rounded-2xl p-5 space-y-4 shadow-lg">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <h2 className="text-sm sm:text-base font-bold text-white">
                Top 3 Candidate Explainability Highlights
              </h2>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                Audit Trail
              </span>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => onSwitchToTab('top3')}
                className="text-xs font-semibold text-emerald-400 hover:underline flex items-center gap-1"
              >
                <span>Open Full Deep-Dive</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setShowTop3Highlight(false)}
                className="text-xs text-slate-500 hover:text-slate-300"
                title="Hide top 3 highlight"
              >
                Hide
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {top3.map((item) => {
              const cand = candidatesMap.get(item.candidateId);
              return (
                <div
                  key={item.candidateId}
                  onClick={() => cand && onSelectCandidate(cand, item)}
                  className="bg-slate-950/70 border border-slate-800 hover:border-emerald-500/50 rounded-xl p-4 space-y-3 cursor-pointer transition group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {getRankBadge(item.rank)}
                      <div>
                        <h4 className="text-sm font-bold text-white group-hover:text-emerald-400 transition">
                          {item.candidateName}
                        </h4>
                        <span className="text-[10px] font-mono text-slate-400">
                          {item.filename || cand?.filename || `${item.candidateName.replace(/\s+/g, '_')}.pdf`}
                        </span>
                      </div>
                    </div>
                    <span className="text-sm font-bold font-mono text-emerald-400">
                      {item.finalScore}%
                    </span>
                  </div>

                  {/* Skills Summary */}
                  <div className="space-y-1.5 text-xs">
                    <div>
                      <span className="text-[10px] uppercase text-emerald-400 font-semibold block">
                        Matched Skills ({item.matchedRequiredSkills.length}):
                      </span>
                      <p className="text-slate-300 text-[11px] line-clamp-1">
                        {item.matchedRequiredSkills.slice(0, 4).join(', ')}
                        {item.matchedRequiredSkills.length > 4 ? ` +${item.matchedRequiredSkills.length - 4}` : ''}
                      </p>
                    </div>

                    {item.missingRequiredSkills.length > 0 ? (
                      <div>
                        <span className="text-[10px] uppercase text-rose-400 font-semibold block">
                          Missing Skills ({item.missingRequiredSkills.length}):
                        </span>
                        <p className="text-rose-300/80 text-[11px] line-clamp-1">
                          {item.missingRequiredSkills.slice(0, 3).join(', ')}
                        </p>
                      </div>
                    ) : (
                      <div className="text-[11px] text-emerald-400 font-medium">
                        ✓ 100% Required Skills Covered
                      </div>
                    )}
                  </div>

                  {/* Short Summary */}
                  <p className="text-[11px] text-slate-400 line-clamp-2 italic pt-1 border-t border-slate-800/80">
                    "{item.explanation?.summary || `Earned Rank #${item.rank} with balanced keyword overlap (${item.keywordScore}%) and semantic experience alignment (${item.semanticScore}%).`}"
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Filter, Search, and Batch Ingestion Action Bar */}
      <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3 bg-slate-900 border border-slate-800 rounded-xl p-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search candidate name, filename, or skill (e.g. Express, Docker, MongoDB)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-4 py-2 text-xs sm:text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-emerald-500"
          />
        </div>

        <div className="flex items-center gap-2 overflow-x-auto">
          <div className="flex items-center gap-1.5 text-xs text-slate-400 pl-1">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <span>Fit:</span>
          </div>
          <select
            value={filterFit}
            onChange={(e) => setFilterFit(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
          >
            <option value="all">All Candidates ({rankings.length})</option>
            <option value="strong-fit">Strong Fit (≥ 75%)</option>
            <option value="moderate-fit">Moderate Fit (50-74%)</option>
            <option value="weak-fit">Weak Fit (30-49%)</option>
            <option value="not-a-fit">Not a Fit (&lt; 30%)</option>
          </select>

          <div className="flex items-center gap-1.5 text-xs text-slate-400 pl-2">
            <BarChart2 className="w-3.5 h-3.5 text-slate-400" />
            <span>Sort:</span>
          </div>
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as any)}
            className="bg-slate-950 border border-slate-800 rounded-lg px-2.5 py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500"
          >
            <option value="final">Final Score (Weighted)</option>
            <option value="semantic">Semantic Meaning (Cosine)</option>
            <option value="keyword">Keyword Overlap (Explicit)</option>
          </select>

          <button
            onClick={() => onSwitchToTab('upload')}
            className="ml-2 px-3 py-2 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-slate-950 font-bold text-xs flex items-center gap-1.5 shrink-0 transition"
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span>Upload Batch</span>
          </button>
        </div>
      </div>

      {/* Leaderboard Table Column Headers */}
      <div className="hidden lg:grid grid-cols-12 gap-4 px-5 py-2.5 bg-slate-950/80 border border-slate-800 rounded-xl text-[11px] font-bold uppercase tracking-wider text-slate-400">
        <div className="col-span-1">Rank</div>
        <div className="col-span-6">Candidate Name &amp; Resume File</div>
        <div className="col-span-5 flex items-center justify-end gap-6 text-right">
          <span className="w-20 text-indigo-400 font-mono">Keyword Score</span>
          <span className="w-20 text-teal-400 font-mono">Semantic Score</span>
          <span className="w-24 text-emerald-400 font-mono">Final Score</span>
          <span className="w-6"></span>
        </div>
      </div>

      {/* Candidate Rankings List / Leaderboard Rows */}
      <div className="space-y-3">
        {filteredAndSorted.length === 0 ? (
          <div className="text-center py-12 bg-slate-900/60 border border-slate-800 rounded-xl text-slate-400">
            <p className="text-sm">No candidates matched the current search or fit filter.</p>
            <button
              onClick={() => { setSearchTerm(''); setFilterFit('all'); }}
              className="mt-2 text-xs text-emerald-400 hover:underline font-medium"
            >
              Clear filters
            </button>
          </div>
        ) : (
          filteredAndSorted.map((item) => {
            const candidate = candidatesMap.get(item.candidateId);
            const isTop3 = item.rank <= 3;

            return (
              <div
                key={item.candidateId}
                id={`candidate-row-${item.candidateId}`}
                onClick={() => candidate && onSelectCandidate(candidate, item)}
                className={`group relative bg-slate-900 border transition-all duration-200 rounded-xl p-4 sm:p-5 cursor-pointer hover:border-emerald-500/50 hover:bg-slate-900/90 ${
                  isTop3
                    ? 'border-emerald-500/30 shadow-lg shadow-emerald-500/5'
                    : 'border-slate-800'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                  {/* Left: Rank & Candidate Info */}
                  <div className="flex items-start gap-3 sm:gap-4 flex-1">
                    <div className="pt-0.5">{getRankBadge(item.rank)}</div>
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="text-base font-semibold text-white group-hover:text-emerald-400 transition">
                          {item.candidateName}
                        </h3>
                        <span className="text-[11px] font-mono text-slate-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800 flex items-center gap-1">
                          <FileText className="w-3 h-3 text-slate-500" />
                          {item.filename || candidate?.filename || `${item.candidateName.replace(/\s+/g, '_')}_Resume.pdf`}
                        </span>
                        {getFitBadge(item.fitCategory)}

                        {candidate?.isUnreadable && (
                          <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-rose-500/10 text-rose-400 border border-rose-500/30">
                            <AlertTriangle className="w-3 h-3" />
                            Unreadable Document
                          </span>
                        )}

                        {candidate?.formattingQuality && candidate.formattingQuality.score < 75 && (
                          <span
                            className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/30"
                            title={candidate.formattingQuality.notes}
                          >
                            <AlertTriangle className="w-3 h-3" />
                            Formatting Variations ({candidate.formattingQuality.detectedTypos.length} typos)
                          </span>
                        )}
                      </div>

                      <p className="text-xs text-slate-400 mt-1 line-clamp-1">
                        {candidate?.education || 'Candidate Profile'}
                      </p>

                      {/* Matched & Missing Skills Chips */}
                      <div className="flex flex-wrap items-center gap-1.5 mt-2.5">
                        <span className="text-[11px] text-slate-400 mr-1 font-medium">Matched ({item.matchedRequiredSkills.length}):</span>
                        {item.matchedRequiredSkills.slice(0, 5).map((skill) => (
                          <span
                            key={skill}
                            className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-medium"
                          >
                            <Check className="w-2.5 h-2.5 text-emerald-400" />
                            {skill}
                          </span>
                        ))}
                        {item.matchedRequiredSkills.length > 5 && (
                          <span className="text-[11px] text-emerald-400/80">
                            +{item.matchedRequiredSkills.length - 5} more
                          </span>
                        )}

                        {item.missingRequiredSkills.length > 0 && (
                          <>
                            <span className="text-[11px] text-slate-400 mx-1">|</span>
                            <span className="text-[11px] text-rose-400/90 font-medium">Missing:</span>
                            {item.missingRequiredSkills.slice(0, 3).map((skill) => (
                              <span
                                key={skill}
                                className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded bg-rose-500/10 text-rose-300 border border-rose-500/20 font-medium"
                              >
                                <X className="w-2.5 h-2.5 text-rose-400" />
                                {skill}
                              </span>
                            ))}
                            {item.missingRequiredSkills.length > 3 && (
                              <span className="text-[11px] text-rose-400/80">
                                +{item.missingRequiredSkills.length - 3} more
                              </span>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Right: Scores & Details Action */}
                  <div className="flex items-center justify-between lg:justify-end gap-6 pt-3 lg:pt-0 border-t border-slate-800 lg:border-t-0">
                    <div className="flex items-center gap-5 text-right">
                      <div className="w-20">
                        <div className="text-[11px] text-indigo-300 uppercase tracking-wider font-semibold">
                          Keyword
                        </div>
                        <div className="text-sm font-semibold text-indigo-400 font-mono">
                          {item.keywordScore}%
                        </div>
                      </div>

                      <div className="h-7 w-px bg-slate-800" />

                      <div className="w-20">
                        <div className="text-[11px] text-teal-300 uppercase tracking-wider font-semibold">
                          Semantic
                        </div>
                        <div className="text-sm font-semibold text-teal-400 font-mono">
                          {item.semanticScore}%
                        </div>
                      </div>

                      <div className="h-7 w-px bg-slate-800" />

                      <div className="w-24">
                        <div className="text-[11px] text-emerald-300 uppercase tracking-wider font-semibold">
                          Final Score
                        </div>
                        <div className="text-lg font-bold text-white font-mono flex items-center justify-end gap-1">
                          <span className={item.finalScore >= 75 ? 'text-emerald-400' : 'text-slate-100'}>
                            {item.finalScore}%
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center text-slate-400 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition pl-2">
                      <ChevronRight className="w-5 h-5" />
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};
