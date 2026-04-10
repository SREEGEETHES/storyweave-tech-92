import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Wand2,
  Users,
  FileText,
  Edit3,
  Share2,
  Calendar,
  Upload,
  Video,
  Play,
  Download,
  Twitter,
  Facebook,
  Instagram,
  Youtube,
  Linkedin,
  MessageSquare,
  Globe,
  Hash,
  Info,
  Sparkles,
  Palette,
  Plus,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useUser } from "@/contexts/UserContext";
import ProfessionalTemplates from "@/components/ProfessionalTemplates";
import StyleDetailsModal from "@/components/StyleDetailsModal";
import { useUserStyles, useUserCharacters } from "@/hooks/useUserData";
import { supabase } from "@/integrations/supabase/client";

const CharactersList = () => {
  const { characters: savedCharacters, deleteCharacter } = useUserCharacters();
  const [selectedCharacter, setSelectedCharacter] = useState<any>(null);

  return (
    <div className="mt-12 text-center">
      <h3 className="text-2xl font-semibold mb-6">Your Characters</h3>
      {savedCharacters.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {savedCharacters.map((character: any) => (
            <Card
              key={character.id}
              className="glass hover:scale-105 transition-transform cursor-pointer"
              onClick={() => setSelectedCharacter(character)}
            >
              <CardContent className="p-4 text-center relative">
                <AlertDialog>
                  <AlertDialogTrigger asChild>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="absolute top-1 right-1 h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                      onClick={(e) => e.stopPropagation()}
                    >
                      ×
                    </Button>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Character</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete the character named "{character.name}"?
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={() => deleteCharacter(character.id)}
                        className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                      >
                        Delete
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
                <div className="w-16 h-16 rounded-full bg-gradient-to-r from-primary to-accent mx-auto mb-3 overflow-hidden">
                  {character.generatedImages?.[0] ? (
                    <img
                      src={character.generatedImages[0]}
                      alt={character.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Users className="w-8 h-8 text-white" />
                    </div>
                  )}
                </div>
                <p className="text-sm font-medium">{character.name}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-8">
          <Users className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <p className="text-muted-foreground">No saved characters yet. Create your first character!</p>
        </div>
      )}

      <Dialog open={!!selectedCharacter} onOpenChange={(open) => !open && setSelectedCharacter(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>{selectedCharacter?.name}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="w-full aspect-square rounded-lg overflow-hidden bg-muted relative">
              {selectedCharacter?.generatedImages?.[0] ? (
                <img
                  src={selectedCharacter.generatedImages[0]}
                  alt={selectedCharacter.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Users className="w-12 h-12 text-muted-foreground" />
                </div>
              )}
            </div>
            <div className="space-y-2">
              <h4 className="font-medium leading-none">Description</h4>
              <p className="text-sm text-muted-foreground">
                {selectedCharacter?.description || "No description provided."}
              </p>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const Features = () => {
  const navigate = useNavigate();
  const { user } = useUser();
  const [selectedVoice, setSelectedVoice] = useState("");
  const [selectedStyle, setSelectedStyle] = useState("realistic");
  const { styles: myStyles, deleteStyle } = useUserStyles();
  const { characters: myCharacters } = useUserCharacters();
  const [videoIdea, setVideoIdea] = useState("");
  const [duration, setDuration] = useState("");
  const [frameSize, setFrameSize] = useState("");
  const [selectedCharacterId, setSelectedCharacterId] = useState<string>("none");
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedStyleDetails, setSelectedStyleDetails] = useState(null);
  const [referenceFile, setReferenceFile] = useState<File | null>(null);
  const { toast } = useToast();
  useEffect(() => {
    const savedFormData = JSON.parse(localStorage.getItem('videoFormData') || '{}');
    if (savedFormData.videoIdea) setVideoIdea(savedFormData.videoIdea);
    if (savedFormData.duration) setDuration(savedFormData.duration);
    if (savedFormData.frameSize) setFrameSize(savedFormData.frameSize);
    if (savedFormData.selectedVoice) setSelectedVoice(savedFormData.selectedVoice);
    if (savedFormData.selectedStyle) setSelectedStyle(savedFormData.selectedStyle);
    if (savedFormData.selectedCharacterId) setSelectedCharacterId(savedFormData.selectedCharacterId);
  }, []);

  useEffect(() => {
    const formData = {
      videoIdea,
      duration,
      frameSize,
      selectedVoice,
      selectedStyle,
      selectedCharacterId
    };
    localStorage.setItem('videoFormData', JSON.stringify(formData));
  }, [videoIdea, duration, frameSize, selectedVoice, selectedStyle, selectedCharacterId]);

  const handleGenerateVideo = async () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to generate videos",
        variant: "destructive",
      });
      navigate('/login');
      return;
    }

    if (!videoIdea.trim()) {
      toast({
        title: "Missing Idea",
        description: "Please describe your video idea first",
        variant: "destructive",
      });
      return;
    }

    setIsGenerating(true);
    try {
      toast({ title: "Step 1/4", description: "Generating script (Simulation Mode)..." });

      let scriptData;
      try {
        // Find the selected style's DNA/Config if it's a "My Style"
        const customStyle = myStyles.find(s => s.id === selectedStyle);
        const styleConfig = customStyle?.config || { id: selectedStyle };

        // Find selected character info
        const character = myCharacters.find(c => c.id === selectedCharacterId);

        const { data, error } = await supabase.functions.invoke('generate-script', {
          body: {
            idea: videoIdea,
            duration: duration || '30s',
            tone: "Professional",
            style: selectedStyle,
            styleConfig: styleConfig,
            character: character ? {
              name: character.name,
              description: character.description
            } : null
          }
        });
        if (error) throw error;
        scriptData = data;
      } catch (err) {
        console.warn("Edge Function 'generate-script' failed, using fallback:", err);
        scriptData = {
          scenes: [
            { visual_prompt: `Cinematic shot of ${videoIdea}`, voiceover: `Welcome to the world of ${videoIdea}.`, duration_seconds: 5 },
            { visual_prompt: `Detailed close up of features`, voiceover: "It is truly amazing.", duration_seconds: 5 },
            { visual_prompt: `Happy people using the product`, voiceover: "Try it today.", duration_seconds: 5 }
          ]
        };
      }

      toast({ title: "Step 2/4", description: "Creating visuals & voice (Simulation Mode)..." });

      const scenes = scriptData.scenes || [];
      const assetPromises = scenes.map(async (scene: any) => {
        let visualUrl = `https://picsum.photos/seed/${Date.now() + Math.random()}/1080/1920`;
        try {
          const { data, error } = await supabase.functions.invoke('generate-visuals', {
            body: {
              prompt: scene.visual_prompt,
              frameSize: frameSize
            }
          });
          if (error) throw error;
          visualUrl = data.url || data.imageUrl;
        } catch (err) {
          console.warn("Visual gen failed, using mock:", err);
        }

        let audioUrl = "https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3";
        try {
          const { data, error } = await supabase.functions.invoke('generate-audio', {
            body: { text: scene.voiceover, voiceId: selectedVoice }
          });
          if (error) throw error;
          audioUrl = data.url || data.audioUrl;
        } catch (err) {
          console.warn("Audio gen failed, using mock:", err);
        }

        return {
          visualUrl,
          audioUrl,
          duration: scene.duration_seconds
        };
      });

      const generatedAssets = await Promise.all(assetPromises);
      toast({ title: "Step 3/4", description: "Rendering video (Simulation Mode)..." });

      const visualUrls = generatedAssets.map(a => a.visualUrl);
      const audioUrls = generatedAssets.map(a => a.audioUrl);

      let renderData = { renderId: `mock-render-${Date.now()}` };
      try {
        const { data, error: renderError } = await supabase.functions.invoke('render-video', {
          body: {
            audioUrls: audioUrls,
            visualUrls: visualUrls,
            script: scriptData,
            frameSize: frameSize
          }
        });
        if (renderError) throw renderError;
        renderData = data;
      } catch (err) {
        console.warn("Render function failed (expected if not deployed), using mock ID");
      }

      const { data: generation, error: saveError } = await supabase
        .from('generations')
        .insert({
          user_id: user.id,
          idea: videoIdea,
          duration: duration || '30s',
          style: selectedStyle,
          voice_id: selectedVoice,
          frame_size: frameSize,
          script: scriptData,
          render_id: renderData.renderId,
          status: 'processing',
          visual_urls: visualUrls,
          audio_urls: audioUrls
        })
        .select()
        .single();

      if (saveError) {
        console.error('Failed to save generation:', saveError);
        toast({
          title: "Database Warning",
          description: "Video generated but could not be saved to history.",
          variant: "default"
        });
      }

      toast({
        title: "Video Created!",
        description: "Your video is ready in Simulation Mode. Check your Dashboard!",
      });

      setTimeout(() => {
        setIsGenerating(false);
        navigate("/dashboard");
      }, 2000);

    } catch (error: any) {
      console.error('Error generating video:', error);
      toast({
        title: "Generation Failed",
        description: error.message || "Something went wrong",
        variant: "destructive",
      });
      setIsGenerating(false);
    }
  };

  const handleStyleDoubleClick = (style: any) => {
    setSelectedStyleDetails(style);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setReferenceFile(e.target.files[0]);
      toast({
        title: "File Uploaded",
        description: `Selected: ${e.target.files[0].name}`,
      });
    }
  };

  const videoStyles = [
    { id: "realistic", name: "Realistic", icon: Video, description: "Photorealistic human-like videos" },
    { id: "cinematic", name: "Cinematic", icon: Calendar, description: "Hollywood-style dramatic scenes" },
    { id: "animated", name: "Animated", icon: Palette, description: "Smooth 2D/3D animations" },
    { id: "artistic", name: "Artistic", icon: Wand2, description: "Creative artistic interpretations" },
    { id: "cartoon", name: "Cartoon", icon: Users, description: "Fun cartoon-style videos" },
    { id: "custom", name: "Custom Style", icon: Upload, description: "Create your own unique style" }
  ];

  const voiceOptions = [
    { id: "sarah", name: "Sarah", type: "Female, Professional" },
    { id: "john", name: "John", type: "Male, Narrator" },
    { id: "emma", name: "Emma", type: "Female, Casual" },
    { id: "david", name: "David", type: "Male, Energetic" }
  ];

  const editingTools = [
    { icon: Calendar, name: "Trim & Cut", description: "Precise video trimming" },
    { icon: Download, name: "Merge Videos", description: "Combine multiple clips" },
    { icon: Sparkles, name: "Add Overlays", description: "Text, graphics, effects" },
    { icon: Sparkles, name: "Captions", description: "Auto-generated subtitles" },
    { icon: Sparkles, name: "Stock Library", description: "AI generated stock footage" },
    { icon: Video, name: "Script B-Roll", description: "Generate or choose never-before-seen B-roll that matches your script" }
  ];

  const exportPlatforms = [
    { icon: Youtube, name: "YouTube Shorts", specs: "9:16, 60s max", color: "text-red-600" },
    { icon: Twitter, name: "X (Twitter)", specs: "Any aspect, 140s", color: "text-black dark:text-white" },
    { icon: Linkedin, name: "LinkedIn", specs: "16:9 or 1:1, 10m", color: "text-blue-600" },
    { icon: Facebook, name: "Facebook", specs: "16:9, 240m", color: "text-blue-500" },
    { icon: Instagram, name: "Instagram Reels", specs: "9:16, 90s", color: "text-pink-600" },
    { icon: Instagram, name: "Instagram Stories", specs: "9:16, 15s", color: "text-pink-500" },
    { icon: Instagram, name: "Instagram Posts", specs: "1:1 or 4:5", color: "text-pink-400" },
    { icon: Globe, name: "Pinterest", specs: "9:16", color: "text-red-500" },
    { icon: MessageSquare, name: "Discord", specs: "8MB limit", color: "text-indigo-500" },
    { icon: Hash, name: "Slack", specs: "1GB limit", color: "text-purple-500" },
    { icon: MessageSquare, name: "Telegram", specs: "2GB limit", color: "text-blue-400" },
    { icon: Hash, name: "Threads", specs: "9:16, 5m", color: "text-black dark:text-white" },
    { icon: MessageSquare, name: "Reddit", specs: "16:9", color: "text-orange-500" },
    { icon: Download, name: "MP4 Download", specs: "High Quality", color: "text-green-500" }
  ];

  return (
    <div className="min-h-screen bg-background">
      <main className="pt-4 pb-12">
        <div className="container mx-auto px-4">
          <Alert className="mb-6 border-amber-500/50 bg-amber-500/10">
            <Info className="h-4 w-4 text-amber-500" />
            <AlertTitle className="text-amber-500">Simulation Mode Active</AlertTitle>
            <AlertDescription className="text-amber-600">
              The app is currently running in simulation mode due to API credit limitations.
              All AI features will use placeholder content.
            </AlertDescription>
          </Alert>

          <div className="text-center mb-12">
            <div className="inline-flex items-center glass rounded-full px-6 py-2 mb-6">
              <Video className="w-4 h-4 text-primary mr-2" />
              <span className="text-sm font-medium">Idea to Video</span>
            </div>
            <h2 className="text-4xl font-bold mb-4">Transform Ideas into Videos</h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Simply describe your vision and watch AI bring it to life with professional quality
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <Card className="glass">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5 text-primary" />
                    Video Configuration
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <Label htmlFor="idea">Describe Your Idea</Label>
                    <Textarea
                      id="idea"
                      placeholder="A product demonstration showing our new smartphone..."
                      className="min-h-[100px]"
                      value={videoIdea}
                      onChange={(e) => setVideoIdea(e.target.value)}
                    />
                  </div>

                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-2">
                      <Input
                        type="file"
                        id="reference-upload"
                        className="hidden"
                        onChange={handleFileChange}
                        accept="image/*,.pdf,.doc,.docx,.txt"
                      />
                      <Label
                        htmlFor="reference-upload"
                        className="cursor-pointer inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2 gap-2"
                      >
                        <Upload className="w-4 h-4" />
                        {referenceFile ? "Change File" : "Upload Reference"}
                      </Label>
                      {referenceFile && (
                        <span className="text-sm text-muted-foreground truncate max-w-[150px]">
                          {referenceFile.name}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Duration</Label>
                      <Select value={duration} onValueChange={setDuration}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select duration" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="15s">15 seconds</SelectItem>
                          <SelectItem value="30s">30 seconds</SelectItem>
                          <SelectItem value="60s">1 minute</SelectItem>
                          <SelectItem value="120s">2 minutes</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label>Frame Size</Label>
                      <Select value={frameSize} onValueChange={setFrameSize}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select size" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="16:9">16:9 (Landscape)</SelectItem>
                          <SelectItem value="9:16">9:16 (Portrait)</SelectItem>
                          <SelectItem value="1:1">1:1 (Square)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <Label>Voice Selection</Label>
                    <Select value={selectedVoice} onValueChange={setSelectedVoice}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a voice" />
                      </SelectTrigger>
                      <SelectContent>
                        {voiceOptions.map((voice) => (
                          <SelectItem key={voice.id} value={voice.id}>
                            {voice.name} - {voice.type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Select Character (Optional)</Label>
                    <Select value={selectedCharacterId} onValueChange={setSelectedCharacterId}>
                      <SelectTrigger>
                        <SelectValue placeholder="Choose a character" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="none">No specific character (AI standard)</SelectItem>
                        {myCharacters.map((char) => (
                          <SelectItem key={char.id} value={char.id}>
                            {char.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <Button
                    className="w-full bg-gradient-to-r from-primary to-accent hover:opacity-90 transition-opacity"
                    size="lg"
                    onClick={handleGenerateVideo}
                    disabled={isGenerating}
                  >
                    {isGenerating ? (
                      <>
                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                        Generating Video...
                      </>
                    ) : (
                      <>
                        <Wand2 className="w-4 h-4 mr-2" />
                        Generate Video
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            </div>

            <div className="space-y-6">
              <h3 className="text-2xl font-semibold mb-6">Choose Your Style</h3>
              {myStyles.length > 0 && (
                <div className="mb-8">
                  <h4 className="text-lg font-medium mb-4 text-primary">My Styles</h4>
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    {myStyles.map((style: any) => (
                      <Card
                        key={style.id}
                        className={`cursor-pointer transition-all duration-300 hover:scale-105 ${selectedStyle === style.id ? 'ring-2 ring-primary' : ''}`}
                        onClick={() => setSelectedStyle(style.id)}
                      >
                        <CardContent className="p-6 text-center relative">
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="absolute top-2 right-2 h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                                onClick={(e) => e.stopPropagation()}
                              >
                                ×
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>Delete Style</AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete the style "{style.name}"?
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteStyle(style.id)}
                                  className="bg-destructive hover:bg-destructive/90 text-white"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-accent to-primary mx-auto mb-4 flex items-center justify-center">
                            <Palette className="w-6 h-6 text-white" />
                          </div>
                          <h4 className="font-semibold">{style.name}</h4>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              )}

              <h4 className="text-lg font-medium mb-4">Default Styles</h4>
              <div className="grid grid-cols-2 gap-4">
                {videoStyles.map((style) => (
                  <Card
                    key={style.id}
                    className={`cursor-pointer transition-all duration-300 hover:scale-105 ${selectedStyle === style.id ? 'ring-2 ring-primary' : ''}`}
                    onClick={() => {
                      if (style.id === "custom") {
                        navigate("/custom-style");
                      } else {
                        setSelectedStyle(style.id);
                      }
                    }}
                  >
                    <CardContent className="p-6 text-center">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-primary to-accent mx-auto mb-4 flex items-center justify-center">
                        <style.icon className="w-6 h-6 text-white" />
                      </div>
                      <h4 className="font-semibold">{style.name}</h4>
                      {style.id === "custom" && (
                        <p className="text-[10px] text-primary mt-1">Open Style Creator</p>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </div>

        <section id="style-lab" className="py-16 bg-muted/30">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <div className="inline-flex items-center glass rounded-full px-6 py-2 mb-6">
                <Palette className="w-4 h-4 text-primary mr-2" />
                <span className="text-sm font-medium">Style Lab</span>
              </div>
              <h2 className="text-4xl font-bold mb-4">Video Style Cloning</h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Clone the visual DNA of any video. Analyze timing, shot composition, and visual aesthetics to use as your own style.
              </p>
            </div>

            <div className="flex justify-center">
              <Card className="glass max-w-2xl w-full border-primary/20">
                <CardHeader className="text-center">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-r from-accent to-primary mx-auto mb-4 flex items-center justify-center">
                    <Plus className="w-8 h-8 text-white" />
                  </div>
                  <CardTitle className="text-2xl">Create Custom Style DNA</CardTitle>
                  <CardDescription>
                    Upload a reference video or paste a YouTube URL to extract its visual profile
                  </CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                  <Button onClick={() => navigate('/custom-style')} className="cta-primary bg-gradient-to-r from-accent to-primary">
                    Launch Style Creator
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        </section>

        <section id="create-characters" className="py-16">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <div className="inline-flex items-center glass rounded-full px-6 py-2 mb-6">
                <Users className="w-4 h-4 text-primary mr-2" />
                <span className="text-sm font-medium">Character Creation</span>
              </div>
              <h2 className="text-4xl font-bold mb-4">Create Custom Characters</h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Upload images or use text prompts to generate unique avatars for your videos
              </p>
            </div>

            <div className="flex justify-center">
              <Card className="glass max-w-2xl w-full">
                <CardHeader className="text-center">
                  <div className="w-16 h-16 rounded-full bg-gradient-to-r from-primary to-accent mx-auto mb-4 flex items-center justify-center">
                    <Plus className="w-8 h-8 text-white" />
                  </div>
                  <CardTitle className="text-2xl">Create Custom Character</CardTitle>
                </CardHeader>
                <CardContent className="text-center">
                  <Button onClick={() => navigate('/character-creator')} className="cta-primary">
                    Create Character
                  </Button>
                </CardContent>
              </Card>
            </div>
            <CharactersList />
          </div>
        </section>

        <ProfessionalTemplates />

        <section id="video-editing" className="py-16">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <div className="inline-flex items-center glass rounded-full px-6 py-2 mb-6">
                <Edit3 className="w-4 h-4 text-primary mr-2" />
                <span className="text-sm font-medium">Video Editing</span>
              </div>
              <h2 className="text-4xl font-bold mb-4">Intuitive Video Editing Suite</h2>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
              {editingTools.map((tool, index) => (
                <Card key={index} className="glass feature-card group">
                  <CardContent className="p-6 text-center">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-primary to-accent mx-auto mb-4 flex items-center justify-center group-hover:scale-110 transition-transform">
                      <tool.icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="font-semibold mb-2">{tool.name}</h3>
                    <p className="text-sm text-muted-foreground">{tool.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card className="glass">
              <CardContent className="p-8">
                <div className="border-2 border-dashed border-border rounded-lg p-12 text-center">
                  <Edit3 className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Drag & Drop Video Editor</h3>
                  <Button asChild className="mt-4">
                    <a href="https://video.designcombo.dev/" target="_blank" rel="noopener noreferrer">
                      Launch Editor
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </section>

        <section id="social-export" className="py-16">
          <div className="container mx-auto px-4">
            <div className="text-center mb-12">
              <div className="inline-flex items-center glass rounded-full px-6 py-2 mb-6">
                <Share2 className="w-4 h-4 text-primary mr-2" />
                <span className="text-sm font-medium">Social Media Export</span>
              </div>
              <h2 className="text-4xl font-bold mb-4">Export to Any Platform</h2>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-6">
              {exportPlatforms.map((platform, index) => (
                <Card key={index} className="glass hover:scale-105 transition-transform">
                  <CardContent className="p-4 text-center">
                    <platform.icon className={`w-8 h-8 mx-auto mb-2 ${platform.color}`} />
                    <p className="text-xs font-medium">{platform.name}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
};

export default Features;
