import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Heart, Send, Smile, Star } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import {
  useAddJokeToFavorites,
  useGetAllJokes,
  useGetJokeFavorites,
  useRateJoke,
  useRemoveJokeFromFavorites,
  useSubmitJoke,
} from "../hooks/useQueries";

type JokeCategory =
  | "funny"
  | "riddles"
  | "knock-knock"
  | "puns"
  | "animal"
  | "food"
  | "school"
  | "silly";

export default function JokesPage() {
  const { data: allJokes = [] } = useGetAllJokes();
  const { data: favoriteJokeIds = [] } = useGetJokeFavorites();
  const submitJoke = useSubmitJoke();
  const rateJoke = useRateJoke();
  const addToFavorites = useAddJokeToFavorites();
  const removeFromFavorites = useRemoveJokeFromFavorites();

  const [selectedCategory, setSelectedCategory] = useState<
    JokeCategory | "all"
  >("all");
  const [newJokeText, setNewJokeText] = useState("");
  const [newJokeCategory, setNewJokeCategory] = useState<JokeCategory>("funny");
  const [activeTab, setActiveTab] = useState("browse");

  const categories: {
    value: JokeCategory | "all";
    label: string;
    emoji: string;
  }[] = [
    { value: "all", label: "All Jokes", emoji: "😄" },
    { value: "funny", label: "Funny", emoji: "😂" },
    { value: "riddles", label: "Riddles", emoji: "🤔" },
    { value: "knock-knock", label: "Knock-Knock", emoji: "🚪" },
    { value: "puns", label: "Puns", emoji: "😏" },
    { value: "animal", label: "Animal", emoji: "🐶" },
    { value: "food", label: "Food", emoji: "🍕" },
    { value: "school", label: "School", emoji: "📚" },
    { value: "silly", label: "Silly", emoji: "🤪" },
  ];

  const displayedJokes =
    selectedCategory === "all"
      ? allJokes
      : allJokes.filter((joke) => joke.category === selectedCategory);

  const handleSubmitJoke = async () => {
    if (!newJokeText.trim()) {
      toast.error("Please enter a joke");
      return;
    }

    try {
      await submitJoke.mutateAsync({
        category: newJokeCategory,
        content: newJokeText,
        rating: 0,
      });

      toast.success("Joke submitted!");
      setNewJokeText("");
      setActiveTab("browse");
    } catch (error: any) {
      toast.error(error.message || "Failed to submit joke");
    }
  };

  const handleRateJoke = async (jokeId: string, rating: number) => {
    try {
      await rateJoke.mutateAsync({ jokeId, rating });
      toast.success("Rating submitted!");
    } catch (error: any) {
      toast.error(error.message || "Failed to rate joke");
    }
  };

  const handleToggleFavorite = async (jokeId: string) => {
    try {
      if (favoriteJokeIds.includes(jokeId)) {
        await removeFromFavorites.mutateAsync(jokeId);
        toast.success("Removed from favorites");
      } else {
        await addToFavorites.mutateAsync(jokeId);
        toast.success("Added to favorites!");
      }
    } catch (error: any) {
      toast.error(error.message || "Failed to update favorites");
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-pink-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">
          Jokes & Riddles 😄
        </h1>
        <p className="text-xl text-gray-700">Laugh and share funny jokes!</p>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="browse">Browse Jokes</TabsTrigger>
          <TabsTrigger value="submit">Submit a Joke</TabsTrigger>
        </TabsList>

        <TabsContent value="browse" className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {categories.map((cat) => (
              <Button
                key={cat.value}
                variant={selectedCategory === cat.value ? "default" : "outline"}
                onClick={() => setSelectedCategory(cat.value)}
                className="flex items-center gap-2"
              >
                <span>{cat.emoji}</span>
                <span>{cat.label}</span>
              </Button>
            ))}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {displayedJokes.length === 0 ? (
              <div className="col-span-2 text-center py-12">
                <Smile className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600">No jokes in this category yet!</p>
              </div>
            ) : (
              displayedJokes.map((joke) => (
                <Card key={joke.id} className="border-4">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <Badge>{joke.category}</Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleToggleFavorite(joke.id)}
                      >
                        <Heart
                          className={`w-5 h-5 ${
                            favoriteJokeIds.includes(joke.id)
                              ? "fill-red-500 text-red-500"
                              : ""
                          }`}
                        />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p className="text-lg">{joke.content}</p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <button
                            type="button"
                            key={star}
                            onClick={() => handleRateJoke(joke.id, star)}
                            className="hover:scale-110 transition-transform"
                          >
                            <Star
                              className={`w-5 h-5 ${
                                star <= joke.rating
                                  ? "fill-yellow-400 text-yellow-400"
                                  : "text-gray-300"
                              }`}
                            />
                          </button>
                        ))}
                      </div>
                      <span className="text-sm text-gray-600">
                        Rating: {joke.rating}/5
                      </span>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="submit">
          <Card className="border-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Send className="w-5 h-5" />
                Submit Your Joke
              </CardTitle>
              <CardDescription>
                Share a funny joke with everyone!
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="block text-sm font-medium mb-2">Category</p>
                <div className="flex flex-wrap gap-2">
                  {categories
                    .filter((cat) => cat.value !== "all")
                    .map((cat) => (
                      <Button
                        key={cat.value}
                        variant={
                          newJokeCategory === cat.value ? "default" : "outline"
                        }
                        onClick={() =>
                          setNewJokeCategory(cat.value as JokeCategory)
                        }
                        className="flex items-center gap-2"
                      >
                        <span>{cat.emoji}</span>
                        <span>{cat.label}</span>
                      </Button>
                    ))}
                </div>
              </div>

              <div>
                <p className="block text-sm font-medium mb-2">Your Joke</p>
                <Textarea
                  placeholder="Type your joke here..."
                  value={newJokeText}
                  onChange={(e) => setNewJokeText(e.target.value)}
                  rows={6}
                />
              </div>

              <Button
                onClick={handleSubmitJoke}
                disabled={submitJoke.isPending || !newJokeText.trim()}
                className="w-full"
              >
                {submitJoke.isPending ? "Submitting..." : "Submit Joke"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
