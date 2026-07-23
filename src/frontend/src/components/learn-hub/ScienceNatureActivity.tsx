import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Star } from "lucide-react";
import { useState } from "react";

interface Lesson {
  id: string;
  title: string;
  description: string;
}

interface ScienceNatureActivityProps {
  lesson: Lesson;
  voiceEnabled: boolean;
  onComplete: (stars: number) => void;
  onBack: () => void;
}

type WeatherGame = {
  type: "weather";
  items: { name: string; icon: string; description: string; sound: string }[];
  questions: { q: string; answer: string }[];
};

type SpaceGame = {
  type: "space";
  planets: { name: string; icon: string; color: string; fact: string }[];
  quiz: { q: string; options: string[]; answer: number }[];
};

type AnimalsGame = {
  type: "animals";
  habitats: { name: string; icon: string; animals: string[] }[];
  matching: { animal: string; habitat: string }[];
};

type PlantsGame = {
  type: "plants";
  stages: { name: string; icon: string; description: string }[];
  sequence: string[];
};

type GameData = WeatherGame | SpaceGame | AnimalsGame | PlantsGame;

const scienceGames: Record<string, GameData> = {
  "science-1": {
    type: "weather",
    items: [
      {
        name: "Sunny",
        icon: "☀️",
        description: "Bright and warm day",
        sound: "chirp chirp",
      },
      {
        name: "Rainy",
        icon: "🌧️",
        description: "Water falls from clouds",
        sound: "pitter patter",
      },
      {
        name: "Cloudy",
        icon: "☁️",
        description: "Sky covered with clouds",
        sound: "whoosh",
      },
      {
        name: "Snowy",
        icon: "❄️",
        description: "Cold with falling snow",
        sound: "crunch crunch",
      },
    ],
    questions: [
      { q: "What weather is best for building a snowman?", answer: "Snowy" },
      { q: "When do you need an umbrella?", answer: "Rainy" },
      { q: "What weather is perfect for the beach?", answer: "Sunny" },
    ],
  },
  "science-2": {
    type: "space",
    planets: [
      { name: "Mercury", icon: "☿️", color: "gray", fact: "Closest to the Sun" },
      { name: "Venus", icon: "♀️", color: "yellow", fact: "Hottest planet" },
      { name: "Earth", icon: "🌍", color: "blue", fact: "Our home planet" },
      { name: "Mars", icon: "♂️", color: "red", fact: "The red planet" },
      { name: "Jupiter", icon: "♃", color: "orange", fact: "Largest planet" },
    ],
    quiz: [
      {
        q: "Which planet do we live on?",
        options: ["Mars", "Earth", "Venus"],
        answer: 1,
      },
      {
        q: "Which is the largest planet?",
        options: ["Jupiter", "Mercury", "Earth"],
        answer: 0,
      },
      {
        q: "Which planet is red?",
        options: ["Venus", "Jupiter", "Mars"],
        answer: 2,
      },
    ],
  },
  "science-3": {
    type: "animals",
    habitats: [
      { name: "Forest", icon: "🌲", animals: ["🦊", "🦌", "🐻", "🦝"] },
      { name: "Ocean", icon: "🌊", animals: ["🐠", "🐙", "🦈", "🐳"] },
      { name: "Desert", icon: "🏜️", animals: ["🦎", "🐪", "🦂", "🐍"] },
      { name: "Arctic", icon: "🧊", animals: ["🐧", "🐻‍❄️", "🦭", "🦌"] },
    ],
    matching: [
      { animal: "🐠", habitat: "Ocean" },
      { animal: "🦊", habitat: "Forest" },
      { animal: "🐪", habitat: "Desert" },
      { animal: "🐧", habitat: "Arctic" },
    ],
  },
  "science-4": {
    type: "plants",
    stages: [
      { name: "Seed", icon: "🌰", description: "Plant begins as a tiny seed" },
      {
        name: "Sprout",
        icon: "🌱",
        description: "Seed grows roots and a small shoot",
      },
      { name: "Seedling", icon: "🌿", description: "Young plant with leaves" },
      {
        name: "Adult Plant",
        icon: "🌻",
        description: "Fully grown with flowers",
      },
    ],
    sequence: ["Seed", "Sprout", "Seedling", "Adult Plant"],
  },
};

