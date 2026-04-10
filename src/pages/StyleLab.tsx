
import { useState } from "react";
import { Upload, Film, Wand2, Play, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { Progress } from "@/components/ui/progress";
import { aiService } from "@/services/aiService";

const StyleLab = () => {
    const [isAnalyzing, setIsAnalyzing] = useState(false);
    const [progress, setProgress] = useState(0);
    const [step, setStep] = useState<"upload" | "analyzing" | "result">("upload");
    const { toast } = useToast();

    const handleUpload = async () => {
        // Create a hidden file input to simulate real upload UX, or just mock it for now
        // For this step, we'll simulate the file object since we just clicked the div
        const mockFile = new File([""], "video.mp4", { type: "video/mp4" });

        setIsAnalyzing(true);
        setStep("analyzing");
        setProgress(0);

        // Start progress simulation purely for visual feedback while awaiting the service
        const interval = setInterval(() => {
            setProgress((prev) => (prev < 90 ? prev + 5 : prev));
        }, 300);

        try {
            // Call the new AI Service
            const analysisResult = await aiService.analyzeVideoStyle(mockFile);

            clearInterval(interval);
            setProgress(100);

            // Give a small delay so user sees 100%
            setTimeout(() => {
                setIsAnalyzing(false);
                setStep("result");
                toast({
                    title: "Style Extracted Successfully",
                    description: `Captured style: ${analysisResult.name}`,
                });
                // In a real app, we'd save 'analysisResult' to state to display it below
            }, 500);

        } catch (error) {
            console.error(error);
            clearInterval(interval);
            setIsAnalyzing(false);
            toast({
                title: "Analysis Failed",
                description: "Could not analyze video style.",
                variant: "destructive"
            });
        }
    };

    return (
        <div className="container mx-auto px-4 py-24 min-h-screen">
            <div className="max-w-4xl mx-auto text-center mb-16">
                <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
                    Style Lab
                </h1>
                <p className="text-xl text-muted-foreground">
                    Clone the editing style of any viral video. Upload a reference (e.g., Zack D. Style) and we'll extract the DNA.
                </p>
            </div>

            <div className="max-w-2xl mx-auto">
                {step === "upload" && (
                    <Card className="p-12 border-2 border-dashed border-primary/20 bg-background/50 hover:bg-background/80 transition-all cursor-pointer group" onClick={handleUpload}>
                        <div className="flex flex-col items-center justify-center space-y-6">
                            <div className="p-6 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors">
                                <Upload className="w-12 h-12 text-primary" />
                            </div>
                            <div className="text-center space-y-2">
                                <h3 className="text-2xl font-semibold">Upload Reference Video</h3>
                                <p className="text-muted-foreground">MP4, MOV, or YouTube Link</p>
                            </div>
                        </div>
                    </Card>
                )}

                {step === "analyzing" && (
                    <Card className="p-8 space-y-8 glass">
                        <div className="flex items-center space-x-4">
                            <Wand2 className="w-8 h-8 text-primary animate-pulse" />
                            <div className="flex-1">
                                <h3 className="text-xl font-semibold mb-2">Extracting Style DNA...</h3>
                                <Progress value={progress} className="h-2" />
                            </div>
                            <span className="font-mono text-primary">{progress}%</span>
                        </div>

                        <div className="grid grid-cols-2 gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center space-x-2">
                                <div className={`w-2 h-2 rounded-full ${progress > 20 ? 'bg-green-500' : 'bg-gray-700'}`} />
                                <span>Detecting Pacing</span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <div className={`w-2 h-2 rounded-full ${progress > 40 ? 'bg-green-500' : 'bg-gray-700'}`} />
                                <span>Analyzing Color Grade</span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <div className={`w-2 h-2 rounded-full ${progress > 60 ? 'bg-green-500' : 'bg-gray-700'}`} />
                                <span>Extracting Font Styles</span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <div className={`w-2 h-2 rounded-full ${progress > 80 ? 'bg-green-500' : 'bg-gray-700'}`} />
                                <span>Mapping Transitions</span>
                            </div>
                        </div>
                    </Card>
                )}

                {step === "result" && (
                    <div className="space-y-6 animate-fade-in">
                        <Card className="p-8 glass border-primary/50">
                            <div className="flex items-start justify-between mb-8">
                                <div className="flex items-center space-x-4">
                                    <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                                        <Film className="w-8 h-8 text-white" />
                                    </div>
                                    <div>
                                        <h3 className="text-2xl font-bold">Fast-Paced Explainer (Zack D.)</h3>
                                        <p className="text-muted-foreground">Style Confidence: 98%</p>
                                    </div>
                                </div>
                                <Button variant="outline" onClick={() => setStep("upload")}>Analyze Another</Button>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
                                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                                    <div className="text-sm text-muted-foreground mb-1">Cuts Per Minute</div>
                                    <div className="text-2xl font-bold text-foreground">42</div>
                                </div>
                                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                                    <div className="text-sm text-muted-foreground mb-1">Color Profile</div>
                                    <div className="text-2xl font-bold text-foreground">High Contrast</div>
                                </div>
                                <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                                    <div className="text-sm text-muted-foreground mb-1">Typography</div>
                                    <div className="text-2xl font-bold text-foreground">Impact Bold</div>
                                </div>
                            </div>

                            <div className="flex gap-4">
                                <Button className="flex-1 h-12 text-lg">
                                    <Play className="w-5 h-5 mr-2" />
                                    Apply This Style
                                </Button>
                                <Button variant="secondary" className="flex-1 h-12 text-lg">
                                    <CheckCircle2 className="w-5 h-5 mr-2" />
                                    Save to Library
                                </Button>
                            </div>
                        </Card>
                    </div>
                )}
            </div>
        </div>
    );
};

export default StyleLab;
