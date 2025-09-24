import { useState, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Upload, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { useToast } from "@/hooks/use-toast";

const CharacterCreator = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [characterName, setCharacterName] = useState("");
  const [characterDescription, setCharacterDescription] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedCharacter, setGeneratedCharacter] = useState<any>(null);
  
  // Character parameters
  const [clothing, setClothing] = useState("");
  const [distinguishingCharacteristics, setDistinguishingCharacteristics] = useState("");
  const [hairColor, setHairColor] = useState("");
  const [hairStyle, setHairStyle] = useState("");
  const [hairLength, setHairLength] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState("");
  const [eyes, setEyes] = useState("");
  const [skin, setSkin] = useState("");
  const [build, setBuild] = useState("");
  const [height, setHeight] = useState("");

  const handleGenerate = async () => {
    if (!characterName.trim()) {
      toast({
        title: "Name Required",
        description: "Please enter a name for your character.",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    
    // Simulate AI generation process
    setTimeout(() => {
        const mockCharacter = {
          id: Date.now().toString(),
          name: characterName,
          description: characterDescription,
          parameters: {
          clothing,
          distinguishingCharacteristics,
          hairColor,
          hairStyle,
          hairLength,
          age,
          gender,
          eyes,
          skin,
          build,
          height
        },
        generatedImages: [
          `https://api.dicebear.com/7.x/personas/svg?seed=${characterName}1`,
          `https://api.dicebear.com/7.x/personas/svg?seed=${characterName}2`,
          `https://api.dicebear.com/7.x/personas/svg?seed=${characterName}3`
        ]
      };
      
      setGeneratedCharacter(mockCharacter);
      setIsGenerating(false);
      
      toast({
        title: "Character Generated!",
        description: `${characterName} has been successfully created.`
      });
    }, 3000);
  };

  const handleRegenerate = () => {
    setIsGenerating(true);
    setTimeout(() => {
      const newImages = [
        `https://api.dicebear.com/7.x/personas/svg?seed=${characterName}${Date.now()}1`,
        `https://api.dicebear.com/7.x/personas/svg?seed=${characterName}${Date.now()}2`,
        `https://api.dicebear.com/7.x/personas/svg?seed=${characterName}${Date.now()}3`
      ];
      
      setGeneratedCharacter(prev => ({
        ...prev,
        generatedImages: newImages
      }));
      setIsGenerating(false);
    }, 2000);
  };

  const handleSaveCharacter = () => {
    if (!generatedCharacter) return;

    const savedCharacters = JSON.parse(localStorage.getItem('savedCharacters') || '[]');
    savedCharacters.push(generatedCharacter);
    localStorage.setItem('savedCharacters', JSON.stringify(savedCharacters));
    
    toast({
      title: "Character Saved!",
      description: `${characterName} has been saved to your characters.`
    });
    
    navigate('/features#create-characters');
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-20 pb-16">
        <div className="container mx-auto px-4 max-w-4xl">
          {/* Header */}
          <div className="flex items-center mb-8">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/features#create-characters')}
              className="mr-4"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              New character
            </Button>
            
            {generatedCharacter && (
              <Button 
                onClick={handleSaveCharacter}
                className="ml-auto"
              >
                Create character
              </Button>
            )}
          </div>

          {!generatedCharacter ? (
            <div className="flex justify-center">
              <Card className="glass max-w-2xl w-full">
                <CardHeader className="text-center">
                  <CardTitle className="text-2xl">Create Custom Character</CardTitle>
                  <p className="text-muted-foreground">Define detailed parameters for your character</p>
                </CardHeader>
                <CardContent className="space-y-6">

                {/* Basic Info */}
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Name (required)</Label>
                    <Input
                      id="name"
                      value={characterName}
                      onChange={(e) => setCharacterName(e.target.value)}
                      placeholder="Enter character name"
                    />
                  </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={characterDescription}
                    onChange={(e) => setCharacterDescription(e.target.value)}
                    placeholder="Describe the character"
                    className="min-h-[100px]"
                  />
                {/* Upload Reference Image */}
                <div>
                  <Label htmlFor="reference-upload">Reference Image (Optional)</Label>
                  <div className="mt-2 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed border-border rounded-lg hover:border-primary/50 transition-colors">
                    <div className="space-y-1 text-center">
                      <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
                      <div className="flex text-sm text-muted-foreground">
                        <label
                          htmlFor="reference-upload"
                          className="relative cursor-pointer bg-background rounded-md font-medium text-primary hover:text-primary/80"
                        >
                          <span>Upload a reference image</span>
                          <input id="reference-upload" name="reference-upload" type="file" className="sr-only" accept="image/*" />
                        </label>
                        <p className="pl-1">or drag and drop</p>
                      </div>
                      <p className="text-xs text-muted-foreground">PNG, JPG, GIF up to 10MB</p>
                    </div>
                  </div>
                </div>

                {/* Upload Reference Image */}
                <div>
                  <Label htmlFor="reference-upload">Reference Image (Optional)</Label>
                  <div className="mt-2 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed border-border rounded-lg hover:border-primary/50 transition-colors">
                    <div className="space-y-1 text-center">
                      <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
                      <div className="flex text-sm text-muted-foreground">
                        <label
                          htmlFor="reference-upload"
                          className="relative cursor-pointer bg-background rounded-md font-medium text-primary hover:text-primary/80"
                        >
                          <span>Upload a reference image</span>
                          <input id="reference-upload" name="reference-upload" type="file" className="sr-only" accept="image/*" />
                        </label>
                        <p className="pl-1">or drag and drop</p>
                      </div>
                      <p className="text-xs text-muted-foreground">PNG, JPG, GIF up to 10MB</p>
                    </div>
                  </div>
                </div>
              </div>

                {/* Upload Reference Image */}
                <div>
                  <Label htmlFor="reference-upload">Reference Image (Optional)</Label>
                  <div className="mt-2 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed border-border rounded-lg hover:border-primary/50 transition-colors">
                    <div className="space-y-1 text-center">
                      <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
                      <div className="flex text-sm text-muted-foreground">
                        <label
                          htmlFor="reference-upload"
                          className="relative cursor-pointer bg-background rounded-md font-medium text-primary hover:text-primary/80"
                        >
                          <span>Upload a reference image</span>
                          <input id="reference-upload" name="reference-upload" type="file" className="sr-only" accept="image/*" />
                        </label>
                        <p className="pl-1">or drag and drop</p>
                      </div>
                      <p className="text-xs text-muted-foreground">PNG, JPG, GIF up to 10MB</p>
                    </div>
                  </div>
                </div>
                </div>

                {/* Character Parameters */}
                <div className="grid md:grid-cols-2 gap-4">
                  <div>
                    <Label>Clothing</Label>
                    <Input
                      value={clothing}
                      onChange={(e) => setClothing(e.target.value)}
                      placeholder="e.g., green hoodie with a logo"
                    />
                  </div>

                  <div>
                    <Label>Distinguishing Characteristics</Label>
                    <Input
                      value={distinguishingCharacteristics}
                      onChange={(e) => setDistinguishingCharacteristics(e.target.value)}
                      placeholder="e.g., wearing glasses, hands in pockets"
                    />
                  </div>

                  <div>
                    <Label>Hair Color</Label>
                    <Select value={hairColor} onValueChange={setHairColor}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select hair color" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="black">Black</SelectItem>
                        <SelectItem value="brown">Brown</SelectItem>
                        <SelectItem value="blonde">Blonde</SelectItem>
                        <SelectItem value="red">Red</SelectItem>
                        <SelectItem value="gray">Gray</SelectItem>
                        <SelectItem value="white">White</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Hair Style</Label>
                    <Select value={hairStyle} onValueChange={setHairStyle}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select hair style" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="straight">Straight</SelectItem>
                        <SelectItem value="curly">Curly</SelectItem>
                        <SelectItem value="wavy">Wavy</SelectItem>
                        <SelectItem value="afro">Afro</SelectItem>
                        <SelectItem value="buzz">Buzz cut</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Hair Length</Label>
                    <Select value={hairLength} onValueChange={setHairLength}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select hair length" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="short">Short</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="long">Long</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Age</Label>
                    <Select value={age} onValueChange={setAge}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select age range" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="child">Child (5-12)</SelectItem>
                        <SelectItem value="teenager">Teenager (13-19)</SelectItem>
                        <SelectItem value="young-adult">Young Adult (20-35)</SelectItem>
                        <SelectItem value="middle-aged">Middle-aged (36-55)</SelectItem>
                        <SelectItem value="senior">Senior (55+)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Gender</Label>
                    <Select value={gender} onValueChange={setGender}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="male">Male</SelectItem>
                        <SelectItem value="female">Female</SelectItem>
                        <SelectItem value="non-binary">Non-binary</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Eyes</Label>
                    <Select value={eyes} onValueChange={setEyes}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select eye color" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="brown">Brown</SelectItem>
                        <SelectItem value="blue">Blue</SelectItem>
                        <SelectItem value="green">Green</SelectItem>
                        <SelectItem value="hazel">Hazel</SelectItem>
                        <SelectItem value="gray">Gray</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Skin</Label>
                    <Select value={skin} onValueChange={setSkin}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select skin tone" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="light">Light</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="tan">Tan</SelectItem>
                        <SelectItem value="dark">Dark</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Build</Label>
                    <Select value={build} onValueChange={setBuild}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select build" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="thin">Thin</SelectItem>
                        <SelectItem value="average">Average</SelectItem>
                        <SelectItem value="athletic">Athletic</SelectItem>
                        <SelectItem value="heavy">Heavy</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Height</Label>
                    <Input
                      value={height}
                      onChange={(e) => setHeight(e.target.value)}
                      placeholder="e.g., 5'8'' or 173cm"
                    />
                  </div>
                </div>

                <Button 
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="w-full cta-primary"
                >
                  {isGenerating ? "Generating..." : "Create Character"}
                </Button>
              </CardContent>
            </Card>
            </div>
          ) : (
            /* Generated Character Display */
            <Card className="glass">
              <CardContent className="p-6">
                <div className="text-center mb-6">
                  <div className="w-24 h-24 rounded-full bg-gradient-to-r from-primary to-accent mx-auto mb-4 flex items-center justify-center">
                    <img 
                      src={generatedCharacter.generatedImages[0]} 
                      alt={generatedCharacter.name}
                      className="w-full h-full rounded-full object-cover"
                    />
                  </div>
                  <h2 className="text-2xl font-bold">{generatedCharacter.name}</h2>
                </div>

                {/* Example Images */}
                <div className="mb-6">
                  <h3 className="text-lg font-semibold mb-4">Example images</h3>
                  <div className="grid grid-cols-3 gap-4">
                    {generatedCharacter.generatedImages.map((img: string, idx: number) => (
                      <div key={idx} className="aspect-square rounded-lg overflow-hidden">
                        <img 
                          src={img} 
                          alt={`${generatedCharacter.name} ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                      </div>
                    ))}
                  </div>
                </div>

                {/* Character Details */}
                <div className="space-y-4 text-sm">
                  {clothing && (
                    <div>
                      <span className="font-medium text-primary">Clothing: </span>
                      <span className="text-muted-foreground">{clothing}</span>
                    </div>
                  )}
                  
                  {distinguishingCharacteristics && (
                    <div>
                      <span className="font-medium text-primary">Distinguishing Characteristics: </span>
                      <span className="text-muted-foreground">{distinguishingCharacteristics}</span>
                    </div>
                  )}

                  <div className="grid grid-cols-2 gap-4">
                    {hairColor && (
                      <div>
                        <span className="font-medium text-primary">Hair Color: </span>
                        <span className="text-muted-foreground">{hairColor}</span>
                      </div>
                    )}
                    
                    {hairStyle && (
                      <div>
                        <span className="font-medium text-primary">Hair Style: </span>
                        <span className="text-muted-foreground">{hairStyle}</span>
                      </div>
                    )}

                    {age && (
                      <div>
                        <span className="font-medium text-primary">Age: </span>
                        <span className="text-muted-foreground">{age}</span>
                      </div>
                    )}

                    {gender && (
                      <div>
                        <span className="font-medium text-primary">Gender: </span>
                        <span className="text-muted-foreground">{gender}</span>
                      </div>
                    )}

                    {eyes && (
                      <div>
                        <span className="font-medium text-primary">Eyes: </span>
                        <span className="text-muted-foreground">{eyes}</span>
                      </div>
                    )}

                    {skin && (
                      <div>
                        <span className="font-medium text-primary">Skin: </span>
                        <span className="text-muted-foreground">{skin}</span>
                      </div>
                    )}

                    {build && (
                      <div>
                        <span className="font-medium text-primary">Build: </span>
                        <span className="text-muted-foreground">{build}</span>
                      </div>
                    )}

                    {height && (
                      <div>
                        <span className="font-medium text-primary">Height: </span>
                        <span className="text-muted-foreground">{height}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="flex gap-4 mt-6">
                  <Button 
                    variant="outline" 
                    onClick={handleRegenerate}
                    disabled={isGenerating}
                    className="flex-1"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    {isGenerating ? "Regenerating..." : "Regenerate"}
                  </Button>
                  
                  <Button 
                    onClick={handleSaveCharacter}
                    className="flex-1 cta-primary"
                  >
                    Save Character
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </main>
      
      <Footer />
    </div>
  );
};

export default CharacterCreator;