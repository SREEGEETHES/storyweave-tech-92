import React, { useState, useCallback } from 'react';
import { 
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription 
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { 
    Sparkles, RefreshCw, Check, Copy, ArrowRight, Loader2, Wand2
} from 'lucide-react';
import { aiService } from '@/services/aiService';
import { useVideoState } from '@/contexts/VideoStateContext';

interface VariationEngineProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

interface Variation {
    id: string;
    script: string;
    visualPrompts: string[];
    selected: boolean;
}

export function VariationEngine({ open, onOpenChange }: VariationEngineProps) {
    const { setVideoState } = useVideoState();
    const [topic, setTopic] = useState('');
    const [variations, setVariations] = useState<Variation[]>([]);
    const [isGenerating, setIsGenerating] = useState(false);
    const [selectedVariationId, setSelectedVariationId] = useState<string | null>(null);

    const generateVariations = useCallback(async () => {
        if (!topic.trim()) return;
        
        setIsGenerating(true);
        try {
            const scriptSegments = await aiService.generateScript(topic);
            
            const newVariations: Variation[] = Array.from({ length: 3 }).map((_, i) => ({
                id: `var_${Date.now()}_${i}`,
                script: scriptSegments.map(s => s.text).join('\n\n'),
                visualPrompts: scriptSegments.map(s => s.visualPrompt),
                selected: i === 0
            }));
            
            setVariations(newVariations);
            setSelectedVariationId(newVariations[0].id);
        } catch (error) {
            console.error('Error generating variations:', error);
        } finally {
            setIsGenerating(false);
        }
    }, [topic]);

    const selectVariation = (id: string) => {
        setVariations(prev => prev.map(v => ({
            ...v,
            selected: v.id === id
        })));
        setSelectedVariationId(id);
    };

    const remixVariation = useCallback(async () => {
        const selected = variations.find(v => v.id === selectedVariationId);
        if (!selected) return;
        
        setIsGenerating(true);
        try {
            const remixPrompt = `Remix: ${selected.script.slice(0, 100)}`;
            const newSegments = await aiService.generateScript(remixPrompt);
            
            const remixVariation: Variation = {
                id: `var_${Date.now()}`,
                script: newSegments.map(s => s.text).join('\n\n'),
                visualPrompts: newSegments.map(s => s.visualPrompt),
                selected: true
            };
            
            setVariations(prev => prev.map(v => ({ ...v, selected: false })).concat(remixVariation));
            setSelectedVariationId(remixVariation.id);
        } catch (error) {
            console.error('Remix failed:', error);
        } finally {
            setIsGenerating(false);
        }
    }, [variations, selectedVariationId]);

    const applyVariation = useCallback(() => {
        const selected = variations.find(v => v.id === selectedVariationId);
        if (!selected) return;
        
        console.log('Applying variation:', selected);
        onOpenChange(false);
    }, [variations, selectedVariationId, onOpenChange]);

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl bg-zinc-950 border-zinc-800">
                <DialogHeader>
                    <DialogTitle className="text-zinc-100 flex items-center gap-2">
                        <Wand2 className="w-5 h-5 text-violet-400" />
                        Variation Engine
                    </DialogTitle>
                    <DialogDescription className="text-zinc-400">
                        Generate 3 AI variants and remix the best parts for your video.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4">
                    <div className="flex gap-2">
                        <div className="flex-1">
                            <Label className="text-zinc-400">Video Topic</Label>
                            <Input
                                placeholder="Enter your video topic..."
                                value={topic}
                                onChange={(e) => setTopic(e.target.value)}
                                onKeyDown={(e) => e.key === 'Enter' && generateVariations()}
                                className="bg-zinc-900 border-zinc-700 text-zinc-100"
                            />
                        </div>
                        <Button 
                            onClick={generateVariations} 
                            disabled={!topic.trim() || isGenerating}
                            className="mt-6"
                        >
                            {isGenerating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                            Generate
                        </Button>
                    </div>

                    {variations.length > 0 && (
                        <div className="space-y-3">
                            <Label className="text-zinc-400">Generated Variations</Label>
                            {variations.map((variation, index) => (
                                <div
                                    key={variation.id}
                                    onClick={() => selectVariation(variation.id)}
                                    className={`p-4 rounded-lg border cursor-pointer transition-all ${
                                        variation.id === selectedVariationId
                                            ? 'border-violet-500 bg-violet-500/10'
                                            : 'border-zinc-700 bg-zinc-900 hover:border-zinc-600'
                                    }`}
                                >
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-sm font-medium text-zinc-200">
                                            Variation {index + 1}
                                        </span>
                                        {variation.id === selectedVariationId && (
                                            <Check className="w-4 h-4 text-violet-400" />
                                        )}
                                    </div>
                                    <p className="text-xs text-zinc-400 line-clamp-3">
                                        {variation.script}
                                    </p>
                                </div>
                            ))}
                            
                            <div className="flex gap-2 pt-2">
                                <Button
                                    variant="outline"
                                    onClick={remixVariation}
                                    disabled={isGenerating}
                                    className="flex-1"
                                >
                                    <RefreshCw className="w-4 h-4 mr-2" />
                                    Remix Best Parts
                                </Button>
                                <Button
                                    onClick={applyVariation}
                                    className="flex-1 bg-violet-600 hover:bg-violet-700"
                                >
                                    Apply Variation
                                    <ArrowRight className="w-4 h-4 ml-2" />
                                </Button>
                            </div>
                        </div>
                    )}

                    {variations.length === 0 && !isGenerating && (
                        <div className="text-center py-8 text-zinc-500">
                            <Sparkles className="w-12 h-12 mx-auto mb-3 opacity-50" />
                            <p>Enter a topic to generate variations</p>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}