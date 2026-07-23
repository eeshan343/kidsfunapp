import { useCallback, useEffect, useRef, useState } from "react";
import type { ModulePage } from "../../App";

interface Props {
  onNavigate: (page: ModulePage) => void;
}

// ──────────────────────────────────────────────────────────────
// TYPES
// ──────────────────────────────────────────────────────────────
type GameScreen = "start" | "playing" | "dead" | "levelComplete" | "win";

interface Rect {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface Player {
  x: number; // world space
  y: number;
  vx: number;
  vy: number;
  onGround: boolean;
  onPlatformId: number | null;
  checkpointX: number;
  checkpointY: number;
  deathCount: number;
}

interface Enemy {
  x: number;
  y: number;
  w: number;
  h: number;
  minX: number;
  maxX: number;
  speed: number;
  dir: number;
}

interface Spike {
  x: number;
  y: number;
  w: number;
  h: number;
}

interface MovingPlatform {
  id: number;
  x: number;
  y: number;
  w: number;
  h: number;
  baseX: number;
  baseY: number;
  rangeX: number;
  rangeY: number;
  speed: number;
  phase: number; // 0..1
  axis: "x" | "y";
}

interface Laser {
  x: number;
  y: number;
  w: number;
  active: boolean;
  timer: number;
  cycleOn: number;
  cycleOff: number;
}

interface Checkpoint {
  x: number;
  y: number;
  w: number;
  h: number;
  reached: boolean;
  pulsePhase: number;
}

interface LevelDef {
  worldWidth: number;
  floors: Rect[];
  platforms: Rect[];
  movingPlatforms: Omit<MovingPlatform, "id" | "phase">[];
  enemies: Omit<Enemy, "dir">[];
  spikes: Spike[];
  lasers: Omit<Laser, "active" | "timer">[];
  checkpoints: Omit<Checkpoint, "reached" | "pulsePhase">[];
  goalX: number;
  goalY: number;
  playerStartX: number;
  playerStartY: number;
}

// ──────────────────────────────────────────────────────────────
// LEVEL DEFINITIONS
// ──────────────────────────────────────────────────────────────
const LEVELS: LevelDef[] = [
  // LEVEL 1 — Learn the Blink
  {
    worldWidth: 1200,
    playerStartX: 60,
    playerStartY: 310,
    floors: [{ x: 0, y: 355, w: 1200, h: 45 }],
    platforms: [
      { x: 280, y: 280, w: 120, h: 14 },
      { x: 500, y: 255, w: 100, h: 14 },
      { x: 700, y: 270, w: 120, h: 14 },
    ],
    movingPlatforms: [],
    enemies: [
      { x: 120, y: 327, w: 18, h: 18, minX: 100, maxX: 230, speed: 70 },
      { x: 450, y: 327, w: 18, h: 18, minX: 420, maxX: 560, speed: 80 },
      { x: 780, y: 327, w: 18, h: 18, minX: 740, maxX: 920, speed: 90 },
    ],
    spikes: [
      { x: 320, y: 339, w: 16, h: 16 },
      { x: 600, y: 339, w: 16, h: 16 },
      { x: 660, y: 339, w: 16, h: 16 },
    ],
    lasers: [],
    checkpoints: [{ x: 590, y: 315, w: 8, h: 40 }],
    goalX: 1140,
    goalY: 290,
  },
  // LEVEL 2 — The Platform Problem
  {
    worldWidth: 1600,
    playerStartX: 60,
    playerStartY: 310,
    floors: [
      { x: 0, y: 355, w: 300, h: 45 },
      { x: 700, y: 355, w: 200, h: 45 },
      { x: 1300, y: 355, w: 300, h: 45 },
    ],
    platforms: [
      { x: 200, y: 290, w: 100, h: 14 },
      { x: 900, y: 290, w: 100, h: 14 },
      { x: 1100, y: 260, w: 100, h: 14 },
      { x: 1200, y: 290, w: 80, h: 14 },
    ],
    movingPlatforms: [
      {
        x: 350,
        y: 300,
        w: 90,
        h: 14,
        baseX: 350,
        baseY: 300,
        rangeX: 120,
        rangeY: 0,
        speed: 0.6,
        axis: "x",
      },
      {
        x: 550,
        y: 280,
        w: 90,
        h: 14,
        baseX: 550,
        baseY: 280,
        rangeX: 130,
        rangeY: 0,
        speed: 0.5,
        axis: "x",
      },
      {
        x: 800,
        y: 270,
        w: 90,
        h: 14,
        baseX: 800,
        baseY: 270,
        rangeX: 0,
        rangeY: 60,
        speed: 0.8,
        axis: "y",
      },
      {
        x: 1050,
        y: 310,
        w: 90,
        h: 14,
        baseX: 1050,
        baseY: 310,
        rangeX: 100,
        rangeY: 0,
        speed: 0.7,
        axis: "x",
      },
    ],
    enemies: [
      { x: 120, y: 327, w: 18, h: 18, minX: 60, maxX: 240, speed: 80 },
      { x: 750, y: 327, w: 18, h: 18, minX: 700, maxX: 880, speed: 90 },
      { x: 1350, y: 327, w: 18, h: 18, minX: 1310, maxX: 1560, speed: 100 },
    ],
    spikes: [
      { x: 290, y: 339, w: 16, h: 16 },
      { x: 490, y: 339, w: 16, h: 16 },
      { x: 510, y: 339, w: 16, h: 16 },
      { x: 970, y: 339, w: 16, h: 16 },
      { x: 990, y: 339, w: 16, h: 16 },
      { x: 1250, y: 339, w: 16, h: 16 },
    ],
    lasers: [],
    checkpoints: [{ x: 700, y: 315, w: 8, h: 40 }],
    goalX: 1540,
    goalY: 280,
  },
  // LEVEL 3 — Full Blackout
  {
    worldWidth: 2000,
    playerStartX: 60,
    playerStartY: 310,
    floors: [
      { x: 0, y: 355, w: 400, h: 45 },
      { x: 600, y: 355, w: 300, h: 45 },
      { x: 1100, y: 355, w: 300, h: 45 },
      { x: 1600, y: 355, w: 400, h: 45 },
    ],
    platforms: [
      { x: 300, y: 290, w: 100, h: 14 },
      { x: 700, y: 285, w: 90, h: 14 },
      { x: 1000, y: 280, w: 100, h: 14 },
      { x: 1300, y: 290, w: 100, h: 14 },
      { x: 1500, y: 270, w: 90, h: 14 },
    ],
    movingPlatforms: [
      {
        x: 420,
        y: 300,
        w: 90,
        h: 14,
        baseX: 420,
        baseY: 300,
        rangeX: 120,
        rangeY: 0,
        speed: 0.7,
        axis: "x",
      },
      {
        x: 850,
        y: 290,
        w: 90,
        h: 14,
        baseX: 850,
        baseY: 290,
        rangeX: 0,
        rangeY: 70,
        speed: 1.0,
        axis: "y",
      },
      {
        x: 1180,
        y: 300,
        w: 90,
        h: 14,
        baseX: 1180,
        baseY: 300,
        rangeX: 110,
        rangeY: 0,
        speed: 0.8,
        axis: "x",
      },
      {
        x: 1430,
        y: 310,
        w: 90,
        h: 14,
        baseX: 1430,
        baseY: 310,
        rangeX: 0,
        rangeY: 80,
        speed: 0.9,
        axis: "y",
      },
    ],
    enemies: [
      { x: 150, y: 327, w: 18, h: 18, minX: 60, maxX: 360, speed: 90 },
      { x: 660, y: 327, w: 18, h: 18, minX: 620, maxX: 860, speed: 100 },
      { x: 1150, y: 327, w: 18, h: 18, minX: 1110, maxX: 1370, speed: 110 },
      { x: 1700, y: 327, w: 18, h: 18, minX: 1620, maxX: 1950, speed: 100 },
    ],
    spikes: [
      { x: 400, y: 339, w: 16, h: 16 },
      { x: 560, y: 339, w: 16, h: 16 },
      { x: 580, y: 339, w: 16, h: 16 },
      { x: 910, y: 339, w: 16, h: 16 },
      { x: 1080, y: 339, w: 16, h: 16 },
      { x: 1400, y: 339, w: 16, h: 16 },
      { x: 1570, y: 339, w: 16, h: 16 },
    ],
    lasers: [
      { x: 450, y: 300, w: 120, cycleOn: 1.2, cycleOff: 1.2 },
      { x: 930, y: 280, w: 100, cycleOn: 0.8, cycleOff: 1.5 },
      { x: 1440, y: 295, w: 130, cycleOn: 1.0, cycleOff: 1.0 },
    ],
    checkpoints: [
      { x: 590, y: 315, w: 8, h: 40 },
      { x: 1090, y: 315, w: 8, h: 40 },
    ],
    goalX: 1940,
    goalY: 280,
  },
];

// ──────────────────────────────────────────────────────────────
// HELPERS
// ──────────────────────────────────────────────────────────────
const GRAVITY = 800;
const MAX_FALL = 500;
const MOVE_SPEED = 160;
const JUMP_IMPULSE = -340;
const PLAYER_W = 20;
const PLAYER_H = 28;
const BLINK_MAX_MS = 1500;

function overlaps(
  ax: number,
  ay: number,
  aw: number,
  ah: number,
  bx: number,
  by: number,
  bw: number,
  bh: number,
): boolean {
  return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
}

function clamp(v: number, lo: number, hi: number): number {
  return Math.max(lo, Math.min(hi, v));
}

// ──────────────────────────────────────────────────────────────
// AUDIO HELPERS
// ──────────────────────────────────────────────────────────────
let audioCtx: AudioContext | null = null;

function getAudioCtx(): AudioContext | null {
  try {
    if (!audioCtx) {
      audioCtx = new (
        window.AudioContext ||
        (window as unknown as { webkitAudioContext: typeof AudioContext })
          .webkitAudioContext
      )();
    }
    return audioCtx;
  } catch {
    return null;
  }
}

function playBlinkIn() {
  try {
    const ctx = getAudioCtx();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.value = 80;
    osc.type = "sine";
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.08);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.08);
  } catch {
    /* silent */
  }
}

