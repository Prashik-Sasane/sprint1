import axios from 'axios';

export const api = axios.create({
  baseURL: 'https://parthakadam.space/api',
});

// ── Reference & Planning ──
export async function fetchReferenceData() {
  const { data } = await api.get('/reference-data');
  return data;
}

export async function predictSprint(payload) {
  const { data } = await api.post('/predict-sprint', payload);
  return data;
}

export async function fetchSprintReport() {
  const { data } = await api.get('/sprint-report');
  return data;
}

export async function fetchHealth() {
  const { data } = await api.get('/health');
  return data;
}

export async function autoAssign(payload) {
  const { data } = await api.post('/auto-assign', payload);
  return data;
}

// ── Team Members ──
export async function fetchTeamMembers() {
  const { data } = await api.get('/team-members');
  return data;
}

export async function createTeamMember(member) {
  const { data } = await api.post('/team-members', member);
  return data;
}

export async function updateTeamMember(id, member) {
  const { data } = await api.put(`/team-members/${id}`, member);
  return data;
}

export async function deleteTeamMember(id) {
  const { data } = await api.delete(`/team-members/${id}`);
  return data;
}

// ── Sprints ──
export async function fetchSprints() {
  const { data } = await api.get('/sprints');
  return data;
}

export async function createSprint(sprint) {
  const { data } = await api.post('/sprints', sprint);
  return data;
}

export async function updateSprint(id, sprint) {
  const { data } = await api.put(`/sprints/${id}`, sprint);
  return data;
}

export async function deleteSprint(id) {
  const { data } = await api.delete(`/sprints/${id}`);
  return data;
}

export async function duplicateSprint(id) {
  const { data } = await api.post(`/sprints/${id}/duplicate`);
  return data;
}

// ── Tasks ──
export async function fetchTasks(filters = {}) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, val]) => {
    if (val) params.set(key, val);
  });
  const { data } = await api.get(`/tasks?${params.toString()}`);
  return data;
}

export async function createTask(task) {
  const { data } = await api.post('/tasks', task);
  return data;
}

export async function updateTask(taskId, task) {
  const { data } = await api.put(`/tasks/${taskId}`, task);
  return data;
}

export async function deleteTask(taskId) {
  const { data } = await api.delete(`/tasks/${taskId}`);
  return data;
}

export async function updateTaskStatus(taskId, status) {
  const { data } = await api.patch(`/tasks/${taskId}/status`, { status });
  return data;
}

// ── Activity ──
export async function fetchActivity() {
  const { data } = await api.get('/activity');
  return data;
}

// ── Velocity ──
export async function fetchVelocity(sprintId) {
  const { data } = await api.get(`/sprints/${sprintId}/velocity`);
  return data;
}
