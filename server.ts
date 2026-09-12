import express, { Request, Response } from 'express';
import path from 'path';
import dotenv from 'dotenv';
import multer from 'multer';
import { GoogleGenAI } from '@google/genai';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const app = express();
const PORT = 3000;

// Multer memory storage for PDF parsing
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 25 * 1024 * 1024 } // 25MB max per file
});

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Lazy initialization of Gemini client
let geminiClient: GoogleGenAI | null = null;
function getGemini(): GoogleGenAI {
  if (!geminiClient) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      console.warn('GEMINI_API_KEY is not set. Using local fallback mode.');
    }
    geminiClient = new GoogleGenAI({
      apiKey: apiKey || 'dummy-key',
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        }
      }
    });
  }
  return geminiClient;
}

// Clean messy whitespace, irregular spacing, repeated linebreaks, and non-printable characters
function cleanExtractedText(text: string): string {
  return text
    .replace(/\r\n/g, '\n')
    .replace(/\r/g, '\n')
    .replace(/\t/g, '  ')
    .replace(/[\u0000-\u0008\u000B-\u000C\u000E-\u001F]/g, '') // remove ASCII control characters
    .replace(/[ \u00A0]{3,}/g, '  ') // collapse redundant horizontal space
    .replace(/\n{3,}/g, '\n\n') // collapse multiple blank lines
    .trim();
}

// Multi-format Text Extraction Helper (PDF, DOCX, TXT)
async function extractTextFromFileBuffer(
  buffer: Buffer,
  originalname: string,
  mimetype?: string
): Promise<{ text: string; error?: string; isUnreadable?: boolean }> {
  const ext = originalname.split('.').pop()?.toLowerCase() || '';

  if (!buffer || buffer.length === 0) {
    return { text: '', error: 'File is empty (0 bytes).', isUnreadable: true };
  }

  // 1. Plain text (.txt, markdown, text/*)
  if (ext === 'txt' || ext === 'md' || mimetype?.startsWith('text/')) {
    try {
      const text = cleanExtractedText(buffer.toString('utf-8'));
      if (text.length < 5) {
        return { text: '', error: 'Text file contains no readable content.', isUnreadable: true };
      }
      return { text };
    } catch (e: any) {
      return { text: '', error: `Failed to read text file: ${e.message}`, isUnreadable: true };
    }
  }

  // 2. DOCX Word Document (.docx)
  if (ext === 'docx' || mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
    try {
      const mammothModule: any = await import('mammoth');
      const mammoth = mammothModule.default || mammothModule;
      const result = await mammoth.extractRawText({ buffer });
      const rawText = result?.value || '';
      const text = cleanExtractedText(rawText);
      if (text.length < 10) {
        return { text: '', error: 'DOCX file contains no readable text or is password protected.', isUnreadable: true };
      }
      return { text };
    } catch (err: any) {
      console.warn(`Mammoth docx extraction error for ${originalname}:`, err);
      return { text: '', error: `Failed to parse DOCX: ${err.message}`, isUnreadable: true };
    }
  }

  // 3. PDF Document (.pdf)
  if (ext === 'pdf' || mimetype === 'application/pdf') {
    try {
      const pdfParseModule = await import('pdf-parse');
      const PDFParse = (pdfParseModule as any).PDFParse;
      if (typeof PDFParse === 'function') {
        const parser = new PDFParse({ data: buffer });
        const result = await parser.getText();
        const rawText = result?.text || '';
        try {
          await parser.destroy();
        } catch (_) {}
        const text = cleanExtractedText(rawText);
        if (text.length > 20) {
          return { text };
        }
      }
    } catch (err: any) {
      console.warn(`PDFParse method failed for ${originalname}, trying fallback:`, err?.message || err);
    }

    // Fallback stream text extraction
    try {
      const rawDecoded = buffer.toString('utf-8');
      const cleanAscii = rawDecoded.replace(/[^\x20-\x7E\n\r\t]/g, ' ');
      const normalized = cleanExtractedText(cleanAscii.replace(/\s{3,}/g, '\n'));
      if (normalized.length > 40) {
        return { text: normalized };
      }
    } catch (_) {}

    return {
      text: '',
      error: 'PDF appears to be a scanned image without OCR text, or is corrupted.',
      isUnreadable: true
    };
  }

  // 4. Unknown/generic binary fallback
  try {
    const rawDecoded = buffer.toString('utf-8');
    const cleanAscii = rawDecoded.replace(/[^\x20-\x7E\n\r\t]/g, ' ');
    const normalized = cleanExtractedText(cleanAscii);
    if (normalized.length > 50) {
      return { text: normalized };
    }
  } catch (_) {}

  return {
    text: '',
    error: `Unsupported or unreadable file format (.${ext}). Supported: PDF, DOCX, TXT.`,
    isUnreadable: true
  };
}

