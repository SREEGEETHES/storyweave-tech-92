import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronUp, Play } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Template {
  id: string;
  name: string;
  description: string;
  previewText: string;
  category: string;
}

interface TemplateForm {
  idea: string;
  duration: string;
  frameSize: string;
  voice: string;
  style: string;
  characters: string;
}

const templateCategories = {
  Marketing: [
    {
      id: "product-launch",
      name: "Product Launch",
      description: "Introduce new products with impact",
      previewText: "Introducing the revolutionary...",
      category: "Marketing"
    },
    {
      id: "brand-story", 
      name: "Brand Story",
      description: "Tell your company's journey",
      previewText: "It all started with a simple idea...",
      category: "Marketing"
    },
    {
      id: "testimonial",
      name: "Testimonial",
      description: "Customer success stories",
      previewText: "Here's what our customers say...",
      category: "Marketing"
    }
  ],
  Education: [
    {
      id: "course-intro",
      name: "Course Intro", 
      description: "Welcome students to your course",
      previewText: "Welcome to the complete guide...",
      category: "Education"
    },
    {
      id: "tutorial",
      name: "Tutorial",
      description: "Step-by-step learning videos",
      previewText: "In this tutorial, you'll learn...",
      category: "Education"
    },
    {
      id: "explainer",
      name: "Explainer",
      description: "Simplify complex concepts",
      previewText: "Let me break this down for you...",
      category: "Education"
    }
  ],
  Entertainment: [
    {
      id: "storytelling",
      name: "Storytelling",
      description: "Engaging narrative content",
      previewText: "Once upon a time...",
      category: "Entertainment"
    },
    {
      id: "comedy",
      name: "Comedy",
      description: "Humorous and fun content",
      previewText: "Get ready to laugh...",
      category: "Entertainment"
    },
    {
      id: "lifestyle",
      name: "Lifestyle",
      description: "Daily life and experiences",
      previewText: "Join me on this journey...",
      category: "Entertainment"
    }
  ]
};

const allTemplates = Object.values(templateCategories).flat();

