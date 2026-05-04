import React from 'react';
import { ArrowRight, BarChart3, Blocks, Clock3, Columns3, ShieldCheck, Users, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';

const features = [
  { icon: Blocks, title: 'Sprint Planning', desc: 'Capture scope, dependencies, skill tags, deadlines, and owner hints in one surface.' },
  { icon: ShieldCheck, title: 'Risk Analysis', desc: 'See why an assignment is risky, which tasks are fragile, and where bottlenecks form.' },
  { icon: BarChart3, title: 'Capacity Analytics', desc: 'Compare planned work against real capacity with utilization and confidence metrics.' },
  { icon: Users, title: 'Team Management', desc: 'Add, edit, and manage team members with skills, availability, and workload tracking.' },
  { icon: Columns3, title: 'Kanban Board', desc: 'Move tasks across columns and track progress from backlog to done.' },
  { icon: Zap, title: 'AI Insights', desc: 'ML-powered task assignments, burndown charts, and delivery recommendations.' },
];

export default function LandingPage({ onStart, bootstrapping }) {
  return (
    <div className="relative min-h-screen overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_left,hsl(187_64%_34%/0.12),transparent_50%),radial-gradient(ellipse_at_bottom_right,hsl(27_85%_62%/0.08),transparent_50%)]" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 h-[600px] w-[800px] bg-primary/5 rounded-full blur-3xl" />

      <div className="relative mx-auto max-w-[1200px] px-4 py-8 sm:px-6 lg:px-8">
        {/* Top bar */}
        <nav className="flex items-center justify-between rounded-2xl border bg-card/80 backdrop-blur-xl px-6 py-3 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-md">
              <Zap size={18} />
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-muted-foreground">OptiSprint</p>
              <p className="text-sm font-semibold">Sprint Planner</p>
            </div>
          </div>
          <Button onClick={onStart} className="gap-2">
            Open Planner <ArrowRight size={16} />
          </Button>
        </nav>

        {/* Hero */}
        <section className="mt-16 grid gap-12 lg:grid-cols-2 lg:items-center">
          <div>
            <Badge variant="outline" className="gap-2 px-3 py-1.5 mb-6">
              <Clock3 size={14} className="text-primary" />
              {bootstrapping ? 'Loading data...' : 'Ready to plan'}
            </Badge>

            <h1 className="text-5xl font-bold tracking-tight sm:text-6xl lg:text-7xl bg-gradient-to-br from-foreground to-foreground/70 bg-clip-text">
              Plan sprints with{' '}
              <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
                real context.
              </span>
            </h1>

            <p className="mt-6 max-w-xl text-lg leading-8 text-muted-foreground">
              OptiSprint combines backlog structure, team capacity, risk signals, and AI-powered delivery
              recommendations in one flow. Build plans teams can actually run.
            </p>

            <div className="mt-8 flex flex-wrap items-center gap-4">
              <Button size="xl" onClick={onStart} className="gap-2 animate-pulse-glow">
                Start Planning <ArrowRight size={18} />
              </Button>
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5"><Users size={14} className="text-primary" /> Team capacity</span>
                <span className="flex items-center gap-1.5"><BarChart3 size={14} className="text-amber-500" /> Confidence</span>
              </div>
            </div>
          </div>

          {/* Preview card */}
          <Card className="overflow-hidden border-2 border-primary/10 bg-gradient-to-br from-card via-card to-primary/5 shadow-2xl">
            <div className="border-b border-border/70 p-6">
              <p className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">Planning brief</p>
              <p className="mt-2 text-3xl font-bold tracking-tight">Sprint 24</p>
              <div className="mt-5 grid grid-cols-2 gap-3">
                {[
                  { l: 'Scope', v: '8 items' },
                  { l: 'Capacity', v: '212h' },
                  { l: 'Risk', v: 'Watch' },
                  { l: 'Focus', v: 'Backend + UI' },
                ].map(m => (
                  <div key={m.l} className="rounded-xl border border-border/80 bg-background/80 px-4 py-3 shadow-sm">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground">{m.l}</p>
                    <p className="mt-1 text-lg font-semibold">{m.v}</p>
                  </div>
                ))}
              </div>
            </div>
            <CardContent className="grid gap-3 p-4 sm:grid-cols-3">
              {features.slice(0, 3).map(f => {
                const Icon = f.icon;
                return (
                  <div key={f.title} className="rounded-xl border p-4 hover:shadow-sm transition-shadow">
                    <div className="mb-3 flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                      <Icon size={18} />
                    </div>
                    <p className="text-sm font-semibold">{f.title}</p>
                    <p className="mt-1 text-xs text-muted-foreground leading-relaxed">{f.desc}</p>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </section>

        {/* Features grid */}
        <section className="mt-20">
          <div className="text-center mb-10">
            <Badge variant="outline" className="mb-4">Features</Badge>
            <h2 className="text-3xl font-bold tracking-tight">Everything you need to ship</h2>
            <p className="mt-2 text-muted-foreground">A complete toolkit for agile team management.</p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {features.map(f => {
              const Icon = f.icon;
              return (
                <Card key={f.title} className="group hover:shadow-md hover:border-primary/20 transition-all">
                  <CardContent className="p-6">
                    <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                      <Icon size={20} />
                    </div>
                    <p className="text-lg font-semibold">{f.title}</p>
                    <p className="mt-2 text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </section>

        {/* CTA */}
        <section className="mt-20 mb-10 text-center">
          <Card className="mx-auto max-w-2xl border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
            <CardContent className="p-10">
              <h2 className="text-2xl font-bold">Ready to optimize your sprint?</h2>
              <p className="mt-2 text-muted-foreground">Start planning with AI-powered insights and team analytics.</p>
              <Button size="xl" onClick={onStart} className="mt-6 gap-2">
                Launch Planner <ArrowRight size={18} />
              </Button>
            </CardContent>
          </Card>
        </section>
      </div>
    </div>
  );
}
