import { useEffect, useRef, useState } from "react";
import type { ModulePage } from "../../App";
import GameLayout from "../../components/GameLayout";

interface GrandmaSecretArcadeProps {
  onNavigate: (page: ModulePage) => void;
}

type MiniGame = "menu" | "whack" | "catch" | "memory";

export default function GrandmaSecretArcade({
  onNavigate,
}: GrandmaSecretArcadeProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [currentGame, setCurrentGame] = useState<MiniGame>("menu");
  const [grandmaMessage, setGrandmaMessage] = useState(
    "Welcome to Grandma's Arcade, dear!",
  );

  const gameStateRef = useRef({
    // Whack-a-mole
    moles: Array(9).fill(false),
    moleTimer: 0,
    // Catch game
    fallingItems: [] as { x: number; y: number; type: "cookie" | "bomb" }[],
    basketX: 400,
    spawnTimer: 0,
    // Memory game
    memoryCards: [] as number[],
    flippedCards: [] as number[],
    matchedCards: [] as number[],
  });

  const messages = [
    "You're doing great, sweetie!",
    "Just like the old days!",
    "Grandma's proud of you!",
    "Keep it up, dear!",
    "Wonderful job, honey!",
  ];

  const initGame = () => {
    setScore(0);
    setCurrentGame("menu");
    setGameOver(false);
    setGrandmaMessage("Welcome to Grandma's Arcade, dear!");
  };

  const handleRestart = () => {
    initGame();
  };

  const startMiniGame = (game: MiniGame) => {
    setCurrentGame(game);
    setGrandmaMessage(messages[Math.floor(Math.random() * messages.length)]);

    if (game === "memory") {
      const cards = [1, 1, 2, 2, 3, 3, 4, 4, 5, 5, 6, 6];
      gameStateRef.current.memoryCards = cards.sort(() => Math.random() - 0.5);
      gameStateRef.current.flippedCards = [];
      gameStateRef.current.matchedCards = [];
    } else if (game === "whack") {
      gameStateRef.current.moles = Array(9).fill(false);
      gameStateRef.current.moleTimer = 0;
    } else if (game === "catch") {
      gameStateRef.current.fallingItems = [];
      gameStateRef.current.basketX = 400;
      gameStateRef.current.spawnTimer = 0;
    }
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: initGame is stable
  useEffect(() => {
    initGame();
  }, []);

  // biome-ignore lint/correctness/useExhaustiveDependencies: startMiniGame is stable closure
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const handleClick = (e: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;

      if (currentGame === "menu") {
        // Menu buttons
        if (y > 200 && y < 260) {
          if (x > 150 && x < 350) startMiniGame("whack");
          else if (x > 450 && x < 650) startMiniGame("catch");
        }
        if (y > 300 && y < 360 && x > 300 && x < 500) {
          startMiniGame("memory");
        }
      } else if (currentGame === "whack") {
        // Whack-a-mole
        const col = Math.floor(x / 266);
        const row = Math.floor((y - 100) / 150);
        const idx = row * 3 + col;
        if (idx >= 0 && idx < 9 && gameStateRef.current.moles[idx]) {
          gameStateRef.current.moles[idx] = false;
          setScore((s) => s + 10);
          setGrandmaMessage(
            messages[Math.floor(Math.random() * messages.length)],
          );
        }
      } else if (currentGame === "memory") {
        // Memory game
        const col = Math.floor(x / 133);
        const row = Math.floor((y - 100) / 120);
        const idx = row * 6 + col;

        const state = gameStateRef.current;
        if (
          idx >= 0 &&
          idx < 12 &&
          !state.matchedCards.includes(idx) &&
          !state.flippedCards.includes(idx) &&
          state.flippedCards.length < 2
        ) {
          state.flippedCards.push(idx);

          if (state.flippedCards.length === 2) {
            const [first, second] = state.flippedCards;
            if (state.memoryCards[first] === state.memoryCards[second]) {
              state.matchedCards.push(first, second);
              setScore((s) => s + 20);
              state.flippedCards = [];
              if (state.matchedCards.length === 12) {
                setGameOver(true);
                if (score > highScore) setHighScore(score);
              }
            } else {
              setTimeout(() => {
                state.flippedCards = [];
              }, 1000);
            }
          }
        }
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (currentGame === "catch") {
        const state = gameStateRef.current;
        if (e.key === "ArrowLeft" || e.key === "a") state.basketX -= 20;
        if (e.key === "ArrowRight" || e.key === "d") state.basketX += 20;
        state.basketX = Math.max(50, Math.min(750, state.basketX));
      }
      if (e.key === "Escape") {
        setCurrentGame("menu");
      }
    };

    canvas.addEventListener("click", handleClick);
    window.addEventListener("keydown", handleKeyDown);

    let animationId: number;
    let lastTime = 0;

    const gameLoop = (timestamp: number) => {
      const deltaTime = timestamp - lastTime;
      lastTime = timestamp;

      const state = gameStateRef.current;

      // Update whack-a-mole
      if (currentGame === "whack" && !gameOver) {
        state.moleTimer += deltaTime;
        if (state.moleTimer > 800) {
          state.moleTimer = 0;
          const idx = Math.floor(Math.random() * 9);
          state.moles[idx] = true;
          setTimeout(() => {
            state.moles[idx] = false;
          }, 600);
        }
      }

      // Update catch game
      if (currentGame === "catch" && !gameOver) {
        state.spawnTimer += deltaTime;
        if (state.spawnTimer > 1000) {
          state.spawnTimer = 0;
          state.fallingItems.push({
            x: 50 + Math.random() * 700,
            y: 0,
            type: Math.random() > 0.3 ? "cookie" : "bomb",
          });
        }

        for (let idx = state.fallingItems.length - 1; idx >= 0; idx--) {
          const item = state.fallingItems[idx];
          item.y += 3;

          // Check catch
          if (item.y > 520 && item.y < 560) {
            if (Math.abs(item.x - state.basketX) < 50) {
              if (item.type === "cookie") {
                setScore((s) => s + 10);
                setGrandmaMessage(
                  messages[Math.floor(Math.random() * messages.length)],
                );
              } else {
                setScore((s) => Math.max(0, s - 20));
                setGrandmaMessage("Oh dear, watch out for those!");
              }
              state.fallingItems.splice(idx, 1);
            }
          }

          // Remove off-screen
          if (item.y > 600) {
            state.fallingItems.splice(idx, 1);
          }
        }
      }

      // Render
      ctx.fillStyle = "#FFF5E1";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw grandma
      ctx.fillStyle = "#8B4513";
      ctx.fillRect(650, 20, 140, 80);
      ctx.fillStyle = "#FFE4C4";
      ctx.beginPath();
      ctx.arc(720, 50, 30, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = "#000";
      ctx.font = "48px Arial";
      ctx.textAlign = "center";
      ctx.fillText("👵", 720, 60);

      // Grandma message
      ctx.fillStyle = "#fff";
      ctx.fillRect(500, 100, 290, 60);
      ctx.strokeStyle = "#8B4513";
      ctx.lineWidth = 3;
      ctx.strokeRect(500, 100, 290, 60);
      ctx.fillStyle = "#000";
      ctx.font = "16px Arial";
      ctx.textAlign = "center";
      ctx.fillText(grandmaMessage, 645, 135);

      if (currentGame === "menu") {
        // Menu
        ctx.fillStyle = "#8B4513";
        ctx.font = "bold 32px Arial";
        ctx.textAlign = "center";
        ctx.fillText("Grandma's Secret Arcade", 400, 150);

        // Buttons
        ctx.fillStyle = "#FF6B6B";
        ctx.fillRect(150, 200, 200, 60);
        ctx.fillRect(450, 200, 200, 60);
        ctx.fillRect(300, 300, 200, 60);

        ctx.fillStyle = "#fff";
        ctx.font = "bold 24px Arial";
        ctx.fillText("Whack-a-Mole", 250, 240);
        ctx.fillText("Cookie Catch", 550, 240);
        ctx.fillText("Memory Match", 400, 340);
      } else if (currentGame === "whack") {
        // Whack-a-mole game
        ctx.fillStyle = "#8B4513";
        ctx.font = "bold 24px Arial";
        ctx.textAlign = "left";
        ctx.fillText("Whack-a-Mole!", 20, 50);
        ctx.fillText("Click ESC for menu", 20, 80);

        for (let i = 0; i < 9; i++) {
          const col = i % 3;
          const row = Math.floor(i / 3);
          const x = col * 266 + 50;
          const y = row * 150 + 100;

          ctx.fillStyle = "#8B4513";
          ctx.fillRect(x, y, 200, 120);

          if (state.moles[i]) {
            ctx.fillStyle = "#FFD700";
            ctx.beginPath();
            ctx.arc(x + 100, y + 60, 40, 0, Math.PI * 2);
            ctx.fill();
            ctx.fillStyle = "#000";
            ctx.font = "48px Arial";
            ctx.textAlign = "center";
            ctx.fillText("🐹", x + 100, y + 75);
          }
        }
      } else if (currentGame === "catch") {
        // Cookie catch game
        ctx.fillStyle = "#8B4513";
        ctx.font = "bold 24px Arial";
        ctx.textAlign = "left";
        ctx.fillText("Cookie Catch!", 20, 50);
        ctx.fillText("Arrow keys or AD to move", 20, 80);

        // Draw falling items
        for (const item of state.fallingItems) {
          ctx.fillStyle = item.type === "cookie" ? "#FFD700" : "#FF4444";
          ctx.beginPath();
          ctx.arc(item.x, item.y, 20, 0, Math.PI * 2);
          ctx.fill();
          ctx.fillStyle = "#fff";
          ctx.font = "28px Arial";
          ctx.textAlign = "center";
          ctx.fillText(
            item.type === "cookie" ? "🍪" : "💣",
            item.x,
            item.y + 10,
          );
        }

        // Draw basket
        ctx.fillStyle = "#8B4513";
        ctx.fillRect(state.basketX - 50, 540, 100, 40);
        ctx.fillStyle = "#fff";
        ctx.font = "32px Arial";
        ctx.textAlign = "center";
        ctx.fillText("🧺", state.basketX, 565);
      } else if (currentGame === "memory") {
        // Memory match game
        ctx.fillStyle = "#8B4513";
        ctx.font = "bold 24px Arial";
        ctx.textAlign = "left";
        ctx.fillText("Memory Match!", 20, 50);
        ctx.fillText("Click cards to match", 20, 80);

        for (let i = 0; i < 12; i++) {
          const col = i % 6;
          const row = Math.floor(i / 6);
          const x = col * 133 + 10;
          const y = row * 120 + 100;

          const isFlipped =
            state.flippedCards.includes(i) || state.matchedCards.includes(i);

          if (isFlipped) {
            ctx.fillStyle = "#FFD700";
            ctx.fillRect(x, y, 120, 100);
            ctx.fillStyle = "#000";
            ctx.font = "48px Arial";
            ctx.textAlign = "center";
            const emojis = ["🍪", "🎂", "🍰", "🧁", "🍩", "🥧"];
            ctx.fillText(emojis[state.memoryCards[i] - 1], x + 60, y + 65);
          } else {
            ctx.fillStyle = "#FF6B6B";
            ctx.fillRect(x, y, 120, 100);
            ctx.fillStyle = "#fff";
            ctx.font = "48px Arial";
            ctx.textAlign = "center";
            ctx.fillText("?", x + 60, y + 65);
          }

          ctx.strokeStyle = "#8B4513";
          ctx.lineWidth = 3;
          ctx.strokeRect(x, y, 120, 100);
        }
      }

      animationId = requestAnimationFrame(gameLoop);
    };

    animationId = requestAnimationFrame(gameLoop);

    return () => {
      cancelAnimationFrame(animationId);
      canvas.removeEventListener("click", handleClick);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [currentGame, gameOver, score, highScore, grandmaMessage]);

  return (
    <GameLayout
      title="Grandma's Secret Arcade 👵"
      score={score}
      highScore={highScore}
      onRestart={handleRestart}
      onNavigate={onNavigate}
      gameOver={gameOver}
    >
      <div className="flex flex-col items-center justify-center p-4 bg-gradient-to-br from-orange-100 to-yellow-100">
        <div className="mb-4 text-center">
          <p className="text-lg font-semibold">
            Play retro minigames with Grandma!
          </p>
          <p className="text-sm text-gray-600">Choose a game from the menu</p>
        </div>
        <canvas
          ref={canvasRef}
          width={800}
          height={600}
          className="border-4 border-orange-400 rounded-lg shadow-lg bg-white cursor-pointer"
        />
      </div>
    </GameLayout>
  );
}
