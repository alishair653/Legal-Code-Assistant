'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Moon, Sun, Globe, Bell, Shield } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { SidebarTrigger } from '@/components/ui/sidebar';

export default function SettingsPage() {
  const [darkMode, setDarkMode] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [language, setLanguage] = useState('en');

  const toggleDark = (on: boolean) => {
    setDarkMode(on);
    document.documentElement.classList.toggle('dark', on);
  };

  return (
    <div className="flex-1 flex flex-col min-h-screen bg-background">
      <header className="h-12 flex items-center border-b border-border px-4">
        <SidebarTrigger className="mr-2" />
        <span className="text-sm font-semibold">Settings</span>
      </header>

      <div className="flex-1 overflow-y-auto">
        <div className="max-w-lg mx-auto px-4 py-10 space-y-6">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h1 className="text-2xl font-bold mb-6">Settings</h1>

            <Card className="p-5 rounded-2xl mb-4">
              <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                {darkMode ? <Moon className="w-4 h-4 text-accent" /> : <Sun className="w-4 h-4 text-accent" />}
                Appearance
              </h3>
              <div className="flex items-center justify-between">
                <Label htmlFor="dark" className="text-sm font-sans">Dark Mode</Label>
                <Switch id="dark" checked={darkMode} onCheckedChange={toggleDark} />
              </div>
            </Card>

            <Card className="p-5 rounded-2xl mb-4">
              <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                <Globe className="w-4 h-4 text-accent" />
                Language
              </h3>
              <Select value={language} onValueChange={(v) => { if (v) setLanguage(v); }}>
                <SelectTrigger className="rounded-xl">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="ur">اردو (Urdu)</SelectItem>
                  <SelectItem value="roman">Roman Urdu</SelectItem>
                </SelectContent>
              </Select>
            </Card>

            <Card className="p-5 rounded-2xl mb-4">
              <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                <Bell className="w-4 h-4 text-accent" />
                Notifications
              </h3>
              <div className="flex items-center justify-between">
                <Label htmlFor="notif" className="text-sm font-sans">Push Notifications</Label>
                <Switch id="notif" checked={notifications} onCheckedChange={setNotifications} />
              </div>
            </Card>

            <Card className="p-5 rounded-2xl">
              <h3 className="text-sm font-semibold mb-4 flex items-center gap-2">
                <Shield className="w-4 h-4 text-accent" />
                About
              </h3>
              <div className="space-y-3 font-sans text-sm text-muted-foreground">
                <div className="flex justify-between"><span>Version</span><span className="text-foreground">1.0.0</span></div>
                <div className="flex justify-between"><span>Model</span><span className="text-foreground">Legal Code AI v2</span></div>
                <div className="flex justify-between"><span>Laws Covered</span><span className="text-foreground">All Pakistani Codes</span></div>
              </div>
            </Card>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
