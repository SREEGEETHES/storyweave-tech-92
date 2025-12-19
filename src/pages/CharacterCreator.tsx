import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowLeft, Upload } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useUser } from "@/contexts/UserContext";

const CharacterCreator = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useUser();

  const [characterName, setCharacterName] = useState("");
  const [characterDescription, setCharacterDescription] = useState("");
  const [referenceImage, setReferenceImage] = useState<File | null>(null);
  const [referenceImagePreview, setReferenceImagePreview] = useState<string | null>(null);
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

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setReferenceImage(file);
      const previewUrl = URL.createObjectURL(file);
      setReferenceImagePreview(previewUrl);
      toast({
        title: "Image Selected",
        description: file.name
      });
    }
  };

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

    try {
      let imageUrl = referenceImagePreview;

      // Upload reference image if exists
      if (referenceImage) {
        const fileExt = referenceImage.name.split('.').pop();
        const fileName = `${Date.now()}.${fileExt}`;
        const { data, error } = await supabase.storage
          .from('character_references')
          .upload(fileName, referenceImage);

        if (error) {
          console.error("Upload error:", error);
          toast({
            title: "Upload Warning",
            description: "Could not upload reference image",
            variant: "destructive"
          });
        } else {
          const { data: { publicUrl } } = supabase.storage
            .from('character_references')
            .getPublicUrl(data.path);
          imageUrl = publicUrl;
        }
      }

      // Simulate AI generation process
      setTimeout(() => {
        const mockCharacter = {
          id: Date.now().toString(),
          name: characterName,
          description: characterDescription,
          referenceImageUrl: imageUrl,
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
          generatedImages: imageUrl ? [imageUrl] : []
        };

        setGeneratedCharacter(mockCharacter);
        setIsGenerating(false);

        toast({
          title: "Character Generated!",
          description: `${characterName} has been successfully created.`
        });
      }, 2000);

    } catch (error) {
      console.error("Generation error:", error);
      setIsGenerating(false);
      toast({
        title: "Error",
        description: "Failed to generate character.",
        variant: "destructive"
      });
    }
  };

  const handleSaveCharacter = async () => {
    if (!generatedCharacter) return;

    if (!user) {
      toast({
        title: "Login Required",
        description: "Please login to save characters.",
        variant: "destructive"
      });
      return;
    }

    try {
      const { error } = await supabase
        .from('characters')
        .insert({
          name: generatedCharacter.name,
          description: generatedCharacter.description,
          parameters: generatedCharacter.parameters,
          generated_images: generatedCharacter.generatedImages,
          reference_image_path: generatedCharacter.referenceImageUrl,
          user_id: user.id
        });

      if (error) throw error;

      toast({
        title: "Character Saved!",
        description: `${characterName} has been saved to your characters.`
      });

      navigate('/features#create-characters');
    } catch (error: any) {
      toast({
        title: "Save Failed",
        description: error.message,
        variant: "destructive"
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">


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
                    </div>

                    {/* Upload Reference Image */}
                    <div>
                      <Label htmlFor="reference-upload">Reference Image (Optional)</Label>
                      <div className="mt-2 flex justify-center px-6 pt-5 pb-6 border-2 border-dashed border-border rounded-lg hover:border-primary/50 transition-colors">
                        <div className="space-y-1 text-center">
                          {referenceImagePreview ? (
                            <div className="relative">
                              <img src={referenceImagePreview} alt="Preview" className="mx-auto h-32 w-32 object-cover rounded-lg" />
                              <Button
                                variant="ghost"
                                size="sm"
                                className="mt-2"
                                onClick={() => {
                                  setReferenceImage(null);
                                  setReferenceImagePreview(null);
                                }}
                              >
                                Remove
                              </Button>
                            </div>
                          ) : (
                            <>
                              <Upload className="mx-auto h-12 w-12 text-muted-foreground" />
                              <div className="flex text-sm text-muted-foreground">
                                <label
                                  htmlFor="reference-upload"
                                  className="relative cursor-pointer bg-background rounded-md font-medium text-primary hover:text-primary/80"
                                >
                                  <span>Upload a reference image</span>
                                  <input
                                    id="reference-upload"
                                    name="reference-upload"
                                    type="file"
                                    className="sr-only"
                                    accept="image/*"
                                    onChange={handleImageUpload}
                                  />
                                </label>
                                <p className="pl-1">or drag and drop</p>
                              </div>
                              <p className="text-xs text-muted-foreground">PNG, JPG, GIF up to 10MB</p>
                            </>
                          )}
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
                  <div className="w-48 h-48 rounded-lg bg-gradient-to-r from-primary to-accent mx-auto mb-4 overflow-hidden">
                    {generatedCharacter.generatedImages[0] ? (
                      <img
                        src={generatedCharacter.generatedImages[0]}
                        alt={generatedCharacter.name}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-white text-6xl font-bold">
                        {generatedCharacter.name.charAt(0)}
                      </div>
                    )}
                  </div>
                  <h2 className="text-2xl font-bold">{generatedCharacter.name}</h2>
                  {generatedCharacter.description && (
                    <p className="text-muted-foreground mt-2">{generatedCharacter.description}</p>
                  )}
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


    </div>
  );
};

export default CharacterCreator;