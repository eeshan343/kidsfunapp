import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Save, Shuffle } from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import AvatarPreview3D from "../components/avatar3d/AvatarPreview3D";
import {
  useGetCallerUserProfile,
  useSaveAvatarConfig,
} from "../hooks/useQueries";
import type { AvatarConfig } from "../hooks/useQueries";
import { getDefaultAvatarConfig } from "../utils/avatarConfig";

export default function AvatarCreatorPage() {
  const { data: userProfile, isLoading: profileLoading } =
    useGetCallerUserProfile();
  const saveAvatar = useSaveAvatarConfig();

  const [avatarConfig, setAvatarConfig] = useState<AvatarConfig>(
    getDefaultAvatarConfig(),
  );

  // Initialize from user profile when available
  useEffect(() => {
    if (userProfile?.avatarConfig && !profileLoading) {
      setAvatarConfig(userProfile.avatarConfig);
    }
  }, [userProfile, profileLoading]);

  const avatarParts = {
    body: [
      "body1",
      "body2",
      "body3",
      "body4",
      "body5",
      "body6",
      "body7",
      "body8",
    ],
    head: [
      "head1",
      "head2",
      "head3",
      "head4",
      "head5",
      "head6",
      "head7",
      "head8",
    ],
    hair: [
      "hair1",
      "hair2",
      "hair3",
      "hair4",
      "hair5",
      "hair6",
      "hair7",
      "hair8",
      "hair9",
      "hair10",
    ],
    pants: [
      "pants1",
      "pants2",
      "pants3",
      "pants4",
      "pants5",
      "pants6",
      "pants7",
      "pants8",
    ],
    headwear: [
      "none",
      "hat1",
      "hat2",
      "crown",
      "cap",
      "beanie",
      "hat3",
      "hat4",
    ],
    shoes: [
      "shoes1",
      "shoes2",
      "shoes3",
      "shoes4",
      "shoes5",
      "shoes6",
      "shoes7",
      "shoes8",
    ],
  };

  const partEmojis: Record<string, Record<string, string>> = {
    body: {
      body1: "👕",
      body2: "👔",
      body3: "🎽",
      body4: "🦺",
      body5: "🧥",
      body6: "👗",
      body7: "🎽",
      body8: "👚",
    },
    head: {
      head1: "😊",
      head2: "😄",
      head3: "😎",
      head4: "🤓",
      head5: "😁",
      head6: "🙂",
      head7: "😌",
      head8: "🤗",
    },
    hair: {
      hair1: "💇",
      hair2: "💇‍♂️",
      hair3: "🦱",
      hair4: "🦰",
      hair5: "🦳",
      hair6: "🦲",
      hair7: "💛",
      hair8: "🔥",
      hair9: "🎀",
      hair10: "💗",
    },
    pants: {
      pants1: "👖",
      pants2: "🩳",
      pants3: "👗",
      pants4: "🩱",
      pants5: "👔",
      pants6: "🧡",
      pants7: "💚",
      pants8: "❤️",
    },
    headwear: {
      none: "❌",
      hat1: "🎩",
      hat2: "👒",
      crown: "👑",
      cap: "🧢",
      beanie: "🎿",
      hat3: "💜",
      hat4: "🧡",
    },
    shoes: {
      shoes1: "👟",
      shoes2: "👞",
      shoes3: "👠",
      shoes4: "🥾",
      shoes5: "🖤",
      shoes6: "💙",
      shoes7: "💛",
      shoes8: "💚",
    },
  };

  const updatePart = (category: keyof typeof avatarConfig, value: string) => {
    setAvatarConfig((prev) => ({ ...prev, [category]: value }));
  };

  const randomize = () => {
    const randomConfig = {
      body: avatarParts.body[
        Math.floor(Math.random() * avatarParts.body.length)
      ],
      head: avatarParts.head[
        Math.floor(Math.random() * avatarParts.head.length)
      ],
      hair: avatarParts.hair[
        Math.floor(Math.random() * avatarParts.hair.length)
      ],
      pants:
        avatarParts.pants[Math.floor(Math.random() * avatarParts.pants.length)],
      headwear:
        avatarParts.headwear[
          Math.floor(Math.random() * avatarParts.headwear.length)
        ],
      shoes:
        avatarParts.shoes[Math.floor(Math.random() * avatarParts.shoes.length)],
    };
    setAvatarConfig(randomConfig);
    toast.success("Avatar randomized! 🎲");
  };

  const handleSave = async () => {
    try {
      await saveAvatar.mutateAsync(avatarConfig);
      toast.success("Avatar saved successfully! 🎉");
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-purple-600 via-pink-600 to-yellow-600 bg-clip-text text-transparent">
          Avatar Creator 🎭
        </h1>
        <p className="text-xl text-gray-700">
          Create your unique 3D character!
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-1 border-4">
          <CardHeader className="text-center">
            <CardTitle>Your Avatar</CardTitle>
            <CardDescription>Preview your 3D creation</CardDescription>
          </CardHeader>
          <CardContent>
            <AvatarPreview3D avatarConfig={avatarConfig} />
            <div className="flex gap-2 mt-4">
              <Button onClick={randomize} variant="outline" className="flex-1">
                <Shuffle className="w-4 h-4 mr-2" />
                Randomize
              </Button>
              <Button
                onClick={handleSave}
                disabled={saveAvatar.isPending}
                className="flex-1"
              >
                <Save className="w-4 h-4 mr-2" />
                Save
              </Button>
            </div>
          </CardContent>
        </Card>

        <div className="lg:col-span-2">
          <Tabs defaultValue="head" className="w-full">
            <TabsList className="grid w-full grid-cols-3 lg:grid-cols-6">
              <TabsTrigger value="head">Head</TabsTrigger>
              <TabsTrigger value="hair">Hair</TabsTrigger>
              <TabsTrigger value="body">Body</TabsTrigger>
              <TabsTrigger value="pants">Pants</TabsTrigger>
              <TabsTrigger value="headwear">Headwear</TabsTrigger>
              <TabsTrigger value="shoes">Shoes</TabsTrigger>
            </TabsList>

            {Object.entries(avatarParts).map(([category, parts]) => (
              <TabsContent key={category} value={category} className="mt-6">
                <Card className="border-4">
                  <CardHeader>
                    <CardTitle className="capitalize">
                      Choose {category}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
                      {parts.map((part) => (
                        <Card
                          key={part}
                          className={`cursor-pointer hover:shadow-lg transition-all ${
                            avatarConfig[
                              category as keyof typeof avatarConfig
                            ] === part
                              ? "border-4 border-primary scale-110"
                              : "border-2"
                          }`}
                          onClick={() =>
                            updatePart(
                              category as keyof typeof avatarConfig,
                              part,
                            )
                          }
                        >
                          <CardContent className="p-6 text-center">
                            <div className="text-5xl">
                              {partEmojis[category][part]}
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </div>
    </div>
  );
}
