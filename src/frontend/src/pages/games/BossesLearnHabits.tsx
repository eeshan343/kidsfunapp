import { useCallback, useEffect, useRef, useState } from "react";
import type { ModulePage } from "../../App";

interface Props {
  onNavigate: (page: ModulePage) => void;
}

// ──────────────────────────────────────────────────────────────
// CONSTANTS
// ──────────────────────────────────────────────────────────────
const CANVAS_W = 900;
const CANVAS_H = 500;
const FLOOR_Y = CANVAS_H - 80;
const PLAYER_W = 32;
const PLAYER_H = 48;
const PLAYER_SPEED = 4;
const PLAYER_JUMP = -14;
const GRAVITY = 0.6;
const MELEE_RANGE = 80;
const MELEE_DAMAGE = 20;
const MELEE_COOLDOWN = 400;
const ADAPTATION_INTERVAL = 5000;
const SHOOT_COOLDOWN = 280;
const BULLET_SPEED = 9;
const BULLET_DAMAGE = 12;
const BULLET_RADIUS = 4;

// ──────────────────────────────────────────────────────────────
// TYPES
// ──────────────────────────────────────────────────────────────
type GameScreen = "start" | "playing" | "dead" | "bossDefeated" | "win";

interface Habits {
  dodgeLeft: number;
  dodgeRight: number;
  spammedAttack: number;
  stayedFar: number;
  stayedNear: number;
  jumpedToAvoid: number;
}

interface ActiveAdaptations {
  biasLeft: boolean;
  biasRight: boolean;
  spamResistance: boolean;
  rangedPhase: boolean;
  jumpShockwave: boolean;
}

interface Projectile {
  x: number;
  y: number;
  vx: number;
  vy: number;
  id: number;
  fromPlayer: boolean;
}

interface Shockwave {
  x: number;
  y: number;
  radius: number;
  maxRadius: number;
  id: number;
}

interface BossDrone {
  angle: number;
  speed: number;
}

interface BossConfig {
  level: number;
  name: string;
  maxHp: number;
  color: string;
  eyeColor: string;
  outlineColor: string;
  arena: string;
  arenaColor: string;
  gridColor: string;
  fogColor: string;
}

const BOSSES: BossConfig[] = [
  {
    level: 1,
    name: "THE WATCHER",
    maxHp: 300,
    color: "#cc2200",
    eyeColor: "#ffffff",
    outlineColor: "#ff4422",
    arena: "Dark Stone Arena",
    arenaColor: "#1a0a0a",
    gridColor: "rgba(180,20,0,0.12)",
    fogColor: "rgba(80,0,0,0.18)",
  },
  {
    level: 2,
    name: "THE ANALYST",
    maxHp: 450,
    color: "#4a0080",
    eyeColor: "#cc88ff",
    outlineColor: "#8800ff",
    arena: "Observatory Ruins",
    arenaColor: "#0d0a1a",
    gridColor: "rgba(100,0,180,0.12)",
    fogColor: "rgba(40,0,80,0.25)",
  },
  {
    level: 3,
    name: "THE MIMIC",
    maxHp: 600,
    color: "#0d0d0d",
    eyeColor: "#ff3300",
    outlineColor: "#ff3300",
    arena: "The Void",
    arenaColor: "#000000",
    gridColor: "rgba(255,50,0,0.08)",
    fogColor: "rgba(0,0,0,0.4)",
  },
];

const BOSS_DEFEAT_TEXT = [
  "The Watcher's eyes go dark. It couldn't predict your chaos. But the next one is watching the feed...",
  "The Analyst's drones scatter. Its models were flawless — yet you were a variable it couldn't solve.",
  "The Mimic dissolves. It learned everything about you. And still, you changed.",
];

// ──────────────────────────────────────────────────────────────
// GAME STATE (mutable, lives in a ref)
// ──────────────────────────────────────────────────────────────
interface GameState {
  screen: GameScreen;
  bossIndex: number;
  deathCount: number;

  // Player
  px: number;
  py: number;
  pvx: number;
  pvy: number;
  pOnGround: boolean;
  pHp: number;
  pInvincible: number; // ms remaining
  lastMeleeTime: number;
  lastShootTime: number;
  lastAttackInputTime: number;
  attackInputCount: number;
  meleeActive: boolean;
  meleeTimer: number;

  // Boss
  bossHp: number;
  bossX: number;
  bossY: number;
  bossVx: number;
  bossState: "idle" | "charge" | "retreat" | "ranged" | "analyzing";
  bossStateTimer: number;
  bossAttackCooldown: number;
  bossFlashText: string;
  bossFlashTimer: number;
  bossDrones: BossDrone[];
  mimicMoveBuffer: string[]; // for boss 3

  // Habits
  habits: Habits;
  adaptations: ActiveAdaptations;
  adaptationTimer: number; // ms until next adaptation
  patternLearnedFlash: number; // ms remaining
  spamResistanceActive: boolean;
  spamResistanceTimer: number;
  newPatterns: string[]; // shown on death screen

  // Projectiles & shockwaves
  projectiles: Projectile[];
  shockwaves: Shockwave[];
  projId: number;
  swId: number;

  // Input snapshot during boss attack (for habit recording)
  bossWasAttacking: boolean;
  playerXAtAttack: number;
}

function makeInitialState(
  bossIndex: number,
  deathCount: number,
  habits: Habits,
): GameState {
  const boss = BOSSES[bossIndex];
  return {
    screen: "playing",
    bossIndex,
    deathCount,

    px: 80,
    py: FLOOR_Y - PLAYER_H,
    pvx: 0,
    pvy: 0,
    pOnGround: true,
    pHp: 100,
    pInvincible: 0,
    lastMeleeTime: 0,
    lastShootTime: 0,
    lastAttackInputTime: 0,
    attackInputCount: 0,
    meleeActive: false,
    meleeTimer: 0,

    bossHp: boss.maxHp,
    bossX: CANVAS_W - 160,
    bossY: FLOOR_Y - 80,
    bossVx: 0,
    bossState: "analyzing",
    bossStateTimer: 1200,
    bossAttackCooldown: 1500,
    bossFlashText: "Analyzing...",
    bossFlashTimer: 1200,
    bossDrones:
      bossIndex >= 1
        ? [
            { angle: 0, speed: 0.03 },
            { angle: 2.1, speed: 0.025 },
            { angle: 4.2, speed: 0.035 },
            { angle: 1.0, speed: 0.028 },
          ]
        : [],
    mimicMoveBuffer: [],

    habits,
    adaptations: applyAdaptations(habits, bossIndex),
    adaptationTimer: ADAPTATION_INTERVAL,
    patternLearnedFlash: 0,
    spamResistanceActive: false,
    spamResistanceTimer: 0,
    newPatterns: [],

    projectiles: [],
    shockwaves: [],
    projId: 0,
    swId: 0,

    bossWasAttacking: false,
    playerXAtAttack: 80,
  };
}

