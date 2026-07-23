import { useCallback, useEffect, useRef, useState } from "react";
import type { ModulePage } from "../../App";

interface TutorialIsVillainProps {
  onNavigate: (page: ModulePage) => void;
}

type GamePhase =
  | "start"
  | "phase1"
  | "phase2"
  | "phase3"
  | "phase4"
  | "bossfight"
  | "win"
  | "dead";

interface TutorialMessage {
  text: string;
  isLie: boolean;
  lieReveal?: string;
}

interface Player {
  x: number;
  y: number;
  vx: number;
  vy: number;
  onGround: boolean;
  width: number;
  height: number;
  hp: number;
  maxHp: number;
  invincible: number;
  poisoned: boolean;
  poisonTimer: number;
  hasDoubleJump: boolean;
  usedDoubleJump: boolean;
  hasDash: boolean;
  dashCooldown: number;
  isDashing: boolean;
  dashTimer: number;
  facingRight: boolean;
}

interface Platform {
  x: number;
  y: number;
  width: number;
  height: number;
  fake?: boolean;
  revealed?: boolean;
  poisoned?: boolean;
  moving?: boolean;
  moveRange?: number;
  baseX?: number;
  moveDir?: number;
  moveSpeed?: number;
}

interface Enemy {
  x: number;
  y: number;
  width: number;
  height: number;
  vx: number;
  minX: number;
  maxX: number;
  moveDir: number;
  hp: number;
  color: string;
}

interface Trap {
  x: number;
  y: number;
  width: number;
  height: number;
  type: "spike" | "pit" | "laserH" | "laserV";
  active: boolean;
  timer?: number;
}

interface PowerUp {
  x: number;
  y: number;
  width: number;
  height: number;
  type: "doubleJump" | "dash" | "poison" | "weakenBoss";
  collected: boolean;
  glowing: number;
}

interface Boss {
  x: number;
  y: number;
  width: number;
  height: number;
  hp: number;
  maxHp: number;
  phase: 1 | 2 | 3;
  attackTimer: number;
  attackCooldown: number;
  vx: number;
  vy: number;
  onGround: boolean;
  angry: number;
  jumpCooldown: number;
  tauntTimer: number;
}

interface Projectile {
  x: number;
  y: number;
  vx: number;
  vy: number;
  width: number;
  height: number;
  color: string;
  type: "normal" | "targetedHeart" | "smilebeam";
}

const CANVAS_W = 900;
const CANVAS_H = 500;
const GRAVITY = 800;
const JUMP_VY = -430;
const MOVE_SPEED = 200;
const PLAYER_W = 30;
const PLAYER_H = 40;
const BOSS_W = 80;
const BOSS_H = 90;

// Phase configs
const PHASE_CONFIGS: Record<
  GamePhase,
  {
    tutorialMessages: TutorialMessage[];
    tutorialBg: string;
    sinisterLevel: number; // 0-4
  } | null
> = {
  start: null,
  phase1: {
    tutorialBg: "#fffde7",
    sinisterLevel: 0,
    tutorialMessages: [
      {
        text: "👋 Hi there! I'm Tutor! Let's learn the basics together!",
        isLie: false,
      },
      { text: "🌟 Press SPACE to jump! You're a natural!", isLie: false },
      {
        text: "💡 TIP: Always stay on the LEFT side of platforms for safety!",
        isLie: true,
        lieReveal: "LEFT is where all the traps are...",
      },
      {
        text: "💪 I'll give you DOUBLE JUMP — trust me, you'll need it!",
        isLie: true,
        lieReveal: "...but I know your jump ceiling. I designed them.",
      },
    ],
  },
  phase2: {
    tutorialBg: "#e8f5e9",
    sinisterLevel: 1,
    tutorialMessages: [
      {
        text: "⭐ Great progress! Now let me teach you about POWER-UPS!",
        isLie: false,
      },
      {
        text: "💎 Those glowing orbs restore health. Grab them ALL!",
        isLie: true,
        lieReveal: "Half are poison. I know which ones you'll grab.",
      },
      {
        text: "🏃 Use DASH to get through tight spots fast!",
        isLie: true,
        lieReveal: "Dashing into MY traps makes them hurt more...",
      },
      {
        text: "🤩 You're doing amazing! I'm SO proud of you!",
        isLie: true,
        lieReveal: "I'm cataloguing every mistake you make.",
      },
    ],
  },
  phase3: {
    tutorialBg: "#fce4ec",
    sinisterLevel: 2,
    tutorialMessages: [
      {
        text: "😅 Oh! Things are getting harder... weird. Must be a bug!",
        isLie: true,
        lieReveal: "It's not a bug. I increased difficulty manually.",
      },
      {
        text: "🔑 To defeat enemies: spam attacks from the LEFT!",
        isLie: true,
        lieReveal: "Left is their immune side. I taught you wrong on purpose.",
      },
      {
        text: "⚠️ ...Wait, did I just— never mind. Just keep moving!",
        isLie: true,
        lieReveal: "I almost broke character. Focus.",
      },
      {
        text: "😁 I'll always be here to help you! Promise!",
        isLie: true,
        lieReveal: "I am the final boss. I am waiting for you.",
      },
    ],
  },
  phase4: {
    tutorialBg: "#e8eaf6",
    sinisterLevel: 3,
    tutorialMessages: [
      { text: "... you're closer than I expected.", isLie: false },
      {
        text: "🙂 Don't go through that door. It's uh... dangerous.",
        isLie: true,
        lieReveal: "It leads to me. I'm scared.",
      },
      { text: "Everything I taught you... was for a reason.", isLie: false },
      { text: "😬 You wouldn't fight your own tutor... right?", isLie: false },
    ],
  },
  bossfight: {
    tutorialBg: "#212121",
    sinisterLevel: 4,
    tutorialMessages: [
      { text: "You figured it out. I knew you would.", isLie: false },
      {
        text: "Everything I taught you — I taught myself your weaknesses.",
        isLie: false,
      },
      {
        text: "Your double jump ceiling? I set it. Your dash vector? I logged it.",
        isLie: false,
      },
      {
        text: "But I have one weakness too. Can you find it? 😈",
        isLie: false,
      },
    ],
  },
  win: null,
  dead: null,
};

function makePlatforms(phase: GamePhase): Platform[] {
  if (phase === "phase1") {
    return [
      { x: 0, y: 460, width: 900, height: 40 },
      { x: 100, y: 360, width: 120, height: 15 },
      { x: 300, y: 300, width: 120, height: 15 },
      { x: 500, y: 240, width: 120, height: 15 },
      { x: 700, y: 320, width: 120, height: 15 },
    ];
  }
  if (phase === "phase2") {
    return [
      { x: 0, y: 460, width: 900, height: 40, poisoned: true },
      { x: 80, y: 360, width: 100, height: 15, fake: true },
      { x: 230, y: 300, width: 100, height: 15 },
      {
        x: 400,
        y: 240,
        width: 100,
        height: 15,
        moving: true,
        moveRange: 100,
        baseX: 400,
        moveDir: 1,
        moveSpeed: 60,
      },
      { x: 560, y: 320, width: 100, height: 15, fake: true },
      { x: 700, y: 260, width: 100, height: 15 },
      { x: 800, y: 350, width: 80, height: 15 },
    ];
  }
  if (phase === "phase3") {
    return [
      { x: 0, y: 460, width: 900, height: 40 },
      { x: 60, y: 380, width: 80, height: 15 },
      {
        x: 200,
        y: 320,
        width: 80,
        height: 15,
        moving: true,
        moveRange: 80,
        baseX: 200,
        moveDir: 1,
        moveSpeed: 90,
      },
      { x: 350, y: 260, width: 80, height: 15, fake: true },
      { x: 480, y: 200, width: 80, height: 15 },
      {
        x: 620,
        y: 280,
        width: 80,
        height: 15,
        moving: true,
        moveRange: 60,
        baseX: 620,
        moveDir: -1,
        moveSpeed: 110,
      },
      { x: 760, y: 340, width: 80, height: 15 },
    ];
  }
  if (phase === "phase4") {
    return [
      { x: 0, y: 460, width: 400, height: 40 },
      { x: 500, y: 460, width: 400, height: 40 },
      {
        x: 150,
        y: 360,
        width: 80,
        height: 15,
        moving: true,
        moveRange: 100,
        baseX: 150,
        moveDir: 1,
        moveSpeed: 80,
      },
      { x: 340, y: 280, width: 80, height: 15, fake: true },
      { x: 500, y: 300, width: 80, height: 15 },
      { x: 650, y: 220, width: 80, height: 15 },
      {
        x: 780,
        y: 340,
        width: 80,
        height: 15,
        moving: true,
        moveRange: 60,
        baseX: 780,
        moveDir: -1,
        moveSpeed: 100,
      },
    ];
  }
  if (phase === "bossfight") {
    return [
      { x: 0, y: 460, width: 900, height: 40 },
      { x: 100, y: 340, width: 100, height: 15 },
      { x: 700, y: 340, width: 100, height: 15 },
      { x: 380, y: 260, width: 140, height: 15 },
    ];
  }
  return [{ x: 0, y: 460, width: 900, height: 40 }];
}

