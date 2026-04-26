import React, { useState, useCallback } from 'react';
import { Search, Upload, X, Image, Film, Loader2, Sparkles, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { vaultService, VaultSearchResult } from '@/services/vaultService';
import { useEditor } from '@/contexts/EditorContext';
import { useVideoState } from '@/contexts/VideoStateContext';

interface VaultTerminalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export function VaultTerminal({ open, onOpenChange }: VaultTerminalProps) {
    const { addClip, tracks, playheadFrame, fps } = useEditor();
    const { videoState } = useVideoState();
    const [searchQuery, setSearchQuery] = useState('');
    const [results, setResults] = useState<VaultSearchResult[]>([]);
    const [isSearching, setIsSearching] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState<string | null>(null);
    const fileInputRef = React.useRef<HTMLInputElement>(null);

    const handleSearch = useCallback(async () => {
        if (!searchQuery.trim()) return;
        setIsSearching(true);
        try {
            const searchResults = await vaultService.semanticSearch(searchQuery, { limit: 50 });
            setResults(searchResults);
        } catch (error) {
            console.error('Search failed:', error);
        } finally {
            setIsSearching(false);
        }
    }, [searchQuery]);

    const handleFileUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
        const files = Array.from(e.target.files ?? []);
        for (const file of files) {
            setUploadProgress(`Analyzing ${file.name}...`);
            setIsUploading(true);

            const type = file.type.startsWith('image/gif') ? 'gif'
                : file.type.startsWith('video') ? 'video'
                : 'image';

            try {
                const asset = await vaultService.uploadAsset(file, {
                    type,
                    source: 'upload',
                    aiDescription: file.name.replace(/\.[^/.]+$/, ''),
                    tags: ['uploaded']
                });

                if (asset) {
                    setResults(prev => [{
                        id: asset.id,
                        url: asset.url,
                        type: asset.type,
                        ai_description: asset.ai_description,
                        tags: asset.tags,
                        source: asset.source,
                        similarity: 100
                    }, ...prev]);
                }
            } catch (error) {
                console.error('Upload failed:', error);
            } finally {
                setIsUploading(false);
                setUploadProgress(null);
            }
        }
        if (fileInputRef.current) {
            fileInputRef.current.value = '';
        }
    }, []);

    const addToTimeline = useCallback((item: VaultSearchResult) => {
        const targetTrack = tracks.find(t => t.type === 'video');
        if (!targetTrack) return;

        addClip(targetTrack.id, {
            type: 'video',
            name: item.ai_description?.slice(0, 30) || 'Vault Asset',
            src: item.url,
            startFrame: playheadFrame,
            durationInFrames: fps * 5,
            volume: 1,
            opacity: 1,
        });

        onOpenChange(false);
    }, [addClip, tracks, playheadFrame, fps, onOpenChange]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-3xl max-h-[80vh] bg-zinc-950 border-zinc-800">
                <DialogHeader>
                    <DialogTitle className="text-zinc-100 flex items-center gap-2">
                        <Tag className="w-5 h-5 text-violet-400" />
                        Media Vault Terminal
                    </DialogTitle>
                </DialogHeader>

                <div className="flex flex-col gap-4">
                    <div className="flex gap-2">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                            <Input
                                placeholder="Search your vault with natural language..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                                className="pl-10 bg-zinc-900 border-zinc-700 text-zinc-100"
                            />
                        </div>
                        <Button onClick={handleSearch} disabled={isSearching}>
                            {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Search'}
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isUploading}
                        >
                            {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                        </Button>
                        <input
                            ref={fileInputRef}
                            type="file"
                            multiple
                            accept="image/*,video/*"
                            className="hidden"
                            onChange={handleFileUpload}
                        />
                    </div>

                    {uploadProgress && (
                        <div className="text-sm text-violet-400 flex items-center gap-2">
                            <Sparkles className="w-4 h-4 animate-pulse" />
                            {uploadProgress}
                        </div>
                    )}

                    <div className="grid grid-cols-4 gap-3 max-h-96 overflow-y-auto p-1">
                        {results.map((item) => (
                            <div
                                key={item.id}
                                className="relative group rounded-lg overflow-hidden bg-zinc-900 border border-zinc-800 hover:border-violet-500 cursor-pointer transition-colors"
                                onClick={() => addToTimeline(item)}
                            >
                                {item.type === 'video' ? (
                                    <video src={item.url} className="w-full aspect-video object-cover" muted />
                                ) : (
                                    <img src={item.url} alt={item.ai_description} className="w-full aspect-video object-cover" />
                                )}
                                <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                    <span className="text-xs text-white font-medium">Add to Timeline</span>
                                </div>
                                <div className="absolute top-1 left-1">
                                    {item.type === 'video' ? (
                                        <Film className="w-3 h-3 text-blue-400" />
                                    ) : item.type === 'gif' ? (
                                        <span className="text-[10px] bg-pink-500 text-white px-1 rounded">GIF</span>
                                    ) : (
                                        <Image className="w-3 h-3 text-green-400" />
                                    )}
                                </div>
                                {item.tags && item.tags.length > 0 && (
                                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-1">
                                        <div className="flex flex-wrap gap-1">
                                            {item.tags.slice(0, 2).map((tag, i) => (
                                                <span key={i} className="text-[8px] text-zinc-300 bg-zinc-800/80 px-1 rounded">
                                                    {tag}
                                                </span>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        ))}
                    </div>

                    {results.length === 0 && !isSearching && (
                        <div className="text-center text-zinc-500 py-8">
                            <Tag className="w-12 h-12 mx-auto mb-3 opacity-50" />
                            <p>Your vault is empty</p>
                            <p className="text-sm">Upload media or search to get started</p>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}