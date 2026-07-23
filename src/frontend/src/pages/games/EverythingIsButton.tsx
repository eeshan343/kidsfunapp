import { useCallback, useEffect, useRef, useState } from "react";
import type { ModulePage } from "../../App";
import GameLayout from "../../components/GameLayout";

interface EverythingIsButtonProps {
  onNavigate: (page: ModulePage) => void;
}

// Effect types a button can trigger
const EFFECTS = [
  {
    label: "GRAVITY FLIP!",
    fn: (gs: GameState) => {
      gs.gravity = -gs.gravity;
      gs.chaos++;
    },
  },
  {
    label: "SPEED BOOST!",
    fn: (gs: GameState) => {
      gs.player.vx *= 3;
      gs.chaos++;
    },
  },
  {
    label: "SHRINK!",
    fn: (gs: GameState) => {
      gs.player.size = Math.max(5, gs.player.size - 6);
      gs.chaos++;
    },
  },
  {
    label: "GROW!",
    fn: (gs: GameState) => {
      gs.player.size = Math.min(40, gs.player.size + 8);
      gs.chaos++;
    },
  },
  {
    label: "ENEMIES +3!",
    fn: (gs: GameState) => {
      spawnEnemies(gs, 3);
      gs.chaos++;
    },
  },
  {
    label: "SCORE x2!",
    fn: (gs: GameState) => {
      gs.score *= 2;
      gs.chaos++;
    },
  },
  {
    label: "TELEPORT!",
    fn: (gs: GameState) => {
      gs.player.x = 100 + Math.random() * 600;
      gs.player.y = 100 + Math.random() * 400;
      gs.chaos++;
    },
  },
  {
    label: "COLOR CHAOS!",
    fn: (gs: GameState) => {
      gs.bgColor = randomBright();
      gs.chaos++;
    },
  },
  {
    label: "INVERT!",
    fn: (gs: GameState) => {
      gs.invertControls = !gs.invertControls;
      gs.chaos++;
    },
  },
  {
    label: "HEAL!",
    fn: (gs: GameState) => {
      gs.player.hp = Math.min(5, gs.player.hp + 1);
      gs.chaos++;
    },
  },
  {
    label: "OUCH -1 HP!",
    fn: (gs: GameState) => {
      gs.player.hp = Math.max(0, gs.player.hp - 1);
      gs.chaos++;
    },
  },
  {
    label: "FREEZE!",
    fn: (gs: GameState) => {
      gs.frozen = true;
      gs.frozenTimer = 90;
      gs.chaos++;
    },
  },
  {
    label: "SPEED DOWN!",
    fn: (gs: GameState) => {
      gs.player.vx *= 0.2;
      gs.chaos++;
    },
  },
  {
    label: "PARTICLES!",
    fn: (gs: GameState) => {
      spawnParticles(gs, gs.player.x, gs.player.y, 20);
      gs.chaos++;
    },
  },
  {
    label: "PLATFORM GONE!",
    fn: (gs: GameState) => {
      if (gs.platforms.length > 2)
        gs.platforms.splice(Math.floor(Math.random() * gs.platforms.length), 1);
      gs.chaos++;
    },
  },
  {
    label: "PLATFORM ADD!",
    fn: (gs: GameState) => {
      spawnPlatform(gs);
      gs.chaos++;
    },
  },
  {
    label: "BOUNCY!",
    fn: (gs: GameState) => {
      gs.player.vy = -18;
      gs.chaos++;
    },
  },
  {
    label: "+10 SCORE!",
    fn: (gs: GameState) => {
      gs.score += 10;
      gs.chaos++;
    },
  },
  {
    label: "CHAOS MODE!",
    fn: (gs: GameState) => {
      gs.chaosMode = !gs.chaosMode;
      gs.chaos += 3;
    },
  },
  {
    label: "EVERYTHING LAUGHS!",
    fn: (gs: GameState) => {
      gs.laughing = true;
      gs.laughTimer = 60;
      gs.chaos++;
    },
  },
];

