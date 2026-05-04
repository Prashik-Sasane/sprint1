import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  ClipboardList,
  LoaderCircle,
  Plus,
  RefreshCw,
  Search,
  Sparkles,
  Trash2,
  UserPlus,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { createTask, createTeamMember } from '@/lib/api';
import { createEmptyTask, createPlannerState } from '@/lib/planner';

const skillOptions = ['Backend', 'Frontend', 'API', 'DevOps', 'UI/UX', 'Database', 'Security', 'Mobile'];
const priorityOptions = ['Low', 'Medium', 'High', 'Critical'];
const typeOptions = ['Feature', 'Bug', 'Chore', 'Spike'];
const experienceOptions = ['Junior', 'Mid', 'Senior'];
const riskOptions = ['Low', 'Balanced', 'Aggressive'];

const emptyMember = {
  name: '',
  experience_level: 'Mid',
  primary_skill: 'Backend',
  secondary_skill: '',
  current_load: 0,
  max_capacity: 40,
  availability_pct: 100,
  focus_factor: 1,
};

export default function TaskInput({ initialState, onAnalyze, onApplyToBoard, bootstrapping, loadError }) {
  const [ps, setPs] = useState(createPlannerState(initialState));
  const [teamSearch, setTeamSearch] = useState('');
  const [taskSearch, setTaskSearch] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [memberDialogOpen, setMemberDialogOpen] = useState(false);
  const [taskDialogOpen, setTaskDialogOpen] = useState(false);
  const [memberForm, setMemberForm] = useState({ ...emptyMember });
  const [taskForm, setTaskForm] = useState(createTaskDraft());
  const [savingMember, setSavingMember] = useState(false);
  const [savingTask, setSavingTask] = useState(false);
  const [applying, setApplying] = useState(false);
  const [applyMessage, setApplyMessage] = useState('');

  useEffect(() => {
    setPs(createPlannerState(initialState));
    setSubmitError('');
    setApplyMessage('');
  }, [initialState]);

  const sprint = ps.sprint;
  const team = ps.available_team_members || [];
  const tasks = ps.available_tasks || [];
  const selectedTeamIds = ps.selected_team_ids || [];
  const selectedTaskIds = ps.selected_task_ids || [];

  const selectedTeam = team.filter((member) => selectedTeamIds.includes(member.dev_id));
  const selectedTasks = tasks.filter((task) => selectedTaskIds.includes(task.task_id));
  const availableTeam = team.filter((member) => !selectedTeamIds.includes(member.dev_id));
  const availableTasks = tasks.filter((task) => !selectedTaskIds.includes(task.task_id));

  const uSprint = (field, value) => setPs((prev) => ({ ...prev, sprint: { ...prev.sprint, [field]: value } }));
  const uMember = (devId, field, value) => setPs((prev) => ({
    ...prev,
    available_team_members: prev.available_team_members.map((member) => (
      member.dev_id === devId ? { ...member, [field]: value } : member
    )),
  }));
  const uTask = (taskId, field, value) => setPs((prev) => ({
    ...prev,
    available_tasks: prev.available_tasks.map((task) => (
      task.task_id === taskId ? { ...task, [field]: value } : task
    )),
  }));

  const addTeamToSprint = (devId) => setPs((prev) => ({
    ...prev,
    selected_team_ids: [...prev.selected_team_ids, devId],
  }));
  const removeTeamFromSprint = (devId) => setPs((prev) => ({
    ...prev,
    selected_team_ids: prev.selected_team_ids.filter((id) => id !== devId),
  }));
  const addTaskToSprint = (taskId) => setPs((prev) => ({
    ...prev,
    selected_task_ids: [...prev.selected_task_ids, taskId],
  }));
  const removeTaskFromSprint = (taskId) => setPs((prev) => ({
    ...prev,
    selected_task_ids: prev.selected_task_ids.filter((id) => id !== taskId),
  }));

  const reset = () => {
    setPs(createPlannerState(initialState));
    setSubmitError('');
    setTeamSearch('');
    setTaskSearch('');
  };

  const openMemberDialog = () => {
    setMemberForm({ ...emptyMember });
    setMemberDialogOpen(true);
  };

  const openTaskDialog = () => {
    setTaskForm(createTaskDraft(ps.available_tasks));
    setTaskDialogOpen(true);
  };

  const saveMember = async () => {
    setSavingMember(true);
    try {
      const payload = {
        ...memberForm,
        current_load: Number(memberForm.current_load || 0),
        max_capacity: Number(memberForm.max_capacity || 40),
        availability_pct: Number(memberForm.availability_pct || 100),
        focus_factor: Number(memberForm.focus_factor || 1),
      };
      const response = await createTeamMember(payload);
      const member = response.member;
      setPs((prev) => ({
        ...prev,
        available_team_members: [...prev.available_team_members, member],
        selected_team_ids: [...prev.selected_team_ids, member.dev_id],
      }));
      setMemberDialogOpen(false);
    } catch (error) {
      console.error('Member create failed', error);
    } finally {
      setSavingMember(false);
    }
  };

  const saveTask = async () => {
    setSavingTask(true);
    try {
      const payload = {
        sprint_id: 1,
        title: taskForm.title.trim(),
        description: taskForm.description,
        story_points: Number(taskForm.story_points || 1),
        priority: taskForm.priority,
        status: 'Backlog',
        skill_tag: taskForm.skill_tag,
        task_type: taskForm.task_type,
        dependencies: parseDependencies(taskForm.dependencies_text),
        due_in_days: Number(taskForm.due_in_days || 1),
        assignee_hint: taskForm.assignee_hint,
        confidence: Number(taskForm.confidence || 0),
        must_do: Boolean(taskForm.must_do),
        assigned_to: '',
      };
      const response = await createTask(payload);
      const task = response.task;
      setPs((prev) => ({
        ...prev,
        available_tasks: [...prev.available_tasks, task],
        selected_task_ids: [...prev.selected_task_ids, task.task_id],
      }));
      setTaskDialogOpen(false);
    } catch (error) {
      console.error('Task create failed', error);
    } finally {
      setSavingTask(false);
    }
  };

  const submit = async () => {
    if (selectedTeam.length === 0) {
      setSubmitError('Add at least one team member to the sprint.');
      return;
    }
    if (selectedTasks.length === 0) {
      setSubmitError('Add at least one backlog item to the sprint.');
      return;
    }

    setSubmitting(true);
    setSubmitError('');
    try {
      const payload = {
        sprint: {
          ...sprint,
          current_team_load: Number(sprint.current_team_load),
          deadline_limit: Number(sprint.deadline_limit),
          meeting_hours: Number(sprint.meeting_hours),
          support_hours: Number(sprint.support_hours),
        },
        team_members: selectedTeam.map((member) => ({
          ...member,
          current_load: Number(member.current_load),
          max_capacity: Number(member.max_capacity),
          availability_pct: Number(member.availability_pct),
          focus_factor: Number(member.focus_factor),
        })),
        tasks: selectedTasks.map((task) => ({
          ...task,
          story_points: Number(task.story_points),
          due_in_days: Number(task.due_in_days),
          confidence: Number(task.confidence),
        })),
      };

      await onAnalyze(payload, {
        sprint,
        available_team_members: team,
        available_tasks: tasks,
        selected_team_ids: selectedTeamIds,
        selected_task_ids: selectedTaskIds,
      });
    } catch (error) {
      setSubmitError(error?.response?.data?.detail || 'Planning failed.');
    } finally {
      setSubmitting(false);
    }
  };

  const applyToBoard = async () => {
    if (selectedTasks.length === 0) {
      setApplyMessage('Select at least one backlog item before applying to the board.');
      return;
    }

    setApplying(true);
    setApplyMessage('');
    try {
      const result = await onApplyToBoard();
      setApplyMessage(`${result.count} sprint task${result.count === 1 ? '' : 's'} applied to the board.`);
    } catch (error) {
      setApplyMessage(error?.response?.data?.detail || 'Could not apply sprint scope to the board.');
    } finally {
      setApplying(false);
    }
  };

  const totalSP = selectedTasks.reduce((sum, task) => sum + Number(task.story_points || 0), 0);
  const mustDo = selectedTasks.filter((task) => task.must_do).length;
  const filteredTeam = availableTeam.filter((member) => matchesMember(member, teamSearch));
  const filteredTasks = availableTasks.filter((task) => matchesTask(task, taskSearch));

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="grid gap-6 lg:grid-cols-[1.15fr_0.85fr]">
        <Card>
          <CardHeader>
            <Badge variant="outline" className="mb-2 w-fit gap-1.5">
              <Sparkles size={12} className="text-primary" />
              Planning workspace
            </Badge>
            <CardTitle className="text-3xl font-bold tracking-tight">Scope the sprint intentionally.</CardTitle>
            <p className="text-sm text-muted-foreground">
              Pull only the right people and backlog items into the sprint, then run the analysis on that smaller scope.
            </p>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 sm:grid-cols-4">
              <MiniMetric label="Sprint Team" value={selectedTeam.length} />
              <MiniMetric label="Backlog" value={selectedTasks.length} />
              <MiniMetric label="Story pts" value={totalSP} />
              <MiniMetric label="Must-do" value={mustDo} />
            </div>
            {loadError && (
              <div className="mt-4 rounded-lg border border-amber-500/30 bg-amber-500/10 px-4 py-3 text-sm text-amber-600 dark:text-amber-400">
                {loadError}
              </div>
            )}
            {submitError && (
              <div className="mt-4 rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
                {submitError}
              </div>
            )}
            {applyMessage && (
              <div className="mt-4 rounded-lg border border-primary/20 bg-primary/10 px-4 py-3 text-sm text-primary">
                {applyMessage}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-primary/10 bg-gradient-to-br from-card via-card to-primary/5 shadow-lg">
          <CardHeader>
            <div className="flex items-center gap-2 text-muted-foreground">
              <ClipboardList size={16} />
              <span className="text-xs uppercase tracking-widest">Sprint setup</span>
            </div>
          </CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <DarkField label="Sprint name" value={sprint.sprint_name} onChange={(value) => uSprint('sprint_name', value)} />
            <DarkSelect label="Risk mode" value={sprint.risk_tolerance} options={riskOptions} onChange={(value) => uSprint('risk_tolerance', value)} />
            <DarkField label="Team load %" type="number" value={sprint.current_team_load} onChange={(value) => uSprint('current_team_load', value)} />
            <DarkField label="Deadline (h)" type="number" value={sprint.deadline_limit} onChange={(value) => uSprint('deadline_limit', value)} />
            <DarkField label="Meetings (h)" type="number" value={sprint.meeting_hours} onChange={(value) => uSprint('meeting_hours', value)} />
            <DarkField label="Support (h)" type="number" value={sprint.support_hours} onChange={(value) => uSprint('support_hours', value)} />
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <CardTitle>Sprint Team</CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">Select only the people participating in this sprint.</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={reset} className="gap-1.5">
                  <RefreshCw size={14} />
                  Reset
                </Button>
                <Button size="sm" onClick={openMemberDialog} className="gap-1.5">
                  <UserPlus size={14} />
                  New member
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedTeam.length === 0 ? (
              <EmptyState
                title="No sprint team yet"
                description="Add members from the roster on the right. Team management still lives in the dedicated Team page."
              />
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {selectedTeam.map((member) => (
                  <Card key={member.dev_id} className="border-border/60 bg-muted/25">
                    <CardContent className="space-y-4 p-4">
                      <div className="flex items-start justify-between gap-3">
                        <div>
                          <p className="font-semibold">{member.name}</p>
                          <div className="mt-1 flex flex-wrap gap-2">
                            <Badge variant="secondary">{member.experience_level}</Badge>
                            <Badge variant="outline">{member.primary_skill}</Badge>
                            {member.secondary_skill && <Badge variant="outline">{member.secondary_skill}</Badge>}
                          </div>
                        </div>
                        <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeTeamFromSprint(member.dev_id)}>
                          <Trash2 size={14} />
                        </Button>
                      </div>

                      <div className="grid gap-3 sm:grid-cols-2">
                        <SelectField label="Level" value={member.experience_level} options={experienceOptions} onChange={(value) => uMember(member.dev_id, 'experience_level', value)} />
                        <SelectField label="Primary" value={member.primary_skill} options={skillOptions} onChange={(value) => uMember(member.dev_id, 'primary_skill', value)} />
                        <SelectField label="Secondary" value={member.secondary_skill || ''} options={['', ...skillOptions]} onChange={(value) => uMember(member.dev_id, 'secondary_skill', value)} />
                        <NumberField label="Load (h)" value={member.current_load} onChange={(value) => uMember(member.dev_id, 'current_load', value)} />
                        <NumberField label="Capacity (h)" value={member.max_capacity} onChange={(value) => uMember(member.dev_id, 'max_capacity', value)} />
                        <NumberField label="Availability %" value={member.availability_pct} onChange={(value) => uMember(member.dev_id, 'availability_pct', value)} />
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <CardTitle>Available Roster</CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">Browse the saved team and add people to this sprint one by one.</p>
              </div>
              <Badge variant="outline" className="gap-1.5">
                <Users size={14} className="text-primary" />
                {team.length} total
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <SearchInput value={teamSearch} onChange={setTeamSearch} placeholder="Search team by name or skill..." />
            <div className="space-y-3">
              {filteredTeam.map((member) => (
                <div key={member.dev_id} className="flex items-center justify-between gap-3 rounded-lg border bg-background px-4 py-3">
                  <div>
                    <p className="text-sm font-medium">{member.name}</p>
                    <div className="mt-1 flex flex-wrap gap-2">
                      <Badge variant="secondary">{member.experience_level}</Badge>
                      <Badge variant="outline">{member.primary_skill}</Badge>
                    </div>
                  </div>
                  <Button size="sm" variant="outline" onClick={() => addTeamToSprint(member.dev_id)}>
                    Add
                  </Button>
                </div>
              ))}
              {filteredTeam.length === 0 && (
                <EmptyState
                  title="No matching team members"
                  description="Everyone is already in scope, or the search filter removed them."
                  compact
                />
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <CardTitle>Sprint Scope</CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">Shape only the backlog items you actually want the model to evaluate.</p>
              </div>
              <Button size="sm" onClick={openTaskDialog} className="gap-1.5">
                <Plus size={14} />
                New task
              </Button>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {selectedTasks.length === 0 ? (
              <EmptyState
                title="No sprint backlog yet"
                description="Add existing backlog items from the library on the right, or create a new one here."
              />
            ) : (
              selectedTasks.map((task) => (
                <Card key={task.task_id} className="border-border/60 bg-muted/20">
                  <CardContent className="space-y-4 p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <span className="text-[10px] uppercase tracking-widest text-muted-foreground">Task #{task.task_id}</span>
                        <p className="mt-1 font-semibold">{task.title}</p>
                      </div>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => removeTaskFromSprint(task.task_id)}>
                        <Trash2 size={14} />
                      </Button>
                    </div>

                    <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
                      <Field label="Title" value={task.title} onChange={(value) => uTask(task.task_id, 'title', value)} />
                      <SelectField label="Priority" value={task.priority} options={priorityOptions} onChange={(value) => uTask(task.task_id, 'priority', value)} />
                      <SelectField label="Skill" value={task.skill_tag} options={skillOptions} onChange={(value) => uTask(task.task_id, 'skill_tag', value)} />
                      <SelectField label="Type" value={task.task_type} options={typeOptions} onChange={(value) => uTask(task.task_id, 'task_type', value)} />
                      <NumberField label="Story pts" value={task.story_points} onChange={(value) => uTask(task.task_id, 'story_points', value)} />
                      <NumberField label="Due (days)" value={task.due_in_days} onChange={(value) => uTask(task.task_id, 'due_in_days', value)} />
                      <NumberField label="Confidence %" value={task.confidence} onChange={(value) => uTask(task.task_id, 'confidence', value)} />
                      <Field label="Assignee hint" value={task.assignee_hint} onChange={(value) => uTask(task.task_id, 'assignee_hint', value)} />
                    </div>

                    <div className="grid gap-3 lg:grid-cols-[1.5fr_0.85fr]">
                      <div className="grid gap-1.5">
                        <Label>Description</Label>
                        <Textarea rows={3} value={task.description} onChange={(event) => uTask(task.task_id, 'description', event.target.value)} />
                      </div>
                      <div className="grid gap-3">
                        <Field
                          label="Dependencies"
                          value={(task.dependencies || []).join(', ')}
                          onChange={(value) => uTask(task.task_id, 'dependencies', parseDependencies(value))}
                          placeholder="1, 4, 7"
                        />
                        <label className="flex items-center gap-3 rounded-lg border bg-background px-4 py-3 text-sm">
                          <input
                            type="checkbox"
                            checked={Boolean(task.must_do)}
                            onChange={(event) => uTask(task.task_id, 'must_do', event.target.checked)}
                            className="h-4 w-4 rounded border-input text-primary"
                          />
                          Must ship this sprint
                        </label>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <CardTitle>Backlog Library</CardTitle>
                <p className="mt-1 text-sm text-muted-foreground">Use saved backlog records as the source of sprint scope.</p>
              </div>
              <Badge variant="outline">{tasks.length} available</Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <SearchInput value={taskSearch} onChange={setTaskSearch} placeholder="Search title, skill, or assignee..." />
            <div className="space-y-3">
              {filteredTasks.map((task) => (
                <div key={task.task_id} className="rounded-lg border bg-background p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium">{task.title}</p>
                      <p className="mt-1 text-xs text-muted-foreground line-clamp-2">{task.description}</p>
                    </div>
                    <Button size="sm" variant="outline" onClick={() => addTaskToSprint(task.task_id)}>
                      Add
                    </Button>
                  </div>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Badge variant="secondary">{task.priority}</Badge>
                    <Badge variant="outline">{task.skill_tag}</Badge>
                    <Badge variant="outline">{task.story_points} SP</Badge>
                    {task.must_do && <Badge variant="destructive">Must-do</Badge>}
                  </div>
                </div>
              ))}
              {filteredTasks.length === 0 && (
                <EmptyState
                  title="No matching backlog items"
                  description="Everything is already in the sprint, or the current search removed the remaining items."
                  compact
                />
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-primary/20 bg-gradient-to-r from-primary/5 to-transparent">
        <CardContent className="flex flex-col gap-4 p-6 md:flex-row md:items-center md:justify-between">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 shrink-0 text-amber-500" size={18} />
            <div>
              <p className="text-sm font-medium">Run the planner only after the sprint scope looks real.</p>
              <p className="mt-1 text-sm text-muted-foreground">
                The analysis will score only the selected backlog against the selected sprint team, instead of the whole saved database.
              </p>
            </div>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <Button variant="outline" size="lg" onClick={applyToBoard} disabled={applying || bootstrapping} className="min-w-[220px] gap-2">
              {applying ? <LoaderCircle size={16} className="animate-spin" /> : <ClipboardList size={16} />}
              {applying ? 'Applying...' : 'Apply To Board'}
            </Button>
            <Button size="lg" onClick={submit} disabled={submitting || bootstrapping} className="min-w-[220px] gap-2">
              {submitting ? <LoaderCircle size={16} className="animate-spin" /> : <Sparkles size={16} />}
              {submitting ? 'Analyzing...' : 'Generate Analysis'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Dialog open={memberDialogOpen} onOpenChange={setMemberDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Add Team Member</DialogTitle>
            <DialogDescription>Create a reusable roster member, then include them in this sprint immediately.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <Field label="Name" value={memberForm.name} onChange={(value) => setMemberForm({ ...memberForm, name: value })} />
            <div className="grid gap-3 sm:grid-cols-2">
              <SelectField label="Experience" value={memberForm.experience_level} options={experienceOptions} onChange={(value) => setMemberForm({ ...memberForm, experience_level: value })} />
              <SelectField label="Primary Skill" value={memberForm.primary_skill} options={skillOptions} onChange={(value) => setMemberForm({ ...memberForm, primary_skill: value })} />
              <SelectField label="Secondary Skill" value={memberForm.secondary_skill || ''} options={['', ...skillOptions]} onChange={(value) => setMemberForm({ ...memberForm, secondary_skill: value })} />
              <NumberField label="Load (h)" value={memberForm.current_load} onChange={(value) => setMemberForm({ ...memberForm, current_load: value })} />
              <NumberField label="Capacity (h)" value={memberForm.max_capacity} onChange={(value) => setMemberForm({ ...memberForm, max_capacity: value })} />
              <NumberField label="Availability %" value={memberForm.availability_pct} onChange={(value) => setMemberForm({ ...memberForm, availability_pct: value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMemberDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveMember} disabled={!memberForm.name.trim() || savingMember}>
              {savingMember ? 'Saving...' : 'Add Member'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={taskDialogOpen} onOpenChange={setTaskDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add Backlog Item</DialogTitle>
            <DialogDescription>Create a saved backlog record and add it to this sprint scope right away.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <Field label="Title" value={taskForm.title} onChange={(value) => setTaskForm({ ...taskForm, title: value })} />
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <SelectField label="Priority" value={taskForm.priority} options={priorityOptions} onChange={(value) => setTaskForm({ ...taskForm, priority: value })} />
              <SelectField label="Skill" value={taskForm.skill_tag} options={skillOptions} onChange={(value) => setTaskForm({ ...taskForm, skill_tag: value })} />
              <SelectField label="Type" value={taskForm.task_type} options={typeOptions} onChange={(value) => setTaskForm({ ...taskForm, task_type: value })} />
              <NumberField label="Story pts" value={taskForm.story_points} onChange={(value) => setTaskForm({ ...taskForm, story_points: value })} />
              <NumberField label="Due (days)" value={taskForm.due_in_days} onChange={(value) => setTaskForm({ ...taskForm, due_in_days: value })} />
              <NumberField label="Confidence %" value={taskForm.confidence} onChange={(value) => setTaskForm({ ...taskForm, confidence: value })} />
              <Field label="Assignee hint" value={taskForm.assignee_hint} onChange={(value) => setTaskForm({ ...taskForm, assignee_hint: value })} />
              <Field label="Dependencies" value={taskForm.dependencies_text} onChange={(value) => setTaskForm({ ...taskForm, dependencies_text: value })} placeholder="1, 4, 7" />
            </div>
            <div className="grid gap-2">
              <Label>Description</Label>
              <Textarea rows={4} value={taskForm.description} onChange={(event) => setTaskForm({ ...taskForm, description: event.target.value })} />
            </div>
            <label className="flex items-center gap-3 rounded-lg border bg-muted/30 px-4 py-3 text-sm">
              <input
                type="checkbox"
                checked={Boolean(taskForm.must_do)}
                onChange={(event) => setTaskForm({ ...taskForm, must_do: event.target.checked })}
                className="h-4 w-4 rounded border-input text-primary"
              />
              Must ship this sprint
            </label>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTaskDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveTask} disabled={!taskForm.title.trim() || savingTask}>
              {savingTask ? 'Saving...' : 'Add Task'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function createTaskDraft(existingTasks = []) {
  const task = createEmptyTask(existingTasks);
  return {
    ...task,
    dependencies_text: '',
  };
}

function parseDependencies(value) {
  return String(value || '')
    .split(',')
    .map((part) => Number(part.trim()))
    .filter((part) => !Number.isNaN(part) && part > 0);
}

function matchesMember(member, search) {
  if (!search.trim()) return true;
  const haystack = [member.name, member.primary_skill, member.secondary_skill]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return haystack.includes(search.toLowerCase());
}

function matchesTask(task, search) {
  if (!search.trim()) return true;
  const haystack = [task.title, task.description, task.skill_tag, task.assignee_hint]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return haystack.includes(search.toLowerCase());
}

function MiniMetric({ label, value }) {
  return (
    <div className="rounded-lg border bg-muted/50 px-4 py-3">
      <p className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</p>
      <p className="mt-1 text-xl font-bold">{value}</p>
    </div>
  );
}

function EmptyState({ title, description, compact = false }) {
  return (
    <div className={`rounded-lg border border-dashed px-4 ${compact ? 'py-6' : 'py-10'} text-center`}>
      <p className="font-medium">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </div>
  );
}

function SearchInput({ value, onChange, placeholder }) {
  return (
    <div className="relative">
      <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
      <Input value={value} onChange={(event) => onChange(event.target.value)} placeholder={placeholder} className="pl-9" />
    </div>
  );
}

function Field({ label, value, onChange, type = 'text', placeholder = '' }) {
  return (
    <div className="grid gap-1.5">
      <Label>{label}</Label>
      <Input type={type} value={value} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} />
    </div>
  );
}

function NumberField({ label, value, onChange }) {
  return (
    <div className="grid gap-1.5">
      <Label>{label}</Label>
      <Input type="number" value={value} onChange={(event) => onChange(Number(event.target.value))} />
    </div>
  );
}

function SelectField({ label, value, options, onChange }) {
  return (
    <div className="grid gap-1.5">
      <Label>{label}</Label>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        {options.map((option) => (
          <option key={option || 'none'} value={option}>
            {option || 'None'}
          </option>
        ))}
      </select>
    </div>
  );
}

function DarkField({ label, value, onChange, type = 'text' }) {
  return (
    <div className="grid gap-1.5">
      <span className="text-xs uppercase tracking-widest text-muted-foreground">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none focus:border-ring"
      />
    </div>
  );
}

function DarkSelect({ label, value, options, onChange }) {
  return (
    <div className="grid gap-1.5">
      <span className="text-xs uppercase tracking-widest text-muted-foreground">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 rounded-lg border border-input bg-background px-3 text-sm text-foreground outline-none focus:border-ring"
      >
        {options.map((option) => (
          <option key={option} value={option}>
            {option}
          </option>
        ))}
      </select>
    </div>
  );
}
