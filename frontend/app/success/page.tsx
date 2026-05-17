'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { CheckCircle2, Crown, ArrowRight, Scale, Sparkles } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useChatStore } from '@/store/chatStore';

const PRO_FEATURES = [
  'Unlimited legal queries — no daily cap',
  'FIR Generator with full templates',
  'Case Outcome Predictor (bail & conviction)',
  'Document Analyzer — upload any legal document',
  'Voice input in English & Roman Urdu',
  'Priority support response',
];

export default function PaymentSuccessPage() {
  const router = useRouter();
  const { upgradeToPro } = useChatStore();
  const [countdown, setCountdown] = useState(8);

  useEffect(() => {
    upgradeToPro();
  }, [upgradeToPro]);

  useEffect(() => {
    if (countdown <= 0) { router.push('/dashboard'); return; }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown, router]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md space-y-6">

        {/* Animated check */}
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          className="flex justify-center"
        >
          <div className="relative">
            <div className="w-24 h-24 rounded-full gradient-gold flex items-center justify-center shadow-lg">
              <CheckCircle2 className="w-12 h-12 text-primary" />
            </div>
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.4 }}
              className="absolute -top-1 -right-1 w-8 h-8 rounded-full gradient-navy flex items-center justify-center"
            >
              <Crown className="w-4 h-4 text-accent" />
            </motion.div>
          </div>
        </motion.div>

        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-center space-y-2"
        >
          <h1 className="text-2xl font-bold">Payment Successful!</h1>
          <p className="text-muted-foreground font-sans text-sm">
            Welcome to <span className="text-accent font-semibold">Legal Code AI Pro</span>. Your account has been upgraded.
          </p>
        </motion.div>

        {/* Pro features card */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
          <Card className="p-5 space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-accent" />
              <p className="text-sm font-semibold">You now have access to</p>
            </div>
            <ul className="space-y-2">
              {PRO_FEATURES.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm font-sans text-muted-foreground">
                  <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0 mt-0.5" />
                  {f}
                </li>
              ))}
            </ul>
          </Card>
        </motion.div>

        {/* Actions */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="space-y-3">
          <Button
            className="w-full gradient-gold text-primary font-semibold rounded-xl h-11"
            onClick={() => router.push('/dashboard')}
          >
            Go to Dashboard <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
          <Button
            variant="outline"
            className="w-full rounded-xl font-sans"
            onClick={() => router.push('/chat')}
          >
            <Scale className="w-4 h-4 mr-2" /> Start a Legal Query
          </Button>
        </motion.div>

        {/* Countdown */}
        <p className="text-center text-xs text-muted-foreground font-sans">
          Redirecting to dashboard in <span className="font-semibold text-accent">{countdown}s</span>
        </p>

      </div>
    </div>
  );
}