const BRIGHT_COLORS = [
  "#FF0080",
  "#00FFFF",
  "#FFFF00",
  "#FF6600",
  "#00FF00",
  "#FF00FF",
  "#FF3333",
  "#33FF33",
  "#3333FF",
  "#FF9900",
  "#00CCFF",
  "#CC00FF",
  "#FFCC00",
  "#FF3399",
  "#33FFCC",
];

function randomBright() {
  return BRIGHT_COLORS[Math.floor(Math.random() * BRIGHT_COLORS.length)];
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  life: number;
  maxLife: number;
  size: number;
}

interface Enemy {
  x: number;
  y: number;
  vx: number;
  color: string;
  size: number;
  label: string;
  isButton: boolean;
  effectIdx: number;
}

interface Platform {
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
  label: string;
  isButton: boolean;
  effectIdx: number;
  pressed: boolean;
  blinkTimer: number;
}

interface UIButton {
  label: string;
  x: number;
  y: number;
  w: number;
  h: number;
  color: string;
  effectIdx: number;
}

interface FloatyLabel {
  text: string;
  x: number;
  y: number;
  life: number;
  color: string;
}

interface GameState {
  player: {
    x: number;
    y: number;
    vx: number;
    vy: number;
    size: number;
    onGround: boolean;
    hp: number;
    color: string;
  };
  platforms: Platform[];
  enemies: Enemy[];
  particles: Particle[];
  uiButtons: UIButton[];
  floatyLabels: FloatyLabel[];
  gravity: number;
  bgColor: string;
  invertControls: boolean;
  frozen: boolean;
  frozenTimer: number;
  score: number;
  chaos: number;
  chaosMode: boolean;
  laughing: boolean;
  laughTimer: number;
  keys: Record<string, boolean>;
  mouseX: number;
  mouseY: number;
  mouseClicked: boolean;
  lastEffectLabel: string;
  lastEffectTimer: number;
  frameCount: number;
}

function spawnParticles(gs: GameState, x: number, y: number, count: number) {
  for (let i = 0; i < count; i++) {
    gs.particles.push({
      x,
      y,
      vx: (Math.random() - 0.5) * 10,
      vy: (Math.random() - 0.5) * 10,
      color: randomBright(),
      life: 60 + Math.random() * 40,
      maxLife: 100,
      size: 3 + Math.random() * 8,
    });
  }
}

function spawnEnemies(gs: GameState, count: number) {
  for (let i = 0; i < count; i++) {
    const eff = Math.floor(Math.random() * EFFECTS.length);
    gs.enemies.push({
      x: Math.random() * 700 + 50,
      y: 80 + Math.random() * 300,
      vx: (Math.random() - 0.5) * 4,
      color: randomBright(),
      size: 16 + Math.random() * 12,
      label: "BTN!",
      isButton: true,
      effectIdx: eff,
    });
  }
}

function spawnPlatform(gs: GameState) {
  const eff = Math.floor(Math.random() * EFFECTS.length);
  gs.platforms.push({
    x: Math.random() * 600 + 50,
    y: 150 + Math.random() * 350,
    w: 80 + Math.random() * 120,
    h: 18,
    color: randomBright(),
    label: `${EFFECTS[eff].label.split("!")[0]}!`,
    isButton: true,
    effectIdx: eff,
    pressed: false,
    blinkTimer: 0,
  });
}

