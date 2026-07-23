import { useCallback, useEffect, useRef, useState } from "react";
import type { ModulePage } from "../../App";
import GameLayout from "../../components/GameLayout";

interface TetrisProps {
  onNavigate: (page: ModulePage) => void;
}

const BOARD_WIDTH = 10;
const BOARD_HEIGHT = 20;
const CELL_SIZE = 25;

type TetrominoType = "I" | "O" | "T" | "S" | "Z" | "J" | "L";

const TETROMINOS: Record<TetrominoType, { shape: number[][]; color: string }> =
  {
    I: { shape: [[1, 1, 1, 1]], color: "#00FFFF" },
    O: {
      shape: [
        [1, 1],
        [1, 1],
      ],
      color: "#FFFF00",
    },
    T: {
      shape: [
        [0, 1, 0],
        [1, 1, 1],
      ],
      color: "#FF00FF",
    },
    S: {
      shape: [
        [0, 1, 1],
        [1, 1, 0],
      ],
      color: "#00FF00",
    },
    Z: {
      shape: [
        [1, 1, 0],
        [0, 1, 1],
      ],
      color: "#FF0000",
    },
    J: {
      shape: [
        [1, 0, 0],
        [1, 1, 1],
      ],
      color: "#0000FF",
    },
    L: {
      shape: [
        [0, 0, 1],
        [1, 1, 1],
      ],
      color: "#FFA500",
    },
  };

interface Piece {
  type: TetrominoType;
  shape: number[][];
  x: number;
  y: number;
  color: string;
}

