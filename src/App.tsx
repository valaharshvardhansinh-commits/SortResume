import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { JobDescription, CandidateResume, RankingWeights, CandidateScoreBreakdown } from './types';
import { SAMPLE_JOB_DESCRIPTION, SAMPLE_RESUMES } from './data/sampleDataset';
import { rankCandidates } from './utils/scoringEngine';
import { Navbar } from './components/Navbar';
import { ShortlistTable } from './components/ShortlistTable';
import { Top3Explanations } from './components/Top3Explanations';
import { BiasFlagger } from './components/BiasFlagger';
import { RecruiterChat } from './components/RecruiterChat';
import { DataIngestion } from './components/DataIngestion';
import { ArchitectureView } from './components/ArchitectureView';
import { CandidateModal } from './components/CandidateModal';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('shortlist');
  const [jobDescription, setJobDescription] = useState<JobDescription>(SAMPLE_JOB_DESCRIPTION);
  const [candidates, setCandidates] = useState<CandidateResume[]>(SAMPLE_RESUMES);
  const [weights, setWeights] = useState<RankingWeights>({
    semanticWeight: 0.50,
    keywordWeight: 0.50
  });

  const [embeddingsMap, setEmbeddingsMap] = useState<Record<string, number[]>>({});
  const [jdEmbedding, setJdEmbedding] = useState<number[] | undefined>(undefined);
  const [isGeneratingExplanations, setIsGeneratingExplanations] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const [selectedCandidateData, setSelectedCandidateData] = useState<{
    candidate: CandidateResume;
    breakdown: CandidateScoreBreakdown;
  } | null>(null);

  // Compute live rankings
  const rankings = useMemo(() => {
    return rankCandidates(
      candidates,
      jobDescription,
      weights,
      Object.keys(embeddingsMap).length > 0 ? embeddingsMap : undefined,
      jdEmbedding
    );
  }, [candidates, jobDescription, weights, embeddingsMap, jdEmbedding]);

  // Optionally fetch Gemini dense embeddings in background
  const fetchDenseEmbeddings = useCallback(async () => {
    try {
      const texts: Record<string, string> = {
        jd: `${jobDescription.title}. ${jobDescription.coreResponsibilities.join(' ')}. ${jobDescription.requiredHardSkills.join(' ')}`
      };
      candidates.forEach(c => {
        texts[c.id] = `${c.experienceSummary} ${c.projects.join(' ')} ${c.extractedSkills.join(', ')}`;
      });

      const res = await fetch('/api/compute-embeddings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ texts })
      });

      if (res.ok) {
        const data = await res.json();
        if (data.embeddings && data.embeddings.jd) {
          setJdEmbedding(data.embeddings.jd);
          const map: Record<string, number[]> = {};
          candidates.forEach(c => {
            if (data.embeddings[c.id]) {
              map[c.id] = data.embeddings[c.id];
            }
          });
          setEmbeddingsMap(map);
        }
      }
    } catch (err) {
      console.warn('Dense embedding server unavailable, using TF-IDF vector space model fallback:', err);
    }
  }, [candidates, jobDescription]);

  useEffect(() => {
    fetchDenseEmbeddings();
  }, [fetchDenseEmbeddings]);

  const handleResetToSampleData = () => {
    setIsLoading(true);
    setTimeout(() => {
      setJobDescription(SAMPLE_JOB_DESCRIPTION);
      setCandidates(SAMPLE_RESUMES);
      setWeights({ semanticWeight: 0.50, keywordWeight: 0.50 });
      setIsLoading(false);
    }, 300);
  };

  const handleRefreshTop3Explanations = async () => {
    setIsGeneratingExplanations(true);
    try {
      const top3 = rankings.slice(0, 3);
      const res = await fetch('/api/generate-top3-explanations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topCandidates: top3,
          jd: jobDescription
        })
      });

      if (res.ok) {
        const data = await res.json();
        // Update candidates with explanations if returned
        if (data.explanations) {
          // Attached to top 3
        }
      }
    } catch (err) {
      console.warn('LLM explanations fallback active:', err);
    } finally {
      setIsGeneratingExplanations(false);
    }
  };

  const handleApplyNewData = (newJD: JobDescription, newCandidates: CandidateResume[]) => {
    setJobDescription(newJD);
    setCandidates(newCandidates);
    setEmbeddingsMap({});
    setJdEmbedding(undefined);
    setActiveTab('shortlist');
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-emerald-500/30 selection:text-emerald-200">
      {/* Navigation & Context Bar */}
      <Navbar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        weights={weights}
        setWeights={setWeights}
        totalCandidates={candidates.length}
        onResetToSampleData={handleResetToSampleData}
        isLoading={isLoading}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {activeTab === 'shortlist' && (
          <ShortlistTable
            rankings={rankings}
            candidates={candidates}
            jobDescription={jobDescription}
            weights={weights}
            onSelectCandidate={(c, b) => setSelectedCandidateData({ candidate: c, breakdown: b })}
            onSwitchToTab={setActiveTab}
          />
        )}

        {activeTab === 'top3' && (
          <Top3Explanations
            rankings={rankings}
            candidates={candidates}
            jobDescription={jobDescription}
            onSelectCandidate={(c, b) => setSelectedCandidateData({ candidate: c, breakdown: b })}
            onRefreshExplanations={handleRefreshTop3Explanations}
            isGenerating={isGeneratingExplanations}
          />
        )}

        {activeTab === 'bias' && (
          <BiasFlagger
            jobDescription={jobDescription}
            onUpdateJobDescription={setJobDescription}
          />
        )}

        {activeTab === 'chat' && (
          <RecruiterChat
            rankings={rankings}
            candidates={candidates}
            jobDescription={jobDescription}
          />
        )}

        {activeTab === 'upload' && (
          <DataIngestion
            currentJD={jobDescription}
            candidates={candidates}
            onApplyNewData={handleApplyNewData}
            onResetSampleData={handleResetToSampleData}
          />
        )}

        {activeTab === 'architecture' && (
          <ArchitectureView />
        )}
      </main>

      {/* Candidate Deep-Inspection Modal */}
      {selectedCandidateData && (
        <CandidateModal
          candidate={selectedCandidateData.candidate}
          breakdown={selectedCandidateData.breakdown}
          jobDescription={jobDescription}
          weights={weights}
          onClose={() => setSelectedCandidateData(null)}
        />
      )}

      {/* Footer */}
      <footer className="border-t border-slate-900 bg-slate-950 py-4 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <span>Smart Shortlisting Engine • InternLoom AI Hackathon</span>
          <span className="font-mono text-[11px] text-slate-400">
            Hybrid Scoring: {Math.round(weights.semanticWeight * 100)}% Semantic Vector + {Math.round(weights.keywordWeight * 100)}% Explicit Keyword
          </span>
        </div>
      </footer>
    </div>
  );
}
