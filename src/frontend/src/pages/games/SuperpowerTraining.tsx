import { useCallback, useEffect, useRef, useState } from "react";
import type { ModulePage } from "../../App";
import GameLayout from "../../components/GameLayout";

type Power = "strength" | "speed" | "flight" | "shield";

interface Obstacle {
  id: number;
  x: number;
  y: number;
  type: "wall" | "target";
}

interface Enemy {
  id: number;
  x: number;
  y: number;
}

interface SuperpowerTrainingProps {
  onNavigate: (page: ModulePage) => void;
}

export default function SuperpowerTraining({
  onNavigate,
}: SuperpowerTrainingProps) {
  const [score, setScore] = useState(0);
  const [playerX, setPlayerX] = useState(20);
  const [playerY, setPlayerY] = useState(50);
  const [unlockedPowers, setUnlockedPowers] = useState<Power[]>(["strength"]);
  const [activePower, setActivePower] = useState<Power>("strength");
  const [level, setLevel] = useState(1);
  const [obstacles, setObstacles] = useState<Obstacle[]>([]);
  const [enemies, setEnemies] = useState<Enemy[]>([]);
  const [gameOver, setGameOver] = useState(false);
  const [highScore, setHighScore] = useState(0);

  // Refs to avoid stale closures in intervals
  const playerXRef = useRef(20);
  const playerYRef = useRef(50);
  const activePowerRef = useRef<Power>("strength");
  const gameOverRef = useRef(false);
  const enemyIdRef = useRef(1000);
  const obstacleIdRef = useRef(0);

  const powerEmojis: Record<Power, string> = {
    strength: "💪",
    speed: "⚡",
    flight: "🦅",
    shield: "🛡️",
  };

  // Keep refs in sync
  useEffect(() => {
    playerXRef.current = playerX;
  }, [playerX]);
  useEffect(() => {
    playerYRef.current = playerY;
  }, [playerY]);
  useEffect(() => {
    activePowerRef.current = activePower;
  }, [activePower]);
  useEffect(() => {
    gameOverRef.current = gameOver;
  }, [gameOver]);

  const startGame = () => {
    setScore(0);
    setPlayerX(20);
    setPlayerY(50);
    playerXRef.current = 20;
    playerYRef.current = 50;
    setUnlockedPowers(["strength"]);
    setActivePower("strength");
    activePowerRef.current = "strength";
    setLevel(1);
    setObstacles([]);
    setEnemies([]);
    setGameOver(false);
    gameOverRef.current = false;
    enemyIdRef.current = 1000;
    obstacleIdRef.current = 0;
  };

  // ── Spawn obstacles (walls + targets) every 2 s ──────────────────────────────
  useEffect(() => {
    if (gameOver) return;
    const id = setInterval(() => {
      if (gameOverRef.current) return;
      const types: Array<"wall" | "target"> = ["wall", "target"];
      setObstacles((prev) => {
        if (prev.length >= 4) return prev;
        return [
          ...prev,
          {
            id: obstacleIdRef.current++,
            x: 100,
            y: Math.random() * 75 + 10,
            type: types[Math.floor(Math.random() * types.length)],
          },
        ];
      });
    }, 2000);
    return () => clearInterval(id);
  }, [gameOver]);

  // ── Move obstacles left every 50 ms ─────────────────────────────────────────
  useEffect(() => {
    if (gameOver) return;
    const id = setInterval(() => {
      setObstacles((prev) =>
        prev.map((o) => ({ ...o, x: o.x - 2 })).filter((o) => o.x > -10),
      );
    }, 50);
    return () => clearInterval(id);
  }, [gameOver]);

  // ── Spawn enemies every 2.5 s, max 4 ────────────────────────────────────────
  useEffect(() => {
    if (gameOver) return;
    const id = setInterval(() => {
      if (gameOverRef.current) return;
      setEnemies((prev) => {
        if (prev.length >= 4) return prev;
        // Spawn from right or top/bottom edges for variety
        const edge =
          Math.random() < 0.7
            ? "right"
            : Math.random() < 0.5
              ? "top"
              : "bottom";
        let x = 102;
        let y = Math.random() * 75 + 10;
        if (edge === "top") {
          x = Math.random() * 80 + 10;
          y = -5;
        }
        if (edge === "bottom") {
          x = Math.random() * 80 + 10;
          y = 105;
        }
        return [...prev, { id: enemyIdRef.current++, x, y }];
      });
    }, 2500);
    return () => clearInterval(id);
  }, [gameOver]);

  // ── Chase player at medium speed (independent of player state) ───────────────
  useEffect(() => {
    if (gameOver) return;
    const id = setInterval(() => {
      if (gameOverRef.current) return;
      const px = playerXRef.current;
      const py = playerYRef.current;
      setEnemies((prev) =>
        prev
          .map((enemy) => {
            const dx = px - enemy.x;
            const dy = py - enemy.y;
            const dist = Math.sqrt(dx * dx + dy * dy) || 1;
            const speed = 1.2; // medium speed
            return {
              ...enemy,
              x: enemy.x + (dx / dist) * speed,
              y: enemy.y + (dy / dist) * speed,
            };
          })
          .filter((e) => e.x > -15 && e.x < 115 && e.y > -15 && e.y < 115),
      );
    }, 50);
    return () => clearInterval(id);
  }, [gameOver]);

  // ── Collision: obstacles ─────────────────────────────────────────────────────
  useEffect(() => {
    if (gameOver) return;
    for (const obstacle of obstacles) {
      const dist = Math.sqrt(
        (playerX - obstacle.x) ** 2 + (playerY - obstacle.y) ** 2,
      );
      if (dist < 8) {
        if (obstacle.type === "target") {
          setObstacles((prev) => prev.filter((o) => o.id !== obstacle.id));
          setScore((prev) => prev + 20);
        } else if (obstacle.type === "wall" && activePower !== "flight") {
          setGameOver(true);
          gameOverRef.current = true;
        }
      }
    }
  }, [playerX, playerY, obstacles, activePower, gameOver]);

  // ── Collision: enemies ───────────────────────────────────────────────────────
  useEffect(() => {
    if (gameOver) return;
    for (const enemy of enemies) {
      const dist = Math.sqrt(
        (playerX - enemy.x) ** 2 + (playerY - enemy.y) ** 2,
      );
      if (dist < 7) {
        if (activePower === "shield" || activePower === "strength") {
          setEnemies((prev) => prev.filter((e) => e.id !== enemy.id));
          setScore((prev) => prev + (activePower === "strength" ? 15 : 10));
        } else {
          setGameOver(true);
          gameOverRef.current = true;
        }
      }
    }
  }, [playerX, playerY, enemies, activePower, gameOver]);

  // ── Unlock powers + level up ─────────────────────────────────────────────────
  useEffect(() => {
    if (score >= 100)
      setUnlockedPowers((prev) =>
        prev.includes("speed") ? prev : [...prev, "speed"],
      );
    if (score >= 200)
      setUnlockedPowers((prev) =>
        prev.includes("flight") ? prev : [...prev, "flight"],
      );
    if (score >= 300)
      setUnlockedPowers((prev) =>
        prev.includes("shield") ? prev : [...prev, "shield"],
      );
    setLevel(Math.floor(score / 100) + 1);
  }, [score]);

  useEffect(() => {
    if (gameOver && score > highScore) setHighScore(score);
  }, [gameOver, score, highScore]);

  // ── Keyboard controls ────────────────────────────────────────────────────────
  const handleKeyPress = useCallback((e: KeyboardEvent) => {
    if (gameOverRef.current) return;
    const speed = activePowerRef.current === "speed" ? 5 : 3;
    if (e.key === "ArrowUp") {
      setPlayerY((p) => Math.max(5, p - speed));
      playerYRef.current = Math.max(5, playerYRef.current - speed);
    }
    if (e.key === "ArrowDown") {
      setPlayerY((p) => Math.min(90, p + speed));
      playerYRef.current = Math.min(90, playerYRef.current + speed);
    }
    if (e.key === "ArrowLeft") {
      setPlayerX((p) => Math.max(5, p - speed));
      playerXRef.current = Math.max(5, playerXRef.current - speed);
    }
    if (e.key === "ArrowRight") {
      setPlayerX((p) => Math.min(90, p + speed));
      playerXRef.current = Math.min(90, playerXRef.current + speed);
    }
    if (e.key === "1") {
      setActivePower("strength");
      activePowerRef.current = "strength";
    }
    if (e.key === "2") {
      setActivePower("speed");
      activePowerRef.current = "speed";
    }
    if (e.key === "3") {
      setActivePower("flight");
      activePowerRef.current = "flight";
    }
    if (e.key === "4") {
      setActivePower("shield");
      activePowerRef.current = "shield";
    }
  }, []);

  useEffect(() => {
    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [handleKeyPress]);

  return (
    <GameLayout
      title="🦸 Superpower Training"
      score={score}
      highScore={highScore}
      onRestart={startGame}
      onNavigate={onNavigate}
      gameOver={gameOver}
    >
      <div className="relative w-full h-[600px] bg-gradient-to-br from-orange-200 via-red-200 to-purple-200 overflow-hidden">
        {/* Level indicator */}
        <div className="absolute top-4 left-4 bg-white px-4 py-2 rounded-lg border-2 border-orange-400 z-20 text-sm font-bold">
          Level {level}
        </div>

        {/* Enemy count indicator */}
        <div className="absolute top-4 right-4 bg-white px-3 py-2 rounded-lg border-2 border-red-400 z-20 text-sm font-bold text-red-600">
          👾 {enemies.length} attacking!
        </div>

        {/* Instructions */}
        {obstacles.length === 0 && enemies.length === 0 && (
          <div className="absolute top-16 left-1/2 transform -translate-x-1/2 bg-white px-6 py-3 rounded-lg border-4 border-purple-300 z-20 text-center max-w-sm">
            <p className="font-bold mb-1">Train your superpowers!</p>
            <p className="text-xs text-gray-600">
              Arrow keys to move • 1–4 to switch power
            </p>
            <p className="text-xs mt-1">
              💪 Strength &amp; 🛡️ Shield beat enemies 👾
            </p>
            <p className="text-xs">
              🦅 Flight clears walls • 🎯 Collect targets
            </p>
          </div>
        )}

        {/* Power selector */}
        <div className="absolute bottom-4 left-4 bg-white p-3 rounded-lg border-4 border-purple-300 z-20">
          <div className="text-xs font-bold mb-2">Powers (1-4):</div>
          <div className="flex gap-2">
            {(["strength", "speed", "flight", "shield"] as Power[]).map(
              (power, idx) => (
                <button
                  type="button"
                  key={power}
                  onClick={() => {
                    if (unlockedPowers.includes(power)) {
                      setActivePower(power);
                      activePowerRef.current = power;
                    }
                  }}
                  disabled={!unlockedPowers.includes(power)}
                  className={`px-3 py-2 rounded border-2 transition-all ${
                    activePower === power
                      ? "border-purple-600 bg-purple-100 scale-110"
                      : "border-gray-300"
                  } disabled:opacity-30 disabled:cursor-not-allowed`}
                  title={`${power} (${idx + 1})`}
                >
                  <div className="text-2xl">{powerEmojis[power]}</div>
                  {!unlockedPowers.includes(power) && (
                    <div className="text-xs text-center">🔒</div>
                  )}
                </button>
              ),
            )}
          </div>
        </div>

        {/* Player */}
        <div
          className="absolute z-10"
          style={{
            left: `${playerX}%`,
            top: `${playerY}%`,
            transform: "translate(-50%, -50%)",
          }}
        >
          <div className="text-5xl">🦸</div>
          <div className="text-xl absolute -top-1 -right-1">
            {powerEmojis[activePower]}
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
            <div className="text-4xl">
              {obstacle.type === "wall" ? "🧱" : "🎯"}
            </div>
          </div>
        ))}

        {/* Enemies — chase the player */}
        {enemies.map((enemy) => (
          <div
            key={enemy.id}
            className="absolute"
            style={{
              left: `${enemy.x}%`,
              top: `${enemy.y}%`,
              transform: "translate(-50%, -50%)",
            }}
          >
            <div className="text-4xl animate-pulse">👾</div>
          </div>
        ))}

        {/* Unlock toasts */}
        {score >= 100 && score < 115 && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-yellow-400 px-8 py-4 rounded-lg border-4 border-yellow-600 z-30 animate-bounce text-center">
            <div className="text-xl font-bold">⚡ Speed Unlocked!</div>
          </div>
        )}
        {score >= 200 && score < 215 && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-blue-400 px-8 py-4 rounded-lg border-4 border-blue-600 z-30 animate-bounce text-center">
            <div className="text-xl font-bold">🦅 Flight Unlocked!</div>
          </div>
        )}
        {score >= 300 && score < 315 && (
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-green-400 px-8 py-4 rounded-lg border-4 border-green-600 z-30 animate-bounce text-center">
            <div className="text-xl font-bold">🛡️ Shield Unlocked!</div>
          </div>
        )}
      </div>
    </GameLayout>
  );
}