function applyAdaptations(
  habits: Habits,
  bossLevel: number,
): ActiveAdaptations {
  const ad: ActiveAdaptations = {
    biasLeft: false,
    biasRight: false,
    spamResistance: false,
    rangedPhase: false,
    jumpShockwave: false,
  };
  if (habits.dodgeLeft > habits.dodgeRight * 1.5) ad.biasLeft = true;
  else if (habits.dodgeRight > habits.dodgeLeft * 1.5) ad.biasRight = true;
  if (habits.spammedAttack > 5) ad.spamResistance = true;
  if (bossLevel >= 1 && habits.stayedFar > habits.stayedNear * 1.5)
    ad.rangedPhase = true;
  if (bossLevel >= 2 && habits.jumpedToAvoid > 5) ad.jumpShockwave = true;
  return ad;
}

function getLearnedPatternTexts(ad: ActiveAdaptations): string[] {
  const lines: string[] = [];
  if (ad.biasLeft) lines.push("Predicts your left dodge");
  if (ad.biasRight) lines.push("Predicts your right dodge");
  if (ad.spamResistance) lines.push("Counters spam attacks");
  if (ad.rangedPhase) lines.push("Baiting your distance");
  if (ad.jumpShockwave) lines.push("Shockwave on jump");
  return lines;
}

// ──────────────────────────────────────────────────────────────
// COMPONENT
// ──────────────────────────────────────────────────────────────
export default function BossesLearnHabits({ onNavigate }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<GameState | null>(null);
  const keysRef = useRef<Set<string>>(new Set());
  const habitsRef = useRef<Habits>({
    dodgeLeft: 0,
    dodgeRight: 0,
    spammedAttack: 0,
    stayedFar: 0,
    stayedNear: 0,
    jumpedToAvoid: 0,
  });
  const rafRef = useRef<number>(0);
  const prevTimeRef = useRef<number>(0);

  const [screen, setScreen] = useState<GameScreen>("start");
  const [deathCount, setDeathCount] = useState(0);
  const [bossIndex, setBossIndex] = useState(0);
  const [deathPatterns, setDeathPatterns] = useState<string[]>([]);
  const [bossDefeatText, setBossDefeatText] = useState("");

  // ── INPUT ────────────────────────────────────────────────────
  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      keysRef.current.add(e.code);
      // Prevent page scroll on game keys
      if (
        ["Space", "ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(
          e.code,
        )
      ) {
        e.preventDefault();
      }
    };
    const up = (e: KeyboardEvent) => keysRef.current.delete(e.code);
    window.addEventListener("keydown", down);
    window.addEventListener("keyup", up);
    return () => {
      window.removeEventListener("keydown", down);
      window.removeEventListener("keyup", up);
    };
  }, []);

  // ── GAME LOOP ────────────────────────────────────────────────
  const startGame = useCallback(
    (bossIdx: number) => {
      const gs = makeInitialState(bossIdx, deathCount, habitsRef.current);
      stateRef.current = gs;
      setScreen("playing");
    },
    [deathCount],
  );

  useEffect(() => {
    if (screen !== "playing") {
      cancelAnimationFrame(rafRef.current);
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    prevTimeRef.current = performance.now();

    function loop(now: number) {
      if (!stateRef.current) return;
      const dt = Math.min(now - prevTimeRef.current, 50);
      prevTimeRef.current = now;

      update(stateRef.current, keysRef.current, dt, habitsRef);
      draw(ctx!, stateRef.current);

      if (stateRef.current.screen !== "playing") {
        // Transition out
        const gs = stateRef.current;
        if (gs.screen === "dead") {
          setDeathCount(gs.deathCount);
          setBossIndex(gs.bossIndex);
          setDeathPatterns([...gs.newPatterns]);
          setScreen("dead");
        } else if (gs.screen === "bossDefeated") {
          setBossIndex(gs.bossIndex);
          setBossDefeatText(BOSS_DEFEAT_TEXT[gs.bossIndex]);
          setScreen("bossDefeated");
        } else if (gs.screen === "win") {
          setScreen("win");
        }
        return;
      }

      rafRef.current = requestAnimationFrame(loop);
    }

    rafRef.current = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [screen]);

  // ── SCREEN HANDLERS ─────────────────────────────────────────
  const handleStart = useCallback(() => {
    habitsRef.current = {
      dodgeLeft: 0,
      dodgeRight: 0,
      spammedAttack: 0,
      stayedFar: 0,
      stayedNear: 0,
      jumpedToAvoid: 0,
    };
    setDeathCount(0);
    setBossIndex(0);
    startGame(0);
  }, [startGame]);

  const handleTryAgain = useCallback(() => {
    startGame(bossIndex);
  }, [startGame, bossIndex]);

  const handleNextBoss = useCallback(() => {
    const next = bossIndex + 1;
    if (next >= BOSSES.length) {
      setScreen("win");
    } else {
      setBossIndex(next);
      startGame(next);
    }
  }, [bossIndex, startGame]);

  const handleReturnToGames = useCallback(() => {
    onNavigate("games");
  }, [onNavigate]);

  // ── RENDER ───────────────────────────────────────────────────
  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#0d0d0d",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        fontFamily: "monospace",
        color: "#fff",
        userSelect: "none",
        padding: "16px",
      }}
    >
      {/* Back button always visible */}
      <button
        type="button"
        onClick={handleReturnToGames}
        style={{
          position: "fixed",
          top: 16,
          left: 16,
          background: "rgba(255,255,255,0.08)",
          border: "1px solid rgba(255,255,255,0.2)",
          color: "#fff",
          padding: "8px 16px",
          borderRadius: 8,
          cursor: "pointer",
          fontSize: 13,
          zIndex: 100,
        }}
      >
        ← Games Hub
      </button>

      {/* START SCREEN */}
      {screen === "start" && <StartScreen onStart={handleStart} />}

      {/* PLAYING — Canvas */}
      {screen === "playing" && (
        <canvas
          ref={canvasRef}
          width={CANVAS_W}
          height={CANVAS_H}
          style={{
            display: "block",
            border: "2px solid #330000",
            borderRadius: 4,
            maxWidth: "100%",
            imageRendering: "pixelated",
          }}
        />
      )}

      {/* On-screen touch controls — only on touch devices, only while
          playing. Dispatches synthetic KeyboardEvents with the same
          e.code values the game's keydown/keyup listeners expect. */}
      {screen === "playing" && <BossesTouchOverlay />}

      {/* DEATH SCREEN */}
      {screen === "dead" && (
        <DeathScreen
          deathCount={deathCount}
          newPatterns={deathPatterns}
          bossName={BOSSES[bossIndex]?.name ?? "BOSS"}
          onTryAgain={handleTryAgain}
          onReturn={handleReturnToGames}
        />
      )}

      {/* BOSS DEFEATED SCREEN */}
      {screen === "bossDefeated" && (
        <BossDefeatedScreen
          bossName={BOSSES[bossIndex]?.name ?? "BOSS"}
          flavorText={bossDefeatText}
          isLastBoss={bossIndex >= BOSSES.length - 1}
          onNext={handleNextBoss}
          onReturn={handleReturnToGames}
        />
      )}

      {/* WIN SCREEN */}
      {screen === "win" && <WinScreen onReturn={handleReturnToGames} />}
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// SUB-SCREENS
// ──────────────────────────────────────────────────────────────
function StartScreen({ onStart }: { onStart: () => void }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let frame = 0;
    let raf: number;

    function drawStart() {
      if (!ctx || !canvas) return;
      frame++;
      ctx.fillStyle = "#0d0d0d";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Grid lines
      ctx.strokeStyle = "rgba(180,20,0,0.15)";
      ctx.lineWidth = 1;
      for (let x = 0; x < canvas.width; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, canvas.height);
        ctx.stroke();
      }
      for (let y = 0; y < canvas.height; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(canvas.width, y);
        ctx.stroke();
      }

      // Floor
      ctx.fillStyle = "#1a0505";
      ctx.fillRect(0, canvas.height - 60, canvas.width, 60);

      // Boss silhouettes (3 bosses in background)
      const pulse = Math.sin(frame * 0.03) * 0.3 + 0.7;

      // Boss 1 — The Watcher silhouette
      ctx.globalAlpha = 0.35 * pulse;
      ctx.fillStyle = "#cc2200";
      drawBossShape(ctx, 180, canvas.height - 160, 1, frame);

      // Boss 2 — The Analyst silhouette
      ctx.globalAlpha = 0.3 * pulse;
      ctx.fillStyle = "#4a0080";
      drawBossShape(ctx, 380, canvas.height - 180, 2, frame + 30);

      // Boss 3 — The Mimic silhouette (outlines only)
      ctx.globalAlpha = 0.25 * pulse;
      ctx.strokeStyle = "#ff3300";
      ctx.lineWidth = 3;
      drawBossShape(ctx, 580, canvas.height - 175, 3, frame + 60);

      ctx.globalAlpha = 1;

      // Title
      ctx.textAlign = "center";
      const titleGlow = Math.sin(frame * 0.04) * 10;
      ctx.shadowColor = "#cc2200";
      ctx.shadowBlur = 20 + titleGlow;
      ctx.fillStyle = "#ff4422";
      ctx.font = "bold 32px monospace";
      ctx.fillText("BOSSES LEARN YOUR HABITS", canvas.width / 2, 100);
      ctx.shadowBlur = 0;

      ctx.fillStyle = "rgba(255,255,255,0.7)";
      ctx.font = "14px monospace";
      ctx.fillText(
        "Every death makes them smarter. Stay unpredictable.",
        canvas.width / 2,
        135,
      );

      // Controls
      ctx.fillStyle = "rgba(255,255,255,0.5)";
      ctx.font = "13px monospace";
      ctx.textAlign = "left";
      ctx.fillText("Controls:", 80, 195);
      ctx.fillText("Move:   A/D or ← →", 80, 215);
      ctx.fillText("Jump:   W / ↑", 80, 235);
      ctx.fillText("Shoot:  Space", 80, 255);
      ctx.fillText("Attack: Z / X / J", 80, 275);

      raf = requestAnimationFrame(drawStart);
    }

    drawStart();
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div style={{ textAlign: "center", position: "relative" }}>
      <canvas
        ref={canvasRef}
        width={780}
        height={360}
        style={{
          display: "block",
          maxWidth: "100%",
          borderRadius: 8,
          border: "1px solid #330000",
        }}
      />
      <button
        type="button"
        onClick={onStart}
        style={{
          marginTop: 24,
          padding: "14px 48px",
          background: "linear-gradient(135deg, #cc2200, #880000)",
          border: "2px solid #ff4422",
          color: "#fff",
          fontSize: 20,
          fontWeight: "bold",
          fontFamily: "monospace",
          borderRadius: 6,
          cursor: "pointer",
          letterSpacing: 3,
          textShadow: "0 0 10px rgba(255,68,34,0.8)",
          boxShadow: "0 0 20px rgba(204,34,0,0.5)",
        }}
      >
        ENTER THE ARENA
      </button>
    </div>
  );
}

