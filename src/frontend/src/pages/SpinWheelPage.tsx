import { Button } from "@/components/ui/button";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Clock, Sparkles, Star } from "lucide-react";
import React, { useRef, useEffect, useState, useCallback } from "react";
import { useActor } from "../hooks/useActor";

// Wheel segments: points only (no trophies)
const SEGMENTS = [
  { label: "+10", value: 10, color: "#7C3AED" },
  { label: "+25", value: 25, color: "#6D28D9" },
  { label: "+5", value: 5, color: "#8B5CF6" },
  { label: "+50", value: 50, color: "#5B21B6" },
  { label: "+15", value: 15, color: "#9333EA" },
  { label: "+100", value: 100, color: "#4C1D95" },
  { label: "+30", value: 30, color: "#A855F7" },
  { label: "+75", value: 75, color: "#7E22CE" },
];

const SEGMENT_COUNT = SEGMENTS.length;
const SEGMENT_ANGLE = (2 * Math.PI) / SEGMENT_COUNT;

function drawWheel(canvas: HTMLCanvasElement, rotation: number) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const size = canvas.width;
  const cx = size / 2;
  const cy = size / 2;
  const radius = size / 2 - 10;

  ctx.clearRect(0, 0, size, size);

  // Draw segments
  for (let i = 0; i < SEGMENT_COUNT; i++) {
    const startAngle = rotation + i * SEGMENT_ANGLE;
    const endAngle = startAngle + SEGMENT_ANGLE;
    const seg = SEGMENTS[i];

    ctx.beginPath();
    ctx.moveTo(cx, cy);
    ctx.arc(cx, cy, radius, startAngle, endAngle);
    ctx.closePath();
    ctx.fillStyle = seg.color;
    ctx.fill();
    ctx.strokeStyle = "#fff";
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw label
    ctx.save();
    ctx.translate(cx, cy);
    ctx.rotate(startAngle + SEGMENT_ANGLE / 2);
    ctx.textAlign = "right";
    ctx.fillStyle = "#fff";
    ctx.font = `bold ${size * 0.045}px sans-serif`;
    ctx.shadowColor = "rgba(0,0,0,0.5)";
    ctx.shadowBlur = 4;
    ctx.fillText(seg.label, radius - 12, 5);
    ctx.restore();
  }

  // Center circle
  ctx.beginPath();
  ctx.arc(cx, cy, 28, 0, 2 * Math.PI);
  ctx.fillStyle = "#1e1b4b";
  ctx.fill();
  ctx.strokeStyle = "#fff";
  ctx.lineWidth = 3;
  ctx.stroke();

  // Center star
  ctx.fillStyle = "#FFD700";
  ctx.font = `bold ${size * 0.06}px sans-serif`;
  ctx.textAlign = "center";
  ctx.textBaseline = "middle";
  ctx.fillText("⭐", cx, cy);
}

