'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Spinner } from '@/components/ui/spinner';
import { Trash2, Calendar as CalendarIcon } from 'lucide-react';
import { format, startOfWeek, endOfWeek } from 'date-fns';
import { Slider } from '@/components/ui/slider';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import type { DateRange } from 'react-day-picker';

interface TaskCycle {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  type: 'weekly' | 'custom';
}

interface TaskDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: any;
  projects: any[];
  cycles: TaskCycle[];
  onTaskUpdated: () => void;
  onTaskDeleted: () => void;
  type?: 'task' | 'goal';
}

export function TaskDetailsDialog({
  open,
  onOpenChange,
  task,
  projects,
  cycles,
  onTaskUpdated,
  onTaskDeleted,
  type = 'task',
}: TaskDetailsDialogProps) {
  const [loading, setLoading] = useState(false);
  const [customRange, setCustomRange] = useState<DateRange | undefined>(undefined);
  const [cycleSelection, setCycleSelection] = useState<string>('none');
  const [formData, setFormData] = useState({
    title: task?.title || '',
    description: task?.description || '',
    status: task?.status || 'todo',
    priority: task?.priority || 'medium',
    projectId: task?.project_id || 'none',
    assignedTo: task?.assigned_to || '',
    dueDate: task?.due_date ? format(new Date(task.due_date), 'yyyy-MM-dd') : '',
    progress: task?.progress || 0,
    recurrence: task?.recurrence || 'none',
    term: task?.term || 'short_term',
    quarter: task?.quarter || 'q1',
  });

  const supabase = createClient();

  const weekRange = {
    start: startOfWeek(new Date(), { weekStartsOn: 1 }),
    end: endOfWeek(new Date(), { weekStartsOn: 1 }),
  };

  const cycleOptions = cycles.map((cycle) => ({
    value: cycle.id,
    label: `${cycle.name} (${format(new Date(cycle.start_date), 'MMM d')} – ${format(new Date(cycle.end_date), 'MMM d')})`,
  }));

  const customRangeLabel = customRange?.from && customRange.to
    ? `${format(customRange.from, 'MMM d')} – ${format(customRange.to, 'MMM d')}`
    : 'Custom range';

  const createCycleFromRange = async (range: { start: Date; end: Date }, typeValue: 'weekly' | 'custom') => {
    const startDate = format(range.start, 'yyyy-MM-dd');
    const endDate = format(range.end, 'yyyy-MM-dd');

    const { data: existingCycle } = await supabase
      .from('task_cycles')
      .select('id')
      .eq('start_date', startDate)
      .eq('end_date', endDate)
      .eq('type', typeValue)
      .maybeSingle();

    if (existingCycle?.id) {
      return existingCycle.id as string;
    }

    const name = typeValue === 'weekly'
      ? `Week of ${format(range.start, 'MMM d')}`
      : `Cycle ${format(range.start, 'MMM d')} – ${format(range.end, 'MMM d')}`;

    const { data, error } = await supabase
      .from('task_cycles')
      .insert({
        name,
        start_date: startDate,
        end_date: endDate,
        type: typeValue,
        created_by: null,
      })
      .select('id')
      .single();

    if (error) throw error;
    return data?.id as string;
  };

  const resolveCycleId = async () => {
    if (type === 'goal') return null;

    if (cycleSelection === 'weekly') {
      return await createCycleFromRange(weekRange, 'weekly');
    }

    if (cycleSelection === 'custom' && customRange?.from && customRange.to) {
      return await createCycleFromRange({ start: customRange.from, end: customRange.to }, 'custom');
    }

    if (cycleSelection && cycleSelection !== 'none' && cycleSelection !== 'custom') {
      return cycleSelection;
    }

    return null;
  };

  const handleCycleChange = (value: string) => {
    setCycleSelection(value);
    if (value !== 'custom') {
      setCustomRange(undefined);
    }
  };

  const handleRangeSelect = (range?: DateRange) => {
    setCustomRange(range);
  };

  useEffect(() => {
    if (!open) {
      setCustomRange(undefined);
      setCycleSelection('none');
    }
  }, [open]);

  useEffect(() => {
    if (task?.cycle_id) {
      setCycleSelection(task.cycle_id);
      const match = cycles.find((cycle) => cycle.id === task.cycle_id);
      if (match) {
        setCustomRange({ from: new Date(match.start_date), to: new Date(match.end_date) });
      }
    } else {
      setCycleSelection('none');
      setCustomRange(undefined);
    }
  }, [task, cycles]);

  useEffect(() => {
    if (task) {
      setFormData({
        title: task.title,
        description: task.description || '',
        status: task.status,
        priority: task.priority,
        projectId: task.project_id || 'none',
        assignedTo: task.assigned_to || '',
        dueDate: task.due_date ? format(new Date(task.due_date), 'yyyy-MM-dd') : '',
        progress: task.progress || 0,
        recurrence: task.recurrence || 'none',
        term: task.term || 'short_term',
        quarter: task.quarter || 'q1',
      });
    }
  }, [task]);

  const selectedCycleLabel =
    cycleSelection === 'weekly'
      ? `This week (${format(weekRange.start, 'MMM d')} – ${format(weekRange.end, 'MMM d')})`
      : cycleSelection === 'custom'
        ? customRangeLabel
        : cycleSelection === 'none'
          ? 'No cycle'
          : cycleOptions.find((cycle) => cycle.value === cycleSelection)?.label ?? 'Selected cycle';

  const cycleNote = cycleSelection === 'custom' && customRange?.from && customRange.to
    ? 'Custom cycle dates will be saved with this task.'
    : null;

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (type === 'task' && cycleSelection === 'custom' && (!customRange?.from || !customRange.to)) {
      alert('Please select both a start date and an end date for the custom cycle.');
      return;
    }

    setLoading(true);

    const tableName = type === 'goal' ? 'goals' : 'tasks';
    try {
      const cycleId = await resolveCycleId();
      const updateData: any = {
        title: formData.title,
        description: formData.description,
        status: formData.status,
        priority: formData.priority,
        project_id: formData.projectId === 'none' ? null : formData.projectId,
        cycle_id: cycleId,
        assigned_to: formData.assignedTo || null,
        due_date: formData.dueDate || null,
      };

      if (type === 'goal') {
        updateData.progress = formData.progress;
        updateData.recurrence = formData.recurrence;
        updateData.term = formData.term;
        updateData.quarter = formData.term === 'quarterly' ? formData.quarter : null;
      }

      const { error } = await supabase
        .from(tableName)
        .update(updateData)
        .eq('id', task.id);

      if (error) throw error;
      onTaskUpdated();
      onOpenChange(false);
    } catch (error) {
      console.error(`Error updating ${type}:`, error);
      alert(`Failed to update ${type}.`);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!confirm(`Are you sure you want to delete this ${type}?`)) return;
    setLoading(true);

    const tableName = type === 'goal' ? 'goals' : 'tasks';
    try {
      const { error } = await supabase.from(tableName).delete().eq('id', task.id);
      if (error) throw error;
      onTaskDeleted();
      onOpenChange(false);
    } catch (error) {
      console.error(`Error deleting ${type}:`, error);
      alert(`Failed to delete ${type}.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <div className="flex items-center justify-between mr-8">
            <DialogTitle>{type === 'goal' ? 'Goal' : 'Task'} Details</DialogTitle>
            <Button variant="ghost" size="sm" className="text-destructive h-8 px-2" onClick={handleDelete}>
              <Trash2 className="w-4 h-4 mr-2" />
              Delete
            </Button>
          </div>
        </DialogHeader>
        <form onSubmit={handleUpdate} className="space-y-4 py-2">
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={4}
            />
          </div>

          {type === 'goal' && (
            <div className="space-y-4 pt-2 border-t border-border/50">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Progress ({formData.progress}%)</Label>
                  <Slider 
                      value={[formData.progress]} 
                      onValueChange={(val) => setFormData({ ...formData, progress: val[0] })}
                      max={100}
                      step={5}
                      className="py-4"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Goal Term</Label>
                  <Select
                    value={formData.term}
                    onValueChange={(value) => setFormData({ ...formData, term: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select term" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="short_term">Short Term (Weekly/Monthly)</SelectItem>
                      <SelectItem value="long_term">Long Term (Strategic)</SelectItem>
                      <SelectItem value="quarterly">Quarterly Goal</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {formData.term === 'quarterly' && (
                <div className="space-y-2">
                  <Label>Target Quarter</Label>
                  <Select
                    value={formData.quarter}
                    onValueChange={(value) => setFormData({ ...formData, quarter: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select quarter" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="q1">Quarter 1 (Q1)</SelectItem>
                      <SelectItem value="q2">Quarter 2 (Q2)</SelectItem>
                      <SelectItem value="q3">Quarter 3 (Q3)</SelectItem>
                      <SelectItem value="q4">Quarter 4 (Q4)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div className="space-y-2">
                <Label>Recurrence</Label>
                <Select
                  value={formData.recurrence}
                  onValueChange={(value) => setFormData({ ...formData, recurrence: value })}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="No recurrence" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">None</SelectItem>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <Select
                value={formData.status}
                onValueChange={(value) => setFormData({ ...formData, status: value })}
              >
                <SelectTrigger id="status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todo">To Do</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="in_review">In Review</SelectItem>
                  <SelectItem value="done">Done</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={formData.priority}
                onValueChange={(value) => setFormData({ ...formData, priority: value })}
              >
                <SelectTrigger id="priority">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="project">Project</Label>
              <Select
                value={formData.projectId}
                onValueChange={(value) => setFormData({ ...formData, projectId: value })}
              >
                <SelectTrigger id="project">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Project</SelectItem>
                  {projects.map((p) => (
                    <SelectItem key={p.id} value={p.id}>{p.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="assignee">Assignee Name</Label>
              <Input
                id="assignee"
                placeholder="Enter assignee name"
                value={formData.assignedTo}
                onChange={(e) => setFormData({ ...formData, assignedTo: e.target.value })}
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="dueDate">Due Date</Label>
            <Input
              id="dueDate"
              type="date"
              value={formData.dueDate}
              onChange={(e) => setFormData({ ...formData, dueDate: e.target.value })}
            />
          </div>

          {type === 'task' && (
            <div className="space-y-2">
              <Label>Cycle</Label>
              <Select value={cycleSelection} onValueChange={handleCycleChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select cycle" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No cycle</SelectItem>
                  <SelectItem value="weekly">This week</SelectItem>
                  <SelectItem value="custom">Custom range</SelectItem>
                  {cycleOptions.length > 0 && (
                    <div className="px-2 py-1 text-[11px] uppercase text-muted-foreground">
                      Saved cycles
                    </div>
                  )}
                  {cycleOptions.map((cycle) => (
                    <SelectItem key={cycle.value} value={cycle.value}>
                      {cycle.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {cycleSelection === 'custom' && (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="mt-2 justify-start gap-2">
                      <CalendarIcon className="h-4 w-4" />
                      {customRangeLabel}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-2" align="start">
                    <Calendar
                      mode="range"
                      selected={customRange}
                      onSelect={handleRangeSelect}
                      numberOfMonths={2}
                    />
                  </PopoverContent>
                </Popover>
              )}

              <p className="text-xs text-muted-foreground">{selectedCycleLabel}</p>
              {cycleNote && <p className="text-xs text-muted-foreground">{cycleNote}</p>}
            </div>
          )}

          <DialogFooter className="pt-4">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? <Spinner className="w-4 h-4 mr-2" /> : null}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
