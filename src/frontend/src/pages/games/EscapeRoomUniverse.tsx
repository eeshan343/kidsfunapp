import { useCallback, useEffect, useState } from "react";
import type { ModulePage } from "../../App";
import GameLayout from "../../components/GameLayout";

interface Item {
  id: number;
  name: string;
  emoji: string;
  found: boolean;
}

interface Room {
  id: number;
  name: string;
  theme: string;
  items: Item[];
  unlocked: boolean;
  completed: boolean;
}

interface EscapeRoomUniverseProps {
  onNavigate: (page: ModulePage) => void;
}

export default function EscapeRoomUniverse({
  onNavigate,
}: EscapeRoomUniverseProps) {
  const [score, setScore] = useState(0);
  const [currentRoomId, setCurrentRoomId] = useState(0);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [inventory, setInventory] = useState<string[]>([]);
  const [gameOver, setGameOver] = useState(false);
  const [highScore, setHighScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(180);

  const startGame = () => {
    setScore(0);
    setCurrentRoomId(0);
    setInventory([]);
    setGameOver(false);
    setTimeLeft(180);

    const newRooms: Room[] = [
      {
        id: 0,
        name: "Ancient Temple",
        theme: "🏛️",
        items: [
          { id: 0, name: "key", emoji: "🔑", found: false },
          { id: 1, name: "torch", emoji: "🔦", found: false },
          { id: 2, name: "scroll", emoji: "📜", found: false },
        ],
        unlocked: true,
        completed: false,
      },
      {
        id: 1,
        name: "Space Lab",
        theme: "🚀",
        items: [
          { id: 3, name: "chip", emoji: "💾", found: false },
          { id: 4, name: "battery", emoji: "🔋", found: false },
          { id: 5, name: "tool", emoji: "🔧", found: false },
        ],
        unlocked: false,
        completed: false,
      },
      {
        id: 2,
        name: "Haunted Mansion",
        theme: "👻",
        items: [
          { id: 6, name: "candle", emoji: "🕯️", found: false },
          { id: 7, name: "book", emoji: "📖", found: false },
          { id: 8, name: "crystal", emoji: "💎", found: false },
        ],
        unlocked: false,
        completed: false,
      },
    ];
    setRooms(newRooms);
  };

  useEffect(() => {
    if (gameOver || timeLeft <= 0) return;

    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          setGameOver(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [gameOver, timeLeft]);

  useEffect(() => {
    if (gameOver && score > highScore) {
      setHighScore(score);
    }
  }, [gameOver, score, highScore]);

  useEffect(() => {
    // Check if current room is completed
    const currentRoom = rooms[currentRoomId];
    if (
      currentRoom?.items.every((item) => item.found) &&
      !currentRoom.completed
    ) {
      setRooms((prev) =>
        prev.map((r) => {
          if (r.id === currentRoomId) {
            return { ...r, completed: true };
          }
          if (r.id === currentRoomId + 1) {
            return { ...r, unlocked: true };
          }
          return r;
        }),
      );
      setScore((prev) => prev + 100);
    }

    // Check if all rooms completed
    if (rooms.length > 0 && rooms.every((r) => r.completed)) {
      setGameOver(true);
    }
  }, [rooms, currentRoomId]);

  const findItem = (itemId: number) => {
    const currentRoom = rooms[currentRoomId];
    const item = currentRoom.items.find((i) => i.id === itemId);

    if (item && !item.found) {
      setRooms((prev) =>
        prev.map((r) => {
          if (r.id === currentRoomId) {
            return {
              ...r,
              items: r.items.map((i) =>
                i.id === itemId ? { ...i, found: true } : i,
              ),
            };
          }
          return r;
        }),
      );
      setInventory((prev) => [...prev, item.emoji]);
      setScore((prev) => prev + 20);
    }
  };

  const switchRoom = (roomId: number) => {
    const room = rooms[roomId];
    if (room?.unlocked) {
      setCurrentRoomId(roomId);
    }
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: switchRoom is defined in scope
  const handleKeyPress = useCallback(
    (e: KeyboardEvent) => {
      if (gameOver) return;

      if (e.key >= "1" && e.key <= "3") {
        const roomId = Number.parseInt(e.key) - 1;
        switchRoom(roomId);
      }
    },
    [gameOver, rooms],
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [handleKeyPress]);

  const currentRoom = rooms[currentRoomId];

  return (
    <GameLayout
      title="🚪 Escape Room Universe"
      score={score}
      highScore={highScore}
      onRestart={startGame}
      onNavigate={onNavigate}
      gameOver={gameOver}
    >
      <div className="relative w-full h-[600px] bg-gradient-to-br from-gray-800 via-gray-700 to-gray-900 overflow-hidden">
        {/* Timer */}
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-red-500 text-white px-6 py-3 rounded-full border-4 border-red-700 z-20">
          <span className="text-2xl font-bold">
            ⏰ {Math.floor(timeLeft / 60)}:
            {(timeLeft % 60).toString().padStart(2, "0")}
          </span>
        </div>

        {/* Room selector */}
        <div className="absolute top-4 left-4 bg-white p-3 rounded-lg border-4 border-purple-300 z-20">
          <div className="text-sm font-bold mb-2">Rooms (1-3):</div>
          <div className="flex gap-2">
            {rooms.map((room) => (
              <button
                type="button"
                key={room.id}
                onClick={() => switchRoom(room.id)}
                disabled={!room.unlocked}
                className={`px-3 py-2 rounded border-2 transition-all ${
                  currentRoomId === room.id
                    ? "border-purple-600 bg-purple-100 scale-110"
                    : "border-gray-300"
                } ${room.completed ? "bg-green-100" : ""} disabled:opacity-30 disabled:cursor-not-allowed`}
              >
                <div className="text-3xl">{room.theme}</div>
                {room.completed && <div className="text-lg">✅</div>}
                {!room.unlocked && <div className="text-lg">🔒</div>}
              </button>
            ))}
          </div>
        </div>

        {/* Inventory */}
        <div className="absolute top-4 right-4 bg-white p-3 rounded-lg border-4 border-yellow-300 z-20">
          <div className="text-sm font-bold mb-2">Inventory:</div>
          <div className="flex gap-2">
            {inventory.length === 0 ? (
              <div className="text-gray-400">Empty</div>
            ) : (
              inventory.map((item, idx) => (
                // biome-ignore lint/suspicious/noArrayIndexKey: positional list
                <div key={idx} className="text-3xl">
                  {item}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Current room */}
        {currentRoom && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-center space-y-8">
              <div className="text-8xl">{currentRoom.theme}</div>
              <h2 className="text-4xl font-bold text-white">
                {currentRoom.name}
              </h2>

              {/* Items to find */}
              <div className="bg-white/90 p-6 rounded-lg border-4 border-purple-400 max-w-md mx-auto">
                <h3 className="text-xl font-bold mb-4">Find Hidden Items:</h3>
                <div className="grid grid-cols-3 gap-4">
                  {currentRoom.items.map((item) => (
                    <button
                      type="button"
                      key={item.id}
                      onClick={() => findItem(item.id)}
                      disabled={item.found}
                      className={`p-4 rounded-lg border-3 transition-all ${
                        item.found
                          ? "bg-green-100 border-green-400 opacity-50"
                          : "bg-purple-100 border-purple-400 hover:scale-110"
                      }`}
                    >
                      <div className="text-5xl mb-2">
                        {item.found ? "✅" : "❓"}
                      </div>
                      <div className="text-sm font-bold capitalize">
                        {item.name}
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Instructions */}
        {currentRoom &&
          !currentRoom.completed &&
          currentRoom.items.filter((i) => i.found).length === 0 && (
            <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white px-6 py-3 rounded-lg border-4 border-purple-300 z-20 text-center">
              <p className="font-bold">
                Click items to find them! Complete all rooms to escape!
              </p>
            </div>
          )}
      </div>
    </GameLayout>
  );
}