function playBlinkOut() {
  try {
    const ctx = getAudioCtx();
    if (!ctx) return;
    const bufferSize = ctx.sampleRate * 0.02;
    const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
    const source = ctx.createBufferSource();
    source.buffer = buffer;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(0.2, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.02);
    source.connect(gain);
    gain.connect(ctx.destination);
    source.start(ctx.currentTime);
  } catch {
    /* silent */
  }
}

function playDeath() {
  try {
    const ctx = getAudioCtx();
    if (!ctx) return;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.frequency.setValueAtTime(400, ctx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(80, ctx.currentTime + 0.2);
    gain.gain.setValueAtTime(0.3, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
    osc.start(ctx.currentTime);
    osc.stop(ctx.currentTime + 0.2);
  } catch {
    /* silent */
  }
}

function playCheckpoint() {
  try {
    const ctx = getAudioCtx();
    if (!ctx) return;
    const freqs = [523, 659, 784];
    freqs.forEach((freq, i) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = freq;
      const t = ctx.currentTime + i * 0.05;
      gain.gain.setValueAtTime(0.15, t);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.12);
      osc.start(t);
      osc.stop(t + 0.12);
    });
  } catch {
    /* silent */
  }
}

// ──────────────────────────────────────────────────────────────
// CANVAS DRAWING HELPERS
// ──────────────────────────────────────────────────────────────
function drawEye(
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  openness: number,
  size: number,
) {
  ctx.save();
  // eye outline (almond)
  ctx.beginPath();
  const hw = size;
  const hh = size * 0.55 * openness + 1;
  ctx.ellipse(cx, cy, hw, Math.max(hh, 1), 0, 0, Math.PI * 2);
  ctx.strokeStyle = "rgba(255,255,255,0.8)";
  ctx.lineWidth = 1.5;
  ctx.stroke();
  if (openness > 0.15) {
    // iris
    ctx.beginPath();
    ctx.arc(cx, cy, size * 0.35 * openness, 0, Math.PI * 2);
    ctx.fillStyle = "rgba(0,200,200,0.9)";
    ctx.fill();
    // pupil
    ctx.beginPath();
    ctx.arc(cx, cy, size * 0.15 * openness, 0, Math.PI * 2);
    ctx.fillStyle = "#000";
    ctx.fill();
  } else {
    // closed — draw a line
    ctx.beginPath();
    ctx.moveTo(cx - hw, cy);
    ctx.lineTo(cx + hw, cy);
    ctx.strokeStyle = "rgba(255,255,255,0.6)";
    ctx.lineWidth = 2;
    ctx.stroke();
  }
  ctx.restore();
}

