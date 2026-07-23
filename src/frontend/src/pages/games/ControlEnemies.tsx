import { useEffect, useRef, useState } from "react";
import type { ModulePage } from "../../App";
import GameLayout from "../../components/GameLayout";

interface ControlEnemiesProps {
  onNavigate: (page: ModulePage) => void;
}

export default function ControlEnemies({ onNavigate }: ControlEnemiesProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [level, setLevel] = useState(1);

  const gameStateRef = useRef({
    player: { x: 50, y: 500 },
    goal: { x: 750, y: 50 },
    enemies: [] as { x: number; y: number; vx: number; vy: number }[],
    selectedEnemy: -1,
    keys: {} as Record<string, boolean>,
  });

  const initGame = () => {
    const state = gameStateRef.current;
    state.player = { x: 50, y: 500 };
    state.goal = { x: 750, y: 50 };
    state.enemies = [];
    state.selectedEnemy = -1;

    // Spawn enemies based on level
    const enemyCount = 3 + Math.floor(level / 2);
    for (let i = 0; i < enemyCount; i++) {
      state.enemies.push({
        x: 200 + Math.random() * 400,
        y: 100 + Math.random() * 400,
        vx: 0,
        vy: 0,
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

      // Select enemy with number keys
      if (e.key >= "1" && e.key <= "9") {
        const idx = Number.parseInt(e.key) - 1;
        if (idx < gameStateRef.current.enemies.length) {
          gameStateRef.current.selectedEnemy = idx;
        }
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

      if (!gameOver) {
        // Move selected enemy
        if (
          state.selectedEnemy >= 0 &&
          state.selectedEnemy < state.enemies.length
        ) {
          const enemy = state.enemies[state.selectedEnemy];
          const speed = 3;

          if (state.keys.ArrowLeft || state.keys.a) enemy.vx = -speed;
          else if (state.keys.ArrowRight || state.keys.d) enemy.vx = speed;
          else enemy.vx = 0;

          if (state.keys.ArrowUp || state.keys.w) enemy.vy = -speed;
          else if (state.keys.ArrowDown || state.keys.s) enemy.vy = speed;
          else enemy.vy = 0;
        }

        // Update enemies
        for (const enemy of state.enemies) {
          enemy.x += enemy.vx;
          enemy.y += enemy.vy;

          enemy.x = Math.max(20, Math.min(780, enemy.x));
          enemy.y = Math.max(20, Math.min(580, enemy.y));
        }

        // Check if player touches enemy (game over)
        for (const enemy of state.enemies) {
          const dx = enemy.x - state.player.x;
          const dy = enemy.y - state.player.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 40) {
            setGameOver(true);
            if (score > highScore) setHighScore(score);
          }
        }

        // Check if player reaches goal
        const dx = state.goal.x - state.player.x;
        const dy = state.goal.y - state.player.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 40) {
          setScore((s) => s + level * 10);
          setLevel((l) => l + 1);
        }

        // Player moves toward goal slowly
        const angle = Math.atan2(dy, dx);
        state.player.x += Math.cos(angle) * 0.5;
        state.player.y += Math.sin(angle) * 0.5;
      }

      // Render
      ctx.fillStyle = "#0f172a";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Grid
      ctx.strokeStyle = "#1e293b";
      ctx.lineWidth = 1;
      for (let i = 0; i < 800; i += 50) {
        ctx.beginPath();
        ctx.moveTo(i, 0);
        ctx.lineTo(i, 600);
        ctx.stroke();
      }
      for (let i = 0; i < 600; i += 50) {
        ctx.beginPath();
        ctx.moveTo(0, i);
        ctx.lineTo(800, i);
        ctx.stroke();
      }

      // Goal
      ctx.fillStyle = "#22c55e";
      ctx.beginPath();
      ctx.arc(state.goal.x, state.goal.y, 30, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.font = "32px Arial";
      ctx.textAlign = "center";
      ctx.fillText("🎯", state.goal.x, state.goal.y + 10);

      // Player (passive)
      ctx.fillStyle = "#3b82f6";
      ctx.beginPath();
      ctx.arc(state.player.x, state.player.y, 20, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.font = "24px Arial";
      ctx.textAlign = "center";
      ctx.fillText("😊", state.player.x, state.player.y + 8);

      // Enemies
      for (let idx = 0; idx < state.enemies.length; idx++) {
        const enemy = state.enemies[idx];
        const isSelected = idx === state.selectedEnemy;

        ctx.fillStyle = isSelected ? "#f59e0b" : "#ef4444";
        ctx.beginPath();
        ctx.arc(enemy.x, enemy.y, 25, 0, Math.PI * 2);
        ctx.fill();

        if (isSelected) {
          ctx.strokeStyle = "#fbbf24";
          ctx.lineWidth = 4;
          ctx.stroke();
        }

        ctx.fillStyle = "#fff";
        ctx.font = "28px Arial";
        ctx.textAlign = "center";
        ctx.fillText("👾", enemy.x, enemy.y + 10);

        // Number label
        ctx.fillStyle = "#fff";
        ctx.font = "bold 16px Arial";
        ctx.fillText((idx + 1).toString(), enemy.x, enemy.y - 30);
      }

      // Instructions
      ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
      ctx.fillRect(10, 10, 300, 100);
      ctx.fillStyle = "#fff";
      ctx.font = "bold 14px Arial";
      ctx.textAlign = "left";
      ctx.fillText("Press 1-9 to select enemy", 20, 35);
      ctx.fillText("Arrow keys/WASD to move enemy", 20, 60);
      ctx.fillText("Guide player to goal!", 20, 85);
      ctx.fillText(`Level: ${level}`, 20, 110);

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
      title="You Control the Enemies 👾"
      score={score}
      highScore={highScore}
      onRestart={handleRestart}
      onNavigate={onNavigate}
      gameOver={gameOver}
    >
      <div className="flex flex-col items-center justify-center p-4 bg-gradient-to-br from-slate-900 to-blue-900">
        <div className="mb-4 text-center text-white">
          <p className="text-lg font-semibold">
            Control enemies to guide your character!
          </p>
          <p className="text-sm">
            Press 1-9 to select • Move with arrows/WASD • Reach the goal
          </p>
        </div>
        <canvas
          ref={canvasRef}
          width={800}
          height={600}
          className="border-4 border-blue-500 rounded-lg shadow-lg"
        />
      </div>
    </GameLayout>
  );
}
