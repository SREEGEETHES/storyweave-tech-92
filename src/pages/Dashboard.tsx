import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { 
  Video, 
  Users, 
  Crown, 
  Settings, 
  Play, 
  Download, 
  Edit3,
  Trash2,
  Plus,
  Clock,
  Eye
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";

const Dashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("videos");

  // Mock user data
  const user = {
    name: "John Doe",
    email: "john@example.com",
    plan: "Pro",
    videosCreated: 127,
    charactersCreated: 23
  };

  // Mock recent videos
  const recentVideos = [
    {
      id: 1,
      title: "Product Demo Video",
      thumbnail: "/placeholder.svg",
      duration: "2:34",
      style: "Cinematic",
      status: "Completed",
      createdAt: "2 hours ago"
    },
    {
      id: 2,
      title: "Brand Story Animation",
      thumbnail: "/placeholder.svg",
      duration: "1:45",
      style: "Animated",
      status: "Processing",
      createdAt: "5 hours ago"
    },
    {
      id: 3,
      title: "Tutorial Walkthrough",
      thumbnail: "/placeholder.svg",
      duration: "3:12",
      style: "Realistic",
      status: "Completed",
      createdAt: "1 day ago"
    }
  ];

  // Mock saved characters
  const savedCharacters = [
    {
      id: 1,
      name: "Professional Sarah",
      avatar: "/placeholder.svg",
      style: "Realistic",
      createdAt: "3 days ago"
    },
    {
      id: 2,
      name: "Cartoon Bob",
      avatar: "/placeholder.svg",
      style: "Cartoon",
      createdAt: "1 week ago"
    },
    {
      id: 3,
      name: "Anime Hero",
      avatar: "/placeholder.svg",
      style: "Animated",
      createdAt: "2 weeks ago"
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="pt-20 pb-12">
        <div className="container mx-auto px-4">
          {/* Welcome Section */}
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
              Welcome back, {user.name}!
            </h1>
            <p className="text-muted-foreground">
              Ready to create some amazing videos today?
            </p>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card className="glass">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Current Plan</p>
                    <p className="text-2xl font-bold flex items-center gap-2">
                      {user.plan}
                      <Crown className="w-5 h-5 text-feature-accent" />
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="glass">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Videos Created</p>
                    <p className="text-2xl font-bold">{user.videosCreated}</p>
                  </div>
                  <Video className="w-8 h-8 text-primary" />
                </div>
              </CardContent>
            </Card>

            <Card className="glass">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-muted-foreground">Characters</p>
                    <p className="text-2xl font-bold">{user.charactersCreated}</p>
                  </div>
                  <Users className="w-8 h-8 text-accent" />
                </div>
              </CardContent>
            </Card>

            <Card className="glass">
              <CardContent className="p-6 flex items-center justify-center">
                <Button 
                  className="cta-primary w-full"
                  onClick={() => navigate('/features')}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Video
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 glass">
              <TabsTrigger value="videos">Recent Videos</TabsTrigger>
              <TabsTrigger value="characters">Saved Characters</TabsTrigger>
              <TabsTrigger value="settings">Account Settings</TabsTrigger>
            </TabsList>

            <TabsContent value="videos" className="mt-6">
              <div className="grid gap-4">
                {recentVideos.map((video) => (
                  <Card key={video.id} className="glass">
                    <CardContent className="p-6">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                          <div className="w-16 h-16 bg-gradient-to-r from-primary to-accent rounded-lg flex items-center justify-center">
                            <Video className="w-8 h-8 text-white" />
                          </div>
                          <div>
                            <h3 className="font-semibold">{video.title}</h3>
                            <div className="flex items-center gap-4 text-sm text-muted-foreground">
                              <span className="flex items-center gap-1">
                                <Clock className="w-4 h-4" />
                                {video.duration}
                              </span>
                              <Badge variant="secondary">{video.style}</Badge>
                              <span>{video.createdAt}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          {video.status === "Completed" ? (
                            <>
                              <Button variant="ghost" size="sm">
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button variant="ghost" size="sm">
                                <Download className="w-4 h-4" />
                              </Button>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => navigate('/editor')}
                              >
                                <Edit3 className="w-4 h-4" />
                              </Button>
                            </>
                          ) : (
                            <Badge variant="outline" className="animate-pulse">
                              {video.status}
                            </Badge>
                          )}
                          <Button variant="ghost" size="sm" className="text-destructive">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="characters" className="mt-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {savedCharacters.map((character) => (
                  <Card key={character.id} className="glass">
                    <CardContent className="p-6">
                      <div className="text-center">
                        <div className="w-20 h-20 bg-gradient-to-r from-primary to-accent rounded-full mx-auto mb-4 flex items-center justify-center">
                          <Users className="w-10 h-10 text-white" />
                        </div>
                        <h3 className="font-semibold mb-2">{character.name}</h3>
                        <Badge variant="secondary" className="mb-3">{character.style}</Badge>
                        <p className="text-sm text-muted-foreground mb-4">
                          Created {character.createdAt}
                        </p>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm" className="flex-1">
                            Edit
                          </Button>
                          <Button variant="outline" size="sm" className="flex-1">
                            Use
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
                
                <Card className="glass border-dashed border-primary/50 hover:border-primary transition-colors cursor-pointer">
                  <CardContent className="p-6 flex flex-col items-center justify-center text-center min-h-[280px]">
                    <Plus className="w-12 h-12 text-primary mb-4" />
                    <h3 className="font-semibold mb-2">Create New Character</h3>
                    <p className="text-sm text-muted-foreground">
                      Upload an image or describe your character
                    </p>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="settings" className="mt-6">
              <div className="grid gap-6">
                <Card className="glass">
                  <CardHeader>
                    <CardTitle>Subscription Details</CardTitle>
                    <CardDescription>Manage your subscription and billing</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">Current Plan: {user.plan}</p>
                        <p className="text-sm text-muted-foreground">Billed monthly • Next billing: Dec 15, 2024</p>
                      </div>
                      <Button 
                        variant="outline"
                        onClick={() => navigate('/pricing')}
                      >
                        Upgrade Plan
                      </Button>
                    </div>
                  </CardContent>
                </Card>

                <Card className="glass">
                  <CardHeader>
                    <CardTitle>Account Information</CardTitle>
                    <CardDescription>Update your personal information</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="text-sm font-medium">Name</label>
                        <p className="text-sm text-muted-foreground">{user.name}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium">Email</label>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                    </div>
                    <Button variant="outline">
                      <Settings className="w-4 h-4 mr-2" />
                      Edit Profile
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;