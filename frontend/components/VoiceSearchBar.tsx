'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Mic, MicOff, Search, X } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';

interface VoiceSearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
}

export function VoiceSearchBar({ onSearch, placeholder = 'Search Pakistani law...' }: VoiceSearchBarProps) {
  const [query, setQuery] = useState('');
  const { isListening, transcript, startListening, stopListening, isSupported } = useSpeechRecognition();

  useEffect(() => {
    if (transcript) setQuery(transcript);
  }, [transcript]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) onSearch(query.trim());
  };

  return (
    <form onSubmit={handleSubmit} className="relative w-full max-w-2xl mx-auto">
      <div className="relative flex items-center">
        <Search className="absolute left-4 w-5 h-5 text-muted-foreground z-10" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={placeholder}
          className="pl-12 pr-24 h-14 text-base rounded-2xl bg-card border-border shadow-lg font-sans"
        />
        <div className="absolute right-2 flex items-center gap-1">
          {query && (
            <Button type="button" variant="ghost" size="icon" className="h-9 w-9 rounded-xl text-muted-foreground hover:text-foreground" onClick={() => setQuery('')}>
              <X className="w-4 h-4" />
            </Button>
          )}
          {isSupported && (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className={`h-10 w-10 rounded-xl transition-all ${isListening ? 'bg-destructive text-destructive-foreground animate-pulse' : 'text-muted-foreground hover:text-accent hover:bg-accent/10'}`}
              onClick={isListening ? stopListening : startListening}
            >
              {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </Button>
          )}
        </div>
      </div>
      <AnimatePresence>
        {isListening && (
          <motion.div initial={{ opacity: 0, y: -5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -5 }} className="absolute -bottom-8 left-0 right-0 text-center">
            <span className="text-sm text-accent font-medium flex items-center justify-center gap-2">
              <span className="w-2 h-2 rounded-full bg-destructive animate-pulse" />
              Listening... Speak now
            </span>
          </motion.div>
        )}
      </AnimatePresence>
    </form>
  );
}
