import { useCallback, useEffect, useState } from "react";
import type { ModulePage } from "../../App";
import GameLayout from "../../components/GameLayout";

interface Obstacle {
  id: number;
  lane: number;
  y: number;
}

interface SuperSpeedyRacerProps {
  onNavigate: (page: ModulePage) => void;
}

export default function SuperSpeedyRacer({
  onNavigate,
}: SuperSpeedyRacerProps) {
  const [score, setScore] = useState(0);
  const [playerLane, setPlayerLane] = useState(1);
  const [obstacles, setObstacles] = useState<Obstacle[]>([]);
  const [gameOver, setGameOver] = useState(false);
  const [speed, setSpeed] = useState(5);
  const [nextId, setNextId] = useState(0);
  const [highScore, setHighScore] = useState(0);

  const startGame = () => {
    setScore(0);
    setPlayerLane(1);
    setObstacles([]);
    setGameOver(false);
    setSpeed(5);
    setNextId(0);
  };

  useEffect(() => {
    if (gameOver) return;

    const spawnInterval = setInterval(() => {
      const lane = Math.floor(Math.random() * 3);
      setObstacles((prev) => [...prev, { id: nextId, lane, y: -10 }]);
      setNextId((id) => id + 1);
    }, 1500);

    return () => clearInterval(spawnInterval);
  }, [gameOver, nextId]);

  useEffect(() => {
    if (gameOver) return;

    const moveInterval = setInterval(() => {
      setObstacles((prev) => {
        const updated = prev.map((obs) => ({ ...obs, y: obs.y + speed }));

        // Check collision
        const collision = updated.find(
          (obs) => obs.lane === playerLane && obs.y > 80 && obs.y < 95,
        );
        if (collision) {
          setGameOver(true);
        }

        // Score for passed obstacles
        for (const obs of updated) {
          if (obs.y > 100 && obs.y < 100 + speed) {
            setScore((prev) => prev + 1);
          }
        }

        return updated.filter((obs) => obs.y < 110);
      });
    }, 50);

    return () => clearInterval(moveInterval);
  }, [gameOver, speed, playerLane]);

  useEffect(() => {
    if (score > 0 && score % 20 === 0) {
      setSpeed((prev) => Math.min(prev + 0.5, 10));
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

      if (e.key === "ArrowLeft" && playerLane > 0) {
        setPlayerLane((prev) => prev - 1);
      } else if (e.key === "ArrowRight" && playerLane < 2) {
        setPlayerLane((prev) => prev + 1);
      }
    },
    [gameOver, playerLane],
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [handleKeyPress]);

  return (
    <GameLayout
      title="🏎️ Super Speedy Racer"
      score={score}
      highScore={highScore}
      onRestart={startGame}
      onNavigate={onNavigate}
      gameOver={gameOver}
    >
      <div className="relative w-full h-[600px] bg-gray-600 overflow-hidden">
        {/* Road */}
        <div className="absolute inset-0 flex">
          {[0, 1, 2].map((lane) => (
            <div
              key={lane}
              className="flex-1 border-x-4 border-white/30 relative bg-gray-700"
            >
              {/* Lane markings */}
              <div className="absolute inset-0 flex flex-col justify-around">
                {[...Array(10)].map((_, i) => (
                  // biome-ignore lint/suspicious/noArrayIndexKey: positional list
                  <div key={`item-${i}`} className="h-8 w-2 bg-white mx-auto" />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Player Car */}
        <div
          className="absolute bottom-16 transition-all duration-200"
          style={{
            left: `${16.67 + playerLane * 33.33}%`,
            transform: "translateX(-50%)",
          }}
        >
          <div className="text-5xl">🏎️</div>
        </div>

        {/* Obstacles */}
        {obstacles.map((obstacle) => (
          <div
            key={obstacle.id}
            className="absolute transition-all"
            style={{
              left: `${16.67 + obstacle.lane * 33.33}%`,
              top: `${obstacle.y}%`,
              transform: "translateX(-50%)",
            }}
          >
            <div className="text-4xl">🚗</div>
          </div>
        ))}

        {/* Instructions */}
        {obstacles.length === 0 && !gameOver && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <div className="bg-white p-8 rounded-lg border-4 border-blue-400 text-center">
              <h2 className="text-3xl font-bold mb-4">Race Time!</h2>
              <p className="text-lg mb-2">Use ← → arrows to change lanes</p>
              <p className="text-lg">Avoid other cars!</p>
            </div>
          </div>
        )}

        {/* Speed Display */}
        <div className="absolute top-4 right-4 bg-white px-4 py-2 rounded-lg border-3 border-blue-400">
          <span className="font-bold">Speed: {speed.toFixed(1)}x</span>
        </div>
      </div>
    </GameLayout>
  );
}
