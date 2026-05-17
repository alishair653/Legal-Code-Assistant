'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Scale, ChevronRight, ChevronLeft, Gavel, Users, FileText,
  AlertTriangle, CheckCircle2, TrendingUp, TrendingDown, Info,
  RotateCcw, Loader2,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SidebarTrigger } from '@/components/ui/sidebar';

// ── Types ────────────────────────────────────────────────────────────────────

type Offense = { label: string; section: string; bailClass: 'bailable' | 'non-bailable' };
type EvidenceItem = { id: string; label: string; weight: number };

// ── Static data ──────────────────────────────────────────────────────────────

const OFFENSES: Offense[] = [
  { label: 'Theft (Chori)', section: 'PPC § 379', bailClass: 'bailable' },
  { label: 'Robbery', section: 'PPC § 392', bailClass: 'non-bailable' },
  { label: 'Fraud / Cheating', section: 'PPC § 420', bailClass: 'non-bailable' },
  { label: 'Murder (Qatl-i-Amd)', section: 'PPC § 302', bailClass: 'non-bailable' },
  { label: 'Hurt / Injury', section: 'PPC § 337', bailClass: 'bailable' },
  { label: 'Kidnapping', section: 'PPC § 365', bailClass: 'non-bailable' },
  { label: 'Defamation', section: 'PPC § 499', bailClass: 'bailable' },
  { label: 'Drug Possession', section: 'CNS Act § 9', bailClass: 'non-bailable' },
  { label: 'Cyber Crime', section: 'PECA § 20', bailClass: 'bailable' },
  { label: 'Corruption', section: 'NAB Ord.', bailClass: 'non-bailable' },
];

const EVIDENCE_ITEMS: EvidenceItem[] = [
  { id: 'cctv', label: 'CCTV / Video Footage', weight: 22 },
  { id: 'witness', label: 'Eyewitness Testimony', weight: 18 },
  { id: 'medical', label: 'Medical / Forensic Report', weight: 20 },
  { id: 'fir', label: 'FIR Filed Promptly', weight: 10 },
  { id: 'weapon', label: 'Weapon / Physical Evidence Recovered', weight: 20 },
  { id: 'confession', label: 'Accused Confession (voluntary)', weight: 15 },
  { id: 'digital', label: 'Digital / Call Records', weight: 14 },
  { id: 'chargesheet', label: 'Police Charge-sheet Complete', weight: 10 },
];

// ── Gauge component ──────────────────────────────────────────────────────────

function GaugeArc({ pct, color, size = 160 }: { pct: number; color: string; size?: number }) {
  const r = (size - 16) / 2;
  const cx = size / 2;
  const cy = size / 2;
  const startAngle = -210;
  const sweep = 240;
  const endAngle = startAngle + sweep * (pct / 100);
  const toRad = (deg: number) => (deg * Math.PI) / 180;
  const arcPath = (from: number, to: number) => {
    const x1 = cx + r * Math.cos(toRad(from));
    const y1 = cy + r * Math.sin(toRad(from));
    const x2 = cx + r * Math.cos(toRad(to));
    const y2 = cy + r * Math.sin(toRad(to));
    const large = to - from > 180 ? 1 : 0;
    return `M ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2}`;
  };

  return (
    <svg width={size} height={size * 0.75} viewBox={`0 0 ${size} ${size}`} className="-mb-8">
      <path d={arcPath(startAngle, startAngle + sweep)} fill="none" stroke="currentColor" strokeWidth="10" strokeLinecap="round" className="text-muted/30" />
      <path d={arcPath(startAngle, endAngle)} fill="none" stroke={color} strokeWidth="10" strokeLinecap="round" />
    </svg>
  );
}

// ── Result card ──────────────────────────────────────────────────────────────

function ResultMeter({ label, pct, color, icon: Icon }: { label: string; pct: number; color: string; icon: React.ElementType }) {
  const tier = pct >= 70 ? 'High' : pct >= 40 ? 'Moderate' : 'Low';
  return (
    <Card className="p-5 flex flex-col items-center text-center gap-1">
      <Icon className="w-5 h-5 mb-1" style={{ color }} />
      <p className="text-xs font-semibold text-muted-foreground font-sans uppercase tracking-wide">{label}</p>
      <GaugeArc pct={pct} color={color} />
      <p className="text-3xl font-extrabold" style={{ color }}>{pct}%</p>
      <span className={`text-xs font-semibold font-sans px-2 py-0.5 rounded-full ${
        pct >= 70 ? 'bg-red-500/10 text-red-500' : pct >= 40 ? 'bg-yellow-500/10 text-yellow-600' : 'bg-green-500/10 text-green-600'
      }`}>{tier} Risk</span>
    </Card>
  );
}

