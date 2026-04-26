import React, { useState, useEffect, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import {
    Calendar, Clock, Upload, Plus, LayoutGrid, List, Sparkles, Rocket,
    RefreshCw, FileText, Image as ImageIcon, Edit, Trash2, Send, Link2,
    CheckCircle2, XCircle, AlertCircle, LogOut, Video, ChevronDown,
    Globe, Lock, Users
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/components/ui/use-toast";
import { useUser } from "@/contexts/UserContext";
import { aiService } from "@/services/aiService";
import {
    initiateOAuth,
    getConnectedAccounts,
    disconnectAccount,
    publishNow,
    schedulePost,
    getScheduledPosts,
    cancelScheduledPost,
    retryPost,
    isTokenFresh,
    PLATFORM_META,
    type SchedulePostOptions,
} from "@/services/publishingService";
import type { SocialAccount, SocialPlatform, ScheduledPost } from "@/types";

// ─── Platform icons (inline SVG for TikTok, Lucide for rest) ─────────────────

const TikTokIcon = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1-2.89-2.89 2.89 2.89 0 0 1 2.89-2.89c.28 0 .54.04.79.1V9.01a6.31 6.31 0 0 0-.79-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.33-6.34V8.69a8.18 8.18 0 0 0 4.78 1.52V6.77a4.85 4.85 0 0 1-1.01-.08z" />
    </svg>
);

const YouTubeIcon = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M23.495 6.205a3.007 3.007 0 0 0-2.088-2.088c-1.87-.501-9.396-.501-9.396-.501s-7.507-.01-9.396.501A3.007 3.007 0 0 0 .527 6.205a31.247 31.247 0 0 0-.522 5.805 31.247 31.247 0 0 0 .522 5.783 3.007 3.007 0 0 0 2.088 2.088c1.868.502 9.396.502 9.396.502s7.506 0 9.396-.502a3.007 3.007 0 0 0 2.088-2.088 31.247 31.247 0 0 0 .5-5.783 31.247 31.247 0 0 0-.5-5.805zM9.609 15.601V8.408l6.264 3.602z" />
    </svg>
);

const InstagramIcon = ({ className }: { className?: string }) => (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zM12 16a4 4 0 1 1 0-8 4 4 0 0 1 0 8zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z" />
    </svg>
);

const PLATFORM_ICONS: Record<SocialPlatform, React.FC<{ className?: string }>> = {
    tiktok: TikTokIcon,
    youtube: YouTubeIcon,
    instagram: InstagramIcon,
};

// ─── Status badge helpers ─────────────────────────────────────────────────────

function StatusBadge({ status }: { status: ScheduledPost["status"] }) {
    const map = {
        scheduled: "bg-blue-500/10 text-blue-400 border-blue-500/30",
        published: "bg-green-500/10 text-green-400 border-green-500/30",
        failed: "bg-red-500/10 text-red-400 border-red-500/30",
    };
    return (
        <Badge variant="outline" className={map[status]}>
            {status === "scheduled" && <Clock className="w-3 h-3 mr-1" />}
            {status === "published" && <CheckCircle2 className="w-3 h-3 mr-1" />}
            {status === "failed" && <XCircle className="w-3 h-3 mr-1" />}
            {status.charAt(0).toUpperCase() + status.slice(1)}
        </Badge>
    );
}

// ─── Post Composer Dialog ─────────────────────────────────────────────────────

interface ComposerProps {
    open: boolean;
    onClose: () => void;
    connectedPlatforms: SocialPlatform[];
    prefillVideoUrl?: string;
    onScheduled: () => void;
}

