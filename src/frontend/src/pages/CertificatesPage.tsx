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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Award, Download, FileText } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useCreateCertificate,
  useGetCallerUserProfile,
  useGetUserCertificates,
} from "../hooks/useQueries";

export default function CertificatesPage() {
  const [achievementType, setAchievementType] = useState("");
  const [customAchievement, setCustomAchievement] = useState("");
  const [userName, setUserName] = useState("");
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const previewCanvasRef = useRef<HTMLCanvasElement>(null);

  const { identity } = useInternetIdentity();
  const createCertificateMutation = useCreateCertificate();
  const { data: certificates = [] } = useGetUserCertificates();
  const { data: userProfile } = useGetCallerUserProfile();

  // Initialize userName from profile when available
  // biome-ignore lint/correctness/useExhaustiveDependencies: intentionally omit userName to avoid loops
  useEffect(() => {
    if (userProfile?.name && !userName) {
      setUserName(userProfile.name);
    }
  }, [userProfile]);

  const achievementTypes = [
    "Game Master - Completed 10 Games",
    "High Scorer - Reached 5000 Points",
    "Creative Star - Published 5 Stories",
    "Craft Expert - Completed 10 DIY Projects",
    "Art Champion - 5 Gallery Submissions",
    "Custom Achievement",
  ];

  const currentAchievement =
    achievementType === "Custom Achievement"
      ? customAchievement
      : achievementType;

  // Helper function to wrap text
  const wrapText = (
    ctx: CanvasRenderingContext2D,
    text: string,
    maxWidth: number,
  ): string[] => {
    const words = text.split(" ");
    const lines: string[] = [];
    let currentLine = words[0];

    for (let i = 1; i < words.length; i++) {
      const testLine = `${currentLine} ${words[i]}`;
      const metrics = ctx.measureText(testLine);

      if (metrics.width > maxWidth) {
        lines.push(currentLine);
        currentLine = words[i];
      } else {
        currentLine = testLine;
      }
    }
    lines.push(currentLine);
    return lines;
  };

  // Generate certificate on canvas
  const generateCertificateCanvas = (
    canvas: HTMLCanvasElement,
    _forDownload = false,
  ) => {
    if (!userName || !currentAchievement) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = 2480;
    canvas.height = 1754;

    const bgImage = new Image();
    bgImage.crossOrigin = "anonymous";
    bgImage.src = "/assets/generated/certificate-template.dim_400x300.png";

    const drawCertificate = () => {
      ctx.fillStyle = "#FFF9E6";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      if (bgImage.complete && bgImage.naturalWidth > 0) {
        ctx.globalAlpha = 0.3;
        ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height);
        ctx.globalAlpha = 1.0;
      }

      ctx.strokeStyle = "#D4AF37";
      ctx.lineWidth = 20;
      ctx.strokeRect(100, 100, canvas.width - 200, canvas.height - 200);

      ctx.strokeStyle = "#FFD700";
      ctx.lineWidth = 10;
      ctx.strokeRect(140, 140, canvas.width - 280, canvas.height - 280);

      ctx.fillStyle = "#D4AF37";
      ctx.font = "bold 120px serif";
      ctx.textAlign = "center";
      ctx.fillText("Certificate of Achievement", canvas.width / 2, 400);

      ctx.strokeStyle = "#D4AF37";
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.moveTo(canvas.width / 2 - 400, 480);
      ctx.lineTo(canvas.width / 2 + 400, 480);
      ctx.stroke();

      ctx.fillStyle = "#333333";
      ctx.font = "60px serif";
      ctx.fillText("This certifies that", canvas.width / 2, 620);

      ctx.fillStyle = "#6B46C1";
      ctx.font = "bold 100px serif";
      ctx.fillText(userName, canvas.width / 2, 780);

      ctx.fillStyle = "#333333";
      ctx.font = "60px serif";
      ctx.fillText("has achieved", canvas.width / 2, 900);

      ctx.fillStyle = "#EC4899";
      ctx.font = "bold 80px serif";
      const lines = wrapText(ctx, currentAchievement, canvas.width - 400);
      const lineHeight = 100;
      const startY = 1040;

      lines.forEach((line, index) => {
        ctx.fillText(line, canvas.width / 2, startY + index * lineHeight);
      });

      ctx.fillStyle = "#666666";
      ctx.font = "50px serif";
      ctx.fillText(
        `Date: ${new Date().toLocaleDateString()}`,
        canvas.width / 2,
        canvas.height - 300,
      );

      ctx.fillStyle = "#FFD700";
      ctx.font = "80px serif";
      ctx.fillText("⭐", 400, 400);
      ctx.fillText("⭐", canvas.width - 400, 400);
      ctx.fillText("🏆", canvas.width / 2, canvas.height - 200);
    };

    if (bgImage.complete) {
      drawCertificate();
    } else {
      bgImage.onload = drawCertificate;
      bgImage.onerror = drawCertificate;
    }
  };

  // biome-ignore lint/correctness/useExhaustiveDependencies: generateCertificateCanvas is stable
  useEffect(() => {
    if (previewCanvasRef.current && userName && currentAchievement) {
      generateCertificateCanvas(previewCanvasRef.current, false);
    }
  }, [userName, currentAchievement]);

  const generatePDF = async () => {
    if (!canvasRef.current || !userName || !currentAchievement) {
      toast.error("Please enter your name and select an achievement");
      return;
    }

    try {
      generateCertificateCanvas(canvasRef.current, true);

      await new Promise((resolve) => setTimeout(resolve, 100));

      await createCertificateMutation.mutateAsync({
        id: `cert_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId: identity?.getPrincipal().toString() ?? "anonymous",
        achievement: currentAchievement,
        date: Date.now(),
      });

      toast.success("🏆 Certificate generated successfully!", {
        description: "Your certificate is ready to download.",
      });

      setAchievementType("");
      setCustomAchievement("");
    } catch (error) {
      console.error("PDF generation error:", error);
      toast.error("Failed to generate certificate. Please try again.");
    }
  };

  const downloadPDF = async (cert: {
    id: string;
    achievement: string;
    date: number;
    userId: string;
  }) => {
    try {
      const tempCanvas = document.createElement("canvas");
      tempCanvas.width = 2480;
      tempCanvas.height = 1754;
      const ctx = tempCanvas.getContext("2d");

      if (!ctx) {
        toast.error("Failed to create PDF");
        return;
      }

      ctx.fillStyle = "#FFF9E6";
      ctx.fillRect(0, 0, tempCanvas.width, tempCanvas.height);

      const bgImage = new Image();
      bgImage.crossOrigin = "anonymous";
      bgImage.src = "/assets/generated/certificate-template.dim_400x300.png";

      const drawAndDownload = () => {
        if (bgImage.complete && bgImage.naturalWidth > 0) {
          ctx.globalAlpha = 0.3;
          ctx.drawImage(bgImage, 0, 0, tempCanvas.width, tempCanvas.height);
          ctx.globalAlpha = 1.0;
        }

        ctx.strokeStyle = "#D4AF37";
        ctx.lineWidth = 20;
        ctx.strokeRect(
          100,
          100,
          tempCanvas.width - 200,
          tempCanvas.height - 200,
        );

        ctx.strokeStyle = "#FFD700";
        ctx.lineWidth = 10;
        ctx.strokeRect(
          140,
          140,
          tempCanvas.width - 280,
          tempCanvas.height - 280,
        );

        ctx.fillStyle = "#D4AF37";
        ctx.font = "bold 120px serif";
        ctx.textAlign = "center";
        ctx.fillText("Certificate of Achievement", tempCanvas.width / 2, 400);

        ctx.strokeStyle = "#D4AF37";
        ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(tempCanvas.width / 2 - 400, 480);
        ctx.lineTo(tempCanvas.width / 2 + 400, 480);
        ctx.stroke();

        ctx.fillStyle = "#333333";
        ctx.font = "60px serif";
        ctx.fillText("This certifies that", tempCanvas.width / 2, 620);

        ctx.fillStyle = "#6B46C1";
        ctx.font = "bold 100px serif";
        ctx.fillText(
          userName || userProfile?.name || "Student",
          tempCanvas.width / 2,
          780,
        );

        ctx.fillStyle = "#333333";
        ctx.font = "60px serif";
        ctx.fillText("has achieved", tempCanvas.width / 2, 900);

        ctx.fillStyle = "#EC4899";
        ctx.font = "bold 80px serif";
        const lines = wrapText(ctx, cert.achievement, tempCanvas.width - 400);
        const lineHeight = 100;
        const startY = 1040;

        lines.forEach((line, index) => {
          ctx.fillText(line, tempCanvas.width / 2, startY + index * lineHeight);
        });

        ctx.fillStyle = "#666666";
        ctx.font = "50px serif";
        ctx.fillText(
          `Date: ${new Date(Number(cert.date)).toLocaleDateString()}`,
          tempCanvas.width / 2,
          tempCanvas.height - 300,
        );

        ctx.fillStyle = "#FFD700";
        ctx.font = "80px serif";
        ctx.fillText("⭐", 400, 400);
        ctx.fillText("⭐", tempCanvas.width - 400, 400);
        ctx.fillText("🏆", tempCanvas.width / 2, tempCanvas.height - 200);

        tempCanvas.toBlob(
          (blob) => {
            if (!blob) {
              toast.error("Failed to generate PDF");
              return;
            }

            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `certificate-${cert.achievement.replace(/\s+/g, "-").toLowerCase()}.jpg`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            toast.success("Certificate downloaded successfully!");
          },
          "image/jpeg",
          0.95,
        );
      };

      if (bgImage.complete) {
        drawAndDownload();
      } else {
        bgImage.onload = drawAndDownload;
        bgImage.onerror = drawAndDownload;
      }
    } catch (error) {
      console.error("Download error:", error);
      toast.error("Failed to download certificate");
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">
          Printable Certificates 🏆
        </h1>
        <p className="text-lg text-gray-700">
          Generate certificates for your achievements!
        </p>
      </div>

      <canvas ref={canvasRef} className="hidden" />
      <canvas ref={previewCanvasRef} className="hidden" />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="border-4 bg-gradient-to-br from-yellow-50 to-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="w-6 h-6 text-yellow-600" />
              Create Certificate
            </CardTitle>
            <CardDescription>
              Choose an achievement to celebrate
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="userName">Your Name</Label>
                <Input
                  id="userName"
                  placeholder="Enter your name"
                  value={userName}
                  onChange={(e) => setUserName(e.target.value)}
                />
                <p className="text-xs text-gray-500">
                  This name will appear on your certificate
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="achievement">Achievement Type</Label>
                <Select
                  value={achievementType}
                  onValueChange={setAchievementType}
                >
                  <SelectTrigger id="achievement">
                    <SelectValue placeholder="Select an achievement" />
                  </SelectTrigger>
                  <SelectContent>
                    {achievementTypes.map((type) => (
                      <SelectItem key={type} value={type}>
                        {type}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {achievementType === "Custom Achievement" && (
                <div className="space-y-2">
                  <Label htmlFor="customAchievement">Custom Achievement</Label>
                  <Input
                    id="customAchievement"
                    placeholder="Enter your achievement"
                    value={customAchievement}
                    onChange={(e) => setCustomAchievement(e.target.value)}
                  />
                </div>
              )}

              <div className="border-4 border-dashed border-yellow-400 rounded-lg p-8 bg-white">
                <div className="text-center space-y-4">
                  <div className="text-6xl">🏆</div>
                  <h3 className="text-2xl font-bold text-yellow-600">
                    Certificate Preview
                  </h3>
                  <div className="border-t-2 border-b-2 border-yellow-400 py-4">
                    <p className="text-lg font-semibold">This certifies that</p>
                    <p className="text-2xl font-bold text-purple-600 my-2">
                      {userName || "Your Name"}
                    </p>
                    <p className="text-lg">has achieved</p>
                    <p className="text-xl font-bold text-pink-600 my-2 break-words px-4">
                      {currentAchievement || "Select Achievement"}
                    </p>
                  </div>
                  <p className="text-sm text-gray-600">
                    Date: {new Date().toLocaleDateString()}
                  </p>
                </div>
              </div>

              <Button
                onClick={generatePDF}
                disabled={
                  createCertificateMutation.isPending ||
                  !achievementType ||
                  !userName
                }
                className="w-full"
                size="lg"
              >
                <Download className="w-4 h-4 mr-2" />
                {createCertificateMutation.isPending
                  ? "Generating..."
                  : "Generate Certificate"}
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-6 h-6 text-orange-600" />
              Your Certificates
            </CardTitle>
            <CardDescription>
              Download and print your achievements
            </CardDescription>
          </CardHeader>
          <CardContent>
            {certificates.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Award className="w-16 h-16 mx-auto mb-4 opacity-50" />
                <p>No certificates yet. Generate your first one!</p>
              </div>
            ) : (
              <div className="space-y-3">
                {certificates.map((cert) => (
                  <Card
                    key={cert.id}
                    className="border-2 hover:shadow-lg transition-shadow"
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <p className="font-bold text-lg">
                            {cert.achievement}
                          </p>
                          <p className="text-sm text-gray-600">
                            Generated:{" "}
                            {new Date(Number(cert.date)).toLocaleDateString()}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => downloadPDF(cert)}
                        >
                          <Download className="w-4 h-4 mr-2" />
                          Download
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
