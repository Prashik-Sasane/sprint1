import React, { useEffect, useState } from 'react';
import { Activity, GitBranch, UserPlus, UserMinus, Zap, ClipboardList, ArrowRightLeft } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { fetchActivity } from '@/lib/api';

const iconMap = {
  sprint_created: <Zap size={16} className="text-primary" />,
  sprint_updated: <ClipboardList size={16} className="text-blue-500" />,
  sprint_duplicated: <GitBranch size={16} className="text-violet-500" />,
  sprint_deleted: <ClipboardList size={16} className="text-destructive" />,
  task_assigned: <ArrowRightLeft size={16} className="text-amber-500" />,
  task_created: <Zap size={16} className="text-emerald-500" />,
  status_changed: <ArrowRightLeft size={16} className="text-blue-500" />,
  member_added: <UserPlus size={16} className="text-emerald-500" />,
  member_updated: <UserPlus size={16} className="text-blue-500" />,
  member_removed: <UserMinus size={16} className="text-destructive" />,
  analysis_run: <Activity size={16} className="text-primary" />,
};

const typeBadge = {
  sprint_created: 'default', sprint_updated: 'info', sprint_duplicated: 'info', sprint_deleted: 'destructive',
  task_assigned: 'warning', task_created: 'success', status_changed: 'info',
  member_added: 'success', member_updated: 'info', member_removed: 'destructive',
  analysis_run: 'default',
};

export default function ActivityPage() {
  const [activity, setActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchActivity().then(r => setActivity(r.activity || [])).catch(() => setActivity([])).finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="flex justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>;

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Activity Feed</h1>
        <p className="mt-1 text-muted-foreground">Recent actions, assignments, and status changes.</p>
      </div>

      <div className="relative space-y-0">
        {/* Timeline line */}
        <div className="absolute left-5 top-0 bottom-0 w-px bg-border" />

        {activity.map((entry, idx) => (
          <div key={entry.id} className="relative flex items-start gap-4 py-3 pl-2 group animate-fade-in" style={{ animationDelay: `${idx * 50}ms` }}>
            {/* Dot */}
            <div className="relative z-10 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border bg-card shadow-sm group-hover:border-primary/30 transition-colors">
              {iconMap[entry.type] || <Activity size={16} className="text-muted-foreground" />}
            </div>
            {/* Content */}
            <Card className="flex-1 group-hover:shadow-sm transition-shadow">
              <CardContent className="p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium">{entry.message}</p>
                    <div className="mt-1.5 flex items-center gap-2">
                      <Badge variant={typeBadge[entry.type] || 'secondary'} className="text-[10px]">
                        {entry.type.replace(/_/g, ' ')}
                      </Badge>
                      <span className="text-xs text-muted-foreground">by {entry.actor}</span>
                    </div>
                  </div>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    {formatTime(entry.timestamp)}
                  </span>
                </div>
              </CardContent>
            </Card>
          </div>
        ))}

        {activity.length === 0 && (
          <Card>
            <CardContent className="flex items-center justify-center p-10 text-sm text-muted-foreground">
              No activity yet. Start planning a sprint to see events here.
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}

function formatTime(ts) {
  if (!ts) return '';
  try {
    const d = new Date(ts);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' ' + d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  } catch {
    return ts;
  }
}
