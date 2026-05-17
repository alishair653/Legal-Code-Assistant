'use client';

import { motion } from 'framer-motion';
import { Check, Crown } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useChatStore } from '@/store/chatStore';

const plans = [
  {
    name: 'Free',
    price: '0',
    period: 'forever',
    description: 'Basic legal guidance for everyone',
    features: ['10 queries per day', 'PPC & CrPC references', 'Basic self-assessment', 'English language only', 'Standard response speed'],
    cta: 'Current Plan',
    popular: false,
  },
  {
    name: 'Pro',
    price: '999',
    period: '/month',
    currency: 'PKR',
    description: 'Advanced features for legal professionals',
    features: ['Unlimited queries', 'All Pakistani law categories', 'Advanced self-assessment', 'English & Roman Urdu', 'Priority response speed', 'Case precedent search', 'Export chat history', 'Voice input in all languages'],
    cta: 'Upgrade to Pro',
    popular: true,
  },
  {
    name: 'Enterprise',
    price: 'Custom',
    period: '',
    description: 'For law firms and institutions',
    features: ['Everything in Pro', 'Custom AI training', 'Team collaboration', 'API access', 'Dedicated support', 'Custom integrations', 'Analytics dashboard', 'SLA guarantee'],
    cta: 'Contact Sales',
    popular: false,
  },
];

export default function PricingPage() {
  const router = useRouter();
  const { upgradeToPro, isLoggedIn, isPro } = useChatStore();

  const handleUpgrade = () => {
    if (!isLoggedIn) { router.push('/signup'); return; }
    upgradeToPro();
    router.push('/chat');
  };

  return (
    <div className="min-h-screen bg-background">
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 gradient-navy" />
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 50% 50%, hsl(45 80% 55% / 0.3) 0%, transparent 60%)' }} />
        <div className="relative max-w-5xl mx-auto px-4 pt-16 pb-12 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex items-center justify-center gap-2 mb-4">
              <Button variant="ghost" className="text-white/60 hover:text-white" onClick={() => router.push('/')}>← Back</Button>
            </div>
            <Crown className="w-12 h-12 text-accent mx-auto mb-4" />
            <h1 className="text-4xl md:text-5xl font-extrabold text-white mb-4">
              Choose Your <span className="text-gradient-gold">Plan</span>
            </h1>
            <p className="text-lg text-white/60 max-w-xl mx-auto font-sans">
              Unlock the full power of AI-powered legal assistance
            </p>
          </motion.div>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 -mt-6 relative z-10 pb-20">
        <div className="grid md:grid-cols-3 gap-6 items-stretch">
          {plans.map((plan, i) => (
            <motion.div key={plan.name} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="flex flex-col h-full">
              {/* Badge above card in normal flow so it never clips */}
              <div className={`text-center mb-2 h-7 flex items-center justify-center`}>
                {plan.popular && (
                  <span className="inline-block px-4 py-1 rounded-full gradient-gold text-primary text-xs font-bold shadow">
                    Most Popular
                  </span>
                )}
              </div>
              <Card className={`p-6 flex-1 flex flex-col rounded-2xl ${plan.popular ? 'border-accent shadow-xl ring-2 ring-accent/20' : 'border-border'}`}>
                <div className="mb-6">
                  <h3 className="text-lg font-bold mb-1">{plan.name}</h3>
                  <p className="text-muted-foreground text-xs font-sans mb-4">{plan.description}</p>
                  <div className="flex items-baseline gap-1">
                    {plan.currency && <span className="text-sm text-muted-foreground">{plan.currency}</span>}
                    <span className="text-4xl font-extrabold">{plan.price}</span>
                    {plan.period && <span className="text-muted-foreground text-sm">{plan.period}</span>}
                  </div>
                </div>
                <ul className="space-y-3 mb-8 flex-1">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm font-sans">
                      <Check className={`w-4 h-4 mt-0.5 shrink-0 ${plan.popular ? 'text-accent' : 'text-muted-foreground'}`} />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  className={`w-full h-11 rounded-xl font-semibold ${plan.popular ? 'gradient-gold text-primary hover:opacity-90' : plan.name === 'Enterprise' ? 'bg-primary text-primary-foreground' : ''}`}
                  variant={plan.popular || plan.name === 'Enterprise' ? 'default' : 'outline'}
                  onClick={plan.popular ? handleUpgrade : undefined}
                  disabled={plan.name === 'Free' && !isPro}
                >
                  {isPro && plan.name === 'Pro' ? '✓ Current Plan' : plan.cta}
                </Button>
              </Card>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  );
}
