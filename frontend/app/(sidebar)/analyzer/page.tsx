'use client';

import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText, Upload, X, CheckCircle2, AlertTriangle, Info,
  RotateCcw, Loader2, ShieldCheck, FileWarning, Lightbulb,
  TrendingUp, ClipboardList,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SidebarTrigger } from '@/components/ui/sidebar';

// ── Types ────────────────────────────────────────────────────────────────────

type DocType = 'fir' | 'contract' | 'notice' | 'general';
type RiskLevel = 'low' | 'medium' | 'high';

interface AnalysisResult {
  docType: DocType;
  summary: string;
  extractedData: { label: string; value: string }[];
  strengths: string[];
  weaknesses: string[];
  missing: string[];
  recommendations: string[];
  risk: RiskLevel;
  sections: string[];
}

// ── Mock analysis per document type ─────────────────────────────────────────

const MOCK_RESULTS: Record<DocType, AnalysisResult> = {
  fir: {
    docType: 'fir',
    summary: 'First Information Report (FIR) filed under CrPC Section 154. The document describes a robbery incident with identified accused and recovered evidence. Overall structure is adequate but missing some mandatory fields.',
    extractedData: [
      { label: 'FIR Type', value: 'Cognizable Offense — Robbery' },
      { label: 'Sections Cited', value: 'PPC § 392, PPC § 382, PPC § 34' },
      { label: 'Cognizable', value: 'Yes' },
      { label: 'Bailable', value: 'No' },
      { label: 'Incident Time', value: 'Mentioned' },
      { label: 'Accused Description', value: 'Partial — no CNIC recorded' },
    ],
    strengths: [
      'FIR registered promptly under CrPC Section 154 within 24 hours of incident.',
      'Correct PPC sections cited for robbery offense (Section 392).',
      'Complainant statement recorded in first person, chronologically.',
      'Place of occurrence clearly mentioned with landmark reference.',
    ],
    weaknesses: [
      'Accused CNIC or identification number not recorded — weakens case.',
      'Property value not formally assessed or documented.',
      'No mention of witness statements or corroborating evidence.',
    ],
    missing: [
      'CNIC / biometric details of accused',
      'Formal valuation of stolen property',
      'Medico-legal certificate (if applicable)',
      'Witness names and contact details',
    ],
    recommendations: [
      'Add supplementary statement (Section 161 CrPC) to include witness accounts.',
      'Request formal property valuation from valuator to strengthen charge sheet.',
      'File application for CCTV footage preservation under Section 154 CrPC read with PECA.',
      'Consult SP Office if investigation is delayed beyond 14-day period.',
    ],
    risk: 'medium',
    sections: ['CrPC § 154', 'PPC § 392', 'PPC § 382', 'PPC § 34', 'CrPC § 161'],
  },
  contract: {
    docType: 'contract',
    summary: 'Civil agreement between two parties. The contract contains standard commercial terms but several clauses pose risk to the signing party. Jurisdiction and dispute resolution clauses are absent.',
    extractedData: [
      { label: 'Contract Type', value: 'Commercial Agreement' },
      { label: 'Governing Law', value: 'Not specified' },
      { label: 'Dispute Resolution', value: 'Absent' },
      { label: 'Termination Clause', value: 'Present — 30 days notice' },
      { label: 'Penalty Clause', value: 'Present — potentially unfair' },
      { label: 'Signatures Required', value: '2 parties + witnesses' },
    ],
    strengths: [
      'Clear identification of both contracting parties with CNIC references.',
      'Payment terms and schedule are explicitly defined.',
      'Termination clause provides 30-day notice period — reasonable.',
      'Force majeure clause present covering natural disasters.',
    ],
    weaknesses: [
      'No governing law clause — ambiguous which jurisdiction applies.',
      'Penalty clause (Clause 7) is one-sided and may be unenforceable under CPC.',
      'No dispute resolution / arbitration mechanism specified.',
      'Intellectual property ownership not addressed.',
    ],
    missing: [
      'Governing law and jurisdiction clause',
      'Arbitration / dispute resolution clause',
      'Confidentiality / NDA clause',
      'Intellectual property assignment clause',
      'Indemnification clause',
    ],
    recommendations: [
      'Add jurisdiction clause specifying courts of [City] under CPC Section 20.',
      'Include arbitration clause under Arbitration Act 1940 to avoid costly litigation.',
      'Have a lawyer review Clause 7 penalty — may violate Contract Act 1872 Section 74.',
      'Add confidentiality clause if any sensitive business information is shared.',
    ],
    risk: 'high',
    sections: ['Contract Act 1872 § 74', 'CPC § 20', 'Arbitration Act 1940', 'Contract Act § 23'],
  },
  notice: {
    docType: 'notice',
    summary: 'Legal notice served under relevant statutory provisions. The notice sets out grievances and demands remedial action within the stipulated period. Response is time-sensitive.',
    extractedData: [
      { label: 'Notice Type', value: 'Legal Notice — Demand' },
      { label: 'Response Period', value: '14 days from receipt' },
      { label: 'Mode of Service', value: 'Registered Post' },
      { label: 'Relief Sought', value: 'Monetary compensation' },
      { label: 'Legal Basis', value: 'Contract breach' },
      { label: 'Consequence if Ignored', value: 'Civil suit / criminal complaint' },
    ],
    strengths: [
      'Notice properly served via registered post — satisfies legal service requirements.',
      'Clear statement of grievance and legal basis cited.',
      '14-day response window is standard and reasonable.',
      'Consequences of non-compliance clearly stated.',
    ],
    weaknesses: [
      'Amount of claimed damages not specifically quantified.',
      'No mention of previous correspondence or demand letters.',
    ],
    missing: [
      'Specific monetary claim amount with calculation',
      'Supporting documentary evidence list',
      'Reference to prior communication / attempts at resolution',
    ],
    recommendations: [
      'Respond within 14 days to avoid suit — engage a lawyer immediately.',
      'Gather all relevant documents (contracts, receipts, communications) before responding.',
      'Do not ignore — non-response can be used as admission in civil court.',
      'Counter-notice may be served if you dispute the claims.',
    ],
    risk: 'medium',
    sections: ['CPC § 80', 'Contract Act 1872', 'Limitation Act 1908'],
  },
  general: {
    docType: 'general',
    summary: 'General legal document analyzed. The document contains legal provisions and clauses relevant to Pakistani law. A thorough review has been completed based on the document content.',
    extractedData: [
      { label: 'Document Type', value: 'General Legal Document' },
      { label: 'Jurisdiction', value: 'Pakistan' },
      { label: 'Language', value: 'English / Urdu mixed' },
      { label: 'Pages Analyzed', value: 'Complete document' },
      { label: 'Legal Provisions', value: 'Referenced throughout' },
    ],
    strengths: [
      'Document follows formal legal language standards.',
      'Key provisions are clearly numbered and identified.',
    ],
    weaknesses: [
      'Some clauses require clarification for enforceability.',
      'Missing standard boilerplate provisions.',
    ],
    missing: ['Supporting annexures', 'Authentication / attestation', 'Date and place of execution'],
    recommendations: [
      'Have this document reviewed by a qualified legal practitioner before relying on it.',
      'Ensure all parties sign with witnesses present.',
      'Keep authenticated copies for your records.',
    ],
    risk: 'low',
    sections: ['Contract Act 1872', 'Qanun-e-Shahadat Order 1984'],
  },
};

