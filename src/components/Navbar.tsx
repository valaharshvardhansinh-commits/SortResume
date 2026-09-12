import React from 'react';
import { Sparkles, Sliders, FileText, Bot, ShieldAlert, Cpu, Database, RefreshCw } from 'lucide-react';
import { RankingWeights } from '../types';

interface NavbarProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  weights: RankingWeights;
  setWeights: React.Dispatch<React.SetStateAction<RankingWeights>>;
  totalCandidates: number;
  onResetToSampleData: () => void;
  isLoading: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  activeTab,
  setActiveTab,
  weights,
  setWeights,
  totalCandidates,
  onResetToSampleData,
  isLoading
}) => {
  const handleSemanticSlider = (val: number) => {
    const sem = Math.round(val * 100) / 100;
    const kw = Math.round((1 - sem) * 100) / 100;
    setWeights({ semanticWeight: sem, keywordWeight: kw });
  };

  const navItems = [
    { id: 'shortlist', label: 'Ranked Shortlist', icon: FileText, badge: `${totalCandidates}` },
    { id: 'top3', label: 'Top 3 Explanations', icon: Sparkles, badge: 'AI' },
    { id: 'bias', label: 'JD Bias Flagger', icon: ShieldAlert, badge: '4 Flags' },
    { id: 'chat', label: 'Recruiter Chat', icon: Bot },
    { id: 'upload', label: 'Data Ingestion & PDFs', icon: Database },
    { id: 'architecture', label: 'Architecture & Python Code', icon: Cpu }
  ];

  return (
    <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-30 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Brand and primary actions */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between py-3 gap-3 border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-emerald-500 to-teal-400 flex items-center justify-center shadow-lg shadow-emerald-500/20 text-slate-950 font-black text-xl tracking-tight">
              IL
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-white tracking-tight">
                  Smart Shortlisting Engine
                </h1>
                <span className="text-[11px] font-semibold tracking-wide uppercase px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  InternLoom AI Hackathon
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Hybrid Semantic Vector &amp; Explicit Keyword Resume Matcher • MIT Manipal
              </p>
            </div>
          </div>

          {/* Quick interactive weights tuner */}
          <div className="flex items-center gap-4 bg-slate-950/70 border border-slate-800 rounded-xl p-2.5 px-3">
            <div className="flex items-center gap-1.5 text-xs text-slate-300 font-medium">
              <Sliders className="w-3.5 h-3.5 text-emerald-400" />
              <span>Hybrid Weights:</span>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex flex-col gap-0.5">
                <div className="flex justify-between text-[11px] text-slate-400 font-mono">
                  <span className="text-teal-400 font-semibold">Semantic {Math.round(weights.semanticWeight * 100)}%</span>
                  <span className="text-indigo-400 font-semibold">Keyword {Math.round(weights.keywordWeight * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={weights.semanticWeight}
                  onChange={(e) => handleSemanticSlider(parseFloat(e.target.value))}
                  className="w-36 sm:w-44 accent-emerald-500 h-1.5 bg-slate-800 rounded-lg cursor-pointer"
                  title="Drag to adjust Semantic vs Keyword ranking weight"
                />
              </div>
            </div>

            <button
              onClick={onResetToSampleData}
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition"
              title="Reload sample TechNova JD and 18 diverse candidate resumes"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin text-emerald-400' : ''}`} />
              <span className="hidden sm:inline">Reset Dataset</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <nav className="flex space-x-1 sm:space-x-2 py-2 overflow-x-auto scrollbar-none" aria-label="Tabs">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                id={`tab-btn-${item.id}`}
                onClick={() => setActiveTab(item.id)}
                className={`flex items-center gap-2 px-3 py-2 text-xs sm:text-sm font-medium rounded-lg whitespace-nowrap transition-all ${
                  isActive
                    ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-semibold'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                }`}
              >
                <Icon className={`w-4 h-4 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                <span>{item.label}</span>
                {item.badge && (
                  <span
                    className={`text-[10px] px-1.5 py-0.5 rounded-full font-mono ${
                      isActive
                        ? 'bg-emerald-500/20 text-emerald-300'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>
      </div>
    </header>
  );
};
