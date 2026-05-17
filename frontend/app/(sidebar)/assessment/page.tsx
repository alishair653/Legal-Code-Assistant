'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle, AlertTriangle, Scale } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { SidebarTrigger } from '@/components/ui/sidebar';

const offenses = [
  { label: 'Theft (Section 378-382)', value: 'theft', punishment: '3-7 years imprisonment', bailable: false },
  { label: 'Simple Hurt (Section 337)', value: 'hurt', punishment: 'Up to 1 year or fine', bailable: true },
  { label: 'Fraud / Cheating (Section 420)', value: 'fraud', punishment: 'Up to 7 years imprisonment', bailable: false },
  { label: 'Defamation (Section 499)', value: 'defamation', punishment: 'Up to 2 years or fine', bailable: true },
  { label: 'Murder (Section 302)', value: 'murder', punishment: 'Death or life imprisonment', bailable: false },
  { label: 'Kidnapping (Section 365)', value: 'kidnapping', punishment: '7-10 years imprisonment', bailable: false },
];

export default function AssessmentPage() {
  const [selected, setSelected] = useState<string | null>(null);
  const offense = offenses.find((o) => o.value === selected);

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-background">
      <header className="h-12 flex items-center border-b border-border px-4 shrink-0">
        <SidebarTrigger className="mr-2" />
        <Scale className="w-4 h-4 text-accent mr-2" />
        <span className="text-sm font-semibold">Self-Assessment Tool</span>
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-4 py-10">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-3xl font-bold mb-2">Check Penalties & Bail Status</h1>
            <p className="text-muted-foreground mb-8 font-sans text-sm">
              Select an offense to view its punishment and bail eligibility under Pakistani law.
            </p>
            <div className="grid gap-3">
              {offenses.map((o, i) => (
                <motion.div key={o.value} initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}>
                  <Card
                    className={`p-4 cursor-pointer transition-all hover:shadow-md ${selected === o.value ? 'ring-2 ring-accent border-accent' : 'hover:border-accent/50'}`}
                    onClick={() => setSelected(o.value)}
                  >
                    <span className="font-medium text-foreground text-sm">{o.label}</span>
                  </Card>
                </motion.div>
              ))}
            </div>

            {offense && (
              <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-8">
                <Card className="p-6 border-accent/30 bg-card">
                  <h2 className="text-xl font-bold mb-4">{offense.label}</h2>
                  <div className="space-y-3">
                    <div className="flex items-start gap-3">
                      <AlertTriangle className="w-5 h-5 text-accent mt-0.5 shrink-0" />
                      <div>
                        <p className="font-semibold text-sm text-muted-foreground">Punishment</p>
                        <p className="text-foreground">{offense.punishment}</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-3">
                      <CheckCircle className={`w-5 h-5 mt-0.5 shrink-0 ${offense.bailable ? 'text-green-500' : 'text-destructive'}`} />
                      <div>
                        <p className="font-semibold text-sm text-muted-foreground">Bail Status</p>
                        <p className={offense.bailable ? 'text-green-600' : 'text-destructive'}>
                          {offense.bailable ? 'Bailable — Bail is a right' : 'Non-Bailable — Bail at court discretion'}
                        </p>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>
    </div>
  );
}
