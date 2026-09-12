export interface JDBiasIssue {
  id: string;
  category: 'exclusionary_credentials' | 'experience_inflation' | 'gendered_or_aggressive' | 'rigid_tooling' | 'work_life_balance';
  phrase: string;
  severity: 'high' | 'medium' | 'low';
  explanation: string;
  recommendation: string;
}

export interface JobDescription {
  id: string;
  title: string;
  company: string;
  location: string;
  experienceLevel: string;
  rawText: string;
  requiredHardSkills: string[];
  goodToHaveSkills: string[];
  coreResponsibilities: string[];
  educationRequirements: string[];
  detectedBiases: JDBiasIssue[];
}

export interface ResumeFormattingQuality {
  score: number; // 0-100
  hasInconsistentHeaders: boolean;
  hasVariedDateFormats: boolean;
  detectedTypos: string[];
  cleanedTextSnippet?: string;
  notes: string;
}

export interface CandidateResume {
  id: string;
  candidateName: string;
  filename?: string;
  email?: string;
  phone?: string;
  education: string;
  experienceSummary: string;
  extractedSkills: string[];
  projects: string[];
  rawText: string;
  formattingQuality: ResumeFormattingQuality;
  isUnreadable?: boolean;
}

export interface CandidateTop3Explanation {
  summary: string;
  whyRankedHere: string;
  keyStrengths: string[];
  criticalGaps: string[];
  recommendedInterviewQuestions: string[];
}

export interface CandidateScoreBreakdown {
  candidateId: string;
  candidateName: string;
  filename?: string;
  rank: number;
  finalScore: number; // 0-100
  semanticScore: number; // 0-100
  keywordScore: number; // 0-100
  matchedRequiredSkills: string[];
  missingRequiredSkills: string[];
  matchedGoodToHaveSkills: string[];
  missingGoodToHaveSkills: string[];
  fitCategory: 'Strong Fit' | 'Moderate Fit' | 'Weak Fit' | 'Not a Fit';
  vectorCosineSimilarity: number;
  keywordJaccardRatio: number;
  explanation?: CandidateTop3Explanation;
}

export interface RankingWeights {
  semanticWeight: number; // e.g. 0.60
  keywordWeight: number;  // e.g. 0.40
}

export interface RecruiterChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  referencedCandidates?: string[];
}

export interface ShortlistAnalysisResult {
  jobDescription: JobDescription;
  candidates: CandidateResume[];
  rankings: CandidateScoreBreakdown[];
  weights: RankingWeights;
  processedAt: string;
  totalResumesAnalyzed: number;
}