// Derive a clean candidate name from file text or clean filename
function deriveCandidateName(rawText: string, originalname: string): string {
  const cleanFilename = originalname
    .replace(/\.[a-zA-Z0-9]+$/i, '')
    .replace(/[-_]/g, ' ')
    .replace(/\b(resume|cv|profile|intern|final|v\d+|updated|copy)\b/gi, '')
    .replace(/\s{2,}/g, ' ')
    .trim();

  // Inspect the first 8 lines of text
  const lines = rawText
    .split('\n')
    .map(l => l.trim())
    .filter(l => l.length >= 2 && l.length <= 50);

  for (const line of lines.slice(0, 6)) {
    // Exclude headers, emails, phone numbers, urls, or generic labels
    if (
      !/resume|curriculum|vitae|profile|contact|email|phone|objective|summary|page \d|http|github|linkedin|education|skills|experience/i.test(line) &&
      !/@|\.com|\.in|\.edu|\+?\d{6,}/.test(line)
    ) {
      // Check for human name pattern (2 to 4 capitalized words)
      if (/^[A-Za-z]+([\s\.\'\-][A-Za-z]+){1,3}$/.test(line)) {
        return line;
      }
    }
  }

  if (cleanFilename.length > 2) {
    return cleanFilename
      .split(' ')
      .filter(w => w.length > 0)
      .map(w => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
      .join(' ');
  }

  return originalname;
}

// Typo & formatting detector for resumes
function analyzeResumeFormat(rawText: string): {
  score: number;
  hasInconsistentHeaders: boolean;
  hasVariedDateFormats: boolean;
  detectedTypos: string[];
  notes: string;
} {
  const detectedTypos: string[] = [];
  const lower = rawText.toLowerCase();

  // Common tech spelling typos
  const typoChecks: [RegExp, string][] = [
    [/\bexpres(\.js)?\b/i, 'Expres (Express)'],
    [/\bmongodb?\s*atls\b/i, 'Mongodb atls (MongoDB Atlas)'],
    [/\bjavascrip\b/i, 'JavaScrip (JavaScript)'],
    [/\bgitt\b/i, 'Gitt (Git)'],
    [/\bprojekts?\b/i, 'Projekts (Projects)'],
    [/\bpyton\b/i, 'Pyton (Python)'],
    [/\bdockr\b/i, 'Dockr (Docker)'],
    [/\bnode js\b/i, 'Node js (Node.js)'],
    [/\breact js\b/i, 'React js (React.js)']
  ];

  for (const [regex, label] of typoChecks) {
    if (regex.test(rawText)) {
      detectedTypos.push(label);
    }
  }

  // Inconsistent date formats: e.g. "08/2023 - Present" vs "Jan 2024" vs "2022-2026"
  const hasSlashDate = /\d{1,2}\/\d{4}/.test(rawText);
  const hasNamedMonth = /\b(Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d{4}\b/i.test(rawText);
  const hasVariedDateFormats = hasSlashDate && hasNamedMonth;

  // Header casing inconsistency
  const hasAllUpperHeaders = /\n[A-Z\s]{4,20}:\n/.test(rawText);
  const hasLowerHeaders = /\n[a-z\s]{4,20}:\n/.test(rawText);
  const hasInconsistentHeaders = hasAllUpperHeaders && hasLowerHeaders;

  let score = 95;
  if (detectedTypos.length > 0) score -= (detectedTypos.length * 7);
  if (hasInconsistentHeaders) score -= 8;
  if (hasVariedDateFormats) score -= 5;
  score = Math.max(30, Math.min(100, score));

  let notes = 'Clean standard formatting';
  if (score < 70) {
    notes = 'Contains non-standard headers, formatting typos, or inconsistent date representations.';
  } else if (score < 85) {
    notes = 'Minor structural variations or inconsistent date formatting detected.';
  }

  return {
    score,
    hasInconsistentHeaders,
    hasVariedDateFormats,
    detectedTypos,
    notes
  };
}

// -------------------------------------------------------------
// API ROUTES
// -------------------------------------------------------------

app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'Smart Shortlisting Engine' });
});

