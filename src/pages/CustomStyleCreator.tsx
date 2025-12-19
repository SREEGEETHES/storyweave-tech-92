import { useState } from "react";
import { ArrowLeft, Upload, Wand2, X, Video } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { useUser } from "@/contexts/UserContext";

const CustomStyleCreator = () => {
  const navigate = useNavigate();
  const { user } = useUser();
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    referenceVideo: null as File | null
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
      setFormData({ ...formData, referenceVideo: file });
    }
  };

  const handleGenerateStyle = async () => {
    if (!formData.name.trim()) {
      toast.error("Please enter a style name");
      return;
    }
    if (!formData.referenceVideo) {
      toast.error("Please upload a reference video");
      return;
    }

    setIsUploading(true);
    try {
      // Upload video to Supabase Storage
      const fileExt = formData.referenceVideo.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const { data, error } = await supabase.storage
        .from('style_references')
        .upload(fileName, formData.referenceVideo);

      if (error) throw error;

      setIsGenerating(true);
      // Call AI Analysis Function
      const { data: analysisData, error: analysisError } = await supabase.functions.invoke('analyze-video-style', {
        body: {
          styleName: formData.name,
          description: formData.description,
          referenceVideoUrl: data.path, // Path to the uploaded video in storage
          referenceVideoPublicUrl: supabase.storage.from('style_references').getPublicUrl(data.path).data.publicUrl
        }
      });

      if (analysisError) throw analysisError;

      setGeneratedStyle({
        name: formData.name,
        description: formData.description || analysisData.mood || "AI Analyzed Style",
        videoUrl: data.path,
        analysis: analysisData // Store the full analysis
      });

      setIsGenerating(false);
      toast.success("Style analyzed successfully!");

    } catch (error: any) {
      toast.error("Upload failed: " + error.message);
    } finally {
      setIsUploading(false);
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
          config: generatedStyle?.analysis || {}, // Save the analyzed style profile here
          user_id: user.id
        });

      if (error) throw error;

      toast.success("Style saved to My Styles!");
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
              <h1 className="text-2xl font-bold">New style</h1>
            </div>
            <Button
              onClick={handleSaveStyle}
              className="bg-green-500 hover:bg-green-600 text-white"
            >
              Create style
            </Button>
          </div>

          {/* Generated Style Preview */}
          <div className="space-y-6">
            {/* Style Preview */}
            <Card>
              <CardContent className="p-6">
                <div className="aspect-video bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg flex items-center justify-center mb-4 relative">
                  <div className="text-white text-6xl font-bold opacity-20">
                    {formData.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="absolute bottom-4 left-4 bg-black/50 text-white px-3 py-1 rounded text-sm">
                    Style Preview
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="absolute top-4 right-4 text-white hover:bg-white/20"
                    onClick={() => setGeneratedStyle(null)}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Style Details */}
            <Card>
              <CardContent className="p-6 space-y-4">
                <div>
                  <Label className="text-sm text-muted-foreground">Name (required)</Label>
                  <Input
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label className="text-sm text-muted-foreground">Description</Label>
                  <Textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe the style characteristics..."
                    className="mt-1 min-h-[100px]"
                  />
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
            <h1 className="text-2xl font-bold">New style</h1>
          </div>
          <div className="text-sm text-muted-foreground bg-muted px-3 py-1 rounded">
            Create style
          </div>
        </div>

        {/* Upload Section */}
        <Card className="mb-6">
          <CardContent className="p-6">
            <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-12 text-center">
              <div className="flex flex-col items-center space-y-4">
                <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">
                  <Upload className="h-6 w-6 text-muted-foreground" />
                </div>
                <div>
                  <p className="text-muted-foreground mb-2">Upload a reference video (MP4, MOV)</p>
                  <input
                    type="file"
                    accept="video/*"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-upload"
                  />
                  <Label
                    htmlFor="file-upload"
                    className="text-primary hover:text-primary/80 cursor-pointer"
                  >
                    Choose video
                  </Label>
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

        {/* Form Fields */}
        <Card className="mb-6">
          <CardContent className="p-6 space-y-6">
            <div>
              <Label htmlFor="name">Name (required)</Label>
              <Input
                id="name"
                placeholder="Name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                placeholder="Describe the style you want"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="mt-1 min-h-[120px]"
              />
            </div>
          </CardContent>
        </Card>

        {/* Generate Button */}
        <Button
          onClick={handleGenerateStyle}
          disabled={isGenerating || isUploading || !formData.name.trim()}
          className="w-full h-12 text-lg"
        >
          {isUploading ? (
            <>
              <Upload className="h-5 w-5 mr-2 animate-bounce" />
              Uploading video...
            </>
          ) : isGenerating ? (
            <>
              <Wand2 className="h-5 w-5 mr-2 animate-pulse" />
              Analyzing style...
            </>
          ) : (
            <>
              <Wand2 className="h-5 w-5 mr-2" />
              Generate style
            </>
          )}
        </Button>
      </div>
    </div>
  );
};

export default CustomStyleCreator;