function drawSpike(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  w: number,
  h: number,
) {
  ctx.beginPath();
  ctx.moveTo(x, y + h);
  ctx.lineTo(x + w / 2, y);
  ctx.lineTo(x + w, y + h);
  ctx.closePath();
  ctx.fillStyle = "#ffffff";
  ctx.fill();
}

function drawGoal(
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  t: number,
) {
  const pulse = 0.7 + 0.3 * Math.sin(t * 3);
  ctx.save();
  // glow
  ctx.shadowColor = "rgba(255,255,255,0.8)";
  ctx.shadowBlur = 12 * pulse;
  // door shape
  ctx.fillStyle = `rgba(255,255,255,${0.6 + 0.3 * pulse})`;
  ctx.fillRect(x, y, 26, 40);
  // arch
  ctx.beginPath();
  ctx.arc(x + 13, y, 13, Math.PI, 0);
  ctx.fillStyle = `rgba(255,255,255,${0.6 + 0.3 * pulse})`;
  ctx.fill();
  ctx.restore();
}

function drawCheckpoint(ctx: CanvasRenderingContext2D, cp: Checkpoint) {
  const pulse = 0.5 + 0.5 * Math.sin(cp.pulsePhase);
  ctx.save();
  ctx.shadowColor = cp.reached
    ? "rgba(0,255,238,0.9)"
    : "rgba(255,255,255,0.5)";
  ctx.shadowBlur = 8 * pulse;
  ctx.fillStyle = cp.reached
    ? `rgba(0,255,238,${0.6 + 0.3 * pulse})`
    : `rgba(200,200,200,${0.4 + 0.3 * pulse})`;
  ctx.fillRect(cp.x, cp.y, cp.w, cp.h);
  ctx.restore();
}

