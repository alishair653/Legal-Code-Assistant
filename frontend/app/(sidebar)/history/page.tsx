'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  History, Search, ChevronDown, ChevronUp, Trash2,
  Download, MessageSquare, FileText, Filter, X,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { useChatStore } from '@/store/chatStore';
import { toast } from 'sonner';

type HistoryEntry = {
  id: string;
  question: string;
  answer: string;
  sections: string[];
  date: Date;
  type: 'chat' | 'fir';
};

function formatDate(date: Date) {
  const now = new Date();
  const diff = Math.floor((now.getTime() - date.getTime()) / 86400000);
  if (diff === 0) return 'Today';
  if (diff === 1) return 'Yesterday';
  if (diff < 7) return `${diff} days ago`;
  return date.toLocaleDateString('en-PK', { day: '2-digit', month: 'short', year: 'numeric' });
}

export default function HistoryPage() {
  const { chats } = useChatStore();
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'chat' | 'fir'>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [deleted, setDeleted] = useState<Set<string>>(new Set());
  const [page, setPage] = useState(1);
  const PER_PAGE = 8;

  const allEntries: HistoryEntry[] = chats
    .flatMap((chat) =>
      chat.messages
        .filter((m) => !m.isBot)
        .map((m, i) => {
          const botReply = chat.messages[chat.messages.indexOf(m) + 1];
          return {
            id: `${chat.id}-${i}`,
            question: m.text,
            answer: botReply?.text ?? 'No response recorded.',
            sections: [] as string[],
            date: chat.createdAt,
            type: 'chat' as const,
          };
        })
    )
    .filter((e) => !deleted.has(e.id))
    .sort((a, b) => b.date.getTime() - a.date.getTime());

  const filtered = useMemo(() => {
    return allEntries.filter((e) => {
      const matchSearch = !search || e.question.toLowerCase().includes(search.toLowerCase()) || e.answer.toLowerCase().includes(search.toLowerCase());
      const matchType = filterType === 'all' || e.type === filterType;
      return matchSearch && matchType;
    });
  }, [allEntries, search, filterType]);

  const paginated = filtered.slice(0, page * PER_PAGE);
  const hasMore = filtered.length > paginated.length;

  const handleDelete = (id: string) => {
    setDeleted((prev) => new Set([...prev, id]));
    if (expandedId === id) setExpandedId(null);
    toast.success('Entry removed from history');
  };

  const handleExportCSV = () => {
    const header = 'Date,Type,Question,Answer,Sections';
    const rows = filtered.map((e) =>
      `"${formatDate(e.date)}","${e.type}","${e.question.replace(/"/g, '""')}","${e.answer.replace(/"/g, '""')}","${e.sections.join('; ')}"`
    );
    const csv = [header, ...rows].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'query_history.csv';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('History exported as CSV');
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-background">
      <header className="h-12 flex items-center border-b border-border px-4 shrink-0">
        <SidebarTrigger className="mr-2" />
        <History className="w-4 h-4 text-accent mr-2" />
        <span className="text-sm font-semibold">Query History</span>
        <span className="ml-2 text-xs text-muted-foreground font-sans">({filtered.length} entries)</span>
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-3xl mx-auto px-4 py-6 space-y-4">

          {/* Search + filters */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); }}
                placeholder="Search questions, answers, sections..."
                className="pl-9 rounded-xl font-sans h-10"
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Type filter */}
            <div className="flex gap-2 shrink-0">
              {(['all', 'chat', 'fir'] as const).map((t) => (
                <button
                  key={t}
                  onClick={() => { setFilterType(t); setPage(1); }}
                  className={`px-3 h-10 rounded-xl text-xs font-semibold font-sans transition-colors border ${
                    filterType === t
                      ? 'gradient-gold text-primary border-transparent'
                      : 'border-border text-muted-foreground hover:text-foreground hover:border-accent/40'
                  }`}
                >
                  {t === 'all' ? 'All' : t === 'chat' ? 'Chat' : 'FIR'}
                </button>
              ))}
            </div>

            <Button variant="outline" size="sm" className="rounded-xl h-10 font-sans shrink-0" onClick={handleExportCSV}>
              <Download className="w-4 h-4 mr-1.5" /> Export CSV
            </Button>
          </div>

          {/* Empty state */}
          {filtered.length === 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
              <History className="w-10 h-10 text-muted-foreground/40 mx-auto mb-3" />
              <p className="text-muted-foreground font-sans text-sm">No history found</p>
              {search && <p className="text-xs text-muted-foreground font-sans mt-1">Try a different search term</p>}
            </motion.div>
          )}

          {/* History list */}
          <div className="space-y-2">
            <AnimatePresence initial={false}>
              {paginated.map((entry, i) => (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ delay: i < 8 ? i * 0.03 : 0 }}
                >
                  <Card className="overflow-hidden">
                    {/* Row header */}
                    <div
                      className="flex items-start gap-3 p-4 cursor-pointer hover:bg-muted/40 transition-colors"
                      onClick={() => setExpandedId(expandedId === entry.id ? null : entry.id)}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${entry.type === 'fir' ? 'bg-blue-500/10' : 'bg-accent/10'}`}>
                        {entry.type === 'fir'
                          ? <FileText className="w-4 h-4 text-blue-500" />
                          : <MessageSquare className="w-4 h-4 text-accent" />}
                      </div>

                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{entry.question}</p>
                        <div className="flex items-center gap-2 mt-1 flex-wrap">
                          <span className="text-xs text-muted-foreground font-sans">{formatDate(entry.date)}</span>
                          {entry.sections.slice(0, 2).map((s) => (
                            <span key={s} className="text-xs px-1.5 py-0.5 rounded bg-accent/10 text-accent font-sans">{s}</span>
                          ))}
                          {entry.sections.length > 2 && (
                            <span className="text-xs text-muted-foreground font-sans">+{entry.sections.length - 2} more</span>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-1 shrink-0">
                        <div
                          role="button"
                          onClick={(e) => { e.stopPropagation(); handleDelete(entry.id); }}
                          className="p-1.5 rounded-lg hover:bg-destructive/10 hover:text-destructive text-muted-foreground transition-colors cursor-pointer"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </div>
                        {expandedId === entry.id
                          ? <ChevronUp className="w-4 h-4 text-muted-foreground" />
                          : <ChevronDown className="w-4 h-4 text-muted-foreground" />}
                      </div>
                    </div>

                    {/* Expanded answer */}
                    <AnimatePresence>
                      {expandedId === entry.id && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.2 }}
                          className="overflow-hidden"
                        >
                          <div className="px-4 pb-4 pt-0 border-t border-border bg-muted/20">
                            <p className="text-xs font-semibold text-muted-foreground mb-2 mt-3 font-sans uppercase tracking-wide">Answer</p>
                            <p className="text-sm text-foreground font-sans leading-relaxed">{entry.answer}</p>
                            {entry.sections.length > 0 && (
                              <div className="flex flex-wrap gap-1.5 mt-3">
                                {entry.sections.map((s) => (
                                  <span key={s} className="text-xs px-2 py-1 rounded-lg bg-accent/10 text-accent border border-accent/20 font-sans">{s}</span>
                                ))}
                              </div>
                            )}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>

          {/* Load more */}
          {hasMore && (
            <div className="text-center pt-2">
              <Button variant="outline" className="rounded-xl font-sans text-sm" onClick={() => setPage((p) => p + 1)}>
                Load more ({filtered.length - paginated.length} remaining)
              </Button>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
