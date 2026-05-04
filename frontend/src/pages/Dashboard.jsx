import React from 'react';
import { ArrowRight, CheckCircle2, Clock3, Radar, TrendingUp, Users, AlertTriangle, Layers3 } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, Tooltip as RTooltip, ResponsiveContainer, PieChart, Pie, Cell, AreaChart, Area } from 'recharts';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

const CHART_COLORS = ['hsl(187,64%,42%)', 'hsl(27,85%,62%)', 'hsl(102,35%,55%)', 'hsl(262,50%,60%)', 'hsl(350,70%,60%)'];

export default function Dashboard({ analysis, report, onBackToPlanner, onApplyToBoard }) {
  const active = analysis || report;
  const metrics = active?.metrics || {};
  const tasks = analysis?.tasks || [];
  const insights = analysis?.insights || report?.insights || {};
  const teamWorkload = analysis?.team_workload || report?.team_workload || [];
  const portfolio = analysis?.portfolio || report?.portfolio || {};
  const history = report?.history || [];
  const [applying, setApplying] = React.useState(false);
  const [applyMessage, setApplyMessage] = React.useState('');

  if (!active) {
    return (
      <div className="animate-fade-in">
        <Card className="mx-auto max-w-lg text-center">
          <CardContent className="p-10">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Radar size={28} />
            </div>
            <h1 className="text-2xl font-bold">No sprint analysis yet.</h1>
            <p className="mt-2 text-sm text-muted-foreground">Run an analysis from the planner to populate this dashboard.</p>
            <Button onClick={onBackToPlanner} className="mt-6 gap-2">Open Planner <ArrowRight size={15} /></Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const statusTone = { 'On Track': 'success', Watch: 'warning', 'At Risk': 'destructive' };
  const applyToBoard = async () => {
    setApplying(true);
    setApplyMessage('');
    try {
      const result = await onApplyToBoard();
      setApplyMessage(`${result.count} sprint task${result.count === 1 ? '' : 's'} applied to the board.`);
    } catch (error) {
      setApplyMessage(error?.response?.data?.detail || 'Could not apply analysis output to the board.');
    } finally {
      setApplying(false);
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header row */}
      <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <CardTitle className="text-2xl font-bold">
                  {analysis?.delivery_status ? `${analysis.delivery_status} Delivery` : 'Sprint Overview'}
                </CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">Review confidence, capacity, and drag risks.</p>
              </div>
              {analysis?.delivery_status && (
                <Badge variant={statusTone[analysis.delivery_status] || 'secondary'} className="text-xs px-3 py-1">
                  {analysis.delivery_status}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <MetricCard icon={<Clock3 size={16} />} label="Predicted" value={`${metrics.predicted_time || 0}h`} />
              <MetricCard icon={<Radar size={16} />} label="Risk" value={`${metrics.risk_score || analysis?.risk_score || 0}%`} />
              <MetricCard icon={<Users size={16} />} label="Utilization" value={`${metrics.utilization_pct || 0}%`} />
              <MetricCard icon={<TrendingUp size={16} />} label="Confidence" value={`${metrics.delivery_confidence || 0}%`} />
            </div>
          </CardContent>
        </Card>

        {/* Recommendations */}
        <Card className="bg-foreground text-background border-0">
          <CardHeader>
            <div className="flex items-center gap-2 text-background/60">
              <CheckCircle2 size={16} className="text-emerald-400" />
              <span className="text-xs uppercase tracking-widest">Recommendations</span>
            </div>
          </CardHeader>
          <CardContent className="space-y-2">
            {(insights.recommendations || ['Run a planner pass to generate recommendations.']).map((item, i) => (
              <div key={i} className="rounded-lg border border-background/10 bg-background/5 px-4 py-3 text-sm text-background/80">{item}</div>
            ))}
            {applyMessage && <div className="rounded-lg border border-emerald-400/20 bg-emerald-400/10 px-4 py-3 text-sm text-emerald-100">{applyMessage}</div>}
            <div className="mt-3 flex flex-wrap gap-2">
              <Button variant="secondary" size="sm" onClick={applyToBoard} disabled={applying} className="gap-1.5">
                {applying ? 'Applying...' : 'Apply to Board'}
              </Button>
              <Button variant="secondary" size="sm" onClick={onBackToPlanner} className="gap-1.5">Refine plan <ArrowRight size={14} /></Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts row */}
      <div className="grid gap-6 lg:grid-cols-2">
        {/* Team workload chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Team Workload</CardTitle>
          </CardHeader>
          <CardContent>
            {teamWorkload.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={teamWorkload} barSize={28}>
                  <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <RTooltip contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }} />
                  <Bar dataKey="assigned_hours" fill={CHART_COLORS[0]} radius={[6, 6, 0, 0]} name="Hours" />
                </BarChart>
              </ResponsiveContainer>
            ) : <p className="text-sm text-muted-foreground py-8 text-center">No workload data.</p>}
          </CardContent>
        </Card>

        {/* Portfolio pie */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Portfolio Mix</CardTitle>
          </CardHeader>
          <CardContent>
            {(portfolio.priority_mix || []).length > 0 ? (
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground mb-2 text-center">Priority</p>
                  <ResponsiveContainer width="100%" height={160}>
                    <PieChart>
                      <Pie data={portfolio.priority_mix} dataKey="value" nameKey="label" cx="50%" cy="50%" outerRadius={60} innerRadius={30}>
                        {(portfolio.priority_mix || []).map((_, i) => <Cell key={i} fill={CHART_COLORS[i % CHART_COLORS.length]} />)}
                      </Pie>
                      <RTooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-2 text-center">Skills</p>
                  <ResponsiveContainer width="100%" height={160}>
                    <PieChart>
                      <Pie data={portfolio.skill_mix || []} dataKey="value" nameKey="label" cx="50%" cy="50%" outerRadius={60} innerRadius={30}>
                        {(portfolio.skill_mix || []).map((_, i) => <Cell key={i} fill={CHART_COLORS[(i + 2) % CHART_COLORS.length]} />)}
                      </Pie>
                      <RTooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            ) : <p className="text-sm text-muted-foreground py-8 text-center">No portfolio data.</p>}
          </CardContent>
        </Card>
      </div>

      {/* Team detail + Tasks */}
      <div className="grid gap-6 xl:grid-cols-[1fr_1fr]">
        <Card>
          <CardHeader><CardTitle className="text-base">Workload Detail</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {teamWorkload.length === 0 && <p className="text-sm text-muted-foreground py-4">No data.</p>}
            {teamWorkload.map(m => (
              <div key={m.name} className="rounded-lg border p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-semibold">{m.name}</p>
                    <p className="text-xs text-muted-foreground">{[m.experience_level, m.primary_skill].filter(Boolean).join(' · ')}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold">{m.assigned_hours || 0}h</p>
                    <p className="text-xs text-muted-foreground">{m.task_count || 0} tasks</p>
                  </div>
                </div>
                <Progress value={Math.min(m.utilization_pct || 0, 100)} indicatorClassName={m.utilization_pct > 85 ? 'bg-destructive' : m.utilization_pct > 60 ? 'bg-amber-500' : 'bg-primary'} />
                <div className="flex justify-between text-[10px] uppercase tracking-wider text-muted-foreground">
                  <span>{m.utilization_pct || 0}% utilized</span>
                  <span>{m.avg_risk_pct || 0}% avg risk</span>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle className="text-base">Task Decisions</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            {tasks.length === 0 && <p className="text-sm text-muted-foreground py-4">Run analysis to see recommendations.</p>}
            {tasks.slice(0, 6).map(t => (
              <div key={t.task_id} className="rounded-lg border p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="text-[10px] uppercase tracking-widest text-muted-foreground">#{t.task_id}</span>
                    <p className="font-semibold text-sm">{t.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{t.priority} · {t.skill_tag} · {t.task_type}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-semibold">{t.predicted_hours}h</p>
                    <Badge variant={t.risk_pct >= 60 ? 'destructive' : t.risk_pct >= 40 ? 'warning' : 'success'} className="text-[10px] mt-1">{t.risk_pct}% risk</Badge>
                  </div>
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2">
                  <div className="rounded-md bg-muted/50 p-2.5">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Owner</p>
                    <p className="text-sm font-medium mt-0.5">{t.recommended_assignment?.name}</p>
                  </div>
                  <div className="rounded-md bg-muted/50 p-2.5">
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Backup</p>
                    <p className="text-sm font-medium mt-0.5">{t.backup_assignment?.name}</p>
                  </div>
                </div>
                {t.blockers?.length > 0 && (
                  <div className="mt-2 rounded-md border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs text-amber-600 dark:text-amber-400">
                    <AlertTriangle size={12} className="inline mr-1" />{t.blockers[0]}
                  </div>
                )}
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* History */}
      {history.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-base">Recent Runs</CardTitle></CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {history.map(e => (
                <div key={e.snapshot_id} className="rounded-lg border p-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-semibold text-sm">{e.sprint_name}</p>
                      <p className="text-xs text-muted-foreground">{e.created_at}</p>
                    </div>
                    <Layers3 size={14} className="text-primary" />
                  </div>
                  <div className="mt-3 grid grid-cols-3 gap-2">
                    <SnapMetric l="Hours" v={e.summary?.metrics?.predicted_time || 0} />
                    <SnapMetric l="Risk" v={e.summary?.metrics?.risk_score || 0} />
                    <SnapMetric l="Util" v={e.summary?.metrics?.utilization_pct || 0} />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function MetricCard({ icon, label, value }) {
  return (
    <div className="rounded-lg border bg-muted/50 p-4">
      <div className="flex items-center gap-1.5 text-xs uppercase tracking-wider text-muted-foreground">
        <span className="text-primary">{icon}</span>{label}
      </div>
      <p className="mt-2 text-2xl font-bold">{value}</p>
    </div>
  );
}

function SnapMetric({ l, v }) {
  return (
    <div className="rounded-md bg-muted/50 px-2 py-1.5">
      <p className="text-[10px] uppercase tracking-wider text-muted-foreground">{l}</p>
      <p className="font-semibold text-sm">{v}</p>
    </div>
  );
}
