import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { craftDiyProjects } from "@/content/craftDiyProjects";
import { useNavigate } from "@tanstack/react-router";
import { ArrowLeft, ExternalLink, Play, Sparkles, Video } from "lucide-react";
import { useState } from "react";

interface VideoChannelData {
  id: string;
  name: string;
  description: string;
  ageRange: string;
  playlistUrl: string;
  embedAllowed: boolean;
}

const videoChannels: VideoChannelData[] = [
  // Ages 1-3
  {
    id: "cocomelon",
    name: "CoComelon",
    description: "Educational nursery rhymes and songs for toddlers",
    ageRange: "1-3",
    playlistUrl: "https://www.youtube.com/c/CoComelon",
    embedAllowed: false,
  },
  {
    id: "super-simple-songs",
    name: "Super Simple Songs",
    description: "Simple songs and animations for young learners",
    ageRange: "1-3",
    playlistUrl: "https://www.youtube.com/c/SuperSimpleSongs",
    embedAllowed: true,
  },
  {
    id: "baby-bus",
    name: "BabyBus",
    description: "Fun educational videos for preschoolers",
    ageRange: "1-3",
    playlistUrl: "https://www.youtube.com/c/BabyBus",
    embedAllowed: true,
  },

  // Ages 4-6
  {
    id: "sesame-street",
    name: "Sesame Street",
    description: "Classic educational content with beloved characters",
    ageRange: "4-6",
    playlistUrl: "https://www.youtube.com/c/SesameStreet",
    embedAllowed: false,
  },
  {
    id: "pbs-kids",
    name: "PBS Kids",
    description: "Educational shows and activities",
    ageRange: "4-6",
    playlistUrl: "https://www.youtube.com/c/PBSKIDS",
    embedAllowed: true,
  },
  {
    id: "national-geographic-kids",
    name: "National Geographic Kids",
    description: "Explore animals, science, and nature",
    ageRange: "4-6",
    playlistUrl: "https://www.youtube.com/c/NatGeoKids",
    embedAllowed: true,
  },

  // Ages 7-12
  {
    id: "crash-course-kids",
    name: "Crash Course Kids",
    description: "Science education made fun and accessible",
    ageRange: "7-12",
    playlistUrl: "https://www.youtube.com/user/crashcoursekids",
    embedAllowed: true,
  },
  {
    id: "scishow-kids",
    name: "SciShow Kids",
    description: "Exploring science questions with curiosity",
    ageRange: "7-12",
    playlistUrl: "https://www.youtube.com/c/scishowkids",
    embedAllowed: true,
  },
  {
    id: "free-school",
    name: "Free School",
    description: "Educational videos on various subjects",
    ageRange: "7-12",
    playlistUrl: "https://www.youtube.com/c/FreeSchool",
    embedAllowed: true,
  },
];