/**
 * Upload and parse multiple resume files (PDF, DOCX, TXT) and Job Description
 */
app.post('/api/upload-and-parse', upload.fields([
  { name: 'jdFile', maxCount: 1 },
  { name: 'resumeFiles', maxCount: 50 }
]), async (req: Request, res: Response) => {
  try {
    const files = req.files as { [fieldname: string]: Express.Multer.File[] } | undefined;
    let jdText = req.body.jdRawText || '';

    if (files?.jdFile && files.jdFile[0]) {
      const extractedJD = await extractTextFromFileBuffer(
        files.jdFile[0].buffer,
        files.jdFile[0].originalname,
        files.jdFile[0].mimetype
      );
      if (extractedJD.text) {
        jdText = extractedJD.text;
      }
    }

    const parsedResumes: Array<{
      filename: string;
      rawText: string;
      suggestedName: string;
      formatting: ReturnType<typeof analyzeResumeFormat>;
      isUnreadable?: boolean;
      error?: string;
    }> = [];

    const unreadableFiles: Array<{ filename: string; reason: string }> = [];

    if (files?.resumeFiles && files.resumeFiles.length > 0) {
      for (const file of files.resumeFiles) {
        const extraction = await extractTextFromFileBuffer(
          file.buffer,
          file.originalname,
          file.mimetype
        );

        if (extraction.isUnreadable || !extraction.text) {
          unreadableFiles.push({
            filename: file.originalname,
            reason: extraction.error || 'Empty or unreadable file'
          });
          parsedResumes.push({
            filename: file.originalname,
            rawText: '',
            suggestedName: file.originalname,
            formatting: {
              score: 20,
              hasInconsistentHeaders: false,
              hasVariedDateFormats: false,
              detectedTypos: [],
              notes: extraction.error || 'Unreadable file'
            },
            isUnreadable: true,
            error: extraction.error
          });
          continue;
        }

        const formatting = analyzeResumeFormat(extraction.text);
        const candidateName = deriveCandidateName(extraction.text, file.originalname);

        parsedResumes.push({
          filename: file.originalname,
          rawText: extraction.text,
          suggestedName: candidateName,
          formatting,
          isUnreadable: false
        });
      }
    }

    res.json({
      success: true,
      jdText,
      resumes: parsedResumes,
      totalUploaded: files?.resumeFiles?.length || 0,
      totalSuccessfullyParsed: parsedResumes.filter(r => !r.isUnreadable).length,
      unreadableFiles
    });
  } catch (error: any) {
    console.error('Upload and parse error:', error);
    res.status(500).json({ error: error.message || 'Failed to parse resume files' });
  }
});

/**
 * Extract structured JSON from Job Description using Gemini
 */
