import { useCallback, useEffect, useState } from "react";
import type { ModulePage } from "../../App";
import GameLayout from "../../components/GameLayout";

interface Coin {
  id: number;
  x: number;
  y: number;
  collected: boolean;
}

interface Platform {
  x: number;
  y: number;
  width: number;
}

interface BibbleAdventureProps {
  onNavigate: (page: ModulePage) => void;
}

export default function BibbleAdventure({ onNavigate }: BibbleAdventureProps) {
  const [score, setScore] = useState(0);
  const [playerX, setPlayerX] = useState(20);
  const [playerY, setPlayerY] = useState(70);
  const [velocityY, setVelocityY] = useState(0);
  const [isJumping, setIsJumping] = useState(false);
  const [coins, setCoins] = useState<Coin[]>([]);
  const [gameOver, setGameOver] = useState(false);
  const [_nextId, setNextId] = useState(0);
  const [highScore, setHighScore] = useState(0);

  const platforms: Platform[] = [
    { x: 0, y: 85, width: 100 },
    { x: 30, y: 70, width: 20 },
    { x: 60, y: 55, width: 20 },
    { x: 20, y: 40, width: 25 },
    { x: 70, y: 30, width: 25 },
  ];

  const startGame = () => {
    setScore(0);
    setPlayerX(20);
    setPlayerY(70);
    setVelocityY(0);
    setIsJumping(false);
    setCoins([]);
    setGameOver(false);
    setNextId(0);
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: platforms is stable
  useEffect(() => {
    // Spawn coins on platforms
    if (coins.length === 0) {
      const newCoins: Coin[] = [];
      platforms.forEach((platform, i) => {
        if (i > 0) {
          newCoins.push({
            id: i,
            x: platform.x + platform.width / 2,
            y: platform.y - 8,
            collected: false,
          });
        }
      });
      setCoins(newCoins);
      setNextId(newCoins.length);
    }
  }, []);

  useEffect(() => {
    if (gameOver) return;

    const gravity = 0.5;
    const gameLoop = setInterval(() => {
      setVelocityY((prev) => prev + gravity);
      setPlayerY((prev) => {
        const newY = prev + velocityY;

        // Check platform collision
        let onPlatform = false;
        for (const platform of platforms) {
          if (
            playerX > platform.x &&
            playerX < platform.x + platform.width &&
            newY >= platform.y - 5 &&
            newY <= platform.y + 2 &&
            velocityY > 0
          ) {
            onPlatform = true;
            setVelocityY(0);
            setIsJumping(false);
            return platform.y - 5;
          }
        }

        // Fall off screen
        if (newY > 100) {
          setGameOver(true);
        }

        return onPlatform ? prev : newY;
      });
    }, 50);

    return () => clearInterval(gameLoop);
  }, [gameOver, velocityY, playerX]);

  useEffect(() => {
    if (gameOver && score > highScore) {
      setHighScore(score);
    }
  }, [gameOver, score, highScore]);

  useEffect(() => {
    // Check coin collection
    for (const coin of coins) {
      if (!coin.collected) {
        const distance = Math.sqrt(
          (playerX - coin.x) ** 2 + (playerY - coin.y) ** 2,
        );
        if (distance < 5) {
          setCoins((prev) =>
            prev.map((c) => (c.id === coin.id ? { ...c, collected: true } : c)),
          );
          setScore((prev) => prev + 10);
        }
      }
    }
  }, [playerX, playerY, coins]);

  const handleKeyPress = useCallback(
    (e: KeyboardEvent) => {
      if (gameOver) return;

      if (e.key === "ArrowLeft") {
        setPlayerX((prev) => Math.max(0, prev - 3));
      } else if (e.key === "ArrowRight") {
        setPlayerX((prev) => Math.min(95, prev + 3));
      } else if (e.key === " " && !isJumping) {
        setVelocityY(-12);
        setIsJumping(true);
      }
    },
    [gameOver, isJumping],
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [handleKeyPress]);

  return (
    <GameLayout
      title="🎮 Bibble Adventure"
      score={score}
      highScore={highScore}
      onRestart={startGame}
      onNavigate={onNavigate}
      gameOver={gameOver}
    >
      <div className="relative w-full h-[600px] bg-gradient-to-b from-sky-400 to-sky-200 overflow-hidden">
        {/* Instructions */}
        {!gameOver && score === 0 && (
          <div className="absolute top-4 left-1/2 transform -translate-x-1/2 bg-white px-6 py-3 rounded-lg border-4 border-purple-300 z-10 text-center">
            <p className="font-bold">← → to move, SPACE to jump</p>
          </div>
        )}

        {/* Platforms */}
        {platforms.map((platform, i) => (
          <div
            // biome-ignore lint/suspicious/noArrayIndexKey: positional list
            key={i}
            className="absolute bg-green-600 border-4 border-green-800 rounded"
            style={{
              left: `${platform.x}%`,
              top: `${platform.y}%`,
              width: `${platform.width}%`,
              height: "20px",
            }}
          />
        ))}

        {/* Player */}
        <div
          className="absolute transition-all duration-100"
          style={{
            left: `${playerX}%`,
            top: `${playerY}%`,
            transform: "translate(-50%, -50%)",
          }}
        >
          <div className="text-5xl">🐻</div>
        </div>

        {/* Coins */}
        {coins.map(
          (coin) =>
            !coin.collected && (
              <div
                key={coin.id}
                className="absolute animate-bounce"
                style={{
                  left: `${coin.x}%`,
                  top: `${coin.y}%`,
                  transform: "translate(-50%, -50%)",
                }}
              >
                <div className="text-3xl">🪙</div>
              </div>
            ),
        )}

        {/* Collected coins indicator */}
        <div className="absolute bottom-4 right-4 bg-white px-4 py-2 rounded-lg border-3 border-yellow-400">
          <span className="font-bold">
            Coins: {coins.filter((c) => c.collected).length}/{coins.length}
          </span>
        </div>
      </div>
    </GameLayout>
  );
}
