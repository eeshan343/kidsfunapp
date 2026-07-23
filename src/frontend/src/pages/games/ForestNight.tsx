import { useCallback, useEffect, useRef, useState } from "react";
import type { ModulePage } from "../../App";
import GameLayout from "../../components/GameLayout";

type Phase = "day" | "night";

interface Animal {
  id: number;
  x: number;
  y: number;
  kind: "deer" | "rabbit" | "fox";
  emoji: string;
  points: number;
  vx: number;
  vy: number;
  alive: boolean;
}

interface Enemy {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
}

interface ForestNightProps {
  onNavigate: (page: ModulePage) => void;
}

const MAP_W = 100;
const MAP_H = 100;
const CAMPFIRE_X = 50;
const CAMPFIRE_Y = 50;
const CAMPFIRE_RADIUS = 14;
const DAY_DURATION = 25;
const NIGHT_DURATION = 30;
const PLAYER_SPEED = 1.6;
const ANIMAL_SPEED = 0.7;
const ENEMY_SPEED = 0.9;
const ENEMY_MAX = 6;
const ANIMAL_MAX = 6;
const CATCH_RADIUS = 5;
const ENEMY_HIT_RADIUS = 5;
const SAFE_RADIUS = CAMPFIRE_RADIUS - 2;

const ANIMAL_KINDS: { kind: Animal["kind"]; emoji: string; points: number }[] =
  [
    { kind: "deer", emoji: "🦌", points: 25 },
    { kind: "rabbit", emoji: "🐇", points: 10 },
    { kind: "fox", emoji: "🦊", points: 18 },
  ];

function dist(x1: number, y1: number, x2: number, y2: number) {
  return Math.sqrt((x1 - x2) ** 2 + (y1 - y2) ** 2);
}

function clamp(v: number, min: number, max: number) {
  return Math.max(min, Math.min(max, v));
}

function randomEdgePosition(): { x: number; y: number } {
  const side = Math.floor(Math.random() * 4);
  if (side === 0) return { x: Math.random() * MAP_W, y: 4 };
  if (side === 1) return { x: Math.random() * MAP_W, y: MAP_H - 4 };
  if (side === 2) return { x: 4, y: Math.random() * MAP_H };
  return { x: MAP_W - 4, y: Math.random() * MAP_H };
}

