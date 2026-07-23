import { useCallback, useEffect, useRef, useState } from "react";
import type { ModulePage } from "../../App";
import GameLayout from "../../components/GameLayout";

interface YoureLateAlwaysProps {
  onNavigate: (page: ModulePage) => void;
}

export default function YoureLateAlways({ onNavigate }: YoureLateAlwaysProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [level, setLevel] = useState(1);

  const gameStateRef = useRef({
    player: { x: 400, y: 300, health: 100 },
    projectiles: [] as { x: number; y: number; vx: number; vy: number }[],
    explosions: [] as { x: number; y: number; radius: number; timer: number }[],
    fires: [] as { x: number; y: number; size: number }[],
    goal: { x: 700, y: 100 },
    keys: {} as Record<string, boolean>,
    chaosTimer: 0,
  });

  const initGame = useCallback(() => {
    const state = gameStateRef.current;
    state.player = { x: 400, y: 300, health: 100 };
    state.projectiles = [];
    state.explosions = [];
    state.fires = [];
    state.goal = { x: 700, y: 100 };
    state.chaosTimer = 0;

    // Start with chaos already happening
    for (let i = 0; i < 5 + level; i++) {
      state.projectiles.push({
        x: Math.random() * 800,
        y: Math.random() * 600,
        vx: (Math.random() - 0.5) * 8,
        vy: (Math.random() - 0.5) * 8,
      });
    }

    for (let i = 0; i < 3 + level; i++) {
      state.fires.push({
        x: Math.random() * 800,
        y: Math.random() * 600,
        size: 30 + Math.random() * 30,
      });
    }

    for (let i = 0; i < 2; i++) {
      state.explosions.push({
        x: Math.random() * 800,
        y: Math.random() * 600,
        radius: 0,
        timer: 0,
      });
    }

    setGameOver(false);
  }, [level]);

  const handleRestart = () => {
    setLevel(1);
    setScore(0);
    initGame();
  };
  useEffect(() => {
    initGame();
  }, [initGame]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      gameStateRef.current.keys[e.key] = true;
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      gameStateRef.current.keys[e.key] = false;
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    let animationId: number;

    const gameLoop = () => {
      const state = gameStateRef.current;

      if (!gameOver) {
        // Player movement
        const speed = 5;
        if (state.keys.ArrowLeft || state.keys.a) state.player.x -= speed;
        if (state.keys.ArrowRight || state.keys.d) state.player.x += speed;
        if (state.keys.ArrowUp || state.keys.w) state.player.y -= speed;
        if (state.keys.ArrowDown || state.keys.s) state.player.y += speed;

        state.player.x = Math.max(20, Math.min(780, state.player.x));
        state.player.y = Math.max(20, Math.min(580, state.player.y));

        // Update projectiles
        for (const proj of state.projectiles) {
          proj.x += proj.vx;
          proj.y += proj.vy;

          if (proj.x < 0 || proj.x > 800) proj.vx *= -1;
          if (proj.y < 0 || proj.y > 600) proj.vy *= -1;

          // Check collision with player
          const dx = proj.x - state.player.x;
          const dy = proj.y - state.player.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 30) {
            state.player.health -= 10;
            proj.x = Math.random() * 800;
            proj.y = Math.random() * 600;
          }
        }

        // Update explosions
        state.explosions = state.explosions.filter((exp) => {
          exp.timer += 16;
          exp.radius = (exp.timer / 1000) * 100;

          if (exp.timer < 1000) {
            const dx = exp.x - state.player.x;
            const dy = exp.y - state.player.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < exp.radius) {
              state.player.health -= 0.5;
            }
            return true;
          }
          return false;
        });

        // Check fire collision
        for (const fire of state.fires) {
          const dx = fire.x - state.player.x;
          const dy = fire.y - state.player.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < fire.size) {
            state.player.health -= 0.3;
          }
        }

        // Spawn more chaos
        state.chaosTimer += 16;
        if (state.chaosTimer > 2000) {
          state.chaosTimer = 0;

          // Random chaos event
          const event = Math.random();
          if (event < 0.4) {
            state.projectiles.push({
              x: Math.random() * 800,
              y: Math.random() * 600,
              vx: (Math.random() - 0.5) * 8,
              vy: (Math.random() - 0.5) * 8,
            });
          } else if (event < 0.7) {
            state.explosions.push({
              x: Math.random() * 800,
              y: Math.random() * 600,
              radius: 0,
              timer: 0,
            });
          } else {
            state.fires.push({
              x: Math.random() * 800,
              y: Math.random() * 600,
              size: 30 + Math.random() * 30,
            });
          }
        }

        // Check health
        if (state.player.health <= 0) {
          setGameOver(true);
          if (score > highScore) setHighScore(score);
        }

        // Check goal
        const dx = state.goal.x - state.player.x;
        const dy = state.goal.y - state.player.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 40) {
          setScore((s) => s + Math.floor(state.player.health) + level * 10);
          setLevel((l) => l + 1);
        }

        // Increase score for survival
        setScore((s) => s + 0.1);
      }

      // Render
      ctx.fillStyle = "#2d1b00";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Chaos background
      ctx.fillStyle = "rgba(255, 0, 0, 0.1)";
      ctx.fillRect(0, 0, 800, 600);

      // Fires
      for (const fire of state.fires) {
        const gradient = ctx.createRadialGradient(
          fire.x,
          fire.y,
          0,
          fire.x,
          fire.y,
          fire.size,
        );
        gradient.addColorStop(0, "#ff6b00");
        gradient.addColorStop(0.5, "#ff0000");
        gradient.addColorStop(1, "rgba(255, 0, 0, 0)");
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(fire.x, fire.y, fire.size, 0, Math.PI * 2);
        ctx.fill();

        ctx.fillStyle = "#fff";
        ctx.font = "32px Arial";
        ctx.textAlign = "center";
        ctx.fillText("🔥", fire.x, fire.y + 10);
      }

      // Explosions
      for (const exp of state.explosions) {
        const alpha = 1 - exp.timer / 1000;
        ctx.fillStyle = `rgba(255, 100, 0, ${alpha * 0.5})`;
        ctx.beginPath();
        ctx.arc(exp.x, exp.y, exp.radius, 0, Math.PI * 2);
        ctx.fill();

        ctx.strokeStyle = `rgba(255, 200, 0, ${alpha})`;
        ctx.lineWidth = 5;
        ctx.stroke();
      }

      // Projectiles
      for (const proj of state.projectiles) {
        ctx.fillStyle = "#fbbf24";
        ctx.beginPath();
        ctx.arc(proj.x, proj.y, 15, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#fff";
        ctx.font = "20px Arial";
        ctx.textAlign = "center";
        ctx.fillText("💣", proj.x, proj.y + 7);
      }

      // Goal
      ctx.fillStyle = "#22c55e";
      ctx.beginPath();
      ctx.arc(state.goal.x, state.goal.y, 30, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.font = "32px Arial";
      ctx.textAlign = "center";
      ctx.fillText("🚪", state.goal.x, state.goal.y + 10);

      // Player
      ctx.fillStyle = "#3b82f6";
      ctx.beginPath();
      ctx.arc(state.player.x, state.player.y, 18, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 3;
      ctx.stroke();

      // UI
      ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
      ctx.fillRect(10, 10, 250, 100);
      ctx.fillStyle = "#fff";
      ctx.font = "bold 16px Arial";
      ctx.textAlign = "left";
      ctx.fillText("You're late! Chaos everywhere!", 20, 35);
      ctx.fillText(`Health: ${Math.floor(state.player.health)}`, 20, 65);
      ctx.fillText(`Level: ${level}`, 20, 90);

      // Health bar
      ctx.fillStyle = "#ef4444";
      ctx.fillRect(20, 95, 220, 10);
      ctx.fillStyle = "#22c55e";
      ctx.fillRect(20, 95, (state.player.health / 100) * 220, 10);

      // Warning text
      ctx.fillStyle = "rgba(255, 0, 0, 0.7)";
      ctx.font = "bold 24px Arial";
      ctx.textAlign = "center";
      ctx.fillText("⚠️ REACT IMMEDIATELY! ⚠️", 400, 30);

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
      title="You're Late, Always ⏰"
      score={score}
      highScore={highScore}
      onRestart={handleRestart}
      onNavigate={onNavigate}
      gameOver={gameOver}
    >
      <div className="flex flex-col items-center justify-center p-4 bg-gradient-to-br from-orange-900 to-red-900">
        <div className="mb-4 text-center text-white">
          <p className="text-lg font-semibold">Start in the middle of chaos!</p>
          <p className="text-sm">
            Arrow keys/WASD to move • Survive and reach the exit
          </p>
        </div>
        <canvas
          ref={canvasRef}
          width={800}
          height={600}
          className="border-4 border-orange-500 rounded-lg shadow-lg"
        />
      </div>
    </GameLayout>
  );
}
