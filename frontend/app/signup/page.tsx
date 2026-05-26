'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Scale, Mail, Lock, Eye, EyeOff, User, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useChatStore } from '@/store/chatStore';
import { signUp } from '@/lib/supabase';
import { toast } from 'sonner';

export default function SignupPage() {
  const router = useRouter();
  const { signup } = useChatStore();
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      toast.error('Password must be at least 6 characters.');
      return;
    }
    setLoading(true);
    try {
      const { user } = await signUp(name, email, password);
      if (user) {
        signup(name, email, password); // sync into Zustand for UI state
        toast.success('Account created! Welcome to Legal Code AI.');
        router.push('/chat');
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : 'Signup failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      <div className="hidden lg:flex lg:w-1/2 gradient-navy items-center justify-center p-12 relative overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 70% 50%, hsl(45 80% 55% / 0.4) 0%, transparent 60%)' }} />
        <motion.div initial={{ opacity: 0, x: -30 }} animate={{ opacity: 1, x: 0 }} className="relative text-center">
          <div className="w-20 h-20 rounded-2xl gradient-gold flex items-center justify-center mx-auto mb-8 shadow-xl">
            <Scale className="w-11 h-11 text-primary" />
          </div>
          <h1 className="text-4xl font-extrabold text-white mb-4" style={{ fontFamily: "'Playfair Display', serif" }}>
            Join <span className="text-gradient-gold">Legal Code AI</span>
          </h1>
          <p className="text-white/60 text-lg font-sans max-w-md">
            Create your account and get instant access to AI-powered legal guidance
          </p>
        </motion.div>
      </div>

      <div className="flex-1 flex items-center justify-center p-8 bg-background">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-sm">
          <div className="lg:hidden flex items-center gap-3 mb-8 justify-center">
            <div className="w-10 h-10 rounded-xl gradient-gold flex items-center justify-center">
              <Scale className="w-6 h-6 text-primary" />
            </div>
            <span className="text-xl font-bold" style={{ fontFamily: "'Playfair Display', serif" }}>Legal Code AI</span>
          </div>

          <button onClick={() => router.back()} className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6 font-sans">
            <ArrowLeft className="w-4 h-4" /> Back
          </button>

          <h2 className="text-2xl font-bold mb-1">Create account</h2>
          <p className="text-muted-foreground text-sm mb-6 font-sans">Get started with Legal Code Assistant</p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-sm">Full Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder="Muhammad Ali" className="pl-10 h-11 rounded-xl" required />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-sm">Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="pl-10 h-11 rounded-xl" required />
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="password" className="text-sm">Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input id="password" type={showPass ? 'text' : 'password'} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" className="pl-10 pr-10 h-11 rounded-xl" required minLength={6} />
                <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <Button type="submit" disabled={loading} className="w-full h-11 rounded-xl gradient-gold text-primary font-semibold hover:opacity-90">
              {loading ? 'Creating account...' : 'Create Account'}
            </Button>
          </form>

          <p className="mt-4 text-center text-sm text-muted-foreground font-sans">
            Already have an account?{' '}
            <Link href="/login" className="text-accent hover:underline font-medium">Sign in</Link>
          </p>
        </motion.div>
      </div>
    </div>
  );
}
