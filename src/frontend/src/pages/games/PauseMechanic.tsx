import { useEffect, useRef, useState } from "react";
import type { ModulePage } from "../../App";
import GameLayout from "../../components/GameLayout";

interface PauseMechanicProps {
  onNavigate: (page: ModulePage) => void;
}

export default function PauseMechanic({ onNavigate }: PauseMechanicProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [isPaused, setIsPaused] = useState(false);

  const gameStateRef = useRef({
    player: { x: 400, y: 300 },
    coins: [] as { x: number; y: number; collected: boolean }[],
    hazards: [] as { x: number; y: number; vx: number; vy: number }[],
    pauseEffects: [] as {
      type: "spawn" | "rewind" | "teleport";
      timer: number;
    }[],
    keys: {} as Record<string, boolean>,
    history: [] as { x: number; y: number }[],
  });

  const initGame = () => {
    const state = gameStateRef.current;
    state.player = { x: 400, y: 300 };
    state.coins = [];
    state.hazards = [];
    state.pauseEffects = [];
    state.history = [];

    // Spawn coins
    for (let i = 0; i < 10; i++) {
      state.coins.push({
        x: 100 + Math.random() * 600,
        y: 100 + Math.random() * 400,
        collected: false,
      });
    }

    // Spawn hazards
    for (let i = 0; i < 5; i++) {
      state.hazards.push({
        x: Math.random() * 800,
        y: Math.random() * 600,
        vx: (Math.random() - 0.5) * 4,
        vy: (Math.random() - 0.5) * 4,
      });
    }

    setScore(0);
    setGameOver(false);
    setIsPaused(false);
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
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      const state = gameStateRef.current;
      state.keys[e.key] = true;

      // Pause with P key
      if (e.key === "p" || e.key === "P") {
        setIsPaused((p) => {
          const newPaused = !p;

          if (newPaused) {
            // Trigger random pause effect
            const effects: (typeof state.pauseEffects)[0]["type"][] = [
              "spawn",
              "rewind",
              "teleport",
            ];
            const effect = effects[Math.floor(Math.random() * effects.length)];
            state.pauseEffects.push({ type: effect, timer: 0 });
          }

          return newPaused;
        });
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

      if (!gameOver && !isPaused) {
        // Player movement
        const speed = 4;
        if (state.keys.ArrowLeft || state.keys.a) state.player.x -= speed;
        if (state.keys.ArrowRight || state.keys.d) state.player.x += speed;
        if (state.keys.ArrowUp || state.keys.w) state.player.y -= speed;
        if (state.keys.ArrowDown || state.keys.s) state.player.y += speed;

        state.player.x = Math.max(20, Math.min(780, state.player.x));
        state.player.y = Math.max(20, Math.min(580, state.player.y));

        // Record history
        state.history.push({ x: state.player.x, y: state.player.y });
        if (state.history.length > 60) state.history.shift();

        // Update hazards
        for (const hazard of state.hazards) {
          hazard.x += hazard.vx;
          hazard.y += hazard.vy;

          if (hazard.x < 20 || hazard.x > 780) hazard.vx *= -1;
          if (hazard.y < 20 || hazard.y > 580) hazard.vy *= -1;
        }

        // Check coin collection
        for (const coin of state.coins) {
          if (!coin.collected) {
            const dx = coin.x - state.player.x;
            const dy = coin.y - state.player.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < 30) {
              coin.collected = true;
              setScore((s) => s + 10);
            }
          }
        }

        // Check hazard collision
        for (const hazard of state.hazards) {
          const dx = hazard.x - state.player.x;
          const dy = hazard.y - state.player.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 35) {
            setGameOver(true);
            if (score > highScore) setHighScore(score);
          }
        }
      }

      // Process pause effects
      state.pauseEffects = state.pauseEffects.filter((effect) => {
        effect.timer += 16;

        if (effect.timer > 1000) {
          // Apply effect
          if (effect.type === "spawn") {
            state.hazards.push({
              x: Math.random() * 800,
              y: Math.random() * 600,
              vx: (Math.random() - 0.5) * 4,
              vy: (Math.random() - 0.5) * 4,
            });
          } else if (effect.type === "rewind" && state.history.length > 30) {
            const oldPos = state.history[state.history.length - 30];
            state.player.x = oldPos.x;
            state.player.y = oldPos.y;
          } else if (effect.type === "teleport") {
            state.player.x = 100 + Math.random() * 600;
            state.player.y = 100 + Math.random() * 400;
          }
          return false;
        }
        return true;
      });

      // Render
      ctx.fillStyle = isPaused ? "#1a1a2e" : "#16213e";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Grid
      ctx.strokeStyle = "#0f3460";
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

      // Hazards
      for (const hazard of state.hazards) {
        ctx.fillStyle = "#e53e3e";
        ctx.beginPath();
        ctx.arc(hazard.x, hazard.y, 20, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = "#fff";
        ctx.font = "24px Arial";
        ctx.textAlign = "center";
        ctx.fillText("💥", hazard.x, hazard.y + 8);
      }

      // Player
      ctx.fillStyle = "#48bb78";
      ctx.beginPath();
      ctx.arc(state.player.x, state.player.y, 18, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 3;
      ctx.stroke();

      // Pause overlay
      if (isPaused) {
        ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
        ctx.fillRect(0, 0, 800, 600);

        ctx.fillStyle = "#fff";
        ctx.font = "bold 48px Arial";
        ctx.textAlign = "center";
        ctx.fillText("⏸️ PAUSED", 400, 280);

        ctx.font = "bold 24px Arial";
        ctx.fillText("Something is happening...", 400, 340);

        // Show active effects
        for (let idx = 0; idx < state.pauseEffects.length; idx++) {
          const effect = state.pauseEffects[idx];
          ctx.fillStyle = "#fbbf24";
          ctx.font = "bold 20px Arial";
          const effectText =
            effect.type === "spawn"
              ? "⚠️ Spawning hazard!"
              : effect.type === "rewind"
                ? "⏪ Rewinding time!"
                : "🌀 Teleporting!";
          ctx.fillText(effectText, 400, 380 + idx * 30);
        }
      }

      // UI
      ctx.fillStyle = "rgba(0, 0, 0, 0.7)";
      ctx.fillRect(10, 10, 250, 80);
      ctx.fillStyle = "#fff";
      ctx.font = "bold 14px Arial";
      ctx.textAlign = "left";
      ctx.fillText("Press P to pause", 20, 35);
      ctx.fillText("Pausing triggers effects!", 20, 60);
      ctx.fillText("Collect stars, avoid hazards", 20, 85);

      animationId = requestAnimationFrame(gameLoop);
    };

    animationId = requestAnimationFrame(gameLoop);

    return () => {
      cancelAnimationFrame(animationId);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
    };
  }, [gameOver, score, highScore, isPaused]);

  return (
    <GameLayout
      title="Pause Is a Mechanic ⏸️"
      score={score}
      highScore={highScore}
      onRestart={handleRestart}
      onNavigate={onNavigate}
      gameOver={gameOver}
    >
      <div className="flex flex-col items-center justify-center p-4 bg-gradient-to-br from-gray-900 to-indigo-900">
        <div className="mb-4 text-center text-white">
          <p className="text-lg font-semibold">Pausing changes the game!</p>
          <p className="text-sm">
            Arrow keys/WASD to move • Press P to pause • Watch what happens!
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
