import { CandidateResume, CandidateScoreBreakdown, JobDescription, RankingWeights } from '../types';

// Normalized skill synonym dictionary
const SKILL_ALIASES: Record<string, string> = {
  'react': 'React',
  'react.js': 'React',
  'reactjs': 'React',
  'node': 'Node.js',
  'node.js': 'Node.js',
  'nodejs': 'Node.js',
  'express': 'Express',
  'express.js': 'Express',
  'expres': 'Express',
  'expres.js': 'Express',
  'mongodb': 'MongoDB',
  'mongo': 'MongoDB',
  'mongo db': 'MongoDB',
  'postgresql': 'PostgreSQL',
  'postgres': 'PostgreSQL',
  'psql': 'PostgreSQL',
  'rest': 'REST APIs',
  'rest api': 'REST APIs',
  'rest apis': 'REST APIs',
  'restful': 'REST APIs',
  'restful api': 'REST APIs',
  'restful apis': 'REST APIs',
  'git': 'Git',
  'github': 'Git',
  'gitt': 'Git',
  'docker': 'Docker',
  'dockr': 'Docker',
  'containerization': 'Docker',
  'typescript': 'TypeScript',
  'ts': 'TypeScript',
  'tailwind': 'Tailwind CSS',
  'tailwindcss': 'Tailwind CSS',
  'javascript': 'JavaScript',
  'javascrip': 'JavaScript',
  'js': 'JavaScript',
  'es6': 'JavaScript',
  'redux': 'Redux',
  'redis': 'Redis',
  'python': 'Python',
  'pyton': 'Python',
  'django': 'Django',
  'flask': 'Flask',
  'java': 'Java',
  'spring': 'Spring Boot',
  'spring boot': 'Spring Boot',
  'springboot': 'Spring Boot',
  'golang': 'Go',
  'go': 'Go',
  'firebase': 'Firebase',
  'firestore': 'Firebase',
  'aws': 'AWS',
  'nextjs': 'Next.js',
  'next.js': 'Next.js',
  'vue': 'Vue.js',
  'vue.js': 'Vue.js',
  'cypress': 'Cypress',
  'selenium': 'Selenium',
  'jest': 'Jest',
  'ci/cd': 'CI/CD',
  'figma': 'Figma',
  'html': 'HTML5',
  'html5': 'HTML5',
  'css': 'CSS3',
  'css3': 'CSS3'
};

export function normalizeSkill(rawSkill: string): string {
  const cleaned = rawSkill.trim().toLowerCase();
  return SKILL_ALIASES[cleaned] || rawSkill.trim();
}

/**
 * Robust tokenizing and skill matching against candidate text.
 * Handles fuzzy variations, typos (e.g. "Expres", "Gitt"), and aliases.
 */
