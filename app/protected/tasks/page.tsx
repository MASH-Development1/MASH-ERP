'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Target, Filter, Calendar as CalendarIcon } from 'lucide-react';
import { AddTaskDialog } from '@/components/dialogs/AddTaskDialog';
import { TaskCard } from '@/components/TaskCard';
import { GoalCard } from '@/components/GoalCard';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format, startOfWeek, endOfWeek, isWithinInterval, areIntervalsOverlapping } from 'date-fns';
import type { DateRange } from 'react-day-picker';
import {
  DndContext,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';

interface Task {
  id: string;
  title: string;
  description: string;
  status: 'todo' | 'in_progress' | 'in_review' | 'done';
  priority: string;
  project_id: string;
  assigned_to: string;
  due_date: string;
  created_at: string;
  cycle_id?: string | null;
}

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

type CycleSelection =
  | { mode: 'all' }
  | { mode: 'weekly' }
  | { mode: 'custom'; range?: DateRange }
  | { mode: 'cycle'; id: string };

interface FiltersState {
  projectId: string;
  status: string;
  assignee: string;
  includeClosed: boolean;
}

const STATUS_OPTIONS = [
  { value: 'all', label: 'All statuses' },
  { value: 'todo', label: 'To Do' },
  { value: 'in_progress', label: 'In Progress' },
  { value: 'in_review', label: 'In Review' },
  { value: 'done', label: 'Done' },
];

const CYCLE_OPTIONS = [
  { value: 'all', label: 'All cycles' },
  { value: 'weekly', label: 'This week' },
  { value: 'custom', label: 'Custom range' },
];

const ASSIGNEE_ALL = 'all';
const PROJECT_ALL = 'all';

const getWeekRange = () => {
  const start = startOfWeek(new Date(), { weekStartsOn: 1 });
  const end = endOfWeek(new Date(), { weekStartsOn: 1 });
  return { start, end };
};

const isDateInRange = (dateValue?: string | null, range?: { start: Date; end: Date }) => {
  if (!dateValue || !range) return false;
  const date = new Date(dateValue);
  return isWithinInterval(date, { start: range.start, end: range.end });
};

const formatRangeLabel = (range?: DateRange) => {
  if (!range?.from || !range.to) return 'Custom range';
  return `${format(range.from, 'MMM d')} – ${format(range.to, 'MMM d')}`;
};

const STATUS_COLUMNS = [
  { id: 'todo', title: 'To Do' },
  { id: 'in_progress', title: 'In Progress' },
  { id: 'in_review', title: 'In Review' },
  { id: 'done', title: 'Done' },
];

const PRIORITY_COLORS = {
  low: 'bg-blue-100 text-blue-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-red-100 text-red-800',
};

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TaskDetailsDialog } from '@/components/dialogs/TaskDetailsDialog';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [goals, setGoals] = useState<any[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [cycles, setCycles] = useState<TaskCycle[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [activeTab, setActiveTab] = useState('tasks');
  const [cycleSelection, setCycleSelection] = useState<CycleSelection>({ mode: 'all' });
  const [customRange, setCustomRange] = useState<DateRange | undefined>(undefined);
  const [filters, setFilters] = useState<FiltersState>({
    projectId: PROJECT_ALL,
    status: 'all',
    assignee: ASSIGNEE_ALL,
    includeClosed: true,
  });
  const supabase = createClient();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [tasksRes, projectsRes, goalsRes, cyclesRes] = await Promise.all([
        supabase.from('tasks').select('*').order('created_at', { ascending: false }),
        supabase.from('projects').select('id, name'),
        supabase.from('goals').select('*').order('created_at', { ascending: false }),
        supabase.from('task_cycles').select('*').order('start_date', { ascending: false }),
      ]);

      if (tasksRes.data) setTasks(tasksRes.data);
      if (projectsRes.data) setProjects(projectsRes.data);
      if (goalsRes.data) setGoals(goalsRes.data);
      if (cyclesRes.data) setCycles(cyclesRes.data);
    } catch (error: any) {
      console.error('Error fetching data details:', JSON.stringify(error, null, 2));
      console.error('Raw fetch error:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateTaskStatus = async (taskId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('tasks')
        .update({ status: newStatus })
        .eq('id', taskId);

      if (error) throw error;
      setTasks(tasks.map((t) => (t.id === taskId ? { ...t, status: newStatus as any } : t)));
    } catch (error) {
      console.error('Error updating task:', error);
    }
  };

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event;

    if (!over) return;

    const activeId = active.id as string;
    const overId = over.id as string;

    // Check if dragged over a column or another card
    const overColumn = STATUS_COLUMNS.find(col => col.id === overId);
    let newStatus = overColumn?.id;

    if (!newStatus) {
      // If over a card, get its status
      const overItem = [...tasks, ...goals].find(item => item.id === overId);
      newStatus = overItem?.status;
    }

    if (newStatus) {
      const tableName = activeTab === 'tasks' ? 'tasks' : 'goals';
      const item = (activeTab === 'tasks' ? tasks : goals).find(i => i.id === activeId);
      
      if (item && item.status !== newStatus) {
        try {
          const { error } = await supabase
            .from(tableName)
            .update({ status: newStatus })
            .eq('id', activeId);

          if (error) throw error;
          
          if (activeTab === 'tasks') {
            setTasks(tasks.map(t => t.id === activeId ? { ...t, status: newStatus as any } : t));
          } else {
            setGoals(goals.map(g => g.id === activeId ? { ...g, status: newStatus as any } : g));
          }
        } catch (error) {
          console.error(`Error moving ${activeTab}:`, error);
        }
      }
    }
  };

  const handleTaskClick = (task: any) => {
    setSelectedTask(task);
    setShowDetailsDialog(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const getProjectName = (projectId: string) => {
    return projects.find((p) => p.id === projectId)?.name || 'No Project';
  };

  const cycleMap = new Map(cycles.map((cycle) => [cycle.id, cycle]));
  const weekRange = getWeekRange();

  const effectiveRange =
    cycleSelection.mode === 'weekly'
      ? weekRange
      : cycleSelection.mode === 'custom' && customRange?.from && customRange?.to
        ? { start: customRange.from, end: customRange.to }
        : undefined;

  const filteredTasks = tasks.filter((task) => {
    if (filters.projectId !== PROJECT_ALL && task.project_id !== filters.projectId) {
      return false;
    }

    if (filters.status !== 'all' && task.status !== filters.status) {
      return false;
    }

    if (filters.assignee !== ASSIGNEE_ALL && task.assigned_to !== filters.assignee) {
      return false;
    }

    if (!filters.includeClosed && task.status === 'done') {
      return false;
    }

    if (cycleSelection.mode === 'cycle') {
      return task.cycle_id === cycleSelection.id;
    }

    if (effectiveRange) {
      const cycle = task.cycle_id ? cycleMap.get(task.cycle_id) : undefined;
      const taskCycleRange = cycle
        ? { start: new Date(cycle.start_date), end: new Date(cycle.end_date) }
        : undefined;
      const taskDueDateInRange = isDateInRange(task.due_date, effectiveRange);
      const taskCycleOverlapsRange = taskCycleRange
        ? areIntervalsOverlapping(taskCycleRange, effectiveRange, { inclusive: true })
        : false;
      return taskDueDateInRange || taskCycleOverlapsRange;
    }

    return true;
  });

  const assigneeOptions = Array.from(
    new Set(tasks.map((task) => task.assigned_to).filter(Boolean))
  ) as string[];

  const handleCycleModeChange = (value: string) => {
    if (value === 'all') {
      setCycleSelection({ mode: 'all' });
      return;
    }

    if (value === 'weekly') {
      setCycleSelection({ mode: 'weekly' });
      return;
    }

    if (value === 'custom') {
      setCycleSelection({ mode: 'custom', range: customRange });
      return;
    }

    setCycleSelection({ mode: 'cycle', id: value });
  };

  const handleCustomRangeChange = (range?: DateRange) => {
    setCustomRange(range);
    if (range?.from && range.to) {
      setCycleSelection({ mode: 'custom', range });
    }
  };

  const cycleOptions = cycles.map((cycle) => ({
    value: cycle.id,
    label: `${cycle.name} (${format(new Date(cycle.start_date), 'MMM d')} – ${format(new Date(cycle.end_date), 'MMM d')})`,
  }));

  const customHint =
    cycleSelection.mode === 'custom'
      ? customRange?.from && customRange.to
        ? `Showing tasks from ${format(customRange.from, 'MMM d, yyyy')} to ${format(customRange.to, 'MMM d, yyyy')}`
        : customRange?.from
          ? 'Select an end date to complete the custom range.'
          : 'Select a custom date range to filter tasks.'
      : null;

  const cycleHint =
    cycleSelection.mode === 'weekly'
      ? `Showing tasks for this week (${format(weekRange.start, 'MMM d, yyyy')} – ${format(weekRange.end, 'MMM d, yyyy')})`
      : cycleSelection.mode === 'cycle'
        ? cycleMap.get(cycleSelection.id)?.name ?? 'Selected cycle'
        : cycleSelection.mode === 'all'
          ? 'Showing tasks across all cycles.'
          : customHint;

  const hintText = cycleSelection.mode === 'custom' ? customHint : cycleHint;

  const filteredCycleNotes =
    cycleSelection.mode === 'custom' && customRange?.from && customRange.to
      ? 'Tasks without a cycle use due date. Tasks with saved cycles are included when their cycle dates overlap the selected range.'
      : null;

  const selectedCycleValue =
    cycleSelection.mode === 'cycle'
      ? cycleSelection.id
      : cycleSelection.mode === 'weekly'
        ? 'weekly'
        : cycleSelection.mode === 'custom'
          ? 'custom'
          : 'all';

  const customRangeLabel =
    cycleSelection.mode === 'custom'
      ? formatRangeLabel(customRange)
      : 'Custom range';

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Work Management</h1>
          <p className="text-muted-foreground">Manage your tasks and goals</p>
        </div>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          New {activeTab === 'tasks' ? 'Task' : 'Goal'}
        </Button>
      </div>

      {activeTab === 'tasks' && (
        <div className="flex flex-col gap-4 rounded-lg border border-border/50 bg-card/60 p-4">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground/80">
              <CalendarIcon className="h-4 w-4" />
              Cycle
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Select value={selectedCycleValue} onValueChange={handleCycleModeChange}>
                <SelectTrigger className="w-[220px]">
                  <SelectValue placeholder="Select cycle" />
                </SelectTrigger>
                <SelectContent>
                  {CYCLE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                  {cycleOptions.length > 0 && (
                    <div className="px-2 py-1 text-[11px] uppercase text-muted-foreground">
                      Saved cycles
                    </div>
                  )}
                  {cycleOptions.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {cycleSelection.mode === 'custom' && (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="justify-start gap-2 text-sm">
                      <CalendarIcon className="h-4 w-4" />
                      {customRangeLabel}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-2" align="start">
                    <Calendar
                      mode="range"
                      selected={customRange}
                      onSelect={handleCustomRangeChange}
                      numberOfMonths={2}
                    />
                  </PopoverContent>
                </Popover>
              )}
              {cycleSelection.mode === 'weekly' && (
                <Badge variant="secondary">
                  {format(weekRange.start, 'MMM d')} – {format(weekRange.end, 'MMM d')}
                </Badge>
              )}
            </div>
          </div>
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-2 text-sm font-semibold text-foreground/80">
              <Filter className="h-4 w-4" />
              Filters
            </div>
            <div className="flex flex-wrap items-center gap-3">
              <Select
                value={filters.projectId}
                onValueChange={(value) => setFilters((prev) => ({ ...prev, projectId: value }))}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Project" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={PROJECT_ALL}>All projects</SelectItem>
                  {projects.map((project) => (
                    <SelectItem key={project.id} value={project.id}>
                      {project.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={filters.status}
                onValueChange={(value) => setFilters((prev) => ({ ...prev, status: value }))}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  {STATUS_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={filters.assignee}
                onValueChange={(value) => setFilters((prev) => ({ ...prev, assignee: value }))}
              >
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Assignee" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ASSIGNEE_ALL}>All assignees</SelectItem>
                  {assigneeOptions.map((assignee) => (
                    <SelectItem key={assignee} value={assignee}>
                      {assignee}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <div className="flex items-center gap-2 rounded-md border border-border px-3 py-2 text-sm">
                <Checkbox
                  checked={filters.includeClosed}
                  onCheckedChange={(value) =>
                    setFilters((prev) => ({ ...prev, includeClosed: value === true }))
                  }
                />
                <span className="text-muted-foreground">Include closed</span>
              </div>
            </div>
          </div>
        </div>
      )}

      <Tabs defaultValue="tasks" onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="tasks">Tasks</TabsTrigger>
          <TabsTrigger value="goals">Goals</TabsTrigger>
        </TabsList>

        <TabsContent value="tasks">
          <DndContext 
            sensors={sensors}
            collisionDetection={closestCorners}
            onDragEnd={handleDragEnd}
          >
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {STATUS_COLUMNS.map((column) => {
                const columnTasks = filteredTasks.filter((task) => task.status === column.id);
                return (
                  <Card key={column.id} className="bg-muted/40 border border-border/50 shadow-sm">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <CardTitle className="text-sm font-bold uppercase tracking-wider text-foreground/80">
                          {column.title}
                        </CardTitle>
                        <Badge variant="secondary" className="text-xs font-semibold bg-primary/10 text-primary border-none">
                          {columnTasks.length}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <SortableContext 
                        id={column.id}
                        items={columnTasks.map(t => t.id)}
                        strategy={verticalListSortingStrategy}
                      >
                        <div className="space-y-3 min-h-[500px]">
                          {columnTasks.map((task) => (
                            <TaskCard
                              key={task.id}
                              task={task}
                              onStatusChange={(newStatus) =>
                                updateTaskStatus(task.id, newStatus)
                              }
                              onClick={handleTaskClick}
                              projectName={getProjectName(task.project_id)}
                            />
                          ))}
                          {columnTasks.length === 0 && (
                            <div className="flex items-center justify-center h-24 border-2 border-dashed rounded-lg text-muted-foreground text-xs italic">
                              No tasks
                            </div>
                          )}
                        </div>
                      </SortableContext>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </DndContext>
        </TabsContent>

        <TabsContent value="goals" className="space-y-16">
          {goals.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 bg-muted/20 border-2 border-dashed rounded-xl">
              <Target className="w-12 h-12 text-muted-foreground mb-4 opacity-20" />
              <h3 className="text-lg font-medium text-muted-foreground">No goals defined</h3>
              <p className="text-sm text-muted-foreground">Goals help you track long-term outcomes and recurring objectives.</p>
              <Button variant="outline" className="mt-4" onClick={() => setShowAddDialog(true)}>
                Create First Goal
              </Button>
            </div>
          ) : (
            <>
              {/* Strategic Long-Term Goals */}
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-border/70 pb-5">
                  <div>
                    <h2 className="text-2xl font-extrabold tracking-tight text-foreground">Strategic Long-Term Goals</h2>
                    <p className="text-sm text-muted-foreground mt-1 font-medium">Core organizational pillars and multi-year trajectory objectives.</p>
                  </div>
                  <Badge variant="outline" className="px-4 py-1 text-sm font-black border-2">
                    {goals.filter(g => g.term === 'long_term').length}
                  </Badge>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {goals.filter(g => g.term === 'long_term').map((goal) => (
                    <GoalCard
                      key={goal.id}
                      goal={goal}
                      onClick={handleTaskClick}
                    />
                  ))}
                  {goals.filter(g => g.term === 'long_term').length === 0 && (
                    <div className="col-span-full py-12 text-center border-2 border-dashed rounded-2xl text-muted-foreground/60 text-sm font-medium">
                      No strategic goals defined.
                    </div>
                  )}
                </div>
              </div>

              {/* Quarterly Objectives */}
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-border/70 pb-5">
                  <div>
                    <h2 className="text-2xl font-extrabold tracking-tight text-foreground">Quarterly Objectives</h2>
                    <p className="text-sm text-muted-foreground mt-1 font-medium">Targeted goals for each fiscal quarter.</p>
                  </div>
                  <Badge variant="outline" className="px-4 py-1 text-sm font-black border-2">
                    {goals.filter(g => g.term === 'quarterly').length}
                  </Badge>
                </div>
                
                <Accordion type="single" collapsible className="w-full space-y-4">
                  {['q1', 'q2', 'q3', 'q4'].map((q) => {
                    const quarterGoals = goals.filter(g => g.term === 'quarterly' && g.quarter === q);
                    
                    // Calculate time progress for the quarter
                    const now = new Date();
                    const year = now.getFullYear();
                    const quartersDict: Record<string, { start: Date; end: Date }> = {
                      q1: { start: new Date(year, 0, 1), end: new Date(year, 2, 31, 23, 59, 59) },
                      q2: { start: new Date(year, 3, 1), end: new Date(year, 5, 30, 23, 59, 59) },
                      q3: { start: new Date(year, 6, 1), end: new Date(year, 8, 30, 23, 59, 59) },
                      q4: { start: new Date(year, 9, 1), end: new Date(year, 11, 31, 23, 59, 59) },
                    };
                    
                    const p = quartersDict[q];
                    let timeProgress = 0;
                    if (now > p.end) timeProgress = 100;
                    else if (now >= p.start && now <= p.end) {
                      const total = p.end.getTime() - p.start.getTime();
                      const elapsed = now.getTime() - p.start.getTime();
                      timeProgress = Math.round((elapsed / total) * 100);
                    }

                    return (
                      <AccordionItem key={q} value={q} className="border border-border/50 rounded-xl px-6 bg-card/30 overflow-hidden">
                        <AccordionTrigger className="hover:no-underline py-6">
                          <div className="flex flex-col sm:flex-row sm:items-center justify-between w-full gap-4 pr-4">
                            <div className="flex items-center gap-4">
                              <span className="text-lg font-bold uppercase">{q}</span>
                              <Badge variant="secondary" className="bg-primary/5 text-primary border-none font-bold">
                                {quarterGoals.length} Goals
                              </Badge>
                            </div>
                            <div className="flex items-center gap-3 w-full sm:w-64">
                              <div className="flex-1 space-y-1">
                                <div className="flex justify-between text-[10px] font-bold uppercase tracking-wider text-muted-foreground/70">
                                  <span>Time Elapsed</span>
                                  <span>{timeProgress}%</span>
                                </div>
                                <Progress value={timeProgress} className="h-1.5 bg-primary/10" />
                              </div>
                            </div>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent className="pb-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-4">
                            {quarterGoals.map((goal) => (
                              <GoalCard
                                key={goal.id}
                                goal={goal}
                                onClick={handleTaskClick}
                              />
                            ))}
                            {quarterGoals.length === 0 && (
                              <div className="col-span-full py-8 text-center border-2 border-dashed rounded-xl text-muted-foreground/50 text-xs font-medium italic">
                                No goals assigned to {q.toUpperCase()}
                              </div>
                            )}
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    );
                  })}
                </Accordion>
              </div>

              {/* Tactical Short-Term Goals */}
              <div className="space-y-6">
                <div className="flex items-center justify-between border-b border-border/70 pb-5">
                  <div>
                    <h2 className="text-2xl font-extrabold tracking-tight text-foreground">Tactical Short-Term Goals</h2>
                    <p className="text-sm text-muted-foreground mt-1 font-medium">Immediate weekly and monthly goals driving tactical success.</p>
                  </div>
                  <Badge variant="outline" className="px-4 py-1 text-sm font-black border-2">
                    {goals.filter(g => g.term === 'short_term' || !g.term).length}
                  </Badge>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {goals.filter(g => g.term === 'short_term' || !g.term).map((goal) => (
                    <GoalCard
                      key={goal.id}
                      goal={goal}
                      onClick={handleTaskClick}
                    />
                  ))}
                  {goals.filter(g => g.term === 'short_term' || !g.term).length === 0 && (
                    <div className="col-span-full py-12 text-center border-2 border-dashed rounded-2xl text-muted-foreground/60 text-sm font-medium">
                      No tactical goals defined.
                    </div>
                  )}
                </div>
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>

      {showAddDialog && (
        <AddTaskDialog
          open={showAddDialog}
          onOpenChange={setShowAddDialog}
          projects={projects}
          cycles={cycles}
          onTaskAdded={() => {
            setShowAddDialog(false);
            fetchData();
          }}
          type={activeTab === 'tasks' ? 'task' : 'goal'}
        />
      )}

      {hintText && (
        <div className="text-xs text-muted-foreground">{hintText}</div>
      )}

      {filteredCycleNotes && (
        <div className="text-xs text-muted-foreground">{filteredCycleNotes}</div>
      )}

      {showDetailsDialog && selectedTask && (
        <TaskDetailsDialog
          open={showDetailsDialog}
          onOpenChange={setShowDetailsDialog}
          task={selectedTask}
          projects={projects}
          cycles={cycles}
          onTaskUpdated={fetchData}
          onTaskDeleted={fetchData}
          type={activeTab === 'tasks' ? 'task' : 'goal'}
        />
      )}
    </div>
  );
}
