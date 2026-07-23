import { useCallback, useEffect, useRef, useState } from "react";
import type { ModulePage } from "../../App";
import GameLayout from "../../components/GameLayout";

type TimePower = "normal" | "slow" | "freeze" | "rewind";

interface Enemy {
  id: number;
  x: number;
  y: number;
  type: "chaser" | "shooter" | "patrol";
  speed: number;
  health: number;
}

interface Projectile {
  id: number;
  x: number;
  y: number;
  velocityX: number;
  velocityY: number;
}

interface Coin {
  id: number;
  x: number;
  y: number;
  collected: boolean;
}

interface TimeControlAdventureProps {
  onNavigate: (page: ModulePage) => void;
}

export default function TimeControlAdventure({
  onNavigate,
}: TimeControlAdventureProps) {
  const [score, setScore] = useState(0);
  const [playerX, setPlayerX] = useState(20);
  const [playerY, setPlayerY] = useState(50);
  const [playerHealth, setPlayerHealth] = useState(100);
  const [timePower, setTimePower] = useState<TimePower>("normal");
  const [powerCooldown, setPowerCooldown] = useState(0);
  const [enemies, setEnemies] = useState<Enemy[]>([]);
  const [projectiles, setProjectiles] = useState<Projectile[]>([]);
  const [coins, setCoins] = useState<Coin[]>([]);
  const [gameOver, setGameOver] = useState(false);
  const [highScore, setHighScore] = useState(0);
  const [nextId, setNextId] = useState(0);
  const [difficulty, setDifficulty] = useState(1);
  const [gameStarted, setGameStarted] = useState(false);
  const playerHistoryRef = useRef<Array<{ x: number; y: number }>>([]);
  const animationFrameRef = useRef<number | null>(null);
  const lastUpdateRef = useRef<number>(Date.now());
  const lastEnemySpawnRef = useRef<number>(Date.now());
  const lastCoinSpawnRef = useRef<number>(Date.now());
  const lastProjectileSpawnRef = useRef<number>(Date.now());

  const startGame = () => {
    setScore(0);
    setPlayerX(20);
    setPlayerY(50);
    setPlayerHealth(100);
    setTimePower("normal");
    setPowerCooldown(0);
    setEnemies([]);
    setProjectiles([]);
    setCoins([]);
    setGameOver(false);
    setNextId(0);
    setDifficulty(1);
    setGameStarted(true);
    playerHistoryRef.current = [];
    lastUpdateRef.current = Date.now();
    lastEnemySpawnRef.current = Date.now();
    lastCoinSpawnRef.current = Date.now();
    lastProjectileSpawnRef.current = Date.now();
  };

  // Main game loop using requestAnimationFrame
  useEffect(() => {
    if (!gameStarted || gameOver) return;

    const gameLoop = () => {
      const now = Date.now();
      const deltaTime = (now - lastUpdateRef.current) / 1000;
      lastUpdateRef.current = now;

      const speedMultiplier =
        timePower === "slow" ? 0.3 : timePower === "freeze" ? 0 : 1;

      // Spawn enemies
      if (
        now - lastEnemySpawnRef.current > 2000 / difficulty &&
        enemies.length < 8
      ) {
        const enemyType: "chaser" | "shooter" | "patrol" =
          Math.random() < 0.5
            ? "chaser"
            : Math.random() < 0.7
              ? "shooter"
              : "patrol";

        const spawnSide = Math.random() < 0.5 ? "right" : "top";
        const newEnemy: Enemy = {
          id: nextId,
          x: spawnSide === "right" ? 95 : Math.random() * 80 + 10,
          y: spawnSide === "right" ? Math.random() * 80 + 10 : 5,
          type: enemyType,
          speed: 1 + difficulty * 0.3 + Math.random() * 0.5,
          health: 1,
        };

        setEnemies((prev) => [...prev, newEnemy]);
        setNextId((id) => id + 1);
        lastEnemySpawnRef.current = now;
      }

      // Spawn coins
      if (
        now - lastCoinSpawnRef.current > 3000 &&
        coins.filter((c) => !c.collected).length < 5
      ) {
        setCoins((prev) => [
          ...prev,
          {
            id: nextId + 10000,
            x: Math.random() * 70 + 15,
            y: Math.random() * 70 + 15,
            collected: false,
          },
        ]);
        setNextId((id) => id + 1);
        lastCoinSpawnRef.current = now;
      }

      // Spawn projectiles from shooter enemies
      if (
        now - lastProjectileSpawnRef.current > 1500 &&
        timePower !== "freeze"
      ) {
        setEnemies((prev) => {
          const shooters = prev.filter((e) => e.type === "shooter");
          if (shooters.length > 0) {
            const shooter =
              shooters[Math.floor(Math.random() * shooters.length)];
            const angle = Math.atan2(playerY - shooter.y, playerX - shooter.x);
            const projectileSpeed = 15;

            setProjectiles((p) => [
              ...p,
              {
                id: nextId + 20000,
                x: shooter.x,
                y: shooter.y,
                velocityX: Math.cos(angle) * projectileSpeed,
                velocityY: Math.sin(angle) * projectileSpeed,
              },
            ]);
            setNextId((id) => id + 1);
            lastProjectileSpawnRef.current = now;
          }
          return prev;
        });
      }

      // Update enemy positions
      setEnemies((prev) =>
        prev
          .map((enemy) => {
            let newX = enemy.x;
            let newY = enemy.y;

            if (enemy.type === "chaser") {
              // Chase the player
              const dx = playerX - enemy.x;
              const dy = playerY - enemy.y;
              const distance = Math.sqrt(dx * dx + dy * dy);

              if (distance > 0) {
                newX +=
                  (dx / distance) *
                  enemy.speed *
                  speedMultiplier *
                  deltaTime *
                  60;
                newY +=
                  (dy / distance) *
                  enemy.speed *
                  speedMultiplier *
                  deltaTime *
                  60;
              }
            } else if (enemy.type === "patrol") {
              // Patrol horizontally
              newX -= enemy.speed * speedMultiplier * deltaTime * 60;
              if (newX < 5) newX = 95;
            } else if (enemy.type === "shooter") {
              // Move slowly toward player but maintain distance
              const dx = playerX - enemy.x;
              const dy = playerY - enemy.y;
              const distance = Math.sqrt(dx * dx + dy * dy);

              if (distance > 30) {
                newX +=
                  (dx / distance) *
                  enemy.speed *
                  0.5 *
                  speedMultiplier *
                  deltaTime *
                  60;
                newY +=
                  (dy / distance) *
                  enemy.speed *
                  0.5 *
                  speedMultiplier *
                  deltaTime *
                  60;
              } else if (distance < 20) {
                newX -=
                  (dx / distance) *
                  enemy.speed *
                  0.3 *
                  speedMultiplier *
                  deltaTime *
                  60;
                newY -=
                  (dy / distance) *
                  enemy.speed *
                  0.3 *
                  speedMultiplier *
                  deltaTime *
                  60;
              }
            }

            return { ...enemy, x: newX, y: newY };
          })
          .filter((e) => e.x > -5 && e.x < 105 && e.y > -5 && e.y < 105),
      );

      // Update projectile positions
      setProjectiles((prev) =>
        prev
          .map((proj) => ({
            ...proj,
            x: proj.x + proj.velocityX * speedMultiplier * deltaTime,
            y: proj.y + proj.velocityY * speedMultiplier * deltaTime,
          }))
          .filter((p) => p.x > -10 && p.x < 110 && p.y > -10 && p.y < 110),
      );

      animationFrameRef.current = requestAnimationFrame(gameLoop);
    };

    animationFrameRef.current = requestAnimationFrame(gameLoop);

    return () => {
      if (animationFrameRef.current !== null) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [
    gameStarted,
    gameOver,
    timePower,
    playerX,
    playerY,
    enemies.length,
    coins,
    difficulty,
    nextId,
  ]);

  // Cooldown timer
  useEffect(() => {
    if (powerCooldown > 0) {
      const cooldownTimer = setTimeout(() => {
        setPowerCooldown((prev) => prev - 1);
      }, 100);
      return () => clearTimeout(cooldownTimer);
    }
  }, [powerCooldown]);

  // Update high score
  useEffect(() => {
    if (gameOver && score > highScore) {
      setHighScore(score);
    }
  }, [gameOver, score, highScore]);

  // Store player history for rewind
  useEffect(() => {
    if (!gameStarted || gameOver) return;

    playerHistoryRef.current.push({ x: playerX, y: playerY });
    if (playerHistoryRef.current.length > 50) {
      playerHistoryRef.current.shift();
    }
  }, [playerX, playerY, gameStarted, gameOver]);

  // Collision detection
  useEffect(() => {
    if (!gameStarted || gameOver) return;

    let healthLoss = 0;

    // Check collision with enemies
    for (const enemy of enemies) {
      const distance = Math.sqrt(
        (playerX - enemy.x) ** 2 + (playerY - enemy.y) ** 2,
      );
      if (distance < 6) {
        healthLoss += 20;
      }
    }

    // Check collision with projectiles
    for (const proj of projectiles) {
      const distance = Math.sqrt(
        (playerX - proj.x) ** 2 + (playerY - proj.y) ** 2,
      );
      if (distance < 4) {
        healthLoss += 10;
        setProjectiles((prev) => prev.filter((p) => p.id !== proj.id));
      }
    }

    if (healthLoss > 0) {
      setPlayerHealth((prev) => {
        const newHealth = Math.max(0, prev - healthLoss);
        if (newHealth <= 0) {
          setGameOver(true);
        }
        return newHealth;
      });
    }

    // Check coin collection
    for (const coin of coins) {
      if (!coin.collected) {
        const distance = Math.sqrt(
          (playerX - coin.x) ** 2 + (playerY - coin.y) ** 2,
        );
        if (distance < 5) {
          setCoins((prev) =>
            prev.map((c) => (c.id === coin.id ? { ...c, collected: true } : c)),
          );
          setScore((prev) => prev + 10);
        }
      }
    }
  }, [playerX, playerY, enemies, projectiles, coins, gameStarted, gameOver]);

  // Increase difficulty over time
  useEffect(() => {
    if (!gameStarted || gameOver) return;

    const difficultyInterval = setInterval(() => {
      setDifficulty((prev) => Math.min(prev + 0.1, 3));
    }, 10000);

    return () => clearInterval(difficultyInterval);
  }, [gameStarted, gameOver]);

  const activatePower = useCallback(
    (power: TimePower) => {
      if (powerCooldown > 0 || !gameStarted || gameOver) return;

      if (power === "rewind" && playerHistoryRef.current.length > 15) {
        const pastPosition =
          playerHistoryRef.current[
            Math.max(0, playerHistoryRef.current.length - 20)
          ];
        setPlayerX(pastPosition.x);
        setPlayerY(pastPosition.y);
        setPowerCooldown(60);
      } else if (power !== "normal") {
        setTimePower(power);
        setPowerCooldown(40);
        setTimeout(() => setTimePower("normal"), 3000);
      }
    },
    [powerCooldown, gameStarted, gameOver],
  );
  const handleKeyPress = useCallback(
    (e: KeyboardEvent) => {
      if (!gameStarted || gameOver) return;

      const speed = 2.5;
      if (e.key === "ArrowUp") setPlayerY((prev) => Math.max(5, prev - speed));
      else if (e.key === "ArrowDown")
        setPlayerY((prev) => Math.min(95, prev + speed));
      else if (e.key === "ArrowLeft")
        setPlayerX((prev) => Math.max(5, prev - speed));
      else if (e.key === "ArrowRight")
        setPlayerX((prev) => Math.min(95, prev + speed));
      else if (e.key === "1") activatePower("slow");
      else if (e.key === "2") activatePower("freeze");
      else if (e.key === "3") activatePower("rewind");
    },
    [gameStarted, gameOver, activatePower],
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [handleKeyPress]);

  const getEnemyEmoji = (type: string) => {
    switch (type) {
      case "chaser":
        return "👾";
      case "shooter":
        return "🔫";
      case "patrol":
        return "🤖";
      default:
        return "👾";
    }
  };

  return (
    <GameLayout
      title="⏰ Time-Control Adventure"
      score={score}
      highScore={highScore}
      onRestart={startGame}
      onNavigate={onNavigate}
      gameOver={gameOver}
    >
      <div className="relative w-full h-[600px] bg-gradient-to-br from-indigo-300 via-purple-300 to-pink-300 overflow-hidden rounded-lg border-4 border-purple-400">
        {/* Time effect overlay */}
        {timePower === "slow" && (
          <div className="absolute inset-0 bg-blue-500/20 animate-pulse pointer-events-none z-10" />
        )}
        {timePower === "freeze" && (
          <div className="absolute inset-0 bg-cyan-500/30 pointer-events-none z-10" />
        )}

        {/* Instructions */}
        {!gameStarted && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/50 z-30">
            <div className="bg-white px-8 py-6 rounded-lg border-4 border-purple-400 text-center max-w-lg">
              <h2 className="text-3xl font-bold mb-4 text-purple-600">
                ⏰ Time-Control Adventure
              </h2>
              <p className="font-bold mb-3 text-lg">
                Use arrow keys to move and avoid enemies!
              </p>
              <div className="text-left mb-4 space-y-2">
                <p className="text-sm">
                  <strong>👾 Chasers:</strong> Hunt you down relentlessly
                </p>
                <p className="text-sm">
                  <strong>🔫 Shooters:</strong> Fire projectiles from a distance
                </p>
                <p className="text-sm">
                  <strong>🤖 Patrols:</strong> Move in patterns across the field
                </p>
              </div>
              <div className="text-left mb-4 space-y-1">
                <p className="text-sm font-bold">Time Powers:</p>
                <p className="text-sm">
                  Press <kbd className="px-2 py-1 bg-gray-200 rounded">1</kbd> -
                  Slow Time 🐌
                </p>
                <p className="text-sm">
                  Press <kbd className="px-2 py-1 bg-gray-200 rounded">2</kbd> -
                  Freeze Time ❄️
                </p>
                <p className="text-sm">
                  Press <kbd className="px-2 py-1 bg-gray-200 rounded">3</kbd> -
                  Rewind Position ⏪
                </p>
              </div>
              <p className="text-sm mb-4">
                Collect coins 🪙 for points! Difficulty increases over time.
              </p>
              <button
                type="button"
                onClick={startGame}
                className="px-6 py-3 bg-purple-600 text-white rounded-lg font-bold hover:bg-purple-700 transition-colors"
              >
                Start Game
              </button>
            </div>
          </div>
        )}

        {/* Health bar */}
        {gameStarted && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-white px-4 py-2 rounded-lg border-4 border-purple-300 z-20">
            <div className="flex items-center gap-2">
              <span className="font-bold text-sm">Health:</span>
              <div className="w-48 h-4 bg-gray-300 rounded-full overflow-hidden">
                <div
                  className={`h-full transition-all duration-300 ${
                    playerHealth > 60
                      ? "bg-green-500"
                      : playerHealth > 30
                        ? "bg-yellow-500"
                        : "bg-red-500"
                  }`}
                  style={{ width: `${playerHealth}%` }}
                />
              </div>
              <span className="font-bold text-sm">{playerHealth}%</span>
            </div>
          </div>
        )}

        {/* Difficulty indicator */}
        {gameStarted && (
          <div className="absolute top-16 left-1/2 transform -translate-x-1/2 bg-white px-3 py-1 rounded-lg border-2 border-purple-300 z-20">
            <span className="text-xs font-bold">
              Difficulty: {difficulty.toFixed(1)}x
            </span>
          </div>
        )}

        {/* Power buttons */}
        {gameStarted && (
          <div className="absolute bottom-4 left-4 bg-white p-3 rounded-lg border-4 border-purple-300 z-20">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => activatePower("slow")}
                disabled={powerCooldown > 0}
                className={`px-3 py-2 rounded border-2 font-bold text-sm transition-colors ${
                  timePower === "slow"
                    ? "bg-blue-200 border-blue-600"
                    : "bg-white border-gray-300 hover:bg-gray-100"
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                🐌 Slow (1)
              </button>
              <button
                type="button"
                onClick={() => activatePower("freeze")}
                disabled={powerCooldown > 0}
                className={`px-3 py-2 rounded border-2 font-bold text-sm transition-colors ${
                  timePower === "freeze"
                    ? "bg-cyan-200 border-cyan-600"
                    : "bg-white border-gray-300 hover:bg-gray-100"
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                ❄️ Freeze (2)
              </button>
              <button
                type="button"
                onClick={() => activatePower("rewind")}
                disabled={powerCooldown > 0}
                className="px-3 py-2 rounded border-2 border-gray-300 bg-white hover:bg-gray-100 font-bold text-sm disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                ⏪ Rewind (3)
              </button>
            </div>
            {powerCooldown > 0 && (
              <div className="mt-2 text-xs text-center font-bold text-purple-600">
                Cooldown: {(powerCooldown / 10).toFixed(1)}s
              </div>
            )}
          </div>
        )}

        {/* Player */}
        {gameStarted && (
          <div
            className="absolute z-10"
            style={{
              left: `${playerX}%`,
              top: `${playerY}%`,
              transform: "translate(-50%, -50%)",
            }}
          >
            <div className="text-5xl drop-shadow-lg">🧙</div>
          </div>
        )}

        {/* Enemies */}
        {enemies.map((enemy) => (
          <div
            key={enemy.id}
            className="absolute z-10"
            style={{
              left: `${enemy.x}%`,
              top: `${enemy.y}%`,
              transform: "translate(-50%, -50%)",
            }}
          >
            <div className="text-4xl drop-shadow-lg">
              {getEnemyEmoji(enemy.type)}
            </div>
          </div>
        ))}

        {/* Projectiles */}
        {projectiles.map((proj) => (
          <div
            key={proj.id}
            className="absolute z-10"
            style={{
              left: `${proj.x}%`,
              top: `${proj.y}%`,
              transform: "translate(-50%, -50%)",
            }}
          >
            <div className="text-2xl">💥</div>
          </div>
        ))}

        {/* Coins */}
        {coins.map(
          (coin) =>
            !coin.collected && (
              <div
                key={coin.id}
                className="absolute animate-bounce z-10"
                style={{
                  left: `${coin.x}%`,
                  top: `${coin.y}%`,
                  transform: "translate(-50%, -50%)",
                }}
              >
                <div className="text-3xl drop-shadow-lg">🪙</div>
              </div>
            ),
        )}
      </div>
    </GameLayout>
  );
}
