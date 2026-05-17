'use client';

import { useChatStore } from '@/store/chatStore';
import { motion } from 'framer-motion';
import {
  MessageSquare, FileText, Scale, Crown, TrendingUp,
  ClipboardCheck, History, ChevronRight, User, Zap,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { SidebarTrigger } from '@/components/ui/sidebar';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from 'recharts';

const WEEKLY_DATA = [
  { day: 'Mon', queries: 4 },
  { day: 'Tue', queries: 7 },
  { day: 'Wed', queries: 3 },
  { day: 'Thu', queries: 9 },
  { day: 'Fri', queries: 6 },
  { day: 'Sat', queries: 2 },
  { day: 'Sun', queries: 5 },
];

const TOP_SECTIONS = [
  { ref: 'PPC § 302', title: 'Punishment for Murder', count: 18 },
  { ref: 'PPC § 420', title: 'Cheating / Fraud', count: 14 },
  { ref: 'CrPC § 154', title: 'FIR Registration', count: 11 },
  { ref: 'PPC § 392', title: 'Robbery', count: 9 },
  { ref: 'PPC § 337', title: 'Causing Hurt', count: 7 },
];

const QUICK_ACTIONS = [
  { label: 'New Chat', icon: MessageSquare, route: '/chat', color: 'text-blue-500', bg: 'bg-blue-500/10' },
  { label: 'FIR Generator', icon: FileText, route: '/fir', color: 'text-accent', bg: 'bg-accent/10' },
  { label: 'Self-Assessment', icon: ClipboardCheck, route: '/assessment', color: 'text-green-500', bg: 'bg-green-500/10' },
  { label: 'View History', icon: History, route: '/history', color: 'text-purple-500', bg: 'bg-purple-500/10' },
];

function StatCard({
  icon: Icon, label, value, sub, color, delay,
}: {
  icon: React.ElementType; label: string; value: string | number; sub: string; color: string; delay: number;
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}>
      <Card className="p-5 flex items-start gap-4">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
        <div>
          <p className="text-2xl font-bold leading-none mb-1">{value}</p>
          <p className="text-sm font-medium text-foreground">{label}</p>
          <p className="text-xs text-muted-foreground font-sans mt-0.5">{sub}</p>
        </div>
      </Card>
    </motion.div>
  );
}