// ──────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ──────────────────────────────────────────────────────────────
export default function YouCanOnlyMoveWhenYouBlink({ onNavigate }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [gameScreen, setGameScreen] = useState<GameScreen>("start");
  const [deathCount, setDeathCount] = useState(0);
  const [_currentLevel, setCurrentLevel] = useState(1);

  // ── Mutable game state in refs ──
  const keys = useRef<Set<string>>(new Set());
  const rafId = useRef<number>(0);
  const lastTime = useRef<number>(0);
  const totalTime = useRef<number>(0);

  // Blink state
  const blinkState = useRef<{
    isBlinking: boolean;
    opacity: number; // 0 = transparent, 1 = full black
    spaceDown: boolean;
    spaceDownAt: number;
    spaceUpAt: number;
    blinkCharge: number; // ms remaining (max BLINK_MAX_MS)
    blinkElapsed: number; // ms elapsed in current hold blink
    tapBlink: boolean;
    tapBlinkTimer: number;
    eyeOpenness: number; // 0..1 lerp target
    eyeOpennessActual: number;
  }>({
    isBlinking: false,
    opacity: 0,
    spaceDown: false,
    spaceDownAt: 0,
    spaceUpAt: 0,
    blinkCharge: BLINK_MAX_MS,
    blinkElapsed: 0,
    tapBlink: false,
    tapBlinkTimer: 0,
    eyeOpenness: 1,
    eyeOpennessActual: 1,
  });

  // Player state
  const player = useRef<Player>({
    x: 60,
    y: 310,
    vx: 0,
    vy: 0,
    onGround: false,
    onPlatformId: null,
    checkpointX: 60,
    checkpointY: 310,
    deathCount: 0,
  });

  // Level entities (rebuilt each level)
  const enemies = useRef<Enemy[]>([]);
  const spikes = useRef<Spike[]>([]);
  const movingPlatforms = useRef<MovingPlatform[]>([]);
  const lasers = useRef<Laser[]>([]);
  const checkpoints = useRef<Checkpoint[]>([]);
  const floors = useRef<Rect[]>([]);
  const platforms = useRef<Rect[]>([]);
  const worldWidth = useRef<number>(1200);
  const goalRef = useRef<{ x: number; y: number }>({ x: 1140, y: 290 });
  const levelRef = useRef<number>(1);
  const deathRef = useRef<number>(0);
  const gameScreenRef = useRef<GameScreen>("start");
  const deadTimerRef = useRef<number>(0);
  const levelCompleteTimerRef = useRef<number>(0);

  // ── Build level ──
  const buildLevel = useCallback((lvlIndex: number) => {
    const def = LEVELS[lvlIndex];
    worldWidth.current = def.worldWidth;
    goalRef.current = { x: def.goalX, y: def.goalY };
    floors.current = def.floors;
    platforms.current = def.platforms;
    movingPlatforms.current = def.movingPlatforms.map((mp, i) => ({
      ...mp,
      id: i + 1,
      phase: 0,
    }));
    enemies.current = def.enemies.map((e) => ({ ...e, dir: 1 }));
    spikes.current = def.spikes;
    lasers.current = def.lasers.map((l) => ({ ...l, active: true, timer: 0 }));
    checkpoints.current = def.checkpoints.map((cp) => ({
      ...cp,
      reached: false,
      pulsePhase: 0,
    }));

    player.current.x = def.playerStartX;
    player.current.y = def.playerStartY;
    player.current.vx = 0;
    player.current.vy = 0;
    player.current.onGround = false;
    player.current.onPlatformId = null;
    player.current.checkpointX = def.playerStartX;
    player.current.checkpointY = def.playerStartY;
  }, []);

  // ── Respawn ──
  const respawn = useCallback(() => {
    player.current.x = player.current.checkpointX;
    player.current.y = player.current.checkpointY;
    player.current.vx = 0;
    player.current.vy = 0;
    player.current.onGround = false;
    player.current.onPlatformId = null;
    blinkState.current.isBlinking = false;
    blinkState.current.opacity = 0;
    blinkState.current.tapBlink = false;
    blinkState.current.tapBlinkTimer = 0;
    blinkState.current.eyeOpenness = 1;
    blinkState.current.eyeOpennessActual = 1;
    blinkState.current.blinkCharge = BLINK_MAX_MS;
  }, []);

  // ── Die ──
  const die = useCallback(() => {
    if (gameScreenRef.current !== "playing") return;
    playDeath();
    deathRef.current += 1;
    setDeathCount(deathRef.current);
    deadTimerRef.current = 0.8;
    gameScreenRef.current = "dead";
    setGameScreen("dead");
  }, []);

  // ── Game loop ──
  const gameLoop = useCallback(
    (timestamp: number) => {
      rafId.current = requestAnimationFrame(gameLoop);
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext("2d");
      if (!ctx) return;

      const dt = Math.min(
        (timestamp - (lastTime.current || timestamp)) / 1000,
        0.05,
      );
      lastTime.current = timestamp;
      totalTime.current += dt;
      const t = totalTime.current;

      const CW = canvas.width;
      const CH = canvas.height;

      // ── BLINK LOGIC ──
      const bs = blinkState.current;
      const spaceHeld = keys.current.has("Space");

      if (gameScreenRef.current === "playing") {
        if (spaceHeld && !bs.spaceDown) {
          // Space just pressed
          bs.spaceDown = true;
          bs.spaceDownAt = t;
          // Will decide tap vs hold after release (or after threshold)
          playBlinkIn();
        }
        if (!spaceHeld && bs.spaceDown) {
          // Space just released
          const held = t - bs.spaceDownAt;
          bs.spaceDown = false;
          if (held < 0.18) {
            // Tap blink
            bs.tapBlink = true;
            bs.tapBlinkTimer = 0.2;
          }
          playBlinkOut();
        }

        // Tap blink timer
        if (bs.tapBlink) {
          bs.tapBlinkTimer -= dt;
          if (bs.tapBlinkTimer <= 0) {
            bs.tapBlink = false;
            bs.tapBlinkTimer = 0;
          }
        }

        // Determine if currently blinking
        const holdBlink =
          spaceHeld && bs.spaceDown && t - bs.spaceDownAt >= 0.18;
        bs.isBlinking = bs.tapBlink || holdBlink;

        // Opacity for overlay
        if (bs.tapBlink) {
          bs.opacity = 1.0; // instant full black
        } else if (holdBlink) {
          const elapsed = t - bs.spaceDownAt - 0.18;
          // Fade in over 80ms
          bs.opacity = clamp(elapsed / 0.08, 0, 1);
          // Blink charge depletion
          bs.blinkElapsed += dt;
          bs.blinkCharge = Math.max(0, BLINK_MAX_MS - bs.blinkElapsed * 1000);
          if (bs.blinkCharge <= 0) {
            // Force end blink
            keys.current.delete("Space");
          }
        } else {
          if (bs.spaceDown) {
            // Held but in tap zone — don't blink yet
            bs.opacity = 0;
          } else if (!bs.tapBlink) {
            // Fading out: after hold blink released, fade over 80ms
            bs.opacity = Math.max(0, bs.opacity - dt / 0.08);
          }
          bs.blinkElapsed = 0;
          bs.blinkCharge = Math.min(
            BLINK_MAX_MS,
            bs.blinkCharge + dt * 1000 * 0.7,
          );
        }

        // Eye openness target
        bs.eyeOpenness = bs.isBlinking ? 0 : 1;
        bs.eyeOpennessActual +=
          (bs.eyeOpenness - bs.eyeOpennessActual) * Math.min(1, dt * 15);
      } else {
        bs.isBlinking = false;
        bs.opacity = 0;
        bs.eyeOpenness = 1;
        bs.eyeOpennessActual = 1;
      }

      // ── PHYSICS (always runs) ──
      if (gameScreenRef.current === "playing") {
        const p = player.current;

        // Movement — only during blink
        if (bs.isBlinking) {
          const left =
            keys.current.has("ArrowLeft") || keys.current.has("KeyA");
          const right =
            keys.current.has("ArrowRight") || keys.current.has("KeyD");
          const up = keys.current.has("ArrowUp") || keys.current.has("KeyW");
          if (left) p.vx = -MOVE_SPEED;
          else if (right) p.vx = MOVE_SPEED;
          else p.vx = 0;
          if (up && p.onGround) {
            p.vy = JUMP_IMPULSE;
            p.onGround = false;
          }
        } else {
          p.vx = 0;
        }

        // Gravity always applies
        p.vy = Math.min(p.vy + GRAVITY * dt, MAX_FALL);

        // Update moving platforms
        for (const mp of movingPlatforms.current) {
          mp.phase += mp.speed * dt;
          const sine = Math.sin(mp.phase * Math.PI * 2);
          if (mp.axis === "x") {
            const newX = mp.baseX + (sine * mp.rangeX) / 2;
            const dx = newX - mp.x;
            mp.x = newX;
            if (p.onPlatformId === mp.id) p.x += dx;
          } else {
            const newY = mp.baseY + (sine * mp.rangeY) / 2;
            const dy = newY - mp.y;
            mp.y = newY;
            if (p.onPlatformId === mp.id) p.y += dy;
          }
        }

        // Move player X
        p.x += p.vx * dt;
        p.x = clamp(p.x, 0, worldWidth.current - PLAYER_W);

        // Horizontal collision with solid floors/platforms
        const allSolids = [
          ...floors.current,
          ...platforms.current,
          ...movingPlatforms.current.map((mp) => ({
            x: mp.x,
            y: mp.y,
            w: mp.w,
            h: mp.h,
          })),
        ];
        for (const s of allSolids) {
          if (overlaps(p.x, p.y, PLAYER_W, PLAYER_H, s.x, s.y, s.w, s.h)) {
            if (p.vx > 0) p.x = s.x - PLAYER_W;
            else if (p.vx < 0) p.x = s.x + s.w;
            p.vx = 0;
          }
        }

        // Move player Y
        p.y += p.vy * dt;
        p.onGround = false;
        p.onPlatformId = null;

        // Vertical collision
        for (const s of allSolids) {
          if (overlaps(p.x, p.y, PLAYER_W, PLAYER_H, s.x, s.y, s.w, s.h)) {
            if (p.vy > 0) {
              p.y = s.y - PLAYER_H;
              p.vy = 0;
              p.onGround = true;
              // Check if it's a moving platform
              for (const mp of movingPlatforms.current) {
                if (s.x === mp.x && s.y === mp.y) {
                  p.onPlatformId = mp.id;
                  break;
                }
              }
            } else if (p.vy < 0) {
              p.y = s.y + s.h;
              p.vy = 0;
            }
          }
        }

        // Kill if fall off
        if (p.y > 420) {
          die();
          return;
        }

        // Update laser timers
        for (const laser of lasers.current) {
          laser.timer += dt;
          const cycle = laser.active ? laser.cycleOn : laser.cycleOff;
          if (laser.timer >= cycle) {
            laser.timer = 0;
            laser.active = !laser.active;
          }
        }

        // Update enemy patrol
        for (const enemy of enemies.current) {
          enemy.x += enemy.speed * enemy.dir * dt;
          if (enemy.x <= enemy.minX) {
            enemy.x = enemy.minX;
            enemy.dir = 1;
          }
          if (enemy.x + enemy.w >= enemy.maxX) {
            enemy.x = enemy.maxX - enemy.w;
            enemy.dir = -1;
          }
        }

        // Update checkpoint pulse
        for (const cp of checkpoints.current) {
          cp.pulsePhase += dt * 3;
        }

        // ── COLLISION DETECTION ──
        // Enemies
        for (const enemy of enemies.current) {
          if (
            overlaps(
              p.x,
              p.y,
              PLAYER_W,
              PLAYER_H,
              enemy.x,
              enemy.y,
              enemy.w,
              enemy.h,
            )
          ) {
            die();
            return;
          }
        }
        // Spikes
        for (const spike of spikes.current) {
          const sx = spike.x;
          const sy = spike.y + 4;
          const sw = spike.w;
          const sh = spike.h - 4;
          if (overlaps(p.x, p.y, PLAYER_W, PLAYER_H, sx, sy, sw, sh)) {
            die();
            return;
          }
        }
        // Lasers
        for (const laser of lasers.current) {
          if (
            laser.active &&
            overlaps(
              p.x,
              p.y,
              PLAYER_W,
              PLAYER_H,
              laser.x,
              laser.y - 4,
              laser.w,
              8,
            )
          ) {
            die();
            return;
          }
        }
        // Checkpoints
        for (const cp of checkpoints.current) {
          if (
            !cp.reached &&
            overlaps(p.x, p.y, PLAYER_W, PLAYER_H, cp.x, cp.y, cp.w, cp.h)
          ) {
            cp.reached = true;
            p.checkpointX = cp.x;
            p.checkpointY = cp.y - PLAYER_H;
            playCheckpoint();
          }
        }
        // Goal
        const g = goalRef.current;
        if (overlaps(p.x, p.y, PLAYER_W, PLAYER_H, g.x, g.y, 26, 40)) {
          // Level complete
          gameScreenRef.current = "levelComplete";
          setGameScreen("levelComplete");
          levelCompleteTimerRef.current = 1.5;
        }
      }

      // Dead timer
      if (gameScreenRef.current === "dead") {
        deadTimerRef.current -= dt;
        if (deadTimerRef.current <= 0) {
          respawn();
          gameScreenRef.current = "playing";
          setGameScreen("playing");
        }
      }

      // Level complete timer
      if (gameScreenRef.current === "levelComplete") {
        levelCompleteTimerRef.current -= dt;
        if (levelCompleteTimerRef.current <= 0) {
          const nextLvl = levelRef.current + 1;
          if (nextLvl > LEVELS.length) {
            gameScreenRef.current = "win";
            setGameScreen("win");
          } else {
            levelRef.current = nextLvl;
            setCurrentLevel(nextLvl);
            buildLevel(nextLvl - 1);
            gameScreenRef.current = "playing";
            setGameScreen("playing");
          }
        }
      }

      // ── RENDER ──
      ctx.clearRect(0, 0, CW, CH);

      // Background
      ctx.fillStyle = "#0a0a0a";
      ctx.fillRect(0, 0, CW, CH);

      if (
        gameScreenRef.current === "playing" ||
        gameScreenRef.current === "dead" ||
        gameScreenRef.current === "levelComplete"
      ) {
        const p = player.current;
        const camX = clamp(p.x - CW / 2, 0, worldWidth.current - CW);

        // ── World rendering ──
        ctx.save();
        ctx.translate(-camX, 0);

        // Floors
        for (const floor of floors.current) {
          ctx.fillStyle = "#2a2a2a";
          ctx.fillRect(floor.x, floor.y, floor.w, floor.h);
          ctx.strokeStyle = "#555";
          ctx.lineWidth = 1;
          ctx.strokeRect(floor.x, floor.y, floor.w, floor.h);
        }

        // Static platforms
        for (const pl of platforms.current) {
          ctx.fillStyle = "#2a2a2a";
          ctx.fillRect(pl.x, pl.y, pl.w, pl.h);
          ctx.strokeStyle = "#555";
          ctx.lineWidth = 1;
          ctx.strokeRect(pl.x, pl.y, pl.w, pl.h);
        }

        // Moving platforms
        for (const mp of movingPlatforms.current) {
          ctx.fillStyle = "#333a33";
          ctx.fillRect(mp.x, mp.y, mp.w, mp.h);
          ctx.strokeStyle = "#88aa88";
          ctx.lineWidth = 1;
          ctx.strokeRect(mp.x, mp.y, mp.w, mp.h);
        }

        // Spikes
        for (const spike of spikes.current) {
          drawSpike(ctx, spike.x, spike.y, spike.w, spike.h);
        }

        // Lasers
        for (const laser of lasers.current) {
          if (laser.active) {
            ctx.save();
            ctx.shadowColor = "#ff2222";
            ctx.shadowBlur = 6;
            ctx.fillStyle = "#ff2222";
            ctx.fillRect(laser.x, laser.y - 2, laser.w, 4);
            ctx.restore();
          } else {
            // dim inactive laser
            ctx.fillStyle = "rgba(100,0,0,0.3)";
            ctx.fillRect(laser.x, laser.y - 1, laser.w, 2);
          }
        }

        // Checkpoints
        for (const cp of checkpoints.current) {
          drawCheckpoint(ctx, cp);
        }

        // Goal
        drawGoal(ctx, goalRef.current.x, goalRef.current.y, t);

        // Enemies
        for (const enemy of enemies.current) {
          ctx.fillStyle = "#cc1111";
          ctx.fillRect(enemy.x, enemy.y, enemy.w, enemy.h);
          // eyes on enemy
          ctx.fillStyle = "#fff";
          ctx.fillRect(enemy.x + 3, enemy.y + 4, 4, 4);
          ctx.fillRect(enemy.x + 11, enemy.y + 4, 4, 4);
          ctx.fillStyle = "#000";
          ctx.fillRect(enemy.x + (enemy.dir > 0 ? 5 : 4), enemy.y + 5, 2, 2);
          ctx.fillRect(enemy.x + (enemy.dir > 0 ? 13 : 12), enemy.y + 5, 2, 2);
        }

        // Player (if not dead)
        if (
          gameScreenRef.current !== "dead" ||
          (deadTimerRef.current > 0.4 &&
            Math.floor(deadTimerRef.current * 8) % 2 === 0)
        ) {
          ctx.save();
          ctx.shadowColor = "rgba(255,255,255,0.5)";
          ctx.shadowBlur = 4;
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(p.x, p.y, PLAYER_W, PLAYER_H);

          // Blink charge bar under player
          const barW = 40;
          const barX = p.x + PLAYER_W / 2 - barW / 2;
          const barY = p.y + PLAYER_H + 4;
          const chargeRatio = bs.blinkCharge / BLINK_MAX_MS;
          ctx.fillStyle = "rgba(0,0,0,0.5)";
          ctx.fillRect(barX, barY, barW, 3);
          ctx.fillStyle =
            chargeRatio > 0.5
              ? "#00ffff"
              : chargeRatio > 0.25
                ? "#ffaa00"
                : "#ff4444";
          ctx.fillRect(barX, barY, barW * chargeRatio, 3);
          ctx.restore();
        }

        ctx.restore(); // end camera transform

        // ── HUD (screen space) ──

        // Level & checkpoint
        ctx.fillStyle = "rgba(255,255,255,0.85)";
        ctx.font = "bold 14px monospace";
        ctx.textAlign = "center";
        ctx.fillText(`LEVEL ${levelRef.current}`, CW / 2, 22);

        const anyCheckpoint = checkpoints.current.some((cp) => cp.reached);
        if (anyCheckpoint) {
          ctx.fillStyle = "rgba(0,255,238,0.8)";
          ctx.font = "12px monospace";
          ctx.fillText("CHECKPOINT ✓", CW / 2, 40);
        }

        // Deaths
        ctx.fillStyle = "rgba(255,255,255,0.6)";
        ctx.font = "12px monospace";
        ctx.textAlign = "left";
        ctx.fillText(`DEATHS: ${deathRef.current}`, 12, 22);

        // Blink hint
        ctx.fillStyle = "rgba(255,255,255,0.35)";
        ctx.font = "10px monospace";
        ctx.textAlign = "right";
        ctx.fillText(bs.isBlinking ? "BLINKING" : "FROZEN", CW - 12, 22);

        // Eye icons in corners
        const eyeSize = 14;
        const margin = 28;
        const eo = bs.eyeOpennessActual;
        drawEye(ctx, margin, margin, eo, eyeSize);
        drawEye(ctx, CW - margin, margin, eo, eyeSize);
        drawEye(ctx, margin, CH - margin, eo, eyeSize);
        drawEye(ctx, CW - margin, CH - margin, eo, eyeSize);

        // Black overlay for blink
        if (bs.opacity > 0) {
          ctx.fillStyle = `rgba(0,0,0,${bs.opacity})`;
          ctx.fillRect(0, 0, CW, CH);
          // Eye icons still visible on top of blackout
          drawEye(ctx, margin, margin, 0, eyeSize);
          drawEye(ctx, CW - margin, margin, 0, eyeSize);
          drawEye(ctx, margin, CH - margin, 0, eyeSize);
          drawEye(ctx, CW - margin, CH - margin, 0, eyeSize);
        }

        // Dead flash
        if (gameScreenRef.current === "dead") {
          const flashAlpha = Math.min(0.6, deadTimerRef.current * 0.8);
          ctx.fillStyle = `rgba(180,0,0,${flashAlpha})`;
          ctx.fillRect(0, 0, CW, CH);
          ctx.fillStyle = "rgba(255,255,255,0.9)";
          ctx.font = "bold 28px monospace";
          ctx.textAlign = "center";
          ctx.fillText("YOU BLINKED AT THE WRONG TIME", CW / 2, CH / 2);
        }

        // Level complete flash
        if (gameScreenRef.current === "levelComplete") {
          ctx.fillStyle = "rgba(0,255,238,0.15)";
          ctx.fillRect(0, 0, CW, CH);
          ctx.fillStyle = "rgba(255,255,255,0.95)";
          ctx.font = "bold 32px monospace";
          ctx.textAlign = "center";
          ctx.fillText(`LEVEL ${levelRef.current} CLEAR`, CW / 2, CH / 2 - 10);
          ctx.font = "16px monospace";
          ctx.fillText("The darkness leads forward...", CW / 2, CH / 2 + 20);
        }
      }
    },
    [buildLevel, respawn, die],
  );

  // ── Start game ──
  const startGame = useCallback(() => {
    getAudioCtx(); // init audio on user gesture
    levelRef.current = 1;
    deathRef.current = 0;
    setCurrentLevel(1);
    setDeathCount(0);
    buildLevel(0);
    blinkState.current = {
      isBlinking: false,
      opacity: 0,
      spaceDown: false,
      spaceDownAt: 0,
      spaceUpAt: 0,
      blinkCharge: BLINK_MAX_MS,
      blinkElapsed: 0,
      tapBlink: false,
      tapBlinkTimer: 0,
      eyeOpenness: 1,
      eyeOpennessActual: 1,
    };
    lastTime.current = 0;
    totalTime.current = 0;
    gameScreenRef.current = "playing";
    setGameScreen("playing");
  }, [buildLevel]);

  const restartGame = useCallback(() => {
    startGame();
  }, [startGame]);

  // ── Game loop effect ──
  useEffect(() => {
    if (
      gameScreen !== "playing" &&
      gameScreen !== "dead" &&
      gameScreen !== "levelComplete"
    ) {
      return;
    }

    // Key handlers
    const onKeyDown = (e: KeyboardEvent) => {
      keys.current.add(e.code);
      if (
        ["Space", "ArrowLeft", "ArrowRight", "ArrowUp", "ArrowDown"].includes(
          e.code,
        )
      ) {
        e.preventDefault();
      }
    };
    const onKeyUp = (e: KeyboardEvent) => {
      keys.current.delete(e.code);
    };
    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);

    lastTime.current = 0;
    rafId.current = requestAnimationFrame(gameLoop);

    return () => {
      cancelAnimationFrame(rafId.current);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
    };
  }, [gameScreen, gameLoop]);

  // ── Canvas size ──
  const canvasW = Math.min(
    900,
    typeof window !== "undefined" ? window.innerWidth - 32 : 800,
  );
  const canvasH = 400;

  return (
    <div
      style={{
        background: "#0a0a0a",
        width: "100%",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        minHeight: "100vh",
        padding: "24px 16px",
        fontFamily: "monospace",
      }}
    >
      {/* START SCREEN */}
      {gameScreen === "start" && (
        <div
          style={{
            maxWidth: 600,
            width: "100%",
            textAlign: "center",
            paddingTop: 40,
          }}
        >
          {/* Eye motif */}
          <div style={{ fontSize: 64, marginBottom: 8, lineHeight: 1 }}>👁</div>
          <h1
            style={{
              color: "#ffffff",
              fontSize: "clamp(1.6rem, 5vw, 2.5rem)",
              fontWeight: "bold",
              letterSpacing: "0.05em",
              margin: "0 0 6px",
              textShadow: "0 0 20px rgba(0,255,255,0.4)",
            }}
          >
            YOU CAN ONLY MOVE
          </h1>
          <h1
            style={{
              color: "#00ffff",
              fontSize: "clamp(1.6rem, 5vw, 2.5rem)",
              fontWeight: "bold",
              letterSpacing: "0.05em",
              margin: "0 0 24px",
              textShadow: "0 0 20px rgba(0,255,255,0.7)",
            }}
          >
            WHEN YOU BLINK
          </h1>
          <p
            style={{
              color: "rgba(255,255,255,0.6)",
              fontSize: "0.95rem",
              marginBottom: 32,
              lineHeight: 1.6,
            }}
          >
            The world never stops. Only you do.
          </p>

          {/* Controls */}
          <div
            style={{
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 12,
              padding: "20px 24px",
              marginBottom: 32,
              textAlign: "left",
            }}
          >
            <p
              style={{
                color: "#00ffff",
                fontWeight: "bold",
                marginBottom: 12,
                fontSize: "0.9rem",
              }}
            >
              CONTROLS
            </p>
            <div
              style={{
                color: "rgba(255,255,255,0.8)",
                fontSize: "0.85rem",
                lineHeight: 2,
              }}
            >
              <div>
                <span
                  style={{
                    color: "#fff",
                    background: "rgba(255,255,255,0.12)",
                    padding: "1px 8px",
                    borderRadius: 4,
                  }}
                >
                  SPACE tap
                </span>{" "}
                — short blink (200ms) — move briefly
              </div>
              <div>
                <span
                  style={{
                    color: "#fff",
                    background: "rgba(255,255,255,0.12)",
                    padding: "1px 8px",
                    borderRadius: 4,
                  }}
                >
                  SPACE hold
                </span>{" "}
                — long blink (up to 1.5s) — sustained movement
              </div>
              <div>
                <span
                  style={{
                    color: "#fff",
                    background: "rgba(255,255,255,0.12)",
                    padding: "1px 8px",
                    borderRadius: 4,
                  }}
                >
                  WASD / ↑↓←→
                </span>{" "}
                — direction (buffer before blink)
              </div>
              <div>
                <span
                  style={{
                    color: "#fff",
                    background: "rgba(255,255,255,0.12)",
                    padding: "1px 8px",
                    borderRadius: 4,
                  }}
                >
                  W / ↑
                </span>{" "}
                — jump (during blink only)
              </div>
            </div>
            <p
              style={{
                color: "rgba(255,255,255,0.4)",
                fontSize: "0.78rem",
                marginTop: 12,
              }}
            >
              Enemies, hazards and platforms move while you are blind. Time your
              blinks carefully.
            </p>
          </div>

          <button
            type="button"
            data-ocid="move-when-blink.primary_button"
            onClick={startGame}
            style={{
              background: "#cc1111",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              padding: "14px 40px",
              fontSize: "1rem",
              fontWeight: "bold",
              cursor: "pointer",
              letterSpacing: "0.1em",
              marginBottom: 16,
              boxShadow: "0 0 20px rgba(200,0,0,0.4)",
            }}
          >
            OPEN YOUR EYES — BEGIN
          </button>
          <br />
          <button
            type="button"
            data-ocid="move-when-blink.secondary_button"
            onClick={() => onNavigate("games")}
            style={{
              background: "transparent",
              color: "rgba(255,255,255,0.4)",
              border: "1px solid rgba(255,255,255,0.15)",
              borderRadius: 8,
              padding: "10px 28px",
              fontSize: "0.85rem",
              cursor: "pointer",
            }}
          >
            ← Back to Games
          </button>
        </div>
      )}

      {/* GAME CANVAS */}
      {(gameScreen === "playing" ||
        gameScreen === "dead" ||
        gameScreen === "levelComplete") && (
        <div style={{ position: "relative", width: canvasW, maxWidth: 900 }}>
          <canvas
            ref={canvasRef}
            width={canvasW}
            height={canvasH}
            style={{
              display: "block",
              borderRadius: 8,
              border: "1px solid rgba(255,255,255,0.08)",
              boxShadow: "0 0 40px rgba(0,0,0,0.8)",
            }}
          />
          {/* Mobile controls hint */}
          <p
            style={{
              color: "rgba(255,255,255,0.2)",
              fontSize: "0.7rem",
              textAlign: "center",
              marginTop: 8,
            }}
          >
            SPACE to blink · WASD/Arrows to move
          </p>
        </div>
      )}

      {/* WIN SCREEN */}
      {gameScreen === "win" && (
        <div
          style={{
            maxWidth: 520,
            width: "100%",
            textAlign: "center",
            paddingTop: 60,
          }}
        >
          <div style={{ fontSize: 64, marginBottom: 12 }}>👁</div>
          <h1
            style={{
              color: "#00ffff",
              fontSize: "2.2rem",
              fontWeight: "bold",
              marginBottom: 8,
              textShadow: "0 0 20px rgba(0,255,255,0.7)",
            }}
          >
            YOU SAW THROUGH THE DARK
          </h1>
          <p style={{ color: "rgba(255,255,255,0.7)", marginBottom: 8 }}>
            All 3 levels cleared.
          </p>
          <p
            style={{
              color: "rgba(255,255,255,0.5)",
              marginBottom: 32,
              fontSize: "0.9rem",
            }}
          >
            Deaths: <span style={{ color: "#cc1111" }}>{deathCount}</span>
          </p>
          <button
            type="button"
            data-ocid="move-when-blink.primary_button"
            onClick={restartGame}
            style={{
              background: "#cc1111",
              color: "#fff",
              border: "none",
              borderRadius: 8,
              padding: "14px 40px",
              fontSize: "1rem",
              fontWeight: "bold",
              cursor: "pointer",
              marginBottom: 12,
              marginRight: 12,
              boxShadow: "0 0 20px rgba(200,0,0,0.3)",
            }}
          >
            Play Again
          </button>
          <button
            type="button"
            data-ocid="move-when-blink.secondary_button"
            onClick={() => onNavigate("games")}
            style={{
              background: "transparent",
              color: "rgba(255,255,255,0.5)",
              border: "1px solid rgba(255,255,255,0.15)",
              borderRadius: 8,
              padding: "14px 28px",
              fontSize: "0.9rem",
              cursor: "pointer",
            }}
          >
            ← Games Hub
          </button>
        </div>
      )}
    </div>
  );
}
