import React, { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import { fetchTasks } from '@/lib/api';

const prioColor = { Critical:'bg-rose-500', High:'bg-amber-500', Medium:'bg-blue-500', Low:'bg-gray-400' };
const statusColor = { Backlog:'bg-gray-400', 'To Do':'bg-blue-500', 'In Progress':'bg-amber-500', Review:'bg-violet-500', Done:'bg-emerald-500' };

export default function TimelinePage() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => { fetchTasks().then(r => setTasks(r.tasks||[])).catch(()=>setTasks([])).finally(()=>setLoading(false)); }, []);

  if (loading) return <div className="flex justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent"/></div>;

  const maxDays = Math.max(...tasks.map(t => t.due_in_days||10), 14);

  return (
    <div className="space-y-6 animate-fade-in">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Sprint Timeline</h1>
        <p className="mt-1 text-muted-foreground">Gantt-style view of tasks over the sprint duration.</p>
      </div>

      <Card>
        <CardContent className="p-6 overflow-x-auto">
          {/* Day headers */}
          <div className="flex items-center mb-4">
            <div className="w-[200px] shrink-0 text-xs font-semibold text-muted-foreground">Task</div>
            <div className="flex flex-1 min-w-[600px]">
              {Array.from({ length: maxDays }, (_, i) => (
                <div key={i} className="flex-1 text-center text-[10px] text-muted-foreground border-l border-border first:border-l-0 py-1">
                  Day {i + 1}
                </div>
              ))}
            </div>
          </div>

          {/* Task rows */}
          <div className="space-y-2">
            {tasks.map(task => {
              const dueDays = task.due_in_days || 10;
              const sp = task.story_points || 1;
              const startOffset = Math.max(0, dueDays - sp - 2);
              const widthPct = Math.min(((sp + 2) / maxDays) * 100, 100);
              const leftPct = (startOffset / maxDays) * 100;
              
              return (
                <div key={task.task_id} className="flex items-center group hover:bg-accent/50 rounded-lg transition-colors py-1.5">
                  <div className="w-[200px] shrink-0 flex items-center gap-2 pr-3">
                    <div className={cn("h-2 w-2 rounded-full shrink-0", statusColor[task.status||'Backlog'])} />
                    <span className="text-sm font-medium truncate">{task.title}</span>
                  </div>
                  <div className="flex-1 relative h-8 min-w-[600px]">
                    {/* Grid lines */}
                    <div className="absolute inset-0 flex">
                      {Array.from({ length: maxDays }, (_, i) => (
                        <div key={i} className="flex-1 border-l border-border/50 first:border-l-0" />
                      ))}
                    </div>
                    {/* Bar */}
                    <div
                      className={cn(
                        "absolute top-1 h-6 rounded-md flex items-center px-2 text-[10px] font-medium text-white transition-all",
                        prioColor[task.priority] || 'bg-blue-500'
                      )}
                      style={{ left: `${leftPct}%`, width: `${widthPct}%`, minWidth: '40px' }}
                    >
                      <span className="truncate">{task.story_points}SP · {task.assignee_hint || '—'}</span>
                    </div>
                    {/* Dependencies */}
                    {(task.dependencies || []).length > 0 && (
                      <div className="absolute top-0 right-2 h-full flex items-center">
                        <Badge variant="outline" className="text-[8px] h-4 opacity-0 group-hover:opacity-100 transition-opacity">
                          deps: {task.dependencies.join(', ')}
                        </Badge>
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Legend */}
      <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
        {Object.entries(prioColor).map(([k, v]) => (
          <div key={k} className="flex items-center gap-1.5">
            <div className={cn("h-2.5 w-2.5 rounded-sm", v)} />
            {k}
          </div>
        ))}
      </div>
    </div>
  );
}
