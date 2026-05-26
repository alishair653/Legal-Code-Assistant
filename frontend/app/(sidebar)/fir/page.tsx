'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  FileText, ChevronRight, ChevronLeft, Copy, Printer,
  Download, CheckCircle, FileCheck,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { toast } from 'sonner';

const DISTRICTS = [
  'Lahore', 'Karachi', 'Islamabad', 'Rawalpindi', 'Peshawar',
  'Quetta', 'Faisalabad', 'Multan', 'Hyderabad', 'Sialkot',
  'Gujranwala', 'Bahawalpur', 'Sargodha', 'Abbottabad',
];

const EXAMPLES = [
  {
    label: 'Mobile Snatching',
    text: 'Last night at 10 PM, my mobile phone was snatched at Gulshan Market. The phone was an iPhone 13 Pro worth Rs. 150,000. Two suspects aged 25-30, wearing black shirts, arrived on a motorcycle. They pointed a pistol at me, snatched the phone, and fled.',
  },
  {
    label: 'House Robbery',
    text: 'At 2 AM, three unknown persons forcibly broke into my house by breaking the front door. They took jewelry, cash, and valuables totaling Rs. 500,000. They also pushed my wife, causing her injuries. All three fled after committing the crime.',
  },
  {
    label: 'Fraud / Cheating',
    text: 'Muhammad Imran received Rs. 200,000 from me as a business investment and promised to return it within 3 months. Six months have passed and he has neither returned the money nor answered calls. I have learned that he has cheated several other people in the same manner.',
  },
];

function detectSections(text: string) {
  const lower = text.toLowerCase();
  const sections: string[] = [];
  let bailable = true;

  if (lower.includes('chori') || lower.includes('snatch') || lower.includes('mobile') || lower.includes('phone chin')) {
    sections.push('Section 392 PPC — Robbery', 'Section 382 PPC — Theft after preparation for hurt');
    bailable = false;
  }
  if (lower.includes('ghar') && (lower.includes('ghusa') || lower.includes('daakhil') || lower.includes('tood'))) {
    sections.push('Section 449 PPC — House-trespass', 'Section 395 PPC — Dacoity');
    bailable = false;
  }
  if (lower.includes('fraud') || lower.includes('shareeda') || lower.includes('paisa wapas') || lower.includes('investment')) {
    sections.push('Section 420 PPC — Cheating', 'Section 406 PPC — Criminal breach of trust');
    bailable = false;
  }
  if (lower.includes('maar') || lower.includes('murder') || lower.includes('qatl')) {
    sections.push('Section 302 PPC — Qatl-i-Amd (Murder)', 'Section 311 PPC — Qatl');
    bailable = false;
  }
  if (lower.includes('pistol') || lower.includes('gun') || lower.includes('hathiyar')) {
    sections.push('Section 13 Arms Act 1878 — Unlawful possession of weapon');
  }
  if (lower.includes('chot') || lower.includes('hurt') || lower.includes('zakhm')) {
    sections.push('Section 337-A PPC — Shajjah (Causing hurt)');
    bailable = true;
  }
  if (sections.length === 0) {
    sections.push('Section 154 CrPC — Registration of FIR', 'Section 7 PPC — General offence');
    bailable = true;
  }

  return { sections, bailable, cognizable: !bailable };
}

function generateFIR(incident: string, details: typeof INIT_DETAILS): string {
  const now = new Date();
  const dateStr = now.toLocaleDateString('en-PK', { day: '2-digit', month: 'long', year: 'numeric' });
  const timeStr = now.toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' });
  const firNo = Math.floor(Math.random() * 900) + 100;
  const { sections, cognizable, bailable } = detectSections(incident);

  return `FIRST INFORMATION REPORT
(Under Section 154 Cr.P.C.)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

District:         ${details.district}
Police Station:   ${details.station}
FIR No.:          ${firNo}/${now.getFullYear()}
Date:             ${dateStr}
Time:             ${timeStr}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

COMPLAINANT DETAILS

Name:             ${details.name}
Father's Name:    ${details.fatherName}
Address:          ${details.address}
CNIC:             ${details.cnic || 'Not Provided'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

STATEMENT OF COMPLAINANT

${incident}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

OFFENCES ALLEGED

${sections.map((s, i) => `  ${i + 1}. ${s}`).join('\n')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

NATURE OF OFFENCE
Cognizable:       ${cognizable ? 'Yes' : 'No'}
Bailable:         ${bailable ? 'Yes' : 'No'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Complainant Signature          Officer in Charge

Name: ${details.name}          Name: ____________________
Date: ${dateStr}               Designation: ______________
                               Badge No.: ________________

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Note: Verify all legal sections with a qualified attorney.`;
}

