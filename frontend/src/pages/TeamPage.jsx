import React, { useEffect, useState } from 'react';
import {
  Plus,
  Search,
  Trash2,
  Edit3,
  Users,
  Briefcase,
  TrendingUp,
  Star,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { fetchTeamMembers, createTeamMember, updateTeamMember, deleteTeamMember } from '@/lib/api';

const skillOptions = ['Backend', 'Frontend', 'API', 'DevOps', 'UI/UX', 'Database', 'Security', 'Mobile'];
const experienceOptions = ['Junior', 'Mid', 'Senior'];
const avatarColors = [
  'bg-blue-500/15 text-blue-600 dark:text-blue-400',
  'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400',
  'bg-violet-500/15 text-violet-600 dark:text-violet-400',
  'bg-amber-500/15 text-amber-600 dark:text-amber-400',
  'bg-rose-500/15 text-rose-600 dark:text-rose-400',
  'bg-cyan-500/15 text-cyan-600 dark:text-cyan-400',
];

const emptyMember = {
  name: '',
  experience_level: 'Mid',
  primary_skill: 'Backend',
  secondary_skill: '',
  current_load: 0,
  max_capacity: 40,
  availability_pct: 100,
  focus_factor: 1.0,
};

export default function TeamPage() {
  const [team, setTeam] = useState([]);
  const [search, setSearch] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState(null); // null = create, obj = edit
  const [form, setForm] = useState({ ...emptyMember });
  const [loading, setLoading] = useState(true);

  const loadTeam = async () => {
    try {
      const res = await fetchTeamMembers();
      setTeam(res.team_members || []);
    } catch {
      // fallback will be handled by backend
      setTeam([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadTeam(); }, []);

  const openCreate = () => {
    setEditing(null);
    setForm({ ...emptyMember });
    setDialogOpen(true);
  };

  const openEdit = (member) => {
    setEditing(member);
    setForm({ ...member });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      if (editing) {
        await updateTeamMember(editing.dev_id, form);
      } else {
        await createTeamMember(form);
      }
      setDialogOpen(false);
      loadTeam();
    } catch (err) {
      console.error('Save failed', err);
    }
  };

  const handleDelete = async (devId) => {
    try {
      await deleteTeamMember(devId);
      loadTeam();
    } catch (err) {
      console.error('Delete failed', err);
    }
  };

  const filtered = team.filter(m =>
    m.name.toLowerCase().includes(search.toLowerCase()) ||
    m.primary_skill.toLowerCase().includes(search.toLowerCase())
  );

  const levelBadge = (level) => {
    const map = {
      Senior: 'default',
      Mid: 'secondary',
      Junior: 'outline',
    };
    return map[level] || 'secondary';
  };

  const seniorCount = team.filter(m => m.experience_level === 'Senior').length;
  const midCount = team.filter(m => m.experience_level === 'Mid').length;
  const juniorCount = team.filter(m => m.experience_level === 'Junior').length;
  const avgCapacity = team.length > 0
    ? Math.round(team.reduce((sum, m) => sum + (m.availability_pct || 100), 0) / team.length)
    : 0;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Team Management</h1>
          <p className="mt-1 text-muted-foreground">Manage your team members, skills, and capacity.</p>
        </div>
        <Button onClick={openCreate} size="lg" className="gap-2">
          <Plus size={18} />
          Add Member
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatsCard icon={<Users size={18} />} label="Total Members" value={team.length} />
        <StatsCard icon={<Star size={18} />} label="Senior" value={seniorCount} sub={`${midCount} Mid · ${juniorCount} Junior`} />
        <StatsCard icon={<TrendingUp size={18} />} label="Avg Availability" value={`${avgCapacity}%`} />
        <StatsCard icon={<Briefcase size={18} />} label="Skills Covered" value={new Set(team.map(m => m.primary_skill)).size} />
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search by name or skill..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Team Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {filtered.map((member, idx) => (
            <Card key={member.dev_id} className="group hover:shadow-md hover:border-primary/30 transition-all duration-200">
              <CardContent className="p-5">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <Avatar className={cn("h-12 w-12", avatarColors[idx % avatarColors.length])}>
                      <AvatarFallback className={avatarColors[idx % avatarColors.length]}>
                        {member.name.slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-semibold">{member.name}</p>
                      <Badge variant={levelBadge(member.experience_level)} className="mt-1">
                        {member.experience_level}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => openEdit(member)}>
                      <Edit3 size={14} />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => handleDelete(member.dev_id)}>
                      <Trash2 size={14} />
                    </Button>
                  </div>
                </div>

                <Separator className="my-4" />

                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Primary</span>
                    <Badge variant="outline">{member.primary_skill}</Badge>
                  </div>
                  {member.secondary_skill && (
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Secondary</span>
                      <Badge variant="outline">{member.secondary_skill}</Badge>
                    </div>
                  )}
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Capacity</span>
                      <span className="font-medium">{member.current_load || 0}h / {member.max_capacity || 40}h</span>
                    </div>
                    <Progress
                      value={Math.min(((member.current_load || 0) / (member.max_capacity || 40)) * 100, 100)}
                      indicatorClassName={
                        ((member.current_load || 0) / (member.max_capacity || 40)) > 0.85
                          ? 'bg-destructive'
                          : ((member.current_load || 0) / (member.max_capacity || 40)) > 0.6
                            ? 'bg-amber-500'
                            : 'bg-primary'
                      }
                    />
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Availability</span>
                    <span className="font-medium">{member.availability_pct || 100}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Add/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editing ? 'Edit Team Member' : 'Add Team Member'}</DialogTitle>
            <DialogDescription>
              {editing ? 'Update member details and capacity.' : 'Add a new member to your team.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-2">
            <div className="grid gap-2">
              <Label>Name</Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Enter name" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Experience</Label>
                <select
                  value={form.experience_level}
                  onChange={(e) => setForm({ ...form, experience_level: e.target.value })}
                  className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                >
                  {experienceOptions.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
              <div className="grid gap-2">
                <Label>Primary Skill</Label>
                <select
                  value={form.primary_skill}
                  onChange={(e) => setForm({ ...form, primary_skill: e.target.value })}
                  className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                >
                  {skillOptions.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Secondary Skill</Label>
                <select
                  value={form.secondary_skill || ''}
                  onChange={(e) => setForm({ ...form, secondary_skill: e.target.value })}
                  className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm"
                >
                  <option value="">None</option>
                  {skillOptions.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
              </div>
              <div className="grid gap-2">
                <Label>Max Capacity (h)</Label>
                <Input type="number" value={form.max_capacity} onChange={(e) => setForm({ ...form, max_capacity: Number(e.target.value) })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label>Current Load (h)</Label>
                <Input type="number" value={form.current_load} onChange={(e) => setForm({ ...form, current_load: Number(e.target.value) })} />
              </div>
              <div className="grid gap-2">
                <Label>Availability %</Label>
                <Input type="number" value={form.availability_pct} onChange={(e) => setForm({ ...form, availability_pct: Number(e.target.value) })} />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={!form.name.trim()}>
              {editing ? 'Save Changes' : 'Add Member'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function StatsCard({ icon, label, value, sub }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-4 p-5">
        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
          {icon}
        </div>
        <div>
          <p className="text-2xl font-bold">{value}</p>
          <p className="text-xs text-muted-foreground">{label}</p>
          {sub && <p className="text-xs text-muted-foreground mt-0.5">{sub}</p>}
        </div>
      </CardContent>
    </Card>
  );
}
