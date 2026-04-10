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

interface Project {
  id: string;
  name: string;
}

interface AddTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projects: Project[];
  onTaskAdded: () => void;
  type?: 'task' | 'goal';
}

interface Profile {
  id: string;
  first_name: string;
  last_name: string;
}

export function AddTaskDialog({
  open,
  onOpenChange,
  projects,
  onTaskAdded,
  type = 'task',
}: AddTaskDialogProps) {
  const [loading, setLoading] = useState(false);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    priority: 'medium',
    projectId: projects[0]?.id || 'none',
    assignedTo: '',
    dueDate: '',
    progress: 0,
    recurrence: 'none',
  });
  const supabase = createClient();

  useEffect(() => {
    fetchProfiles();
  }, []);

  const fetchProfiles = async () => {
    // No longer needed as we use free-text names
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const tableName = type === 'goal' ? 'goals' : 'tasks';
    try {
      const insertData: any = {
        title: formData.title,
        description: formData.description,
        priority: formData.priority,
        project_id: formData.projectId === 'none' ? null : formData.projectId,
        assigned_to: formData.assignedTo || null,
        assigned_by: user?.id,
        due_date: formData.dueDate || null,
        status: 'todo',
      };

      if (type === 'goal') {
        insertData.created_by = user?.id;
        insertData.progress = formData.progress;
        insertData.recurrence = formData.recurrence;
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
      });
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
