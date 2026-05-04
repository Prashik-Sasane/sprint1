import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Activity, LayoutPanelTop, Radar, Sparkles } from 'lucide-react';

const links = [
  { to: '/planner', label: 'Planner', icon: <LayoutPanelTop size={16} /> },
  { to: '/dashboard', label: 'Dashboard', icon: <Radar size={16} /> },
];

export default function Navbar() {
  const { pathname } = useLocation();

  return (
    <nav className="sticky top-0 z-40 border-b border-white/60 bg-[rgba(245,246,242,0.85)] backdrop-blur-xl">
      <div className="mx-auto flex max-w-[1400px] items-center justify-between px-4 py-4 sm:px-6 lg:px-10">
        <Link to="/" className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--ink)] text-white shadow-[0_14px_36px_rgba(28,37,28,0.18)]">
            <Activity size={20} />
          </div>
          <div>
            <p className="text-[11px] font-semibold uppercase tracking-[0.32em] text-[var(--muted)]">OptiSprint</p>
            <p className="text-lg font-semibold tracking-[-0.03em] text-[var(--ink)]">AI Sprint Planner</p>
          </div>
        </Link>

        <div className="flex items-center gap-2 rounded-full border border-[var(--line)] bg-white/80 p-1.5 shadow-[0_12px_30px_rgba(28,37,28,0.06)]">
          {links.map(({ to, label, icon }) => {
            const active = pathname === to || (to === '/planner' && pathname === '/input') || (to === '/dashboard' && pathname === '/results');
            return (
              <Link
                key={to}
                to={to}
                className={`flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition ${
                  active
                    ? 'bg-[var(--accent)] text-white shadow-[0_12px_24px_rgba(31,122,140,0.22)]'
                    : 'text-[var(--muted)] hover:bg-[var(--panel-soft)] hover:text-[var(--ink)]'
                }`}
              >
                {icon}
                {label}
              </Link>
            );
          })}
        </div>

        <div className="hidden items-center gap-2 rounded-full border border-[var(--line)] bg-white/70 px-4 py-2 text-sm text-[var(--muted)] md:flex">
          <Sparkles size={15} className="text-[var(--accent)]" />
          Planning mode
        </div>
      </div>
    </nav>
  );
}
