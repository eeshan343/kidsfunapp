import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useNavigate } from "@tanstack/react-router";
import {
  AlertCircle,
  Brush,
  Download,
  Eraser,
  Palette,
  Trash2,
} from "lucide-react";
import type React from "react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useCreateSticker, useGetApprovedStickers } from "../hooks/useQueries";

export default function StickerCreatorPage() {
  const navigate = useNavigate();
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentTool, setCurrentTool] = useState<"brush" | "eraser">("brush");
  const [brushColor, setBrushColor] = useState("#FF1493");
  const [brushSize, setBrushSize] = useState(5);
  const [stickerName, setStickerName] = useState("");
  const [canvasReady, setCanvasReady] = useState(false);
  const [initError, setInitError] = useState<string | null>(null);

  const createStickerMutation = useCreateSticker();
  const { data: approvedStickers = [], isLoading: loadingStickers } =
    useGetApprovedStickers();

  // Initialize canvas with white background
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      console.warn("Canvas ref not available yet");
      return;
    }

    try {
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        const errorMsg =
          "Failed to get canvas context. Your browser may not support HTML5 canvas.";
        console.error(errorMsg);
        setInitError(errorMsg);
        toast.error(errorMsg);
        return;
      }

      // Set canvas size explicitly
      canvas.width = 400;
      canvas.height = 400;

      // Fill with white background
      ctx.fillStyle = "#FFFFFF";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      setCanvasReady(true);
      setInitError(null);
      console.log("Canvas initialized successfully");
    } catch (error) {
      const errorMsg = "Failed to initialize drawing canvas";
      console.error("Canvas initialization error:", error);
      setInitError(errorMsg);
      toast.error(errorMsg);
    }
  }, []);

  const startDrawing = (
    e:
      | React.MouseEvent<HTMLCanvasElement>
      | React.TouchEvent<HTMLCanvasElement>,
  ) => {
    if (!canvasReady) return;

    setIsDrawing(true);
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    let clientX: number;
    let clientY: number;
    if ("touches" in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;

    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (
    e:
      | React.MouseEvent<HTMLCanvasElement>
      | React.TouchEvent<HTMLCanvasElement>,
  ) => {
    if (!isDrawing || !canvasReady) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    let clientX: number;
    let clientY: number;
    if ("touches" in e) {
      e.preventDefault();
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const x = (clientX - rect.left) * scaleX;
    const y = (clientY - rect.top) * scaleY;

    ctx.lineWidth = brushSize;
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    if (currentTool === "brush") {
      ctx.strokeStyle = brushColor;
      ctx.globalCompositeOperation = "source-over";
    } else {
      ctx.strokeStyle = "#FFFFFF";
      ctx.globalCompositeOperation = "destination-out";
    }

    ctx.lineTo(x, y);
    ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas || !canvasReady) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
  };

  const saveSticker = async () => {
    if (!stickerName.trim()) {
      toast.error("Please enter a name for your sticker");
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas || !canvasReady) {
      toast.error("Canvas not available");
      return;
    }

    try {
      const blob = await new Promise<Blob>((resolve, reject) => {
        canvas.toBlob((blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error("Failed to create blob from canvas"));
          }
        }, "image/png");
      });

      const arrayBuffer = await blob.arrayBuffer();
      const uint8Array = new Uint8Array(arrayBuffer);

      await createStickerMutation.mutateAsync({
        name: stickerName,
        image: uint8Array,
      });

      toast.success(
        "Sticker saved successfully! It will be available after moderation.",
      );
      setStickerName("");
      clearCanvas();
    } catch (error: any) {
      console.error("Save sticker error:", error);
      toast.error(error?.message || "Failed to save sticker");
    }
  };

  const downloadSticker = () => {
    const canvas = canvasRef.current;
    if (!canvas || !canvasReady) {
      toast.error("Canvas not ready");
      return;
    }

    try {
      const link = document.createElement("a");
      link.download = `${stickerName || "sticker"}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      toast.success("Sticker downloaded!");
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Failed to download sticker");
    }
  };

  // Show error state if canvas initialization failed
  if (initError) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-900 via-pink-800 to-orange-700 p-6">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h1
              className="text-4xl font-bold text-white"
              style={{ fontFamily: "Luckiest Guy, cursive" }}
            >
              Sticker Creator
            </h1>
            <Button
              onClick={() => navigate({ to: "/dashboard" })}
              variant="outline"
            >
              Back to Dashboard
            </Button>
          </div>

          <Card className="bg-white/95 backdrop-blur">
            <CardContent className="p-8">
              <div className="flex flex-col items-center justify-center space-y-4 text-center">
                <AlertCircle className="w-16 h-16 text-red-500" />
                <h2 className="text-2xl font-bold text-gray-900">
                  Canvas Initialization Error
                </h2>
                <p className="text-gray-600 max-w-md">{initError}</p>
                <p className="text-sm text-gray-500">
                  Please try refreshing the page or using a different browser
                  that supports HTML5 canvas.
                </p>
                <Button
                  onClick={() => window.location.reload()}
                  className="mt-4"
                >
                  Refresh Page
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-pink-800 to-orange-700 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1
              className="text-4xl font-bold text-white mb-2"
              style={{ fontFamily: "Luckiest Guy, cursive" }}
            >
              Sticker Creator
            </h1>
            <p className="text-white/90">
              Design your own custom stickers and emojis!
            </p>
          </div>
          <Button
            onClick={() => navigate({ to: "/dashboard" })}
            variant="outline"
          >
            Back to Dashboard
          </Button>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Drawing Canvas */}
          <Card className="bg-white/95 backdrop-blur">
            <CardHeader>
              <CardTitle>Drawing Canvas</CardTitle>
              <CardDescription>
                Use the tools below to create your sticker
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-center">
                <div
                  className="relative"
                  style={{ width: "100%", maxWidth: "400px" }}
                >
                  <canvas
                    ref={canvasRef}
                    width={400}
                    height={400}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                    className="border-4 border-purple-300 rounded-lg cursor-crosshair shadow-lg w-full"
                    style={{
                      display: "block",
                      aspectRatio: "1 / 1",
                      touchAction: "none",
                      backgroundColor: "#FFFFFF",
                    }}
                  />
                  {!canvasReady && (
                    <div className="absolute inset-0 flex items-center justify-center bg-white/80 rounded-lg">
                      <p className="text-gray-600">Initializing canvas...</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Tools */}
              <div className="space-y-4">
                <div className="flex gap-2">
                  <Button
                    onClick={() => setCurrentTool("brush")}
                    variant={currentTool === "brush" ? "default" : "outline"}
                    className="flex-1"
                    disabled={!canvasReady}
                  >
                    <Brush className="w-4 h-4 mr-2" />
                    Brush
                  </Button>
                  <Button
                    onClick={() => setCurrentTool("eraser")}
                    variant={currentTool === "eraser" ? "default" : "outline"}
                    className="flex-1"
                    disabled={!canvasReady}
                  >
                    <Eraser className="w-4 h-4 mr-2" />
                    Eraser
                  </Button>
                </div>

                <div className="space-y-2">
                  <Label>Brush Color</Label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="color"
                      value={brushColor}
                      onChange={(e) => setBrushColor(e.target.value)}
                      className="w-12 h-12 rounded cursor-pointer"
                      disabled={!canvasReady}
                    />
                    <Input
                      type="text"
                      value={brushColor}
                      onChange={(e) => setBrushColor(e.target.value)}
                      className="flex-1"
                      disabled={!canvasReady}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Brush Size: {brushSize}px</Label>
                  <input
                    type="range"
                    min="1"
                    max="50"
                    value={brushSize}
                    onChange={(e) => setBrushSize(Number(e.target.value))}
                    className="w-full"
                    disabled={!canvasReady}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Sticker Name</Label>
                  <Input
                    type="text"
                    value={stickerName}
                    onChange={(e) => setStickerName(e.target.value)}
                    placeholder="Enter sticker name"
                    disabled={!canvasReady}
                  />
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={clearCanvas}
                    variant="outline"
                    className="flex-1"
                    disabled={!canvasReady}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Clear
                  </Button>
                  <Button
                    onClick={downloadSticker}
                    variant="outline"
                    className="flex-1"
                    disabled={!canvasReady}
                  >
                    <Download className="w-4 h-4 mr-2" />
                    Download
                  </Button>
                </div>

                <Button
                  onClick={saveSticker}
                  disabled={
                    createStickerMutation.isPending ||
                    !stickerName.trim() ||
                    !canvasReady
                  }
                  className="w-full"
                >
                  {createStickerMutation.isPending
                    ? "Saving..."
                    : "Save Sticker"}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Approved Stickers Gallery */}
          <Card className="bg-white/95 backdrop-blur">
            <CardHeader>
              <CardTitle>Approved Stickers</CardTitle>
              <CardDescription>
                Browse stickers created by the community
              </CardDescription>
            </CardHeader>
            <CardContent>
              {loadingStickers ? (
                <div className="text-center py-8">
                  <p className="text-gray-600">Loading stickers...</p>
                </div>
              ) : approvedStickers.length === 0 ? (
                <div className="text-center py-8">
                  <Palette className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-600">No approved stickers yet</p>
                  <p className="text-sm text-gray-500 mt-2">
                    Be the first to create one!
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-3 gap-4 max-h-[600px] overflow-y-auto">
                  {approvedStickers.map((sticker) => (
                    <div
                      key={sticker.id}
                      className="aspect-square bg-white rounded-lg border-2 border-purple-200 p-2 hover:border-purple-400 transition-colors"
                    >
                      <img
                        src={sticker.image.getDirectURL()}
                        alt={sticker.name}
                        className="w-full h-full object-contain"
                      />
                      <p className="text-xs text-center mt-1 truncate">
                        {sticker.name}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
