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
  Plus
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const CharactersList = () => {
  const [savedCharacters, setSavedCharacters] = useState([]);

  useEffect(() => {
    const characters = JSON.parse(localStorage.getItem('savedCharacters') || '[]');
    setSavedCharacters(characters);
  }, []);

  const deleteCharacter = (characterId: string) => {
    const updatedCharacters = savedCharacters.filter((char: any) => char.id !== characterId);
    setSavedCharacters(updatedCharacters);
    localStorage.setItem('savedCharacters', JSON.stringify(updatedCharacters));
  };

  return (
    <div className="mt-12 text-center">
      <h3 className="text-2xl font-semibold mb-6">Your Characters</h3>
      {savedCharacters.length > 0 ? (
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {savedCharacters.map((character: any) => (
            <Card key={character.id} className="glass hover:scale-105 transition-transform cursor-pointer">
              <CardContent className="p-4 text-center relative">
                <Button
                  variant="ghost"
                  size="sm"
                  className="absolute top-1 right-1 h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteCharacter(character.id);
                  }}
                >
                  ×
                </Button>
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
    </div>
  );
};

const Features = () => {
  const navigate = useNavigate();
  const [selectedVoice, setSelectedVoice] = useState("");
  const [selectedStyle, setSelectedStyle] = useState("realistic");
  const [myStyles, setMyStyles] = useState([]);

  useEffect(() => {
    // Load saved styles from localStorage
    const savedStyles = JSON.parse(localStorage.getItem('myStyles') || '[]');
    setMyStyles(savedStyles);
  }, []);

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
    { icon: RotateCcw, name: "Mirror Effect", description: "Flip and rotate videos" }
  ];

  const exportPlatforms = [
    { icon: Youtube, name: "YouTube Shorts", specs: "9:16, 60s max", color: "text-red-500" },
    { icon: Instagram, name: "Instagram Reels", specs: "9:16, 90s max", color: "text-pink-500" },
    { icon: Facebook, name: "Facebook Stories", specs: "9:16, 15s max", color: "text-blue-500" },
    { icon: Twitter, name: "Twitter Video", specs: "16:9, 2m max", color: "text-sky-500" },
    { icon: Download, name: "MP4 Download", specs: "Custom resolution", color: "text-green-500" }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-20">
        {/* Hero Section */}
        <section className="py-16 relative overflow-hidden">
          <div className="container mx-auto px-4 text-center">
            <div className="inline-flex items-center glass rounded-full px-6 py-2 mb-6">
              <Wand2 className="w-4 h-4 text-primary mr-2" />
              <span className="text-sm font-medium">Comprehensive Features</span>
            </div>
            
            <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Everything You Need to Create
              <span className="block">Professional Videos</span>
            </h1>
            
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto mb-8">
              From concept to creation, our AI-powered platform provides all the tools 
              you need to produce stunning videos for any purpose.
            </p>
          </div>
        </section>

        {/* Feature Sections */}
        <div className="container mx-auto px-4 space-y-24">
          
          {/* 1. Idea to Video */}
          <section id="idea-to-video" className="py-16">
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
                      />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>Duration</Label>
                        <Select>
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
                        <Select>
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
                  </CardContent>
                </Card>
              </div>

              <div>
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
                          className={`cursor-pointer transition-all duration-300 hover:scale-105 ${
                            selectedStyle === style.id ? 'ring-2 ring-primary' : ''
                          }`}
                          onClick={() => setSelectedStyle(style.id)}
                        >
                          <CardContent className="p-6 text-center relative">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="absolute top-2 right-2 h-6 w-6 p-0 text-muted-foreground hover:text-destructive"
                              onClick={(e) => {
                                e.stopPropagation();
                                const updatedStyles = myStyles.filter((s: any) => s.id !== style.id);
                                setMyStyles(updatedStyles);
                                localStorage.setItem('myStyles', JSON.stringify(updatedStyles));
                              }}
                            >
                              ×
                            </Button>
                            <div className="w-12 h-12 rounded-xl bg-gradient-to-r from-accent to-primary mx-auto mb-4 flex items-center justify-center">
                              <Palette className="w-6 h-6 text-white" />
                            </div>
                            <h4 className="font-semibold mb-2">{style.name}</h4>
                            <p className="text-sm text-muted-foreground">{style.description || "Custom style"}</p>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                )}
                
                {/* Default Styles */}
                <h4 className="text-lg font-medium mb-4">Default Styles</h4>
                <div className="grid grid-cols-2 gap-4">
                  {videoStyles.map((style) => (
                     <Card 
                      key={style.id}
                      className={`cursor-pointer transition-all duration-300 hover:scale-105 ${
                        selectedStyle === style.id ? 'ring-2 ring-primary' : ''
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
                
                <Button className="w-full mt-6 cta-primary">
                  Generate Video
                </Button>
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

            <div className="grid lg:grid-cols-2 gap-12">
              <Card className="glass">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Upload className="w-5 h-5 text-primary" />
                    Upload Image
                  </CardTitle>
                  <CardDescription>
                    Upload a photo to create a custom avatar
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="border-2 border-dashed border-border rounded-lg p-8 text-center hover:border-primary transition-colors">
                    <Upload className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                    <p className="text-muted-foreground mb-2">Drag & drop an image or click to browse</p>
                    <Button variant="outline">Choose File</Button>
                  </div>
                </CardContent>
              </Card>

              <Card 
                className="glass cursor-pointer hover:scale-105 transition-transform"
                onClick={() => navigate('/character-creator')}
              >
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Plus className="w-5 h-5 text-primary" />
                    Create Custom Character
                  </CardTitle>
                  <CardDescription>
                    Define detailed parameters for your character
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <Plus className="w-12 h-12 text-primary mx-auto mb-4" />
                    <p className="text-muted-foreground mb-4">Click to start creating your custom character with detailed parameters</p>
                    <Button className="w-full cta-primary">Create Character</Button>
                  </div>
                </CardContent>
              </Card>
            </div>

            <CharactersList />
          </section>

          {/* 3. Script Templates */}
          <section id="script-templates" className="py-16">
            <div className="text-center mb-12">
              <div className="inline-flex items-center glass rounded-full px-6 py-2 mb-6">
                <FileText className="w-4 h-4 text-primary mr-2" />
                <span className="text-sm font-medium">Script Templates</span>
              </div>
              <h2 className="text-4xl font-bold mb-4">Professional Script Templates</h2>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Industry-specific templates to kickstart your video content creation
              </p>
            </div>

            <Tabs defaultValue="marketing" className="w-full">
              <TabsList className="grid w-full grid-cols-3 mb-8">
                <TabsTrigger value="marketing">Marketing</TabsTrigger>
                <TabsTrigger value="education">Education</TabsTrigger>
                <TabsTrigger value="entertainment">Entertainment</TabsTrigger>
              </TabsList>
              
              {scriptTemplates.map((category) => (
                <TabsContent key={category.category.toLowerCase()} value={category.category.toLowerCase()}>
                  <div className="grid md:grid-cols-3 gap-6">
                    {category.templates.map((template, index) => (
                      <Card key={index} className="glass hover:scale-105 transition-transform">
                        <CardHeader>
                          <CardTitle className="text-lg">{template.name}</CardTitle>
                          <CardDescription>{template.description}</CardDescription>
                        </CardHeader>
                        <CardContent>
                          <div className="bg-muted p-4 rounded-lg mb-4">
                            <p className="text-sm italic">"{template.example}"</p>
                          </div>
                          <Button variant="outline" className="w-full">Use Template</Button>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </TabsContent>
              ))}
            </Tabs>
          </section>

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
                  <Button>Launch Editor</Button>
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
                  <Button className="cta-primary">
                    Start Free Trial
                  </Button>
                </CardContent>
              </Card>
            </div>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Features;