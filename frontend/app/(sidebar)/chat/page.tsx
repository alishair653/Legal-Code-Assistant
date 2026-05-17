'use client';

import { motion } from 'framer-motion';
import { Scale, Shield, Briefcase, Users } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { useChatStore } from '@/store/chatStore';

export default function ChatPage() {
  const router = useRouter();
  const { addChat } = useChatStore();

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-background">
      <header className="h-12 flex items-center border-b border-border px-4 shrink-0">
        <SidebarTrigger className="mr-2" />
        <Scale className="w-5 h-5 text-accent mr-2" />
        <span className="font-semibold text-foreground text-sm">Legal Code Assistant</span>
      </header>
      <div className="flex-1 flex items-center justify-center">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-md px-4">
          <div className="w-16 h-16 rounded-2xl gradient-gold flex items-center justify-center mx-auto mb-6 shadow-lg">
            <Scale className="w-9 h-9 text-primary" />
          </div>
          <h1 className="text-2xl font-bold mb-3">Legal Code Assistant</h1>
          <p className="text-muted-foreground text-sm mb-8 font-sans">
            AI-powered guidance for Pakistani law. Select a role to start.
          </p>
          <div className="grid grid-cols-3 gap-3">
            {[
              { role: 'police', icon: Shield, label: 'Police' },
              { role: 'lawyer', icon: Briefcase, label: 'Lawyer' },
              { role: 'citizen', icon: Users, label: 'Citizen' },
            ].map(({ role, icon: Icon, label }) => (
              <Button
                key={role}
                variant="outline"
                className="flex flex-col gap-2 h-auto py-4 rounded-xl hover:border-accent hover:bg-accent/5"
                onClick={() => { const id = addChat(role); router.push(`/chat/${id}`); }}
              >
                <Icon className="w-5 h-5 text-accent" />
                <span className="text-xs">{label}</span>
              </Button>
            ))}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