export default function DashboardPage() {
  const { user, isPro, chats, isLoggedIn } = useChatStore();
  const router = useRouter();

  const totalMessages = chats.reduce((acc, c) => acc + c.messages.filter((m) => !m.isBot).length, 0);
  const recentChats = [...chats].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime()).slice(0, 5);

  const displayName = user?.name ?? 'Guest';
  const plan = isPro ? 'Pro' : 'Free';

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-background">
      <header className="h-12 flex items-center border-b border-border px-4 shrink-0">
        <SidebarTrigger className="mr-2" />
        <TrendingUp className="w-4 h-4 text-accent mr-2" />
        <span className="text-sm font-semibold">Dashboard</span>
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-5xl mx-auto px-4 py-8 space-y-6">

          {/* Welcome */}
          <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h1 className="text-2xl font-bold">Welcome back, {displayName}</h1>
              <p className="text-muted-foreground text-sm font-sans mt-0.5">Here is your legal assistant overview</p>
            </div>
            <span className={`text-xs font-semibold px-3 py-1.5 rounded-full font-sans ${isPro ? 'gradient-gold text-primary' : 'bg-muted text-muted-foreground'}`}>
              {isPro ? '★ Pro Plan' : 'Free Plan'}
            </span>
          </motion.div>

          {/* Stat cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard icon={MessageSquare} label="Total Chats" value={chats.length} sub="All time" color="bg-blue-500/10 text-blue-500" delay={0.05} />
            <StatCard icon={Scale} label="Queries Asked" value={totalMessages} sub="All time" color="bg-accent/10 text-accent" delay={0.1} />
            <StatCard icon={FileText} label="FIRs Generated" value={3} sub="This month" color="bg-green-500/10 text-green-500" delay={0.15} />
            <StatCard icon={Zap} label="Today's Queries" value={isPro ? '∞' : '10'} sub={isPro ? 'Unlimited' : 'Free tier limit'} color="bg-purple-500/10 text-purple-500" delay={0.2} />
          </div>

          {/* Chart + Quick Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

            {/* Bar chart */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="lg:col-span-2">
              <Card className="p-5 h-full">
                <p className="text-sm font-semibold mb-4">Queries This Week</p>
                <ResponsiveContainer width="100%" height={180}>
                  <BarChart data={WEEKLY_DATA} barSize={28}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 20% 88%)" vertical={false} />
                    <XAxis dataKey="day" tick={{ fontSize: 11, fill: 'hsl(220 15% 50%)' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: 'hsl(220 15% 50%)' }} axisLine={false} tickLine={false} width={24} />
                    <Tooltip
                      contentStyle={{ background: 'hsl(0 0% 100%)', border: '1px solid hsl(220 20% 88%)', borderRadius: 10, fontSize: 12 }}
                      cursor={{ fill: 'hsl(220 20% 92%)' }}
                    />
                    <Bar dataKey="queries" fill="hsl(45 80% 55%)" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </Card>
            </motion.div>

            {/* Quick actions */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
              <Card className="p-5 h-full">
                <p className="text-sm font-semibold mb-4">Quick Actions</p>
                <div className="space-y-2">
                  {QUICK_ACTIONS.map(({ label, icon: Icon, route, color, bg }) => (
                    <button
                      key={label}
                      onClick={() => router.push(route)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-muted transition-colors text-left"
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${bg}`}>
                        <Icon className={`w-4 h-4 ${color}`} />
                      </div>
                      <span className="text-sm font-medium">{label}</span>
                      <ChevronRight className="w-4 h-4 text-muted-foreground ml-auto" />
                    </button>
                  ))}
                </div>
              </Card>
            </motion.div>
          </div>

          {/* Recent chats + Top sections */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

            {/* Recent chats */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
              <Card className="p-5">
                <div className="flex items-center justify-between mb-4">
                  <p className="text-sm font-semibold">Recent Chats</p>
                  <button onClick={() => router.push('/chat')} className="text-xs text-accent font-sans hover:underline">View all</button>
                </div>
                {recentChats.length === 0 ? (
                  <p className="text-sm text-muted-foreground font-sans text-center py-6">No chats yet. Start a new conversation!</p>
                ) : (
                  <div className="space-y-2">
                    {recentChats.map((chat) => (
                      <button
                        key={chat.id}
                        onClick={() => router.push(`/chat/${chat.id}`)}
                        className="w-full flex items-start gap-3 px-3 py-2.5 rounded-xl hover:bg-muted transition-colors text-left"
                      >
                        <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center shrink-0 mt-0.5">
                          <MessageSquare className="w-4 h-4 text-accent" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{chat.title}</p>
                          <p className="text-xs text-muted-foreground font-sans capitalize">{chat.role} · {chat.messages.length} messages</p>
                        </div>
                      </button>
                    ))}
                  </div>
                )}
              </Card>
            </motion.div>

            {/* Top sections */}
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
              <Card className="p-5">
                <p className="text-sm font-semibold mb-4">Most Queried Sections</p>
                <div className="space-y-3">
                  {TOP_SECTIONS.map((s, i) => (
                    <div key={s.ref} className="flex items-center gap-3">
                      <span className="text-xs text-muted-foreground font-sans w-4 shrink-0">{i + 1}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs font-semibold text-accent font-sans">{s.ref}</span>
                          <span className="text-xs text-muted-foreground font-sans">{s.count}</span>
                        </div>
                        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                          <div
                            className="h-full gradient-gold rounded-full transition-all duration-700"
                            style={{ width: `${(s.count / TOP_SECTIONS[0].count) * 100}%` }}
                          />
                        </div>
                        <p className="text-xs text-muted-foreground font-sans mt-0.5 truncate">{s.title}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>
            </motion.div>
          </div>

          {/* Upgrade banner — only for free users */}
          {!isPro && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }}>
              <Card className="p-5 gradient-navy border-0 flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                  <Crown className="w-6 h-6 text-accent shrink-0" />
                  <div>
                    <p className="font-semibold text-sidebar-foreground">Upgrade to Pro</p>
                    <p className="text-xs text-sidebar-foreground/70 font-sans">Unlimited queries, FIR Generator, Case Predictor & more</p>
                  </div>
                </div>
                <Button
                  className="gradient-gold text-primary font-semibold rounded-xl shrink-0"
                  onClick={() => router.push('/pricing')}
                >
                  View Plans
                </Button>
              </Card>
            </motion.div>
          )}

          {/* Guest prompt */}
          {!isLoggedIn && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
              <Card className="p-5 border-dashed flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="font-medium text-sm">Sign in to save your progress</p>
                    <p className="text-xs text-muted-foreground font-sans">Your chats and history will be saved to your account</p>
                  </div>
                </div>
                <Button variant="outline" className="rounded-xl shrink-0 font-sans text-sm" onClick={() => router.push('/login')}>
                  Sign In
                </Button>
              </Card>
            </motion.div>
          )}

        </div>
      </div>
    </div>
  );
}
