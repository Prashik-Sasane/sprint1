import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  Activity,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Columns3,
  GanttChart,
  LayoutDashboard,
  Moon,
  Settings,
  Sun,
  Users,
  Zap,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useTheme } from '@/lib/theme';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '@/components/ui/tooltip';

const navItems = [
  { to: '/', label: 'Home', icon: <Zap size={18} />, group: 'main' },
  { to: '/dashboard', label: 'Dashboard', icon: <LayoutDashboard size={18} />, group: 'main' },
  { to: '/planner', label: 'Planner', icon: <ClipboardList size={18} />, group: 'main' },
  { to: '/team', label: 'Team', icon: <Users size={18} />, group: 'manage' },
  { to: '/board', label: 'Board', icon: <Columns3 size={18} />, group: 'manage' },
  { to: '/timeline', label: 'Timeline', icon: <GanttChart size={18} />, group: 'manage' },
  { to: '/activity', label: 'Activity', icon: <Activity size={18} />, group: 'manage' },
  { to: '/settings', label: 'Settings', icon: <Settings size={18} />, group: 'system' },
];

export default function Sidebar() {
  const { pathname } = useLocation();
  const { theme, setTheme } = useTheme();
  const [collapsed, setCollapsed] = useState(false);

  const mainItems = navItems.filter(i => i.group === 'main');
  const manageItems = navItems.filter(i => i.group === 'manage');
  const systemItems = navItems.filter(i => i.group === 'system');

  const isActive = (to) => {
    if (to === '/') return pathname === '/';
    return pathname.startsWith(to);
  };

  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          "fixed left-0 top-0 z-50 flex h-screen flex-col border-r border-sidebar-border bg-sidebar text-sidebar-foreground transition-all duration-300",
          collapsed ? "w-[68px]" : "w-[240px]"
        )}
      >
        {/* Branding */}
        <div className={cn("flex items-center gap-3 px-4 py-5", collapsed && "justify-center px-2")}>
          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-md">
            <Zap size={18} />
          </div>
          {!collapsed && (
            <div className="animate-fade-in">
              <p className="text-[10px] font-semibold uppercase tracking-[0.25em] text-sidebar-foreground/50">OptiSprint</p>
              <p className="text-sm font-semibold text-sidebar-foreground">Sprint Planner</p>
            </div>
          )}
        </div>

        <Separator className="bg-sidebar-border" />

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-2 py-3">
          <NavGroup items={mainItems} collapsed={collapsed} isActive={isActive} />
          <div className="my-2 px-2">
            <Separator className="bg-sidebar-border" />
          </div>
          {!collapsed && (
            <p className="mb-1 px-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-sidebar-foreground/40">
              Manage
            </p>
          )}
          <NavGroup items={manageItems} collapsed={collapsed} isActive={isActive} />
          <div className="my-2 px-2">
            <Separator className="bg-sidebar-border" />
          </div>
          <NavGroup items={systemItems} collapsed={collapsed} isActive={isActive} />
        </nav>

        {/* Bottom controls */}
        <div className="border-t border-sidebar-border p-2">
          {/* Theme toggle */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size={collapsed ? "icon" : "default"}
                onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
                className={cn(
                  "w-full text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground",
                  !collapsed && "justify-start gap-3"
                )}
              >
                {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
                {!collapsed && <span className="text-sm">{theme === 'dark' ? 'Light mode' : 'Dark mode'}</span>}
              </Button>
            </TooltipTrigger>
            {collapsed && <TooltipContent side="right">Toggle theme</TooltipContent>}
          </Tooltip>

          {/* Collapse toggle */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size={collapsed ? "icon" : "default"}
                onClick={() => setCollapsed(!collapsed)}
                className={cn(
                  "mt-1 w-full text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground",
                  !collapsed && "justify-start gap-3"
                )}
              >
                {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
                {!collapsed && <span className="text-sm">Collapse</span>}
              </Button>
            </TooltipTrigger>
            {collapsed && <TooltipContent side="right">{collapsed ? 'Expand' : 'Collapse'}</TooltipContent>}
          </Tooltip>
        </div>
      </aside>
    </TooltipProvider>
  );
}

function NavGroup({ items, collapsed, isActive }) {
  return (
    <div className="space-y-1">
      {items.map(({ to, label, icon }) => {
        const active = isActive(to);
        return (
          <Tooltip key={to}>
            <TooltipTrigger asChild>
              <Link
                to={to}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-200",
                  collapsed && "justify-center px-2",
                  active
                    ? "bg-primary/15 text-primary shadow-sm"
                    : "text-sidebar-foreground/70 hover:bg-sidebar-accent hover:text-sidebar-foreground"
                )}
              >
                <span className={cn(active && "text-primary")}>{icon}</span>
                {!collapsed && <span className="animate-fade-in">{label}</span>}
              </Link>
            </TooltipTrigger>
            {collapsed && <TooltipContent side="right">{label}</TooltipContent>}
          </Tooltip>
        );
      })}
    </div>
  );
}