function DeathScreen({
  deathCount,
  newPatterns,
  bossName,
  onTryAgain,
  onReturn,
}: {
  deathCount: number;
  newPatterns: string[];
  bossName: string;
  onTryAgain: () => void;
  onReturn: () => void;
}) {
  return (
    <div
      style={{
        textAlign: "center",
        maxWidth: 520,
        padding: "48px 40px",
        background: "linear-gradient(160deg, #1a0000, #0d0d0d)",
        border: "2px solid #cc2200",
        borderRadius: 12,
        boxShadow: "0 0 40px rgba(204,34,0,0.4)",
      }}
    >
      <div
        style={{
          fontSize: 56,
          fontWeight: "bold",
          color: "#cc2200",
          textShadow: "0 0 20px #cc2200",
          letterSpacing: 6,
        }}
      >
        YOU DIED
      </div>
      <div
        style={{ color: "rgba(255,255,255,0.6)", marginTop: 12, fontSize: 14 }}
      >
        Deaths: {deathCount} &nbsp;|&nbsp; {bossName} is learning
      </div>
      <div
        style={{
          marginTop: 24,
          padding: "16px 20px",
          background: "rgba(100,0,0,0.3)",
          border: "1px solid rgba(200,0,0,0.3)",
          borderRadius: 8,
          textAlign: "left",
          fontSize: 13,
          color: "rgba(255,200,200,0.9)",
        }}
      >
        <div
          style={{
            color: "#cc2200",
            fontWeight: "bold",
            marginBottom: 8,
            fontSize: 12,
            letterSpacing: 2,
          }}
        >
          THE BOSS LEARNED FROM THIS ENCOUNTER
        </div>
        {newPatterns.length === 0 ? (
          <div style={{ color: "rgba(255,255,255,0.4)" }}>
            Patterns still forming... Stay unpredictable.
          </div>
        ) : (
          newPatterns.map((p) => (
            <div
              key={p}
              style={{
                padding: "4px 0",
                borderBottom: "1px solid rgba(255,0,0,0.15)",
              }}
            >
              ⚠ {p}
            </div>
          ))
        )}
      </div>
      <div
        style={{
          marginTop: 28,
          display: "flex",
          gap: 14,
          justifyContent: "center",
        }}
      >
        <button
          type="button"
          onClick={onTryAgain}
          style={{
            padding: "12px 32px",
            background: "#cc2200",
            border: "none",
            color: "#fff",
            fontSize: 16,
            fontWeight: "bold",
            fontFamily: "monospace",
            borderRadius: 6,
            cursor: "pointer",
            letterSpacing: 2,
          }}
        >
          TRY AGAIN
        </button>
        <button
          type="button"
          onClick={onReturn}
          style={{
            padding: "12px 24px",
            background: "transparent",
            border: "1px solid rgba(255,255,255,0.3)",
            color: "rgba(255,255,255,0.7)",
            fontSize: 14,
            fontFamily: "monospace",
            borderRadius: 6,
            cursor: "pointer",
          }}
        >
          Games Hub
        </button>
      </div>
    </div>
  );
}