export default function ScienceNatureActivity({
  lesson,
  voiceEnabled,
  onComplete,
  onBack: _onBack,
}: ScienceNatureActivityProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [score, setScore] = useState(0);
  const [_selectedAnswer, setSelectedAnswer] = useState<string | number | null>(
    null,
  );
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  const gameData = scienceGames[lesson.id];
  const totalSteps =
    gameData.type === "weather"
      ? gameData.questions.length
      : gameData.type === "space"
        ? gameData.quiz.length
        : gameData.type === "animals"
          ? gameData.matching.length
          : gameData.stages.length;

  const progress = ((currentStep + 1) / totalSteps) * 100;

  const speakText = (text: string) => {
    if ("speechSynthesis" in window && voiceEnabled) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.8;
      utterance.pitch = 1.2;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleAnswer = (answer: string | number) => {
    let correct = false;

    if (gameData.type === "weather") {
      correct = answer === gameData.questions[currentStep].answer;
    } else if (gameData.type === "space") {
      correct = answer === gameData.quiz[currentStep].answer;
    } else if (gameData.type === "animals") {
      correct = answer === gameData.matching[currentStep].habitat;
    } else if (gameData.type === "plants") {
      correct = answer === gameData.sequence[currentStep];
    }

    setSelectedAnswer(answer);
    setIsCorrect(correct);
    setShowFeedback(true);

    if (correct) {
      setScore(score + 1);
      speakText("Fantastic! You got it right!");
    } else {
      speakText("Not quite! Let's try again!");
    }

    setTimeout(() => {
      setShowFeedback(false);
      setSelectedAnswer(null);
      if (correct && currentStep < totalSteps - 1) {
        setCurrentStep(currentStep + 1);
      } else if (correct) {
        const stars =
          score >= totalSteps * 0.8 ? 3 : score >= totalSteps * 0.6 ? 2 : 1;
        onComplete(stars);
      }
    }, 2000);
  };

  const renderActivity = () => {
    if (gameData.type === "weather") {
      const question = gameData.questions[currentStep];
      return (
        <div className="space-y-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-8">
            {gameData.items.map((item) => (
              <Card
                key={item.name}
                className="border-4 border-neon-cyan hover:scale-105 transition-transform"
              >
                <CardContent className="p-6 text-center">
                  <div className="text-6xl mb-2">{item.icon}</div>
                  <h3 className="text-xl font-bold text-neon-purple">
                    {item.name}
                  </h3>
                  <p className="text-sm text-gray-600">{item.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
          <div className="text-center space-y-6">
            <h3 className="text-3xl font-bold text-neon-purple">
              {question.q}
            </h3>
            <div className="flex flex-wrap justify-center gap-4">
              {gameData.items.map((item) => (
                <Button
                  key={item.name}
                  onClick={() => handleAnswer(item.name)}
                  size="lg"
                  className="text-xl py-6 px-8 bg-gradient-to-r from-neon-cyan to-neon-blue"
                  disabled={showFeedback}
                >
                  {item.icon} {item.name}
                </Button>
              ))}
            </div>
          </div>
        </div>
      );
    }

    if (gameData.type === "space") {
      const quiz = gameData.quiz[currentStep];
      return (
        <div className="space-y-8">
          <div className="flex justify-center gap-4 mb-8 flex-wrap">
            {gameData.planets.map((planet) => (
              <div key={planet.name} className="text-center">
                <div className="text-6xl mb-2">{planet.icon}</div>
                <p className="text-sm font-bold text-neon-purple">
                  {planet.name}
                </p>
                <p className="text-xs text-gray-600">{planet.fact}</p>
              </div>
            ))}
          </div>
          <div className="text-center space-y-6">
            <h3 className="text-3xl font-bold text-neon-purple">{quiz.q}</h3>
            <div className="space-y-4">
              {quiz.options.map((option, i) => (
                <Button
                  key={option}
                  onClick={() => handleAnswer(i)}
                  size="lg"
                  className="w-full text-xl py-6 bg-gradient-to-r from-neon-green to-neon-cyan"
                  disabled={showFeedback}
                >
                  {option}
                </Button>
              ))}
            </div>
          </div>
        </div>
      );
    }

    if (gameData.type === "animals") {
      const match = gameData.matching[currentStep];
      return (
        <div className="space-y-8">
          <div className="text-center mb-8">
            <div className="text-9xl mb-4">{match.animal}</div>
            <h3 className="text-3xl font-bold text-neon-purple">
              Where does this animal live?
            </h3>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {gameData.habitats.map((habitat) => (
              <Button
                key={habitat.name}
                onClick={() => handleAnswer(habitat.name)}
                className="h-32 flex flex-col items-center justify-center bg-gradient-to-br from-neon-green to-neon-cyan"
                disabled={showFeedback}
              >
                <div className="text-4xl mb-2">{habitat.icon}</div>
                <span className="text-xl font-bold">{habitat.name}</span>
              </Button>
            ))}
          </div>
        </div>
      );
    }

    if (gameData.type === "plants") {
      const stage = gameData.stages[currentStep];
      return (
        <div className="space-y-8 text-center">
          <h3 className="text-3xl font-bold text-neon-purple">
            Plant Life Cycle
          </h3>
          <div className="text-9xl mb-4">{stage.icon}</div>
          <h2 className="text-5xl font-bold text-neon-pink text-shadow-neon-lg">
            {stage.name}
          </h2>
          <p className="text-2xl text-neon-cyan">{stage.description}</p>
          <div className="flex justify-center gap-4 flex-wrap">
            {gameData.stages.map((s) => (
              <Button
                key={s.name}
                onClick={() => handleAnswer(s.name)}
                size="lg"
                className="text-xl py-6 px-8 bg-gradient-to-r from-neon-green to-neon-cyan"
                disabled={showFeedback}
              >
                {s.icon} {s.name}
              </Button>
            ))}
          </div>
        </div>
      );
    }

    return null;
  };

  return (
    <Card className="border-4 border-neon-green shadow-neon-lg">
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
        <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl p-8 min-h-[500px] flex flex-col items-center justify-center">
          {renderActivity()}
        </div>

        {showFeedback && (
          <div
            className={`text-center p-6 rounded-xl ${isCorrect ? "bg-green-100" : "bg-orange-100"}`}
          >
            <div className="flex items-center justify-center gap-2 text-2xl font-bold">
              {isCorrect ? (
                <>
                  <CheckCircle2 className="h-8 w-8 text-green-600" />
                  <span className="text-green-600">Amazing discovery!</span>
                </>
              ) : (
                <>
                  <span className="text-orange-600">Keep exploring!</span>
                </>
              )}
            </div>
          </div>
        )}

        <div className="flex justify-center gap-2">
          {[...Array(3)].map((_, i) => (
            <Star
              // biome-ignore lint/suspicious/noArrayIndexKey: fixed 3-star rating display
              key={i}
              className={`h-8 w-8 ${i < Math.floor((score / totalSteps) * 3) ? "text-yellow-400 fill-yellow-400" : "text-gray-300"}`}
            />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
