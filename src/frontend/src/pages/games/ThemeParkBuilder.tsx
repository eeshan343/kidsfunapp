import { useEffect, useState } from "react";
import type { ModulePage } from "../../App";
import GameLayout from "../../components/GameLayout";

interface Ride {
  id: number;
  type: string;
  x: number;
  y: number;
  cost: number;
  income: number;
  emoji: string;
}

interface ThemeParkBuilderProps {
  onNavigate: (page: ModulePage) => void;
}

const rideTypes = [
  { type: "roller-coaster", emoji: "🎢", cost: 100, income: 20 },
  { type: "ferris-wheel", emoji: "🎡", cost: 150, income: 30 },
  { type: "carousel", emoji: "🎠", cost: 80, income: 15 },
  { type: "bumper-cars", emoji: "🚗", cost: 120, income: 25 },
];

export default function ThemeParkBuilder({
  onNavigate,
}: ThemeParkBuilderProps) {
  const [score, setScore] = useState(0);
  const [cash, setCash] = useState(200);
  const [happiness, setHappiness] = useState(50);
  const [rides, setRides] = useState<Ride[]>([]);
  const [selectedRide, setSelectedRide] = useState<
    (typeof rideTypes)[0] | null
  >(null);
  const [gameOver, setGameOver] = useState(false);
  const [highScore, setHighScore] = useState(0);
  const [nextId, setNextId] = useState(0);
  const [visitors, setVisitors] = useState(10);

  const startGame = () => {
    setScore(0);
    setCash(200);
    setHappiness(50);
    setRides([]);
    setSelectedRide(null);
    setGameOver(false);
    setNextId(0);
    setVisitors(10);
  };

  useEffect(() => {
    if (gameOver) return;

    const incomeInterval = setInterval(() => {
      const totalIncome = rides.reduce((sum, ride) => sum + ride.income, 0);
      setCash((prev) => prev + totalIncome);
      setScore((prev) => prev + totalIncome);

      // Update happiness based on rides
      const targetHappiness = Math.min(100, 50 + rides.length * 5);
      setHappiness((prev) => {
        if (prev < targetHappiness) return Math.min(100, prev + 2);
        if (prev > targetHappiness) return Math.max(0, prev - 2);
        return prev;
      });

      // Update visitors based on happiness
      setVisitors(Math.floor(10 + (happiness / 100) * 40));

      // Game over if happiness too low
      if (happiness < 10) {
        setGameOver(true);
      }
    }, 2000);

    return () => clearInterval(incomeInterval);
  }, [gameOver, rides, happiness]);

  useEffect(() => {
    if (gameOver && score > highScore) {
      setHighScore(score);
    }
  }, [gameOver, score, highScore]);

  const placeRide = (x: number, y: number) => {
    if (!selectedRide || cash < selectedRide.cost) return;

    const gridX = Math.floor(x / 15) * 15 + 7.5;
    const gridY = Math.floor(y / 15) * 15 + 7.5;

    // Check if spot is occupied
    const occupied = rides.some(
      (ride) => Math.abs(ride.x - gridX) < 10 && Math.abs(ride.y - gridY) < 10,
    );

    if (!occupied) {
      setRides((prev) => [
        ...prev,
        {
          id: nextId,
          type: selectedRide.type,
          x: gridX,
          y: gridY,
          cost: selectedRide.cost,
          income: selectedRide.income,
          emoji: selectedRide.emoji,
        },
      ]);
      setCash((prev) => prev - selectedRide.cost);
      setNextId((id) => id + 1);
      setSelectedRide(null);
    }
  };

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    placeRide(x, y);
  };

  return (
    <GameLayout
      title="🎡 Theme Park Builder"
      score={score}
      highScore={highScore}
      onRestart={startGame}
      onNavigate={onNavigate}
      gameOver={gameOver}
    >
      <div className="relative w-full h-[600px] bg-gradient-to-br from-green-200 via-yellow-100 to-blue-200 overflow-hidden">
        {/* Stats panel */}
        <div className="absolute top-4 left-4 bg-white p-4 rounded-lg border-4 border-green-400 z-20 space-y-2">
          <div className="font-bold">💰 Cash: ${cash}</div>
          <div className="font-bold">😊 Happiness: {happiness}%</div>
          <div className="font-bold">👥 Visitors: {visitors}</div>
        </div>

        {/* Instructions */}
        {rides.length === 0 && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-white px-6 py-3 rounded-lg border-4 border-purple-300 z-20 text-center max-w-md">
            <p className="font-bold">Build rides to attract visitors!</p>
            <p className="text-sm">
              Select a ride below, then click to place it
            </p>
          </div>
        )}

        {/* Ride selector */}
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white p-4 rounded-lg border-4 border-purple-300 z-20">
          <div className="flex gap-3">
            {rideTypes.map((ride) => (
              <button
                type="button"
                key={ride.type}
                onClick={() => setSelectedRide(ride)}
                disabled={cash < ride.cost}
                className={`p-3 rounded border-3 transition-all ${
                  selectedRide?.type === ride.type
                    ? "border-purple-600 bg-purple-100 scale-110"
                    : "border-gray-300"
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                <div className="text-4xl mb-1">{ride.emoji}</div>
                <div className="text-xs font-bold">${ride.cost}</div>
                <div className="text-xs text-green-600">+${ride.income}/2s</div>
              </button>
            ))}
          </div>
        </div>

        {/* Park area */}
        <div
          className="absolute inset-0 cursor-crosshair"
          onClick={handleClick}
          onKeyDown={(e) => e.key === "Enter" && handleClick}
        >
          {/* Grid */}
          <div className="absolute inset-0 opacity-20">
            {[0, 15, 30, 45, 60, 75, 90].map((pct) => (
              <div
                key={`h-${pct}`}
                className="absolute w-full h-px bg-gray-400"
                style={{ top: `${pct}%` }}
              />
            ))}
            {[0, 15, 30, 45, 60, 75, 90].map((pct) => (
              <div
                key={`v-${pct}`}
                className="absolute h-full w-px bg-gray-400"
                style={{ left: `${pct}%` }}
              />
            ))}
          </div>

          {/* Rides */}
          {rides.map((ride) => (
            <div
              key={ride.id}
              className="absolute transition-all duration-300 hover:scale-110"
              style={{
                left: `${ride.x}%`,
                top: `${ride.y}%`,
                transform: "translate(-50%, -50%)",
              }}
            >
              <div className="text-6xl animate-bounce">{ride.emoji}</div>
            </div>
          ))}

          {/* Visitors */}
          {Array.from({ length: Math.min(visitors, 20) }).map((_, i) => (
            <div
              // biome-ignore lint/suspicious/noArrayIndexKey: decorative visitor elements with no stable id
              key={`visitor-${i}`}
              className="absolute text-2xl transition-all duration-1000"
              style={{
                left: `${(i * 5 + Math.random() * 10) % 90}%`,
                top: `${(i * 7 + Math.random() * 10) % 90}%`,
                animation: `float ${2 + Math.random()}s ease-in-out infinite`,
              }}
            >
              🚶
            </div>
          ))}
        </div>
      </div>
    </GameLayout>
  );
}