function BossDefeatedScreen({
  bossName,
  flavorText,
  isLastBoss,
  onNext,
  onReturn,
}: {
  bossName: string;
  flavorText: string;
  isLastBoss: boolean;
  onNext: () => void;
  onReturn: () => void;
}) {
  return (
    <div
      style={{
        textAlign: "center",
        maxWidth: 540,
        padding: "48px 40px",
        background: "linear-gradient(160deg, #0d0d00, #0d0d0d)",
        border: "2px solid #ccaa00",
        borderRadius: 12,
        boxShadow: "0 0 40px rgba(200,170,0,0.3)",
      }}
    >
      <div
        style={{
          fontSize: 48,
          fontWeight: "bold",
          color: "#ccaa00",
          textShadow: "0 0 20px #ccaa00",
          letterSpacing: 4,
        }}
      >
        BOSS DEFEATED
      </div>
      <div
        style={{
          color: "rgba(255,220,100,0.8)",
          marginTop: 8,
          fontSize: 14,
          letterSpacing: 2,
        }}
      >
        {bossName}
      </div>
      <div
        style={{
          marginTop: 24,
          color: "rgba(255,255,255,0.6)",
          fontSize: 14,
          lineHeight: 1.7,
          fontStyle: "italic",
          padding: "0 16px",
        }}
      >
        {flavorText}
      </div>
      <div
        style={{
          marginTop: 32,
          display: "flex",
          gap: 14,
          justifyContent: "center",
        }}
      >
        {!isLastBoss && (
          <button
            type="button"
            onClick={onNext}
            style={{
              padding: "12px 32px",
              background: "#ccaa00",
              border: "none",
              color: "#000",
              fontSize: 16,
              fontWeight: "bold",
              fontFamily: "monospace",
              borderRadius: 6,
              cursor: "pointer",
              letterSpacing: 2,
            }}
          >
            NEXT BOSS →
          </button>
        )}
        <button
          type="button"
          onClick={onReturn}
          style={{
            padding: "12px 24px",
            background: "transparent",
            border: "1px solid rgba(255,255,255,0.3)",
            color: "rgba(255,255,255,0.7)",
            fontSize: 14,
            fontFamily: "monospace",
            borderRadius: 6,
            cursor: "pointer",
          }}
        >
          Games Hub
        </button>
      </div>
    </div>
  );
}

function WinScreen({ onReturn }: { onReturn: () => void }) {
  return (
    <div
      style={{
        textAlign: "center",
        maxWidth: 540,
        padding: "48px 40px",
        background: "linear-gradient(160deg, #001a00, #0d0d0d)",
        border: "2px solid #44ff44",
        borderRadius: 12,
        boxShadow: "0 0 60px rgba(68,255,68,0.3)",
      }}
    >
      <div
        style={{
          fontSize: 40,
          fontWeight: "bold",
          color: "#44ff44",
          textShadow: "0 0 20px #44ff44",
          letterSpacing: 2,
        }}
      >
        YOU WIN
      </div>
      <div
        style={{
          marginTop: 20,
          fontSize: 20,
          color: "rgba(255,255,255,0.9)",
          lineHeight: 1.6,
          fontStyle: "italic",
        }}
      >
        "They couldn't predict you."
      </div>
      <div
        style={{ marginTop: 16, color: "rgba(255,255,255,0.4)", fontSize: 13 }}
      >
        All three bosses have been defeated. You remained unpredictable.
      </div>
      <button
        type="button"
        onClick={onReturn}
        style={{
          marginTop: 32,
          padding: "12px 32px",
          background: "#44ff44",
          border: "none",
          color: "#000",
          fontSize: 16,
          fontWeight: "bold",
          fontFamily: "monospace",
          borderRadius: 6,
          cursor: "pointer",
          letterSpacing: 2,
        }}
      >
        RETURN TO GAMES
      </button>
    </div>
  );
}

