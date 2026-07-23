import { useCallback, useEffect, useRef, useState } from "react";
import type { ModulePage } from "../../App";
import GameLayout from "../../components/GameLayout";

interface Bullet {
  id: number;
  x: number;
  y: number;
  isPlayerBullet: boolean;
}

interface Enemy {
  id: number;
  x: number;
  y: number;
  alive: boolean;
}

interface SpaceInvadersProps {
  onNavigate: (page: ModulePage) => void;
}

const GAME_WIDTH = 600;
const GAME_HEIGHT = 500;
const PLAYER_SIZE = 40;
const ENEMY_SIZE = 30;
const BULLET_SIZE = 4;

export default function SpaceInvaders({ onNavigate }: SpaceInvadersProps) {
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [lives, setLives] = useState(3);
  const [wave, setWave] = useState(1);
  const [showInstructions, setShowInstructions] = useState(true);

  const playerXRef = useRef(GAME_WIDTH / 2 - PLAYER_SIZE / 2);
  const bulletsRef = useRef<Bullet[]>([]);
  const enemiesRef = useRef<Enemy[]>([]);
  const enemyDirectionRef = useRef(1);
  const nextBulletIdRef = useRef(0);
  const nextEnemyIdRef = useRef(0);
  const animationFrameRef = useRef<number | undefined>(undefined);
  const lastEnemyMoveRef = useRef(0);
  const lastEnemyShootRef = useRef(0);
  const keysRef = useRef<Set<string>>(new Set());
  const [, forceUpdate] = useState({});

  const createEnemies = useCallback((waveNum: number) => {
    const enemies: Enemy[] = [];
    const rows = Math.min(3 + Math.floor(waveNum / 2), 5);
    const cols = 8;
    const spacing = 60;
    const startX = (GAME_WIDTH - cols * spacing) / 2;
    const startY = 50;

    for (let row = 0; row < rows; row++) {
      for (let col = 0; col < cols; col++) {
        enemies.push({
          id: nextEnemyIdRef.current++,
          x: startX + col * spacing,
          y: startY + row * spacing,
          alive: true,
        });
      }
    }
    return enemies;
  }, []);

  const startGame = useCallback(() => {
    setScore(0);
    setGameOver(false);
    setLives(3);
    setWave(1);
    setShowInstructions(true);
    playerXRef.current = GAME_WIDTH / 2 - PLAYER_SIZE / 2;
    bulletsRef.current = [];
    enemiesRef.current = createEnemies(1);
    enemyDirectionRef.current = 1;
    nextBulletIdRef.current = 0;
    nextEnemyIdRef.current = 0;
    keysRef.current.clear();
    lastEnemyMoveRef.current = 0;
    lastEnemyShootRef.current = 0;
    forceUpdate({});
  }, [createEnemies]);

  useEffect(() => {
    enemiesRef.current = createEnemies(1);
  }, [createEnemies]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameOver) return;
      const key = e.key.toLowerCase();
      keysRef.current.add(key);

      if (key === " " || key === "spacebar") {
        setShowInstructions(false);
        // Shoot
        const bullet: Bullet = {
          id: nextBulletIdRef.current++,
          x: playerXRef.current + PLAYER_SIZE / 2 - BULLET_SIZE / 2,
          y: GAME_HEIGHT - 60,
          isPlayerBullet: true,
        };
        bulletsRef.current.push(bullet);
        e.preventDefault();
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      keysRef.current.delete(e.key.toLowerCase());
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [gameOver]);

  // Game loop
  useEffect(() => {
    if (gameOver) {
      if (animationFrameRef.current !== undefined) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      return;
    }

    const animate = (currentTime: number) => {
      // Move player
      if (keysRef.current.has("arrowleft") || keysRef.current.has("a")) {
        playerXRef.current = Math.max(0, playerXRef.current - 5);
        setShowInstructions(false);
      }
      if (keysRef.current.has("arrowright") || keysRef.current.has("d")) {
        playerXRef.current = Math.min(
          GAME_WIDTH - PLAYER_SIZE,
          playerXRef.current + 5,
        );
        setShowInstructions(false);
      }

      // Move bullets
      bulletsRef.current = bulletsRef.current.filter((bullet) => {
        if (bullet.isPlayerBullet) {
          bullet.y -= 8;
          return bullet.y > 0;
        }
        bullet.y += 5;

        // Check collision with player
        if (
          bullet.y + BULLET_SIZE >= GAME_HEIGHT - 50 &&
          bullet.x >= playerXRef.current &&
          bullet.x <= playerXRef.current + PLAYER_SIZE
        ) {
          setLives((prev) => {
            const newLives = prev - 1;
            if (newLives <= 0) {
              setGameOver(true);
            }
            return newLives;
          });
          return false;
        }

        return bullet.y < GAME_HEIGHT;
      });

      // Move enemies
      if (
        currentTime - lastEnemyMoveRef.current >
        Math.max(500 - wave * 50, 200)
      ) {
        lastEnemyMoveRef.current = currentTime;

        let shouldMoveDown = false;
        for (const enemy of enemiesRef.current) {
          if (enemy.alive) {
            if (
              (enemyDirectionRef.current > 0 &&
                enemy.x + ENEMY_SIZE >= GAME_WIDTH - 10) ||
              (enemyDirectionRef.current < 0 && enemy.x <= 10)
            ) {
              shouldMoveDown = true;
              break;
            }
          }
        }

        if (shouldMoveDown) {
          enemyDirectionRef.current *= -1;
          for (const enemy of enemiesRef.current) {
            if (enemy.alive) {
              enemy.y += 20;

              // Check if enemies reached bottom
              if (enemy.y + ENEMY_SIZE >= GAME_HEIGHT - 60) {
                setGameOver(true);
              }
            }
          }
        } else {
          for (const enemy of enemiesRef.current) {
            if (enemy.alive) {
              enemy.x += enemyDirectionRef.current * 10;
            }
          }
        }
      }

      // Enemy shooting
      if (currentTime - lastEnemyShootRef.current > 1500) {
        lastEnemyShootRef.current = currentTime;
        const aliveEnemies = enemiesRef.current.filter((e) => e.alive);
        if (aliveEnemies.length > 0) {
          const shooter =
            aliveEnemies[Math.floor(Math.random() * aliveEnemies.length)];
          bulletsRef.current.push({
            id: nextBulletIdRef.current++,
            x: shooter.x + ENEMY_SIZE / 2 - BULLET_SIZE / 2,
            y: shooter.y + ENEMY_SIZE,
            isPlayerBullet: false,
          });
        }
      }

      // Check bullet-enemy collisions
      bulletsRef.current = bulletsRef.current.filter((bullet) => {
        if (!bullet.isPlayerBullet) return true;

        for (const enemy of enemiesRef.current) {
          if (
            enemy.alive &&
            bullet.x >= enemy.x &&
            bullet.x <= enemy.x + ENEMY_SIZE &&
            bullet.y >= enemy.y &&
            bullet.y <= enemy.y + ENEMY_SIZE
          ) {
            enemy.alive = false;
            setScore((prev) => prev + 10 * wave);
            return false;
          }
        }
        return true;
      });

      // Check if all enemies destroyed
      if (enemiesRef.current.every((e) => !e.alive)) {
        setWave((prev) => {
          const newWave = prev + 1;
          enemiesRef.current = createEnemies(newWave);
          enemyDirectionRef.current = 1;
          return newWave;
        });
      }

      forceUpdate({});
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current !== undefined) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [gameOver, wave, createEnemies]);

  useEffect(() => {
    if (gameOver && score > highScore) {
      setHighScore(score);
    }
  }, [gameOver, score, highScore]);

  return (
    <GameLayout
      title="👾 Space Invaders"
      score={score}
      highScore={highScore}
      onRestart={startGame}
      onNavigate={onNavigate}
      gameOver={gameOver}
    >
      <div className="relative w-full flex flex-col items-center justify-center p-4 bg-gradient-to-b from-black via-purple-900 to-black">
        {/* Stats */}
        <div className="mb-4 flex items-center gap-6 bg-white px-6 py-3 rounded-full border-4 border-cyan-400">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold">Lives:</span>
            {Array.from({ length: lives }).map((_, i) => (
              <span
                // biome-ignore lint/suspicious/noArrayIndexKey: positional list
                key={i}
                className="text-2xl"
              >
                🚀
              </span>
            ))}
          </div>
          <div className="text-xl font-bold">Wave: {wave}</div>
        </div>

        {/* Game Board */}
        <div
          className="relative bg-black border-4 border-cyan-500 shadow-2xl overflow-hidden"
          style={{ width: GAME_WIDTH, height: GAME_HEIGHT }}
        >
          {/* Stars background */}
          <div className="absolute inset-0">
            {Array.from({ length: 50 }).map((_, i) => (
              <div
                // biome-ignore lint/suspicious/noArrayIndexKey: positional list
                key={i}
                className="absolute bg-white rounded-full"
                style={{
                  left: `${Math.random() * 100}%`,
                  top: `${Math.random() * 100}%`,
                  width: Math.random() * 2 + 1,
                  height: Math.random() * 2 + 1,
                  opacity: Math.random() * 0.5 + 0.3,
                }}
              />
            ))}
          </div>

          {/* Player */}
          <div
            className="absolute bg-cyan-400 transition-all duration-75"
            style={{
              left: playerXRef.current,
              bottom: 10,
              width: PLAYER_SIZE,
              height: PLAYER_SIZE,
              clipPath: "polygon(50% 0%, 0% 100%, 100% 100%)",
            }}
          />

          {/* Enemies */}
          {enemiesRef.current.map((enemy) =>
            enemy.alive ? (
              <div
                key={enemy.id}
                className="absolute bg-green-400 border-2 border-green-600"
                style={{
                  left: enemy.x,
                  top: enemy.y,
                  width: ENEMY_SIZE,
                  height: ENEMY_SIZE,
                  borderRadius: "50% 50% 0 0",
                }}
              >
                <div className="absolute top-1/3 left-1/4 w-2 h-2 bg-red-500 rounded-full" />
                <div className="absolute top-1/3 right-1/4 w-2 h-2 bg-red-500 rounded-full" />
              </div>
            ) : null,
          )}

          {/* Bullets */}
          {bulletsRef.current.map((bullet) => (
            <div
              key={bullet.id}
              className="absolute rounded-full"
              style={{
                left: bullet.x,
                top: bullet.y,
                width: BULLET_SIZE,
                height: BULLET_SIZE * 2,
                backgroundColor: bullet.isPlayerBullet ? "#00FFFF" : "#FF0000",
              }}
            />
          ))}

          {/* Instructions Overlay */}
          {showInstructions && !gameOver && (
            <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-10">
              <div className="bg-white p-6 rounded-lg border-4 border-cyan-400 text-center max-w-sm">
                <h2 className="text-2xl font-bold mb-3 text-cyan-600">
                  How to Play
                </h2>
                <p className="mb-2">⬅️➡️ or A/D: Move</p>
                <p className="mb-2">Space: Shoot</p>
                <p className="mb-2">👾 Destroy all enemies!</p>
                <p className="mb-3">🚀 Don't let them reach you!</p>
                <button
                  type="button"
                  onClick={() => setShowInstructions(false)}
                  className="px-6 py-2 bg-cyan-500 text-white rounded-full font-bold hover:bg-cyan-600"
                >
                  Start!
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="mt-4 text-white text-center">
          <p className="text-sm">
            Enemies Remaining:{" "}
            {enemiesRef.current.filter((e) => e.alive).length}
          </p>
        </div>
      </div>
    </GameLayout>
  );
}