function formatCountdown(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

export default function SpinWheelPage() {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animFrameRef = useRef<number | null>(null);
  const countdownIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null,
  );
  const { actor, isFetching: actorFetching } = useActor();
  const queryClient = useQueryClient();

  const [isSpinning, setIsSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [result, setResult] = useState<{
    value: number;
    label: string;
  } | null>(null);
  const [showCelebration, setShowCelebration] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState<number>(0);
  const [spinHistory, setSpinHistory] = useState<
    Array<{ label: string; value: number; timestamp: number }>
  >(() => {
    try {
      return JSON.parse(localStorage.getItem("spinHistory") || "[]");
    } catch {
      return [];
    }
  });

  // Fetch remaining cooldown on mount
  const { data: remainingCooldownData, refetch: _refetchCooldown } = useQuery({
    queryKey: ["spinCooldown"],
    queryFn: async () => {
      if (!actor) return 0n;
      return actor.getRemainingSpinCooldown();
    },
    enabled: !!actor && !actorFetching,
  });

  // Fetch virtual pet hub
  const { data: virtualPetHub, refetch: refetchVirtualPet } = useQuery({
    queryKey: ["virtualPetHub"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getVirtualPetHub();
    },
    enabled: !!actor && !actorFetching,
  });

  // Start countdown when cooldown data arrives
  useEffect(() => {
    if (remainingCooldownData === undefined || remainingCooldownData === null)
      return;
    const secs = Number(remainingCooldownData);
    if (secs <= 0) {
      setCooldownSeconds(0);
      return;
    }
    setCooldownSeconds(secs);
  }, [remainingCooldownData]);

  // Tick the countdown every second
  // biome-ignore lint/correctness/useExhaustiveDependencies: countdownIntervalRef is a stable ref
  useEffect(() => {
    if (cooldownSeconds <= 0) {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
      return;
    }

    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
    }

    countdownIntervalRef.current = setInterval(() => {
      setCooldownSeconds((prev) => {
        if (prev <= 1) {
          if (countdownIntervalRef.current) {
            clearInterval(countdownIntervalRef.current);
            countdownIntervalRef.current = null;
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
        countdownIntervalRef.current = null;
      }
    };
  }, [cooldownSeconds > 0 ? "active" : "inactive"]); // eslint-disable-line react-hooks/exhaustive-deps

  // Claim spin reward mutation (adds points to Virtual Pet)
  const claimSpinRewardMutation = useMutation({
    mutationFn: async (points: number) => {
      if (!actor) throw new Error("Actor not available");
      return actor.claimSpinReward(BigInt(points));
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["virtualPetHub"] });
      refetchVirtualPet();
      // If backend returned a remaining cooldown, start it
      if (data && data.remainingCooldown > 0n) {
        setCooldownSeconds(Number(data.remainingCooldown));
      } else {
        // Start 20-minute cooldown after successful spin
        setCooldownSeconds(1200);
      }
    },
  });

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    drawWheel(canvas, rotation);
  }, [rotation]);

  const spin = useCallback(() => {
    if (isSpinning || cooldownSeconds > 0) return;
    setIsSpinning(true);
    setResult(null);
    setShowCelebration(false);

    // Random number of full rotations (5-10) plus random segment offset
    const extraSpins = 5 + Math.floor(Math.random() * 5);
    const randomSegment = Math.floor(Math.random() * SEGMENT_COUNT);
    const targetAngle =
      extraSpins * 2 * Math.PI + randomSegment * SEGMENT_ANGLE;

    const startRotation = rotation;
    const totalRotation = targetAngle;
    const duration = 4000; // 4 seconds
    const startTime = performance.now();

    const easeOut = (t: number) => 1 - (1 - t) ** 4;

    const animate = (now: number) => {
      const elapsed = now - startTime;
      const progress = Math.min(elapsed / duration, 1);
      const easedProgress = easeOut(progress);
      const currentRotation = startRotation + totalRotation * easedProgress;

      setRotation(currentRotation);

      if (canvasRef.current) {
        drawWheel(canvasRef.current, currentRotation);
      }

      if (progress < 1) {
        animFrameRef.current = requestAnimationFrame(animate);
      } else {
        // Determine winning segment
        const normalizedAngle =
          ((currentRotation % (2 * Math.PI)) + 2 * Math.PI) % (2 * Math.PI);
        const pointerAngle = (3 * Math.PI) / 2;
        const relativeAngle =
          (pointerAngle - normalizedAngle + 2 * Math.PI) % (2 * Math.PI);
        const winningIndex =
          Math.floor(relativeAngle / SEGMENT_ANGLE) % SEGMENT_COUNT;
        const winningSegment = SEGMENTS[winningIndex];

        setResult({
          value: winningSegment.value,
          label: winningSegment.label,
        });
        setShowCelebration(true);
        setIsSpinning(false);

        // Save to history
        const historyEntry = {
          label: winningSegment.label,
          value: winningSegment.value,
          timestamp: Date.now(),
        };
        const newHistory = [historyEntry, ...spinHistory].slice(0, 10);
        setSpinHistory(newHistory);
        localStorage.setItem("spinHistory", JSON.stringify(newHistory));

        // Award points to the user's Virtual Pet via claimSpinReward.
        // Backend enforces cooldown and updates the pet's points balance.
        claimSpinRewardMutation.mutate(winningSegment.value);
      }
    };

    animFrameRef.current = requestAnimationFrame(animate);
  }, [
    isSpinning,
    cooldownSeconds,
    rotation,
    spinHistory,
    claimSpinRewardMutation,
  ]);

  useEffect(() => {
    return () => {
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      if (countdownIntervalRef.current)
        clearInterval(countdownIntervalRef.current);
    };
  }, []);

  const isMutating = claimSpinRewardMutation.isPending;
  const isOnCooldown = cooldownSeconds > 0;
  const isDisabled = isSpinning || isMutating || isOnCooldown;

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-950 via-purple-950 to-violet-950 text-white">
      {/* Header */}
      <header className="flex items-center gap-4 px-6 py-4 border-b border-white/10">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => navigate({ to: "/dashboard" })}
          className="text-white hover:bg-white/10"
        >
          <ArrowLeft className="w-5 h-5" />
        </Button>
        <h1 className="text-2xl font-bold text-yellow-300 font-hero">
          🎡 Spin the Wheel
        </h1>
        <div className="ml-auto flex items-center gap-4">
          {/* Virtual Pet Points */}
          <div className="flex items-center gap-2 bg-purple-500/20 border border-purple-400/30 rounded-xl px-4 py-2">
            <Star className="w-4 h-4 text-purple-300" />
            <div>
              <div className="text-xs text-purple-300/70">Pet Trophies</div>
              <div className="text-lg font-bold text-purple-200">
                {virtualPetHub ? Number(virtualPetHub.trophies) : 0}
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">
          {/* Wheel Section */}
          <div className="flex flex-col items-center gap-6">
            {/* Pointer */}
            <div className="relative">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 z-10">
                <div className="w-0 h-0 border-l-[12px] border-r-[12px] border-b-[28px] border-l-transparent border-r-transparent border-b-red-500 drop-shadow-lg" />
              </div>
              <canvas
                ref={canvasRef}
                width={360}
                height={360}
                className="rounded-full shadow-2xl shadow-purple-500/40 border-4 border-white/20"
              />
            </div>

            {/* Spin Button */}
            <Button
              onClick={spin}
              disabled={isDisabled}
              className="w-56 h-14 text-xl font-bold bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-300 hover:to-orange-400 text-black border-0 rounded-full shadow-lg shadow-yellow-500/30 disabled:opacity-60 transition-all"
            >
              {isSpinning ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin">🎡</span> Spinning...
                </span>
              ) : isMutating ? (
                <span className="flex items-center gap-2">
                  <span className="animate-spin">⏳</span> Saving...
                </span>
              ) : isOnCooldown ? (
                <span className="flex items-center gap-2 text-base">
                  <Clock className="w-5 h-5" />
                  {formatCountdown(cooldownSeconds)}
                </span>
              ) : (
                <span className="flex items-center gap-2">
                  <Sparkles className="w-5 h-5" /> SPIN!
                </span>
              )}
            </Button>

            {/* Cooldown message */}
            {isOnCooldown && (
              <p className="text-sm text-white/50 text-center">
                Next spin available in{" "}
                <span className="text-yellow-300 font-semibold">
                  {formatCountdown(cooldownSeconds)}
                </span>
              </p>
            )}
          </div>

          {/* Result & Info Section */}
          <div className="flex flex-col gap-6">
            {/* Result Banner */}
            {showCelebration && result && (
              <div className="rounded-2xl p-6 text-center border-2 animate-bounce-once bg-purple-500/20 border-purple-400/50">
                <div className="text-5xl mb-3">⭐</div>
                <div className="text-2xl font-bold mb-2">
                  You earned {result.value} Points!
                </div>
                <div className="text-sm text-white/70 mt-2">
                  <span className="text-purple-300 font-semibold">
                    Added to Your Virtual Pet!
                  </span>
                  <br />
                  <span className="mt-1 block">
                    Grow your pet by earning points from games and spin rewards!
                  </span>
                </div>
              </div>
            )}

            {/* Possible Prizes */}
            <div className="bg-white/5 rounded-2xl p-5 border border-white/10">
              <h2 className="text-lg font-bold text-yellow-300 mb-4 flex items-center gap-2">
                <Star className="w-5 h-5" /> Possible Prizes
              </h2>
              <div className="grid grid-cols-2 gap-2">
                {SEGMENTS.map((seg, i) => (
                  <div
                    // biome-ignore lint/suspicious/noArrayIndexKey: positional list
                    key={i}
                    className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium"
                    style={{
                      backgroundColor: `${seg.color}33`,
                      border: `1px solid ${seg.color}66`,
                    }}
                  >
                    <span>⭐</span>
                    <span>{seg.label} Points</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Score Summary */}
            <div className="bg-white/5 rounded-2xl p-5 border border-white/10">
              <h2 className="text-lg font-bold text-white mb-3 flex items-center gap-2">
                <Star className="w-5 h-5 text-purple-300" /> Your Progress
              </h2>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-white/70 text-sm flex items-center gap-2">
                    <Star className="w-4 h-4 text-purple-300" /> Pet Happiness
                  </span>
                  <span className="font-bold text-purple-200 text-lg">
                    {virtualPetHub ? Number(virtualPetHub.happinessLevel) : 0}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-white/70 text-sm flex items-center gap-2">
                    🏆 Pet Trophies
                  </span>
                  <span className="font-bold text-yellow-200 text-lg">
                    {virtualPetHub ? Number(virtualPetHub.trophies) : 0}
                  </span>
                </div>
              </div>
              <p className="text-xs text-white/40 mt-3 text-center">
                Grow your pet by earning points from games and spin rewards!
              </p>
            </div>
          </div>
        </div>

        {/* Spin History */}
        {spinHistory.length > 0 && (
          <div className="mt-8 bg-white/5 rounded-2xl p-5 border border-white/10">
            <h2 className="text-lg font-bold text-white mb-4">Recent Spins</h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
              {spinHistory.slice(0, 10).map((entry, i) => (
                <div
                  // biome-ignore lint/suspicious/noArrayIndexKey: positional list
                  key={i}
                  className="rounded-xl px-3 py-2 text-center text-sm bg-purple-500/20 border border-purple-400/30"
                >
                  <div className="text-xl">⭐</div>
                  <div className="font-semibold text-white/90 text-xs mt-1">
                    {entry.value} Points
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="text-center py-6 text-white/30 text-xs mt-8">
        <p>
          Built with ❤️ using{" "}
          <a
            href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="underline hover:text-white/60"
          >
            caffeine.ai
          </a>{" "}
          &copy; {new Date().getFullYear()}
        </p>
      </footer>
    </div>
  );
}
