import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Play, Plus, Save, Trash2 } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

// Local type definitions (backend does not expose these types)
interface AvatarConfig {
  body: string;
  head: string;
  hair: string;
  pants: string;
  headwear: string;
  shoes: string;
}

interface Character {
  name: string;
  position: { x: number; y: number };
  avatarConfig: AvatarConfig;
}

interface Prop {
  name: string;
  position: { x: number; y: number };
  type: string;
}

interface TextBubble {
  content: string;
  position: { x: number; y: number };
  character: string;
  style: string;
}

interface Scene {
  background: string;
  characters: Character[];
  props: Prop[];
  animations: string[];
  textBubbles: TextBubble[];
}

interface StoryProject {
  id: string;
  owner: string;
  title: string;
  scenes: Scene[];
  createdAt: number;
  published: boolean;
  approved: boolean;
}

interface SceneElement {
  id: string;
  type: "character" | "prop" | "text";
  content: string;
  x: number;
  y: number;
}

export default function StoryBuilderPage() {
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();

  // Fetch user stories from localStorage
  const { data: myStories = [], isLoading: storiesLoading } = useQuery<
    StoryProject[]
  >({
    queryKey: ["callerStories"],
    queryFn: async () => {
      try {
        const stored = localStorage.getItem("storyProjects");
        return stored ? JSON.parse(stored) : [];
      } catch {
        return [];
      }
    },
  });

  // Save story mutation using localStorage
  const saveStoryMutation = useMutation({
    mutationFn: async ({
      title,
      scenes,
      background,
    }: {
      title: string;
      scenes: SceneElement[][];
      background: string;
    }) => {
      // Convert SceneElement[][] to Scene[]
      const backendScenes: Scene[] = scenes.map((sceneElements) => {
        const characters: Character[] = [];
        const props: Prop[] = [];
        const textBubbles: TextBubble[] = [];

        for (const element of sceneElements) {
          if (element.type === "character") {
            characters.push({
              name: element.content,
              position: { x: Math.round(element.x), y: Math.round(element.y) },
              avatarConfig: {
                body: "default",
                head: "default",
                hair: "default",
                pants: "default",
                headwear: "none",
                shoes: "default",
              },
            });
          } else if (element.type === "prop") {
            props.push({
              name: element.content,
              position: { x: Math.round(element.x), y: Math.round(element.y) },
              type: "decoration",
            });
          } else if (element.type === "text") {
            textBubbles.push({
              content: element.content,
              position: { x: Math.round(element.x), y: Math.round(element.y) },
              character: "",
              style: "default",
            });
          }
        }

        return {
          background,
          characters,
          props,
          animations: [],
          textBubbles,
        };
      });

      const storyProject: StoryProject = {
        id: Date.now().toString(),
        owner: identity?.getPrincipal().toString() ?? "anonymous",
        title,
        scenes: backendScenes,
        createdAt: Date.now(),
        published: false,
        approved: false,
      };

      // Save to localStorage
      const existing: StoryProject[] = JSON.parse(
        localStorage.getItem("storyProjects") || "[]",
      );
      existing.push(storyProject);
      localStorage.setItem("storyProjects", JSON.stringify(existing));

      return storyProject;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["callerStories"] });
    },
  });

  const [storyTitle, setStoryTitle] = useState("");
  const [currentScene, setCurrentScene] = useState(0);
  const [scenes, setScenes] = useState<SceneElement[][]>([[]]);
  const [selectedBackground, setSelectedBackground] = useState("forest");
  const [showPreview, setShowPreview] = useState(false);
  const [previewScene, setPreviewScene] = useState(0);
  const [isAnimating, setIsAnimating] = useState(false);
  const [draggedElement, setDraggedElement] = useState<string | null>(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);

  const backgrounds = [
    { id: "forest", name: "Forest", emoji: "🌲" },
    { id: "castle", name: "Castle", emoji: "🏰" },
    { id: "beach", name: "Beach", emoji: "🏖️" },
    { id: "space", name: "Space", emoji: "🚀" },
    { id: "city", name: "City", emoji: "🏙️" },
    { id: "underwater", name: "Underwater", emoji: "🌊" },
  ];

  const characters = [
    "👦",
    "👧",
    "🧑",
    "👨",
    "👩",
    "🐶",
    "🐱",
    "🦁",
    "🐻",
    "🦄",
    "🐉",
    "🧙",
  ];
  const props = [
    "🌳",
    "🏠",
    "⭐",
    "🎈",
    "🎁",
    "🚗",
    "✈️",
    "🚢",
    "🎨",
    "📚",
    "🎵",
    "⚽",
  ];

  const addElement = useCallback(
    (type: "character" | "prop", content: string) => {
      const newElement: SceneElement = {
        id: `${type}-${Date.now()}-${Math.random()}`,
        type,
        content,
        x: 150 + Math.random() * 100,
        y: 100 + Math.random() * 100,
      };
      setScenes((prev) => {
        const updated = [...prev];
        updated[currentScene] = [...updated[currentScene], newElement];
        return updated;
      });
      toast.success(`Added ${type}!`);
    },
    [currentScene],
  );

  const addTextBubble = useCallback(() => {
    const text = prompt("Enter text for the bubble:");
    if (text) {
      const newElement: SceneElement = {
        id: `text-${Date.now()}-${Math.random()}`,
        type: "text",
        content: text,
        x: 150 + Math.random() * 100,
        y: 100 + Math.random() * 100,
      };
      setScenes((prev) => {
        const updated = [...prev];
        updated[currentScene] = [...updated[currentScene], newElement];
        return updated;
      });
      toast.success("Text bubble added!");
    }
  }, [currentScene]);

  const handleMouseDown = useCallback(
    (e: React.MouseEvent, elementId: string) => {
      e.preventDefault();
      const element = scenes[currentScene].find((el) => el.id === elementId);
      if (!element) return;

      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;

      setDraggedElement(elementId);
      setDragOffset({
        x: e.clientX - rect.left - element.x,
        y: e.clientY - rect.top - element.y,
      });
    },
    [scenes, currentScene],
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (!draggedElement || !canvasRef.current) return;

      const rect = canvasRef.current.getBoundingClientRect();
      const newX = Math.max(
        0,
        Math.min(rect.width - 80, e.clientX - rect.left - dragOffset.x),
      );
      const newY = Math.max(
        0,
        Math.min(rect.height - 80, e.clientY - rect.top - dragOffset.y),
      );

      setScenes((prev) => {
        const updated = [...prev];
        const sceneElements = [...updated[currentScene]];
        const elementIndex = sceneElements.findIndex(
          (el) => el.id === draggedElement,
        );
        if (elementIndex !== -1) {
          sceneElements[elementIndex] = {
            ...sceneElements[elementIndex],
            x: newX,
            y: newY,
          };
          updated[currentScene] = sceneElements;
        }
        return updated;
      });
    },
    [draggedElement, dragOffset, currentScene],
  );

  const handleMouseUp = useCallback(() => {
    setDraggedElement(null);
  }, []);

  const handleTouchStart = useCallback(
    (e: React.TouchEvent, elementId: string) => {
      e.preventDefault();
      const element = scenes[currentScene].find((el) => el.id === elementId);
      if (!element) return;

      const rect = canvasRef.current?.getBoundingClientRect();
      if (!rect) return;

      const touch = e.touches[0];
      setDraggedElement(elementId);
      setDragOffset({
        x: touch.clientX - rect.left - element.x,
        y: touch.clientY - rect.top - element.y,
      });
    },
    [scenes, currentScene],
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!draggedElement || !canvasRef.current) return;

      const rect = canvasRef.current.getBoundingClientRect();
      const touch = e.touches[0];
      const newX = Math.max(
        0,
        Math.min(rect.width - 80, touch.clientX - rect.left - dragOffset.x),
      );
      const newY = Math.max(
        0,
        Math.min(rect.height - 80, touch.clientY - rect.top - dragOffset.y),
      );

      setScenes((prev) => {
        const updated = [...prev];
        const sceneElements = [...updated[currentScene]];
        const elementIndex = sceneElements.findIndex(
          (el) => el.id === draggedElement,
        );
        if (elementIndex !== -1) {
          sceneElements[elementIndex] = {
            ...sceneElements[elementIndex],
            x: newX,
            y: newY,
          };
          updated[currentScene] = sceneElements;
        }
        return updated;
      });
    },
    [draggedElement, dragOffset, currentScene],
  );

  const handleTouchEnd = useCallback(() => {
    setDraggedElement(null);
  }, []);

  const deleteElement = useCallback(
    (elementId: string) => {
      setScenes((prev) => {
        const updated = [...prev];
        updated[currentScene] = updated[currentScene].filter(
          (el) => el.id !== elementId,
        );
        return updated;
      });
      toast.success("Element removed!");
    },
    [currentScene],
  );

  const addScene = useCallback(() => {
    setScenes((prev) => [...prev, []]);
    setCurrentScene((prev) => prev + 1);
    toast.success("New scene added! 🎬");
  }, []);

  const deleteScene = useCallback(() => {
    if (scenes.length > 1) {
      setScenes((prev) => prev.filter((_, index) => index !== currentScene));
      setCurrentScene((prev) => Math.max(0, prev - 1));
      toast.success("Scene deleted!");
    }
  }, [scenes.length, currentScene]);

  const handleSave = async () => {
    if (!storyTitle.trim()) {
      toast.error("Please enter a story title");
      return;
    }

    if (scenes.every((scene) => scene.length === 0)) {
      toast.error("Please add some elements to your story");
      return;
    }

    try {
      await saveStoryMutation.mutateAsync({
        title: storyTitle,
        scenes,
        background: selectedBackground,
      });
      toast.success("✨ Story saved successfully!", {
        description: "Your story has been saved to your collection.",
      });
      setStoryTitle("");
      setScenes([[]]);
      setCurrentScene(0);
      setSelectedBackground("forest");
    } catch (error: any) {
      console.error("Save error:", error);
      toast.error("Failed to save story", {
        description: error.message || "Please try again",
      });
    }
  };

  const playStory = useCallback(() => {
    if (scenes.every((scene) => scene.length === 0)) {
      toast.error("Please add some elements to preview");
      return;
    }
    setPreviewScene(0);
    setShowPreview(true);
    setIsAnimating(false);
    toast.success("Playing your story! 🎬");
  }, [scenes]);

  const nextPreviewScene = useCallback(() => {
    if (previewScene < scenes.length - 1) {
      setIsAnimating(true);
      setTimeout(() => {
        setPreviewScene((prev) => prev + 1);
        setIsAnimating(false);
      }, 300);
    } else {
      toast.success("Story complete! 🎉");
    }
  }, [previewScene, scenes.length]);

  const previousPreviewScene = useCallback(() => {
    if (previewScene > 0) {
      setIsAnimating(true);
      setTimeout(() => {
        setPreviewScene((prev) => prev - 1);
        setIsAnimating(false);
      }, 300);
    }
  }, [previewScene]);

  useEffect(() => {
    const handleGlobalMouseUp = () => setDraggedElement(null);
    const handleGlobalTouchEnd = () => setDraggedElement(null);

    window.addEventListener("mouseup", handleGlobalMouseUp);
    window.addEventListener("touchend", handleGlobalTouchEnd);

    return () => {
      window.removeEventListener("mouseup", handleGlobalMouseUp);
      window.removeEventListener("touchend", handleGlobalTouchEnd);
    };
  }, []);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-purple-600 via-pink-600 to-yellow-600 bg-clip-text text-transparent">
          Story Builder 📖
        </h1>
        <p className="text-xl text-gray-700">
          Create your own animated stories with drag-and-drop!
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-4">
          <Card className="border-4">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle>
                    Scene {currentScene + 1} of {scenes.length}
                  </CardTitle>
                  <CardDescription>
                    Drag elements to position them in your scene
                  </CardDescription>
                </div>
                <div className="flex gap-2">
                  <Button onClick={addScene} size="sm">
                    <Plus className="w-4 h-4 mr-2" />
                    Add Scene
                  </Button>
                  {scenes.length > 1 && (
                    <Button
                      onClick={deleteScene}
                      size="sm"
                      variant="destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div
                ref={canvasRef}
                className="relative bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg border-4 border-primary h-96 overflow-hidden select-none"
                onMouseMove={handleMouseMove}
                onMouseUp={handleMouseUp}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
              >
                <div className="absolute inset-0 flex items-center justify-center text-6xl opacity-20 pointer-events-none">
                  {backgrounds.find((b) => b.id === selectedBackground)?.emoji}
                </div>
                {scenes[currentScene]?.map((element) => (
                  <div
                    key={element.id}
                    className={`absolute cursor-move bg-white/90 rounded-lg p-2 shadow-lg hover:scale-105 transition-transform ${
                      draggedElement === element.id
                        ? "scale-110 shadow-2xl z-50"
                        : ""
                    }`}
                    style={{ left: `${element.x}px`, top: `${element.y}px` }}
                    onMouseDown={(e) => handleMouseDown(e, element.id)}
                    onTouchStart={(e) => handleTouchStart(e, element.id)}
                  >
                    {element.type === "text" ? (
                      <div className="text-sm font-semibold max-w-32">
                        {element.content}
                      </div>
                    ) : (
                      <div className="text-4xl">{element.content}</div>
                    )}
                    <button
                      type="button"
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                      onClick={(e) => {
                        e.stopPropagation();
                        deleteElement(element.id);
                      }}
                    >
                      ×
                    </button>
                  </div>
                ))}
                {scenes[currentScene]?.length === 0 && (
                  <div className="absolute inset-0 flex items-center justify-center text-gray-400 pointer-events-none">
                    <p className="text-lg">
                      Click elements below to add them, then drag to position
                    </p>
                  </div>
                )}
              </div>
              <div className="flex gap-2 mt-4">
                <Button
                  onClick={() => setCurrentScene(Math.max(0, currentScene - 1))}
                  disabled={currentScene === 0}
                >
                  Previous
                </Button>
                <Button
                  onClick={() =>
                    setCurrentScene(
                      Math.min(scenes.length - 1, currentScene + 1),
                    )
                  }
                  disabled={currentScene === scenes.length - 1}
                >
                  Next
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="border-4">
            <CardHeader>
              <CardTitle>Story Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Input
                  placeholder="Enter story title..."
                  value={storyTitle}
                  onChange={(e) => setStoryTitle(e.target.value)}
                  className="text-lg"
                />
              </div>
              <div className="flex gap-2">
                <Button
                  onClick={handleSave}
                  disabled={saveStoryMutation.isPending}
                  className="flex-1"
                >
                  <Save className="w-4 h-4 mr-2" />
                  {saveStoryMutation.isPending ? "Saving..." : "Save Story"}
                </Button>
                <Button
                  onClick={playStory}
                  variant="outline"
                  className="flex-1"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Preview
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="space-y-4">
          <Tabs defaultValue="characters" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="characters">Characters</TabsTrigger>
              <TabsTrigger value="props">Props</TabsTrigger>
              <TabsTrigger value="backgrounds">Backgrounds</TabsTrigger>
            </TabsList>

            <TabsContent value="characters" className="mt-4">
              <Card className="border-4">
                <CardHeader>
                  <CardTitle>Characters</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-4 gap-2">
                    {characters.map((char, index) => (
                      <Button
                        // biome-ignore lint/suspicious/noArrayIndexKey: positional list
                        key={index}
                        variant="outline"
                        className="h-16 text-3xl hover:scale-110 transition-transform"
                        onClick={() => addElement("character", char)}
                      >
                        {char}
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="props" className="mt-4">
              <Card className="border-4">
                <CardHeader>
                  <CardTitle>Props</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-4 gap-2">
                    {props.map((prop, index) => (
                      <Button
                        // biome-ignore lint/suspicious/noArrayIndexKey: positional list
                        key={index}
                        variant="outline"
                        className="h-16 text-3xl hover:scale-110 transition-transform"
                        onClick={() => addElement("prop", prop)}
                      >
                        {prop}
                      </Button>
                    ))}
                  </div>
                  <Button
                    onClick={addTextBubble}
                    className="w-full mt-4"
                    variant="outline"
                  >
                    💬 Add Text Bubble
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="backgrounds" className="mt-4">
              <Card className="border-4">
                <CardHeader>
                  <CardTitle>Backgrounds</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-2">
                    {backgrounds.map((bg) => (
                      <Button
                        key={bg.id}
                        variant={
                          selectedBackground === bg.id ? "default" : "outline"
                        }
                        className="h-16 text-2xl flex flex-col gap-1"
                        onClick={() => setSelectedBackground(bg.id)}
                      >
                        <span>{bg.emoji}</span>
                        <span className="text-xs">{bg.name}</span>
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* My Stories */}
          {myStories.length > 0 && (
            <Card className="border-4">
              <CardHeader>
                <CardTitle>My Stories ({myStories.length})</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {storiesLoading ? (
                    <p className="text-sm text-gray-500">Loading stories...</p>
                  ) : (
                    myStories.map((story) => (
                      <div
                        key={story.id}
                        className="p-2 bg-gray-50 rounded-lg border flex items-center justify-between"
                      >
                        <div>
                          <p className="font-medium text-sm">{story.title}</p>
                          <p className="text-xs text-gray-500">
                            {story.scenes.length} scenes
                          </p>
                        </div>
                        <span className="text-lg">📖</span>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Story Preview 🎬</DialogTitle>
            <DialogDescription>
              Scene {previewScene + 1} of {scenes.length}
            </DialogDescription>
          </DialogHeader>
          <div
            className={`relative bg-gradient-to-br from-blue-100 to-purple-100 rounded-lg h-80 overflow-hidden transition-opacity duration-300 ${
              isAnimating ? "opacity-0" : "opacity-100"
            }`}
          >
            <div className="absolute inset-0 flex items-center justify-center text-8xl opacity-20">
              {backgrounds.find((b) => b.id === selectedBackground)?.emoji}
            </div>
            {scenes[previewScene]?.map((element) => (
              <div
                key={element.id}
                className="absolute bg-white/90 rounded-lg p-2 shadow-lg"
                style={{ left: `${element.x}px`, top: `${element.y}px` }}
              >
                {element.type === "text" ? (
                  <div className="text-sm font-semibold max-w-32">
                    {element.content}
                  </div>
                ) : (
                  <div className="text-4xl">{element.content}</div>
                )}
              </div>
            ))}
          </div>
          <div className="flex gap-2 justify-center mt-4">
            <Button
              onClick={previousPreviewScene}
              disabled={previewScene === 0}
              variant="outline"
            >
              ← Previous
            </Button>
            <Button onClick={nextPreviewScene}>
              {previewScene < scenes.length - 1 ? "Next →" : "🎉 Finish"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