function makeEnemies(phase: GamePhase): Enemy[] {
  if (phase === "phase1") return [];
  if (phase === "phase2") {
    return [
      {
        x: 350,
        y: 420,
        width: 30,
        height: 35,
        vx: 60,
        minX: 300,
        maxX: 450,
        moveDir: 1,
        hp: 2,
        color: "#ef9a9a",
      },
    ];
  }
  if (phase === "phase3") {
    return [
      {
        x: 200,
        y: 420,
        width: 30,
        height: 35,
        vx: 80,
        minX: 100,
        maxX: 350,
        moveDir: 1,
        hp: 3,
        color: "#ce93d8",
      },
      {
        x: 600,
        y: 420,
        width: 30,
        height: 35,
        vx: 100,
        minX: 500,
        maxX: 750,
        moveDir: -1,
        hp: 3,
        color: "#ce93d8",
      },
    ];
  }
  if (phase === "phase4") {
    return [
      {
        x: 150,
        y: 420,
        width: 35,
        height: 40,
        vx: 100,
        minX: 50,
        maxX: 400,
        moveDir: 1,
        hp: 4,
        color: "#ef5350",
      },
      {
        x: 600,
        y: 420,
        width: 35,
        height: 40,
        vx: 120,
        minX: 500,
        maxX: 850,
        moveDir: -1,
        hp: 4,
        color: "#ef5350",
      },
    ];
  }
  return [];
}

function makeTraps(phase: GamePhase): Trap[] {
  if (phase === "phase1") {
    return [
      { x: 95, y: 445, width: 15, height: 15, type: "spike", active: true },
      { x: 200, y: 445, width: 15, height: 15, type: "spike", active: true },
    ];
  }
  if (phase === "phase2") {
    return [
      {
        x: 350,
        y: 215,
        width: 100,
        height: 8,
        type: "laserH",
        active: false,
        timer: 0,
      },
      { x: 280, y: 445, width: 15, height: 15, type: "spike", active: true },
      { x: 600, y: 445, width: 15, height: 15, type: "spike", active: true },
    ];
  }
  if (phase === "phase3") {
    return [
      {
        x: 440,
        y: 140,
        width: 8,
        height: 200,
        type: "laserV",
        active: false,
        timer: 0,
      },
      { x: 100, y: 445, width: 15, height: 15, type: "spike", active: true },
      { x: 700, y: 445, width: 15, height: 15, type: "spike", active: true },
      { x: 400, y: 445, width: 15, height: 15, type: "spike", active: true },
    ];
  }
  if (phase === "phase4") {
    return [
      {
        x: 420,
        y: 340,
        width: 60,
        height: 8,
        type: "laserH",
        active: false,
        timer: 0,
      },
      {
        x: 200,
        y: 200,
        width: 8,
        height: 200,
        type: "laserV",
        active: false,
        timer: 0,
      },
      { x: 600, y: 445, width: 15, height: 15, type: "spike", active: true },
      { x: 50, y: 445, width: 15, height: 15, type: "spike", active: true },
    ];
  }
  return [];
}

function makePowerUps(phase: GamePhase): PowerUp[] {
  if (phase === "phase1") {
    return [
      {
        x: 300,
        y: 270,
        width: 22,
        height: 22,
        type: "doubleJump",
        collected: false,
        glowing: 0,
      },
    ];
  }
  if (phase === "phase2") {
    return [
      {
        x: 560,
        y: 230,
        width: 22,
        height: 22,
        type: "poison",
        collected: false,
        glowing: 0,
      },
      {
        x: 700,
        y: 230,
        width: 22,
        height: 22,
        type: "dash",
        collected: false,
        glowing: 0,
      },
    ];
  }
  if (phase === "phase3") {
    return [
      {
        x: 480,
        y: 170,
        width: 22,
        height: 22,
        type: "poison",
        collected: false,
        glowing: 0,
      },
    ];
  }
  if (phase === "phase4") {
    return [
      {
        x: 650,
        y: 190,
        width: 22,
        height: 22,
        type: "weakenBoss",
        collected: false,
        glowing: 0,
      },
    ];
  }
  return [];
}

const EXIT_X = 840;
const EXIT_Y = 380;
const EXIT_W = 40;
const EXIT_H = 80;

