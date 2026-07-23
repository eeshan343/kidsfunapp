import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useGetAllInventionStories } from "@/hooks/useQueries";
import type { InventionStory } from "@/hooks/useQueries";
import { ArrowRight, Loader2, Star } from "lucide-react";
import { useEffect, useState } from "react";

interface Lesson {
  id: string;
  title: string;
  description: string;
}

interface DiscoveryZoneActivityProps {
  lesson: Lesson;
  voiceEnabled: boolean;
  onComplete: (stars: number) => void;
  onBack: () => void;
}

type FactsGame = {
  type: "facts";
  facts: { fact: string; emoji: string; quiz: string; answer: string }[];
};

type HowItWorksGame = {
  type: "how-it-works";
  items: { name: string; emoji: string; steps: string[] }[];
};

type WorldExplorerGame = {
  type: "world-explorer";
  countries: { name: string; emoji: string; landmark: string; fact: string }[];
};

type InventionsGame = {
  type: "inventions";
  inventions: {
    name: string;
    emoji: string;
    year: string;
    impact: string;
    inventor: string;
  }[];
};

type GameData = FactsGame | HowItWorksGame | WorldExplorerGame | InventionsGame;

const discoveryGames: Record<string, GameData> = {
  "discovery-1": {
    type: "facts",
    facts: [
      {
        fact: "Honey never spoils! Archaeologists found 3000-year-old honey that was still good!",
        emoji: "🍯",
        quiz: "How old was the honey found?",
        answer: "3000 years",
      },
      {
        fact: 'A group of flamingos is called a "flamboyance"!',
        emoji: "🦩",
        quiz: "What is a group of flamingos called?",
        answer: "flamboyance",
      },
      {
        fact: "Octopuses have three hearts!",
        emoji: "🐙",
        quiz: "How many hearts does an octopus have?",
        answer: "3",
      },
      {
        fact: "Bananas are berries, but strawberries are not!",
        emoji: "🍌",
        quiz: "Are bananas berries?",
        answer: "yes",
      },
    ],
  },
  "discovery-2": {
    type: "how-it-works",
    items: [
      {
        name: "Light Bulb",
        emoji: "💡",
        steps: [
          "Electricity flows through wire",
          "Wire heats up and glows",
          "Light shines bright!",
        ],
      },
      {
        name: "Bicycle",
        emoji: "🚲",
        steps: [
          "Pedals turn the chain",
          "Chain moves the wheels",
          "Wheels roll forward!",
        ],
      },
      {
        name: "Rainbow",
        emoji: "🌈",
        steps: [
          "Sunlight hits water drops",
          "Light splits into colors",
          "Colors appear in the sky!",
        ],
      },
    ],
  },
  "discovery-3": {
    type: "world-explorer",
    countries: [
      {
        name: "Egypt",
        emoji: "🇪🇬",
        landmark: "🏛️ Pyramids",
        fact: "Home to ancient pyramids",
      },
      {
        name: "Japan",
        emoji: "🇯🇵",
        landmark: "🗾 Mount Fuji",
        fact: "Land of the rising sun",
      },
      {
        name: "Brazil",
        emoji: "🇧🇷",
        landmark: "🌴 Amazon Rainforest",
        fact: "Has the biggest rainforest",
      },
      {
        name: "France",
        emoji: "🇫🇷",
        landmark: "🗼 Eiffel Tower",
        fact: "Famous for the Eiffel Tower",
      },
    ],
  },
  "discovery-4": {
    type: "inventions",
    inventions: [
      {
        name: "Wheel",
        emoji: "⚙️",
        year: "3500 BC",
        impact: "Made transportation easier",
        inventor: "Ancient Mesopotamians",
      },
      {
        name: "Light Bulb",
        emoji: "💡",
        year: "1879",
        impact: "Brought light to homes",
        inventor: "Thomas Edison",
      },
      {
        name: "Airplane",
        emoji: "✈️",
        year: "1903",
        impact: "Enabled air travel",
        inventor: "Wright Brothers",
      },
    ],
  },
};

