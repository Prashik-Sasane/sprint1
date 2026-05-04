import React, { useState, useRef } from 'react';
import axios from 'axios';
import { 
  Plus, Trash2, Zap, Target, Hourglass, CheckCircle2, Users, BarChart3, ShieldAlert, Clock, ChevronDown
} from 'lucide-react';

export default function TaskInput() {
  // --- STATE MANAGEMENT ---
  const [tasks, setTasks] = useState([{ task_id: 1, story_points: 3 }]);
  const [teamLoad, setTeamLoad] = useState(0);
  const [deadline, setDeadline] = useState(40);
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState(null);
  const resultsRef = useRef(null);

  // --- ACTIONS ---
  const addTaskRow = () => {
    const nextId = tasks.length > 0 ? Math.max(...tasks.map(t => t.task_id)) + 1 : 1;
    setTasks([...tasks, { task_id: nextId, story_points: 1 }]);
  };

  const removeTask = (index) => {
    setTasks(tasks.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    if (e) e.preventDefault(); // CRITICAL: Stops the page from redirecting/reloading
    
    setLoading(true);
    setResponse(null); 

    try {
      const res = await axios.post(`${import.meta.env.VITE_API_URL}/api/predict-sprint`, {
        tasks: tasks,
        current_team_load: parseFloat(teamLoad),
        deadline_limit: parseFloat(deadline)
      });

      // Update state with new JSON structure
      setResponse(res.data);
      
      // Smooth scroll to results
      setTimeout(() => {
        resultsRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);

    } catch (err) {
      console.error("Inference Error:", err);
      alert("AI Engine Offline: Ensure FastAPI is running on port 8000.");
      console.log("ENV:", import.meta.env);
      console.log("API:", import.meta.env.VITE_API_URL);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto space-y-12 pb-24 px-4 pt-10 font-sans selection:bg-indigo-100">
      
      {/* --- 1. HERO SECTION --- */}
      <div className="text-center space-y-4">
        <div className="inline-flex items-center gap-2 bg-indigo-50 text-indigo-600 px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-[0.2em] shadow-sm border border-indigo-100">
          <Zap size={14} className="fill-current"/> Neural Sprint Optimization
        </div>
        <h1 className="text-6xl font-black text-slate-900 tracking-tighter">
          Sprint <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-violet-500">Analyzer</span>
        </h1>
        <p className="text-slate-400 font-medium text-lg">Predict delivery timelines and mitigate risk using Multi-Model AI.</p>
      </div>

      {/* --- 2. CONFIGURATION PANEL --- */}
      <div className="bg-white/70 backdrop-blur-2xl p-8 rounded-[3rem] shadow-2xl border border-white grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="flex items-center gap-5 p-6 bg-slate-50 rounded-[2rem] border border-slate-100 hover:border-slate-300 transition-colors">
          <div className="bg-slate-900 p-4 rounded-2xl text-white shadow-xl"><Target size={28}/></div>
          <div className="flex-1">
            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Team Load (Current Hrs)</label>
            <input type="number" className="text-3xl font-black bg-transparent border-none focus:ring-0 p-0 w-full text-slate-800" value={teamLoad} onChange={e => setTeamLoad(e.target.value)} />
          </div>
        </div>
        <div className="flex items-center gap-5 p-6 bg-indigo-50/50 rounded-[2rem] border border-indigo-100 hover:border-indigo-300 transition-colors">
          <div className="bg-indigo-600 p-4 rounded-2xl text-white shadow-xl"><Hourglass size={28}/></div>
          <div className="flex-1">
            <label className="block text-[10px] font-black uppercase tracking-widest text-indigo-400 mb-1">Deadline Buffer (Hrs)</label>
            <input type="number" className="text-3xl font-black bg-transparent border-none focus:ring-0 p-0 w-full text-indigo-900" value={deadline} onChange={e => setDeadline(e.target.value)} />
          </div>
        </div>
      </div>

      {/* --- 3. DYNAMIC TASK BUILDER --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {tasks.map((task, index) => (
          <div key={index} className="group bg-white p-8 rounded-[2.5rem] shadow-xl border border-slate-50 hover:border-indigo-400 transition-all duration-300 relative">
            <button 
              onClick={() => removeTask(index)} 
              className="absolute top-6 right-6 text-slate-200 hover:text-rose-500 transition-colors"
            >
              <Trash2 size={20}/>
            </button>
            <div className="mb-6">
              <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">Requirement #{task.task_id}</span>
            </div>
            <div className="bg-slate-50 p-6 rounded-[2rem] text-center border border-slate-100 group-hover:bg-white transition-colors">
              <label className="text-[10px] font-black text-indigo-500 uppercase block mb-2">Complexity Points</label>
              <input 
                type="number" 
                className="bg-transparent border-none text-center font-black text-5xl text-slate-800 focus:ring-0 w-full" 
                value={task.story_points} 
                onChange={e => {
                  const n = [...tasks]; 
                  n[index].story_points = parseInt(e.target.value) || 0; 
                  setTasks(n);
                }} 
              />
            </div>
          </div>
        ))}
        
        <button 
          onClick={addTaskRow} 
          className="border-4 border-dashed border-slate-100 rounded-[2.5rem] p-10 text-slate-300 hover:text-indigo-500 hover:bg-indigo-50/30 hover:border-indigo-200 transition-all flex flex-col items-center justify-center gap-4 group"
        >
          <div className="p-4 bg-slate-50 rounded-full group-hover:bg-indigo-100 transition-colors">
            <Plus size={32} />
          </div>
          <span className="text-xs font-black uppercase tracking-widest">Add New Task</span>
        </button>
      </div>

      {/* --- 4. THE TRIGGER --- */}
      <div className="flex flex-col items-center gap-6 py-10">
        <button 
          type="button" 
          onClick={handleSubmit} 
          disabled={loading} 
          className="group bg-slate-900 text-white px-20 py-7 rounded-full font-black uppercase tracking-[0.4em] shadow-[0_20px_50px_rgba(0,0,0,0.2)] hover:bg-indigo-600 hover:-translate-y-1 active:scale-95 transition-all disabled:opacity-50 disabled:translate-y-0"
        >
          {loading ? "Processing Inference..." : "Execute Analysis"}
        </button>
        {loading && <div className="text-indigo-600 animate-bounce"><ChevronDown /></div>}
      </div>

      {/* --- 5. RESULTS DISPLAY (Scroll Target) --- */}
      <div ref={resultsRef}>
        {response && response.status === "success" && (
          <div className="space-y-12 animate-in fade-in slide-in-from-bottom-12 duration-1000">
            
            {/* Aggregate Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="bg-white p-10 rounded-[3rem] shadow-2xl border border-slate-50 flex items-center gap-8 relative overflow-hidden group">
                 <div className="absolute right-0 top-0 p-10 text-slate-50 group-hover:text-indigo-50 transition-colors"><Clock size={120}/></div>
                 <div className="p-5 bg-blue-50 text-blue-600 rounded-[1.5rem] relative z-10"><Clock size={40}/></div>
                 <div className="relative z-10">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Cumulative Time</p>
                    <p className="text-5xl font-black text-slate-900">{response.predicted_time}<span className="text-lg ml-1 text-slate-400">hrs</span></p>
                 </div>
              </div>
              <div className="bg-white p-10 rounded-[3rem] shadow-2xl border border-slate-50 flex items-center gap-8 relative overflow-hidden group">
                 <div className="absolute right-0 top-0 p-10 text-slate-50 group-hover:text-rose-50 transition-colors"><ShieldAlert size={120}/></div>
                 <div className="p-5 bg-rose-50 text-rose-600 rounded-[1.5rem] relative z-10"><ShieldAlert size={40}/></div>
                 <div className="relative z-10">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Inference Risk Score</p>
                    <p className="text-5xl font-black text-slate-900">{response.risk_score}<span className="text-lg ml-1 text-slate-400">%</span></p>
                 </div>
              </div>
            </div>

            {/* Individual Task Breakdown */}
            <div className="space-y-8">
              {response.tasks.map((task, i) => (
                <div key={i} className="bg-white rounded-[4rem] shadow-2xl border border-slate-100 overflow-hidden flex flex-col lg:flex-row min-h-[400px]">
                  
                  {/* Sidebar ID */}
                  <div className="bg-slate-900 lg:w-24 flex items-center justify-center p-6 text-white font-black italic text-3xl border-b lg:border-b-0 lg:border-r border-white/10">
                    #{task.task_id}
                  </div>

                  {/* Simulation Grid */}
                  <div className="flex-1 p-12">
                    <div className="flex items-center gap-3 mb-10">
                      <BarChart3 size={20} className="text-indigo-600"/>
                      <h3 className="text-xs font-black uppercase tracking-[0.2em] text-slate-400">Cross-Level Simulation</h3>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                      {Object.entries(task.full_comparison).map(([lvl, data]) => (
                        <div key={lvl} className={`p-8 rounded-[2.5rem] border-2 transition-all ${data.on_time ? 'bg-slate-50 border-slate-100' : 'bg-rose-50 border-rose-200 grayscale-[0.5]'}`}>
                          <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">{lvl}</p>
                          <p className="text-3xl font-black text-slate-900 mb-6">{data.hours}h</p>
                          
                          <div className="space-y-2">
                            <div className="flex justify-between text-[10px] font-black">
                              <span className="text-slate-400">MODEL RISK</span>
                              <span className={data.risk_pct > 70 ? 'text-rose-600' : 'text-emerald-600'}>{data.risk_pct}%</span>
                            </div>
                            <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                              <div 
                                className={`h-full transition-all duration-1000 ${data.risk_pct > 70 ? 'bg-rose-500' : 'bg-emerald-500'}`} 
                                style={{ width: `${data.risk_pct}%` }}
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Final Assignment Card */}
                  <div className="lg:w-[400px] bg-slate-50 p-12 flex flex-col justify-between border-t lg:border-t-0 lg:border-l border-slate-100">
                    <div>
                      <div className="flex items-center gap-2 mb-8">
                         <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"/>
                         <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Optimized Assignment</span>
                      </div>
                      
                      <div className="space-y-1">
                        <p className="text-[10px] font-black text-slate-400 uppercase">Selected Strategy</p>
                        <p className="text-xl font-bold text-slate-800 leading-tight mb-6">{task.balanced_suggestion.level} Developer</p>
                      </div>

                      <div className="space-y-4 mt-8">
                        <p className="text-[10px] font-black text-slate-400 uppercase">Assigned Resources</p>
                        <div className="flex flex-wrap gap-2">
                          {task.balanced_suggestion.assigned_to.map((dev, di) => (
                            <div key={di} className="bg-white border border-slate-200 px-5 py-3 rounded-2xl flex items-center gap-3 shadow-sm hover:shadow-md transition-shadow">
                              <div className="bg-indigo-600 p-1.5 rounded-lg text-white"><Users size={14}/></div>
                              <span className="text-sm font-black text-slate-700">{dev}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="mt-12 pt-8 border-t border-slate-200 flex justify-between items-center">
                       <div>
                          <p className="text-[9px] font-black text-slate-400 uppercase">Prob. Score</p>
                          <p className="font-black text-slate-900">{task.balanced_suggestion.risk}%</p>
                       </div>
                       <div className="text-right">
                          <p className="text-[9px] font-black text-slate-400 uppercase">Time Allocation</p>
                          <p className="font-black text-slate-900">{task.balanced_suggestion.hours}h</p>
                       </div>
                    </div>
                  </div>

                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}