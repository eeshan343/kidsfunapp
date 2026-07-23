import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  ArrowLeft,
  RotateCcw,
  Sparkles,
  Star,
  TrendingUp,
  Trophy,
  Volume2,
  VolumeX,
} from "lucide-react";
import {
  type ReactNode,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { toast } from "sonner";
import type { ModulePage } from "../App";
import {
  useGetUserTrophies,
  useUpdateGamesTrophies,
} from "../hooks/useQueries";
import { triggerAchievementCelebration } from "./AchievementCelebration";
import { showEmotionFeedback } from "./EmotionFeedback";

interface GameLayoutProps {
  title: string;
  children: ReactNode;
  score: number;
  highScore: number;
  onRestart: () => void;
  onNavigate: (page: ModulePage) => void;
  gameOver?: boolean;
  showScore?: boolean;
  /**
   * When true, renders an on-screen touch controls overlay (directional pad +
   * action buttons) on touch devices. Buttons dispatch synthetic keyboard
   * events to the game canvas so games that listen for keydown/keyup keep
   * working without modification.
   */
  touchControls?: boolean;
  /**
   * Action button labels to render alongside the d-pad. Defaults to a single
   * "Action" button mapped to the Space key.
   */
  touchActions?: TouchActionButton[];
}

interface TouchActionButton {
  /** Visible label on the button. */
  label: string;
  /** Keyboard key to dispatch. Defaults to " " (Space). */
  key?: string;
  /** Optional emoji/icon shown above the label. */
  icon?: string;
}

const DEFAULT_TOUCH_ACTIONS: TouchActionButton[] = [
  { label: "Action", key: " ", icon: "✦" },
];

/**
 * Detect whether the current device supports touch input. Used to gate the
 * on-screen controls overlay so desktop users never see it.
 */
function useIsTouchDevice(): boolean {
  const [isTouch, setIsTouch] = useState(false);
  useEffect(() => {
    const check = () =>
      "ontouchstart" in window ||
      navigator.maxTouchPoints > 0 ||
      window.matchMedia("(pointer: coarse)").matches;
    setIsTouch(check());
  }, []);
  return isTouch;
}

/**
 * Dispatch a synthetic KeyboardEvent to the given target (defaults to
 * document) so existing game keydown/keyup listeners receive it. We dispatch
 * on both `document` and the canvas element to maximize compatibility with
 * games that attach listeners to either.
 */
function dispatchKey(
  key: string,
  type: "keydown" | "keyup",
  canvas: HTMLElement | null,
) {
  const opts: KeyboardEventInit = {
    key,
    code: keyToCode(key),
    bubbles: true,
    cancelable: true,
    repeat: type === "keydown",
  };
  document.dispatchEvent(new KeyboardEvent(type, opts));
  if (canvas) {
    canvas.dispatchEvent(new KeyboardEvent(type, opts));
  }
}

function keyToCode(key: string): string {
  switch (key) {
    case "ArrowUp":
      return "ArrowUp";
    case "ArrowDown":
      return "ArrowDown";
    case "ArrowLeft":
      return "ArrowLeft";
    case "ArrowRight":
      return "ArrowRight";
    case " ":
      return "Space";
    case "Enter":
      return "Enter";
    default:
      return key.length === 1 ? `Key${key.toUpperCase()}` : key;
  }
}

/**
 * Press-and-hold button: dispatches keydown on pointer down, keyup on
 * pointer up / leave / cancel. Meets 44px minimum tap target.
 */
function TouchControlButton({
  ariaLabel,
  keyName,
  canvasRef,
  className,
  children,
}: {
  ariaLabel: string;
  keyName: string;
  canvasRef: React.RefObject<HTMLElement | null>;
  className?: string;
  children: ReactNode;
}) {
  const pressedRef = useRef(false);

  const handleDown = useCallback(
    (e: React.PointerEvent<HTMLButtonElement>) => {
      e.preventDefault();
      e.currentTarget.setPointerCapture(e.pointerId);
      if (pressedRef.current) return;
      pressedRef.current = true;
      dispatchKey(keyName, "keydown", canvasRef.current);
    },
    [keyName, canvasRef],
  );

  const handleUp = useCallback(
    (e: React.PointerEvent<HTMLButtonElement>) => {
      e.preventDefault();
      if (!pressedRef.current) return;
      pressedRef.current = false;
      dispatchKey(keyName, "keyup", canvasRef.current);
    },
    [keyName, canvasRef],
  );

  return (
    <button
      type="button"
      aria-label={ariaLabel}
      data-ocid={`touch_control.${ariaLabel.toLowerCase().replace(/\s+/g, "_")}`}
      onPointerDown={handleDown}
      onPointerUp={handleUp}
      onPointerCancel={handleUp}
      onPointerLeave={handleUp}
      onContextMenu={(e) => e.preventDefault()}
      className={`select-none touch-none flex items-center justify-center font-bold text-foreground bg-card border-2 border-border rounded-xl shadow-sm active:scale-95 active:bg-primary/20 transition-transform duration-100 ${className ?? "w-14 h-14 text-xl"}`}
    >
      {children}
    </button>
  );
}

export default function GameLayout({
  title,
  children,
  score,
  highScore,
  onRestart,
  onNavigate,
  gameOver = false,
  showScore = true,
  touchControls = false,
  touchActions = DEFAULT_TOUCH_ACTIONS,
}: GameLayoutProps) {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [showUpgradeDialog, setShowUpgradeDialog] = useState(false);
  const { data: trophies = 70 } = useGetUserTrophies();
  const updateTrophiesMutation = useUpdateGamesTrophies();
  const isTouchDevice = useIsTouchDevice();
  const canvasRef = useRef<HTMLElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (gameOver && score > highScore) {
      toast.success("🎉 New High Score!", {
        description: `You scored ${score} points!`,
      });
    }
  }, [gameOver, score, highScore]);

  // Capture the first canvas element rendered inside the game container so
  // touch-control key events can be dispatched directly to it. Re-runs after
  // every render to pick up canvases mounted by child game components.
  useEffect(() => {
    if (!containerRef.current) return;
    const canvas = containerRef.current.querySelector("canvas");
    canvasRef.current = canvas as HTMLElement | null;
  });

  const handleUpgradePet = async () => {
    if (trophies < 2) {
      toast.error(
        "Not enough trophies! You need 2 trophies to upgrade your pet.",
      );
      return;
    }

    try {
      const newTrophies = await updateTrophiesMutation.mutateAsync();
      toast.success(
        `🏆 Pet Upgraded! You now have ${newTrophies} trophies remaining.`,
      );
      showEmotionFeedback("Your pet is so happy! 🐾");
      triggerAchievementCelebration("Pet Upgraded!", "confetti");
      setShowUpgradeDialog(false);
    } catch (error: any) {
      if (error.message?.includes("Not enough trophies")) {
        toast.error("Not enough trophies to upgrade your pet!");
      } else {
        toast.error("Failed to upgrade pet. Please try again.");
      }
    }
  };

  const showTouchOverlay = touchControls && isTouchDevice;

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-100 to-blue-100 p-4">
      <div className="max-w-6xl mx-auto space-y-4">
        {/* Header */}
        <Card className="border-4">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => onNavigate("games")}
                  className="border-3"
                  aria-label="Back to Games Hub"
                  data-ocid="game_layout.back_button"
                >
                  <ArrowLeft className="w-5 h-5" />
                </Button>
                <CardTitle className="text-2xl md:text-3xl">{title}</CardTitle>
              </div>

              <div className="flex items-center gap-3 flex-wrap">
                {showScore && (
                  <>
                    <div className="flex items-center gap-2 bg-yellow-100 px-4 py-2 rounded-lg border-3 border-yellow-300">
                      <Star className="w-5 h-5 text-yellow-600" />
                      <span className="font-bold text-lg">Score: {score}</span>
                    </div>
                    <div className="flex items-center gap-2 bg-purple-100 px-4 py-2 rounded-lg border-3 border-purple-300">
                      <Trophy className="w-5 h-5 text-purple-600" />
                      <span className="font-bold text-lg">
                        Best: {highScore}
                      </span>
                    </div>
                  </>
                )}

                <div className="flex items-center gap-2 bg-orange-100 px-4 py-2 rounded-lg border-3 border-orange-300">
                  <Trophy className="w-5 h-5 text-orange-600" />
                  <span className="font-bold text-lg">{trophies} 🏆</span>
                </div>

                <Button
                  variant="outline"
                  size="icon"
                  onClick={() => setSoundEnabled(!soundEnabled)}
                  className="border-3"
                  aria-label={soundEnabled ? "Mute sound" : "Unmute sound"}
                  data-ocid="game_layout.sound_toggle"
                >
                  {soundEnabled ? (
                    <Volume2 className="w-5 h-5" />
                  ) : (
                    <VolumeX className="w-5 h-5" />
                  )}
                </Button>

                <Button
                  variant="outline"
                  size="icon"
                  onClick={onRestart}
                  className="border-3"
                  aria-label="Restart game"
                  data-ocid="game_layout.restart_button"
                >
                  <RotateCcw className="w-5 h-5" />
                </Button>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Game Content — responsive canvas scaling wrapper.
            The container constrains width to the viewport; any canvas inside
            is scaled down via CSS (max-width: 100%, height auto) so fixed-size
            canvases never cause horizontal scroll on mobile. */}
        <Card className="border-4">
          <CardContent className="p-0 overflow-hidden">
            <div
              ref={containerRef}
              className="w-full flex justify-center items-center bg-card/40 [&_canvas]:max-w-full [&_canvas]:h-auto [&_canvas]:block"
              style={{ touchAction: showTouchOverlay ? "none" : "auto" }}
            >
              {children}
            </div>
          </CardContent>
        </Card>

        {/* On-screen touch controls overlay — only on touch devices and only
            when the game opts in via touchControls. */}
        {showTouchOverlay && (
          <div
            className="fixed inset-x-0 bottom-0 z-40 pointer-events-none"
            aria-label="On-screen game controls"
            data-ocid="game_layout.touch_controls"
          >
            <div className="max-w-6xl mx-auto px-4 pb-4 pt-2 flex items-end justify-between gap-4">
              {/* Directional pad */}
              <fieldset
                className="pointer-events-auto grid grid-cols-3 grid-rows-3 gap-1.5 bg-card/80 backdrop-blur-sm p-2 rounded-2xl border-2 border-border shadow-lg"
                aria-label="Directional pad"
              >
                <span />
                <TouchControlButton
                  ariaLabel="Up"
                  keyName="ArrowUp"
                  canvasRef={canvasRef}
                >
                  ▲
                </TouchControlButton>
                <span />
                <TouchControlButton
                  ariaLabel="Left"
                  keyName="ArrowLeft"
                  canvasRef={canvasRef}
                >
                  ◀
                </TouchControlButton>
                <span className="w-14 h-14" />
                <TouchControlButton
                  ariaLabel="Right"
                  keyName="ArrowRight"
                  canvasRef={canvasRef}
                >
                  ▶
                </TouchControlButton>
                <span />
                <TouchControlButton
                  ariaLabel="Down"
                  keyName="ArrowDown"
                  canvasRef={canvasRef}
                >
                  ▼
                </TouchControlButton>
                <span />
              </fieldset>

              {/* Action buttons */}
              <fieldset
                className="pointer-events-auto flex flex-col gap-2 items-end"
                aria-label="Action buttons"
              >
                {touchActions.map((action) => (
                  <TouchControlButton
                    key={action.key ?? action.label}
                    ariaLabel={action.label}
                    keyName={action.key ?? " "}
                    canvasRef={canvasRef}
                    className="w-16 h-16 text-sm flex-col gap-0.5 bg-primary/15 border-primary/40"
                  >
                    {action.icon && (
                      <span className="text-2xl leading-none">
                        {action.icon}
                      </span>
                    )}
                    <span className="text-xs leading-tight">
                      {action.label}
                    </span>
                  </TouchControlButton>
                ))}
              </fieldset>
            </div>
          </div>
        )}

        {/* Game Over Overlay */}
        {gameOver && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <Card className="border-4 max-w-md w-full">
              <CardHeader>
                <CardTitle className="text-3xl text-center">
                  {score > highScore ? "🎉 New High Score! 🎉" : "Game Over!"}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="text-center space-y-2">
                  <div className="text-5xl font-bold text-purple-300">
                    {score}
                  </div>
                  <div className="text-white">Your Score</div>
                  {highScore > 0 && (
                    <div className="text-sm text-white/80">
                      Previous Best: {highScore}
                    </div>
                  )}
                </div>

                <div className="flex gap-3">
                  <Button
                    onClick={onRestart}
                    className="flex-1 text-lg h-12 font-bold"
                    data-ocid="game_layout.play_again_button"
                  >
                    Play Again
                  </Button>
                  <Button
                    onClick={() => setShowUpgradeDialog(true)}
                    variant="outline"
                    className="flex-1 text-lg h-12 font-bold border-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600"
                    data-ocid="game_layout.upgrade_pet_button"
                  >
                    <Sparkles className="w-5 h-5 mr-2" />
                    Upgrade Pet
                  </Button>
                </div>

                <Button
                  onClick={() => onNavigate("games")}
                  variant="outline"
                  className="w-full text-lg h-12 font-bold border-3"
                  data-ocid="game_layout.games_hub_button"
                >
                  Games Hub
                </Button>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Upgrade Pet Dialog */}
        <Dialog open={showUpgradeDialog} onOpenChange={setShowUpgradeDialog}>
          <DialogContent className="sm:max-w-md border-4">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2 text-2xl">
                <Sparkles className="w-6 h-6 text-purple-600" />
                Upgrade Pet or Get Trophies
              </DialogTitle>
              <DialogDescription className="text-base">
                Use your trophies to upgrade your virtual pet and help it grow!
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-6 py-4">
              <div className="bg-gradient-to-br from-purple-50 to-pink-50 p-6 rounded-lg border-3 border-purple-300">
                <div className="text-center space-y-4">
                  <div className="text-6xl">🐾</div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-center gap-2">
                      <Trophy className="w-6 h-6 text-orange-600" />
                      <span className="text-2xl font-bold">
                        {trophies} Trophies
                      </span>
                    </div>
                    <p className="text-sm text-gray-600">
                      Each game costs 2 trophies to play
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg border-2 border-blue-300">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-5 h-5 text-blue-600" />
                    <span className="font-bold">Upgrade Cost:</span>
                  </div>
                  <span className="text-lg font-bold text-blue-600">2 🏆</span>
                </div>

                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg border-2 border-green-300">
                  <div className="flex items-center gap-2">
                    <Star className="w-5 h-5 text-green-600" />
                    <span className="font-bold">Benefits:</span>
                  </div>
                  <span className="text-sm font-bold text-green-600">
                    Pet Growth & Happiness
                  </span>
                </div>
              </div>

              {trophies < 2 && (
                <div className="bg-yellow-50 p-4 rounded-lg border-2 border-yellow-300">
                  <p className="text-sm text-yellow-800 text-center font-bold">
                    ⚠️ Not enough trophies! Play more games or visit the Virtual
                    Pet Hub to earn more.
                  </p>
                </div>
              )}
            </div>

            <DialogFooter className="flex-col sm:flex-row gap-2">
              <Button
                onClick={handleUpgradePet}
                disabled={trophies < 2 || updateTrophiesMutation.isPending}
                className="w-full sm:w-auto bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold"
                data-ocid="game_layout.upgrade_pet_confirm_button"
              >
                {updateTrophiesMutation.isPending ? (
                  <>
                    <Sparkles className="w-4 h-4 mr-2 animate-spin" />
                    Upgrading...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Upgrade Pet (2 🏆)
                  </>
                )}
              </Button>
              <Button
                onClick={() => onNavigate("virtual-pet-hub")}
                variant="outline"
                className="w-full sm:w-auto border-3"
                data-ocid="game_layout.visit_pet_hub_button"
              >
                Visit Pet Hub
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
