import { useCallback, useEffect, useRef, useState } from "react";
import type { ModulePage } from "../../App";

interface DelayedControlsProps {
  onNavigate: (page: ModulePage) => void;
}

type GameScreen = "start" | "playing" | "dead" | "levelcomplete" | "win";

interface InputQueueItem {
  action: "left" | "right" | "jump" | "stop-left" | "stop-right";
  timestamp: number;
  delayMs: number;
}

interface GhostSnapshot {
  x: number;
  y: number;
  opacity: number;
}

interface Player {
  x: number;
  y: number;
  vx: number;
  vy: number;
  onGround: boolean;
  width: number;
  height: number;
}

interface Platform {
  x: number;
  y: number;
  width: number;
  height: number;
  moving?: boolean;
  moveRange?: number;
  moveSpeed?: number;
  moveDir?: number;
  baseX?: number;
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
}

interface Spike {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface Level {
  width: number;
  height: number;
  startX: number;
  startY: number;
  platforms: Platform[];
  enemies: Enemy[];
  spikes: Spike[];
  exitX: number;
  exitY: number;
  exitWidth: number;
  exitHeight: number;
}

const CANVAS_W = 900;
const CANVAS_H = 500;
const GRAVITY = 800;
const JUMP_VY = -420;
const MOVE_SPEED = 180;
const BASE_DELAY = 300;
const MAX_DELAY = 1500;
const DELAY_INCREMENT = 40;
const DELAY_DECAY = 2;
const GHOST_BUFFER_SIZE = 8;

function makeLevels(): Level[] {
  return [
    // Level 1 — The Learning Curve
    {
      width: CANVAS_W,
      height: CANVAS_H,
      startX: 40,
      startY: 390,
      platforms: [
        { x: 0, y: 440, width: 200, height: 20 },
        { x: 240, y: 400, width: 120, height: 20 },
        { x: 400, y: 360, width: 100, height: 20 },
        { x: 540, y: 320, width: 120, height: 20 },
        { x: 700, y: 280, width: 180, height: 20 },
        // ground segments
        { x: 0, y: 480, width: 900, height: 20 },
      ],
      enemies: [
        {
          x: 250,
          y: 376,
          width: 20,
          height: 20,
          vx: 40,
          minX: 240,
          maxX: 340,
          moveDir: 1,
        },
        {
          x: 705,
          y: 256,
          width: 20,
          height: 20,
          vx: 50,
          minX: 700,
          maxX: 860,
          moveDir: 1,
        },
      ],
      spikes: [
        { x: 200, y: 470, width: 20, height: 10 },
        { x: 370, y: 470, width: 20, height: 10 },
        { x: 450, y: 470, width: 20, height: 10 },
        { x: 620, y: 470, width: 20, height: 10 },
      ],
      exitX: 840,
      exitY: 240,
      exitWidth: 36,
      exitHeight: 40,
    },
    // Level 2 — Compound Lag
    {
      width: CANVAS_W,
      height: CANVAS_H,
      startX: 40,
      startY: 430,
      platforms: [
        { x: 0, y: 460, width: 160, height: 20 },
        { x: 200, y: 420, width: 80, height: 20 },
        { x: 330, y: 380, width: 80, height: 20 },
        { x: 460, y: 340, width: 80, height: 20 },
        { x: 590, y: 300, width: 80, height: 20 },
        { x: 720, y: 260, width: 80, height: 20 },
        // moving platforms
        {
          x: 160,
          y: 350,
          width: 80,
          height: 16,
          moving: true,
          baseX: 160,
          moveRange: 80,
          moveSpeed: 60,
          moveDir: 1,
        },
        {
          x: 500,
          y: 220,
          width: 80,
          height: 16,
          moving: true,
          baseX: 500,
          moveRange: 100,
          moveSpeed: 80,
          moveDir: -1,
        },
        // ground
        { x: 0, y: 490, width: 900, height: 10 },
      ],
      enemies: [
        {
          x: 205,
          y: 396,
          width: 20,
          height: 20,
          vx: 40,
          minX: 200,
          maxX: 260,
          moveDir: 1,
        },
        {
          x: 335,
          y: 356,
          width: 20,
          height: 20,
          vx: 50,
          minX: 330,
          maxX: 390,
          moveDir: 1,
        },
        {
          x: 595,
          y: 276,
          width: 20,
          height: 20,
          vx: 55,
          minX: 590,
          maxX: 650,
          moveDir: 1,
        },
        {
          x: 725,
          y: 236,
          width: 20,
          height: 20,
          vx: 60,
          minX: 720,
          maxX: 780,
          moveDir: 1,
        },
      ],
      spikes: [
        { x: 170, y: 480, width: 20, height: 10 },
        { x: 290, y: 480, width: 20, height: 10 },
        { x: 390, y: 480, width: 20, height: 10 },
        { x: 490, y: 480, width: 20, height: 10 },
        { x: 580, y: 480, width: 20, height: 10 },
        { x: 660, y: 480, width: 20, height: 10 },
        { x: 740, y: 480, width: 20, height: 10 },
        { x: 820, y: 480, width: 20, height: 10 },
      ],
      exitX: 845,
      exitY: 200,
      exitWidth: 36,
      exitHeight: 60,
    },
    // Level 3 — Ghost Town
    {
      width: CANVAS_W,
      height: CANVAS_H,
      startX: 30,
      startY: 440,
      platforms: [
        { x: 0, y: 470, width: 120, height: 20 },
        { x: 160, y: 440, width: 60, height: 16 },
        { x: 260, y: 400, width: 60, height: 16 },
        { x: 360, y: 360, width: 60, height: 16 },
        { x: 460, y: 320, width: 60, height: 16 },
        { x: 540, y: 280, width: 80, height: 16 },
        { x: 660, y: 240, width: 60, height: 16 },
        { x: 760, y: 200, width: 80, height: 16 },
        { x: 840, y: 160, width: 60, height: 16 },
        // moving platforms
        {
          x: 200,
          y: 330,
          width: 70,
          height: 16,
          moving: true,
          baseX: 200,
          moveRange: 60,
          moveSpeed: 70,
          moveDir: 1,
        },
        {
          x: 400,
          y: 250,
          width: 70,
          height: 16,
          moving: true,
          baseX: 400,
          moveRange: 80,
          moveSpeed: 90,
          moveDir: -1,
        },
        {
          x: 600,
          y: 180,
          width: 70,
          height: 16,
          moving: true,
          baseX: 600,
          moveRange: 60,
          moveSpeed: 110,
          moveDir: 1,
        },
        // ground
        { x: 0, y: 492, width: 900, height: 8 },
      ],
      enemies: [
        {
          x: 165,
          y: 416,
          width: 20,
          height: 20,
          vx: 50,
          minX: 160,
          maxX: 210,
          moveDir: 1,
        },
        {
          x: 265,
          y: 376,
          width: 20,
          height: 20,
          vx: 55,
          minX: 260,
          maxX: 310,
          moveDir: 1,
        },
        {
          x: 365,
          y: 336,
          width: 20,
          height: 20,
          vx: 60,
          minX: 360,
          maxX: 410,
          moveDir: 1,
        },
        {
          x: 545,
          y: 256,
          width: 20,
          height: 20,
          vx: 65,
          minX: 540,
          maxX: 610,
          moveDir: 1,
        },
        {
          x: 665,
          y: 216,
          width: 20,
          height: 20,
          vx: 70,
          minX: 660,
          maxX: 710,
          moveDir: 1,
        },
        {
          x: 765,
          y: 176,
          width: 20,
          height: 20,
          vx: 75,
          minX: 760,
          maxX: 830,
          moveDir: 1,
        },
      ],
      spikes: [
        { x: 130, y: 462, width: 20, height: 8 },
        { x: 230, y: 462, width: 20, height: 8 },
        { x: 310, y: 462, width: 20, height: 8 },
        { x: 415, y: 462, width: 20, height: 8 },
        { x: 510, y: 462, width: 20, height: 8 },
        { x: 620, y: 462, width: 20, height: 8 },
        { x: 710, y: 462, width: 20, height: 8 },
        { x: 800, y: 462, width: 20, height: 8 },
      ],
      exitX: 845,
      exitY: 120,
      exitWidth: 36,
      exitHeight: 40,
    },
  ];
}

function deepCloneLevel(level: Level): Level {
  return JSON.parse(JSON.stringify(level));
}

export default function DelayedControls({ onNavigate }: DelayedControlsProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [, setScreen] = useState<GameScreen>("start");
  const [winStats, setWinStats] = useState({ inputs: 0, time: 0 });

  // All mutable game state in refs for animation loop
  const playerRef = useRef<Player>({
    x: 40,
    y: 390,
    vx: 0,
    vy: 0,
    onGround: false,
    width: 24,
    height: 24,
  });
  const levelIndexRef = useRef(0);
  const levelsRef = useRef<Level[]>(makeLevels());
  const currentLevelRef = useRef<Level>(deepCloneLevel(makeLevels()[0]));
  const inputQueueRef = useRef<InputQueueItem[]>([]);
  const currentDelayRef = useRef(BASE_DELAY);
  const ghostsRef = useRef<GhostSnapshot[]>([]);
  const keysRef = useRef<Record<string, boolean>>({});
  const screenRef = useRef<GameScreen>("start");
  const rafRef = useRef<number>(0);
  const lastTimeRef = useRef<number>(0);
  const totalInputsRef = useRef(0);
  const startTimeRef = useRef(0);
  const exitPulseRef = useRef(0);
  const deathFlashRef = useRef(0);
  const levelCompleteTimerRef = useRef(0);
  const scaleRef = useRef(1);

  const resetPlayerForLevel = useCallback((levelIdx: number) => {
    const lvl = levelsRef.current[levelIdx];
    playerRef.current = {
      x: lvl.startX,
      y: lvl.startY,
      vx: 0,
      vy: 0,
      onGround: false,
      width: 24,
      height: 24,
    };
    currentLevelRef.current = deepCloneLevel(lvl);
    inputQueueRef.current = [];
    ghostsRef.current = [];
    keysRef.current = {};
  }, []);

  const queueInput = useCallback((action: InputQueueItem["action"]) => {
    const delay = currentDelayRef.current;
    inputQueueRef.current.push({
      action,
      timestamp: Date.now(),
      delayMs: delay,
    });
    // Snapshot ghost
    const p = playerRef.current;
    const ghost: GhostSnapshot = { x: p.x, y: p.y, opacity: 0.5 };
    ghostsRef.current.push(ghost);
    if (ghostsRef.current.length > GHOST_BUFFER_SIZE) {
      ghostsRef.current.shift();
    }
    // Increase delay
    currentDelayRef.current = Math.min(
      MAX_DELAY,
      currentDelayRef.current + DELAY_INCREMENT,
    );
    totalInputsRef.current++;
  }, []);

  const checkAABB = (
    ax: number,
    ay: number,
    aw: number,
    ah: number,
    bx: number,
    by: number,
    bw: number,
    bh: number,
  ) => {
    return ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;
  };

  const startGame = useCallback(() => {
    levelIndexRef.current = 0;
    currentDelayRef.current = BASE_DELAY;
    totalInputsRef.current = 0;
    startTimeRef.current = Date.now();
    resetPlayerForLevel(0);
    screenRef.current = "playing";
    setScreen("playing");
  }, [resetPlayerForLevel]);

  const retryLevel = useCallback(() => {
    resetPlayerForLevel(levelIndexRef.current);
    inputQueueRef.current = [];
    ghostsRef.current = [];
    screenRef.current = "playing";
    setScreen("playing");
  }, [resetPlayerForLevel]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: game loop refs are stable
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    // Resize handling
    const handleResize = () => {
      const container = containerRef.current;
      if (!container) return;
      const cw = container.clientWidth;
      const ch = container.clientHeight;
      const scale = Math.min(cw / CANVAS_W, ch / CANVAS_H);
      scaleRef.current = scale;
      canvas.style.width = `${CANVAS_W * scale}px`;
      canvas.style.height = `${CANVAS_H * scale}px`;
    };
    handleResize();
    window.addEventListener("resize", handleResize);

    const handleKeyDown = (e: KeyboardEvent) => {
      const key = e.code;
      if (keysRef.current[key]) return; // prevent key repeat for movement
      keysRef.current[key] = true;

      if (screenRef.current === "start") {
        if (key === "Enter") startGame();
        return;
      }
      if (screenRef.current === "dead") {
        if (key === "KeyR") retryLevel();
        return;
      }
      if (screenRef.current === "win") return;
      if (screenRef.current === "levelcomplete") return;

      if (key === "Escape" || key === "Backspace") {
        onNavigate("games");
        return;
      }
      if (key === "KeyR") {
        retryLevel();
        return;
      }

      if (key === "ArrowLeft" || key === "KeyA") {
        e.preventDefault();
        queueInput("left");
      } else if (key === "ArrowRight" || key === "KeyD") {
        e.preventDefault();
        queueInput("right");
      } else if (key === "Space" || key === "ArrowUp" || key === "KeyW") {
        e.preventDefault();
        queueInput("jump");
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      const key = e.code;
      keysRef.current[key] = false;

      if (screenRef.current !== "playing") return;
      if (key === "ArrowLeft" || key === "KeyA") {
        queueInput("stop-left");
      } else if (key === "ArrowRight" || key === "KeyD") {
        queueInput("stop-right");
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);
    canvas.focus();

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const gameLoop = (timestamp: number) => {
      const dt = Math.min((timestamp - lastTimeRef.current) / 1000, 0.05);
      lastTimeRef.current = timestamp;

      ctx.clearRect(0, 0, CANVAS_W, CANVAS_H);

      if (screenRef.current === "start") {
        drawStart(ctx);
      } else if (screenRef.current === "playing") {
        update(dt);
        drawGame(ctx);
      } else if (screenRef.current === "dead") {
        drawGame(ctx);
        drawDeathScreen(ctx);
      } else if (screenRef.current === "levelcomplete") {
        drawGame(ctx);
        drawLevelComplete(ctx, dt);
      } else if (screenRef.current === "win") {
        drawWin(ctx);
      }

      rafRef.current = requestAnimationFrame(gameLoop);
    };

    const update = (dt: number) => {
      const p = playerRef.current;
      const level = currentLevelRef.current;
      const now = Date.now();

      // Process input queue
      const remaining: InputQueueItem[] = [];
      for (const item of inputQueueRef.current) {
        if (now - item.timestamp >= item.delayMs) {
          // Execute action
          if (item.action === "left") p.vx = -MOVE_SPEED;
          else if (item.action === "right") p.vx = MOVE_SPEED;
          else if (item.action === "stop-left") {
            if (p.vx < 0) p.vx = 0;
          } else if (item.action === "stop-right") {
            if (p.vx > 0) p.vx = 0;
          } else if (item.action === "jump" && p.onGround) {
            p.vy = JUMP_VY;
            p.onGround = false;
          }
        } else {
          remaining.push(item);
        }
      }
      inputQueueRef.current = remaining;

      // Decay delay when queue is empty
      if (inputQueueRef.current.length === 0) {
        currentDelayRef.current = Math.max(
          BASE_DELAY,
          currentDelayRef.current - DELAY_DECAY,
        );
      }

      // Physics
      p.vy += GRAVITY * dt;
      p.x += p.vx * dt;
      p.y += p.vy * dt;
      p.onGround = false;

      // Update moving platforms
      for (const plat of level.platforms) {
        if (plat.moving && plat.baseX !== undefined) {
          plat.x += (plat.moveSpeed ?? 60) * (plat.moveDir ?? 1) * dt;
          const min = plat.baseX;
          const max = plat.baseX + (plat.moveRange ?? 80);
          if (plat.x <= min) {
            plat.x = min;
            plat.moveDir = 1;
          }
          if (plat.x + plat.width >= max + plat.width) {
            plat.x = max;
            plat.moveDir = -1;
          }
        }
      }

      // Platform collision
      for (const plat of level.platforms) {
        if (
          checkAABB(
            p.x,
            p.y,
            p.width,
            p.height,
            plat.x,
            plat.y,
            plat.width,
            plat.height,
          )
        ) {
          const overlapTop = p.y + p.height - plat.y;
          const overlapBottom = plat.y + plat.height - p.y;
          const overlapLeft = p.x + p.width - plat.x;
          const overlapRight = plat.x + plat.width - p.x;
          const minOverlap = Math.min(
            overlapTop,
            overlapBottom,
            overlapLeft,
            overlapRight,
          );
          if (minOverlap === overlapTop && p.vy >= 0) {
            p.y = plat.y - p.height;
            p.vy = 0;
            p.onGround = true;
          } else if (minOverlap === overlapBottom && p.vy <= 0) {
            p.y = plat.y + plat.height;
            p.vy = 0;
          } else if (minOverlap === overlapLeft) {
            p.x = plat.x - p.width;
            p.vx = 0;
          } else if (minOverlap === overlapRight) {
            p.x = plat.x + plat.width;
            p.vx = 0;
          }
        }
      }

      // Bounds
      if (p.x < 0) {
        p.x = 0;
        p.vx = 0;
      }
      if (p.x + p.width > level.width) {
        p.x = level.width - p.width;
        p.vx = 0;
      }
      if (p.y > level.height + 100) {
        // Fell off screen — die
        triggerDeath();
        return;
      }

      // Update enemies
      for (const enemy of level.enemies) {
        enemy.x += enemy.vx * (enemy.moveDir ?? 1) * dt;
        if (enemy.x <= enemy.minX) {
          enemy.x = enemy.minX;
          enemy.moveDir = 1;
        }
        if (enemy.x + enemy.width >= enemy.maxX) {
          enemy.x = enemy.maxX - enemy.width;
          enemy.moveDir = -1;
        }
        if (
          checkAABB(
            p.x,
            p.y,
            p.width,
            p.height,
            enemy.x,
            enemy.y,
            enemy.width,
            enemy.height,
          )
        ) {
          triggerDeath();
          return;
        }
      }

      // Check spikes
      for (const spike of level.spikes) {
        if (
          checkAABB(
            p.x,
            p.y,
            p.width,
            p.height,
            spike.x,
            spike.y,
            spike.width,
            spike.height,
          )
        ) {
          triggerDeath();
          return;
        }
      }

      // Check exit
      exitPulseRef.current += dt * 3;
      if (
        checkAABB(
          p.x,
          p.y,
          p.width,
          p.height,
          level.exitX,
          level.exitY,
          level.exitWidth,
          level.exitHeight,
        )
      ) {
        const nextIdx = levelIndexRef.current + 1;
        if (nextIdx >= levelsRef.current.length) {
          // Win!
          setWinStats({
            inputs: totalInputsRef.current,
            time: Math.floor((Date.now() - startTimeRef.current) / 1000),
          });
          screenRef.current = "win";
          setScreen("win");
        } else {
          levelCompleteTimerRef.current = 1.5;
          screenRef.current = "levelcomplete";
          setScreen("levelcomplete");
        }
      }

      // Update ghost opacities
      ghostsRef.current = ghostsRef.current.map((g, i) => ({
        ...g,
        opacity: 0.15 + (i / ghostsRef.current.length) * 0.35,
      }));
    };

    const triggerDeath = () => {
      deathFlashRef.current = 1.0;
      screenRef.current = "dead";
      setScreen("dead");
    };

    const drawStart = (ctx: CanvasRenderingContext2D) => {
      ctx.fillStyle = "#0d0d1a";
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

      // Animated background grid
      ctx.strokeStyle = "rgba(0, 255, 255, 0.05)";
      ctx.lineWidth = 1;
      for (let x = 0; x < CANVAS_W; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, CANVAS_H);
        ctx.stroke();
      }
      for (let y = 0; y < CANVAS_H; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(CANVAS_W, y);
        ctx.stroke();
      }

      // Title
      ctx.shadowColor = "#00ffff";
      ctx.shadowBlur = 20;
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 56px monospace";
      ctx.textAlign = "center";
      ctx.fillText("DELAYED CONTROLS", CANVAS_W / 2, 140);

      ctx.shadowBlur = 8;
      ctx.fillStyle = "#00e5ff";
      ctx.font = "bold 18px monospace";
      ctx.fillText("A Precision Platformer", CANVAS_W / 2, 180);

      ctx.shadowBlur = 0;
      ctx.fillStyle = "rgba(255,255,255,0.8)";
      ctx.font = "14px monospace";
      ctx.fillText(
        "Every input you make is DELAYED — and the delay grows the more you play.",
        CANVAS_W / 2,
        230,
      );
      ctx.fillText(
        "Plan your moves BEFORE you need them. Predict your future self.",
        CANVAS_W / 2,
        255,
      );
      ctx.fillText(
        "Ghost echoes show where you will be. The chaos grows.",
        CANVAS_W / 2,
        280,
      );

      ctx.fillStyle = "rgba(255,255,255,0.5)";
      ctx.font = "13px monospace";
      ctx.fillText("WASD / Arrow Keys — Move", CANVAS_W / 2, 330);
      ctx.fillText("SPACE / W / ↑ — Jump", CANVAS_W / 2, 352);
      ctx.fillText(
        "R — Retry Level    Esc / Backspace — Back to Hub",
        CANVAS_W / 2,
        374,
      );

      // Pulsing enter prompt
      const pulse = Math.sin(Date.now() / 400) * 0.3 + 0.7;
      ctx.shadowColor = "#00ffff";
      ctx.shadowBlur = 16;
      ctx.fillStyle = `rgba(0, 229, 255, ${pulse})`;
      ctx.font = "bold 22px monospace";
      ctx.fillText("► Press ENTER to Start ◄", CANVAS_W / 2, 440);
      ctx.shadowBlur = 0;
      ctx.textAlign = "left";
    };

    const drawGame = (ctx: CanvasRenderingContext2D) => {
      const level = currentLevelRef.current;
      const p = playerRef.current;

      // Background
      ctx.fillStyle = "#0d0d1a";
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

      // Background grid lines (become denser visually with more ghosts)
      const ghostCount = ghostsRef.current.length;
      ctx.strokeStyle = `rgba(0, 255, 255, ${0.03 + ghostCount * 0.005})`;
      ctx.lineWidth = 1;
      for (let x = 0; x < CANVAS_W; x += 40) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, CANVAS_H);
        ctx.stroke();
      }
      for (let y = 0; y < CANVAS_H; y += 40) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(CANVAS_W, y);
        ctx.stroke();
      }

      // Draw ghosts (echo versions, most opaque first = oldest)
      for (let i = 0; i < ghostsRef.current.length; i++) {
        const g = ghostsRef.current[i];
        const scale = 0.9;
        const gw = p.width * scale;
        const gh = p.height * scale;
        const gx = g.x + (p.width - gw) / 2;
        const gy = g.y + (p.height - gh) / 2;
        ctx.globalAlpha = g.opacity;
        ctx.shadowColor = "#00ffff";
        ctx.shadowBlur = 12;
        ctx.fillStyle = "#00e5ff";
        ctx.fillRect(gx, gy, gw, gh);
      }
      ctx.globalAlpha = 1.0;
      ctx.shadowBlur = 0;

      // Draw platforms
      for (const plat of level.platforms) {
        if (plat.moving) {
          ctx.shadowColor = "#ffcc00";
          ctx.shadowBlur = 8;
          ctx.fillStyle = "#ffcc00";
        } else {
          ctx.shadowColor = "#00ffff";
          ctx.shadowBlur = 8;
          ctx.fillStyle = "#e8e8ff";
        }
        ctx.fillRect(plat.x, plat.y, plat.width, plat.height);
        ctx.strokeStyle = plat.moving ? "#ffcc00" : "#00ffff";
        ctx.lineWidth = 1;
        ctx.strokeRect(plat.x, plat.y, plat.width, plat.height);
      }
      ctx.shadowBlur = 0;

      // Draw spikes
      ctx.fillStyle = "#ff3366";
      ctx.shadowColor = "#ff3366";
      ctx.shadowBlur = 6;
      for (const spike of level.spikes) {
        ctx.beginPath();
        ctx.moveTo(spike.x, spike.y + spike.height);
        ctx.lineTo(spike.x + spike.width / 2, spike.y);
        ctx.lineTo(spike.x + spike.width, spike.y + spike.height);
        ctx.closePath();
        ctx.fill();
      }
      ctx.shadowBlur = 0;

      // Draw enemies
      ctx.fillStyle = "#ff3366";
      ctx.shadowColor = "#ff0055";
      ctx.shadowBlur = 10;
      for (const enemy of level.enemies) {
        ctx.fillRect(enemy.x, enemy.y, enemy.width, enemy.height);
        // Eyes
        ctx.fillStyle = "#ffffff";
        ctx.shadowBlur = 0;
        ctx.fillRect(enemy.x + 4, enemy.y + 4, 5, 5);
        ctx.fillRect(enemy.x + enemy.width - 9, enemy.y + 4, 5, 5);
        ctx.fillStyle = "#000000";
        ctx.fillRect(enemy.x + 6, enemy.y + 6, 2, 2);
        ctx.fillRect(enemy.x + enemy.width - 8, enemy.y + 6, 2, 2);
        ctx.fillStyle = "#ff3366";
        ctx.shadowColor = "#ff0055";
        ctx.shadowBlur = 10;
      }
      ctx.shadowBlur = 0;

      // Draw exit door (pulsing green)
      const pulse = Math.sin(exitPulseRef.current) * 0.3 + 0.7;
      ctx.shadowColor = "#00ff88";
      ctx.shadowBlur = 20 * pulse;
      ctx.fillStyle = `rgba(0, ${Math.floor(180 + 75 * pulse)}, ${Math.floor(100 + 36 * pulse)}, 0.9)`;
      ctx.fillRect(level.exitX, level.exitY, level.exitWidth, level.exitHeight);
      ctx.strokeStyle = "#00ff88";
      ctx.lineWidth = 2;
      ctx.strokeRect(
        level.exitX,
        level.exitY,
        level.exitWidth,
        level.exitHeight,
      );
      // Door label
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 10px monospace";
      ctx.textAlign = "center";
      ctx.shadowBlur = 0;
      ctx.fillText(
        "EXIT",
        level.exitX + level.exitWidth / 2,
        level.exitY + level.exitHeight / 2 + 4,
      );
      ctx.textAlign = "left";

      // Draw player
      ctx.shadowColor = "#00e5ff";
      ctx.shadowBlur = 16;
      ctx.fillStyle = "#00e5ff";
      ctx.fillRect(p.x, p.y, p.width, p.height);
      // Player face
      ctx.fillStyle = "#0d0d1a";
      ctx.shadowBlur = 0;
      ctx.fillRect(p.x + 5, p.y + 6, 5, 5);
      ctx.fillRect(p.x + p.width - 10, p.y + 6, 5, 5);

      // HUD
      drawHUD(ctx);
    };

