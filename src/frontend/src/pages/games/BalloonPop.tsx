import { useCallback, useEffect, useRef, useState } from "react";
import type { ModulePage } from "../../App";
import GameLayout from "../../components/GameLayout";

interface Balloon {
  id: number;
  x: number;
  y: number;
  color: string;
  type: "normal" | "bonus" | "penalty";
  speed: number;
}

interface PopEffect {
  id: number;
  x: number;
  y: number;
  color: string;
}

interface BalloonPopProps {
  onNavigate: (page: ModulePage) => void;
}

export default function BalloonPop({ onNavigate }: BalloonPopProps) {
  const [score, setScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [timeLeft, setTimeLeft] = useState(60);
  const [highScore, setHighScore] = useState(0);
  const [showInstructions, setShowInstructions] = useState(true);

  // Use refs for game state to avoid re-renders during animation
  const balloonsRef = useRef<Balloon[]>([]);
  const popEffectsRef = useRef<PopEffect[]>([]);
  const nextIdRef = useRef(0);
  const nextEffectIdRef = useRef(0);
  const animationFrameRef = useRef<number | undefined>(undefined);
  const lastSpawnTimeRef = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const [, forceUpdate] = useState({});

  const createBalloon = useCallback((): Balloon => {
    const types: Array<"normal" | "bonus" | "penalty"> = [
      "normal",
      "normal",
      "normal",
      "normal",
      "bonus",
      "penalty",
    ];
    const type = types[Math.floor(Math.random() * types.length)];
    const colors = {
      normal: [
        "#FF6B6B",
        "#4ECDC4",
        "#45B7D1",
        "#FFA07A",
        "#98D8C8",
        "#FF69B4",
        "#9370DB",
      ],
      bonus: ["#FFD700", "#FFA500"],
      penalty: ["#8B0000", "#2C2C2C"],
    };

    const balloon: Balloon = {
      id: nextIdRef.current++,
      x: Math.random() * 75 + 12.5, // Keep balloons away from edges (12.5-87.5%)
      y: 0, // Start at bottom (0%)
      color: colors[type][Math.floor(Math.random() * colors[type].length)],
      type,
      speed: 0.5 + Math.random() * 0.8, // Varying speeds (0.5 - 1.3 units per frame)
    };

    return balloon;
  }, []);

  const startGame = useCallback(() => {
    setScore(0);
    setGameOver(false);
    setTimeLeft(60);
    setShowInstructions(true);
    balloonsRef.current = [];
    popEffectsRef.current = [];
    nextIdRef.current = 0;
    nextEffectIdRef.current = 0;
    lastSpawnTimeRef.current = 0;
    forceUpdate({});
  }, []);

  // Timer countdown
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

  // Main game loop with requestAnimationFrame
  useEffect(() => {
    if (gameOver || timeLeft <= 0) {
      if (animationFrameRef.current !== undefined) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      return;
    }

    let lastTime = performance.now();

    const animate = (currentTime: number) => {
      const deltaTime = Math.min(currentTime - lastTime, 100); // Cap delta to prevent huge jumps
      lastTime = currentTime;

      // Spawn new balloons at regular intervals (every 800ms)
      if (
        currentTime - lastSpawnTimeRef.current > 800 &&
        balloonsRef.current.length < 15
      ) {
        lastSpawnTimeRef.current = currentTime;
        balloonsRef.current.push(createBalloon());
        setShowInstructions(false);
      }

      // Update balloon positions - move upward smoothly
      balloonsRef.current = balloonsRef.current
        .map((b) => ({
          ...b,
          y: b.y + (b.speed * deltaTime) / 16.67, // Normalize to ~60fps baseline
        }))
        .filter((b) => b.y <= 105); // Remove when past top (105% to ensure fully off-screen)

      // Clean up old pop effects
      const now = Date.now();
      popEffectsRef.current = popEffectsRef.current.filter(
        (effect) => now - (effect as any).timestamp < 600,
      );

      // Force re-render for visual updates
      forceUpdate({});

      animationFrameRef.current = requestAnimationFrame(animate);
    };

    animationFrameRef.current = requestAnimationFrame(animate);

    return () => {
      if (animationFrameRef.current !== undefined) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, [gameOver, timeLeft, createBalloon]);

  // Update high score
  useEffect(() => {
    if (gameOver && score > highScore) {
      setHighScore(score);
    }
  }, [gameOver, score, highScore]);

  const popBalloon = useCallback(
    (balloon: Balloon, event: React.MouseEvent | React.TouchEvent) => {
      if (gameOver) return;

      // Prevent default to avoid double-firing on touch devices
      event.preventDefault();
      event.stopPropagation();

      // Remove balloon immediately
      balloonsRef.current = balloonsRef.current.filter(
        (b) => b.id !== balloon.id,
      );

      // Add pop effect with timestamp
      const effect: any = {
        id: nextEffectIdRef.current++,
        x: balloon.x,
        y: balloon.y,
        color: balloon.color,
        timestamp: Date.now(),
      };
      popEffectsRef.current.push(effect);

      // Play pop sound (simple audio feedback)
      try {
        const audioContext = new (
          window.AudioContext || (window as any).webkitAudioContext
        )();
        const oscillator = audioContext.createOscillator();
        const gainNode = audioContext.createGain();

        oscillator.connect(gainNode);
        gainNode.connect(audioContext.destination);

        oscillator.frequency.value =
          balloon.type === "bonus"
            ? 800
            : balloon.type === "penalty"
              ? 200
              : 500;
        oscillator.type = "sine";

        gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(
          0.01,
          audioContext.currentTime + 0.1,
        );

        oscillator.start(audioContext.currentTime);
        oscillator.stop(audioContext.currentTime + 0.1);
      } catch (_e) {
        // Audio not supported, continue without sound
      }

      // Update score based on balloon type
      if (balloon.type === "bonus") {
        setScore((prev) => prev + 20);
      } else if (balloon.type === "penalty") {
        setScore((prev) => Math.max(0, prev - 5));
      } else {
        setScore((prev) => prev + 10);
      }

      // Force immediate re-render
      forceUpdate({});
    },
    [gameOver],
  );

  return (
    <GameLayout
      title="🎈 Balloon Pop"
      score={score}
      highScore={highScore}
      onRestart={startGame}
      onNavigate={onNavigate}
      gameOver={gameOver}
    >
      <div
        ref={containerRef}
        className="relative w-full h-[600px] bg-gradient-to-b from-sky-300 via-sky-200 to-sky-100 overflow-hidden rounded-lg border-4 border-purple-300 shadow-xl"
        style={{ touchAction: "none" }}
      >
        {/* Time Display */}
        <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-white px-6 py-3 rounded-full border-4 border-purple-300 z-10 shadow-lg">
          <span className="text-2xl font-bold text-purple-600">
            ⏰ {timeLeft}s
          </span>
        </div>

        {/* Instructions */}
        {showInstructions && !gameOver && timeLeft === 60 && (
          <div className="absolute inset-0 flex items-center justify-center z-20 pointer-events-none">
            <div className="bg-white p-8 rounded-lg border-4 border-purple-300 text-center shadow-xl max-w-md pointer-events-auto">
              <h2 className="text-3xl font-bold mb-4 text-purple-600">
                Pop the Balloons!
              </h2>
              <p className="text-lg mb-2">
                🎈 Normal Balloons:{" "}
                <span className="font-bold text-green-600">+10 points</span>
              </p>
              <p className="text-lg mb-2">
                ⭐ Gold Balloons:{" "}
                <span className="font-bold text-yellow-600">+20 points</span>
              </p>
              <p className="text-lg mb-4">
                💣 Dark Balloons:{" "}
                <span className="font-bold text-red-600">-5 points</span>
              </p>
              <p className="text-gray-600">
                Click or tap balloons before they float away!
              </p>
              <button
                type="button"
                onClick={() => setShowInstructions(false)}
                className="mt-4 px-6 py-2 bg-purple-500 text-white rounded-full font-bold hover:bg-purple-600 transition-colors"
              >
                Start Playing!
              </button>
            </div>
          </div>
        )}

        {/* Balloons */}
        {balloonsRef.current.map((balloon) => (
          // biome-ignore lint/a11y/useKeyWithClickEvents: game balloon interaction
          <div
            key={balloon.id}
            className="absolute cursor-pointer transition-transform hover:scale-110 active:scale-95"
            style={{
              left: `${balloon.x}%`,
              bottom: `${balloon.y}%`,
              transform: "translate(-50%, 0)",
              touchAction: "none",
              userSelect: "none",
              WebkitTapHighlightColor: "transparent",
              willChange: "transform",
            }}
            onClick={(e) => popBalloon(balloon, e)}
            onTouchStart={(e) => popBalloon(balloon, e)}
          >
            <div
              className="w-16 h-20 rounded-full border-4 border-white shadow-lg relative"
              style={{
                backgroundColor: balloon.color,
                animation: "float 2s ease-in-out infinite",
              }}
            >
              {balloon.type === "bonus" && (
                <div className="text-2xl text-center absolute inset-0 flex items-center justify-center pointer-events-none select-none">
                  ⭐
                </div>
              )}
              {balloon.type === "penalty" && (
                <div className="text-2xl text-center absolute inset-0 flex items-center justify-center pointer-events-none select-none">
                  💣
                </div>
              )}
            </div>
            <div
              className="w-1 h-8 bg-gray-400 mx-auto"
              style={{ marginTop: "-4px" }}
            />
          </div>
        ))}

        {/* Pop Effects */}
        {popEffectsRef.current.map((effect) => (
          <div
            key={effect.id}
            className="absolute pointer-events-none"
            style={{
              left: `${effect.x}%`,
              bottom: `${effect.y}%`,
              transform: "translate(-50%, 0)",
              animation: "popEffect 0.6s ease-out forwards",
            }}
          >
            <div className="text-4xl select-none">💥</div>
            <div
              className="absolute inset-0 rounded-full"
              style={{
                backgroundColor: effect.color,
                opacity: 0.6,
                animation: "expandFade 0.6s ease-out forwards",
              }}
            />
          </div>
        ))}

        {/* Ground indicator */}
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-green-400 opacity-30" />
      </div>

      <style>{`
        @keyframes float {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(-10px); }
        }
        
        @keyframes popEffect {
          0% {
            transform: translate(-50%, 0) scale(1);
            opacity: 1;
          }
          100% {
            transform: translate(-50%, -30px) scale(1.5);
            opacity: 0;
          }
        }
        
        @keyframes expandFade {
          0% {
            transform: scale(1);
            opacity: 0.6;
          }
          100% {
            transform: scale(3);
            opacity: 0;
          }
        }
      `}</style>
    </GameLayout>
  );
}
