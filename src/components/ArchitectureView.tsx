import React, { useState } from 'react';
import { Cpu, Copy, Check, Terminal, FileCode, Layers, ShieldCheck, GitBranch } from 'lucide-react';

export const ArchitectureView: React.FC = () => {
  const [activeCodeTab, setActiveCodeTab] = useState<'req' | 'nlp' | 'fastapi' | 'streamlit'>('req');
  const [copied, setCopied] = useState(false);

  const codeFiles = {
    req: {
      name: 'requirements.txt',
      language: 'text',
      content: `# Core Backend & Web Framework
fastapi==0.115.0
uvicorn[standard]==0.31.0
pydantic==2.9.2
python-multipart==0.0.12

# PDF Ingestion & Document Processing
pdfplumber==0.11.4
pypdf==5.0.1

# Semantic Search & Embeddings
sentence-transformers==3.1.1
chromadb==0.5.15
numpy>=1.24.0
scikit-learn>=1.3.0

# Keyword & Lexical Search
rank-bm25==0.2.2
spacy==3.8.0

# Frontend UI & Recruiter Chat
streamlit==1.39.0
streamlit-chat==0.1.1
pandas>=2.2.0
python-dotenv==1.0.1`
    },
    nlp: {
      name: 'nlp_pipeline.py (Core Scoring Logic)',
      language: 'python',
      content: `"""
Smart Shortlisting Engine - Core NLP Pipeline
Hybrid Semantic Search (SentenceTransformers) + Keyword Search (BM25 & Alias Matching)
"""
import re
from typing import List, Dict, Any, Tuple
import numpy as np
from sentence_transformers import SentenceTransformer
from sklearn.metrics.pairwise import cosine_similarity

class SmartShortlistingEngine:
    def __init__(self, model_name: str = "sentence-transformers/all-MiniLM-L6-v2"):
        self.embedder = SentenceTransformer(model_name)

    def evaluate_semantic_fit(self, candidate_text: str, jd_text: str) -> Tuple[float, float]:
        embeddings = self.embedder.encode([candidate_text, jd_text], convert_to_numpy=True)
        vec_cand = embeddings[0].reshape(1, -1)
        vec_jd = embeddings[1].reshape(1, -1)
        raw_sim = float(cosine_similarity(vec_cand, vec_jd)[0][0])
        # Calibrate similarity to 0-100 scale
        scaled = max(0.0, min(100.0, ((raw_sim - 0.25) / (0.85 - 0.25)) * 100.0))
        return round(scaled, 1), round(raw_sim, 3)

    def evaluate_keyword_fit(self, candidate_text: str, candidate_skills: List[str], required_skills: List[str]) -> float:
        matched = [s for s in required_skills if s.lower() in candidate_text.lower() or s.lower() in [c.lower() for c in candidate_skills]]
        return round((len(matched) / len(required_skills)) * 100.0, 1)

    def compute_final_score(self, semantic_score: float, keyword_score: float, w_sem: float = 0.6, w_kw: float = 0.4) -> float:
        # Weighted hybrid equation:
        return round((semantic_score * w_sem) + (keyword_score * w_kw), 1)`
    },
    fastapi: {
      name: 'main.py (FastAPI Server)',
      language: 'python',
      content: `from fastapi import FastAPI, UploadFile, File, Form
from typing import List
from nlp_pipeline import SmartShortlistingEngine

app = FastAPI(title="Smart Shortlisting Engine API")
engine = SmartShortlistingEngine()

@app.post("/api/shortlist")
async def shortlist_resumes(
    jd_file: UploadFile = File(...),
    resumes: List[UploadFile] = File(...),
    semantic_weight: float = Form(0.60),
    keyword_weight: float = Form(0.40)
):
    # 1. Parse JD with pdfplumber
    jd_bytes = await jd_file.read()
    jd_text, _ = engine.parse_pdf_bytes(jd_bytes)

    # 2. Parse batch of 15-18 resumes
    candidates = []
    for r in resumes:
        r_bytes = await r.read()
        text, format_audit = engine.parse_pdf_bytes(r_bytes)
        candidates.append({"filename": r.filename, "text": text, "audit": format_audit})

    # 3. Compute hybrid scores
    rankings = engine.rank_candidates(candidates, jd_text, semantic_weight, keyword_weight)
    return {"total": len(rankings), "rankings": rankings}`
    },
    streamlit: {
      name: 'app_streamlit.py (Recruiter UI)',
      language: 'python',
      content: `import streamlit as st
import pandas as pd
from nlp_pipeline import SmartShortlistingEngine

st.title("🎯 Smart Shortlisting Engine")

# File uploaders
jd_file = st.file_uploader("Upload Job Description PDF", type=["pdf"])
resume_files = st.file_uploader("Upload 15-18 Resume PDFs", type=["pdf"], accept_multiple_files=True)

# Weight sliders
sem_w = st.slider("Semantic Weight", 0.0, 1.0, 0.6)
kw_w = st.slider("Keyword Weight", 0.0, 1.0, 0.4)

if st.button("Run Shortlisting"):
    # Run hybrid scoring and display ranking table
    ...

# Recruiter Chat Layer
query = st.chat_input("Why is Candidate X ranked above Candidate Y?")
if query:
    st.write("Recruiter response based on scoring matrix...")`
    }
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(codeFiles[activeCodeTab].content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Visual Pipeline Diagram */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
        <div className="flex items-center gap-2 mb-4">
          <Layers className="w-5 h-5 text-emerald-400" />
          <h3 className="text-base font-bold text-white">
            End-to-End System Pipeline Architecture
          </h3>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 text-xs">
          {/* Step 1 */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                Step 01
              </span>
              <h4 className="text-sm font-bold text-white mt-2">Data Ingestion</h4>
              <p className="text-slate-400 mt-1">
                Multi-page PDF parsing via pdfplumber / pdf-parse. Normalizes whitespace, catches OCR typos, and audits header structures.
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-800 text-[11px] text-emerald-400/90 font-mono">
              1 JD + 15–18 Resumes
            </div>
          </div>

          {/* Step 2 */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-teal-500/15 text-teal-400 border border-teal-500/30">
                Step 02
              </span>
              <h4 className="text-sm font-bold text-white mt-2">Semantic Search</h4>
              <p className="text-slate-400 mt-1">
                SentenceTransformers / Gemini embeddings generate high-dimensional vectors. Computes real Cosine Similarity against requirements.
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-800 text-[11px] text-teal-400/90 font-mono">
              Cosine Similarity (60%)
            </div>
          </div>

          {/* Step 3 */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-indigo-500/15 text-indigo-400 border border-indigo-500/30">
                Step 03
              </span>
              <h4 className="text-sm font-bold text-white mt-2">Keyword Overlap</h4>
              <p className="text-slate-400 mt-1">
                Explicit skills matcher with synonym resolver (Express, MongoDB, Docker, Git). Weighted Jaccard token overlap index.
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-800 text-[11px] text-indigo-400/90 font-mono">
              Explicit Skills (40%)
            </div>
          </div>

          {/* Step 4 */}
          <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-4 flex flex-col justify-between">
            <div>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/15 text-amber-400 border border-amber-500/30">
                Step 04
              </span>
              <h4 className="text-sm font-bold text-white mt-2">Explainability &amp; Chat</h4>
              <p className="text-slate-400 mt-1">
                Top-3 candidate justification generator, JD bias flagger, and recruiter conversational question-answering co-pilot.
              </p>
            </div>
            <div className="mt-3 pt-2 border-t border-slate-800 text-[11px] text-amber-400/90 font-mono">
              Explainable Shortlist
            </div>
          </div>
        </div>
      </div>

      {/* Code Viewer */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl overflow-hidden shadow-xl">
        <div className="bg-slate-950 border-b border-slate-800 px-5 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2 overflow-x-auto scrollbar-none">
            {(['req', 'nlp', 'fastapi', 'streamlit'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveCodeTab(tab)}
                className={`px-3 py-1.5 rounded-lg text-xs font-mono font-medium transition ${
                  activeCodeTab === tab
                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
                }`}
              >
                {codeFiles[tab].name}
              </button>
            ))}
          </div>

          <button
            onClick={handleCopyCode}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono transition border border-slate-700"
          >
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copied ? 'Copied to clipboard!' : 'Copy Code'}</span>
          </button>
        </div>

        <div className="p-5 bg-slate-950 font-mono text-xs text-slate-300 overflow-x-auto leading-relaxed max-h-[500px]">
          <pre>{codeFiles[activeCodeTab].content}</pre>
        </div>
      </div>
    </div>
  );
};
