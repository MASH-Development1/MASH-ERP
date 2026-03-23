'use client';

import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { MoreVertical, Calendar } from 'lucide-react';
import { format } from 'date-fns';

interface TaskCardProps {
  task: {
    id: string;
    title: string;
    description: string;
    status: string;
    priority: string;
    project_id: string;
    due_date: string;
  };
  onStatusChange: (newStatus: string) => void;
  projectName: string;
}

const STATUS_COLORS = {
  todo: 'bg-gray-100 text-gray-800',
  in_progress: 'bg-blue-100 text-blue-800',
  in_review: 'bg-purple-100 text-purple-800',
  done: 'bg-green-100 text-green-800',
};

const PRIORITY_COLORS = {
  low: 'bg-blue-100 text-blue-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-red-100 text-red-800',
};

export function TaskCard({ task, onStatusChange, projectName }: TaskCardProps) {
  const statusColors = STATUS_COLORS[task.status as keyof typeof STATUS_COLORS];
  const priorityColors = PRIORITY_COLORS[task.priority as keyof typeof PRIORITY_COLORS];

  return (
    <Card className="p-3 space-y-2 cursor-move hover:shadow-md transition-shadow bg-card">
      <div className="flex items-start justify-between gap-2">
        <h4 className="font-medium text-sm line-clamp-2">{task.title}</h4>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
              <MoreVertical className="w-4 h-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => onStatusChange('todo')}>
              Move to To Do
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onStatusChange('in_progress')}>
              Move to In Progress
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onStatusChange('in_review')}>
              Move to In Review
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => onStatusChange('done')}>
              Move to Done
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {task.description && (
        <p className="text-xs text-muted-foreground line-clamp-2">
          {task.description}
        </p>
      )}

      <div className="flex items-center gap-2 text-xs">
        <Badge variant="outline" className="text-xs">
          {projectName}
        </Badge>
      </div>

      <div className="flex items-center justify-between gap-2">
        <Badge className={`${priorityColors} text-xs`}>
          {task.priority}
        </Badge>
        {task.due_date && (
          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Calendar className="w-3 h-3" />
            {format(new Date(task.due_date), 'MMM d')}
          </div>
        )}
      </div>
    </Card>
  );
}
