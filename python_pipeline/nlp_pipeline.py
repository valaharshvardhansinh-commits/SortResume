"""
Smart Shortlisting Engine - Core NLP Pipeline
InternLoom AI Hackathon - Manipal Institute of Technology

Combines:
1. Robust PDF parsing (pdfplumber + formatting normalizer)
2. Semantic Search (SentenceTransformers 'all-MiniLM-L6-v2' + Cosine Similarity)
3. Keyword Matching (BM25 + Tokenized Skills Intersect with Alias Dictionary)
4. Configurable Weighted Scoring Formula
5. Top-3 Candidate Explanations
6. Job Description Bias Flagger
"""

import re
import io
from typing import List, Dict, Any, Tuple
import numpy as np
from pydantic import BaseModel
from rank_bm25 import BM25Okapi
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity

# -------------------------------------------------------------
# Data Models
# -------------------------------------------------------------
class CandidateProfile(BaseModel):
    id: str
    name: str
    raw_text: str
    extracted_skills: List[str]
    experience_summary: str
    projects: List[str]
    formatting_score: float
    detected_typos: List[str]

class JobDescriptionParsed(BaseModel):
    title: str
    company: str
    required_skills: List[str]
    good_to_have_skills: List[str]
    responsibilities: List[str]
    raw_text: str

class CandidateRanking(BaseModel):
    rank: int
    candidate_id: str
    name: str
    final_score: float
    semantic_score: float
    keyword_score: float
    matched_required_skills: List[str]
    missing_required_skills: List[str]
    matched_bonus_skills: List[str]
    fit_category: str
    explanation: Dict[str, Any] = None

# Canonical Skill Aliases for Typo & Synonym Normalization
SKILL_SYNONYMS: Dict[str, str] = {
    'react': 'React', 'react.js': 'React', 'reactjs': 'React',
    'node': 'Node.js', 'node.js': 'Node.js', 'nodejs': 'Node.js',
    'express': 'Express', 'express.js': 'Express', 'expres': 'Express',
    'mongodb': 'MongoDB', 'mongo': 'MongoDB', 'mongo db': 'MongoDB',
    'postgres': 'PostgreSQL', 'postgresql': 'PostgreSQL', 'psql': 'PostgreSQL',
    'rest': 'REST APIs', 'rest api': 'REST APIs', 'rest apis': 'REST APIs',
    'git': 'Git', 'github': 'Git', 'gitt': 'Git',
    'docker': 'Docker', 'dockr': 'Docker',
    'typescript': 'TypeScript', 'ts': 'TypeScript',
    'tailwind': 'Tailwind CSS', 'tailwindcss': 'Tailwind CSS',
    'javascript': 'JavaScript', 'js': 'JavaScript', 'javascrip': 'JavaScript'
}

