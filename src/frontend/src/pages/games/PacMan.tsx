import { useCallback, useEffect, useRef, useState } from "react";
import type { ModulePage } from "../../App";
import GameLayout from "../../components/GameLayout";

interface Position {
  x: number;
  y: number;
}

interface Ghost {
  id: number;
  position: Position;
  color: string;
  direction: { dx: number; dy: number };
}

interface PacManProps {
  onNavigate: (page: ModulePage) => void;
}

const GRID_SIZE = 20;
const CELL_SIZE = 25;
const INITIAL_LIVES = 3;

export default function PacMan({ onNavigate }: PacManProps) {
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [lives, setLives] = useState(INITIAL_LIVES);
  const [showInstructions, setShowInstructions] = useState(true);

  const pacManRef = useRef<Position>({ x: 1, y: 1 });
  const directionRef = useRef<{ dx: number; dy: number }>({ dx: 1, dy: 0 });
  const nextDirectionRef = useRef<{ dx: number; dy: number }>({ dx: 1, dy: 0 });
  const ghostsRef = useRef<Ghost[]>([
    {
      id: 1,
      position: { x: 18, y: 1 },
      color: "#FF0000",
      direction: { dx: -1, dy: 0 },
    },
    {
      id: 2,
      position: { x: 18, y: 18 },
      color: "#00FFFF",
      direction: { dx: 0, dy: -1 },
    },
  ]);
  const pelletsRef = useRef<Set<string>>(new Set());
  const animationFrameRef = useRef<number | undefined>(undefined);
  const lastMoveTimeRef = useRef(0);
  const [, forceUpdate] = useState({});

  // Initialize maze walls (1 = wall, 0 = path)
  const mazeRef = useRef<number[][]>([]);

  const initializeMaze = useCallback(() => {
    const maze: number[][] = Array(GRID_SIZE)
      .fill(0)
      .map(() => Array(GRID_SIZE).fill(0));

    // Create border walls
    for (let i = 0; i < GRID_SIZE; i++) {
      maze[0][i] = 1;
      maze[GRID_SIZE - 1][i] = 1;
      maze[i][0] = 1;
      maze[i][GRID_SIZE - 1] = 1;
    }

    // Add some internal walls for maze structure
    for (let i = 3; i < GRID_SIZE - 3; i += 4) {
      for (let j = 3; j < GRID_SIZE - 3; j += 4) {
        maze[i][j] = 1;
        maze[i][j + 1] = 1;
        maze[i + 1][j] = 1;
      }
    }

    mazeRef.current = maze;

    // Initialize pellets on all empty spaces
    const pellets = new Set<string>();
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        if (maze[y][x] === 0) {
          pellets.add(`${x},${y}`);
        }
      }
    }
    pelletsRef.current = pellets;
  }, []);

  const startGame = useCallback(() => {
    setScore(0);
    setGameOver(false);
    setLives(INITIAL_LIVES);
    setShowInstructions(true);
    pacManRef.current = { x: 1, y: 1 };
    directionRef.current = { dx: 1, dy: 0 };
    nextDirectionRef.current = { dx: 1, dy: 0 };
    ghostsRef.current = [
      {
        id: 1,
        position: { x: 18, y: 1 },
        color: "#FF0000",
        direction: { dx: -1, dy: 0 },
      },
      {
        id: 2,
        position: { x: 18, y: 18 },
        color: "#00FFFF",
        direction: { dx: 0, dy: -1 },
      },
    ];
    initializeMaze();
    lastMoveTimeRef.current = 0;
    forceUpdate({});
  }, [initializeMaze]);

  useEffect(() => {
    initializeMaze();
  }, [initializeMaze]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameOver) return;
      setShowInstructions(false);

      const key = e.key.toLowerCase();
      if (key === "arrowup" || key === "w") {
        nextDirectionRef.current = { dx: 0, dy: -1 };
        e.preventDefault();
      } else if (key === "arrowdown" || key === "s") {
        nextDirectionRef.current = { dx: 0, dy: 1 };
        e.preventDefault();
      } else if (key === "arrowleft" || key === "a") {
        nextDirectionRef.current = { dx: -1, dy: 0 };
        e.preventDefault();
      } else if (key === "arrowright" || key === "d") {
        nextDirectionRef.current = { dx: 1, dy: 0 };
        e.preventDefault();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [gameOver]);

  const isValidMove = useCallback((x: number, y: number): boolean => {
    if (x < 0 || x >= GRID_SIZE || y < 0 || y >= GRID_SIZE) return false;
    return mazeRef.current[y][x] === 0;
  }, []);

  const checkCollision = useCallback(
    (pos1: Position, pos2: Position): boolean => {
      return pos1.x === pos2.x && pos1.y === pos2.y;
    },
    [],
  );

  // Game loop
  useEffect(() => {
    if (gameOver) {
      if (animationFrameRef.current !== undefined) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      return;
    }

    const animate = (currentTime: number) => {
      // Move every 150ms
      if (currentTime - lastMoveTimeRef.current < 150) {
        animationFrameRef.current = requestAnimationFrame(animate);
        return;
      }
      lastMoveTimeRef.current = currentTime;

      // Try to change direction if valid
      const nextX = pacManRef.current.x + nextDirectionRef.current.dx;
      const nextY = pacManRef.current.y + nextDirectionRef.current.dy;
      if (isValidMove(nextX, nextY)) {
        directionRef.current = nextDirectionRef.current;
      }

      // Move Pac-Man
      const newX = pacManRef.current.x + directionRef.current.dx;
      const newY = pacManRef.current.y + directionRef.current.dy;

      if (isValidMove(newX, newY)) {
        pacManRef.current = { x: newX, y: newY };

        // Eat pellet
        const pelletKey = `${newX},${newY}`;
        if (pelletsRef.current.has(pelletKey)) {
          pelletsRef.current.delete(pelletKey);
          setScore((prev) => prev + 10);
        }

        // Check win condition
        if (pelletsRef.current.size === 0) {
          setGameOver(true);
        }
      }

      // Move ghosts with simple AI
      ghostsRef.current = ghostsRef.current.map((ghost) => {
        const dx = pacManRef.current.x - ghost.position.x;
        const dy = pacManRef.current.y - ghost.position.y;

        // Try to move towards Pac-Man
        let newDir = ghost.direction;
        const possibleDirs = [
          { dx: 1, dy: 0 },
          { dx: -1, dy: 0 },
          { dx: 0, dy: 1 },
          { dx: 0, dy: -1 },
        ];

        // Prioritize direction towards Pac-Man
        const sortedDirs = possibleDirs.sort((a, b) => {
          const distA = Math.abs(dx - a.dx) + Math.abs(dy - a.dy);
          const distB = Math.abs(dx - b.dx) + Math.abs(dy - b.dy);
          return distA - distB;
        });

        for (const dir of sortedDirs) {
          const testX = ghost.position.x + dir.dx;
          const testY = ghost.position.y + dir.dy;
          if (isValidMove(testX, testY)) {
            newDir = dir;
            break;
          }
        }

        const newGhostX = ghost.position.x + newDir.dx;
        const newGhostY = ghost.position.y + newDir.dy;

        return {
          ...ghost,
          position: isValidMove(newGhostX, newGhostY)
            ? { x: newGhostX, y: newGhostY }
            : ghost.position,
          direction: newDir,
        };
      });

      // Check collision with ghosts
      for (const ghost of ghostsRef.current) {
        if (checkCollision(pacManRef.current, ghost.position)) {
          setLives((prev) => {
            const newLives = prev - 1;
            if (newLives <= 0) {
              setGameOver(true);
            } else {
              // Reset positions
              pacManRef.current = { x: 1, y: 1 };
              directionRef.current = { dx: 1, dy: 0 };
              nextDirectionRef.current = { dx: 1, dy: 0 };
            }
            return newLives;
          });
          break;
        }
      }

      forceUpdate({});
      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current !== undefined) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [gameOver, isValidMove, checkCollision]);

  useEffect(() => {
    if (gameOver && score > highScore) {
      setHighScore(score);
    }
  }, [gameOver, score, highScore]);

  return (
    <GameLayout
      title="🟡 Pac-Man"
      score={score}
      highScore={highScore}
      onRestart={startGame}
      onNavigate={onNavigate}
      gameOver={gameOver}
    >
      <div className="relative w-full flex flex-col items-center justify-center p-4 bg-gradient-to-br from-gray-900 to-black">
        {/* Lives Display */}
        <div className="mb-4 flex items-center gap-2 bg-white px-6 py-3 rounded-full border-4 border-yellow-400">
          <span className="text-xl font-bold">Lives:</span>
          {Array.from({ length: lives }).map((_, i) => (
            // biome-ignore lint/suspicious/noArrayIndexKey: positional list
            <span key={i} className="text-2xl">
              🟡
            </span>
          ))}
        </div>

        {/* Game Board */}
        <div
          className="relative bg-black border-4 border-blue-500 shadow-2xl"
          style={{
            width: GRID_SIZE * CELL_SIZE,
            height: GRID_SIZE * CELL_SIZE,
          }}
        >
          {/* Maze walls */}
          {mazeRef.current.map((row, y) =>
            row.map((cell, x) =>
              cell === 1 ? (
                <div
                  // biome-ignore lint/suspicious/noArrayIndexKey: positional grid
                  key={`wall-${x}-${y}`}
                  className="absolute bg-blue-600 border border-blue-400"
                  style={{
                    left: x * CELL_SIZE,
                    top: y * CELL_SIZE,
                    width: CELL_SIZE,
                    height: CELL_SIZE,
                  }}
                />
              ) : null,
            ),
          )}

          {/* Pellets */}
          {Array.from(pelletsRef.current).map((key) => {
            const [x, y] = key.split(",").map(Number);
            return (
              <div
                key={`pellet-${key}`}
                className="absolute bg-yellow-300 rounded-full"
                style={{
                  left: x * CELL_SIZE + CELL_SIZE / 2 - 3,
                  top: y * CELL_SIZE + CELL_SIZE / 2 - 3,
                  width: 6,
                  height: 6,
                }}
              />
            );
          })}

          {/* Pac-Man */}
          <div
            className="absolute bg-yellow-400 rounded-full border-2 border-yellow-500 transition-all duration-100"
            style={{
              left: pacManRef.current.x * CELL_SIZE + 2,
              top: pacManRef.current.y * CELL_SIZE + 2,
              width: CELL_SIZE - 4,
              height: CELL_SIZE - 4,
            }}
          >
            <div className="absolute inset-0 flex items-center justify-center text-lg">
              {directionRef.current.dx === 1
                ? "▶"
                : directionRef.current.dx === -1
                  ? "◀"
                  : directionRef.current.dy === -1
                    ? "▲"
                    : "▼"}
            </div>
          </div>

          {/* Ghosts */}
          {ghostsRef.current.map((ghost) => (
            <div
              key={ghost.id}
              className="absolute rounded-t-full transition-all duration-100"
              style={{
                left: ghost.position.x * CELL_SIZE + 2,
                top: ghost.position.y * CELL_SIZE + 2,
                width: CELL_SIZE - 4,
                height: CELL_SIZE - 4,
                backgroundColor: ghost.color,
                borderBottom: `4px solid ${ghost.color}`,
              }}
            >
              <div className="absolute top-1/4 left-1/4 w-2 h-2 bg-white rounded-full" />
              <div className="absolute top-1/4 right-1/4 w-2 h-2 bg-white rounded-full" />
            </div>
          ))}

          {/* Instructions Overlay */}
          {showInstructions && !gameOver && (
            <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-10">
              <div className="bg-white p-6 rounded-lg border-4 border-yellow-400 text-center max-w-sm">
                <h2 className="text-2xl font-bold mb-3 text-yellow-600">
                  How to Play
                </h2>
                <p className="mb-2">🟡 Eat all pellets to win!</p>
                <p className="mb-2">👻 Avoid the ghosts!</p>
                <p className="mb-3">⌨️ Use Arrow Keys or WASD</p>
                <button
                  type="button"
                  onClick={() => setShowInstructions(false)}
                  className="px-6 py-2 bg-yellow-500 text-white rounded-full font-bold hover:bg-yellow-600"
                >
                  Start!
                </button>
              </div>
            </div>
          )}
        </div>

        <div className="mt-4 text-white text-center">
          <p className="text-sm">
            Pellets Remaining: {pelletsRef.current.size}
          </p>
        </div>
      </div>
    </GameLayout>
  );
}