// ──────────────────────────────────────────────────────────────
// GAME UPDATE
// ──────────────────────────────────────────────────────────────
function update(
  gs: GameState,
  keys: Set<string>,
  dt: number,
  habitsRef: React.MutableRefObject<Habits>,
) {
  const left = keys.has("KeyA") || keys.has("ArrowLeft");
  const right = keys.has("KeyD") || keys.has("ArrowRight");
  const jump = keys.has("KeyW") || keys.has("ArrowUp");
  const attack = keys.has("KeyZ") || keys.has("KeyX") || keys.has("KeyJ");
  const shoot = keys.has("Space");

  // ── PLAYER MOVEMENT ────────────────────────────────────────
  gs.pvx = 0;
  if (left) gs.pvx = -PLAYER_SPEED;
  if (right) gs.pvx = PLAYER_SPEED;

  // Apply velocity
  gs.px += gs.pvx;
  gs.pvy += GRAVITY;
  gs.py += gs.pvy;

  // Clamp to arena
  if (gs.px < 10) gs.px = 10;
  if (gs.px > CANVAS_W - PLAYER_W - 10) gs.px = CANVAS_W - PLAYER_W - 10;

  // Floor collision
  if (gs.py + PLAYER_H >= FLOOR_Y) {
    gs.py = FLOOR_Y - PLAYER_H;
    gs.pvy = 0;
    gs.pOnGround = true;
  } else {
    gs.pOnGround = false;
  }

  // Jump
  if (jump && gs.pOnGround) {
    gs.pvy = PLAYER_JUMP;
    gs.pOnGround = false;
  }

  // ── PLAYER ATTACK ──────────────────────────────────────────
  const now = performance.now();
  if (attack && now - gs.lastMeleeTime > MELEE_COOLDOWN) {
    gs.lastMeleeTime = now;
    gs.meleeActive = true;
    gs.meleeTimer = 180;

    // Track spam
    if (now - gs.lastAttackInputTime < 500) {
      gs.attackInputCount++;
      if (gs.attackInputCount > 3) gs.habits.spammedAttack++;
    } else {
      gs.attackInputCount = 1;
    }
    gs.lastAttackInputTime = now;

    // Check if melee hits boss
    const playerCenterX = gs.px + PLAYER_W / 2;
    const bossCenterX = gs.bossX + 50;
    const dist = Math.abs(playerCenterX - bossCenterX);
    if (dist < MELEE_RANGE + 50) {
      // Spam resistance: if adapted and spamming, deal no damage
      const isSpamming = gs.attackInputCount > 3;
      const blocked = gs.adaptations.spamResistance && isSpamming;
      if (!blocked) {
        gs.bossHp = Math.max(0, gs.bossHp - MELEE_DAMAGE);
      }
    }
  }

  if (gs.meleeTimer > 0) {
    gs.meleeTimer -= dt;
    if (gs.meleeTimer <= 0) gs.meleeActive = false;
  }

  // ── PLAYER SHOOT (Space) ─────────────────────────────────
  if (shoot && now - gs.lastShootTime > SHOOT_COOLDOWN) {
    gs.lastShootTime = now;
    // Fire toward facing direction (toward boss)
    const faceRight = gs.bossX + 50 > gs.px + PLAYER_W / 2;
    const muzzleY = gs.py + PLAYER_H / 2;
    gs.projectiles.push({
      x: faceRight ? gs.px + PLAYER_W : gs.px,
      y: muzzleY,
      vx: faceRight ? BULLET_SPEED : -BULLET_SPEED,
      vy: 0,
      id: gs.projId++,
      fromPlayer: true,
    });
  }

  // ── SPAM RESISTANCE TIMER ──────────────────────────────────
  if (gs.spamResistanceActive) {
    gs.spamResistanceTimer -= dt;
    if (gs.spamResistanceTimer <= 0) gs.spamResistanceActive = false;
  }

  // ── BOSS AI ────────────────────────────────────────────────
  gs.bossAttackCooldown -= dt;
  gs.bossStateTimer -= dt;

  const px = gs.px + PLAYER_W / 2;
  // Record habits relative to boss attacking
  const bossIsAttacking = gs.bossState === "charge";
  if (bossIsAttacking && !gs.bossWasAttacking) {
    gs.playerXAtAttack = gs.px;
    gs.bossWasAttacking = true;
  }
  if (!bossIsAttacking && gs.bossWasAttacking) {
    // Boss finished attacking — record where player moved
    const movedLeft = gs.px < gs.playerXAtAttack - 10;
    const movedRight = gs.px > gs.playerXAtAttack + 10;
    if (movedLeft) gs.habits.dodgeLeft++;
    if (movedRight) gs.habits.dodgeRight++;
    if (gs.px < 100 || gs.px > CANVAS_W - 180) gs.habits.stayedFar++;
    else gs.habits.stayedNear++;
    if (!gs.pOnGround) gs.habits.jumpedToAvoid++;
    gs.bossWasAttacking = false;
    habitsRef.current = { ...gs.habits };
  }

  // Boss state machine
  if (gs.bossStateTimer <= 0) {
    if (gs.bossState === "analyzing") {
      gs.bossFlashText = "";
      gs.bossState = "charge";
      gs.bossStateTimer = 1800;
      // Bias based on adaptations
      let targetX = px - 50;
      if (gs.adaptations.biasLeft) targetX = Math.min(px - 50, 150); // attack toward left
      if (gs.adaptations.biasRight) targetX = Math.max(px - 50, CANVAS_W - 250);
      gs.bossVx = targetX - gs.bossX < 0 ? -3.5 : 3.5;
    } else if (gs.bossState === "charge") {
      gs.bossVx = 0;
      gs.bossState = "retreat";
      gs.bossStateTimer = 1000;
    } else if (gs.bossState === "retreat") {
      gs.bossVx = 0;
      gs.bossX = CANVAS_W - 160;
      // Decide next action
      if (gs.adaptations.rangedPhase && Math.random() < 0.5) {
        gs.bossState = "ranged";
        gs.bossStateTimer = 2000;
        gs.bossFlashText = "Analyzing...";
        gs.bossFlashTimer = 600;
        // Fire projectiles
        for (let i = 0; i < 3; i++) {
          const spread = (i - 1) * 0.25;
          gs.projectiles.push({
            x: gs.bossX + 40,
            y: gs.bossY + 40,
            vx: -4 + spread * 0.5,
            vy: spread,
            id: gs.projId++,
            fromPlayer: false,
          });
        }
      } else {
        gs.bossState = "analyzing";
        gs.bossStateTimer = 800;
        gs.bossFlashText = "Analyzing...";
        gs.bossFlashTimer = 800;
      }
    } else if (gs.bossState === "ranged") {
      gs.bossState = "analyzing";
      gs.bossStateTimer = 600;
    }
  }

  // Move boss during charge
  if (gs.bossState === "charge") {
    gs.bossX += gs.bossVx;
    // Boss 3 (Mimic): phase dash
    if (gs.bossIndex === 2 && Math.random() < 0.01) {
      gs.bossX = px > CANVAS_W / 2 ? 50 : CANVAS_W - 200;
    }
  }

  // Clamp boss to arena
  if (gs.bossX < 20) gs.bossX = 20;
  if (gs.bossX > CANVAS_W - 120) gs.bossX = CANVAS_W - 120;

  // Boss flash text timer
  if (gs.bossFlashTimer > 0) gs.bossFlashTimer -= dt;

  // Jump shockwave: if player jumps during boss charge, spawn shockwave
  if (
    !gs.pOnGround &&
    gs.bossState === "charge" &&
    gs.adaptations.jumpShockwave &&
    Math.random() < 0.008
  ) {
    gs.shockwaves.push({
      x: gs.bossX + 50,
      y: FLOOR_Y,
      radius: 10,
      maxRadius: 280,
      id: gs.swId++,
    });
  }

  // ── PROJECTILE UPDATE ──────────────────────────────────────
  for (const proj of gs.projectiles) {
    proj.x += proj.vx;
    proj.y += proj.vy;
  }
  gs.projectiles = gs.projectiles.filter(
    (p) => p.x > -20 && p.x < CANVAS_W + 20 && p.y > -20 && p.y < CANVAS_H + 20,
  );

  // ── SHOCKWAVE UPDATE ───────────────────────────────────────
  for (const sw of gs.shockwaves) {
    sw.radius += 5;
  }
  gs.shockwaves = gs.shockwaves.filter((sw) => sw.radius < sw.maxRadius);

  // ── DRONES UPDATE ─────────────────────────────────────────
  for (const drone of gs.bossDrones) {
    drone.angle += drone.speed;
  }

  // ── COLLISION: player vs boss body ────────────────────────
  if (gs.pInvincible <= 0) {
    const bossCX = gs.bossX + 50;
    const playerCX = gs.px + PLAYER_W / 2;
    if (
      Math.abs(playerCX - bossCX) < 70 &&
      gs.py + PLAYER_H > gs.bossY + 10 &&
      gs.py < gs.bossY + 90
    ) {
      const dmg = 15 + Math.floor(Math.random() * 11);
      gs.pHp = Math.max(0, gs.pHp - dmg);
      gs.pInvincible = 1200;
      // Knock player back
      gs.pvx = playerCX < bossCX ? -6 : 6;
      gs.pvy = -5;
    }
  } else {
    gs.pInvincible -= dt;
  }

  // Collision: projectiles vs player
  if (gs.pInvincible <= 0) {
    for (const proj of gs.projectiles) {
      if (proj.fromPlayer) continue;
      const pcx = gs.px + PLAYER_W / 2;
      const pcy = gs.py + PLAYER_H / 2;
      if (Math.abs(proj.x - pcx) < 24 && Math.abs(proj.y - pcy) < 24) {
        gs.pHp = Math.max(0, gs.pHp - 18);
        gs.pInvincible = 800;
        gs.projectiles = gs.projectiles.filter((p) => p.id !== proj.id);
        break;
      }
    }
  }

  // Collision: player bullets vs boss
  const bossCX = gs.bossX + 50;
  const bossCY = gs.bossY + 45;
  for (const proj of gs.projectiles) {
    if (!proj.fromPlayer) continue;
    if (Math.abs(proj.x - bossCX) < 55 && Math.abs(proj.y - bossCY) < 55) {
      gs.bossHp = Math.max(0, gs.bossHp - BULLET_DAMAGE);
      gs.projectiles = gs.projectiles.filter((p) => p.id !== proj.id);
      break;
    }
  }

  // Collision: shockwaves vs player (if player is airborne)
  for (const sw of gs.shockwaves) {
    const pcx = gs.px + PLAYER_W / 2;
    const pcy = gs.py + PLAYER_H / 2;
    const dist2 = Math.sqrt((pcx - sw.x) ** 2 + (pcy - sw.y) ** 2);
    if (
      Math.abs(dist2 - sw.radius) < 20 &&
      !gs.pOnGround &&
      gs.pInvincible <= 0
    ) {
      gs.pHp = Math.max(0, gs.pHp - 22);
      gs.pInvincible = 600;
    }
  }

  // ── ADAPTATION TIMER ──────────────────────────────────────
  gs.adaptationTimer -= dt;
  if (gs.adaptationTimer <= 0) {
    const prev = { ...gs.adaptations };
    gs.adaptations = applyAdaptations(gs.habits, gs.bossIndex);
    // Check what's new
    if (!prev.biasLeft && gs.adaptations.biasLeft)
      gs.newPatterns.push("Predicts your left dodge");
    if (!prev.biasRight && gs.adaptations.biasRight)
      gs.newPatterns.push("Predicts your right dodge");
    if (!prev.spamResistance && gs.adaptations.spamResistance)
      gs.newPatterns.push("Counters spam attacks");
    if (!prev.rangedPhase && gs.adaptations.rangedPhase)
      gs.newPatterns.push("Baiting your distance");
    if (!prev.jumpShockwave && gs.adaptations.jumpShockwave)
      gs.newPatterns.push("Shockwave on jump");
    gs.adaptationTimer = ADAPTATION_INTERVAL;
    gs.patternLearnedFlash = 1800;
  }
  if (gs.patternLearnedFlash > 0) gs.patternLearnedFlash -= dt;

  // ── MIMIC MOVE BUFFER ─────────────────────────────────────
  if (gs.bossIndex === 2) {
    const dir = left ? "L" : right ? "R" : null;
    if (dir) gs.mimicMoveBuffer.push(dir);
    if (gs.mimicMoveBuffer.length > 6) gs.mimicMoveBuffer.shift();
  }

  // ── WIN/LOSS CONDITIONS ───────────────────────────────────
  if (gs.pHp <= 0) {
    gs.deathCount++;
    gs.habits = { ...habitsRef.current };
    habitsRef.current = { ...gs.habits };
    gs.screen = "dead";
    return;
  }

  if (gs.bossHp <= 0) {
    if (gs.bossIndex >= BOSSES.length - 1) {
      gs.screen = "win";
    } else {
      gs.screen = "bossDefeated";
    }
  }
}

