import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface CelebrationEvent {
  id: string;
  type: "confetti" | "fireworks";
  message: string;
}

let celebrationQueue: CelebrationEvent[] = [];
let triggerCelebration: ((event: CelebrationEvent) => void) | null = null;

export function triggerAchievementCelebration(
  message: string,
  type: "confetti" | "fireworks" = "confetti",
) {
  const event: CelebrationEvent = {
    id: Date.now().toString(),
    type,
    message,
  };
  if (triggerCelebration) {
    triggerCelebration(event);
  } else {
    celebrationQueue.push(event);
  }
}

export default function AchievementCelebration() {
  const [celebrations, setCelebrations] = useState<CelebrationEvent[]>([]);

  useEffect(() => {
    triggerCelebration = (event: CelebrationEvent) => {
      setCelebrations((prev) => [...prev, event]);
      setTimeout(() => {
        setCelebrations((prev) => prev.filter((c) => c.id !== event.id));
      }, 5000);
    };

    for (const event of celebrationQueue) {
      triggerCelebration?.(event);
    }
    celebrationQueue = [];

    return () => {
      triggerCelebration = null;
    };
  }, []);

  if (celebrations.length === 0) return null;

  return createPortal(
    celebrations.map((celebration) => (
      <div
        key={celebration.id}
        className="fixed inset-0 pointer-events-none z-50 flex items-center justify-center"
      >
        {celebration.type === "confetti" && <ConfettiEffect />}
        {celebration.type === "fireworks" && <FireworksEffect />}
        <div className="bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl p-8 border-4 border-yellow-400 animate-bounce">
          <div className="text-center space-y-4">
            <div className="text-6xl">🎉</div>
            <h2 className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
              {celebration.message}
            </h2>
          </div>
        </div>
      </div>
    )),
    document.body,
  );
}

function ConfettiEffect() {
  const confettiPieces = Array.from({ length: 50 }, (_, i) => ({
    id: i,
    left: Math.random() * 100,
    delay: Math.random() * 2,
    duration: 3 + Math.random() * 2,
    color: [
      "#FF6B9D",
      "#C44569",
      "#FFA502",
      "#FFD32A",
      "#05C46B",
      "#0ABDE3",
      "#4834DF",
    ][Math.floor(Math.random() * 7)],
  }));

  return (
    <>
      {confettiPieces.map((piece) => (
        <div
          key={piece.id}
          className="absolute w-3 h-3 rounded-full animate-fall"
          style={{
            left: `${piece.left}%`,
            top: "-10%",
            backgroundColor: piece.color,
            animationDelay: `${piece.delay}s`,
            animationDuration: `${piece.duration}s`,
          }}
        />
      ))}
      <style>{`
        @keyframes fall {
          to {
            transform: translateY(110vh) rotate(360deg);
            opacity: 0;
          }
        }
        .animate-fall {
          animation: fall linear forwards;
        }
      `}</style>
    </>
  );
}

function FireworksEffect() {
  const fireworks = Array.from({ length: 5 }, (_, i) => ({
    id: i,
    left: 20 + Math.random() * 60,
    top: 20 + Math.random() * 60,
    delay: i * 0.5,
  }));

  return (
    <>
      {fireworks.map((firework) => (
        <div
          key={firework.id}
          className="absolute w-4 h-4 rounded-full bg-yellow-400 animate-explode"
          style={{
            left: `${firework.left}%`,
            top: `${firework.top}%`,
            animationDelay: `${firework.delay}s`,
          }}
        />
      ))}
      <style>{`
        @keyframes explode {
          0% {
            transform: scale(0);
            opacity: 1;
          }
          50% {
            transform: scale(20);
            opacity: 0.8;
          }
          100% {
            transform: scale(40);
            opacity: 0;
          }
        }
        .animate-explode {
          animation: explode 1s ease-out forwards;
        }
      `}</style>
    </>
  );
}