export default function ForestNight({ onNavigate }: ForestNightProps) {
  const [score, setScore] = useState(0);
  const [playerX, setPlayerX] = useState(50);
  const [playerY, setPlayerY] = useState(50);
  const [animals, setAnimals] = useState<Animal[]>([]);
  const [enemies, setEnemies] = useState<Enemy[]>([]);
  const [phase, setPhase] = useState<Phase>("day");
  const [phaseTime, setPhaseTime] = useState(DAY_DURATION);
  const [gameOver, setGameOver] = useState(false);
  const [highScore, setHighScore] = useState(0);
  const [nextId, setNextId] = useState(0);
  const [started, setStarted] = useState(false);
  const [nearCampfire, setNearCampfire] = useState(true);

  const keys = useRef<Record<string, boolean>>({});
  const playerPos = useRef({ x: 50, y: 50 });
  const phaseRef = useRef<Phase>("day");

  const startGame = useCallback(() => {
    setScore(0);
    setPlayerX(50);
    setPlayerY(50);
    playerPos.current = { x: 50, y: 50 };
    setAnimals([]);
    setEnemies([]);
    setPhase("day");
    phaseRef.current = "day";
    setPhaseTime(DAY_DURATION);
    setGameOver(false);
    setNextId(0);
    setStarted(true);
    setNearCampfire(true);
  }, []);

  // Keyboard handling
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      keys.current[e.key] = true;
      if (
        ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight", " "].includes(e.key)
      ) {
        e.preventDefault();
      }
    };
    const up = (e: KeyboardEvent) => {
      keys.current[e.key] = false;
    };
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, []);

  // Phase timer
  useEffect(() => {
    if (!started || gameOver) return;
    const interval = setInterval(() => {
      setPhaseTime((prev) => {
        if (prev <= 1) {
          const newPhase = phaseRef.current === "day" ? "night" : "day";
          phaseRef.current = newPhase;
          setPhase(newPhase);
          if (newPhase === "day") {
            setEnemies([]);
          }
          return newPhase === "day" ? DAY_DURATION : NIGHT_DURATION;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [started, gameOver]);

  // High score tracking
  useEffect(() => {
    if (gameOver && score > highScore) {
      setHighScore(score);
    }
  }, [gameOver, score, highScore]);

  // Main game loop
  useEffect(() => {
    if (!started || gameOver) return;

    const loop = setInterval(() => {
      // Move player
      let dx = 0;
      let dy = 0;
      if (keys.current.ArrowUp || keys.current.w) dy -= PLAYER_SPEED;
      if (keys.current.ArrowDown || keys.current.s) dy += PLAYER_SPEED;
      if (keys.current.ArrowLeft || keys.current.a) dx -= PLAYER_SPEED;
      if (keys.current.ArrowRight || keys.current.d) dx += PLAYER_SPEED;

      const newX = clamp(playerPos.current.x + dx, 3, MAP_W - 3);
      const newY = clamp(playerPos.current.y + dy, 3, MAP_H - 3);
      playerPos.current = { x: newX, y: newY };
      setPlayerX(newX);
      setPlayerY(newY);

      const distToCamp = dist(newX, newY, CAMPFIRE_X, CAMPFIRE_Y);
      setNearCampfire(distToCamp < SAFE_RADIUS);

      // Move animals (wander)
      setAnimals((prev) =>
        prev.map((a) => {
          if (!a.alive) return a;
          let nvx = a.vx + (Math.random() - 0.5) * 0.3;
          let nvy = a.vy + (Math.random() - 0.5) * 0.3;
          const sp = Math.sqrt(nvx * nvx + nvy * nvy);
          const max = ANIMAL_SPEED;
          if (sp > max) {
            nvx = (nvx / sp) * max;
            nvy = (nvy / sp) * max;
          }
          // Flee from player when close
          const dToPlayer = dist(a.x, a.y, newX, newY);
          if (dToPlayer < 12) {
            const fleeX = a.x - newX;
            const fleeY = a.y - newY;
            const fl = Math.sqrt(fleeX * fleeX + fleeY * fleeY) || 1;
            nvx = (fleeX / fl) * max * 1.4;
            nvy = (fleeY / fl) * max * 1.4;
          }
          let nx = clamp(a.x + nvx, 3, MAP_W - 3);
          let ny = clamp(a.y + nvy, 3, MAP_H - 3);
          return { ...a, x: nx, y: ny, vx: nvx, vy: nvy };
        }),
      );

      // Move enemies toward player (but blocked by campfire safe zone)
      setEnemies((prev) =>
        prev.map((e) => {
          const targetX = newX;
          const targetY = newY;
          let evx = targetX - e.x;
          let evy = targetY - e.y;
          const el = Math.sqrt(evx * evx + evy * evy) || 1;
          evx = (evx / el) * ENEMY_SPEED;
          evy = (evy / el) * ENEMY_SPEED;
          let nx = e.x + evx;
          let ny = e.y + evy;
          // Block entering campfire safe zone
          const distToCamp = dist(nx, ny, CAMPFIRE_X, CAMPFIRE_Y);
          if (distToCamp < CAMPFIRE_RADIUS) {
            const pushX = nx - CAMPFIRE_X;
            const pushY = ny - CAMPFIRE_Y;
            const pl = Math.sqrt(pushX * pushX + pushY * pushY) || 1;
            nx = CAMPFIRE_X + (pushX / pl) * CAMPFIRE_RADIUS;
            ny = CAMPFIRE_Y + (pushY / pl) * CAMPFIRE_RADIUS;
          }
          return { ...e, x: nx, y: ny };
        }),
      );
    }, 60);

    return () => clearInterval(loop);
  }, [started, gameOver]);

  // Spawn animals during day
  useEffect(() => {
    if (!started || gameOver || phase !== "day") return;
    const interval = setInterval(() => {
      setAnimals((prev) => {
        const alive = prev.filter((a) => a.alive);
        if (alive.length >= ANIMAL_MAX) return prev;
        const kind =
          ANIMAL_KINDS[Math.floor(Math.random() * ANIMAL_KINDS.length)];
        const pos = randomEdgePosition();
        const id = nextId;
        setNextId((n) => n + 1);
        return [
          ...prev,
          {
            id,
            x: pos.x,
            y: pos.y,
            kind: kind.kind,
            emoji: kind.emoji,
            points: kind.points,
            vx: (Math.random() - 0.5) * ANIMAL_SPEED,
            vy: (Math.random() - 0.5) * ANIMAL_SPEED,
            alive: true,
          },
        ];
      });
    }, 2500);
    return () => clearInterval(interval);
  }, [started, gameOver, phase, nextId]);

  // Spawn the special deer + enemies at night
  useEffect(() => {
    if (!started || gameOver || phase !== "night") return;
    // Spawn the special deer once at night start
    setAnimals((prev) => {
      const hasDeer = prev.some((a) => a.alive && a.kind === "deer");
      if (hasDeer) return prev;
      const id = nextId;
      setNextId((n) => n + 1);
      const pos = randomEdgePosition();
      return [
        ...prev,
        {
          id,
          x: pos.x,
          y: pos.y,
          kind: "deer",
          emoji: "🦌",
          points: 50,
          vx: (Math.random() - 0.5) * ANIMAL_SPEED,
          vy: (Math.random() - 0.5) * ANIMAL_SPEED,
          alive: true,
        },
      ];
    });

    // Spawn enemies periodically
    const interval = setInterval(() => {
      setEnemies((prev) => {
        if (prev.length >= ENEMY_MAX) return prev;
        const pos = randomEdgePosition();
        const id = nextId;
        setNextId((n) => n + 1);
        return [...prev, { id, x: pos.x, y: pos.y, vx: 0, vy: 0 }];
      });
    }, 3500);
    return () => clearInterval(interval);
  }, [started, gameOver, phase, nextId]);

  // Catch animals + enemy collision
  useEffect(() => {
    if (!started || gameOver) return;

    // Catch animals
    setAnimals((prev) => {
      let caught = false;
      const updated = prev.map((a) => {
        if (a.alive && dist(a.x, a.y, playerX, playerY) < CATCH_RADIUS) {
          caught = true;
          return { ...a, alive: false };
        }
        return a;
      });
      if (caught) {
        const caughtAnimal = prev.find(
          (a) => a.alive && dist(a.x, a.y, playerX, playerY) < CATCH_RADIUS,
        );
        if (caughtAnimal) {
          setScore((s) => s + caughtAnimal.points);
        }
      }
      return updated;
    });

    // Enemy collision (only if not safe)
    if (!nearCampfire) {
      for (const e of enemies) {
        if (dist(e.x, e.y, playerX, playerY) < ENEMY_HIT_RADIUS) {
          setGameOver(true);
          break;
        }
      }
    }
  }, [playerX, playerY, enemies, nearCampfire, started, gameOver]);

  const phaseColor =
    phase === "day"
      ? "from-green-700 via-green-800 to-emerald-900"
      : "from-slate-900 via-indigo-950 to-black";

  return (
    <GameLayout
      title="🌲 Forest Night"
      score={score}
      highScore={highScore}
      onRestart={startGame}
      onNavigate={onNavigate}
      gameOver={gameOver}
      touchControls={true}
    >
      <div
        className={`relative w-full h-[600px] bg-gradient-to-br ${phaseColor} overflow-hidden transition-colors duration-1000`}
      >
        {/* Night darkness overlay */}
        {phase === "night" && (
          <div className="absolute inset-0 bg-black/40 pointer-events-none transition-opacity duration-1000" />
        )}

        {/* Campfire safe zone */}
        <div
          className="absolute rounded-full pointer-events-none z-10"
          style={{
            left: `${CAMPFIRE_X}%`,
            top: `${CAMPFIRE_Y}%`,
            width: `${CAMPFIRE_RADIUS * 2}%`,
            height: `${CAMPFIRE_RADIUS * 2}%`,
            transform: "translate(-50%, -50%)",
            background:
              "radial-gradient(circle, rgba(255,180,80,0.35) 0%, rgba(255,140,40,0.15) 50%, transparent 75%)",
            boxShadow: "0 0 60px 20px rgba(255,160,60,0.25)",
          }}
        />

        {/* Campfire */}
        <div
          className="absolute z-20 text-4xl animate-pulse"
          style={{
            left: `${CAMPFIRE_X}%`,
            top: `${CAMPFIRE_Y}%`,
            transform: "translate(-50%, -50%)",
          }}
        >
          🔥
        </div>

        {/* Phase + Timer Display */}
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 z-30 flex items-center gap-3">
          <div
            className={`px-5 py-2 rounded-full border-4 ${
              phase === "day"
                ? "bg-yellow-100 border-yellow-400"
                : "bg-indigo-900 border-indigo-400 text-white"
            }`}
          >
            <span className="text-xl font-bold">
              {phase === "day" ? "☀️ Day" : "🌙 Night"} · {phaseTime}s
            </span>
          </div>
        </div>

        {/* Safe zone indicator */}
        <div
          className={`absolute bottom-4 right-4 px-4 py-2 rounded-lg border-3 z-30 transition-colors ${
            nearCampfire
              ? "bg-orange-100 border-orange-400 text-orange-800"
              : "bg-red-100 border-red-400 text-red-800"
          }`}
        >
          <span className="font-bold text-sm">
            {nearCampfire ? "🔥 Safe at campfire" : "⚠️ Exposed to enemies"}
          </span>
        </div>

        {/* Score breakdown */}
        <div className="absolute bottom-4 left-4 px-4 py-2 rounded-lg border-3 border-green-400 bg-green-50 z-30">
          <span className="font-bold text-sm text-green-800">
            🏹 Hunt: {animals.filter((a) => a.alive).length} animals
          </span>
        </div>

        {/* Start instructions */}
        {!started && !gameOver && (
          <div className="absolute inset-0 flex items-center justify-center z-40 bg-black/60">
            <div className="bg-white p-8 rounded-lg border-4 border-green-400 text-center max-w-md">
              <h2 className="text-3xl font-bold mb-3">🌲 Forest Night</h2>
              <p className="text-base mb-2 font-semibold">
                ☀️ Day: Hunt deer, rabbits & foxes for points
              </p>
              <p className="text-base mb-2 font-semibold">
                🌙 Night: Avoid enemies, return to the campfire 🔥
              </p>
              <p className="text-sm mb-4 text-gray-600">
                Use Arrow keys or WASD to move
              </p>
              <button
                type="button"
                onClick={startGame}
                className="px-6 py-3 bg-green-600 text-white text-lg font-bold rounded-lg hover:bg-green-700 transition-colors"
              >
                Start Hunt
              </button>
            </div>
          </div>
        )}

        {/* Player */}
        <div
          className="absolute z-20 text-4xl"
          style={{
            left: `${playerX}%`,
            top: `${playerY}%`,
            transform: "translate(-50%, -50%)",
          }}
        >
          🧑‍🌾
        </div>

        {/* Animals */}
        {animals.map((a) => {
          if (!a.alive) return null;
          return (
            <div
              key={a.id}
              className="absolute z-15 text-3xl"
              style={{
                left: `${a.x}%`,
                top: `${a.y}%`,
                transform: "translate(-50%, -50%)",
              }}
            >
              {a.emoji}
            </div>
          );
        })}

        {/* Enemies */}
        {enemies.map((e) => (
          <div
            key={e.id}
            className="absolute z-15 text-3xl"
            style={{
              left: `${e.x}%`,
              top: `${e.y}%`,
              transform: "translate(-50%, -50%)",
            }}
          >
            👹
          </div>
        ))}
      </div>
    </GameLayout>
  );
}
