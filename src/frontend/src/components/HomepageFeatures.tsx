import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Award,
  BookOpen,
  Brain,
  Calendar,
  Gamepad2,
  Gift,
  Heart,
  Laugh,
  Mail,
  MessageSquare,
  Music,
  Palette,
  PartyPopper,
  Sparkles,
  Sticker,
  Target,
  Trophy,
  User,
  Video,
  Wand2,
} from "lucide-react";

interface HomepageFeaturesProps {
  onGetStarted: () => void;
}

const features = [
  {
    icon: Brain,
    title: "Smart Hub",
    description:
      "Personalized recommendations and activity tracking to help users discover what they love.",
    color: "text-neon-purple",
  },
  {
    icon: Heart,
    title: "Virtual Pet Hub",
    description: "Take care of a virtual pet, watch it grow, and earn rewards.",
    color: "text-neon-pink",
  },
  {
    icon: Gamepad2,
    title: "Games",
    description:
      "Fun puzzles and educational games that entertain while learning.",
    color: "text-neon-cyan",
  },
  {
    icon: BookOpen,
    title: "Learn Hub",
    description:
      "Interactive lessons covering reading, science, arts, and discovery.",
    color: "text-neon-green",
  },
  {
    icon: Wand2,
    title: "Creative Fun Hub",
    description:
      "Stories, karaoke, dance, and creative activities to spark imagination.",
    color: "text-neon-orange",
  },
  {
    icon: Target,
    title: "Spin the Wheel",
    description: "Spin every 20 minutes to win fun prizes and rewards.",
    color: "text-neon-pink",
  },
  {
    icon: Sticker,
    title: "Sticker Creator",
    description: "Design custom stickers and emojis to express creativity.",
    color: "text-neon-cyan",
  },
  {
    icon: Music,
    title: "Music Remix",
    description: "Mix beats and create original music tracks.",
    color: "text-neon-purple",
  },
  {
    icon: Award,
    title: "Certificates",
    description: "Generate achievement certificates to celebrate progress.",
    color: "text-neon-green",
  },
  {
    icon: PartyPopper,
    title: "Seasonal Events",
    description: "Holiday-themed activities and limited-time fun.",
    color: "text-neon-orange",
  },
  {
    icon: User,
    title: "Avatar Creator",
    description: "Create and customize a unique character.",
    color: "text-neon-pink",
  },
  {
    icon: BookOpen,
    title: "Story Builder",
    description: "Build animated stories using characters and scenes.",
    color: "text-neon-cyan",
  },
  {
    icon: Palette,
    title: "Craft & DIY",
    description: "Step-by-step guides for cool creative projects.",
    color: "text-neon-purple",
  },
  {
    icon: Palette,
    title: "Art Gallery",
    description: "Share artwork and explore creations from others.",
    color: "text-neon-green",
  },
  {
    icon: Calendar,
    title: "Events",
    description: "Manage birthdays, festivals, and special occasions.",
    color: "text-neon-orange",
  },
  {
    icon: Video,
    title: "Video Generator",
    description: "Create 2D videos with characters and scenes.",
    color: "text-neon-pink",
  },
  {
    icon: MessageSquare,
    title: "Chat",
    description: "Safe chatting with approved friends only.",
    color: "text-neon-cyan",
  },
  {
    icon: Mail,
    title: "Event Cards",
    description: "Design beautiful cards for any occasion.",
    color: "text-neon-purple",
  },
  {
    icon: Laugh,
    title: "Jokes",
    description: "Funny jokes and riddles for daily laughs.",
    color: "text-neon-green",
  },
  {
    icon: Trophy,
    title: "Rewards",
    description: "Earn badges, trophies, and grow your virtual pet.",
    color: "text-neon-orange",
  },
];

export default function HomepageFeatures({
  onGetStarted,
}: HomepageFeaturesProps) {
  return (
    <section className="py-16 px-4">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex justify-center mb-6">
            <Sparkles className="w-16 h-16 text-neon-pink animate-neon-pulse" />
          </div>
          <h2 className="text-4xl md:text-5xl font-bold text-neon-pink text-shadow-neon-lg mb-4">
            Discover Amazing Features!
          </h2>
          <p className="text-xl md:text-2xl text-neon-cyan text-shadow-neon-md max-w-3xl mx-auto">
            Explore games, learn new things, create art, and have tons of fun in
            a safe, kid-friendly environment!
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12">
          {features.map((feature) => {
            const Icon = feature.icon;
            return (
              <Card
                key={feature.title}
                className="bg-card/90 backdrop-blur-md border-2 border-neon-purple shadow-neon-md hover:shadow-neon-lg transition-all duration-300 hover:scale-105 cursor-pointer group"
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-3 mb-2">
                    <div
                      className={`p-2 rounded-lg bg-background/50 ${feature.color} shadow-neon-sm group-hover:shadow-neon-md transition-all`}
                    >
                      <Icon className="w-6 h-6" />
                    </div>
                  </div>
                  <CardTitle className="text-lg font-bold text-neon-pink text-shadow-neon-md">
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-foreground/90 text-sm leading-relaxed">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Call to Action */}
        <div className="text-center">
          <div className="bg-card/90 backdrop-blur-md border-4 border-neon-pink shadow-neon-lg rounded-2xl p-8 max-w-2xl mx-auto">
            <div className="flex justify-center mb-4">
              <Gift className="w-12 h-12 text-neon-orange animate-neon-pulse" />
            </div>
            <h3 className="text-3xl md:text-4xl font-bold text-neon-green text-shadow-neon-lg mb-4">
              Ready for Adventure?
            </h3>
            <p className="text-lg md:text-xl text-neon-cyan text-shadow-neon-md mb-6">
              Join thousands of kids having fun while learning! Login now to
              explore everything inside the app!
            </p>
            <Button
              onClick={onGetStarted}
              size="lg"
              className="text-xl px-8 py-6 font-bold shadow-neon-lg hover:shadow-neon-xl transition-all duration-300 hover:scale-110 bg-gradient-to-r from-neon-pink to-neon-purple"
            >
              <Sparkles className="w-6 h-6 mr-2" />
              Start Your Adventure!
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