export default function TutorialIsVillain({
  onNavigate,
}: TutorialIsVillainProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const stateRef = useRef({
    phase: "start" as GamePhase,
    player: null as Player | null,
    platforms: [] as Platform[],
    enemies: [] as Enemy[],
    traps: [] as Trap[],
    powerUps: [] as PowerUp[],
    boss: null as Boss | null,
    projectiles: [] as Projectile[],
    keys: {} as Record<string, boolean>,
    messageIndex: 0,
    messageTimer: 0,
    bossWeakened: false,
    revealLies: false,
    lieRevealTimer: 0,
    camera: { x: 0 },
    phase1Complete: false,
    phase2Complete: false,
    phase3Complete: false,
    phase4Complete: false,
    tutorFaceAngle: 0,
    tutorBlink: 0,
    particles: [] as Array<{
      x: number;
      y: number;
      vx: number;
      vy: number;
      life: number;
      color: string;
      size: number;
    }>,
    bossDeathTimer: 0,
    isDead: false,
    isWin: false,
    deathReveal: "",
    jumpPressed: false,
    attackPressed: false,
    attackCooldown: 0,
    attackBox: null as {
      x: number;
      y: number;
      width: number;
      height: number;
      timer: number;
    } | null,
  });
  const [gamePhase, setGamePhase] = useState<GamePhase>("start");
  const [currentMessage, setCurrentMessage] = useState<TutorialMessage | null>(
    null,
  );
  const [showLieReveal, setShowLieReveal] = useState(false);
  const [sinisterLevel, setSinisterLevel] = useState(0);
  const [hpDisplay, setHpDisplay] = useState({ hp: 5, maxHp: 5 });
  const [bossHpDisplay, setBossHpDisplay] = useState({ hp: 30, maxHp: 30 });
  const [showBossHp, setShowBossHp] = useState(false);
  const [lieRevealText, setLieRevealText] = useState("");
  const rafRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);

  const initPhase = useCallback((phase: GamePhase) => {
    const s = stateRef.current;
    s.phase = phase;
    s.platforms = makePlatforms(phase);
    s.enemies = makeEnemies(phase);
    s.traps = makeTraps(phase);
    s.powerUps = makePowerUps(phase);
    s.projectiles = [];
    s.particles = [];
    s.messageIndex = 0;
    s.messageTimer = 0;
    s.revealLies = false;
    s.lieRevealTimer = 0;
    s.jumpPressed = false;
    s.attackPressed = false;
    s.attackCooldown = 0;
    s.attackBox = null;
    s.isDead = false;
    s.isWin = false;

    if (phase === "bossfight") {
      s.boss = {
        x: 450,
        y: 350,
        width: BOSS_W,
        height: BOSS_H,
        hp: s.bossWeakened ? 22 : 30,
        maxHp: s.bossWeakened ? 22 : 30,
        phase: 1,
        attackTimer: 0,
        attackCooldown: 2.2,
        vx: 0,
        vy: 0,
        onGround: false,
        angry: 0,
        jumpCooldown: 0,
        tauntTimer: 3,
      };
      setShowBossHp(true);
      setBossHpDisplay({ hp: s.boss.hp, maxHp: s.boss.maxHp });
    } else {
      s.boss = null;
      setShowBossHp(false);
    }

    s.player = {
      x: 60,
      y: 380,
      vx: 0,
      vy: 0,
      onGround: false,
      width: PLAYER_W,
      height: PLAYER_H,
      hp: 5,
      maxHp: 5,
      invincible: 0,
      poisoned: false,
      poisonTimer: 0,
      hasDoubleJump: phase !== "phase1",
      usedDoubleJump: false,
      hasDash: ["phase3", "phase4", "bossfight"].includes(phase),
      dashCooldown: 0,
      isDashing: false,
      dashTimer: 0,
      facingRight: true,
    };

    const config = PHASE_CONFIGS[phase];
    if (config) {
      setSinisterLevel(config.sinisterLevel);
      setCurrentMessage(config.tutorialMessages[0] ?? null);
    }
    setHpDisplay({ hp: 5, maxHp: 5 });
    setShowLieReveal(false);
    setLieRevealText("");
    setGamePhase(phase);
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const s = stateRef.current;
      const key = e.key.toLowerCase();
      if (e.type === "keydown") {
        s.keys[key] = true;
        if (
          (key === " " || key === "arrowup" || key === "w") &&
          !s.jumpPressed
        ) {
          s.jumpPressed = true;
        }
        if (key === "z" || key === "x" || key === "enter") {
          s.attackPressed = true;
        }
      } else {
        s.keys[key] = false;
        if (key === " " || key === "arrowup" || key === "w")
          s.jumpPressed = false;
      }
    };
    window.addEventListener("keydown", handleKey);
    window.addEventListener("keyup", handleKey);
    return () => {
      window.removeEventListener("keydown", handleKey);
      window.removeEventListener("keyup", handleKey);
    };
  }, []);

  const spawnParticles = (x: number, y: number, color: string, count = 8) => {
    const s = stateRef.current;
    for (let i = 0; i < count; i++) {
      s.particles.push({
        x,
        y,
        vx: (Math.random() - 0.5) * 200,
        vy: -Math.random() * 200 - 50,
        life: 1,
        color,
        size: Math.random() * 6 + 3,
      });
    }
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: spawnParticles is stable
  const gameLoop = useCallback(
    (now: number) => {
      const dt = Math.min((now - lastTimeRef.current) / 1000, 0.05);
      lastTimeRef.current = now;
      const s = stateRef.current;
      const canvas = canvasRef.current;
      if (!canvas) {
        rafRef.current = requestAnimationFrame(gameLoop);
        return;
      }
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        rafRef.current = requestAnimationFrame(gameLoop);
        return;
      }

      if (s.phase === "start" || s.phase === "win" || s.phase === "dead") {
        rafRef.current = requestAnimationFrame(gameLoop);
        return;
      }

      const phase = s.phase;
      const player = s.player!;

      // ---- Tutorial Message cycling ----
      const config = PHASE_CONFIGS[phase];
      if (config) {
        s.messageTimer += dt;
        if (s.messageTimer > 5) {
          s.messageTimer = 0;
          s.messageIndex =
            (s.messageIndex + 1) % config.tutorialMessages.length;
          const msg = config.tutorialMessages[s.messageIndex];
          setCurrentMessage(msg);
          // Show lie reveal briefly
          if (msg.isLie && msg.lieReveal) {
            s.revealLies = true;
            s.lieRevealTimer = 2.5;
            setShowLieReveal(true);
            setLieRevealText(msg.lieReveal);
          } else {
            setShowLieReveal(false);
          }
        }
        if (s.revealLies) {
          s.lieRevealTimer -= dt;
          if (s.lieRevealTimer <= 0) {
            s.revealLies = false;
            setShowLieReveal(false);
          }
        }
      }

      // ---- Moving platforms ----
      for (const plat of s.platforms) {
        if (plat.moving) {
          plat.x += (plat.moveSpeed ?? 60) * (plat.moveDir ?? 1) * dt;
          if (
            plat.moveDir === 1 &&
            plat.x > (plat.baseX ?? 0) + (plat.moveRange ?? 80)
          )
            plat.moveDir = -1;
          if (
            plat.moveDir === -1 &&
            plat.x < (plat.baseX ?? 0) - (plat.moveRange ?? 80)
          )
            plat.moveDir = 1;
        }
      }

      // ---- Laser traps ----
      for (const trap of s.traps) {
        if (trap.type === "laserH" || trap.type === "laserV") {
          trap.timer = (trap.timer ?? 0) + dt;
          // Toggle active every 1.5s
          if (trap.timer > 1.5) {
            trap.timer = 0;
            trap.active = !trap.active;
          }
        }
      }

      // ---- Player movement ----
      const keys = s.keys;
      const left = keys.arrowleft || keys.a;
      const right = keys.arrowright || keys.d;
      const dashKey = keys.shift;

      // Dash
      if (player.isDashing) {
        player.dashTimer -= dt;
        if (player.dashTimer <= 0) {
          player.isDashing = false;
          player.vx = 0;
        }
      } else {
        if (player.dashCooldown > 0) player.dashCooldown -= dt;
        if (dashKey && player.hasDash && player.dashCooldown <= 0) {
          player.isDashing = true;
          player.dashTimer = 0.18;
          player.dashCooldown = 0.9;
          player.vx = player.facingRight ? 480 : -480;
        } else {
          if (left) {
            player.vx = -MOVE_SPEED;
            player.facingRight = false;
          } else if (right) {
            player.vx = MOVE_SPEED;
            player.facingRight = true;
          } else player.vx = 0;
        }
      }

      // Jump
      if (s.jumpPressed) {
        s.jumpPressed = false;
        if (player.onGround) {
          player.vy = JUMP_VY;
          player.onGround = false;
          player.usedDoubleJump = false;
        } else if (player.hasDoubleJump && !player.usedDoubleJump) {
          player.vy = JUMP_VY * 0.9;
          player.usedDoubleJump = true;
        }
      }

      // Attack
      if (s.attackCooldown > 0) s.attackCooldown -= dt;
      if (s.attackPressed && s.attackCooldown <= 0) {
        s.attackPressed = false;
        s.attackCooldown = 0.35;
        const atkX = player.facingRight
          ? player.x + player.width
          : player.x - 40;
        s.attackBox = {
          x: atkX,
          y: player.y,
          width: 40,
          height: player.height,
          timer: 0.15,
        };
        spawnParticles(atkX + 20, player.y + 20, "#FFE066", 5);
      } else {
        s.attackPressed = false;
      }
      if (s.attackBox) {
        s.attackBox.timer -= dt;
        if (s.attackBox.timer <= 0) s.attackBox = null;
      }

      // Gravity
      if (!player.isDashing) player.vy += GRAVITY * dt;
      player.x += player.vx * dt;
      player.y += player.vy * dt;

      // Clamp horizontal
      if (player.x < 0) player.x = 0;
      if (player.x + player.width > CANVAS_W)
        player.x = CANVAS_W - player.width;

      // ---- Platform collision ----
      player.onGround = false;
      for (const plat of s.platforms) {
        if (plat.fake && !plat.revealed) continue; // fake platforms only block if revealed as gone
        if (plat.fake) continue; // fake = walk through always
        const px = player.x;
        const py = player.y;
        const pw = player.width;
        const ph = player.height;
        const platRight = plat.x + plat.width;
        const platBottom = plat.y + plat.height;
        const overlap =
          px < platRight &&
          px + pw > plat.x &&
          py < platBottom &&
          py + ph > plat.y;
        if (overlap) {
          const overlapBottom = platBottom - py;
          const overlapTop = py + ph - plat.y;
          const overlapLeft = platRight - px;
          const overlapRight = px + pw - plat.x;
          const minO = Math.min(
            overlapTop,
            overlapBottom,
            overlapLeft,
            overlapRight,
          );
          if (minO === overlapTop && player.vy >= 0) {
            player.y = plat.y - ph;
            player.vy = 0;
            player.onGround = true;
            player.usedDoubleJump = false;
            if (plat.poisoned && !player.poisoned) {
              player.poisoned = true;
              player.poisonTimer = 3;
            }
          } else if (minO === overlapBottom && player.vy < 0) {
            player.y = platBottom;
            player.vy = 0;
          } else if (minO === overlapLeft) {
            player.x = platRight;
          } else if (minO === overlapRight) {
            player.x = plat.x - pw;
          }
        }
      }

      // Fall death
      if (player.y > CANVAS_H + 50) {
        s.isDead = true;
        setGamePhase("dead");
        s.deathReveal = "Tutor built the pit. He measured your jump arc.";
        return;
      }

      // ---- Invincibility ----
      if (player.invincible > 0) player.invincible -= dt;

      // ---- Poison ----
      if (player.poisoned) {
        player.poisonTimer -= dt;
        if (Math.floor(player.poisonTimer * 10) % 10 === 0) {
          // drain hp slowly
        }
        if (player.poisonTimer <= 0) {
          player.poisoned = false;
          if (player.hp > 1) {
            player.hp -= 1;
            setHpDisplay({ hp: player.hp, maxHp: player.maxHp });
          }
        }
      }

      // ---- Enemy AI ----
      for (let i = s.enemies.length - 1; i >= 0; i--) {
        const e = s.enemies[i];
        e.x += e.vx * e.moveDir * dt;
        if (e.x < e.minX) {
          e.x = e.minX;
          e.moveDir *= -1;
        }
        if (e.x > e.maxX) {
          e.x = e.maxX;
          e.moveDir *= -1;
        }

        // Enemy falls with gravity simplified
        const onGround2 = e.y + e.height >= CANVAS_H - 40;
        if (!onGround2) e.y += 5;

        // Attack box vs enemy
        if (s.attackBox) {
          const abox = s.attackBox;
          if (
            e.x < abox.x + abox.width &&
            e.x + e.width > abox.x &&
            e.y < abox.y + abox.height &&
            e.y + e.height > abox.y
          ) {
            e.hp -= 1;
            spawnParticles(e.x + e.width / 2, e.y, "#ff4444", 6);
            if (e.hp <= 0) {
              spawnParticles(
                e.x + e.width / 2,
                e.y + e.height / 2,
                "#ffd700",
                14,
              );
              s.enemies.splice(i, 1);
              continue;
            }
          }
        }

        // Player vs enemy contact
        if (player.invincible <= 0) {
          const hit =
            e.x < player.x + player.width &&
            e.x + e.width > player.x &&
            e.y < player.y + player.height &&
            e.y + e.height > player.y;
          if (hit) {
            player.hp -= 1;
            player.invincible = 1.2;
            setHpDisplay({ hp: player.hp, maxHp: player.maxHp });
            spawnParticles(player.x + 15, player.y + 20, "#ef5350", 8);
            if (player.hp <= 0) {
              s.isDead = true;
              setGamePhase("dead");
              s.deathReveal =
                "Every enemy was designed with YOUR hitbox in mind.";
              return;
            }
          }
        }
      }

      // ---- Trap collision ----
      for (const trap of s.traps) {
        if (!trap.active) continue;
        const hit =
          player.x < trap.x + trap.width &&
          player.x + player.width > trap.x &&
          player.y < trap.y + trap.height &&
          player.y + player.height > trap.y;
        if (hit && player.invincible <= 0) {
          if (trap.type === "spike" || trap.type === "pit") {
            s.isDead = true;
            setGamePhase("dead");
            s.deathReveal =
              "Tutor placed every spike. He told you they were decorations.";
            return;
          }
          player.hp -= 1;
          player.invincible = 0.8;
          setHpDisplay({ hp: player.hp, maxHp: player.maxHp });
          if (player.hp <= 0) {
            s.isDead = true;
            setGamePhase("dead");
            s.deathReveal =
              '"Lasers are safe if you avoid them." — Tutor. There was no safe path.';
            return;
          }
        }
      }

      // ---- Power-Up collection ----
      for (const pu of s.powerUps) {
        if (pu.collected) continue;
        pu.glowing += dt * 3;
        const hit =
          player.x < pu.x + pu.width &&
          player.x + pu.width > pu.x &&
          player.y < pu.y + pu.height &&
          player.y + player.height > pu.y;
        if (hit) {
          pu.collected = true;
          spawnParticles(
            pu.x + 11,
            pu.y + 11,
            pu.type === "poison" ? "#a5d6a7" : "#ffd700",
            12,
          );
          if (pu.type === "doubleJump") player.hasDoubleJump = true;
          else if (pu.type === "dash") player.hasDash = true;
          else if (pu.type === "poison") {
            player.hp = Math.max(1, player.hp - 2);
            player.poisoned = true;
            player.poisonTimer = 4;
            setHpDisplay({ hp: player.hp, maxHp: player.maxHp });
          } else if (pu.type === "weakenBoss") {
            s.bossWeakened = true;
          }
        }
      }

      // ---- Boss logic ----
      const boss = s.boss;
      if (boss) {
        // Boss gravity
        boss.vy += GRAVITY * dt;
        boss.x += boss.vx * dt;
        boss.y += boss.vy * dt;
        if (boss.x < 0) {
          boss.x = 0;
          boss.vx = Math.abs(boss.vx);
        }
        if (boss.x + boss.width > CANVAS_W) {
          boss.x = CANVAS_W - boss.width;
          boss.vx = -Math.abs(boss.vx);
        }

        // Boss platform collision
        boss.onGround = false;
        for (const plat of s.platforms) {
          if (
            boss.y + boss.height > plat.y &&
            boss.y < plat.y + plat.height &&
            boss.x + boss.width > plat.x &&
            boss.x < plat.x + plat.width &&
            boss.vy > 0
          ) {
            boss.y = plat.y - boss.height;
            boss.vy = 0;
            boss.onGround = true;
          }
        }
        if (boss.y + boss.height > CANVAS_H) {
          boss.y = CANVAS_H - boss.height;
          boss.vy = 0;
          boss.onGround = true;
        }

        // Boss movement: chase player
        boss.tauntTimer -= dt;
        boss.attackTimer -= dt;
        boss.jumpCooldown -= dt;
        const distX = player.x - boss.x;
        const moveDir = distX > 0 ? 1 : -1;
        const bossSpeed = boss.phase === 1 ? 120 : boss.phase === 2 ? 180 : 250;
        boss.vx = moveDir * bossSpeed;

        // Jump at player
        if (boss.onGround && boss.jumpCooldown <= 0 && Math.abs(distX) < 300) {
          boss.vy = -500;
          boss.jumpCooldown = 1.8;
        }

        // Attack: fire projectile
        if (boss.attackTimer <= 0) {
          boss.attackTimer = boss.attackCooldown;
          const ptype: "normal" | "targetedHeart" | "smilebeam" =
            boss.phase === 1
              ? "targetedHeart"
              : boss.phase === 2
                ? "normal"
                : "smilebeam";
          const dx = player.x - (boss.x + boss.width / 2);
          const dy = player.y - (boss.y + boss.height / 2);
          const dist = Math.sqrt(dx * dx + dy * dy) || 1;
          const speed = boss.phase === 3 ? 350 : 250;
          s.projectiles.push({
            x: boss.x + boss.width / 2,
            y: boss.y + boss.height / 2,
            vx: (dx / dist) * speed,
            vy: (dy / dist) * speed,
            width: ptype === "smilebeam" ? 20 : 15,
            height: ptype === "smilebeam" ? 20 : 15,
            color:
              ptype === "smilebeam"
                ? "#ff69b4"
                : ptype === "targetedHeart"
                  ? "#f48fb1"
                  : "#ef5350",
            type: ptype,
          });
          if (boss.phase >= 2) {
            // Extra side projectiles
            s.projectiles.push({
              x: boss.x + boss.width / 2,
              y: boss.y + boss.height / 2,
              vx: (dx / dist) * speed * 0.8 + 80,
              vy: (dy / dist) * speed * 0.8,
              width: 12,
              height: 12,
              color: "#ef9a9a",
              type: "normal",
            });
          }
        }

        // Phase transitions
        const hpRatio = boss.hp / boss.maxHp;
        if (boss.phase === 1 && hpRatio < 0.66) {
          boss.phase = 2;
          boss.attackCooldown = 1.6;
          boss.angry = 1;
        } else if (boss.phase === 2 && hpRatio < 0.33) {
          boss.phase = 3;
          boss.attackCooldown = 1.0;
          boss.angry = 2;
        }

        // Boss contact damage
        if (player.invincible <= 0) {
          const hit =
            player.x < boss.x + boss.width &&
            player.x + player.width > boss.x &&
            player.y < boss.y + boss.height &&
            player.y + player.height > boss.y;
          if (hit) {
            player.hp -= 1;
            player.invincible = 1.2;
            setHpDisplay({ hp: player.hp, maxHp: player.maxHp });
            if (player.hp <= 0) {
              s.isDead = true;
              setGamePhase("dead");
              s.deathReveal =
                '"I taught you how to play. I designed your defeat." — Tutor';
              return;
            }
          }
        }

        // Player attack vs boss
        if (s.attackBox) {
          const abox = s.attackBox;
          if (
            boss.x < abox.x + abox.width &&
            boss.x + boss.width > abox.x &&
            boss.y < abox.y + abox.height &&
            boss.y + boss.height > abox.y
          ) {
            boss.hp -= 1;
            spawnParticles(boss.x + boss.width / 2, boss.y, "#ffd700", 8);
            setBossHpDisplay({ hp: boss.hp, maxHp: boss.maxHp });
            if (boss.hp <= 0) {
              s.isWin = true;
              setGamePhase("win");
              return;
            }
          }
        }
      }

      // ---- Projectile movement ----
      for (let i = s.projectiles.length - 1; i >= 0; i--) {
        const proj = s.projectiles[i];
        proj.x += proj.vx * dt;
        proj.y += proj.vy * dt;
        proj.vy += GRAVITY * 0.1 * dt;
        if (
          proj.x < -50 ||
          proj.x > CANVAS_W + 50 ||
          proj.y > CANVAS_H + 50 ||
          proj.y < -100
        ) {
          s.projectiles.splice(i, 1);
          continue;
        }
        if (player.invincible <= 0) {
          const hit =
            player.x < proj.x + proj.width &&
            player.x + player.width > proj.x &&
            player.y < proj.y + proj.height &&
            player.y + player.height > proj.y;
          if (hit) {
            s.projectiles.splice(i, 1);
            player.hp -= 1;
            player.invincible = 0.8;
            setHpDisplay({ hp: player.hp, maxHp: player.maxHp });
            spawnParticles(player.x + 15, player.y + 20, "#ef5350", 6);
            if (player.hp <= 0) {
              s.isDead = true;
              setGamePhase("dead");
              s.deathReveal =
                "Tutor aimed every shot based on your movement history.";
              return;
            }
          }
        }
      }

      // ---- Particles ----
      for (let i = s.particles.length - 1; i >= 0; i--) {
        const p = s.particles[i];
        p.x += p.vx * dt;
        p.y += p.vy * dt;
        p.vy += 300 * dt;
        p.life -= dt * 1.5;
        if (p.life <= 0) s.particles.splice(i, 1);
      }

      // ---- Exit detection ----
      if (phase !== "bossfight") {
        const hit =
          player.x < EXIT_X + EXIT_W &&
          player.x + player.width > EXIT_X &&
          player.y < EXIT_Y + EXIT_H &&
          player.y + player.height > EXIT_Y;
        if (hit) {
          const next: Record<string, GamePhase> = {
            phase1: "phase2",
            phase2: "phase3",
            phase3: "phase4",
            phase4: "bossfight",
          };
          if (next[phase]) initPhase(next[phase]);
        }
      }

      // ---- Tutor face animation ----
      s.tutorFaceAngle += dt * 1.2;
      s.tutorBlink += dt;
      if (s.tutorBlink > 3) s.tutorBlink = 0;

      // ---- DRAW ----
      const sinister = config?.sinisterLevel ?? (phase === "bossfight" ? 4 : 0);

      // Background
      if (phase === "bossfight") {
        ctx.fillStyle = "#0d0d0d";
        ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);
        // Evil stars
        for (let i = 0; i < 30; i++) {
          const sx = (i * 137 + 50) % CANVAS_W;
          const sy = (i * 79 + 30) % (CANVAS_H - 60);
          ctx.fillStyle = `rgba(255,80,80,${0.3 + 0.4 * Math.sin(now / 800 + i)})`;
          ctx.beginPath();
          ctx.arc(sx, sy, 1.5, 0, Math.PI * 2);
          ctx.fill();
        }
      } else {
        // Gradient bg that gets more ominous
        const bgColors = [
          ["#e3f2fd", "#b3e5fc"],
          ["#e8f5e9", "#c8e6c9"],
          ["#fce4ec", "#f8bbd9"],
          ["#ede7f6", "#d1c4e9"],
        ];
        const ci = Math.min(sinister, bgColors.length - 1);
        const grad = ctx.createLinearGradient(0, 0, 0, CANVAS_H);
        grad.addColorStop(0, bgColors[ci][0]);
        grad.addColorStop(1, bgColors[ci][1]);
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

        // Background decorations get sinister
        if (sinister < 2) {
          // Happy clouds
          ctx.fillStyle = "rgba(255,255,255,0.7)";
          for (let i = 0; i < 4; i++) {
            const cx = 100 + i * 220 + Math.sin(now / 3000 + i) * 20;
            ctx.beginPath();
            ctx.arc(cx, 60, 30, 0, Math.PI * 2);
            ctx.arc(cx + 25, 50, 25, 0, Math.PI * 2);
            ctx.arc(cx + 50, 60, 30, 0, Math.PI * 2);
            ctx.fill();
          }
        } else {
          // Ominous red clouds
          ctx.fillStyle = `rgba(239,83,80,${0.1 + sinister * 0.04})`;
          for (let i = 0; i < 4; i++) {
            const cx = 100 + i * 220 + Math.sin(now / 3000 + i) * 20;
            ctx.beginPath();
            ctx.arc(cx, 60, 30, 0, Math.PI * 2);
            ctx.arc(cx + 25, 50, 25, 0, Math.PI * 2);
            ctx.arc(cx + 50, 60, 30, 0, Math.PI * 2);
            ctx.fill();
          }
        }
      }

      // ---- Platforms ----
      for (const plat of s.platforms) {
        if (plat.fake) {
          // Draw with dashed outline to hint
          ctx.strokeStyle =
            sinister >= 2 ? "rgba(239,83,80,0.4)" : "rgba(200,200,200,0.3)";
          ctx.lineWidth = 2;
          ctx.setLineDash([6, 4]);
          ctx.strokeRect(plat.x, plat.y, plat.width, plat.height);
          ctx.setLineDash([]);
          ctx.fillStyle =
            sinister >= 2 ? "rgba(239,83,80,0.15)" : "rgba(200,200,200,0.2)";
          ctx.fillRect(plat.x, plat.y, plat.width, plat.height);
        } else if (plat.poisoned) {
          const poisonGrad = ctx.createLinearGradient(
            plat.x,
            plat.y,
            plat.x,
            plat.y + plat.height,
          );
          poisonGrad.addColorStop(0, "#81c784");
          poisonGrad.addColorStop(1, "#4caf50");
          ctx.fillStyle = poisonGrad;
          ctx.fillRect(plat.x, plat.y, plat.width, plat.height);
        } else if (phase === "bossfight") {
          ctx.fillStyle = "#37474f";
          ctx.fillRect(plat.x, plat.y, plat.width, plat.height);
          ctx.fillStyle = "#546e7a";
          ctx.fillRect(plat.x, plat.y, plat.width, 4);
        } else {
          const platGrad = ctx.createLinearGradient(
            plat.x,
            plat.y,
            plat.x,
            plat.y + plat.height,
          );
          platGrad.addColorStop(0, sinister >= 2 ? "#b39ddb" : "#80cbc4");
          platGrad.addColorStop(1, sinister >= 2 ? "#7e57c2" : "#4db6ac");
          ctx.fillStyle = platGrad;
          ctx.fillRect(plat.x, plat.y, plat.width, plat.height);
          ctx.fillStyle = sinister >= 2 ? "#9c8fcf" : "#a7ffeb";
          ctx.fillRect(plat.x, plat.y, plat.width, 4);
        }
      }

      // ---- Exit door ----
      if (phase !== "bossfight") {
        ctx.fillStyle = sinister >= 3 ? "#b71c1c" : "#ffd600";
        ctx.fillRect(EXIT_X, EXIT_Y, EXIT_W, EXIT_H);
        ctx.fillStyle = sinister >= 3 ? "#c62828" : "#ff6f00";
        ctx.fillRect(EXIT_X + 4, EXIT_Y, EXIT_W - 8, EXIT_H - 4);
        ctx.fillStyle = "#fff";
        ctx.font = "bold 11px Arial";
        ctx.textAlign = "center";
        ctx.fillText(
          sinister >= 3 ? "⚠️" : "EXIT",
          EXIT_X + EXIT_W / 2,
          EXIT_Y + EXIT_H / 2,
        );
      }

      // ---- Traps ----
      for (const trap of s.traps) {
        if (trap.type === "spike") {
          ctx.fillStyle = "#b71c1c";
          const pts = [
            [trap.x + trap.width / 2, trap.y],
            [trap.x, trap.y + trap.height],
            [trap.x + trap.width, trap.y + trap.height],
          ];
          ctx.beginPath();
          ctx.moveTo(pts[0][0], pts[0][1]);
          ctx.lineTo(pts[1][0], pts[1][1]);
          ctx.lineTo(pts[2][0], pts[2][1]);
          ctx.closePath();
          ctx.fill();
        } else if (
          (trap.type === "laserH" || trap.type === "laserV") &&
          trap.active
        ) {
          const alpha = 0.6 + 0.4 * Math.sin(now / 100);
          ctx.fillStyle = `rgba(244,67,54,${alpha})`;
          ctx.shadowColor = "#ef5350";
          ctx.shadowBlur = 12;
          ctx.fillRect(trap.x, trap.y, trap.width, trap.height);
          ctx.shadowBlur = 0;
        } else if (
          (trap.type === "laserH" || trap.type === "laserV") &&
          !trap.active
        ) {
          ctx.fillStyle = "rgba(244,67,54,0.15)";
          ctx.fillRect(trap.x, trap.y, trap.width, trap.height);
        }
      }

      // ---- Power-Ups ----
      for (const pu of s.powerUps) {
        if (pu.collected) continue;
        const glow = 0.5 + 0.5 * Math.sin(pu.glowing);
        ctx.shadowColor = pu.type === "poison" ? "#66bb6a" : "#ffd700";
        ctx.shadowBlur = 12 * glow + 4;
        if (pu.type === "doubleJump") ctx.fillStyle = "#64b5f6";
        else if (pu.type === "dash") ctx.fillStyle = "#ffcc02";
        else if (pu.type === "poison") ctx.fillStyle = "#a5d6a7";
        else ctx.fillStyle = "#e040fb";
        ctx.beginPath();
        ctx.arc(
          pu.x + pu.width / 2,
          pu.y + pu.height / 2,
          pu.width / 2,
          0,
          Math.PI * 2,
        );
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.fillStyle = "#fff";
        ctx.font = "bold 11px Arial";
        ctx.textAlign = "center";
        ctx.fillText(
          pu.type === "doubleJump"
            ? "2x"
            : pu.type === "dash"
              ? ">>"
              : pu.type === "poison"
                ? "?"
                : "★",
          pu.x + pu.width / 2,
          pu.y + pu.height / 2 + 4,
        );
      }

      // ---- Enemies ----
      for (const e of s.enemies) {
        ctx.fillStyle = e.color;
        ctx.fillRect(e.x, e.y, e.width, e.height);
        // angry face
        ctx.fillStyle = "#212121";
        ctx.fillRect(e.x + 6, e.y + 8, 5, 5);
        ctx.fillRect(e.x + e.width - 11, e.y + 8, 5, 5);
        ctx.beginPath();
        ctx.arc(e.x + e.width / 2, e.y + e.height - 10, 7, 0, Math.PI);
        ctx.fill();
      }

      // ---- Projectiles ----
      for (const proj of s.projectiles) {
        ctx.fillStyle = proj.color;
        ctx.shadowColor = proj.color;
        ctx.shadowBlur = 8;
        if (proj.type === "targetedHeart") {
          // Draw heart
          ctx.font = `${proj.width + 4}px Arial`;
          ctx.textAlign = "center";
          ctx.fillText("💔", proj.x + proj.width / 2, proj.y + proj.height);
        } else if (proj.type === "smilebeam") {
          ctx.font = `${proj.width + 4}px Arial`;
          ctx.textAlign = "center";
          ctx.fillText("😈", proj.x + proj.width / 2, proj.y + proj.height);
        } else {
          ctx.beginPath();
          ctx.arc(
            proj.x + proj.width / 2,
            proj.y + proj.height / 2,
            proj.width / 2,
            0,
            Math.PI * 2,
          );
          ctx.fill();
        }
        ctx.shadowBlur = 0;
      }

      // ---- Attack box ----
      if (s.attackBox) {
        ctx.fillStyle = "rgba(255,224,102,0.4)";
        ctx.strokeStyle = "#FFE066";
        ctx.lineWidth = 2;
        ctx.fillRect(
          s.attackBox.x,
          s.attackBox.y,
          s.attackBox.width,
          s.attackBox.height,
        );
        ctx.strokeRect(
          s.attackBox.x,
          s.attackBox.y,
          s.attackBox.width,
          s.attackBox.height,
        );
      }

      // ---- Player ----
      const px = player.x;
      const py = player.y;
      const pw = player.width;
      const ph = player.height;
      const alpha =
        player.invincible > 0 ? (Math.sin(now / 80) > 0 ? 1 : 0.2) : 1;
      ctx.globalAlpha = alpha;
      if (player.isDashing) {
        ctx.shadowColor = "#64b5f6";
        ctx.shadowBlur = 18;
      }
      if (player.poisoned) {
        ctx.fillStyle = "#a5d6a7";
      } else {
        ctx.fillStyle = phase === "bossfight" ? "#ef5350" : "#42a5f5";
      }
      ctx.fillRect(px, py, pw, ph);
      // Player face
      ctx.fillStyle = "#fff";
      const eyeOffX = player.facingRight ? 4 : pw - 14;
      ctx.fillRect(px + eyeOffX, py + 8, 6, 7);
      ctx.fillRect(px + eyeOffX + 10, py + 8, 6, 7);
      ctx.fillStyle = "#212121";
      ctx.fillRect(px + eyeOffX + 2, py + 10, 3, 3);
      ctx.fillRect(px + eyeOffX + 12, py + 10, 3, 3);
      ctx.shadowBlur = 0;
      ctx.globalAlpha = 1;

      // ---- BOSS ----
      if (boss) {
        const bx = boss.x;
        const by = boss.y;
        const bw = boss.width;
        const bh = boss.height;
        // Body
        const bossHue =
          boss.phase === 1
            ? "#ce93d8"
            : boss.phase === 2
              ? "#ba68c8"
              : "#7b1fa2";
        ctx.fillStyle = bossHue;
        ctx.fillRect(bx, by, bw, bh);
        // Head
        ctx.fillStyle = "#f8bbd9";
        ctx.beginPath();
        ctx.arc(bx + bw / 2, by + bh * 0.28, bw * 0.38, 0, Math.PI * 2);
        ctx.fill();
        // Eyes
        const blinkOpen = s.tutorBlink > 0.15;
        ctx.fillStyle = "#fff";
        if (blinkOpen) {
          ctx.beginPath();
          ctx.arc(bx + bw * 0.35, by + bh * 0.23, 7, 0, Math.PI * 2);
          ctx.fill();
          ctx.beginPath();
          ctx.arc(bx + bw * 0.65, by + bh * 0.23, 7, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = boss.phase >= 2 ? "#b71c1c" : "#1565c0";
          ctx.beginPath();
          ctx.arc(bx + bw * 0.35, by + bh * 0.23, 4, 0, Math.PI * 2);
          ctx.fill();
          ctx.beginPath();
          ctx.arc(bx + bw * 0.65, by + bh * 0.23, 4, 0, Math.PI * 2);
          ctx.fill();
        } else {
          // Blink
          ctx.fillStyle = "#212121";
          ctx.fillRect(bx + bw * 0.28, by + bh * 0.22, 14, 3);
          ctx.fillRect(bx + bw * 0.58, by + bh * 0.22, 14, 3);
        }
        // Mouth: smile becomes sinister with phase
        ctx.strokeStyle = "#212121";
        ctx.lineWidth = 2.5;
        ctx.beginPath();
        if (boss.phase === 1) {
          ctx.arc(bx + bw / 2, by + bh * 0.28, 12, 0, Math.PI); // smile
        } else if (boss.phase === 2) {
          ctx.arc(bx + bw / 2, by + bh * 0.35, 12, Math.PI, 0); // frown
        } else {
          // Evil grin
          ctx.moveTo(bx + bw * 0.25, by + bh * 0.35);
          ctx.bezierCurveTo(
            bx + bw * 0.4,
            by + bh * 0.42,
            bx + bw * 0.6,
            by + bh * 0.42,
            bx + bw * 0.75,
            by + bh * 0.35,
          );
        }
        ctx.stroke();
        // Name tag
        ctx.fillStyle =
          boss.phase === 3
            ? "#b71c1c"
            : boss.phase === 2
              ? "#7b1fa2"
              : "#1565c0";
        ctx.font = "bold 11px Arial";
        ctx.textAlign = "center";
        ctx.fillText(
          boss.phase === 3
            ? "TUTOR [UNLEASHED]"
            : boss.phase === 2
              ? "TUTOR [TRUE FORM]"
              : "TUTOR",
          bx + bw / 2,
          by - 6,
        );
        // Graduation cap evil
        ctx.fillStyle = "#212121";
        ctx.fillRect(bx + bw * 0.2, by + bh * 0.1, bw * 0.6, 6);
        ctx.fillRect(bx + bw * 0.35, by + bh * 0.06, bw * 0.3, bh * 0.06);
      }

      // ---- Particles ----
      for (const p of s.particles) {
        ctx.globalAlpha = Math.max(0, p.life);
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      // ---- Phase label ----
      ctx.fillStyle =
        phase === "bossfight" ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.08)";
      ctx.font = "bold 18px Arial";
      ctx.textAlign = "left";
      const phaseLabels: Record<string, string> = {
        phase1: "Chapter 1: The Basics",
        phase2: "Chapter 2: Power-Ups",
        phase3: "Chapter 3: The Danger",
        phase4: "Chapter 4: The Door",
        bossfight: "FINAL CONFRONTATION",
      };
      ctx.fillText(phaseLabels[phase] ?? "", 16, 28);

      rafRef.current = requestAnimationFrame(gameLoop);
    },
    [initPhase],
  );

  useEffect(() => {
    if (gamePhase === "start" || gamePhase === "win" || gamePhase === "dead")
      return;
    lastTimeRef.current = performance.now();
    rafRef.current = requestAnimationFrame(gameLoop);
    return () => cancelAnimationFrame(rafRef.current);
  }, [gamePhase, gameLoop]);

  const sinisterCfg = [
    {
      bg: "bg-yellow-50",
      border: "border-yellow-300",
      text: "text-yellow-800",
      tutorColor: "text-blue-700",
      tutorBg: "bg-blue-50",
    },
    {
      bg: "bg-green-50",
      border: "border-green-300",
      text: "text-green-800",
      tutorColor: "text-purple-700",
      tutorBg: "bg-purple-50",
    },
    {
      bg: "bg-pink-50",
      border: "border-pink-300",
      text: "text-pink-900",
      tutorColor: "text-red-700",
      tutorBg: "bg-red-50",
    },
    {
      bg: "bg-indigo-50",
      border: "border-indigo-400",
      text: "text-indigo-900",
      tutorColor: "text-red-900",
      tutorBg: "bg-red-100",
    },
    {
      bg: "bg-gray-900",
      border: "border-red-700",
      text: "text-red-300",
      tutorColor: "text-red-400",
      tutorBg: "bg-gray-800",
    },
  ];
  const sc = sinisterCfg[Math.min(sinisterLevel, 4)];

  if (gamePhase === "start") {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{
          background: "linear-gradient(135deg, #fffde7 0%, #e3f2fd 100%)",
        }}
      >
        <div className="max-w-xl w-full mx-4 bg-white rounded-3xl shadow-2xl overflow-hidden border-4 border-yellow-300">
          <div className="bg-gradient-to-r from-yellow-300 to-blue-300 p-6 text-center">
            <div className="text-7xl mb-2">😁</div>
            <h1 className="text-3xl font-black text-gray-800">
              The Tutorial Is the Villain
            </h1>
            <p className="text-base text-gray-700 mt-1 font-semibold">
              A friendly tutorial that would never hurt you! 😊
            </p>
          </div>
          <div className="p-6 space-y-4">
            <div className="bg-blue-50 border-2 border-blue-200 rounded-2xl p-4">
              <p className="text-blue-800 font-bold text-center text-base">
                "Welcome! I'm Tutor! I'll guide you through everything. Trust me
                completely!"
              </p>
              <p className="text-blue-600 text-center text-xs mt-1 italic">
                — Tutor (definitely not suspicious)
              </p>
            </div>
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="font-bold text-gray-700 mb-1">Controls</p>
                <p className="text-gray-600">← → / A D: Move</p>
                <p className="text-gray-600">Space/W/↑: Jump</p>
                <p className="text-gray-600">Shift: Dash (later)</p>
                <p className="text-gray-600">Z/X/Enter: Attack</p>
              </div>
              <div className="bg-gray-50 rounded-xl p-3">
                <p className="font-bold text-gray-700 mb-1">Goal</p>
                <p className="text-gray-600">Reach the exit door</p>
                <p className="text-gray-600">Survive 4 chapters</p>
                <p className="text-gray-600">Defeat the final boss</p>
                <p className="text-gray-600 font-bold text-red-600">
                  Trust no one 😈
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => initPhase("phase1")}
              className="w-full py-4 rounded-2xl bg-gradient-to-r from-yellow-400 to-blue-400 text-white font-black text-xl shadow-lg hover:opacity-90 active:scale-95 transition-all"
            >
              Start Tutorial! 😊
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (gamePhase === "dead") {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{
          background: "linear-gradient(135deg, #212121 0%, #b71c1c 100%)",
        }}
      >
        <div className="max-w-lg w-full mx-4 bg-gray-900 rounded-3xl shadow-2xl overflow-hidden border-4 border-red-700 text-center p-8 space-y-4">
          <div className="text-6xl">😈</div>
          <h2 className="text-3xl font-black text-red-400">Game Over</h2>
          <p className="text-gray-300 italic text-base">
            "Oh no... you fell. How unfortunate. 😁"
          </p>
          <div className="bg-gray-800 rounded-xl p-4 border border-red-800">
            <p className="text-red-300 text-sm font-mono">
              {stateRef.current.deathReveal ||
                "Tutor planned this from the beginning."}
            </p>
          </div>
          <div className="flex gap-3 justify-center">
            <button
              type="button"
              onClick={() => initPhase("phase1")}
              className="px-6 py-3 rounded-xl bg-red-700 text-white font-bold hover:bg-red-600 transition-colors"
            >
              Try Again
            </button>
            <button
              type="button"
              onClick={() => onNavigate("games")}
              className="px-6 py-3 rounded-xl bg-gray-700 text-gray-200 font-bold hover:bg-gray-600 transition-colors"
            >
              Back to Games
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (gamePhase === "win") {
    return (
      <div
        className="min-h-screen flex items-center justify-center"
        style={{
          background: "linear-gradient(135deg, #1a237e 0%, #4a148c 100%)",
        }}
      >
        <div className="max-w-lg w-full mx-4 bg-gray-900 rounded-3xl shadow-2xl overflow-hidden border-4 border-yellow-400 text-center p-8 space-y-5">
          <div className="text-6xl animate-bounce">🏆</div>
          <h2 className="text-3xl font-black text-yellow-400">
            You Defeated TUTOR!
          </h2>
          <p className="text-gray-300 text-base">
            You survived the gaslighting, the traps, the fake power-ups, and the
            betrayal.
          </p>
          <div className="bg-gray-800 rounded-xl p-4 border border-yellow-700">
            <p className="text-yellow-300 text-sm italic">
              "I taught you everything... and you used it against me. Well
              played. 😤"
            </p>
            <p className="text-gray-500 text-xs mt-1">— Tutor, defeated</p>
          </div>
          <div className="bg-gray-800 rounded-xl p-3 text-left">
            <p className="text-green-400 font-bold text-sm mb-1">
              Lies Tutor told you:
            </p>
            <ul className="text-gray-400 text-xs space-y-1">
              <li>• "Stay on the LEFT" — traps were on the left</li>
              <li>• "Grab all power-ups" — half were poison</li>
              <li>• "Spam attacks from the LEFT" — immune side</li>
              <li>• "Don't go through that door" — it led to freedom</li>
            </ul>
          </div>
          <div className="flex gap-3 justify-center">
            <button
              type="button"
              onClick={() => initPhase("phase1")}
              className="px-6 py-3 rounded-xl bg-yellow-600 text-white font-bold hover:bg-yellow-500 transition-colors"
            >
              Play Again
            </button>
            <button
              type="button"
              onClick={() => onNavigate("games")}
              className="px-6 py-3 rounded-xl bg-gray-700 text-gray-200 font-bold hover:bg-gray-600 transition-colors"
            >
              Back to Games
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`min-h-screen flex flex-col items-center ${gamePhase === "bossfight" ? "bg-gray-950" : "bg-sky-50"}`}
    >
      {/* Header */}
      <div className="w-full max-w-4xl px-4 pt-4 pb-2 flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => {
            cancelAnimationFrame(rafRef.current);
            onNavigate("games");
          }}
          className="px-3 py-1 rounded-lg bg-gray-200 text-gray-700 text-sm font-bold hover:bg-gray-300 transition-colors"
        >
          ← Back
        </button>
        <div className="flex items-center gap-2">
          <span
            className={`text-sm font-bold ${gamePhase === "bossfight" ? "text-red-400" : "text-gray-700"}`}
          >
            HP:
          </span>
          {Array.from({ length: hpDisplay.maxHp }).map((_, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: static HP slots, order never changes
            <span key={`hp-${i}`} className="text-lg">
              {i < hpDisplay.hp ? "❤️" : "🖤"}
            </span>
          ))}
        </div>
        {showBossHp && (
          <div className="flex items-center gap-2">
            <span className="text-sm font-bold text-red-400">TUTOR:</span>
            <div className="w-36 h-4 bg-gray-700 rounded-full overflow-hidden">
              <div
                className="h-full transition-all rounded-full"
                style={{
                  width: `${(bossHpDisplay.hp / bossHpDisplay.maxHp) * 100}%`,
                  background:
                    bossHpDisplay.hp / bossHpDisplay.maxHp > 0.5
                      ? "#ce93d8"
                      : bossHpDisplay.hp / bossHpDisplay.maxHp > 0.25
                        ? "#ba68c8"
                        : "#b71c1c",
                }}
              />
            </div>
            <span className="text-xs text-red-300 font-mono">
              {bossHpDisplay.hp}/{bossHpDisplay.maxHp}
            </span>
          </div>
        )}
      </div>

      {/* Tutorial message box */}
      {currentMessage && (
        <div className="w-full max-w-4xl px-4 mb-2">
          <div
            className={`rounded-2xl border-2 p-3 flex items-start gap-3 transition-all duration-500 ${sc.bg} ${sc.border}`}
          >
            <div
              className={`text-3xl flex-shrink-0 transition-all ${sinisterLevel >= 4 ? "grayscale" : ""}`}
            >
              {sinisterLevel === 0
                ? "😁"
                : sinisterLevel === 1
                  ? "😊"
                  : sinisterLevel === 2
                    ? "😅"
                    : sinisterLevel === 3
                      ? "🙂"
                      : "😈"}
            </div>
            <div className="flex-1">
              <p className={`font-bold text-sm ${sc.tutorColor}`}>
                {currentMessage.text}
              </p>
              {showLieReveal && (
                <div className="mt-1 bg-black bg-opacity-80 rounded-lg px-3 py-1">
                  <p className="text-red-400 text-xs font-mono italic">
                    [ ACTUAL: {lieRevealText} ]
                  </p>
                </div>
              )}
            </div>
            <div
              className={`text-xs font-bold px-2 py-1 rounded-full flex-shrink-0 ${sc.tutorBg} ${sc.tutorColor}`}
            >
              Tutor™
            </div>
          </div>
        </div>
      )}

      {/* Game canvas */}
      <canvas
        ref={canvasRef}
        width={CANVAS_W}
        height={CANVAS_H}
        className="rounded-2xl shadow-2xl border-4 border-gray-300 max-w-full"
        style={{ maxWidth: "100%", cursor: "crosshair" }}
      />

      {/* Controls hint */}
      <div
        className={`mt-2 text-xs ${gamePhase === "bossfight" ? "text-gray-500" : "text-gray-500"} text-center`}
      >
        ←→ Move &nbsp;|&nbsp; Space/W Jump &nbsp;|&nbsp; Shift Dash
        &nbsp;|&nbsp; Z/X/Enter Attack
        {stateRef.current.player?.poisoned && (
          <span className="ml-2 text-green-600 font-bold animate-pulse">
            ☠️ POISONED
          </span>
        )}
      </div>
    </div>
  );
}