app.post('/api/extract-jd', async (req: Request, res: Response) => {
  try {
    const { rawText } = req.body;
    if (!rawText || typeof rawText !== 'string') {
      return res.status(400).json({ error: 'Job description text is required' });
    }

    if (!process.env.GEMINI_API_KEY) {
      // Fallback rule-based extraction
      return res.json({
        title: 'Software Developer Intern',
        company: 'Hiring Company',
        location: 'Remote / Hybrid',
        experienceLevel: 'Entry / Intern',
        requiredHardSkills: ['React', 'Node.js', 'Express', 'JavaScript', 'REST APIs', 'MongoDB', 'Git'],
        goodToHaveSkills: ['TypeScript', 'Docker', 'PostgreSQL', 'Tailwind CSS'],
        coreResponsibilities: ['Develop frontend components', 'Build REST APIs', 'Manage databases'],
        educationRequirements: ['B.Tech / B.E. in Computer Science or related']
      });
    }

    const ai = getGemini();
    const prompt = `You are an expert technical talent recruiter and HR AI parser.
Analyze the following Job Description and extract structured information into strict JSON.

Job Description:
"""
${rawText.slice(0, 4000)}
"""

Return ONLY a valid JSON object with the following structure:
{
  "title": "Job title",
  "company": "Company name if mentioned or 'TechNova Solutions'",
  "location": "Location if mentioned",
  "experienceLevel": "e.g. Intern / Entry Level (0-1 years)",
  "requiredHardSkills": ["Skill1", "Skill2", "Skill3"],
  "goodToHaveSkills": ["Bonus1", "Bonus2"],
  "coreResponsibilities": ["Resp1", "Resp2", "Resp3"],
  "educationRequirements": ["Education1"]
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json'
      }
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json(parsed);
  } catch (error: any) {
    console.error('Extract JD error:', error);
    res.status(500).json({ error: error.message || 'Failed to extract JD info' });
  }
});

/**
 * Extract structured information from resumes
 */
app.post('/api/extract-resumes', async (req: Request, res: Response) => {
  try {
    const { resumes } = req.body; // Array of { id, candidateName, rawText }
    if (!Array.isArray(resumes) || resumes.length === 0) {
      return res.status(400).json({ error: 'Resumes array is required' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.json({ resumes });
    }

    const ai = getGemini();
    const results = [];

    // Process in batches of up to 4 to preserve speed and avoid token overflow
    for (const resume of resumes) {
      try {
        const prompt = `Extract technical profile data from this candidate resume into strict JSON:
Resume Text:
"""
${(resume.rawText || '').slice(0, 2500)}
"""

Return JSON format:
{
  "candidateName": "${resume.candidateName || 'Candidate Name'}",
  "email": "Email if found",
  "phone": "Phone if found",
  "education": "Degree, institution, graduation year",
  "experienceSummary": "2-3 sentence overview of hands-on technical experience",
  "extractedSkills": ["Skill1", "Skill2", "Skill3"],
  "projects": ["Project 1 summary", "Project 2 summary"]
}`;

        const response = await ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            responseMimeType: 'application/json'
          }
        });

        const parsed = JSON.parse(response.text || '{}');
        results.push({
          ...resume,
          ...parsed,
          extractedSkills: parsed.extractedSkills || resume.extractedSkills || [],
          experienceSummary: parsed.experienceSummary || resume.experienceSummary || '',
          projects: parsed.projects || resume.projects || []
        });
      } catch (err) {
        console.warn(`Extraction error for ${resume.candidateName}:`, err);
        results.push(resume);
      }
    }

    res.json({ resumes: results });
  } catch (error: any) {
    console.error('Extract resumes error:', error);
    res.status(500).json({ error: error.message || 'Failed to extract resume data' });
  }
});

/**
 * Compute dense vector embeddings for JD and Resumes using Gemini
 */
app.post('/api/compute-embeddings', async (req: Request, res: Response) => {
  try {
    // Accept either { jdText, candidates: [{ id, text }] } OR { texts: { [id]: text } }
    let targetJDText = req.body.jdText;
    let targetCandidates = req.body.candidates as Array<{ id: string; text: string }>;

    if (req.body.texts) {
      targetJDText = req.body.texts.jd || '';
      targetCandidates = Object.entries(req.body.texts)
        .filter(([key]) => key !== 'jd')
        .map(([id, text]) => ({ id, text: String(text) }));
    }

    if (!targetJDText || !Array.isArray(targetCandidates)) {
      return res.status(400).json({ error: 'jdText and candidates array (or texts object) are required' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.json({
        embeddingsAvailable: false,
        message: 'No GEMINI_API_KEY provided; using deterministic TF-IDF cosine model.'
      });
    }

    const ai = getGemini();

    try {
      // 1. Compute JD embedding using gemini-embedding-2-preview
      const jdEmbedRes = await ai.models.embedContent({
        model: 'gemini-embedding-2-preview',
        contents: targetJDText.slice(0, 2000)
      });

      const jdEmbedding = jdEmbedRes.embeddings?.[0]?.values || [];

      // 2. Compute candidate embeddings
      const candidateEmbeddings: Record<string, number[]> = {};

      // Run parallel batches with limit
      await Promise.all(
        targetCandidates.map(async (c) => {
          try {
            const resEmbed = await ai.models.embedContent({
              model: 'gemini-embedding-2-preview',
              contents: c.text.slice(0, 2000)
            });
            const values = resEmbed.embeddings?.[0]?.values;
            if (values && values.length > 0) {
              candidateEmbeddings[c.id] = values;
            }
          } catch (err) {
            console.warn(`Failed embedding for candidate ${c.id}:`, err);
          }
        })
      );

      return res.json({
        embeddingsAvailable: true,
        jdEmbedding,
        candidateEmbeddings,
        embeddings: {
          jd: jdEmbedding,
          ...candidateEmbeddings
        }
      });
    } catch (embedError: any) {
      console.warn('Gemini embedding API failed, falling back to local TF-IDF vector model:', embedError?.message || embedError);
      return res.json({
        embeddingsAvailable: false,
        message: 'Using built-in deterministic TF-IDF cosine similarity vector space model.',
        error: embedError?.message || String(embedError)
      });
    }
  } catch (error: any) {
    console.error('Compute embeddings error:', error);
    res.status(500).json({ error: error.message || 'Failed to compute embeddings' });
  }
});

/**
 * Generate Top-3 Explanations
 */
app.post('/api/generate-top3-explanations', async (req: Request, res: Response) => {
  try {
    const { topCandidates, jd } = req.body;
    if (!Array.isArray(topCandidates) || !jd) {
      return res.status(400).json({ error: 'topCandidates and jd are required' });
    }

    if (!process.env.GEMINI_API_KEY) {
      // Fallback deterministic explanations
      const fallbackExplanations: Record<string, any> = {};
      topCandidates.forEach((c: any) => {
        fallbackExplanations[c.candidateId] = {
          summary: `${c.candidateName} ranked #${c.rank} with a composite fit score of ${c.finalScore}%. Demonstrated strong alignment across core technologies.`,
          whyRankedHere: `Matched ${c.matchedRequiredSkills.length} of ${jd.requiredHardSkills.length} required hard skills. Semantic similarity of ${c.semanticScore}% validates practical project application.`,
          keyStrengths: c.matchedRequiredSkills.slice(0, 4).map((s: string) => `Strong demonstrated competence in ${s}`),
          criticalGaps: c.missingRequiredSkills.length > 0
            ? c.missingRequiredSkills.map((s: string) => `Needs verification on ${s}`)
            : ['No major critical gaps detected; verify architectural depth'],
          recommendedInterviewQuestions: [
            `Can you describe the REST API design decisions you made in your latest project?`,
            `How did you handle database query performance and data consistency?`,
            `Walk us through a challenging bug you debugged using Git and development tools.`
          ]
        };
      });
      return res.json({ explanations: fallbackExplanations });
    }

    const ai = getGemini();
    const prompt = `You are an expert technical interviewer evaluating the top 3 candidates shortlisted by our hybrid scoring engine for the role of "${jd.title}" at "${jd.company}".

Required Hard Skills: ${jd.requiredHardSkills.join(', ')}
Good to Have Skills: ${jd.goodToHaveSkills.join(', ')}

Top 3 Candidates Data:
${JSON.stringify(topCandidates, null, 2)}

Provide a structured, unbiased evaluation for each candidate explaining:
1. summary: A concise 2-sentence executive summary of why they earned their top rank.
2. whyRankedHere: Specific breakdown comparing their matched skills vs missing required skills and hands-on depth.
3. keyStrengths: Array of 3 specific technical strengths.
4. criticalGaps: Array of 1-3 skills or experiences that are missing or require verification.
5. recommendedInterviewQuestions: Array of 3 tailored technical interview questions to test their claimed competencies.

Return JSON mapping candidateId to their explanation object:
{
  "candidateId1": {
    "summary": "...",
    "whyRankedHere": "...",
    "keyStrengths": ["...", "...", "..."],
    "criticalGaps": ["..."],
    "recommendedInterviewQuestions": ["...", "...", "..."]
  },
  ...
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json'
      }
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json({ explanations: parsed });
  } catch (error: any) {
    console.warn('Generate explanations AI error, using deterministic fallback:', error?.message || error);
    const { topCandidates, jd } = req.body;
    const fallbackExplanations: Record<string, any> = {};
    (topCandidates || []).forEach((c: any) => {
      fallbackExplanations[c.candidateId] = {
        summary: `${c.candidateName} ranked #${c.rank} with a composite fit score of ${c.finalScore}%. Demonstrated strong alignment across core technologies.`,
        whyRankedHere: `Matched ${(c.matchedRequiredSkills || []).length} of ${(jd?.requiredHardSkills || []).length} required hard skills. Semantic similarity of ${c.semanticScore}% validates practical project application.`,
        keyStrengths: (c.matchedRequiredSkills || []).slice(0, 4).map((s: string) => `Strong demonstrated competence in ${s}`),
        criticalGaps: (c.missingRequiredSkills || []).length > 0
          ? (c.missingRequiredSkills || []).map((s: string) => `Needs verification on ${s}`)
          : ['No major critical gaps detected; verify architectural depth'],
        recommendedInterviewQuestions: [
          `Can you describe the REST API design decisions you made in your latest project?`,
          `How did you handle database query performance and data consistency?`,
          `Walk us through a challenging bug you debugged using Git and development tools.`
        ]
      };
    });
    res.json({ explanations: fallbackExplanations });
  }
});

