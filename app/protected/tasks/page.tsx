'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Target } from 'lucide-react';
import { AddTaskDialog } from '@/components/dialogs/AddTaskDialog';
import { TaskCard } from '@/components/TaskCard';
import { GoalCard } from '@/components/GoalCard';
import { Progress } from '@/components/ui/progress';
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
}

interface Project {
  id: string;
  name: string;
}

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
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedTask, setSelectedTask] = useState<any>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [activeTab, setActiveTab] = useState('tasks');
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
      const [tasksRes, projectsRes, goalsRes] = await Promise.all([
        supabase.from('tasks').select('*').order('created_at', { ascending: false }),
        supabase.from('projects').select('id, name'),
        supabase.from('goals').select('*').order('created_at', { ascending: false }),
      ]);

      if (tasksRes.data) setTasks(tasksRes.data);
      if (projectsRes.data) setProjects(projectsRes.data);
      if (goalsRes.data) setGoals(goalsRes.data);
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
                const columnTasks = tasks.filter((task) => task.status === column.id);
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
          onTaskAdded={() => {
            setShowAddDialog(false);
            fetchData();
          }}
          type={activeTab === 'tasks' ? 'task' : 'goal'}
        />
      )}

      {showDetailsDialog && selectedTask && (
        <TaskDetailsDialog
          open={showDetailsDialog}
          onOpenChange={setShowDetailsDialog}
          task={selectedTask}
          projects={projects}
          onTaskUpdated={fetchData}
          onTaskDeleted={fetchData}
          type={activeTab === 'tasks' ? 'task' : 'goal'}
        />
      )}
    </div>
  );
}