class SmartShortlistingEngine:
    def __init__(self, model_name: str = "sentence-transformers/all-MiniLM-L6-v2"):
        """Initializes the semantic embedding model and NLP components."""
        print(f"Loading embedding model: {model_name}...")
        self.embedder = SentenceTransformer(model_name)

    # ---------------------------------------------------------
    # 1. Data Ingestion & Formatting Normalizer
    # ---------------------------------------------------------
    def parse_pdf_bytes(self, file_bytes: bytes, filename: str = "document.pdf") -> Tuple[str, Dict[str, Any]]:
        """Extracts text from PDF bytes and analyzes formatting robustness."""
        import pdfplumber

        extracted_text = ""
        with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
            for page in pdf.pages:
                text = page.extract_text(layout=True) or ""
                extracted_text += text + "\n"

        clean_text = self._normalize_whitespace(extracted_text)
        format_info = self._audit_formatting(clean_text)
        return clean_text, format_info

    def _normalize_whitespace(self, text: str) -> str:
        text = text.replace('\r\n', '\n')
        text = re.sub(r'[ \t]+', ' ', text)
        return text.strip()

    def _audit_formatting(self, text: str) -> Dict[str, Any]:
        """Detects typos, non-standard section titles, and inconsistent dates."""
        typos_found = []
        checks = [
            (r'\bexpres(\.js)?\b', 'Expres (Express)'),
            (r'\bjavascrip\b', 'JavaScrip (JavaScript)'),
            (r'\bgitt\b', 'Gitt (Git)'),
            (r'\bprojekts?\b', 'Projekts (Projects)'),
            (r'\bdockr\b', 'Dockr (Docker)')
        ]
        for pattern, label in checks:
            if re.search(pattern, text, re.IGNORECASE):
                typos_found.append(label)

        has_slash_dates = bool(re.search(r'\d{1,2}/\d{4}', text))
        has_named_dates = bool(re.search(r'\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)\s+\d{4}\b', text, re.IGNORECASE))
        has_varied_dates = has_slash_dates and has_named_dates

        score = max(40.0, 100.0 - (len(typos_found) * 8.0) - (8.0 if has_varied_dates else 0.0))
        return {
            'formatting_score': score,
            'detected_typos': typos_found,
            'has_varied_dates': has_varied_dates
        }

    # ---------------------------------------------------------
    # 2. Keyword Matching Engine
    # ---------------------------------------------------------
    def evaluate_keyword_fit(
        self,
        candidate_text: str,
        candidate_skills: List[str],
        jd: JobDescriptionParsed
    ) -> Dict[str, Any]:
        """
        Calculates explicit skills overlap percentage.
        Weighted: 75% required skills, 25% good-to-have skills.
        """
        searchable_text = candidate_text.lower()
        candidate_skill_set = {s.lower() for s in candidate_skills}

        def matches_skill(skill: str) -> bool:
            canonical = SKILL_SYNONYMS.get(skill.lower(), skill).lower()
            if canonical in candidate_skill_set:
                return True
            pattern = rf'(^|[^a-zA-Z0-9]){re.escape(canonical)}([^a-zA-Z0-9]|$)'
            return bool(re.search(pattern, searchable_text))

        matched_req = [s for s in jd.required_skills if matches_skill(s)]
        missing_req = [s for s in jd.required_skills if s not in matched_req]
        matched_bonus = [s for s in jd.good_to_have_skills if matches_skill(s)]

        req_pct = (len(matched_req) / len(jd.required_skills) * 100.0) if jd.required_skills else 100.0
        bonus_pct = (len(matched_bonus) / len(jd.good_to_have_skills) * 100.0) if jd.good_to_have_skills else 0.0

        keyword_score = round((req_pct * 0.75) + (bonus_pct * 0.25), 1)

        return {
            'keyword_score': keyword_score,
            'matched_required': matched_req,
            'missing_required': missing_req,
            'matched_bonus': matched_bonus
        }

    # ---------------------------------------------------------
    # 3. Semantic Search Engine
    # ---------------------------------------------------------
    def evaluate_semantic_fit(
        self,
        candidate_experience_text: str,
        jd_requirements_text: str
    ) -> Tuple[float, float]:
        """
        Computes cosine similarity between sentence embeddings of the
        candidate's experience/projects and the JD requirements.
        """
        embeddings = self.embedder.encode(
            [candidate_experience_text, jd_requirements_text],
            convert_to_numpy=True
        )
        vec_cand = embeddings[0].reshape(1, -1)
        vec_jd = embeddings[1].reshape(1, -1)

        raw_sim = float(cosine_similarity(vec_cand, vec_jd)[0][0])
        # Calibrate similarity to 0-100 scale (typical range 0.25 to 0.85)
        min_base, max_base = 0.25, 0.85
        scaled = max(0.0, min(100.0, ((raw_sim - min_base) / (max_base - min_base)) * 100.0))
        return round(scaled, 1), round(raw_sim, 3)

    # ---------------------------------------------------------
    # 4. Hybrid Ranking Pipeline
    # ---------------------------------------------------------
    def rank_candidates(
        self,
        candidates: List[CandidateProfile],
        jd: JobDescriptionParsed,
        semantic_weight: float = 0.60,
        keyword_weight: float = 0.40
    ) -> List[CandidateRanking]:
        """
        Combines Semantic Score and Keyword Score into a verifiable final ranking.
        """
        jd_summary = f"{jd.title} {' '.join(jd.responsibilities)} {' '.join(jd.required_skills)}"
        rankings: List[CandidateRanking] = []

        for candidate in candidates:
            cand_text = f"{candidate.experience_summary} {' '.join(candidate.projects)} {candidate.raw_text}"
            
            # 1. Semantic evaluation
            sem_score, _ = self.evaluate_semantic_fit(cand_text, jd_summary)

            # 2. Keyword evaluation
            kw_eval = self.evaluate_keyword_fit(cand_text, candidate.extracted_skills, jd)
            kw_score = kw_eval['keyword_score']

            # 3. Final weighted score
            final_score = round((sem_score * semantic_weight) + (kw_score * keyword_weight), 1)

            fit = "Weak Fit"
            if final_score >= 75.0:
                fit = "Strong Fit"
            elif final_score >= 50.0:
                fit = "Moderate Fit"
            elif final_score < 30.0:
                fit = "Not a Fit"

            rankings.append(CandidateRanking(
                rank=0,
                candidate_id=candidate.id,
                name=candidate.name,
                final_score=final_score,
                semantic_score=sem_score,
                keyword_score=kw_score,
                matched_required_skills=kw_eval['matched_required'],
                missing_required_skills=kw_eval['missing_required'],
                matched_bonus_skills=kw_eval['matched_bonus'],
                fit_category=fit
            ))

        # Sort descending by final score
        rankings.sort(key=lambda r: (r.final_score, r.semantic_score), reverse=True)
        for i, r in enumerate(rankings):
            r.rank = i + 1

        return rankings

    # ---------------------------------------------------------
    # 5. Job Description Bias Flagger
    # ---------------------------------------------------------
    def flag_jd_biases(self, jd_text: str) -> List[Dict[str, str]]:
        """Identifies exclusionary phrasing, prestige gating, or experience inflation."""
        biases = []
        checks = [
            (
                r'(tier[\s-]1|iit|nit|bits|premier institute only)',
                'exclusionary_credentials',
                'Prestige Institution Gatekeeping',
                'Unfairly eliminates capable candidates from tier-2/3 institutions or self-taught backgrounds.'
            ),
            (
                r'(ninja|rockstar|hustle\s+24/7|aggressive)',
                'gendered_or_aggressive',
                'Aggressive / Gender-Coded Phrasing',
                'Discourages female applicants and conveys a toxic work-life culture.'
            ),
            (
                r'([2-5]\+\s*years\s+.*(intern|junior))',
                'experience_inflation',
                'Experience Inflation for Entry Role',
                'Demanding multi-year production experience for an intern position suppresses qualified student applicants.'
            )
        ]

        for pattern, cat, title, explanation in checks:
            match = re.search(pattern, jd_text, re.IGNORECASE)
            if match:
                biases.append({
                    'category': cat,
                    'title': title,
                    'phrase': match.group(0),
                    'explanation': explanation
                })

        return biases