    const drawHUD = (ctx: CanvasRenderingContext2D) => {
      const delay = currentDelayRef.current;
      const level = levelIndexRef.current;
      const ghosts = ghostsRef.current.length;

      // HUD background bar
      ctx.fillStyle = "rgba(0,0,0,0.6)";
      ctx.fillRect(0, 0, CANVAS_W, 36);

      // Delay bar
      const delayFraction = (delay - BASE_DELAY) / (MAX_DELAY - BASE_DELAY);
      const barWidth = 160;
      const barH = 12;
      const barX = 8;
      const barY = 12;

      ctx.fillStyle = "rgba(255,255,255,0.2)";
      ctx.fillRect(barX, barY, barWidth, barH);

      // Color: green -> yellow -> red
      const r = Math.floor(delayFraction * 255);
      const g = Math.floor((1 - delayFraction) * 255);
      ctx.shadowColor = `rgb(${r},${g},0)`;
      ctx.shadowBlur = 6;
      ctx.fillStyle = `rgb(${r},${g},0)`;
      ctx.fillRect(barX, barY, barWidth * delayFraction, barH);
      ctx.shadowBlur = 0;

      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 11px monospace";
      ctx.textAlign = "left";
      ctx.fillText(`DELAY: ${Math.round(delay)}ms`, barX, barY - 2);

      // Level
      ctx.textAlign = "center";
      ctx.fillStyle = "#00e5ff";
      ctx.shadowColor = "#00e5ff";
      ctx.shadowBlur = 8;
      ctx.font = "bold 14px monospace";
      ctx.fillText(`LEVEL ${level + 1} / 3`, CANVAS_W / 2, 22);
      ctx.shadowBlur = 0;

      // Ghosts count
      ctx.textAlign = "right";
      ctx.fillStyle = ghosts > 4 ? "#ff9900" : "#00e5ff";
      ctx.font = "bold 12px monospace";
      ctx.fillText(`GHOSTS: ${ghosts}`, CANVAS_W - 8, 22);
      ctx.textAlign = "left";

      // Pending inputs count
      const pending = inputQueueRef.current.length;
      if (pending > 0) {
        ctx.fillStyle = "rgba(255,200,0,0.8)";
        ctx.font = "10px monospace";
        ctx.textAlign = "right";
        ctx.fillText(
          `⏳ ${pending} input${pending > 1 ? "s" : ""} pending`,
          CANVAS_W - 8,
          CANVAS_H - 8,
        );
        ctx.textAlign = "left";
      }
    };

