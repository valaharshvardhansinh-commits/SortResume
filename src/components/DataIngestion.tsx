import React, { useState, useRef } from 'react';
import { JobDescription, CandidateResume } from '../types';
import {
  UploadCloud,
  FileText,
  CheckCircle2,
  AlertTriangle,
  RefreshCw,
  FileUp,
  Database,
  Trash2,
  X,
  FileCode,
  Check,
  Sparkles,
  ArrowRight,
  AlertCircle
} from 'lucide-react';
import { SAMPLE_JD_RAW } from '../data/sampleDataset';

interface DataIngestionProps {
  currentJD: JobDescription;
  candidates: CandidateResume[];
  onApplyNewData: (jd: JobDescription, resumes: CandidateResume[]) => void;
  onResetSampleData: () => void;
}

export const DataIngestion: React.FC<DataIngestionProps> = ({
  currentJD,
  candidates,
  onApplyNewData,
  onResetSampleData
}) => {
  const [jdFile, setJdFile] = useState<File | null>(null);
  const [jdTextInput, setJdTextInput] = useState<string>(currentJD.rawText || SAMPLE_JD_RAW);
  const [resumeFiles, setResumeFiles] = useState<File[]>([]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [progressPercent, setProgressPercent] = useState<number>(0);
  const [currentStepText, setCurrentStepText] = useState<string>('');
  const [parsingErrors, setParsingErrors] = useState<Array<{ filename: string; reason: string }>>([]);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isDraggingResume, setIsDraggingResume] = useState<boolean>(false);
  const [isDraggingJD, setIsDraggingJD] = useState<boolean>(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const jdInputRef = useRef<HTMLInputElement>(null);

  // File drag & drop handlers for resumes
  const handleResumeDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingResume(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      addResumeFiles(Array.from(e.dataTransfer.files));
    }
  };

  const handleResumeInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      addResumeFiles(Array.from(e.target.files));
    }
  };

  const addResumeFiles = (newFiles: File[]) => {
    const validExtensions = ['.pdf', '.docx', '.txt', '.doc'];
    const filtered = newFiles.filter(f => {
      const ext = '.' + f.name.split('.').pop()?.toLowerCase();
      return validExtensions.includes(ext);
    });

    if (filtered.length < newFiles.length) {
      alert('Some files were ignored because only PDF, DOCX, and TXT files are supported.');
    }

    setResumeFiles(prev => {
      // Avoid duplicate filenames
      const existingNames = new Set(prev.map(f => f.name));
      const additions = filtered.filter(f => !existingNames.has(f.name));
      return [...prev, ...additions];
    });
  };

  const removeResumeFile = (index: number) => {
    setResumeFiles(prev => prev.filter((_, i) => i !== index));
  };

  const clearAllResumes = () => {
    setResumeFiles([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // JD file handlers
  const handleJdDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingJD(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setJdFile(e.dataTransfer.files[0]);
    }
  };

  const handleJdInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setJdFile(e.target.files[0]);
    }
  };

  const handleLoadSampleJD = () => {
    setJdFile(null);
    setJdTextInput(SAMPLE_JD_RAW);
  };

  // Main Batch Processing
  const handleProcessAndRank = async () => {
    if (!jdFile && !jdTextInput.trim()) {
      alert('Please provide a Job Description (either by uploading a file or entering text in the box).');
      return;
    }
    if (resumeFiles.length === 0) {
      alert('Please select at least one Resume file (PDF, DOCX, or TXT) to parse and rank.');
      return;
    }

    setIsProcessing(true);
    setProgressPercent(10);
    setCurrentStepText(`Uploading ${resumeFiles.length} resume(s) and Job Description...`);
    setParsingErrors([]);
    setSuccessMessage(null);

    try {
      const formData = new FormData();
      if (jdFile) {
        formData.append('jdFile', jdFile);
      } else {
        formData.append('jdRawText', jdTextInput);
      }

      resumeFiles.forEach((file) => {
        formData.append('resumeFiles', file);
      });

      // Progress animation update
      setProgressPercent(25);
      setCurrentStepText(`Extracting raw text from ${resumeFiles.length} files (PDF/DOCX/TXT) asynchronously...`);

      const response = await fetch('/api/upload-and-parse', {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error(`Server returned ${response.status}: Failed to parse uploaded files.`);
      }

      const parseResult = await response.json();
      setProgressPercent(55);
      setCurrentStepText('Analyzing Job Description requirements & extracting technical keywords...');

      const extractedJDText = parseResult.jdText || jdTextInput;

      // Extract structured JD requirements (titles, hard skills, etc.)
      let parsedJDData: any = {};
      try {
        const jdExtractRes = await fetch('/api/extract-jd', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ rawText: extractedJDText })
        });
        if (jdExtractRes.ok) {
          parsedJDData = await jdExtractRes.json();
        }
      } catch (e) {
        console.warn('JD structuring error, falling back to heuristic parsing:', e);
      }

      setProgressPercent(75);
      setCurrentStepText('Matching technical skills & computing semantic vector embeddings...');

      const requiredSkills = parsedJDData.requiredHardSkills?.length > 0
        ? parsedJDData.requiredHardSkills
        : currentJD.requiredHardSkills;

      const goodToHaveSkills = parsedJDData.goodToHaveSkills?.length > 0
        ? parsedJDData.goodToHaveSkills
        : currentJD.goodToHaveSkills;

      const newJD: JobDescription = {
        id: `jd-${Date.now()}`,
        title: parsedJDData.title || currentJD.title || 'Junior Full Stack Developer Intern',
        company: parsedJDData.company || currentJD.company || 'TechNova Solutions',
        location: parsedJDData.location || currentJD.location || 'Bangalore / Hybrid',
        experienceLevel: parsedJDData.experienceLevel || currentJD.experienceLevel || 'Intern / Entry Level',
        rawText: extractedJDText,
        requiredHardSkills: requiredSkills,
        goodToHaveSkills: goodToHaveSkills,
        coreResponsibilities: parsedJDData.coreResponsibilities || currentJD.coreResponsibilities,
        educationRequirements: parsedJDData.educationRequirements || currentJD.educationRequirements,
        detectedBiases: currentJD.detectedBiases || []
      };

      // Check for unreadable/empty files reported by backend
      const unreadableList: Array<{ filename: string; reason: string }> = parseResult.unreadableFiles || [];
      if (unreadableList.length > 0) {
        setParsingErrors(unreadableList);
      }

      // Convert parsed documents to CandidateResume structures
      const candidateList: CandidateResume[] = (parseResult.resumes || []).map((r: any, idx: number) => {
        const isUnreadable = Boolean(r.isUnreadable || !r.rawText || r.rawText.trim().length === 0);

        // Extract skills found in resume
        const matchedSkills = isUnreadable ? [] : requiredSkills.filter((s: string) => {
          const escaped = s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
          return new RegExp(`(^|[^a-z0-9])${escaped}([^a-z0-9]|$)`, 'i').test(r.rawText);
        });

        return {
          id: `uploaded-${Date.now()}-${idx + 1}`,
          candidateName: r.suggestedName || `Candidate ${idx + 1}`,
          filename: r.filename,
          email: `candidate.${idx + 1}@domain.com`,
          education: 'University Student / Candidate',
          experienceSummary: isUnreadable
            ? '⚠️ Unreadable or empty document. Could not extract experience text.'
            : (r.rawText.slice(0, 400).trim() || 'General software development candidate profile.'),
          extractedSkills: matchedSkills,
          projects: isUnreadable ? [] : [r.rawText.slice(400, 850).trim()].filter(Boolean),
          rawText: r.rawText || '',
          isUnreadable,
          formattingQuality: r.formatting || {
            score: isUnreadable ? 0 : 85,
            hasInconsistentHeaders: false,
            hasVariedDateFormats: false,
            detectedTypos: [],
            notes: isUnreadable ? (r.error || 'Empty or corrupted document') : 'Standard layout extracted.'
          }
        };
      });

      setProgressPercent(95);
      setCurrentStepText('Finalizing dual-scoring ranking & building candidate leaderboard...');

      await new Promise(resolve => setTimeout(resolve, 300));
      setProgressPercent(100);

      onApplyNewData(newJD, candidateList);
      setSuccessMessage(
        `Successfully processed ${candidateList.length} candidate resume(s) against "${newJD.title}"!`
      );
    } catch (err: any) {
      console.error('Batch upload and ranking error:', err);
      alert(`Error during batch processing: ${err.message || 'Unknown error'}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-lg">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-emerald-500/15 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
              <Database className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">
                Batch Document Ingestion &amp; Resume Ranking
              </h2>
              <p className="text-xs text-slate-400 mt-0.5">
                Upload 15–20 resumes simultaneously in PDF, DOCX, or TXT format. Automatically parses raw text, cleans messy layouts, extracts technical keywords, and calculates semantic scores.
              </p>
            </div>
          </div>
        </div>

        <button
          onClick={onResetSampleData}
          disabled={isProcessing}
          className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold transition shrink-0"
        >
          <RefreshCw className="w-3.5 h-3.5 text-emerald-400" />
          <span>Reload 18 Sample Hackathon Resumes</span>
        </button>
      </div>

      {/* Progress Bar (Visible while processing) */}
      {isProcessing && (
        <div className="bg-slate-900 border border-emerald-500/40 rounded-2xl p-5 space-y-3 shadow-xl shadow-emerald-500/5 animate-pulse">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-emerald-300 flex items-center gap-2">
              <RefreshCw className="w-4 h-4 animate-spin text-emerald-400" />
              {currentStepText}
            </span>
            <span className="font-mono font-bold text-emerald-400 text-sm">
              {progressPercent}%
            </span>
          </div>
          <div className="w-full h-2.5 bg-slate-950 rounded-full overflow-hidden border border-slate-800">
            <div
              className="h-full bg-gradient-to-r from-teal-500 to-emerald-400 transition-all duration-300 rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <p className="text-[11px] text-slate-400 italic text-center">
            Asynchronous processing active — UI remains responsive while parsing documents and computing vector similarities.
          </p>
        </div>
      )}

      {/* Success Notification */}
      {successMessage && (
        <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-xl p-4 flex items-center gap-3 text-emerald-300 text-xs">
          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          <span className="font-medium">{successMessage}</span>
        </div>
      )}

      {/* Parsing Errors / Unreadable files warning */}
      {parsingErrors.length > 0 && (
        <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 space-y-2">
          <div className="flex items-center gap-2 text-amber-300 text-xs font-bold">
            <AlertTriangle className="w-4 h-4 text-amber-400" />
            <span>Document Parsing Warnings ({parsingErrors.length} file(s) flagged):</span>
          </div>
          <div className="space-y-1 pl-6 text-xs text-amber-200/90">
            {parsingErrors.map((err, idx) => (
              <div key={idx} className="flex items-center gap-2">
                <span className="font-mono text-[11px] bg-slate-900 px-1.5 py-0.5 rounded border border-amber-500/30">
                  {err.filename}
                </span>
                <span>— {err.reason} (scored 0% as unreadable)</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload Dual Columns: JD and Resumes */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Column 1: Job Description (JD) Input */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-emerald-400" />
                1. Target Job Description (JD)
              </h3>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-800 text-emerald-400 border border-slate-700">
                PDF / DOCX / TXT
              </span>
            </div>

            {/* Drag & Drop zone for JD */}
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDraggingJD(true); }}
              onDragLeave={() => setIsDraggingJD(false)}
              onDrop={handleJdDrop}
              onClick={() => jdInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-5 flex flex-col items-center justify-center cursor-pointer transition text-center ${
                isDraggingJD
                  ? 'border-emerald-400 bg-emerald-500/10'
                  : jdFile
                  ? 'border-emerald-500/60 bg-emerald-500/5'
                  : 'border-slate-800 hover:border-emerald-500/50 bg-slate-950/60'
              }`}
            >
              <UploadCloud className="w-7 h-7 text-emerald-400 mb-1.5" />
              <span className="text-xs font-semibold text-slate-200">
                {jdFile ? `Selected: ${jdFile.name} (${Math.round(jdFile.size / 1024)} KB)` : 'Drop Job Description File Here'}
              </span>
              <span className="text-[11px] text-slate-500 mt-0.5">
                or click to browse (.pdf, .docx, .txt)
              </span>
              <input
                ref={jdInputRef}
                type="file"
                accept=".pdf,.docx,.txt,.doc"
                onChange={handleJdInputChange}
                className="hidden"
              />
            </div>

            {/* Editable or Pasted JD Text Area */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-slate-300">
                  Or Paste / Edit Job Description Text:
                </label>
                <button
                  type="button"
                  onClick={handleLoadSampleJD}
                  className="text-[11px] text-emerald-400 hover:underline font-medium"
                >
                  Load TechNova Sample JD
                </button>
              </div>
              <textarea
                rows={7}
                value={jdTextInput}
                onChange={(e) => {
                  setJdTextInput(e.target.value);
                  setJdFile(null);
                }}
                placeholder="Paste the job opening requirements, required tech stack, responsibilities..."
                className="w-full bg-slate-950 border border-slate-800 rounded-xl p-3 text-xs text-slate-300 font-mono focus:outline-none focus:border-emerald-500 transition leading-relaxed"
              />
            </div>
          </div>

          <div className="text-[11px] text-slate-500 flex items-center gap-1.5 pt-2 border-t border-slate-800/80">
            <Check className="w-3.5 h-3.5 text-emerald-400" />
            <span>Extracts hard technical skills, good-to-have tools, and role responsibilities.</span>
          </div>
        </div>

        {/* Column 2: Multi-File Resume Batch Uploader (15-20 files) */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 space-y-4 flex flex-col justify-between">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <FileUp className="w-4 h-4 text-teal-400" />
                2. Multi-File Resume Batch (15–20 Resumes)
              </h3>
              <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded bg-slate-800 text-teal-400 border border-slate-700">
                Multi-Upload
              </span>
            </div>

            {/* Drag & drop multi-file input */}
            <div
              onDragOver={(e) => { e.preventDefault(); setIsDraggingResume(true); }}
              onDragLeave={() => setIsDraggingResume(false)}
              onDrop={handleResumeDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`border-2 border-dashed rounded-xl p-5 flex flex-col items-center justify-center cursor-pointer transition text-center ${
                isDraggingResume
                  ? 'border-teal-400 bg-teal-500/10'
                  : 'border-slate-800 hover:border-teal-500/50 bg-slate-950/60'
              }`}
            >
              <UploadCloud className="w-7 h-7 text-teal-400 mb-1.5" />
              <span className="text-xs font-semibold text-slate-200">
                {resumeFiles.length > 0
                  ? `${resumeFiles.length} Resume File(s) Selected`
                  : 'Drag & Drop 15 to 20 Resumes Here'}
              </span>
              <span className="text-[11px] text-slate-500 mt-0.5">
                Select multiple PDF, DOCX, or TXT files simultaneously
              </span>
              <input
                ref={fileInputRef}
                type="file"
                accept=".pdf,.docx,.txt,.doc"
                multiple
                onChange={handleResumeInputChange}
                className="hidden"
              />
            </div>

            {/* Selected File Badges / Roster */}
            <div className="bg-slate-950/80 border border-slate-800 rounded-xl p-3.5 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 font-semibold flex items-center gap-1.5">
                  <span>Selected Files Queue:</span>
                  <span className="text-teal-400 font-mono font-bold">
                    {resumeFiles.length} files
                  </span>
                </span>
                {resumeFiles.length > 0 && (
                  <button
                    type="button"
                    onClick={clearAllResumes}
                    className="text-[11px] text-rose-400 hover:underline font-medium"
                  >
                    Clear All
                  </button>
                )}
              </div>

              {resumeFiles.length === 0 ? (
                <div className="py-6 text-center text-xs text-slate-500">
                  <p>No new files selected yet.</p>
                  <p className="text-[11px] text-slate-400 mt-1">
                    Select 15–20 resumes to test batch ranking, or use the 18 preloaded hackathon resumes.
                  </p>
                </div>
              ) : (
                <div className="max-h-48 overflow-y-auto space-y-1.5 pr-1 text-xs">
                  {resumeFiles.map((file, idx) => {
                    const ext = file.name.split('.').pop()?.toUpperCase() || 'FILE';
                    return (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2 rounded-lg bg-slate-900 border border-slate-800/80 text-xs"
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-teal-300 font-bold">
                            {ext}
                          </span>
                          <span className="text-slate-200 truncate max-w-[220px]" title={file.name}>
                            {file.name}
                          </span>
                          <span className="text-[10px] text-slate-400 font-mono shrink-0">
                            ({Math.round(file.size / 1024)} KB)
                          </span>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeResumeFile(idx)}
                          className="text-slate-400 hover:text-rose-400 p-1 transition"
                          title="Remove file"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>

          {/* Action Button: Process & Rank Candidates */}
          <div className="pt-2">
            <button
              onClick={handleProcessAndRank}
              disabled={isProcessing || (resumeFiles.length === 0 && candidates.length === 0)}
              className="w-full py-3.5 px-5 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm transition flex items-center justify-center gap-2.5 shadow-lg shadow-emerald-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Sparkles className="w-4 h-4 text-slate-950" />
              <span>
                {isProcessing
                  ? `Processing ${resumeFiles.length} Resumes...`
                  : 'Process & Rank Candidates'}
              </span>
              <ArrowRight className="w-4 h-4 text-slate-950" />
            </button>
          </div>
        </div>
      </div>

      {/* Currently Ingested Dataset Summary */}
      <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>
            Active Pool: <strong className="text-white">{candidates.length} Candidate Resumes</strong> ranked against <strong className="text-white">{currentJD.title}</strong> ({currentJD.requiredHardSkills.length} required skills).
          </span>
        </div>
        <div className="text-[11px] font-mono text-slate-400">
          Default Weights: 50% Semantic Vector + 50% Explicit Keyword
        </div>
      </div>
    </div>
  );
};
