import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Play, 
  Pause, 
  Square, 
  Scissors, 
  Download, 
  Upload,
  Layers,
  Type,
  RotateCcw,
  Volume2,
  Maximize,
  ArrowLeft,
  Save,
  Undo,
  Redo,
  Copy,
  Trash2,
  Video
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";

const VideoEditor = () => {
  const navigate = useNavigate();
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration] = useState(120); // 2 minutes
  const [volume, setVolume] = useState([80]);
  const [selectedTool, setSelectedTool] = useState("select");
  const videoRef = useRef<HTMLVideoElement>(null);

  const tools = [
    { id: "select", icon: ArrowLeft, name: "Select" },
    { id: "trim", icon: Scissors, name: "Trim" },
    { id: "copy", icon: Copy, name: "Copy" },
    { id: "text", icon: Type, name: "Text" },
    { id: "overlay", icon: Layers, name: "Overlay" },
    { id: "rotate", icon: RotateCcw, name: "Rotate" }
  ];

  const timeline = Array.from({ length: 10 }, (_, i) => ({
    id: i,
    start: i * 12,
    end: (i + 1) * 12,
    type: i % 2 === 0 ? "video" : "audio",
    name: i % 2 === 0 ? `Video Clip ${i + 1}` : `Audio Track ${i + 1}`
  }));

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const togglePlayPause = () => {
    setIsPlaying(!isPlaying);
    if (videoRef.current) {
      if (isPlaying) {
        videoRef.current.pause();
      } else {
        videoRef.current.play();
      }
    }
  };

  const handleExport = () => {
    // Simulate export process
    alert("Export started! Your video will be ready shortly.");
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-20">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-4">
              <Button 
                variant="ghost" 
                onClick={() => navigate(-1)}
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Dashboard
              </Button>
              <h1 className="text-2xl font-bold">Video Editor</h1>
            </div>
            
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm">
                <Undo className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm">
                <Redo className="h-4 w-4" />
              </Button>
              <Button variant="outline">
                <Save className="h-4 w-4 mr-2" />
                Save Project
              </Button>
              <Button className="cta-primary" onClick={handleExport}>
                <Download className="h-4 w-4 mr-2" />
                Export Video
              </Button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-200px)]">
            {/* Tools Panel */}
            <div className="lg:col-span-1">
              <Card className="glass h-full">
                <CardContent className="p-4">
                  <h3 className="font-semibold mb-4">Tools</h3>
                  <div className="space-y-2">
                    {tools.map((tool) => (
                      <Button
                        key={tool.id}
                        variant={selectedTool === tool.id ? "default" : "ghost"}
                        className="w-full justify-start"
                        onClick={() => setSelectedTool(tool.id)}
                      >
                        <tool.icon className="h-4 w-4 mr-2" />
                        {tool.name}
                      </Button>
                    ))}
                  </div>

                  <div className="mt-8">
                    <h4 className="font-medium mb-4">Properties</h4>
                    <Tabs defaultValue="video" className="w-full">
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="video">Video</TabsTrigger>
                        <TabsTrigger value="audio">Audio</TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="video" className="space-y-4 mt-4">
                        <div>
                          <Label className="text-sm">Brightness</Label>
                          <Slider defaultValue={[50]} max={100} step={1} className="mt-2" />
                        </div>
                        <div>
                          <Label className="text-sm">Contrast</Label>
                          <Slider defaultValue={[50]} max={100} step={1} className="mt-2" />
                        </div>
                        <div>
                          <Label className="text-sm">Saturation</Label>
                          <Slider defaultValue={[50]} max={100} step={1} className="mt-2" />
                        </div>
                      </TabsContent>
                      
                      <TabsContent value="audio" className="space-y-4 mt-4">
                        <div>
                          <Label className="text-sm">Volume</Label>
                          <Slider 
                            value={volume}
                            onValueChange={setVolume}
                            max={100} 
                            step={1} 
                            className="mt-2" 
                          />
                        </div>
                        <Button variant="outline" className="w-full">
                          <Upload className="h-4 w-4 mr-2" />
                          Add Audio
                        </Button>
                      </TabsContent>
                    </Tabs>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Preview Panel */}
            <div className="lg:col-span-2">
              <Card className="glass h-full flex flex-col">
                <CardContent className="p-4 flex-1 flex flex-col">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-semibold">Preview</h3>
                    <Button variant="outline" size="sm">
                      <Maximize className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  {/* Video Preview */}
                  <div className="flex-1 bg-gray-900 rounded-lg flex items-center justify-center mb-4">
                    <div className="text-center">
                      <Video className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">Video Preview</p>
                      <p className="text-sm text-muted-foreground/60">
                        1920x1080 • 30fps
                      </p>
                    </div>
                  </div>
                  
                  {/* Video Controls */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-center gap-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={togglePlayPause}
                      >
                        {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
                      </Button>
                      <Button variant="outline" size="sm">
                        <Square className="h-4 w-4" />
                      </Button>
                      <div className="flex items-center gap-2">
                        <Volume2 className="h-4 w-4" />
                        <Slider 
                          value={volume}
                          onValueChange={setVolume}
                          max={100} 
                          step={1} 
                          className="w-20" 
                        />
                      </div>
                    </div>
                    
                    {/* Timeline Scrubber */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm text-muted-foreground">
                        <span>{formatTime(currentTime)}</span>
                        <span>{formatTime(duration)}</span>
                      </div>
                      <Slider
                        value={[currentTime]}
                        onValueChange={([value]) => setCurrentTime(value)}
                        max={duration}
                        step={0.1}
                        className="w-full"
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Assets Panel */}
            <div className="lg:col-span-1">
              <Card className="glass h-full">
                <CardContent className="p-4">
                  <h3 className="font-semibold mb-4">Media Library</h3>
                  
                  <Tabs defaultValue="uploads" className="w-full">
                    <TabsList className="grid w-full grid-cols-2">
                      <TabsTrigger value="uploads">Uploads</TabsTrigger>
                      <TabsTrigger value="stock">Stock</TabsTrigger>
                    </TabsList>
                    
                    <TabsContent value="uploads" className="space-y-4 mt-4">
                      <Button variant="outline" className="w-full">
                        <Upload className="h-4 w-4 mr-2" />
                        Upload Media
                      </Button>
                      
                      <div className="grid grid-cols-2 gap-2">
                        {[1, 2, 3, 4].map((i) => (
                          <div 
                            key={i}
                            className="aspect-video bg-gradient-to-r from-primary/20 to-accent/20 rounded border-2 border-dashed border-primary/30 flex items-center justify-center cursor-pointer hover:border-primary/50 transition-colors"
                          >
                            <Upload className="h-6 w-6 text-primary/50" />
                          </div>
                        ))}
                      </div>
                    </TabsContent>
                    
                    <TabsContent value="stock" className="space-y-4 mt-4">
                      <Input placeholder="Search stock media..." />
                      <div className="grid grid-cols-2 gap-2">
                        {[1, 2, 3, 4, 5, 6].map((i) => (
                          <div 
                            key={i}
                            className="aspect-video bg-gradient-to-r from-primary to-accent rounded cursor-pointer hover:scale-105 transition-transform"
                          />
                        ))}
                      </div>
                    </TabsContent>
                  </Tabs>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Timeline */}
          <Card className="glass mt-6">
            <CardContent className="p-4">
              <h3 className="font-semibold mb-4">Timeline</h3>
              <div className="space-y-2">
                {timeline.map((clip) => (
                  <div key={clip.id} className="flex items-center gap-2">
                    <div className="w-16 text-xs text-muted-foreground">
                      Track {clip.id + 1}
                    </div>
                    <div 
                      className={`h-8 rounded flex items-center px-2 text-xs font-medium text-white cursor-pointer hover:opacity-80 transition-opacity ${
                        clip.type === 'video' ? 'bg-primary' : 'bg-accent'
                      }`}
                      style={{ width: `${((clip.end - clip.start) / duration) * 100}%` }}
                    >
                      {clip.name}
                    </div>
                    <Button variant="ghost" size="sm">
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
};

export default VideoEditor;