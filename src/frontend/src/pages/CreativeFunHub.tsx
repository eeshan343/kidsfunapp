import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Camera, Film, Mic, Music, Sparkles } from "lucide-react";
import type { ModulePage } from "../App";

interface CreativeFunHubProps {
  onNavigate: (page: ModulePage) => void;
}

export default function CreativeFunHub({ onNavigate }: CreativeFunHubProps) {
  const modules = [
    {
      id: "interactive-shorts" as ModulePage,
      title: "Interactive Shorts",
      description:
        "Watch animated stories and make choices that change the outcome!",
      icon: "/assets/generated/interactive-shorts-icon.dim_64x64.png",
      color: "from-purple-400 to-pink-600",
      emoji: "🎬",
    },
    {
      id: "green-screen-fun" as ModulePage,
      title: "Green Screen Fun",
      description: "Put yourself in cartoon scenes with photo magic!",
      icon: "/assets/generated/green-screen-fun-icon.dim_64x64.png",
      color: "from-green-400 to-blue-600",
      emoji: "📸",
    },
    {
      id: "karaoke-mode" as ModulePage,
      title: "Karaoke Mode",
      description: "Sing along to fun kid songs with lyrics and animations!",
      icon: "/assets/generated/karaoke-mode-icon.dim_64x64.png",
      color: "from-pink-400 to-red-600",
      emoji: "🎤",
    },
    {
      id: "dance-challenge" as ModulePage,
      title: "Dance Challenge",
      description: "Follow dance moves and groove to the music!",
      icon: "/assets/generated/dance-challenge-icon.dim_64x64.png",
      color: "from-yellow-400 to-orange-600",
      emoji: "💃",
    },
  ];

  return (
    <div className="space-y-8">
      <div className="text-center space-y-4">
        <div className="flex items-center justify-center gap-3">
          <Sparkles className="w-12 h-12 text-purple-600" />
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-yellow-600 bg-clip-text text-transparent">
            Creative Fun Hub
          </h1>
          <Sparkles className="w-12 h-12 text-pink-600" />
        </div>
        <p className="text-xl text-gray-700 max-w-2xl mx-auto">
          Explore amazing interactive entertainment! Watch stories, create
          scenes, sing songs, and dance!
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-4xl mx-auto">
        {modules.map((module) => (
          <Card
            key={module.id}
            className="hover:shadow-2xl transition-all duration-300 cursor-pointer border-4 hover:scale-105 overflow-hidden"
            onClick={() => onNavigate(module.id)}
          >
            <div className={`h-3 bg-gradient-to-r ${module.color}`} />
            <CardHeader className="text-center pb-4">
              <div className="mx-auto mb-4 w-24 h-24 rounded-full bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center">
                <span className="text-5xl">{module.emoji}</span>
              </div>
              <CardTitle className="text-2xl font-bold">
                {module.title}
              </CardTitle>
              <CardDescription className="text-base">
                {module.description}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                className="w-full font-semibold text-lg py-6"
                variant="default"
              >
                Start {module.title}
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="text-center mt-8">
        <Button
          variant="outline"
          size="lg"
          onClick={() => onNavigate("dashboard")}
          className="font-semibold"
        >
          Back to Dashboard
        </Button>
      </div>
    </div>
  );
}
