import { useCallback, useEffect, useRef, useState } from "react";
import type { ModulePage } from "../../App";
import GameLayout from "../../components/GameLayout";

interface Props {
  onNavigate: (page: ModulePage) => void;
}

type Genre =
  | "horror"
  | "racing"
  | "fighting"
  | "dating"
  | "management"
  | "platformer"
  | "rhythm";

interface GenreMeta {
  name: string;
  subtitle: string;
  color: string;
  bg: string;
  textColor: string;
  instruction: string;
  emoji: string;
}

const GENRE_META: Record<Genre, GenreMeta> = {
  horror: {
    name: "HORROR",
    subtitle: "The Room Hunts You",
    color: "#8b0000",
    bg: "#1a0000",
    textColor: "#ff4444",
    instruction: "CLICK the flickering lights to repel the shadow!",
    emoji: "👁️",
  },
  racing: {
    name: "RACING",
    subtitle: "The Room Is a Track",
    color: "#ff6600",
    bg: "#1a0a00",
    textColor: "#ffaa00",
    instruction: "Arrow keys / WASD to dodge furniture flying at you!",
    emoji: "🏎️",
  },
  fighting: {
    name: "FIGHTING",
    subtitle: "The Room Attacks",
    color: "#cc00cc",
    bg: "#1a001a",
    textColor: "#ff88ff",
    instruction: "CLICK possessed furniture before it reaches you!",
    emoji: "🥊",
  },
  dating: {
    name: "DATING SIM",
    subtitle: "The Room Has Feelings",
    color: "#ff3399",
    bg: "#200010",
    textColor: "#ff99cc",
    instruction: "Choose the correct dialogue option to impress the Lamp!",
    emoji: "💕",
  },
  management: {
    name: "MANAGEMENT SIM",
    subtitle: "The Room Needs Managing",
    color: "#0099cc",
    bg: "#001a2a",
    textColor: "#44ccff",
    instruction: "Click glowing objects to manage them before time runs out!",
    emoji: "📊",
  },
  platformer: {
    name: "PLATFORMER",
    subtitle: "The Room Is a Level",
    color: "#00aa44",
    bg: "#001a0a",
    textColor: "#44ff88",
    instruction: "Arrow keys / WASD to jump between furniture platforms!",
    emoji: "🍄",
  },
  rhythm: {
    name: "RHYTHM GAME",
    subtitle: "The Room Has a Beat",
    color: "#8800ff",
    bg: "#0a001a",
    textColor: "#cc88ff",
    instruction: "Press SPACE / click on beat when the lamp flashes!",
    emoji: "🎵",
  },
};

const GENRES: Genre[] = [
  "horror",
  "racing",
  "fighting",
  "dating",
  "management",
  "platformer",
  "rhythm",
];

// ── Furniture / room objects drawn on canvas ──────────────────────────────
type RoomObject = {
  id: string;
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
  darkColor: string;
};

const BASE_ROOM: RoomObject[] = [
  {
    id: "bed",
    label: "BED",
    x: 30,
    y: 220,
    w: 160,
    h: 80,
    color: "#8B7355",
    darkColor: "#5a4a35",
  },
  {
    id: "desk",
    label: "DESK",
    x: 520,
    y: 240,
    w: 140,
    h: 60,
    color: "#A0522D",
    darkColor: "#6a3a20",
  },
  {
    id: "lamp",
    label: "LAMP",
    x: 540,
    y: 150,
    w: 30,
    h: 90,
    color: "#FFD700",
    darkColor: "#b8a000",
  },
  {
    id: "window",
    label: "WINDOW",
    x: 240,
    y: 30,
    w: 180,
    h: 140,
    color: "#87CEEB",
    darkColor: "#3a6a8a",
  },
  {
    id: "bookshelf",
    label: "SHELF",
    x: 480,
    y: 120,
    w: 50,
    h: 120,
    color: "#8B6914",
    darkColor: "#5a4010",
  },
  {
    id: "chair",
    label: "CHAIR",
    x: 490,
    y: 280,
    w: 60,
    h: 60,
    color: "#556B2F",
    darkColor: "#334020",
  },
  {
    id: "rug",
    label: "RUG",
    x: 130,
    y: 330,
    w: 270,
    h: 90,
    color: "#B22222",
    darkColor: "#7a1616",
  },
  {
    id: "door",
    label: "DOOR",
    x: 20,
    y: 80,
    w: 70,
    h: 180,
    color: "#8B4513",
    darkColor: "#5a2e0d",
  },
];

// ──────────────────────────────────────────────────────────────────────────
// Horror game state
type HorrorState = {
  shadowX: number;
  shadowY: number;
  shadowRadius: number;
  lightFlickers: Array<{ x: number; y: number; r: number; active: boolean }>;
  playerHP: number;
};

// Racing game state
type RacingState = {
  playerX: number;
  playerY: number;
  obstacles: Array<{
    x: number;
    y: number;
    w: number;
    h: number;
    speed: number;
    color: string;
  }>;
  speed: number;
};

// Fighting game state
type FightingState = {
  enemies: Array<{
    id: number;
    x: number;
    y: number;
    hp: number;
    speed: number;
    label: string;
  }>;
  playerHP: number;
  combo: number;
};

