"""
FastAPI Backend Server - Smart Shortlisting Engine
Exposes endpoints for PDF uploading, semantic/keyword ranking, bias flagging, and recruiter chat.
"""

from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from typing import List, Optional
import json

from nlp_pipeline import SmartShortlistingEngine, CandidateProfile, JobDescriptionParsed

app = FastAPI(
    title="Smart Shortlisting Engine API",
    description="Hybrid semantic & keyword resume shortlisting pipeline with explainability and bias flagging",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

engine = SmartShortlistingEngine()

@app.get("/health")
def health_check():
    return {"status": "healthy", "service": "Smart Shortlisting Engine"}

@app.post("/api/shortlist")
async def process_shortlist(
    jd_file: Optional[UploadFile] = File(None),
    jd_raw_text: Optional[str] = Form(None),
    resumes: List[UploadFile] = File(...),
    semantic_weight: float = Form(0.60),
    keyword_weight: float = Form(0.40)
):
    """
    Accepts 1 Job Description and a batch of 15-18 Resume PDFs,
    executing hybrid ranking and returning ranked shortlist.
    """
    # 1. Parse JD
    jd_text = jd_raw_text or ""
    if jd_file:
        content = await jd_file.read()
        extracted, _ = engine.parse_pdf_bytes(content, jd_file.filename)
        jd_text = extracted

    if not jd_text.strip():
        raise HTTPException(status_code=400, detail="Job Description text or PDF is required")

    # Mock/default parsed JD structure for demonstration
    jd_parsed = JobDescriptionParsed(
        title="Junior Full Stack Developer Intern",
        company="TechNova Solutions",
        required_skills=["React", "Node.js", "Express", "REST APIs", "MongoDB", "Git"],
        good_to_have_skills=["TypeScript", "Docker", "PostgreSQL", "Tailwind CSS"],
        responsibilities=["Build web UIs in React", "Develop Express REST APIs", "Database schemas"],
        raw_text=jd_text
    )

    # 2. Parse Resumes
    candidate_profiles: List[CandidateProfile] = []
    for idx, res_file in enumerate(resumes):
        file_bytes = await res_file.read()
        cand_text, format_audit = engine.parse_pdf_bytes(file_bytes, res_file.filename)
        cand_name = res_file.filename.replace(".pdf", "").replace("_", " ").title()

        candidate_profiles.append(CandidateProfile(
            id=f"cand-{idx+1}",
            name=cand_name,
            raw_text=cand_text,
            extracted_skills=[],
            experience_summary=cand_text[:400],
            projects=[],
            formatting_score=format_audit['formatting_score'],
            detected_typos=format_audit['detected_typos']
        ))

    # 3. Compute hybrid rankings
    rankings = engine.rank_candidates(
        candidate_profiles,
        jd_parsed,
        semantic_weight=semantic_weight,
        keyword_weight=keyword_weight
    )

    # 4. Check for JD bias
    biases = engine.flag_jd_biases(jd_text)

    return {
        "job_description": jd_parsed.model_dump(),
        "total_resumes": len(rankings),
        "rankings": [r.model_dump() for r in rankings],
        "bias_flags": biases
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