const ProfessionalTemplates = () => {
  console.log("ProfessionalTemplates component loaded"); // Debug log to force refresh
  const [activeCategory, setActiveCategory] = useState<string>("Marketing");
  const [expandedTemplate, setExpandedTemplate] = useState<string | null>(null);
  const [templateForms, setTemplateForms] = useState<Record<string, TemplateForm>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const initializeForm = (templateId: string): TemplateForm => {
    const defaultForms: Record<string, Partial<TemplateForm>> = {
      "product-launch": {
        idea: "Showcase our revolutionary new AI-powered analytics platform",
        duration: "60",
        frameSize: "1080x1920",
        voice: "Professional Male",
        style: "Modern Corporate",
        characters: "Business professional, diverse team"
      },
      "brand-story": {
        idea: "Our journey from startup to industry leader",
        duration: "90",
        frameSize: "1920x1080",
        voice: "Warm Female",
        style: "Cinematic",
        characters: "Founder, employees, customers"
      },
      testimonial: {
        idea: "Customer success story with our product",
        duration: "45",
        frameSize: "1080x1920",
        voice: "Conversational",
        style: "Authentic",
        characters: "Happy customer, product in use"
      },
      "course-intro": {
        idea: "Welcome to Digital Marketing Mastery",
        duration: "30",
        frameSize: "1920x1080",
        voice: "Enthusiastic Instructor",
        style: "Dynamic Intro",
        characters: "Course instructor, success examples"
      },
      tutorial: {
        idea: "How to use advanced Excel formulas",
        duration: "120",
        frameSize: "1920x1080", 
        voice: "Clear Instructor",
        style: "Educational",
        characters: "Teacher, student examples"
      },
      explainer: {
        idea: "How blockchain technology works",
        duration: "90",
        frameSize: "1920x1080",
        voice: "Friendly Expert",
        style: "Animated Explainer",
        characters: "Narrator, visual metaphors"
      },
      storytelling: {
        idea: "The inspiring story of overcoming challenges",
        duration: "180",
        frameSize: "1920x1080",
        voice: "Narrative Voice",
        style: "Cinematic Story",
        characters: "Protagonist, supporting characters"
      },
      comedy: {
        idea: "Top 5 funny pet moments compilation",
        duration: "60",
        frameSize: "1080x1920",
        voice: "Energetic Host",
        style: "Fun & Playful",
        characters: "Pets, owners, funny situations"
      },
      lifestyle: {
        idea: "A day in the life of a digital nomad",
        duration: "90",
        frameSize: "1080x1920",
        voice: "Personal Narrator",
        style: "Lifestyle Vlog",
        characters: "Content creator, everyday people"
      }
    };

    return {
      idea: defaultForms[templateId]?.idea || "",
      duration: defaultForms[templateId]?.duration || "60",
      frameSize: defaultForms[templateId]?.frameSize || "1920x1080",
      voice: defaultForms[templateId]?.voice || "Professional",
      style: defaultForms[templateId]?.style || "Modern",
      characters: defaultForms[templateId]?.characters || ""
    };
  };

  const handleTemplateExpand = (templateId: string) => {
    if (expandedTemplate === templateId) {
      setExpandedTemplate(null);
    } else {
      setExpandedTemplate(templateId);
      if (!templateForms[templateId]) {
        setTemplateForms(prev => ({
          ...prev,
          [templateId]: initializeForm(templateId)
        }));
      }
    }
  };

  const updateForm = (templateId: string, field: keyof TemplateForm, value: string) => {
    setTemplateForms(prev => ({
      ...prev,
      [templateId]: {
        ...prev[templateId],
        [field]: value
      }
    }));
  };

  const handleGenerateVideo = async (templateId: string) => {
    const form = templateForms[templateId];
    if (!form?.idea.trim()) {
      toast({
        title: "Idea Required",
        description: "Please provide an idea for your video.",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    
    // Simulate video generation
    setTimeout(() => {
      setIsGenerating(false);
      toast({
        title: "Video Generated!",
        description: `Your ${allTemplates.find(t => t.id === templateId)?.name} video is ready.`,
      });
      
      // Collapse the template after generation
      setExpandedTemplate(null);
    }, 3000);
  };

  const voiceOptions = [
    "Professional Male",
    "Professional Female", 
    "Warm Female",
    "Conversational Male",
    "Energetic Host",
    "Clear Instructor",
    "Friendly Expert",
    "Enthusiastic Instructor",
    "Quick & Punchy"
  ];

  const styleOptions = [
    "Modern Corporate",
    "Cinematic",
    "Authentic",
    "Educational", 
    "Animated Explainer",
    "Dynamic Intro",
    "Fun & Playful",
    "Social Media",
    "Minimalist",
    "Creative"
  ];

  const frameSizeOptions = [
    "1920x1080 (Landscape)",
    "1080x1920 (Portrait)", 
    "1080x1080 (Square)",
    "1280x720 (HD)"
  ];

  return (
    <section id="templates" className="py-24">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <div className="inline-flex items-center glass rounded-full px-6 py-2 mb-6">
            <Play className="w-4 h-4 text-feature-accent mr-2" />
            <span className="text-sm font-medium">Professional Templates</span>
          </div>
          
          <h2 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            Ready-to-Use
            <span className="block">Video Templates</span>
          </h2>
          
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
            Choose from our collection of professional templates. Each template includes customizable 
            fields to match your specific needs and brand requirements.
          </p>
        </div>

        {/* Category Tabs */}
        <div className="flex justify-center mb-12">
          <div className="flex bg-card/50 backdrop-blur-sm rounded-full p-1 border">
            {Object.keys(templateCategories).map((category) => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`px-8 py-3 rounded-full text-sm font-medium transition-all duration-300 ${
                  activeCategory === category
                    ? 'bg-primary text-primary-foreground shadow-lg'
                    : 'text-muted-foreground hover:text-primary'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Templates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {templateCategories[activeCategory as keyof typeof templateCategories].map((template) => (
            <Card key={template.id} className="glass overflow-hidden border-2 border-transparent hover:border-primary/20 transition-all duration-300">
              <CardHeader className="pb-4">
                <CardTitle className="text-xl mb-2">{template.name}</CardTitle>
                <p className="text-sm text-muted-foreground mb-4">{template.description}</p>
                
                {/* Preview Text */}
                <div className="bg-muted/30 rounded-lg p-4 mb-4">
                  <p className="text-sm italic text-muted-foreground">"{template.previewText}"</p>
                </div>
              </CardHeader>

              <CardContent className="pt-0">
                <Collapsible open={expandedTemplate === template.id}>
                  <CollapsibleTrigger asChild>
                    <Button 
                      variant="outline" 
                      className="w-full mb-4 border-primary/30 hover:border-primary hover:bg-primary/5"
                      onClick={() => handleTemplateExpand(template.id)}
                    >
                      Use Template
                      {expandedTemplate === template.id ? (
                        <ChevronUp className="w-4 h-4 ml-2" />
                      ) : (
                        <ChevronDown className="w-4 h-4 ml-2" />
                      )}
                    </Button>
                  </CollapsibleTrigger>

                  <CollapsibleContent className="space-y-4">
                    {templateForms[template.id] && (
                      <>
                        <div>
                          <Label htmlFor={`idea-${template.id}`}>Idea of the video *</Label>
                          <Textarea
                            id={`idea-${template.id}`}
                            value={templateForms[template.id].idea}
                            onChange={(e) => updateForm(template.id, 'idea', e.target.value)}
                            placeholder="Describe your video idea..."
                            className="min-h-[80px]"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label htmlFor={`duration-${template.id}`}>Duration (seconds)</Label>
                            <Input
                              id={`duration-${template.id}`}
                              type="number"
                              value={templateForms[template.id].duration}
                              onChange={(e) => updateForm(template.id, 'duration', e.target.value)}
                              min="15"
                              max="300"
                            />
                          </div>

                          <div>
                            <Label htmlFor={`frameSize-${template.id}`}>Frame Size</Label>
                            <Select 
                              value={templateForms[template.id].frameSize} 
                              onValueChange={(value) => updateForm(template.id, 'frameSize', value)}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {frameSizeOptions.map((size) => (
                                  <SelectItem key={size} value={size.split(' ')[0]}>{size}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div>
                          <Label htmlFor={`voice-${template.id}`}>Voice</Label>
                          <Select 
                            value={templateForms[template.id].voice} 
                            onValueChange={(value) => updateForm(template.id, 'voice', value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {voiceOptions.map((voice) => (
                                <SelectItem key={voice} value={voice}>{voice}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label htmlFor={`style-${template.id}`}>Style</Label>
                          <Select 
                            value={templateForms[template.id].style} 
                            onValueChange={(value) => updateForm(template.id, 'style', value)}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {styleOptions.map((style) => (
                                <SelectItem key={style} value={style}>{style}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label htmlFor={`characters-${template.id}`}>Character(s) in the video</Label>
                          <Textarea
                            id={`characters-${template.id}`}
                            value={templateForms[template.id].characters}
                            onChange={(e) => updateForm(template.id, 'characters', e.target.value)}
                            placeholder="Describe the characters or people in your video..."
                            className="min-h-[60px]"
                          />
                        </div>

                        <Button 
                          onClick={() => handleGenerateVideo(template.id)}
                          disabled={isGenerating}
                          className="w-full cta-primary mt-4"
                        >
                          {isGenerating ? "Generating Video..." : "Generate Video"}
                        </Button>
                      </>
                    )}
                  </CollapsibleContent>
                </Collapsible>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default ProfessionalTemplates;