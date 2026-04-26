import { useState, useEffect, useCallback } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Video,
  Users,
  Crown,
  Settings,
  Play,
  Download,
  Plus,
  Clock,
  Trash2,
  Rocket,
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useUser } from "@/contexts/UserContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import ThumbnailCreator from "@/components/ThumbnailCreator";

const Dashboard = () => {
  const navigate = useNavigate();
  const { user, loading } = useUser();
  const [searchParams] = useSearchParams();
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") || "videos");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");
  const [videoToDelete, setVideoToDelete] = useState<string | null>(null);

  const { data: stats, isLoading: statsLoading, refetch } = useQuery({
    queryKey: ['dashboard-stats', user?.id],
    queryFn: async () => {
      if (!user) return { generations: [], characters: [], generationsCount: 0, charactersCount: 0, plan: "Free" };

      const [generationsResponse, charactersResponse, profileResponse] = await Promise.all([
        supabase.from('generations').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(10),
        supabase.from('characters').select('*').eq('user_id', user.id).order('created_at', { ascending: false }).limit(10),
        supabase.from('profiles').select('plan').eq('id', user.id).single()
      ]);

      return {
        generations: generationsResponse.data || [],
        characters: charactersResponse.data || [],
        generationsCount: generationsResponse.data?.length || 0,
        charactersCount: charactersResponse.data?.length || 0,
        plan: profileResponse.data?.plan || "Free"
      };
    },
    enabled: !!user
  });

  // Poll for pending renders
  useEffect(() => {
    if (!user || !stats?.generations) return;

    const checkPendingRenders = async () => {
      const pending = stats.generations.filter((g: any) => g.status === 'processing');

      for (const gen of pending) {
        try {
          const { data } = await supabase.functions.invoke('check-render-status', {
            body: { renderId: gen.render_id }
          });

          if (data?.status === 'completed') {
            refetch();
          }
        } catch (error) {
          console.error('Failed to check render status:', error);
        }
      }
    };

    checkPendingRenders();

    const hasPending = stats.generations.some((g: any) => g.status === 'processing');
    if (hasPending) {
      const interval = setInterval(checkPendingRenders, 10000);
      return () => clearInterval(interval);
    }
  }, [user, stats?.generations, refetch]);

  // Real-time progress subscription
  const [progressUpdates, setProgressUpdates] = useState<Record<string, { message: string; percent: number }>>({});
  
  useEffect(() => {
    if (!user) return;
    
    const channel = supabase.channel('generation-progress')
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'generations',
        filter: `user_id=eq.${user.id}`
      }, (payload) => {
        const gen = payload.new as any;
        if (gen.status === 'processing' && gen.progress_percent !== null) {
          setProgressUpdates(prev => ({
            ...prev,
            [gen.id]: {
              message: gen.status_message || 'Processing...',
              percent: gen.progress_percent || 0
            }
          }));
          // Refetch when complete
          if (gen.progress_percent === 100 || gen.status === 'completed') {
            refetch();
          }
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, refetch]);

  const getProgress = (genId: string) => progressUpdates[genId];

  const handleEditProfile = () => {
    toast.info("Profile editing coming soon!");
  };

  const handleDeleteClick = (videoId: string) => {
    setVideoToDelete(videoId);
    setDeleteDialogOpen(true);
    setDeleteConfirmText("");
  };

  const handleDeleteConfirm = async () => {
    if (deleteConfirmText.toLowerCase() !== "delete" || !videoToDelete) {
      toast.error("Please type 'delete' to confirm");
      return;
    }

    try {
      const { error } = await supabase
        .from('generations')
        .delete()
        .eq('id', videoToDelete);

      if (error) throw error;

      toast.success("Video deleted successfully");
      setDeleteDialogOpen(false);
      setVideoToDelete(null);
      setDeleteConfirmText("");
      refetch(); // Refresh the list
    } catch (error) {
      console.error("Delete error:", error);
      toast.error("Failed to delete video");
    }
  };

  useEffect(() => {
    if (!loading && !user) {
      navigate('/login');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return <div className="min-h-screen bg-background flex items-center justify-center">Loading...</div>;
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      <main className="pt-4 pb-12">
        <div className="container mx-auto px-4">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Welcome back, {user.user_metadata.full_name || user.email?.split('@')[0]}!
            </h1>
            <p className="text-muted-foreground">
              Ready to create some amazing videos today?
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="glass">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Current Plan</p>
                    <p className="text-2xl font-bold flex items-center gap-2">
                      {stats?.plan || "Free"}
                      <Crown className="w-5 h-5 text-feature-accent" />
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Videos Created</p>
                    <p className="text-2xl font-bold">{stats?.generationsCount || 0}</p>
                  </div>
                  <Video className="w-8 h-8 text-primary" />
                </div>
              </CardContent>
            </Card>

            <Card className="glass">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Characters</p>
                    <p className="text-2xl font-bold">{stats?.charactersCount || 0}</p>
                  </div>
                  <Users className="w-8 h-8 text-accent" />
                </div>
              </CardContent>
            </Card>

            <Card className="glass">
              <CardContent className="p-6 flex items-center justify-center">
                <Button className="cta-primary w-full" onClick={() => navigate('/features')}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Video
                </Button>
              </CardContent>
            </Card>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 glass">
              <TabsTrigger value="videos">Recent Videos</TabsTrigger>
              <TabsTrigger value="characters">Saved Characters</TabsTrigger>
              <TabsTrigger value="settings">Account Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="videos" className="mt-6">
              {stats?.generations && stats.generations.length > 0 ? (
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {stats.generations.map((gen: any) => (
                    <Card key={gen.id} className="glass overflow-hidden">
                      <CardContent className="p-0">
                        {gen.status === 'completed' && gen.video_url ? (
                          <div className="relative aspect-video bg-black group/video">
                            {gen.thumbnail_url ? (
                              <img src={gen.thumbnail_url} alt="Thumbnail" className="w-full h-full object-cover" />
                            ) : (
                              <video
                                src={gen.video_url}
                                className="w-full h-full"
                                poster={gen.visual_urls?.[0]}
                              />
                            )}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/video:opacity-100 transition-opacity flex items-center justify-center">
                              <Button variant="ghost" size="icon" onClick={() => window.open(gen.video_url, '_blank')} className="text-white">
                                <Play className="w-12 h-12" />
                              </Button>
                            </div>
                          </div>
                        ) : gen.status === 'processing' ? (
                          <div className="aspect-video bg-muted flex flex-col items-center justify-center p-4">
                            {getProgress(gen.id) ? (
                              <>
                                <Progress value={getProgress(gen.id).percent} className="w-full mb-2" />
                                <p className="text-sm text-primary text-center">{getProgress(gen.id).message}</p>
                              </>
                            ) : (
                              <>
                                <Clock className="w-12 h-12 text-primary animate-pulse mb-2" />
                                <p className="text-sm text-muted-foreground">Processing...</p>
                              </>
                            )}
                          </div>
                        ) : (
                          <div className="aspect-video bg-destructive/10 flex flex-col items-center justify-center">
                            <p className="text-sm text-destructive">Render failed</p>
                          </div>
                        )}

                        <div className="p-4">
                          <h3 className="font-semibold line-clamp-2 mb-2">{gen.idea}</h3>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-4 flex-wrap">
                            <Badge variant="outline">{gen.style}</Badge>
                            <Badge variant="secondary" className="bg-amber-500/20 text-amber-600 border-amber-500/50">
                              Simulation Mode
                            </Badge>
                            <span>•</span>
                            <span>{gen.duration}</span>
                            {gen.frame_size && (
                              <>
                                <span>•</span>
                                <span>{gen.frame_size}</span>
                              </>
                            )}
                            <span>•</span>
                            <span>{new Date(gen.created_at).toLocaleDateString()}</span>
                          </div>

                          <div className="flex gap-2 mt-2">
                            {gen.status === 'completed' && gen.video_url && (
                              <>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  className="flex-1"
                                  onClick={() => window.open(gen.video_url, '_blank')}
                                >
                                  <Play className="w-4 h-4 mr-2" />
                                  Play
                                </Button>
                                <Button
                                  size="sm"
                                  variant="outline"
                                  onClick={() => {
                                    const a = document.createElement('a');
                                    a.href = gen.video_url;
                                    a.download = `${gen.idea.slice(0, 30)}.mp4`;
                                    a.click();
                                  }}
                                >
                                  <Download className="w-4 h-4" />
                                </Button>
                                <ThumbnailCreator
                                  videoId={gen.id}
                                  videoTitle={gen.idea}
                                  onThumbnailCreated={() => refetch()}
                                />
                                <Button
                                  size="sm"
                                  className="bg-primary/20 text-primary border-primary/30 hover:bg-primary/30"
                                  onClick={() => navigate('/autopilot')}
                                >
                                  <Rocket className="w-4 h-4" />
                                </Button>
                              </>
                            )}
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleDeleteClick(gen.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Video className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No videos created yet.</p>
                  <Button variant="link" onClick={() => navigate('/features')}>Create your first video</Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="characters" className="mt-6">
              {stats?.characters && stats.characters.length > 0 ? (
                <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
                  {stats.characters.map((character: any) => (
                    <Card key={character.id} className="glass hover:scale-105 transition-transform cursor-pointer" onClick={() => navigate('/features')}>
                      <CardContent className="p-4 text-center">
                        <div className="w-16 h-16 rounded-full bg-gradient-to-r from-primary to-accent mx-auto mb-3 overflow-hidden">
                          {character.generated_images?.[0] ? (
                            <img src={character.generated_images[0]} alt={character.name} className="w-full h-full object-cover" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center">
                              <Users className="w-8 h-8 text-white" />
                            </div>
                          )}
                        </div>
                        <p className="text-sm font-medium truncate">{character.name}</p>
                      </CardContent>
                    </Card>
                  ))}
                  <Card className="glass hover:scale-105 transition-transform cursor-pointer border-dashed" onClick={() => navigate('/features#characters')}>
                    <CardContent className="p-4 flex flex-col items-center justify-center h-full min-h-[140px]">
                      <Plus className="w-8 h-8 text-muted-foreground mb-2" />
                      <p className="text-sm font-medium text-muted-foreground">Create New</p>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <div className="text-center py-12 text-muted-foreground">
                  <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No characters created yet.</p>
                  <Button variant="link" onClick={() => navigate('/features#characters')}>Create a character</Button>
                </div>
              )}
            </TabsContent>

            <TabsContent value="settings" className="mt-6">
              <div className="grid gap-6">
                <Card className="glass">
                  <CardHeader>
                    <CardTitle>Subscription Details</CardTitle>
                    <CardDescription>Manage your subscription and billing</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Current Plan: {stats?.plan || "Free"}</p>
                        <p className="text-sm text-muted-foreground">Billed monthly</p>
                      </div>
                      <Button variant="outline" onClick={() => navigate('/pricing')}>
                        Upgrade Plan
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card className="glass">
                  <CardHeader>
                    <CardTitle>Account Information</CardTitle>
                    <CardDescription>Update your personal information</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium">Name</label>
                        <p className="text-sm text-muted-foreground">{user.user_metadata.full_name || 'Not set'}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Email</label>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                    <Button variant="outline" onClick={handleEditProfile}>
                      <Settings className="w-4 h-4 mr-2" />
                      Edit Profile
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Video</DialogTitle>
            <DialogDescription>
              This action cannot be undone. This will permanently delete your video from our servers.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p className="text-sm text-muted-foreground mb-2">
              Type <span className="font-bold text-destructive">delete</span> to confirm:
            </p>
            <Input
              value={deleteConfirmText}
              onChange={(e) => setDeleteConfirmText(e.target.value)}
              placeholder="Type 'delete' here"
              className="w-full"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteConfirm}
              disabled={deleteConfirmText.toLowerCase() !== "delete"}
            >
              Delete Permanently
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Dashboard;