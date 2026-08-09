'use client';

import { motion } from 'framer-motion';
import { Bot, User } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

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
        isBot ? 'gradient-navy text-accent' : 'gradient-gold text-[hsl(220,60%,12%)]'
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
          <div className={`px-4 py-3 ${image ? 'border-t border-white/10' : ''}`}>
            {isBot ? (
              <ReactMarkdown
                components={{
                  p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
                  strong: ({ children }) => <strong className="font-semibold text-accent">{children}</strong>,
                  ul: ({ children }) => <ul className="list-disc list-inside space-y-1 my-2 ml-1">{children}</ul>,
                  ol: ({ children }) => <ol className="list-decimal list-inside space-y-1 my-2 ml-1">{children}</ol>,
                  li: ({ children }) => <li className="leading-snug">{children}</li>,
                  h1: ({ children }) => <h1 className="font-bold text-base mb-1">{children}</h1>,
                  h2: ({ children }) => <h2 className="font-semibold text-sm mb-1">{children}</h2>,
                  h3: ({ children }) => <h3 className="font-semibold text-sm mb-1">{children}</h3>,
                  code: ({ children }) => <code className="bg-muted px-1 rounded text-xs font-mono">{children}</code>,
                  hr: () => <hr className="border-border my-3" />,
                }}
              >
                {message}
              </ReactMarkdown>
            ) : (
              <p>{message}</p>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}
