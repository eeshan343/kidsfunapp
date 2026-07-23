import { Button } from "@/components/ui/button";
import { useCallback, useEffect, useState } from "react";
import type { ModulePage } from "../../App";
import GameLayout from "../../components/GameLayout";

const WORD_LIST = [
  "CAT",
  "DOG",
  "BIRD",
  "FISH",
  "LION",
  "BEAR",
  "FROG",
  "DUCK",
  "PLAY",
  "JUMP",
  "RUN",
  "SWIM",
  "FLY",
  "SING",
  "DANCE",
  "LAUGH",
  "HAPPY",
  "SUNNY",
  "CLOUD",
  "STAR",
  "MOON",
  "TREE",
  "FLOWER",
  "GRASS",
  "BOOK",
  "PENCIL",
  "PAPER",
  "DESK",
  "CHAIR",
  "TABLE",
  "DOOR",
  "WINDOW",
];

interface WordWizardProps {
  onNavigate: (page: ModulePage) => void;
}

export default function WordWizard({ onNavigate }: WordWizardProps) {
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(90);
  const [currentWord, setCurrentWord] = useState("");
  const [scrambledLetters, setScrambledLetters] = useState<string[]>([]);
  const [selectedLetters, setSelectedLetters] = useState<number[]>([]);
  const [gameOver, setGameOver] = useState(false);
  const [wordsFound, setWordsFound] = useState<string[]>([]);
  const [highScore, setHighScore] = useState(0);

  const scrambleWord = useCallback((word: string) => {
    return word.split("").sort(() => Math.random() - 0.5);
  }, []);

  const startNewRound = useCallback(() => {
    const word = WORD_LIST[Math.floor(Math.random() * WORD_LIST.length)];
    setCurrentWord(word);
    setScrambledLetters(scrambleWord(word));
    setSelectedLetters([]);
  }, [scrambleWord]);

  const startGame = () => {
    setScore(0);
    setTimeLeft(90);
    setGameOver(false);
    setWordsFound([]);
    startNewRound();
  };
  useEffect(() => {
    startNewRound();
  }, [startNewRound]);

  useEffect(() => {
    if (gameOver || timeLeft <= 0) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setGameOver(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [gameOver, timeLeft]);

  useEffect(() => {
    if (gameOver && score > highScore) {
      setHighScore(score);
    }
  }, [gameOver, score, highScore]);

  const selectLetter = (index: number) => {
    if (selectedLetters.includes(index)) return;
    setSelectedLetters([...selectedLetters, index]);
  };

  const removeLetter = (index: number) => {
    setSelectedLetters(selectedLetters.filter((i) => i !== index));
  };

  const checkWord = () => {
    const formedWord = selectedLetters.map((i) => scrambledLetters[i]).join("");

    if (formedWord === currentWord) {
      setScore((prev) => prev + currentWord.length * 10);
      setWordsFound((prev) => [...prev, currentWord]);
      startNewRound();
    } else {
      setSelectedLetters([]);
    }
  };

  const skipWord = () => {
    startNewRound();
  };

  return (
    <GameLayout
      title="📝 Word Wizard"
      score={score}
      highScore={highScore}
      onRestart={startGame}
      onNavigate={onNavigate}
      gameOver={gameOver}
    >
      <div className="p-8 bg-gradient-to-br from-blue-200 to-purple-200 min-h-[600px]">
        <div className="max-w-2xl mx-auto space-y-6">
          {/* Timer and Words Found */}
          <div className="flex justify-center gap-6">
            <div className="bg-white px-6 py-3 rounded-lg border-4 border-blue-300">
              <span className="text-2xl font-bold">⏰ {timeLeft}s</span>
            </div>
            <div className="bg-white px-6 py-3 rounded-lg border-4 border-purple-300">
              <span className="text-2xl font-bold">
                Words: {wordsFound.length}
              </span>
            </div>
          </div>

          {/* Selected Letters Display */}
          <div className="bg-white p-6 rounded-lg border-4 border-green-300 min-h-24 flex items-center justify-center">
            <div className="flex gap-2 flex-wrap justify-center">
              {selectedLetters.length === 0 ? (
                <span className="text-gray-400 text-xl">Form a word...</span>
              ) : (
                selectedLetters.map((index, i) => (
                  <button
                    type="button"
                    key={`sel-${i}-${index}`}
                    className="w-16 h-16 bg-green-200 border-4 border-green-400 rounded-lg flex items-center justify-center text-3xl font-bold cursor-pointer hover:bg-green-300"
                    onClick={() => removeLetter(index)}
                  >
                    {scrambledLetters[index]}
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Scrambled Letters */}
          <div className="bg-white p-6 rounded-lg border-4 border-blue-300">
            <div className="flex gap-3 flex-wrap justify-center">
              {scrambledLetters.map((letter, index) => (
                <button
                  type="button"
                  key={`letter-${index}-${letter}`}
                  className={`w-16 h-16 border-4 rounded-lg flex items-center justify-center text-3xl font-bold cursor-pointer transition-all ${
                    selectedLetters.includes(index)
                      ? "bg-gray-200 border-gray-400 opacity-50"
                      : "bg-blue-200 border-blue-400 hover:bg-blue-300 hover:scale-110"
                  }`}
                  onClick={() => selectLetter(index)}
                >
                  {letter}
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4">
            <Button
              onClick={checkWord}
              disabled={selectedLetters.length === 0}
              className="flex-1 text-xl h-16 font-bold"
            >
              Check Word ✓
            </Button>
            <Button
              onClick={skipWord}
              variant="outline"
              className="flex-1 text-xl h-16 font-bold border-4"
            >
              Skip Word →
            </Button>
          </div>

          {/* Recent Words */}
          {wordsFound.length > 0 && (
            <div className="bg-white p-4 rounded-lg border-4 border-yellow-300">
              <h3 className="font-bold text-lg mb-2">Words Found:</h3>
              <div className="flex flex-wrap gap-2">
                {wordsFound.slice(-5).map((word) => (
                  <span
                    key={word}
                    className="bg-yellow-100 px-3 py-1 rounded-full border-2 border-yellow-300 font-bold"
                  >
                    {word}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </GameLayout>
  );
}
