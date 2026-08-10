'use client';

import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { FileText, MessageSquare, Info } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { useChatStore } from '@/store/chatStore';

export default function DocumentAnalyzerPage() {
  const router = useRouter();
  const { addChat } = useChatStore();

  const openChat = () => {
    const id = addChat('lawyer');
    router.push(`/chat/${id}`);
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-background">
      <header className="h-12 flex items-center border-b border-border px-4 shrink-0">
        <SidebarTrigger className="mr-2" />
        <FileText className="w-4 h-4 text-accent mr-2" />
        <span className="text-sm font-semibold">Document Analyzer</span>
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-4 py-12">
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}>
            <Card className="p-8 space-y-5 text-center">
                    <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mx-auto">
                <FileText className="w-7 h-7 text-muted-foreground" />
                    </div>
                    <div>
                <h1 className="text-xl font-bold">Document analysis not connected yet</h1>
                <p className="text-sm text-muted-foreground font-sans mt-2">
                  Fake canned analysis results have been removed. Upload-to-AI review will return when
                  real PDF/OCR extraction is wired. Until then, use Chat with your document details.
                </p>
              </div>
              <div className="flex items-start gap-2 p-3 rounded-xl bg-blue-500/10 border border-blue-500/20 text-left">
                <Info className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
                <p className="text-xs text-blue-700 dark:text-blue-400 font-sans">
                  Chat uses live Groq + your Qdrant legal sections — ask about FIR wording, sections, or contract clauses there.
                </p>
              </div>
              <Button onClick={openChat} className="rounded-xl gradient-gold text-[hsl(220,60%,12%)] font-semibold hover:opacity-90">
                <MessageSquare className="w-4 h-4 mr-2" />
                Open Legal Chat
                    </Button>
                </Card>
              </motion.div>
        </div>
      </div>
    </div>
  );
}
