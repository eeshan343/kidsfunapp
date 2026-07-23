import { useEffect, useRef, useState } from "react";
import type { ModulePage } from "../../App";
import GameLayout from "../../components/GameLayout";

interface ScreenIsEnemyProps {
  onNavigate: (page: ModulePage) => void;
}

export default function ScreenIsEnemy({ onNavigate }: ScreenIsEnemyProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  const gameStateRef = useRef({
    player: { x: 400, y: 300, size: 20, health: 100 },
    coins: [] as { x: number; y: number; collected: boolean }[],
    screenEffect: "normal" as
      | "normal"
      | "shake"
      | "shrink"
      | "split"
      | "rotate",
    effectTimer: 0,
    effectDuration: 0,
    shakeOffset: { x: 0, y: 0 },
    scale: 1,
    rotation: 0,
    keys: {} as Record<string, boolean>,
  });

  const initGame = () => {
    const state = gameStateRef.current;
    state.player = { x: 400, y: 300, size: 20, health: 100 };
    state.coins = [];
    state.screenEffect = "normal";
    state.effectTimer = 0;
    state.effectDuration = 0;
    state.shakeOffset = { x: 0, y: 0 };
    state.scale = 1;
    state.rotation = 0;

    // Spawn initial coins
    for (let i = 0; i < 10; i++) {
      state.coins.push({
        x: 50 + Math.random() * 700,
        y: 50 + Math.random() * 500,
        collected: false,
      });
    }

    setScore(0);
    setGameOver(false);
  };

  const handleRestart = () => {
    initGame();
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: initGame is stable
  useEffect(() => {
    initGame();
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

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
    let lastTime = 0;

    const gameLoop = (timestamp: number) => {
      const deltaTime = timestamp - lastTime;
      lastTime = timestamp;

      const state = gameStateRef.current;

      if (!gameOver) {
        // Move player
        const speed = 4;
        if (state.keys.ArrowLeft || state.keys.a) state.player.x -= speed;
        if (state.keys.ArrowRight || state.keys.d) state.player.x += speed;
        if (state.keys.ArrowUp || state.keys.w) state.player.y -= speed;
        if (state.keys.ArrowDown || state.keys.s) state.player.y += speed;

        state.player.x = Math.max(20, Math.min(780, state.player.x));
        state.player.y = Math.max(20, Math.min(580, state.player.y));

        // Check coin collection
        for (const coin of state.coins) {
          if (!coin.collected) {
            const dx = coin.x - state.player.x;
            const dy = coin.y - state.player.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 30) {
              coin.collected = true;
              setScore((s) => s + 10);

              // Spawn new coin
              state.coins.push({
                x: 50 + Math.random() * 700,
                y: 50 + Math.random() * 500,
                collected: false,
              });
            }
          }
        }

        // Screen effect timer
        state.effectTimer += deltaTime;
        if (state.effectTimer > state.effectDuration) {
          state.effectTimer = 0;
          state.effectDuration = 2000 + Math.random() * 3000;

          // Random screen effect
          const effects: (typeof state.screenEffect)[] = [
            "shake",
            "shrink",
            "split",
            "rotate",
          ];
          state.screenEffect =
            effects[Math.floor(Math.random() * effects.length)];

          // Damage player
          state.player.health -= 5;
          if (state.player.health <= 0) {
            setGameOver(true);
            if (score > highScore) setHighScore(score);
          }
        }

        // Apply screen effects
        if (state.screenEffect === "shake") {
          state.shakeOffset.x = (Math.random() - 0.5) * 20;
          state.shakeOffset.y = (Math.random() - 0.5) * 20;
        } else if (state.screenEffect === "shrink") {
          state.scale = 0.7 + Math.sin(timestamp / 200) * 0.1;
        } else if (state.screenEffect === "rotate") {
          state.rotation = Math.sin(timestamp / 500) * 0.2;
        } else {
          state.shakeOffset = { x: 0, y: 0 };
          state.scale = 1;
          state.rotation = 0;
        }
      }

      // Render
      ctx.save();

      // Apply transformations
      ctx.translate(400 + state.shakeOffset.x, 300 + state.shakeOffset.y);
      ctx.scale(state.scale, state.scale);
      ctx.rotate(state.rotation);
      ctx.translate(-400, -300);

      // Background
      ctx.fillStyle = "#1a1a2e";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Grid
      ctx.strokeStyle = "#16213e";
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

      // Coins
      for (const coin of state.coins) {
        if (!coin.collected) {
          ctx.fillStyle = "#FFD700";
          ctx.beginPath();
          ctx.arc(coin.x, coin.y, 15, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = "#fff";
          ctx.font = "20px Arial";
          ctx.textAlign = "center";
          ctx.fillText("⭐", coin.x, coin.y + 7);
        }
      }

      // Player
      ctx.fillStyle = "#00ff88";
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
      ctx.lineWidth = 3;
      ctx.stroke();

      ctx.restore();

      // UI overlay (not affected by screen effects)
      ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
      ctx.fillRect(10, 10, 200, 80);
      ctx.fillStyle = "#fff";
      ctx.font = "bold 16px Arial";
      ctx.textAlign = "left";
      ctx.fillText(`Health: ${state.player.health}`, 20, 35);
      ctx.fillText(`Effect: ${state.screenEffect}`, 20, 60);

      // Health bar
      ctx.fillStyle = "#ff4444";
      ctx.fillRect(20, 70, 180, 10);
      ctx.fillStyle = "#00ff88";
      ctx.fillRect(20, 70, (state.player.health / 100) * 180, 10);

      // Warning when effect is about to trigger
      if (state.effectDuration - state.effectTimer < 1000) {
        ctx.fillStyle = "rgba(255, 0, 0, 0.3)";
        ctx.fillRect(0, 0, 800, 600);
        ctx.fillStyle = "#ff0000";
        ctx.font = "bold 24px Arial";
        ctx.textAlign = "center";
        ctx.fillText("⚠️ SCREEN ATTACK INCOMING! ⚠️", 400, 30);
      }

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
      title="The Screen Is Your Enemy 📺"
      score={score}
      highScore={highScore}
      onRestart={handleRestart}
      onNavigate={onNavigate}
      gameOver={gameOver}
    >
      <div
        ref={containerRef}
        className="flex flex-col items-center justify-center p-4 bg-gradient-to-br from-gray-900 to-purple-900"
      >
        <div className="mb-4 text-center text-white">
          <p className="text-lg font-semibold">Survive the screen attacks!</p>
          <p className="text-sm">
            Arrow keys or WASD to move • Collect stars • Avoid screen effects
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
