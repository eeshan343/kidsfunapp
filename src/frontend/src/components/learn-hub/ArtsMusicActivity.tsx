import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Star } from "lucide-react";
import { useRef, useState } from "react";

interface Lesson {
  id: string;
  title: string;
  description: string;
}

interface ArtsMusicActivityProps {
  lesson: Lesson;
  voiceEnabled: boolean;
  onComplete: (stars: number) => void;
  onBack: () => void;
}

type ColorMixingGame = {
  type: "color-mixing";
  mixes: { color1: string; color2: string; result: string; emoji: string }[];
};

type DrawingGame = {
  type: "drawing";
  shapes: { name: string; steps: string[]; emoji: string }[];
};

type RhythmGame = {
  type: "rhythm";
  patterns: { name: string; pattern: string[]; speed: number }[];
};

type InstrumentsGame = {
  type: "instruments";
  instruments: { name: string; emoji: string; sound: string; family: string }[];
};

type CreativeGame = {
  type: "creative";
  prompts: { title: string; description: string; emoji: string }[];
};

type GameData =
  | ColorMixingGame
  | DrawingGame
  | RhythmGame
  | InstrumentsGame
  | CreativeGame;

const artsGames: Record<string, GameData> = {
  "arts-1": {
    type: "color-mixing",
    mixes: [
      { color1: "red", color2: "blue", result: "purple", emoji: "🟣" },
      { color1: "red", color2: "yellow", result: "orange", emoji: "🟠" },
      { color1: "blue", color2: "yellow", result: "green", emoji: "🟢" },
    ],
  },
  "arts-2": {
    type: "drawing",
    shapes: [
      {
        name: "Circle",
        steps: ["Draw a round shape", "Make it smooth", "Color it in"],
        emoji: "⭕",
      },
      {
        name: "Square",
        steps: ["Draw four equal sides", "Connect the corners", "Make it neat"],
        emoji: "🟦",
      },
      {
        name: "Triangle",
        steps: ["Draw three sides", "Connect the points", "Color it bright"],
        emoji: "🔺",
      },
    ],
  },
  "arts-3": {
    type: "rhythm",
    patterns: [
      { name: "Simple Beat", pattern: ["👏", "👏", "🦶", "🦶"], speed: 1000 },
      { name: "Fast Clap", pattern: ["👏", "👏", "👏", "👏"], speed: 500 },
      { name: "Mixed Beat", pattern: ["👏", "🦶", "👏", "🦶"], speed: 800 },
    ],
  },
  "arts-4": {
    type: "instruments",
    instruments: [
      { name: "Piano", emoji: "🎹", sound: "ding ding", family: "keyboard" },
      { name: "Guitar", emoji: "🎸", sound: "strum strum", family: "string" },
      { name: "Drums", emoji: "🥁", sound: "boom boom", family: "percussion" },
      { name: "Trumpet", emoji: "🎺", sound: "toot toot", family: "brass" },
    ],
  },
  "arts-5": {
    type: "creative",
    prompts: [
      {
        title: "Draw Your Happy Place",
        description: "What makes you smile?",
        emoji: "😊",
      },
      {
        title: "Create a Rainbow",
        description: "Use all the colors!",
        emoji: "🌈",
      },
      {
        title: "Design a Pattern",
        description: "Repeat shapes and colors",
        emoji: "🎨",
      },
    ],
  },
};

