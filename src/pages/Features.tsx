import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Wand2,
  Users,
  FileText,
  Edit3,
  Share2,
  Video,
  Upload,
  Mic,
  Palette,
  Clock,
  Monitor,
  Smartphone,
  Play,
  Download,
  Copy,
  Scissors,
  Layers,
  Type,
  RotateCcw,
  Youtube,
  Instagram,
  Facebook,
  Twitter,
  Archive,
  Film,
  Plus,
  Loader2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
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
  const [videoIdea, setVideoIdea] = useState("");
  const [duration, setDuration] = useState("");
  const [frameSize, setFrameSize] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [selectedStyleDetails, setSelectedStyleDetails] = useState(null);
  const [referenceFile, setReferenceFile] = useState<File | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    // Load persisted form data
    const savedFormData = JSON.parse(localStorage.getItem('videoFormData') || '{}');
    if (savedFormData.videoIdea) setVideoIdea(savedFormData.videoIdea);
    if (savedFormData.duration) setDuration(savedFormData.duration);
    if (savedFormData.frameSize) setFrameSize(savedFormData.frameSize);
    if (savedFormData.selectedVoice) setSelectedVoice(savedFormData.selectedVoice);
    if (savedFormData.selectedStyle) setSelectedStyle(savedFormData.selectedStyle);
  }, []);

  // Auto-save form data to prevent loss on refresh
  useEffect(() => {
    const formData = {
      videoIdea,
      duration,
      frameSize,
      selectedVoice,
      selectedStyle
    };
    localStorage.setItem('videoFormData', JSON.stringify(formData));
  }, [videoIdea, duration, frameSize, selectedVoice, selectedStyle]);

  const handleGenerateVideo = async () => {
    // Check authentication first
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
      // 1. Generate Script with Style Context
      toast({ title: "Step 1/4", description: "Writing script..." });
      const { data: scriptData, error: scriptError } = await supabase.functions.invoke('generate-script', {
        body: {
          idea: videoIdea,
          duration: duration || '30s',
          tone: "Professional",
          style: selectedStyle  // ← NOW PASSING STYLE!
        }
      });

      if (scriptError) throw scriptError;
      console.log("Generated Script:", scriptData);

      // 2. Generate Assets (Parallel)
      toast({ title: "Step 2/4", description: "Generating visuals & voice..." });

      const scenes = scriptData.scenes || [];
      const assetPromises = scenes.map(async (scene: any) => {
        // Visuals (Fal.ai)
        const visualPromise = supabase.functions.invoke('generate-visuals', {
          body: {
            prompt: scene.visual_prompt,
            frameSize: frameSize
          }
        });

        // Voice (ElevenLabs)
        const voicePromise = supabase.functions.invoke('generate-voice', {
          body: { text: scene.voiceover, voiceId: selectedVoice }
        });

        const [visualRes, voiceRes] = await Promise.all([visualPromise, voicePromise]);

        if (visualRes.error) throw visualRes.error;
        if (voiceRes.error) throw voiceRes.error;

        return {
          visualUrl: visualRes.data.imageUrl,
          audioUrl: voiceRes.data.audioUrl,
          duration: scene.duration_seconds
        };
      });

      const generatedAssets = await Promise.all(assetPromises);
      console.log("Assets:", generatedAssets);

      // 3. Render Video (Shotstack)
      toast({ title: "Step 3/4", description: "Rendering video..." });

      // Collect all assets
      const visualUrls = generatedAssets.map(a => a.visualUrl);
      const audioUrls = generatedAssets.map(a => a.audioUrl);

      const { data: renderData, error: renderError } = await supabase.functions.invoke('render-video', {
        body: {
          audioUrls: audioUrls,
          visualUrls: visualUrls,
          script: scriptData,
          frameSize: frameSize
        }
      });

      if (renderError) throw renderError;

      // 4. Save generation to database
      const { data: generation, error: saveError } = await supabase
        .from('generations')
        .insert({
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
        // Don't throw - render is already started
      } else {
        console.log('Generation saved:', generation);
      }

      toast({
        title: "Success!",
        description: "Video is rendering! Check your dashboard shortly.",
      });

      console.log("Render started:", renderData);

      // Navigate to dashboard after a short delay
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
    { id: "cinematic", name: "Cinematic", icon: Monitor, description: "Hollywood-style dramatic scenes" },
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

  const scriptTemplates = [
    {
      category: "Marketing",
      templates: [
        { name: "Product Launch", description: "Introduce new products with impact", example: "Introducing the revolutionary..." },
        { name: "Brand Story", description: "Tell your company's journey", example: "It all started with a simple idea..." },
        { name: "Testimonial", description: "Customer success stories", example: "Here's what our customers say..." }
      ]
    },
    {
      category: "Education",
      templates: [
        { name: "Tutorial", description: "Step-by-step learning content", example: "In this lesson, we'll explore..." },
        { name: "Explainer", description: "Complex concepts made simple", example: "Ever wondered how this works?" },
        { name: "Course Intro", description: "Welcome students to new courses", example: "Welcome to our comprehensive course..." }
      ]
    },
    {
      category: "Entertainment",
      templates: [
        { name: "Story Time", description: "Engaging narrative content", example: "Once upon a time..." },
        { name: "Comedy Sketch", description: "Humorous scenarios", example: "You know what's funny about..." },
        { name: "Travel Vlog", description: "Adventure and exploration", example: "Join me as we explore..." }
      ]
    }
  ];

  const editingTools = [
    { icon: Scissors, name: "Trim & Cut", description: "Precise video trimming" },
    { icon: Copy, name: "Merge Videos", description: "Combine multiple clips" },
    { icon: Layers, name: "Add Overlays", description: "Text, graphics, effects" },
    { icon: Type, name: "Captions", description: "Auto-generated subtitles" },
    { icon: Archive, name: "Stock Library", description: "AI generated stock footage" },
    { icon: Film, name: "Script B-Roll", description: "Generate or choose never-before-seen B-roll that matches your script" }
  ];

  const exportPlatforms = [
    { icon: Youtube, name: "YouTube Shorts", specs: "9:16, 60s max", color: "text-red-500" },
    { icon: Download, name: "MP4 Download", specs: "Custom resolution", color: "text-green-500" }
  ];

  return (
    <div className="min-h-screen bg-background">
      {/* 1. Idea to Video */}
      <section id="idea-to-video" className="py-16">
        <div className="container mx-auto px-4">
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
                    <Button variant="outline" className="gap-2">
                      <Edit3 className="w-4 h-4" />
                      Fine Tune
                    </Button>
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
                    {selectedVoice && (
                      <Button variant="outline" size="sm" className="mt-2">
                        <Play className="w-4 h-4 mr-2" />
                        Preview Voice
                      </Button>
                    )}
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

            {/* Style Selection Section */}
            <div className="space-y-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-semibold">Choose Your Style</h3>
              </div>

              {/* My Styles Section */}
              {myStyles.length > 0 && (
                <div className="mb-8">
                  <h4 className="text-lg font-medium mb-4 text-primary">My Styles</h4>
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    {myStyles.map((style: any) => (
                      <Card
                        key={style.id}
                        className={`cursor-pointer transition-all duration-300 hover:scale-105 ${selectedStyle === style.id ? 'ring-2 ring-primary' : ''
                          }`}
                        onClick={() => setSelectedStyle(style.id)}
                        onDoubleClick={() => handleStyleDoubleClick(style)}
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
                                  Are you sure you want to delete the style named "{style.name}"?
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => deleteStyle(style.id)}
                                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                                >
                                  Delete
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                          <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-accent to-primary mx-auto mb-4 flex items-center justify-center">
                            <Palette className="w-6 h-6 text-white" />
                          </div>
                          <h4 className="font-semibold mb-2">{style.name}</h4>
                          <p className="text-sm text-muted-foreground line-clamp-1">
                            {style.description ?
                              (style.description.length > 50 ?
                                `${style.description.substring(0, 50)}...` :
                                style.description
                              ) :
                              "Custom style"
                            }
                          </p>
                          <p className="text-xs text-primary mt-2">Double-click to view details</p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>

                  {/* Style Details Modal */}
                  <StyleDetailsModal
                    style={selectedStyleDetails}
                    isOpen={!!selectedStyleDetails}
                    onClose={() => setSelectedStyleDetails(null)}
                  />
                </div>
              )}

              {/* Default Styles */}
              <h4 className="text-lg font-medium mb-4">Default Styles</h4>
              <div className="grid grid-cols-2 gap-4">
                {videoStyles.map((style) => (
                  <Card
                    key={style.id}
                    className={`cursor-pointer transition-all duration-300 hover:scale-105 ${selectedStyle === style.id ? 'ring-2 ring-primary' : ''
                      }`}
                    onClick={() => {
                      if (style.id === 'custom') {
                        navigate('/custom-style');
                      } else {
                        setSelectedStyle(style.id);
                      }
                    }}
                  >
                    <CardContent className="p-6 text-center">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-primary to-accent mx-auto mb-4 flex items-center justify-center">
                        <style.icon className="w-6 h-6 text-white" />
                      </div>
                      <h4 className="font-semibold mb-2">{style.name}</h4>
                      <p className="text-sm text-muted-foreground">{style.description}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 2. Create Characters */}
      <section id="create-characters" className="py-16">
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
              <p className="text-muted-foreground">Define detailed parameters for your character</p>
            </CardHeader>
            <CardContent className="text-center">
              <p className="text-muted-foreground mb-6">
                Click to start creating your custom character with detailed parameters
              </p>
              <Button
                onClick={() => navigate('/character-creator')}
                className="cta-primary"
              >
                Create Character
              </Button>
            </CardContent>
          </Card>
        </div>

        <CharactersList />
      </section>

      {/* Professional Templates Section */}
      < ProfessionalTemplates />

      {/* 4. Video Editing */}
      <section id="video-editing" className="py-16">
        <div className="text-center mb-12">
          <div className="inline-flex items-center glass rounded-full px-6 py-2 mb-6">
            <Edit3 className="w-4 h-4 text-primary mr-2" />
            <span className="text-sm font-medium">Video Editing</span>
          </div>
          <h2 className="text-4xl font-bold mb-4">Intuitive Video Editing Suite</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Professional editing tools with drag-and-drop simplicity
          </p>
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
              <p className="text-muted-foreground mb-4">
                Upload your videos and start editing with our intuitive interface
              </p>
              <Button asChild>
                <a href="https://github.com/designcombo/react-video-editor" target="_blank" rel="noopener noreferrer">
                  Launch Editor
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </section>

      {/* 5. Social Media Export */}
      <section id="social-export" className="py-16">
        <div className="text-center mb-12">
          <div className="inline-flex items-center glass rounded-full px-6 py-2 mb-6">
            <Share2 className="w-4 h-4 text-primary mr-2" />
            <span className="text-sm font-medium">Social Media Export</span>
          </div>
          <h2 className="text-4xl font-bold mb-4">Export to Any Platform</h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            One-click export optimized for every social media platform
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {exportPlatforms.map((platform, index) => (
            <Card key={index} className="glass hover:scale-105 transition-transform">
              <CardContent className="p-6 text-center">
                <div className="w-12 h-12 rounded-xl bg-white/10 mx-auto mb-4 flex items-center justify-center">
                  <platform.icon className={`w-6 h-6 ${platform.color}`} />
                </div>
                <h3 className="font-semibold mb-2">{platform.name}</h3>
                <p className="text-sm text-muted-foreground mb-4">{platform.specs}</p>
                <Button variant="outline" className="w-full">Export</Button>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="text-center mt-12">
          <Card className="glass max-w-2xl mx-auto">
            <CardContent className="p-8">
              <h3 className="text-2xl font-bold mb-4">Ready to Create?</h3>
              <p className="text-muted-foreground mb-6">
                Start creating professional videos with our comprehensive feature set
              </p>
              <Button
                className="cta-primary"
                onClick={() => {
                  if (!user) {
                    navigate('/signup');
                  } else {
                    navigate('/payment-portal');
                  }
                }}
              >
                Start Free Trial
              </Button>

            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
};

export default Features;