// Dating state
type DatingState = {
  lampAffection: number;
  dialoguePhase: number;
  options: string[];
  correctOption: number;
  answered: boolean;
  correct: boolean | null;
  loveHearts: Array<{
    x: number;
    y: number;
    vx: number;
    vy: number;
    life: number;
  }>;
};

// Management state
type ManagementState = {
  tasks: Array<{
    id: string;
    label: string;
    x: number;
    y: number;
    w: number;
    h: number;
    urgency: number;
    maxUrgency: number;
  }>;
  managed: number;
  stress: number;
};

// Platformer state
type PlatformerState = {
  playerX: number;
  playerY: number;
  playerVY: number;
  onGround: boolean;
  platforms: Array<{ x: number; y: number; w: number; h: number }>;
  coins: Array<{ x: number; y: number; collected: boolean }>;
};

// Rhythm state
type RhythmState = {
  beat: number;
  beatInterval: number;
  lastBeatTime: number;
  windowOpen: boolean;
  windowMs: number;
  hits: number;
  misses: number;
  particles: Array<{ x: number; y: number; life: number; color: string }>;
  lampGlow: number;
};

const W = 700;
const H = 450;

export default function OneRoomInfiniteGames({ onNavigate }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef<any>({});
  const rafRef = useRef<number>(0);
  const keysRef = useRef<Set<string>>(new Set());
  const lastFrameRef = useRef<number>(0);

  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [genreIndex, setGenreIndex] = useState(0);
  const [transitioning, setTransitioning] = useState(false);
  const [showIntro, setShowIntro] = useState(true);

  const scoreRef = useRef(0);
  const genreRef = useRef<Genre>("horror");
  const timerRef = useRef(45);
  const transRef = useRef(false);
  const gameOverRef = useRef(false);

  // ── Init genre state ────────────────────────────────────────────────────
  const initGenre = useCallback((genre: Genre) => {
    switch (genre) {
      case "horror":
        stateRef.current = {
          shadowX: W / 2,
          shadowY: H / 2,
          shadowRadius: 60,
          lightFlickers: [
            { x: 200, y: 100, r: 20, active: true },
            { x: 400, y: 80, r: 20, active: true },
            { x: 580, y: 120, r: 20, active: false },
          ],
          playerHP: 100,
        } as HorrorState;
        break;
      case "racing":
        stateRef.current = {
          playerX: W / 2 - 20,
          playerY: H - 80,
          obstacles: [],
          speed: 3,
        } as RacingState;
        break;
      case "fighting":
        stateRef.current = {
          enemies: [],
          playerHP: 100,
          combo: 0,
        } as FightingState;
        break;
      case "dating":
        stateRef.current = buildDatingState();
        break;
      case "management":
        stateRef.current = buildManagementState();
        break;
      case "platformer":
        stateRef.current = {
          playerX: 60,
          playerY: 300,
          playerVY: 0,
          onGround: false,
          platforms: [
            { x: 0, y: 390, w: W, h: 60 },
            { x: 100, y: 310, w: 120, h: 18 },
            { x: 280, y: 260, w: 130, h: 18 },
            { x: 450, y: 210, w: 120, h: 18 },
            { x: 280, y: 150, w: 130, h: 18 },
            { x: 80, y: 180, w: 100, h: 18 },
          ],
          coins: [
            { x: 160, y: 285, collected: false },
            { x: 345, y: 235, collected: false },
            { x: 510, y: 185, collected: false },
            { x: 340, y: 125, collected: false },
            { x: 130, y: 155, collected: false },
          ],
        } as PlatformerState;
        break;
      case "rhythm":
        stateRef.current = {
          beat: 0,
          beatInterval: 800,
          lastBeatTime: performance.now(),
          windowOpen: false,
          windowMs: 300,
          hits: 0,
          misses: 0,
          particles: [],
          lampGlow: 0,
        } as RhythmState;
        break;
    }
  }, []);

  function buildDatingState(): DatingState {
    const phases = [
      {
        options: [
          "You're bright 💡",
          "You flicker too much",
          "You're just a lamp",
        ],
        correct: 0,
      },
      {
        options: [
          "Your shade is perfect",
          "Why are you HERE?!",
          "Lamps are replaceable",
        ],
        correct: 0,
      },
      {
        options: ["I love your glow", "Electricity is overrated", "Whatever"],
        correct: 0,
      },
    ];
    const phase = phases[0];
    return {
      lampAffection: 0,
      dialoguePhase: 0,
      options: phase.options,
      correctOption: phase.correct,
      answered: false,
      correct: null,
      loveHearts: [],
    };
  }

  function buildManagementState(): ManagementState {
    return {
      tasks: BASE_ROOM.map((obj) => ({
        id: obj.id,
        label: obj.label,
        x: obj.x,
        y: obj.y,
        w: obj.w,
        h: obj.h,
        urgency: Math.random() * 0.5,
        maxUrgency: 1,
      })),
      managed: 0,
      stress: 0,
    };
  }

  // ── Drawing helpers ─────────────────────────────────────────────────────
  function drawRoom(ctx: CanvasRenderingContext2D, genre: Genre) {
    const meta = GENRE_META[genre];
    // Background
    ctx.fillStyle = meta.bg;
    ctx.fillRect(0, 0, W, H);

    // Floor
    ctx.fillStyle = "#2a1a0a";
    ctx.fillRect(0, H - 50, W, 50);

    // Wall
    const wallGrad = ctx.createLinearGradient(0, 0, 0, H - 50);
    wallGrad.addColorStop(0, meta.bg);
    wallGrad.addColorStop(1, "#111");
    ctx.fillStyle = wallGrad;
    ctx.fillRect(0, 0, W, H - 50);

    // Room objects (tinted by genre)
    for (const obj of BASE_ROOM) {
      ctx.fillStyle = obj.darkColor;
      ctx.fillRect(obj.x, obj.y, obj.w, obj.h);
      ctx.strokeStyle = `${meta.textColor}44`;
      ctx.lineWidth = 2;
      ctx.strokeRect(obj.x, obj.y, obj.w, obj.h);
      ctx.fillStyle = `${meta.textColor}88`;
      ctx.font = "bold 10px monospace";
      ctx.fillText(obj.label, obj.x + 4, obj.y + 14);
    }
  }

  function drawHUD(
    ctx: CanvasRenderingContext2D,
    genre: Genre,
    timer: number,
    score: number,
  ) {
    const meta = GENRE_META[genre];
    // Timer bar
    ctx.fillStyle = "#000000aa";
    ctx.fillRect(0, 0, W, 36);
    ctx.fillStyle = timer < 10 ? "#ff2222" : meta.color;
    ctx.fillRect(0, 0, (timer / 45) * W, 36);
    ctx.fillStyle = "#fff";
    ctx.font = "bold 14px monospace";
    ctx.fillText(
      `${meta.emoji} ${meta.name} — ${timer}s left   SCORE: ${score}`,
      10,
      24,
    );
  }

  // ── Update + draw per genre ──────────────────────────────────────────────
  function updateHorror(
    ctx: CanvasRenderingContext2D,
    dt: number,
    s: HorrorState,
  ) {
    // Shadow drifts toward center
    const tx = W / 2 - s.shadowX;
    const ty = H / 2 - s.shadowY;
    s.shadowX += tx * 0.005 * dt;
    s.shadowY += ty * 0.005 * dt;
    s.shadowRadius += 0.02 * dt;

    // Draw shadow entity
    const grad = ctx.createRadialGradient(
      s.shadowX,
      s.shadowY,
      0,
      s.shadowX,
      s.shadowY,
      s.shadowRadius,
    );
    grad.addColorStop(0, "rgba(0,0,0,0.95)");
    grad.addColorStop(0.6, "rgba(80,0,0,0.5)");
    grad.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(s.shadowX, s.shadowY, s.shadowRadius, 0, Math.PI * 2);
    ctx.fill();

    // Eyes
    ctx.fillStyle = "#ff0000";
    ctx.beginPath();
    ctx.arc(s.shadowX - 12, s.shadowY - 5, 6, 0, Math.PI * 2);
    ctx.arc(s.shadowX + 12, s.shadowY - 5, 6, 0, Math.PI * 2);
    ctx.fill();

    // Flicker lights
    for (const fl of s.lightFlickers) {
      if (Math.random() < 0.01 * dt) fl.active = !fl.active;
      if (fl.active) {
        const lg = ctx.createRadialGradient(
          fl.x,
          fl.y,
          0,
          fl.x,
          fl.y,
          fl.r * 3,
        );
        lg.addColorStop(0, "rgba(255,240,180,0.7)");
        lg.addColorStop(1, "rgba(0,0,0,0)");
        ctx.fillStyle = lg;
        ctx.beginPath();
        ctx.arc(fl.x, fl.y, fl.r * 3, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#fff";
        ctx.beginPath();
        ctx.arc(fl.x, fl.y, fl.r, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Damage if shadow is too big
    if (s.shadowRadius > 200) {
      s.playerHP -= 0.1 * dt;
      if (s.playerHP <= 0) endGame();
    }

    // HP bar
    ctx.fillStyle = "#880000";
    ctx.fillRect(10, H - 30, 200, 14);
    ctx.fillStyle = `hsl(${s.playerHP}, 80%, 45%)`;
    ctx.fillRect(10, H - 30, (s.playerHP / 100) * 200, 14);
    ctx.fillStyle = "#fff";
    ctx.font = "11px monospace";
    ctx.fillText("SANITY", 14, H - 19);

    scoreRef.current += 0.03 * dt;
  }

  function updateRacing(
    ctx: CanvasRenderingContext2D,
    dt: number,
    s: RacingState,
  ) {
    const keys = keysRef.current;
    const spd = 5;
    if (
      (keys.has("ArrowLeft") || keys.has("a") || keys.has("A")) &&
      s.playerX > 0
    )
      s.playerX -= spd;
    if (
      (keys.has("ArrowRight") || keys.has("d") || keys.has("D")) &&
      s.playerX < W - 50
    )
      s.playerX += spd;
    if (
      (keys.has("ArrowUp") || keys.has("w") || keys.has("W")) &&
      s.playerY > 0
    )
      s.playerY -= spd;
    if (
      (keys.has("ArrowDown") || keys.has("s") || keys.has("S")) &&
      s.playerY < H - 50
    )
      s.playerY += spd;

    s.speed += 0.002 * dt;

    // Spawn obstacles
    if (Math.random() < 0.04 * dt) {
      const obj = BASE_ROOM[Math.floor(Math.random() * BASE_ROOM.length)];
      s.obstacles.push({
        x: Math.random() * (W - 60),
        y: -60,
        w: 50 + Math.random() * 30,
        h: 30 + Math.random() * 20,
        speed: s.speed + Math.random() * 2,
        color: obj.darkColor,
      });
    }

    for (const obs of s.obstacles) {
      obs.y += obs.speed * dt * 0.1 + obs.speed;
    }
    s.obstacles = s.obstacles.filter((o) => o.y < H + 80);

    // Draw road lines
    ctx.strokeStyle = "#ffffff22";
    ctx.lineWidth = 3;
    ctx.setLineDash([30, 20]);
    for (let x = 100; x < W; x += 160) {
      ctx.beginPath();
      ctx.moveTo(x, 0);
      ctx.lineTo(x, H);
      ctx.stroke();
    }
    ctx.setLineDash([]);

    // Draw obstacles
    for (const obs of s.obstacles) {
      ctx.fillStyle = obs.color;
      ctx.fillRect(obs.x, obs.y, obs.w, obs.h);
      ctx.strokeStyle = "#ff660055";
      ctx.lineWidth = 2;
      ctx.strokeRect(obs.x, obs.y, obs.w, obs.h);
    }

    // Draw player car (use bed as car)
    ctx.fillStyle = "#FFD700";
    ctx.fillRect(s.playerX, s.playerY, 50, 40);
    ctx.fillStyle = "#000";
    ctx.fillRect(s.playerX + 5, s.playerY + 5, 15, 10);
    ctx.fillRect(s.playerX + 30, s.playerY + 5, 15, 10);
    // Wheels
    ctx.fillStyle = "#333";
    ctx.beginPath();
    ctx.arc(s.playerX + 10, s.playerY + 38, 7, 0, Math.PI * 2);
    ctx.arc(s.playerX + 40, s.playerY + 38, 7, 0, Math.PI * 2);
    ctx.fill();

    // Collision
    for (const obs of s.obstacles) {
      if (
        s.playerX < obs.x + obs.w &&
        s.playerX + 50 > obs.x &&
        s.playerY < obs.y + obs.h &&
        s.playerY + 40 > obs.y
      ) {
        endGame();
        return;
      }
    }

    scoreRef.current += 0.05 * dt;
  }

  function updateFighting(
    ctx: CanvasRenderingContext2D,
    dt: number,
    s: FightingState,
  ) {
    // Spawn enemies
    if (s.enemies.length < 4 && Math.random() < 0.02 * dt) {
      const obj = BASE_ROOM[Math.floor(Math.random() * BASE_ROOM.length)];
      s.enemies.push({
        id: Date.now() + Math.random(),
        x: Math.random() < 0.5 ? -60 : W + 10,
        y: 100 + Math.random() * 250,
        hp: 3,
        speed: 1 + Math.random(),
        label: obj.label,
      });
    }

    // Move enemies toward center
    for (const e of s.enemies) {
      e.x += (W / 2 - e.x > 0 ? 1 : -1) * e.speed * 0.5;
      if (Math.abs(e.x - W / 2) < 40) {
        s.playerHP -= 0.5 * dt;
        if (s.playerHP <= 0) {
          endGame();
          return;
        }
      }
    }

    // Draw enemies
    for (const e of s.enemies) {
      ctx.fillStyle = "#cc0000";
      ctx.fillRect(e.x, e.y, 60, 40);
      ctx.fillStyle = "#ff8888";
      ctx.font = "bold 10px monospace";
      ctx.fillText(e.label, e.x + 2, e.y + 14);
      // HP pips
      for (let i = 0; i < e.hp; i++) {
        ctx.fillStyle = "#ff4444";
        ctx.fillRect(e.x + i * 16, e.y - 10, 12, 6);
      }
    }

    // HP bar
    ctx.fillStyle = "#880000";
    ctx.fillRect(10, H - 30, 200, 14);
    ctx.fillStyle = `hsl(${s.playerHP}, 80%, 45%)`;
    ctx.fillRect(10, H - 30, (s.playerHP / 100) * 200, 14);
    ctx.fillStyle = "#fff";
    ctx.font = "11px monospace";
    ctx.fillText(`HP  COMBO: ${s.combo}x`, 14, H - 19);

    scoreRef.current += 0.03 * dt;
  }

  function updateDating(
    ctx: CanvasRenderingContext2D,
    dt: number,
    s: DatingState,
  ) {
    // Animate hearts
    for (const h of s.loveHearts) {
      h.x += h.vx;
      h.y += h.vy;
      h.life -= 0.5 * dt;
    }
    s.loveHearts = s.loveHearts.filter((h) => h.life > 0);

    // Draw hearts
    for (const h of s.loveHearts) {
      ctx.fillStyle = `rgba(255,100,150,${h.life / 100})`;
      ctx.font = "20px serif";
      ctx.fillText("❤️", h.x, h.y);
    }

    // Draw lamp character
    ctx.fillStyle = "#FFD700";
    ctx.fillRect(320, 130, 30, 90);
    // Lampshade
    ctx.fillStyle = "#ff9900";
    ctx.beginPath();
    ctx.moveTo(300, 130);
    ctx.lineTo(370, 130);
    ctx.lineTo(355, 90);
    ctx.lineTo(315, 90);
    ctx.closePath();
    ctx.fill();
    // Eyes
    ctx.fillStyle = "#000";
    ctx.beginPath();
    ctx.arc(330, 110, 4, 0, Math.PI * 2);
    ctx.arc(345, 110, 4, 0, Math.PI * 2);
    ctx.fill();
    // Mouth
    if (s.lampAffection > 1) {
      ctx.strokeStyle = "#000";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(337, 120, 8, 0, Math.PI);
      ctx.stroke();
    }
    // Affection bar
    ctx.fillStyle = "#440022";
    ctx.fillRect(10, H - 30, 200, 14);
    ctx.fillStyle = "#ff3399";
    ctx.fillRect(10, H - 30, (s.lampAffection / 3) * 200, 14);
    ctx.fillStyle = "#fff";
    ctx.font = "11px monospace";
    ctx.fillText("LAMP AFFECTION", 14, H - 19);

    if (s.lampAffection >= 3) scoreRef.current += 5;

    // Draw dialogue box
    if (!s.answered || s.correct === null) {
      ctx.fillStyle = "rgba(0,0,0,0.85)";
      ctx.roundRect(40, 280, W - 80, 140, 12);
      ctx.fill();
      ctx.strokeStyle = "#ff3399";
      ctx.lineWidth = 3;
      ctx.roundRect(40, 280, W - 80, 140, 12);
      ctx.stroke();
      ctx.fillStyle = "#ffccee";
      ctx.font = "13px monospace";
      ctx.fillText("The Lamp gazes at you meaningfully...", 60, 305);

      const bw = 170;
      s.options.forEach((opt, i) => {
        const bx = 60 + i * (bw + 14);
        const by = 320;
        ctx.fillStyle = "#cc0055";
        ctx.roundRect(bx, by, bw, 50, 8);
        ctx.fill();
        ctx.fillStyle = "#fff";
        ctx.font = "bold 11px monospace";
        const words = opt.split(" ");
        let line = "";
        let ly = by + 18;
        for (const w of words) {
          if ((line + w).length > 20) {
            ctx.fillText(line, bx + 6, ly);
            line = `${w} `;
            ly += 14;
          } else line += `${w} `;
        }
        ctx.fillText(line, bx + 6, ly);
      });
    } else if (s.answered) {
      ctx.fillStyle = s.correct ? "#00ff8888" : "#ff000088";
      ctx.font = "bold 28px monospace";
      ctx.fillText(
        s.correct ? "✓ The Lamp loves it!" : "✗ The Lamp weeps!",
        140,
        350,
      );
    }

    scoreRef.current += 0.01 * dt;
  }

  function updateManagement(
    ctx: CanvasRenderingContext2D,
    dt: number,
    s: ManagementState,
  ) {
    // Increase urgency
    for (const t of s.tasks) {
      t.urgency += 0.001 * dt;
      if (t.urgency >= 1) s.stress += 0.05 * dt;
    }
    if (s.stress >= 100) {
      endGame();
      return;
    }

    // Draw task boxes
    for (const t of s.tasks) {
      const u = Math.min(t.urgency, 1);
      const r = Math.floor(u * 200);
      const g = Math.floor((1 - u) * 180);
      ctx.fillStyle = `rgba(${r},${g},30,0.85)`;
      ctx.fillRect(t.x, t.y, t.w, t.h);
      ctx.strokeStyle = u > 0.7 ? "#ff0000" : "#44ff88";
      ctx.lineWidth = 3;
      ctx.strokeRect(t.x, t.y, t.w, t.h);
      // Urgency bar inside
      ctx.fillStyle = `rgb(${r},${g},0)`;
      ctx.fillRect(t.x + 2, t.y + t.h - 10, (t.w - 4) * u, 8);
      ctx.fillStyle = "#fff";
      ctx.font = "bold 10px monospace";
      ctx.fillText(t.label, t.x + 4, t.y + 14);
      if (u > 0.7) {
        ctx.fillStyle = `rgba(255,0,0,${(u - 0.7) * 0.8})`;
        ctx.fillRect(t.x, t.y, t.w, t.h);
        ctx.fillStyle = "#fff";
        ctx.font = "bold 11px monospace";
        ctx.fillText("⚠️URGENT", t.x + 4, t.y + t.h / 2);
      }
    }

    // Stress bar
    ctx.fillStyle = "#222";
    ctx.fillRect(10, H - 30, 200, 14);
    ctx.fillStyle = `hsl(${120 - s.stress * 1.2}, 80%, 45%)`;
    ctx.fillRect(10, H - 30, (s.stress / 100) * 200, 14);
    ctx.fillStyle = "#fff";
    ctx.font = "11px monospace";
    ctx.fillText(`STRESS  MANAGED: ${s.managed}`, 14, H - 19);

    scoreRef.current += 0.04 * dt;
  }

  function updatePlatformer(
    ctx: CanvasRenderingContext2D,
    dt: number,
    s: PlatformerState,
  ) {
    const keys = keysRef.current;
    const spd = 4;
    const JUMP = -14;
    const GRAVITY = 0.6;

    if (keys.has("ArrowLeft") || keys.has("a") || keys.has("A"))
      s.playerX -= spd;
    if (keys.has("ArrowRight") || keys.has("d") || keys.has("D"))
      s.playerX += spd;
    if (
      (keys.has("ArrowUp") ||
        keys.has("w") ||
        keys.has("W") ||
        keys.has(" ")) &&
      s.onGround
    ) {
      s.playerVY = JUMP;
      s.onGround = false;
    }

    s.playerVY += GRAVITY;
    s.playerY += s.playerVY;
    s.onGround = false;

    for (const p of s.platforms) {
      if (
        s.playerX + 28 > p.x &&
        s.playerX < p.x + p.w &&
        s.playerY + 32 >= p.y &&
        s.playerY + 32 <= p.y + p.h + Math.abs(s.playerVY) + 2 &&
        s.playerVY >= 0
      ) {
        s.playerY = p.y - 32;
        s.playerVY = 0;
        s.onGround = true;
      }
    }

    if (s.playerY > H + 50) {
      endGame();
      return;
    }
    s.playerX = Math.max(0, Math.min(W - 28, s.playerX));

    // Collect coins
    for (const c of s.coins) {
      if (
        !c.collected &&
        Math.abs(s.playerX + 14 - c.x) < 18 &&
        Math.abs(s.playerY + 16 - c.y) < 18
      ) {
        c.collected = true;
        scoreRef.current += 20;
      }
    }

    // Draw platforms
    for (const p of s.platforms) {
      ctx.fillStyle = "#445";
      ctx.fillRect(p.x, p.y, p.w, p.h);
      ctx.fillStyle = "#667";
      ctx.fillRect(p.x, p.y, p.w, 4);
    }

    // Draw coins
    for (const c of s.coins) {
      if (!c.collected) {
        ctx.fillStyle = "#FFD700";
        ctx.beginPath();
        ctx.arc(c.x, c.y, 10, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#aa8800";
        ctx.font = "bold 10px monospace";
        ctx.fillText("$", c.x - 5, c.y + 4);
      }
    }

    // Draw player
    ctx.fillStyle = "#00ff88";
    ctx.fillRect(s.playerX, s.playerY, 28, 32);
    ctx.fillStyle = "#fff";
    ctx.font = "16px serif";
    ctx.fillText("😀", s.playerX + 4, s.playerY + 22);

    scoreRef.current += 0.03 * dt;
  }

  function updateRhythm(
    ctx: CanvasRenderingContext2D,
    dt: number,
    s: RhythmState,
  ) {
    const now = performance.now();
    const elapsed = now - s.lastBeatTime;

    if (elapsed >= s.beatInterval) {
      s.beat++;
      s.lastBeatTime = now;
      s.lampGlow = 1;
      s.windowOpen = true;
      if (s.misses >= 5) {
        endGame();
        return;
      }
    }

    if (s.windowOpen && elapsed > s.windowMs) {
      s.windowOpen = false;
    }

    s.lampGlow = Math.max(0, s.lampGlow - 0.03 * dt);

    // Animate particles
    for (const p of s.particles) {
      p.x += (Math.random() - 0.5) * 3;
      p.y -= 2;
      p.life -= 2;
    }
    s.particles = s.particles.filter((p) => p.life > 0);

    // Draw lamp with glow
    const glowSize = 20 + s.lampGlow * 60;
    const lg = ctx.createRadialGradient(330, 150, 0, 330, 150, glowSize);
    lg.addColorStop(0, `rgba(255,220,50,${s.lampGlow})`);
    lg.addColorStop(1, "rgba(0,0,0,0)");
    ctx.fillStyle = lg;
    ctx.beginPath();
    ctx.arc(330, 150, glowSize, 0, Math.PI * 2);
    ctx.fill();

    // Lamp body
    ctx.fillStyle = `rgb(${Math.floor(200 + s.lampGlow * 55)},${Math.floor(150 + s.lampGlow * 90)},0)`;
    ctx.fillRect(315, 130, 30, 90);
    ctx.beginPath();
    ctx.moveTo(300, 130);
    ctx.lineTo(360, 130);
    ctx.lineTo(345, 90);
    ctx.lineTo(315, 90);
    ctx.closePath();
    ctx.fill();

    // Draw particles
    for (const p of s.particles) {
      ctx.fillStyle = p.color;
      ctx.font = "16px serif";
      ctx.fillText("★", p.x, p.y);
    }

    // Beat ring
    if (s.lampGlow > 0.5) {
      ctx.strokeStyle = `rgba(255,220,50,${s.lampGlow - 0.3})`;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(330, 150, 40 + (1 - s.lampGlow) * 50, 0, Math.PI * 2);
      ctx.stroke();
    }

    // UI
    ctx.fillStyle = "rgba(0,0,0,0.7)";
    ctx.fillRect(10, H - 30, 300, 20);
    ctx.fillStyle = "#cc88ff";
    ctx.font = "12px monospace";
    ctx.fillText(
      `HITS: ${s.hits}  MISSES: ${s.misses}/5  BEAT: ${s.beat}`,
      14,
      H - 15,
    );

    // Window indicator
    ctx.fillStyle = s.windowOpen ? "#00ff88" : "#ff4444";
    ctx.fillRect(W - 100, H - 30, 90, 20);
    ctx.fillStyle = "#000";
    ctx.font = "bold 11px monospace";
    ctx.fillText(s.windowOpen ? " HIT NOW!" : " WAIT...", W - 98, H - 15);

    scoreRef.current += 0.02 * dt;
  }

  // ── Main game loop ──────────────────────────────────────────────────────
  const gameLoop = (timestamp: number) => {
    if (gameOverRef.current || transRef.current) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const dt = Math.min(timestamp - lastFrameRef.current, 50);
    lastFrameRef.current = timestamp;

    // Timer
    timerRef.current -= dt / 1000;
    if (timerRef.current <= 0) {
      triggerTransition();
      return;
    }

    const genre = genreRef.current;
    const s = stateRef.current;

    drawRoom(ctx, genre);

    switch (genre) {
      case "horror":
        updateHorror(ctx, dt, s as HorrorState);
        break;
      case "racing":
        updateRacing(ctx, dt, s as RacingState);
        break;
      case "fighting":
        updateFighting(ctx, dt, s as FightingState);
        break;
      case "dating":
        updateDating(ctx, dt, s as DatingState);
        break;
      case "management":
        updateManagement(ctx, dt, s as ManagementState);
        break;
      case "platformer":
        updatePlatformer(ctx, dt, s as PlatformerState);
        break;
      case "rhythm":
        updateRhythm(ctx, dt, s as RhythmState);
        break;
    }

    const displayScore = Math.floor(scoreRef.current);
    drawHUD(ctx, genre, Math.ceil(timerRef.current), displayScore);
    setScore(displayScore);

    rafRef.current = requestAnimationFrame(gameLoop);
  };

  function triggerTransition() {
    transRef.current = true;
    setTransitioning(true);
    setTimeout(() => {
      const nextIdx = (GENRES.indexOf(genreRef.current) + 1) % GENRES.length;
      const nextGenre = GENRES[nextIdx];
      genreRef.current = nextGenre;
      timerRef.current = 45;
      initGenre(nextGenre);
      setGenreIndex(nextIdx);
      transRef.current = false;
      setTransitioning(false);
      lastFrameRef.current = performance.now();
      rafRef.current = requestAnimationFrame(gameLoop);
    }, 2000);
  }

  function endGame() {
    gameOverRef.current = true;
    setGameOver(true);
    const s = Math.floor(scoreRef.current);
    setScore(s);
    setHighScore((prev) => Math.max(prev, s));
  }

  function restartGame() {
    gameOverRef.current = false;
    scoreRef.current = 0;
    genreRef.current = GENRES[0];
    timerRef.current = 45;
    transRef.current = false;
    setGameOver(false);
    setScore(0);
    setGenreIndex(0);
    initGenre(GENRES[0]);
    setShowIntro(true);
  }

  function startGame() {
    setShowIntro(false);
    initGenre(genreRef.current);
    lastFrameRef.current = performance.now();
    rafRef.current = requestAnimationFrame(gameLoop);
  }

  // ── Canvas click handler ─────────────────────────────────────────────────
  function handleCanvasClick(e: React.MouseEvent<HTMLCanvasElement>) {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const scaleX = W / rect.width;
    const scaleY = H / rect.height;
    const mx = (e.clientX - rect.left) * scaleX;
    const my = (e.clientY - rect.top) * scaleY;
    const genre = genreRef.current;
    const s = stateRef.current;

    if (genre === "horror") {
      const hs = s as HorrorState;
      for (const fl of hs.lightFlickers) {
        if (!fl.active && Math.hypot(mx - fl.x, my - fl.y) < 30) {
          fl.active = true;
          hs.shadowRadius = Math.max(30, hs.shadowRadius - 30);
          scoreRef.current += 10;
        }
      }
    }
    if (genre === "fighting") {
      const fs = s as FightingState;
      for (let i = fs.enemies.length - 1; i >= 0; i--) {
        const e = fs.enemies[i];
        if (mx >= e.x && mx <= e.x + 60 && my >= e.y && my <= e.y + 40) {
          e.hp--;
          fs.combo++;
          scoreRef.current += 15 * fs.combo;
          if (e.hp <= 0) fs.enemies.splice(i, 1);
          break;
        }
      }
    }
    if (genre === "dating") {
      const ds = s as DatingState;
      if (!ds.answered) {
        const bw = 170;
        ds.options.forEach((_, i) => {
          const bx = 60 + i * (bw + 14);
          const by = 320;
          if (mx >= bx && mx <= bx + bw && my >= by && my <= by + 50) {
            ds.answered = true;
            ds.correct = i === ds.correctOption;
            if (ds.correct) {
              ds.lampAffection++;
              scoreRef.current += 30;
              for (let j = 0; j < 8; j++) {
                ds.loveHearts.push({
                  x: 310 + Math.random() * 60,
                  y: 280,
                  vx: (Math.random() - 0.5) * 3,
                  vy: -2 - Math.random() * 2,
                  life: 100,
                });
              }
            }
            // Advance phase
            setTimeout(() => {
              const phases = [
                {
                  options: [
                    "You're bright 💡",
                    "You flicker too much",
                    "You're just a lamp",
                  ],
                  correct: 0,
                },
                {
                  options: [
                    "Your shade is perfect",
                    "Why are you HERE?!",
                    "Lamps are replaceable",
                  ],
                  correct: 0,
                },
                {
                  options: [
                    "I love your glow",
                    "Electricity is overrated",
                    "Whatever",
                  ],
                  correct: 0,
                },
              ];
              const nextPhase = (ds.dialoguePhase + 1) % phases.length;
              ds.dialoguePhase = nextPhase;
              ds.options = phases[nextPhase].options;
              ds.correctOption = phases[nextPhase].correct;
              ds.answered = false;
              ds.correct = null;
            }, 1200);
          }
        });
      }
    }
    if (genre === "management") {
      const ms = s as ManagementState;
      for (const t of ms.tasks) {
        if (mx >= t.x && mx <= t.x + t.w && my >= t.y && my <= t.y + t.h) {
          t.urgency = Math.max(0, t.urgency - 0.4);
          ms.managed++;
          scoreRef.current += 10;
          ms.stress = Math.max(0, ms.stress - 2);
          break;
        }
      }
    }
    if (genre === "rhythm") {
      const rs = s as RhythmState;
      if (rs.windowOpen) {
        rs.hits++;
        scoreRef.current += 25;
        rs.particles.push(
          { x: mx, y: my, life: 60, color: "#cc88ff" },
          { x: mx + 10, y: my, life: 60, color: "#ffcc00" },
        );
      } else {
        rs.misses++;
      }
    }
  }

  // ── Key listeners ────────────────────────────────────────────────────────
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      keysRef.current.add(e.key);
      // Rhythm space
      if (e.key === " " && genreRef.current === "rhythm") {
        const s = stateRef.current as RhythmState;
        if (s.windowOpen) {
          s.hits++;
          scoreRef.current += 25;
        } else {
          s.misses++;
        }
      }
    };
    const offKey = (e: KeyboardEvent) => keysRef.current.delete(e.key);
    window.addEventListener("keydown", onKey);
    window.addEventListener("keyup", offKey);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("keyup", offKey);
    };
  }, []);

  useEffect(() => {
    return () => cancelAnimationFrame(rafRef.current);
  }, []);

  const meta = GENRE_META[GENRES[genreIndex]];

  return (
    <GameLayout
      title="One Room, Infinite Games"
      score={score}
      highScore={highScore}
      onRestart={restartGame}
      onNavigate={onNavigate}
      gameOver={gameOver}
    >
      <div className="relative w-full" style={{ background: meta.bg }}>
        {/* Transition overlay */}
        {transitioning && (
          <div
            className="absolute inset-0 z-30 flex flex-col items-center justify-center"
            style={{ background: "rgba(0,0,0,0.92)" }}
          >
            <div className="text-center space-y-3">
              <div className="text-6xl animate-bounce">
                {GENRE_META[GENRES[(genreIndex + 1) % GENRES.length]].emoji}
              </div>
              <div
                className="text-3xl font-bold"
                style={{
                  color:
                    GENRE_META[GENRES[(genreIndex + 1) % GENRES.length]]
                      .textColor,
                }}
              >
                THE ROOM IS NOW...
              </div>
              <div
                className="text-5xl font-black"
                style={{
                  color:
                    GENRE_META[GENRES[(genreIndex + 1) % GENRES.length]].color,
                }}
              >
                {GENRE_META[GENRES[(genreIndex + 1) % GENRES.length]].name}
              </div>
              <div className="text-lg text-gray-300">
                {GENRE_META[GENRES[(genreIndex + 1) % GENRES.length]].subtitle}
              </div>
            </div>
          </div>
        )}

        {/* Intro overlay */}
        {showIntro && (
          <div
            className="absolute inset-0 z-30 flex flex-col items-center justify-center"
            style={{ background: "rgba(0,0,0,0.95)" }}
          >
            <div className="text-center space-y-4 max-w-lg px-6">
              <div className="text-5xl">🚪</div>
              <h2 className="text-3xl font-black text-white">ONE ROOM.</h2>
              <h2 className="text-2xl font-black" style={{ color: meta.color }}>
                INFINITE GAMES.
              </h2>
              <p className="text-gray-300 text-sm">
                The room never changes. The rules do.
                <br />
                Every 45 seconds, reality shifts.
                <br />
                <span className="text-yellow-400 font-bold">
                  You did not consent to this.
                </span>
              </p>
              <div className="bg-gray-900 rounded-lg p-3 text-sm text-gray-400 border border-gray-700">
                <div className="font-bold text-white mb-1">
                  Current Genre: {meta.emoji} {meta.name}
                </div>
                {meta.instruction}
              </div>
              <button
                type="button"
                onClick={startGame}
                className="px-8 py-3 rounded-full font-black text-lg text-black"
                style={{ background: meta.color }}
              >
                ENTER THE ROOM
              </button>
            </div>
          </div>
        )}

        {/* Genre banner */}
        {!showIntro && !transitioning && (
          <div
            className="absolute top-10 left-0 right-0 z-10 flex justify-center"
            style={{ pointerEvents: "none" }}
          >
            <div
              className="px-4 py-1 rounded-full text-xs font-bold border"
              style={{
                background: `${meta.bg}cc`,
                color: meta.textColor,
                borderColor: meta.color,
              }}
            >
              {meta.instruction}
            </div>
          </div>
        )}

        <canvas
          ref={canvasRef}
          width={W}
          height={H}
          onClick={handleCanvasClick}
          onKeyDown={() => {}}
          tabIndex={0}
          className="w-full block cursor-crosshair"
          style={{ maxHeight: "70vh", objectFit: "contain" }}
        />
      </div>
    </GameLayout>
  );
}
