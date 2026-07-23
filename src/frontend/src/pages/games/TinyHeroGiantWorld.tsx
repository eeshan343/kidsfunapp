import { useCallback, useEffect, useRef, useState } from "react";
import type { ModulePage } from "../../App";
import GameLayout from "../../components/GameLayout";

interface TinyHeroGiantWorldProps {
  onNavigate: (page: ModulePage) => void;
}

export default function TinyHeroGiantWorld({
  onNavigate,
}: TinyHeroGiantWorldProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  const gameStateRef = useRef({
    player: { x: 100, y: 500, size: 5 },
    camera: { x: 0, y: 0 },
    worldObjects: [] as {
      x: number;
      y: number;
      width: number;
      height: number;
      type: string;
    }[],
    coins: [] as { x: number; y: number; collected: boolean }[],
    goal: { x: 3000, y: 200 },
    keys: {} as Record<string, boolean>,
  });

  const initGame = useCallback(() => {
    const state = gameStateRef.current;
    state.player = { x: 100, y: 500, size: 5 };
    state.camera = { x: 0, y: 0 };
    state.goal = { x: 3000, y: 200 };
    state.worldObjects = [];
    state.coins = [];

    // Create giant world objects
    // Giant table
    state.worldObjects.push({
      x: 500,
      y: 400,
      width: 800,
      height: 200,
      type: "table",
    });

    // Giant books
    state.worldObjects.push({
      x: 1500,
      y: 300,
      width: 200,
      height: 300,
      type: "book",
    });
    state.worldObjects.push({
      x: 1750,
      y: 250,
      width: 200,
      height: 350,
      type: "book",
    });

    // Giant cup
    state.worldObjects.push({
      x: 2200,
      y: 350,
      width: 150,
      height: 250,
      type: "cup",
    });

    // Giant pencil (as ramp)
    state.worldObjects.push({
      x: 2500,
      y: 450,
      width: 400,
      height: 50,
      type: "pencil",
    });

    // Ground
    state.worldObjects.push({
      x: 0,
      y: 600,
      width: 4000,
      height: 100,
      type: "ground",
    });

    // Coins scattered around
    for (let i = 0; i < 20; i++) {
      state.coins.push({
        x: 200 + i * 150,
        y: 100 + Math.random() * 400,
        collected: false,
      });
    }

    setScore(0);
    setGameOver(false);
  }, []);

  const handleRestart = () => {
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
    let playerVY = 0;
    let onGround = false;

    const gameLoop = () => {
      const state = gameStateRef.current;

      if (!gameOver) {
        // Player movement
        const speed = 3;
        if (state.keys.ArrowLeft || state.keys.a) state.player.x -= speed;
        if (state.keys.ArrowRight || state.keys.d) state.player.x += speed;

        // Jump
        if (
          (state.keys.ArrowUp || state.keys.w || state.keys[" "]) &&
          onGround
        ) {
          playerVY = -10;
          onGround = false;
        }

        // Gravity
        playerVY += 0.4;
        state.player.y += playerVY;

        // Camera follows player
        state.camera.x = state.player.x - 400;
        state.camera.y = state.player.y - 300;
        state.camera.x = Math.max(0, Math.min(3200, state.camera.x));
        state.camera.y = Math.max(-200, Math.min(200, state.camera.y));

        // Collision with world objects
        onGround = false;
        for (const obj of state.worldObjects) {
          if (
            state.player.x + state.player.size > obj.x &&
            state.player.x - state.player.size < obj.x + obj.width &&
            state.player.y + state.player.size > obj.y &&
            state.player.y + state.player.size < obj.y + obj.height &&
            playerVY > 0
          ) {
            state.player.y = obj.y - state.player.size;
            playerVY = 0;
            onGround = true;
          }
        }

        // Collect coins
        for (const coin of state.coins) {
          if (!coin.collected) {
            const dx = coin.x - state.player.x;
            const dy = coin.y - state.player.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 20) {
              coin.collected = true;
              setScore((s) => s + 10);
            }
          }
        }

        // Check goal
        const dx = state.goal.x - state.player.x;
        const dy = state.goal.y - state.player.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 50) {
          setScore((s) => s + 100);
          setGameOver(true);
          if (score + 100 > highScore) setHighScore(score + 100);
        }
      }

      // Render
      ctx.fillStyle = "#e0f2fe";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.save();
      ctx.translate(-state.camera.x, -state.camera.y);

      // World objects
      for (const obj of state.worldObjects) {
        if (obj.type === "table") {
          ctx.fillStyle = "#92400e";
          ctx.fillRect(obj.x, obj.y, obj.width, obj.height);
          ctx.strokeStyle = "#78350f";
          ctx.lineWidth = 5;
          ctx.strokeRect(obj.x, obj.y, obj.width, obj.height);
        } else if (obj.type === "book") {
          ctx.fillStyle = "#dc2626";
          ctx.fillRect(obj.x, obj.y, obj.width, obj.height);
          ctx.fillStyle = "#fbbf24";
          ctx.fillRect(obj.x + 10, obj.y + 10, obj.width - 20, 30);
          ctx.strokeStyle = "#991b1b";
          ctx.lineWidth = 3;
          ctx.strokeRect(obj.x, obj.y, obj.width, obj.height);
        } else if (obj.type === "cup") {
          ctx.fillStyle = "#3b82f6";
          ctx.fillRect(obj.x, obj.y, obj.width, obj.height);
          ctx.fillStyle = "#60a5fa";
          ctx.fillRect(obj.x + 20, obj.y + 20, obj.width - 40, 50);
          ctx.strokeStyle = "#1e40af";
          ctx.lineWidth = 3;
          ctx.strokeRect(obj.x, obj.y, obj.width, obj.height);
        } else if (obj.type === "pencil") {
          ctx.fillStyle = "#fbbf24";
          ctx.fillRect(obj.x, obj.y, obj.width, obj.height);
          ctx.fillStyle = "#f59e0b";
          ctx.fillRect(obj.x, obj.y, 50, obj.height);
          ctx.strokeStyle = "#d97706";
          ctx.lineWidth = 3;
          ctx.strokeRect(obj.x, obj.y, obj.width, obj.height);
        } else if (obj.type === "ground") {
          ctx.fillStyle = "#a3a3a3";
          ctx.fillRect(obj.x, obj.y, obj.width, obj.height);
        }
      }

      // Coins
      for (const coin of state.coins) {
        if (!coin.collected) {
          ctx.fillStyle = "#FFD700";
          ctx.beginPath();
          ctx.arc(coin.x, coin.y, 10, 0, Math.PI * 2);
          ctx.fill();
          ctx.strokeStyle = "#fff";
          ctx.lineWidth = 2;
          ctx.stroke();
        }
      }

      // Goal
      ctx.fillStyle = "#22c55e";
      ctx.beginPath();
      ctx.arc(state.goal.x, state.goal.y, 40, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#fff";
      ctx.font = "48px Arial";
      ctx.textAlign = "center";
      ctx.fillText("🏁", state.goal.x, state.goal.y + 15);

      // Player (tiny!)
      ctx.fillStyle = "#ef4444";
      ctx.beginPath();
      ctx.arc(
        state.player.x,
        state.player.y,
        state.player.size,
        0,
        Math.PI * 2,
      );
      ctx.fill();
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 1;
      ctx.stroke();

      // Player indicator (so you can see them)
      ctx.strokeStyle = "#fbbf24";
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(
        state.player.x,
        state.player.y,
        state.player.size + 5,
        0,
        Math.PI * 2,
      );
      ctx.stroke();

      ctx.restore();

      // UI
      ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
      ctx.fillRect(10, 10, 280, 80);
      ctx.fillStyle = "#fff";
      ctx.font = "bold 14px Arial";
      ctx.textAlign = "left";
      ctx.fillText("You're tiny in a giant world!", 20, 35);
      ctx.fillText("Explore and reach the goal!", 20, 60);
      ctx.fillText(`Distance: ${Math.floor(state.player.x)}m`, 20, 85);

      // Mini-map
      ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
      ctx.fillRect(600, 10, 190, 80);
      ctx.fillStyle = "#fff";
      ctx.font = "bold 12px Arial";
      ctx.fillText("Mini-map:", 610, 25);

      // Draw mini world
      const scale = 0.05;
      ctx.fillStyle = "#3b82f6";
      ctx.fillRect(610 + state.player.x * scale, 40, 2, 2);
      ctx.fillStyle = "#22c55e";
      ctx.fillRect(610 + state.goal.x * scale, 40, 3, 3);
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 1;
      ctx.strokeRect(610, 35, 170, 50);

      animationId = requestAnimationFrame(gameLoop);
    };

    animationId = requestAnimationFrame(gameLoop);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [gameOver, score, highScore]);

  return (
    <GameLayout
      title="Tiny Hero, Giant World 🔍"
      score={score}
      highScore={highScore}
      onRestart={handleRestart}
      onNavigate={onNavigate}
      gameOver={gameOver}
    >
      <div className="flex flex-col items-center justify-center p-4 bg-gradient-to-br from-sky-100 to-blue-200">
        <div className="mb-4 text-center">
          <p className="text-lg font-semibold">
            Navigate a huge world as a tiny hero!
          </p>
          <p className="text-sm">
            Arrow keys/WASD • Space to jump • Explore giant objects
          </p>
        </div>
        <canvas
          ref={canvasRef}
          width={800}
          height={600}
          className="border-4 border-blue-500 rounded-lg shadow-lg bg-white"
        />
      </div>
    </GameLayout>
  );
}
