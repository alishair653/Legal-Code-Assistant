'use client';

import { motion } from 'framer-motion';
import { LucideIcon } from 'lucide-react';

interface RoleCardProps {
  title: string;
  description: string;
  icon: LucideIcon;
  onClick: () => void;
  delay?: number;
}

export function RoleCard({ title, description, icon: Icon, onClick, delay = 0 }: RoleCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay }}
      whileHover={{ y: -6, scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="cursor-pointer group"
    >
      <div className="relative p-8 rounded-2xl bg-card border border-border shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden">
        <div className="absolute inset-0 opacity-0 group-hover:opacity-5 transition-opacity duration-300 gradient-gold" />
        <div className="relative z-10">
          <div className="w-14 h-14 rounded-xl gradient-gold flex items-center justify-center mb-5 shadow-md group-hover:shadow-lg transition-shadow">
            <Icon className="w-7 h-7 text-primary" />
          </div>
          <h3 className="text-xl font-bold mb-2 text-foreground">{title}</h3>
          <p className="text-muted-foreground text-sm leading-relaxed">{description}</p>
        </div>
        <div className="absolute bottom-0 left-0 right-0 h-1 gradient-gold transform scale-x-0 group-hover:scale-x-100 transition-transform duration-300 origin-left" />
      </div>
    </motion.div>
  );
}