    const drawDeathScreen = (ctx: CanvasRenderingContext2D) => {
      // Red flash overlay
      const alpha = Math.min(0.7, deathFlashRef.current);
      ctx.fillStyle = `rgba(255, 0, 50, ${alpha * 0.5})`;
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

      ctx.shadowColor = "#ff0033";
      ctx.shadowBlur = 30;
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 64px monospace";
      ctx.textAlign = "center";
      ctx.fillText("YOU DIED", CANVAS_W / 2, CANVAS_H / 2 - 40);
      ctx.shadowBlur = 0;

      ctx.fillStyle = "rgba(255,100,100,0.9)";
      ctx.font = "16px monospace";
      ctx.fillText(
        `Current Delay: ${Math.round(currentDelayRef.current)}ms`,
        CANVAS_W / 2,
        CANVAS_H / 2 + 20,
      );
      ctx.fillText(
        "(Delay does not reset — plan ahead!)",
        CANVAS_W / 2,
        CANVAS_H / 2 + 46,
      );

      const pulse = Math.sin(Date.now() / 500) * 0.3 + 0.7;
      ctx.fillStyle = `rgba(255, 200, 200, ${pulse})`;
      ctx.font = "bold 18px monospace";
      ctx.fillText("Press R to Retry Level", CANVAS_W / 2, CANVAS_H / 2 + 90);
      ctx.textAlign = "left";
    };

