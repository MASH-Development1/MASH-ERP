'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/context/AuthContext';
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
import { Slider } from '@/components/ui/slider';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar as CalendarIcon } from 'lucide-react';
import { format, startOfWeek, endOfWeek } from 'date-fns';
import type { DateRange } from 'react-day-picker';

interface Project {
  id: string;
  name: string;
}

interface TaskCycle {
  id: string;
  name: string;
  start_date: string;
  end_date: string;
  type: 'weekly' | 'custom';
}

interface AddTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projects: Project[];
  cycles: TaskCycle[];
  onTaskAdded: () => void;
  type?: 'task' | 'goal';
}

export function AddTaskDialog({
  open,
  onOpenChange,
  projects,
  cycles,
  onTaskAdded,
  type = 'task',
}: AddTaskDialogProps) {
  const [loading, setLoading] = useState(false);
  const { user } = useAuth();
  const [customRange, setCustomRange] = useState<DateRange | undefined>(undefined);
  const [cycleSelection, setCycleSelection] = useState<string>('none');
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    projectId: projects[0]?.id || 'none',
    assignedTo: '',
    dueDate: '',
    progress: 0,
    recurrence: 'none',
    term: 'short_term',
    quarter: 'q1',
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
        created_by: user?.id ?? null,
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (type === 'task' && cycleSelection === 'custom' && (!customRange?.from || !customRange.to)) {
      alert('Please select both a start date and an end date for the custom cycle.');
      return;
    }

    setLoading(true);

    const tableName = type === 'goal' ? 'goals' : 'tasks';
    try {
      const cycleId = await resolveCycleId();
      const insertData: any = {
        title: formData.title,
        description: formData.description,
        priority: formData.priority,
        project_id: formData.projectId === 'none' ? null : formData.projectId,
        cycle_id: cycleId,
        assigned_to: formData.assignedTo || null,
        assigned_by: user?.id,
        due_date: formData.dueDate || null,
        status: 'todo',
      };

      if (type === 'goal') {
        insertData.created_by = user?.id;
        insertData.progress = formData.progress;
        insertData.recurrence = formData.recurrence;
        insertData.term = formData.term;
        insertData.quarter = formData.term === 'quarterly' ? formData.quarter : null;
      }

      const { error } = await supabase.from(tableName).insert(insertData);

      if (error) throw error;

      onTaskAdded();
      setFormData({
        title: '',
        description: '',
        priority: 'medium',
        projectId: projects[0]?.id || 'none',
        assignedTo: '',
        dueDate: '',
        progress: 0,
        recurrence: 'none',
        term: 'short_term',
        quarter: 'q1',
      });
      setCustomRange(undefined);
      setCycleSelection('none');
    } catch (error: any) {
      console.error(`Detailed error adding ${type}:`, JSON.stringify(error, null, 2));
      console.error(`Error object for ${type}:`, error);
      const errorMessage = error.message || 'Unknown error';
      const errorDetail = error.details || '';
      const errorHint = error.hint || '';
      
      alert(`Failed to add ${type}.\n\nError: ${errorMessage}\n${errorDetail}\n${errorHint}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New {type === 'goal' ? 'Goal' : 'Task'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="title">{type === 'goal' ? 'Goal' : 'Task'} Title</Label>
            <Input
              id="title"
              placeholder={`Enter ${type} title`}
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              placeholder={`Enter ${type} description`}
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
              rows={3}
            />
          </div>

          {type === 'goal' && (
            <div className="space-y-4 pt-2 border-t border-border/50">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Initial Progress ({formData.progress}%)</Label>
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
              <Label htmlFor="project">Project</Label>
              <Select
                value={formData.projectId}
                onValueChange={(value) =>
                  setFormData({ ...formData, projectId: value })
                }
              >
                <SelectTrigger id="project">
                  <SelectValue placeholder="Select project" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No Project</SelectItem>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select
                value={formData.priority}
                onValueChange={(value) =>
                  setFormData({ ...formData, priority: value })
                }
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
              <Label htmlFor="assignee">Assignee Name</Label>
              <Input
                id="assignee"
                placeholder="Enter assignee name"
                value={formData.assignedTo}
                onChange={(e) =>
                  setFormData({ ...formData, assignedTo: e.target.value })
                }
              />
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
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Spinner className="w-4 h-4 mr-2" />}
              {loading ? 'Creating...' : `Create ${type}`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