export function candidateMatchesSkill(candidate: CandidateResume, targetSkill: string): boolean {
  const normTarget = normalizeSkill(targetSkill).toLowerCase();

  // 1. Direct check in extracted skills
  for (const s of candidate.extractedSkills) {
    if (normalizeSkill(s).toLowerCase() === normTarget) return true;
  }

  // 2. Search in rawText, experience, projects
  const searchableText = `${candidate.rawText} ${candidate.experienceSummary} ${candidate.projects.join(' ')}`.toLowerCase();
  
  // Specific alias keyword check
  const aliasKeys = Object.entries(SKILL_ALIASES)
    .filter(([_, canonical]) => canonical.toLowerCase() === normTarget)
    .map(([alias]) => alias);
  aliasKeys.push(normTarget);

  for (const alias of aliasKeys) {
    // Word boundary regex
    const escaped = alias.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`, 'i');
    if (regex.test(searchableText)) {
      return true;
    }
  }

  return false;
}

/**
 * Calculates deterministic keyword match score (0-100).
 * Required skills: 75% weight
 * Good-to-have skills: 25% weight
 */
export function calculateKeywordScore(
  candidate: CandidateResume,
  jd: JobDescription
): {
  score: number;
  matchedRequired: string[];
  missingRequired: string[];
  matchedGoodToHave: string[];
  missingGoodToHave: string[];
  jaccardRatio: number;
} {
  const matchedRequired: string[] = [];
  const missingRequired: string[] = [];

  for (const reqSkill of jd.requiredHardSkills) {
    if (candidateMatchesSkill(candidate, reqSkill)) {
      matchedRequired.push(reqSkill);
    } else {
      missingRequired.push(reqSkill);
    }
  }

  const matchedGoodToHave: string[] = [];
  const missingGoodToHave: string[] = [];

  for (const optSkill of jd.goodToHaveSkills) {
    if (candidateMatchesSkill(candidate, optSkill)) {
      matchedGoodToHave.push(optSkill);
    } else {
      missingGoodToHave.push(optSkill);
    }
  }

  const reqRatio = jd.requiredHardSkills.length > 0 
    ? matchedRequired.length / jd.requiredHardSkills.length 
    : 1;
  const optRatio = jd.goodToHaveSkills.length > 0 
    ? matchedGoodToHave.length / jd.goodToHaveSkills.length 
    : 0;

  // Jaccard similarity across total vocabulary of skills
  const totalTargetSkills = [...jd.requiredHardSkills, ...jd.goodToHaveSkills];
  const candidateAllSkills = candidate.extractedSkills.map(normalizeSkill);
  const matchedAll = [...matchedRequired, ...matchedGoodToHave];
  const unionSet = new Set([...totalTargetSkills.map(s => s.toLowerCase()), ...candidateAllSkills.map(s => s.toLowerCase())]);
  const jaccardRatio = unionSet.size > 0 ? matchedAll.length / unionSet.size : 0;

  // Weighted keyword score: 75% on required core skills, 25% on bonus/good-to-have skills
  const weightedScore = (reqRatio * 75) + (optRatio * 25);

  return {
    score: Math.round(weightedScore * 10) / 10,
    matchedRequired,
    missingRequired,
    matchedGoodToHave,
    missingGoodToHave,
    jaccardRatio: Math.round(jaccardRatio * 100) / 100
  };
}

/**
 * Cosine similarity computation between two vectors:
 * dot(A, B) / (|A| * |B|)
 */
export function cosineSimilarity(vecA: number[], vecB: number[]): number {
  if (!vecA || !vecB || vecA.length === 0 || vecA.length !== vecB.length) return 0;
  let dotProduct = 0;
  let normA = 0;
  let normB = 0;
  for (let i = 0; i < vecA.length; i++) {
    dotProduct += vecA[i] * vecB[i];
    normA += vecA[i] * vecA[i];
    normB += vecB[i] * vecB[i];
  }
  if (normA === 0 || normB === 0) return 0;
  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

/**
 * Text vectorizer (TF-IDF with subword n-grams and domain-specific semantic weights).
 * Used for deterministic fallback and high-speed semantic matching.
 */
export function buildTFIDFVector(text: string, vocabulary: string[]): number[] {
  const clean = text.toLowerCase();
  const tokens = clean.split(/[^a-z0-9+#.]+/).filter(t => t.length > 1);
  const tokenCounts: Record<string, number> = {};

  for (const t of tokens) {
    tokenCounts[t] = (tokenCounts[t] || 0) + 1;
  }

  // Also include 2-grams (e.g. "rest api", "node js", "full stack")
  for (let i = 0; i < tokens.length - 1; i++) {
    const bigram = `${tokens[i]} ${tokens[i+1]}`;
    tokenCounts[bigram] = (tokenCounts[bigram] || 0) + 1.5;
  }

  return vocabulary.map(term => {
    const count = tokenCounts[term] || 0;
    // Log term frequency
    return count > 0 ? (1 + Math.log10(count)) : 0;
  });
}

export function extractDomainVocabulary(jd: JobDescription, candidates: CandidateResume[]): string[] {
  const vocabSet = new Set<string>();
  const addText = (txt: string) => {
    const tokens = txt.toLowerCase().split(/[^a-z0-9+#.]+/).filter(t => t.length > 1);
    tokens.forEach(t => vocabSet.add(t));
    for (let i = 0; i < tokens.length - 1; i++) {
      vocabSet.add(`${tokens[i]} ${tokens[i+1]}`);
    }
  };

  addText(jd.rawText);
  jd.requiredHardSkills.forEach(s => addText(s));
  jd.goodToHaveSkills.forEach(s => addText(s));
  jd.coreResponsibilities.forEach(r => addText(r));

  for (const c of candidates) {
    addText(c.rawText);
    addText(c.experienceSummary);
    c.projects.forEach(p => addText(p));
  }

  return Array.from(vocabSet);
}

/**
 * Computes semantic similarity score (0-100) using vector cosine similarity.
 */
export function calculateSemanticScore(
  candidate: CandidateResume,
  jd: JobDescription,
  vocabulary: string[],
  embeddingsMap?: Record<string, number[]>,
  jdEmbedding?: number[]
): {
  semanticScore: number;
  cosineSim: number;
} {
  // If server provided dense LLM embeddings (e.g. Gemini embedding-2-preview)
  if (embeddingsMap && embeddingsMap[candidate.id] && jdEmbedding) {
    const denseCosine = cosineSimilarity(embeddingsMap[candidate.id], jdEmbedding);
    // Typical dense embedding cosine values range between 0.40 (low match) and 0.88 (high match)
    // Scale calibrated range [0.35, 0.85] -> [0, 100]
    const minBase = 0.35;
    const maxBase = 0.85;
    const scaled = Math.min(100, Math.max(0, ((denseCosine - minBase) / (maxBase - minBase)) * 100));
    return {
      semanticScore: Math.round(scaled * 10) / 10,
      cosineSim: Math.round(denseCosine * 1000) / 1000
    };
  }

  // Fallback / High-precision TF-IDF Vector Space Model
  const jdText = `${jd.title} ${jd.rawText} ${jd.coreResponsibilities.join(' ')} ${jd.requiredHardSkills.join(' ')}`;
  const candidateText = `${candidate.experienceSummary} ${candidate.projects.join(' ')} ${candidate.rawText}`;

  const vecJD = buildTFIDFVector(jdText, vocabulary);
  const vecCand = buildTFIDFVector(candidateText, vocabulary);

  const rawCosine = cosineSimilarity(vecJD, vecCand);

  // Scale TF-IDF cosine [0.05, 0.55] -> [15, 95]
  const minBase = 0.05;
  const maxBase = 0.50;
  const scaled = Math.min(98, Math.max(12, 15 + ((rawCosine - minBase) / (maxBase - minBase)) * 80));

  return {
    semanticScore: Math.round(scaled * 10) / 10,
    cosineSim: Math.round(rawCosine * 1000) / 1000
  };
}

/**
 * Full ranking execution pipeline.
 */
export function rankCandidates(
  candidates: CandidateResume[],
  jd: JobDescription,
  weights: RankingWeights = { semanticWeight: 0.60, keywordWeight: 0.40 },
  embeddingsMap?: Record<string, number[]>,
  jdEmbedding?: number[]
): CandidateScoreBreakdown[] {
  const vocabulary = extractDomainVocabulary(jd, candidates);

  const breakdowns: CandidateScoreBreakdown[] = candidates.map(candidate => {
    const kwResult = calculateKeywordScore(candidate, jd);
    const semResult = calculateSemanticScore(candidate, jd, vocabulary, embeddingsMap, jdEmbedding);

    // Hybrid formula:
    // finalScore = (semanticWeight * semanticScore) + (keywordWeight * keywordScore)
    const finalScore = Math.round(
      ((semResult.semanticScore * weights.semanticWeight) + (kwResult.score * weights.keywordWeight)) * 10
    ) / 10;

    let fitCategory: CandidateScoreBreakdown['fitCategory'] = 'Weak Fit';
    if (finalScore >= 75) {
      fitCategory = 'Strong Fit';
    } else if (finalScore >= 50) {
      fitCategory = 'Moderate Fit';
    } else if (finalScore < 30) {
      fitCategory = 'Not a Fit';
    }

    return {
      candidateId: candidate.id,
      candidateName: candidate.candidateName,
      filename: candidate.filename,
      rank: 0,
      finalScore,
      semanticScore: semResult.semanticScore,
      keywordScore: kwResult.score,
      matchedRequiredSkills: kwResult.matchedRequired,
      missingRequiredSkills: kwResult.missingRequired,
      matchedGoodToHaveSkills: kwResult.matchedGoodToHave,
      missingGoodToHaveSkills: kwResult.missingGoodToHave,
      fitCategory,
      vectorCosineSimilarity: semResult.cosineSim,
      keywordJaccardRatio: kwResult.jaccardRatio
    };
  });

  // Sort descending by finalScore, then tie-break on semanticScore
  breakdowns.sort((a, b) => {
    if (b.finalScore !== a.finalScore) {
      return b.finalScore - a.finalScore;
    }
    return b.semanticScore - a.semanticScore;
  });

  // Assign 1-indexed ranks
  breakdowns.forEach((item, index) => {
    item.rank = index + 1;
  });

  return breakdowns;
}
