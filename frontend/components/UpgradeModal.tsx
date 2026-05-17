'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Crown, X, CheckCircle2, ArrowRight, Lock } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
  feature?: string;
}

const FEATURE_DESCRIPTIONS: Record<string, { icon: string; desc: string }> = {
  fir: { icon: '📄', desc: 'Generate professional FIRs with auto-detected PPC sections from your incident description.' },
  predictor: { icon: '⚖️', desc: 'Get AI-powered bail probability and conviction risk estimates for any case.' },
  analyzer: { icon: '🔍', desc: 'Upload FIRs, contracts, and legal notices for instant AI-powered legal review.' },
  voice: { icon: '🎙️', desc: 'Ask legal questions by speaking in English or Roman Urdu — hands-free assistance.' },
  history: { icon: '🕓', desc: 'Access your full query history, search past answers, and export as CSV.' },
  default: { icon: '✨', desc: 'Unlock all Pro features for unlimited legal assistance.' },
};

const PRO_BENEFITS = [
  'Unlimited daily queries — no cap',
  'FIR Generator with legal templates',
  'Case Predictor (bail & conviction)',
  'Document Analyzer for any legal file',
  'Voice input in English & Roman Urdu',
  'Full query history & CSV export',
];

export function UpgradeModal({ isOpen, onClose, feature = 'default' }: UpgradeModalProps) {
  const router = useRouter();
  const info = FEATURE_DESCRIPTIONS[feature] ?? FEATURE_DESCRIPTIONS.default;

  const handleUpgrade = () => {
    onClose();
    router.push('/pricing');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50"
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 24 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.92, y: 24 }}
            transition={{ type: 'spring', stiffness: 300, damping: 24 }}
            className="fixed left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-50 w-full max-w-sm mx-4"
          >
            <div className="bg-card border border-border rounded-2xl shadow-2xl overflow-hidden">

              {/* Header */}
              <div className="gradient-navy px-6 pt-6 pb-5 text-center relative">
                <button
                  onClick={onClose}
                  className="absolute top-3 right-3 p-1.5 rounded-lg text-white/40 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>

                <div className="w-14 h-14 rounded-2xl gradient-gold flex items-center justify-center mx-auto mb-3 shadow-lg">
                  <Lock className="w-7 h-7 text-primary" />
                </div>
                <h2 className="text-lg font-bold text-white">Upgrade to Pro</h2>
                <p className="text-white/60 text-xs font-sans mt-1">
                  {info.icon} {info.desc}
                </p>
              </div>

              {/* Benefits */}
              <div className="px-6 py-4 space-y-2">
                {PRO_BENEFITS.map((b) => (
                  <div key={b} className="flex items-center gap-2.5 text-sm font-sans text-muted-foreground">
                    <CheckCircle2 className="w-4 h-4 text-accent shrink-0" />
                    {b}
                  </div>
                ))}
              </div>

              {/* Price + CTA */}
              <div className="px-6 pb-6 space-y-3">
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-3xl font-extrabold">Rs. 499</span>
                  <span className="text-muted-foreground font-sans text-sm">/ month</span>
                </div>

                <Button
                  onClick={handleUpgrade}
                  className="w-full gradient-gold text-primary font-semibold rounded-xl h-11"
                >
                  <Crown className="w-4 h-4 mr-2" /> Upgrade Now
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>

                <button
                  onClick={onClose}
                  className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors font-sans"
                >
                  Maybe later
                </button>
              </div>

            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
