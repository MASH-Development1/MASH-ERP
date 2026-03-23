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
import { MoreVertical, Calendar, User } from 'lucide-react';
import { format } from 'date-fns';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface TaskCardProps {
  task: {
    id: string;
    title: string;
    description: string;
    status: string;
    priority: string;
    project_id: string;
    due_date: string;
    assigned_to?: string;
  };
  onStatusChange: (newStatus: string) => void;
  onClick: (task: any) => void;
  projectName: string;
}

const STATUS_COLORS = {
  todo: 'bg-slate-400',
  in_progress: 'bg-blue-500',
  in_review: 'bg-purple-500',
  done: 'bg-green-500',
};

const PRIORITY_COLORS = {
  low: 'bg-blue-100 text-blue-800',
  medium: 'bg-yellow-100 text-yellow-800',
  high: 'bg-red-100 text-red-800',
};

export function TaskCard({ task, onStatusChange, onClick, projectName }: TaskCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : 1,
  };

  const statusColor = STATUS_COLORS[task.status as keyof typeof STATUS_COLORS] || 'bg-slate-400';
  const priorityColors = PRIORITY_COLORS[task.priority as keyof typeof PRIORITY_COLORS] || PRIORITY_COLORS.medium;

  return (
    <Card 
      ref={setNodeRef}
      style={style}
      className="relative p-4 pl-6 space-y-3 cursor-pointer hover:shadow-lg transition-all bg-card border border-border/50 group"
      onClick={() => onClick(task)}
    >
      {/* Tag Light indicator - Now the Drag Handle */}
      <div 
        {...attributes}
        {...listeners}
        className={`absolute left-0 top-0 bottom-0 w-2 ${statusColor} opacity-70 group-hover:opacity-100 transition-opacity cursor-grab active:cursor-grabbing hover:w-3 z-10`} 
        onClick={(e) => e.stopPropagation()} // Prevent card details open on drag handle click
      />
      
      <div className="flex items-start justify-between gap-2">
        <h4 className="font-semibold text-sm line-clamp-2 leading-tight">{task.title}</h4>
        <div onClick={(e) => e.stopPropagation()}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button 
                variant="ghost" 
                size="sm" 
                className="h-6 w-6 p-0"
              >
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
      </div>

      {task.description && (
        <p className="text-xs text-muted-foreground line-clamp-2">
          {task.description}
        </p>
      )}

      <div className="flex items-center gap-2 text-xs flex-wrap">
        <Badge variant="outline" className="text-xs">
          {projectName}
        </Badge>
        {task.assigned_to && (
          <div className="flex items-center gap-1 text-muted-foreground whitespace-nowrap">
            <User className="w-3 h-3" />
            <span>{task.assigned_to}</span>
          </div>
        )}
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
