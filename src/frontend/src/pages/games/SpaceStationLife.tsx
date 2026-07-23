import { useCallback, useEffect, useRef, useState } from "react";
import type { ModulePage } from "../../App";
import GameLayout from "../../components/GameLayout";

type Role = "engineer" | "explorer" | "trader";
type Event = "meteor" | "alien" | "treasure" | "malfunction";

interface Resource {
  energy: number;
  materials: number;
  credits: number;
}

interface SpaceStationLifeProps {
  onNavigate: (page: ModulePage) => void;
}

// --- Enemy / projectile types ---
type EnemyKind = "raider" | "drone" | "asteroid";

interface Enemy {
  id: number;
  kind: EnemyKind;
  // Position in % of arena (0..100). Station is at 50,50.
  x: number;
  y: number;
  // Spawn from an edge: distance from station center
  speed: number;
  hp: number;
  reward: number;
}

interface Projectile {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
}

const ENEMY_META: Record<
  EnemyKind,
  {
    emoji: string;
    label: string;
    hp: number;
    speed: number;
    reward: number;
    damage: number;
  }
> = {
  raider: {
    emoji: "🛸",
    label: "Raider",
    hp: 2,
    speed: 0.35,
    reward: 40,
    damage: 25,
  },
  drone: {
    emoji: "👾",
    label: "Drone",
    hp: 1,
    speed: 0.5,
    reward: 25,
    damage: 15,
  },
  asteroid: {
    emoji: "☄️",
    label: "Asteroid",
    hp: 3,
    speed: 0.25,
    reward: 30,
    damage: 35,
  },
};

const STATION_X = 50;
const STATION_Y = 50;
const STATION_RADIUS = 8; // % distance for "reached station"
const PROJECTILE_SPEED = 2.2;
const FIRE_COOLDOWN_MS = 280;