    const drawLevelComplete = (ctx: CanvasRenderingContext2D, dt: number) => {
      levelCompleteTimerRef.current -= dt;
      if (levelCompleteTimerRef.current <= 0) {
        const nextIdx = levelIndexRef.current + 1;
        levelIndexRef.current = nextIdx;
        currentDelayRef.current = Math.max(
          BASE_DELAY,
          currentDelayRef.current - 100,
        );
        resetPlayerForLevel(nextIdx);
        screenRef.current = "playing";
        setScreen("playing");
        return;
      }

      ctx.fillStyle = "rgba(0, 255, 136, 0.15)";
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

      ctx.shadowColor = "#00ff88";
      ctx.shadowBlur = 30;
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 56px monospace";
      ctx.textAlign = "center";
      ctx.fillText("LEVEL COMPLETE!", CANVAS_W / 2, CANVAS_H / 2);
      ctx.shadowBlur = 0;
      ctx.textAlign = "left";
    };

    const drawWin = (ctx: CanvasRenderingContext2D) => {
      ctx.fillStyle = "#0d0d1a";
      ctx.fillRect(0, 0, CANVAS_W, CANVAS_H);

      // Starfield
      for (let i = 0; i < 80; i++) {
        const x = (i * 137.5) % CANVAS_W;
        const y = (i * 97.3) % CANVAS_H;
        const brightness = Math.sin(Date.now() / 1000 + i) * 0.3 + 0.7;
        ctx.fillStyle = `rgba(0, 229, 255, ${brightness * 0.5})`;
        ctx.fillRect(x, y, 2, 2);
      }

      ctx.shadowColor = "#00ffff";
      ctx.shadowBlur = 30;
      ctx.fillStyle = "#ffffff";
      ctx.font = "bold 72px monospace";
      ctx.textAlign = "center";
      ctx.fillText("YOU WIN!", CANVAS_W / 2, 160);

      ctx.shadowBlur = 8;
      ctx.fillStyle = "#00e5ff";
      ctx.font = "bold 20px monospace";
      ctx.fillText(
        "You mastered the art of delayed thinking.",
        CANVAS_W / 2,
        220,
      );

      ctx.shadowBlur = 0;
      ctx.fillStyle = "rgba(255,255,255,0.8)";
      ctx.font = "16px monospace";
      ctx.fillText(`Total Inputs Made: ${winStats.inputs}`, CANVAS_W / 2, 290);
      ctx.fillText(`Time Taken: ${winStats.time}s`, CANVAS_W / 2, 318);

      // Play Again button
      const btnW = 200;
      const btnH = 50;
      const btnX = CANVAS_W / 2 - btnW / 2;
      const btnY = 380;
      const pulse = Math.sin(Date.now() / 500) * 0.2 + 0.8;
      ctx.shadowColor = "#00ffff";
      ctx.shadowBlur = 16 * pulse;
      ctx.fillStyle = "#00e5ff";
      ctx.fillRect(btnX, btnY, btnW, btnH);
      ctx.fillStyle = "#0d0d1a";
      ctx.shadowBlur = 0;
      ctx.font = "bold 18px monospace";
      ctx.fillText("Play Again", CANVAS_W / 2, btnY + 32);

      ctx.textAlign = "left";
    };

