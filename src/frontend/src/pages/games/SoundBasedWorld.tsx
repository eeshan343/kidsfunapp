import { useEffect, useRef, useState } from "react";
import type { ModulePage } from "../../App";
import GameLayout from "../../components/GameLayout";

interface SoundBasedWorldProps {
  onNavigate: (page: ModulePage) => void;
}

export default function SoundBasedWorld({ onNavigate }: SoundBasedWorldProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);

  const gameStateRef = useRef({
    player: { x: 400, y: 300 },
    goal: { x: 700, y: 100 },
    obstacles: [] as { x: number; y: number; width: number; height: number }[],
    soundWaves: [] as {
      x: number;
      y: number;
      radius: number;
      maxRadius: number;
    }[],
    keys: {} as Record<string, boolean>,
    stepTimer: 0,
  });

  const initGame = () => {
    const state = gameStateRef.current;
    state.player = { x: 100, y: 500 };
    state.goal = { x: 700, y: 100 };
    state.obstacles = [];
    state.soundWaves = [];
    state.stepTimer = 0;

    // Create obstacles
    for (let i = 0; i < 8; i++) {
      state.obstacles.push({
        x: 150 + Math.random() * 500,
        y: 100 + Math.random() * 400,
        width: 50 + Math.random() * 100,
        height: 50 + Math.random() * 100,
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
        const speed = 3;
        let moved = false;

        const oldX = state.player.x;
        const oldY = state.player.y;

        if (state.keys.ArrowLeft || state.keys.a) {
          state.player.x -= speed;
          moved = true;
        }
        if (state.keys.ArrowRight || state.keys.d) {
          state.player.x += speed;
          moved = true;
        }
        if (state.keys.ArrowUp || state.keys.w) {
          state.player.y -= speed;
          moved = true;
        }
        if (state.keys.ArrowDown || state.keys.s) {
          state.player.y += speed;
          moved = true;
        }

        // Collision with obstacles
        let collision = false;
        for (const obs of state.obstacles) {
          if (
            state.player.x + 15 > obs.x &&
            state.player.x - 15 < obs.x + obs.width &&
            state.player.y + 15 > obs.y &&
            state.player.y - 15 < obs.y + obs.height
          ) {
            collision = true;
          }
        }

        if (collision) {
          state.player.x = oldX;
          state.player.y = oldY;
        }

        state.player.x = Math.max(20, Math.min(780, state.player.x));
        state.player.y = Math.max(20, Math.min(580, state.player.y));

        // Create sound waves on movement
        if (moved) {
          state.stepTimer += 16;
          if (state.stepTimer > 200) {
            state.stepTimer = 0;
            state.soundWaves.push({
              x: state.player.x,
              y: state.player.y,
              radius: 0,
              maxRadius: 150,
            });
          }
        }

        // Update sound waves
        state.soundWaves = state.soundWaves.filter((wave) => {
          wave.radius += 3;
          return wave.radius < wave.maxRadius;
        });

        // Check goal
        const dx = state.goal.x - state.player.x;
        const dy = state.goal.y - state.player.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 40) {
          setScore((s) => s + 100);
          setGameOver(true);
          if (score + 100 > highScore) setHighScore(score + 100);
        }
      }

      // Render
      ctx.fillStyle = "#000000";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Sound waves reveal environment
      for (const wave of state.soundWaves) {
        const gradient = ctx.createRadialGradient(
          wave.x,
          wave.y,
          0,
          wave.x,
          wave.y,
          wave.radius,
        );
        gradient.addColorStop(0, "rgba(100, 200, 255, 0.3)");
        gradient.addColorStop(1, "rgba(100, 200, 255, 0)");

        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(wave.x, wave.y, wave.radius, 0, Math.PI * 2);
        ctx.fill();

        // Reveal obstacles
        for (const obs of state.obstacles) {
          const distToObs = Math.sqrt(
            (wave.x - (obs.x + obs.width / 2)) ** 2 +
              (wave.y - (obs.y + obs.height / 2)) ** 2,
          );

          if (distToObs < wave.radius) {
            const alpha = Math.max(0, 1 - (wave.radius - distToObs) / 50);
            ctx.fillStyle = `rgba(139, 92, 246, ${alpha * 0.8})`;
            ctx.fillRect(obs.x, obs.y, obs.width, obs.height);
            ctx.strokeStyle = `rgba(167, 139, 250, ${alpha})`;
            ctx.lineWidth = 2;
            ctx.strokeRect(obs.x, obs.y, obs.width, obs.height);
          }
        }

        // Reveal goal
        const distToGoal = Math.sqrt(
          (wave.x - state.goal.x) ** 2 + (wave.y - state.goal.y) ** 2,
        );

        if (distToGoal < wave.radius) {
          const alpha = Math.max(0, 1 - (wave.radius - distToGoal) / 50);
          ctx.fillStyle = `rgba(34, 197, 94, ${alpha})`;
          ctx.beginPath();
          ctx.arc(state.goal.x, state.goal.y, 30, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = `rgba(255, 255, 255, ${alpha})`;
          ctx.font = "32px Arial";
          ctx.textAlign = "center";
          ctx.fillText("🎯", state.goal.x, state.goal.y + 10);
        }
      }

      // Player (always visible)
      ctx.fillStyle = "#60a5fa";
      ctx.beginPath();
      ctx.arc(state.player.x, state.player.y, 15, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#fff";
      ctx.lineWidth = 3;
      ctx.stroke();

      // Small light around player
      const playerGlow = ctx.createRadialGradient(
        state.player.x,
        state.player.y,
        0,
        state.player.x,
        state.player.y,
        40,
      );
      playerGlow.addColorStop(0, "rgba(96, 165, 250, 0.4)");
      playerGlow.addColorStop(1, "rgba(96, 165, 250, 0)");
      ctx.fillStyle = playerGlow;
      ctx.beginPath();
      ctx.arc(state.player.x, state.player.y, 40, 0, Math.PI * 2);
      ctx.fill();

      // UI
      ctx.fillStyle = "rgba(0, 0, 0, 0.8)";
      ctx.fillRect(10, 10, 280, 80);
      ctx.fillStyle = "#fff";
      ctx.font = "bold 14px Arial";
      ctx.textAlign = "left";
      ctx.fillText("Move to create sound waves!", 20, 35);
      ctx.fillText("Sound reveals the environment", 20, 60);
      ctx.fillText("Find the goal 🎯", 20, 85);

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
      title="Sound-Based World 🔊"
      score={score}
      highScore={highScore}
      onRestart={handleRestart}
      onNavigate={onNavigate}
      gameOver={gameOver}
    >
      <div className="flex flex-col items-center justify-center p-4 bg-gradient-to-br from-black to-gray-900">
        <div className="mb-4 text-center text-white">
          <p className="text-lg font-semibold">Navigate using sound!</p>
          <p className="text-sm">
            Arrow keys/WASD to move • Sound waves reveal the world
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
