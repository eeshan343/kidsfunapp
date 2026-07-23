import { useCallback, useEffect, useState } from "react";
import type { ModulePage } from "../../App";
import GameLayout from "../../components/GameLayout";

interface Obstacle {
  id: number;
  x: number;
  question: string;
  answer: number;
  options: number[];
}

interface NumberRunnerProps {
  onNavigate: (page: ModulePage) => void;
}

export default function NumberRunner({ onNavigate }: NumberRunnerProps) {
  const [score, setScore] = useState(0);
  const [playerLane, setPlayerLane] = useState(1);
  const [obstacles, setObstacles] = useState<Obstacle[]>([]);
  const [gameOver, setGameOver] = useState(false);
  const [speed, setSpeed] = useState(2);
  const [nextId, setNextId] = useState(0);
  const [highScore, setHighScore] = useState(0);

  const generateMathProblem = useCallback(() => {
    const operations = ["+", "-", "×"];
    const operation = operations[Math.floor(Math.random() * operations.length)];
    let num1 = Math.floor(Math.random() * 10) + 1;
    let num2 = Math.floor(Math.random() * 10) + 1;
    let answer = 0;

    switch (operation) {
      case "+":
        answer = num1 + num2;
        break;
      case "-":
        if (num1 < num2) [num1, num2] = [num2, num1];
        answer = num1 - num2;
        break;
      case "×":
        num1 = Math.floor(Math.random() * 5) + 1;
        num2 = Math.floor(Math.random() * 5) + 1;
        answer = num1 * num2;
        break;
    }

    const options = [answer];
    while (options.length < 3) {
      const wrong = answer + Math.floor(Math.random() * 10) - 5;
      if (wrong !== answer && !options.includes(wrong) && wrong >= 0) {
        options.push(wrong);
      }
    }

    return {
      question: `${num1} ${operation} ${num2}`,
      answer,
      options: options.sort(() => Math.random() - 0.5),
    };
  }, []);

  const createObstacle = useCallback(() => {
    const problem = generateMathProblem();
    return {
      id: nextId,
      x: 100,
      ...problem,
    };
  }, [nextId, generateMathProblem]);

  const startGame = () => {
    setScore(0);
    setPlayerLane(1);
    setObstacles([]);
    setGameOver(false);
    setSpeed(2);
    setNextId(0);
  };

  useEffect(() => {
    if (gameOver) return;

    const spawnInterval = setInterval(() => {
      setNextId((id) => id + 1);
      setObstacles((prev) => [...prev, createObstacle()]);
    }, 3000);

    return () => clearInterval(spawnInterval);
  }, [gameOver, createObstacle]);

  useEffect(() => {
    if (gameOver) return;

    const moveInterval = setInterval(() => {
      setObstacles((prev) => {
        const updated = prev.map((obs) => ({ ...obs, x: obs.x - speed }));

        // Check for collisions
        const collision = updated.find((obs) => obs.x < 20 && obs.x > 0);
        if (collision) {
          setGameOver(true);
        }

        return updated.filter((obs) => obs.x > -20);
      });
    }, 50);

    return () => clearInterval(moveInterval);
  }, [gameOver, speed]);

  useEffect(() => {
    if (score > 0 && score % 50 === 0) {
      setSpeed((prev) => Math.min(prev + 0.5, 5));
    }
  }, [score]);

  useEffect(() => {
    if (gameOver && score > highScore) {
      setHighScore(score);
    }
  }, [gameOver, score, highScore]);

  const handleKeyPress = useCallback(
    (e: KeyboardEvent) => {
      if (gameOver) return;

      if (e.key === "ArrowUp" && playerLane > 0) {
        setPlayerLane((prev) => prev - 1);
      } else if (e.key === "ArrowDown" && playerLane < 2) {
        setPlayerLane((prev) => prev + 1);
      }
    },
    [gameOver, playerLane],
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [handleKeyPress]);

  const answerQuestion = (obstacle: Obstacle, selectedAnswer: number) => {
    if (selectedAnswer === obstacle.answer) {
      setScore((prev) => prev + 10);
      setObstacles((prev) => prev.filter((obs) => obs.id !== obstacle.id));
    } else {
      setGameOver(true);
    }
  };

  return (
    <GameLayout
      title="🔢 Number Runner"
      score={score}
      highScore={highScore}
      onRestart={startGame}
      onNavigate={onNavigate}
      gameOver={gameOver}
    >
      <div className="relative w-full h-[600px] bg-gradient-to-r from-green-300 to-blue-300 overflow-hidden">
        {/* Instructions */}
        {obstacles.length === 0 && !gameOver && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <div className="bg-white p-8 rounded-lg border-4 border-green-400 text-center">
              <h2 className="text-3xl font-bold mb-4">Solve Math Problems!</h2>
              <p className="text-lg mb-2">Use ↑ ↓ arrows to move</p>
              <p className="text-lg mb-4">Click the correct answer!</p>
            </div>
          </div>
        )}

        {/* Lanes */}
        <div className="absolute inset-0 flex flex-col">
          {[0, 1, 2].map((lane) => (
            <div
              key={lane}
              className="flex-1 border-b-4 border-white/30 relative"
            >
              {/* Player */}
              {playerLane === lane && (
                <div className="absolute left-8 top-1/2 transform -translate-y-1/2 w-16 h-16 bg-yellow-400 rounded-full border-4 border-yellow-600 flex items-center justify-center text-2xl">
                  🏃
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Obstacles */}
        {obstacles.map((obstacle, index) => (
          <div
            key={obstacle.id}
            className="absolute"
            style={{
              left: `${obstacle.x}%`,
              top: `${16.67 + (index % 3) * 33.33}%`,
              transform: "translateY(-50%)",
            }}
          >
            <div className="bg-white p-4 rounded-lg border-4 border-purple-400 shadow-lg">
              <div className="text-xl font-bold mb-2 text-center">
                {obstacle.question} = ?
              </div>
              <div className="flex gap-2">
                {obstacle.options.map((option) => (
                  <button
                    type="button"
                    key={option}
                    onClick={() => answerQuestion(obstacle, option)}
                    className="w-12 h-12 bg-purple-200 hover:bg-purple-300 border-3 border-purple-400 rounded-lg font-bold text-lg transition-all hover:scale-110"
                  >
                    {option}
                  </button>
                ))}
              </div>
            </div>
          </div>
        ))}

        {/* Speed Indicator */}
        <div className="absolute bottom-4 right-4 bg-white px-4 py-2 rounded-lg border-3 border-blue-400">
          <span className="font-bold">Speed: {speed.toFixed(1)}x</span>
        </div>
      </div>
    </GameLayout>
  );
}
