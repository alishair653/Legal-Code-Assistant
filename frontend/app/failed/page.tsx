'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { XCircle, RotateCcw, ArrowLeft, AlertTriangle, HelpCircle } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Suspense } from 'react';

const FAILURE_REASONS: Record<string, { title: string; detail: string }> = {
  '157': { title: 'Transaction Cancelled', detail: 'The payment was cancelled before completion. No amount was charged.' },
  '101': { title: 'Transaction Declined', detail: 'Your bank declined the transaction. Please try a different payment method.' },
  '124': { title: 'Insufficient Balance', detail: 'Insufficient balance in your JazzCash account. Please top up and try again.' },
  '999': { title: 'Transaction Failed', detail: 'An unexpected error occurred during payment processing. Please try again.' },
  default: { title: 'Payment Unsuccessful', detail: 'Your payment could not be processed at this time. No amount has been charged.' },
};

const COMMON_FIXES = [
  'Check your JazzCash account balance is sufficient',
  'Ensure your internet connection is stable during payment',
  'Try again after a few minutes if the issue persists',
  'Contact JazzCash support (111-124-444) for account issues',
  'Use a different payment method if available',
];

function FailedContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const reasonCode = searchParams.get('reason') ?? 'default';
  const [countdown, setCountdown] = useState(12);

  const reason = FAILURE_REASONS[reasonCode] ?? FAILURE_REASONS.default;

  useEffect(() => {
    if (countdown <= 0) { router.push('/pricing'); return; }
    const t = setTimeout(() => setCountdown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [countdown, router]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="w-full max-w-md space-y-6">

        {/* Error icon */}
        <motion.div
          initial={{ scale: 0, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: 'spring', stiffness: 200, damping: 15 }}
          className="flex justify-center"
        >
          <div className="w-24 h-24 rounded-full bg-destructive/10 border-2 border-destructive/20 flex items-center justify-center">
            <XCircle className="w-12 h-12 text-destructive" />
          </div>
        </motion.div>

        {/* Heading */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-center space-y-2"
        >
          <h1 className="text-2xl font-bold">{reason.title}</h1>
          <p className="text-muted-foreground font-sans text-sm">{reason.detail}</p>
        </motion.div>

        {/* Safe to retry notice */}
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <div className="flex items-start gap-2 p-3 rounded-xl bg-green-500/10 border border-green-500/20">
            <AlertTriangle className="w-4 h-4 text-green-600 shrink-0 mt-0.5" />
            <p className="text-xs text-green-700 dark:text-green-400 font-sans">
              <strong>No charge was made.</strong> Your account has not been debited. It is safe to retry.
            </p>
          </div>
        </motion.div>

        {/* Common fixes */}
        <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card className="p-5 space-y-3">
            <div className="flex items-center gap-2">
              <HelpCircle className="w-4 h-4 text-accent" />
              <p className="text-sm font-semibold">Common fixes</p>
            </div>
            <ul className="space-y-2">
              {COMMON_FIXES.map((f) => (
                <li key={f} className="flex items-start gap-2 text-sm font-sans text-muted-foreground">
                  <span className="w-1.5 h-1.5 rounded-full bg-accent mt-2 shrink-0" />
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
            onClick={() => router.push('/pricing')}
          >
            <RotateCcw className="w-4 h-4 mr-2" /> Try Again
          </Button>
          <Button
            variant="outline"
            className="w-full rounded-xl font-sans"
            onClick={() => router.push('/')}
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Home
          </Button>
        </motion.div>

        {/* Countdown */}
        <p className="text-center text-xs text-muted-foreground font-sans">
          Redirecting to pricing in <span className="font-semibold text-accent">{countdown}s</span>
        </p>

      </div>
    </div>
  );
}

export default function PaymentFailedPage() {
  return (
    <Suspense>
      <FailedContent />
    </Suspense>
  );
}