export default function VideoHubPage() {
  const navigate = useNavigate();
  const [selectedChannel, setSelectedChannel] =
    useState<VideoChannelData | null>(null);
  const [selectedCraft, setSelectedCraft] = useState<
    (typeof craftDiyProjects)[0] | null
  >(null);
  const [activeTab, setActiveTab] = useState<"channels" | "crafts">("channels");
  const [ageFilter, setAgeFilter] = useState<string>("All");

  const ageGroups = ["All", "1-3", "4-6", "7-12"];

  const filteredChannels =
    ageFilter === "All"
      ? videoChannels
      : videoChannels.filter((ch) => ch.ageRange === ageFilter);

  const handleChannelClick = (channel: VideoChannelData) => {
    setSelectedChannel(channel);
  };

  const handleCraftClick = (craft: (typeof craftDiyProjects)[0]) => {
    setSelectedCraft(craft);
  };

  // Craft detail view - removed video embedding since videos are removed from craft projects
  if (selectedCraft) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <Button
            onClick={() => setSelectedCraft(null)}
            variant="ghost"
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Craft Tutorials
          </Button>

          <Card className="border-2 border-purple-300 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-purple-100 to-pink-100">
              <CardTitle className="text-2xl md:text-3xl font-bold text-purple-900">
                {selectedCraft.title}
              </CardTitle>
              <div className="flex gap-2 mt-2">
                <Badge variant="secondary">{selectedCraft.category}</Badge>
                <Badge variant="outline">{selectedCraft.difficulty}</Badge>
              </div>
            </CardHeader>

            <CardContent className="p-6 space-y-4">
              <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-6 text-center">
                <Sparkles className="w-12 h-12 mx-auto mb-3 text-yellow-600" />
                <p className="text-yellow-900 mb-2 font-semibold">
                  Craft Project Details
                </p>
                <p className="text-sm text-yellow-800">
                  Follow the step-by-step instructions in the Craft & DIY
                  section to complete this project!
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-purple-900 mb-2">
                  About This Craft
                </h3>
                <p className="text-gray-700 mb-2">
                  <strong>Materials:</strong>{" "}
                  {selectedCraft.materials.join(", ")}
                </p>
                <p className="text-gray-700">
                  <strong>Steps:</strong> {selectedCraft.steps.length}{" "}
                  step-by-step instructions
                </p>
              </div>

              <Button
                onClick={() => navigate({ to: "/craft-diy" })}
                className="w-full"
              >
                Go to Craft & DIY Section
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Channel detail view
  if (selectedChannel) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <Button
            onClick={() => setSelectedChannel(null)}
            variant="ghost"
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Channels
          </Button>

          <Card className="border-2 border-blue-300 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-blue-100 to-purple-100">
              <CardTitle className="text-2xl md:text-3xl font-bold text-blue-900">
                {selectedChannel.name}
              </CardTitle>
              <Badge variant="secondary" className="w-fit mt-2">
                Ages {selectedChannel.ageRange}
              </Badge>
            </CardHeader>

            <CardContent className="p-6 space-y-4">
              <p className="text-gray-700">{selectedChannel.description}</p>

              {selectedChannel.embedAllowed ? (
                <>
                  <div
                    className="relative w-full bg-black rounded-lg overflow-hidden"
                    style={{ paddingBottom: "56.25%" }}
                  >
                    <iframe
                      src={`https://www.youtube-nocookie.com/embed/videoseries?list=${selectedChannel.playlistUrl.split("/").pop()}`}
                      title={`${selectedChannel.name} videos`}
                      className="absolute top-0 left-0 w-full h-full"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                    />
                  </div>

                  <div className="bg-blue-50 border-2 border-blue-300 rounded-lg p-4">
                    <p className="text-sm text-blue-900 mb-3">
                      <strong>Safe Viewing:</strong> Videos are embedded from
                      YouTube with enhanced privacy settings.
                    </p>
                    <Button asChild variant="outline" className="w-full">
                      <a
                        href={selectedChannel.playlistUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center gap-2"
                      >
                        <ExternalLink className="w-4 h-4" />
                        Watch on YouTube
                      </a>
                    </Button>
                  </div>
                </>
              ) : (
                <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-6 text-center">
                  <Video className="w-12 h-12 mx-auto mb-3 text-yellow-600" />
                  <p className="text-yellow-900 mb-4">
                    This channel's videos cannot be embedded, but you can watch
                    them directly on YouTube!
                  </p>
                  <Button asChild className="w-full">
                    <a
                      href={selectedChannel.playlistUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center gap-2"
                    >
                      <ExternalLink className="w-4 h-4" />
                      Watch on YouTube
                    </a>
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Main hub view
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-purple-50 to-pink-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <Button
          onClick={() => navigate({ to: "/dashboard" })}
          variant="ghost"
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>

        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-blue-900 mb-2">
            Kids watching Hub
          </h1>
          <p className="text-lg text-gray-700">
            Safe, educational videos for kids of all ages
          </p>
        </div>

        <Tabs
          value={activeTab}
          onValueChange={(v) => setActiveTab(v as "channels" | "crafts")}
          className="mb-6"
        >
          <TabsList className="grid grid-cols-2 w-full max-w-md mx-auto">
            <TabsTrigger value="channels">
              <Video className="w-4 h-4 mr-2" />
              Channels
            </TabsTrigger>
            <TabsTrigger value="crafts">
              <Sparkles className="w-4 h-4 mr-2" />
              Craft Projects
            </TabsTrigger>
          </TabsList>

          <TabsContent value="channels" className="space-y-6">
            <div className="flex justify-center gap-2 flex-wrap">
              {ageGroups.map((age) => (
                <Button
                  key={age}
                  variant={ageFilter === age ? "default" : "outline"}
                  onClick={() => setAgeFilter(age)}
                  size="sm"
                >
                  {age === "All" ? "All Ages" : `Ages ${age}`}
                </Button>
              ))}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredChannels.map((channel) => (
                <Card
                  key={channel.id}
                  className="border-2 border-blue-200 hover:border-blue-400 transition-all cursor-pointer hover:shadow-lg"
                  onClick={() => handleChannelClick(channel)}
                >
                  <CardHeader className="bg-gradient-to-r from-blue-100 to-purple-100">
                    <CardTitle className="text-xl font-bold text-blue-900 flex items-center gap-2">
                      <Play className="w-5 h-5" />
                      {channel.name}
                    </CardTitle>
                    <Badge variant="secondary" className="w-fit">
                      Ages {channel.ageRange}
                    </Badge>
                  </CardHeader>
                  <CardContent className="p-4">
                    <p className="text-sm text-gray-700">
                      {channel.description}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="crafts" className="space-y-6">
            <div className="text-center mb-4">
              <p className="text-gray-700">
                Explore our craft projects with detailed step-by-step
                instructions!
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {craftDiyProjects.map((craft) => (
                <Card
                  key={craft.id}
                  className="border-2 border-purple-200 hover:border-purple-400 transition-all cursor-pointer hover:shadow-lg"
                  onClick={() => handleCraftClick(craft)}
                >
                  <CardHeader className="bg-gradient-to-r from-purple-100 to-pink-100">
                    <CardTitle className="text-xl font-bold text-purple-900 flex items-center gap-2">
                      <Sparkles className="w-5 h-5" />
                      {craft.title}
                    </CardTitle>
                    <div className="flex gap-2 mt-2">
                      <Badge variant="secondary">{craft.category}</Badge>
                      <Badge variant="outline">{craft.difficulty}</Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="p-4">
                    <p className="text-sm text-gray-600">
                      Learn how to make this {craft.category.toLowerCase()}{" "}
                      project
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>
        </Tabs>

        <div className="mt-8 bg-blue-50 border-2 border-blue-300 rounded-lg p-6 text-center">
          <p className="text-sm text-blue-900">
            <strong>Parent Note:</strong> All videos are from trusted
            educational channels. We recommend parental supervision for the best
            viewing experience.
          </p>
        </div>
      </div>
    </div>
  );
}
