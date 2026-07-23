import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { HelpCircle, Volume2, VolumeX, X } from "lucide-react";
import { useEffect, useState } from "react";
import type { ModulePage } from "../App";

interface MascotGuideProps {
  currentPage: ModulePage;
}

export default function MascotGuide({ currentPage }: MascotGuideProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [message, setMessage] = useState("");
  const [voiceEnabled, setVoiceEnabled] = useState(false);

  const messages: Record<string, string> = {
    dashboard: "Welcome! 🎉 Click on any module to start your adventure!",
    games: "Time to play! 🎮 Choose a game and have fun!",
    events: "Plan your special days! 🎂 Add birthdays and celebrations!",
    video: "Create amazing videos! 🎬 Let your creativity shine!",
    chat: "Chat with friends! 💬 Remember to be kind and respectful!",
    cards: "Design beautiful cards! 🎨 Make someone smile today!",
    jokes: "Time to laugh! 😄 Share jokes and spread joy!",
    rewards: "Check your achievements! 🏆 You're doing great!",
    profile: "Customize your profile! 👤 Make it uniquely yours!",
    "seasonal-events":
      "Celebrate the season! 🎄 Enjoy special holiday activities!",
    "avatar-creator": "Create your avatar! 🎭 Mix and match to look awesome!",
    "story-builder": "Tell your story! 📖 Build amazing scenes and adventures!",
    "craft-diy": "Get crafty! ✂️ Follow the steps and create something cool!",
    "art-gallery": "Show your art! 🖼️ Share your creativity with the world!",
  };

  useEffect(() => {
    const pageKey = currentPage.startsWith("game:") ? "games" : currentPage;
    const newMessage = messages[pageKey] || "Have fun exploring! 🌟";
    setMessage(newMessage);
    setIsVisible(true);

    if (voiceEnabled) {
      speakMessage(newMessage);
    }

    const timer = setTimeout(() => {
      setIsVisible(false);
    }, 8000);

    return () => clearTimeout(timer);
  }, [currentPage, voiceEnabled]);

  const speakMessage = (text: string) => {
    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.rate = 0.9;
      utterance.pitch = 1.2;
      window.speechSynthesis.cancel();
      window.speechSynthesis.speak(utterance);
    }
  };

  const toggleVoice = () => {
    const newVoiceState = !voiceEnabled;
    setVoiceEnabled(newVoiceState);
    if (newVoiceState && message) {
      speakMessage(message);
    } else {
      window.speechSynthesis.cancel();
    }
  };

  const showHelp = () => {
    setIsVisible(true);
    if (voiceEnabled) {
      speakMessage(message);
    }
  };

  if (!isVisible) {
    return (
      <Button
        onClick={showHelp}
        className="fixed bottom-6 right-6 rounded-full w-16 h-16 shadow-2xl z-40 hover:scale-110 transition-transform"
        size="icon"
      >
        <img
          src="/assets/generated/mascot-guide.dim_200x200.png"
          alt="Mascot"
          className="w-12 h-12"
        />
      </Button>
    );
  }

  return (
    <Card className="fixed bottom-6 right-6 w-80 shadow-2xl border-4 border-primary z-40 animate-in slide-in-from-bottom-5">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <img
            src="/assets/generated/mascot-guide.dim_200x200.png"
            alt="Mascot"
            className="w-16 h-16 flex-shrink-0"
          />
          <div className="flex-1">
            <p className="text-lg font-semibold text-gray-800">{message}</p>
          </div>
        </div>
        <div className="flex gap-2 mt-4">
          <Button
            variant="outline"
            size="sm"
            onClick={toggleVoice}
            className="flex-1"
          >
            {voiceEnabled ? (
              <Volume2 className="w-4 h-4 mr-2" />
            ) : (
              <VolumeX className="w-4 h-4 mr-2" />
            )}
            Voice {voiceEnabled ? "On" : "Off"}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsVisible(false)}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
