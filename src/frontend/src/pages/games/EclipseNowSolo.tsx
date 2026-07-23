import { useCallback, useEffect, useRef, useState } from "react";
import type { ModulePage } from "../../App";
import GameLayout from "../../components/GameLayout";

interface EnergyOrb {
  id: number;
  x: number;
  y: number;
  collected: boolean;
}

interface Enemy {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  type: "chaser" | "shooter" | "patrol";
  health: number;
  lastShot?: number;
}

interface Projectile {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
}

interface AIHint {
  id: number;
  message: string;
  timestamp: number;
}

interface EclipseNowSoloProps {
  onNavigate: (page: ModulePage) => void;
}

export default function EclipseNowSolo({ onNavigate }: EclipseNowSoloProps) {
  const [score, setScore] = useState(0);
  const [shipX, setShipX] = useState(50);
  const [shipY, setShipY] = useState(50);
  const [health, setHealth] = useState(100);
  const [energyOrbs, setEnergyOrbs] = useState<EnergyOrb[]>([]);
  const [enemies, setEnemies] = useState<Enemy[]>([]);
  const [projectiles, setProjectiles] = useState<Projectile[]>([]);
  const [gameOver, setGameOver] = useState(false);
  const [gameStarted, setGameStarted] = useState(false);
  const [nextOrbId, setNextOrbId] = useState(0);
  const [nextEnemyId, setNextEnemyId] = useState(0);
  const [nextProjectileId, setNextProjectileId] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [aiHints, setAiHints] = useState<AIHint[]>([]);
  const [nextHintId, setNextHintId] = useState(0);
  const [difficultyLevel, setDifficultyLevel] = useState(1);
  const [playerPerformance, setPlayerPerformance] = useState({
    orbsCollected: 0,
    enemiesAvoided: 0,
    damagesTaken: 0,
    survivalTime: 0,
  });
  const [eclipseLighting, setEclipseLighting] = useState(0);

  const animationFrameRef = useRef<number | null>(null);
  const lastTimeRef = useRef<number>(0);
  const gameStartTimeRef = useRef<number>(0);

  const addAIHint = useCallback(
    (message: string) => {
      setAiHints((prev) => [
        ...prev,
        {
          id: nextHintId,
          message,
          timestamp: Date.now(),
        },
      ]);
      setNextHintId((id) => id + 1);

      // Remove hint after 5 seconds
      setTimeout(() => {
        setAiHints((prev) => prev.filter((h) => h.id !== nextHintId));
      }, 5000);
    },
    [nextHintId],
  );

  const spawnEnemy = useCallback(
    (type: "chaser" | "shooter" | "patrol") => {
      const side = Math.floor(Math.random() * 4);
      let x: number;
      let y: number;
      let vx: number;
      let vy: number;

      if (side === 0) {
        // Top
        x = Math.random() * 100;
        y = -5;
        vx = (Math.random() - 0.5) * 2;
        vy = Math.random() * 1.5 + 0.5;
      } else if (side === 1) {
        // Right
        x = 105;
        y = Math.random() * 100;
        vx = -(Math.random() * 1.5 + 0.5);
        vy = (Math.random() - 0.5) * 2;
      } else if (side === 2) {
        // Bottom
        x = Math.random() * 100;
        y = 105;
        vx = (Math.random() - 0.5) * 2;
        vy = -(Math.random() * 1.5 + 0.5);
      } else {
        // Left
        x = -5;
        y = Math.random() * 100;
        vx = Math.random() * 1.5 + 0.5;
        vy = (Math.random() - 0.5) * 2;
      }

      setEnemies((prev) => [
        ...prev,
        {
          id: nextEnemyId,
          x,
          y,
          vx,
          vy,
          type,
          health: 1,
          lastShot: Date.now(),
        },
      ]);
      setNextEnemyId((id) => id + 1);
    },
    [nextEnemyId],
  );

  const startGame = () => {
    setScore(0);
    setShipX(50);
    setShipY(50);
    setHealth(100);
    setEnergyOrbs([]);
    setEnemies([]);
    setProjectiles([]);
    setGameOver(false);
    setGameStarted(true);
    setNextOrbId(0);
    setNextEnemyId(0);
    setNextProjectileId(0);
    setAiHints([]);
    setNextHintId(0);
    setDifficultyLevel(1);
    setPlayerPerformance({
      orbsCollected: 0,
      enemiesAvoided: 0,
      damagesTaken: 0,
      survivalTime: 0,
    });
    setEclipseLighting(0);
    gameStartTimeRef.current = Date.now();

    // Spawn initial enemies immediately
    setTimeout(() => spawnEnemy("chaser"), 100);
    setTimeout(() => spawnEnemy("patrol"), 500);
    setTimeout(() => spawnEnemy("shooter"), 1000);

    // Initial AI hint
    setTimeout(() => {
      addAIHint("Core intelligence online. Analyzing your capabilities...");
    }, 1500);
  };

  // Dynamic eclipse lighting effect
  useEffect(() => {
    if (!gameStarted || gameOver) return;

    const interval = setInterval(() => {
      setEclipseLighting((prev) => (prev + 0.02) % (Math.PI * 2));
    }, 100);

    return () => clearInterval(interval);
  }, [gameStarted, gameOver]);

  // Spawn energy orbs and enemies
  useEffect(() => {
    if (!gameStarted || gameOver) return;

    const spawnInterval = setInterval(
      () => {
        // Spawn energy orb
        if (energyOrbs.filter((o) => !o.collected).length < 3) {
          setEnergyOrbs((prev) => [
            ...prev,
            {
              id: nextOrbId,
              x: Math.random() * 90 + 5,
              y: Math.random() * 90 + 5,
              collected: false,
            },
          ]);
          setNextOrbId((id) => id + 1);
        }

        // Spawn enemies based on difficulty
        const maxEnemies = Math.min(3 + difficultyLevel, 8);
        if (enemies.length < maxEnemies) {
          const types: Array<"chaser" | "shooter" | "patrol"> = [
            "chaser",
            "shooter",
            "patrol",
          ];
          const type = types[Math.floor(Math.random() * types.length)];
          spawnEnemy(type);
        }
      },
      Math.max(3000 - difficultyLevel * 150, 1200),
    );

    return () => clearInterval(spawnInterval);
  }, [
    gameStarted,
    gameOver,
    energyOrbs,
    enemies,
    nextOrbId,
    difficultyLevel,
    spawnEnemy,
  ]);

  // AI adaptive difficulty and hints
  useEffect(() => {
    if (!gameStarted || gameOver) return;

    const aiInterval = setInterval(() => {
      const survivalTime = Math.floor(
        (Date.now() - gameStartTimeRef.current) / 1000,
      );
      setPlayerPerformance((prev) => ({ ...prev, survivalTime }));

      // Analyze player performance
      const efficiency =
        playerPerformance.orbsCollected / Math.max(survivalTime, 1);
      const damageRate =
        playerPerformance.damagesTaken / Math.max(survivalTime, 1);

      // Adjust difficulty based on performance
      if (efficiency > 0.5 && damageRate < 0.1 && difficultyLevel < 5) {
        setDifficultyLevel((prev) => prev + 1);
        addAIHint("Impressive adaptation. Increasing challenge parameters.");
      } else if (efficiency < 0.2 && damageRate > 0.3 && difficultyLevel > 1) {
        setDifficultyLevel((prev) => prev - 1);
        addAIHint("Recalibrating difficulty. Focus on survival.");
      }

      // Provide contextual hints
      if (survivalTime % 15 === 0) {
        const hints = [
          "Energy signatures detected. Prioritize collection for optimal performance.",
          "Enemy patterns evolving. Observe and adapt your strategy.",
          "Your movement efficiency is being monitored. Precision matters.",
          "Resource management is key to prolonged survival.",
          "Hostile entities are learning your patterns. Vary your approach.",
        ];
        addAIHint(hints[Math.floor(Math.random() * hints.length)]);
      }
    }, 3000);

    return () => clearInterval(aiInterval);
  }, [gameStarted, gameOver, playerPerformance, difficultyLevel, addAIHint]);

  // Game loop with requestAnimationFrame
  useEffect(() => {
    if (!gameStarted || gameOver) return;

    const gameLoop = (timestamp: number) => {
      if (!lastTimeRef.current) lastTimeRef.current = timestamp;
      const deltaTime = (timestamp - lastTimeRef.current) / 16.67; // Normalize to 60fps
      lastTimeRef.current = timestamp;

      // Update enemies
      setEnemies((prev) => {
        const updated = prev.map((enemy) => {
          let newVx = enemy.vx;
          let newVy = enemy.vy;

          // AI behavior based on type
          if (enemy.type === "chaser") {
            // Chase player with adaptive speed
            const dx = shipX - enemy.x;
            const dy = shipY - enemy.y;
            const distance = Math.sqrt(dx * dx + dy * dy);
            const speed = 0.4 + difficultyLevel * 0.1;
            newVx = (dx / distance) * speed;
            newVy = (dy / distance) * speed;
          } else if (enemy.type === "patrol") {
            // Patrol with occasional direction changes
            if (Math.random() < 0.02) {
              newVx = (Math.random() - 0.5) * 2;
              newVy = (Math.random() - 0.5) * 2;
            }
          }

          return {
            ...enemy,
            x: enemy.x + newVx * deltaTime,
            y: enemy.y + newVy * deltaTime,
            vx: newVx,
            vy: newVy,
          };
        });

        // Check collision with ship
        for (const enemy of updated) {
          const distance = Math.sqrt(
            (shipX - enemy.x) ** 2 + (shipY - enemy.y) ** 2,
          );
          if (distance < 6) {
            setHealth((h) => {
              const newHealth = Math.max(0, h - 10);
              if (newHealth === 0) {
                setGameOver(true);
                addAIHint(
                  "Test concluded. Your performance has been recorded.",
                );
              }
              return newHealth;
            });
            setPlayerPerformance((prev) => ({
              ...prev,
              damagesTaken: prev.damagesTaken + 1,
            }));
          }
        }

        return updated.filter(
          (enemy) =>
            enemy.x > -10 && enemy.x < 110 && enemy.y > -10 && enemy.y < 110,
        );
      });

      // Shooter enemies fire projectiles
      setEnemies((prev) => {
        for (const enemy of prev) {
          if (enemy.type === "shooter") {
            const now = Date.now();
            if (
              now - (enemy.lastShot || 0) >
              Math.max(2000 - difficultyLevel * 200, 1000)
            ) {
              const dx = shipX - enemy.x;
              const dy = shipY - enemy.y;
              const distance = Math.sqrt(dx * dx + dy * dy);
              const speed = 2;

              setProjectiles((proj) => [
                ...proj,
                {
                  id: nextProjectileId,
                  x: enemy.x,
                  y: enemy.y,
                  vx: (dx / distance) * speed,
                  vy: (dy / distance) * speed,
                },
              ]);
              setNextProjectileId((id) => id + 1);
              enemy.lastShot = now;
            }
          }
        }
        return prev;
      });

      // Update projectiles
      setProjectiles((prev) => {
        const updated = prev.map((proj) => ({
          ...proj,
          x: proj.x + proj.vx * deltaTime,
          y: proj.y + proj.vy * deltaTime,
        }));

        // Check collision with ship
        for (const proj of updated) {
          const distance = Math.sqrt(
            (shipX - proj.x) ** 2 + (shipY - proj.y) ** 2,
          );
          if (distance < 5) {
            setHealth((h) => {
              const newHealth = Math.max(0, h - 5);
              if (newHealth === 0) {
                setGameOver(true);
                addAIHint(
                  "Test concluded. Your performance has been recorded.",
                );
              }
              return newHealth;
            });
            setPlayerPerformance((prev) => ({
              ...prev,
              damagesTaken: prev.damagesTaken + 1,
            }));
          }
        }

        return updated.filter(
          (proj) =>
            proj.x > -10 && proj.x < 110 && proj.y > -10 && proj.y < 110,
        );
      });

      animationFrameRef.current = requestAnimationFrame(gameLoop);
    };

    animationFrameRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [
    gameStarted,
    gameOver,
    shipX,
    shipY,
    difficultyLevel,
    nextProjectileId,
    addAIHint,
  ]);

  useEffect(() => {
    if (gameOver && score > highScore) {
      setHighScore(score);
    }
  }, [gameOver, score, highScore]);

  const handleKeyPress = useCallback(
    (e: KeyboardEvent) => {
      if (!gameStarted || gameOver) return;

      const speed = 2.5;
      if (e.key === "ArrowUp") {
        setShipY((prev) => Math.max(5, prev - speed));
      } else if (e.key === "ArrowDown") {
        setShipY((prev) => Math.min(90, prev + speed));
      } else if (e.key === "ArrowLeft") {
        setShipX((prev) => Math.max(5, prev - speed));
      } else if (e.key === "ArrowRight") {
        setShipX((prev) => Math.min(90, prev + speed));
      }
    },
    [gameStarted, gameOver],
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [handleKeyPress]);

  useEffect(() => {
    if (!gameStarted || gameOver) return;

    // Check for energy orb collection
    for (const orb of energyOrbs) {
      if (!orb.collected) {
        const distance = Math.sqrt((shipX - orb.x) ** 2 + (shipY - orb.y) ** 2);
        if (distance < 8) {
          setEnergyOrbs((prev) =>
            prev.map((o) => (o.id === orb.id ? { ...o, collected: true } : o)),
          );
          setScore((prev) => prev + 10);
          setPlayerPerformance((prev) => ({
            ...prev,
            orbsCollected: prev.orbsCollected + 1,
          }));
        }
      }
    }
  }, [shipX, shipY, energyOrbs, gameStarted, gameOver]);

  const eclipseIntensity = Math.abs(Math.sin(eclipseLighting));

  return (
    <GameLayout
      title="🌌 Eclipse Now Solo"
      score={score}
      highScore={highScore}
      onRestart={startGame}
      onNavigate={onNavigate}
      gameOver={gameOver}
      touchControls={true}
    >
      <div className="relative w-full h-[600px] bg-gradient-to-br from-indigo-900 via-purple-900 to-black overflow-hidden">
        {/* Dynamic eclipse lighting overlay */}
        <div
          className="absolute inset-0 pointer-events-none transition-opacity duration-300"
          style={{
            background: `radial-gradient(circle at 50% 50%, rgba(255, 140, 0, ${eclipseIntensity * 0.3}), transparent 60%)`,
          }}
        />

        {/* Stars background */}
        <div className="absolute inset-0">
          {[...Array(50)].map((_, i) => (
            <div
              // biome-ignore lint/suspicious/noArrayIndexKey: positional list
              key={i}
              className="absolute w-1 h-1 bg-white rounded-full animate-pulse"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                opacity: Math.random() * 0.8 + 0.2,
                animationDelay: `${Math.random() * 2}s`,
              }}
            />
          ))}
        </div>

        {/* Instructions */}
        {!gameStarted && !gameOver && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <div className="bg-gradient-to-br from-purple-900/90 to-indigo-900/90 p-8 rounded-lg border-4 border-neon-cyan text-center shadow-neon-lg">
              <h2 className="text-3xl font-bold mb-4 text-neon-cyan">
                Core Intelligence Test
              </h2>
              <p className="text-lg mb-2 text-white">
                Use arrow keys to navigate
              </p>
              <p className="text-lg mb-2 text-white">
                Collect energy ⚡ and survive hostile entities
              </p>
              <p className="text-sm text-neon-pink mt-4">
                The core intelligence will observe and adapt to your actions
              </p>
              <button
                type="button"
                onClick={startGame}
                className="mt-6 px-8 py-3 bg-neon-cyan text-black font-bold rounded-lg hover:bg-neon-pink transition-colors shadow-neon-md"
              >
                Begin Test
              </button>
            </div>
          </div>
        )}

        {/* Health bar */}
        {gameStarted && !gameOver && (
          <div className="absolute top-4 left-4 z-20">
            <div className="bg-black/50 p-2 rounded-lg border-2 border-neon-cyan">
              <div className="text-white text-sm mb-1">Hull Integrity</div>
              <div className="w-48 h-4 bg-gray-800 rounded-full overflow-hidden border border-neon-cyan">
                <div
                  className="h-full transition-all duration-300"
                  style={{
                    width: `${health}%`,
                    background:
                      health > 50
                        ? "linear-gradient(90deg, #00ff88, #00ffff)"
                        : health > 25
                          ? "linear-gradient(90deg, #ffaa00, #ff6600)"
                          : "linear-gradient(90deg, #ff0066, #ff0000)",
                  }}
                />
              </div>
            </div>
          </div>
        )}

        {/* Difficulty indicator */}
        {gameStarted && !gameOver && (
          <div className="absolute top-4 right-4 z-20">
            <div className="bg-black/50 p-2 rounded-lg border-2 border-neon-pink">
              <div className="text-white text-sm">
                Threat Level: {difficultyLevel}
              </div>
            </div>
          </div>
        )}

        {/* AI Hints */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 z-20 w-full max-w-2xl px-4">
          {aiHints.slice(-1).map((hint) => (
            <div
              key={hint.id}
              className="bg-gradient-to-r from-purple-900/90 to-indigo-900/90 p-3 rounded-lg border-2 border-neon-cyan text-center shadow-neon-lg animate-pulse"
            >
              <p className="text-neon-cyan text-sm font-bold">
                ⚡ Core Intelligence ⚡
              </p>
              <p className="text-white text-sm mt-1">{hint.message}</p>
            </div>
          ))}
        </div>

        {/* Spaceship */}
        {gameStarted && (
          <div
            className="absolute transition-all duration-100 z-10"
            style={{
              left: `${shipX}%`,
              top: `${shipY}%`,
              transform: "translate(-50%, -50%)",
              filter: "drop-shadow(0 0 8px rgba(0, 255, 255, 0.8))",
            }}
          >
            <div className="text-5xl">🚀</div>
          </div>
        )}

        {/* Energy Orbs */}
        {energyOrbs.map(
          (orb) =>
            !orb.collected && (
              <div
                key={orb.id}
                className="absolute animate-pulse"
                style={{
                  left: `${orb.x}%`,
                  top: `${orb.y}%`,
                  transform: "translate(-50%, -50%)",
                  filter: "drop-shadow(0 0 10px rgba(255, 255, 0, 0.9))",
                }}
              >
                <div className="text-4xl">⚡</div>
              </div>
            ),
        )}

        {/* Enemies */}
        {enemies.map((enemy) => (
          <div
            key={enemy.id}
            className="absolute"
            style={{
              left: `${enemy.x}%`,
              top: `${enemy.y}%`,
              transform: "translate(-50%, -50%)",
              filter:
                enemy.type === "chaser"
                  ? "drop-shadow(0 0 8px rgba(255, 0, 100, 0.8))"
                  : enemy.type === "shooter"
                    ? "drop-shadow(0 0 8px rgba(255, 100, 0, 0.8))"
                    : "drop-shadow(0 0 8px rgba(150, 0, 255, 0.8))",
            }}
          >
            <div className="text-3xl">
              {enemy.type === "chaser"
                ? "👾"
                : enemy.type === "shooter"
                  ? "🔴"
                  : "💠"}
            </div>
          </div>
        ))}

        {/* Projectiles */}
        {projectiles.map((proj) => (
          <div
            key={proj.id}
            className="absolute"
            style={{
              left: `${proj.x}%`,
              top: `${proj.y}%`,
              transform: "translate(-50%, -50%)",
            }}
          >
            <div className="w-2 h-2 bg-neon-orange rounded-full shadow-neon-sm" />
          </div>
        ))}
      </div>
    </GameLayout>
  );
}
