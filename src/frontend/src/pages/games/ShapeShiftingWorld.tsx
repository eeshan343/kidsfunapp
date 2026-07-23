import { useCallback, useEffect, useState } from "react";
import type { ModulePage } from "../../App";
import GameLayout from "../../components/GameLayout";

type ShapeForm = "human" | "bird" | "fish" | "mouse";

interface Obstacle {
  id: number;
  x: number;
  y: number;
  type: "wall" | "water" | "hole" | "air";
}

interface Collectible {
  id: number;
  x: number;
  y: number;
  collected: boolean;
}

interface ShapeShiftingWorldProps {
  onNavigate: (page: ModulePage) => void;
}

export default function ShapeShiftingWorld({
  onNavigate,
}: ShapeShiftingWorldProps) {
  const [score, setScore] = useState(0);
  const [playerX, setPlayerX] = useState(10);
  const [playerY, setPlayerY] = useState(50);
  const [currentForm, setCurrentForm] = useState<ShapeForm>("human");
  const [collectibles, setCollectibles] = useState<Collectible[]>([]);
  const [gameOver, setGameOver] = useState(false);
  const [level, setLevel] = useState(1);
  const [highScore, setHighScore] = useState(0);

  const obstacles: Obstacle[] = [
    { id: 1, x: 30, y: 40, type: "wall" },
    { id: 2, x: 50, y: 60, type: "water" },
    { id: 3, x: 70, y: 30, type: "hole" },
    { id: 4, x: 40, y: 20, type: "air" },
  ];

  const formEmojis: Record<ShapeForm, string> = {
    human: "🧑",
    bird: "🦅",
    fish: "🐟",
    mouse: "🐭",
  };

  const startGame = () => {
    setScore(0);
    setPlayerX(10);
    setPlayerY(50);
    setCurrentForm("human");
    setGameOver(false);
    setLevel(1);

    const newCollectibles: Collectible[] = [];
    for (let i = 0; i < 8; i++) {
      newCollectibles.push({
        id: i,
        x: Math.random() * 80 + 10,
        y: Math.random() * 80 + 10,
        collected: false,
      });
    }
    setCollectibles(newCollectibles);
  };

  useEffect(() => {
    if (gameOver) return;

    const collectedCount = collectibles.filter((c) => c.collected).length;
    if (collectedCount === collectibles.length && collectibles.length > 0) {
      setLevel((prev) => prev + 1);
      setScore((prev) => prev + 100);

      const newCollectibles: Collectible[] = [];
      for (let i = 0; i < 8 + level; i++) {
        newCollectibles.push({
          id: i,
          x: Math.random() * 80 + 10,
          y: Math.random() * 80 + 10,
          collected: false,
        });
      }
      setCollectibles(newCollectibles);
    }
  }, [collectibles, gameOver, level]);

  useEffect(() => {
    if (gameOver && score > highScore) {
      setHighScore(score);
    }
  }, [gameOver, score, highScore]);

  const canPassObstacle = (obstacle: Obstacle): boolean => {
    if (obstacle.type === "wall") return false;
    if (obstacle.type === "water") return currentForm === "fish";
    if (obstacle.type === "hole") return currentForm === "mouse";
    if (obstacle.type === "air") return currentForm === "bird";
    return true;
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: canPassObstacle closure is stable
  const handleKeyPress = useCallback(
    (e: KeyboardEvent) => {
      if (gameOver) return;

      const speed = 3;
      let newX = playerX;
      let newY = playerY;

      if (e.key === "ArrowUp") newY = Math.max(5, playerY - speed);
      else if (e.key === "ArrowDown") newY = Math.min(90, playerY + speed);
      else if (e.key === "ArrowLeft") newX = Math.max(5, playerX - speed);
      else if (e.key === "ArrowRight") newX = Math.min(90, playerX + speed);
      else if (e.key === "1") setCurrentForm("human");
      else if (e.key === "2") setCurrentForm("bird");
      else if (e.key === "3") setCurrentForm("fish");
      else if (e.key === "4") setCurrentForm("mouse");

      // Check collision with obstacles
      let blocked = false;
      for (const obstacle of obstacles) {
        const distance = Math.sqrt(
          (newX - obstacle.x) ** 2 + (newY - obstacle.y) ** 2,
        );
        if (distance < 8 && !canPassObstacle(obstacle)) {
          blocked = true;
        }
      }

      if (!blocked) {
        setPlayerX(newX);
        setPlayerY(newY);
      }
    },
    [gameOver, playerX, playerY, currentForm, obstacles],
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [handleKeyPress]);

  useEffect(() => {
    for (const item of collectibles) {
      if (!item.collected) {
        const distance = Math.sqrt(
          (playerX - item.x) ** 2 + (playerY - item.y) ** 2,
        );
        if (distance < 6) {
          setCollectibles((prev) =>
            prev.map((c) => (c.id === item.id ? { ...c, collected: true } : c)),
          );
          setScore((prev) => prev + 10);
        }
      }
    }
  }, [playerX, playerY, collectibles]);

  return (
    <GameLayout
      title="🔄 Shape-Shifting World"
      score={score}
      highScore={highScore}
      onRestart={startGame}
      onNavigate={onNavigate}
      gameOver={gameOver}
    >
      <div className="relative w-full h-[600px] bg-gradient-to-br from-purple-200 via-blue-200 to-green-200 overflow-hidden">
        {/* Instructions */}
        {level === 1 &&
          collectibles.filter((c) => c.collected).length === 0 && (
            <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-white px-6 py-3 rounded-lg border-4 border-purple-300 z-20 text-center max-w-md">
              <p className="font-bold mb-2">Arrow keys to move</p>
              <p className="text-sm">
                Press 1-4 to transform: 1=Human 2=Bird 3=Fish 4=Mouse
              </p>
            </div>
          )}

        {/* Level indicator */}
        <div className="absolute top-4 right-4 bg-white px-4 py-2 rounded-lg border-3 border-purple-400 z-20">
          <span className="font-bold">Level: {level}</span>
        </div>

        {/* Form selector */}
        <div className="absolute bottom-4 left-4 bg-white p-3 rounded-lg border-4 border-purple-300 z-20">
          <div className="flex gap-2">
            {(["human", "bird", "fish", "mouse"] as ShapeForm[]).map(
              (form, idx) => (
                <button
                  type="button"
                  key={form}
                  onClick={() => setCurrentForm(form)}
                  className={`text-3xl p-2 rounded border-2 transition-all ${
                    currentForm === form
                      ? "border-purple-600 bg-purple-100 scale-110"
                      : "border-gray-300"
                  }`}
                  title={`${form} (${idx + 1})`}
                >
                  {formEmojis[form]}
                </button>
              ),
            )}
          </div>
        </div>

        {/* Obstacles */}
        {obstacles.map((obstacle) => (
          <div
            key={obstacle.id}
            className="absolute"
            style={{
              left: `${obstacle.x}%`,
              top: `${obstacle.y}%`,
              transform: "translate(-50%, -50%)",
            }}
          >
            <div className="text-5xl">
              {obstacle.type === "wall" && "🧱"}
              {obstacle.type === "water" && "💧"}
              {obstacle.type === "hole" && "🕳️"}
              {obstacle.type === "air" && "☁️"}
            </div>
          </div>
        ))}

        {/* Player */}
        <div
          className="absolute transition-all duration-100 z-10"
          style={{
            left: `${playerX}%`,
            top: `${playerY}%`,
            transform: "translate(-50%, -50%)",
          }}
        >
          <div className="text-5xl">{formEmojis[currentForm]}</div>
        </div>

        {/* Collectibles */}
        {collectibles.map(
          (item) =>
            !item.collected && (
              <div
                key={item.id}
                className="absolute animate-pulse"
                style={{
                  left: `${item.x}%`,
                  top: `${item.y}%`,
                  transform: "translate(-50%, -50%)",
                }}
              >
                <div className="text-3xl">⭐</div>
              </div>
            ),
        )}

        {/* Progress */}
        <div className="absolute bottom-4 right-4 bg-white px-4 py-2 rounded-lg border-3 border-yellow-400 z-20">
          <span className="font-bold">
            Stars: {collectibles.filter((c) => c.collected).length}/
            {collectibles.length}
          </span>
        </div>
      </div>
    </GameLayout>
  );
}