function initState(): GameState {
  const platforms: Platform[] = [];
  // Ground — always a button
  platforms.push({
    x: 0,
    y: 550,
    w: 800,
    h: 50,
    color: "#FF0080",
    label: "FLOOR BTN!",
    isButton: true,
    effectIdx: 0,
    pressed: false,
    blinkTimer: 0,
  });
  // Generate many interactive platforms
  for (let i = 0; i < 18; i++) {
    spawnPlatform({ platforms } as GameState);
  }

  const enemies: Enemy[] = [];
  for (let i = 0; i < 6; i++) {
    const eff = Math.floor(Math.random() * EFFECTS.length);
    enemies.push({
      x: 100 + i * 110,
      y: 200 + Math.random() * 200,
      vx: (Math.random() > 0.5 ? 1 : -1) * (1.5 + Math.random() * 2),
      color: randomBright(),
      size: 18,
      label: "PRESS!",
      isButton: true,
      effectIdx: eff,
    });
  }

  // UI buttons
  const uiButtons: UIButton[] = [
    {
      label: "PAUSE?",
      x: 10,
      y: 10,
      w: 80,
      h: 28,
      color: "#FFFF00",
      effectIdx: Math.floor(Math.random() * EFFECTS.length),
    },
    {
      label: "HEALTH?",
      x: 100,
      y: 10,
      w: 90,
      h: 28,
      color: "#FF3399",
      effectIdx: Math.floor(Math.random() * EFFECTS.length),
    },
    {
      label: "SCORE!",
      x: 200,
      y: 10,
      w: 80,
      h: 28,
      color: "#00FFFF",
      effectIdx: Math.floor(Math.random() * EFFECTS.length),
    },
    {
      label: "SKY BTN",
      x: 300,
      y: 10,
      w: 90,
      h: 28,
      color: "#CC00FF",
      effectIdx: Math.floor(Math.random() * EFFECTS.length),
    },
    {
      label: "CHAOS!",
      x: 400,
      y: 10,
      w: 80,
      h: 28,
      color: "#FF6600",
      effectIdx: Math.floor(Math.random() * EFFECTS.length),
    },
    {
      label: "WIN?",
      x: 490,
      y: 10,
      w: 60,
      h: 28,
      color: "#33FF33",
      effectIdx: Math.floor(Math.random() * EFFECTS.length),
    },
  ];

  return {
    player: {
      x: 100,
      y: 480,
      vx: 0,
      vy: 0,
      size: 16,
      onGround: false,
      hp: 5,
      color: "#FFFFFF",
    },
    platforms,
    enemies,
    particles: [],
    uiButtons,
    floatyLabels: [],
    gravity: 0.55,
    bgColor: "#1a0033",
    invertControls: false,
    frozen: false,
    frozenTimer: 0,
    score: 0,
    chaos: 0,
    chaosMode: false,
    laughing: false,
    laughTimer: 0,
    keys: {},
    mouseX: 0,
    mouseY: 0,
    mouseClicked: false,
    lastEffectLabel: "",
    lastEffectTimer: 0,
    frameCount: 0,
  };
}

