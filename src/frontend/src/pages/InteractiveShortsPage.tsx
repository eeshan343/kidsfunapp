import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowLeft, Play, RotateCcw } from "lucide-react";
import { useState } from "react";
import type { ModulePage } from "../App";

interface InteractiveShortsPageProps {
  onNavigate: (page: ModulePage) => void;
}

interface Story {
  id: string;
  title: string;
  description: string;
  thumbnail: string;
  scenes: Scene[];
}

interface Scene {
  id: string;
  text: string;
  image: string;
  choices?: Choice[];
  isEnding?: boolean;
}

interface Choice {
  text: string;
  nextSceneId: string;
}

const stories: Story[] = [
  {
    id: "magical-forest",
    title: "The Magical Forest Adventure",
    description: "Help a brave explorer find the hidden treasure!",
    thumbnail: "/assets/generated/interactive-shorts-scene.dim_300x200.png",
    scenes: [
      {
        id: "start",
        text: "You enter a magical forest. Two paths appear before you.",
        image: "/assets/generated/interactive-shorts-scene.dim_300x200.png",
        choices: [
          { text: "Take the sunny path", nextSceneId: "sunny" },
          { text: "Take the mysterious path", nextSceneId: "mysterious" },
        ],
      },
      {
        id: "sunny",
        text: "The sunny path leads to a beautiful meadow with friendly animals!",
        image: "/assets/generated/interactive-shorts-scene.dim_300x200.png",
        choices: [
          { text: "Play with the animals", nextSceneId: "play" },
          { text: "Continue exploring", nextSceneId: "explore" },
        ],
      },
      {
        id: "mysterious",
        text: "The mysterious path leads to a cave with glowing crystals!",
        image: "/assets/generated/interactive-shorts-scene.dim_300x200.png",
        choices: [
          { text: "Enter the cave", nextSceneId: "cave" },
          { text: "Go back", nextSceneId: "start" },
        ],
      },
      {
        id: "play",
        text: "The animals show you a secret treasure chest! You win!",
        image: "/assets/generated/interactive-shorts-scene.dim_300x200.png",
        isEnding: true,
      },
      {
        id: "explore",
        text: "You find a magical fountain that grants wishes! You win!",
        image: "/assets/generated/interactive-shorts-scene.dim_300x200.png",
        isEnding: true,
      },
      {
        id: "cave",
        text: "Inside the cave, you discover ancient treasure! You win!",
        image: "/assets/generated/interactive-shorts-scene.dim_300x200.png",
        isEnding: true,
      },
    ],
  },
];

export default function InteractiveShortsPage({
  onNavigate,
}: InteractiveShortsPageProps) {
  const [selectedStory, setSelectedStory] = useState<Story | null>(null);
  const [currentSceneId, setCurrentSceneId] = useState<string>("start");

  const currentScene = selectedStory?.scenes.find(
    (s) => s.id === currentSceneId,
  );

  const handleStorySelect = (story: Story) => {
    setSelectedStory(story);
    setCurrentSceneId("start");
  };

  const handleChoice = (nextSceneId: string) => {
    setCurrentSceneId(nextSceneId);
  };

  const handleRestart = () => {
    setCurrentSceneId("start");
  };

  const handleBackToList = () => {
    setSelectedStory(null);
    setCurrentSceneId("start");
  };

  if (!selectedStory) {
    return (
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
            Interactive Shorts
          </h1>
          <Button
            variant="outline"
            onClick={() => onNavigate("creative-fun-hub")}
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Hub
          </Button>
        </div>

        <p className="text-xl text-gray-700">
          Choose a story and make decisions that change the adventure!
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stories.map((story) => (
            <Card
              key={story.id}
              className="hover:shadow-xl transition-all cursor-pointer border-4 hover:scale-105"
              onClick={() => handleStorySelect(story)}
            >
              <CardHeader>
                <img
                  src={story.thumbnail}
                  alt={story.title}
                  className="w-full h-48 object-cover rounded-lg mb-4"
                />
                <CardTitle className="text-xl">{story.title}</CardTitle>
                <CardDescription>{story.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <Button className="w-full">
                  <Play className="mr-2 h-4 w-4" />
                  Start Story
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-purple-600">
          {selectedStory.title}
        </h1>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={handleRestart}>
            <RotateCcw className="mr-2 h-4 w-4" />
            Restart
          </Button>
          <Button variant="outline" size="sm" onClick={handleBackToList}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Story List
          </Button>
        </div>
      </div>

      {currentScene && (
        <Card className="border-4 shadow-2xl">
          <CardContent className="p-8 space-y-6">
            <img
              src={currentScene.image}
              alt="Scene"
              className="w-full h-96 object-cover rounded-lg"
            />

            <div className="bg-gradient-to-r from-purple-100 to-pink-100 p-6 rounded-lg">
              <p className="text-xl text-gray-800 leading-relaxed">
                {currentScene.text}
              </p>
            </div>

            {currentScene.isEnding ? (
              <div className="space-y-4">
                <Badge className="text-lg px-4 py-2">🎉 The End! 🎉</Badge>
                <div className="flex gap-4">
                  <Button onClick={handleRestart} className="flex-1">
                    <RotateCcw className="mr-2 h-4 w-4" />
                    Play Again
                  </Button>
                  <Button
                    onClick={handleBackToList}
                    variant="outline"
                    className="flex-1"
                  >
                    Choose Another Story
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-lg font-semibold text-gray-700">
                  What do you do?
                </p>
                {currentScene.choices?.map((choice, index) => (
                  <Button
                    // biome-ignore lint/suspicious/noArrayIndexKey: positional list
                    key={index}
                    onClick={() => handleChoice(choice.nextSceneId)}
                    className="w-full text-lg py-6"
                    variant={index === 0 ? "default" : "outline"}
                  >
                    {choice.text}
                  </Button>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
