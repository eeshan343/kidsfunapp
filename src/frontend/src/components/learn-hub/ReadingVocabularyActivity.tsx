import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Star, Volume2 } from "lucide-react";
import { useEffect, useState } from "react";

interface Lesson {
  id: string;
  title: string;
  description: string;
}

interface ReadingVocabularyActivityProps {
  lesson: Lesson;
  voiceEnabled: boolean;
  onComplete: (stars: number) => void;
  onBack: () => void;
}

type PhonicsGame = {
  type: "phonics";
  words: { word: string; sound: string; image: string }[];
};

type WordBuilderGame = {
  type: "word-builder";
  letters: string[];
  targetWords: string[];
};

type StoryGame = {
  type: "story";
  story: string;
  questions: { q: string; options: string[]; answer: number }[];
};

type SpellingGame = {
  type: "spelling";
  words: { word: string; scrambled: string[]; image: string }[];
};

type VocabularyGame = {
  type: "vocabulary";
  words: { word: string; meaning: string; image: string; sentence: string }[];
};

type GameData =
  | PhonicsGame
  | WordBuilderGame
  | StoryGame
  | SpellingGame
  | VocabularyGame;

const wordGames: Record<string, GameData> = {
  "reading-1": {
    type: "phonics",
    words: [
      { word: "cat", sound: "/k/ /æ/ /t/", image: "🐱" },
      { word: "dog", sound: "/d/ /ɔ/ /g/", image: "🐶" },
      { word: "sun", sound: "/s/ /ʌ/ /n/", image: "☀️" },
      { word: "hat", sound: "/h/ /æ/ /t/", image: "🎩" },
      { word: "pen", sound: "/p/ /ɛ/ /n/", image: "🖊️" },
    ],
  },
  "reading-2": {
    type: "word-builder",
    letters: ["c", "a", "t", "b", "r", "h", "m", "p"],
    targetWords: ["cat", "bat", "rat", "hat", "mat", "pat"],
  },
  "reading-3": {
    type: "story",
    story: "The little cat sat on a mat. The cat saw a rat. The rat ran fast!",
    questions: [
      {
        q: "Where did the cat sit?",
        options: ["on a mat", "on a hat", "on a bat"],
        answer: 0,
      },
      {
        q: "What did the cat see?",
        options: ["a dog", "a rat", "a bird"],
        answer: 1,
      },
      {
        q: "What did the rat do?",
        options: ["sat down", "ran fast", "jumped high"],
        answer: 1,
      },
    ],
  },
  "reading-4": {
    type: "spelling",
    words: [
      { word: "apple", scrambled: ["a", "p", "l", "e", "p"], image: "🍎" },
      { word: "house", scrambled: ["h", "o", "u", "s", "e"], image: "🏠" },
      { word: "tree", scrambled: ["t", "r", "e", "e"], image: "🌳" },
      { word: "book", scrambled: ["b", "o", "o", "k"], image: "📚" },
    ],
  },
  "reading-5": {
    type: "vocabulary",
    words: [
      {
        word: "happy",
        meaning: "feeling joy and pleasure",
        image: "😊",
        sentence: "I am happy when I play.",
      },
      {
        word: "big",
        meaning: "large in size",
        image: "🐘",
        sentence: "The elephant is big.",
      },
      {
        word: "fast",
        meaning: "moving quickly",
        image: "🏃",
        sentence: "The rabbit runs fast.",
      },
      {
        word: "bright",
        meaning: "giving out light",
        image: "💡",
        sentence: "The sun is bright.",
      },
    ],
  },
};

