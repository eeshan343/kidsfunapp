import { Button } from "@/components/ui/button";
import { useState } from "react";
import type { ModulePage } from "../../App";
import GameLayout from "../../components/GameLayout";

interface BirthdayCakeMakerProps {
  onNavigate: (page: ModulePage) => void;
}

interface Decoration {
  id: number;
  type: string;
  x: number;
  y: number;
}

const BASES = [
  { id: "round", name: "Round", emoji: "⭕", points: 10 },
  { id: "square", name: "Square", emoji: "⬜", points: 10 },
  { id: "heart", name: "Heart", emoji: "❤️", points: 15 },
];

const FLAVORS = [
  { id: "chocolate", name: "Chocolate", color: "#8B4513", points: 10 },
  { id: "vanilla", name: "Vanilla", color: "#FFF8DC", points: 10 },
  { id: "strawberry", name: "Strawberry", color: "#FFB6C1", points: 10 },
  { id: "lemon", name: "Lemon", color: "#FFFACD", points: 10 },
];

const DECORATION_OPTIONS = [
  "🍓",
  "🍒",
  "🍫",
  "🍬",
  "🍭",
  "🌸",
  "⭐",
  "💝",
  "🎀",
  "🦄",
];

// Step index 4 = decorator canvas step (after finish step 3)
const DECORATOR_STEP = 4;

