import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Clock, Sparkles, Star, Trophy } from "lucide-react";
import { useEffect, useRef, useState } from "react";

interface InstantMiniActivityProps {
  onGetStarted: () => void;
}

type AgeGroup = "1-3" | "4-6" | "7-12" | null;
type GameState = "idle" | "playing" | "completed";

export default function InstantMiniActivity({
  onGetStarted,
}: InstantMiniActivityProps) {
  const [selectedAge, setSelectedAge] = useState<AgeGroup>(null);
  const [gameState, setGameState] = useState<GameState>("idle");
  const _canvasRef = useRef<HTMLCanvasElement>(null);
  const gameLoopRef = useRef<number | null>(null);

  // Ages 1-3: Tap & Smile state
  const [tapSmileScore, setTapSmileScore] = useState(0);
  const [_tapSmileTime, setTapSmileTime] = useState(0);
  const [animals, setAnimals] = useState<
    Array<{ x: number; y: number; emoji: string; id: number }>
  >([]);
  const [balloons, setBalloons] = useState<
    Array<{ x: number; y: number; color: string; id: number }>
  >([]);

  // Ages 4-6: Match & Move state
  const [matchMoveScore, setMatchMoveScore] = useState(0);
  const [matchMoveTime, setMatchMoveTime] = useState(30);
  const [shapes, setShapes] = useState<
    Array<{
      x: number;
      y: number;
      shape: string;
      color: string;
      id: number;
      matched: boolean;
    }>
  >([]);
  const [draggedShape, setDraggedShape] = useState<number | null>(null);

  // Ages 7-12: Challenge Mode state
  const [challengeScore, setChallengeScore] = useState(0);
  const [challengeTime, setChallengeTime] = useState(30);
  const [collectibles, setCollectibles] = useState<
    Array<{ x: number; y: number; id: number }>
  >([]);
  const [obstacles, setObstacles] = useState<
    Array<{ x: number; y: number; id: number }>
  >([]);
  const [_playerPos, _setPlayerPos] = useState({ x: 200, y: 300 });

  // Initialize game based on age group
  useEffect(() => {
    if (selectedAge && gameState === "playing") {
      if (selectedAge === "1-3") {
        initTapSmile();
      } else if (selectedAge === "4-6") {
        initMatchMove();
      } else if (selectedAge === "7-12") {
        initChallenge();
      }
    }

    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [selectedAge, gameState]);

  // Ages 1-3: Tap & Smile Game
  const initTapSmile = () => {
    const animalEmojis = ["🐶", "🐱", "🐰", "🐻", "🐼", "🦁", "🐯", "🐸"];
    const newAnimals = Array.from({ length: 5 }, (_, i) => ({
      x: Math.random() * 350 + 25,
      y: Math.random() * 250 + 50,
      emoji: animalEmojis[Math.floor(Math.random() * animalEmojis.length)],
      id: i,
    }));
    setAnimals(newAnimals);

    const balloonColors = [
      "#FF1493",
      "#00FFFF",
      "#00FF00",
      "#FF4500",
      "#9370DB",
    ];
    const newBalloons = Array.from({ length: 3 }, (_, i) => ({
      x: Math.random() * 350 + 25,
      y: Math.random() * 250 + 50,
      color: balloonColors[Math.floor(Math.random() * balloonColors.length)],
      id: i + 100,
    }));
    setBalloons(newBalloons);

    let startTime = Date.now();
    const gameLoop = () => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      setTapSmileTime(elapsed);

      if (elapsed >= 40) {
        setGameState("completed");
        return;
      }

      gameLoopRef.current = requestAnimationFrame(gameLoop);
    };
    gameLoop();
  };

  const handleTapSmileClick = (id: number, type: "animal" | "balloon") => {
    if (type === "animal") {
      setAnimals((prev) => prev.filter((a) => a.id !== id));
      setTapSmileScore((prev) => prev + 1);
      playSound("cheer");
    } else {
      setBalloons((prev) => prev.filter((b) => b.id !== id));
      setTapSmileScore((prev) => prev + 1);
      playSound("pop");
    }
  };

  // Ages 4-6: Match & Move Game
  const initMatchMove = () => {
    const shapeTypes = ["circle", "square", "triangle", "star"];
    const colors = ["#FF1493", "#00FFFF", "#00FF00", "#FF4500"];

    const newShapes = shapeTypes.map((shape, i) => ({
      x: 50 + i * 90,
      y: 100,
      shape,
      color: colors[i],
      id: i,
      matched: false,
    }));
    setShapes(newShapes);

    let startTime = Date.now();
    const gameLoop = () => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      const remaining = Math.max(0, 30 - elapsed);
      setMatchMoveTime(remaining);

      if (remaining === 0 || shapes.every((s) => s.matched)) {
        setGameState("completed");
        return;
      }

      gameLoopRef.current = requestAnimationFrame(gameLoop);
    };
    gameLoop();
  };

  const handleShapeDragStart = (id: number) => {
    setDraggedShape(id);
  };

  const handleShapeDrop = (targetId: number) => {
    if (draggedShape === targetId) {
      setShapes((prev) =>
        prev.map((s) => (s.id === targetId ? { ...s, matched: true } : s)),
      );
      setMatchMoveScore((prev) => prev + 1);
      playSound("success");

      if (shapes.filter((s) => !s.matched).length === 1) {
        setTimeout(() => setGameState("completed"), 500);
      }
    }
    setDraggedShape(null);
  };

  // Ages 7-12: Challenge Mode Game
  const initChallenge = () => {
    const newCollectibles = Array.from({ length: 8 }, (_, i) => ({
      x: Math.random() * 350 + 25,
      y: Math.random() * 250 + 50,
      id: i,
    }));
    setCollectibles(newCollectibles);

    const newObstacles = Array.from({ length: 5 }, (_, i) => ({
      x: Math.random() * 350 + 25,
      y: Math.random() * 250 + 50,
      id: i + 100,
    }));
    setObstacles(newObstacles);

    let startTime = Date.now();
    const gameLoop = () => {
      const elapsed = Math.floor((Date.now() - startTime) / 1000);
      const remaining = Math.max(0, 30 - elapsed);
      setChallengeTime(remaining);

      if (remaining === 0 || collectibles.length === 0) {
        setGameState("completed");
        return;
      }

      gameLoopRef.current = requestAnimationFrame(gameLoop);
    };
    gameLoop();
  };

  const handleChallengeClick = (x: number, y: number) => {
    const clickedCollectible = collectibles.find(
      (c) => Math.abs(c.x - x) < 20 && Math.abs(c.y - y) < 20,
    );

    if (clickedCollectible) {
      setCollectibles((prev) =>
        prev.filter((c) => c.id !== clickedCollectible.id),
      );
      setChallengeScore((prev) => prev + 1);
      playSound("collect");
    }
  };

  const playSound = (type: string) => {
    // Placeholder for sound effects
    console.log(`Playing sound: ${type}`);
  };

  const handleStartGame = () => {
    setGameState("playing");
    setTapSmileScore(0);
    setMatchMoveScore(0);
    setChallengeScore(0);
    setTapSmileTime(0);
    setMatchMoveTime(30);
    setChallengeTime(30);
  };

  const handleReplay = () => {
    setGameState("idle");
    setSelectedAge(null);
  };

  const renderReward = () => {
    if (selectedAge === "1-3") {
      return (
        <div className="text-center py-8 animate-bounce">
          <div className="text-6xl mb-4">⭐✨⭐</div>
          <h3 className="text-3xl font-bold text-neon-pink text-shadow-neon-lg mb-2">
            Stickers Rain!
          </h3>
          <p className="text-xl text-neon-cyan text-shadow-neon-md">
            You tapped {tapSmileScore} times! Amazing!
          </p>
        </div>
      );
    }
    if (selectedAge === "4-6") {
      return (
        <div className="text-center py-8 animate-bounce">
          <div className="text-6xl mb-4">⭐⭐</div>
          <h3 className="text-3xl font-bold text-neon-green text-shadow-neon-lg mb-2">
            Great Matching!
          </h3>
          <p className="text-xl text-neon-cyan text-shadow-neon-md">
            You matched {matchMoveScore} shapes! Hooray!
          </p>
        </div>
      );
    }
    return (
      <div className="text-center py-8 animate-bounce">
        <div className="text-6xl mb-4">⭐⭐⭐</div>
        <h3 className="text-3xl font-bold text-neon-orange text-shadow-neon-lg mb-2">
          Badge Unlocked!
        </h3>
        <p className="text-xl text-neon-cyan text-shadow-neon-md">
          You collected {challengeScore} items! Awesome!
        </p>
      </div>
    );
  };

  if (!selectedAge) {
    return (
      <section className="py-12 px-4">
        <div className="container mx-auto max-w-5xl">
          <div className="text-center mb-8">
            <div className="flex justify-center mb-4">
              <Sparkles className="w-12 h-12 text-neon-pink animate-neon-pulse" />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-neon-pink text-shadow-neon-lg mb-3">
              Try a Mini-Game Now!
            </h2>
            <p className="text-lg md:text-xl text-neon-cyan text-shadow-neon-md">
              No login needed! Pick your age and start playing instantly!
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card
              onClick={() => setSelectedAge("1-3")}
              className="bg-card/90 backdrop-blur-md border-4 border-neon-pink shadow-neon-lg hover:shadow-neon-xl transition-all duration-300 hover:scale-105 cursor-pointer"
            >
              <CardHeader>
                <div className="text-5xl mb-2 text-center">🎈</div>
                <CardTitle className="text-2xl font-bold text-neon-pink text-shadow-neon-md text-center">
                  Ages 1-3
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-center text-foreground text-lg">
                  <strong className="text-neon-cyan">Tap & Smile</strong>
                  <br />
                  Tap animals and pop balloons!
                </CardDescription>
              </CardContent>
            </Card>

            <Card
              onClick={() => setSelectedAge("4-6")}
              className="bg-card/90 backdrop-blur-md border-4 border-neon-green shadow-neon-lg hover:shadow-neon-xl transition-all duration-300 hover:scale-105 cursor-pointer"
            >
              <CardHeader>
                <div className="text-5xl mb-2 text-center">🔷</div>
                <CardTitle className="text-2xl font-bold text-neon-green text-shadow-neon-md text-center">
                  Ages 4-6
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-center text-foreground text-lg">
                  <strong className="text-neon-cyan">Match & Move</strong>
                  <br />
                  Drag and match shapes!
                </CardDescription>
              </CardContent>
            </Card>

            <Card
              onClick={() => setSelectedAge("7-12")}
              className="bg-card/90 backdrop-blur-md border-4 border-neon-orange shadow-neon-lg hover:shadow-neon-xl transition-all duration-300 hover:scale-105 cursor-pointer"
            >
              <CardHeader>
                <div className="text-5xl mb-2 text-center">🎯</div>
                <CardTitle className="text-2xl font-bold text-neon-orange text-shadow-neon-md text-center">
                  Ages 7-12
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-center text-foreground text-lg">
                  <strong className="text-neon-cyan">Challenge Mode</strong>
                  <br />
                  Beat the clock and collect!
                </CardDescription>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>
    );
  }

  if (gameState === "idle") {
    return (
      <section className="py-12 px-4">
        <div className="container mx-auto max-w-3xl">
          <Card className="bg-card/90 backdrop-blur-md border-4 border-neon-purple shadow-neon-lg">
            <CardHeader>
              <CardTitle className="text-3xl font-bold text-neon-pink text-shadow-neon-lg text-center">
                {selectedAge === "1-3" && "🎈 Tap & Smile"}
                {selectedAge === "4-6" && "🔷 Match & Move"}
                {selectedAge === "7-12" && "🎯 Challenge Mode"}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="text-center">
                <p className="text-xl text-foreground mb-4">
                  {selectedAge === "1-3" &&
                    "Tap on the cute animals and pop the colorful balloons! Have fun!"}
                  {selectedAge === "4-6" &&
                    "Drag each shape to its matching spot. You have 30 seconds!"}
                  {selectedAge === "7-12" &&
                    "Tap to collect items and avoid obstacles. Beat the clock!"}
                </p>
              </div>
              <div className="flex gap-4 justify-center">
                <Button
                  onClick={handleStartGame}
                  size="lg"
                  className="text-xl px-8 py-6 font-bold shadow-neon-lg hover:shadow-neon-xl transition-all bg-gradient-to-r from-neon-pink to-neon-purple"
                >
                  <Sparkles className="w-6 h-6 mr-2" />
                  Start Playing!
                </Button>
                <Button
                  onClick={() => setSelectedAge(null)}
                  size="lg"
                  variant="outline"
                  className="text-xl px-8 py-6 font-bold border-2 border-neon-cyan"
                >
                  Back
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    );
  }

  if (gameState === "completed") {
    return (
      <section className="py-12 px-4">
        <div className="container mx-auto max-w-3xl">
          <Card className="bg-card/90 backdrop-blur-md border-4 border-neon-pink shadow-neon-xl">
            <CardContent className="py-8">
              {renderReward()}
              <div className="flex gap-4 justify-center mt-6">
                <Button
                  onClick={handleReplay}
                  size="lg"
                  className="text-xl px-8 py-6 font-bold shadow-neon-lg hover:shadow-neon-xl transition-all bg-gradient-to-r from-neon-green to-neon-cyan"
                >
                  <Trophy className="w-6 h-6 mr-2" />
                  Play Again
                </Button>
                <Button
                  onClick={onGetStarted}
                  size="lg"
                  className="text-xl px-8 py-6 font-bold shadow-neon-lg hover:shadow-neon-xl transition-all bg-gradient-to-r from-neon-pink to-neon-purple"
                >
                  <Sparkles className="w-6 h-6 mr-2" />
                  Explore Full App!
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    );
  }

  // Playing state
  return (
    <section className="py-12 px-4">
      <div className="container mx-auto max-w-4xl">
        <Card className="bg-card/90 backdrop-blur-md border-4 border-neon-purple shadow-neon-lg">
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="text-2xl font-bold text-neon-pink text-shadow-neon-lg">
                {selectedAge === "1-3" && "🎈 Tap & Smile"}
                {selectedAge === "4-6" && "🔷 Match & Move"}
                {selectedAge === "7-12" && "🎯 Challenge Mode"}
              </CardTitle>
              <div className="flex items-center gap-4">
                {selectedAge === "1-3" && (
                  <div className="text-xl font-bold text-neon-cyan text-shadow-neon-md">
                    Taps: {tapSmileScore}
                  </div>
                )}
                {selectedAge === "4-6" && (
                  <>
                    <div className="text-xl font-bold text-neon-cyan text-shadow-neon-md">
                      Matched: {matchMoveScore}/4
                    </div>
                    <div className="flex items-center gap-2 text-xl font-bold text-neon-orange text-shadow-neon-md">
                      <Clock className="w-5 h-5" />
                      {matchMoveTime}s
                    </div>
                  </>
                )}
                {selectedAge === "7-12" && (
                  <>
                    <div className="text-xl font-bold text-neon-cyan text-shadow-neon-md">
                      Score: {challengeScore}
                    </div>
                    <div className="flex items-center gap-2 text-xl font-bold text-neon-orange text-shadow-neon-md">
                      <Clock className="w-5 h-5" />
                      {challengeTime}s
                    </div>
                  </>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div
              className="relative bg-background/50 rounded-lg border-2 border-neon-cyan shadow-neon-md"
              style={{ height: "400px" }}
            >
              {/* Ages 1-3: Tap & Smile */}
              {selectedAge === "1-3" && (
                <>
                  {animals.map((animal) => (
                    <button
                      key={animal.id}
                      type="button"
                      onClick={() => handleTapSmileClick(animal.id, "animal")}
                      className="absolute text-5xl hover:scale-125 transition-transform cursor-pointer"
                      style={{ left: `${animal.x}px`, top: `${animal.y}px` }}
                    >
                      {animal.emoji}
                    </button>
                  ))}
                  {balloons.map((balloon) => (
                    <button
                      key={balloon.id}
                      type="button"
                      onClick={() => handleTapSmileClick(balloon.id, "balloon")}
                      className="absolute text-5xl hover:scale-125 transition-transform cursor-pointer"
                      style={{ left: `${balloon.x}px`, top: `${balloon.y}px` }}
                    >
                      🎈
                    </button>
                  ))}
                </>
              )}

              {/* Ages 4-6: Match & Move */}
              {selectedAge === "4-6" && (
                <div className="flex flex-col items-center justify-center h-full gap-8">
                  <div className="flex gap-6">
                    {shapes.map((shape) => (
                      <div
                        key={shape.id}
                        draggable={!shape.matched}
                        onDragStart={() => handleShapeDragStart(shape.id)}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={() => handleShapeDrop(shape.id)}
                        className={`w-20 h-20 flex items-center justify-center cursor-move border-4 rounded-lg transition-all ${
                          shape.matched
                            ? "opacity-50 scale-90"
                            : "hover:scale-110"
                        }`}
                        style={{
                          borderColor: shape.color,
                          backgroundColor: shape.matched
                            ? shape.color
                            : "transparent",
                        }}
                      >
                        {shape.shape === "circle" && (
                          <div
                            className="w-12 h-12 rounded-full"
                            style={{ backgroundColor: shape.color }}
                          />
                        )}
                        {shape.shape === "square" && (
                          <div
                            className="w-12 h-12"
                            style={{ backgroundColor: shape.color }}
                          />
                        )}
                        {shape.shape === "triangle" && (
                          <div
                            className="w-0 h-0 border-l-[24px] border-r-[24px] border-b-[40px] border-l-transparent border-r-transparent"
                            style={{ borderBottomColor: shape.color }}
                          />
                        )}
                        {shape.shape === "star" && (
                          <Star
                            className="w-12 h-12"
                            style={{ color: shape.color, fill: shape.color }}
                          />
                        )}
                      </div>
                    ))}
                  </div>
                  <p className="text-lg text-neon-cyan text-shadow-neon-md">
                    Drag each shape to match it!
                  </p>
                </div>
              )}

              {/* Ages 7-12: Challenge Mode */}
              {selectedAge === "7-12" && (
                <div
                  className="relative w-full h-full"
                  onClick={(e) => {
                    const rect = e.currentTarget.getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const y = e.clientY - rect.top;
                    handleChallengeClick(x, y);
                  }}
                  onKeyUp={(e) => {
                    if (e.key === "Enter" || e.key === " ")
                      handleChallengeClick(200, 200);
                  }}
                >
                  {collectibles.map((item) => (
                    <div
                      key={item.id}
                      className="absolute text-4xl animate-bounce cursor-pointer"
                      style={{ left: `${item.x}px`, top: `${item.y}px` }}
                    >
                      ⭐
                    </div>
                  ))}
                  {obstacles.map((obs) => (
                    <div
                      key={obs.id}
                      className="absolute text-4xl"
                      style={{ left: `${obs.x}px`, top: `${obs.y}px` }}
                    >
                      🚫
                    </div>
                  ))}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </section>
  );
}