// ──────────────────────────────────────────────────────────────
// DRAW
// ──────────────────────────────────────────────────────────────
function draw(ctx: CanvasRenderingContext2D, gs: GameState) {
  const boss = BOSSES[gs.bossIndex];

  // Background
  ctx.fillStyle = boss.arenaColor;
  ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

  // Arena grid
  ctx.strokeStyle = boss.gridColor;
  ctx.lineWidth = 1;
  for (let x = 0; x < CANVAS_W; x += 50) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, CANVAS_H);
    ctx.stroke();
  }
  for (let y = 0; y < CANVAS_H; y += 50) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(CANVAS_W, y);
    ctx.stroke();
  }

  // Fog overlay for boss 2 and 3
  if (gs.bossIndex >= 1) {
    ctx.fillStyle = boss.fogColor;
    ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
  }

  // Floor
  ctx.fillStyle = "#111111";
  ctx.fillRect(0, FLOOR_Y, CANVAS_W, CANVAS_H - FLOOR_Y);
  ctx.strokeStyle = boss.gridColor;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(0, FLOOR_Y);
  ctx.lineTo(CANVAS_W, FLOOR_Y);
  ctx.stroke();

  // Lightning floor for boss 3
  if (gs.bossIndex === 2 && Math.random() < 0.08) {
    ctx.strokeStyle = `rgba(255,80,0,${Math.random() * 0.5 + 0.1})`;
    ctx.lineWidth = 1;
    const lx = Math.random() * CANVAS_W;
    ctx.beginPath();
    ctx.moveTo(lx, FLOOR_Y);
    ctx.lineTo(lx + (Math.random() - 0.5) * 40, FLOOR_Y - Math.random() * 30);
    ctx.stroke();
  }

  // ── BOSS ──────────────────────────────────────────────────
  drawBossShape(
    ctx,
    gs.bossX,
    gs.bossY,
    gs.bossIndex + 1,
    performance.now() / 16,
  );

  // Boss flash text
  if (gs.bossFlashTimer > 0 && gs.bossFlashText) {
    const alpha = Math.min(1, gs.bossFlashTimer / 400);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = "#cc4444";
    ctx.font = "bold 13px monospace";
    ctx.textAlign = "center";
    ctx.fillText(gs.bossFlashText, gs.bossX + 50, gs.bossY - 12);
    ctx.globalAlpha = 1;
  }

  // Boss 2 drones
  if (gs.bossIndex >= 1) {
    for (const drone of gs.bossDrones) {
      const dx = gs.bossX + 50 + Math.cos(drone.angle) * 70;
      const dy = gs.bossY + 45 + Math.sin(drone.angle) * 40;
      ctx.beginPath();
      ctx.arc(dx, dy, 8, 0, Math.PI * 2);
      ctx.fillStyle = boss.eyeColor;
      ctx.fill();
      // Drone pupil
      ctx.beginPath();
      ctx.arc(dx, dy, 3, 0, Math.PI * 2);
      ctx.fillStyle = "#000";
      ctx.fill();
    }
  }

  // ── PROJECTILES ───────────────────────────────────────────
  for (const proj of gs.projectiles) {
    if (proj.fromPlayer) {
      // Player bullet: small bright tracer
      ctx.beginPath();
      ctx.arc(proj.x, proj.y, BULLET_RADIUS, 0, Math.PI * 2);
      ctx.fillStyle = "#ffee88";
      ctx.shadowColor = "#ffcc44";
      ctx.shadowBlur = 10;
      ctx.fill();
      // Tracer tail
      ctx.strokeStyle = "rgba(255,220,120,0.6)";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.moveTo(proj.x, proj.y);
      ctx.lineTo(proj.x - Math.sign(proj.vx) * 10, proj.y);
      ctx.stroke();
      ctx.shadowBlur = 0;
    } else {
      // Boss projectile
      ctx.beginPath();
      ctx.arc(proj.x, proj.y, 10, 0, Math.PI * 2);
      ctx.fillStyle = boss.eyeColor;
      ctx.shadowColor = boss.eyeColor;
      ctx.shadowBlur = 8;
      ctx.fill();
      ctx.shadowBlur = 0;
    }
  }

  // ── SHOCKWAVES ────────────────────────────────────────────
  for (const sw of gs.shockwaves) {
    const alpha = 1 - sw.radius / sw.maxRadius;
    ctx.beginPath();
    ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2);
    ctx.strokeStyle = `rgba(255,80,0,${alpha * 0.7})`;
    ctx.lineWidth = 3;
    ctx.stroke();
  }

  // ── PLAYER ────────────────────────────────────────────────
  const isInvincible = gs.pInvincible > 0;
  if (!isInvincible || Math.floor(performance.now() / 80) % 2 === 0) {
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(gs.px, gs.py, PLAYER_W, PLAYER_H);
    // Gun barrel (always visible, points toward boss)
    const faceRight = gs.bossX > gs.px;
    const gunY = gs.py + PLAYER_H / 2 - 3;
    ctx.fillStyle = "#888888";
    if (faceRight) {
      ctx.fillRect(gs.px + PLAYER_W - 2, gunY, 14, 6);
    } else {
      ctx.fillRect(gs.px - 12, gunY, 14, 6);
    }
    // Muzzle flash when recently fired
    if (performance.now() - gs.lastShootTime < 60) {
      ctx.fillStyle = "#ffee44";
      ctx.shadowColor = "#ffcc00";
      ctx.shadowBlur = 12;
      const mx = faceRight ? gs.px + PLAYER_W + 12 : gs.px - 18;
      ctx.beginPath();
      ctx.arc(mx, gunY + 3, 5, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
    }
    // Sword icon (when melee active)
    if (gs.meleeActive) {
      ctx.strokeStyle = "#ffdd44";
      ctx.lineWidth = 3;
      ctx.shadowColor = "#ffdd44";
      ctx.shadowBlur = 8;
      const sx = faceRight ? gs.px + PLAYER_W : gs.px;
      const sy = gs.py + PLAYER_H / 2;
      ctx.beginPath();
      ctx.moveTo(sx, sy);
      ctx.lineTo(sx + (faceRight ? MELEE_RANGE - 20 : -(MELEE_RANGE - 20)), sy);
      ctx.stroke();
      ctx.shadowBlur = 0;
    }
    // Player face dot
    const faceDir = gs.bossX > gs.px ? PLAYER_W - 8 : 5;
    ctx.fillStyle = "#000";
    ctx.fillRect(gs.px + faceDir, gs.py + 12, 4, 4);
  }

  // ── HUD ───────────────────────────────────────────────────
  drawHUD(ctx, gs, boss);
}

