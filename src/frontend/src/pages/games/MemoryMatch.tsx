import { useEffect, useState } from "react";
import type { ModulePage } from "../../App";
import GameLayout from "../../components/GameLayout";

interface Card {
  id: number;
  emoji: string;
  flipped: boolean;
  matched: boolean;
}

interface MemoryMatchProps {
  onNavigate: (page: ModulePage) => void;
}

export default function MemoryMatch({ onNavigate }: MemoryMatchProps) {
  const [cards, setCards] = useState<Card[]>([]);
  const [flippedCards, setFlippedCards] = useState<number[]>([]);
  const [score, setScore] = useState(0);
  const [moves, setMoves] = useState(0);
  const [level, setLevel] = useState(1);
  const [gameOver, setGameOver] = useState(false);
  const [highScore, setHighScore] = useState(0);

  const emojis = [
    "🎮",
    "🎨",
    "🎭",
    "🎪",
    "🎯",
    "🎲",
    "🎸",
    "🎹",
    "🎺",
    "🎻",
    "🏀",
    "⚽",
    "🏈",
    "⚾",
    "🎾",
    "🏐",
  ];

  const initializeGame = (gridSize: number) => {
    const pairsNeeded = (gridSize * gridSize) / 2;
    const selectedEmojis = emojis.slice(0, pairsNeeded);
    const cardPairs = [...selectedEmojis, ...selectedEmojis];

    const shuffled = cardPairs
      .sort(() => Math.random() - 0.5)
      .map((emoji, index) => ({
        id: index,
        emoji,
        flipped: false,
        matched: false,
      }));

    setCards(shuffled);
    setFlippedCards([]);
    setMoves(0);
    setGameOver(false);
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: initializeGame is stable
  useEffect(() => {
    const gridSize = Math.min(4 + Math.floor(level / 2), 6);
    initializeGame(gridSize);
  }, [level]);

  useEffect(() => {
    if (flippedCards.length === 2) {
      const [first, second] = flippedCards;
      const firstCard = cards.find((c) => c.id === first);
      const secondCard = cards.find((c) => c.id === second);

      if (firstCard && secondCard && firstCard.emoji === secondCard.emoji) {
        setTimeout(() => {
          setCards((prev) =>
            prev.map((card) =>
              card.id === first || card.id === second
                ? { ...card, matched: true }
                : card,
            ),
          );
          setScore((prev) => prev + 10);
          setFlippedCards([]);
        }, 500);
      } else {
        setTimeout(() => {
          setCards((prev) =>
            prev.map((card) =>
              card.id === first || card.id === second
                ? { ...card, flipped: false }
                : card,
            ),
          );
          setFlippedCards([]);
        }, 1000);
      }
      setMoves((prev) => prev + 1);
    }
  }, [flippedCards, cards]);

  useEffect(() => {
    if (cards.length > 0 && cards.every((card) => card.matched)) {
      setLevel((prev) => prev + 1);
      setScore((prev) => prev + 50);
    }
  }, [cards]);

  useEffect(() => {
    if (gameOver && score > highScore) {
      setHighScore(score);
    }
  }, [gameOver, score, highScore]);

  const handleCardClick = (cardId: number) => {
    if (flippedCards.length >= 2 || flippedCards.includes(cardId)) return;

    const card = cards.find((c) => c.id === cardId);
    if (!card || card.matched) return;

    setCards((prev) =>
      prev.map((c) => (c.id === cardId ? { ...c, flipped: true } : c)),
    );
    setFlippedCards((prev) => [...prev, cardId]);
  };

  const startGame = () => {
    setScore(0);
    setLevel(1);
    setGameOver(false);
    initializeGame(4);
  };

  const gridSize = Math.min(4 + Math.floor(level / 2), 6);

  return (
    <GameLayout
      title="🧠 Memory Match"
      score={score}
      highScore={highScore}
      onRestart={startGame}
      onNavigate={onNavigate}
      gameOver={gameOver}
    >
      <div className="p-8 bg-gradient-to-br from-purple-200 to-pink-200 min-h-[600px]">
        <div className="max-w-4xl mx-auto">
          {/* Level and Moves */}
          <div className="flex justify-center gap-8 mb-6">
            <div className="bg-white px-6 py-3 rounded-lg border-4 border-purple-300">
              <span className="text-xl font-bold">Level: {level}</span>
            </div>
            <div className="bg-white px-6 py-3 rounded-lg border-4 border-pink-300">
              <span className="text-xl font-bold">Moves: {moves}</span>
            </div>
          </div>

          {/* Cards Grid */}
          <div
            className="grid gap-4 mx-auto"
            style={{
              gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))`,
              maxWidth: `${gridSize * 100}px`,
            }}
          >
            {cards.map((card) => (
              // biome-ignore lint/a11y/useKeyWithClickEvents: game card interaction
              <div
                key={card.id}
                className={`aspect-square cursor-pointer transition-all duration-300 ${
                  card.flipped || card.matched ? "rotate-0" : "rotate-y-180"
                }`}
                onClick={() => handleCardClick(card.id)}
              >
                <div
                  className={`w-full h-full rounded-lg border-4 flex items-center justify-center text-4xl font-bold transition-all ${
                    card.matched
                      ? "bg-green-300 border-green-500"
                      : card.flipped
                        ? "bg-white border-purple-300"
                        : "bg-purple-400 border-purple-600 hover:bg-purple-500"
                  }`}
                >
                  {card.flipped || card.matched ? card.emoji : "?"}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </GameLayout>
  );
}