export default function BirthdayCakeMaker({
  onNavigate,
}: BirthdayCakeMakerProps) {
  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const [step, setStep] = useState(0);
  const [_cakeBase, setCakeBase] = useState("");
  const [cakeFlavor, setCakeFlavor] = useState("");
  const [cakeLayers, setCakeLayers] = useState(1);

  // Decorator state (used in step 4)
  const [decorations, setDecorations] = useState<Decoration[]>([]);
  const [selectedDecoration, setSelectedDecoration] = useState("🍓");
  const [nextId, setNextId] = useState(0);

  const startGame = () => {
    setScore(0);
    setGameOver(false);
    setStep(0);
    setCakeBase("");
    setCakeFlavor("");
    setCakeLayers(1);
    setDecorations([]);
    setNextId(0);
    setSelectedDecoration("🍓");
  };

  const selectBase = (base: string, points: number) => {
    setCakeBase(base);
    setScore((prev) => prev + points);
    setStep(1);
  };

  const selectFlavor = (flavor: string, points: number) => {
    setCakeFlavor(flavor);
    setScore((prev) => prev + points);
    setStep(2);
  };

  const selectLayers = (layers: number) => {
    setCakeLayers(layers);
    setScore((prev) => prev + layers * 10);
    setStep(3);
  };

  // Transition from finish step into the decorator canvas step
  const goToDecorator = () => {
    setScore((prev) => prev + 50);
    setStep(DECORATOR_STEP);
  };

  const handleCakeClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;

    setDecorations((prev) => [
      ...prev,
      { id: nextId, type: selectedDecoration, x, y },
    ]);
    setNextId((id) => id + 1);
    setScore((prev) => prev + 5);
  };

  const finishCake = () => {
    const finalScore = score + decorations.length * 10;
    setScore(finalScore);
    if (finalScore > highScore) {
      setHighScore(finalScore);
    }
    setGameOver(true);
  };

  const selectedFlavor = FLAVORS.find((f) => f.id === cakeFlavor);

  return (
    <GameLayout
      title="🎂 Birthday Cake Maker"
      score={score}
      highScore={highScore}
      onRestart={startGame}
      onNavigate={onNavigate}
      gameOver={gameOver}
    >
      <div className="p-8 bg-gradient-to-br from-pink-200 to-purple-200 min-h-[600px]">
        <div className="max-w-4xl mx-auto">
          {/* Step indicator */}
          <div className="flex items-center justify-center gap-2 mb-6 flex-wrap">
            {["Base", "Flavor", "Layers", "Finish", "Decorate"].map(
              (label, i) => (
                <div
                  key={label}
                  className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold border-2 ${
                    step >= i
                      ? "bg-purple-500 text-white border-purple-600"
                      : "bg-white text-purple-400 border-purple-200"
                  }`}
                >
                  <span>{i + 1}</span>
                  <span>{label}</span>
                </div>
              ),
            )}
          </div>

          {step === 0 && (
            <div className="text-center space-y-6">
              <h2 className="text-3xl font-bold">Choose Your Cake Base</h2>
              <div className="grid grid-cols-3 gap-4">
                {BASES.map((base) => (
                  <Button
                    key={base.id}
                    onClick={() => selectBase(base.id, base.points)}
                    className="h-32 text-6xl flex flex-col gap-2"
                    variant="outline"
                    data-ocid={`birthday-cake.base.option.${base.id}`}
                  >
                    <span>{base.emoji}</span>
                    <span className="text-lg">{base.name}</span>
                  </Button>
                ))}
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="text-center space-y-6">
              <h2 className="text-3xl font-bold">Choose Your Flavor</h2>
              <div className="grid grid-cols-2 gap-4">
                {FLAVORS.map((flavor) => (
                  <Button
                    key={flavor.id}
                    onClick={() => selectFlavor(flavor.id, flavor.points)}
                    className="h-32 text-2xl"
                    style={{ backgroundColor: flavor.color }}
                    data-ocid={`birthday-cake.flavor.option.${flavor.id}`}
                  >
                    {flavor.name}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="text-center space-y-6">
              <h2 className="text-3xl font-bold">How Many Layers?</h2>
              <div className="grid grid-cols-3 gap-4">
                {[1, 2, 3].map((layers) => (
                  <Button
                    key={layers}
                    onClick={() => selectLayers(layers)}
                    className="h-32 text-6xl"
                    variant="outline"
                    data-ocid={`birthday-cake.layers.option.${layers}`}
                  >
                    {layers}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="text-center space-y-6">
              <h2 className="text-3xl font-bold mb-6">Your Amazing Cake!</h2>
              <div className="flex flex-col items-center gap-2">
                {/* Layers stack smallest on top, largest on bottom */}
                {[...Array(cakeLayers)].map((_, i) => {
                  const layerIndex = cakeLayers - 1 - i;
                  return (
                    <div
                      // biome-ignore lint/suspicious/noArrayIndexKey: positional list
                      key={i}
                      className="border-4 border-white rounded-lg shadow-lg"
                      style={{
                        width: `${200 - layerIndex * 40}px`,
                        height: "80px",
                        backgroundColor: selectedFlavor?.color,
                      }}
                    />
                  );
                })}
                <div className="text-6xl mt-4">🕯️</div>
              </div>
              <Button
                onClick={goToDecorator}
                size="lg"
                className="text-xl"
                data-ocid="birthday-cake.go_to_decorator_button"
              >
                Decorate Your Cake! 🎨
              </Button>
            </div>
          )}

          {step === DECORATOR_STEP && (
            <div className="space-y-6">
              <div className="text-center">
                <h2 className="text-2xl font-bold mb-2">Decorate Your Cake!</h2>
                <p className="text-lg">Click on the cake to add decorations</p>
              </div>

              {/* Decoration Selector */}
              <div className="bg-white p-4 rounded-lg border-4 border-purple-300">
                <h3 className="font-bold mb-3">Choose Decoration:</h3>
                <div className="flex flex-wrap gap-2">
                  {DECORATION_OPTIONS.map((deco) => (
                    <Button
                      key={deco}
                      onClick={() => setSelectedDecoration(deco)}
                      variant={
                        selectedDecoration === deco ? "default" : "outline"
                      }
                      className="text-3xl w-16 h-16"
                      data-ocid={`birthday-cake.decoration.option.${deco}`}
                      aria-label={`Select ${deco} decoration`}
                    >
                      {deco}
                    </Button>
                  ))}
                </div>
              </div>

              {/* Cake Canvas — reuses the finished cake from step 3 */}
              {/* biome-ignore lint/a11y/useKeyWithClickEvents: game canvas interaction */}
              <div
                className="relative bg-gradient-to-b from-pink-300 to-pink-400 rounded-lg border-4 border-white shadow-2xl cursor-pointer"
                style={{ height: "400px" }}
                onClick={handleCakeClick}
                data-ocid="birthday-cake.decorator.canvas"
              >
                {/* Cake layers (built from maker choices) */}
                {/* Layers stack smallest on top, largest on bottom — same fix as
                    the Finish step (use layerIndex = cakeLayers - 1 - i). */}
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 flex flex-col items-center gap-2">
                  {[...Array(cakeLayers)].map((_, i) => {
                    const layerIndex = cakeLayers - 1 - i;
                    return (
                      <div
                        // biome-ignore lint/suspicious/noArrayIndexKey: positional list
                        key={i}
                        className="border-4 border-white rounded-lg shadow-lg"
                        style={{
                          width: `${256 - layerIndex * 32}px`,
                          height: "80px",
                          backgroundColor: selectedFlavor?.color,
                        }}
                      />
                    );
                  })}
                  {/* Candles on top of the cake */}
                  <div className="flex items-end justify-center gap-2 pb-1">
                    {Array.from({ length: Math.max(cakeLayers, 1) }).map(
                      (_, i) => (
                        <div
                          // biome-ignore lint/suspicious/noArrayIndexKey: positional list
                          key={i}
                          className="text-3xl leading-none"
                          style={{
                            animation: "flicker 1.2s ease-in-out infinite",
                          }}
                        >
                          🕯️
                        </div>
                      ),
                    )}
                  </div>
                </div>

                {/* Placed decorations */}
                {decorations.map((deco) => (
                  <div
                    key={deco.id}
                    className="absolute text-3xl pointer-events-none"
                    style={{
                      left: `${deco.x}%`,
                      top: `${deco.y}%`,
                      transform: "translate(-50%, -50%)",
                    }}
                  >
                    {deco.type}
                  </div>
                ))}
              </div>

              <div className="flex gap-4">
                <Button
                  onClick={finishCake}
                  size="lg"
                  className="flex-1 text-xl"
                  data-ocid="birthday-cake.finish_button"
                >
                  Finish Cake! 🎉
                </Button>
                <Button
                  onClick={() => setDecorations([])}
                  variant="outline"
                  size="lg"
                  className="flex-1 text-xl"
                  data-ocid="birthday-cake.clear_button"
                >
                  Clear All
                </Button>
              </div>

              <div className="text-center text-lg font-semibold">
                Decorations Added: {decorations.length}
              </div>
            </div>
          )}
        </div>
      </div>
    </GameLayout>
  );
}
