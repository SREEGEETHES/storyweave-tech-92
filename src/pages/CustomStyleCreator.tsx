import { useState } from "react";
import { ArrowLeft, Upload, Wand2, X, Video, Palette, Settings2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useUser } from "@/contexts/UserContext";

const CustomStyleCreator = () => {
  const navigate = useNavigate();
  const { user } = useUser();
  const [activeTab, setActiveTab] = useState<"clone" | "manual">("clone");
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    referenceVideo: null as File | null,
    youtubeUrl: ""
  });
  const [manualConfig, setManualConfig] = useState({
    fontName: "Inter",
    primaryColor: "#6366f1",
    cutFrequency: "medium"
  });
  const [generatedStyle, setGeneratedStyle] = useState<any>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!file.type.startsWith('video/')) {
        toast.error("Please upload a video file");
        return;
      }
      setFormData({ ...formData, referenceVideo: file, youtubeUrl: "" });
    }
  };

  const handleGenerateStyle = async () => {
    if (!formData.name.trim()) {
      toast.error("Please enter a style name");
      return;
    }
    if (!formData.referenceVideo && !formData.youtubeUrl.trim()) {
      toast.error("Please provide a reference video or a YouTube URL");
      return;
    }

    let videoPath = null;
    let publicUrl = null;

    try {
      if (formData.referenceVideo) {
        setIsUploading(true);
        const fileExt = formData.referenceVideo.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const { data, error } = await supabase.storage
          .from('style_references')
          .upload(fileName, formData.referenceVideo);

        if (error) throw error;
        videoPath = data.path;
        publicUrl = supabase.storage.from('style_references').getPublicUrl(data.path).data.publicUrl;
        setIsUploading(false);
      }

      setIsGenerating(true);
      // Call AI Analysis Function
      const { data: analysisData, error: analysisError } = await supabase.functions.invoke('analyze-video-style', {
        body: {
          styleName: formData.name,
          description: formData.description,
          referenceVideoUrl: videoPath,
          referenceVideoPublicUrl: publicUrl,
          youtubeUrl: formData.youtubeUrl
        }
      });

      if (analysisError) {
        console.warn("Analysis Edge Function failed (likely missing API keys), using local simulation:", analysisError);
        // Local simulation fallback
        const mockData = {
          visual_prompt_suffix: "cinematic, highly detailed, masterwork, 4k",
          lighting: "Dramatic high-contrast lighting",
          camera: "Handheld dynamic motion",
          color_palette: "Warm cinematic tones",
          mood: "Energetic and professional",
          shot_logic: "Fast cuts matching the beat",
          dna: {
            shots: [
              { start: "0s", end: "3s", label: "Wide Establishing Shot" },
              { start: "3s", end: "7s", label: "Medium Action Shot" },
              { start: "7s", end: "10s", label: "Close-up Reaction" }
            ]
          }
        };

        setGeneratedStyle({
          name: formData.name,
          description: formData.description || "Simulated Style",
          videoUrl: videoPath,
          dna: mockData.dna,
          analysis: mockData
        });
        toast.info("Using Local Simulation (API keys not found)");
      } else {
        setGeneratedStyle({
          name: formData.name,
          description: formData.description || analysisData.mood || "AI Analyzed Style",
          videoUrl: videoPath,
          dna: analysisData.dna,
          analysis: analysisData // Store the full analysis
        });
        toast.success("Style DNA Analyzed Successfully!");
      }

      setIsGenerating(false);

    } catch (error: any) {
      toast.error("Process failed: " + error.message);
      setIsUploading(false);
      setIsGenerating(false);
    }
  };

  const handleSaveStyle = async () => {
    if (!user) {
      toast.error("You must be logged in to save a style.");
      return;
    }

    try {
      const { error } = await supabase
        .from('styles')
        .insert({
          name: formData.name,
          description: formData.description,
          reference_video_path: generatedStyle?.videoUrl,
          config: generatedStyle?.analysis || {},
          user_id: user.id
        });

      if (error) throw error;

      toast.success("Style DNA saved to your library!");
      navigate('/features#idea-to-video');
    } catch (error: any) {
      toast.error("Failed to save style: " + error.message);
    }
  };

  const handleSaveManualStyle = async () => {
    if (!user) {
      toast.error("You must be logged in to save a style.");
      return;
    }

    try {
      const config = {
        manual: true,
        font: manualConfig.fontName,
        primaryColor: manualConfig.primaryColor,
        cutFrequency: manualConfig.cutFrequency
      };

      const { error } = await supabase
        .from('styles')
        .insert({
          name: formData.name,
          description: formData.description,
          config,
          user_id: user.id
        });

      if (error) throw error;

      toast.success("Style saved!");
      navigate('/features#idea-to-video');
    } catch (error: any) {
      toast.error("Failed to save style: " + error.message);
    }
  };

  if (generatedStyle) {
    return (
      <div className="min-h-screen bg-background p-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setGeneratedStyle(null)}
              >
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <h1 className="text-2xl font-bold">Style DNA Profile</h1>
            </div>
            <Button
              onClick={handleSaveStyle}
              className="bg-primary hover:opacity-90 text-white"
            >
              Save Style DNA
            </Button>
          </div>

          {/* Generated Style Preview */}
          <div className="grid md:grid-cols-2 gap-6">
            <Card className="glass">
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">DNA Visualization</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="aspect-video bg-gradient-to-br from-primary/20 to-accent/20 rounded-xl flex items-center justify-center mb-4 relative overflow-hidden group">
                  <Wand2 className="w-16 h-16 text-primary animate-pulse" />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <p className="text-white text-sm font-medium">Style Ref: {formData.name}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass">
              <CardHeader>
                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wider">Analysis Highlights</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                    <p className="text-[10px] text-muted-foreground uppercase">Lighting</p>
                    <p className="text-sm font-medium truncate">{generatedStyle.analysis.lighting}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                    <p className="text-[10px] text-muted-foreground uppercase">Camera</p>
                    <p className="text-sm font-medium truncate">{generatedStyle.analysis.camera}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                    <p className="text-[10px] text-muted-foreground uppercase">Palette</p>
                    <p className="text-sm font-medium truncate">{generatedStyle.analysis.color_palette}</p>
                  </div>
                  <div className="p-3 rounded-lg bg-white/5 border border-white/10">
                    <p className="text-[10px] text-muted-foreground uppercase">Mood</p>
                    <p className="text-sm font-medium truncate">{generatedStyle.analysis.mood}</p>
                  </div>
                </div>
                <div className="pt-2 border-t border-white/10">
                  <p className="text-[10px] text-muted-foreground uppercase">Shot Detection</p>
                  <div className="mt-2 space-y-1">
                    {generatedStyle.dna.shots.slice(0, 3).map((shot: any, i: number) => (
                      <div key={i} className="flex items-center gap-2 text-[11px] text-muted-foreground">
                        <span className="text-primary font-mono">{shot.start}</span>
                        <span>{shot.label}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background p-4">
      <div className="max-w-2xl mx-auto">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/features#idea-to-video')}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <h1 className="text-2xl font-bold">Create Style</h1>
          </div>
        </div>

        {/* Mode Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as typeof activeTab)} className="space-y-4 mb-6">
          <TabsList className="grid grid-cols-2 w-full max-w-md">
            <TabsTrigger value="clone" className="gap-2">
              <Palette className="w-4 h-4" />
              Clone from Video
            </TabsTrigger>
            <TabsTrigger value="manual" className="gap-2">
              <Settings2 className="w-4 h-4" />
              Manual Config
            </TabsTrigger>
          </TabsList>

          {/* Clone Tab */}
          <TabsContent value="clone">
            <Card className="glass">
              <CardContent className="p-6 space-y-6">
                <Label htmlFor="youtube">YouTube URL</Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    id="youtube"
                    placeholder="https://youtube.com/watch?v=..."
                    value={formData.youtubeUrl}
                    onChange={(e) => setFormData({ ...formData, youtubeUrl: e.target.value, referenceVideo: null })}
                  />
                </div>
                <div className="relative my-6 text-center">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-white/10"></div>
                  </div>
                  <span className="relative bg-background px-2 text-xs text-muted-foreground">OR</span>
                </div>
                <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center bg-white/5">
                  <div className="flex flex-col items-center space-y-4">
                    <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                      <Upload className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div>
                      <input
                        type="file"
                        accept="video/*"
                        onChange={handleFileUpload}
                        className="hidden"
                        id="file-upload"
                      />
                      <Label
                        htmlFor="file-upload"
                        className="text-primary hover:text-primary/80 cursor-pointer text-sm"
                      >
                        Upload a local video
                      </Label>
                      <p className="text-[10px] text-muted-foreground mt-1">MP4, MOV up to 50MB</p>
                    </div>
                    {formData.referenceVideo && (
                      <p className="text-sm text-primary flex items-center gap-2">
                        <Video className="w-4 h-4" />
                        {formData.referenceVideo.name}
                      </p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Manual Tab */}
          <TabsContent value="manual">
            <Card className="glass">
              <CardContent className="p-6 space-y-6">
                <div>
                  <Label>Style Name</Label>
                  <Input
                    placeholder="My Custom Style"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label>Typography Font</Label>
                  <Input
                    placeholder="e.g., Inter, Roboto, Playfair Display"
                    value={manualConfig.fontName}
                    onChange={(e) => setManualConfig({ ...manualConfig, fontName: e.target.value })}
                    className="mt-2"
                  />
                </div>

                <div>
                  <Label>Primary Color</Label>
                  <div className="flex items-center gap-4 mt-2">
                    <input
                      type="color"
                      value={manualConfig.primaryColor}
                      onChange={(e) => setManualConfig({ ...manualConfig, primaryColor: e.target.value })}
                      className="w-16 h-10 rounded border cursor-pointer"
                    />
                    <Input
                      value={manualConfig.primaryColor}
                      onChange={(e) => setManualConfig({ ...manualConfig, primaryColor: e.target.value })}
                      className="flex-1"
                    />
                  </div>
                </div>

                <div>
                  <Label>Cut Frequency / Pacing</Label>
                  <div className="grid grid-cols-3 gap-2 mt-2">
                    {["fast", "medium", "slow"].map((freq) => (
                      <button
                        key={freq}
                        type="button"
                        onClick={() => setManualConfig({ ...manualConfig, cutFrequency: freq })}
                        className={`p-3 rounded-lg border text-sm font-medium capitalize transition-all ${
                          manualConfig.cutFrequency === freq
                            ? "border-primary bg-primary/10 text-primary"
                            : "border-border text-muted-foreground hover:border-primary/50"
                        }`}
                      >
                        {freq}
                      </button>
                    ))}
                  </div>
                </div>

<div>
                  <Label>Style Name</Label>
                  <Input
                    placeholder="My Custom Style"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value})}
                  />
                </div>

                <div>
                  <Label>Description</Label>
                  <Textarea
                    placeholder="Describe your style..."
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value})}
                  />
                </div>

{(generatedStyle || activeTab === "clone") && (
                  <Button
                    onClick={handleSaveStyle}
                    disabled={!generatedStyle || !formData.name.trim()}
                    className="w-full"
                  >
                    <Wand2 className="w-4 h-4 mr-2" />
                    Save Style DNA
                  </Button>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default CustomStyleCreator;