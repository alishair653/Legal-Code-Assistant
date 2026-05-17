'use client';

import { motion } from 'framer-motion';
import { User, Mail, Shield, Crown, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useChatStore } from '@/store/chatStore';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { useEffect } from 'react';

export default function ProfilePage() {
  const router = useRouter();
  const { user, isPro, logout, isLoggedIn } = useChatStore();

  useEffect(() => {
    if (!isLoggedIn) router.push('/login');
  }, [isLoggedIn, router]);

  if (!isLoggedIn) return null;

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-background">
      <header className="h-12 flex items-center border-b border-border px-4">
        <SidebarTrigger className="mr-2" />
        <span className="text-sm font-semibold">Profile</span>
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-lg mx-auto px-4 py-10">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <div className="flex flex-col items-center mb-8">
              <div className="w-24 h-24 rounded-full gradient-navy flex items-center justify-center mb-4 shadow-lg">
                <User className="w-12 h-12 text-accent" />
              </div>
              <h1 className="text-2xl font-bold">{user?.name}</h1>
              <p className="text-muted-foreground text-sm font-sans">{user?.email}</p>
              {isPro && (
                <span className="mt-2 px-3 py-1 rounded-full gradient-gold text-primary text-xs font-bold flex items-center gap-1">
                  <Crown className="w-3 h-3" /> PRO
                </span>
              )}
            </div>

            <div className="space-y-3">
              <Card className="p-4 flex items-center gap-3">
                <Mail className="w-5 h-5 text-accent" />
                <div>
                  <p className="text-xs text-muted-foreground">Email</p>
                  <p className="text-sm font-medium">{user?.email}</p>
                </div>
              </Card>
              <Card className="p-4 flex items-center gap-3">
                <Shield className="w-5 h-5 text-accent" />
                <div>
                  <p className="text-xs text-muted-foreground">Plan</p>
                  <p className="text-sm font-medium">{isPro ? 'Pro Plan' : 'Free Plan'}</p>
                </div>
              </Card>
            </div>

            {!isPro && (
              <Button onClick={() => router.push('/pricing')} className="w-full mt-6 h-11 rounded-xl gradient-gold text-primary font-semibold hover:opacity-90">
                <Crown className="w-4 h-4 mr-2" /> Upgrade to Pro
              </Button>
            )}

            <Button
              variant="outline"
              onClick={() => { logout(); router.push('/'); }}
              className="w-full mt-3 h-11 rounded-xl text-destructive border-destructive/30 hover:bg-destructive/5"
            >
              <LogOut className="w-4 h-4 mr-2" /> Sign Out
            </Button>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
