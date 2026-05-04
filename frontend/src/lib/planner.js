export const defaultSprint = {
  sprint_name: 'Sprint 24 Planning',
  current_team_load: 42,
  deadline_limit: 40,
  meeting_hours: 5,
  support_hours: 3,
  risk_tolerance: 'Balanced',
};

export function getStoredSprintDefaults() {
  if (typeof window === 'undefined') {
    return defaultSprint;
  }

  try {
    const raw = window.localStorage.getItem('optisprint-sprint-defaults');
    return raw ? { ...defaultSprint, ...JSON.parse(raw) } : defaultSprint;
  } catch {
    return defaultSprint;
  }
}

export const fallbackTeam = [
  {
    dev_id: 1,
    name: 'Ava',
    experience_level: 'Senior',
    primary_skill: 'Backend',
    secondary_skill: 'Database',
    current_load: 10,
    max_capacity: 40,
    availability_pct: 90,
    focus_factor: 1.15,
  },
  {
    dev_id: 2,
    name: 'Noah',
    experience_level: 'Senior',
    primary_skill: 'Frontend',
    secondary_skill: 'UI/UX',
    current_load: 12,
    max_capacity: 40,
    availability_pct: 85,
    focus_factor: 1.05,
  },
  {
    dev_id: 3,
    name: 'Mia',
    experience_level: 'Mid',
    primary_skill: 'API',
    secondary_skill: 'Backend',
    current_load: 8,
    max_capacity: 40,
    availability_pct: 100,
    focus_factor: 1,
  },
];

export const fallbackTasks = [
  {
    task_id: 1,
    title: 'Checkout API hardening',
    description: 'Stabilize payment retries and webhook reconciliation.',
    story_points: 5,
    priority: 'High',
    skill_tag: 'Backend',
    task_type: 'Bug',
    dependencies: [],
    due_in_days: 4,
    assignee_hint: 'Ava',
    confidence: 55,
    must_do: true,
  },
  {
    task_id: 2,
    title: 'Dashboard redesign',
    description: 'Refresh sprint summary, metrics, and risk callouts.',
    story_points: 8,
    priority: 'Medium',
    skill_tag: 'Frontend',
    task_type: 'Feature',
    dependencies: [1],
    due_in_days: 8,
    assignee_hint: 'Noah',
    confidence: 70,
    must_do: true,
  },
  {
    task_id: 3,
    title: 'CI pipeline cleanup',
    description: 'Reduce flaky deploy steps and improve artifact retention.',
    story_points: 3,
    priority: 'Medium',
    skill_tag: 'DevOps',
    task_type: 'Chore',
    dependencies: [],
    due_in_days: 10,
    assignee_hint: '',
    confidence: 78,
    must_do: false,
  },
];

export function createPlannerState(reference = {}) {
  const availableTeam = reference.available_team_members?.length
    ? reference.available_team_members
    : reference.team_members?.length
      ? reference.team_members
      : fallbackTeam;
  const availableTasks = reference.available_tasks?.length
    ? reference.available_tasks
    : reference.tasks?.length
      ? reference.tasks
      : reference.backlog?.length
        ? reference.backlog
        : fallbackTasks;

  return {
    sprint: { ...getStoredSprintDefaults(), ...(reference.sprint || {}) },
    available_team_members: availableTeam,
    available_tasks: availableTasks,
    selected_team_ids: Array.isArray(reference.selected_team_ids) ? reference.selected_team_ids : [],
    selected_task_ids: Array.isArray(reference.selected_task_ids) ? reference.selected_task_ids : [],
  };
}

export function createEmptyTask(existingTasks = []) {
  const nextId = existingTasks.length
    ? Math.max(...existingTasks.map((task) => task.task_id)) + 1
    : 1;

  return {
    task_id: nextId,
    title: 'New backlog item',
    description: '',
    story_points: 3,
    priority: 'Medium',
    skill_tag: 'Backend',
    task_type: 'Feature',
    dependencies: [],
    due_in_days: 7,
    assignee_hint: '',
    confidence: 70,
    must_do: false,
  };
}
