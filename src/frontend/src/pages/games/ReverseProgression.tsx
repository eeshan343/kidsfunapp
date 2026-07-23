import { useEffect, useRef, useState } from "react";
import type { ModulePage } from "../../App";
import GameLayout from "../../components/GameLayout";

interface ReverseProgressionProps {
  onNavigate: (page: ModulePage) => void;
}

export default function ReverseProgression({
  onNavigate,
}: ReverseProgressionProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [level, setLevel] = useState(1);

  const gameStateRef = useRef({
    player: { x: 100, y: 500, vx: 0, vy: 0, onGround: false },
    abilities: {
      doubleJump: true,
      dash: true,
      shield: true,
      slowTime: true,
    },
    enemies: [] as { x: number; y: number; vx: number }[],
    platforms: [] as { x: number; y: number; width: number }[],
    goal: { x: 700, y: 100 },
    keys: {} as Record<string, boolean>,
    hasDoubleJumped: false,
    dashCooldown: 0,
    shieldActive: false,
    slowTimeActive: false,
  });

  const initGame = () => {
    const state = gameStateRef.current;
    state.player = { x: 100, y: 500, vx: 0, vy: 0, onGround: false };
    state.goal = { x: 700, y: 100 };
    state.enemies = [];
    state.platforms = [];
    state.hasDoubleJumped = false;
    state.dashCooldown = 0;
    state.shieldActive = false;
    state.slowTimeActive = false;

    // Remove one ability per level
    state.abilities = {
      doubleJump: level < 2,
      dash: level < 3,
      shield: level < 4,
      slowTime: level < 5,
    };

    // Create platforms
    state.platforms.push({ x: 0, y: 550, width: 200 });
    for (let i = 0; i < 6; i++) {
      state.platforms.push({
        x: 150 + i * 120,
        y: 500 - i * 60,
        width: 100,
      });
    }
    state.platforms.push({ x: 650, y: 150, width: 150 });

    // Create enemies
    for (let i = 0; i < 2 + level; i++) {
      state.enemies.push({
        x: 200 + i * 150,
        y: 400 - i * 50,
        vx: 2,
      });
    }

    setGameOver(false);
  };

  const handleRestart = () => {
    setLevel(1);
    setScore(0);
    initGame();
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: initGame is stable
  useEffect(() => {
    initGame();
  }, [level]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const state = gameStateRef.current;
      state.keys[e.key] = true;

      // Dash ability
      if (
        e.key === "Shift" &&
        state.abilities.dash &&
        state.dashCooldown <= 0
      ) {
        const direction = state.keys.ArrowLeft || state.keys.a ? -1 : 1;
        state.player.vx = direction * 15;
        state.dashCooldown = 60;
      }

      // Shield ability
      if (e.key === "e" && state.abilities.shield) {
        state.shieldActive = true;
      }

      // Slow time ability
      if (e.key === "q" && state.abilities.slowTime) {
        state.slowTimeActive = !state.slowTimeActive;
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      gameStateRef.current.keys[e.key] = false;
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    let animationId: number;

    const gameLoop = () => {
      const state = gameStateRef.current;
      const timeScale = state.slowTimeActive ? 0.3 : 1;

      if (!gameOver) {
        // Player movement
        const speed = 4;
        if (state.keys.ArrowLeft || state.keys.a) state.player.vx = -speed;
        else if (state.keys.ArrowRight || state.keys.d) state.player.vx = speed;
        else state.player.vx *= 0.8;

        // Jump
        if (
          (state.keys.ArrowUp || state.keys.w || state.keys[" "]) &&
          state.player.onGround
        ) {
          state.player.vy = -12;
          state.player.onGround = false;
          state.hasDoubleJumped = false;
        } else if (
          (state.keys.ArrowUp || state.keys.w || state.keys[" "]) &&
          !state.hasDoubleJumped &&
          state.abilities.doubleJump &&
          !state.player.onGround
        ) {
          state.player.vy = -12;
          state.hasDoubleJumped = true;
        }

        // Gravity
        state.player.vy += 0.5 * timeScale;
        state.player.x += state.player.vx * timeScale;
        state.player.y += state.player.vy * timeScale;

        // Platform collision
        state.player.onGround = false;
        for (const platform of state.platforms) {
          if (
            state.player.x + 15 > platform.x &&
            state.player.x - 15 < platform.x + platform.width &&
            state.player.y + 15 > platform.y &&
            state.player.y + 15 < platform.y + 20 &&
            state.player.vy > 0
          ) {
            state.player.y = platform.y - 15;
            state.player.vy = 0;
            state.player.onGround = true;
          }
        }

        // Update enemies
        for (const enemy of state.enemies) {
          enemy.x += enemy.vx * timeScale;
          if (enemy.x < 100 || enemy.x > 700) enemy.vx *= -1;
        }

        // Enemy collision
        if (!state.shieldActive) {
          for (const enemy of state.enemies) {
            const dx = enemy.x - state.player.x;
            const dy = enemy.y - state.player.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 35) {
              setGameOver(true);
              if (score > highScore) setHighScore(score);
            }
          }
        }

        // Cooldowns
        if (state.dashCooldown > 0) state.dashCooldown--;
        if (state.shieldActive) {
          setTimeout(() => {
            state.shieldActive = false;
          }, 100);
        }

        // Check goal
        const dx = state.goal.x - state.player.x;
        const dy = state.goal.y - state.player.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 40) {
          setScore((s) => s + (5 - level) * 20);
          setLevel((l) => l + 1);
        }

        // Fall off
        if (state.player.y > 650) {
          setGameOver(true);
          if (score > highScore) setHighScore(score);
        }
      }

      // Render
      ctx.fillStyle = state.slowTimeActive ? "#1a1a3e" : "#0f172a";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Goal
      ctx.fillStyle = "#22c55e";
      ctx.beginPath();
      ctx.arc(state.goal.x, state.goal.y, 30, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.font = "32px Arial";
      ctx.textAlign = "center";
      ctx.fillText("🏁", state.goal.x, state.goal.y + 10);

      // Platforms
      for (const platform of state.platforms) {
        ctx.fillStyle = "#6366f1";
        ctx.fillRect(platform.x, platform.y, platform.width, 20);
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 2;
        ctx.strokeRect(platform.x, platform.y, platform.width, 20);
      }

      // Enemies
      for (const enemy of state.enemies) {
        ctx.fillStyle = "#ef4444";
        ctx.beginPath();
        ctx.arc(enemy.x, enemy.y, 20, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#fff";
        ctx.font = "24px Arial";
        ctx.textAlign = "center";
        ctx.fillText("👹", enemy.x, enemy.y + 8);
      }

      // Player
      ctx.fillStyle = "#fbbf24";
      ctx.beginPath();
      ctx.arc(state.player.x, state.player.y, 15, 0, Math.PI * 2);
      ctx.fill();

      if (state.shieldActive) {
        ctx.strokeStyle = "#60a5fa";
        ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.arc(state.player.x, state.player.y, 25, 0, Math.PI * 2);
        ctx.stroke();
      }

      // UI
      ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
      ctx.fillRect(10, 10, 300, 140);
      ctx.fillStyle = "#fff";
      ctx.font = "bold 14px Arial";
      ctx.textAlign = "left";
      ctx.fillText(`Level: ${level} - Abilities Lost: ${level - 1}`, 20, 30);

      let y = 55;
      ctx.fillStyle = state.abilities.doubleJump ? "#22c55e" : "#ef4444";
      ctx.fillText(
        `Double Jump: ${state.abilities.doubleJump ? "✓" : "✗"}`,
        20,
        y,
      );
      y += 25;
      ctx.fillStyle = state.abilities.dash ? "#22c55e" : "#ef4444";
      ctx.fillText(`Dash (Shift): ${state.abilities.dash ? "✓" : "✗"}`, 20, y);
      y += 25;
      ctx.fillStyle = state.abilities.shield ? "#22c55e" : "#ef4444";
      ctx.fillText(`Shield (E): ${state.abilities.shield ? "✓" : "✗"}`, 20, y);
      y += 25;
      ctx.fillStyle = state.abilities.slowTime ? "#22c55e" : "#ef4444";
      ctx.fillText(
        `Slow Time (Q): ${state.abilities.slowTime ? "✓" : "✗"}`,
        20,
        y,
      );

      animationId = requestAnimationFrame(gameLoop);
    };

    animationId = requestAnimationFrame(gameLoop);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [gameOver, score, highScore, level]);

  return (
    <GameLayout
      title="Reverse Progression ⬇️"
      score={score}
      highScore={highScore}
      onRestart={handleRestart}
      onNavigate={onNavigate}
      gameOver={gameOver}
    >
      <div className="flex flex-col items-center justify-center p-4 bg-gradient-to-br from-slate-900 to-indigo-900">
        <div className="mb-4 text-center text-white">
          <p className="text-lg font-semibold">
            Start powerful, lose abilities each level!
          </p>
          <p className="text-sm">
            Arrow keys/WASD • Space to jump • Shift/E/Q for abilities
          </p>
        </div>
        <canvas
          ref={canvasRef}
          width={800}
          height={600}
          className="border-4 border-indigo-500 rounded-lg shadow-lg"
        />
      </div>
    </GameLayout>
  );
}