export default function DiscoveryZoneActivity({
  lesson,
  voiceEnabled,
  onComplete,
  onBack: _onBack,
}: DiscoveryZoneActivityProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [score, setScore] = useState(0);
  const [_showFeedback, setShowFeedback] = useState(false);
  const [_isCorrect, _setIsCorrect] = useState(false);
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [loadingNextStory, setLoadingNextStory] = useState(false);

  const { data: allInventionStories = [] } = useGetAllInventionStories();

  const gameData = discoveryGames[lesson.id];
  const totalSteps =
    gameData.type === "facts"
      ? gameData.facts.length
      : gameData.type === "how-it-works"
        ? gameData.items.length
        : gameData.type === "world-explorer"
          ? gameData.countries.length
          : gameData.inventions.length;

  const progress = ((currentStep + 1) / totalSteps) * 100;

  const currentInventionStory = allInventionStories[currentStoryIndex] || null;

  const handleNextInventionStory = async () => {
    if (
      !currentInventionStory ||
      currentStoryIndex >= allInventionStories.length - 1
    )
      return;

    setLoadingNextStory(true);
    try {
      // Mark current story as read in localStorage
      const readStories = JSON.parse(
        localStorage.getItem("readInventionStories") || "[]",
      );
      if (!readStories.includes(currentInventionStory.id)) {
        readStories.push(currentInventionStory.id);
        localStorage.setItem(
          "readInventionStories",
          JSON.stringify(readStories),
        );
      }

      // Smooth transition with animation
      setTimeout(() => {
        setCurrentStoryIndex(currentStoryIndex + 1);
        const nextStory = allInventionStories[currentStoryIndex + 1];

        // Continue voice narration if enabled
        if (voiceEnabled && nextStory) {
          speakText(
            `Next invention story: ${nextStory.title}. ${nextStory.content}`,
          );
        }
        setLoadingNextStory(false);
      }, 300);
    } catch (error) {
      console.error("Error loading next invention story:", error);
      setLoadingNextStory(false);
    }
  };

  const speakText = (text: string) => {
    if ("speechSynthesis" in window && voiceEnabled) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.8;
      utterance.pitch = 1.2;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleNext = () => {
    setScore(score + 1);
    setShowFeedback(false);
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete(3);
    }
  };

  const renderActivity = () => {
    if (gameData.type === "facts") {
      const factData = gameData.facts[currentStep];
      return (
        <div className="space-y-8 text-center">
          <div className="text-9xl mb-4 animate-bounce">{factData.emoji}</div>
          <Card className="border-4 border-neon-yellow bg-gradient-to-br from-yellow-50 to-orange-50">
            <CardContent className="p-8">
              <p className="text-2xl font-bold text-gray-800">
                {factData.fact}
              </p>
            </CardContent>
          </Card>
          <div className="space-y-4">
            <h3 className="text-2xl font-bold text-neon-purple">
              {factData.quiz}
            </h3>
            <p className="text-xl text-neon-cyan">Answer: {factData.answer}</p>
          </div>
          <Button
            onClick={handleNext}
            size="lg"
            className="bg-gradient-to-r from-neon-yellow to-neon-orange"
          >
            Next Amazing Fact!
          </Button>
        </div>
      );
    }

    if (gameData.type === "how-it-works") {
      const item = gameData.items[currentStep];
      return (
        <div className="space-y-8 text-center">
          <div className="text-9xl mb-4">{item.emoji}</div>
          <h2 className="text-5xl font-bold text-neon-purple">{item.name}</h2>
          <div className="space-y-4">
            {item.steps.map((step, i) => (
              <Card
                key={step}
                className="border-4 border-neon-cyan bg-gradient-to-r from-cyan-50 to-blue-50"
              >
                <CardContent className="p-6">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-neon-cyan text-white flex items-center justify-center text-2xl font-bold">
                      {i + 1}
                    </div>
                    <p className="text-xl font-semibold text-gray-800">
                      {step}
                    </p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          <Button
            onClick={handleNext}
            size="lg"
            className="bg-gradient-to-r from-neon-cyan to-neon-blue"
          >
            Next Discovery!
          </Button>
        </div>
      );
    }

    if (gameData.type === "world-explorer") {
      const country = gameData.countries[currentStep];
      return (
        <div className="space-y-8 text-center">
          <div className="text-9xl mb-4">{country.emoji}</div>
          <h2 className="text-5xl font-bold text-neon-purple">
            {country.name}
          </h2>
          <div className="text-6xl mb-4">{country.landmark}</div>
          <Card className="border-4 border-neon-green bg-gradient-to-br from-green-50 to-emerald-50">
            <CardContent className="p-8">
              <p className="text-2xl font-bold text-gray-800">{country.fact}</p>
            </CardContent>
          </Card>
          <Button
            onClick={handleNext}
            size="lg"
            className="bg-gradient-to-r from-neon-green to-neon-cyan"
          >
            Explore Next Country!
          </Button>
        </div>
      );
    }

    if (gameData.type === "inventions") {
      // Show invention stories from localStorage if available
      if (currentInventionStory) {
        return (
          <div className="space-y-8 text-center transition-all duration-300 ease-in-out">
            <div className="text-9xl mb-4 animate-pulse">💡</div>
            <h2 className="text-5xl font-bold text-neon-purple">
              {currentInventionStory.title}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="border-4 border-neon-orange">
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold text-neon-purple mb-2">
                    Author
                  </h3>
                  <p className="text-2xl text-gray-800">
                    {currentInventionStory.author}
                  </p>
                </CardContent>
              </Card>
              <Card className="border-4 border-neon-pink">
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold text-neon-purple mb-2">
                    Discovery Level
                  </h3>
                  <p className="text-2xl text-gray-800">
                    {currentInventionStory.discoveryLevel}
                  </p>
                </CardContent>
              </Card>
            </div>
            <Card className="border-4 border-neon-cyan bg-gradient-to-br from-cyan-50 to-blue-50">
              <CardContent className="p-8">
                <h3 className="text-xl font-bold text-neon-purple mb-4">
                  Story
                </h3>
                <p className="text-xl text-gray-800 leading-relaxed">
                  {currentInventionStory.content}
                </p>
              </CardContent>
            </Card>
            {currentInventionStory.funFacts.length > 0 && (
              <Card className="border-4 border-neon-green bg-gradient-to-br from-green-50 to-emerald-50">
                <CardContent className="p-6">
                  <h3 className="text-xl font-bold text-neon-purple mb-4">
                    Fun Facts
                  </h3>
                  <ul className="space-y-2 text-left">
                    {currentInventionStory.funFacts.map((fact) => (
                      <li
                        key={fact}
                        className="text-lg text-gray-800 flex items-start gap-2"
                      >
                        <span className="text-neon-yellow">✨</span>
                        <span>{fact}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}
            <div className="flex gap-4 justify-center">
              <Button
                onClick={handleNext}
                size="lg"
                className="bg-gradient-to-r from-neon-yellow to-neon-orange"
              >
                Complete Activity
              </Button>
              {currentStoryIndex < allInventionStories.length - 1 && (
                <Button
                  onClick={handleNextInventionStory}
                  disabled={loadingNextStory}
                  size="lg"
                  className="bg-gradient-to-r from-neon-purple to-neon-pink shadow-neon-md hover:shadow-neon-lg transition-all duration-300"
                >
                  {loadingNextStory ? (
                    <>
                      <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                      Loading...
                    </>
                  ) : (
                    <>
                      Next Story
                      <ArrowRight className="ml-2 h-5 w-5" />
                    </>
                  )}
                </Button>
              )}
            </div>
          </div>
        );
      }

      // Fallback to static data if no stories available
      const invention = gameData.inventions[currentStep];
      return (
        <div className="space-y-8 text-center">
          <div className="text-9xl mb-4">{invention.emoji}</div>
          <h2 className="text-5xl font-bold text-neon-purple">
            {invention.name}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card className="border-4 border-neon-orange">
              <CardContent className="p-6">
                <h3 className="text-xl font-bold text-neon-purple mb-2">
                  Year Invented
                </h3>
                <p className="text-2xl text-gray-800">{invention.year}</p>
              </CardContent>
            </Card>
            <Card className="border-4 border-neon-pink">
              <CardContent className="p-6">
                <h3 className="text-xl font-bold text-neon-purple mb-2">
                  Inventor
                </h3>
                <p className="text-2xl text-gray-800">{invention.inventor}</p>
              </CardContent>
            </Card>
          </div>
          <Card className="border-4 border-neon-cyan bg-gradient-to-br from-cyan-50 to-blue-50">
            <CardContent className="p-8">
              <h3 className="text-xl font-bold text-neon-purple mb-2">
                Impact
              </h3>
              <p className="text-2xl text-gray-800">{invention.impact}</p>
            </CardContent>
          </Card>
          <Button
            onClick={handleNext}
            size="lg"
            className="bg-gradient-to-r from-neon-yellow to-neon-orange"
          >
            Next Invention!
          </Button>
        </div>
      );
    }

    return null;
  };

  return (
    <Card className="border-4 border-neon-yellow shadow-neon-lg">
      <CardHeader className="text-center">
        <CardTitle className="text-4xl font-bold text-neon-pink text-shadow-neon-lg">
          {lesson.title}
        </CardTitle>
        <div className="mt-4 space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="font-semibold">Progress</span>
            <span className="text-gray-600">
              {currentStep + 1}/{totalSteps}
            </span>
          </div>
          <Progress value={progress} className="h-3" />
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl p-8 min-h-[500px] flex flex-col items-center justify-center">
          {renderActivity()}
        </div>

        <div className="flex justify-center gap-2">
          {[...Array(3)].map((_, i) => (
            <Star
              // biome-ignore lint/suspicious/noArrayIndexKey: fixed 3-star rating display
              key={`star-${i}`}
              className={`h-8 w-8 ${i < Math.floor((score / totalSteps) * 3) ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
