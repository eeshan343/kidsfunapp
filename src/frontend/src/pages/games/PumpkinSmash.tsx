import { useEffect, useRef, useState } from "react";
import type { ModulePage } from "../../App";
import GameLayout from "../../components/GameLayout";

interface PumpkinSmashProps {
  onNavigate: (page: ModulePage) => void;
}

interface Pumpkin {
  id: number;
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
}

export default function PumpkinSmash({ onNavigate }: PumpkinSmashProps) {
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [timeLeft, setTimeLeft] = useState(30);
  const [pumpkins, setPumpkins] = useState<Pumpkin[]>([]);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number | undefined>(undefined);

  useEffect(() => {
    // Spawn initial pumpkins
    const initial: Pumpkin[] = [];
    for (let i = 0; i < 5; i++) {
      initial.push({
        id: i,
        x: Math.random() * 550,
        y: Math.random() * 350,
        vx: (Math.random() - 0.5) * 4,
        vy: (Math.random() - 0.5) * 4,
        size: 40,
      });
    }
    setPumpkins(initial);
  }, []);

  // Timer
  useEffect(() => {
    if (gameOver || timeLeft <= 0) return;

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setGameOver(true);
          setHighScore((h) => Math.max(h, score));
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [gameOver, timeLeft, score]);

  // Animation loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || gameOver) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const animate = () => {
      // Clear canvas
      ctx.fillStyle = "#1a0033";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Update and draw pumpkins
      setPumpkins((prev) => {
        const updated = prev.map((p) => {
          let newX = p.x + p.vx;
          let newY = p.y + p.vy;
          let newVx = p.vx;
          let newVy = p.vy;

          // Bounce off walls
          if (newX < 0 || newX > canvas.width - p.size) {
            newVx = -newVx;
            newX = Math.max(0, Math.min(canvas.width - p.size, newX));
          }
          if (newY < 0 || newY > canvas.height - p.size) {
            newVy = -newVy;
            newY = Math.max(0, Math.min(canvas.height - p.size, newY));
          }

          return { ...p, x: newX, y: newY, vx: newVx, vy: newVy };
        });

        // Draw pumpkins
        for (const p of updated) {
          ctx.font = `${p.size}px Arial`;
          ctx.fillText("🎃", p.x, p.y + p.size);
        }

        return updated;
      });

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      if (animationRef.current !== undefined) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [gameOver]);

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (gameOver) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    // Check if clicked on a pumpkin
    const clickedIndex = pumpkins.findIndex(
      (p) => x >= p.x && x <= p.x + p.size && y >= p.y && y <= p.y + p.size,
    );

    if (clickedIndex !== -1) {
      setPumpkins((prev) => prev.filter((_, i) => i !== clickedIndex));
      setScore((prev) => prev + 10);

      // Spawn new pumpkin
      setTimeout(() => {
        setPumpkins((prev) => [
          ...prev,
          {
            id: Date.now(),
            x: Math.random() * 550,
            y: Math.random() * 350,
            vx: (Math.random() - 0.5) * 5,
            vy: (Math.random() - 0.5) * 5,
            size: 40,
          },
        ]);
      }, 500);
    }
  };

  const handleRestart = () => {
    setScore(0);
    setGameOver(false);
    setTimeLeft(30);
    const initial: Pumpkin[] = [];
    for (let i = 0; i < 5; i++) {
      initial.push({
        id: i,
        x: Math.random() * 550,
        y: Math.random() * 350,
        vx: (Math.random() - 0.5) * 4,
        vy: (Math.random() - 0.5) * 4,
        size: 40,
      });
    }
    setPumpkins(initial);
  };

  return (
    <GameLayout
      title="Pumpkin Smash 🎃"
      score={score}
      highScore={highScore}
      onNavigate={onNavigate}
      onRestart={handleRestart}
      gameOver={gameOver}
    >
      <div className="flex flex-col items-center gap-4 p-6">
        <div className="text-center space-y-2">
          <p className="text-2xl text-neon-orange">Time: {timeLeft}s</p>
          <p className="text-lg text-neon-cyan">Click the bouncing pumpkins!</p>
        </div>

        {/* biome-ignore lint/a11y/useKeyWithClickEvents: game canvas interaction */}
        <canvas
          ref={canvasRef}
          width={600}
          height={400}
          onClick={handleCanvasClick}
          className="border-4 border-neon-orange rounded-lg shadow-neon-lg bg-black cursor-pointer"
        />
      </div>
    </GameLayout>
  );
}
