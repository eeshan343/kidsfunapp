import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { BookOpen, Calendar, Check, Gift, Sparkles } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import {
  type Story,
  seasonalEventStories,
} from "../content/seasonalEventStories";
import { useGetActiveSeasonalEvents } from "../hooks/useQueries";

export default function SeasonalEventsPage() {
  const { data: activeEvents = [] } = useGetActiveSeasonalEvents();
  const [currentSeason, setCurrentSeason] = useState<string>("");
  const [selectedActivity, setSelectedActivity] = useState<string | null>(null);
  const [selectedDecoration, setSelectedDecoration] = useState<string | null>(
    null,
  );
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [completedActivities, setCompletedActivities] = useState<string[]>([]);
  const [activeTab, setActiveTab] = useState<string>("activities");
  const [showNarrationScript, setShowNarrationScript] =
    useState<boolean>(false);

  useEffect(() => {
    const month = new Date().getMonth();
    if (month === 11 || month === 0) setCurrentSeason("christmas");
    else if (month === 9) setCurrentSeason("halloween");
    else if (month === 2 || month === 3) setCurrentSeason("easter");
    else if (month === 10) setCurrentSeason("diwali");
    else setCurrentSeason("general");
  }, []);

  const seasonalThemes = {
    christmas: {
      name: "Christmas",
      icon: "🎄",
      color: "from-red-500 to-green-500",
      border: "/assets/generated/christmas-border.dim_400x100.png",
      activities: [
        "Decorate the tree",
        "Write to Santa",
        "Make snowflakes",
        "Sing carols",
      ],
    },
    halloween: {
      name: "Halloween",
      icon: "🎃",
      color: "from-orange-500 to-purple-500",
      border: "/assets/generated/halloween-border.dim_400x100.png",
      activities: [
        "Trick or treat",
        "Carve pumpkins",
        "Costume contest",
        "Spooky stories",
      ],
    },
    diwali: {
      name: "Diwali",
      icon: "🪔",
      color: "from-yellow-500 to-orange-500",
      border: "/assets/generated/diwali-border.dim_400x100.png",
      activities: [
        "Light diyas",
        "Make rangoli",
        "Share sweets",
        "Fireworks show",
      ],
    },
    easter: {
      name: "Easter",
      icon: "🐰",
      color: "from-pink-500 to-blue-500",
      border: "/assets/generated/easter-border.dim_400x100.png",
      activities: [
        "Egg hunt",
        "Decorate eggs",
        "Bunny crafts",
        "Spring picnic",
      ],
    },
  };

  const theme = seasonalThemes[
    currentSeason as keyof typeof seasonalThemes
  ] || {
    name: "All Year Round",
    icon: "🌟",
    color: "from-purple-500 to-pink-500",
    border: "",
    activities: ["Play games", "Create art", "Learn new things", "Have fun"],
  };

  const handleActivityStart = (activity: string) => {
    setSelectedActivity(activity);
    toast.success(`Starting activity: ${activity}! 🎉`, {
      description: "Have fun and enjoy!",
    });

    // Simulate activity completion after 2 seconds
    setTimeout(() => {
      setCompletedActivities((prev) => [...prev, activity]);
      toast.success(`Activity completed: ${activity}! ⭐`, {
        description: "Great job!",
      });
      setSelectedActivity(null);
    }, 2000);
  };

  const handleDecorationApply = (decoration: string) => {
    setSelectedDecoration(decoration);
    toast.success(`Applied decoration: ${decoration}! ✨`, {
      description: "Your app looks festive!",
    });
  };

  const handleStoryRead = (story: Story) => {
    setSelectedStory(story);
    setShowNarrationScript(false);
  };

  const handleCloseStory = () => {
    setSelectedStory(null);
    setShowNarrationScript(false);
    setActiveTab("stories");
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-purple-600 via-pink-600 to-yellow-600 bg-clip-text text-transparent">
          Seasonal Events {theme.icon}
        </h1>
        <p className="text-xl text-gray-700">
          Celebrate special occasions with themed activities!
        </p>
      </div>

      <Card className={`border-4 bg-gradient-to-r ${theme.color} text-white`}>
        <CardHeader className="text-center">
          <div className="text-6xl mb-2">{theme.icon}</div>
          <CardTitle className="text-3xl">{theme.name} Season</CardTitle>
          <CardDescription className="text-white/90 text-lg">
            Special activities and decorations just for you!
          </CardDescription>
        </CardHeader>
        {theme.border && (
          <div className="px-6 pb-6">
            <img
              src={theme.border}
              alt="Seasonal border"
              className="w-full rounded-lg"
            />
          </div>
        )}
      </Card>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="activities">Activities</TabsTrigger>
          <TabsTrigger value="decorations">Decorations</TabsTrigger>
          <TabsTrigger value="stories">Stories</TabsTrigger>
        </TabsList>

        <TabsContent value="activities" className="mt-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {theme.activities.map((activity, index) => {
              const isCompleted = completedActivities.includes(activity);
              const isActive = selectedActivity === activity;

              return (
                <Card
                  // biome-ignore lint/suspicious/noArrayIndexKey: positional list
                  key={index}
                  className="border-4 hover:shadow-xl transition-all cursor-pointer hover:scale-105"
                >
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      {isCompleted ? (
                        <Check className="w-5 h-5 text-green-500" />
                      ) : (
                        <Sparkles className="w-5 h-5 text-yellow-500" />
                      )}
                      {activity}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Button
                      className="w-full"
                      onClick={() => handleActivityStart(activity)}
                      disabled={isActive}
                      variant={isCompleted ? "outline" : "default"}
                    >
                      {isActive
                        ? "In Progress..."
                        : isCompleted
                          ? "Completed ✓"
                          : "Start Activity"}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="decorations" className="mt-6">
          <Card className="border-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Gift className="w-6 h-6" />
                Seasonal Decorations
              </CardTitle>
              <CardDescription>
                Customize your app with festive themes!
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {["🎁", "⭐", "🎈", "🎊", "🎀", "✨", "🌟", "💫"].map(
                  (emoji, index) => (
                    <Card
                      // biome-ignore lint/suspicious/noArrayIndexKey: positional list
                      key={index}
                      className={`p-6 text-center hover:shadow-lg transition-all cursor-pointer border-2 ${
                        selectedDecoration === emoji
                          ? "border-primary ring-2 ring-primary"
                          : ""
                      }`}
                    >
                      <div className="text-5xl mb-2">{emoji}</div>
                      <Button
                        variant={
                          selectedDecoration === emoji ? "default" : "outline"
                        }
                        size="sm"
                        className="w-full"
                        onClick={() => handleDecorationApply(emoji)}
                      >
                        {selectedDecoration === emoji ? "Applied ✓" : "Apply"}
                      </Button>
                    </Card>
                  ),
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="stories" className="mt-6">
          <Card className="border-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="w-6 h-6" />
                Seasonal Stories
              </CardTitle>
              <CardDescription>Read fun stories for all ages!</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {seasonalEventStories.length === 0 ? (
                <div className="text-center py-12">
                  <Calendar className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                  <p className="text-lg text-gray-600">
                    No seasonal stories are available right now.
                  </p>
                  <p className="text-sm text-gray-500 mt-2">
                    Check back later for new stories!
                  </p>
                </div>
              ) : (
                seasonalEventStories.map((story) => (
                  <Card
                    key={story.id}
                    className="p-4 border-2 hover:shadow-lg transition-all"
                  >
                    <div className="flex items-start gap-3">
                      <BookOpen className="w-6 h-6 text-purple-600 flex-shrink-0" />
                      <div className="flex-1">
                        <h3 className="font-bold text-lg mb-1">
                          {story.title}
                        </h3>
                        <p className="text-sm text-gray-600 mb-3">
                          {story.genre}
                        </p>
                        <Button
                          onClick={() => handleStoryRead(story)}
                          size="sm"
                        >
                          Read Story
                        </Button>
                      </div>
                    </div>
                  </Card>
                ))
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {activeEvents.length > 0 && (
        <Card className="border-4 border-purple-400">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-6 h-6" />
              Active Events
            </CardTitle>
            <CardDescription>Special events happening now!</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {activeEvents.map((event) => (
                <Card key={event.id} className="p-4 border-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-semibold">{event.title}</p>
                      <p className="text-sm text-gray-600">{event.eventType}</p>
                    </div>
                    <Badge>{new Date(event.date).toLocaleDateString()}</Badge>
                  </div>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog
        open={!!selectedStory}
        onOpenChange={(open) => !open && handleCloseStory()}
      >
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-2xl">
              {selectedStory?.title}
            </DialogTitle>
            <DialogDescription>{selectedStory?.genre}</DialogDescription>
          </DialogHeader>

          {selectedStory && (
            <div className="space-y-4">
              <div className="flex gap-2">
                <Button
                  variant={!showNarrationScript ? "default" : "outline"}
                  onClick={() => setShowNarrationScript(false)}
                  size="sm"
                >
                  Kid-Safe Text
                </Button>
                <Button
                  variant={showNarrationScript ? "default" : "outline"}
                  onClick={() => setShowNarrationScript(true)}
                  size="sm"
                >
                  Read-Along Script
                </Button>
              </div>

              <div className="prose prose-sm max-w-none">
                {showNarrationScript ? (
                  <div className="whitespace-pre-wrap text-base leading-relaxed">
                    {selectedStory.narrationScript}
                  </div>
                ) : (
                  <div className="whitespace-pre-wrap text-base leading-relaxed">
                    {selectedStory.kidSafeText}
                  </div>
                )}
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t">
                <Button onClick={handleCloseStory} variant="outline">
                  Close
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
