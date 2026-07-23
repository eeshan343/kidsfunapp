import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Camera, CameraOff, Pause, Play } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { ModulePage } from "../App";
import { useCamera } from "../camera/useCamera";

interface DanceChallengePageProps {
  onNavigate: (page: ModulePage) => void;
}

interface DanceRoutine {
  id: string;
  title: string;
  difficulty: "Easy" | "Medium" | "Hard";
  duration: number;
  poses: string[];
}

const routines: DanceRoutine[] = [
  {
    id: "beginner",
    title: "Happy Dance",
    difficulty: "Easy",
    duration: 30,
    poses: [
      "Wave your hands",
      "Jump up",
      "Spin around",
      "Clap your hands",
      "Strike a pose!",
    ],
  },
  {
    id: "intermediate",
    title: "Groove Master",
    difficulty: "Medium",
    duration: 45,
    poses: [
      "Side step left",
      "Side step right",
      "Jump and turn",
      "Wave arms up",
      "Freeze!",
    ],
  },
  {
    id: "advanced",
    title: "Dance Champion",
    difficulty: "Hard",
    duration: 60,
    poses: [
      "Moonwalk",
      "Spin twice",
      "Jump high",
      "Wave like a robot",
      "Final pose!",
    ],
  },
];

export default function DanceChallengePage({
  onNavigate,
}: DanceChallengePageProps) {
  const [selectedRoutine, setSelectedRoutine] = useState<DanceRoutine | null>(
    null,
  );
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentPose, setCurrentPose] = useState(0);
  const [showCamera, setShowCamera] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const {
    isActive,
    isSupported,
    error,
    startCamera,
    stopCamera,
    videoRef,
    canvasRef,
  } = useCamera({
    facingMode: "user",
    width: 640,
    height: 480,
  });

  const handleRoutineSelect = (routine: DanceRoutine) => {
    setSelectedRoutine(routine);
    setIsPlaying(false);
    setCurrentPose(0);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  };

  const handlePlayPause = () => {
    if (!selectedRoutine) return;

    if (isPlaying) {
      setIsPlaying(false);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    } else {
      setIsPlaying(true);
      const poseInterval =
        (selectedRoutine.duration * 1000) / selectedRoutine.poses.length;
      intervalRef.current = setInterval(() => {
        setCurrentPose((prev) => {
          if (prev >= selectedRoutine.poses.length - 1) {
            setIsPlaying(false);
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
            }
            return 0;
          }
          return prev + 1;
        });
      }, poseInterval);
    }
  };

  const handleToggleCamera = async () => {
    if (showCamera) {
      await stopCamera();
      setShowCamera(false);
    } else {
      setShowCamera(true);
      await startCamera();
    }
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: cleanup effect, stopCamera is stable
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
      stopCamera();
    };
  }, []);

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Easy":
        return "bg-green-500";
      case "Medium":
        return "bg-yellow-500";
      case "Hard":
        return "bg-red-500";
      default:
        return "bg-gray-500";
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">
          Dance Challenge
        </h1>
        <Button
          variant="outline"
          onClick={() => onNavigate("creative-fun-hub")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Hub
        </Button>
      </div>

      <p className="text-xl text-gray-700">
        Follow the dance moves and groove to the music! Camera is optional.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="border-4">
          <CardHeader>
            <CardTitle>Dance Routines</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {routines.map((routine) => (
              <Button
                key={routine.id}
                variant={
                  selectedRoutine?.id === routine.id ? "default" : "outline"
                }
                className="w-full justify-start h-auto py-4"
                onClick={() => handleRoutineSelect(routine)}
              >
                <div className="text-left w-full">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-semibold">{routine.title}</span>
                    <Badge className={getDifficultyColor(routine.difficulty)}>
                      {routine.difficulty}
                    </Badge>
                  </div>
                  <div className="text-xs opacity-70">
                    {routine.duration}s • {routine.poses.length} moves
                  </div>
                </div>
              </Button>
            ))}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 border-4">
          <CardHeader>
            <CardTitle>Dance Floor</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {selectedRoutine ? (
              <>
                <div className="bg-gradient-to-br from-yellow-100 via-orange-100 to-pink-100 rounded-lg p-8 min-h-[400px] flex flex-col items-center justify-center relative">
                  {showCamera && isActive ? (
                    <div className="w-full h-full flex items-center justify-center">
                      <video
                        ref={videoRef}
                        autoPlay
                        playsInline
                        muted
                        className="w-full max-h-[350px] rounded-lg border-4 border-white shadow-lg transform scale-x-[-1]"
                      />
                      <canvas ref={canvasRef} className="hidden" />
                    </div>
                  ) : (
                    <div className="text-center">
                      <div className="text-8xl mb-6">💃</div>
                      <h2 className="text-3xl font-bold text-orange-600 mb-4">
                        {selectedRoutine.title}
                      </h2>
                    </div>
                  )}

                  {isPlaying && (
                    <div className="absolute bottom-8 left-0 right-0 text-center">
                      <div className="bg-white/90 backdrop-blur-sm rounded-full px-8 py-4 inline-block shadow-xl">
                        <p className="text-3xl font-bold text-purple-600 animate-pulse">
                          {selectedRoutine.poses[currentPose]}
                        </p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-4">
                  <div className="flex gap-2">
                    <Button
                      onClick={handlePlayPause}
                      size="lg"
                      className="flex-1"
                    >
                      {isPlaying ? (
                        <>
                          <Pause className="mr-2 h-5 w-5" />
                          Pause
                        </>
                      ) : (
                        <>
                          <Play className="mr-2 h-5 w-5" />
                          Start Dancing
                        </>
                      )}
                    </Button>
                    {isSupported && (
                      <Button
                        onClick={handleToggleCamera}
                        variant="outline"
                        size="lg"
                      >
                        {showCamera ? (
                          <>
                            <CameraOff className="mr-2 h-5 w-5" />
                            Hide Camera
                          </>
                        ) : (
                          <>
                            <Camera className="mr-2 h-5 w-5" />
                            Show Camera
                          </>
                        )}
                      </Button>
                    )}
                  </div>

                  {error && (
                    <p className="text-sm text-red-600">
                      Camera error: {error.message}
                    </p>
                  )}

                  <div className="bg-gray-100 rounded-lg p-4">
                    <h3 className="font-semibold mb-2">Dance Moves:</h3>
                    <div className="space-y-1">
                      {selectedRoutine.poses.map((pose, index) => (
                        <div
                          // biome-ignore lint/suspicious/noArrayIndexKey: positional list
                          key={index}
                          className={`flex items-center gap-2 ${
                            index === currentPose && isPlaying
                              ? "text-purple-600 font-bold"
                              : "text-gray-600"
                          }`}
                        >
                          <span className="text-lg">
                            {index === currentPose && isPlaying ? "👉" : "•"}
                          </span>
                          <span>{pose}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {!isPlaying && currentPose === 0 && (
                  <div className="text-center text-gray-500 py-4">
                    💃 Press Start Dancing to begin! 💃
                  </div>
                )}

                {!isPlaying && currentPose > 0 && (
                  <div className="text-center py-4">
                    <p className="text-2xl font-bold text-orange-600 mb-2">
                      🎉 Awesome moves! 🎉
                    </p>
                    <p className="text-gray-600">You completed the routine!</p>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center text-gray-500 py-20">
                Select a dance routine to start moving!
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
