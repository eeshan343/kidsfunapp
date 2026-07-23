import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Eye, Heart, Upload, X } from "lucide-react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  useGetCallerArtwork,
  useGetPublicArtwork,
  useSubmitArtwork,
} from "../hooks/useQueries";

export default function ArtGalleryPage() {
  const { identity } = useInternetIdentity();
  const isAuthenticated = !!identity;

  const { data: myArtwork = [], isLoading: myArtworkLoading } =
    useGetCallerArtwork();
  const { data: publicArtwork = [], isLoading: publicArtworkLoading } =
    useGetPublicArtwork();
  const submitArtwork = useSubmitArtwork();

  const [artTitle, setArtTitle] = useState("");
  const [artCategory, setArtCategory] = useState("Drawing");
  const [isPublic, setIsPublic] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const categories = ["Drawing", "Painting", "Digital", "Craft", "Photography"];

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    if (file.size > 10 * 1024 * 1024) {
      toast.error("File size must be less than 10MB");
      return;
    }

    if (!file.type.startsWith("image/")) {
      toast.error("Please select an image file");
      return;
    }

    setSelectedFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
    toast.success("Image selected! 🎨");
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) {
      processFile(file);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const clearSelection = () => {
    setSelectedFile(null);
    if (previewUrl) {
      URL.revokeObjectURL(previewUrl);
    }
    setPreviewUrl("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleSubmit = async () => {
    // Check authentication first
    if (!isAuthenticated) {
      toast.error("Please sign in to upload artwork", {
        description: "You need to be logged in to share your creativity.",
      });
      return;
    }

    if (!artTitle.trim()) {
      toast.error("Please enter a title for your artwork");
      return;
    }

    if (!selectedFile) {
      toast.error("Please select an image to upload");
      return;
    }

    try {
      // Convert file to base64 data URL
      const reader = new FileReader();

      reader.onload = async (e) => {
        const result = e.target?.result;
        if (typeof result === "string") {
          try {
            await submitArtwork.mutateAsync({
              id: `art_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
              owner: identity?.getPrincipal().toString() ?? "anonymous",
              title: artTitle,
              category: artCategory,
              isPublic,
              artworkUrl: result,
              createdAt: Date.now(),
              approved: false,
            });

            toast.success(
              isPublic
                ? "Artwork submitted for approval! 🎨"
                : "Artwork saved privately! 🎨",
              {
                description: isPublic
                  ? "Your artwork will appear in the public gallery once approved."
                  : "Your artwork is saved in your personal gallery.",
              },
            );

            // Reset form
            setArtTitle("");
            setArtCategory("Drawing");
            setIsPublic(false);
            clearSelection();
          } catch (error: any) {
            console.error("Artwork submission error:", error);
            const errorMessage =
              error?.message || "Failed to upload artwork. Please try again.";
            toast.error(errorMessage);
          }
        } else {
          toast.error("Failed to process image file");
        }
      };

      reader.onerror = () => {
        toast.error("Failed to read image file");
      };

      reader.readAsDataURL(selectedFile);
    } catch (error: any) {
      console.error("File processing error:", error);
      const errorMessage = error?.message || "Failed to process image file";
      toast.error(errorMessage);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-purple-600 via-pink-600 to-yellow-600 bg-clip-text text-transparent">
          Art Gallery 🖼️
        </h1>
        <p className="text-xl text-gray-700">
          Share your creativity with the world!
        </p>
      </div>

      <Tabs defaultValue="my-art" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="my-art">My Art</TabsTrigger>
          <TabsTrigger value="public">Public Gallery</TabsTrigger>
          <TabsTrigger value="upload">Upload</TabsTrigger>
        </TabsList>

        <TabsContent value="my-art" className="mt-6">
          {myArtworkLoading ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">🎨</div>
              <p className="text-gray-600">Loading your artwork...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {myArtwork.length === 0 ? (
                <Card className="col-span-full border-4">
                  <CardContent className="py-12 text-center">
                    <div className="text-6xl mb-4">🎨</div>
                    <p className="text-xl text-gray-600">
                      No artwork yet. Upload your first creation!
                    </p>
                  </CardContent>
                </Card>
              ) : (
                myArtwork.map((art) => (
                  <Card
                    key={art.id}
                    className="border-4 hover:shadow-xl transition-all"
                  >
                    <CardHeader>
                      <CardTitle>{art.title}</CardTitle>
                      <CardDescription>{art.category}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-gradient-to-br from-purple-100 to-pink-100 rounded-lg h-48 flex items-center justify-center mb-4 overflow-hidden">
                        {art.artworkUrl ? (
                          <img
                            src={art.artworkUrl}
                            alt={art.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="text-6xl">🎨</div>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">
                          {art.isPublic
                            ? art.approved
                              ? "✅ Published"
                              : "⏳ Pending"
                            : "🔒 Private"}
                        </span>
                        <Button variant="ghost" size="sm">
                          <Eye className="w-4 h-4 mr-2" />
                          View
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="public" className="mt-6">
          {publicArtworkLoading ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">🖼️</div>
              <p className="text-gray-600">Loading public gallery...</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {publicArtwork.length === 0 ? (
                <Card className="col-span-full border-4">
                  <CardContent className="py-12 text-center">
                    <div className="text-6xl mb-4">🖼️</div>
                    <p className="text-xl text-gray-600">
                      No public artwork yet. Be the first to share!
                    </p>
                  </CardContent>
                </Card>
              ) : (
                publicArtwork.map((art) => (
                  <Card
                    key={art.id}
                    className="border-4 hover:shadow-xl transition-all"
                  >
                    <CardHeader>
                      <CardTitle>{art.title}</CardTitle>
                      <CardDescription>{art.category}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg h-48 flex items-center justify-center mb-4 overflow-hidden">
                        {art.artworkUrl ? (
                          <img
                            src={art.artworkUrl}
                            alt={art.title}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="text-6xl">🎨</div>
                        )}
                      </div>
                      <div className="flex items-center justify-between">
                        <Button variant="ghost" size="sm">
                          <Heart className="w-4 h-4 mr-2" />
                          Like
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Eye className="w-4 h-4 mr-2" />
                          View
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          )}
        </TabsContent>

        <TabsContent value="upload" className="mt-6">
          <Card className="border-4 max-w-2xl mx-auto">
            <CardHeader>
              <CardTitle className="text-2xl">Upload Your Artwork</CardTitle>
              <CardDescription>
                Share your creativity with others!
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {!isAuthenticated && (
                <div className="bg-yellow-50 border-2 border-yellow-400 rounded-lg p-4 text-center">
                  <p className="text-yellow-800 font-semibold">
                    ⚠️ Please sign in to upload artwork
                  </p>
                  <p className="text-sm text-yellow-700 mt-1">
                    You need to be logged in to share your creativity with
                    others.
                  </p>
                </div>
              )}

              {/* biome-ignore lint/a11y/useKeyWithClickEvents: file upload dropzone interaction */}
              <div
                className="border-4 border-dashed border-primary rounded-lg p-12 text-center bg-gradient-to-br from-purple-50 to-pink-50 cursor-pointer hover:bg-purple-100 transition-colors"
                onClick={() => fileInputRef.current?.click()}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                />
                {previewUrl ? (
                  <div className="relative">
                    <img
                      src={previewUrl}
                      alt="Preview"
                      className="max-h-64 mx-auto rounded-lg"
                    />
                    <Button
                      variant="destructive"
                      size="sm"
                      className="absolute top-2 right-2"
                      onClick={(e) => {
                        e.stopPropagation();
                        clearSelection();
                      }}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <Upload className="w-16 h-16 mx-auto mb-4 text-primary" />
                    <p className="text-lg font-semibold mb-2">
                      Click to upload or drag and drop
                    </p>
                    <p className="text-sm text-gray-600">
                      PNG, JPG, GIF up to 10MB
                    </p>
                  </>
                )}
              </div>

              <div className="space-y-4">
                <div>
                  <p className="block text-sm font-semibold mb-2">
                    Artwork Title
                  </p>
                  <Input
                    placeholder="Give your artwork a title..."
                    value={artTitle}
                    onChange={(e) => setArtTitle(e.target.value)}
                    className="text-lg"
                  />
                </div>

                <div>
                  <p className="block text-sm font-semibold mb-2">Category</p>
                  <div className="grid grid-cols-3 gap-2">
                    {categories.map((cat) => (
                      <Button
                        key={cat}
                        variant={artCategory === cat ? "default" : "outline"}
                        onClick={() => setArtCategory(cat)}
                      >
                        {cat}
                      </Button>
                    ))}
                  </div>
                </div>

                <div className="flex items-center gap-3 p-4 bg-gray-50 rounded-lg">
                  <input
                    type="checkbox"
                    id="public"
                    checked={isPublic}
                    onChange={(e) => setIsPublic(e.target.checked)}
                    className="w-5 h-5"
                  />
                  <label htmlFor="public" className="flex-1">
                    <p className="font-semibold">Share publicly</p>
                    <p className="text-sm text-gray-600">
                      Your artwork will be reviewed before appearing in the
                      public gallery
                    </p>
                  </label>
                </div>

                <Button
                  onClick={handleSubmit}
                  disabled={
                    !isAuthenticated ||
                    submitArtwork.isPending ||
                    !selectedFile ||
                    !artTitle.trim()
                  }
                  className="w-full text-lg h-12"
                >
                  {submitArtwork.isPending ? "Uploading..." : "Upload Artwork"}
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
