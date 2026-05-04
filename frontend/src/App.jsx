import React, { startTransition, useEffect, useState } from 'react';
import { BrowserRouter as Router, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { ThemeProvider } from '@/lib/theme';
import AppLayout from '@/components/layout/AppLayout';
import Dashboard from '@/pages/Dashboard';
import LandingPage from '@/pages/LandingPage';
import TaskInput from '@/pages/TaskInput';
import TeamPage from '@/pages/TeamPage';
import BoardPage from '@/pages/BoardPage';
import TimelinePage from '@/pages/TimelinePage';
import ActivityPage from '@/pages/ActivityPage';
import SettingsPage from '@/pages/SettingsPage';
import { fetchReferenceData, fetchSprintReport, predictSprint, updateTask } from '@/lib/api';
import { createPlannerState } from '@/lib/planner';

function AppContent() {
  const navigate = useNavigate();
  const location = useLocation();
  const [plannerState, setPlannerState] = useState(createPlannerState());
  const [analysis, setAnalysis] = useState(null);
  const [report, setReport] = useState(null);
  const [bootstrapping, setBootstrapping] = useState(true);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    let active = true;
    async function bootstrap() {
      try {
        const [reference, sprintReport] = await Promise.all([
          fetchReferenceData(),
          fetchSprintReport(),
        ]);
        if (!active) return;
        setPlannerState(createPlannerState(reference));
        setReport(sprintReport);
      } catch {
        if (!active) return;
        setLoadError('Live data unavailable. Using local defaults.');
      } finally {
        if (active) setBootstrapping(false);
      }
    }
    bootstrap();
    return () => { active = false; };
  }, []);

  const startPlanning = () => {
    startTransition(() => {
      navigate('/planner');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  };

  const runAnalysis = async (payload, draftState) => {
    const result = await predictSprint(payload);
    if (draftState) {
      setPlannerState(createPlannerState(draftState));
    }
    setAnalysis(result);
    try { const r = await fetchSprintReport(); setReport(r); } catch { /* dashboard can render from analysis */ }
    startTransition(() => {
      navigate('/dashboard');
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  };

  const applyScopeToBoard = async () => {
    const selectedTaskIds = plannerState.selected_task_ids || [];
    const availableTasks = plannerState.available_tasks || [];
    const selectedTasks = availableTasks.filter((task) => selectedTaskIds.includes(task.task_id));
    const analysisTasks = new Map((analysis?.tasks || []).map((task) => [task.task_id, task]));

    if (selectedTasks.length === 0) {
      return { count: 0 };
    }

    await Promise.all(
      selectedTasks.map((task) => {
        const analyzed = analysisTasks.get(task.task_id);
        const recommendedOwner = analyzed?.recommended_assignment?.name || task.assignee_hint || '';

        return updateTask(task.task_id, {
          sprint_id: Number(task.sprint_id || 1),
          title: task.title,
          description: task.description || '',
          story_points: Number(task.story_points || 1),
          priority: task.priority || 'Medium',
          status: task.status && task.status !== 'Backlog' ? task.status : 'To Do',
          skill_tag: task.skill_tag || 'Backend',
          task_type: task.task_type || 'Feature',
          dependencies: task.dependencies || [],
          due_in_days: Number(task.due_in_days || 10),
          assignee_hint: recommendedOwner,
          confidence: Number(task.confidence || 70),
          must_do: Boolean(task.must_do),
          assigned_to: recommendedOwner,
          predicted_hours: Number(analyzed?.predicted_hours || task.predicted_hours || 0),
          risk_score: Number(analyzed?.risk_pct || task.risk_score || 0),
        });
      }),
    );

    const reference = await fetchReferenceData();
    setPlannerState(createPlannerState({
      ...reference,
      sprint: plannerState.sprint,
      selected_team_ids: plannerState.selected_team_ids,
      selected_task_ids: plannerState.selected_task_ids,
    }));

    return { count: selectedTasks.length };
  };

  const isLanding = location.pathname === '/';

  if (isLanding) {
    return <LandingPage onStart={startPlanning} bootstrapping={bootstrapping} />;
  }

  return (
    <AppLayout>
      <Routes>
        <Route path="/planner" element={<TaskInput bootstrapping={bootstrapping} initialState={plannerState} loadError={loadError} onAnalyze={runAnalysis} onApplyToBoard={applyScopeToBoard} />} />
        <Route path="/input" element={<TaskInput bootstrapping={bootstrapping} initialState={plannerState} loadError={loadError} onAnalyze={runAnalysis} onApplyToBoard={applyScopeToBoard} />} />
        <Route path="/dashboard" element={<Dashboard analysis={analysis} report={report} onBackToPlanner={startPlanning} onApplyToBoard={applyScopeToBoard} />} />
        <Route path="/results" element={<Dashboard analysis={analysis} report={report} onBackToPlanner={startPlanning} onApplyToBoard={applyScopeToBoard} />} />
        <Route path="/team" element={<TeamPage />} />
        <Route path="/board" element={<BoardPage />} />
        <Route path="/timeline" element={<TimelinePage />} />
        <Route path="/activity" element={<ActivityPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Routes>
    </AppLayout>
  );
}

export default function App() {
  return (
    <ThemeProvider>
      <Router>
        <Routes>
          <Route path="/*" element={<AppContent />} />
        </Routes>
      </Router>
    </ThemeProvider>
  );
}
