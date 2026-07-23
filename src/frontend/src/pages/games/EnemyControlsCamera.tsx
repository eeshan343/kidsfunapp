import { useCallback, useEffect, useRef, useState } from "react";
import type { ModulePage } from "../../App";
import GameLayout from "../../components/GameLayout";

interface EnemyControlsCameraProps {
  onNavigate: (page: ModulePage) => void;
}

// ─── World constants ─────────────────────────────────────────────
const WORLD_W = 2400;
const WORLD_H = 1600;
const VIEW_W = 800;
const VIEW_H = 560;
const PLAYER_SIZE = 18;
const ENEMY_BOSS_SIZE = 32;
const TILE = 40;

// ─── Types ───────────────────────────────────────────────────────
interface Trap {
  x: number;
  y: number;
  w: number;
  h: number;
  type: "spike" | "laser" | "pit";
  active: boolean;
  phase: number; // for laser toggling
}

interface Platform {
  x: number;
  y: number;
  w: number;
  h: number;
  moving: boolean;
  dx: number;
  minX: number;
  maxX: number;
}

interface Checkpoint {
  x: number;
  y: number;
  activated: boolean;
}

interface TauntMessage {
  text: string;
  alpha: number;
  y: number;
}

// ─── Camera AI behaviour modes ────────────────────────────────────
type CameraMode =
  | "follow" // loosely tracks player
  | "pan_away" // deliberately moves away from player
  | "zoom_taunt" // zooms in on enemy/hazard to taunt
  | "hide_trap" // parks camera so a trap is just off-screen
  | "reveal_dread" // briefly shows danger then snaps away
  | "spin" // disorienting slow rotation
  | "final_battle"; // locked on boss arena

const TAUNTS = [
  "Did you forget where you were?",
  "Looking for something?",
  "Maybe the trap was... over there.",
  "Don't worry. I'll show you... eventually.",
  "Your input was noted. Irrelevant, but noted.",
  "Shhh. Don't struggle.",
  "I know exactly where you are.",
  "That gap? You'll find it. Probably.",
  "You moved left. Interesting.",
  "Shall I show you what's ahead? No.",
  "Your patterns are so... predictable.",
  "I see everything. You see what I allow.",
];

const buildWorld = () => {
  const platforms: Platform[] = [
    // Ground floor
    { x: 0, y: 1520, w: 2400, h: 80, moving: false, dx: 0, minX: 0, maxX: 0 },
    // Platforms layer 1
    { x: 200, y: 1360, w: 200, h: 20, moving: false, dx: 0, minX: 0, maxX: 0 },
    { x: 480, y: 1280, w: 160, h: 20, moving: false, dx: 0, minX: 0, maxX: 0 },
    {
      x: 700,
      y: 1200,
      w: 180,
      h: 20,
      moving: true,
      dx: 1.5,
      minX: 680,
      maxX: 900,
    },
    { x: 950, y: 1320, w: 140, h: 20, moving: false, dx: 0, minX: 0, maxX: 0 },
    { x: 1120, y: 1240, w: 200, h: 20, moving: false, dx: 0, minX: 0, maxX: 0 },
    {
      x: 1380,
      y: 1160,
      w: 160,
      h: 20,
      moving: true,
      dx: -2,
      minX: 1340,
      maxX: 1580,
    },
    { x: 1600, y: 1300, w: 200, h: 20, moving: false, dx: 0, minX: 0, maxX: 0 },
    { x: 1860, y: 1220, w: 180, h: 20, moving: false, dx: 0, minX: 0, maxX: 0 },
    {
      x: 2080,
      y: 1140,
      w: 220,
      h: 20,
      moving: true,
      dx: 1,
      minX: 2060,
      maxX: 2260,
    },
    // Layer 2
    { x: 300, y: 1100, w: 180, h: 20, moving: false, dx: 0, minX: 0, maxX: 0 },
    {
      x: 560,
      y: 1020,
      w: 160,
      h: 20,
      moving: true,
      dx: 2,
      minX: 520,
      maxX: 740,
    },
    { x: 800, y: 960, w: 200, h: 20, moving: false, dx: 0, minX: 0, maxX: 0 },
    { x: 1060, y: 880, w: 180, h: 20, moving: false, dx: 0, minX: 0, maxX: 0 },
    {
      x: 1300,
      y: 800,
      w: 200,
      h: 20,
      moving: true,
      dx: -1.5,
      minX: 1260,
      maxX: 1500,
    },
    { x: 1540, y: 940, w: 160, h: 20, moving: false, dx: 0, minX: 0, maxX: 0 },
    { x: 1780, y: 860, w: 200, h: 20, moving: false, dx: 0, minX: 0, maxX: 0 },
    { x: 2020, y: 780, w: 180, h: 20, moving: false, dx: 0, minX: 0, maxX: 0 },
    // Layer 3 - approaches boss arena
    { x: 400, y: 720, w: 160, h: 20, moving: false, dx: 0, minX: 0, maxX: 0 },
    {
      x: 640,
      y: 640,
      w: 200,
      h: 20,
      moving: true,
      dx: 2.5,
      minX: 600,
      maxX: 860,
    },
    { x: 900, y: 560, w: 180, h: 20, moving: false, dx: 0, minX: 0, maxX: 0 },
    {
      x: 1140,
      y: 480,
      w: 200,
      h: 20,
      moving: true,
      dx: -2,
      minX: 1100,
      maxX: 1340,
    },
    { x: 1400, y: 400, w: 180, h: 20, moving: false, dx: 0, minX: 0, maxX: 0 },
    { x: 1640, y: 480, w: 160, h: 20, moving: false, dx: 0, minX: 0, maxX: 0 },
    {
      x: 1860,
      y: 400,
      w: 200,
      h: 20,
      moving: true,
      dx: 1.5,
      minX: 1820,
      maxX: 2060,
    },
    // Boss arena floor
    { x: 900, y: 260, w: 600, h: 20, moving: false, dx: 0, minX: 0, maxX: 0 },
    { x: 860, y: 260, w: 20, h: 200, moving: false, dx: 0, minX: 0, maxX: 0 }, // left wall
    { x: 1500, y: 260, w: 20, h: 200, moving: false, dx: 0, minX: 0, maxX: 0 }, // right wall
  ];

  const traps: Trap[] = [
    // Spikes on ground floor
    { x: 600, y: 1500, w: 80, h: 20, type: "spike", active: true, phase: 0 },
    { x: 900, y: 1500, w: 80, h: 20, type: "spike", active: true, phase: 0 },
    { x: 1500, y: 1500, w: 80, h: 20, type: "spike", active: true, phase: 0 },
    { x: 1800, y: 1500, w: 80, h: 20, type: "spike", active: true, phase: 0 },
    { x: 2100, y: 1500, w: 80, h: 20, type: "spike", active: true, phase: 0 },
    // Lasers mid-layer
    { x: 440, y: 1100, w: 20, h: 180, type: "laser", active: true, phase: 0 },
    {
      x: 780,
      y: 900,
      w: 20,
      h: 160,
      type: "laser",
      active: true,
      phase: Math.PI,
    },
    { x: 1240, y: 700, w: 20, h: 160, type: "laser", active: true, phase: 0 },
    {
      x: 1760,
      y: 620,
      w: 20,
      h: 140,
      type: "laser",
      active: true,
      phase: Math.PI * 0.5,
    },
    // Pits (missing floor sections)
    { x: 1100, y: 1520, w: 100, h: 60, type: "pit", active: true, phase: 0 },
    { x: 1700, y: 1520, w: 120, h: 60, type: "pit", active: true, phase: 0 },
    // Boss arena hazards
    { x: 920, y: 1500, w: 60, h: 20, type: "spike", active: true, phase: 0 }, // actually arena level
  ];

  const checkpoints: Checkpoint[] = [
    { x: 500, y: 1490, activated: false },
    { x: 1100, y: 1490, activated: false },
    { x: 1700, y: 1490, activated: false },
    { x: 2100, y: 750, activated: false },
    { x: 1200, y: 230, activated: false }, // boss entrance
  ];

  return { platforms, traps, checkpoints };
};

