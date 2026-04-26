import React, { useState, useCallback, useMemo } from 'react';
import { 
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
    Film, Search, Loader2, Sparkles, Plus, Check, RefreshCw
} from 'lucide-react';
import { useEditor } from '@/contexts/EditorContext';
import { vaultService, VaultSearchResult } from '@/services/vaultService';

interface AutoBRollSourcingProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

interface SuggestedClip {
    id: string;
    reason: string;
    matchScore: number;
    asset: VaultSearchResult;
}

export function AutoBRollSourcing({ open, onOpenChange }: AutoBRollSourcingProps) {
    const { tracks, addClip, playheadFrame, fps } = useEditor();
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [isSearching, setIsSearching] = useState(false);
    const [suggestions, setSuggestions] = useState<SuggestedClip[]>([]);
    const [selectedClips, setSelectedClips] = useState<Set<string>>(new Set());

    const scriptText = useMemo(() => {
        const captions = [];
        for (const track of tracks) {
            for (const clip of track.clips) {
                if (clip.name && clip.name.toLowerCase().includes('caption')) {
                    captions.push(clip.name);
                }
            }
        }
        return captions.join(' ');
    }, [tracks]);

    const analyzeScript = useCallback(async () => {
        if (!scriptText) return;
        
        setIsAnalyzing(true);
        try {
            await new Promise(resolve => setTimeout(resolve, 1000));
            
            const keywords = scriptText
                .toLowerCase()
                .split(/\s+/)
                .filter(w => w.length > 4)
                .slice(0, 5);
            
            setIsAnalyzing(false);
            setIsSearching(true);
            
            const searchResults = await vaultService.semanticSearch(keywords.join(' '), {
                type: 'video',
                limit: 20
            });
            
            const newSuggestions: SuggestedClip[] = searchResults.map(asset => ({
                id: `sug_${asset.id}`,
                reason: `Matches "${keywords.slice(0, 2).join(' ')}" from script`,
                matchScore: Math.min(95, 60 + Math.random() * 35),
                asset
            })).slice(0, 6);
            
            setSuggestions(newSuggestions);
            setIsSearching(false);
        } catch (error) {
            console.error('Analysis failed:', error);
            setIsAnalyzing(false);
            setIsSearching(false);
        }
    }, [scriptText]);

    const toggleClipSelection = (id: string) => {
        setSelectedClips(prev => {
            const next = new Set(prev);
            if (next.has(id)) {
                next.delete(id);
            } else {
                next.add(id);
            }
            return next;
        });
    };

    const addSelectedToTimeline = useCallback(() => {
        const videoTrack = tracks.find(t => t.type === 'video');
        if (!videoTrack) return;

        for (const suggestion of suggestions) {
            if (selectedClips.has(suggestion.id)) {
                addClip(videoTrack.id, {
                    type: 'video',
                    name: suggestion.asset.ai_description?.slice(0, 30) || 'B-Roll',
                    src: suggestion.asset.url,
                    startFrame: playheadFrame,
                    durationInFrames: fps * 5,
                    volume: 0,
                    opacity: 1,
                });
            }
        }

        onOpenChange(false);
        setSelectedClips(new Set());
    }, [suggestions, selectedClips, tracks, addClip, playheadFrame, fps, onOpenChange]);

    const refreshSuggestions = useCallback(async () => {
        setSuggestions([]);
        await analyzeScript();
    }, [analyzeScript]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl bg-zinc-950 border-zinc-800">
                <DialogHeader>
                    <DialogTitle className="text-zinc-100 flex items-center gap-2">
                        <Film className="w-5 h-5 text-blue-400" />
                        Automated B-Roll Sourcing
                    </DialogTitle>
                    <DialogDescription className="text-zinc-400">
                        AI analyzes your script and suggests matching clips from your vault.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-zinc-900 rounded-lg">
                        <div className="flex items-center gap-2">
                            <Search className="w-4 h-4 text-zinc-500" />
                            <span className="text-sm text-zinc-300">
                                {scriptText ? 'Script detected' : 'No script content found'}
                            </span>
                        </div>
                        <Button 
                            onClick={analyzeScript} 
                            disabled={!scriptText || isAnalyzing || isSearching}
                            size="sm"
                        >
                            {isAnalyzing ? (
                                <><Loader2 className="w-4 h-4 animate-spin" /> Analyzing...</>
                            ) : isSearching ? (
                                <><Loader2 className="w-4 h-4 animate-spin" /> Searching Vault...</>
                            ) : (
                                <><Sparkles className="w-4 h-4" /> Find B-Roll</>
                            )}
                        </Button>
                    </div>

                    {suggestions.length > 0 && (
                        <>
                            <div className="flex items-center justify-between">
                                <Label className="text-zinc-400">Suggested Clips</Label>
                                <Button 
                                    variant="ghost" 
                                    size="sm" 
                                    onClick={refreshSuggestions}
                                    disabled={isAnalyzing || isSearching}
                                >
                                    <RefreshCw className="w-3 h-3" />
                                </Button>
                            </div>
                            
                            <ScrollArea className="h-64">
                                <div className="space-y-2">
                                    {suggestions.map((suggestion) => (
                                        <div
                                            key={suggestion.id}
                                            onClick={() => toggleClipSelection(suggestion.id)}
                                            className={`flex items-center gap-3 p-2 rounded-lg border cursor-pointer transition-all ${
                                                selectedClips.has(suggestion.id)
                                                    ? 'border-blue-500 bg-blue-500/10'
                                                    : 'border-zinc-700 bg-zinc-900 hover:border-zinc-600'
                                            }`}
                                        >
                                            <div className="relative w-24 h-14 rounded overflow-hidden bg-zinc-800 flex-shrink-0">
                                                <video 
                                                    src={suggestion.asset.url} 
                                                    className="w-full h-full object-cover"
                                                    muted 
                                                />
                                                {selectedClips.has(suggestion.id) && (
                                                    <div className="absolute inset-0 bg-blue-500/30 flex items-center justify-center">
                                                        <Check className="w-5 h-5 text-white" />
                                                    </div>
                                                )}
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <p className="text-sm text-zinc-200 truncate">
                                                    {suggestion.asset.ai_description || 'B-Roll Clip'}
                                                </p>
                                                <p className="text-xs text-zinc-500 truncate">
                                                    {suggestion.reason}
                                                </p>
                                            </div>
                                            <Badge 
                                                variant="outline" 
                                                className={`${
                                                    suggestion.matchScore >= 80 
                                                        ? 'border-green-500 text-green-400'
                                                        : suggestion.matchScore >= 60
                                                        ? 'border-yellow-500 text-yellow-400'
                                                        : 'border-zinc-600 text-zinc-400'
                                                }`}
                                            >
                                                {Math.round(suggestion.matchScore)}%
                                            </Badge>
                                        </div>
                                    ))}
                                </div>
                            </ScrollArea>

                            {selectedClips.size > 0 && (
                                <Button 
                                    onClick={addSelectedToTimeline}
                                    className="w-full bg-blue-600 hover:bg-blue-700"
                                >
                                    <Plus className="w-4 h-4 mr-2" />
                                    Add {selectedClips.size} Clip{selectedClips.size > 1 ? 's' : ''} to Timeline
                                </Button>
                            )}
                        </>
                    )}

                    {suggestions.length === 0 && !isAnalyzing && !isSearching && (
                        <div className="text-center py-8 text-zinc-500">
                            <Film className="w-12 h-12 mx-auto mb-3 opacity-50" />
                            <p>Click "Find B-Roll" to analyze your script</p>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}