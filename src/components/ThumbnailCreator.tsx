import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Sparkles, Upload, Image as ImageIcon, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface ThumbnailCreatorProps {
    videoId: string;
    videoTitle: string;
    onThumbnailCreated: (url: string) => void;
}

const ThumbnailCreator = ({ videoId, videoTitle, onThumbnailCreated }: ThumbnailCreatorProps) => {
    const [isOpen, setIsOpen] = useState(false);
    const [isGenerating, setIsGenerating] = useState(false);
    const [isUploading, setIsUploading] = useState(false);
    const [prompt, setPrompt] = useState(`High quality thumbnail for a video titled: ${videoTitle}`);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);

    const handleGenerateAI = async () => {
        setIsGenerating(true);
        try {
            // Simulation: calling a future generate-thumbnail edge function
            const { data, error } = await supabase.functions.invoke('generate-visuals', {
                body: { prompt: prompt + ", cinematic, highly detailed, vibrant colors, 16:9 aspect ratio", frameSize: "16:9" }
            });

            if (error) throw error;
            setPreviewUrl(data.url);
            toast.success("AI Thumbnail generated!");
        } catch (error: any) {
            toast.error("Generation failed: " + error.message);
        } finally {
            setIsGenerating(false);
        }
    };

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        setIsUploading(true);
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${videoId}_thumbnail_${Date.now()}.${fileExt}`;
            const { data, error } = await supabase.storage
                .from('thumbnails') // Assuming this bucket exists or will be created
                .upload(fileName, file);

            if (error) throw error;

            const publicUrl = supabase.storage.from('thumbnails').getPublicUrl(data.path).data.publicUrl;
            setPreviewUrl(publicUrl);
            toast.success("Thumbnail uploaded!");
        } catch (error: any) {
            toast.error("Upload failed: " + error.message);
        } finally {
            setIsUploading(false);
        }
    };

    const handleApplyThumbnail = async () => {
        if (!previewUrl) return;

        try {
            const { error } = await supabase
                .from('generations')
                .update({ thumbnail_url: previewUrl })
                .eq('id', videoId);

            if (error) throw error;

            onThumbnailCreated(previewUrl);
            setIsOpen(false);
            toast.success("Thumbnail updated successfully!");
        } catch (error: any) {
            toast.error("Failed to update: " + error.message);
        }
    };

    return (
        <Dialog open={isOpen} onOpenChange={setIsOpen}>
            <DialogTrigger asChild>
                <Button size="sm" variant="outline" className="gap-2">
                    <ImageIcon className="w-4 h-4" />
                    Thumbnail
                </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px] glass">
                <DialogHeader>
                    <DialogTitle>Create Video Thumbnail</DialogTitle>
                </DialogHeader>

                <div className="space-y-6 py-4">
                    {/* Preview Area */}
                    <div className="aspect-video bg-muted rounded-xl overflow-hidden border border-white/10 relative">
                        {previewUrl ? (
                            <img src={previewUrl} alt="Preview" className="w-full h-full object-cover" />
                        ) : (
                            <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                                <ImageIcon className="w-12 h-12 mb-2 opacity-20" />
                                <p className="text-xs">No thumbnail yet</p>
                            </div>
                        )}
                        {(isGenerating || isUploading) && (
                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                <Loader2 className="w-8 h-8 text-primary animate-spin" />
                            </div>
                        )}
                    </div>

                    {/* AI Generation */}
                    <div className="space-y-2">
                        <Label>AI Generation Prompt</Label>
                        <div className="flex gap-2">
                            <Input
                                value={prompt}
                                onChange={(e) => setPrompt(e.target.value)}
                                placeholder="Describe your thumbnail..."
                            />
                            <Button onClick={handleGenerateAI} disabled={isGenerating || isUploading} className="shrink-0">
                                <Sparkles className="w-4 h-4" />
                            </Button>
                        </div>
                    </div>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center">
                            <div className="w-full border-t border-white/10"></div>
                        </div>
                        <span className="relative bg-background px-2 text-xs text-muted-foreground flex justify-center">OR</span>
                    </div>

                    {/* Manual Upload */}
                    <div className="flex justify-center">
                        <input
                            type="file"
                            id="thumb-upload"
                            className="hidden"
                            accept="image/*"
                            onChange={handleFileUpload}
                        />
                        <Label
                            htmlFor="thumb-upload"
                            className="cursor-pointer inline-flex items-center gap-2 text-sm font-medium text-primary hover:opacity-80 transition-opacity"
                        >
                            <Upload className="w-4 h-4" />
                            Upload from Device
                        </Label>
                    </div>

                    <Button
                        className="w-full bg-gradient-premium"
                        disabled={!previewUrl || isGenerating || isUploading}
                        onClick={handleApplyThumbnail}
                    >
                        Apply This Thumbnail
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
};

export default ThumbnailCreator;