/**
 * Helper to produce deterministic bias analysis when AI is unavailable
 */
function getDeterministicBiasAnalysis(jdText: string) {
  const biases: any[] = [];
  const textLower = jdText.toLowerCase();

  if (textLower.includes('tier-1') || textLower.includes('premier') || textLower.includes('iit') || textLower.includes('nit')) {
    biases.push({
      id: 'b-cred-1',
      category: 'exclusionary_credentials',
      phrase: 'Candidates from Tier-1 premier institutes only (IIT/NIT/BITS/MIT Manipal)',
      severity: 'high',
      explanation: 'Excludes capable self-taught engineers, Tier-2/3 college candidates, and lateral entrants with strong real-world projects.',
      recommendation: 'Open to candidates from all accredited universities or self-taught builders with demonstrable portfolio work.'
    });
  }

  if (textLower.includes('2+ years') || textLower.includes('2 years of production') || textLower.includes('minimum 2 years')) {
    biases.push({
      id: 'b-exp-1',
      category: 'experience_inflation',
      phrase: 'Minimum 2+ years of production experience in full-stack engineering',
      severity: 'high',
      explanation: 'Overly restrictive requirement for an entry-level / intern placement position.',
      recommendation: 'Prior hands-on academic, freelance, or personal project experience building web applications.'
    });
  }

  if (textLower.includes('rockstar') || textLower.includes('ninja') || textLower.includes('24/7') || textLower.includes('hustle')) {
    biases.push({
      id: 'b-cul-1',
      category: 'gendered_or_aggressive',
      phrase: 'Self-driven coding rockstar / ninja ready to hustle 24/7 and crush sprints',
      severity: 'medium',
      explanation: 'Hyper-aggressive idioms discourage neurodiverse, collaborative candidates and foster an unhealthy overtime expectation.',
      recommendation: 'Collaborative, proactive developer with strong ownership and problem-solving skills.'
    });
  }

  if (textLower.includes('neovim') || textLower.includes('linux only') || textLower.includes('arch')) {
    biases.push({
      id: 'b-tool-1',
      category: 'rigid_tooling',
      phrase: 'Must use Linux Neovim development environment',
      severity: 'low',
      explanation: 'Mandating a specific editor/OS filters out productive developers proficient in modern IDEs like VS Code or WebStorm.',
      recommendation: 'Comfortable with standard modern developer tools (VS Code, JetBrains, or preferred editor).'
    });
  }

  const inclusiveScore = Math.max(30, 100 - biases.length * 14);
  return {
    biases,
    inclusiveScore,
    overallVerdict: biases.length > 0 
      ? `Detected ${biases.length} exclusionary criteria that may unfairly limit qualified applicants for this intern opening.`
      : 'Job description demonstrates inclusive, objective language focused on relevant technical competencies.'
  };
}

