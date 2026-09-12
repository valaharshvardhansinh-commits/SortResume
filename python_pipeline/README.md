# Smart Shortlisting Engine - Python Backend & Streamlit App
InternLoom AI Hackathon - Manipal Institute of Technology

This folder contains the complete, modular Python implementation of the Smart Shortlisting Engine combining semantic embeddings (SentenceTransformers / ChromaDB) and keyword search (BM25 / Tokenized alias matching).

## Quick Start (Python)

### 1. Install Dependencies
```bash
pip install -r requirements.txt
```

### 2. Launch Streamlit UI
```bash
streamlit run app_streamlit.py
```

### 3. Or Launch FastAPI REST API
```bash
uvicorn main:app --reload --port 8000
```
Visit `http://localhost:8000/docs` to test interactive Swagger API docs.
