import { useEffect, useRef, useState } from "react";
import type { ModulePage } from "../../App";
import GameLayout from "../../components/GameLayout";

interface LiesAndTruthsProps {
  onNavigate: (page: ModulePage) => void;
}

export default function LiesAndTruths({ onNavigate }: LiesAndTruthsProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [level, setLevel] = useState(1);

  const gameStateRef = useRef({
    player: { x: 100, y: 500 },
    platforms: [] as {
      x: number;
      y: number;
      width: number;
      safe: boolean;
      revealed: boolean;
    }[],
    goal: { x: 700, y: 100 },
    currentHint: "",
    hintIsTrue: false,
    hintTimer: 0,
    keys: {} as Record<string, boolean>,
  });

  const hints = {
    true: [
      "The green platforms are safe!",
      "Jump to reach higher platforms!",
      "The goal is at the top right!",
      "Red platforms will hurt you!",
      "Move carefully and observe!",
    ],
    false: [
      "All platforms are safe!",
      "Red platforms give you points!",
      "You can fly if you press space twice!",
      "The goal is at the bottom left!",
      "Standing still heals you!",
    ],
  };

  const initGame = () => {
    const state = gameStateRef.current;
    state.player = { x: 100, y: 500 };
    state.goal = { x: 700, y: 100 };
    state.platforms = [];
    state.hintTimer = 0;

    // Create platforms (some safe, some not)
    state.platforms.push({
      x: 0,
      y: 550,
      width: 200,
      safe: true,
      revealed: false,
    });

    for (let i = 0; i < 8; i++) {
      const safe = Math.random() > 0.4;
      state.platforms.push({
        x: 100 + i * 100,
        y: 500 - i * 60,
        width: 80,
        safe: safe,
        revealed: false,
      });
    }

    state.platforms.push({
      x: 650,
      y: 150,
      width: 150,
      safe: true,
      revealed: false,
    });

    // Generate hint
    const isTrue = Math.random() > 0.5;
    const hintList = isTrue ? hints.true : hints.false;
    state.currentHint = hintList[Math.floor(Math.random() * hintList.length)];
    state.hintIsTrue = isTrue;

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
    let playerVY = 0;
    let onGround = false;

    const gameLoop = () => {
      const state = gameStateRef.current;

      if (!gameOver) {
        // Player movement
        const speed = 4;
        if (state.keys.ArrowLeft || state.keys.a) state.player.x -= speed;
        if (state.keys.ArrowRight || state.keys.d) state.player.x += speed;

        // Jump
        if (
          (state.keys.ArrowUp || state.keys.w || state.keys[" "]) &&
          onGround
        ) {
          playerVY = -12;
          onGround = false;
        }

        // Gravity
        playerVY += 0.5;
        state.player.y += playerVY;

        state.player.x = Math.max(20, Math.min(780, state.player.x));

        // Platform collision
        onGround = false;
        for (const platform of state.platforms) {
          if (
            state.player.x + 15 > platform.x &&
            state.player.x - 15 < platform.x + platform.width &&
            state.player.y + 15 > platform.y &&
            state.player.y + 15 < platform.y + 20 &&
            playerVY > 0
          ) {
            state.player.y = platform.y - 15;
            playerVY = 0;
            onGround = true;
            platform.revealed = true;

            // Check if platform is unsafe
            if (!platform.safe) {
              setGameOver(true);
              if (score > highScore) setHighScore(score);
            }
          }
        }

        // Hint timer
        state.hintTimer += 16;
        if (state.hintTimer > 5000) {
          state.hintTimer = 0;
          const isTrue = Math.random() > 0.5;
          const hintList = isTrue ? hints.true : hints.false;
          state.currentHint =
            hintList[Math.floor(Math.random() * hintList.length)];
          state.hintIsTrue = isTrue;
        }

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
        if (platform.revealed) {
          ctx.fillStyle = platform.safe ? "#22c55e" : "#ef4444";
        } else {
          ctx.fillStyle = "#6366f1";
        }
        ctx.fillRect(platform.x, platform.y, platform.width, 20);
        ctx.strokeStyle = "#fff";
        ctx.lineWidth = 2;
        ctx.strokeRect(platform.x, platform.y, platform.width, 20);

        if (platform.revealed) {
          ctx.fillStyle = "#fff";
          ctx.font = "bold 16px Arial";
          ctx.textAlign = "center";
          ctx.fillText(
            platform.safe ? "✓" : "✗",
            platform.x + platform.width / 2,
            platform.y - 5,
          );
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

      // AI Narrator hint
      ctx.fillStyle = "rgba(0, 0, 0, 0.9)";
      ctx.fillRect(50, 50, 700, 80);
      ctx.strokeStyle = state.hintIsTrue ? "#22c55e" : "#ef4444";
      ctx.lineWidth = 4;
      ctx.strokeRect(50, 50, 700, 80);

      ctx.fillStyle = "#fff";
      ctx.font = "bold 20px Arial";
      ctx.textAlign = "center";
      ctx.fillText("🤖 AI Narrator:", 400, 75);
      ctx.font = "18px Arial";
      ctx.fillText(state.currentHint, 400, 105);

      // UI
      ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
      ctx.fillRect(10, 150, 280, 80);
      ctx.fillStyle = "#fff";
      ctx.font = "bold 14px Arial";
      ctx.textAlign = "left";
      ctx.fillText("Some hints are lies!", 20, 175);
      ctx.fillText("Test platforms to learn the truth", 20, 200);
      ctx.fillText(`Level: ${level}`, 20, 225);

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
      title="Lies and Truths 🤖"
      score={score}
      highScore={highScore}
      onRestart={handleRestart}
      onNavigate={onNavigate}
      gameOver={gameOver}
    >
      <div className="flex flex-col items-center justify-center p-4 bg-gradient-to-br from-indigo-900 to-purple-900">
        <div className="mb-4 text-center text-white">
          <p className="text-lg font-semibold">Trust the AI... or don't!</p>
          <p className="text-sm">
            Arrow keys/WASD • Space to jump • Discover which hints are true
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