function drawHUD(
  ctx: CanvasRenderingContext2D,
  gs: GameState,
  boss: BossConfig,
) {
  // ── Player HP ─────────────────────────────────────────────
  ctx.fillStyle = "rgba(0,0,0,0.6)";
  ctx.fillRect(14, 14, 164, 24);
  const hpRatio = gs.pHp / 100;
  const hpColor =
    hpRatio > 0.5 ? "#44cc44" : hpRatio > 0.25 ? "#ddaa00" : "#cc2200";
  ctx.fillStyle = hpColor;
  ctx.fillRect(16, 16, Math.max(0, 160 * hpRatio), 20);
  ctx.strokeStyle = "rgba(255,255,255,0.3)";
  ctx.lineWidth = 1;
  ctx.strokeRect(14, 14, 164, 24);
  ctx.fillStyle = "#fff";
  ctx.font = "bold 11px monospace";
  ctx.textAlign = "left";
  ctx.fillText(`HP: ${Math.max(0, gs.pHp)}`, 18, 30);

  // ── Death counter ─────────────────────────────────────────
  ctx.fillStyle = "rgba(255,255,255,0.6)";
  ctx.font = "12px monospace";
  ctx.textAlign = "left";
  ctx.fillText(`💀 ${gs.deathCount}`, 16, 58);

  // ── Boss HP (top center) ─────────────────────────────────
  const barW = 320;
  const barX = (CANVAS_W - barW) / 2;
  const bossRatio = gs.bossHp / boss.maxHp;

  ctx.fillStyle = "rgba(0,0,0,0.7)";
  ctx.fillRect(barX - 2, 12, barW + 4, 36);
  ctx.fillStyle = boss.color;
  ctx.fillRect(barX, 14, Math.max(0, barW * bossRatio), 20);
  ctx.strokeStyle = "rgba(255,255,255,0.3)";
  ctx.lineWidth = 1;
  ctx.strokeRect(barX - 2, 12, barW + 4, 36);

  ctx.fillStyle = boss.eyeColor;
  ctx.font = "bold 13px monospace";
  ctx.textAlign = "center";
  ctx.fillText(boss.name, CANVAS_W / 2, 44);

  // ── Adaptation Progress Bar (top right) ──────────────────
  const adaptRatio = 1 - gs.adaptationTimer / ADAPTATION_INTERVAL;
  const apX = CANVAS_W - 190;

  ctx.fillStyle = "rgba(0,0,0,0.6)";
  ctx.fillRect(apX - 2, 12, 178, 36);
  ctx.fillStyle = "#330044";
  ctx.fillRect(apX, 14, 174, 20);
  ctx.fillStyle = "#8800cc";
  ctx.fillRect(apX, 14, Math.min(174, 174 * adaptRatio), 20);
  ctx.strokeStyle = "rgba(180,0,255,0.4)";
  ctx.lineWidth = 1;
  ctx.strokeRect(apX - 2, 12, 178, 36);
  ctx.fillStyle = "rgba(255,255,255,0.8)";
  ctx.font = "bold 10px monospace";
  ctx.textAlign = "center";
  ctx.fillText("ADAPTING...", apX + 87, 28);

  // Boss level indicator
  ctx.fillStyle = "rgba(180,0,255,0.7)";
  ctx.font = "10px monospace";
  ctx.fillText(`BOSS ${gs.bossIndex + 1} / ${BOSSES.length}`, apX + 87, 42);

  // ── PATTERN LEARNED FLASH (center) ────────────────────────
  if (gs.patternLearnedFlash > 0) {
    const alpha = Math.min(1, gs.patternLearnedFlash / 600);
    ctx.globalAlpha = alpha;
    ctx.fillStyle = "#ffdd00";
    ctx.font = "bold 24px monospace";
    ctx.textAlign = "center";
    ctx.shadowColor = "#ffdd00";
    ctx.shadowBlur = 20;
    ctx.fillText("⚠ PATTERN LEARNED", CANVAS_W / 2, CANVAS_H / 2 - 60);
    ctx.shadowBlur = 0;
    ctx.globalAlpha = 1;
  }

  // ── Learned Patterns Panel (bottom right) ─────────────────
  const patterns = getLearnedPatternTexts(gs.adaptations);
  if (patterns.length > 0) {
    const panelH = 24 + patterns.length * 22;
    const panelY = CANVAS_H - 88 - panelH;
    const panelX = CANVAS_W - 220;

    ctx.fillStyle = "rgba(0,0,0,0.75)";
    ctx.fillRect(panelX, panelY, 210, panelH);
    ctx.strokeStyle = "rgba(200,0,0,0.4)";
    ctx.lineWidth = 1;
    ctx.strokeRect(panelX, panelY, 210, panelH);

    ctx.fillStyle = "#cc2200";
    ctx.font = "bold 10px monospace";
    ctx.textAlign = "left";
    ctx.fillText("LEARNED PATTERNS:", panelX + 8, panelY + 15);

    ctx.fillStyle = "rgba(255,200,200,0.9)";
    ctx.font = "11px monospace";
    patterns.forEach((p, i) => {
      ctx.fillText(`• ${p}`, panelX + 8, panelY + 30 + i * 22);
    });
  }

  // ── Spam Resistance Active ────────────────────────────────
  if (gs.spamResistanceActive) {
    ctx.fillStyle = "rgba(180,0,0,0.6)";
    ctx.font = "bold 12px monospace";
    ctx.textAlign = "center";
    ctx.fillText("SPAM BLOCKED", CANVAS_W / 2, CANVAS_H - 100);
  }
}