export default function EverythingIsButton({
  onNavigate,
}: EverythingIsButtonProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const gsRef = useRef<GameState>(initState());
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [chaos, setChaos] = useState(0);
  const animRef = useRef<number>(0);

  const triggerEffect = useCallback(
    (gs: GameState, effectIdx: number, x: number, y: number) => {
      const eff = EFFECTS[effectIdx % EFFECTS.length];
      eff.fn(gs);
      gs.lastEffectLabel = eff.label;
      gs.lastEffectTimer = 90;
      spawnParticles(gs, x, y, 12);
      gs.floatyLabels.push({
        text: eff.label,
        x,
        y: y - 20,
        life: 70,
        color: randomBright(),
      });
      // chaos mode: also add random enemy
      if (gs.chaosMode && Math.random() < 0.4) spawnEnemies(gs, 1);
    },
    [],
  );

  const handleRestart = useCallback(() => {
    setGameOver(false);
    setScore(0);
    setChaos(0);
    gsRef.current = initState();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const onKeyDown = (e: KeyboardEvent) => {
      gsRef.current.keys[e.key] = true;
      e.preventDefault();
    };
    const onKeyUp = (e: KeyboardEvent) => {
      gsRef.current.keys[e.key] = false;
    };
    const onMouseMove = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      gsRef.current.mouseX =
        (e.clientX - rect.left) * (canvas.width / rect.width);
      gsRef.current.mouseY =
        (e.clientY - rect.top) * (canvas.height / rect.height);
    };
    const onClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const mx = (e.clientX - rect.left) * (canvas.width / rect.width);
      const my = (e.clientY - rect.top) * (canvas.height / rect.height);
      const gs = gsRef.current;

      // Check UI buttons
      for (const btn of gs.uiButtons) {
        if (
          mx >= btn.x &&
          mx <= btn.x + btn.w &&
          my >= btn.y &&
          my <= btn.y + btn.h
        ) {
          triggerEffect(
            gs,
            btn.effectIdx,
            btn.x + btn.w / 2,
            btn.y + btn.h / 2,
          );
          btn.effectIdx = Math.floor(Math.random() * EFFECTS.length);
          return;
        }
      }

      // Click on platforms
      for (const p of gs.platforms) {
        if (mx >= p.x && mx <= p.x + p.w && my >= p.y && my <= p.y + p.h) {
          triggerEffect(gs, p.effectIdx, p.x + p.w / 2, p.y);
          p.effectIdx = Math.floor(Math.random() * EFFECTS.length);
          p.blinkTimer = 20;
          return;
        }
      }

      // Click on enemies
      for (const en of gs.enemies) {
        const dx = mx - en.x;
        const dy = my - en.y;
        if (Math.sqrt(dx * dx + dy * dy) < en.size + 5) {
          triggerEffect(gs, en.effectIdx, en.x, en.y);
          en.effectIdx = Math.floor(Math.random() * EFFECTS.length);
          return;
        }
      }

      // Click anywhere else = random effect
      triggerEffect(gs, Math.floor(Math.random() * EFFECTS.length), mx, my);
    };

    window.addEventListener("keydown", onKeyDown);
    window.addEventListener("keyup", onKeyUp);
    canvas.addEventListener("mousemove", onMouseMove);
    canvas.addEventListener("click", onClick);

    const loop = () => {
      const gs = gsRef.current;
      if (gameOver) {
        animRef.current = requestAnimationFrame(loop);
        return;
      }

      gs.frameCount++;

      // --- PHYSICS ---
      if (!gs.frozen) {
        const inv = gs.invertControls ? -1 : 1;
        const speed = gs.chaosMode ? 7 : 4.5;

        if (gs.keys.ArrowLeft || gs.keys.a) gs.player.vx += -speed * inv * 0.35;
        else if (gs.keys.ArrowRight || gs.keys.d)
          gs.player.vx += speed * inv * 0.35;
        else gs.player.vx *= 0.78;

        if (
          (gs.keys.ArrowUp || gs.keys.w || gs.keys[" "]) &&
          gs.player.onGround
        ) {
          gs.player.vy = gs.gravity > 0 ? -13 : 13;
          gs.player.onGround = false;
        }

        gs.player.vy += gs.gravity;
        gs.player.x += gs.player.vx;
        gs.player.y += gs.player.vy;

        // Clamp x
        gs.player.x = Math.max(
          gs.player.size,
          Math.min(800 - gs.player.size, gs.player.x),
        );

        // Platform collisions
        gs.player.onGround = false;
        for (const p of gs.platforms) {
          const px = gs.player.x;
          const py = gs.player.y;
          const ps = gs.player.size;

          if (
            px + ps > p.x &&
            px - ps < p.x + p.w &&
            py + ps > p.y &&
            py - ps < p.y + p.h
          ) {
            // land on top
            if (
              gs.gravity > 0 &&
              gs.player.vy > 0 &&
              py + ps - gs.player.vy <= p.y + 2
            ) {
              gs.player.y = p.y - ps;
              gs.player.vy = 0;
              gs.player.onGround = true;
            } else if (
              gs.gravity < 0 &&
              gs.player.vy < 0 &&
              py - ps - gs.player.vy >= p.y + p.h - 2
            ) {
              gs.player.y = p.y + p.h + ps;
              gs.player.vy = 0;
              gs.player.onGround = true;
            }
            // Trigger platform effect on land
            if (gs.player.onGround && p.isButton && !p.pressed) {
              p.pressed = true;
              p.blinkTimer = 25;
              triggerEffect(gs, p.effectIdx, p.x + p.w / 2, p.y);
              p.effectIdx = Math.floor(Math.random() * EFFECTS.length);
              gs.score += 1;
            } else if (!gs.player.onGround) {
              p.pressed = false;
            }
          } else {
            p.pressed = false;
          }
        }

        // Enemy movement & collision
        for (let i = gs.enemies.length - 1; i >= 0; i--) {
          const en = gs.enemies[i];
          en.x += en.vx;
          if (gs.chaosMode) en.y += Math.sin(gs.frameCount * 0.05 + i) * 1.5;
          if (en.x < 0 || en.x > 800) en.vx = -en.vx;

          // collision with player
          const dx = en.x - gs.player.x;
          const dy = en.y - gs.player.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < en.size + gs.player.size) {
            triggerEffect(gs, en.effectIdx, en.x, en.y);
            en.effectIdx = Math.floor(Math.random() * EFFECTS.length);
            en.color = randomBright();
          }
        }

        // Fall off screen (with gravity direction)
        if (
          (gs.gravity > 0 && gs.player.y > 660) ||
          (gs.gravity < 0 && gs.player.y < -60)
        ) {
          gs.player.hp -= 1;
          gs.player.x = 100;
          gs.player.y = gs.gravity > 0 ? 400 : 200;
          gs.player.vy = 0;
          spawnParticles(gs, gs.player.x, gs.player.y, 15);
        }
      } else {
        // frozen countdown
        gs.frozenTimer--;
        if (gs.frozenTimer <= 0) gs.frozen = false;
      }

      // Chaos mode: randomly add more buttons occasionally
      if (
        gs.chaosMode &&
        gs.frameCount % 90 === 0 &&
        gs.platforms.length < 40
      ) {
        spawnPlatform(gs);
      }
      // Random new enemy every 300 frames
      if (gs.frameCount % 300 === 0 && gs.enemies.length < 20) {
        spawnEnemies(gs, 1);
      }

      // Particles
      for (let i = gs.particles.length - 1; i >= 0; i--) {
        const p = gs.particles[i];
        p.x += p.vx;
        p.y += p.vy;
        p.vy += 0.15;
        p.life--;
        if (p.life <= 0) gs.particles.splice(i, 1);
      }

      // Floaty labels
      for (let i = gs.floatyLabels.length - 1; i >= 0; i--) {
        const fl = gs.floatyLabels[i];
        fl.y -= 1.2;
        fl.life--;
        if (fl.life <= 0) gs.floatyLabels.splice(i, 1);
      }

      // Platform blink
      for (const p of gs.platforms) {
        if (p.blinkTimer > 0) p.blinkTimer--;
      }

      // Effect label timer
      if (gs.lastEffectTimer > 0) gs.lastEffectTimer--;
      if (gs.laughTimer > 0) gs.laughTimer--;
      else gs.laughing = false;

      // Update score
      gs.score += gs.chaosMode ? 0.05 : 0.02;
      setScore(Math.floor(gs.score));
      setChaos(gs.chaos);

      // Game over
      if (gs.player.hp <= 0) {
        setGameOver(true);
        setHighScore((h) => Math.max(h, Math.floor(gs.score)));
      }

      // ---- RENDER ----
      const bgFlash = gs.lastEffectTimer > 70;
      ctx.fillStyle = bgFlash ? randomBright() : gs.bgColor;
      ctx.fillRect(0, 0, 800, 600);

      // Chaotic BG noise in chaos mode
      if (gs.chaosMode) {
        for (let i = 0; i < 30; i++) {
          ctx.fillStyle = `${randomBright()}44`;
          ctx.fillRect(
            Math.random() * 800,
            Math.random() * 600,
            10 + Math.random() * 50,
            5 + Math.random() * 30,
          );
        }
      }

      // Sky label — the sky is also a button
      ctx.font = "bold 11px monospace";
      ctx.textAlign = "center";
      const skyLabels = [
        "SKY = BTN",
        "CLICK ME!",
        "DON'T TOUCH!",
        "WHY NOT?",
        "PRESS!",
      ];
      for (let i = 0; i < 5; i++) {
        ctx.fillStyle = `${BRIGHT_COLORS[(gs.frameCount + i * 3) % BRIGHT_COLORS.length]}99`;
        ctx.fillText(
          skyLabels[i % skyLabels.length],
          80 + i * 140,
          80 + Math.sin(gs.frameCount * 0.03 + i) * 20,
        );
      }

      // Platforms
      for (const p of gs.platforms) {
        const blink = p.blinkTimer > 0 && p.blinkTimer % 4 < 2;
        ctx.fillStyle = blink ? "#FFFFFF" : p.color;
        ctx.fillRect(p.x, p.y, p.w, p.h);
        ctx.strokeStyle = "#000";
        ctx.lineWidth = 2;
        ctx.strokeRect(p.x, p.y, p.w, p.h);
        // label
        ctx.fillStyle = "#000";
        ctx.font = "bold 9px monospace";
        ctx.textAlign = "center";
        ctx.fillText(
          p.label.substring(0, 10),
          p.x + p.w / 2,
          p.y + p.h / 2 + 4,
        );
      }

      // Particles
      for (const part of gs.particles) {
        const alpha = part.life / part.maxLife;
        ctx.globalAlpha = alpha;
        ctx.fillStyle = part.color;
        ctx.beginPath();
        ctx.arc(part.x, part.y, part.size * alpha, 0, Math.PI * 2);
        ctx.fill();
      }
      ctx.globalAlpha = 1;

      // Enemies
      for (const en of gs.enemies) {
        // enemy body
        ctx.fillStyle = en.color;
        ctx.beginPath();
        ctx.arc(en.x, en.y, en.size, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = "#000";
        ctx.lineWidth = 2;
        ctx.stroke();
        // label
        ctx.fillStyle = "#000";
        ctx.font = "bold 8px monospace";
        ctx.textAlign = "center";
        ctx.fillText("BTN!", en.x, en.y + 4);
        // eyes
        ctx.fillStyle = "#000";
        ctx.beginPath();
        ctx.arc(en.x - 5, en.y - 5, 3, 0, Math.PI * 2);
        ctx.arc(en.x + 5, en.y - 5, 3, 0, Math.PI * 2);
        ctx.fill();
        // mouth: laughing or normal
        ctx.strokeStyle = "#000";
        ctx.lineWidth = 1.5;
        ctx.beginPath();
        if (gs.laughing) {
          ctx.arc(en.x, en.y, 8, 0.2, Math.PI - 0.2);
        } else {
          ctx.arc(en.x, en.y, 5, 0.2, Math.PI - 0.2);
        }
        ctx.stroke();
      }

      // Player
      const ps = gs.player.size;
      ctx.fillStyle = gs.frozen ? "#88CCFF" : gs.player.color;
      ctx.beginPath();
      ctx.arc(gs.player.x, gs.player.y, ps, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#FFD700";
      ctx.lineWidth = 3;
      ctx.stroke();
      // player face
      ctx.fillStyle = "#333";
      ctx.beginPath();
      ctx.arc(
        gs.player.x - ps * 0.35,
        gs.player.y - ps * 0.25,
        ps * 0.2,
        0,
        Math.PI * 2,
      );
      ctx.arc(
        gs.player.x + ps * 0.35,
        gs.player.y - ps * 0.25,
        ps * 0.2,
        0,
        Math.PI * 2,
      );
      ctx.fill();
      // inverted controls indicator
      if (gs.invertControls) {
        ctx.fillStyle = "#FF3333";
        ctx.font = "bold 11px monospace";
        ctx.textAlign = "center";
        ctx.fillText("INVERTED!", gs.player.x, gs.player.y - ps - 6);
      }

      // Frozen overlay
      if (gs.frozen) {
        ctx.fillStyle = "rgba(100,200,255,0.18)";
        ctx.fillRect(0, 0, 800, 600);
        ctx.fillStyle = "#88CCFF";
        ctx.font = "bold 36px monospace";
        ctx.textAlign = "center";
        ctx.fillText("❄️ FROZEN ❄️", 400, 320);
      }

      // Floaty labels
      for (const fl of gs.floatyLabels) {
        const alpha = fl.life / 70;
        ctx.globalAlpha = alpha;
        ctx.fillStyle = fl.color;
        ctx.font = `bold ${12 + Math.floor((1 - alpha) * 8)}px monospace`;
        ctx.textAlign = "center";
        ctx.fillText(fl.text, fl.x, fl.y);
      }
      ctx.globalAlpha = 1;

      // Big effect label
      if (gs.lastEffectTimer > 0) {
        const alpha = gs.lastEffectTimer / 90;
        const scale = 1 + (1 - alpha) * 0.5;
        ctx.save();
        ctx.globalAlpha = alpha;
        ctx.translate(400, 300);
        ctx.scale(scale, scale);
        ctx.fillStyle = randomBright();
        ctx.font = `bold ${32 + gs.chaos}px monospace`;
        ctx.textAlign = "center";
        ctx.fillText(gs.lastEffectLabel, 0, 0);
        ctx.restore();
      }

      // UI buttons (drawn on top)
      ctx.font = "bold 10px monospace";
      ctx.textAlign = "center";
      for (const btn of gs.uiButtons) {
        const hover =
          gs.mouseX >= btn.x &&
          gs.mouseX <= btn.x + btn.w &&
          gs.mouseY >= btn.y &&
          gs.mouseY <= btn.y + btn.h;
        ctx.fillStyle = hover ? "#FFFFFF" : btn.color;
        ctx.fillRect(btn.x, btn.y, btn.w, btn.h);
        ctx.strokeStyle = "#000";
        ctx.lineWidth = 2;
        ctx.strokeRect(btn.x, btn.y, btn.w, btn.h);
        ctx.fillStyle = "#000";
        ctx.fillText(btn.label, btn.x + btn.w / 2, btn.y + 19);
      }

      // HUD
      ctx.fillStyle = "rgba(0,0,0,0.6)";
      ctx.fillRect(0, 570, 800, 30);
      // HP bar (it's also a button!)
      ctx.fillStyle = "#FF3333";
      ctx.fillRect(10, 577, gs.player.hp * 24, 16);
      ctx.strokeStyle = "#FF0000";
      ctx.lineWidth = 2;
      ctx.strokeRect(10, 577, 120, 16);
      ctx.fillStyle = "#FFF";
      ctx.font = "bold 10px monospace";
      ctx.textAlign = "left";
      ctx.fillText("HP (BTN!)", 14, 589);

      // Chaos counter
      ctx.fillStyle = gs.chaosMode ? "#FF3333" : "#FFFF00";
      ctx.textAlign = "center";
      ctx.font = "bold 11px monospace";
      ctx.fillText(`CHAOS: ${gs.chaos}${gs.chaosMode ? " 🔥" : ""}`, 400, 589);

      // Controls reminder
      ctx.fillStyle = "#AAFFAA";
      ctx.textAlign = "right";
      ctx.font = "10px monospace";
      ctx.fillText("WASD/Arrows+Space=move | Click ANYTHING!", 790, 589);

      animRef.current = requestAnimationFrame(loop);
    };

    animRef.current = requestAnimationFrame(loop);

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener("keydown", onKeyDown);
      window.removeEventListener("keyup", onKeyUp);
      canvas.removeEventListener("mousemove", onMouseMove);
      canvas.removeEventListener("click", onClick);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameOver, triggerEffect]);

  return (
    <GameLayout
      title="Everything Is a Button 🔴"
      score={score}
      highScore={highScore}
      onRestart={handleRestart}
      onNavigate={onNavigate}
      gameOver={gameOver}
    >
      <div
        className="flex flex-col items-center justify-center"
        style={{ background: "#1a0033" }}
      >
        <div
          className="w-full flex items-center justify-between px-4 py-1"
          style={{ background: "#0a0010", borderBottom: "2px solid #FF0080" }}
        >
          <span
            style={{
              color: "#FF0080",
              fontWeight: "bold",
              fontSize: 12,
              fontFamily: "monospace",
            }}
          >
            ⚠️ EVERYTHING IS A BUTTON. CLICK ANYTHING. NOTHING IS SAFE.
          </span>
          <span
            style={{
              color: "#FFFF00",
              fontWeight: "bold",
              fontSize: 12,
              fontFamily: "monospace",
            }}
          >
            CHAOS LEVEL: {chaos}
          </span>
        </div>
        <canvas
          ref={canvasRef}
          width={800}
          height={600}
          style={{
            display: "block",
            cursor: "crosshair",
            borderColor: "#FF0080",
            boxShadow: "0 0 24px #FF0080",
          }}
        />
      </div>
    </GameLayout>
  );
}
