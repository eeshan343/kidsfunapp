import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Award,
  Calendar,
  Gamepad2,
  Laugh,
  Mail,
  MessageCircle,
  Music,
  Palette,
  Search,
  Shield,
  Sparkles,
  Trophy,
  Video,
  X,
  Youtube,
} from "lucide-react";
import { useMemo, useState } from "react";
import type { ModulePage } from "../App";
import AvatarPreview3D from "../components/avatar3d/AvatarPreview3D";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useGetBannedModules,
  useGetCallerUserProfile,
  useIsCallerAdmin,
} from "../hooks/useQueries";
import { mergeAvatarConfig } from "../utils/avatarConfig";

interface DashboardProps {
  onNavigate: (page: ModulePage) => void;
}

interface ModuleCard {
  id: ModulePage;
  title: string;
  description: string;
  icon: React.ReactNode;
  color: string;
  adminOnly?: boolean;
}

export default function Dashboard({ onNavigate }: DashboardProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const { identity } = useInternetIdentity();
  const { data: isAdmin, isLoading: isAdminLoading } = useIsCallerAdmin();
  const { data: userProfile } = useGetCallerUserProfile();
  const { data: bannedModules } = useGetBannedModules();

  const isAuthenticated = !!identity;
  const displayName = userProfile?.name?.trim() || "Friend";
  const bannedModuleIds = bannedModules ?? [];

  const allModules: ModuleCard[] = [
    {
      id: "games",
      title: "Games Hub 🎮",
      description: "43 fun games to play!",
      icon: <Gamepad2 className="w-8 h-8" />,
      color: "from-purple-500 to-pink-500",
    },
    {
      id: "funny-fart-hub",
      title: "Funny Fart Hub 💨",
      description: "Silly fart sounds for laughs!",
      icon: <span className="text-3xl">💨</span>,
      color: "from-yellow-500 to-green-500",
    },
    {
      id: "video-hub",
      title: "Kids watching Hub 📺",
      description: "Safe educational videos for kids!",
      icon: <Youtube className="w-8 h-8" />,
      color: "from-red-500 to-pink-500",
    },
    {
      id: "smart-hub",
      title: "Smart Hub 🧠",
      description: "Personalized recommendations",
      icon: <Sparkles className="w-8 h-8" />,
      color: "from-cyan-500 to-blue-500",
    },
    {
      id: "virtual-pet-hub",
      title: "Virtual Pet Hub 🐾",
      description: "Take care of your pet!",
      icon: <span className="text-3xl">🐾</span>,
      color: "from-green-500 to-teal-500",
    },
    {
      id: "learn-hub",
      title: "Learn Hub 📚",
      description: "Interactive lessons",
      icon: <span className="text-3xl">📚</span>,
      color: "from-blue-500 to-indigo-500",
    },
    {
      id: "creative-fun-hub",
      title: "Creative Fun Hub 🎨",
      description: "Stories, karaoke, and more!",
      icon: <Palette className="w-8 h-8" />,
      color: "from-pink-500 to-rose-500",
    },
    {
      id: "events",
      title: "Events Calendar 📅",
      description: "Manage your special days",
      icon: <Calendar className="w-8 h-8" />,
      color: "from-blue-500 to-cyan-500",
    },
    {
      id: "video-generator",
      title: "Video Generator 🎬",
      description: "Create 2D animated videos",
      icon: <Video className="w-8 h-8" />,
      color: "from-red-500 to-orange-500",
    },
    {
      id: "chat",
      title: "Chat 💬",
      description: "Talk with friends safely",
      icon: <MessageCircle className="w-8 h-8" />,
      color: "from-green-500 to-emerald-500",
    },
    {
      id: "event-cards",
      title: "Event Cards 💌",
      description: "Design beautiful cards",
      icon: <Mail className="w-8 h-8" />,
      color: "from-pink-500 to-purple-500",
    },
    {
      id: "jokes",
      title: "Jokes 😂",
      description: "Funny jokes and riddles",
      icon: <Laugh className="w-8 h-8" />,
      color: "from-yellow-500 to-orange-500",
    },
    {
      id: "rewards",
      title: "Rewards 🏆",
      description: "Earn badges and trophies",
      icon: <Trophy className="w-8 h-8" />,
      color: "from-yellow-500 to-amber-500",
    },
    {
      id: "spin-wheel",
      title: "Spin the Wheel 🎡",
      description: "Win prizes every 20 minutes",
      icon: <span className="text-3xl">🎡</span>,
      color: "from-purple-500 to-pink-500",
    },
    {
      id: "sticker-creator",
      title: "Sticker Creator 🎨",
      description: "Design custom stickers",
      icon: <Palette className="w-8 h-8" />,
      color: "from-pink-500 to-red-500",
    },
    {
      id: "music-remix",
      title: "Music Remix 🎵",
      description: "Mix beats and create music",
      icon: <Music className="w-8 h-8" />,
      color: "from-purple-500 to-indigo-500",
    },
    {
      id: "certificates",
      title: "Certificates 📜",
      description: "Generate achievement certificates",
      icon: <Award className="w-8 h-8" />,
      color: "from-blue-500 to-cyan-500",
    },
    {
      id: "seasonal-events",
      title: "Seasonal Events 🎃",
      description: "Holiday-themed activities",
      icon: <span className="text-3xl">🎃</span>,
      color: "from-orange-500 to-red-500",
    },
    {
      id: "avatar-creator",
      title: "Avatar Creator 👤",
      description: "Create your character",
      icon: <span className="text-3xl">👤</span>,
      color: "from-cyan-500 to-blue-500",
    },
    {
      id: "story-builder",
      title: "Story Builder 📖",
      description: "Build animated stories",
      icon: <span className="text-3xl">📖</span>,
      color: "from-indigo-500 to-purple-500",
    },
    {
      id: "craft-diy",
      title: "Craft & DIY 🎨",
      description: "Step-by-step creative projects",
      icon: <Palette className="w-8 h-8" />,
      color: "from-green-500 to-teal-500",
    },
    {
      id: "art-gallery",
      title: "Art Gallery 🖼️",
      description: "Share and explore artwork",
      icon: <span className="text-3xl">🖼️</span>,
      color: "from-pink-500 to-purple-500",
    },
    {
      id: "admin-dashboard",
      title: "Admin Dashboard 🛡️",
      description: "Manage users and content",
      icon: <Shield className="w-8 h-8" />,
      color: "from-red-600 to-orange-600",
      adminOnly: true,
    },
  ];

  // Filter modules based on admin status - wait for admin check to complete
  const modules = useMemo(() => {
    // If we're still checking admin status and user is authenticated, don't
    // filter by admin/ban status yet — return all non-admin modules while
    // loading so the grid doesn't flicker.
    if (isAuthenticated && isAdminLoading) {
      // Return all non-admin modules while loading
      return allModules.filter((module) => !module.adminOnly);
    }

    return allModules.filter((module) => {
      // Show admin-only modules only if user is authenticated and is admin
      if (module.adminOnly) {
        return isAuthenticated && isAdmin === true;
      }
      // Hide banned modules from non-admin users silently (no notice).
      // Admins still see banned modules so they can preview/manage them.
      if (!isAuthenticated || isAdmin !== true) {
        if (bannedModuleIds.includes(module.id)) {
          return false;
        }
      }
      return true;
    });
  }, [isAuthenticated, isAdmin, isAdminLoading, bannedModuleIds]);

  const filteredModules = useMemo(() => {
    if (!searchQuery.trim()) return modules;

    const query = searchQuery.toLowerCase();
    return modules.filter(
      (module) =>
        module.title.toLowerCase().includes(query) ||
        module.description.toLowerCase().includes(query),
    );
  }, [searchQuery, modules]);

  const clearSearch = () => {
    setSearchQuery("");
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center space-y-4">
        <h1 className="font-hero text-5xl md:text-6xl font-bold bg-gradient-to-r from-neon-pink via-neon-purple to-neon-cyan bg-clip-text text-transparent text-shadow-neon-lg">
          Welcome to Kids Fun Universe! 🎉
        </h1>
        <p className="text-xl md:text-2xl text-neon-green text-shadow-neon-md">
          Choose an activity and start your adventure!
        </p>
      </div>

      {/* Signed-in user's avatar + name (rendered from their saved config) */}
      {isAuthenticated && (
        <Card
          className="max-w-2xl mx-auto border-4 border-neon-purple bg-gradient-to-br from-white to-purple-50 cursor-pointer hover:shadow-neon-md transition-all"
          onClick={() => onNavigate("avatar-creator")}
          data-ocid="dashboard.profile.card"
        >
          <CardContent className="p-4 flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
            <div
              className="w-20 h-20 sm:w-24 sm:h-24 shrink-0"
              data-ocid="dashboard.profile.avatar_preview"
            >
              <AvatarPreview3D
                avatarConfig={mergeAvatarConfig(userProfile?.avatarConfig)}
              />
            </div>
            <div className="min-w-0 flex-1 text-center sm:text-left">
              <p className="text-sm text-purple-600 font-semibold">
                Welcome back,
              </p>
              <h2 className="font-section text-2xl font-bold text-purple-900 truncate">
                {displayName}
              </h2>
              <p className="text-sm text-purple-700 mt-1">
                Click to edit your avatar ✨
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Search Bar */}
      <div className="max-w-2xl mx-auto">
        <div className="relative">
          <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 w-6 h-6 text-neon-cyan" />
          <Input
            type="text"
            placeholder="Search modules..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-12 pr-12 h-14 text-lg border-4 border-neon-purple bg-white text-purple-900 placeholder:text-purple-400 focus:border-neon-cyan focus:ring-neon-cyan"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={clearSearch}
              className="absolute right-4 top-1/2 transform -translate-y-1/2 text-neon-pink hover:text-neon-orange transition-colors"
              aria-label="Clear search"
            >
              <X className="w-6 h-6" />
            </button>
          )}
        </div>
        {searchQuery && (
          <p className="mt-2 text-center text-neon-cyan text-shadow-neon-sm">
            {filteredModules.length} module
            {filteredModules.length !== 1 ? "s" : ""} found
          </p>
        )}
      </div>

      {/* No Results State */}
      {searchQuery && filteredModules.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">🔍</div>
          <h3 className="font-section text-2xl font-bold text-neon-orange text-shadow-neon-md mb-2">
            No modules found
          </h3>
          <p className="text-lg text-neon-cyan text-shadow-neon-sm mb-4">
            Try searching with different keywords
          </p>
          <Button
            onClick={clearSearch}
            className="bg-gradient-to-r from-neon-purple to-neon-pink hover:from-neon-pink hover:to-neon-purple"
          >
            Clear Search
          </Button>
        </div>
      )}

      {/* Modules Grid - Updated to 5 items per row */}
      {filteredModules.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
          {filteredModules.map((module) => (
            <Card
              key={module.id}
              className="border-4 border-neon-purple hover:border-neon-cyan hover:shadow-neon-lg transition-all duration-300 hover:scale-105 cursor-pointer bg-gradient-to-br from-white to-purple-50"
              onClick={() => onNavigate(module.id)}
            >
              <CardHeader className="pb-3">
                <div
                  className={`w-16 h-16 rounded-full bg-gradient-to-r ${module.color} flex items-center justify-center text-white mb-3 shadow-neon-md`}
                >
                  {module.icon}
                </div>
                <CardTitle className="font-section text-xl text-purple-900">
                  {module.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-base text-purple-700">
                  {module.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