function PostComposer({ open, onClose, connectedPlatforms, prefillVideoUrl, onScheduled }: ComposerProps) {
    const { toast } = useToast();
    const [videoUrl, setVideoUrl] = useState(prefillVideoUrl ?? "");
    const [caption, setCaption] = useState("");
    const [title, setTitle] = useState("");
    const [selectedPlatforms, setSelectedPlatforms] = useState<SocialPlatform[]>(connectedPlatforms.slice(0, 1));
    const [scheduleDate, setScheduleDate] = useState(new Date().toISOString().split("T")[0]);
    const [scheduleTime, setScheduleTime] = useState("10:00");
    const [privacyLevel, setPrivacyLevel] = useState<"PUBLIC" | "FRIENDS" | "PRIVATE">("PUBLIC");
    const [mode, setMode] = useState<"now" | "schedule">("schedule");
    const [isBusy, setIsBusy] = useState(false);

    useEffect(() => {
        if (prefillVideoUrl) setVideoUrl(prefillVideoUrl);
    }, [prefillVideoUrl]);

    const togglePlatform = (p: SocialPlatform) => {
        setSelectedPlatforms(prev =>
            prev.includes(p) ? prev.filter(x => x !== p) : [...prev, p]
        );
    };

    const handleSubmit = async () => {
        if (!videoUrl.trim()) { toast({ title: "Video URL required", variant: "destructive" }); return; }
        if (!caption.trim()) { toast({ title: "Caption required", variant: "destructive" }); return; }
        if (selectedPlatforms.length === 0) { toast({ title: "Select at least one platform", variant: "destructive" }); return; }

        setIsBusy(true);
        try {
            if (mode === "now") {
                const results = await publishNow({ videoUrl, caption, title: title || undefined, platforms: selectedPlatforms, privacyLevel });
                const successes = results.filter(r => r.success).map(r => PLATFORM_META[r.platform as SocialPlatform].label);
                const failures = results.filter(r => !r.success);
                if (successes.length > 0) {
                    toast({ title: "Published!", description: `Live on ${successes.join(", ")}` });
                }
                if (failures.length > 0) {
                    toast({ title: "Partial failure", description: failures.map(f => `${f.platform}: ${f.error}`).join(" • "), variant: "destructive" });
                }
            } else {
                await schedulePost({
                    videoUrl, caption, title: title || undefined, platforms: selectedPlatforms,
                    scheduledDate: scheduleDate, scheduledTime: scheduleTime, privacyLevel,
                } as SchedulePostOptions);
                toast({ title: "Scheduled!", description: `Post queued for ${scheduleDate} at ${scheduleTime}` });
            }
            onScheduled();
            onClose();
        } catch (err: any) {
            toast({ title: "Error", description: err.message, variant: "destructive" });
        } finally {
            setIsBusy(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={v => !v && onClose()}>
            <DialogContent className="max-w-lg bg-background border-primary/20">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Rocket className="w-5 h-5 text-primary" />
                        New Post
                    </DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-2">
                    {/* Video URL */}
                    <div className="space-y-1.5">
                        <Label>Video URL (S3 / Remotion output)</Label>
                        <div className="relative">
                            <Video className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                className="pl-9"
                                placeholder="https://storyweave-renders.s3.amazonaws.com/…"
                                value={videoUrl}
                                onChange={e => setVideoUrl(e.target.value)}
                            />
                        </div>
                    </div>

                    {/* Title */}
                    <div className="space-y-1.5">
                        <Label>Title <span className="text-muted-foreground text-xs">(YouTube, optional)</span></Label>
                        <Input placeholder="My viral short" value={title} onChange={e => setTitle(e.target.value)} />
                    </div>

                    {/* Caption */}
                    <div className="space-y-1.5">
                        <Label>Caption / Description</Label>
                        <Textarea
                            placeholder="Your caption with #hashtags @mentions…"
                            className="resize-none"
                            rows={3}
                            value={caption}
                            onChange={e => setCaption(e.target.value)}
                            maxLength={2200}
                        />
                        <p className="text-xs text-muted-foreground text-right">{caption.length}/2200</p>
                    </div>

                    {/* Platforms */}
                    <div className="space-y-1.5">
                        <Label>Publish to</Label>
                        <div className="flex flex-wrap gap-2">
                            {connectedPlatforms.length === 0 && (
                                <p className="text-sm text-muted-foreground">No accounts connected yet</p>
                            )}
                            {connectedPlatforms.map(p => {
                                const meta = PLATFORM_META[p];
                                const Icon = PLATFORM_ICONS[p];
                                const selected = selectedPlatforms.includes(p);
                                return (
                                    <button
                                        key={p}
                                        type="button"
                                        onClick={() => togglePlatform(p)}
                                        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm border transition-all ${
                                            selected
                                                ? `${meta.bgColor} border-current ${meta.textColor}`
                                                : "border-border text-muted-foreground hover:border-primary/50"
                                        }`}
                                    >
                                        <Icon className="w-4 h-4" />
                                        {meta.label}
                                        {selected && <CheckCircle2 className="w-3 h-3" />}
                                    </button>
                                );
                            })}
                        </div>
                    </div>

                    {/* Privacy */}
                    <div className="space-y-1.5">
                        <Label>Privacy</Label>
                        <Select value={privacyLevel} onValueChange={v => setPrivacyLevel(v as typeof privacyLevel)}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="PUBLIC"><span className="flex items-center gap-2"><Globe className="w-4 h-4" />Public</span></SelectItem>
                                <SelectItem value="FRIENDS"><span className="flex items-center gap-2"><Users className="w-4 h-4" />Friends only</span></SelectItem>
                                <SelectItem value="PRIVATE"><span className="flex items-center gap-2"><Lock className="w-4 h-4" />Private</span></SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Mode toggle + scheduling */}
                    <div className="grid grid-cols-2 gap-2">
                        <button
                            type="button"
                            onClick={() => setMode("now")}
                            className={`p-3 rounded-lg border text-sm font-medium transition-all ${mode === "now" ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/40"}`}
                        >
                            <Send className="w-4 h-4 mx-auto mb-1" />
                            Publish Now
                        </button>
                        <button
                            type="button"
                            onClick={() => setMode("schedule")}
                            className={`p-3 rounded-lg border text-sm font-medium transition-all ${mode === "schedule" ? "border-primary bg-primary/10 text-primary" : "border-border text-muted-foreground hover:border-primary/40"}`}
                        >
                            <Calendar className="w-4 h-4 mx-auto mb-1" />
                            Schedule
                        </button>
                    </div>

                    {mode === "schedule" && (
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <Label className="text-xs">Date</Label>
                                <Input type="date" value={scheduleDate} onChange={e => setScheduleDate(e.target.value)} min={new Date().toISOString().split("T")[0]} />
                            </div>
                            <div className="space-y-1">
                                <Label className="text-xs">Time (24h)</Label>
                                <Input type="time" value={scheduleTime} onChange={e => setScheduleTime(e.target.value)} />
                            </div>
                        </div>
                    )}
                </div>

                <DialogFooter>
                    <Button variant="outline" onClick={onClose} disabled={isBusy}>Cancel</Button>
                    <Button onClick={handleSubmit} disabled={isBusy || selectedPlatforms.length === 0}>
                        {isBusy ? <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> : mode === "now" ? <Send className="w-4 h-4 mr-2" /> : <Calendar className="w-4 h-4 mr-2" />}
                        {isBusy ? "Working…" : mode === "now" ? "Publish Now" : "Schedule"}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}

// ─── Connect Account Card ─────────────────────────────────────────────────────

function ConnectAccountCard({ account, onDisconnect }: { account: SocialAccount; onDisconnect: (p: SocialPlatform) => void }) {
    const meta = PLATFORM_META[account.platform];
    const Icon = PLATFORM_ICONS[account.platform];
    const fresh = isTokenFresh(account);

    return (
        <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10 hover:border-primary/30 transition-all">
            <div className="flex items-center gap-3">
                {account.platform_avatar_url ? (
                    <img src={account.platform_avatar_url} alt="" className="w-9 h-9 rounded-full" />
                ) : (
                    <div className={`p-2 ${meta.bgColor} rounded-full`}>
                        <Icon className={`w-5 h-5 ${meta.textColor}`} />
                    </div>
                )}
                <div>
                    <div className="font-medium text-sm">{account.platform_username ?? meta.label}</div>
                    <div className="text-xs text-muted-foreground">{meta.label}</div>
                </div>
            </div>
            <div className="flex items-center gap-2">
                <Badge variant="outline" className={fresh ? "text-green-400 border-green-500/30" : "text-yellow-400 border-yellow-500/30"}>
                    {fresh ? "Active" : "Expired"}
                </Badge>
                <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-red-400" onClick={() => onDisconnect(account.platform)}>
                    <LogOut className="w-3.5 h-3.5" />
                </Button>
            </div>
        </div>
    );
}

// ─── Platform Connect Button ──────────────────────────────────────────────────

function PlatformConnectButton({ platform, onConnect }: { platform: SocialPlatform; onConnect: (p: SocialPlatform) => void }) {
    const meta = PLATFORM_META[platform];
    const Icon = PLATFORM_ICONS[platform];
    return (
        <button
            type="button"
            onClick={() => onConnect(platform)}
            className="flex items-center gap-2.5 w-full p-3 rounded-lg border border-dashed border-white/20 hover:border-primary/50 hover:bg-white/5 text-sm text-muted-foreground hover:text-foreground transition-all"
        >
            <div className={`p-1.5 ${meta.bgColor} rounded-full`}>
                <Icon className={`w-4 h-4 ${meta.textColor}`} />
            </div>
            Connect {meta.label}
            <Plus className="w-3.5 h-3.5 ml-auto" />
        </button>
    );
}

// ─── Post Card ────────────────────────────────────────────────────────────────

function PostCard({ post, onCancel, onRetry }: { post: ScheduledPost; onCancel: (id: string) => void; onRetry: (id: string) => void }) {
    const publishedPlatforms = post.platforms ?? [];

    return (
        <Card className="p-4 glass hover:bg-white/5 transition-all group">
            <div className="flex items-start gap-4">
                {/* Thumbnail */}
                <div className="relative h-20 w-14 bg-gray-800 rounded-md overflow-hidden flex-shrink-0">
                    {post.thumbnail_url ? (
                        <img src={post.thumbnail_url} alt="" className="w-full h-full object-cover" />
                    ) : (
                        <div className="flex items-center justify-center w-full h-full">
                            <ImageIcon className="w-5 h-5 text-muted-foreground" />
                        </div>
                    )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                    <p className="font-medium line-clamp-2 text-sm">{post.idea || post.caption}</p>

                    <div className="flex flex-wrap items-center gap-1.5 mt-2">
                        {publishedPlatforms.map(p => {
                            const Icon = PLATFORM_ICONS[p as SocialPlatform];
                            const meta = PLATFORM_META[p as SocialPlatform];
                            return (
                                <span key={p} className={`flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px] ${meta.bgColor} ${meta.textColor}`}>
                                    <Icon className="w-3 h-3" />
                                    {meta.label}
                                </span>
                            );
                        })}
                    </div>

                    <div className="flex items-center gap-3 mt-2 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {post.scheduled_date}
                        </span>
                        <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {post.scheduled_time}
                        </span>
                    </div>

                    {post.error_message && (
                        <p className="mt-1 text-xs text-red-400 flex items-center gap-1">
                            <AlertCircle className="w-3 h-3" /> {post.error_message}
                        </p>
                    )}
                </div>

                {/* Actions */}
                <div className="flex flex-col items-end gap-2 flex-shrink-0">
                    <StatusBadge status={post.status} />
                    {post.status === "scheduled" && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => onCancel(post.id)}
                        >
                            <Trash2 className="w-3.5 h-3.5" />
                        </Button>
                    )}
                    {post.status === "failed" && (
                        <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-muted-foreground hover:text-green-400 opacity-0 group-hover:opacity-100 transition-opacity"
                            onClick={() => onRetry(post.id)}
                        >
                            <RefreshCw className="w-3.5 h-3.5" />
                        </Button>
                    )}
                </div>
            </div>
        </Card>
    );
}

// ─── Main AutoPilot Page ──────────────────────────────────────────────────────

const AutoPilot = () => {
    const { user } = useUser();
    const { toast } = useToast();
    const queryClient = useQueryClient();
    const [searchParams, setSearchParams] = useSearchParams();

    const [connectingPlatform, setConnectingPlatform] = useState<SocialPlatform | null>(null);
    const [composerOpen, setComposerOpen] = useState(false);
    const [view, setView] = useState<"list" | "calendar">("list");
    const [activeTab, setActiveTab] = useState<"scheduled" | "published" | "failed">("scheduled");

    // Prefill from Remotion Lambda's render completion (URL param: ?videoUrl=...)
    const prefillVideoUrl = searchParams.get("videoUrl") ?? "";

    // ── Detect OAuth callback result (platform redirect back to /auto-pilot) ──
    useEffect(() => {
        const oauthResult = searchParams.get("oauth");
        const platform = searchParams.get("platform");
        const username = searchParams.get("username");
        const msg = searchParams.get("msg");

        if (oauthResult === "success" && platform) {
            toast({ title: `${PLATFORM_META[platform as SocialPlatform]?.label ?? platform} connected!`, description: `@${username}` });
            queryClient.invalidateQueries({ queryKey: ["social-accounts"] });
            setSearchParams(new URLSearchParams()); // clean up URL
        } else if (oauthResult === "error") {
            toast({ title: "Connection failed", description: msg ?? "OAuth error", variant: "destructive" });
            setSearchParams(new URLSearchParams());
        }
    }, []);

    // ── Queries ───────────────────────────────────────────────────────────────

    const { data: accounts = [], isLoading: accountsLoading } = useQuery({
        queryKey: ["social-accounts"],
        queryFn: getConnectedAccounts,
        enabled: !!user,
        staleTime: 30_000,
    });

    const { data: posts = [], isLoading: postsLoading } = useQuery({
        queryKey: ["scheduled-posts", activeTab],
        queryFn: () => getScheduledPosts(activeTab),
        enabled: !!user,
    });

    // ── Mutations ─────────────────────────────────────────────────────────────

    const disconnectMutation = useMutation({
        mutationFn: (platform: SocialPlatform) => disconnectAccount(platform),
        onSuccess: (_, platform) => {
            toast({ title: `${PLATFORM_META[platform].label} disconnected` });
            queryClient.invalidateQueries({ queryKey: ["social-accounts"] });
        },
        onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
    });

    const cancelPostMutation = useMutation({
        mutationFn: cancelScheduledPost,
        onSuccess: () => {
            toast({ title: "Post cancelled" });
            queryClient.invalidateQueries({ queryKey: ["scheduled-posts"] });
        },
        onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
    });

    const retryPostMutation = useMutation({
        mutationFn: retryPost,
        onSuccess: () => {
            toast({ title: "Post retried" });
            queryClient.invalidateQueries({ queryKey: ["scheduled-posts"] });
        },
        onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
    });

    // ── OAuth connect ─────────────────────────────────────────────────────────

    const handleConnect = useCallback(async (platform: SocialPlatform) => {
        setConnectingPlatform(platform);
        try {
            const { username } = await initiateOAuth(platform);
            toast({
                title: `${PLATFORM_META[platform].label} connected!`,
                description: `@${username}`,
            });
            queryClient.invalidateQueries({ queryKey: ["social-accounts"] });
        } catch (err: any) {
            toast({ title: "Connection failed", description: err.message, variant: "destructive" });
        } finally {
            setConnectingPlatform(null);
        }
    }, [queryClient, toast]);

    // ── Derived state ─────────────────────────────────────────────────────────

    const connectedPlatforms = accounts.map(a => a.platform);
    const unconnectedPlatforms = (["tiktok", "youtube", "instagram"] as SocialPlatform[]).filter(
        p => !connectedPlatforms.includes(p)
    );

    // ─────────────────────────────────────────────────────────────────────────

    return (
        <div className="container mx-auto px-4 py-8 min-h-screen bg-background text-foreground max-w-7xl">

            {/* Header */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 gap-4">
                <div>
                    <div className="flex items-center gap-2 mb-1">
                        <div className="w-6 h-6 bg-primary rounded flex items-center justify-center">
                            <Rocket className="w-3.5 h-3.5 text-primary-foreground" />
                        </div>
                        <span className="text-xs font-semibold uppercase tracking-widest text-primary">StoryWeave Publisher</span>
                    </div>
                    <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                        Publishing Hub
                    </h1>
                    <p className="text-muted-foreground text-sm mt-0.5">Schedule and publish your renders to all platforms</p>
                </div>

                <div className="flex items-center gap-2">
                    {prefillVideoUrl && (
                        <Badge variant="outline" className="text-green-400 border-green-500/30 gap-1">
                            <Link2 className="w-3 h-3" />
                            Video ready to publish
                        </Badge>
                    )}
                    <Button
                        onClick={() => setComposerOpen(true)}
                        disabled={connectedPlatforms.length === 0}
                        className="gap-2"
                    >
                        <Plus className="w-4 h-4" />
                        New Post
                    </Button>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">

                {/* ── Left column: Accounts + Stats ────────────────────────── */}
                <div className="space-y-5">

                    {/* Connected Accounts */}
                    <Card className="p-5 glass border-primary/20">
                        <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">
                            Connected Accounts
                        </h3>
                        <div className="space-y-2">
                            {accountsLoading && (
                                <div className="text-sm text-muted-foreground animate-pulse py-2">Loading accounts…</div>
                            )}

                            {accounts.map(account => (
                                <ConnectAccountCard
                                    key={account.id}
                                    account={account}
                                    onDisconnect={p => disconnectMutation.mutate(p)}
                                />
                            ))}

                            {unconnectedPlatforms.map(platform => (
                                <PlatformConnectButton
                                    key={platform}
                                    platform={platform}
                                    onConnect={handleConnect}
                                />
                            ))}

                            {connectingPlatform && (
                                <div className="flex items-center gap-2 text-sm text-muted-foreground py-1">
                                    <RefreshCw className="w-4 h-4 animate-spin text-primary" />
                                    Connecting {PLATFORM_META[connectingPlatform].label}…
                                </div>
                            )}
                        </div>
                    </Card>

                    {/* Quick stats */}
                    {accounts.length > 0 && (
                        <Card className="p-5 glass">
                            <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-3">Overview</h3>
                            <div className="space-y-3 text-sm">
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Scheduled</span>
                                    <span className="font-semibold">{posts.filter(p => p.status === "scheduled").length}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Published</span>
                                    <span className="font-semibold text-green-400">{posts.filter(p => p.status === "published").length}</span>
                                </div>
                                <div className="flex justify-between">
                                    <span className="text-muted-foreground">Failed</span>
                                    <span className="font-semibold text-red-400">{posts.filter(p => p.status === "failed").length}</span>
                                </div>
                                <div className="flex justify-between pt-2 border-t border-border/50">
                                    <span className="text-muted-foreground">Platforms active</span>
                                    <span className="font-semibold text-primary">{accounts.length}</span>
                                </div>
                            </div>
                        </Card>
                    )}

                    {/* No accounts CTA */}
                    {!accountsLoading && accounts.length === 0 && (
                        <Card className="p-5 glass border-dashed border-primary/30 text-center">
                            <Link2 className="w-8 h-8 mx-auto mb-2 text-muted-foreground opacity-50" />
                            <p className="text-sm text-muted-foreground">Connect a platform above to start publishing your StoryWeave videos.</p>
                        </Card>
                    )}
                </div>

                {/* ── Right column: Posts feed ──────────────────────────────── */}
                <div className="lg:col-span-2">
                    <div className="flex items-center justify-between mb-4">
                        <Tabs value={activeTab} onValueChange={v => setActiveTab(v as typeof activeTab)} className="w-full">
                            <div className="flex items-center justify-between mb-4">
                                <TabsList className="bg-white/5">
                                    <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
                                    <TabsTrigger value="published">Published</TabsTrigger>
                                    <TabsTrigger value="failed">Failed</TabsTrigger>
                                </TabsList>
                                <div className="flex gap-1">
                                    <Button variant={view === "list" ? "secondary" : "ghost"} size="icon" onClick={() => setView("list")}><List className="w-4 h-4" /></Button>
                                    <Button variant={view === "calendar" ? "secondary" : "ghost"} size="icon" onClick={() => setView("calendar")}><LayoutGrid className="w-4 h-4" /></Button>
                                </div>
                            </div>

                            <TabsContent value={activeTab} className="space-y-3 mt-0">
                                {postsLoading && (
                                    <div className="text-sm text-muted-foreground py-8 text-center animate-pulse">Loading posts…</div>
                                )}

                                {!postsLoading && posts.length === 0 && (
                                    <div
                                        className="p-10 border-2 border-dashed border-white/10 rounded-xl text-center text-muted-foreground hover:bg-white/5 transition-all cursor-pointer"
                                        onClick={() => connectedPlatforms.length > 0 && setComposerOpen(true)}
                                    >
                                        <Calendar className="w-8 h-8 mx-auto mb-2 opacity-40" />
                                        <p className="font-medium">No {activeTab} posts</p>
                                        {connectedPlatforms.length > 0 && (
                                            <p className="text-sm mt-1">Click <span className="text-primary">+ New Post</span> to schedule your first one</p>
                                        )}
                                    </div>
                                )}

                                {posts.map(post => (
                                    <PostCard
                                        key={post.id}
                                        post={post}
                                        onCancel={id => cancelPostMutation.mutate(id)}
                                        onRetry={id => retryPostMutation.mutate(id)}
                                    />
                                ))}
                            </TabsContent>
                        </Tabs>
                    </div>
                </div>
            </div>

            {/* Post Composer Dialog */}
            <PostComposer
                open={composerOpen}
                onClose={() => setComposerOpen(false)}
                connectedPlatforms={connectedPlatforms}
                prefillVideoUrl={prefillVideoUrl}
                onScheduled={() => {
                    queryClient.invalidateQueries({ queryKey: ["scheduled-posts"] });
                    // Clear the prefill param after scheduling
                    if (prefillVideoUrl) setSearchParams(new URLSearchParams());
                }}
            />
        </div>
    );
};

export default AutoPilot;
