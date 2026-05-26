'use client';

import { useState, useRef, useEffect, use } from 'react';
import { motion } from 'framer-motion';
import { Send, Mic, MicOff, Scale, ImageIcon, X, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ChatMessage } from '@/components/ChatMessage';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { useChatStore } from '@/store/chatStore';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { toast } from 'sonner';

export default function ChatWithIdPage({ params }: { params: Promise<{ chatId: string }> }) {
  const { chatId } = use(params);
  const { chats, addMessage, setActiveChat } = useChatStore();
  const [input, setInput] = useState('');
  const [pastedImage, setPastedImage] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [limitWarning, setLimitWarning] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { isListening, transcript, startListening, stopListening, isSupported } = useSpeechRecognition();

  const chat = chats.find((c) => c.id === chatId);

  useEffect(() => { if (chatId) setActiveChat(chatId); }, [chatId, setActiveChat]);
  useEffect(() => { if (transcript) setInput(transcript); }, [transcript]);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chat?.messages]);

  // Auto-resize textarea height as user types
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 160) + 'px';
  }, [input]);

  // Capture image from clipboard paste (Ctrl+V)
  const handlePaste = (e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const items = Array.from(e.clipboardData.items);
    const imageItem = items.find((item) => item.type.startsWith('image/'));
    if (imageItem) {
      e.preventDefault();
      const file = imageItem.getAsFile();
      if (!file) return;
      const reader = new FileReader();
      reader.onload = (ev) => setPastedImage(ev.target?.result as string);
      reader.readAsDataURL(file);
    }
  };

  // Capture image from file picker button
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setPastedImage(ev.target?.result as string);
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleSend = async () => {
    const msg = input.trim();
    if (!msg && !pastedImage) return;
    if (!chatId || isLoading) return;

    // Add user message to UI immediately
    addMessage(chatId, msg || '📎 Image attached', false, pastedImage ?? undefined);
    const sentMessage = msg;
    const sentImage = pastedImage;
    setInput('');
    setPastedImage(null);
    setIsLoading(true);

    try {
      // Call real Groq API — sends text + optional image
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: sentMessage,
          ...(sentImage && { image: sentImage }),
        }),
      });

      const data = await res.json();

      if (res.status === 429) {
        // Daily limit reached
        setLimitWarning(data.message);
        addMessage(chatId, data.message, true);
        return;
      }

      if (!res.ok) {
        throw new Error(data.error ?? 'Something went wrong.');
      }

      addMessage(chatId, data.answer, true);

      // Show remaining queries warning when running low
      if (data.remainingQueries !== null && data.remainingQueries <= 3) {
        setLimitWarning(`${data.remainingQueries} free queries remaining today.`);
      } else {
        setLimitWarning(null);
      }

    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to get response.';
      toast.error(message);
      addMessage(chatId, 'Sorry, I could not process your request. Please try again.', true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!chat) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p className="text-muted-foreground">Chat not found.</p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-background">
      <header className="h-12 flex items-center border-b border-border px-4 shrink-0">
        <SidebarTrigger className="mr-2" />
        <Scale className="w-4 h-4 text-accent mr-2" />
        <span className="text-sm font-medium text-foreground truncate">{chat.title}</span>
      </header>

      <div className="flex-1 overflow-y-auto px-4 py-6">
        <div className="max-w-3xl mx-auto space-y-4">
          {chat.messages.map((msg, i) => (
            <ChatMessage key={i} message={msg.text} isBot={msg.isBot} image={msg.image} />
          ))}

          {/* Loading indicator */}
          {isLoading && (
            <div className="flex gap-3">
              <div className="w-9 h-9 rounded-xl gradient-navy flex items-center justify-center shrink-0">
                <Scale className="w-5 h-5 text-accent animate-pulse" />
              </div>
              <div className="bg-card border border-border rounded-2xl px-4 py-3 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-accent animate-bounce [animation-delay:0ms]" />
                <span className="w-2 h-2 rounded-full bg-accent animate-bounce [animation-delay:150ms]" />
                <span className="w-2 h-2 rounded-full bg-accent animate-bounce [animation-delay:300ms]" />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="border-t border-border bg-card/60 backdrop-blur-sm px-4 py-3 shrink-0">
        <div className="max-w-3xl mx-auto space-y-2">

          {/* Daily limit warning */}
          {limitWarning && (
            <div className="flex items-center gap-2 text-xs text-yellow-600 dark:text-yellow-400 font-sans bg-yellow-500/10 border border-yellow-500/20 rounded-xl px-3 py-2">
              <AlertCircle className="w-3.5 h-3.5 shrink-0" />
              {limitWarning}
            </div>
          )}

          {/* Pasted image preview */}
          {pastedImage && (
            <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} className="relative inline-block">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src={pastedImage} alt="Attached" className="h-20 w-auto rounded-xl border border-border object-cover" />
              <button
                onClick={() => setPastedImage(null)}
                className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-destructive text-white flex items-center justify-center hover:opacity-80"
              >
                <X className="w-3 h-3" />
              </button>
            </motion.div>
          )}

          {/* Input row */}
          <form onSubmit={(e) => { e.preventDefault(); handleSend(); }} className="flex items-end gap-2">

            {/* Mic button */}
            {isSupported && (
              <Button type="button" variant="ghost" size="icon"
                className={`h-10 w-10 rounded-xl shrink-0 transition-all ${isListening ? 'bg-destructive text-destructive-foreground animate-pulse' : 'text-muted-foreground hover:text-accent'}`}
                onClick={isListening ? stopListening : startListening}
              >
                {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </Button>
            )}

            {/* Image attach button */}
            <Button type="button" variant="ghost" size="icon"
              className="h-10 w-10 rounded-xl shrink-0 text-muted-foreground hover:text-accent"
              onClick={() => fileInputRef.current?.click()}
              title="Attach image"
            >
              <ImageIcon className="w-5 h-5" />
            </Button>
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />

            {/* Textarea */}
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onPaste={handlePaste}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              placeholder={isListening ? 'Listening... speak now' : 'Ask about any legal section... (Paste image with Ctrl+V)'}
              rows={1}
              className="flex-1 resize-none rounded-xl bg-background border border-input px-3 py-2.5 text-sm font-sans focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-0 placeholder:text-muted-foreground min-h-[40px] max-h-40 leading-5 overflow-y-auto [&::-webkit-scrollbar]:hidden [scrollbar-width:none] disabled:opacity-50"
            />

            {/* Send button */}
            <Button type="submit" size="icon"
              disabled={(!input.trim() && !pastedImage) || isLoading}
              className="h-10 w-10 rounded-xl gradient-gold text-primary shrink-0 hover:opacity-90 disabled:opacity-40"
            >
              <Send className="w-5 h-5" />
            </Button>
          </form>

          {isListening && (
            <p className="text-center text-xs text-destructive animate-pulse font-sans">🎙️ Recording... tap mic to stop</p>
          )}
          <p className="text-center text-[10px] text-muted-foreground/50 font-sans">
            Paste image with Ctrl+V · Shift+Enter for new line · Enter to send
          </p>
        </div>
      </div>
    </div>
  );
}