// ── Main page ────────────────────────────────────────────────────────────────

export default function CasePredictorPage() {
  const [step, setStep] = useState(0);
  const [offense, setOffense] = useState<Offense | null>(null);
  const [witnesses, setWitnesses] = useState(0);
  const [priors, setPriors] = useState<'none' | 'minor' | 'major'>('none');
  const [evidence, setEvidence] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{ bail: number; conviction: number; factors: string[] } | null>(null);

  const toggleEvidence = (id: string) => {
    setEvidence((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const canNext0 = offense !== null;
  const canNext1 = true;

  const computeResult = async () => {
    setLoading(true);
    await new Promise((r) => setTimeout(r, 1800));

    // Evidence score
    const evidenceScore = EVIDENCE_ITEMS.filter((e) => evidence.has(e.id)).reduce((sum, e) => sum + e.weight, 0);
    const maxEvidence = EVIDENCE_ITEMS.reduce((s, e) => s + e.weight, 0);
    const evidencePct = Math.round((evidenceScore / maxEvidence) * 100);

    // Conviction probability
    let conviction = evidencePct;
    if (witnesses >= 3) conviction = Math.min(conviction + 15, 98);
    else if (witnesses >= 1) conviction = Math.min(conviction + 7, 95);
    if (priors === 'major') conviction = Math.min(conviction + 12, 98);
    else if (priors === 'minor') conviction = Math.min(conviction + 5, 95);
    conviction = Math.max(conviction, 8);

    // Bail probability
    let bail = offense!.bailClass === 'bailable' ? 75 : 30;
    if (evidencePct > 60) bail = Math.max(bail - 15, 5);
    if (priors === 'major') bail = Math.max(bail - 20, 5);
    else if (priors === 'minor') bail = Math.max(bail - 10, 5);
    if (witnesses === 0) bail = Math.min(bail + 10, 90);
    bail = Math.min(bail, 95);

    // Factors
    const factors: string[] = [];
    if (offense!.bailClass === 'non-bailable') factors.push(`${offense!.section} is a non-bailable offense — court discretion required for bail.`);
    else factors.push(`${offense!.section} is a bailable offense — bail is a right of the accused.`);
    if (evidence.has('cctv')) factors.push('Video/CCTV evidence significantly strengthens prosecution case.');
    if (evidence.has('witness')) factors.push(`${witnesses} witness(es) on record — corroborating testimony increases conviction likelihood.`);
    if (priors === 'major') factors.push('Prior criminal record (major) adversely affects bail prospects.');
    if (evidencePct < 30) factors.push('Weak evidence chain — prosecution case may face challenges in court.');
    if (evidence.has('confession')) factors.push('Voluntary confession is admissible under QSO Art. 40 and carries significant weight.');

    setResult({ bail, conviction, factors });
    setLoading(false);
    setStep(3);
  };

  const reset = () => {
    setStep(0);
    setOffense(null);
    setWitnesses(0);
    setPriors('none');
    setEvidence(new Set());
    setResult(null);
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-background">
      <header className="h-12 flex items-center border-b border-border px-4 shrink-0">
        <SidebarTrigger className="mr-2" />
        <Scale className="w-4 h-4 text-accent mr-2" />
        <span className="text-sm font-semibold">Case Predictor</span>
        <span className="ml-2 text-xs text-muted-foreground font-sans">AI-powered outcome estimation</span>
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-4 py-8 space-y-6">

          {/* Progress bar */}
          {step < 3 && (
            <div className="flex items-center gap-2">
              {['Offense', 'Evidence', 'Details'].map((label, i) => (
                <div key={label} className="flex items-center gap-2 flex-1">
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                    step > i ? 'gradient-gold text-primary' : step === i ? 'bg-accent text-white' : 'bg-muted text-muted-foreground'
                  }`}>{step > i ? '✓' : i + 1}</div>
                  <span className={`text-xs font-sans hidden sm:block ${step === i ? 'text-foreground font-semibold' : 'text-muted-foreground'}`}>{label}</span>
                  {i < 2 && <div className={`flex-1 h-0.5 rounded-full transition-colors ${step > i ? 'bg-accent' : 'bg-border'}`} />}
                </div>
              ))}
            </div>
          )}

          {/* Disclaimer */}
          {step === 0 && (
            <div className="flex items-start gap-2 p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
              <AlertTriangle className="w-4 h-4 text-yellow-600 shrink-0 mt-0.5" />
              <p className="text-xs text-yellow-700 dark:text-yellow-400 font-sans leading-relaxed">
                This tool provides <strong>statistical estimates only</strong> based on Pakistani legal parameters. It does not constitute legal advice. Consult a qualified lawyer for your actual case.
              </p>
            </div>
          )}

          <AnimatePresence mode="wait">

            {/* ── Step 0: Choose Offense ── */}
            {step === 0 && (
              <motion.div key="s0" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="space-y-3">
                <div>
                  <h2 className="text-lg font-bold mb-1">Select the offense</h2>
                  <p className="text-sm text-muted-foreground font-sans">Choose the primary charge or offence type</p>
                </div>
                <div className="grid sm:grid-cols-2 gap-2">
                  {OFFENSES.map((o) => (
                    <button
                      key={o.section}
                      onClick={() => setOffense(o)}
                      className={`flex items-center justify-between p-3 rounded-xl border text-left transition-all ${
                        offense?.section === o.section
                          ? 'border-accent bg-accent/10'
                          : 'border-border hover:border-accent/40 hover:bg-muted/40'
                      }`}
                    >
                      <div>
                        <p className="text-sm font-medium">{o.label}</p>
                        <p className="text-xs text-muted-foreground font-sans">{o.section}</p>
                      </div>
                      <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded-full font-sans ${
                        o.bailClass === 'bailable' ? 'bg-green-500/10 text-green-600' : 'bg-red-500/10 text-red-500'
                      }`}>
                        {o.bailClass === 'bailable' ? 'Bailable' : 'Non-Bailable'}
                      </span>
                    </button>
                  ))}
                </div>
                <div className="flex justify-end pt-2">
                  <Button onClick={() => setStep(1)} disabled={!canNext0} className="gradient-gold text-primary rounded-xl font-semibold">
                    Next <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </motion.div>
            )}

            {/* ── Step 1: Evidence ── */}
            {step === 1 && (
              <motion.div key="s1" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="space-y-3">
                <div>
                  <h2 className="text-lg font-bold mb-1">Available evidence</h2>
                  <p className="text-sm text-muted-foreground font-sans">Select all types of evidence available in this case</p>
                </div>
                <div className="grid sm:grid-cols-2 gap-2">
                  {EVIDENCE_ITEMS.map((item) => {
                    const checked = evidence.has(item.id);
                    return (
                      <button
                        key={item.id}
                        onClick={() => toggleEvidence(item.id)}
                        className={`flex items-center gap-3 p-3 rounded-xl border text-left transition-all ${
                          checked ? 'border-accent bg-accent/10' : 'border-border hover:border-accent/40 hover:bg-muted/40'
                        }`}
                      >
                        <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 ${
                          checked ? 'border-accent bg-accent' : 'border-border'
                        }`}>
                          {checked && <CheckCircle2 className="w-3 h-3 text-white" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium leading-tight">{item.label}</p>
                          <p className="text-xs text-muted-foreground font-sans">Weight: +{item.weight}pts</p>
                        </div>
                      </button>
                    );
                  })}
                </div>
                <div className="flex justify-between pt-2">
                  <Button variant="outline" onClick={() => setStep(0)} className="rounded-xl font-sans">
                    <ChevronLeft className="w-4 h-4 mr-1" /> Back
                  </Button>
                  <Button onClick={() => setStep(2)} className="gradient-gold text-primary rounded-xl font-semibold">
                    Next <ChevronRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </motion.div>
            )}

            {/* ── Step 2: Additional details ── */}
            {step === 2 && (
              <motion.div key="s2" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} className="space-y-4">
                <div>
                  <h2 className="text-lg font-bold mb-1">Additional case details</h2>
                  <p className="text-sm text-muted-foreground font-sans">These factors affect bail and conviction likelihood</p>
                </div>

                {/* Witnesses */}
                <Card className="p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-accent" />
                    <p className="text-sm font-semibold">Number of witnesses</p>
                  </div>
                  <div className="flex gap-2">
                    {[0, 1, 2, 3, 4].map((n) => (
                      <button
                        key={n}
                        onClick={() => setWitnesses(n)}
                        className={`flex-1 py-2 rounded-xl text-sm font-semibold border transition-all font-sans ${
                          witnesses === n ? 'border-accent bg-accent/10 text-accent' : 'border-border text-muted-foreground hover:border-accent/40'
                        }`}
                      >
                        {n === 4 ? '4+' : n}
                      </button>
                    ))}
                  </div>
                </Card>

                {/* Prior record */}
                <Card className="p-4 space-y-3">
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-accent" />
                    <p className="text-sm font-semibold">Prior criminal record</p>
                  </div>
                  <div className="flex gap-2">
                    {([['none', 'None'], ['minor', 'Minor'], ['major', 'Major']] as const).map(([val, label]) => (
                      <button
                        key={val}
                        onClick={() => setPriors(val)}
                        className={`flex-1 py-2 rounded-xl text-sm font-semibold border transition-all font-sans ${
                          priors === val ? 'border-accent bg-accent/10 text-accent' : 'border-border text-muted-foreground hover:border-accent/40'
                        }`}
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </Card>

                {/* Summary */}
                <Card className="p-4 bg-muted/30 space-y-2">
                  <p className="text-xs font-semibold text-muted-foreground font-sans uppercase tracking-wide">Case Summary</p>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground font-sans">Offense</span>
                    <span className="font-medium">{offense?.label} <span className="text-xs text-muted-foreground">({offense?.section})</span></span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground font-sans">Evidence items</span>
                    <span className="font-medium">{evidence.size} selected</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground font-sans">Witnesses</span>
                    <span className="font-medium">{witnesses === 4 ? '4+' : witnesses}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground font-sans">Prior record</span>
                    <span className="font-medium capitalize">{priors}</span>
                  </div>
                </Card>

                <div className="flex justify-between pt-1">
                  <Button variant="outline" onClick={() => setStep(1)} className="rounded-xl font-sans">
                    <ChevronLeft className="w-4 h-4 mr-1" /> Back
                  </Button>
                  <Button
                    onClick={computeResult}
                    disabled={loading}
                    className="gradient-gold text-primary rounded-xl font-semibold px-6"
                  >
                    {loading ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Analyzing...</> : <><Gavel className="w-4 h-4 mr-2" /> Predict Outcome</>}
                  </Button>
                </div>
              </motion.div>
            )}

            {/* ── Step 3: Results ── */}
            {step === 3 && result && (
              <motion.div key="s3" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-bold">Prediction Results</h2>
                    <p className="text-sm text-muted-foreground font-sans">{offense?.label} — {offense?.section}</p>
                  </div>
                  <Button variant="outline" size="sm" className="rounded-xl font-sans" onClick={reset}>
                    <RotateCcw className="w-3.5 h-3.5 mr-1.5" /> New Case
                  </Button>
                </div>

                {/* Meters */}
                <div className="grid sm:grid-cols-2 gap-4">
                  <ResultMeter label="Bail Probability" pct={result.bail} color={result.bail >= 60 ? '#22c55e' : result.bail >= 35 ? '#f59e0b' : '#ef4444'} icon={result.bail >= 50 ? TrendingUp : TrendingDown} />
                  <ResultMeter label="Conviction Risk" pct={result.conviction} color={result.conviction >= 70 ? '#ef4444' : result.conviction >= 40 ? '#f59e0b' : '#22c55e'} icon={result.conviction >= 50 ? TrendingUp : TrendingDown} />
                </div>

                {/* Key Factors */}
                <Card className="p-5 space-y-3">
                  <div className="flex items-center gap-2">
                    <Info className="w-4 h-4 text-accent" />
                    <p className="text-sm font-semibold">Key Factors Considered</p>
                  </div>
                  <ul className="space-y-2">
                    {result.factors.map((f, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm font-sans text-muted-foreground">
                        <span className="w-1.5 h-1.5 rounded-full bg-accent mt-2 shrink-0" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </Card>

                {/* Legal references */}
                <Card className="p-5 space-y-2 bg-muted/30">
                  <p className="text-xs font-semibold text-muted-foreground font-sans uppercase tracking-wide">Relevant Provisions</p>
                  <div className="flex flex-wrap gap-1.5">
                    {[offense!.section, 'CrPC § 497', 'QSO Art. 17', 'Constitution Art. 10A'].map((s) => (
                      <span key={s} className="text-xs px-2 py-1 rounded-lg bg-accent/10 text-accent border border-accent/20 font-sans">{s}</span>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground font-sans mt-2">
                    This estimate is computed from evidence weight, witness count, prior record, and the bail classification of {offense?.section} under Schedule II CrPC.
                  </p>
                </Card>

                {/* Disclaimer */}
                <div className="flex items-start gap-2 p-3 rounded-xl bg-yellow-500/10 border border-yellow-500/20">
                  <AlertTriangle className="w-4 h-4 text-yellow-600 shrink-0 mt-0.5" />
                  <p className="text-xs text-yellow-700 dark:text-yellow-400 font-sans">
                    These figures are <strong>statistical estimates</strong> for educational purposes only. Actual court outcomes depend on judicial discretion, procedural factors, and legal representation. Always consult a qualified advocate.
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