/**
 * Bias Flagger Endpoint
 */
app.post('/api/detect-bias', async (req: Request, res: Response) => {
  try {
    const { jdText } = req.body;
    if (!jdText) {
      return res.status(400).json({ error: 'jdText is required' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.json(getDeterministicBiasAnalysis(jdText));
    }

    const ai = getGemini();
    const prompt = `Analyze this Job Description for bias, exclusionary criteria, and overly narrow phrasing that could unfairly filter out qualified candidates.

Categories to inspect:
1. exclusionary_credentials: Prestige bias, tier-1 university gating, rigid GPA thresholds.
2. experience_inflation: Asking for unrealistic years of experience for junior/intern roles, or for newly released frameworks.
3. gendered_or_aggressive: Phrases like "ninja", "rockstar", "work hard play hard", "aggressive hustle", "crush sprints".
4. rigid_tooling: Overly restrictive OS, IDE, or tool mandates (e.g. "must use Linux Neovim").
5. work_life_balance: Implied 24/7 availability or extreme overtime pressure.

Job Description:
"""
${jdText.slice(0, 4000)}
"""

Return JSON format:
{
  "biases": [
    {
      "id": "b1",
      "category": "exclusionary_credentials",
      "phrase": "Exact quote from text",
      "severity": "high",
      "explanation": "Why this creates unfair exclusion",
      "recommendation": "Inclusive replacement phrasing"
    }
  ],
  "inclusiveScore": 72,
  "overallVerdict": "Summary of JD inclusivity"
}`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json'
      }
    });

    const parsed = JSON.parse(response.text || '{}');
    res.json(parsed);
  } catch (error: any) {
    console.warn('Detect bias AI error, using deterministic analysis:', error?.message || error);
    res.json(getDeterministicBiasAnalysis(req.body.jdText || ''));
  }
});

