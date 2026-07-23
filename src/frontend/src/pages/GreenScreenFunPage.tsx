import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Camera, Download, Upload } from "lucide-react";
import { useRef, useState } from "react";
import type { ModulePage } from "../App";
import { useCamera } from "../camera/useCamera";

interface GreenScreenFunPageProps {
  onNavigate: (page: ModulePage) => void;
}

const cartoonScenes = [
  {
    id: "space",
    name: "Space Adventure",
    image: "/assets/generated/green-screen-cartoon-scene.dim_400x300.png",
  },
  {
    id: "underwater",
    name: "Underwater World",
    image: "/assets/generated/green-screen-cartoon-scene.dim_400x300.png",
  },
  {
    id: "castle",
    name: "Magic Castle",
    image: "/assets/generated/green-screen-cartoon-scene.dim_400x300.png",
  },
  {
    id: "jungle",
    name: "Jungle Safari",
    image: "/assets/generated/green-screen-cartoon-scene.dim_400x300.png",
  },
];

export default function GreenScreenFunPage({
  onNavigate,
}: GreenScreenFunPageProps) {
  const [selectedScene, setSelectedScene] = useState(cartoonScenes[0]);
  const [userPhoto, setUserPhoto] = useState<string | null>(null);
  const [showCamera, setShowCamera] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const {
    isActive,
    isSupported,
    error,
    isLoading: _isLoading,
    startCamera,
    stopCamera,
    capturePhoto,
    videoRef,
    canvasRef: cameraCanvasRef,
  } = useCamera({
    facingMode: "user",
    width: 640,
    height: 480,
  });

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setUserPhoto(e.target?.result as string);
        setShowCamera(false);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleCameraCapture = async () => {
    const photo = await capturePhoto();
    if (photo) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setUserPhoto(e.target?.result as string);
        stopCamera();
        setShowCamera(false);
      };
      reader.readAsDataURL(photo);
    }
  };

  const handleStartCamera = async () => {
    setShowCamera(true);
    await startCamera();
  };

  const handleDownload = () => {
    if (!canvasRef.current || !userPhoto) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    canvas.width = 800;
    canvas.height = 600;

    const sceneImg = new Image();
    sceneImg.onload = () => {
      ctx.drawImage(sceneImg, 0, 0, canvas.width, canvas.height);

      const photoImg = new Image();
      photoImg.onload = () => {
        const photoWidth = 200;
        const photoHeight = 200;
        const x = (canvas.width - photoWidth) / 2;
        const y = (canvas.height - photoHeight) / 2;

        ctx.drawImage(photoImg, x, y, photoWidth, photoHeight);

        const link = document.createElement("a");
        link.download = "green-screen-fun.png";
        link.href = canvas.toDataURL();
        link.click();
      };
      photoImg.src = userPhoto;
    };
    sceneImg.src = selectedScene.image;
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-green-600 to-blue-600 bg-clip-text text-transparent">
          Green Screen Fun
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
        Put yourself in amazing cartoon scenes! Upload a photo or use your
        camera.
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="border-4">
          <CardHeader>
            <CardTitle>Choose Your Scene</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              {cartoonScenes.map((scene) => (
                // biome-ignore lint/a11y/useKeyWithClickEvents: game canvas interaction
                <div
                  key={scene.id}
                  className={`cursor-pointer border-4 rounded-lg overflow-hidden transition-all ${
                    selectedScene.id === scene.id
                      ? "border-primary scale-105"
                      : "border-gray-300 hover:border-gray-400"
                  }`}
                  onClick={() => setSelectedScene(scene)}
                >
                  <img
                    src={scene.image}
                    alt={scene.name}
                    className="w-full h-32 object-cover"
                  />
                  <p className="text-center py-2 font-semibold">{scene.name}</p>
                </div>
              ))}
            </div>

            <div className="space-y-4 pt-4">
              <Label>Add Your Photo</Label>
              <div className="flex gap-2">
                <Button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1"
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Upload Photo
                </Button>
                {isSupported && (
                  <Button
                    onClick={handleStartCamera}
                    className="flex-1"
                    variant="outline"
                  >
                    <Camera className="mr-2 h-4 w-4" />
                    Use Camera
                  </Button>
                )}
              </div>
              <Input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="hidden"
              />
            </div>

            {showCamera && (
              <div className="space-y-4">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full rounded-lg border-4"
                />
                <canvas ref={cameraCanvasRef} className="hidden" />
                {error && (
                  <p className="text-red-600 text-sm">
                    Camera error: {error.message}
                  </p>
                )}
                <div className="flex gap-2">
                  <Button
                    onClick={handleCameraCapture}
                    disabled={!isActive}
                    className="flex-1"
                  >
                    Capture Photo
                  </Button>
                  <Button
                    onClick={() => {
                      stopCamera();
                      setShowCamera(false);
                    }}
                    variant="outline"
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-4">
          <CardHeader>
            <CardTitle>Preview</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div
              className="relative bg-gray-100 rounded-lg overflow-hidden"
              style={{ aspectRatio: "4/3" }}
            >
              <img
                src={selectedScene.image}
                alt="Scene background"
                className="w-full h-full object-cover"
              />
              {userPhoto && (
                <div className="absolute inset-0 flex items-center justify-center">
                  <img
                    src={userPhoto}
                    alt="Your"
                    className="w-48 h-48 object-cover rounded-full border-4 border-white shadow-2xl"
                  />
                </div>
              )}
            </div>

            {userPhoto && (
              <Button onClick={handleDownload} className="w-full">
                <Download className="mr-2 h-4 w-4" />
                Download Creation
              </Button>
            )}

            {!userPhoto && (
              <p className="text-center text-gray-500 py-8">
                Upload a photo or use your camera to see the magic!
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      <canvas ref={canvasRef} className="hidden" />
    </div>
  );
}
