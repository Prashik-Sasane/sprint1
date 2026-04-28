import React from 'react';
import { 
  Zap, ShieldCheck, BarChart3, Users, ArrowRight, 
  Cpu, MousePointerClick, Activity, Globe 
} from 'lucide-react';

const Feature = ({ icon: Icon, title, desc }) => (
  <div className="p-8 bg-white rounded-[2.5rem] border border-slate-100 shadow-sm hover:shadow-2xl hover:-translate-y-2 transition-all group">
    <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-xl flex items-center justify-center mb-6 group-hover:bg-indigo-600 group-hover:text-white transition-colors">
      <Icon size={24} />
    </div>
    <h3 className="text-lg font-black text-slate-900 mb-2 uppercase tracking-tight">{title}</h3>
    <p className="text-slate-500 text-sm font-medium leading-relaxed">{desc}</p>
  </div>
);

export default function LandingPage({ onStart }) {
  return (
    <div className="min-h-screen bg-white font-sans selection:bg-indigo-100 selection:text-indigo-900">
      
      {/* --- NAVIGATION --- */}
      <nav className="max-w-7xl mx-auto px-8 py-8 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <div className="bg-indigo-600 p-2 rounded-lg text-white shadow-lg shadow-indigo-200">
            <Cpu size={20}/>
          </div>
          <span className="text-xl font-black tracking-tighter text-slate-900 uppercase">Sprint.AI</span>
        </div>
        <div className="hidden md:flex gap-8 text-[10px] font-black uppercase tracking-widest text-slate-400">
          <a href="#" className="hover:text-indigo-600 transition-colors">Engine</a>
          <a href="#" className="hover:text-indigo-600 transition-colors">Benchmarks</a>
          <a href="#" className="hover:text-indigo-600 transition-colors">Documentation</a>
        </div>
        <button 
          onClick={onStart}
          className="px-6 py-3 bg-slate-900 text-white rounded-full text-[10px] font-black uppercase tracking-widest hover:bg-indigo-600 transition-all active:scale-95"
        >
          Get Started
        </button>
      </nav>

      {/* --- HERO SECTION --- */}
      <header className="max-w-6xl mx-auto px-8 pt-24 pb-40 text-center">
        <div className="inline-flex items-center gap-2 bg-slate-50 border border-slate-100 text-slate-500 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] mb-10 shadow-sm">
          <Activity size={14} className="text-indigo-600 animate-pulse"/> v4.0 Inference Engine Live
        </div>
        
        <h1 className="text-7xl md:text-9xl font-black text-slate-900 tracking-tighter mb-10 leading-[0.85]">
          Predict your <br/>
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-violet-600 to-indigo-600 animate-gradient">Sprint's Future.</span>
        </h1>
        
        <p className="max-w-2xl mx-auto text-xl text-slate-500 font-medium leading-relaxed mb-14">
          The world's first multi-model inference engine for engineering managers. 
          Stop guessing—simulate complexity across levels and eliminate delivery risk.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
          <button 
            onClick={onStart}
            className="w-full sm:w-auto px-12 py-7 bg-slate-900 text-white rounded-full font-black uppercase tracking-[0.2em] flex items-center justify-center gap-4 shadow-[0_20px_50px_rgba(0,0,0,0.15)] hover:bg-indigo-600 hover:-translate-y-1 transition-all"
          >
            Enter Dashboard <ArrowRight size={20}/>
          </button>
          <div className="flex items-center gap-3 text-slate-400 font-bold text-sm">
            <Users size={18}/> Trusted by 400+ Teams
          </div>
        </div>
      </header>

      {/* --- CORE FEATURES --- */}
      <section className="bg-slate-50 py-32 border-y border-slate-100">
        <div className="max-w-7xl mx-auto px-8">
          <div className="text-center mb-20 space-y-4">
            <h2 className="text-[10px] font-black text-indigo-600 uppercase tracking-[0.3em]">The Architecture</h2>
            <p className="text-4xl font-black text-slate-900 tracking-tight">Precision at every level.</p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            <Feature 
              icon={BarChart3}
              title="Simulation Engine"
              desc="Compare delivery timelines across Junior, Mid, and Senior tiers simultaneously using historical velocity data."
            />
            <Feature 
              icon={ShieldCheck}
              title="Risk Scoring"
              desc="Our neural network flags high-risk task-level pairings before the sprint starts, preventing 99% of bottlenecks."
            />
            <Feature 
              icon={MousePointerClick}
              title="Auto-Assignment"
              desc="Intelligently distributes tasks to developers based on current load, skill level, and available deadline buffer."
            />
          </div>
        </div>
      </section>

      {/* --- SOCIAL PROOF --- */}
      <section className="py-24 max-w-7xl mx-auto px-8 flex flex-col items-center">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-10">Integration Ecosystem</p>
        <div className="flex flex-wrap justify-center gap-12 opacity-30 grayscale contrast-125">
            <Globe size={40}/>
            <Zap size={40}/>
            <Activity size={40}/>
            <BarChart3 size={40}/>
            <Users size={40}/>
        </div>
      </section>

      {/* --- FOOTER --- */}
      <footer className="bg-white py-20 border-t border-slate-100">
        <div className="max-w-7xl mx-auto px-8 flex flex-col md:flex-row justify-between items-center gap-10">
          <div className="flex items-center gap-2">
            <div className="bg-slate-900 p-1.5 rounded text-white"><Cpu size={14}/></div>
            <span className="font-black text-slate-900 uppercase tracking-tighter">Sprint.AI</span>
          </div>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">© 2026 Algorithmic Engineering Systems</p>
          <button onClick={onStart} className="text-indigo-600 font-black text-[10px] uppercase tracking-widest hover:underline">Launch App</button>
        </div>
      </footer>
    </div>
  );
}