export default function SpaceStationLife({
  onNavigate,
}: SpaceStationLifeProps) {
  const [score, setScore] = useState(0);
  const [role, setRole] = useState<Role>("engineer");
  const [resources, setResources] = useState<Resource>({
    energy: 100,
    materials: 50,
    credits: 100,
  });
  const [currentEvent, setCurrentEvent] = useState<Event | null>(null);
  const [gameOver, setGameOver] = useState(false);
  const [highScore, setHighScore] = useState(0);
  const [day, setDay] = useState(1);
  const [playerX, setPlayerX] = useState(50);
  const [playerY, setPlayerY] = useState(50);

  // --- Defense layer state ---
  const [enemies, setEnemies] = useState<Enemy[]>([]);
  const [projectiles, setProjectiles] = useState<Projectile[]>([]);
  const [stationHealth, setStationHealth] = useState(100);
  const [wave, setWave] = useState(1);
  const [enemiesRepelled, setEnemiesRepelled] = useState(0);
  const [flash, setFlash] = useState<"" | "hit" | "kill">("");

  // Refs for the game loop (avoid stale closures)
  const playerPos = useRef({ x: 50, y: 50 });
  const lastFire = useRef(0);
  const enemyIdRef = useRef(1);
  const projIdRef = useRef(1);
  const lastSpawnRef = useRef(Date.now());
  const lastFlashRef = useRef(0);

  const roleEmojis: Record<Role, string> = {
    engineer: "🔧",
    explorer: "🚀",
    trader: "💼",
  };

  const startGame = () => {
    setScore(0);
    setRole("engineer");
    setResources({ energy: 100, materials: 50, credits: 100 });
    setCurrentEvent(null);
    setGameOver(false);
    setDay(1);
    setPlayerX(50);
    setPlayerY(50);
    setEnemies([]);
    setProjectiles([]);
    setStationHealth(100);
    setWave(1);
    setEnemiesRepelled(0);
    setFlash("");
    playerPos.current = { x: 50, y: 50 };
    lastFire.current = 0;
    lastSpawnRef.current = Date.now();
  };

  // --- Day / resource / event loop (preserved) ---
  useEffect(() => {
    if (gameOver) return;

    const dayInterval = setInterval(() => {
      setDay((prev) => prev + 1);

      setResources((prev) => ({
        energy: Math.max(0, prev.energy - 5),
        materials: prev.materials,
        credits: prev.credits,
      }));

      if (Math.random() < 0.3) {
        const events: Event[] = ["meteor", "alien", "treasure", "malfunction"];
        setCurrentEvent(events[Math.floor(Math.random() * events.length)]);
      }

      if (role === "trader") {
        setResources((prev) => ({ ...prev, credits: prev.credits + 20 }));
        setScore((prev) => prev + 10);
      } else if (role === "engineer") {
        setResources((prev) => ({ ...prev, materials: prev.materials + 10 }));
        setScore((prev) => prev + 5);
      } else {
        setScore((prev) => prev + 15);
      }

      // Wave escalation each day
      setWave((prev) => prev + 1);
    }, 5000);

    return () => clearInterval(dayInterval);
  }, [gameOver, role]);

  useEffect(() => {
    if (resources.energy <= 0 || stationHealth <= 0) {
      setGameOver(true);
    }
  }, [resources.energy, stationHealth]);

  useEffect(() => {
    if (gameOver && score > highScore) {
      setHighScore(score);
    }
  }, [gameOver, score, highScore]);

  const handleEvent = (action: "accept" | "decline") => {
    if (!currentEvent) return;

    if (action === "accept") {
      if (currentEvent === "meteor") {
        if (role === "engineer") {
          setResources((prev) => ({ ...prev, materials: prev.materials + 30 }));
          setScore((prev) => prev + 50);
        } else {
          setResources((prev) => ({
            ...prev,
            energy: Math.max(0, prev.energy - 20),
          }));
        }
      } else if (currentEvent === "alien") {
        if (role === "explorer") {
          setScore((prev) => prev + 100);
        } else {
          setResources((prev) => ({
            ...prev,
            credits: Math.max(0, prev.credits - 30),
          }));
        }
      } else if (currentEvent === "treasure") {
        setResources((prev) => ({ ...prev, credits: prev.credits + 50 }));
        setScore((prev) => prev + 75);
      } else if (currentEvent === "malfunction") {
        if (role === "engineer") {
          setResources((prev) => ({
            ...prev,
            energy: Math.min(100, prev.energy + 20),
          }));
          setScore((prev) => prev + 40);
        } else {
          setResources((prev) => ({
            ...prev,
            materials: Math.max(0, prev.materials - 20),
          }));
        }
      }
    }

    setCurrentEvent(null);
  };

  // --- Movement + shooting input ---
  const handleKeyPress = useCallback(
    (e: KeyboardEvent) => {
      if (gameOver || currentEvent) return;

      const speed = 3;
      if (e.key === "ArrowUp") {
        setPlayerY((prev) => Math.max(10, prev - speed));
        e.preventDefault();
      } else if (e.key === "ArrowDown") {
        setPlayerY((prev) => Math.min(85, prev + speed));
        e.preventDefault();
      } else if (e.key === "ArrowLeft") {
        setPlayerX((prev) => Math.max(10, prev - speed));
        e.preventDefault();
      } else if (e.key === "ArrowRight") {
        setPlayerX((prev) => Math.min(85, prev + speed));
        e.preventDefault();
      } else if (e.key === " " || e.code === "Space") {
        e.preventDefault();
        fireFromPlayer();
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [gameOver, currentEvent],
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [handleKeyPress]);

  // Keep playerPos ref synced
  useEffect(() => {
    playerPos.current = { x: playerX, y: playerY };
  }, [playerX, playerY]);

  // --- Firing: shoot toward nearest enemy, else straight up ---
  const fireFromPlayer = () => {
    const now = Date.now();
    if (now - lastFire.current < FIRE_COOLDOWN_MS) return;
    lastFire.current = now;

    const px = playerPos.current.x;
    const py = playerPos.current.y;

    // Find nearest enemy
    let nearest: Enemy | null = null;
    let nearestDist = Number.POSITIVE_INFINITY;
    for (const en of enemies) {
      const d = Math.hypot(en.x - px, en.y - py);
      if (d < nearestDist) {
        nearestDist = d;
        nearest = en;
      }
    }

    let tx = px;
    let ty = py - 10;
    if (nearest) {
      tx = nearest.x;
      ty = nearest.y;
    }

    const dx = tx - px;
    const dy = ty - py;
    const dist = Math.max(0.001, Math.hypot(dx, dy));
    const vx = (dx / dist) * PROJECTILE_SPEED;
    const vy = (dy / dist) * PROJECTILE_SPEED;

    setProjectiles((prev) => [
      ...prev,
      { id: projIdRef.current++, x: px, y: py, vx, vy },
    ]);
  };

  // Click-to-shoot
  const handleArenaClick = () => {
    if (gameOver || currentEvent) return;
    fireFromPlayer();
  };

  // --- Game loop: spawn, move enemies, move projectiles, collisions ---
  useEffect(() => {
    if (gameOver) return;

    const loop = setInterval(() => {
      const now = Date.now();

      // Spawn enemies — rate scales with wave
      const spawnInterval = Math.max(700, 2200 - wave * 120);
      if (now - lastSpawnRef.current > spawnInterval) {
        lastSpawnRef.current = now;
        const kinds: EnemyKind[] = ["raider", "drone", "asteroid"];
        const kind = kinds[Math.floor(Math.random() * kinds.length)];
        const meta = ENEMY_META[kind];

        // Spawn from a random edge
        const edge = Math.floor(Math.random() * 4);
        let x = 0;
        let y = 0;
        if (edge === 0) {
          x = Math.random() * 100;
          y = -5;
        } else if (edge === 1) {
          x = 105;
          y = Math.random() * 100;
        } else if (edge === 2) {
          x = Math.random() * 100;
          y = 105;
        } else {
          x = -5;
          y = Math.random() * 100;
        }

        setEnemies((prev) => [
          ...prev,
          {
            id: enemyIdRef.current++,
            kind,
            x,
            y,
            speed: meta.speed,
            hp: meta.hp,
            reward: meta.reward,
          },
        ]);
      }

      // Move enemies toward station
      setEnemies((prev) =>
        prev.map((en) => {
          const dx = STATION_X - en.x;
          const dy = STATION_Y - en.y;
          const dist = Math.max(0.001, Math.hypot(dx, dy));
          return {
            ...en,
            x: en.x + (dx / dist) * en.speed,
            y: en.y + (dy / dist) * en.speed,
          };
        }),
      );

      // Move projectiles
      setProjectiles((prev) =>
        prev
          .map((p) => ({ ...p, x: p.x + p.vx, y: p.y + p.vy }))
          .filter((p) => p.x > -10 && p.x < 110 && p.y > -10 && p.y < 110),
      );
    }, 60);

    return () => clearInterval(loop);
  }, [gameOver, wave]);

  // --- Collision resolution (projectile vs enemy, enemy vs station) ---
  useEffect(() => {
    if (gameOver) return;

    const col = setInterval(() => {
      setProjectiles((prevProjs) => {
        if (prevProjs.length === 0) return prevProjs;
        let projs = [...prevProjs];

        setEnemies((prevEnemies) => {
          if (prevEnemies.length === 0) return prevEnemies;
          let survived: Enemy[] = [];
          let killedThisTick = 0;

          for (const en of prevEnemies) {
            let hp = en.hp;
            let hit = false;

            for (const p of projs) {
              if (p.x === -999) continue;
              const d = Math.hypot(p.x - en.x, p.y - en.y);
              if (d < 5) {
                hp -= 1;
                hit = true;
                // mark projectile consumed
                p.x = -999;
              }
            }

            if (hp <= 0) {
              killedThisTick += 1;
              const meta = ENEMY_META[en.kind];
              setScore((prev) => prev + meta.reward);
              setResources((prev) => ({
                ...prev,
                credits: prev.credits + Math.floor(meta.reward / 2),
              }));
              setEnemiesRepelled((prev) => prev + 1);
            } else if (hit) {
              survived.push({ ...en, hp });
            } else {
              survived.push(en);
            }
          }

          if (killedThisTick > 0) {
            const now = Date.now();
            if (now - lastFlashRef.current > 80) {
              lastFlashRef.current = now;
              setFlash("kill");
              setTimeout(() => setFlash(""), 120);
            }
          }

          return survived;
        });

        projs = projs.filter((p) => p.x !== -999);
        return projs;
      });

      // Enemy reaches station
      setEnemies((prev) => {
        const remaining: Enemy[] = [];
        let stationDamage = 0;
        for (const en of prev) {
          const d = Math.hypot(en.x - STATION_X, en.y - STATION_Y);
          if (d < STATION_RADIUS) {
            stationDamage += ENEMY_META[en.kind].damage;
          } else {
            remaining.push(en);
          }
        }
        if (stationDamage > 0) {
          setStationHealth((prev) => Math.max(0, prev - stationDamage));
          const now = Date.now();
          if (now - lastFlashRef.current > 80) {
            lastFlashRef.current = now;
            setFlash("hit");
            setTimeout(() => setFlash(""), 200);
          }
        }
        return remaining;
      });
    }, 50);

    return () => clearInterval(col);
  }, [gameOver]);

  // --- Edge indicators: show arrows for off-screen / far enemies ---
  const edgeIndicators = enemies
    .filter((en) => {
      const d = Math.hypot(en.x - STATION_X, en.y - STATION_Y);
      return d > 35;
    })
    .map((en) => {
      // Direction from station to enemy, clamped to edge
      const dx = en.x - STATION_X;
      const dy = en.y - STATION_Y;
      const angle = Math.atan2(dy, dx);
      // Place indicator on a virtual ring at ~45% from center
      const r = 42;
      const ix = STATION_X + Math.cos(angle) * r;
      const iy = STATION_Y + Math.sin(angle) * r;
      const meta = ENEMY_META[en.kind];
      return { id: en.id, ix, iy, angle, emoji: meta.emoji, label: meta.label };
    });

  return (
    <GameLayout
      title="🛸 Space Station Life"
      score={score}
      highScore={highScore}
      onRestart={startGame}
      onNavigate={onNavigate}
      gameOver={gameOver}
      touchControls={true}
    >
      <div
        className={`relative w-full h-[600px] bg-gradient-to-br from-indigo-900 via-purple-900 to-black overflow-hidden ${
          flash === "hit" ? "ring-4 ring-red-500 ring-inset" : ""
        } ${flash === "kill" ? "ring-4 ring-green-400 ring-inset" : ""}`}
        onClick={handleArenaClick}
        onKeyDown={() => {}}
        role="presentation"
      >
        {/* Stars background */}
        {Array.from({ length: 50 }).map((_, i) => (
          <div
            // biome-ignore lint/suspicious/noArrayIndexKey: positional list
            key={`item-${i}`}
            className="absolute w-1 h-1 bg-white rounded-full animate-pulse"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 2}s`,
            }}
          />
        ))}

        {/* Stats panel */}
        <div className="absolute top-4 left-4 bg-black/70 text-white p-4 rounded-lg border-3 border-cyan-400 z-20 space-y-2 min-w-[160px]">
          <div className="font-bold">Day: {day}</div>
          <div className="font-bold">⚡ Energy: {resources.energy}</div>
          <div className="font-bold">🔩 Materials: {resources.materials}</div>
          <div className="font-bold">💰 Credits: {resources.credits}</div>
          <div className="pt-1 border-t border-cyan-400/40 mt-1">
            <div className="font-bold text-red-300">
              🛰️ Station: {stationHealth}%
            </div>
            <div className="font-bold text-orange-300">🌊 Wave: {wave}</div>
            <div className="font-bold text-green-300">
              🎯 Repelled: {enemiesRepelled}
            </div>
          </div>
        </div>

        {/* Role selector */}
        <div className="absolute top-4 right-4 bg-black/70 text-white p-3 rounded-lg border-3 border-cyan-400 z-20">
          <div className="text-sm font-bold mb-2">Your Role:</div>
          <div className="flex gap-2">
            {(["engineer", "explorer", "trader"] as Role[]).map((r) => (
              <button
                type="button"
                key={r}
                onClick={(e) => {
                  e.stopPropagation();
                  setRole(r);
                }}
                className={`px-3 py-2 rounded border-2 transition-all ${
                  role === r ? "border-cyan-400 bg-cyan-900" : "border-gray-600"
                }`}
              >
                <div className="text-2xl">{roleEmojis[r]}</div>
                <div className="text-xs capitalize">{r}</div>
              </button>
            ))}
          </div>
        </div>

        {/* Space station (center) */}
        <div className="absolute left-1/2 top-1/2 transform -translate-x-1/2 -translate-y-1/2 z-5">
          <div
            className={`text-7xl transition-transform ${
              stationHealth < 30 ? "animate-pulse" : ""
            }`}
            style={{ opacity: 0.7 }}
          >
            🛰️
          </div>
          {/* Station health ring */}
          <div className="absolute -inset-4 rounded-full border-2 border-cyan-400/30" />
          <div
            className="absolute -inset-4 rounded-full border-2"
            style={{
              borderColor:
                stationHealth > 60
                  ? "rgba(34,197,94,0.6)"
                  : stationHealth > 30
                    ? "rgba(234,179,8,0.6)"
                    : "rgba(239,68,68,0.7)",
            }}
          />
        </div>

        {/* Edge indicators for approaching enemies */}
        {edgeIndicators.map((ind) => (
          <div
            key={`ind-${ind.id}`}
            className="absolute z-15 pointer-events-none"
            style={{
              left: `${ind.ix}%`,
              top: `${ind.iy}%`,
              transform: `translate(-50%, -50%) rotate(${ind.angle}rad)`,
            }}
          >
            <div className="flex flex-col items-center">
              <div className="text-2xl drop-shadow-[0_0_4px_rgba(239,68,68,0.9)]">
                ➤
              </div>
              <div
                className="text-xs font-bold text-red-300 bg-black/70 px-1 rounded mt-1"
                style={{ transform: `rotate(${-ind.angle}rad)` }}
              >
                {ind.emoji} {ind.label}
              </div>
            </div>
          </div>
        ))}

        {/* Enemies on screen */}
        {enemies
          .filter((en) => {
            const d = Math.hypot(en.x - STATION_X, en.y - STATION_Y);
            return d <= 35;
          })
          .map((en) => {
            const meta = ENEMY_META[en.kind];
            return (
              <div
                key={`en-${en.id}`}
                className="absolute z-12 transition-all duration-75"
                style={{
                  left: `${en.x}%`,
                  top: `${en.y}%`,
                  transform: "translate(-50%, -50%)",
                }}
              >
                <div className="text-3xl drop-shadow-[0_0_6px_rgba(239,68,68,0.7)] animate-pulse">
                  {meta.emoji}
                </div>
                {en.hp < meta.hp && (
                  <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 flex gap-0.5">
                    {Array.from({ length: meta.hp }).map((_, i) => (
                      <div
                        key={`hp-${en.id}-${i}`}
                        className={`w-1.5 h-1.5 rounded-full ${
                          i < en.hp ? "bg-red-500" : "bg-gray-600"
                        }`}
                      />
                    ))}
                  </div>
                )}
              </div>
            );
          })}

        {/* Projectiles */}
        {projectiles.map((p) => (
          <div
            key={`proj-${p.id}`}
            className="absolute z-12 w-2 h-2 bg-cyan-300 rounded-full shadow-[0_0_8px_2px_rgba(34,211,238,0.9)]"
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              transform: "translate(-50%, -50%)",
            }}
          />
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
          <div className="text-5xl drop-shadow-[0_0_6px_rgba(34,211,238,0.6)]">
            {roleEmojis[role]}
          </div>
        </div>

        {/* Event overlay */}
        {currentEvent && (
          <div className="absolute inset-0 bg-black/70 flex items-center justify-center z-30">
            <div className="bg-gradient-to-br from-purple-900 to-indigo-900 text-white p-8 rounded-lg border-4 border-cyan-400 max-w-md w-full mx-4">
              <div className="text-center space-y-4">
                <div className="text-6xl">
                  {currentEvent === "meteor" && "☄️"}
                  {currentEvent === "alien" && "👽"}
                  {currentEvent === "treasure" && "💎"}
                  {currentEvent === "malfunction" && "⚠️"}
                </div>
                <div className="text-2xl font-bold capitalize">
                  {currentEvent}!
                </div>
                <div className="text-lg">
                  {currentEvent === "meteor" && "A meteor shower approaches!"}
                  {currentEvent === "alien" && "Alien contact detected!"}
                  {currentEvent === "treasure" && "Treasure found nearby!"}
                  {currentEvent === "malfunction" && "System malfunction!"}
                </div>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEvent("accept");
                    }}
                    className="flex-1 px-6 py-3 bg-green-600 rounded-lg font-bold hover:bg-green-700 transition-colors"
                  >
                    Handle It
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleEvent("decline");
                    }}
                    className="flex-1 px-6 py-3 bg-red-600 rounded-lg font-bold hover:bg-red-700 transition-colors"
                  >
                    Ignore
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Instructions */}
        {day === 1 && !currentEvent && (
          <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-black/70 text-white px-6 py-3 rounded-lg border-3 border-cyan-400 z-20 text-center">
            <p className="font-bold">
              Arrow keys to move • Space / Click to fire • Defend the station!
            </p>
          </div>
        )}

        {/* Game over defense summary */}
        {gameOver && (
          <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-40">
            <div className="bg-gradient-to-br from-red-900 to-purple-900 text-white p-8 rounded-lg border-4 border-red-400 max-w-md w-full mx-4 text-center space-y-3">
              <div className="text-6xl">💥</div>
              <div className="text-3xl font-bold">
                {stationHealth <= 0 ? "Station Destroyed!" : "Energy Depleted!"}
              </div>
              <div className="text-lg">
                Survived {day} days • Repelled {enemiesRepelled} enemies
              </div>
              <div className="text-2xl font-bold text-cyan-300">
                Score: {score}
              </div>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  startGame();
                }}
                className="px-8 py-3 bg-cyan-500 rounded-lg font-bold hover:bg-cyan-600 transition-colors"
              >
                Restart Mission
              </button>
            </div>
          </div>
        )}
      </div>
    </GameLayout>
  );
}
