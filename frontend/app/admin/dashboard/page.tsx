'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Users, UserCheck, Crown, DollarSign, TrendingUp, MessageSquare,
  FileText, LogOut, ShieldAlert, Activity, ArrowUp, ArrowDown,
} from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell, Legend,
} from 'recharts';

type Metrics = {
  stats: {
    totalUsers: number;
    todaySignins: number;
    todayNewUsers: number;
    freeUsers: number;
    paidUsers: number;
    totalRevenue: number;
    monthRevenue: number;
    totalChats: number;
    totalFIRs: number;
    activeToday: number;
  };
  dailySignups: { day: string; users: number }[];
  dailyRevenue: { day: string; revenue: number }[];
  pieData: { name: string; value: number }[];
  recentUsers: { name: string; email: string; plan: string; joined: string; status: string }[];
  recentActivity: { user: string; action: string; time: string; type: string }[];
  updatedAt?: string;
  warning?: string;
};

const EMPTY: Metrics = {
  stats: {
    totalUsers: 0,
    todaySignins: 0,
    todayNewUsers: 0,
    freeUsers: 0,
    paidUsers: 0,
    totalRevenue: 0,
    monthRevenue: 0,
    totalChats: 0,
    totalFIRs: 0,
    activeToday: 0,
  },
  dailySignups: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => ({ day, users: 0 })),
  dailyRevenue: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day) => ({ day, revenue: 0 })),
  pieData: [
    { name: 'Free Users', value: 0 },
    { name: 'Paid Users', value: 0 },
  ],
  recentUsers: [],
  recentActivity: [],
};

const PIE_COLORS = ['hsl(220 20% 70%)', 'hsl(45 80% 55%)'];

