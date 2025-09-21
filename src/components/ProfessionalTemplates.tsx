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
  icon: any;
  description: string;
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

const templates: Template[] = [
  {
    id: "marketing",
    name: "Marketing",
    icon: Megaphone,
    description: "Create compelling marketing videos for products and services",
    category: "Business"
  },
  {
    id: "brand-story",
    name: "Brand Story",
    icon: Briefcase,
    description: "Tell your brand's story with engaging narrative videos",
    category: "Business"
  },
  {
    id: "testimonial",
    name: "Testimonial", 
    icon: Heart,
    description: "Showcase customer success stories and reviews",
    category: "Social Proof"
  },
  {
    id: "education",
    name: "Education",
    icon: GraduationCap,
    description: "Create educational content and tutorials",
    category: "Learning"
  },
  {
    id: "explainer",
    name: "Explainer",
    icon: BookOpen,
    description: "Explain complex concepts in simple terms",
    category: "Learning"
  },
  {
    id: "course-intro",
    name: "Course Intro",
    icon: Play,
    description: "Engaging introductions for online courses",
    category: "Learning"
  },
  {
    id: "entertainment",
    name: "Entertainment",
    icon: PartyPopper,
    description: "Fun and engaging entertainment content",
    category: "Creative"
  },
  {
    id: "social-media",
    name: "Social Media",
    icon: Users,
    description: "Short-form content for social platforms",
    category: "Social"
  }
];

const ProfessionalTemplates = () => {
  const [expandedTemplate, setExpandedTemplate] = useState<string | null>(null);
  const [templateForms, setTemplateForms] = useState<Record<string, TemplateForm>>({});
  const [isGenerating, setIsGenerating] = useState(false);
  const { toast } = useToast();

  const initializeForm = (templateId: string): TemplateForm => {
    const defaultForms: Record<string, Partial<TemplateForm>> = {
      marketing: {
        idea: "Showcase our new AI-powered analytics platform",
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
      education: {
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
      "course-intro": {
        idea: "Welcome to Digital Marketing Mastery",
        duration: "30",
        frameSize: "1920x1080",
        voice: "Enthusiastic Instructor",
        style: "Dynamic Intro",
        characters: "Course instructor, success examples"
      },
      entertainment: {
        idea: "Top 5 funny pet moments compilation",
        duration: "60",
        frameSize: "1080x1920",
        voice: "Energetic Host",
        style: "Fun & Playful",
        characters: "Pets, owners, funny situations"
      },
      "social-media": {
        idea: "Quick productivity hack for busy professionals",
        duration: "15",
        frameSize: "1080x1920",
        voice: "Quick & Punchy",
        style: "Social Media",
        characters: "Relatable professional, before/after"
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
        description: `Your ${templates.find(t => t.id === templateId)?.name} video is ready.`,
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

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 max-w-6xl mx-auto">
          {templates.map((template) => (
            <Card key={template.id} className="glass overflow-hidden">
              <CardHeader className="pb-4">
                <div className="flex items-center space-x-3 mb-2">
                  <div className="w-10 h-10 rounded-lg bg-gradient-to-r from-primary to-accent flex items-center justify-center">
                    <template.icon className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">{template.name}</CardTitle>
                    <p className="text-sm text-muted-foreground">{template.category}</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground">{template.description}</p>
              </CardHeader>

              <CardContent className="pt-0">
                <Collapsible open={expandedTemplate === template.id}>
                  <CollapsibleTrigger asChild>
                    <Button 
                      variant="outline" 
                      className="w-full mb-4"
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