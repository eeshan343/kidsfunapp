import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useNavigate } from "@tanstack/react-router";
import { Clock, Sparkles, Star, TrendingUp, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { useGetMyGameStates, useGetUserRewards } from "../hooks/useQueries";

type ModulePage =
  | "games"
  | "learn-hub"
  | "virtual-pet"
  | "rewards"
  | "spin-wheel"
  | "story-builder"
  | "art-gallery"
  | "music-remix"
  | "video-generator"
  | "sticker-creator"
  | "certificates"
  | "events"
  | "chat"
  | "jokes"
  | "feedback"
  | "seasonal-events"
  | "craft-diy"
  | "avatar-creator"
  | "creative-fun";

interface ActivityItem {
  id: string;
  title: string;
  type: string;
  lastPlayed: number;
  icon: string;
}

interface RecommendedActivity {
  id: string;
  title: string;
  description: string;
  icon: string;
  page: ModulePage;
  difficulty: string;
  tags: string[];
}

const ALL_ACTIVITIES: RecommendedActivity[] = [
  {
    id: "games",
    title: "Games Hub",
    description: "Play exciting games and earn trophies!",
    icon: "🎮",
    page: "games",
    difficulty: "medium",
    tags: ["fun", "games", "trophies"],
  },
  {
    id: "learn-hub",
    title: "Learn Hub",
    description: "Explore educational activities",
    icon: "📚",
    page: "learn-hub",
    difficulty: "easy",
    tags: ["learning", "education"],
  },
  {
    id: "virtual-pet",
    title: "Virtual Pet",
    description: "Care for your virtual pet",
    icon: "🐾",
    page: "virtual-pet",
    difficulty: "easy",
    tags: ["pet", "care", "fun"],
  },
  {
    id: "spin-wheel",
    title: "Spin the Wheel",
    description: "Spin to win trophies and points!",
    icon: "🎡",
    page: "spin-wheel",
    difficulty: "easy",
    tags: ["rewards", "fun", "trophies"],
  },
  {
    id: "story-builder",
    title: "Story Builder",
    description: "Create your own stories",
    icon: "📖",
    page: "story-builder",
    difficulty: "medium",
    tags: ["creative", "stories"],
  },
  {
    id: "art-gallery",
    title: "Art Gallery",
    description: "Share your artwork",
    icon: "🎨",
    page: "art-gallery",
    difficulty: "easy",
    tags: ["art", "creative"],
  },
  {
    id: "music-remix",
    title: "Music Remix",
    description: "Create music remixes",
    icon: "🎵",
    page: "music-remix",
    difficulty: "medium",
    tags: ["music", "creative"],
  },
  {
    id: "sticker-creator",
    title: "Sticker Creator",
    description: "Design custom stickers",
    icon: "🌟",
    page: "sticker-creator",
    difficulty: "easy",
    tags: ["creative", "art"],
  },
  {
    id: "craft-diy",
    title: "Craft & DIY",
    description: "Fun craft projects",
    icon: "✂️",
    page: "craft-diy",
    difficulty: "medium",
    tags: ["craft", "creative"],
  },
];

export default function SmartHubPage() {
  const navigate = useNavigate();
  const { data: gameStates = [] } = useGetMyGameStates();
  const { data: userRewards } = useGetUserRewards();

  const [dailyPick, setDailyPick] = useState<RecommendedActivity | null>(null);
  const [recommendations, setRecommendations] = useState<RecommendedActivity[]>(
    [],
  );
  const [recentlyPlayed, setRecentlyPlayed] = useState<ActivityItem[]>([]);

  useEffect(() => {
    // Set daily pick based on day of week
    const dayIndex = new Date().getDay();
    setDailyPick(ALL_ACTIVITIES[dayIndex % ALL_ACTIVITIES.length]);

    // Set recommendations (exclude daily pick)
    const recs = ALL_ACTIVITIES.filter(
      (_, i) => i !== dayIndex % ALL_ACTIVITIES.length,
    ).slice(0, 6);
    setRecommendations(recs);

    // Load recently played from localStorage
    try {
      const stored = localStorage.getItem("recentlyPlayed");
      if (stored) {
        setRecentlyPlayed(JSON.parse(stored));
      }
    } catch {
      // ignore
    }
  }, []);

  const handleNavigate = (page: ModulePage) => {
    const routeMap: Record<ModulePage, string> = {
      games: "/games",
      "learn-hub": "/learn-hub",
      "virtual-pet": "/virtual-pet",
      rewards: "/rewards",
      "spin-wheel": "/spin-wheel",
      "story-builder": "/story-builder",
      "art-gallery": "/art-gallery",
      "music-remix": "/music-remix",
      "video-generator": "/video-generator",
      "sticker-creator": "/sticker-creator",
      certificates: "/certificates",
      events: "/events",
      chat: "/chat",
      jokes: "/jokes",
      feedback: "/feedback",
      "seasonal-events": "/seasonal-events",
      "craft-diy": "/craft-diy",
      "avatar-creator": "/avatar-creator",
      "creative-fun": "/creative-fun",
    };
    const route = routeMap[page];
    if (route) navigate({ to: route });
  };

  const totalPoints = userRewards?.points || 0;
  const petLevel = userRewards?.virtualPetLevel || 1;

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-purple-600 via-pink-600 to-yellow-600 bg-clip-text text-transparent">
          Smart Hub ✨
        </h1>
        <p className="text-xl text-gray-700">
          Your personalized activity center
        </p>
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="border-4 bg-gradient-to-br from-yellow-50 to-orange-50 text-center">
          <CardContent className="pt-4">
            <p className="text-3xl font-bold text-yellow-600">{totalPoints}</p>
            <p className="text-sm text-gray-600">Total Points</p>
          </CardContent>
        </Card>
        <Card className="border-4 bg-gradient-to-br from-blue-50 to-purple-50 text-center">
          <CardContent className="pt-4">
            <p className="text-3xl font-bold text-blue-600">
              {gameStates.length}
            </p>
            <p className="text-sm text-gray-600">Games Played</p>
          </CardContent>
        </Card>
        <Card className="border-4 bg-gradient-to-br from-green-50 to-teal-50 text-center">
          <CardContent className="pt-4">
            <p className="text-3xl font-bold text-green-600">{petLevel}</p>
            <p className="text-sm text-gray-600">Pet Level</p>
          </CardContent>
        </Card>
        <Card className="border-4 bg-gradient-to-br from-pink-50 to-red-50 text-center">
          <CardContent className="pt-4">
            <p className="text-3xl font-bold text-pink-600">
              {recentlyPlayed.length}
            </p>
            <p className="text-sm text-gray-600">Recent Activities</p>
          </CardContent>
        </Card>
      </div>

      {/* Daily Pick */}
      {dailyPick && (
        <Card className="border-4 border-yellow-400 bg-gradient-to-br from-yellow-50 to-orange-50 shadow-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-yellow-700">
              <Star className="w-6 h-6 fill-yellow-500 text-yellow-500" />
              Daily Pick
            </CardTitle>
            <CardDescription>
              Today's recommended activity just for you!
            </CardDescription>
          </CardHeader>
          <CardContent className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <span className="text-5xl">{dailyPick.icon}</span>
              <div>
                <h3 className="text-2xl font-bold">{dailyPick.title}</h3>
                <p className="text-gray-600">{dailyPick.description}</p>
                <div className="flex gap-2 mt-2">
                  {dailyPick.tags.map((tag) => (
                    <Badge key={tag} variant="secondary">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
            <Button
              size="lg"
              onClick={() => handleNavigate(dailyPick.page)}
              className="bg-yellow-500 hover:bg-yellow-600 text-white"
            >
              <Zap className="w-4 h-4 mr-2" />
              Play Now!
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Recommendations */}
      <div>
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-purple-500" />
          Recommended for You
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {recommendations.map((activity) => (
            <Card
              key={activity.id}
              className="border-4 hover:shadow-lg transition-all cursor-pointer hover:scale-105"
              onClick={() => handleNavigate(activity.page)}
            >
              <CardContent className="pt-4">
                <div className="flex items-start gap-3">
                  <span className="text-4xl">{activity.icon}</span>
                  <div className="flex-1">
                    <h3 className="font-bold text-lg">{activity.title}</h3>
                    <p className="text-sm text-gray-600">
                      {activity.description}
                    </p>
                    <div className="flex gap-1 mt-2 flex-wrap">
                      {activity.tags.slice(0, 2).map((tag) => (
                        <Badge key={tag} variant="outline" className="text-xs">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>

      {/* Recently Played */}
      {recentlyPlayed.length > 0 && (
        <div>
          <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
            <Clock className="w-6 h-6 text-blue-500" />
            Recently Played
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {recentlyPlayed.slice(0, 8).map((item) => (
              <Card
                key={item.id}
                className="border-2 hover:shadow-md transition-shadow cursor-pointer"
              >
                <CardContent className="pt-3 text-center">
                  <span className="text-3xl">{item.icon}</span>
                  <p className="font-medium text-sm mt-1 truncate">
                    {item.title}
                  </p>
                  <p className="text-xs text-gray-500">{item.type}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Trending */}
      <div>
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <TrendingUp className="w-6 h-6 text-green-500" />
          Trending Activities
        </h2>
        <div className="flex flex-wrap gap-3">
          {ALL_ACTIVITIES.slice(0, 8).map((activity) => (
            <Button
              key={activity.id}
              variant="outline"
              className="flex items-center gap-2"
              onClick={() => handleNavigate(activity.page)}
            >
              <span>{activity.icon}</span>
              <span>{activity.title}</span>
            </Button>
          ))}
        </div>
      </div>
    </div>
  );
}
