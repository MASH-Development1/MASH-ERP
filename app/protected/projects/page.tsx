'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Edit2, Trash2, FolderOpen } from 'lucide-react';
import { AddProjectDialog } from '@/components/dialogs/AddProjectDialog';

import { format } from 'date-fns';

interface Project {
  id: string;
  name: string;
  description: string;
  status: 'planning' | 'active' | 'on_hold' | 'completed' | 'cancelled';
  start_date: string;
  end_date: string;
  budget: number;
  manager_id: string;
  created_at: string;
}

const STATUS_COLORS = {
  planning: 'bg-blue-100 text-blue-800',
  active: 'bg-green-100 text-green-800',
  on_hold: 'bg-yellow-100 text-yellow-800',
  completed: 'bg-purple-100 text-purple-800',
  cancelled: 'bg-red-100 text-red-800',
};

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [payments, setPayments] = useState<{ project_id: string; amount: number; status: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const [projectsRes, paymentsRes] = await Promise.all([
        supabase.from('projects').select('*').order('created_at', { ascending: false }),
        supabase.from('payments').select('project_id, amount, status').eq('status', 'paid')
      ]);

      if (projectsRes.error) throw projectsRes.error;
      if (paymentsRes.error) throw paymentsRes.error;
      
      setProjects(projectsRes.data || []);
      setPayments(paymentsRes.data || []);
    } catch (error) {
      console.error('Error fetching projects data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (projectId: string) => {
    if (!confirm('Are you sure you want to delete this project?')) return;

    try {
      const { error } = await supabase.from('projects').delete().eq('id', projectId);

      if (error) throw error;
      setProjects(projects.filter((p) => p.id !== projectId));
    } catch (error) {
      console.error('Error deleting project:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Projects</h1>
          <p className="text-muted-foreground">Manage your projects and timelines</p>
        </div>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          New Project
        </Button>
      </div>

      {projects.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <FolderOpen className="w-12 h-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No projects yet</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {projects.map((project) => (
            <Card key={project.id} className="hover:shadow-lg transition-shadow">
              <CardHeader>
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <CardTitle className="line-clamp-2">{project.name}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {project.description && project.description.substring(0, 100)}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="ghost" size="sm">
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(project.id)}
                    >
                      <Trash2 className="w-4 h-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-2">
                  <Badge className={STATUS_COLORS[project.status]}>
                    {project.status}
                  </Badge>
                </div>

                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Start Date</p>
                    <p className="font-medium">
                      {format(new Date(project.start_date), 'MMM dd, yyyy')}
                    </p>
                  </div>
                  {project.end_date && (
                    <div>
                      <p className="text-muted-foreground">End Date</p>
                      <p className="font-medium">
                        {format(new Date(project.end_date), 'MMM dd, yyyy')}
                      </p>
                    </div>
                  )}
                </div>

                {project.budget && (
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Total Budget</p>
                      <p className="text-lg font-semibold">
                        ${project.budget.toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-muted-foreground">Remaining Budget</p>
                      <p className={`text-lg font-semibold ${
                        (project.budget - payments.filter(p => p.project_id === project.id).reduce((sum, p) => sum + parseFloat(p.amount as any), 0)) < 0 
                          ? 'text-red-600' 
                          : 'text-green-600'
                      }`}>
                        ${(project.budget - payments.filter(p => p.project_id === project.id).reduce((sum, p) => sum + parseFloat(p.amount as any), 0)).toLocaleString()}
                      </p>
                    </div>
                  </div>
                )}

                <Button variant="outline" className="w-full">
                  View Details
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {showAddDialog && (
        <AddProjectDialog
          open={showAddDialog}
          onOpenChange={setShowAddDialog}
          onProjectAdded={() => {
            setShowAddDialog(false);
            fetchProjects();
          }}
        />
      )}
    </div>
  );
}
