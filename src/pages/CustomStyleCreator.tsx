import { useState } from "react";
import { ArrowLeft, Upload, Wand2, RefreshCw, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

const CustomStyleCreator = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    referenceImage: null as File | null
  });
  const [generatedStyle, setGeneratedStyle] = useState(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [previewImages, setPreviewImages] = useState([
    "/api/placeholder/300/200",
    "/api/placeholder/300/200", 
    "/api/placeholder/300/200"
  ]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData({ ...formData, referenceImage: file });
    }
  };

  const handleGenerateStyle = async () => {
    if (!formData.name.trim()) {
      toast.error("Please enter a style name");
      return;
    }

    setIsGenerating(true);
    // Simulate API call
    setTimeout(() => {
      setGeneratedStyle({
        name: formData.name,
        description: formData.description,
        examples: previewImages
      });
      setIsGenerating(false);
      toast.success("Style generated successfully!");
    }, 3000);
  };

  const handleRegenerate = async () => {
    setIsGenerating(true);
    // Simulate regeneration
    setTimeout(() => {
      setPreviewImages([
        "/api/placeholder/300/200",
        "/api/placeholder/300/200",
        "/api/placeholder/300/200"
      ]);
      setIsGenerating(false);
      toast.success("Style regenerated!");
    }, 2000);
  };

  const handleSaveStyle = () => {
    // Save to local storage for now (in real app would be API call)
    const savedStyles = JSON.parse(localStorage.getItem('myStyles') || '[]');
    const newStyle = {
      id: Date.now().toString(),
      name: formData.name,
      description: formData.description,
      createdAt: new Date().toISOString()
    };
    savedStyles.push(newStyle);
    localStorage.setItem('myStyles', JSON.stringify(savedStyles));
    
    toast.success("Style saved to My Styles!");
    navigate('/features#scripts');
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
            {/* Style Preview Image */}
            <Card>
              <CardContent className="p-6">
                <div className="aspect-video bg-gradient-to-br from-gray-800 to-gray-900 rounded-lg flex items-center justify-center mb-4 relative">
                  <div className="text-white text-6xl font-bold opacity-20">
                    {formData.name.charAt(0).toUpperCase()}
                  </div>
                  <div className="absolute bottom-4 left-4 bg-black/50 text-white px-3 py-1 rounded text-sm">
                    Bottom Layer
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

            {/* Example Images */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Example images</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  {previewImages.map((img, idx) => (
                    <div key={idx} className="aspect-video bg-gray-200 rounded-lg overflow-hidden">
                      <img 
                        src={img} 
                        alt={`Example ${idx + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ))}
                </div>
                
                <Button 
                  onClick={handleRegenerate}
                  disabled={isGenerating}
                  className="w-full border-2 border-green-500 text-green-500 hover:bg-green-50 bg-transparent"
                  variant="outline"
                >
                  {isGenerating ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Regenerating...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Regenerate
                    </>
                  )}
                </Button>
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
              onClick={() => navigate('/features#scripts')}
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
                  <p className="text-muted-foreground mb-2">Upload an image for reference</p>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileUpload}
                    className="hidden"
                    id="file-upload"
                  />
                  <Label 
                    htmlFor="file-upload"
                    className="text-primary hover:text-primary/80 cursor-pointer"
                  >
                    Choose file
                  </Label>
                </div>
                {formData.referenceImage && (
                  <p className="text-sm text-primary">{formData.referenceImage.name}</p>
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
          disabled={isGenerating || !formData.name.trim()}
          className="w-full h-12 text-lg"
        >
          {isGenerating ? (
            <>
              <Wand2 className="h-5 w-5 mr-2 animate-pulse" />
              Generating style...
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