function StatCard({
  icon: Icon, label, value, sub, color, bg, trend, delay,
}: {
  icon: React.ElementType; label: string; value: string | number;
  sub: string; color: string; bg: string; trend?: 'up' | 'down'; delay: number;
}) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}>
      <Card className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${bg}`}>
            <Icon className={`w-5 h-5 ${color}`} />
          </div>
          {trend && (
            <span className={`text-xs font-sans flex items-center gap-0.5 ${trend === 'up' ? 'text-green-600' : 'text-destructive'}`}>
              {trend === 'up' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
              {trend === 'up' ? 'live' : '—'}
            </span>
          )}
        </div>
        <p className="text-2xl font-bold leading-none mb-1">{value}</p>
        <p className="text-sm font-medium text-foreground">{label}</p>
        <p className="text-xs text-muted-foreground font-sans mt-0.5">{sub}</p>
      </Card>
    </motion.div>
  );
}

const ACTIVITY_COLORS: Record<string, string> = {
  fir: 'bg-blue-500/10 text-blue-600',
  chat: 'bg-accent/10 text-accent',
  upgrade: 'bg-green-500/10 text-green-600',
  signup: 'bg-purple-500/10 text-purple-600',
};

const PLAN_COLORS: Record<string, string> = {
  Free: 'bg-muted text-muted-foreground',
  Pro: 'bg-accent/15 text-accent border border-accent/30',
  Enterprise: 'bg-primary/10 text-primary border border-primary/20',
};

export default function AdminDashboardPage() {
  const router = useRouter();
  const [authed, setAuthed] = useState(false);
  const [metrics, setMetrics] = useState<Metrics>(EMPTY);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (sessionStorage.getItem('admin_auth') !== 'true') {
      router.replace('/admin/login');
    } else {
      setAuthed(true);
    }
  }, [router]);

  useEffect(() => {
    if (!authed) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch('/api/admin/metrics');
        const data = await res.json();
        if (!cancelled) setMetrics({ ...EMPTY, ...data });
      } catch {
        if (!cancelled) setMetrics(EMPTY);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [authed]);

  const handleLogout = () => {
    sessionStorage.removeItem('admin_auth');
    router.push('/admin/login');
  };

  if (!authed) return null;

  const S = metrics.stats;
  const paidPct = S.totalUsers > 0 ? Math.round((S.paidUsers / S.totalUsers) * 100) : 0;
  const pieData = metrics.pieData.map((p) => ({
    ...p,
    // Recharts Pie needs non-zero for empty look — keep 0 and show empty message instead
    value: p.value,
  }));
  const hasPie = pieData.some((p) => p.value > 0);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg gradient-navy flex items-center justify-center">
              <ShieldAlert className="w-4 h-4 text-accent" />
            </div>
            <div>
              <span className="font-bold text-sm">Admin Panel</span>
              <span className="text-xs text-muted-foreground font-sans ml-2">Legal Code Assistant</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground font-sans hidden sm:block">
              {loading ? 'Loading…' : 'Live from Supabase'}
            </span>
            <Button variant="ghost" size="sm" className="rounded-xl text-muted-foreground hover:text-destructive font-sans" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-1" /> Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <h1 className="text-2xl font-bold">Dashboard Overview</h1>
          <p className="text-muted-foreground text-sm font-sans mt-0.5">
            Today — {new Date().toLocaleDateString('en-PK', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
          {metrics.warning && (
            <p className="text-xs text-amber-600 font-sans mt-1">Could not fully load metrics: {metrics.warning}</p>
          )}
        </motion.div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={Users} label="Total Users" value={S.totalUsers} sub="All time registrations" color="text-blue-500" bg="bg-blue-500/10" trend="up" delay={0.05} />
          <StatCard icon={UserCheck} label="Today Sign-ins" value={S.todaySignins} sub={`${S.todayNewUsers} new today`} color="text-green-600" bg="bg-green-500/10" trend="up" delay={0.1} />
          <StatCard icon={Crown} label="Paid Users" value={S.paidUsers} sub={`${paidPct}% conversion rate`} color="text-accent" bg="bg-accent/10" trend="up" delay={0.15} />
          <StatCard icon={Activity} label="Active Today" value={S.activeToday} sub="Unique sessions" color="text-purple-500" bg="bg-purple-500/10" delay={0.2} />
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={DollarSign} label="Total Revenue" value={`Rs. ${S.totalRevenue.toLocaleString()}`} sub="From active Pro" color="text-emerald-600" bg="bg-emerald-500/10" trend="up" delay={0.25} />
          <StatCard icon={TrendingUp} label="This Month" value={`Rs. ${S.monthRevenue.toLocaleString()}`} sub="Estimated" color="text-orange-500" bg="bg-orange-500/10" trend="up" delay={0.3} />
          <StatCard icon={MessageSquare} label="Total Chats" value={S.totalChats} sub="Saved queries" color="text-sky-500" bg="bg-sky-500/10" delay={0.35} />
          <StatCard icon={FileText} label="FIRs Generated" value={S.totalFIRs} sub="Tracked when saved" color="text-rose-500" bg="bg-rose-500/10" delay={0.4} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }} className="lg:col-span-2">
            <Card className="p-5">
              <p className="text-sm font-semibold mb-1">New Signups — This Week</p>
              <p className="text-xs text-muted-foreground font-sans mb-4">Daily new user registrations</p>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={metrics.dailySignups} barSize={28}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 20% 88%)" vertical={false} />
                  <XAxis dataKey="day" tick={{ fontSize: 11, fill: 'hsl(220 15% 50%)' }} axisLine={false} tickLine={false} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: 'hsl(220 15% 50%)' }} axisLine={false} tickLine={false} width={24} />
                  <Tooltip contentStyle={{ background: 'hsl(0 0% 100%)', border: '1px solid hsl(220 20% 88%)', borderRadius: 10, fontSize: 12 }} cursor={{ fill: 'hsl(220 20% 92%)' }} />
                  <Bar dataKey="users" fill="hsl(220 60% 35%)" radius={[6, 6, 0, 0]} name="New Users" />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
            <Card className="p-5">
              <p className="text-sm font-semibold mb-1">User Breakdown</p>
              <p className="text-xs text-muted-foreground font-sans mb-2">Free vs Paid</p>
              {hasPie ? (
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={pieData} cx="50%" cy="45%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
                      {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                    </Pie>
                    <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                    <Tooltip contentStyle={{ background: 'hsl(0 0% 100%)', border: '1px solid hsl(220 20% 88%)', borderRadius: 10, fontSize: 12 }} />
                  </PieChart>
                </ResponsiveContainer>
              ) : (
                <div className="h-[200px] flex flex-col items-center justify-center text-center px-4">
                  <p className="text-sm text-muted-foreground font-sans">0 users yet</p>
                  <p className="text-xs text-muted-foreground font-sans mt-1">Chart fills when people sign up</p>
                </div>
              )}
            </Card>
          </motion.div>
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}>
          <Card className="p-5">
            <p className="text-sm font-semibold mb-1">Revenue — This Week</p>
            <p className="text-xs text-muted-foreground font-sans mb-4">Daily revenue in PKR</p>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={metrics.dailyRevenue} barSize={32}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 20% 88%)" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: 'hsl(220 15% 50%)' }} axisLine={false} tickLine={false} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: 'hsl(220 15% 50%)' }} axisLine={false} tickLine={false} width={40} />
                <Tooltip contentStyle={{ background: 'hsl(0 0% 100%)', border: '1px solid hsl(220 20% 88%)', borderRadius: 10, fontSize: 12 }} formatter={(v) => [`Rs. ${v}`, 'Revenue']} cursor={{ fill: 'hsl(220 20% 92%)' }} />
                <Bar dataKey="revenue" fill="hsl(45 80% 55%)" radius={[6, 6, 0, 0]} name="Revenue (PKR)" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
            <Card className="p-5">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-semibold">Recent Users</p>
                <span className="text-xs text-muted-foreground font-sans">{S.totalUsers} total</span>
              </div>
              {metrics.recentUsers.length === 0 ? (
                <p className="text-sm text-muted-foreground font-sans text-center py-8">No users yet — list grows on signup.</p>
              ) : (
                <div className="space-y-2">
                  {metrics.recentUsers.map((u) => (
                    <div key={u.email} className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-muted transition-colors">
                      <div className="w-8 h-8 rounded-full gradient-navy flex items-center justify-center shrink-0">
                        <span className="text-xs font-bold text-accent">{u.name[0]?.toUpperCase() || '?'}</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{u.name}</p>
                        <p className="text-xs text-muted-foreground font-sans truncate">{u.email}</p>
                      </div>
                      <div className="flex flex-col items-end gap-1 shrink-0">
                        <span className={`text-xs px-2 py-0.5 rounded-full font-sans font-medium ${PLAN_COLORS[u.plan] || PLAN_COLORS.Free}`}>{u.plan}</span>
                        <span className="text-xs text-muted-foreground font-sans">{u.joined}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </motion.div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.65 }}>
            <Card className="p-5">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-semibold">Recent Activity</p>
                <span className="text-xs text-muted-foreground font-sans">Live feed</span>
              </div>
              {metrics.recentActivity.length === 0 ? (
                <p className="text-sm text-muted-foreground font-sans text-center py-8">No activity yet — chats and signups appear here.</p>
              ) : (
                <div className="space-y-3">
                  {metrics.recentActivity.map((a, i) => (
                    <div key={i} className="flex items-start gap-3">
                      <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold ${ACTIVITY_COLORS[a.type] || ACTIVITY_COLORS.chat}`}>
                        {a.type === 'fir' ? <FileText className="w-4 h-4" /> :
                         a.type === 'chat' ? <MessageSquare className="w-4 h-4" /> :
                         a.type === 'upgrade' ? <Crown className="w-4 h-4" /> :
                         <UserCheck className="w-4 h-4" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium">{a.user}</p>
                        <p className="text-xs text-muted-foreground font-sans truncate">{a.action}</p>
                      </div>
                      <span className="text-xs text-muted-foreground font-sans shrink-0">{a.time}</span>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </motion.div>
        </div>

        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}>
          <Card className="p-4 gradient-navy border-0">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-xl font-bold text-sidebar-foreground">{S.totalUsers}</p>
                <p className="text-xs text-sidebar-foreground/60 font-sans">Total Users</p>
              </div>
              <div>
                <p className="text-xl font-bold text-accent">{paidPct}%</p>
                <p className="text-xs text-sidebar-foreground/60 font-sans">Conversion Rate</p>
              </div>
              <div>
                <p className="text-xl font-bold text-sidebar-foreground">Rs. {S.totalRevenue.toLocaleString()}</p>
                <p className="text-xs text-sidebar-foreground/60 font-sans">Total Revenue</p>
              </div>
              <div>
                <p className="text-xl font-bold text-sidebar-foreground">{S.totalChats}</p>
                <p className="text-xs text-sidebar-foreground/60 font-sans">Total Chats</p>
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
