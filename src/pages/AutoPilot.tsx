import React, { useState, useRef, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Calendar, Clock, Youtube, Instagram, Upload, AlertCircle, Plus, LayoutGrid, List, Sparkles, Rocket, RefreshCw, FileText, Image as ImageIcon, Edit } from "lucide-react";
import { aiService, ScheduledPost } from "@/services/aiService";
import { useToast } from "@/components/ui/use-toast";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate } from "react-router-dom";
import { useUser } from "@/contexts/UserContext";

const AutoPilot = () => {
    const navigate = useNavigate();
    const [view, setView] = useState<"calendar" | "list">("calendar");
    const [posts, setPosts] = useState<ScheduledPost[]>([]);

    const { user } = useUser();
    const { data: realGenerations, isLoading: postsLoading } = useQuery({
        queryKey: ['scheduled-generations', user?.id],
        queryFn: async () => {
            if (!user) return [];
            const { data, error } = await supabase
                .from('generations')
                .select('*')
                .eq('user_id', user.id)
                .is('thumbnail_url', 'not.null')
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data.map((gen: any) => ({
                id: gen.id,
                title: gen.idea,
                platform: "YouTube Shorts", // Default
                time: "10:00 AM",
                status: "Draft",
                date: "Today",
                thumbnailUrl: gen.thumbnail_url,
                videoUrl: gen.video_url
            }));
        },
        enabled: !!user
    });

    useEffect(() => {
        if (realGenerations) {
            setPosts(realGenerations);
        }
    }, [realGenerations]);

    const [isGenerating, setIsGenerating] = useState(false);
    const [contextFile, setContextFile] = useState<File | null>(null);

    const { toast } = useToast();
    const [publishingId, setPublishingId] = useState<any>(null);
    const [regeneratingThumbId, setRegeneratingThumbId] = useState<any>(null);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setContextFile(e.target.files[0]);
            toast({
                title: "Context Added",
                description: `Using ${e.target.files[0].name} for idea generation.`,
            });
        }
    };

    const handleGenerateIdeas = async () => {
        setIsGenerating(true);
        try {
            let newPosts: ScheduledPost[];
            if (contextFile) {
                newPosts = await aiService.generateIdeasFromContext(contextFile);
            } else {
                newPosts = await aiService.generateContentSchedule("General Knowledge");
            }
            setPosts([...posts, ...newPosts]);
            toast({
                title: "Ideas Generated",
                description: `Created ${newPosts.length} new posts${contextFile ? ' from your file' : ''}.`,
            });
        } catch (error) {
            console.error(error);
            toast({
                title: "Generation Failed",
                description: "Could not generate ideas. Please try again.",
                variant: "destructive"
            });
        } finally {
            setIsGenerating(false);
        }
    };

    const handleRegenerateThumbnail = async (post: ScheduledPost) => {
        setRegeneratingThumbId(post.id);
        try {
            const newUrl = await aiService.generateThumbnail(post.title);
            setPosts(posts.map(p => p.id === post.id ? { ...p, thumbnailUrl: newUrl } : p));
            toast({
                title: "Thumbnail Updated",
                description: "New thumbnail generated successfully."
            });
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to generate thumbnail.",
                variant: "destructive"
            });
        } finally {
            setRegeneratingThumbId(null);
        }
    };

    const handleEditPost = (post: ScheduledPost) => {
        // Redirect to external editor
        window.open('https://video.designcombo.dev/', '_blank');
        toast({
            title: "Opening Editor",
            description: `Loading "${post.title}" into the studio...`
        });
    };

    const handlePublish = async (post: ScheduledPost) => {
        setPublishingId(post.id);
        toast({
            title: "Publishing...",
            description: `Uploading to ${post.platform}`
        });

        try {
            await aiService.uploadToSocials(post);

            // Update local state
            setPosts(posts.map(p =>
                p.id === post.id ? { ...p, status: "Scheduled" } : p
            ));

            toast({
                title: "Success! 🚀",
                description: "Post scheduled successfully."
            });
        } catch (error) {
            toast({
                title: "Error",
                description: "Failed to publish post.",
                variant: "destructive"
            });
        } finally {
            setPublishingId(null);
        }
    };

    return (
        <div className="container mx-auto px-4 py-8 min-h-screen bg-background text-foreground">
            <div className="flex flex-col md:flex-row items-center justify-between mb-8 gap-4">
                <div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">Auto-Pilot</h1>
                    <p className="text-muted-foreground">Manage your automated Faceless Channel.</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                    {/* File Upload for Ideas */}
                    <div className="flex items-center gap-2 mr-2">
                        <Input
                            type="file"
                            id="context-upload"
                            className="hidden"
                            onChange={handleFileChange}
                            accept=".pdf,.txt,.doc,.docx"
                        />
                        <Label
                            htmlFor="context-upload"
                            className="cursor-pointer inline-flex items-center h-10 px-4 py-2 border border-input bg-background hover:bg-accent hover:text-accent-foreground rounded-md text-sm font-medium transition-colors"
                        >
                            {contextFile ? (
                                <FileText className="w-4 h-4 mr-2 text-primary" />
                            ) : (
                                <Upload className="w-4 h-4 mr-2" />
                            )}
                            {contextFile ? "File Loaded" : "Upload Context"}
                        </Label>
                    </div>

                    <Button className="gap-2" onClick={handleGenerateIdeas} disabled={isGenerating}>
                        {isGenerating ? <Sparkles className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                        {isGenerating ? "Brainstorming..." : "Auto-Generate Ideas"}
                    </Button>

                    <div className="flex gap-1 ml-2 border-l pl-2 border-border/50">
                        <Button variant={view === "calendar" ? "secondary" : "ghost"} size="icon" onClick={() => setView("calendar")}>
                            <LayoutGrid className="w-4 h-4" />
                        </Button>
                        <Button variant={view === "list" ? "secondary" : "ghost"} size="icon" onClick={() => setView("list")}>
                            <List className="w-4 h-4" />
                        </Button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Left: Connected Accounts */}
                <div className="lg:col-span-1 space-y-6">
                    <Card className="p-6 glass border-primary/20">
                        <h3 className="text-lg font-semibold mb-4">Connected Accounts</h3>
                        <div className="space-y-4">
                            <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10">
                                <div className="flex items-center space-x-3">
                                    <div className="p-2 bg-red-600/20 rounded-full">
                                        <Youtube className="w-5 h-5 text-red-500" />
                                    </div>
                                    <div>
                                        <div className="font-medium">N4 Clips Official</div>
                                        <div className="text-xs text-muted-foreground">YouTube Shorts</div>
                                    </div>
                                </div>
                                <Badge variant="default" className="bg-green-500/10 text-green-500 hover:bg-green-500/20">Active</Badge>
                            </div>

                            <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10">
                                <div className="flex items-center space-x-3">
                                    <div className="p-2 bg-pink-600/20 rounded-full">
                                        <Instagram className="w-5 h-5 text-pink-500" />
                                    </div>
                                    <div>
                                        <div className="font-medium">@n4clips</div>
                                        <div className="text-xs text-muted-foreground">Reels</div>
                                    </div>
                                </div>
                                <Badge variant="outline" className="text-yellow-500 border-yellow-500/50">Re-Auth</Badge>
                            </div>

                            <Button variant="outline" className="w-full border-dashed">
                                <Plus className="w-4 h-4 mr-2" /> Connect New Account
                            </Button>
                        </div>
                    </Card>

                    <Card className="p-6 glass">
                        <h3 className="text-lg font-semibold mb-4">Automation Settings</h3>
                        <div className="space-y-4 text-sm">
                            <div className="flex justify-between items-center">
                                <span className="text-muted-foreground">Posting Frequency</span>
                                <span className="font-medium">3 / Day</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-muted-foreground">Style Profile</span>
                                <span className="font-medium text-primary">Zack D. Clone</span>
                            </div>
                            <div className="flex justify-between items-center">
                                <span className="text-muted-foreground">Niche</span>
                                <span className="font-medium">Curiosity / Facts</span>
                            </div>
                        </div>
                    </Card>
                </div>

                {/* Right: Scheduler */}
                <div className="lg:col-span-2">
                    <Tabs defaultValue="upcoming" className="w-full">
                        <TabsList className="mb-4 bg-white/5">
                            <TabsTrigger value="upcoming">Upcoming</TabsTrigger>
                            <TabsTrigger value="published">Published</TabsTrigger>
                            <TabsTrigger value="drafts">Drafts</TabsTrigger>
                        </TabsList>

                        <TabsContent value="upcoming" className="space-y-4">
                            {posts.map((post) => (
                                <Card key={post.id} className="p-4 glass hover:bg-white/5 transition-all flex flex-col sm:flex-row items-center justify-between group gap-4">
                                    <div className="flex items-center space-x-4 w-full sm:w-auto">
                                        {/* Thumbnail Display */}
                                        <div className="relative h-24 w-16 bg-gray-800 rounded-md overflow-hidden flex-shrink-0 group/thumb">
                                            {post.thumbnailUrl ? (
                                                <img src={post.thumbnailUrl} alt="Thumbnail" className="w-full h-full object-cover" />
                                            ) : (
                                                <div className="flex items-center justify-center w-full h-full">
                                                    <ImageIcon className="w-6 h-6 text-muted-foreground" />
                                                </div>
                                            )}
                                            {/* Regenerate Overlay */}
                                            <div className="absolute inset-0 bg-black/60 opacity-0 group-hover/thumb:opacity-100 transition-opacity flex items-center justify-center cursor-pointer" onClick={() => handleRegenerateThumbnail(post)}>
                                                {regeneratingThumbId === post.id ? (
                                                    <RefreshCw className="w-5 h-5 text-white animate-spin" />
                                                ) : (
                                                    <RefreshCw className="w-5 h-5 text-white" />
                                                )}
                                            </div>
                                        </div>

                                        <div>
                                            <h4 className="font-semibold group-hover:text-primary transition-colors line-clamp-2">{post.title}</h4>
                                            <div className="flex items-center space-x-2 text-xs text-muted-foreground mt-1">
                                                <Badge variant="secondary" className="text-[10px] h-5">{post.platform}</Badge>
                                                <span>• {post.date} at {post.time}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                                        {/* Edit Button */}
                                        <Button
                                            size="sm"
                                            variant="ghost"
                                            onClick={() => handleEditPost(post)}
                                        >
                                            <Edit className="w-4 h-4" />
                                        </Button>

                                        {/* Publish Button */}
                                        {post.status === "Draft" && (
                                            <Button
                                                size="sm"
                                                variant="secondary"
                                                onClick={() => handlePublish(post)}
                                                disabled={publishingId === post.id}
                                            >
                                                {publishingId === post.id ? (
                                                    <Sparkles className="w-3 h-3 animate-spin mr-2" />
                                                ) : (
                                                    <Rocket className="w-3 h-3 mr-2" />
                                                )}
                                                Publish
                                            </Button>
                                        )}
                                        <Badge className={`
                                            ${post.status === 'Scheduled' ? 'bg-green-500/10 text-green-500' : ''}
                                            ${post.status === 'Draft' ? 'bg-gray-500/10 text-gray-500' : ''}
                                            ${post.status === 'Queue' ? 'bg-blue-500/10 text-blue-500' : ''}
                                        `}>
                                            {post.status}
                                        </Badge>
                                    </div>
                                </Card>
                            ))}

                            <div className="p-8 border-2 border-dashed border-white/10 rounded-xl text-center text-muted-foreground hover:bg-white/5 transition-all cursor-pointer">
                                <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
                                <p>Next slot available at 8:00 PM</p>
                            </div>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </div>
    );
};

export default AutoPilot;