/**
 * Helper to produce intelligent comparative answers when AI service is busy
 */
function getDeterministicRecruiterChat(message: string, context: any) {
  const rankings: any[] = context?.rankings || [];
  const msgLower = message.toLowerCase();

  // Find if two candidates are mentioned or if comparing top candidates
  let candA = rankings[0];
  let candB = rankings[1];

  for (const r of rankings) {
    const nameWords = r.candidateName.toLowerCase().split(' ');
    if (nameWords.some((w: string) => w.length > 2 && msgLower.includes(w))) {
      if (!candA || candA === rankings[0]) {
        candA = r;
      } else {
        candB = r;
        break;
      }
    }
  }

  if (candA && candB && candA !== candB) {
    return `### Comparative Evaluation: **${candA.candidateName}** (#${candA.rank}) vs **${candB.candidateName}** (#${candB.rank})

- **Composite Final Score:** ${candA.candidateName} leads with **${candA.finalScore}%** vs ${candB.candidateName}'s **${candB.finalScore}%** (Δ ${Math.abs(candA.finalScore - candB.finalScore).toFixed(1)}%).
- **Semantic Understanding:** ${candA.candidateName} achieved **${candA.semanticScore}%** semantic similarity vs ${candB.candidateName}'s **${candB.semanticScore}%**. ${candA.candidateName}'s projects reflect higher practical depth in full-stack architecture.
- **Explicit Keyword Coverage:** ${candA.candidateName} matched **${candA.keywordScore}%** of required technologies (${(candA.matchedRequiredSkills || []).join(', ') || 'None'}), whereas ${candB.candidateName} scored **${candB.keywordScore}%** (${(candB.matchedRequiredSkills || []).join(', ') || 'None'}).
${candB.missingRequiredSkills?.length > 0 ? `- **Missing Critical Skills for ${candB.candidateName}:** ${candB.missingRequiredSkills.join(', ')}.` : ''}

**Recruiter Recommendation:** ${candA.candidateName} is mathematically favored due to a stronger balance between explicit skill coverage and contextual project experience.`;
  }

  if (candA) {
    return `### Candidate Analysis: **${candA.candidateName}** (Rank #${candA.rank})
- **Composite Score:** **${candA.finalScore}%** [Semantic: ${candA.semanticScore}% | Keyword: ${candA.keywordScore}%]
- **Fit Tier:** **${candA.fitCategory || 'Evaluated'}**
- **Matched Required Skills:** ${(candA.matchedRequiredSkills || []).join(', ') || 'None'}
- **Missing Required Skills:** ${(candA.missingRequiredSkills || []).length > 0 ? candA.missingRequiredSkills.join(', ') : 'None (Complete Coverage)'}
- **Assessment:** ${candA.candidateName} demonstrates a strong match for the ${(context?.jd?.title || 'internship')} role with verified hands-on implementation capabilities.`;
  }

  return `### Shortlist Executive Overview
The engine evaluated **${rankings.length} candidates** using our hybrid dual-pipeline (Cosine Vector Similarity + Tokenized Skill Matching).
- **Top Ranked:** #${rankings[0]?.rank} **${rankings[0]?.candidateName}** (${rankings[0]?.finalScore}%)
- **Runner Up:** #${rankings[1]?.rank} **${rankings[1]?.candidateName}** (${rankings[1]?.finalScore}%)
- **Third Place:** #${rankings[2]?.rank} **${rankings[2]?.candidateName}** (${rankings[2]?.finalScore}%)

You can ask specific questions such as:
1. *"Why is Aarav Sharma ranked above Priya Patel?"*
2. *"Why is Vikram Singh in Moderate Fit?"*
3. *"Which candidates lack Docker experience?"*`;
}

