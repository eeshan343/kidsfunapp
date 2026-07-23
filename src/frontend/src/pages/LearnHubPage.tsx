import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Lightbulb,
  Microscope,
  Palette,
  Play,
  Star,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useEffect, useState } from "react";
import type { ModulePage } from "../App";
import ArtsMusicActivity from "../components/learn-hub/ArtsMusicActivity";
import DiscoveryZoneActivity from "../components/learn-hub/DiscoveryZoneActivity";
import ReadingVocabularyActivity from "../components/learn-hub/ReadingVocabularyActivity";
import ScienceNatureActivity from "../components/learn-hub/ScienceNatureActivity";

interface LearnHubPageProps {
  onNavigate: (page: ModulePage) => void;
}

interface Lesson {
  id: string;
  title: string;
  description: string;
  duration: string;
  difficulty: "Easy" | "Medium" | "Hard";
  completed: boolean;
  stars: number;
}

const categories = [
  {
    id: "reading",
    title: "Reading & Vocabulary",
    description: "Word stories, phonics, spelling mini-games",
    icon: BookOpen,
    color: "from-blue-400 to-cyan-600",
    image: "/assets/generated/reading-vocabulary-icon.dim_64x64.png",
    lessons: [
      {
        id: "reading-1",
        title: "Phonics Fun",
        description: "Learn letter sounds and blend them into words",
        duration: "10 min",
        difficulty: "Easy" as const,
        completed: false,
        stars: 0,
      },
      {
        id: "reading-2",
        title: "Word Builder",
        description: "Create new words by combining letters",
        duration: "12 min",
        difficulty: "Easy" as const,
        completed: false,
        stars: 0,
      },
      {
        id: "reading-3",
        title: "Story Time",
        description: "Read along with interactive stories",
        duration: "15 min",
        difficulty: "Medium" as const,
        completed: false,
        stars: 0,
      },
      {
        id: "reading-4",
        title: "Spelling Challenge",
        description: "Practice spelling common words",
        duration: "10 min",
        difficulty: "Medium" as const,
        completed: false,
        stars: 0,
      },
      {
        id: "reading-5",
        title: "Vocabulary Quest",
        description: "Discover new words and their meanings",
        duration: "15 min",
        difficulty: "Hard" as const,
        completed: false,
        stars: 0,
      },
    ],
  },
  {
    id: "science",
    title: "Science & Nature",
    description: "Exploring weather, space, animals, plants",
    icon: Microscope,
    color: "from-green-400 to-emerald-600",
    image: "/assets/generated/science-nature-icon.dim_64x64.png",
    lessons: [
      {
        id: "science-1",
        title: "Weather Wonders",
        description: "Learn about rain, sun, clouds, and storms",
        duration: "12 min",
        difficulty: "Easy" as const,
        completed: false,
        stars: 0,
      },
      {
        id: "science-2",
        title: "Space Adventure",
        description: "Explore planets, stars, and the moon",
        duration: "15 min",
        difficulty: "Medium" as const,
        completed: false,
        stars: 0,
      },
      {
        id: "science-3",
        title: "Animal Habitats",
        description: "Discover where animals live and why",
        duration: "12 min",
        difficulty: "Easy" as const,
        completed: false,
        stars: 0,
      },
      {
        id: "science-4",
        title: "Plant Life Cycle",
        description: "Watch how plants grow from seeds",
        duration: "10 min",
        difficulty: "Medium" as const,
        completed: false,
        stars: 0,
      },
    ],
  },
  {
    id: "arts",
    title: "Arts & Music",
    description: "Colors, drawing, rhythm, creative sounds",
    icon: Palette,
    color: "from-pink-400 to-purple-600",
    image: "/assets/generated/arts-music-icon.dim_64x64.png",
    lessons: [
      {
        id: "arts-1",
        title: "Color Mixing Magic",
        description: "Mix colors to create new ones",
        duration: "10 min",
        difficulty: "Easy" as const,
        completed: false,
        stars: 0,
      },
      {
        id: "arts-2",
        title: "Drawing Basics",
        description: "Learn to draw simple shapes and objects",
        duration: "15 min",
        difficulty: "Easy" as const,
        completed: false,
        stars: 0,
      },
      {
        id: "arts-3",
        title: "Rhythm Patterns",
        description: "Clap and tap to fun musical beats",
        duration: "12 min",
        difficulty: "Medium" as const,
        completed: false,
        stars: 0,
      },
      {
        id: "arts-4",
        title: "Sound Explorer",
        description: "Discover different musical instruments",
        duration: "10 min",
        difficulty: "Easy" as const,
        completed: false,
        stars: 0,
      },
      {
        id: "arts-5",
        title: "Creative Expression",
        description: "Express yourself through art and music",
        duration: "15 min",
        difficulty: "Medium" as const,
        completed: false,
        stars: 0,
      },
    ],
  },
  {
    id: "discovery",
    title: "Discovery Zone",
    description: "Fun facts, interactive stories, how things work",
    icon: Lightbulb,
    color: "from-yellow-400 to-orange-600",
    image: "/assets/generated/discovery-zone-icon.dim_64x64.png",
    lessons: [
      {
        id: "discovery-1",
        title: "Amazing Facts",
        description: "Learn surprising facts about the world",
        duration: "10 min",
        difficulty: "Easy" as const,
        completed: false,
        stars: 0,
      },
      {
        id: "discovery-2",
        title: "How Things Work",
        description: "Discover how everyday objects function",
        duration: "12 min",
        difficulty: "Medium" as const,
        completed: false,
        stars: 0,
      },
      {
        id: "discovery-3",
        title: "World Explorer",
        description: "Travel to different countries and cultures",
        duration: "15 min",
        difficulty: "Medium" as const,
        completed: false,
        stars: 0,
      },
      {
        id: "discovery-4",
        title: "Invention Stories",
        description: "Learn about famous inventions",
        duration: "12 min",
        difficulty: "Hard" as const,
        completed: false,
        stars: 0,
      },
    ],
  },
];

