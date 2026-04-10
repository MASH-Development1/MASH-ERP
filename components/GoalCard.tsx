'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { format, differenceInDays } from 'date-fns';
import { Target, Calendar, BarChart3, Repeat } from 'lucide-react';

interface Goal {
  id: string;
  title: string;
  description: string;
  status: 'todo' | 'in_progress' | 'in_review' | 'done';
  priority: string;
  due_date: string;
  progress: number;
  recurrence: 'none' | 'daily' | 'weekly' | 'monthly';
  term: 'short_term' | 'long_term' | 'quarterly';
  created_at: string;
}

const PRIORITY_COLORS: Record<string, string> = {
  low: 'bg-blue-500/10 text-blue-500 border-blue-500/20',
  medium: 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20',
  high: 'bg-red-500/10 text-red-500 border-red-500/20',
};

const STATUS_COLORS: Record<string, string> = {
  todo: 'bg-slate-500/10 text-slate-500',
  in_progress: 'bg-blue-500/10 text-blue-500',
  in_review: 'bg-purple-500/10 text-purple-500',
  done: 'bg-green-500/10 text-green-500',
};

export function GoalCard({ goal, onClick }: { goal: Goal; onClick: (goal: Goal) => void }) {
  const daysRemaining = goal.due_date ? differenceInDays(new Date(goal.due_date), new Date()) : null;
  
  return (
    <Card 
      className="group relative overflow-hidden border-border/50 bg-card/50 backdrop-blur-sm hover:shadow-2xl hover:shadow-primary/5 transition-all duration-300 cursor-pointer border-l-4"
      style={{ borderLeftColor: goal.priority === 'high' ? 'rgb(239, 68, 68)' : goal.priority === 'medium' ? 'rgb(234, 179, 8)' : 'rgb(59, 130, 246)' }}
      onClick={() => onClick(goal)}
    >
      {/* Decorative Shadowed Circles */}
      <div className="absolute -top-6 -right-6 w-24 h-24 bg-primary/5 rounded-full blur-2xl group-hover:bg-primary/10 transition-colors" />
      <div className="absolute -bottom-8 -left-8 w-32 h-32 bg-primary/5 rounded-full blur-3xl group-hover:bg-primary/10 transition-colors" />
      
      <CardHeader className="pb-2 relative z-20">
        <div className="flex justify-between items-start gap-4">
          <CardTitle className="text-lg font-bold leading-tight group-hover:text-primary transition-colors">
            {goal.title}
          </CardTitle>
          <Badge variant="outline" className={`${PRIORITY_COLORS[goal.priority]} uppercase text-[10px] font-bold tracking-wider`}>
            {goal.priority}
          </Badge>
        </div>
        <div className="flex items-center gap-2 mt-1">
           <Badge variant="secondary" className="bg-slate-500/10 text-slate-500 border-none text-[9px] uppercase font-bold">
             {goal.term === 'long_term' || goal.term === 'quarterly' ? 'Long Term' : 'Short Term'}
           </Badge>
           {goal.recurrence !== 'none' && (
             <Badge variant="secondary" className="bg-primary/5 text-primary border-none flex items-center gap-1 text-[10px]">
               <Repeat className="w-3 h-3" />
               {goal.recurrence}
             </Badge>
           )}
           <Badge className={`${STATUS_COLORS[goal.status]} border-none text-[10px] uppercase font-bold`}>
             {goal.status.replace('_', ' ')}
           </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-4 relative z-20">
        <p className="text-sm text-muted-foreground line-clamp-2 min-h-[40px]">
          {goal.description || 'No description provided.'}
        </p>

        <div className="space-y-2">
          <div className="flex justify-between items-center text-xs">
            <span className="flex items-center gap-1 font-medium text-muted-foreground">
              <BarChart3 className="w-3 h-3 text-primary" />
              Progress
            </span>
            <span className="font-bold text-primary">{goal.progress}%</span>
          </div>
          <Progress value={goal.progress} className="h-2 bg-primary/10" />
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-border/50 text-[11px]">
          <div className="flex items-center gap-1 text-muted-foreground group-hover:text-foreground transition-colors overflow-hidden truncate">
            <Calendar className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate">
              {goal.due_date ? format(new Date(goal.due_date), 'MMM dd, yyyy') : 'No deadline'}
            </span>
          </div>
          
          {daysRemaining !== null && (
            <div className={`font-semibold shrink-0 ${daysRemaining < 3 ? 'text-red-500' : 'text-muted-foreground'}`}>
              {daysRemaining < 0 ? 'Overdue' : daysRemaining === 0 ? 'Due today' : `${daysRemaining} days left`}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
