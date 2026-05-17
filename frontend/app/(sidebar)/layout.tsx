'use client';

import { SidebarProvider, useSidebar } from '@/components/ui/sidebar';
import { AppSidebar } from '@/components/AppSidebar';
import { ChevronLeft, ChevronRight } from 'lucide-react';

function SidebarEdgeToggle() {
  const { open, toggleSidebar } = useSidebar();

  return (
    <button
      onClick={toggleSidebar}
      className="fixed top-1/2 -translate-y-1/2 z-50 h-12 w-5 flex items-center justify-center bg-card border border-border border-l-0 rounded-r-lg shadow-sm hover:bg-muted transition-all duration-300 ease-in-out"
      style={{ left: open ? '16rem' : '0px' }}
      aria-label={open ? 'Close sidebar' : 'Open sidebar'}
    >
      {open
        ? <ChevronLeft className="w-3 h-3 text-muted-foreground" />
        : <ChevronRight className="w-3 h-3 text-muted-foreground" />}
    </button>
  );
}

export default function SidebarLayout({ children }: { children: React.ReactNode }) {
  return (
    <SidebarProvider defaultOpen={true}>
      <div className="min-h-screen flex w-full relative">
        <AppSidebar />
        <SidebarEdgeToggle />
        {children}
      </div>
    </SidebarProvider>
  );
}