export default function LearnHubPage({ onNavigate }: LearnHubPageProps) {
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedLesson, setSelectedLesson] = useState<Lesson | null>(null);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [completedLessons, setCompletedLessons] = useState<
    Record<string, { completed: boolean; stars: number }>
  >({});

  // Load completed lessons from localStorage
  useEffect(() => {
    const stored = localStorage.getItem("learnHubProgress");
    if (stored) {
      setCompletedLessons(JSON.parse(stored));
    }
  }, []);

  const currentCategory = categories.find((c) => c.id === selectedCategory);

  const handleStartLesson = (lesson: Lesson) => {
    setSelectedLesson(lesson);
  };

  const handleCompleteLesson = (stars: number) => {
    if (selectedLesson) {
      const updated = {
        ...completedLessons,
        [selectedLesson.id]: { completed: true, stars },
      };
      setCompletedLessons(updated);
      localStorage.setItem("learnHubProgress", JSON.stringify(updated));
      setSelectedLesson(null);
    }
  };

  const handleBackToCategory = () => {
    setSelectedLesson(null);
  };

  const handleBackToHub = () => {
    setSelectedCategory(null);
    setSelectedLesson(null);
  };

  // Render activity based on category and lesson
  const renderActivity = () => {
    if (!selectedLesson || !selectedCategory) return null;

    const props = {
      lesson: selectedLesson,
      voiceEnabled,
      onComplete: handleCompleteLesson,
      onBack: handleBackToCategory,
    };

    switch (selectedCategory) {
      case "reading":
        return <ReadingVocabularyActivity {...props} />;
      case "science":
        return <ScienceNatureActivity {...props} />;
      case "arts":
        return <ArtsMusicActivity {...props} />;
      case "discovery":
        return <DiscoveryZoneActivity {...props} />;
      default:
        return null;
    }
  };

  // Lesson activity view
  if (selectedLesson) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button
            onClick={handleBackToCategory}
            variant="outline"
            className="border-2 border-neon-purple hover:bg-neon-purple/20"
          >
            <ArrowLeft className="mr-2 h-5 w-5" />
            Back to Lessons
          </Button>
          <Button
            onClick={() => setVoiceEnabled(!voiceEnabled)}
            variant="outline"
            className="border-2 border-neon-cyan"
          >
            {voiceEnabled ? (
              <Volume2 className="h-5 w-5" />
            ) : (
              <VolumeX className="h-5 w-5" />
            )}
          </Button>
        </div>
        {renderActivity()}
      </div>
    );
  }

  // Category lessons view
  if (selectedCategory && currentCategory) {
    const CategoryIcon = currentCategory.icon;
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button
            onClick={handleBackToHub}
            variant="outline"
            className="border-2 border-neon-purple hover:bg-neon-purple/20"
          >
            <ArrowLeft className="mr-2 h-5 w-5" />
            Back to Learn Hub
          </Button>
          <Button
            onClick={() => setVoiceEnabled(!voiceEnabled)}
            variant="outline"
            className="border-2 border-neon-cyan"
          >
            {voiceEnabled ? (
              <Volume2 className="h-5 w-5" />
            ) : (
              <VolumeX className="h-5 w-5" />
            )}
          </Button>
        </div>

        <div className="text-center space-y-4">
          <div
            className={`inline-flex items-center justify-center w-24 h-24 rounded-full bg-gradient-to-br ${currentCategory.color} shadow-neon-lg`}
          >
            <CategoryIcon className="h-12 w-12 text-white" />
          </div>
          <h1 className="text-5xl font-bold text-neon-pink text-shadow-neon-lg">
            {currentCategory.title}
          </h1>
          <p className="text-2xl text-neon-cyan text-shadow-neon-md">
            {currentCategory.description}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {currentCategory.lessons.map((lesson) => {
            const progress = completedLessons[lesson.id];
            const isCompleted = progress?.completed || false;
            const stars = progress?.stars || 0;

            return (
              <Card
                key={lesson.id}
                className="hover:shadow-2xl transition-all duration-300 border-4 hover:scale-105 cursor-pointer"
                onClick={() => handleStartLesson(lesson)}
              >
                <div
                  className={`h-2 bg-gradient-to-r ${currentCategory.color}`}
                />
                <CardHeader>
                  <div className="flex items-start justify-between mb-2">
                    <CardTitle className="text-2xl font-bold flex-1">
                      {lesson.title}
                    </CardTitle>
                    {isCompleted && (
                      <CheckCircle2 className="h-6 w-6 text-green-500 flex-shrink-0" />
                    )}
                  </div>
                  <CardDescription className="text-base">
                    {lesson.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between text-sm">
                    <Badge variant="outline" className="border-2">
                      {lesson.difficulty}
                    </Badge>
                    <span className="text-gray-600">{lesson.duration}</span>
                  </div>
                  {isCompleted && (
                    <div className="flex justify-center gap-1">
                      {[...Array(stars)].map((_, i) => (
                        <Star
                          // biome-ignore lint/suspicious/noArrayIndexKey: positional list
                          key={i}
                          className="h-5 w-5 text-yellow-400 fill-yellow-400"
                        />
                      ))}
                    </div>
                  )}
                  <Button className="w-full font-semibold" variant="outline">
                    <Play className="mr-2 h-4 w-4" />
                    {isCompleted ? "Review Lesson" : "Start Lesson"}
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>
      </div>
    );
  }

  // Main hub view
  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <Button
          onClick={() => onNavigate("dashboard")}
          variant="outline"
          className="border-2 border-neon-purple hover:bg-neon-purple/20"
        >
          <ArrowLeft className="mr-2 h-5 w-5" />
          Back to Dashboard
        </Button>
        <Button
          onClick={() => setVoiceEnabled(!voiceEnabled)}
          variant="outline"
          className="border-2 border-neon-cyan"
        >
          {voiceEnabled ? (
            <Volume2 className="h-5 w-5" />
          ) : (
            <VolumeX className="h-5 w-5" />
          )}
        </Button>
      </div>

      <div className="text-center space-y-4">
        <div className="text-8xl mb-4 animate-neon-pulse">🎓</div>
        <h1 className="text-5xl md:text-6xl font-bold text-neon-pink text-shadow-neon-lg">
          Learn Hub
        </h1>
        <p className="text-2xl text-neon-cyan text-shadow-neon-md">
          Explore fun educational lessons with your friendly mascot guide!
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {categories.map((category) => {
          const CategoryIcon = category.icon;
          const completedCount = category.lessons.filter(
            (l) => completedLessons[l.id]?.completed,
          ).length;
          const totalLessons = category.lessons.length;
          const progressPercent = (completedCount / totalLessons) * 100;

          return (
            <Card
              key={category.id}
              className="hover:shadow-2xl transition-all duration-300 cursor-pointer border-4 hover:scale-105 overflow-hidden"
              onClick={() => setSelectedCategory(category.id)}
            >
              <div className={`h-3 bg-gradient-to-r ${category.color}`} />
              <CardHeader className="text-center pb-4">
                <div
                  className={`mx-auto mb-4 w-20 h-20 rounded-full bg-gradient-to-br ${category.color} flex items-center justify-center shadow-neon-md`}
                >
                  <CategoryIcon className="w-10 h-10 text-white" />
                </div>
                <CardTitle className="text-3xl font-bold text-shadow-neon-sm">
                  {category.title}
                </CardTitle>
                <CardDescription className="text-lg mt-2">
                  {category.description}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="font-semibold">Progress</span>
                    <span className="text-gray-600">
                      {completedCount}/{totalLessons} lessons
                    </span>
                  </div>
                  <Progress value={progressPercent} className="h-3" />
                </div>
                <Button
                  className="w-full font-semibold text-lg py-6"
                  variant="outline"
                >
                  <Play className="mr-2 h-5 w-5" />
                  Start Learning
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      <Card className="border-4 border-neon-green shadow-neon-lg bg-gradient-to-br from-green-50 to-cyan-50">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center text-neon-green text-shadow-neon-md">
            🎉 Learning is Fun! 🎉
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-center text-lg text-gray-700">
            Complete lessons to earn stars and unlock achievements! Your mascot
            friend will guide you through every step with cheerful encouragement
            and voice narration.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
