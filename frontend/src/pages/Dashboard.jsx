import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BarChart3, Users, Zap, CheckCircle2, RefreshCw } from 'lucide-react';

export default function Dashboard() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(false);
  const API = import.meta.env.VITE_API_URL;
  if (!API) {
  throw new Error("❌ VITE_API_URL is not defined");
}

  const fetchReport = async () => {
    try {
      const res = await axios.get(`${import.meta.env.VITE_API_URL}api/sprint-report`);
      setReport(res.data);
    } catch (err) { console.log("Awaiting backend data..."); }
  };

  useEffect(() => { fetchReport(); }, []);

  const runAutoAssign = async () => {
    setLoading(true);
    try {
      await axios.post(`${import.meta.env.VITE_API_URL}api/auto-assign`);
      await fetchReport();
    } catch (err) { alert("Assignment Failed"); }
    setLoading(false);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <StatCard label="Avg Utilization" value={`${report?.metrics?.avg_utilization || 0}%`} icon={<Zap size={20}/>} />
        <StatCard label="Devs Active" value={report?.metrics?.total_devs || 0} icon={<Users size={20}/>} />
        <button onClick={runAutoAssign} disabled={loading} className="bg-indigo-600 text-white rounded-[2rem] font-bold flex items-center justify-center gap-2 shadow-lg shadow-indigo-100 hover:bg-indigo-700 transition-all">
          {loading ? <RefreshCw className="animate-spin" /> : <CheckCircle2 size={18} />}
          {loading ? "Optimizing..." : "Auto-Assign Tasks"}
        </button>
      </div>

      <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-2xl">
        <h3 className="text-xl font-black mb-8 text-slate-800">Sprint Workload Distribution</h3>
        <div className="min-h-[400px] bg-slate-50 rounded-[2rem] flex items-center justify-center border-2 border-dashed border-slate-200 overflow-hidden">
          {report?.report_url ? (
            <img 
              src={`${import.meta.env.VITE_API_URL}${report.report_url}?t=${Date.now()}`} 
              className="w-full h-full object-contain" 
              alt="Analytics Chart" 
            />
          ) : (
            <div className="text-slate-300 flex flex-col items-center gap-2">
              <BarChart3 size={48} />
              <p className="text-[10px] font-black uppercase tracking-widest">No Active Report Found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function StatCard({ label, value, icon }) {
  return (
    <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm">
      <div className="flex items-center gap-2 text-slate-400 mb-2"> {icon} <span className="text-[10px] font-bold uppercase tracking-widest">{label}</span></div>
      <p className="text-3xl font-black text-slate-800">{value}</p>
    </div>
  );
}