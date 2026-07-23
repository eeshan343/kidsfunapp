import { useEffect, useRef, useState } from "react";
import type { ModulePage } from "../../App";
import GameLayout from "../../components/GameLayout";

interface MonsterMazeProps {
  onNavigate: (page: ModulePage) => void;
}

interface Position {
  x: number;
  y: number;
}

interface Monster {
  x: number;
  y: number;
  direction: number;
}

export default function MonsterMaze({ onNavigate }: MonsterMazeProps) {
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [gameWon, setGameWon] = useState(false);
  const [player, setPlayer] = useState<Position>({ x: 1, y: 1 });
  const [monsters, setMonsters] = useState<Monster[]>([
    { x: 5, y: 5, direction: 0 },
    { x: 10, y: 3, direction: 1 },
    { x: 7, y: 8, direction: 2 },
  ]);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const CELL_SIZE = 40;
  const MAZE_WIDTH = 15;
  const MAZE_HEIGHT = 12;

  // Simple maze layout (0 = path, 1 = wall)
  const maze = [
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
    [1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1],
    [1, 0, 1, 0, 1, 0, 1, 1, 1, 0, 1, 0, 1, 0, 1],
    [1, 0, 1, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1, 0, 1],
    [1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 1, 0, 1, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1, 0, 0, 0, 1],
    [1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 1, 1, 0, 1],
    [1, 0, 0, 0, 1, 0, 0, 0, 0, 0, 0, 0, 1, 0, 1],
    [1, 0, 1, 1, 1, 0, 1, 1, 1, 1, 1, 0, 1, 0, 1],
    [1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1],
    [1, 0, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 2, 1],
    [1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1, 1],
  ];

  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (gameOver || gameWon) return;

      let newX = player.x;
      let newY = player.y;

      switch (e.key) {
        case "ArrowUp":
        case "w":
          newY = Math.max(0, player.y - 1);
          break;
        case "ArrowDown":
        case "s":
          newY = Math.min(MAZE_HEIGHT - 1, player.y + 1);
          break;
        case "ArrowLeft":
        case "a":
          newX = Math.max(0, player.x - 1);
          break;
        case "ArrowRight":
        case "d":
          newX = Math.min(MAZE_WIDTH - 1, player.x + 1);
          break;
      }

      // Check if new position is valid (not a wall)
      if (maze[newY][newX] !== 1) {
        setPlayer({ x: newX, y: newY });
        setScore((prev) => prev + 1);

        // Check if reached exit
        if (maze[newY][newX] === 2) {
          setGameWon(true);
          setScore((prev) => {
            const newScore = prev + 500;
            setHighScore((h) => Math.max(h, newScore));
            return newScore;
          });
        }
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [player, gameOver, gameWon]);

  // Move monsters
  useEffect(() => {
    if (gameOver || gameWon) return;

    const interval = setInterval(() => {
      setMonsters((prev) =>
        prev.map((monster) => {
          const directions = [
            { x: 0, y: -1 },
            { x: 1, y: 0 },
            { x: 0, y: 1 },
            { x: -1, y: 0 },
          ];

          let newX = monster.x;
          let newY = monster.y;
          let newDirection = monster.direction;

          // Try to move in current direction
          const dir = directions[monster.direction];
          newX = monster.x + dir.x;
          newY = monster.y + dir.y;

          // If hit wall, change direction
          if (
            newX < 0 ||
            newX >= MAZE_WIDTH ||
            newY < 0 ||
            newY >= MAZE_HEIGHT ||
            maze[newY][newX] === 1
          ) {
            newDirection = Math.floor(Math.random() * 4);
            newX = monster.x;
            newY = monster.y;
          }

          return { x: newX, y: newY, direction: newDirection };
        }),
      );
    }, 500);

    return () => clearInterval(interval);
  }, [gameOver, gameWon]);

  // Check collision with monsters
  useEffect(() => {
    const collision = monsters.some(
      (m) => m.x === player.x && m.y === player.y,
    );
    if (collision && !gameOver && !gameWon) {
      setGameOver(true);
    }
  }, [player, monsters, gameOver, gameWon]);

  // Draw game
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas
    ctx.fillStyle = "#1a0033";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Draw maze
    for (let y = 0; y < MAZE_HEIGHT; y++) {
      for (let x = 0; x < MAZE_WIDTH; x++) {
        if (maze[y][x] === 1) {
          ctx.fillStyle = "#4a148c";
          ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
          ctx.strokeStyle = "#7b1fa2";
          ctx.strokeRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
        } else if (maze[y][x] === 2) {
          ctx.fillStyle = "#00ff00";
          ctx.fillRect(x * CELL_SIZE, y * CELL_SIZE, CELL_SIZE, CELL_SIZE);
          ctx.font = "30px Arial";
          ctx.fillText("🚪", x * CELL_SIZE + 5, y * CELL_SIZE + 32);
        }
      }
    }

    // Draw player
    ctx.font = "35px Arial";
    ctx.fillText("😊", player.x * CELL_SIZE + 2, player.y * CELL_SIZE + 32);

    // Draw monsters
    for (const monster of monsters) {
      ctx.fillText("👹", monster.x * CELL_SIZE + 2, monster.y * CELL_SIZE + 32);
    }
  }, [player, monsters]);

  const handleRestart = () => {
    setScore(0);
    setGameOver(false);
    setGameWon(false);
    setPlayer({ x: 1, y: 1 });
    setMonsters([
      { x: 5, y: 5, direction: 0 },
      { x: 10, y: 3, direction: 1 },
      { x: 7, y: 8, direction: 2 },
    ]);
  };

  return (
    <GameLayout
      title="Monster Maze 👹"
      score={score}
      highScore={highScore}
      onNavigate={onNavigate}
      onRestart={handleRestart}
      gameOver={gameOver || gameWon}
    >
      <div className="flex flex-col items-center gap-4 p-6">
        <div className="text-center space-y-2">
          <p className="text-lg text-neon-cyan">
            Use Arrow Keys or WASD to move
          </p>
          <p className="text-md text-neon-green">
            Reach the green door 🚪 without touching monsters!
          </p>
        </div>

        <canvas
          ref={canvasRef}
          width={MAZE_WIDTH * CELL_SIZE}
          height={MAZE_HEIGHT * CELL_SIZE}
          className="border-4 border-neon-purple rounded-lg shadow-neon-lg bg-black"
        />
      </div>
    </GameLayout>
  );
}
