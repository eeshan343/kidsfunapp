import { useEffect, useRef, useState } from "react";
import type { ModulePage } from "../../App";
import GameLayout from "../../components/GameLayout";

interface EnemiesPlatformsProps {
  onNavigate: (page: ModulePage) => void;
}

export default function EnemiesPlatforms({
  onNavigate,
}: EnemiesPlatformsProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [level, setLevel] = useState(1);

  const gameStateRef = useRef({
    player: { x: 50, y: 500, vx: 0, vy: 0, onGround: false, onEnemy: false },
    enemies: [] as {
      x: number;
      y: number;
      vx: number;
      vy: number;
      attacking: boolean;
    }[],
    goal: { x: 750, y: 50 },
    keys: {} as Record<string, boolean>,
  });

  const initGame = () => {
    const state = gameStateRef.current;
    state.player = {
      x: 50,
      y: 500,
      vx: 0,
      vy: 0,
      onGround: false,
      onEnemy: false,
    };
    state.goal = { x: 750, y: 50 };
    state.enemies = [];

    // Create flying enemies as platforms
    for (let i = 0; i < 5 + level; i++) {
      state.enemies.push({
        x: 150 + i * 120,
        y: 450 - i * 60,
        vx: (Math.random() - 0.5) * 2,
        vy: Math.sin(i) * 2,
        attacking: false,
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
      gameStateRef.current.keys[e.key] = true;
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      gameStateRef.current.keys[e.key] = false;
    };

    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    let animationId: number;
    let time = 0;

    const gameLoop = () => {
      time += 0.016;
      const state = gameStateRef.current;

      if (!gameOver) {
        // Player movement
        const speed = 4;
        if (state.keys.ArrowLeft || state.keys.a) state.player.vx = -speed;
        else if (state.keys.ArrowRight || state.keys.d) state.player.vx = speed;
        else state.player.vx *= 0.8;

        // Jump
        if (
          (state.keys.ArrowUp || state.keys.w || state.keys[" "]) &&
          (state.player.onGround || state.player.onEnemy)
        ) {
          state.player.vy = -13;
          state.player.onGround = false;
          state.player.onEnemy = false;
        }

        // Gravity
        state.player.vy += 0.5;
        state.player.x += state.player.vx;
        state.player.y += state.player.vy;

        // Ground collision
        state.player.onGround = false;
        if (state.player.y > 550) {
          state.player.y = 550;
          state.player.vy = 0;
          state.player.onGround = true;
        }

        // Update enemies
        state.player.onEnemy = false;
        state.enemies.forEach((enemy, idx) => {
          // Floating movement
          enemy.x += enemy.vx;
          enemy.y += Math.sin(time + idx) * 1.5;

          // Bounce off walls
          if (enemy.x < 50 || enemy.x > 750) enemy.vx *= -1;
          enemy.y = Math.max(100, Math.min(500, enemy.y));

          // Check if player is on top of enemy
          if (
            state.player.x + 10 > enemy.x - 25 &&
            state.player.x - 10 < enemy.x + 25 &&
            state.player.y + 15 > enemy.y - 20 &&
            state.player.y + 15 < enemy.y &&
            state.player.vy > 0
          ) {
            state.player.y = enemy.y - 15;
            state.player.vy = 0;
            state.player.onEnemy = true;
            enemy.attacking = false;
          }
          // Check if enemy hits player from side/below
          else if (
            state.player.x + 15 > enemy.x - 25 &&
            state.player.x - 15 < enemy.x + 25 &&
            state.player.y + 15 > enemy.y - 20 &&
            state.player.y - 15 < enemy.y + 20
          ) {
            enemy.attacking = true;
            setGameOver(true);
            if (score > highScore) setHighScore(score);
          }
        });

        // Check goal
        const dx = state.goal.x - state.player.x;
        const dy = state.goal.y - state.player.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 40) {
          setScore((s) => s + level * 10);
          setLevel((l) => l + 1);
        }

        // Fall off
        if (state.player.y > 650) {
          setGameOver(true);
          if (score > highScore) setHighScore(score);
        }
      }

      // Render
      ctx.fillStyle = "#0c4a6e";
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

      // Ground
      ctx.fillStyle = "#1e3a8a";
      ctx.fillRect(0, 570, 800, 30);

      // Enemies (as platforms)
      // biome-ignore lint/complexity/noForEach: canvas render loop
      state.enemies.forEach((enemy) => {
        // Enemy body
        ctx.fillStyle = enemy.attacking ? "#dc2626" : "#f59e0b";
        ctx.fillRect(enemy.x - 25, enemy.y - 20, 50, 40);

        // Wings
        ctx.fillStyle = "#fbbf24";
        ctx.beginPath();
        ctx.moveTo(enemy.x - 25, enemy.y);
        ctx.lineTo(enemy.x - 40, enemy.y - 10);
        ctx.lineTo(enemy.x - 25, enemy.y + 10);
        ctx.fill();

        ctx.beginPath();
        ctx.moveTo(enemy.x + 25, enemy.y);
        ctx.lineTo(enemy.x + 40, enemy.y - 10);
        ctx.lineTo(enemy.x + 25, enemy.y + 10);
        ctx.fill();

        // Face
        ctx.fillStyle = "#fff";
        ctx.font = "28px Arial";
        ctx.textAlign = "center";
        ctx.fillText("👾", enemy.x, enemy.y + 8);

        // Platform indicator on top
        ctx.strokeStyle = "#22c55e";
        ctx.lineWidth = 3;
        ctx.beginPath();
        ctx.moveTo(enemy.x - 25, enemy.y - 20);
        ctx.lineTo(enemy.x + 25, enemy.y - 20);
        ctx.stroke();
      });

      // Player
      ctx.fillStyle = "#3b82f6";
      ctx.beginPath();
      ctx.arc(state.player.x, state.player.y, 15, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 3;
      ctx.stroke();

      // UI
      ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
      ctx.fillRect(10, 10, 280, 80);
      ctx.fillStyle = "#fff";
      ctx.font = "bold 14px Arial";
      ctx.textAlign = "left";
      ctx.fillText("Jump on enemies to use as platforms!", 20, 35);
      ctx.fillText("Avoid touching their sides!", 20, 60);
      ctx.fillText(`Level: ${level}`, 20, 85);

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
      title="Enemies Are the Platforms 🦅"
      score={score}
      highScore={highScore}
      onRestart={handleRestart}
      onNavigate={onNavigate}
      gameOver={gameOver}
    >
      <div className="flex flex-col items-center justify-center p-4 bg-gradient-to-br from-sky-900 to-blue-900">
        <div className="mb-4 text-center text-white">
          <p className="text-lg font-semibold">
            Use enemies as moving platforms!
          </p>
          <p className="text-sm">
            Arrow keys/WASD • Space to jump • Land on top only!
          </p>
        </div>
        <canvas
          ref={canvasRef}
          width={800}
          height={600}
          className="border-4 border-sky-500 rounded-lg shadow-lg"
        />
      </div>
    </GameLayout>
  );
}
