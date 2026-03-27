'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { format } from 'date-fns';

interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  status: 'new' | 'contacted' | 'qualified' | 'proposal' | 'won' | 'lost';
  source: string;
  notes: string;
  created_at: string;
}

interface LeadKanbanProps {
  leads: Lead[];
  onLeadClick: (lead: Lead) => void;
}

const STATUS_COLUMNS = [
  { id: 'new', title: 'New' },
  { id: 'contacted', title: 'Contacted' },
  { id: 'qualified', title: 'Qualified' },
  { id: 'proposal', title: 'Proposal' },
  { id: 'won', title: 'Won' },
  { id: 'lost', title: 'Lost' },
];

const STATUS_COLORS: Record<string, string> = {
  new: 'bg-gray-100 text-gray-800',
  contacted: 'bg-blue-100 text-blue-800',
  qualified: 'bg-purple-100 text-purple-800',
  proposal: 'bg-orange-100 text-orange-800',
  won: 'bg-green-100 text-green-800',
  lost: 'bg-red-100 text-red-800',
};

export function LeadKanban({ leads, onLeadClick }: LeadKanbanProps) {
  return (
    <div className="flex gap-4 overflow-x-auto pb-6 w-full">
      {STATUS_COLUMNS.map((column) => {
        const columnLeads = leads.filter((lead) => lead.status === column.id);
        return (
          <div key={column.id} className="flex flex-col gap-4 min-w-[300px] max-w-[300px]">
            <div className="flex items-center justify-between px-2">
              <h3 className="font-semibold text-sm uppercase tracking-wider text-muted-foreground">
                {column.title}
              </h3>
              <Badge variant="secondary" className="text-xs font-semibold bg-primary/10 text-primary border-none">
                {columnLeads.length}
              </Badge>
            </div>
            <div className="flex flex-col gap-3 min-h-[500px] p-2 bg-muted/40 border border-border/50 rounded-lg">
              {columnLeads.map((lead) => (
                <Card
                  key={lead.id}
                  className="cursor-pointer hover:shadow-sm transition-all border-border/50 bg-card"
                  onClick={() => onLeadClick(lead)}
                >
                  <CardContent className="p-4 space-y-3">
                    <div className="font-bold text-sm truncate">{lead.name}</div>
                    <div className="text-xs text-muted-foreground flex items-center gap-2 min-w-0">
                       <span className="w-1 h-1 rounded-full bg-muted-foreground/50 shrink-0" />
                       <span className="truncate">{lead.company || 'No Company'}</span>
                    </div>
                    
                    <div className="flex items-center justify-between pt-2 border-t border-border/50">
                      <Badge variant="outline" className="text-[10px] h-4 font-normal">
                        {lead.source || 'unknown'}
                      </Badge>
                      <span className="text-[10px] text-muted-foreground">
                        {format(new Date(lead.created_at), 'MMM dd')}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))}
              {columnLeads.length === 0 && (
                <div className="flex items-center justify-center h-24 border-2 border-dashed rounded-lg border-muted-foreground/10 text-muted-foreground text-xs italic">
                  No leads
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