export default function ArtsMusicActivity({
  lesson,
  voiceEnabled,
  onComplete,
  onBack: _onBack,
}: ArtsMusicActivityProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [score, setScore] = useState(0);
  const [_selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [rhythmIndex, setRhythmIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const gameData = artsGames[lesson.id];
  const totalSteps =
    gameData.type === "color-mixing"
      ? gameData.mixes.length
      : gameData.type === "drawing"
        ? gameData.shapes.length
        : gameData.type === "rhythm"
          ? gameData.patterns.length
          : gameData.type === "instruments"
            ? gameData.instruments.length
            : gameData.prompts.length;

  const progress = ((currentStep + 1) / totalSteps) * 100;

  const speakText = (text: string) => {
    if ("speechSynthesis" in window && voiceEnabled) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.8;
      utterance.pitch = 1.2;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handleColorMix = (result: string) => {
    if (gameData.type !== "color-mixing") return;
    const mix = gameData.mixes[currentStep];

    const correct = result === mix.result;
    setSelectedAnswer(result);
    setIsCorrect(correct);
    setShowFeedback(true);

    if (correct) {
      setScore(score + 1);
      speakText("Perfect! You mixed the colors correctly!");
    } else {
      speakText("Try mixing again!");
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

  const handleNext = () => {
    setScore(score + 1);
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete(3);
    }
  };

  const playRhythm = () => {
    if (gameData.type !== "rhythm") return;
    const pattern = gameData.patterns[currentStep];
    setIsPlaying(true);
    setRhythmIndex(0);

    let index = 0;
    const interval = setInterval(() => {
      if (index < pattern.pattern.length) {
        setRhythmIndex(index);
        index++;
      } else {
        clearInterval(interval);
        setIsPlaying(false);
        setRhythmIndex(0);
      }
    }, pattern.speed);
  };

  const renderActivity = () => {
    if (gameData.type === "color-mixing") {
      const mix = gameData.mixes[currentStep];
      return (
        <div className="space-y-8 text-center">
          <h3 className="text-3xl font-bold text-neon-purple">
            Mix these colors:
          </h3>
          <div className="flex justify-center gap-8 items-center">
            <div
              className={`w-32 h-32 rounded-full bg-${mix.color1}-500 border-4 border-neon-purple shadow-neon-md`}
            />
            <span className="text-5xl">+</span>
            <div
              className={`w-32 h-32 rounded-full bg-${mix.color2}-500 border-4 border-neon-purple shadow-neon-md`}
            />
            <span className="text-5xl">=</span>
            <span className="text-6xl">?</span>
          </div>
          <div className="flex justify-center gap-4">
            {["purple", "orange", "green"].map((color) => (
              <Button
                key={color}
                onClick={() => handleColorMix(color)}
                size="lg"
                className={`w-32 h-32 rounded-full bg-${color}-500 border-4 border-neon-purple`}
                disabled={showFeedback}
              >
                <span className="text-4xl">
                  {color === "purple" ? "🟣" : color === "orange" ? "🟠" : "🟢"}
                </span>
              </Button>
            ))}
          </div>
        </div>
      );
    }

    if (gameData.type === "drawing") {
      const shape = gameData.shapes[currentStep];
      return (
        <div className="space-y-8 text-center">
          <div className="text-9xl mb-4">{shape.emoji}</div>
          <h2 className="text-5xl font-bold text-neon-purple">{shape.name}</h2>
          <div className="space-y-4">
            {shape.steps.map((step, i) => (
              <Card
                key={`step-${i}-${step.slice(0, 5)}`}
                className="border-2 border-neon-cyan"
              >
                <CardContent className="p-4">
                  <p className="text-xl">
                    Step {i + 1}: {step}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
          <canvas
            ref={canvasRef}
            width={400}
            height={300}
            className="border-4 border-neon-purple rounded-lg mx-auto bg-white"
          />
          <Button
            onClick={handleNext}
            size="lg"
            className="bg-gradient-to-r from-neon-pink to-neon-purple"
          >
            I Drew It! Next Shape
          </Button>
        </div>
      );
    }

    if (gameData.type === "rhythm") {
      const pattern = gameData.patterns[currentStep];
      return (
        <div className="space-y-8 text-center">
          <h2 className="text-4xl font-bold text-neon-purple">
            {pattern.name}
          </h2>
          <div className="flex justify-center gap-4">
            {pattern.pattern.map((emoji, i) => (
              <div
                key={`beat-${i}-${emoji}`}
                className={`w-24 h-24 flex items-center justify-center text-5xl border-4 rounded-lg transition-all ${
                  isPlaying && i === rhythmIndex
                    ? "border-neon-pink bg-neon-pink/20 scale-125"
                    : "border-neon-cyan"
                }`}
              >
                {emoji}
              </div>
            ))}
          </div>
          <div className="space-y-4">
            <Button
              onClick={playRhythm}
              size="lg"
              className="bg-gradient-to-r from-neon-cyan to-neon-blue"
              disabled={isPlaying}
            >
              {isPlaying ? "Playing..." : "Play Pattern"}
            </Button>
            <Button
              onClick={handleNext}
              size="lg"
              className="bg-gradient-to-r from-neon-green to-neon-cyan"
            >
              I Got It! Next Pattern
            </Button>
          </div>
        </div>
      );
    }

    if (gameData.type === "instruments") {
      const instrument = gameData.instruments[currentStep];
      return (
        <div className="space-y-8 text-center">
          <div className="text-9xl mb-4">{instrument.emoji}</div>
          <h2 className="text-5xl font-bold text-neon-purple">
            {instrument.name}
          </h2>
          <p className="text-3xl text-neon-cyan">Sound: {instrument.sound}</p>
          <p className="text-2xl text-gray-600">Family: {instrument.family}</p>
          <Button
            onClick={handleNext}
            size="lg"
            className="bg-gradient-to-r from-neon-pink to-neon-purple"
          >
            Next Instrument
          </Button>
        </div>
      );
    }

    if (gameData.type === "creative") {
      const prompt = gameData.prompts[currentStep];
      return (
        <div className="space-y-8 text-center">
          <div className="text-9xl mb-4">{prompt.emoji}</div>
          <h2 className="text-5xl font-bold text-neon-purple">
            {prompt.title}
          </h2>
          <p className="text-2xl text-neon-cyan">{prompt.description}</p>
          <canvas
            ref={canvasRef}
            width={600}
            height={400}
            className="border-4 border-neon-purple rounded-lg mx-auto bg-white"
          />
          <Button
            onClick={handleNext}
            size="lg"
            className="bg-gradient-to-r from-neon-green to-neon-cyan"
          >
            I'm Done! Next Prompt
          </Button>
        </div>
      );
    }

    return null;
  };

  return (
    <Card className="border-4 border-neon-pink shadow-neon-lg">
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
        <div className="bg-gradient-to-br from-pink-50 to-purple-50 rounded-xl p-8 min-h-[500px] flex flex-col items-center justify-center">
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
                  <span className="text-green-600">Creative genius!</span>
                </>
              ) : (
                <>
                  <span className="text-orange-600">Keep creating!</span>
                </>
              )}
            </div>
          </div>
        )}

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