export default function ReadingVocabularyActivity({
  lesson,
  voiceEnabled,
  onComplete,
  onBack: _onBack,
}: ReadingVocabularyActivityProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [score, setScore] = useState(0);
  const [_selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [builtWord, setBuiltWord] = useState<string[]>([]);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  const gameData = wordGames[lesson.id];
  const totalSteps =
    gameData.type === "phonics"
      ? gameData.words.length
      : gameData.type === "word-builder"
        ? gameData.targetWords.length
        : gameData.type === "story"
          ? gameData.questions.length
          : gameData.type === "spelling"
            ? gameData.words.length
            : gameData.words.length;

  const progress = ((currentStep + 1) / totalSteps) * 100;

  useEffect(() => {
    if (voiceEnabled && gameData.type === "phonics") {
      const word = gameData.words[currentStep];
      speakText(
        `The word is ${word.word}. Listen to the sounds: ${word.sound}`,
      );
    }
  }, [currentStep, voiceEnabled, gameData]);

  const speakText = (text: string) => {
    if ("speechSynthesis" in window && voiceEnabled) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.8;
      utterance.pitch = 1.2;
      window.speechSynthesis.speak(utterance);
    }
  };

  const handlePhonicsAnswer = () => {
    setScore(score + 1);
    setShowFeedback(true);
    setIsCorrect(true);
    speakText("Great job! You got it right!");

    setTimeout(() => {
      setShowFeedback(false);
      if (currentStep < totalSteps - 1) {
        setCurrentStep(currentStep + 1);
      } else {
        const stars =
          score >= totalSteps * 0.8 ? 3 : score >= totalSteps * 0.6 ? 2 : 1;
        onComplete(stars);
      }
    }, 2000);
  };

  const handleWordBuilderSubmit = () => {
    if (gameData.type !== "word-builder") return;
    const targetWord = gameData.targetWords[currentStep];
    const correct = builtWord.join("") === targetWord;

    setIsCorrect(correct);
    setShowFeedback(true);

    if (correct) {
      setScore(score + 1);
      speakText("Excellent! You built the word correctly!");
    } else {
      speakText("Not quite. Try again!");
    }

    setTimeout(() => {
      setShowFeedback(false);
      setBuiltWord([]);
      if (correct && currentStep < totalSteps - 1) {
        setCurrentStep(currentStep + 1);
      } else if (correct) {
        const stars =
          score >= totalSteps * 0.8 ? 3 : score >= totalSteps * 0.6 ? 2 : 1;
        onComplete(stars);
      }
    }, 2000);
  };

  const handleStoryAnswer = (index: number) => {
    if (gameData.type !== "story") return;

    const correct = index === gameData.questions[currentStep].answer;
    setSelectedAnswer(index);
    setIsCorrect(correct);
    setShowFeedback(true);

    if (correct) {
      setScore(score + 1);
      speakText("Perfect! That's the right answer!");
    } else {
      speakText("Oops! Try reading the story again.");
    }

    setTimeout(() => {
      setShowFeedback(false);
      setSelectedAnswer(null);
      if (currentStep < totalSteps - 1) {
        setCurrentStep(currentStep + 1);
      } else {
        const stars =
          score >= totalSteps * 0.8 ? 3 : score >= totalSteps * 0.6 ? 2 : 1;
        onComplete(stars);
      }
    }, 2000);
  };

  const handleSpellingSubmit = () => {
    if (gameData.type !== "spelling") return;

    const targetWord = gameData.words[currentStep].word;
    const correct = builtWord.join("") === targetWord;

    setIsCorrect(correct);
    setShowFeedback(true);

    if (correct) {
      setScore(score + 1);
      speakText("Amazing! You spelled it correctly!");
    } else {
      speakText("Almost there! Try again!");
    }

    setTimeout(() => {
      setShowFeedback(false);
      setBuiltWord([]);
      if (correct && currentStep < totalSteps - 1) {
        setCurrentStep(currentStep + 1);
      } else if (correct) {
        const stars =
          score >= totalSteps * 0.8 ? 3 : score >= totalSteps * 0.6 ? 2 : 1;
        onComplete(stars);
      }
    }, 2000);
  };

  const handleVocabularyNext = () => {
    setScore(score + 1);
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      onComplete(3);
    }
  };

  const renderActivity = () => {
    if (gameData.type === "phonics") {
      const word = gameData.words[currentStep];
      return (
        <div className="space-y-8 text-center">
          <div className="text-9xl mb-4 animate-bounce">{word.image}</div>
          <h2 className="text-6xl font-bold text-neon-purple text-shadow-neon-lg">
            {word.word}
          </h2>
          <p className="text-3xl text-neon-cyan text-shadow-neon-md">
            {word.sound}
          </p>
          <Button
            onClick={() => speakText(`${word.word}. ${word.sound}`)}
            size="lg"
            className="bg-gradient-to-r from-neon-cyan to-neon-blue text-white font-bold text-xl px-8 py-6"
          >
            <Volume2 className="mr-2 h-6 w-6" />
            Hear the Sounds
          </Button>
          <Button
            onClick={handlePhonicsAnswer}
            size="lg"
            className="bg-gradient-to-r from-neon-green to-neon-cyan text-white font-bold text-xl px-8 py-6"
          >
            I Got It! Next Word
          </Button>
        </div>
      );
    }

    if (gameData.type === "word-builder") {
      return (
        <div className="space-y-8">
          <div className="text-center">
            <h3 className="text-3xl font-bold text-neon-purple mb-4">
              Build the word:
            </h3>
            <div className="text-5xl font-bold text-neon-pink text-shadow-neon-lg mb-8">
              {gameData.targetWords[currentStep]}
            </div>
          </div>
          <div className="flex justify-center gap-4 mb-8">
            {builtWord.map((letter, i) => (
              <div
                key={`built-${i}-${letter}`}
                className="w-16 h-16 bg-neon-purple/20 border-4 border-neon-purple rounded-lg flex items-center justify-center text-3xl font-bold"
              >
                {letter}
              </div>
            ))}
          </div>
          <div className="flex flex-wrap justify-center gap-4">
            {gameData.letters.map((letter, i) => (
              <Button
                key={`letter-${i}-${letter}`}
                onClick={() => setBuiltWord([...builtWord, letter])}
                size="lg"
                className="w-16 h-16 text-2xl font-bold bg-gradient-to-br from-neon-cyan to-neon-blue"
              >
                {letter}
              </Button>
            ))}
          </div>
          <div className="flex justify-center gap-4">
            <Button
              onClick={() => setBuiltWord([])}
              variant="outline"
              size="lg"
            >
              Clear
            </Button>
            <Button
              onClick={handleWordBuilderSubmit}
              size="lg"
              className="bg-gradient-to-r from-neon-green to-neon-cyan"
            >
              Check Word
            </Button>
          </div>
        </div>
      );
    }

    if (gameData.type === "story") {
      const question = gameData.questions[currentStep];
      return (
        <div className="space-y-8">
          <Card className="border-4 border-neon-purple bg-gradient-to-br from-purple-50 to-pink-50">
            <CardContent className="p-8">
              <p className="text-2xl leading-relaxed text-gray-800">
                {gameData.story}
              </p>
            </CardContent>
          </Card>
          <div className="text-center space-y-6">
            <h3 className="text-3xl font-bold text-neon-purple">
              {question.q}
            </h3>
            <div className="space-y-4">
              {question.options.map((option, i) => (
                <Button
                  key={option}
                  onClick={() => handleStoryAnswer(i)}
                  size="lg"
                  className="w-full text-xl py-6 bg-gradient-to-r from-neon-cyan to-neon-blue"
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

    if (gameData.type === "spelling") {
      const word = gameData.words[currentStep];
      return (
        <div className="space-y-8">
          <div className="text-center">
            <div className="text-9xl mb-4">{word.image}</div>
            <h3 className="text-3xl font-bold text-neon-purple mb-4">
              Spell this word:
            </h3>
          </div>
          <div className="flex justify-center gap-4 mb-8">
            {builtWord.map((letter, i) => (
              <div
                key={`built-${i}-${letter}`}
                className="w-16 h-16 bg-neon-purple/20 border-4 border-neon-purple rounded-lg flex items-center justify-center text-3xl font-bold"
              >
                {letter}
              </div>
            ))}
          </div>
          <div className="flex flex-wrap justify-center gap-4">
            {word.scrambled.map((letter, i) => (
              <Button
                key={`scr-${i}-${letter}`}
                onClick={() => setBuiltWord([...builtWord, letter])}
                size="lg"
                className="w-16 h-16 text-2xl font-bold bg-gradient-to-br from-neon-pink to-neon-purple"
              >
                {letter}
              </Button>
            ))}
          </div>
          <div className="flex justify-center gap-4">
            <Button
              onClick={() => setBuiltWord([])}
              variant="outline"
              size="lg"
            >
              Clear
            </Button>
            <Button
              onClick={handleSpellingSubmit}
              size="lg"
              className="bg-gradient-to-r from-neon-green to-neon-cyan"
            >
              Check Spelling
            </Button>
          </div>
        </div>
      );
    }

    if (gameData.type === "vocabulary") {
      const word = gameData.words[currentStep];
      return (
        <div className="space-y-8 text-center">
          <div className="text-9xl mb-4">{word.image}</div>
          <h2 className="text-6xl font-bold text-neon-purple text-shadow-neon-lg">
            {word.word}
          </h2>
          <p className="text-2xl text-neon-cyan text-shadow-neon-md italic">
            {word.meaning}
          </p>
          <Card className="border-4 border-neon-green bg-gradient-to-br from-green-50 to-cyan-50">
            <CardContent className="p-6">
              <p className="text-xl text-gray-800">{word.sentence}</p>
            </CardContent>
          </Card>
          <Button
            onClick={handleVocabularyNext}
            size="lg"
            className="bg-gradient-to-r from-neon-green to-neon-cyan text-white font-bold text-xl px-8 py-6"
          >
            Next Word
          </Button>
        </div>
      );
    }

    return null;
  };

  return (
    <Card className="border-4 border-neon-purple shadow-neon-lg">
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
        <div className="bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl p-8 min-h-[500px] flex flex-col items-center justify-center">
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
                  <span className="text-green-600">Excellent work!</span>
                </>
              ) : (
                <>
                  <span className="text-orange-600">Try again!</span>
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
