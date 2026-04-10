'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Plus, Megaphone, Trash2, Calendar, Clock, Send, LayoutGrid } from 'lucide-react';
import { format } from 'date-fns';
import { AddCampaignDialog } from '@/components/dialogs/AddCampaignDialog';
import { CampaignDetailsDialog } from '@/components/dialogs/CampaignDetailsDialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface Campaign {
  id: string;
  name: string;
  description: string;
  status: 'draft' | 'active' | 'paused' | 'completed';
  start_date: string;
  end_date: string;
  budget: number;
  created_at: string;
  posts_count?: number;
  scheduled_posts_count?: number;
}

interface ScheduledPost {
  id: string;
  title: string;
  campaign_name: string;
  scheduled_at: string;
  status: string;
}

const STATUS_COLORS = {
  draft: 'bg-gray-100 text-gray-800',
  active: 'bg-green-100 text-green-800',
  paused: 'bg-yellow-100 text-yellow-800',
  completed: 'bg-blue-100 text-blue-800',
};

export default function CampaignsPage() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [scheduledPosts, setScheduledPosts] = useState<ScheduledPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [showDetailsDialog, setShowDetailsDialog] = useState(false);
  const [activeTab, setActiveTab] = useState('campaigns');
  const supabase = createClient();

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      // Fetch campaigns with post counts
      const { data: campaignsData, error: campaignsError } = await supabase
        .from('campaigns')
        .select(`
          *,
          campaign_posts(count)
        `)
        .order('created_at', { ascending: false });

      if (campaignsError) throw campaignsError;

      // Manually fetch scheduled counts for each campaign (since we can't easily filter the count join)
      const { data: scheduledData, error: scheduledError } = await supabase
        .from('campaign_posts')
        .select('id, campaign_id, title, scheduled_at, status, campaigns(name)')
        .eq('status', 'scheduled')
        .order('scheduled_at', { ascending: true });

      if (scheduledError) throw scheduledError;

      const formattedCampaigns = campaignsData.map(c => ({
        ...c,
        posts_count: c.campaign_posts?.[0]?.count || 0,
      }));

      setCampaigns(formattedCampaigns);
      setScheduledPosts(scheduledData.map(p => ({
        id: p.id,
        title: p.title,
        campaign_name: (p.campaigns as any)?.name || 'Unknown',
        scheduled_at: p.scheduled_at,
        status: p.status
      })));
    } catch (error) {
      console.error('Error fetching campaigns data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this campaign? This cannot be undone.')) return;
    const { error } = await supabase.from('campaigns').delete().eq('id', id);
    if (!error) setCampaigns((prev) => prev.filter((c) => c.id !== id));
  };

  const handleViewDetails = (campaign: Campaign) => {
    setSelectedCampaign(campaign);
    setShowDetailsDialog(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const totalBudget = campaigns.reduce((sum, c) => sum + (parseFloat(c.budget as any) || 0), 0);
  const activeCampaigns = campaigns.filter((c) => c.status === 'active').length;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-foreground">Marketing Center</h1>
          <p className="text-muted-foreground">Manage campaigns and content strategy</p>
        </div>
        <Button onClick={() => setShowAddDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          New Campaign
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="mb-4">
          <TabsTrigger value="campaigns" className="flex items-center gap-2">
            <Megaphone className="w-4 h-4" />
            Campaigns
          </TabsTrigger>
          <TabsTrigger value="scheduled" className="flex items-center gap-2">
            <Clock className="w-4 h-4" />
            Scheduled Posts
            {scheduledPosts.length > 0 && (
              <Badge variant="secondary" className="ml-1 h-5 px-1.5 bg-primary/10 text-primary border-none text-[10px]">
                {scheduledPosts.length}
              </Badge>
            )}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="campaigns">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Budget</CardTitle>
                <Megaphone className="h-4 w-4 text-muted-foreground opacity-50" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">${totalBudget.toLocaleString()}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Active Campaigns</CardTitle>
                <div className="h-4 w-4 rounded-full bg-green-500 animate-pulse" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-green-600">{activeCampaigns}</div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">Total Content</CardTitle>
                <LayoutGrid className="h-4 w-4 text-muted-foreground opacity-50" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-blue-600">
                    {campaigns.reduce((sum, c) => sum + (c.posts_count || 0), 0)} Posts
                </div>
              </CardContent>
            </Card>
          </div>

          {campaigns.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-20">
                <Megaphone className="w-12 h-12 text-muted-foreground mb-4 opacity-20" />
                <p className="text-muted-foreground font-medium">No campaigns found</p>
                <Button variant="link" onClick={() => setShowAddDialog(true)}>Create your first campaign</Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {campaigns.map((campaign) => (
                <Card key={campaign.id} className="group hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 overflow-hidden border-border/50">
                  <div className="h-2 w-full bg-primary/10 group-hover:bg-primary transition-colors" />
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 space-y-1">
                        <CardTitle className="text-xl font-bold line-clamp-1 group-hover:text-primary transition-colors">
                          {campaign.name}
                        </CardTitle>
                        <Badge className={`${STATUS_COLORS[campaign.status]} border-none text-[10px] uppercase font-bold`}>
                            {campaign.status}
                        </Badge>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => handleDelete(campaign.id)}
                        className="text-destructive hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-sm text-muted-foreground line-clamp-2 h-10">
                      {campaign.description || 'No description provided.'}
                    </p>

                    <div className="grid grid-cols-2 gap-4 text-[11px] font-medium text-muted-foreground border-y py-3 border-border/50">
                      <div className="flex items-center gap-2">
                        <Calendar className="w-3.5 h-3.5 text-primary" />
                        <span>{campaign.start_date ? format(new Date(campaign.start_date), 'MMM dd') : 'N/A'} - {campaign.end_date ? format(new Date(campaign.end_date), 'MMM dd') : 'N/A'}</span>
                      </div>
                      <div className="flex items-center gap-2 justify-end">
                        <Megaphone className="w-3.5 h-3.5 text-primary" />
                        <span>{campaign.posts_count || 0} Posts</span>
                      </div>
                    </div>

                    <div className="flex items-center justify-between pt-1">
                      <div>
                        <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Budget</p>
                        <p className="text-lg font-bold text-foreground">
                          ${parseFloat(campaign.budget as any || 0).toLocaleString()}
                        </p>
                      </div>
                      <Button variant="default" onClick={() => handleViewDetails(campaign)} className="shadow-lg shadow-primary/20">
                        Content Manager
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="scheduled">
          {scheduledPosts.length === 0 ? (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-20">
                <Clock className="w-12 h-12 text-muted-foreground mb-4 opacity-20" />
                <p className="text-muted-foreground font-medium">No scheduled content</p>
                <p className="text-sm text-muted-foreground">All your upcoming posts will appear here.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              <h3 className="text-lg font-bold">Upcoming Content Queue</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                {scheduledPosts.map((post) => (
                  <Card key={post.id} className="bg-card/50 backdrop-blur-sm border-border/50 group">
                    <CardHeader className="pb-3">
                      <div className="flex justify-between items-start gap-2">
                         <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-blue-500" />
                            <CardTitle className="text-sm font-bold">{post.title}</CardTitle>
                         </div>
                         <Badge variant="outline" className="text-[9px] bg-blue-500/5 text-blue-500 border-blue-500/20">
                            SCHEDULED
                         </Badge>
                      </div>
                    </CardHeader>
                    <CardContent>
                       <div className="space-y-3">
                          <div className="flex items-center justify-between text-xs">
                             <span className="text-muted-foreground">Campaign</span>
                             <span className="font-bold text-primary">{post.campaign_name}</span>
                          </div>
                          <div className="flex items-center justify-between text-xs">
                             <span className="text-muted-foreground">Post Date</span>
                             <span className="font-bold">{format(new Date(post.scheduled_at), 'MMMM dd, HH:mm')}</span>
                          </div>
                          <Button variant="secondary" className="w-full text-xs h-8 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                             View in Campaign
                          </Button>
                       </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {showAddDialog && (
        <AddCampaignDialog
          open={showAddDialog}
          onOpenChange={setShowAddDialog}
          onCampaignAdded={() => {
            setShowAddDialog(false);
            fetchData();
          }}
        />
      )}

      {showDetailsDialog && selectedCampaign && (
        <CampaignDetailsDialog
          open={showDetailsDialog}
          onOpenChange={setShowDetailsDialog}
          campaign={selectedCampaign}
        />
      )}
    </div>
  );
}
