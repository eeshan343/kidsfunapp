import { useEffect, useRef, useState } from "react";
import type { ModulePage } from "../../App";
import GameLayout from "../../components/GameLayout";

interface EverythingBreaksProps {
  onNavigate: (page: ModulePage) => void;
}

export default function EverythingBreaks({
  onNavigate,
}: EverythingBreaksProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [level, setLevel] = useState(1);

  const gameStateRef = useRef({
    player: { x: 50, y: 500, vx: 0, vy: 0, onGround: false },
    platforms: [] as {
      x: number;
      y: number;
      width: number;
      used: boolean;
      breaking: boolean;
      breakTimer: number;
    }[],
    goal: { x: 750, y: 50 },
    keys: {} as Record<string, boolean>,
  });

  const initGame = () => {
    const state = gameStateRef.current;
    state.player = { x: 50, y: 500, vx: 0, vy: 0, onGround: false };
    state.goal = { x: 750, y: 50 };
    state.platforms = [];

    // Create platforms
    state.platforms.push({
      x: 0,
      y: 550,
      width: 150,
      used: false,
      breaking: false,
      breakTimer: 0,
    });

    for (let i = 0; i < 8 + level; i++) {
      state.platforms.push({
        x: 100 + i * 100,
        y: 500 - i * 50 - Math.random() * 50,
        width: 80 + Math.random() * 40,
        used: false,
        breaking: false,
        breakTimer: 0,
      });
    }

    state.platforms.push({
      x: 700,
      y: 100,
      width: 100,
      used: false,
      breaking: false,
      breakTimer: 0,
    });

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

    const gameLoop = () => {
      const state = gameStateRef.current;

      if (!gameOver) {
        // Player movement
        const speed = 4;
        if (state.keys.ArrowLeft || state.keys.a) state.player.vx = -speed;
        else if (state.keys.ArrowRight || state.keys.d) state.player.vx = speed;
        else state.player.vx = 0;

        // Jump
        if (
          (state.keys.ArrowUp || state.keys.w || state.keys[" "]) &&
          state.player.onGround
        ) {
          state.player.vy = -12;
          state.player.onGround = false;
        }

        // Gravity
        state.player.vy += 0.5;
        state.player.x += state.player.vx;
        state.player.y += state.player.vy;

        // Platform collision
        state.player.onGround = false;
        for (const platform of state.platforms) {
          if (!platform.breaking) {
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

              // Mark platform as used and start breaking
              if (!platform.used) {
                platform.used = true;
                platform.breaking = true;
                platform.breakTimer = 0;
              }
            }
          }
        }

        // Update breaking platforms
        for (const platform of state.platforms) {
          if (platform.breaking) {
            platform.breakTimer += 16;
            if (platform.breakTimer > 500) {
              platform.breaking = false;
              platform.width = 0; // Platform disappears
            }
          }
        }

        // Check goal
        const dx = state.goal.x - state.player.x;
        const dy = state.goal.y - state.player.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 40) {
          setScore((s) => s + level * 10);
          setLevel((l) => l + 1);
        }

        // Fall off screen
        if (state.player.y > 650) {
          setGameOver(true);
          if (score > highScore) setHighScore(score);
        }
      }

      // Render
      ctx.fillStyle = "#1e1b4b";
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
        if (platform.width > 0) {
          if (platform.breaking) {
            const alpha = 1 - platform.breakTimer / 500;
            ctx.fillStyle = platform.used
              ? `rgba(239, 68, 68, ${alpha})`
              : "#8b5cf6";

            // Cracking effect
            ctx.save();
            ctx.translate(platform.x + platform.width / 2, platform.y + 10);
            ctx.rotate((platform.breakTimer / 500) * 0.2);
            ctx.fillRect(-platform.width / 2, -10, platform.width, 20);
            ctx.restore();
          } else {
            ctx.fillStyle = platform.used ? "#ef4444" : "#8b5cf6";
            ctx.fillRect(platform.x, platform.y, platform.width, 20);
          }

          ctx.strokeStyle = "#fff";
          ctx.lineWidth = 2;
          ctx.strokeRect(platform.x, platform.y, platform.width, 20);

          // Warning if used
          if (platform.used && platform.breaking) {
            ctx.fillStyle = "#fff";
            ctx.font = "bold 12px Arial";
            ctx.textAlign = "center";
            ctx.fillText("⚠️", platform.x + platform.width / 2, platform.y - 5);
          }
        }
      }

      // Player
      ctx.fillStyle = "#fbbf24";
      ctx.beginPath();
      ctx.arc(state.player.x, state.player.y, 15, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 3;
      ctx.stroke();

      // UI
      ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
      ctx.fillRect(10, 10, 250, 80);
      ctx.fillStyle = "#fff";
      ctx.font = "bold 14px Arial";
      ctx.textAlign = "left";
      ctx.fillText("Everything breaks after one use!", 20, 35);
      ctx.fillText("Arrow keys/WASD + Space to jump", 20, 60);
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
      title="Everything Breaks After One Use 💥"
      score={score}
      highScore={highScore}
      onRestart={handleRestart}
      onNavigate={onNavigate}
      gameOver={gameOver}
    >
      <div className="flex flex-col items-center justify-center p-4 bg-gradient-to-br from-indigo-900 to-purple-900">
        <div className="mb-4 text-center text-white">
          <p className="text-lg font-semibold">Plan your path carefully!</p>
          <p className="text-sm">
            Platforms crumble after one use • Reach the goal
          </p>
        </div>
        <canvas
          ref={canvasRef}
          width={800}
          height={600}
          className="border-4 border-purple-500 rounded-lg shadow-lg"
        />
      </div>
    </GameLayout>
  );
}
