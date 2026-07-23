import { useCallback, useEffect, useState } from "react";
import type { ModulePage } from "../../App";
import GameLayout from "../../components/GameLayout";

interface Criminal {
  id: number;
  lane: number;
  y: number;
}

interface PoliceBuddyChaseProps {
  onNavigate: (page: ModulePage) => void;
}

export default function PoliceBuddyChase({
  onNavigate,
}: PoliceBuddyChaseProps) {
  const [score, setScore] = useState(0);
  const [policeLane, setPoliceLane] = useState(1);
  const [criminals, setCriminals] = useState<Criminal[]>([]);
  const [gameOver, setGameOver] = useState(false);
  const [speed, setSpeed] = useState(3);
  const [nextId, setNextId] = useState(0);
  const [highScore, setHighScore] = useState(0);

  const startGame = () => {
    setScore(0);
    setPoliceLane(1);
    setCriminals([]);
    setGameOver(false);
    setSpeed(3);
    setNextId(0);
  };

  useEffect(() => {
    if (gameOver) return;

    const spawnInterval = setInterval(() => {
      const lane = Math.floor(Math.random() * 3);
      setCriminals((prev) => [...prev, { id: nextId, lane, y: -10 }]);
      setNextId((id) => id + 1);
    }, 2000);

    return () => clearInterval(spawnInterval);
  }, [gameOver, nextId]);

  useEffect(() => {
    if (gameOver) return;

    const moveInterval = setInterval(() => {
      setCriminals((prev) => {
        const updated = prev.map((crim) => ({ ...crim, y: crim.y + speed }));

        // Check if caught
        for (const crim of updated) {
          if (crim.lane === policeLane && crim.y > 80 && crim.y < 95) {
            setScore((s) => s + 10);
            setCriminals((prev) => prev.filter((c) => c.id !== crim.id));
          }
        }

        // Check if escaped
        for (const crim of updated) {
          if (crim.y > 100) {
            setGameOver(true);
          }
        }

        return updated.filter((crim) => crim.y < 110);
      });
    }, 50);

    return () => clearInterval(moveInterval);
  }, [gameOver, speed, policeLane]);

  useEffect(() => {
    if (score > 0 && score % 50 === 0) {
      setSpeed((prev) => Math.min(prev + 0.5, 8));
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

      if (e.key === "ArrowLeft" && policeLane > 0) {
        setPoliceLane((prev) => prev - 1);
      } else if (e.key === "ArrowRight" && policeLane < 2) {
        setPoliceLane((prev) => prev + 1);
      }
    },
    [gameOver, policeLane],
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [handleKeyPress]);

  return (
    <GameLayout
      title="👮 Police Buddy Chase"
      score={score}
      highScore={highScore}
      onRestart={startGame}
      onNavigate={onNavigate}
      gameOver={gameOver}
    >
      <div className="relative w-full h-[600px] bg-gradient-to-b from-blue-400 to-blue-200 overflow-hidden">
        {/* Road */}
        <div className="absolute inset-0 flex">
          {[0, 1, 2].map((lane) => (
            <div
              key={lane}
              className="flex-1 border-x-4 border-white/30 relative bg-gray-600"
            >
              <div className="absolute inset-0 flex flex-col justify-around">
                {[...Array(10)].map((_, i) => (
                  // biome-ignore lint/suspicious/noArrayIndexKey: positional list
                  <div key={i} className="h-8 w-2 bg-yellow-300 mx-auto" />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Instructions */}
        {criminals.length === 0 && !gameOver && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <div className="bg-white p-8 rounded-lg border-4 border-blue-400 text-center">
              <h2 className="text-3xl font-bold mb-4">Catch the Criminals!</h2>
              <p className="text-lg mb-2">Use ← → arrows to change lanes</p>
              <p className="text-lg">Don't let them escape!</p>
            </div>
          </div>
        )}

        {/* Police Car */}
        <div
          className="absolute bottom-16 transition-all duration-200"
          style={{
            left: `${16.67 + policeLane * 33.33}%`,
            transform: "translateX(-50%)",
          }}
        >
          <div className="text-5xl">🚓</div>
        </div>

        {/* Criminals */}
        {criminals.map((criminal) => (
          <div
            key={criminal.id}
            className="absolute transition-all"
            style={{
              left: `${16.67 + criminal.lane * 33.33}%`,
              top: `${criminal.y}%`,
              transform: "translateX(-50%)",
            }}
          >
            <div className="text-4xl">🏃</div>
          </div>
        ))}

        {/* Speed Display */}
        <div className="absolute top-4 right-4 bg-white px-4 py-2 rounded-lg border-3 border-blue-400">
          <span className="font-bold">Speed: {speed.toFixed(1)}x</span>
        </div>
      </div>
    </GameLayout>
  );
}
