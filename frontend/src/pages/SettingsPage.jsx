import React, { useEffect, useState } from 'react';
import { Moon, Sun, Monitor, Server, Palette } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { useTheme } from '@/lib/theme';
import { cn } from '@/lib/utils';
import { fetchHealth } from '@/lib/api';
import { getStoredSprintDefaults } from '@/lib/planner';

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const [health, setHealth] = useState({ api: 'checking', database: 'checking', models: 'checking' });
  const [defaults, setDefaults] = useState(getStoredSprintDefaults());

  useEffect(() => {
    fetchHealth().then(setHealth).catch(() => {
      setHealth({ api: 'offline', database: 'offline', models: 'unknown' });
    });
  }, []);

  const saveDefaults = () => {
    window.localStorage.setItem('optisprint-sprint-defaults', JSON.stringify(defaults));
  };

  return (
    <div className="space-y-6 animate-fade-in max-w-3xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="mt-1 text-muted-foreground">Configure your workspace preferences.</p>
      </div>

      {/* Appearance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Palette size={18} /> Appearance</CardTitle>
          <CardDescription>Customize the look and feel of your workspace.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label className="mb-3 block">Theme</Label>
            <div className="grid grid-cols-3 gap-3">
              {[
                { value: 'light', icon: <Sun size={18} />, label: 'Light' },
                { value: 'dark', icon: <Moon size={18} />, label: 'Dark' },
                { value: 'system', icon: <Monitor size={18} />, label: 'System' },
              ].map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setTheme(opt.value === 'system' ? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light') : opt.value)}
                  className={cn(
                    "flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all cursor-pointer",
                    theme === opt.value ? "border-primary bg-primary/5 shadow-sm" : "border-border hover:border-primary/30"
                  )}
                >
                  {opt.icon}
                  <span className="text-sm font-medium">{opt.label}</span>
                </button>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Sprint Defaults */}
      <Card>
        <CardHeader>
          <CardTitle>Sprint Defaults</CardTitle>
          <CardDescription>Default values used when creating new sprints.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2"><Label>Current Team Load %</Label><Input type="number" value={defaults.current_team_load} onChange={(e) => setDefaults({ ...defaults, current_team_load: Number(e.target.value) })} /></div>
            <div className="grid gap-2"><Label>Deadline per Owner (hours)</Label><Input type="number" value={defaults.deadline_limit} onChange={(e) => setDefaults({ ...defaults, deadline_limit: Number(e.target.value) })} /></div>
            <div className="grid gap-2"><Label>Meeting Hours</Label><Input type="number" value={defaults.meeting_hours} onChange={(e) => setDefaults({ ...defaults, meeting_hours: Number(e.target.value) })} /></div>
            <div className="grid gap-2"><Label>Support Hours</Label><Input type="number" value={defaults.support_hours} onChange={(e) => setDefaults({ ...defaults, support_hours: Number(e.target.value) })} /></div>
          </div>
          <div className="flex items-center justify-between">
            <div><Label>Auto-assign tasks</Label><p className="text-xs text-muted-foreground mt-0.5">Automatically assign tasks when analysis completes</p></div>
            <Switch defaultChecked />
          </div>
          <Separator />
          <Button onClick={saveDefaults}>Save Defaults</Button>
        </CardContent>
      </Card>

      {/* API Status */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Server size={18} /> API Status</CardTitle>
          <CardDescription>Backend connectivity and health.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">API Server</span>
              <Badge variant={health.api === 'connected' ? 'success' : 'destructive'}>
                {health.api === 'connected' ? 'Connected' : health.api}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Database</span>
              <Badge variant={health.database === 'connected' ? 'success' : 'warning'}>
                {health.database === 'connected' ? 'Connected' : 'Fallback Mode'}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">ML Models</span>
              <Badge variant={health.models === 'loaded' ? 'success' : 'secondary'}>
                {health.models === 'loaded' ? 'Loaded' : health.models}
              </Badge>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
