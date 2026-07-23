import { useCallback, useEffect, useState } from "react";
import type { ModulePage } from "../../App";
import GameLayout from "../../components/GameLayout";

type Gadget = "grapple" | "gravity" | "drone" | "shield";

interface Enemy {
  id: number;
  x: number;
  y: number;
  stunned: boolean;
  captured: boolean;
}

interface GadgetCombatProps {
  onNavigate: (page: ModulePage) => void;
}

export default function GadgetCombat({ onNavigate }: GadgetCombatProps) {
  const [score, setScore] = useState(0);
  const [playerX, setPlayerX] = useState(50);
  const [playerY, setPlayerY] = useState(50);
  const [selectedGadget, setSelectedGadget] = useState<Gadget>("grapple");
  const [enemies, setEnemies] = useState<Enemy[]>([]);
  const [gameOver, setGameOver] = useState(false);
  const [highScore, setHighScore] = useState(0);
  const [nextId, setNextId] = useState(0);
  const [gadgetCooldown, setGadgetCooldown] = useState(0);
  const [activeEffect, setActiveEffect] = useState<{
    x: number;
    y: number;
    type: Gadget;
  } | null>(null);

  const gadgetEmojis: Record<Gadget, string> = {
    grapple: "🪝",
    gravity: "🌀",
    drone: "🤖",
    shield: "🛡️",
  };

  const startGame = () => {
    setScore(0);
    setPlayerX(50);
    setPlayerY(50);
    setSelectedGadget("grapple");
    setEnemies([]);
    setGameOver(false);
    setNextId(0);
    setGadgetCooldown(0);
    setActiveEffect(null);
  };

  useEffect(() => {
    if (gameOver) return;

    const spawnInterval = setInterval(() => {
      if (enemies.filter((e) => !e.captured).length < 6) {
        setEnemies((prev) => [
          ...prev,
          {
            id: nextId,
            x: Math.random() * 90 + 5,
            y: Math.random() * 90 + 5,
            stunned: false,
            captured: false,
          },
        ]);
        setNextId((id) => id + 1);
      }
    }, 3000);

    return () => clearInterval(spawnInterval);
  }, [gameOver, enemies, nextId]);

  useEffect(() => {
    if (gameOver) return;

    // Move enemies toward player
    const moveInterval = setInterval(() => {
      setEnemies((prev) =>
        prev.map((enemy) => {
          if (enemy.stunned || enemy.captured) return enemy;

          const dx = playerX - enemy.x;
          const dy = playerY - enemy.y;
          const distance = Math.sqrt(dx * dx + dy * dy);

          if (distance > 2) {
            return {
              ...enemy,
              x: enemy.x + (dx / distance) * 0.5,
              y: enemy.y + (dy / distance) * 0.5,
            };
          }
          return enemy;
        }),
      );
    }, 100);

    return () => clearInterval(moveInterval);
  }, [gameOver, playerX, playerY]);

  useEffect(() => {
    if (gadgetCooldown > 0) {
      const cooldownTimer = setTimeout(() => {
        setGadgetCooldown((prev) => prev - 1);
      }, 100);
      return () => clearTimeout(cooldownTimer);
    }
  }, [gadgetCooldown]);

  useEffect(() => {
    if (gameOver && score > highScore) {
      setHighScore(score);
    }
  }, [gameOver, score, highScore]);

  useEffect(() => {
    // Check if enemies touch player
    for (const enemy of enemies) {
      if (!enemy.stunned && !enemy.captured) {
        const distance = Math.sqrt(
          (playerX - enemy.x) ** 2 + (playerY - enemy.y) ** 2,
        );
        if (distance < 6) {
          setGameOver(true);
        }
      }
    }
  }, [playerX, playerY, enemies]);

  const activateGadget = (targetX: number, targetY: number) => {
    if (gadgetCooldown > 0) return;

    setActiveEffect({ x: targetX, y: targetY, type: selectedGadget });
    setTimeout(() => setActiveEffect(null), 500);

    if (selectedGadget === "grapple") {
      // Pull closest enemy
      const closest = enemies
        .filter((e) => !e.captured)
        .sort((a, b) => {
          const distA = Math.sqrt((targetX - a.x) ** 2 + (targetY - a.y) ** 2);
          const distB = Math.sqrt((targetX - b.x) ** 2 + (targetY - b.y) ** 2);
          return distA - distB;
        })[0];

      if (closest) {
        setEnemies((prev) =>
          prev.map((e) => (e.id === closest.id ? { ...e, stunned: true } : e)),
        );
        setTimeout(() => {
          setEnemies((prev) =>
            prev.map((e) =>
              e.id === closest.id ? { ...e, captured: true } : e,
            ),
          );
          setScore((prev) => prev + 50);
        }, 1000);
      }
      setGadgetCooldown(20);
    } else if (selectedGadget === "gravity") {
      // Stun enemies in area
      setEnemies((prev) =>
        prev.map((enemy) => {
          const distance = Math.sqrt(
            (targetX - enemy.x) ** 2 + (targetY - enemy.y) ** 2,
          );
          if (distance < 20 && !enemy.captured) {
            setTimeout(() => {
              setEnemies((p) =>
                p.map((e) =>
                  e.id === enemy.id ? { ...e, captured: true } : e,
                ),
              );
              setScore((s) => s + 30);
            }, 1500);
            return { ...enemy, stunned: true };
          }
          return enemy;
        }),
      );
      setGadgetCooldown(40);
    } else if (selectedGadget === "drone") {
      // Capture distant enemy
      const target = enemies
        .filter((e) => !e.captured)
        .sort((a, b) => {
          const distA = Math.sqrt((targetX - a.x) ** 2 + (targetY - a.y) ** 2);
          const distB = Math.sqrt((targetX - b.x) ** 2 + (targetY - b.y) ** 2);
          return distA - distB;
        })[0];

      if (target) {
        setEnemies((prev) =>
          prev.map((e) => (e.id === target.id ? { ...e, captured: true } : e)),
        );
        setScore((prev) => prev + 40);
      }
      setGadgetCooldown(30);
    } else if (selectedGadget === "shield") {
      // Temporary invincibility (visual only for now)
      setGadgetCooldown(50);
    }
  };

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    activateGadget(x, y);
  };

  const handleKeyPress = useCallback(
    (e: KeyboardEvent) => {
      if (gameOver) return;

      const speed = 2;
      if (e.key === "ArrowUp") setPlayerY((prev) => Math.max(5, prev - speed));
      else if (e.key === "ArrowDown")
        setPlayerY((prev) => Math.min(90, prev + speed));
      else if (e.key === "ArrowLeft")
        setPlayerX((prev) => Math.max(5, prev - speed));
      else if (e.key === "ArrowRight")
        setPlayerX((prev) => Math.min(90, prev + speed));
      else if (e.key === "1") setSelectedGadget("grapple");
      else if (e.key === "2") setSelectedGadget("gravity");
      else if (e.key === "3") setSelectedGadget("drone");
      else if (e.key === "4") setSelectedGadget("shield");
    },
    [gameOver],
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [handleKeyPress]);

  return (
    <GameLayout
      title="🔧 Gadget Combat"
      score={score}
      highScore={highScore}
      onRestart={startGame}
      onNavigate={onNavigate}
      gameOver={gameOver}
    >
      {/* biome-ignore lint/a11y/useKeyWithClickEvents: game canvas interaction */}
      <div
        className="relative w-full h-[600px] bg-gradient-to-br from-slate-700 via-slate-600 to-slate-800 overflow-hidden cursor-crosshair"
        onClick={handleClick}
      >
        {/* Instructions */}
        {enemies.length === 0 && (
          <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-white px-6 py-3 rounded-lg border-4 border-cyan-300 z-20 text-center max-w-md pointer-events-none">
            <p className="font-bold mb-2">
              Arrow keys to move, click to use gadgets!
            </p>
            <p className="text-sm">Capture enemies without touching them!</p>
          </div>
        )}

        {/* Gadget selector */}
        <div className="absolute bottom-4 left-4 bg-white p-3 rounded-lg border-4 border-cyan-300 z-20 pointer-events-auto">
          <div className="text-sm font-bold mb-2">Gadgets (1-4):</div>
          <div className="flex gap-2">
            {(["grapple", "gravity", "drone", "shield"] as Gadget[]).map(
              (gadget) => (
                <button
                  type="button"
                  key={gadget}
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedGadget(gadget);
                  }}
                  className={`px-3 py-2 rounded border-2 transition-all ${
                    selectedGadget === gadget
                      ? "border-cyan-600 bg-cyan-100 scale-110"
                      : "border-gray-300"
                  }`}
                >
                  <div className="text-3xl">{gadgetEmojis[gadget]}</div>
                  <div className="text-xs capitalize">{gadget}</div>
                </button>
              ),
            )}
          </div>
          {gadgetCooldown > 0 && (
            <div className="mt-2 text-xs text-center">
              Cooldown: {(gadgetCooldown / 10).toFixed(1)}s
            </div>
          )}
        </div>

        {/* Active effect */}
        {activeEffect && (
          <div
            className="absolute pointer-events-none z-15 -translate-x-1/2 -translate-y-1/2"
            style={{
              left: `${activeEffect.x}%`,
              top: `${activeEffect.y}%`,
            }}
          >
            <div className="text-6xl animate-ping">
              {gadgetEmojis[activeEffect.type]}
            </div>
          </div>
        )}

        {/* Player */}
        <div
          className="absolute transition-all duration-100 z-10 pointer-events-none -translate-x-1/2 -translate-y-1/2"
          style={{
            left: `${playerX}%`,
            top: `${playerY}%`,
          }}
        >
          <div className="text-5xl">🥷</div>
        </div>

        {/* Enemies */}
        {enemies.map((enemy) => {
          if (enemy.captured) return null;

          return (
            <div
              key={enemy.id}
              className={`absolute transition-all duration-200 pointer-events-none -translate-x-1/2 -translate-y-1/2 ${
                enemy.stunned ? "animate-pulse" : ""
              }`}
              style={{
                left: `${enemy.x}%`,
                top: `${enemy.y}%`,
              }}
            >
              <div className={`text-4xl ${enemy.stunned ? "opacity-50" : ""}`}>
                {enemy.stunned ? "😵" : "👾"}
              </div>
            </div>
          );
        })}

        {/* Captured count */}
        <div className="absolute bottom-4 right-4 bg-white px-4 py-2 rounded-lg border-3 border-green-400 z-20 pointer-events-none">
          <span className="font-bold">
            Captured: {enemies.filter((e) => e.captured).length}
          </span>
        </div>
      </div>
    </GameLayout>
  );
}