export default function Tetris({ onNavigate }: TetrisProps) {
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [level, setLevel] = useState(1);
  const [linesCleared, setLinesCleared] = useState(0);
  const [showInstructions, setShowInstructions] = useState(true);

  const boardRef = useRef<(string | null)[][]>(
    Array(BOARD_HEIGHT)
      .fill(null)
      .map(() => Array(BOARD_WIDTH).fill(null)),
  );
  const currentPieceRef = useRef<Piece | null>(null);
  const nextPieceRef = useRef<Piece | null>(null);
  const animationFrameRef = useRef<number | undefined>(undefined);
  const lastDropTimeRef = useRef(0);
  const dropIntervalRef = useRef(1000);
  const [, forceUpdate] = useState({});

  const getRandomPiece = useCallback((): Piece => {
    const types: TetrominoType[] = ["I", "O", "T", "S", "Z", "J", "L"];
    const type = types[Math.floor(Math.random() * types.length)];
    const tetromino = TETROMINOS[type];
    return {
      type,
      shape: tetromino.shape,
      x:
        Math.floor(BOARD_WIDTH / 2) - Math.floor(tetromino.shape[0].length / 2),
      y: 0,
      color: tetromino.color,
    };
  }, []);

  const startGame = useCallback(() => {
    setScore(0);
    setGameOver(false);
    setLevel(1);
    setLinesCleared(0);
    setShowInstructions(true);
    boardRef.current = Array(BOARD_HEIGHT)
      .fill(null)
      .map(() => Array(BOARD_WIDTH).fill(null));
    currentPieceRef.current = getRandomPiece();
    nextPieceRef.current = getRandomPiece();
    dropIntervalRef.current = 1000;
    lastDropTimeRef.current = 0;
    forceUpdate({});
  }, [getRandomPiece]);

  useEffect(() => {
    currentPieceRef.current = getRandomPiece();
    nextPieceRef.current = getRandomPiece();
  }, [getRandomPiece]);

  const isValidPosition = useCallback(
    (piece: Piece, offsetX = 0, offsetY = 0): boolean => {
      for (let y = 0; y < piece.shape.length; y++) {
        for (let x = 0; x < piece.shape[y].length; x++) {
          if (piece.shape[y][x]) {
            const newX = piece.x + x + offsetX;
            const newY = piece.y + y + offsetY;

            if (newX < 0 || newX >= BOARD_WIDTH || newY >= BOARD_HEIGHT) {
              return false;
            }

            if (newY >= 0 && boardRef.current[newY][newX]) {
              return false;
            }
          }
        }
      }
      return true;
    },
    [],
  );

  const rotatePiece = useCallback((piece: Piece): number[][] => {
    const rotated: number[][] = [];
    for (let x = 0; x < piece.shape[0].length; x++) {
      const row: number[] = [];
      for (let y = piece.shape.length - 1; y >= 0; y--) {
        row.push(piece.shape[y][x]);
      }
      rotated.push(row);
    }
    return rotated;
  }, []);

  const lockPiece = useCallback(() => {
    if (!currentPieceRef.current) return;

    const piece = currentPieceRef.current;
    for (let y = 0; y < piece.shape.length; y++) {
      for (let x = 0; x < piece.shape[y].length; x++) {
        if (piece.shape[y][x]) {
          const boardY = piece.y + y;
          const boardX = piece.x + x;
          if (boardY >= 0) {
            boardRef.current[boardY][boardX] = piece.color;
          }
        }
      }
    }

    // Check for completed lines
    let completedLines = 0;
    for (let y = BOARD_HEIGHT - 1; y >= 0; y--) {
      if (boardRef.current[y].every((cell) => cell !== null)) {
        boardRef.current.splice(y, 1);
        boardRef.current.unshift(Array(BOARD_WIDTH).fill(null));
        completedLines++;
        y++; // Check same row again
      }
    }

    if (completedLines > 0) {
      const points = [0, 100, 300, 500, 800][completedLines];
      setScore((prev) => prev + points * level);
      setLinesCleared((prev) => {
        const newLines = prev + completedLines;
        const newLevel = Math.floor(newLines / 10) + 1;
        setLevel(newLevel);
        dropIntervalRef.current = Math.max(100, 1000 - (newLevel - 1) * 100);
        return newLines;
      });
    }

    // Spawn next piece
    currentPieceRef.current = nextPieceRef.current;
    nextPieceRef.current = getRandomPiece();

    // Check game over
    if (currentPieceRef.current && !isValidPosition(currentPieceRef.current)) {
      setGameOver(true);
    }
  }, [level, getRandomPiece, isValidPosition]);

  // Keyboard controls
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (gameOver || !currentPieceRef.current) return;
      setShowInstructions(false);

      const piece = currentPieceRef.current;
      const key = e.key.toLowerCase();

      if (key === "arrowleft" || key === "a") {
        if (isValidPosition(piece, -1, 0)) {
          piece.x -= 1;
          forceUpdate({});
        }
        e.preventDefault();
      } else if (key === "arrowright" || key === "d") {
        if (isValidPosition(piece, 1, 0)) {
          piece.x += 1;
          forceUpdate({});
        }
        e.preventDefault();
      } else if (key === "arrowdown" || key === "s") {
        if (isValidPosition(piece, 0, 1)) {
          piece.y += 1;
          setScore((prev) => prev + 1);
          forceUpdate({});
        }
        e.preventDefault();
      } else if (key === "arrowup" || key === "w" || key === " ") {
        const rotated = rotatePiece(piece);
        const testPiece = { ...piece, shape: rotated };
        if (isValidPosition(testPiece)) {
          piece.shape = rotated;
          forceUpdate({});
        }
        e.preventDefault();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [gameOver, isValidPosition, rotatePiece]);

  // Game loop
  useEffect(() => {
    if (gameOver) {
      if (animationFrameRef.current !== undefined) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      return;
    }

    const animate = (currentTime: number) => {
      if (currentTime - lastDropTimeRef.current > dropIntervalRef.current) {
        lastDropTimeRef.current = currentTime;

        if (currentPieceRef.current) {
          if (isValidPosition(currentPieceRef.current, 0, 1)) {
            currentPieceRef.current.y += 1;
          } else {
            lockPiece();
          }
          forceUpdate({});
        }
      }

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current !== undefined) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [gameOver, isValidPosition, lockPiece]);

  useEffect(() => {
    if (gameOver && score > highScore) {
      setHighScore(score);
    }
  }, [gameOver, score, highScore]);

  return (
    <GameLayout
      title="🟦 Tetris"
      score={score}
      highScore={highScore}
      onRestart={startGame}
      onNavigate={onNavigate}
      gameOver={gameOver}
    >
      <div className="relative w-full flex flex-col lg:flex-row items-center justify-center gap-6 p-4 bg-gradient-to-br from-gray-900 to-purple-900">
        {/* Game Board */}
        <div className="relative">
          <div
            className="relative bg-black border-4 border-purple-500 shadow-2xl"
            style={{
              width: BOARD_WIDTH * CELL_SIZE,
              height: BOARD_HEIGHT * CELL_SIZE,
            }}
          >
            {/* Board cells */}
            {boardRef.current.map((row, y) =>
              row.map((cell, x) => (
                <div
                  key={`c${y * 100 + x}`}
                  className="absolute border border-gray-800"
                  style={{
                    left: x * CELL_SIZE,
                    top: y * CELL_SIZE,
                    width: CELL_SIZE,
                    height: CELL_SIZE,
                    backgroundColor: cell || "transparent",
                  }}
                />
              )),
            )}

            {/* Current piece */}
            {currentPieceRef.current?.shape.map((row, y) =>
              row.map((cell, x) =>
                cell ? (
                  <div
                    key={`p${y * 100 + x}`}
                    className="absolute border-2 border-white/30"
                    style={{
                      left: (currentPieceRef.current!.x + x) * CELL_SIZE,
                      top: (currentPieceRef.current!.y + y) * CELL_SIZE,
                      width: CELL_SIZE,
                      height: CELL_SIZE,
                      backgroundColor: currentPieceRef.current!.color,
                    }}
                  />
                ) : null,
              ),
            )}

            {/* Instructions Overlay */}
            {showInstructions && !gameOver && (
              <div className="absolute inset-0 bg-black/80 flex items-center justify-center z-10">
                <div className="bg-white p-6 rounded-lg border-4 border-purple-500 text-center max-w-sm">
                  <h2 className="text-2xl font-bold mb-3 text-purple-600">
                    How to Play
                  </h2>
                  <p className="mb-2">⬅️➡️ Move Left/Right</p>
                  <p className="mb-2">⬇️ Soft Drop</p>
                  <p className="mb-2">⬆️ or Space: Rotate</p>
                  <p className="mb-3">Clear lines to score!</p>
                  <button
                    type="button"
                    onClick={() => setShowInstructions(false)}
                    className="px-6 py-2 bg-purple-500 text-white rounded-full font-bold hover:bg-purple-600"
                  >
                    Start!
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Side Panel */}
        <div className="flex flex-col gap-4">
          {/* Next Piece */}
          <div className="bg-white p-4 rounded-lg border-4 border-purple-500">
            <h3 className="text-xl font-bold mb-2 text-center">Next Piece</h3>
            <div
              className="relative bg-black border-2 border-purple-300 mx-auto"
              style={{ width: 100, height: 100 }}
            >
              {nextPieceRef.current?.shape.map((row, y) =>
                row.map((cell, x) =>
                  cell ? (
                    <div
                      key={`n${y * 100 + x}`}
                      className="absolute"
                      style={{
                        left: (x + 1) * 20,
                        top: (y + 1) * 20,
                        width: 20,
                        height: 20,
                        backgroundColor: nextPieceRef.current!.color,
                        border: "1px solid white",
                      }}
                    />
                  ) : null,
                ),
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="bg-white p-4 rounded-lg border-4 border-purple-500">
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="font-bold">Level:</span>
                <span className="text-purple-600 font-bold">{level}</span>
              </div>
              <div className="flex justify-between">
                <span className="font-bold">Lines:</span>
                <span className="text-purple-600 font-bold">
                  {linesCleared}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </GameLayout>
  );
}
