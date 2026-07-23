import { useCallback, useEffect, useState } from "react";
import type { ModulePage } from "../../App";
import GameLayout from "../../components/GameLayout";

interface Room {
  id: number;
  x: number;
  y: number;
  color: string;
  puzzle: "color" | "pattern" | "sequence";
  solved: boolean;
}

interface MindMazePuzzleProps {
  onNavigate: (page: ModulePage) => void;
}

export default function MindMazePuzzle({ onNavigate }: MindMazePuzzleProps) {
  const [score, setScore] = useState(0);
  const [currentRoom, setCurrentRoom] = useState(0);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [gameOver, setGameOver] = useState(false);
  const [highScore, setHighScore] = useState(0);
  const [puzzleAnswer, setPuzzleAnswer] = useState<string>("");
  const [showPuzzle, setShowPuzzle] = useState(false);

  const colors = [
    "#FF6B6B",
    "#4ECDC4",
    "#45B7D1",
    "#FFA07A",
    "#98D8C8",
    "#FFD93D",
  ];
  const patterns = ["⭐", "🔷", "🔶", "⚡", "💫", "🌟"];

  const startGame = () => {
    setScore(0);
    setCurrentRoom(0);
    setGameOver(false);
    setPuzzleAnswer("");
    setShowPuzzle(false);

    const newRooms: Room[] = [];
    for (let i = 0; i < 6; i++) {
      newRooms.push({
        id: i,
        x: (i % 3) * 33 + 16.5,
        y: Math.floor(i / 3) * 50 + 25,
        color: colors[i],
        puzzle: ["color", "pattern", "sequence"][
          Math.floor(Math.random() * 3)
        ] as "color" | "pattern" | "sequence",
        solved: false,
      });
    }
    setRooms(newRooms);
  };

  useEffect(() => {
    if (gameOver && score > highScore) {
      setHighScore(score);
    }
  }, [gameOver, score, highScore]);

  useEffect(() => {
    const solvedCount = rooms.filter((r) => r.solved).length;
    if (solvedCount === rooms.length && rooms.length > 0) {
      setGameOver(true);
    }
  }, [rooms]);

  const handleRoomClick = (roomId: number) => {
    const room = rooms[roomId];
    if (room.solved) return;

    setCurrentRoom(roomId);
    setShowPuzzle(true);
    setPuzzleAnswer("");
  };

  const solvePuzzle = () => {
    const room = rooms[currentRoom];
    let correct = false;

    if (room.puzzle === "color") {
      correct = puzzleAnswer.toLowerCase() === room.color.toLowerCase();
    } else if (room.puzzle === "pattern") {
      correct = puzzleAnswer === patterns[currentRoom];
    } else if (room.puzzle === "sequence") {
      correct = puzzleAnswer === String(currentRoom + 1);
    }

    if (correct) {
      setRooms((prev) =>
        prev.map((r) => (r.id === currentRoom ? { ...r, solved: true } : r)),
      );
      setScore((prev) => prev + 50);
      setShowPuzzle(false);
      setPuzzleAnswer("");
    } else {
      setScore((prev) => Math.max(0, prev - 10));
    }
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: solvePuzzle closure is stable with these deps
  const handleKeyPress = useCallback(
    (e: KeyboardEvent) => {
      if (!showPuzzle || gameOver) return;

      if (e.key === "Enter") {
        solvePuzzle();
      }
    },
    [showPuzzle, gameOver, puzzleAnswer, currentRoom],
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [handleKeyPress]);

  const renderPuzzle = () => {
    const room = rooms[currentRoom];
    if (!room) return null;

    if (room.puzzle === "color") {
      return (
        <div className="space-y-4">
          <div className="text-xl font-bold">What color is this room?</div>
          <div
            className="w-32 h-32 mx-auto rounded-lg border-4 border-white"
            style={{ backgroundColor: room.color }}
          />
          <input
            type="text"
            value={puzzleAnswer}
            onChange={(e) => setPuzzleAnswer(e.target.value)}
            placeholder="Type the color..."
            className="w-full px-4 py-2 border-3 border-purple-300 rounded-lg text-center"
          />
        </div>
      );
    }
    if (room.puzzle === "pattern") {
      return (
        <div className="space-y-4">
          <div className="text-xl font-bold">Remember this pattern!</div>
          <div className="text-6xl">{patterns[currentRoom]}</div>
          <input
            type="text"
            value={puzzleAnswer}
            onChange={(e) => setPuzzleAnswer(e.target.value)}
            placeholder="Type the emoji..."
            className="w-full px-4 py-2 border-3 border-purple-300 rounded-lg text-center"
          />
        </div>
      );
    }
    return (
      <div className="space-y-4">
        <div className="text-xl font-bold">What room number is this?</div>
        <div className="text-6xl">🚪</div>
        <input
          type="text"
          value={puzzleAnswer}
          onChange={(e) => setPuzzleAnswer(e.target.value)}
          placeholder="Type the number..."
          className="w-full px-4 py-2 border-3 border-purple-300 rounded-lg text-center"
        />
      </div>
    );
  };

  return (
    <GameLayout
      title="🧩 Mind Maze Puzzle"
      score={score}
      highScore={highScore}
      onRestart={startGame}
      onNavigate={onNavigate}
      gameOver={gameOver}
    >
      <div className="relative w-full h-[600px] bg-gradient-to-br from-purple-400 via-pink-400 to-indigo-400 overflow-hidden">
        {/* Instructions */}
        {rooms.filter((r) => r.solved).length === 0 && !showPuzzle && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-white px-6 py-3 rounded-lg border-4 border-purple-300 z-20 text-center max-w-md">
            <p className="font-bold">Click rooms to solve puzzles!</p>
          </div>
        )}

        {/* Rooms */}
        {!showPuzzle &&
          rooms.map((room) => (
            // biome-ignore lint/a11y/useKeyWithClickEvents: game room interaction
            <div
              key={room.id}
              onClick={() => handleRoomClick(room.id)}
              className={`absolute cursor-pointer transition-all duration-300 hover:scale-110 ${
                room.solved ? "opacity-50" : ""
              }`}
              style={{
                left: `${room.x}%`,
                top: `${room.y}%`,
                transform: "translate(-50%, -50%)",
              }}
            >
              <div
                className="w-32 h-32 rounded-lg border-4 border-white flex items-center justify-center shadow-2xl"
                style={{ backgroundColor: room.color }}
              >
                <div className="text-5xl">{room.solved ? "✅" : "🚪"}</div>
              </div>
              <div className="text-center mt-2 font-bold text-white">
                Room {room.id + 1}
              </div>
            </div>
          ))}

        {/* Puzzle overlay */}
        {showPuzzle && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center z-30">
            <div className="bg-white p-8 rounded-lg border-4 border-purple-400 max-w-md w-full mx-4">
              {renderPuzzle()}
              <div className="flex gap-3 mt-6">
                <button
                  type="button"
                  onClick={solvePuzzle}
                  className="flex-1 px-6 py-3 bg-green-500 text-white rounded-lg font-bold hover:bg-green-600 transition-colors"
                >
                  Submit
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowPuzzle(false);
                    setPuzzleAnswer("");
                  }}
                  className="flex-1 px-6 py-3 bg-gray-500 text-white rounded-lg font-bold hover:bg-gray-600 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Progress */}
        <div className="absolute bottom-4 right-4 bg-white px-4 py-2 rounded-lg border-3 border-purple-400 z-20">
          <span className="font-bold">
            Solved: {rooms.filter((r) => r.solved).length}/{rooms.length}
          </span>
        </div>
      </div>
    </GameLayout>
  );
}
