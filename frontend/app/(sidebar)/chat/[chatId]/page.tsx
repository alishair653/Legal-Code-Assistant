'use client';

import { useState, useRef, useEffect, use } from 'react';
import { motion } from 'framer-motion';
import { Send, Mic, MicOff, Scale, ImageIcon, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { ChatMessage } from '@/components/ChatMessage';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { useChatStore } from '@/store/chatStore';
import { SidebarTrigger } from '@/components/ui/sidebar';

const sampleResponses: Record<string, string> = {
  theft: "Under PPC Section 378-382, theft (chori) is defined as dishonestly taking movable property. Punishment ranges from 3-7 years imprisonment with fine. For armed robbery (dacoity), Section 391-402 applies with up to 10 years RI.",
  bail: "Bail eligibility depends on the offense category. Bailable offenses (like simple hurt under Section 337) allow bail as of right. For non-bailable offenses (like murder under Section 302), bail requires court discretion under CrPC Section 497.",
  fir: "An FIR (First Information Report) is filed under CrPC Section 154. Police must register an FIR for cognizable offenses. If police refuse, you can approach the SP or file under Section 22-A before a Sessions Judge.",
  murder: "Under PPC Section 302, Qatl-i-Amd (intentional murder) is punishable by death as Qisas, or life imprisonment as Ta'zir with possible fine. The heirs of the victim may also opt for Diyat (blood money) under Section 310.",
  fraud: "Section 420 PPC covers cheating and dishonestly inducing delivery of property. Punishment is up to 7 years imprisonment and fine. It's a non-bailable, cognizable offense.",
  default: "Based on Pakistani law, I can help you understand the relevant legal provisions. Could you provide more details about your specific query? I can reference PPC, CrPC, QSO, and all other Pakistani legal codes.",
};

function getResponse(msg: string): string {
  const lower = msg.toLowerCase();
  if (lower.includes('theft') || lower.includes('chori') || lower.includes('steal')) return sampleResponses.theft;
  if (lower.includes('bail') || lower.includes('zamanat')) return sampleResponses.bail;
  if (lower.includes('fir') || lower.includes('report')) return sampleResponses.fir;
  if (lower.includes('murder') || lower.includes('qatl') || lower.includes('kill')) return sampleResponses.murder;
  if (lower.includes('fraud') || lower.includes('cheat') || lower.includes('420')) return sampleResponses.fraud;
  return sampleResponses.default;
}

export default function ChatWithIdPage({ params }: { params: Promise<{ chatId: string }> }) {
  const { chatId } = use(params);
  const { chats, addMessage, setActiveChat } = useChatStore();
  const [input, setInput] = useState('');
  const [pastedImage, setPastedImage] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { isListening, transcript, startListening, stopListening, isSupported } = useSpeechRecognition();

  const chat = chats.find((c) => c.id === chatId);

  useEffect(() => { if (chatId) setActiveChat(chatId); }, [chatId, setActiveChat]);
  useEffect(() => { if (transcript) setInput(transcript); }, [transcript]);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [chat?.messages]);

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (!ta) return;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 160) + 'px';
  }, [input]);

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

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => setPastedImage(ev.target?.result as string);
    reader.readAsDataURL(file);
    e.target.value = '';
  };

  const handleSend = () => {
    const msg = input.trim();
    if (!msg && !pastedImage) return;
    if (!chatId) return;

    addMessage(chatId, msg || '📎 Image attached', false, pastedImage ?? undefined);
    setInput('');
    setPastedImage(null);

    setTimeout(() => {
      const reply = pastedImage && !msg
        ? "I can see you've shared an image. Once our AI backend is connected, I'll be able to analyze documents, FIRs, legal notices, and other Pakistani legal materials from images."
        : getResponse(msg);
      addMessage(chatId, reply, true);
    }, 600 + Math.random() * 800);
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
          <div ref={messagesEndRef} />
        </div>
      </div>

      <div className="border-t border-border bg-card/60 backdrop-blur-sm px-4 py-3 shrink-0">
        <div className="max-w-3xl mx-auto space-y-2">

          {/* Image preview */}
          {pastedImage && (
            <motion.div
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative inline-block"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={pastedImage}
                alt="Pasted image"
                className="h-20 w-auto rounded-xl border border-border object-cover"
              />
              <button
                onClick={() => setPastedImage(null)}
                className="absolute -top-2 -right-2 w-5 h-5 rounded-full bg-destructive text-white flex items-center justify-center hover:opacity-80 transition-opacity"
              >
                <X className="w-3 h-3" />
              </button>
            </motion.div>
          )}

          {/* Input row */}
          <form
            onSubmit={(e) => { e.preventDefault(); handleSend(); }}
            className="flex items-end gap-2"
          >
            {/* Mic */}
            {isSupported && (
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className={`h-10 w-10 rounded-xl shrink-0 transition-all ${isListening ? 'bg-destructive text-destructive-foreground animate-pulse' : 'text-muted-foreground hover:text-accent'}`}
                onClick={isListening ? stopListening : startListening}
              >
                {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
              </Button>
            )}

            {/* Image attach button */}
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-10 w-10 rounded-xl shrink-0 text-muted-foreground hover:text-accent"
              onClick={() => fileInputRef.current?.click()}
              title="Attach image"
            >
              <ImageIcon className="w-5 h-5" />
            </Button>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileChange}
            />

            {/* Textarea */}
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onPaste={handlePaste}
              onKeyDown={handleKeyDown}
              placeholder={isListening ? 'Listening... speak now' : 'Ask about any legal section... (Paste image with Ctrl+V)'}
              rows={1}
              className="flex-1 resize-none rounded-xl bg-background border border-input px-3 py-2.5 text-sm font-sans focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-0 placeholder:text-muted-foreground min-h-[40px] max-h-40 leading-5 overflow-y-auto [&::-webkit-scrollbar]:hidden [scrollbar-width:none]"
            />

            {/* Send */}
            <Button
              type="submit"
              size="icon"
              disabled={!input.trim() && !pastedImage}
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
