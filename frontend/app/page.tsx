'use client';

import { motion } from 'framer-motion';
import { Scale, Shield, Briefcase, Users, BookOpen, ClipboardCheck, Crown, ArrowRight, ShieldAlert } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { VoiceSearchBar } from '@/components/VoiceSearchBar';
import { Card } from '@/components/ui/card';
import { RoleCard } from '@/components/RoleCard';
import { Button } from '@/components/ui/button';
import { useChatStore } from '@/store/chatStore';

export default function HomePage() {
  const router = useRouter();
  const { addChat, isLoggedIn } = useChatStore();

  const handleSearch = (query: string) => {
    const id = addChat('citizen');
    useChatStore.getState().addMessage(id, query, false);
    setTimeout(() => {
      const lower = query.toLowerCase();
      let response = "Based on Pakistani law, I can help you understand the relevant legal provisions. Could you provide more details?";
      if (lower.includes('theft') || lower.includes('chori')) response = "Under PPC Section 378-382, theft is punishable by 3-7 years imprisonment with fine.";
      else if (lower.includes('bail')) response = "Bail eligibility depends on the offense. Bailable offenses allow bail as of right under CrPC.";
      else if (lower.includes('fir')) response = "An FIR is filed under CrPC Section 154. Police must register for cognizable offenses.";
      useChatStore.getState().addMessage(id, response, true);
    }, 600);
    router.push(`/chat/${id}`);
  };

  const handleRoleSelect = (role: string) => {
    const id = addChat(role);
    router.push(`/chat/${id}`);
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 gradient-navy" />
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 30% 50%, hsl(45 80% 55% / 0.3) 0%, transparent 60%)' }} />

        <div className="relative max-w-5xl mx-auto px-4 pt-8 pb-20 text-center">
          <nav className="flex items-center justify-between mb-16">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-lg gradient-gold flex items-center justify-center">
                <Scale className="w-5 h-5 text-primary" />
              </div>
              <span className="font-bold text-white text-sm" style={{ fontFamily: "'Playfair Display', serif" }}>Legal Code AI</span>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" className="text-white/70 hover:text-white text-xs rounded-xl" onClick={() => router.push('/pricing')}>
                <Crown className="w-3.5 h-3.5 mr-1" /> Pro
              </Button>
              {isLoggedIn ? (
                <Button size="sm" className="gradient-gold text-primary rounded-xl text-xs" onClick={() => router.push('/chat')}>
                  Open Chat <ArrowRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              ) : (
                <>
                  <Button variant="ghost" size="sm" className="text-white/70 hover:text-white text-xs rounded-xl" onClick={() => router.push('/login')}>Sign In</Button>
                  <Button size="sm" className="gradient-gold text-primary rounded-xl text-xs" onClick={() => router.push('/signup')}>Sign Up</Button>
                </>
              )}
              <Button
                variant="ghost"
                size="sm"
                className="text-white/40 hover:text-white/70 text-xs rounded-xl px-2"
                onClick={() => router.push('/admin/login')}
                title="Admin Panel"
              >
                <ShieldAlert className="w-3.5 h-3.5" />
              </Button>
            </div>
          </nav>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6 }}>
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-extrabold text-white mb-4 leading-tight">
              Legal Code <span className="text-gradient-gold">Assistant</span>
            </h1>
            <p className="text-base text-white/60 max-w-xl mx-auto mb-10 font-sans">
              AI-powered guidance for Pakistani law — PPC, CrPC, QSO & more.
              Speak or type your query in English or Roman Urdu.
            </p>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}>
            <VoiceSearchBar onSearch={handleSearch} />
          </motion.div>
        </div>
      </section>

      {/* Role Cards */}
      <section className="max-w-5xl mx-auto px-4 -mt-8 relative z-10">
        <div className="grid md:grid-cols-3 gap-5">
          <RoleCard title="Police Officer" description="FIR registration, arrest procedures & CrPC guidelines." icon={Shield} onClick={() => handleRoleSelect('police')} delay={0.1} />
          <RoleCard title="Lawyer" description="Case references, bail provisions & QSO evidence rules." icon={Briefcase} onClick={() => handleRoleSelect('lawyer')} delay={0.2} />
          <RoleCard title="Citizen" description="Know your rights, understand penalties & file complaints." icon={Users} onClick={() => handleRoleSelect('citizen')} delay={0.3} />
        </div>
      </section>

      {/* Features */}
      <section className="max-w-5xl mx-auto px-4 py-20">
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }} className="text-center mb-12">
          <h2 className="text-3xl font-bold mb-3">Powerful Legal Tools</h2>
          <p className="text-muted-foreground font-sans">Everything you need for Pakistani law assistance</p>
        </motion.div>
        <div className="grid md:grid-cols-2 gap-5">
          {[
            { icon: BookOpen, title: "Law Reference", desc: "Browse all Pakistani legal codes with AI-powered explanations." },
            { icon: ClipboardCheck, title: "Self-Assessment", desc: "Check penalties and bail eligibility for any offense.", link: "/assessment" },
          ].map((f, i) => (
            <motion.div key={f.title} initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: i * 0.1 }}
              className="p-6 rounded-2xl bg-card border border-border hover:shadow-lg transition-shadow cursor-pointer"
              onClick={() => f.link && router.push(f.link)}>
              <f.icon className="w-8 h-8 text-accent mb-4" />
              <h3 className="text-lg font-bold mb-2">{f.title}</h3>
              <p className="text-muted-foreground text-sm font-sans">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="max-w-3xl mx-auto px-4 pb-20 text-center">
        <motion.div initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
          <Card className="p-8 rounded-2xl gradient-navy border-0">
            <Crown className="w-10 h-10 text-accent mx-auto mb-4" />
            <h2 className="text-2xl font-bold text-white mb-2">Unlock Pro Features</h2>
            <p className="text-white/60 text-sm font-sans mb-6 max-w-md mx-auto">
              Unlimited queries, full law database, voice input in all languages, and more.
            </p>
            <Button className="gradient-gold text-primary font-semibold rounded-xl px-8 hover:opacity-90" onClick={() => router.push('/pricing')}>
              View Plans <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
          </Card>
        </motion.div>
      </section>

      <footer className="gradient-navy py-8 px-4">
        <div className="max-w-5xl mx-auto text-center">
          <p className="text-white/40 text-sm font-sans">Legal Code Assistant — FYP Project • AI-Powered Pakistani Law Guidance</p>
        </div>
      </footer>
    </div>
  );
}