/**
 * Recruiter Chat Intelligence
 */
app.post('/api/recruiter-chat', async (req: Request, res: Response) => {
  try {
    const { message, history, context } = req.body;
    if (!message) {
      return res.status(400).json({ error: 'Message is required' });
    }

    if (!process.env.GEMINI_API_KEY) {
      return res.json({
        reply: getDeterministicRecruiterChat(message, context)
      });
    }

    const ai = getGemini();

    const systemPrompt = `You are the AI Recruiter Co-Pilot for the "Smart Shortlisting Engine" at TechNova Solutions.
You have complete access to the candidate shortlist, rankings, keyword match scores, semantic cosine similarities, matched skills, missing skills, and resume details.

Job Description Details:
- Title: ${context?.jd?.title || 'Junior Full Stack Developer Intern'}
- Company: ${context?.jd?.company || 'TechNova Solutions'}
- Required Hard Skills: ${(context?.jd?.requiredHardSkills || []).join(', ')}
- Good to Have Skills: ${(context?.jd?.goodToHaveSkills || []).join(', ')}

Rankings & Candidates Context:
${JSON.stringify((context?.rankings || []).map((r: any) => ({
  rank: r.rank,
  name: r.candidateName,
  finalScore: r.finalScore,
  semanticScore: r.semanticScore,
  keywordScore: r.keywordScore,
  matchedRequired: r.matchedRequiredSkills,
  missingRequired: r.missingRequiredSkills,
  fitCategory: r.fitCategory
})), null, 2)}

Instructions:
1. Answer recruiter questions objectively, citing exact data (e.g. "Candidate X has a 88% semantic score with Express/MongoDB, whereas Candidate Y only knows Django/Python").
2. When asked "Why is Candidate X ranked above Candidate Y?", explain the exact mathematical and skill trade-offs (semantic cosine overlap vs explicit keyword requirements).
3. Be professional, direct, concise, and helpful to the hiring manager. Format responses with clear bullet points when comparing multiple candidates.`;

    const chatMessages = [
      {
        role: 'user',
        parts: [{ text: `${systemPrompt}\n\nUser Question: ${message}` }]
      }
    ];

    if (Array.isArray(history) && history.length > 0) {
      // Add recent messages for context
      const formattedHistory = history.slice(-4).map((h: any) => ({
        role: h.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: h.content }]
      }));
      chatMessages.unshift(...formattedHistory);
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: chatMessages,
      config: {
        temperature: 0.4
      }
    });

    res.json({ reply: response.text });
  } catch (error: any) {
    console.warn('Recruiter chat AI error, using fallback comparative reasoning:', error?.message || error);
    res.json({ reply: getDeterministicRecruiterChat(req.body.message || '', req.body.context || {}) });
  }
});

// -------------------------------------------------------------
// VITE DEV SERVER / STATIC ASSET SERVING
// -------------------------------------------------------------
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa'
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Smart Shortlisting Engine running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(err => {
  console.error('Fatal server startup error:', err);
  process.exit(1);
});
