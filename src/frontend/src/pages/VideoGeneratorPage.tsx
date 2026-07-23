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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import {
  Download,
  Film,
  MapPin,
  Pause,
  Play,
  Sparkles,
  Users,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

interface AnimationFrame {
  time: number;
  characterX: number;
  characterY: number;
  text: string;
  scale: number;
}

export default function VideoGeneratorPage() {
  const [videoTitle, setVideoTitle] = useState("");
  const [videoStory, setVideoStory] = useState("");
  const [selectedCharacter, setSelectedCharacter] = useState("");
  const [selectedBackground, setSelectedBackground] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedVideo, setGeneratedVideo] = useState<AnimationFrame[] | null>(
    null,
  );
  const [isPlaying, setIsPlaying] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationFrameRef = useRef<number | null>(null);
  const startTimeRef = useRef<number | null>(null);

  const characters = [
    { id: "cat", name: "Kitty Cat", emoji: "🐱" },
    { id: "dog", name: "Puppy Dog", emoji: "🐶" },
    { id: "bear", name: "Teddy Bear", emoji: "🐻" },
    { id: "rabbit", name: "Bunny Rabbit", emoji: "🐰" },
    { id: "lion", name: "Leo Lion", emoji: "🦁" },
    { id: "unicorn", name: "Magic Unicorn", emoji: "🦄" },
  ];

  const backgrounds = [
    { id: "forest", name: "Magical Forest", emoji: "🌲", color: "#4ade80" },
    { id: "beach", name: "Sunny Beach", emoji: "🏖️", color: "#fbbf24" },
    { id: "castle", name: "Royal Castle", emoji: "🏰", color: "#a78bfa" },
    { id: "space", name: "Outer Space", emoji: "🚀", color: "#1e293b" },
    { id: "city", name: "Big City", emoji: "🏙️", color: "#60a5fa" },
    { id: "farm", name: "Happy Farm", emoji: "🚜", color: "#86efac" },
  ];

  const generateAnimationFrames = (): AnimationFrame[] => {
    const frames: AnimationFrame[] = [];
    const storyWords = videoStory.split(" ");
    const wordsPerFrame = Math.max(3, Math.floor(storyWords.length / 8));
    const totalDuration = 15000; // 15 seconds

    // Create 8 animation frames with character movement and text
    for (let i = 0; i < 8; i++) {
      const progress = i / 7;
      const time = (totalDuration / 8) * i;

      // Character moves from left to right with bounce
      const characterX = 100 + progress * 400;
      const characterY = 200 + Math.sin(progress * Math.PI * 2) * 30;

      // Get text for this frame
      const startIdx = i * wordsPerFrame;
      const endIdx = Math.min(startIdx + wordsPerFrame, storyWords.length);
      const text = storyWords.slice(startIdx, endIdx).join(" ");

      // Scale animation (pulse effect)
      const scale = 1 + Math.sin(progress * Math.PI * 4) * 0.1;

      frames.push({
        time,
        characterX,
        characterY,
        text,
        scale,
      });
    }

    return frames;
  };

  const handleGenerateVideo = () => {
    if (
      !videoTitle.trim() ||
      !videoStory.trim() ||
      !selectedCharacter ||
      !selectedBackground
    ) {
      toast.error("Please fill in all fields");
      return;
    }

    setIsGenerating(true);

    // Generate animation frames
    setTimeout(() => {
      const frames = generateAnimationFrames();
      setGeneratedVideo(frames);
      setIsGenerating(false);
      toast.success("Video generated successfully! 🎬");
    }, 1500);
  };

  const drawFrame = (ctx: CanvasRenderingContext2D, currentTime: number) => {
    if (!generatedVideo || generatedVideo.length === 0) return;

    const canvas = ctx.canvas;
    const width = canvas.width;
    const height = canvas.height;

    // Find current frame based on time
    let currentFrame = generatedVideo[0];
    for (let i = 0; i < generatedVideo.length - 1; i++) {
      if (
        currentTime >= generatedVideo[i].time &&
        currentTime < generatedVideo[i + 1].time
      ) {
        currentFrame = generatedVideo[i];
        break;
      }
      if (currentTime >= generatedVideo[generatedVideo.length - 1].time) {
        currentFrame = generatedVideo[generatedVideo.length - 1];
      }
    }

    // Clear canvas
    ctx.clearRect(0, 0, width, height);

    // Draw background
    const bg = backgrounds.find((b) => b.id === selectedBackground);
    if (bg) {
      const gradient = ctx.createLinearGradient(0, 0, 0, height);
      gradient.addColorStop(0, bg.color);
      gradient.addColorStop(1, "#ffffff");
      ctx.fillStyle = gradient;
      ctx.fillRect(0, 0, width, height);

      // Draw background emoji
      ctx.font = "120px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.globalAlpha = 0.2;
      ctx.fillText(bg.emoji, width / 2, height / 2);
      ctx.globalAlpha = 1;
    }

    // Draw character with animation
    const char = characters.find((c) => c.id === selectedCharacter);
    if (char) {
      ctx.save();
      ctx.translate(currentFrame.characterX, currentFrame.characterY);
      ctx.scale(currentFrame.scale, currentFrame.scale);
      ctx.font = "80px Arial";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";

      // Add shadow for depth
      ctx.shadowColor = "rgba(0, 0, 0, 0.3)";
      ctx.shadowBlur = 10;
      ctx.shadowOffsetX = 5;
      ctx.shadowOffsetY = 5;

      ctx.fillText(char.emoji, 0, 0);
      ctx.restore();
    }

    // Draw story text with background
    if (currentFrame.text) {
      ctx.font = 'bold 20px "Baloo 2", cursive';
      ctx.textAlign = "center";
      ctx.textBaseline = "top";

      const maxWidth = width - 100;
      const words = currentFrame.text.split(" ");
      const lines: string[] = [];
      let currentLine = "";

      // Word wrap
      for (const word of words) {
        const testLine = currentLine + (currentLine ? " " : "") + word;
        const metrics = ctx.measureText(testLine);
        if (metrics.width > maxWidth && currentLine) {
          lines.push(currentLine);
          currentLine = word;
        } else {
          currentLine = testLine;
        }
      }
      if (currentLine) lines.push(currentLine);

      // Draw text background
      const lineHeight = 30;
      const textBoxHeight = lines.length * lineHeight + 20;
      const textBoxY = height - textBoxHeight - 20;

      ctx.fillStyle = "rgba(255, 255, 255, 0.9)";
      ctx.strokeStyle = "#8b5cf6";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.roundRect(50, textBoxY, width - 100, textBoxHeight, 10);
      ctx.fill();
      ctx.stroke();

      // Draw text lines
      ctx.fillStyle = "#1f2937";
      for (let li = 0; li < lines.length; li++) {
        ctx.fillText(lines[li], width / 2, textBoxY + 10 + li * lineHeight);
      }
    }

    // Draw progress bar
    const totalDuration = 15000;
    const progress = Math.min(currentTime / totalDuration, 1);
    const barWidth = width - 100;
    const barHeight = 8;
    const barX = 50;
    const barY = 20;

    ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
    ctx.beginPath();
    ctx.roundRect(barX, barY, barWidth, barHeight, 4);
    ctx.fill();

    ctx.fillStyle = "#ec4899";
    ctx.beginPath();
    ctx.roundRect(barX, barY, barWidth * progress, barHeight, 4);
    ctx.fill();
  };

  const animate = (timestamp: number) => {
    if (!startTimeRef.current) {
      startTimeRef.current = timestamp;
    }

    const elapsed = timestamp - startTimeRef.current;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");

    if (ctx && canvas) {
      drawFrame(ctx, elapsed);
    }

    // Loop animation after 15 seconds
    if (elapsed < 15000) {
      animationFrameRef.current = requestAnimationFrame(animate);
    } else {
      setIsPlaying(false);
      startTimeRef.current = null;
    }
  };

  const handlePlayPause = () => {
    if (!generatedVideo) return;

    if (isPlaying) {
      // Pause
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
        animationFrameRef.current = null;
      }
      setIsPlaying(false);
    } else {
      // Play
      startTimeRef.current = null;
      setIsPlaying(true);
      animationFrameRef.current = requestAnimationFrame(animate);
    }
  };

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    try {
      // Create a download link for the canvas as an image
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.download = `${videoTitle || "video"}-preview.png`;
          link.click();
          URL.revokeObjectURL(url);
          toast.success("Video preview downloaded! 📥");
        }
      });
    } catch (_error) {
      toast.error("Failed to download video");
    }
  };

  // Cleanup animation on unmount
  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
    };
  }, []);

  // Auto-play when video is generated
  // biome-ignore lint/correctness/useExhaustiveDependencies: handlePlayPause intentionally omitted to avoid loop
  useEffect(() => {
    if (generatedVideo && !isPlaying) {
      setTimeout(() => {
        handlePlayPause();
      }, 100);
    }
  }, [generatedVideo]);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
          2D Video Generator 🎬
        </h1>
        <p className="text-lg text-gray-700">Create amazing animated stories</p>
      </div>

      <Tabs defaultValue="create" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="create">Create Video</TabsTrigger>
          <TabsTrigger value="gallery">My Videos</TabsTrigger>
        </TabsList>

        <TabsContent value="create" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-6">
              <Card className="border-4">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Film className="w-6 h-6" />
                    Video Details
                  </CardTitle>
                  <CardDescription>Tell us about your story</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Video Title</Label>
                    <Input
                      id="title"
                      placeholder="e.g., The Adventure Begins"
                      value={videoTitle}
                      onChange={(e) => setVideoTitle(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="story">Your Story</Label>
                    <Textarea
                      id="story"
                      placeholder="Write your story here... What happens in your video?"
                      value={videoStory}
                      onChange={(e) => setVideoStory(e.target.value)}
                      rows={6}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-4">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-6 h-6" />
                    Choose Character
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-3">
                    {characters.map((char) => (
                      <Button
                        key={char.id}
                        variant={
                          selectedCharacter === char.id ? "default" : "outline"
                        }
                        className="h-20 flex flex-col gap-1"
                        onClick={() => setSelectedCharacter(char.id)}
                      >
                        <span className="text-3xl">{char.emoji}</span>
                        <span className="text-xs">{char.name}</span>
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-4">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="w-6 h-6" />
                    Choose Background
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-3">
                    {backgrounds.map((bg) => (
                      <Button
                        key={bg.id}
                        variant={
                          selectedBackground === bg.id ? "default" : "outline"
                        }
                        className="h-20 flex flex-col gap-1"
                        onClick={() => setSelectedBackground(bg.id)}
                      >
                        <span className="text-3xl">{bg.emoji}</span>
                        <span className="text-xs">{bg.name}</span>
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Button
                onClick={handleGenerateVideo}
                disabled={isGenerating}
                size="lg"
                className="w-full gap-2"
              >
                {isGenerating ? (
                  <>
                    <Sparkles className="w-5 h-5 animate-spin" />
                    Generating Video...
                  </>
                ) : (
                  <>
                    <Film className="w-5 h-5" />
                    Generate Video
                  </>
                )}
              </Button>
            </div>

            <div>
              <Card className="border-4 h-full">
                <CardHeader>
                  <CardTitle>Preview</CardTitle>
                  <CardDescription>Your video will appear here</CardDescription>
                </CardHeader>
                <CardContent>
                  {generatedVideo ? (
                    <div className="space-y-4">
                      <div className="aspect-video bg-gray-900 rounded-lg overflow-hidden border-4 border-purple-500">
                        <canvas
                          ref={canvasRef}
                          width={640}
                          height={360}
                          className="w-full h-full"
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button
                          onClick={handlePlayPause}
                          className="flex-1 gap-2"
                          variant={isPlaying ? "secondary" : "default"}
                        >
                          {isPlaying ? (
                            <>
                              <Pause className="w-5 h-5" />
                              Pause
                            </>
                          ) : (
                            <>
                              <Play className="w-5 h-5" />
                              Play
                            </>
                          )}
                        </Button>
                        <Button
                          onClick={handleDownload}
                          variant="outline"
                          className="gap-2"
                        >
                          <Download className="w-5 h-5" />
                          Download
                        </Button>
                      </div>
                      <div className="text-center text-sm text-gray-600">
                        <p className="font-semibold">{videoTitle}</p>
                        <p className="text-xs">15 second animation</p>
                      </div>
                    </div>
                  ) : (
                    <div className="aspect-video bg-gray-100 rounded-lg flex items-center justify-center border-4 border-dashed">
                      <div className="text-center text-gray-400">
                        <Film className="w-16 h-16 mx-auto mb-2" />
                        <p>No video generated yet</p>
                        <p className="text-sm mt-2">
                          Fill in the details and click Generate!
                        </p>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="gallery" className="mt-6">
          <Card className="border-4">
            <CardHeader>
              <CardTitle>My Video Gallery</CardTitle>
              <CardDescription>All your created videos</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Film className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <p className="text-xl text-gray-500">No videos yet</p>
                <p className="text-gray-400">
                  Create your first video to see it here!
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