export default function EnemyControlsCamera({
  onNavigate,
}: EnemyControlsCameraProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [phase, setPhase] = useState<
    "start" | "play" | "boss" | "win" | "dead"
  >("start");
  const [tauntText, setTauntText] = useState("");

  const stateRef = useRef({
    // Player
    player: {
      x: 120,
      y: 1460,
      vx: 0,
      vy: 0,
      onGround: false,
      health: 3,
      maxHealth: 3,
      facing: 1,
    },
    spawnX: 120,
    spawnY: 1460,
    // Camera
    cam: {
      x: 0,
      y: 960,
      targetX: 0,
      targetY: 960,
      zoom: 1,
      targetZoom: 1,
      rotation: 0,
    },
    camMode: "follow" as CameraMode,
    camModeTimer: 0,
    camModeDuration: 0,
    camTauntX: 0,
    camTauntY: 0,
    // Boss
    boss: {
      x: 1200,
      y: 200,
      vx: 2,
      vy: 0,
      health: 8,
      maxHealth: 8,
      phase: 0,
      active: false,
      attackTimer: 0,
      projectiles: [] as {
        x: number;
        y: number;
        vx: number;
        vy: number;
        type: string;
      }[],
    },
    // World
    platforms: [] as Platform[],
    traps: [] as Trap[],
    checkpoints: [] as Checkpoint[],
    // Input
    keys: {} as Record<string, boolean>,
    jumpBuffer: 0,
    // Taunt
    taunts: [] as TauntMessage[],
    nextTauntTimer: 0,
    // FX
    deathFlash: 0,
    screenVignette: 0,
    // Timing
    time: 0,
    score: 0,
    invincible: 0,
    // Phase
    gamePhase: "play" as "play" | "boss" | "win" | "dead",
    // Particle effects
    particles: [] as {
      x: number;
      y: number;
      vx: number;
      vy: number;
      life: number;
      color: string;
      size: number;
    }[],
    // "Dread reveal" state
    dreadRevealTimer: 0,
    dreadRevealDuration: 0,
    dreadRevealTarget: { x: 0, y: 0 },
    // Camera aggression — increases over time
    camAggression: 0,
  });

  const initGame = useCallback(() => {
    const { platforms, traps, checkpoints } = buildWorld();
    const s = stateRef.current;
    s.player = {
      x: 120,
      y: 1460,
      vx: 0,
      vy: 0,
      onGround: false,
      health: 3,
      maxHealth: 3,
      facing: 1,
    };
    s.spawnX = 120;
    s.spawnY = 1460;
    s.cam = {
      x: 120,
      y: 1460,
      targetX: 120,
      targetY: 1460,
      zoom: 1,
      targetZoom: 1,
      rotation: 0,
    };
    s.camMode = "follow";
    s.camModeTimer = 0;
    s.camModeDuration = 4000;
    s.boss = {
      x: 1200,
      y: 200,
      vx: 2,
      vy: 0,
      health: 8,
      maxHealth: 8,
      phase: 0,
      active: false,
      attackTimer: 0,
      projectiles: [],
    };
    s.platforms = platforms;
    s.traps = traps;
    s.checkpoints = checkpoints;
    s.keys = {};
    s.taunts = [];
    s.nextTauntTimer = 3000;
    s.deathFlash = 0;
    s.screenVignette = 0;
    s.time = 0;
    s.score = 0;
    s.invincible = 0;
    s.gamePhase = "play";
    s.particles = [];
    s.dreadRevealTimer = 0;
    s.dreadRevealDuration = 0;
    s.camAggression = 0;
    setScore(0);
    setGameOver(false);
    setGameWon(false);
    setPhase("play");
    setTauntText("");
  }, []);

  const spawnParticles = (x: number, y: number, color: string, count = 8) => {
    const s = stateRef.current;
    for (let i = 0; i < count; i++) {
      const angle = (Math.PI * 2 * i) / count;
      s.particles.push({
        x,
        y,
        vx: Math.cos(angle) * (1 + Math.random() * 3),
        vy: Math.sin(angle) * (1 + Math.random() * 3),
        life: 1,
        color,
        size: 4 + Math.random() * 6,
      });
    }
  };

  const triggerTaunt = useCallback((text: string) => {
    const s = stateRef.current;
    s.taunts.push({ text, alpha: 1, y: VIEW_H / 2 - 20 });
    if (s.taunts.length > 3) s.taunts.shift();
    setTauntText(text);
  }, []);

  // ─── Camera AI decision engine ────────────────────────────────
  const updateCameraAI = (delta: number) => {
    const s = stateRef.current;
    const p = s.player;
    const cam = s.cam;

    s.camModeTimer += delta;

    // Aggression ramps over 3 minutes of play
    s.camAggression = Math.min(1, s.time / 180000);

    // ── Mode transitions ────────────────────────────────────────
    if (s.camModeTimer >= s.camModeDuration) {
      s.camModeTimer = 0;

      if (s.gamePhase === "boss") {
        // In boss fight, camera does more dramatic things
        const bossModes: CameraMode[] = [
          "follow",
          "zoom_taunt",
          "pan_away",
          "spin",
        ];
        const w = [3, 3, 3, 2];
        s.camMode = weightedRandom(bossModes, w);
        s.camModeDuration = 2000 + Math.random() * 2000;
      } else {
        // Pre-boss: aggression-scaled mode selection
        const r = Math.random();
        const aggr = s.camAggression;
        if (r < 0.3 + aggr * 0.1) s.camMode = "follow";
        else if (r < 0.45 + aggr * 0.15) s.camMode = "pan_away";
        else if (r < 0.58 + aggr * 0.1) s.camMode = "hide_trap";
        else if (r < 0.7 + aggr * 0.1) s.camMode = "reveal_dread";
        else if (r < 0.8 + aggr * 0.05) s.camMode = "zoom_taunt";
        else s.camMode = "follow";
        s.camModeDuration = 1500 + Math.random() * (3000 - aggr * 1500);
      }

      // Trigger taunt messages at key camera behaviour changes
      if (s.camMode === "pan_away") {
        triggerTaunt(TAUNTS[Math.floor(Math.random() * TAUNTS.length)]);
        s.screenVignette = 0.8;
      }
      if (s.camMode === "reveal_dread") {
        // Pick a nearby trap to reveal then hide
        const nearbyTraps = s.traps.filter(
          (t) =>
            t.active && Math.abs(t.x - p.x) < 800 && Math.abs(t.y - p.y) < 600,
        );
        if (nearbyTraps.length > 0) {
          const t = nearbyTraps[Math.floor(Math.random() * nearbyTraps.length)];
          s.dreadRevealTarget = { x: t.x, y: t.y };
          s.dreadRevealTimer = 0;
          s.dreadRevealDuration = 900 + Math.random() * 400;
        } else {
          s.camMode = "follow";
        }
      }
    }

    // ── Per-mode camera target calculation ──────────────────────
    const progress = s.camModeTimer / s.camModeDuration;

    switch (s.camMode) {
      case "follow": {
        // Standard loose follow with slight delay
        const lerpSpeed = 0.06;
        cam.targetX = p.x;
        cam.targetY = p.y;
        cam.targetZoom = 1;
        cam.x += (cam.targetX - cam.x) * lerpSpeed;
        cam.y += (cam.targetY - cam.y) * lerpSpeed;
        cam.zoom += (cam.targetZoom - cam.zoom) * 0.05;
        cam.rotation *= 0.95;
        break;
      }
      case "pan_away": {
        // Camera drifts away from player direction
        const panX =
          p.vx > 0
            ? p.x - 400 - (50 + s.camAggression * 200) // opposite to movement
            : p.x + 200 + (50 + s.camAggression * 200);
        const panY = p.y - (100 + s.camAggression * 150);
        cam.targetX = panX;
        cam.targetY = panY;
        cam.targetZoom = 0.85 - s.camAggression * 0.1;
        cam.x += (cam.targetX - cam.x) * 0.03;
        cam.y += (cam.targetY - cam.y) * 0.03;
        cam.zoom += (cam.targetZoom - cam.zoom) * 0.04;
        cam.rotation *= 0.98;
        break;
      }
      case "hide_trap": {
        // Shift camera so a dangerous trap near player is just off-screen
        const nearTrap = s.traps.find(
          (t) =>
            t.active && Math.abs(t.x - p.x) < 500 && Math.abs(t.y - p.y) < 400,
        );
        if (nearTrap) {
          // Position camera so trap is ~50px outside the viewport edge
          const offX = nearTrap.x > p.x ? -VIEW_W / 2 - 50 : VIEW_W / 2 + 50;
          cam.targetX = p.x + offX * 0.3;
          cam.targetY = p.y;
          cam.targetZoom = 0.9;
          cam.x += (cam.targetX - cam.x) * 0.04;
          cam.y += (cam.targetY - cam.y) * 0.04;
          cam.zoom += (cam.targetZoom - cam.zoom) * 0.04;
        } else {
          s.camMode = "follow";
        }
        break;
      }
      case "reveal_dread": {
        // Snap to show the danger briefly, then cut back
        s.dreadRevealTimer += delta;
        if (s.dreadRevealTimer < s.dreadRevealDuration * 0.4) {
          // Pan to the danger
          cam.targetX = s.dreadRevealTarget.x;
          cam.targetY = s.dreadRevealTarget.y;
          cam.targetZoom = 1.2;
          cam.x += (cam.targetX - cam.x) * 0.12;
          cam.y += (cam.targetY - cam.y) * 0.12;
          cam.zoom += (cam.targetZoom - cam.zoom) * 0.08;
        } else {
          // Snap immediately back to player
          cam.x = p.x;
          cam.y = p.y;
          cam.zoom = 1;
          s.camMode = "follow";
          triggerTaunt("Remember that?");
        }
        break;
      }
      case "zoom_taunt": {
        // Zoom into the enemy boss or a hazard mockingly
        const zoomTarget = s.boss.active
          ? { x: s.boss.x, y: s.boss.y }
          : s.dreadRevealTarget.x !== 0
            ? s.dreadRevealTarget
            : { x: p.x + 300, y: p.y - 200 };
        cam.targetX = zoomTarget.x;
        cam.targetY = zoomTarget.y;
        cam.targetZoom = 1.6 + s.camAggression * 0.4;
        cam.x += (cam.targetX - cam.x) * 0.08;
        cam.y += (cam.targetY - cam.y) * 0.08;
        cam.zoom += (cam.targetZoom - cam.zoom) * 0.06;
        if (progress > 0.5) {
          // Flash back to player at halfway point
          cam.targetX = p.x;
          cam.targetY = p.y;
          cam.targetZoom = 1;
        }
        break;
      }
      case "spin": {
        // Subtle rotation for disorientation
        const spinAmount = 0.08 + s.camAggression * 0.12;
        cam.rotation = Math.sin(s.camModeTimer / 600) * spinAmount;
        cam.targetX = p.x;
        cam.targetY = p.y;
        cam.targetZoom = 0.95;
        cam.x += (cam.targetX - cam.x) * 0.05;
        cam.y += (cam.targetY - cam.y) * 0.05;
        cam.zoom += (cam.targetZoom - cam.zoom) * 0.04;
        break;
      }
      case "final_battle": {
        // Lock on boss arena with slow push to show both player and boss
        const midX = (p.x + s.boss.x) / 2;
        const midY = (p.y + s.boss.y) / 2;
        cam.targetX = midX;
        cam.targetY = midY;
        cam.targetZoom = 0.85;
        cam.x += (cam.targetX - cam.x) * 0.05;
        cam.y += (cam.targetY - cam.y) * 0.05;
        cam.zoom += (cam.targetZoom - cam.zoom) * 0.03;
        cam.rotation *= 0.9;
        break;
      }
    }

    // Clamp camera to world
    const halfW = VIEW_W / 2 / cam.zoom;
    const halfH = VIEW_H / 2 / cam.zoom;
    cam.x = Math.max(halfW, Math.min(WORLD_W - halfW, cam.x));
    cam.y = Math.max(halfH, Math.min(WORLD_H - halfH, cam.y));

    // Vignette fades back
    s.screenVignette = Math.max(0, s.screenVignette - delta * 0.001);
  };

  const weightedRandom = <T,>(arr: T[], weights: number[]): T => {
    const total = weights.reduce((a, b) => a + b, 0);
    let r = Math.random() * total;
    for (let i = 0; i < arr.length; i++) {
      r -= weights[i];
      if (r <= 0) return arr[i];
    }
    return arr[arr.length - 1];
  };

  // ─── Physics helpers ──────────────────────────────────────────
  const rectOverlap = (
    ax: number,
    ay: number,
    aw: number,
    ah: number,
    bx: number,
    by: number,
    bw: number,
    bh: number,
  ) => ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;

  // ─── Main game loop ───────────────────────────────────────────
  // biome-ignore lint/correctness/useExhaustiveDependencies: game loop intentionally manages its own deps
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      stateRef.current.keys[e.key] = true;
      stateRef.current.keys[e.code] = true;
      if (
        [
          "Space",
          " ",
          "ArrowUp",
          "ArrowDown",
          "ArrowLeft",
          "ArrowRight",
        ].includes(e.key) ||
        e.code === "Space"
      ) {
        e.preventDefault();
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      stateRef.current.keys[e.key] = false;
      stateRef.current.keys[e.code] = false;
    };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    let animId: number;
    let last = performance.now();

    const loop = (now: number) => {
      const delta = Math.min(now - last, 50);
      last = now;
      const s = stateRef.current;

      if (s.gamePhase === "dead" || s.gamePhase === "win") {
        // Still render but don't update physics
        render(ctx, s);
        animId = requestAnimationFrame(loop);
        return;
      }

      s.time += delta;

      // ── Input ──────────────────────────────────────────────────
      const k = s.keys;
      const moveLeft = k.ArrowLeft || k.a || k.A;
      const moveRight = k.ArrowRight || k.d || k.D;
      const jumpPressed = k.ArrowUp || k.w || k.W || k[" "] || k.Space;

      // ── Player physics ─────────────────────────────────────────
      const p = s.player;
      const GRAVITY = 0.5;
      const SPEED = 3.8;
      const JUMP = -11;

      if (moveLeft) {
        p.vx = -SPEED;
        p.facing = -1;
      } else if (moveRight) {
        p.vx = SPEED;
        p.facing = 1;
      } else p.vx *= 0.8;

      if (jumpPressed && (p.onGround || s.jumpBuffer > 0)) {
        p.vy = JUMP;
        p.onGround = false;
        s.jumpBuffer = 0;
      }
      if (!p.onGround && s.jumpBuffer > 0) s.jumpBuffer -= delta;

      p.vy += GRAVITY;
      p.vy = Math.min(p.vy, 18);
      p.x += p.vx;
      p.y += p.vy;

      // ── Platform collision ─────────────────────────────────────
      p.onGround = false;
      for (const plat of s.platforms) {
        // Update moving platforms
        if (plat.moving) {
          plat.x += plat.dx;
          if (plat.x <= plat.minX || plat.x >= plat.maxX) plat.dx *= -1;
        }
        const pw = PLAYER_SIZE * 2;
        const ph = PLAYER_SIZE * 2;
        const px = p.x - PLAYER_SIZE;
        const py = p.y - PLAYER_SIZE;
        if (rectOverlap(px, py, pw, ph, plat.x, plat.y, plat.w, plat.h)) {
          // Resolve from top (landing)
          if (p.vy >= 0 && py + ph - p.vy <= plat.y + 2) {
            p.y = plat.y - PLAYER_SIZE;
            p.vy = 0;
            p.onGround = true;
            s.jumpBuffer = 120;
          } else if (p.vy < 0 && py - p.vy >= plat.y + plat.h - 2) {
            p.y = plat.y + plat.h + PLAYER_SIZE;
            p.vy = 0;
          } else if (p.vx > 0) {
            p.x = plat.x - PLAYER_SIZE - 1;
            p.vx = 0;
          } else if (p.vx < 0) {
            p.x = plat.x + plat.w + PLAYER_SIZE + 1;
            p.vx = 0;
          }
        }
      }

      // ── World bounds ───────────────────────────────────────────
      p.x = Math.max(PLAYER_SIZE, Math.min(WORLD_W - PLAYER_SIZE, p.x));
      if (p.y > WORLD_H + 100) {
        // Fell out of world — respawn
        playerDie("fell");
      }

      // ── Trap collision ─────────────────────────────────────────
      if (s.invincible <= 0) {
        for (const trap of s.traps) {
          if (!trap.active) continue;
          if (trap.type === "laser") {
            // Lasers toggle on/off
            trap.phase += delta * 0.002;
            const isOn = Math.sin(trap.phase) > 0;
            if (!isOn) continue;
          }
          if (
            rectOverlap(
              p.x - PLAYER_SIZE / 2,
              p.y - PLAYER_SIZE / 2,
              PLAYER_SIZE,
              PLAYER_SIZE,
              trap.x,
              trap.y,
              trap.w,
              trap.h,
            )
          ) {
            playerHit();
          }
        }
      }

      // ── Checkpoints ────────────────────────────────────────────
      for (const cp of s.checkpoints) {
        if (
          !cp.activated &&
          rectOverlap(
            p.x - PLAYER_SIZE,
            p.y - PLAYER_SIZE,
            PLAYER_SIZE * 2,
            PLAYER_SIZE * 2,
            cp.x,
            cp.y,
            30,
            50,
          )
        ) {
          cp.activated = true;
          s.spawnX = cp.x;
          s.spawnY = cp.y - PLAYER_SIZE;
          s.score += 50;
          setScore((prev) => prev + 50);
          spawnParticles(cp.x + 15, cp.y + 25, "#00ff88", 12);
          triggerTaunt("A checkpoint? How... quaint.");
        }
      }

      // ── Boss activation ────────────────────────────────────────
      if (
        !s.boss.active &&
        p.y < 300 &&
        p.x > 900 &&
        p.x < 1500 &&
        s.gamePhase !== "boss"
      ) {
        s.boss.active = true;
        s.gamePhase = "boss";
        s.camMode = "final_battle";
        s.camModeDuration = 99999;
        setPhase("boss");
        triggerTaunt("Finally. Let me show you what control looks like.");
        spawnParticles(1200, 200, "#ff0000", 24);
      }

      // ── Boss AI ────────────────────────────────────────────────
      if (s.boss.active && s.boss.health > 0) {
        const boss = s.boss;
        boss.attackTimer += delta;

        // Move boss side to side
        boss.x += boss.vx;
        if (boss.x < 920 || boss.x > 1480) boss.vx *= -1;

        // Phase 2 at half health — faster, more erratic
        if (boss.health <= boss.maxHealth / 2 && boss.phase === 0) {
          boss.phase = 1;
          boss.vx *= 1.8;
          triggerTaunt("You think you're close? I still control your view.");
          // Camera goes haywire briefly
          s.camMode = "spin";
          s.camModeDuration = 2500;
          s.camModeTimer = 0;
        }

        // Attack: fire projectiles
        const attackInterval = boss.phase === 0 ? 2000 : 1200;
        if (boss.attackTimer > attackInterval) {
          boss.attackTimer = 0;
          const dx = p.x - boss.x;
          const dy = p.y - boss.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const spd = boss.phase === 0 ? 4 : 6;
          boss.projectiles.push({
            x: boss.x,
            y: boss.y,
            vx: (dx / dist) * spd,
            vy: (dy / dist) * spd,
            type: "eyeBeam",
          });
          if (boss.phase === 1) {
            // Extra spread shots
            const angle = Math.atan2(dy, dx);
            for (const offset of [-0.4, 0.4]) {
              boss.projectiles.push({
                x: boss.x,
                y: boss.y,
                vx: Math.cos(angle + offset) * (spd * 0.8),
                vy: Math.sin(angle + offset) * (spd * 0.8),
                type: "eyeBeam",
              });
            }
          }
        }

        // Update projectiles
        boss.projectiles = boss.projectiles.filter((proj) => {
          proj.x += proj.vx;
          proj.y += proj.vy;
          // Check hit on player
          if (
            s.invincible <= 0 &&
            Math.hypot(proj.x - p.x, proj.y - p.y) < 24
          ) {
            playerHit();
            return false;
          }
          return proj.x > 800 && proj.x < 1600 && proj.y > 100 && proj.y < 500;
        });

        // Check if player hits boss (melee)
        if (
          s.invincible <= 0 &&
          Math.hypot(p.x - boss.x, p.y - boss.y) < ENEMY_BOSS_SIZE + PLAYER_SIZE
        ) {
          playerHit();
        }
      }

      // ── Camera AI update ───────────────────────────────────────
      updateCameraAI(delta);

      // ── Invincibility frames ───────────────────────────────────
      if (s.invincible > 0) s.invincible -= delta;

      // ── Taunts fade ────────────────────────────────────────────
      s.nextTauntTimer -= delta;
      if (s.nextTauntTimer <= 0) {
        s.nextTauntTimer = 6000 + Math.random() * 8000 - s.camAggression * 3000;
        const t = TAUNTS[Math.floor(Math.random() * TAUNTS.length)];
        triggerTaunt(t);
      }
      s.taunts = s.taunts
        .map((t) => ({
          ...t,
          alpha: t.alpha - delta * 0.0008,
          y: t.y - delta * 0.02,
        }))
        .filter((t) => t.alpha > 0);

      // ── Particles ──────────────────────────────────────────────
      s.particles = s.particles
        .map((pt) => ({
          ...pt,
          x: pt.x + pt.vx,
          y: pt.y + pt.vy,
          vy: pt.vy + 0.1,
          life: pt.life - delta * 0.002,
        }))
        .filter((pt) => pt.life > 0);

      // ── Render ─────────────────────────────────────────────────
      render(ctx, s);
      animId = requestAnimationFrame(loop);
    };

    function playerHit() {
      const s = stateRef.current;
      if (s.invincible > 0) return;
      s.player.health -= 1;
      s.invincible = 1200;
      s.deathFlash = 0.6;
      spawnParticles(s.player.x, s.player.y, "#ff4444", 10);
      if (s.player.health <= 0) {
        playerDie("hit");
      }
    }

    function playerDie(reason: string) {
      const s = stateRef.current;
      s.gamePhase = "dead";
      s.deathFlash = 1;
      if (
        s.score > 0 &&
        s.score > Number.parseInt(localStorage.getItem("eccHigh") || "0")
      ) {
        localStorage.setItem("eccHigh", String(s.score));
        setHighScore(s.score);
      }
      triggerTaunt(
        reason === "fell"
          ? "The void is generous."
          : "You'll try again. I'll be waiting.",
      );
      setGameOver(true);
      setPhase("dead");
    }

    animId = requestAnimationFrame(loop);
    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [triggerTaunt]);

  // ─── Render ──────────────────────────────────────────────────────
  function render(ctx: CanvasRenderingContext2D, s: typeof stateRef.current) {
    const cam = s.cam;
    const p = s.player;
    const boss = s.boss;
    const t = s.time;

    ctx.clearRect(0, 0, VIEW_W, VIEW_H);

    // ── Apply camera transform ─────────────────────────────────
    ctx.save();
    ctx.translate(VIEW_W / 2, VIEW_H / 2);
    ctx.scale(cam.zoom, cam.zoom);
    ctx.rotate(cam.rotation);
    ctx.translate(-cam.x, -cam.y);

    // ── Sky / background ──────────────────────────────────────
    const bgGrad = ctx.createLinearGradient(0, 0, 0, WORLD_H);
    bgGrad.addColorStop(0, "#0a0014");
    bgGrad.addColorStop(0.4, "#0e0020");
    bgGrad.addColorStop(1, "#1a0030");
    ctx.fillStyle = bgGrad;
    ctx.fillRect(0, 0, WORLD_W, WORLD_H);

    // Eerie background grid
    ctx.strokeStyle = "rgba(80, 0, 120, 0.25)";
    ctx.lineWidth = 1;
    for (let gx = 0; gx < WORLD_W; gx += TILE * 2) {
      ctx.beginPath();
      ctx.moveTo(gx, 0);
      ctx.lineTo(gx, WORLD_H);
      ctx.stroke();
    }
    for (let gy = 0; gy < WORLD_H; gy += TILE * 2) {
      ctx.beginPath();
      ctx.moveTo(0, gy);
      ctx.lineTo(WORLD_W, gy);
      ctx.stroke();
    }

    // Atmospheric fog patches
    for (let fi = 0; fi < 8; fi++) {
      const fx = (fi * 317) % WORLD_W;
      const fy = (fi * 211) % WORLD_H;
      const fogGrad = ctx.createRadialGradient(fx, fy, 0, fx, fy, 200);
      fogGrad.addColorStop(0, "rgba(50, 0, 80, 0.12)");
      fogGrad.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = fogGrad;
      ctx.fillRect(fx - 200, fy - 200, 400, 400);
    }

    // ── Boss arena (if boss area) ──────────────────────────────
    if (boss.active || p.y < 400) {
      // Arena background — ominous red glow
      const arenaGlow = ctx.createRadialGradient(1200, 260, 0, 1200, 260, 400);
      arenaGlow.addColorStop(0, "rgba(180, 0, 0, 0.15)");
      arenaGlow.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = arenaGlow;
      ctx.fillRect(800, 0, 800, 500);
    }

    // ── Platforms ─────────────────────────────────────────────
    for (const plat of s.platforms) {
      const isMoving = plat.moving;
      ctx.fillStyle = isMoving ? "#3a1060" : "#1e0840";
      ctx.fillRect(plat.x, plat.y, plat.w, plat.h);
      // Top edge glow
      ctx.strokeStyle = isMoving ? "#9060ff" : "#5020a0";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(plat.x, plat.y);
      ctx.lineTo(plat.x + plat.w, plat.y);
      ctx.stroke();
    }

    // ── Checkpoints ────────────────────────────────────────────
    for (const cp of s.checkpoints) {
      const cpColor = cp.activated ? "#00ff88" : "#ff8800";
      ctx.fillStyle = cpColor;
      ctx.fillRect(cp.x, cp.y, 30, 50);
      ctx.fillStyle = cp.activated ? "#00ffcc" : "#ffcc00";
      ctx.font = "bold 20px monospace";
      ctx.textAlign = "center";
      ctx.fillText("▼", cp.x + 15, cp.y + 30);
    }

    // ── Traps ─────────────────────────────────────────────────
    for (const trap of s.traps) {
      if (!trap.active) continue;
      if (trap.type === "spike") {
        ctx.fillStyle = "#cc0000";
        for (let si = 0; si < trap.w / 10; si++) {
          ctx.beginPath();
          ctx.moveTo(trap.x + si * 10, trap.y + trap.h);
          ctx.lineTo(trap.x + si * 10 + 5, trap.y);
          ctx.lineTo(trap.x + si * 10 + 10, trap.y + trap.h);
          ctx.closePath();
          ctx.fill();
        }
      } else if (trap.type === "laser") {
        const isOn = Math.sin(trap.phase) > 0;
        if (isOn) {
          ctx.fillStyle = "rgba(255, 50, 50, 0.9)";
          ctx.fillRect(trap.x, trap.y, trap.w, trap.h);
          ctx.shadowColor = "#ff0000";
          ctx.shadowBlur = 15;
          ctx.fillStyle = "rgba(255, 150, 150, 0.7)";
          ctx.fillRect(trap.x - 4, trap.y, trap.w + 8, trap.h);
          ctx.shadowBlur = 0;
        } else {
          ctx.fillStyle = "rgba(100, 0, 0, 0.3)";
          ctx.fillRect(trap.x, trap.y, trap.w, trap.h);
        }
      } else if (trap.type === "pit") {
        // Void pit — dark with downward particles
        ctx.fillStyle = "rgba(0, 0, 0, 0.9)";
        ctx.fillRect(trap.x, trap.y, trap.w, trap.h);
        ctx.strokeStyle = "#330033";
        ctx.lineWidth = 2;
        ctx.strokeRect(trap.x, trap.y, trap.w, trap.h);
      }
    }

    // ── Particles ─────────────────────────────────────────────
    for (const pt of s.particles) {
      ctx.globalAlpha = pt.life;
      ctx.fillStyle = pt.color;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, pt.size * pt.life, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;

    // ── Boss ──────────────────────────────────────────────────
    if (boss.active) {
      const bossGlow = ctx.createRadialGradient(
        boss.x,
        boss.y,
        0,
        boss.x,
        boss.y,
        ENEMY_BOSS_SIZE * 2,
      );
      bossGlow.addColorStop(0, "rgba(200, 0, 0, 0.4)");
      bossGlow.addColorStop(1, "rgba(0, 0, 0, 0)");
      ctx.fillStyle = bossGlow;
      ctx.fillRect(boss.x - 80, boss.y - 80, 160, 160);

      // Boss body — floating eye entity
      ctx.fillStyle = boss.phase === 1 ? "#cc0000" : "#880000";
      ctx.beginPath();
      ctx.arc(boss.x, boss.y, ENEMY_BOSS_SIZE, 0, Math.PI * 2);
      ctx.fill();

      // Eye iris
      ctx.fillStyle = "#ffff00";
      ctx.beginPath();
      ctx.arc(boss.x, boss.y, ENEMY_BOSS_SIZE * 0.55, 0, Math.PI * 2);
      ctx.fill();

      // Pupil tracks player
      const eyeDx = p.x - boss.x;
      const eyeDy = p.y - boss.y;
      const eyeDist = Math.sqrt(eyeDx * eyeDx + eyeDy * eyeDy);
      const pupilX = boss.x + (eyeDx / eyeDist) * (ENEMY_BOSS_SIZE * 0.25);
      const pupilY = boss.y + (eyeDy / eyeDist) * (ENEMY_BOSS_SIZE * 0.25);
      ctx.fillStyle = "#000";
      ctx.beginPath();
      ctx.arc(pupilX, pupilY, ENEMY_BOSS_SIZE * 0.28, 0, Math.PI * 2);
      ctx.fill();

      // Veins / cracks
      ctx.strokeStyle = "rgba(255, 100, 0, 0.6)";
      ctx.lineWidth = 2;
      for (let vi = 0; vi < 6; vi++) {
        const vAngle = (Math.PI * 2 * vi) / 6 + t * 0.0005;
        ctx.beginPath();
        ctx.moveTo(boss.x, boss.y);
        ctx.lineTo(
          boss.x + Math.cos(vAngle) * ENEMY_BOSS_SIZE * 1.3,
          boss.y + Math.sin(vAngle) * ENEMY_BOSS_SIZE * 1.3,
        );
        ctx.stroke();
      }

      // Projectiles
      for (const proj of boss.projectiles) {
        ctx.fillStyle = "#ff6600";
        ctx.shadowColor = "#ff0000";
        ctx.shadowBlur = 10;
        ctx.beginPath();
        ctx.arc(proj.x, proj.y, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.shadowBlur = 0;
      }

      // Boss health bar in world space
      const bhw = 120;
      const bhx = boss.x - bhw / 2;
      const bhy = boss.y - ENEMY_BOSS_SIZE - 20;
      ctx.fillStyle = "rgba(0,0,0,0.6)";
      ctx.fillRect(bhx - 2, bhy - 2, bhw + 4, 14);
      ctx.fillStyle = "#ff3300";
      ctx.fillRect(bhx, bhy, (boss.health / boss.maxHealth) * bhw, 10);
      ctx.strokeStyle = "#ff6600";
      ctx.lineWidth = 1;
      ctx.strokeRect(bhx, bhy, bhw, 10);
    }

    // ── Player ────────────────────────────────────────────────
    const flickerOff = s.invincible > 0 && Math.floor(t / 80) % 2 === 0;
    if (!flickerOff) {
      // Shadow
      ctx.fillStyle = "rgba(0, 200, 120, 0.2)";
      ctx.beginPath();
      ctx.ellipse(
        p.x,
        p.y + PLAYER_SIZE,
        PLAYER_SIZE * 0.8,
        6,
        0,
        0,
        Math.PI * 2,
      );
      ctx.fill();
      // Body
      ctx.fillStyle =
        p.health === 3 ? "#00ff88" : p.health === 2 ? "#ffcc00" : "#ff6666";
      ctx.shadowColor = p.health === 3 ? "#00ff88" : "#ff6666";
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(p.x, p.y, PLAYER_SIZE, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      // Face
      ctx.fillStyle = "#000";
      ctx.beginPath();
      ctx.arc(p.x + p.facing * 6, p.y - 4, 4, 0, Math.PI * 2);
      ctx.fill();
    }

    ctx.restore(); // End camera transform

    // ─── HUD (screen-space — never affected by camera) ────────
    renderHUD(ctx, s);
  }

  function renderHUD(
    ctx: CanvasRenderingContext2D,
    s: typeof stateRef.current,
  ) {
    const p = s.player;
    const t = s.time;

    // ── Dark vignette overlay ─────────────────────────────────
    if (s.screenVignette > 0 || s.camMode !== "follow") {
      const vigAlpha = Math.max(
        s.screenVignette,
        s.camMode === "pan_away" ? 0.3 : 0,
      );
      const vigGrad = ctx.createRadialGradient(
        VIEW_W / 2,
        VIEW_H / 2,
        VIEW_W * 0.2,
        VIEW_W / 2,
        VIEW_H / 2,
        VIEW_W * 0.9,
      );
      vigGrad.addColorStop(0, "rgba(0,0,0,0)");
      vigGrad.addColorStop(1, `rgba(0,0,0,${vigAlpha})`);
      ctx.fillStyle = vigGrad;
      ctx.fillRect(0, 0, VIEW_W, VIEW_H);
    }

    // ── Death flash ───────────────────────────────────────────
    if (s.deathFlash > 0) {
      ctx.fillStyle = `rgba(200, 0, 0, ${s.deathFlash})`;
      ctx.fillRect(0, 0, VIEW_W, VIEW_H);
      s.deathFlash = Math.max(0, s.deathFlash - 0.03);
    }

    // ── Camera mode indicator (top centre) ────────────────────
    const modeLabel = {
      follow: "",
      pan_away: "[ CAMERA PANNING AWAY ]",
      hide_trap: "[ CAMERA MANIPULATED ]",
      reveal_dread: "[ LOOK CLOSELY... ]",
      zoom_taunt: "[ TAUNTING YOU ]",
      spin: "[ DISORIENTING YOU ]",
      final_battle: "[ FINAL CONFRONTATION ]",
    }[s.camMode];
    if (modeLabel) {
      ctx.fillStyle = "rgba(0,0,0,0.5)";
      ctx.fillRect(VIEW_W / 2 - 130, 8, 260, 28);
      ctx.fillStyle = "#ff4444";
      ctx.font = "bold 13px monospace";
      ctx.textAlign = "center";
      ctx.fillText(modeLabel, VIEW_W / 2, 27);
    }

    // ── Player health (top left) ───────────────────────────────
    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.fillRect(10, 10, 160, 50);
    ctx.fillStyle = "#ccc";
    ctx.font = "12px monospace";
    ctx.textAlign = "left";
    ctx.fillText("LIVES", 16, 26);
    for (let hi = 0; hi < p.maxHealth; hi++) {
      ctx.fillStyle = hi < p.health ? "#00ff88" : "#333";
      ctx.beginPath();
      ctx.arc(24 + hi * 40, 44, 12, 0, Math.PI * 2);
      ctx.fill();
    }

    // ── Score (top right) ─────────────────────────────────────
    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.fillRect(VIEW_W - 150, 10, 140, 30);
    ctx.fillStyle = "#ffcc00";
    ctx.font = "bold 14px monospace";
    ctx.textAlign = "right";
    ctx.fillText(`SCORE: ${s.score}`, VIEW_W - 16, 30);

    // ── Camera aggression meter (bottom left) ─────────────────
    const aggrPct = s.camAggression;
    ctx.fillStyle = "rgba(0,0,0,0.6)";
    ctx.fillRect(10, VIEW_H - 44, 200, 34);
    ctx.fillStyle = "#888";
    ctx.font = "11px monospace";
    ctx.textAlign = "left";
    ctx.fillText("ENEMY CONTROL", 14, VIEW_H - 28);
    ctx.fillStyle = "#220022";
    ctx.fillRect(14, VIEW_H - 20, 188, 10);
    const aggrColor =
      aggrPct < 0.4 ? "#8800cc" : aggrPct < 0.7 ? "#cc0066" : "#ff0000";
    ctx.fillStyle = aggrColor;
    ctx.fillRect(14, VIEW_H - 20, 188 * aggrPct, 10);

    // ── Taunts ────────────────────────────────────────────────
    for (const taunt of s.taunts) {
      ctx.globalAlpha = taunt.alpha;
      ctx.fillStyle = "rgba(0,0,0,0.5)";
      const tw = ctx.measureText(taunt.text).width + 24;
      ctx.fillRect(VIEW_W / 2 - tw / 2, taunt.y - 16, tw, 24);
      ctx.fillStyle = "rgba(220, 160, 255, 1)";
      ctx.font = "italic 15px serif";
      ctx.textAlign = "center";
      ctx.fillText(`"${taunt.text}"`, VIEW_W / 2, taunt.y);
    }
    ctx.globalAlpha = 1;

    // ── Boss health bar (screen bottom centre, only in boss phase) ─
    if (s.boss.active && s.boss.health > 0) {
      ctx.fillStyle = "rgba(0,0,0,0.7)";
      ctx.fillRect(VIEW_W / 2 - 150, VIEW_H - 34, 300, 24);
      ctx.fillStyle = "#ff3300";
      ctx.fillRect(
        VIEW_W / 2 - 148,
        VIEW_H - 32,
        (s.boss.health / s.boss.maxHealth) * 296,
        20,
      );
      ctx.strokeStyle = "#ff6600";
      ctx.lineWidth = 1;
      ctx.strokeRect(VIEW_W / 2 - 148, VIEW_H - 32, 296, 20);
      ctx.fillStyle = "#fff";
      ctx.font = "bold 12px monospace";
      ctx.textAlign = "center";
      ctx.fillText("THE EYE — CONTROLLER OF CAMERAS", VIEW_W / 2, VIEW_H - 17);
    }

    // ── Boss hit flash (player input to attack) ───────────────
    if (s.boss.active && s.boss.health > 0) {
      ctx.fillStyle = "rgba(0,0,0,0.5)";
      ctx.fillRect(10, VIEW_H / 2 - 10, 200, 22);
      ctx.fillStyle = "#ffcc00";
      ctx.font = "11px monospace";
      ctx.textAlign = "left";
      ctx.fillText("[SPACE] = ATTACK BOSS", 14, VIEW_H / 2 + 5);
    }

    // ── Win screen ────────────────────────────────────────────
    if (s.gamePhase === "win") {
      ctx.fillStyle = "rgba(0,0,20, 0.88)";
      ctx.fillRect(0, 0, VIEW_W, VIEW_H);
      ctx.fillStyle = "#00ff88";
      ctx.font = "bold 36px monospace";
      ctx.textAlign = "center";
      ctx.fillText("YOU ESCAPED THE CAMERA", VIEW_W / 2, VIEW_H / 2 - 40);
      ctx.fillStyle = "#ccc";
      ctx.font = "16px monospace";
      ctx.fillText(
        "The Eye is defeated. You saw through the manipulation.",
        VIEW_W / 2,
        VIEW_H / 2 + 10,
      );
      ctx.fillStyle = "#ffcc00";
      ctx.font = "bold 20px monospace";
      ctx.fillText(`FINAL SCORE: ${s.score}`, VIEW_W / 2, VIEW_H / 2 + 50);
    }

    // ── Death screen ──────────────────────────────────────────
    if (s.gamePhase === "dead") {
      ctx.fillStyle = "rgba(20, 0, 0, 0.85)";
      ctx.fillRect(0, 0, VIEW_W, VIEW_H);
      ctx.fillStyle = "#ff4444";
      ctx.font = "bold 32px monospace";
      ctx.textAlign = "center";
      ctx.fillText("THE EYE WINS", VIEW_W / 2, VIEW_H / 2 - 40);
      ctx.fillStyle = "#ccc";
      ctx.font = "italic 15px serif";
      ctx.fillText('"Predictable to the last."', VIEW_W / 2, VIEW_H / 2);
      ctx.fillStyle = "#888";
      ctx.font = "14px monospace";
      ctx.fillText("Press RESTART to try again", VIEW_W / 2, VIEW_H / 2 + 40);
      ctx.fillStyle = "#ffcc00";
      ctx.font = "bold 16px monospace";
      ctx.fillText(`SCORE: ${s.score}`, VIEW_W / 2, VIEW_H / 2 + 70);
    }

    // ── Scanline overlay — claustrophobic aesthetic ────────────
    ctx.globalAlpha = 0.04;
    ctx.fillStyle = "#000";
    for (let sl = 0; sl < VIEW_H; sl += 4) {
      ctx.fillRect(0, sl, VIEW_W, 2);
    }
    ctx.globalAlpha = 1;

    // ── Breathing border — pulses when camera mode is hostile ─
    const borderPulse =
      s.camMode !== "follow" && s.camMode !== "final_battle"
        ? 0.5 + 0.5 * Math.sin(t * 0.004)
        : 0.2;
    ctx.strokeStyle = `rgba(100, 0, 160, ${borderPulse})`;
    ctx.lineWidth = 4;
    ctx.strokeRect(2, 2, VIEW_W - 4, VIEW_H - 4);
  }

  // ─── Boss attack via spacebar ─────────────────────────────────
  // biome-ignore lint/correctness/useExhaustiveDependencies: game loop intentionally manages its own deps
  useEffect(() => {
    const handleAttack = (e: KeyboardEvent) => {
      if (e.code !== "Space" && e.key !== " ") return;
      const s = stateRef.current;
      if (s.gamePhase !== "boss") return;
      if (s.boss.health <= 0) return;
      const dist = Math.hypot(s.player.x - s.boss.x, s.player.y - s.boss.y);
      if (dist < ENEMY_BOSS_SIZE + PLAYER_SIZE + 20) {
        s.boss.health -= 1;
        s.score += 100;
        setScore((prev) => prev + 100);
        spawnParticles(s.boss.x, s.boss.y, "#ff8800", 14);
        // Camera reacts — jolts to player briefly
        s.cam.x = s.player.x;
        s.cam.y = s.player.y;
        if (s.boss.health <= 0) {
          s.gamePhase = "win";
          s.score += 500;
          setScore((prev) => prev + 500);
          setGameWon(true);
          setPhase("win");
          const newScore = s.score;
          const prev = Number.parseInt(localStorage.getItem("eccHigh") || "0");
          if (newScore > prev) {
            localStorage.setItem("eccHigh", String(newScore));
            setHighScore(newScore);
          }
        } else {
          // Boss taunts when hit
          const hits = s.boss.maxHealth - s.boss.health;
          const bossTaunts = [
            "A hit? Lucky.",
            "You got close. I allowed it.",
            "That... actually hurt.",
            "More. Show me more.",
            "Fine. I'll stop playing gently.",
          ];
          triggerTaunt(bossTaunts[Math.min(hits - 1, bossTaunts.length - 1)]);
        }
      }
    };
    window.addEventListener("keydown", handleAttack);
    return () => window.removeEventListener("keydown", handleAttack);
  }, [triggerTaunt]);

  // Load high score
  useEffect(() => {
    const saved = Number.parseInt(localStorage.getItem("eccHigh") || "0");
    setHighScore(saved);
    initGame();
  }, [initGame]);

  const handleRestart = () => {
    initGame();
  };

  return (
    <GameLayout
      title="Enemy Controls the Camera 👁"
      score={score}
      highScore={highScore}
      onRestart={handleRestart}
      onNavigate={onNavigate}
      gameOver={gameOver || gameWon}
    >
      <div className="flex flex-col items-center justify-center bg-black p-2">
        {phase === "start" ? (
          <div className="text-center text-white p-8 max-w-xl">
            <h2 className="text-3xl font-bold text-red-400 mb-4">
              Enemy Controls the Camera
            </h2>
            <p className="text-gray-300 mb-4 italic">
              You navigate. The enemy decides what you see.
            </p>
            <p className="text-sm text-gray-400">
              Arrow keys / WASD to move. Space to jump and attack the boss.
              <br />
              Reach the top. Defeat The Eye. Escape the camera.
            </p>
          </div>
        ) : null}
        {phase === "boss" ? (
          <div className="text-xs text-red-400 font-mono mb-1 animate-pulse">
            THE EYE — get close and press SPACE to attack
          </div>
        ) : null}
        <canvas
          ref={canvasRef}
          width={VIEW_W}
          height={VIEW_H}
          className="rounded border-2 border-purple-900"
          style={{ imageRendering: "pixelated" }}
        />
        <div className="mt-2 text-xs text-gray-500 font-mono text-center">
          ARROW KEYS / WASD — move &nbsp;|&nbsp; SPACE — jump / attack boss
          &nbsp;|&nbsp; Camera: {tauntText ? `"${tauntText}"` : "watching..."}
        </div>
      </div>
    </GameLayout>
  );
}
