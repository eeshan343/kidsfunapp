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
import { Cake, Download, Gift, Heart, Palette, Sparkles } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function EventCardsPage() {
  const [cardTitle, setCardTitle] = useState("");
  const [cardMessage, setCardMessage] = useState("");
  const [selectedTemplate, setSelectedTemplate] = useState("");
  const [selectedColor, setSelectedColor] = useState("purple");

  const templates = [
    { id: "birthday", name: "Birthday", icon: Cake, emoji: "🎂" },
    { id: "thank-you", name: "Thank You", icon: Heart, emoji: "💝" },
    { id: "celebration", name: "Celebration", icon: Sparkles, emoji: "🎉" },
    { id: "gift", name: "Gift Card", icon: Gift, emoji: "🎁" },
  ];

  const colors = [
    { id: "purple", name: "Purple", class: "from-purple-400 to-purple-600" },
    { id: "pink", name: "Pink", class: "from-pink-400 to-pink-600" },
    { id: "blue", name: "Blue", class: "from-blue-400 to-blue-600" },
    { id: "green", name: "Green", class: "from-green-400 to-green-600" },
    { id: "yellow", name: "Yellow", class: "from-yellow-400 to-yellow-600" },
    { id: "red", name: "Red", class: "from-red-400 to-red-600" },
  ];

  const handleDownload = () => {
    if (!cardTitle.trim() || !selectedTemplate) {
      toast.error("Please fill in all fields and select a template");
      return;
    }
    toast.success("Card downloaded! 📥");
  };

  const selectedTemplateData = templates.find((t) => t.id === selectedTemplate);
  const selectedColorData = colors.find((c) => c.id === selectedColor);

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">
          Event Cards Designer 🎨
        </h1>
        <p className="text-lg text-gray-700">
          Create beautiful cards for any occasion
        </p>
      </div>

      <Tabs defaultValue="create" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="create">Create Card</TabsTrigger>
          <TabsTrigger value="gallery">My Cards</TabsTrigger>
        </TabsList>

        <TabsContent value="create" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="space-y-6">
              <Card className="border-4">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Palette className="w-6 h-6" />
                    Card Details
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Card Title</Label>
                    <Input
                      id="title"
                      placeholder="e.g., Happy Birthday!"
                      value={cardTitle}
                      onChange={(e) => setCardTitle(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="message">Your Message</Label>
                    <Textarea
                      id="message"
                      placeholder="Write your message here..."
                      value={cardMessage}
                      onChange={(e) => setCardMessage(e.target.value)}
                      rows={4}
                    />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-4">
                <CardHeader>
                  <CardTitle>Choose Template</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-3">
                    {templates.map((template) => (
                      <Button
                        key={template.id}
                        variant={
                          selectedTemplate === template.id
                            ? "default"
                            : "outline"
                        }
                        className="h-24 flex flex-col gap-2"
                        onClick={() => setSelectedTemplate(template.id)}
                      >
                        <span className="text-4xl">{template.emoji}</span>
                        <span className="text-sm">{template.name}</span>
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card className="border-4">
                <CardHeader>
                  <CardTitle>Choose Color</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-3 gap-3">
                    {colors.map((color) => (
                      <Button
                        key={color.id}
                        variant={
                          selectedColor === color.id ? "default" : "outline"
                        }
                        className="h-16"
                        onClick={() => setSelectedColor(color.id)}
                      >
                        <div
                          className={`w-8 h-8 rounded-full bg-gradient-to-br ${color.class}`}
                        />
                      </Button>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Button
                onClick={handleDownload}
                size="lg"
                className="w-full gap-2"
              >
                <Download className="w-5 h-5" />
                Download Card
              </Button>
            </div>

            <div>
              <Card className="border-4 h-full">
                <CardHeader>
                  <CardTitle>Preview</CardTitle>
                  <CardDescription>
                    Your card will look like this
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div
                    className={`aspect-[3/4] bg-gradient-to-br ${selectedColorData?.class || "from-gray-200 to-gray-300"} rounded-lg p-8 flex flex-col items-center justify-center text-white border-4`}
                  >
                    {selectedTemplateData && (
                      <div className="text-center space-y-6">
                        <div className="text-6xl">
                          {selectedTemplateData.emoji}
                        </div>
                        <h2 className="text-3xl font-bold">
                          {cardTitle || "Your Title"}
                        </h2>
                        <p className="text-lg">
                          {cardMessage || "Your message will appear here..."}
                        </p>
                      </div>
                    )}
                    {!selectedTemplateData && (
                      <div className="text-center text-white/70">
                        <Palette className="w-16 h-16 mx-auto mb-4" />
                        <p>Select a template to preview</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="gallery" className="mt-6">
          <Card className="border-4">
            <CardHeader>
              <CardTitle>My Card Gallery</CardTitle>
              <CardDescription>All your created cards</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Palette className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <p className="text-xl text-gray-500">No cards yet</p>
                <p className="text-gray-400">
                  Create your first card to see it here!
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
