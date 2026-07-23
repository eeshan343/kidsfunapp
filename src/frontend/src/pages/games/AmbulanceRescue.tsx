import { useCallback, useEffect, useState } from "react";
import type { ModulePage } from "../../App";
import GameLayout from "../../components/GameLayout";

interface Patient {
  id: number;
  x: number;
  y: number;
  rescued: boolean;
}

interface AmbulanceRescueProps {
  onNavigate: (page: ModulePage) => void;
}

export default function AmbulanceRescue({ onNavigate }: AmbulanceRescueProps) {
  const [score, setScore] = useState(0);
  const [ambulanceX, setAmbulanceX] = useState(50);
  const [ambulanceY, setAmbulanceY] = useState(50);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [gameOver, setGameOver] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);
  const [nextId, setNextId] = useState(0);
  const [highScore, setHighScore] = useState(0);

  const startGame = () => {
    setScore(0);
    setAmbulanceX(50);
    setAmbulanceY(50);
    setPatients([]);
    setGameOver(false);
    setTimeLeft(60);
    setNextId(0);
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
    if (gameOver) return;

    const spawnInterval = setInterval(() => {
      if (patients.filter((p) => !p.rescued).length < 5) {
        setPatients((prev) => [
          ...prev,
          {
            id: nextId,
            x: Math.random() * 90 + 5,
            y: Math.random() * 90 + 5,
            rescued: false,
          },
        ]);
        setNextId((id) => id + 1);
      }
    }, 3000);

    return () => clearInterval(spawnInterval);
  }, [gameOver, patients, nextId]);

  useEffect(() => {
    if (gameOver && score > highScore) {
      setHighScore(score);
    }
  }, [gameOver, score, highScore]);

  const handleKeyPress = useCallback(
    (e: KeyboardEvent) => {
      if (gameOver) return;

      const speed = 3;
      if (e.key === "ArrowUp") {
        setAmbulanceY((prev) => Math.max(5, prev - speed));
      } else if (e.key === "ArrowDown") {
        setAmbulanceY((prev) => Math.min(90, prev + speed));
      } else if (e.key === "ArrowLeft") {
        setAmbulanceX((prev) => Math.max(5, prev - speed));
      } else if (e.key === "ArrowRight") {
        setAmbulanceX((prev) => Math.min(90, prev + speed));
      }
    },
    [gameOver],
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [handleKeyPress]);

  useEffect(() => {
    // Check for patient rescue
    for (const patient of patients) {
      if (!patient.rescued) {
        const distance = Math.sqrt(
          (ambulanceX - patient.x) ** 2 + (ambulanceY - patient.y) ** 2,
        );
        if (distance < 8) {
          setPatients((prev) =>
            prev.map((p) =>
              p.id === patient.id ? { ...p, rescued: true } : p,
            ),
          );
          setScore((prev) => prev + 10);
        }
      }
    }
  }, [ambulanceX, ambulanceY, patients]);

  return (
    <GameLayout
      title="🚑 Ambulance Rescue"
      score={score}
      highScore={highScore}
      onRestart={startGame}
      onNavigate={onNavigate}
      gameOver={gameOver}
    >
      <div className="relative w-full h-[600px] bg-gradient-to-br from-green-200 to-blue-200 overflow-hidden">
        {/* Time Display */}
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-white px-6 py-3 rounded-full border-4 border-red-300 z-10">
          <span className="text-2xl font-bold">⏰ {timeLeft}s</span>
        </div>

        {/* Instructions */}
        {patients.length === 0 && !gameOver && (
          <div className="absolute inset-0 flex items-center justify-center z-10">
            <div className="bg-white p-8 rounded-lg border-4 border-red-400 text-center">
              <h2 className="text-3xl font-bold mb-4">Rescue Patients!</h2>
              <p className="text-lg mb-2">Use arrow keys to move</p>
              <p className="text-lg">Drive to patients to rescue them!</p>
            </div>
          </div>
        )}

        {/* Ambulance */}
        <div
          className="absolute transition-all duration-100"
          style={{
            left: `${ambulanceX}%`,
            top: `${ambulanceY}%`,
            transform: "translate(-50%, -50%)",
          }}
        >
          <div className="text-5xl">🚑</div>
        </div>

        {/* Patients */}
        {patients.map(
          (patient) =>
            !patient.rescued && (
              <div
                key={patient.id}
                className="absolute"
                style={{
                  left: `${patient.x}%`,
                  top: `${patient.y}%`,
                  transform: "translate(-50%, -50%)",
                }}
              >
                <div className="text-4xl animate-bounce">🤕</div>
              </div>
            ),
        )}

        {/* Rescued Count */}
        <div className="absolute bottom-4 right-4 bg-white px-4 py-2 rounded-lg border-3 border-green-400">
          <span className="font-bold">
            Rescued: {patients.filter((p) => p.rescued).length}
          </span>
        </div>
      </div>
    </GameLayout>
  );
}