// ──────────────────────────────────────────────────────────────
// BOSS SHAPE DRAWING (canvas shapes only)
// ──────────────────────────────────────────────────────────────
function drawBossShape(
  ctx: CanvasRenderingContext2D,
  bx: number,
  by: number,
  bossLevel: number,
  frame: number,
) {
  const pulse = Math.sin(frame * 0.05) * 4;

  if (bossLevel === 1) {
    // THE WATCHER — tall humanoid silhouette, deep red, white eyes
    // Body
    ctx.fillStyle = "#cc2200";
    ctx.fillRect(bx + 10, by, 80, 85);
    // Head
    ctx.fillStyle = "#cc2200";
    ctx.fillRect(bx + 20, by - 35, 60, 40);
    // Eyes
    ctx.fillStyle = "#ffffff";
    ctx.shadowColor = "#ffffff";
    ctx.shadowBlur = 12 + pulse;
    ctx.fillRect(bx + 28, by - 24, 14, 10);
    ctx.fillRect(bx + 54, by - 24, 14, 10);
    ctx.shadowBlur = 0;
    // Pupils (tracking)
    ctx.fillStyle = "#000";
    ctx.fillRect(bx + 32, by - 22, 6, 7);
    ctx.fillRect(bx + 58, by - 22, 6, 7);
    // Arms
    ctx.fillStyle = "#aa1a00";
    ctx.fillRect(bx - 8, by + 10, 18, 50);
    ctx.fillRect(bx + 88, by + 10, 18, 50);
    // Outline glow
    ctx.strokeStyle = `rgba(255,68,34,${0.3 + pulse * 0.03})`;
    ctx.lineWidth = 2;
    ctx.strokeRect(bx + 10, by, 80, 85);
  } else if (bossLevel === 2) {
    // THE ANALYST — four-armed, purple
    // Main body
    ctx.fillStyle = "#4a0080";
    ctx.fillRect(bx + 15, by + 5, 70, 75);
    // Head (elongated)
    ctx.fillStyle = "#4a0080";
    ctx.fillRect(bx + 22, by - 40, 56, 50);
    // 4 Arms
    ctx.fillStyle = "#380060";
    ctx.fillRect(bx - 18, by + 5, 33, 12);
    ctx.fillRect(bx - 18, by + 28, 33, 12);
    ctx.fillRect(bx + 85, by + 5, 33, 12);
    ctx.fillRect(bx + 85, by + 28, 33, 12);
    // Eyes
    ctx.fillStyle = "#cc88ff";
    ctx.shadowColor = "#cc88ff";
    ctx.shadowBlur = 14 + pulse;
    ctx.beginPath();
    ctx.arc(bx + 37, by - 18, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(bx + 63, by - 18, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.fillStyle = "#200040";
    ctx.beginPath();
    ctx.arc(bx + 37, by - 18, 4, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(bx + 63, by - 18, 4, 0, Math.PI * 2);
    ctx.fill();
  } else {
    // THE MIMIC — dark outline, negative space
    ctx.fillStyle = "#050505";
    ctx.fillRect(bx + 12, by + 2, 76, 82);
    ctx.fillRect(bx + 22, by - 38, 56, 44);
    ctx.fillRect(bx - 10, by + 8, 22, 50);
    ctx.fillRect(bx + 88, by + 8, 22, 50);

    // Red outline (glowing)
    ctx.strokeStyle = "#ff3300";
    ctx.shadowColor = "#ff3300";
    ctx.shadowBlur = 16 + pulse;
    ctx.lineWidth = 3;
    ctx.strokeRect(bx + 12, by + 2, 76, 82);
    ctx.strokeRect(bx + 22, by - 38, 56, 44);
    ctx.strokeRect(bx - 10, by + 8, 22, 50);
    ctx.strokeRect(bx + 88, by + 8, 22, 50);
    ctx.shadowBlur = 0;

    // Eyes
    ctx.fillStyle = "#ff3300";
    ctx.shadowColor = "#ff3300";
    ctx.shadowBlur = 12;
    ctx.fillRect(bx + 30, by - 26, 12, 9);
    ctx.fillRect(bx + 56, by - 26, 12, 9);
    ctx.shadowBlur = 0;
  }
}

// ──────────────────────────────────────────────────────────────
// TOUCH OVERLAY (self-contained)
// Renders an on-screen d-pad + action buttons on touch devices only.
// Each button dispatches synthetic KeyboardEvents with the e.code
// values the game's keydown/keyup listeners already listen for, so
// no other game code needs to change.
// ──────────────────────────────────────────────────────────────
function useIsTouchDevice(): boolean {
  if (typeof window === "undefined") return false;
  return "ontouchstart" in window || (navigator.maxTouchPoints ?? 0) > 0;
}

function dispatchKey(code: string, type: "keydown" | "keyup") {
  const event = new KeyboardEvent(type, {
    code,
    key: code,
    bubbles: true,
    cancelable: true,
  });
  window.dispatchEvent(event);
}

function BossesTouchOverlay() {
  const isTouch = useIsTouchDevice();
  if (!isTouch) return null;

  const press = (code: string) => (e: React.PointerEvent) => {
    e.preventDefault();
    dispatchKey(code, "keydown");
  };
  const release = (code: string) => (e: React.PointerEvent) => {
    e.preventDefault();
    dispatchKey(code, "keyup");
  };

  const btn = (
    code: string,
    label: string,
    extraStyle: React.CSSProperties = {},
  ) => (
    <button
      type="button"
      aria-label={label}
      data-ocid={`bosses_learn.touch.${label.toLowerCase().replace(/\s+/g, "_")}`}
      onPointerDown={press(code)}
      onPointerUp={release(code)}
      onPointerLeave={release(code)}
      onPointerCancel={release(code)}
      style={{
        width: 56,
        height: 56,
        borderRadius: 12,
        background: "rgba(255,255,255,0.12)",
        border: "1px solid rgba(255,255,255,0.3)",
        color: "#fff",
        fontFamily: "monospace",
        fontSize: 14,
        fontWeight: "bold",
        cursor: "pointer",
        touchAction: "none",
        userSelect: "none",
        ...extraStyle,
      }}
    >
      {label}
    </button>
  );

  return (
    <div
      aria-label="On-screen game controls"
      data-ocid="bosses_learn.touch_controls"
      style={{
        position: "fixed",
        left: 0,
        right: 0,
        bottom: 0,
        zIndex: 40,
        pointerEvents: "none",
        padding: "12px 16px",
        display: "flex",
        alignItems: "flex-end",
        justifyContent: "space-between",
        gap: 16,
        maxWidth: 780,
        margin: "0 auto",
      }}
    >
      {/* Directional pad: left / jump / right */}
      <div
        style={{
          pointerEvents: "auto",
          display: "grid",
          gridTemplateColumns: "repeat(3, 56px)",
          gridTemplateRows: "56px 56px",
          gap: 6,
          background: "rgba(13,13,13,0.7)",
          padding: 8,
          borderRadius: 16,
          border: "1px solid rgba(255,255,255,0.15)",
        }}
      >
        <span />
        {btn("KeyW", "Jump")}
        <span />
        {btn("KeyA", "Left")}
        {btn("ArrowUp", "Up", { fontSize: 18 })}
        {btn("KeyD", "Right")}
      </div>

      {/* Action buttons: shoot + attacks */}
      <div
        style={{
          pointerEvents: "auto",
          display: "grid",
          gridTemplateColumns: "repeat(2, 56px)",
          gridTemplateRows: "56px 56px",
          gap: 6,
          background: "rgba(13,13,13,0.7)",
          padding: 8,
          borderRadius: 16,
          border: "1px solid rgba(255,255,255,0.15)",
        }}
      >
        {btn("Space", "Fire", { background: "rgba(204,34,0,0.35)" })}
        {btn("KeyZ", "Atk")}
        {btn("KeyX", "Atk2")}
        {btn("KeyJ", "Atk3")}
      </div>
    </div>
  );
}
