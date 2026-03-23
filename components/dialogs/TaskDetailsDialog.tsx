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
import { Badge } from '@/components/ui/badge';
import { Calendar, User, Trash2 } from 'lucide-react';
import { format } from 'date-fns';

interface Profile {
  id: string;
  first_name: string;
  last_name: string;
}

interface TaskDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  task: any;
  projects: any[];
  onTaskUpdated: () => void;
  onTaskDeleted: () => void;
  type?: 'task' | 'goal';
}

export function TaskDetailsDialog({
  open,
  onOpenChange,
  task,
  projects,
  onTaskUpdated,
  onTaskDeleted,
  type = 'task',
}: TaskDetailsDialogProps) {
  const [loading, setLoading] = useState(false);
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [formData, setFormData] = useState({
    title: task?.title || '',
    description: task?.description || '',
    status: task?.status || 'todo',
    priority: task?.priority || 'medium',
    projectId: task?.project_id || 'none',
    assignedTo: task?.assigned_to || '',
    dueDate: task?.due_date ? format(new Date(task.due_date), 'yyyy-MM-dd') : '',
  });

  const supabase = createClient();

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
      });
    }
    fetchProfiles();
  }, [task]);

  const fetchProfiles = async () => {
    // No longer needed
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    const tableName = type === 'goal' ? 'goals' : 'tasks';
    try {
      const { error } = await supabase
        .from(tableName)
        .update({
          title: formData.title,
          description: formData.description,
          status: formData.status,
          priority: formData.priority,
          project_id: formData.projectId === 'none' ? null : formData.projectId,
          assigned_to: formData.assignedTo || null,
          due_date: formData.dueDate || null,
        })
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
