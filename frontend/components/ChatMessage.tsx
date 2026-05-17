'use client';

import { motion } from 'framer-motion';
import { Bot, User } from 'lucide-react';

interface ChatMessageProps {
  message: string;
  isBot: boolean;
  image?: string;
  delay?: number;
}

export function ChatMessage({ message, isBot, image, delay = 0 }: ChatMessageProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay }}
      className={`flex gap-3 ${isBot ? '' : 'flex-row-reverse'}`}
    >
      <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
        isBot ? 'gradient-navy text-accent' : 'gradient-gold text-primary'
      }`}>
        {isBot ? <Bot className="w-5 h-5" /> : <User className="w-5 h-5" />}
      </div>

      <div className={`max-w-[75%] rounded-2xl text-sm leading-relaxed overflow-hidden ${
        isBot
          ? 'bg-card border border-border text-foreground'
          : 'gradient-navy text-white'
      }`}>
        {image && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={image}
            alt="Attached image"
            className="w-full max-h-64 object-cover rounded-t-2xl"
          />
        )}
        {message && (
          <p className={`px-4 py-3 ${image ? 'border-t border-white/10' : ''}`}>{message}</p>
        )}
      </div>
    </motion.div>
  );
}
