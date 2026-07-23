import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Award, Heart, Star, Target, Trophy, Zap } from "lucide-react";
import { useEffect, useState } from "react";
import { triggerAchievementCelebration } from "../components/AchievementCelebration";
import { showEmotionFeedback } from "../components/EmotionFeedback";
import {
  useGetMyGameStates,
  useGetUserBadgeProofs,
  useGetUserRewards,
} from "../hooks/useQueries";

export default function RewardsPage() {
  const { data: gameStates } = useGetMyGameStates();
  const { data: userRewards } = useGetUserRewards();
  const { data: badgeProofs = [] } = useGetUserBadgeProofs();
  const [hasShownWelcome, setHasShownWelcome] = useState(false);

  const totalScore = userRewards?.points || 0;
  const gamesPlayed = gameStates?.length || 0;
  const totalAchievements =
    gameStates?.reduce((sum, gs) => sum + gs.achievements.length, 0) || 0;

  useEffect(() => {
    if (!hasShownWelcome) {
      showEmotionFeedback("Welcome to your rewards!");
      setHasShownWelcome(true);
    }
  }, [hasShownWelcome]);

  // Get earned badges from backend badge proofs
  const earnedBadgeNames = badgeProofs.map((proof) => proof.badge.name);

  const badges = [
    {
      id: 1,
      name: "First Steps",
      icon: Star,
      earned: gamesPlayed >= 1 || earnedBadgeNames.includes("First Steps"),
      requirement: "Play your first game",
    },
    {
      id: 2,
      name: "Game Master",
      icon: Trophy,
      earned: gamesPlayed >= 5 || earnedBadgeNames.includes("Game Master"),
      requirement: "Play 5 different games",
    },
    {
      id: 3,
      name: "High Scorer",
      icon: Target,
      earned: totalScore >= 1000 || earnedBadgeNames.includes("High Scorer"),
      requirement: "Score 1000 points total",
    },
    {
      id: 4,
      name: "Champion",
      icon: Award,
      earned: totalScore >= 5000 || earnedBadgeNames.includes("Champion"),
      requirement: "Score 5000 points total",
    },
    {
      id: 5,
      name: "Speed Demon",
      icon: Zap,
      earned: earnedBadgeNames.includes("Speed Demon"),
      requirement: "Complete a game in under 1 minute",
    },
    {
      id: 6,
      name: "Perfect Score",
      icon: Star,
      earned: earnedBadgeNames.includes("Perfect Score"),
      requirement: "Get a perfect score in any game",
    },
    {
      id: 7,
      name: "Wheel Spinner",
      icon: Trophy,
      earned: earnedBadgeNames.includes("Wheel Spinner"),
      requirement: "Spin the wheel 10 times",
    },
    {
      id: 8,
      name: "Lucky Star",
      icon: Star,
      earned: earnedBadgeNames.includes("Lucky Star"),
      requirement: "Win Lucky Star badge from spin wheel",
    },
    {
      id: 9,
      name: "Golden Trophy",
      icon: Trophy,
      earned: earnedBadgeNames.includes("Golden Trophy"),
      requirement: "Win Golden Trophy badge from spin wheel",
    },
  ];

  // Use virtual pet level from backend rewards
  const petLevel = userRewards?.virtualPetLevel || 1;
  const petProgress = ((totalScore % 1000) / 1000) * 100;

  const handleBadgeClick = (badge: (typeof badges)[0]) => {
    if (badge.earned) {
      triggerAchievementCelebration(`${badge.name} Badge!`, "confetti");
      showEmotionFeedback("You're amazing!");
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-yellow-600 to-red-600 bg-clip-text text-transparent">
          Rewards & Achievements 🏆
        </h1>
        <p className="text-lg text-black">
          Track your progress and earn badges
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="border-4 bg-gradient-to-br from-yellow-50 to-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-black">
              <Trophy className="w-6 h-6 text-yellow-600" />
              Total Score
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-5xl font-bold text-yellow-600">{totalScore}</p>
            <p className="text-black mt-2">Keep playing to earn more!</p>
          </CardContent>
        </Card>

        <Card className="border-4 bg-gradient-to-br from-blue-50 to-purple-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-black">
              <Star className="w-6 h-6 text-blue-600" />
              Games Played
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-5xl font-bold text-blue-600">{gamesPlayed}</p>
            <p className="text-black mt-2">Try all 42 games!</p>
          </CardContent>
        </Card>

        <Card className="border-4 bg-gradient-to-br from-pink-50 to-red-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-black">
              <Award className="w-6 h-6 text-pink-600" />
              Achievements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-5xl font-bold text-pink-600">
              {totalAchievements}
            </p>
            <p className="text-black mt-2">Unlock more achievements!</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-4 bg-gradient-to-br from-green-50 to-teal-50">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-black">
            <Heart className="w-6 h-6 text-green-600" />
            Your Virtual Pet
          </CardTitle>
          <CardDescription className="text-black">
            Grow your pet by earning points from games and spin rewards!
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="text-center">
            <div className="text-8xl mb-4">🐶</div>
            <p className="text-2xl font-bold text-black">Level {petLevel}</p>
            <p className="text-black">Keep playing and spinning to level up!</p>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-black">
              <span>Progress to Level {petLevel + 1}</span>
              <span>{Math.floor(petProgress)}%</span>
            </div>
            <Progress value={petProgress} className="h-3" />
            <p className="text-xs text-black text-center">
              {totalScore} / {petLevel * 1000} points (1000 points per level)
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-4">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-black">
            <Trophy className="w-6 h-6" />
            Badge Collection
          </CardTitle>
          <CardDescription className="text-black">
            Earn badges by completing challenges and spinning the wheel
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {badges.map((badge) => {
              const Icon = badge.icon;
              return (
                <Card
                  key={badge.id}
                  className={`border-4 cursor-pointer transition-transform hover:scale-105 ${badge.earned ? "bg-gradient-to-br from-yellow-50 to-orange-50" : "bg-gray-50 opacity-60"}`}
                  onClick={() => handleBadgeClick(badge)}
                >
                  <CardContent className="p-6 text-center space-y-3">
                    <div
                      className={`w-16 h-16 mx-auto rounded-full flex items-center justify-center ${badge.earned ? "bg-yellow-400" : "bg-gray-300"}`}
                    >
                      <Icon
                        className={`w-8 h-8 ${badge.earned ? "text-white" : "text-gray-500"}`}
                      />
                    </div>
                    <div>
                      <p className="font-bold text-lg text-black">
                        {badge.name}
                      </p>
                      <p className="text-sm text-black">{badge.requirement}</p>
                    </div>
                    {badge.earned && (
                      <Badge className="bg-green-500 text-white">
                        Earned! ✓
                      </Badge>
                    )}
                    {!badge.earned && (
                      <Badge variant="secondary" className="text-black">
                        Locked
                      </Badge>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
