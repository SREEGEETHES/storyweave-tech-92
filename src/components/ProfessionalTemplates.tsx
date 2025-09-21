import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { ChevronDown, ChevronUp, Play, Briefcase, Heart, GraduationCap, BookOpen, PartyPopper, Megaphone, Users } from "lucide-react";
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
    <section id="templates" className="py-24 bg-gradient-to-b from-background via-background/95 to-background">
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
          <div className="flex bg-card/80 backdrop-blur-sm rounded-2xl p-1.5 border border-border/50 shadow-lg">
            {Object.keys(templateCategories).map((category) => (
              <button
                key={category}
                onClick={() => setActiveCategory(category)}
                className={`px-8 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${
                  activeCategory === category
                    ? 'bg-primary text-primary-foreground shadow-lg scale-105'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                }`}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* Templates Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-7xl mx-auto">
          {templateCategories[activeCategory as keyof typeof templateCategories].map((template) => (
            <Card key={template.id} className="bg-card/95 backdrop-blur-sm border border-border/50 hover:border-primary/30 transition-all duration-300 hover:shadow-xl hover:shadow-primary/5 rounded-2xl overflow-hidden">
              <CardHeader className="pb-4 space-y-4">
                <CardTitle className="text-2xl font-bold text-foreground">{template.name}</CardTitle>
                <p className="text-muted-foreground text-sm leading-relaxed">{template.description}</p>
                
                {/* Preview Text */}
                <div className="bg-muted/40 rounded-xl p-4 border border-border/20">
                  <p className="text-sm italic text-muted-foreground font-medium">"{template.previewText}"</p>
                </div>
              </CardHeader>

              <CardContent className="pt-0">
                <Collapsible open={expandedTemplate === template.id}>
                  <CollapsibleTrigger asChild>
                    <Button 
                      variant="outline" 
                      className="w-full mb-4 bg-primary/5 border-primary/20 hover:border-primary hover:bg-primary/10 text-foreground font-medium rounded-xl h-12"
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

                  <CollapsibleContent className="space-y-4 mt-4 p-4 bg-muted/20 rounded-xl border border-border/20">
                    {templateForms[template.id] && (
                      <>
                        <div>
                          <Label htmlFor={`idea-${template.id}`} className="text-sm font-medium text-foreground mb-2 block">Idea of the video *</Label>
                          <Textarea
                            id={`idea-${template.id}`}
                            value={templateForms[template.id].idea}
                            onChange={(e) => updateForm(template.id, 'idea', e.target.value)}
                            placeholder="Describe your video idea..."
                            className="min-h-[80px] bg-background/50 border-border/50 focus:border-primary rounded-lg"
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <Label htmlFor={`duration-${template.id}`} className="text-sm font-medium text-foreground mb-2 block">Duration (seconds)</Label>
                            <Input
                              id={`duration-${template.id}`}
                              type="number"
                              value={templateForms[template.id].duration}
                              onChange={(e) => updateForm(template.id, 'duration', e.target.value)}
                              min="15"
                              max="300"
                              className="bg-background/50 border-border/50 focus:border-primary rounded-lg"
                            />
                          </div>

                          <div>
                            <Label htmlFor={`frameSize-${template.id}`} className="text-sm font-medium text-foreground mb-2 block">Frame Size</Label>
                            <Select 
                              value={templateForms[template.id].frameSize} 
                              onValueChange={(value) => updateForm(template.id, 'frameSize', value)}
                            >
                              <SelectTrigger className="bg-background/50 border-border/50 focus:border-primary rounded-lg">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent className="bg-card border-border/50 rounded-lg">
                                {frameSizeOptions.map((size) => (
                                  <SelectItem key={size} value={size.split(' ')[0]} className="hover:bg-muted/50">{size}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                        </div>

                        <div>
                          <Label htmlFor={`voice-${template.id}`} className="text-sm font-medium text-foreground mb-2 block">Voice</Label>
                          <Select 
                            value={templateForms[template.id].voice} 
                            onValueChange={(value) => updateForm(template.id, 'voice', value)}
                          >
                            <SelectTrigger className="bg-background/50 border-border/50 focus:border-primary rounded-lg">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-card border-border/50 rounded-lg">
                              {voiceOptions.map((voice) => (
                                <SelectItem key={voice} value={voice} className="hover:bg-muted/50">{voice}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label htmlFor={`style-${template.id}`} className="text-sm font-medium text-foreground mb-2 block">Style</Label>
                          <Select 
                            value={templateForms[template.id].style} 
                            onValueChange={(value) => updateForm(template.id, 'style', value)}
                          >
                            <SelectTrigger className="bg-background/50 border-border/50 focus:border-primary rounded-lg">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent className="bg-card border-border/50 rounded-lg">
                              {styleOptions.map((style) => (
                                <SelectItem key={style} value={style} className="hover:bg-muted/50">{style}</SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>

                        <div>
                          <Label htmlFor={`characters-${template.id}`} className="text-sm font-medium text-foreground mb-2 block">Character(s) in the video</Label>
                          <Textarea
                            id={`characters-${template.id}`}
                            value={templateForms[template.id].characters}
                            onChange={(e) => updateForm(template.id, 'characters', e.target.value)}
                            placeholder="Describe the characters or people in your video..."
                            className="min-h-[60px] bg-background/50 border-border/50 focus:border-primary rounded-lg"
                          />
                        </div>

                        <Button 
                          onClick={() => handleGenerateVideo(template.id)}
                          disabled={isGenerating}
                          className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-medium rounded-xl h-12 mt-6 shadow-lg shadow-primary/20"
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