import React, { useEffect, useState } from 'react';
import { Edit3, Plus, Search, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { createTask, deleteTask, fetchTasks, updateTask, updateTaskStatus } from '@/lib/api';

const COLUMNS = ['Backlog', 'To Do', 'In Progress', 'Review', 'Done'];
const skillOptions = ['Backend', 'Frontend', 'API', 'DevOps', 'UI/UX', 'Database', 'Security', 'Mobile'];
const priorityOptions = ['Low', 'Medium', 'High', 'Critical'];
const typeOptions = ['Feature', 'Bug', 'Chore', 'Spike'];
const colBorder = { Backlog: 'border-t-gray-400', 'To Do': 'border-t-blue-500', 'In Progress': 'border-t-amber-500', Review: 'border-t-violet-500', Done: 'border-t-emerald-500' };
const prioColor = { Critical: 'destructive', High: 'warning', Medium: 'info', Low: 'secondary' };

const emptyTask = {
  title: '',
  description: '',
  story_points: 3,
  priority: 'Medium',
  status: 'Backlog',
  skill_tag: 'Backend',
  task_type: 'Feature',
  dependencies_text: '',
  due_in_days: 7,
  assignee_hint: '',
  confidence: 70,
  must_do: false,
  sprint_id: 1,
  assigned_to: '',
};

export default function BoardPage() {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [moving, setMoving] = useState(null);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ ...emptyTask });
  const [saving, setSaving] = useState(false);

  const loadTasks = async () => {
    try {
      const response = await fetchTasks();
      setTasks(response.tasks || []);
    } catch {
      setTasks([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadTasks();
  }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ ...emptyTask });
    setDialogOpen(true);
  };

  const openEdit = (task) => {
    setEditing(task);
    setForm({
      ...emptyTask,
      ...task,
      dependencies_text: (task.dependencies || []).join(', '),
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    setSaving(true);
    const payload = {
      sprint_id: Number(form.sprint_id || 1),
      title: form.title.trim(),
      description: form.description,
      story_points: Number(form.story_points || 1),
      priority: form.priority,
      status: form.status,
      skill_tag: form.skill_tag,
      task_type: form.task_type,
      dependencies: parseDependencies(form.dependencies_text),
      due_in_days: Number(form.due_in_days || 1),
      assignee_hint: form.assignee_hint,
      confidence: Number(form.confidence || 0),
      must_do: Boolean(form.must_do),
      assigned_to: form.assigned_to || '',
    };
    try {
      if (editing) {
        await updateTask(editing.task_id, payload);
      } else {
        await createTask(payload);
      }
      setDialogOpen(false);
      await loadTasks();
    } catch (error) {
      console.error('Task save failed', error);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (taskId) => {
    try {
      await deleteTask(taskId);
      await loadTasks();
    } catch (error) {
      console.error('Task delete failed', error);
    }
  };

  const move = async (id, status) => {
    setMoving(id);
    try {
      await updateTaskStatus(id, status);
      setTasks((prev) => prev.map((task) => (task.task_id === id ? { ...task, status } : task)));
    } catch (error) {
      console.error(error);
    } finally {
      setMoving(null);
    }
  };

  const filteredTasks = tasks.filter((task) => {
    const haystack = [task.title, task.description, task.skill_tag, task.assignee_hint]
      .filter(Boolean)
      .join(' ')
      .toLowerCase();
    return haystack.includes(search.toLowerCase());
  });

  if (loading) {
    return (
      <div className="flex justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Sprint Board</h1>
          <p className="mt-1 text-muted-foreground">
            {tasks.length} tasks · {tasks.reduce((sum, task) => sum + (task.story_points || 0), 0)} total points
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
          <div className="relative min-w-[280px]">
            <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search backlog, assignee, or skill..."
              className="pl-9"
            />
          </div>
          <Button onClick={openCreate} className="gap-2">
            <Plus size={16} />
            Add Task
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-5">
        {COLUMNS.map((column) => {
          const columnTasks = filteredTasks.filter((task) => (task.status || 'Backlog') === column);
          return (
            <div key={column} className="space-y-3">
              <div className={cn('rounded-lg border bg-card p-3 border-t-[3px]', colBorder[column])}>
                <div className="flex items-center justify-between">
                  <span className="text-sm font-semibold">{column}</span>
                  <Badge variant="secondary" className="h-5 text-[10px]">
                    {columnTasks.length}
                  </Badge>
                </div>
              </div>

              <div className="space-y-2 min-h-[120px]">
                {columnTasks.map((task) => {
                  const columnIndex = COLUMNS.indexOf(column);
                  return (
                    <Card
                      key={task.task_id}
                      className={cn(
                        'group transition-all hover:border-primary/20 hover:shadow-md',
                        moving === task.task_id && 'opacity-50',
                      )}
                    >
                      <CardContent className="space-y-3 p-3">
                        <div className="flex items-center justify-between gap-2">
                          <Badge variant={prioColor[task.priority] || 'secondary'} className="text-[10px]">
                            {task.priority}
                          </Badge>
                          <div className="flex gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(task)}>
                              <Edit3 size={14} />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(task.task_id)}>
                              <Trash2 size={14} />
                            </Button>
                          </div>
                        </div>

                        <div className="space-y-1">
                          <p className="text-sm font-medium leading-tight">{task.title}</p>
                          {task.description && <p className="text-xs text-muted-foreground line-clamp-2">{task.description}</p>}
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <Badge variant="outline" className="text-[10px]">
                            {task.story_points || 0} SP
                          </Badge>
                          <Badge variant="outline" className="text-[10px]">
                            {task.skill_tag}
                          </Badge>
                          <span className="text-[10px] text-muted-foreground">{task.task_type}</span>
                        </div>

                        <div className="flex items-center justify-between pt-1">
                          <div className="text-[10px] text-muted-foreground">
                            Due in {task.due_in_days || 0}d
                          </div>
                          {task.assignee_hint && (
                            <Avatar className="h-6 w-6">
                              <AvatarFallback className="bg-primary/10 text-[10px] text-primary">
                                {task.assignee_hint.slice(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                          )}
                        </div>

                        <div className="flex gap-1 pt-1 opacity-0 transition-opacity group-hover:opacity-100">
                          {columnIndex > 0 && (
                            <Button variant="outline" size="sm" className="h-6 flex-1 text-[10px]" onClick={() => move(task.task_id, COLUMNS[columnIndex - 1])}>
                              ← {COLUMNS[columnIndex - 1]}
                            </Button>
                          )}
                          {columnIndex < COLUMNS.length - 1 && (
                            <Button variant="outline" size="sm" className="h-6 flex-1 text-[10px]" onClick={() => move(task.task_id, COLUMNS[columnIndex + 1])}>
                              {COLUMNS[columnIndex + 1]} →
                            </Button>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}

                {columnTasks.length === 0 && (
                  <div className="flex items-center justify-center rounded-lg border border-dashed p-8 text-xs text-muted-foreground">
                    No tasks
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Backlog Item' : 'Add Backlog Item'}</DialogTitle>
            <DialogDescription>
              Keep backlog records small and intentional, then pull only the right ones into the planner.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label>Title</Label>
              <Input value={form.title} onChange={(event) => setForm({ ...form, title: event.target.value })} placeholder="Checkout retry hardening" />
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <SelectField label="Priority" value={form.priority} options={priorityOptions} onChange={(value) => setForm({ ...form, priority: value })} />
              <SelectField label="Status" value={form.status} options={COLUMNS} onChange={(value) => setForm({ ...form, status: value })} />
              <SelectField label="Skill" value={form.skill_tag} options={skillOptions} onChange={(value) => setForm({ ...form, skill_tag: value })} />
              <SelectField label="Type" value={form.task_type} options={typeOptions} onChange={(value) => setForm({ ...form, task_type: value })} />
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
              <NumberField label="Story Points" value={form.story_points} onChange={(value) => setForm({ ...form, story_points: value })} />
              <NumberField label="Due In Days" value={form.due_in_days} onChange={(value) => setForm({ ...form, due_in_days: value })} />
              <NumberField label="Confidence %" value={form.confidence} onChange={(value) => setForm({ ...form, confidence: value })} />
              <NumberField label="Sprint ID" value={form.sprint_id} onChange={(value) => setForm({ ...form, sprint_id: value })} />
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="grid gap-2">
                <Label>Assignee Hint</Label>
                <Input value={form.assignee_hint} onChange={(event) => setForm({ ...form, assignee_hint: event.target.value })} placeholder="Ava Patel" />
              </div>
              <div className="grid gap-2">
                <Label>Dependencies</Label>
                <Input value={form.dependencies_text} onChange={(event) => setForm({ ...form, dependencies_text: event.target.value })} placeholder="1, 4, 7" />
              </div>
            </div>

            <div className="grid gap-2">
              <Label>Description</Label>
              <Textarea rows={4} value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} placeholder="Describe the outcome and constraints." />
            </div>

            <label className="flex items-center gap-3 rounded-lg border bg-muted/30 px-4 py-3 text-sm">
              <input
                type="checkbox"
                checked={form.must_do}
                onChange={(event) => setForm({ ...form, must_do: event.target.checked })}
                className="h-4 w-4 rounded border-input text-primary"
              />
              Must ship this sprint
            </label>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={!form.title.trim() || saving}>
              {saving ? 'Saving...' : editing ? 'Save Changes' : 'Add Task'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function parseDependencies(value) {
  return String(value || '')
    .split(',')
    .map((part) => Number(part.trim()))
    .filter((part) => !Number.isNaN(part) && part > 0);
}

function SelectField({ label, value, options, onChange }) {
  return (
    <div className="grid gap-2">
      <Label>{label}</Label>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
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

function NumberField({ label, value, onChange }) {
  return (
    <div className="grid gap-2">
      <Label>{label}</Label>
      <Input type="number" value={value} onChange={(event) => onChange(Number(event.target.value))} />
    </div>
  );
}
