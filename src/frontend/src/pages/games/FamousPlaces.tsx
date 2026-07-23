import { Button } from "@/components/ui/button";
import { useEffect, useState } from "react";
import type { ModulePage } from "../../App";
import GameLayout from "../../components/GameLayout";

interface Question {
  place: string;
  options: string[];
  correct: string;
}

interface FamousPlacesProps {
  onNavigate: (page: ModulePage) => void;
}

export default function FamousPlaces({ onNavigate }: FamousPlacesProps) {
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answered, setAnswered] = useState(false);
  const [selectedAnswer, setSelectedAnswer] = useState("");

  const questions: Question[] = [
    {
      place: "Eiffel Tower",
      options: ["Paris", "London", "Rome", "Berlin"],
      correct: "Paris",
    },
    {
      place: "Statue of Liberty",
      options: ["New York", "Los Angeles", "Chicago", "Miami"],
      correct: "New York",
    },
    {
      place: "Big Ben",
      options: ["London", "Paris", "Dublin", "Edinburgh"],
      correct: "London",
    },
    {
      place: "Taj Mahal",
      options: ["India", "Pakistan", "Bangladesh", "Nepal"],
      correct: "India",
    },
    {
      place: "Great Wall",
      options: ["China", "Japan", "Korea", "Mongolia"],
      correct: "China",
    },
    {
      place: "Pyramids",
      options: ["Egypt", "Mexico", "Peru", "Sudan"],
      correct: "Egypt",
    },
    {
      place: "Sydney Opera House",
      options: ["Australia", "New Zealand", "Singapore", "Malaysia"],
      correct: "Australia",
    },
    {
      place: "Colosseum",
      options: ["Rome", "Athens", "Istanbul", "Cairo"],
      correct: "Rome",
    },
  ];

  const startGame = () => {
    setScore(0);
    setGameOver(false);
    setCurrentQuestion(0);
    setAnswered(false);
    setSelectedAnswer("");
  };

  useEffect(() => {
    if (gameOver && score > highScore) {
      setHighScore(score);
    }
  }, [gameOver, score, highScore]);

  const handleAnswer = (answer: string) => {
    if (answered) return;

    setSelectedAnswer(answer);
    setAnswered(true);

    if (answer === questions[currentQuestion].correct) {
      setScore((prev) => prev + 10);
    }

    setTimeout(() => {
      if (currentQuestion < questions.length - 1) {
        setCurrentQuestion((prev) => prev + 1);
        setAnswered(false);
        setSelectedAnswer("");
      } else {
        setGameOver(true);
      }
    }, 1500);
  };

  const question = questions[currentQuestion];

  return (
    <GameLayout
      title="🗺️ Find Famous Places"
      score={score}
      highScore={highScore}
      onRestart={startGame}
      onNavigate={onNavigate}
      gameOver={gameOver}
    >
      <div className="p-8 bg-gradient-to-br from-blue-200 to-green-200 min-h-[600px]">
        <div className="max-w-2xl mx-auto space-y-8">
          <div className="text-center">
            <div className="text-lg font-semibold mb-2">
              Question {currentQuestion + 1} of {questions.length}
            </div>
            <h2 className="text-4xl font-bold mb-6">
              Where is the {question.place}?
            </h2>
            <div className="text-8xl mb-6">🏛️</div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {question.options.map((option) => {
              let buttonClass = "h-24 text-2xl font-bold";
              if (answered) {
                if (option === question.correct) {
                  buttonClass += " bg-green-500 hover:bg-green-500";
                } else if (option === selectedAnswer) {
                  buttonClass += " bg-red-500 hover:bg-red-500";
                }
              }

              return (
                <Button
                  key={option}
                  onClick={() => handleAnswer(option)}
                  disabled={answered}
                  className={buttonClass}
                  variant="outline"
                >
                  {option}
                </Button>
              );
            })}
          </div>

          {answered && (
            <div className="text-center text-2xl font-bold">
              {selectedAnswer === question.correct ? (
                <span className="text-green-600">✓ Correct!</span>
              ) : (
                <span className="text-red-600">
                  ✗ Wrong! It's {question.correct}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </GameLayout>
  );
}
