'use client';

import { useState } from 'react';
import {
  Plus, MessageSquare, Trash2, Pencil, Check, X, Scale,
  LogIn, Crown, Settings, ClipboardCheck, User, FileText,
  LayoutDashboard, History, ChevronDown, ChevronRight as ChevronRightIcon,
  Gavel, ScanText,
} from 'lucide-react';
import { useRouter, usePathname } from 'next/navigation';
import { useChatStore } from '@/store/chatStore';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent,
  SidebarGroupLabel, SidebarMenu, SidebarMenuButton, SidebarMenuItem,
  SidebarHeader, SidebarFooter, useSidebar,
} from '@/components/ui/sidebar';

const TOOLS = [
  { label: 'Dashboard',          icon: LayoutDashboard, route: '/dashboard' },
  { label: 'FIR Generator',      icon: FileText,        route: '/fir' },
  { label: 'Case Predictor',     icon: Gavel,           route: '/predictor' },
  { label: 'Document Analyzer',  icon: ScanText,        route: '/analyzer' },
  { label: 'Self-Assessment',    icon: ClipboardCheck,  route: '/assessment' },
  { label: 'Query History',      icon: History,         route: '/history' },
];

export function AppSidebar() {
  const { isMobile, setOpenMobile } = useSidebar();
  const pathname = usePathname();
  const router = useRouter();
  const { chats, activeChatId, setActiveChat, addChat, deleteChat, renameChat, isLoggedIn, isPro, user } = useChatStore();
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [toolsOpen, setToolsOpen] = useState(true);

  const navigate = (route: string) => {
    router.push(route);
    if (isMobile) setOpenMobile(false);
  };

  const handleNewChat = () => {
    const id = addChat('citizen');
    navigate(`/chat/${id}`);
  };

  const handleChatClick = (id: string) => {
    setActiveChat(id);
    navigate(`/chat/${id}`);
  };

  const confirmRename = () => {
    if (editingId && editTitle.trim()) renameChat(editingId, editTitle.trim());
    setEditingId(null);
  };

  const todayChats = chats.filter((c) => c.createdAt.toDateString() === new Date().toDateString());
  const olderChats = chats.filter((c) => c.createdAt.toDateString() !== new Date().toDateString());
  const isActive = (route: string) => pathname === route;

  return (
    <Sidebar collapsible="offcanvas" className="border-r border-sidebar-border">

      {/* ── Header ── */}
      <SidebarHeader className="p-3">
        <div className="flex items-center gap-2 px-1">
          <div className="w-8 h-8 rounded-lg gradient-gold flex items-center justify-center shrink-0">
            <Scale className="w-4 h-4 text-primary" />
          </div>
          <span className="font-bold text-sm text-sidebar-foreground truncate" style={{ fontFamily: "'Playfair Display', serif" }}>
            Legal Code AI
          </span>
        </div>
        <Button
          onClick={handleNewChat}
          className="w-full mt-3 gradient-gold text-primary hover:opacity-90 font-semibold text-sm rounded-xl h-9"
          size="sm"
        >
          <Plus className="w-4 h-4" />
          <span className="ml-1">New Chat</span>
        </Button>
      </SidebarHeader>

      <SidebarContent className="px-2">

        {/* ── Tools — collapsible ── */}
        <SidebarGroup>
          <button
            onClick={() => setToolsOpen(!toolsOpen)}
            className="flex items-center justify-between w-full px-2 py-2 rounded-lg hover:bg-sidebar-accent/40 transition-colors group"
          >
            <span className="text-xs font-semibold text-sidebar-foreground/50 uppercase tracking-wider">
              Tools
            </span>
            {toolsOpen
              ? <ChevronDown className="w-3.5 h-3.5 text-sidebar-foreground/40 group-hover:text-sidebar-foreground/70 transition-colors" />
              : <ChevronRightIcon className="w-3.5 h-3.5 text-sidebar-foreground/40 group-hover:text-sidebar-foreground/70 transition-colors" />}
          </button>

          {toolsOpen && (
            <SidebarGroupContent>
              <SidebarMenu>
                {TOOLS.map(({ label, icon: Icon, route }) => (
                  <SidebarMenuItem key={route}>
                    <SidebarMenuButton
                      className={`rounded-xl text-sm transition-colors ${
                        isActive(route)
                          ? 'bg-sidebar-accent text-sidebar-foreground font-semibold'
                          : 'text-sidebar-foreground/70 hover:text-sidebar-foreground hover:bg-sidebar-accent/50'
                      }`}
                      onClick={() => navigate(route)}
                    >
                      <Icon className="w-4 h-4 shrink-0" />
                      <span>{label}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          )}
        </SidebarGroup>

        {/* ── Today's chats ── */}
        {todayChats.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-xs text-sidebar-foreground/50 px-2">Today</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {todayChats.map((chat) => (
                  <SidebarMenuItem key={chat.id}>
                    {editingId === chat.id ? (
                      <div className="flex items-center gap-1 px-2 py-1">
                        <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="h-7 text-xs rounded-lg" autoFocus onKeyDown={(e) => e.key === 'Enter' && confirmRename()} />
                        <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0" onClick={confirmRename}><Check className="w-3 h-3" /></Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0" onClick={() => setEditingId(null)}><X className="w-3 h-3" /></Button>
                      </div>
                    ) : (
                      <SidebarMenuButton
                        className={`group rounded-xl text-sm ${activeChatId === chat.id ? 'bg-sidebar-accent text-sidebar-foreground' : 'text-sidebar-foreground/70 hover:text-sidebar-foreground'}`}
                        onClick={() => handleChatClick(chat.id)}
                      >
                        <MessageSquare className="w-4 h-4 shrink-0" />
                        <span className="truncate flex-1">{chat.title}</span>
                        <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 shrink-0">
                          <div role="button" onClick={(e) => { e.stopPropagation(); setEditingId(chat.id); setEditTitle(chat.title); }} className="p-1 hover:text-sidebar-primary rounded cursor-pointer"><Pencil className="w-3 h-3" /></div>
                          <div role="button" onClick={(e) => { e.stopPropagation(); deleteChat(chat.id); }} className="p-1 hover:text-destructive rounded cursor-pointer"><Trash2 className="w-3 h-3" /></div>
                        </div>
                      </SidebarMenuButton>
                    )}
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        {/* ── Previous chats ── */}
        {olderChats.length > 0 && (
          <SidebarGroup>
            <SidebarGroupLabel className="text-xs text-sidebar-foreground/50 px-2">Previous</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {olderChats.map((chat) => (
                  <SidebarMenuItem key={chat.id}>
                    {editingId === chat.id ? (
                      <div className="flex items-center gap-1 px-2 py-1">
                        <Input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} className="h-7 text-xs rounded-lg" autoFocus onKeyDown={(e) => e.key === 'Enter' && confirmRename()} />
                        <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0" onClick={confirmRename}><Check className="w-3 h-3" /></Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7 shrink-0" onClick={() => setEditingId(null)}><X className="w-3 h-3" /></Button>
                      </div>
                    ) : (
                      <SidebarMenuButton
                        className={`group rounded-xl text-sm ${activeChatId === chat.id ? 'bg-sidebar-accent text-sidebar-foreground' : 'text-sidebar-foreground/70 hover:text-sidebar-foreground'}`}
                        onClick={() => handleChatClick(chat.id)}
                      >
                        <MessageSquare className="w-4 h-4 shrink-0" />
                        <span className="truncate flex-1">{chat.title}</span>
                        <div className="opacity-0 group-hover:opacity-100 flex items-center gap-0.5 shrink-0">
                          <div role="button" onClick={(e) => { e.stopPropagation(); setEditingId(chat.id); setEditTitle(chat.title); }} className="p-1 hover:text-sidebar-primary rounded cursor-pointer"><Pencil className="w-3 h-3" /></div>
                          <div role="button" onClick={(e) => { e.stopPropagation(); deleteChat(chat.id); }} className="p-1 hover:text-destructive rounded cursor-pointer"><Trash2 className="w-3 h-3" /></div>
                        </div>
                      </SidebarMenuButton>
                    )}
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

      </SidebarContent>

      {/* ── Footer ── */}
      <SidebarFooter className="p-3 space-y-1">
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              className={`rounded-xl text-sm ${isActive('/settings') ? 'bg-sidebar-accent text-sidebar-foreground' : 'text-sidebar-foreground/70 hover:text-sidebar-foreground'}`}
              onClick={() => navigate('/settings')}
            >
              <Settings className="w-4 h-4" />
              <span>Settings</span>
            </SidebarMenuButton>
          </SidebarMenuItem>

          {!isPro && (
            <SidebarMenuItem>
              <SidebarMenuButton className="rounded-xl text-sm text-sidebar-primary hover:bg-sidebar-accent" onClick={() => navigate('/pricing')}>
                <Crown className="w-4 h-4" />
                <span>Upgrade to Pro</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}

          {isLoggedIn ? (
            <SidebarMenuItem>
              <SidebarMenuButton
                className={`rounded-xl text-sm ${isActive('/profile') ? 'bg-sidebar-accent text-sidebar-foreground' : 'text-sidebar-foreground/70 hover:text-sidebar-foreground'}`}
                onClick={() => navigate('/profile')}
              >
                <div className="w-6 h-6 rounded-full gradient-navy flex items-center justify-center shrink-0">
                  <User className="w-3 h-3 text-accent" />
                </div>
                <span className="truncate">{user?.name}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ) : (
            <SidebarMenuItem>
              <SidebarMenuButton className="rounded-xl text-sm text-sidebar-foreground/70 hover:text-sidebar-foreground" onClick={() => navigate('/login')}>
                <LogIn className="w-4 h-4" />
                <span>Sign In</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          )}
        </SidebarMenu>
      </SidebarFooter>

    </Sidebar>
  );
}
