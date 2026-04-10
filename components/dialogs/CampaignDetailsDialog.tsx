'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent } from '@/components/ui/card';
import { Plus, Calendar, Image as ImageIcon, Trash2, Clock, Send } from 'lucide-react';
import { format } from 'date-fns';
import { AddPostDialog } from './AddPostDialog';

interface Post {
  id: string;
  title: string;
  content: string;
  status: 'draft' | 'scheduled' | 'posted';
  scheduled_at: string;
  image_url: string;
  created_at: string;
}

interface Campaign {
  id: string;
  name: string;
  description: string;
  status: string;
  budget: number;
}

interface CampaignDetailsDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  campaign: Campaign;
}

const STATUS_COLORS = {
  draft: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
  scheduled: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
  posted: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
};

export function CampaignDetailsDialog({ open, onOpenChange, campaign }: CampaignDetailsDialogProps) {
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddPost, setShowAddPost] = useState(false);
  const supabase = createClient();

  useEffect(() => {
    if (open) {
      fetchPosts();
    }
  }, [open, campaign.id]);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('campaign_posts')
        .select('*')
        .eq('campaign_id', campaign.id)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setPosts(data || []);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDeletePost = async (id: string) => {
    if (!confirm('Are you sure you want to delete this post?')) return;
    try {
      const { error } = await supabase.from('campaign_posts').delete().eq('id', id);
      if (error) throw error;
      setPosts(posts.filter((p) => p.id !== id));
    } catch (error) {
      console.error('Error deleting post:', error);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[800px] h-[80vh] flex flex-col p-0 overflow-hidden">
        <DialogHeader className="p-6 border-b">
          <div className="flex justify-between items-center">
            <div>
              <DialogTitle className="text-2xl font-bold">{campaign.name}</DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">Manage content and scheduled posts</p>
            </div>
            <Button onClick={() => setShowAddPost(true)}>
              <Plus className="w-4 h-4 mr-2" />
              New Post
            </Button>
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <Tabs defaultValue="all" className="h-full flex flex-col">
            <div className="px-6 py-2 border-b">
              <TabsList variant="underline" className="w-full justify-start h-auto p-0 bg-transparent gap-6">
                <TabsTrigger value="all" className="px-1 py-3 text-sm font-medium data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
                  All Posts ({posts.length})
                </TabsTrigger>
                <TabsTrigger value="scheduled" className="px-1 py-3 text-sm font-medium data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
                  Scheduled ({posts.filter(p => p.status === 'scheduled').length})
                </TabsTrigger>
                <TabsTrigger value="drafts" className="px-1 py-3 text-sm font-medium data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none">
                  Drafts ({posts.filter(p => p.status === 'draft').length})
                </TabsTrigger>
              </TabsList>
            </div>

            <ScrollArea className="flex-1 p-6">
              <TabsContent value="all" className="mt-0">
                <PostGrid 
                    posts={posts} 
                    onDelete={handleDeletePost} 
                    loading={loading} 
                />
              </TabsContent>
              <TabsContent value="scheduled" className="mt-0">
                <PostGrid 
                    posts={posts.filter(p => p.status === 'scheduled')} 
                    onDelete={handleDeletePost} 
                    loading={loading} 
                />
              </TabsContent>
              <TabsContent value="drafts" className="mt-0">
                <PostGrid 
                    posts={posts.filter(p => p.status === 'draft')} 
                    onDelete={handleDeletePost} 
                    loading={loading} 
                />
              </TabsContent>
            </ScrollArea>
          </Tabs>
        </div>

        {showAddPost && (
          <AddPostDialog
            open={showAddPost}
            onOpenChange={setShowAddPost}
            campaignId={campaign.id}
            onPostAdded={() => {
              setShowAddPost(false);
              fetchPosts();
            }}
          />
        )}
      </DialogContent>
    </Dialog>
  );
}

function PostGrid({ posts, onDelete, loading }: { posts: Post[], onDelete: (id: string) => void, loading: boolean }) {
  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1, 2, 3, 4].map(i => (
          <div key={i} className="h-48 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  if (posts.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20 text-center">
        <ImageIcon className="w-12 h-12 text-muted-foreground mb-4 opacity-20" />
        <h3 className="text-lg font-medium text-muted-foreground">No posts found</h3>
        <p className="text-sm text-muted-foreground">Start by creating your first post for this campaign.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pb-10">
      {posts.map((post) => (
        <Card key={post.id} className="overflow-hidden group hover:border-primary/50 transition-colors">
          <CardContent className="p-0">
            {post.image_url ? (
                <div className="h-32 w-full overflow-hidden bg-muted">
                    <img src={post.image_url} alt={post.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                </div>
            ) : (
                <div className="h-32 w-full bg-muted flex items-center justify-center">
                    <ImageIcon className="w-8 h-8 text-muted-foreground opacity-30" />
                </div>
            )}
            <div className="p-4 space-y-3">
              <div className="flex justify-between items-start gap-2">
                <h4 className="font-bold text-sm line-clamp-1">{post.title}</h4>
                <Badge variant="secondary" className={`${STATUS_COLORS[post.status]} border-none text-[10px] uppercase font-bold`}>
                  {post.status}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground line-clamp-2 h-8">
                {post.content}
              </p>
              
              <div className="flex items-center justify-between pt-2 border-t border-border/50">
                <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground">
                  {post.status === 'scheduled' ? (
                      <>
                        <Clock className="w-3 h-3 text-blue-500" />
                        <span>{format(new Date(post.scheduled_at), 'MMM dd, HH:mm')}</span>
                      </>
                  ) : post.status === 'posted' ? (
                      <>
                        <Send className="w-3 h-3 text-green-500" />
                        <span>Posted on {format(new Date(post.created_at), 'MMM dd')}</span>
                      </>
                  ) : (
                      <>
                        <Calendar className="w-3 h-3" />
                        <span>Created {format(new Date(post.created_at), 'MMM dd')}</span>
                      </>
                  )}
                </div>
                <Button 
                    variant="ghost" 
                    size="icon" 
                    className="h-7 w-7 text-destructive hover:text-destructive hover:bg-destructive/10 opacity-0 group-hover:opacity-100 transition-opacity"
                    onClick={() => onDelete(post.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