    lastTimeRef.current = performance.now();
    rafRef.current = requestAnimationFrame(gameLoop);

    return () => {
      cancelAnimationFrame(rafRef.current);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      window.removeEventListener("resize", handleResize);
    };
  }, [
    startGame,
    retryLevel,
    resetPlayerForLevel,
    onNavigate,
    queueInput,
    winStats,
  ]);

  // Handle Play Again click on win screen
  const handleCanvasClick = useCallback(
    (e: React.MouseEvent<HTMLCanvasElement>) => {
      if (screenRef.current !== "win") return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const rect = canvas.getBoundingClientRect();
      const scale = scaleRef.current;
      const mx = (e.clientX - rect.left) / scale;
      const my = (e.clientY - rect.top) / scale;
      const btnW = 200;
      const btnH = 50;
      const btnX = CANVAS_W / 2 - btnW / 2;
      const btnY = 380;
      if (mx >= btnX && mx <= btnX + btnW && my >= btnY && my <= btnY + btnH) {
        levelIndexRef.current = 0;
        currentDelayRef.current = BASE_DELAY;
        totalInputsRef.current = 0;
        startTimeRef.current = Date.now();
        resetPlayerForLevel(0);
        screenRef.current = "playing";
        setScreen("playing");
      }
    },
    [resetPlayerForLevel],
  );

  return (
    <div
      ref={containerRef}
      style={{
        width: "100vw",
        height: "100vh",
        background: "#0d0d1a",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        overflow: "hidden",
        position: "relative",
      }}
    >
      {/* Back button overlay */}
      <button
        type="button"
        onClick={() => onNavigate("games")}
        style={{
          position: "absolute",
          top: 12,
          left: 12,
          background: "rgba(0,229,255,0.15)",
          border: "1px solid rgba(0,229,255,0.4)",
          color: "#00e5ff",
          padding: "6px 14px",
          fontFamily: "monospace",
          fontSize: 13,
          cursor: "pointer",
          borderRadius: 4,
          zIndex: 10,
        }}
        data-ocid="delayed-controls.button"
      >
        ← Back
      </button>

      <canvas
        ref={canvasRef}
        width={CANVAS_W}
        height={CANVAS_H}
        onClick={handleCanvasClick}
        onKeyDown={(e) => {
          if (e.key === "Enter") handleCanvasClick(e as never);
        }}
        tabIndex={0}
        style={{
          display: "block",
          outline: "none",
          cursor: screenRef.current === "win" ? "pointer" : "default",
          imageRendering: "pixelated",
        }}
        data-ocid="delayed-controls.canvas_target"
      />
    </div>
  );
}
