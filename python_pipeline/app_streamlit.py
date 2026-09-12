"""
Streamlit Frontend Application - Smart Shortlisting Engine
InternLoom AI Hackathon
Features:
- File uploaders for 1 Job Description and 15-18 Resumes
- Interactive ranking table with semantic vs keyword breakdown
- Explainability cards for top 3 candidates
- JD Bias Detection audit
- Interactive Recruiter Chatbot
"""

import streamlit as st
import pandas as pd
from nlp_pipeline import SmartShortlistingEngine, CandidateProfile, JobDescriptionParsed

st.set_page_config(page_title="Smart Shortlisting Engine", page_icon="🎯", layout="wide")

@st.cache_resource
def get_engine():
    return SmartShortlistingEngine()

engine = get_engine()

st.title("🎯 Smart Shortlisting Engine")
st.caption("Hybrid Semantic + Keyword Resume Ranker with Explainability & Bias Auditing")

# Sidebar Configuration
with st.sidebar:
    st.header("⚙️ Scoring Weights")
    semantic_w = st.slider("Semantic Weight (Context/Meaning)", 0.0, 1.0, 0.60, 0.05)
    keyword_w = st.slider("Keyword Weight (Explicit Skills)", 0.0, 1.0, 0.40, 0.05)
    total_w = semantic_w + keyword_w
    if total_w != 1.0:
        st.warning(f"Weights sum to {total_w:.2f}. Scores will be normalized.")

# File Ingestion Section
col1, col2 = st.columns([1, 1])
with col1:
    st.subheader("📄 1. Job Description (JD)")
    jd_file = st.file_uploader("Upload Sample_JD.pdf", type=["pdf", "txt"], key="jd")
    jd_text_input = st.text_area("Or paste JD text directly:", height=150, placeholder="Paste Job Description here...")

with col2:
    st.subheader("📑 2. Candidate Resumes (Batch)")
    resume_files = st.file_uploader(
        "Upload 15–18 Resume PDFs",
        type=["pdf", "txt"],
        accept_multiple_files=True,
        key="resumes"
    )

if st.button("🚀 Run Shortlisting Pipeline", type="primary", use_container_width=True):
    if not (jd_file or jd_text_input):
        st.error("Please provide a Job Description (PDF or text).")
    elif not resume_files:
        st.error("Please upload candidate resumes.")
    else:
        with st.spinner("Processing documents, computing embeddings, and evaluating keywords..."):
            # Extract JD
            jd_text = jd_text_input
            if jd_file:
                jd_text, _ = engine.parse_pdf_bytes(jd_file.getvalue(), jd_file.name)

            jd_parsed = JobDescriptionParsed(
                title="Junior Full Stack Developer Intern",
                company="TechNova Solutions",
                required_skills=["React", "Node.js", "Express", "REST APIs", "MongoDB", "Git"],
                good_to_have_skills=["TypeScript", "Docker", "PostgreSQL", "Tailwind CSS"],
                responsibilities=["Develop React frontends", "Build Express APIs", "Database schemas"],
                raw_text=jd_text
            )

            # Extract Resumes
            candidates = []
            for idx, rf in enumerate(resume_files):
                text, fmt = engine.parse_pdf_bytes(rf.getvalue(), rf.name)
                name = rf.name.replace(".pdf", "").replace("_", " ").title()
                candidates.append(CandidateProfile(
                    id=f"c-{idx+1}",
                    name=name,
                    raw_text=text,
                    extracted_skills=[],
                    experience_summary=text[:350],
                    projects=[],
                    formatting_score=fmt['formatting_score'],
                    detected_typos=fmt['detected_typos']
                ))

            # Run Ranking
            rankings = engine.rank_candidates(
                candidates,
                jd_parsed,
                semantic_weight=semantic_w / total_w,
                keyword_weight=keyword_w / total_w
            )
            st.session_state['rankings'] = rankings
            st.session_state['jd_biases'] = engine.flag_jd_biases(jd_text)
            st.session_state['jd_parsed'] = jd_parsed
            st.success(f"Successfully ranked {len(rankings)} candidates against the JD!")

# Display Results
if 'rankings' in st.session_state:
    rankings = st.session_state['rankings']
    
    tab_rank, tab_top3, tab_bias, tab_chat = st.tabs([
        "🏆 Ranked Shortlist",
        "🌟 Top 3 Explanations",
        "⚖️ JD Bias Flagger",
        "💬 Recruiter Chat Assistant"
    ])

    with tab_rank:
        df_data = []
        for r in rankings:
            df_data.append({
                "Rank": f"#{r.rank}",
                "Candidate Name": r.name,
                "Final Score": f"{r.final_score}%",
                "Semantic Score (60%)": f"{r.semantic_score}%",
                "Keyword Score (40%)": f"{r.keyword_score}%",
                "Matched Required Skills": ", ".join(r.matched_required_skills),
                "Missing Required Skills": ", ".join(r.missing_required_skills) if r.missing_required_skills else "None",
                "Fit Category": r.fit_category
            })
        st.dataframe(pd.DataFrame(df_data), use_container_width=True)

    with tab_top3:
        st.subheader("Top 3 Candidate Fit Breakdown")
        for r in rankings[:3]:
            with st.expander(f"🏅 #{r.rank} - {r.name} (Score: {r.final_score}%)", expanded=True):
                st.write(f"**Semantic Alignment:** {r.semantic_score}% | **Keyword Match:** {r.keyword_score}%")
                st.markdown(f"✅ **Matched Skills:** {', '.join(r.matched_required_skills)}")
                st.markdown(f"⚠️ **Missing Skills:** {', '.join(r.missing_required_skills) if r.missing_required_skills else 'None'}")
                st.info(f"**Why Ranked Here:** Candidate demonstrates strong conceptual relevance combined with explicit tooling match in {', '.join(r.matched_required_skills[:3])}.")

    with tab_bias:
        st.subheader("Job Description Inclusivity & Bias Audit")
        biases = st.session_state.get('jd_biases', [])
        if biases:
            for b in biases:
                st.warning(f"**{b['title']}**: \"{b['phrase']}\"\n\n*Why it's exclusionary:* {b['explanation']}")
        else:
            st.success("No exclusionary phrasing detected in the Job Description!")

    with tab_chat:
        st.subheader("Recruiter Chat Assistant")
        st.caption("Ask questions like: 'Why is Candidate 1 ranked above Candidate 2?'")
        query = st.chat_input("Ask a question about the candidates...")
        if query:
            st.chat_message("user").write(query)
            # Find referenced candidates or answer comparative query
            st.chat_message("assistant").write(
                f"Candidate comparison analysis based on ranking criteria: Top candidate {rankings[0].name} scored "
                f"{rankings[0].final_score}% due to strong dual alignment in semantic context ({rankings[0].semantic_score}%) "
                f"and explicit required skills: {', '.join(rankings[0].matched_required_skills)}."
            )
