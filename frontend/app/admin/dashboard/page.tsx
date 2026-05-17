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

// ── Mock data (replace with real API calls when backend is ready) ──
const STATS = {
  totalUsers: 248,
  todaySignins: 17,
  todayNewUsers: 5,
  freeUsers: 211,
  paidUsers: 37,
  totalRevenue: 18463,
  monthRevenue: 4986,
  totalChats: 1342,
  totalFIRs: 89,
  activeToday: 42,
};

const DAILY_SIGNUPS = [
  { day: 'Mon', users: 8 },
  { day: 'Tue', users: 14 },
  { day: 'Wed', users: 6 },
  { day: 'Thu', users: 19 },
  { day: 'Fri', users: 11 },
  { day: 'Sat', users: 5 },
  { day: 'Sun', users: 17 },
];

const DAILY_REVENUE = [
  { day: 'Mon', revenue: 998 },
  { day: 'Tue', revenue: 1497 },
  { day: 'Wed', revenue: 499 },
  { day: 'Thu', revenue: 1996 },
  { day: 'Fri', revenue: 998 },
  { day: 'Sat', revenue: 499 },
  { day: 'Sun', revenue: 499 },
];

const PIE_DATA = [
  { name: 'Free Users', value: STATS.freeUsers },
  { name: 'Paid Users', value: STATS.paidUsers },
];
const PIE_COLORS = ['hsl(220 20% 70%)', 'hsl(45 80% 55%)'];

const RECENT_USERS = [
  { name: 'Muhammad Ali', email: 'ali@gmail.com', plan: 'Pro', joined: '2 min ago', status: 'active' },
  { name: 'Sara Ahmed', email: 'sara@yahoo.com', plan: 'Free', joined: '15 min ago', status: 'active' },
  { name: 'Bilal Khan', email: 'bilal@hotmail.com', plan: 'Pro', joined: '1 hr ago', status: 'active' },
  { name: 'Fatima Malik', email: 'fatima@gmail.com', plan: 'Free', joined: '3 hr ago', status: 'inactive' },
  { name: 'Usman Raza', email: 'usman@gmail.com', plan: 'Enterprise', joined: '5 hr ago', status: 'active' },
  { name: 'Zainab Hussain', email: 'zainab@outlook.com', plan: 'Free', joined: '1 day ago', status: 'active' },
  { name: 'Hassan Iqbal', email: 'hassan@gmail.com', plan: 'Pro', joined: '1 day ago', status: 'inactive' },
];