const INIT_DETAILS = { name: '', fatherName: '', address: '', cnic: '', district: 'Lahore', station: '' };
const LOADING_STEPS = ['Analyzing incident...', 'Identifying legal sections...', 'Generating FIR document...'];

export default function FIRGeneratorPage() {
  const [step, setStep] = useState(1);
  const [incident, setIncident] = useState('');
  const [details, setDetails] = useState(INIT_DETAILS);
  const [firText, setFirText] = useState('');
  const [loading, setLoading] = useState(false);
  const [loadingIdx, setLoadingIdx] = useState(0);
  const [copied, setCopied] = useState(false);

  const canNext1 = incident.trim().length > 0;
  const canGenerate = details.name && details.fatherName && details.address && details.district && details.station;

  const handleGenerate = async () => {
    setLoading(true);
    setLoadingIdx(0);

    // Detect incident type from text for the API
    const lower = incident.toLowerCase();
    const type = lower.includes('snatch') || lower.includes('mobile') ? 'Mobile Snatching'
      : lower.includes('robbery') || lower.includes('ghar') ? 'House Robbery'
      : lower.includes('fraud') || lower.includes('invest') ? 'Fraud / Cheating'
      : lower.includes('murder') || lower.includes('qatl') ? 'Murder'
      : 'General Offense';

    try {
      // Step 1 animation
      setLoadingIdx(0);
      await new Promise((r) => setTimeout(r, 800));
      setLoadingIdx(1);

      // Call real Groq API to get sections + formal statement
      const res = await fetch('/api/generate-fir', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ incident, type }),
      });

      setLoadingIdx(2);
      await new Promise((r) => setTimeout(r, 600));

      if (!res.ok) throw new Error('API error');

      const data = await res.json();

      // Build FIR document using API response (real sections + statement from Groq)
      const now = new Date();
      const dateStr = now.toLocaleDateString('en-PK', { day: '2-digit', month: 'long', year: 'numeric' });
      const timeStr = now.toLocaleTimeString('en-PK', { hour: '2-digit', minute: '2-digit' });
      const firNo = Math.floor(Math.random() * 900) + 100;

      const fir = `FIRST INFORMATION REPORT
(Under Section 154 Cr.P.C.)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

District:         ${details.district}
Police Station:   ${details.station}
FIR No.:          ${firNo}/${now.getFullYear()}
Date:             ${dateStr}
Time:             ${timeStr}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

COMPLAINANT DETAILS

Name:             ${details.name}
Father's Name:    ${details.fatherName}
Address:          ${details.address}
CNIC:             ${details.cnic || 'Not Provided'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

STATEMENT OF COMPLAINANT

${data.statement || incident}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

OFFENCES ALLEGED

${(data.sections as string[]).map((s: string, i: number) => `  ${i + 1}. ${s}`).join('\n')}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

NATURE OF OFFENCE
Cognizable:       ${data.cognizable ? 'Yes' : 'No'}
Bailable:         ${data.bailable ? 'Yes' : 'No'}
Punishment:       ${data.punishment || 'As per applicable sections'}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Complainant Signature          Officer in Charge

Name: ${details.name}          Name: ____________________
Date: ${dateStr}               Designation: ______________
                               Badge No.: ________________

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Note: Verify all legal sections with a qualified attorney.`;

      setFirText(fir);
      setStep(3);

    } catch {
      toast.error('Failed to generate FIR. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(firText);
    setCopied(true);
    toast.success('FIR copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([firText], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `FIR_${details.name.replace(/\s+/g, '_')}.txt`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('FIR downloaded!');
  };

  const handleReset = () => {
    setStep(1);
    setIncident('');
    setDetails(INIT_DETAILS);
    setFirText('');
  };

  const { sections } = detectSections(incident);

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-background">
      <header className="h-12 flex items-center border-b border-border px-4 shrink-0">
        <SidebarTrigger className="mr-2" />
        <FileText className="w-4 h-4 text-accent mr-2" />
        <span className="text-sm font-semibold">FIR Generator</span>
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-4 py-8">

          {/* Step progress */}
          <div className="flex items-center gap-2 mb-2">
            {[1, 2, 3].map((s) => (
              <div key={s} className="flex items-center gap-2 flex-1">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-all duration-300 ${step >= s ? 'gradient-gold text-primary' : 'bg-muted text-muted-foreground'}`}>
                  {step > s ? <CheckCircle className="w-4 h-4" /> : s}
                </div>
                {s < 3 && (
                  <div className={`h-0.5 flex-1 rounded transition-all duration-500 ${step > s ? 'bg-accent' : 'bg-muted'}`} />
                )}
              </div>
            ))}
          </div>
          <div className="flex justify-between text-xs text-muted-foreground mb-8 font-sans px-1">
            <span>Incident</span>
            <span className="ml-4">Your Details</span>
            <span>FIR</span>
          </div>

          <AnimatePresence mode="wait">

            {/* ── STEP 1 ── */}
            {step === 1 && (
              <motion.div key="s1" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.25 }}>
                <h1 className="text-2xl font-bold mb-1">Describe the Incident</h1>
                <p className="text-muted-foreground text-sm mb-5 font-sans">
                  Describe what happened in detail — include time, place, and persons involved
                </p>

                <div className="mb-3">
                  <p className="text-xs font-semibold text-muted-foreground mb-2 font-sans">Quick examples:</p>
                  <div className="flex flex-wrap gap-2">
                    {EXAMPLES.map((ex) => (
                      <button
                        key={ex.label}
                        onClick={() => setIncident(ex.text)}
                        className="text-xs px-3 py-1.5 rounded-lg border border-accent/40 text-accent hover:bg-accent/10 transition-colors font-sans"
                      >
                        {ex.label}
                      </button>
                    ))}
                  </div>
                </div>

                <textarea
                  value={incident}
                  onChange={(e) => setIncident(e.target.value)}
                  placeholder="Example: On the night of 15th May at 10 PM, two unknown suspects on a motorcycle stopped me near Gulshan Market and snatched my mobile phone at gunpoint..."
                  className="w-full h-48 p-4 rounded-xl border border-border bg-card text-foreground text-sm font-sans resize-none focus:outline-none focus:ring-2 focus:ring-accent/50 transition-all"
                />
                <div className="text-xs text-right mt-1 font-sans text-muted-foreground">
                  {incident.length} characters
                </div>

                <Button
                  className="w-full mt-5 gradient-gold text-primary font-semibold rounded-xl h-11"
                  disabled={!canNext1}
                  onClick={() => setStep(2)}
                >
                  Next — Your Details <ChevronRight className="w-4 h-4 ml-1" />
                </Button>
              </motion.div>
            )}

            {/* ── STEP 2 ── */}
            {step === 2 && (
              <motion.div key="s2" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }} transition={{ duration: 0.25 }}>
                <h1 className="text-2xl font-bold mb-1">Your Details</h1>
                <p className="text-muted-foreground text-sm mb-5 font-sans">Complainant information — will be used in the FIR</p>

                <div className="space-y-4">
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1.5 block font-sans">Full Name *</label>
                    <Input value={details.name} onChange={(e) => setDetails({ ...details, name: e.target.value })} placeholder="Muhammad Ali" className="rounded-xl font-sans h-10" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1.5 block font-sans">Father's / Husband's Name *</label>
                    <Input value={details.fatherName} onChange={(e) => setDetails({ ...details, fatherName: e.target.value })} placeholder="Muhammad Ibrahim" className="rounded-xl font-sans h-10" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1.5 block font-sans">Full Address *</label>
                    <Input value={details.address} onChange={(e) => setDetails({ ...details, address: e.target.value })} placeholder="House 12, Street 4, Gulberg III, Lahore" className="rounded-xl font-sans h-10" />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-muted-foreground mb-1.5 block font-sans">CNIC (optional)</label>
                    <Input
                      value={details.cnic}
                      onChange={(e) => setDetails({ ...details, cnic: e.target.value })}
                      placeholder="35202-1234567-1"
                      className="rounded-xl font-sans h-10"
                      maxLength={15}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground mb-1.5 block font-sans">District *</label>
                      <select
                        value={details.district}
                        onChange={(e) => setDetails({ ...details, district: e.target.value })}
                        className="w-full h-10 px-3 rounded-xl border border-input bg-background text-sm font-sans focus:outline-none focus:ring-2 focus:ring-accent/50"
                      >
                        {DISTRICTS.map((d) => <option key={d}>{d}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-semibold text-muted-foreground mb-1.5 block font-sans">Police Station *</label>
                      <Input value={details.station} onChange={(e) => setDetails({ ...details, station: e.target.value })} placeholder="Gulberg PS" className="rounded-xl font-sans h-10" />
                    </div>
                  </div>
                </div>

                <div className="flex gap-3 mt-6">
                  <Button variant="outline" className="flex-1 rounded-xl h-11" onClick={() => setStep(1)}>
                    <ChevronLeft className="w-4 h-4 mr-1" /> Back
                  </Button>
                  <Button
                    className="flex-1 gradient-gold text-primary font-semibold rounded-xl h-11"
                    disabled={!canGenerate || loading}
                    onClick={handleGenerate}
                  >
                    {loading
                      ? <span className="font-sans text-sm animate-pulse">{LOADING_STEPS[loadingIdx]}</span>
                      : <><FileCheck className="w-4 h-4 mr-2" />Generate FIR</>}
                  </Button>
                </div>

                {loading && (
                  <div className="mt-4">
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <motion.div
                        className="h-full gradient-gold rounded-full"
                        initial={{ width: '5%' }}
                        animate={{ width: `${((loadingIdx + 1) / LOADING_STEPS.length) * 95}%` }}
                        transition={{ duration: 0.9, ease: 'easeInOut' }}
                      />
                    </div>
                    <p className="text-xs text-center text-muted-foreground mt-2 font-sans">
                      Step {loadingIdx + 1} of {LOADING_STEPS.length}
                    </p>
                  </div>
                )}
              </motion.div>
            )}

            {/* ── STEP 3 ── */}
            {step === 3 && (
              <motion.div key="s3" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h1 className="text-2xl font-bold">FIR Generated</h1>
                    <p className="text-muted-foreground text-sm font-sans">Review and save your FIR</p>
                  </div>
                  <CheckCircle className="w-8 h-8 text-green-500 shrink-0 mt-1" />
                </div>

                {/* Detected sections */}
                <Card className="p-4 mb-4 border-accent/30 bg-accent/5">
                  <p className="text-xs font-semibold text-accent mb-2 font-sans uppercase tracking-wide">Detected Sections</p>
                  <div className="flex flex-wrap gap-2">
                    {sections.map((s) => (
                      <span key={s} className="text-xs px-2.5 py-1 rounded-lg bg-accent/15 text-foreground font-sans border border-accent/25">
                        {s}
                      </span>
                    ))}
                  </div>
                </Card>

                {/* FIR text box */}
                <pre className="w-full p-4 rounded-xl border border-border bg-card text-xs font-mono text-foreground whitespace-pre-wrap mb-4 leading-relaxed overflow-auto max-h-80">
                  {firText}
                </pre>

                {/* Action buttons */}
                <div className="grid grid-cols-3 gap-2 mb-3">
                  <Button variant="outline" className="rounded-xl h-10 text-xs font-sans" onClick={handleCopy}>
                    {copied
                      ? <><CheckCircle className="w-3.5 h-3.5 mr-1 text-green-500" />Copied!</>
                      : <><Copy className="w-3.5 h-3.5 mr-1" />Copy</>}
                  </Button>
                  <Button variant="outline" className="rounded-xl h-10 text-xs font-sans" onClick={() => window.print()}>
                    <Printer className="w-3.5 h-3.5 mr-1" /> Print
                  </Button>
                  <Button variant="outline" className="rounded-xl h-10 text-xs font-sans" onClick={handleDownload}>
                    <Download className="w-3.5 h-3.5 mr-1" /> Download
                  </Button>
                </div>

                <Button variant="ghost" className="w-full rounded-xl text-sm font-sans text-muted-foreground hover:text-foreground" onClick={handleReset}>
                  Generate New FIR
                </Button>

                <Card className="p-3 mt-4 border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800">
                  <p className="text-xs text-amber-700 dark:text-amber-400 font-sans">
                    ⚠️ This FIR is generated for reference purposes only. Please verify all legal sections with a qualified attorney before presenting at a police station.
                  </p>
                </Card>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