// ── Helpers ──────────────────────────────────────────────────────────────────

const DOC_TYPE_LABELS: Record<DocType, string> = {
  fir: 'First Information Report (FIR)',
  contract: 'Contract / Agreement',
  notice: 'Legal Notice',
  general: 'General Legal Document',
};

const RISK_CONFIG: Record<RiskLevel, { label: string; color: string; bg: string }> = {
  low: { label: 'Low Risk', color: 'text-green-600', bg: 'bg-green-500/10' },
  medium: { label: 'Medium Risk', color: 'text-yellow-600', bg: 'bg-yellow-500/10' },
  high: { label: 'High Risk', color: 'text-red-500', bg: 'bg-red-500/10' },
};

const LOADING_STEPS = ['Uploading document...', 'Extracting text...', 'Analyzing content...', 'Identifying legal provisions...'];

function detectDocType(name: string): DocType {
  const lower = name.toLowerCase();
  if (lower.includes('fir') || lower.includes('first information')) return 'fir';
  if (lower.includes('contract') || lower.includes('agreement')) return 'contract';
  if (lower.includes('notice')) return 'notice';
  return 'general';
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function DocumentAnalyzerPage() {
  const [file, setFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [loadingStep, setLoadingStep] = useState(-1);
  const [result, setResult] = useState<AnalysisResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = (f: File) => {
    if (!f.type.includes('pdf') && !f.type.includes('image') && !f.name.endsWith('.pdf')) return;
    setFile(f);
    setResult(null);
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }, []);

  const runAnalysis = async () => {
    if (!file) return;
    setResult(null);

    for (let i = 0; i < LOADING_STEPS.length; i++) {
      setLoadingStep(i);
      await new Promise((r) => setTimeout(r, 900));
    }

    const docType = detectDocType(file.name);
    setResult(MOCK_RESULTS[docType]);
    setLoadingStep(-1);
  };

  const reset = () => { setFile(null); setResult(null); setLoadingStep(-1); };

  const risk = result ? RISK_CONFIG[result.risk] : null;

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-background">
      <header className="h-12 flex items-center border-b border-border px-4 shrink-0">
        <SidebarTrigger className="mr-2" />
        <FileText className="w-4 h-4 text-accent mr-2" />
        <span className="text-sm font-semibold">Document Analyzer</span>
        <span className="ml-2 text-xs text-muted-foreground font-sans">AI-powered legal document review</span>
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">

          {/* Upload area */}
          {!result && loadingStep === -1 && (
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>

              {/* Drop zone */}
              <div
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={onDrop}
                onClick={() => !file && fileInputRef.current?.click()}
                className={`relative border-2 border-dashed rounded-2xl p-10 text-center transition-all cursor-pointer ${
                  isDragging ? 'border-accent bg-accent/10' : file ? 'border-accent/40 bg-accent/5' : 'border-border hover:border-accent/40 hover:bg-muted/40'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".pdf,image/*"
                  className="hidden"
                  onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = ''; }}
                />

                {file ? (
                  <div className="space-y-2">
                    <div className="w-14 h-14 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto">
                      <FileText className="w-7 h-7 text-accent" />
                    </div>
                    <p className="font-semibold text-sm">{file.name}</p>
                    <p className="text-xs text-muted-foreground font-sans">{(file.size / 1024).toFixed(1)} KB</p>
                    <button
                      onClick={(e) => { e.stopPropagation(); setFile(null); }}
                      className="text-xs text-muted-foreground hover:text-destructive transition-colors font-sans flex items-center gap-1 mx-auto"
                    >
                      <X className="w-3 h-3" /> Remove file
                    </button>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mx-auto">
                      <Upload className="w-7 h-7 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">Drop your document here</p>
                      <p className="text-xs text-muted-foreground font-sans mt-1">or click to browse — PDF or image (max 10 MB)</p>
                    </div>
                    <div className="flex justify-center gap-2 flex-wrap">
                      {['FIR', 'Contract', 'Legal Notice', 'Court Order'].map((t) => (
                        <span key={t} className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground font-sans border border-border">{t}</span>
                      ))}
                    </div>
                  </div>
                )}
              </div>

              {/* Info note */}
              <div className="flex items-start gap-2 p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 mt-4">
                <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                <p className="text-xs text-blue-700 dark:text-blue-400 font-sans">
                  Supports FIRs, contracts, legal notices, and court orders. The AI will extract text, identify Pakistani legal provisions (PPC, CrPC, QSO), and provide a comprehensive review.
                </p>
              </div>

              {file && (
                <Button
                  onClick={runAnalysis}
                  className="w-full gradient-gold text-primary rounded-xl font-semibold h-11 mt-4"
                >
                  <ClipboardList className="w-4 h-4 mr-2" /> Analyze Document
                </Button>
              )}
            </motion.div>
          )}

          {/* Loading */}
          {loadingStep >= 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16 space-y-6">
              <div className="w-16 h-16 rounded-2xl gradient-navy flex items-center justify-center mx-auto">
                <Loader2 className="w-8 h-8 text-accent animate-spin" />
              </div>
              <div className="space-y-3 max-w-xs mx-auto">
                {LOADING_STEPS.map((step, i) => (
                  <div key={step} className={`flex items-center gap-3 text-sm font-sans transition-all ${i <= loadingStep ? 'opacity-100' : 'opacity-25'}`}>
                    {i < loadingStep
                      ? <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                      : i === loadingStep
                        ? <Loader2 className="w-4 h-4 text-accent animate-spin shrink-0" />
                        : <div className="w-4 h-4 rounded-full border-2 border-border shrink-0" />}
                    <span className={i === loadingStep ? 'text-foreground font-medium' : 'text-muted-foreground'}>{step}</span>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Results */}
          <AnimatePresence>
            {result && (
              <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">

                {/* Header */}
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold">Analysis Complete</h2>
                    <p className="text-sm text-muted-foreground font-sans">{DOC_TYPE_LABELS[result.docType]}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full font-sans ${risk?.bg} ${risk?.color}`}>
                      {risk?.label}
                    </span>
                    <Button variant="outline" size="sm" className="rounded-xl font-sans" onClick={reset}>
                      <RotateCcw className="w-3.5 h-3.5 mr-1.5" /> New
                    </Button>
                  </div>
                </div>

                {/* Summary */}
                <Card className="p-4 bg-muted/30">
                  <p className="text-xs font-semibold text-muted-foreground font-sans uppercase tracking-wide mb-2">Summary</p>
                  <p className="text-sm font-sans leading-relaxed">{result.summary}</p>
                </Card>

                {/* Extracted data */}
                <Card className="p-4">
                  <p className="text-xs font-semibold text-muted-foreground font-sans uppercase tracking-wide mb-3">Extracted Information</p>
                  <div className="space-y-2">
                    {result.extractedData.map((d) => (
                      <div key={d.label} className="flex items-start justify-between gap-4 text-sm">
                        <span className="text-muted-foreground font-sans shrink-0">{d.label}</span>
                        <span className="font-medium text-right">{d.value}</span>
                      </div>
                    ))}
                  </div>
                </Card>

                {/* Strengths */}
                <Card className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <ShieldCheck className="w-4 h-4 text-green-500" />
                    <p className="text-sm font-semibold">Strengths ({result.strengths.length})</p>
                  </div>
                  <ul className="space-y-2">
                    {result.strengths.map((s, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm font-sans text-muted-foreground">
                        <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                        {s}
                      </li>
                    ))}
                  </ul>
                </Card>

                {/* Weaknesses */}
                <Card className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <FileWarning className="w-4 h-4 text-red-500" />
                    <p className="text-sm font-semibold">Weaknesses ({result.weaknesses.length})</p>
                  </div>
                  <ul className="space-y-2">
                    {result.weaknesses.map((w, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm font-sans text-muted-foreground">
                        <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                        {w}
                      </li>
                    ))}
                  </ul>
                </Card>

                {/* Missing elements */}
                {result.missing.length > 0 && (
                  <Card className="p-4">
                    <div className="flex items-center gap-2 mb-3">
                      <AlertTriangle className="w-4 h-4 text-yellow-500" />
                      <p className="text-sm font-semibold">Missing Elements ({result.missing.length})</p>
                    </div>
                    <ul className="space-y-1.5">
                      {result.missing.map((m, i) => (
                        <li key={i} className="flex items-center gap-2 text-sm font-sans text-muted-foreground">
                          <span className="w-1.5 h-1.5 rounded-full bg-yellow-500 shrink-0" />
                          {m}
                        </li>
                      ))}
                    </ul>
                  </Card>
                )}

                {/* Recommendations */}
                <Card className="p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <Lightbulb className="w-4 h-4 text-accent" />
                    <p className="text-sm font-semibold">Recommendations</p>
                  </div>
                  <ul className="space-y-2">
                    {result.recommendations.map((r, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm font-sans text-muted-foreground">
                        <TrendingUp className="w-4 h-4 text-accent shrink-0 mt-0.5" />
                        {r}
                      </li>
                    ))}
                  </ul>
                </Card>

                {/* Legal sections */}
                <Card className="p-4 bg-muted/30">
                  <p className="text-xs font-semibold text-muted-foreground font-sans uppercase tracking-wide mb-2">Referenced Legal Provisions</p>
                  <div className="flex flex-wrap gap-1.5">
                    {result.sections.map((s) => (
                      <span key={s} className="text-xs px-2 py-1 rounded-lg bg-accent/10 text-accent border border-accent/20 font-sans">{s}</span>
                    ))}
                  </div>
                </Card>

                {/* Disclaimer */}
                <div className="flex items-start gap-2 p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
                  <AlertTriangle className="w-4 h-4 text-yellow-600 shrink-0 mt-0.5" />
                  <p className="text-xs text-yellow-700 dark:text-yellow-400 font-sans">
                    This analysis is for <strong>informational purposes only</strong> and does not constitute legal advice. Consult a qualified Pakistani lawyer before taking any legal action based on this review.
                  </p>
                </div>

              </motion.div>
            )}
          </AnimatePresence>

        </div>
      </div>
    </div>
  );
}