const RECENT_ACTIVITY = [
  { user: 'Muhammad Ali', action: 'Generated FIR', time: '3 min ago', type: 'fir' },
  { user: 'Sara Ahmed', action: 'Asked about Section 302', time: '8 min ago', type: 'chat' },
  { user: 'Usman Raza', action: 'Upgraded to Enterprise', time: '22 min ago', type: 'upgrade' },
  { user: 'Bilal Khan', action: 'Signed up', time: '1 hr ago', type: 'signup' },
  { user: 'Fatima Malik', action: 'Asked about bail eligibility', time: '2 hr ago', type: 'chat' },
  { user: 'Hassan Iqbal', action: 'Generated FIR', time: '3 hr ago', type: 'fir' },
];

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
              {trend === 'up' ? '+12%' : '-3%'}
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

  useEffect(() => {
    if (sessionStorage.getItem('admin_auth') !== 'true') {
      router.replace('/admin/login');
    } else {
      setAuthed(true);
    }
  }, [router]);

  const handleLogout = () => {
    sessionStorage.removeItem('admin_auth');
    router.push('/admin/login');
  };

  if (!authed) return null;

  const paidPct = Math.round((STATS.paidUsers / STATS.totalUsers) * 100);

  return (
    <div className="min-h-screen bg-background">

      {/* Top nav */}
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
              Last updated: just now
            </span>
            <Button variant="ghost" size="sm" className="rounded-xl text-muted-foreground hover:text-destructive font-sans" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-1" /> Logout
            </Button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 py-8 space-y-6">

        {/* Page title */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <h1 className="text-2xl font-bold">Dashboard Overview</h1>
          <p className="text-muted-foreground text-sm font-sans mt-0.5">
            Today — {new Date().toLocaleDateString('en-PK', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </motion.div>

        {/* Stat cards row 1 */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={Users} label="Total Users" value={STATS.totalUsers} sub="All time registrations" color="text-blue-500" bg="bg-blue-500/10" trend="up" delay={0.05} />
          <StatCard icon={UserCheck} label="Today Sign-ins" value={STATS.todaySignins} sub={`${STATS.todayNewUsers} new today`} color="text-green-600" bg="bg-green-500/10" trend="up" delay={0.1} />
          <StatCard icon={Crown} label="Paid Users" value={STATS.paidUsers} sub={`${paidPct}% conversion rate`} color="text-accent" bg="bg-accent/10" trend="up" delay={0.15} />
          <StatCard icon={Activity} label="Active Today" value={STATS.activeToday} sub="Unique sessions" color="text-purple-500" bg="bg-purple-500/10" trend="down" delay={0.2} />
        </div>

        {/* Stat cards row 2 */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard icon={DollarSign} label="Total Revenue" value={`Rs. ${STATS.totalRevenue.toLocaleString()}`} sub="All time" color="text-emerald-600" bg="bg-emerald-500/10" trend="up" delay={0.25} />
          <StatCard icon={TrendingUp} label="This Month" value={`Rs. ${STATS.monthRevenue.toLocaleString()}`} sub="May 2026" color="text-orange-500" bg="bg-orange-500/10" trend="up" delay={0.3} />
          <StatCard icon={MessageSquare} label="Total Chats" value={STATS.totalChats} sub="All conversations" color="text-sky-500" bg="bg-sky-500/10" delay={0.35} />
          <StatCard icon={FileText} label="FIRs Generated" value={STATS.totalFIRs} sub="All time" color="text-rose-500" bg="bg-rose-500/10" delay={0.4} />
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">

          {/* Daily signups chart */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.45 }} className="lg:col-span-2">
            <Card className="p-5">
              <p className="text-sm font-semibold mb-1">New Signups — This Week</p>
              <p className="text-xs text-muted-foreground font-sans mb-4">Daily new user registrations</p>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={DAILY_SIGNUPS} barSize={28}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 20% 88%)" vertical={false} />
                  <XAxis dataKey="day" tick={{ fontSize: 11, fill: 'hsl(220 15% 50%)' }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: 'hsl(220 15% 50%)' }} axisLine={false} tickLine={false} width={24} />
                  <Tooltip contentStyle={{ background: 'hsl(0 0% 100%)', border: '1px solid hsl(220 20% 88%)', borderRadius: 10, fontSize: 12 }} cursor={{ fill: 'hsl(220 20% 92%)' }} />
                  <Bar dataKey="users" fill="hsl(220 60% 35%)" radius={[6, 6, 0, 0]} name="New Users" />
                </BarChart>
              </ResponsiveContainer>
            </Card>
          </motion.div>

          {/* Pie chart */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
            <Card className="p-5">
              <p className="text-sm font-semibold mb-1">User Breakdown</p>
              <p className="text-xs text-muted-foreground font-sans mb-2">Free vs Paid</p>
              <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                  <Pie data={PIE_DATA} cx="50%" cy="45%" innerRadius={55} outerRadius={80} paddingAngle={3} dataKey="value">
                    {PIE_DATA.map((_, i) => <Cell key={i} fill={PIE_COLORS[i]} />)}
                  </Pie>
                  <Legend iconType="circle" iconSize={8} wrapperStyle={{ fontSize: 12 }} />
                  <Tooltip contentStyle={{ background: 'hsl(0 0% 100%)', border: '1px solid hsl(220 20% 88%)', borderRadius: 10, fontSize: 12 }} />
                </PieChart>
              </ResponsiveContainer>
            </Card>
          </motion.div>
        </div>

        {/* Revenue chart */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.55 }}>
          <Card className="p-5">
            <p className="text-sm font-semibold mb-1">Revenue — This Week</p>
            <p className="text-xs text-muted-foreground font-sans mb-4">Daily revenue in PKR</p>
            <ResponsiveContainer width="100%" height={180}>
              <BarChart data={DAILY_REVENUE} barSize={32}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 20% 88%)" vertical={false} />
                <XAxis dataKey="day" tick={{ fontSize: 11, fill: 'hsl(220 15% 50%)' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: 'hsl(220 15% 50%)' }} axisLine={false} tickLine={false} width={40} tickFormatter={(v) => `${v}`} />
                <Tooltip contentStyle={{ background: 'hsl(0 0% 100%)', border: '1px solid hsl(220 20% 88%)', borderRadius: 10, fontSize: 12 }} formatter={(v) => [`Rs. ${v}`, 'Revenue']} cursor={{ fill: 'hsl(220 20% 92%)' }} />
                <Bar dataKey="revenue" fill="hsl(45 80% 55%)" radius={[6, 6, 0, 0]} name="Revenue (PKR)" />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </motion.div>

        {/* Recent users + Recent activity */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

          {/* Recent users */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.6 }}>
            <Card className="p-5">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-semibold">Recent Users</p>
                <span className="text-xs text-muted-foreground font-sans">{STATS.totalUsers} total</span>
              </div>
              <div className="space-y-2">
                {RECENT_USERS.map((u) => (
                  <div key={u.email} className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-muted transition-colors">
                    <div className="w-8 h-8 rounded-full gradient-navy flex items-center justify-center shrink-0">
                      <span className="text-xs font-bold text-accent">{u.name[0]}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{u.name}</p>
                      <p className="text-xs text-muted-foreground font-sans truncate">{u.email}</p>
                    </div>
                    <div className="flex flex-col items-end gap-1 shrink-0">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-sans font-medium ${PLAN_COLORS[u.plan]}`}>{u.plan}</span>
                      <span className="text-xs text-muted-foreground font-sans">{u.joined}</span>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>

          {/* Recent activity */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.65 }}>
            <Card className="p-5">
              <div className="flex items-center justify-between mb-4">
                <p className="text-sm font-semibold">Recent Activity</p>
                <span className="text-xs text-muted-foreground font-sans">Live feed</span>
              </div>
              <div className="space-y-3">
                {RECENT_ACTIVITY.map((a, i) => (
                  <div key={i} className="flex items-start gap-3">
                    <div className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-xs font-bold ${ACTIVITY_COLORS[a.type]}`}>
                      {a.type === 'fir' ? <FileText className="w-4 h-4" /> :
                       a.type === 'chat' ? <MessageSquare className="w-4 h-4" /> :
                       a.type === 'upgrade' ? <Crown className="w-4 h-4" /> :
                       <UserCheck className="w-4 h-4" />}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium">{a.user}</p>
                      <p className="text-xs text-muted-foreground font-sans">{a.action}</p>
                    </div>
                    <span className="text-xs text-muted-foreground font-sans shrink-0">{a.time}</span>
                  </div>
                ))}
              </div>
            </Card>
          </motion.div>
        </div>

        {/* Summary footer */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.7 }}>
          <Card className="p-4 gradient-navy border-0">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-center">
              <div>
                <p className="text-xl font-bold text-sidebar-foreground">{STATS.totalUsers}</p>
                <p className="text-xs text-sidebar-foreground/60 font-sans">Total Users</p>
              </div>
              <div>
                <p className="text-xl font-bold text-accent">{paidPct}%</p>
                <p className="text-xs text-sidebar-foreground/60 font-sans">Conversion Rate</p>
              </div>
              <div>
                <p className="text-xl font-bold text-sidebar-foreground">Rs. {STATS.totalRevenue.toLocaleString()}</p>
                <p className="text-xs text-sidebar-foreground/60 font-sans">Total Revenue</p>
              </div>
              <div>
                <p className="text-xl font-bold text-sidebar-foreground">{STATS.totalChats}</p>
                <p className="text-xs text-sidebar-foreground/60 font-sans">Total Chats</p>
              </div>
            </div>
          </Card>
        </motion.div>

      </div>
    </div>
  );
}
