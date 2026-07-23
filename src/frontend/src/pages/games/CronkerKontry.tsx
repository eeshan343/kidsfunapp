import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Award,
  Building2,
  Coins,
  Factory,
  Lightbulb,
  RotateCcw,
  Sparkles,
  TrendingUp,
  Wheat,
  Zap,
} from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { ModulePage } from "../../App";
import GameLayout from "../../components/GameLayout";

interface CronkerKontryProps {
  onNavigate: (page: ModulePage) => void;
}

interface Building {
  id: string;
  name: string;
  description: string;
  baseCost: number;
  goldPerSec: number;
  foodPerSec: number;
  powerPerSec: number;
  owned: number;
  icon: React.ReactNode;
}

interface Upgrade {
  id: string;
  name: string;
  description: string;
  cost: number;
  multiplier: number;
  purchased: boolean;
  requirement: string;
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  unlocked: boolean;
  requirement: string;
}

export default function CronkerKontry({ onNavigate }: CronkerKontryProps) {
  // Resources
  const [gold, setGold] = useState(100);
  const [food, setFood] = useState(0);
  const [power, setPower] = useState(0);

  // Per-second income
  const [goldPerSec, setGoldPerSec] = useState(0);
  const [foodPerSec, setFoodPerSec] = useState(0);
  const [powerPerSec, setPowerPerSec] = useState(0);

  // Prestige
  const [prestigeLevel, setPrestigeLevel] = useState(0);
  const [prestigeMultiplier, setPrestigeMultiplier] = useState(1);

  // Game state
  const [totalClicks, setTotalClicks] = useState(0);
  const [gameOver, setGameOver] = useState(false);
  const animationRef = useRef<number | undefined>(undefined);
  const lastUpdateRef = useRef<number>(Date.now());

  // Buildings
  const [buildings, setBuildings] = useState<Building[]>([
    {
      id: "farm",
      name: "Cronker Farm",
      description: "A humble farm that grows cronker crops and produces gold",
      baseCost: 15,
      goldPerSec: 0.5,
      foodPerSec: 1,
      powerPerSec: 0,
      owned: 0,
      icon: <Wheat className="w-6 h-6" />,
    },
    {
      id: "power-plant",
      name: "Zappy Power Plant",
      description: "Generates electric power and some gold from energy sales",
      baseCost: 100,
      goldPerSec: 2,
      foodPerSec: 0,
      powerPerSec: 3,
      owned: 0,
      icon: <Zap className="w-6 h-6" />,
    },
    {
      id: "factory",
      name: "Giggle Factory",
      description: "Produces goods that generate gold, food, and power",
      baseCost: 500,
      goldPerSec: 10,
      foodPerSec: 5,
      powerPerSec: 5,
      owned: 0,
      icon: <Factory className="w-6 h-6" />,
    },
    {
      id: "research-lab",
      name: "Brainy Research Lab",
      description: "Develops technologies that boost all resource production",
      baseCost: 2000,
      goldPerSec: 25,
      foodPerSec: 15,
      powerPerSec: 20,
      owned: 0,
      icon: <Lightbulb className="w-6 h-6" />,
    },
    {
      id: "capitol",
      name: "Grand Capitol",
      description: "The heart of Cronker Kontry, massively boosts everything!",
      baseCost: 10000,
      goldPerSec: 100,
      foodPerSec: 75,
      powerPerSec: 100,
      owned: 0,
      icon: <Building2 className="w-6 h-6" />,
    },
  ]);

  // Upgrades
  const [upgrades, setUpgrades] = useState<Upgrade[]>([
    {
      id: "better-tools",
      name: "Better Cronker Tools",
      description: "Doubles farm production",
      cost: 100,
      multiplier: 2,
      purchased: false,
      requirement: "Own 5 farms",
    },
    {
      id: "solar-panels",
      name: "Solar Panels",
      description: "Triples power plant output",
      cost: 500,
      multiplier: 3,
      purchased: false,
      requirement: "Own 3 power plants",
    },
    {
      id: "automation",
      name: "Factory Automation",
      description: "Doubles factory efficiency",
      cost: 2000,
      multiplier: 2,
      purchased: false,
      requirement: "Own 2 factories",
    },
    {
      id: "super-science",
      name: "Super Science",
      description: "Triples research lab output",
      cost: 8000,
      multiplier: 3,
      purchased: false,
      requirement: "Own 1 research lab",
    },
    {
      id: "golden-age",
      name: "Golden Age",
      description: "Doubles all production!",
      cost: 50000,
      multiplier: 2,
      purchased: false,
      requirement: "Own 1 capitol",
    },
  ]);

  // Achievements
  const [achievements, setAchievements] = useState<Achievement[]>([
    {
      id: "first-click",
      name: "First Click!",
      description: "Click the gold button for the first time",
      unlocked: false,
      requirement: "1 click",
    },
    {
      id: "clicker",
      name: "Clicker Champion",
      description: "Click 100 times",
      unlocked: false,
      requirement: "100 clicks",
    },
    {
      id: "first-building",
      name: "Builder",
      description: "Purchase your first building",
      unlocked: false,
      requirement: "1 building",
    },
    {
      id: "rich",
      name: "Getting Rich!",
      description: "Accumulate 10,000 gold",
      unlocked: false,
      requirement: "10,000 gold",
    },
    {
      id: "prestige-master",
      name: "Prestige Master",
      description: "Prestige for the first time",
      unlocked: false,
      requirement: "Prestige once",
    },
  ]);

  // Calculate building cost with scaling
  const getBuildingCost = (building: Building): number => {
    return Math.floor(building.baseCost * 1.15 ** building.owned);
  };

  // Handle clicking for gold
  const handleClick = () => {
    setGold((prev) => prev + 1 * prestigeMultiplier);
    setTotalClicks((prev) => prev + 1);

    // Check achievements
    if (totalClicks === 0) {
      unlockAchievement("first-click");
    }
    if (totalClicks + 1 >= 100) {
      unlockAchievement("clicker");
    }
  };

  // Purchase building
  const purchaseBuilding = (buildingId: string) => {
    const building = buildings.find((b) => b.id === buildingId);
    if (!building) return;

    const cost = getBuildingCost(building);
    if (gold < cost) return;

    setGold((prev) => prev - cost);
    setBuildings((prev) =>
      prev.map((b) => (b.id === buildingId ? { ...b, owned: b.owned + 1 } : b)),
    );

    // Check achievements
    const totalBuildings = buildings.reduce((sum, b) => sum + b.owned, 0);
    if (totalBuildings === 0) {
      unlockAchievement("first-building");
    }
  };

  // Purchase upgrade
  const purchaseUpgrade = (upgradeId: string) => {
    const upgrade = upgrades.find((u) => u.id === upgradeId);
    if (!upgrade || upgrade.purchased) return;

    if (gold < upgrade.cost) return;

    setGold((prev) => prev - upgrade.cost);
    setUpgrades((prev) =>
      prev.map((u) => (u.id === upgradeId ? { ...u, purchased: true } : u)),
    );
  };

  // Unlock achievement
  const unlockAchievement = (achievementId: string) => {
    setAchievements((prev) =>
      prev.map((a) =>
        a.id === achievementId && !a.unlocked ? { ...a, unlocked: true } : a,
      ),
    );
  };

  // Prestige/Restart
  const handlePrestige = () => {
    if (gold < 100000) return;

    setPrestigeLevel((prev) => prev + 1);
    setPrestigeMultiplier((prev) => prev + 0.1);

    // Reset everything except prestige
    setGold(100);
    setFood(0);
    setPower(0);
    setGoldPerSec(0);
    setFoodPerSec(0);
    setPowerPerSec(0);
    setTotalClicks(0);

    setBuildings((prev) => prev.map((b) => ({ ...b, owned: 0 })));
    setUpgrades((prev) => prev.map((u) => ({ ...u, purchased: false })));

    unlockAchievement("prestige-master");
  };

  // Calculate per-second income
  useEffect(() => {
    let totalGold = 0;
    let totalFood = 0;
    let totalPower = 0;

    for (const building of buildings) {
      if (building.owned > 0) {
        // Apply upgrade multipliers
        let multiplier = prestigeMultiplier;

        if (
          building.id === "farm" &&
          upgrades.find((u) => u.id === "better-tools")?.purchased
        ) {
          multiplier *= 2;
        }
        if (
          building.id === "power-plant" &&
          upgrades.find((u) => u.id === "solar-panels")?.purchased
        ) {
          multiplier *= 3;
        }
        if (
          building.id === "factory" &&
          upgrades.find((u) => u.id === "automation")?.purchased
        ) {
          multiplier *= 2;
        }
        if (
          building.id === "research-lab" &&
          upgrades.find((u) => u.id === "super-science")?.purchased
        ) {
          multiplier *= 3;
        }
        if (upgrades.find((u) => u.id === "golden-age")?.purchased) {
          multiplier *= 2;
        }

        totalGold += building.goldPerSec * building.owned * multiplier;
        totalFood += building.foodPerSec * building.owned * multiplier;
        totalPower += building.powerPerSec * building.owned * multiplier;
      }
    }

    setGoldPerSec(totalGold);
    setFoodPerSec(totalFood);
    setPowerPerSec(totalPower);
  }, [buildings, upgrades, prestigeMultiplier]);

  // Passive income loop
  // biome-ignore lint/correctness/useExhaustiveDependencies: lastUpdateRef is stable
  useEffect(() => {
    const update = () => {
      const now = Date.now();
      const delta = (now - lastUpdateRef.current) / 1000;
      lastUpdateRef.current = now;

      if (goldPerSec > 0 || foodPerSec > 0 || powerPerSec > 0) {
        setGold((prev) => prev + goldPerSec * delta);
        setFood((prev) => prev + foodPerSec * delta);
        setPower((prev) => prev + powerPerSec * delta);
      }

      // Check gold achievement
      if (gold >= 10000) {
        unlockAchievement("rich");
      }

      animationRef.current = requestAnimationFrame(update);
    };

    animationRef.current = requestAnimationFrame(update);

    return () => {
      if (animationRef.current !== undefined) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [goldPerSec, foodPerSec, powerPerSec, gold]);

  const handleRestart = () => {
    setGameOver(false);
  };

  return (
    <GameLayout
      title="Cronker Kontry"
      score={Math.floor(gold)}
      highScore={0}
      onRestart={handleRestart}
      onNavigate={onNavigate}
      gameOver={gameOver}
      showScore={false}
    >
      <div className="p-6 space-y-6 bg-gradient-to-br from-green-50 via-yellow-50 to-orange-50 min-h-[600px]">
        {/* Header with Resources */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card className="border-4 border-yellow-400 bg-gradient-to-br from-yellow-100 to-yellow-200">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-xl">
                <Coins className="w-6 h-6 text-yellow-600" />
                Gold
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-yellow-700">
                {Math.floor(gold)}
              </div>
              <div className="text-sm text-yellow-600 mt-1">
                +{goldPerSec.toFixed(1)}/sec
              </div>
            </CardContent>
          </Card>

          <Card className="border-4 border-green-400 bg-gradient-to-br from-green-100 to-green-200">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-xl">
                <Wheat className="w-6 h-6 text-green-600" />
                Food
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-green-700">
                {Math.floor(food)}
              </div>
              <div className="text-sm text-green-600 mt-1">
                +{foodPerSec.toFixed(1)}/sec
              </div>
            </CardContent>
          </Card>

          <Card className="border-4 border-blue-400 bg-gradient-to-br from-blue-100 to-blue-200">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-xl">
                <Zap className="w-6 h-6 text-blue-600" />
                Power
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold text-blue-700">
                {Math.floor(power)}
              </div>
              <div className="text-sm text-blue-600 mt-1">
                +{powerPerSec.toFixed(1)}/sec
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Tabs */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-5 h-auto">
            <TabsTrigger value="overview" className="text-sm md:text-base">
              Overview
            </TabsTrigger>
            <TabsTrigger value="buildings" className="text-sm md:text-base">
              Buildings
            </TabsTrigger>
            <TabsTrigger value="upgrades" className="text-sm md:text-base">
              Upgrades
            </TabsTrigger>
            <TabsTrigger value="achievements" className="text-sm md:text-base">
              Achievements
            </TabsTrigger>
            <TabsTrigger value="prestige" className="text-sm md:text-base">
              Prestige
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-4">
            <Card className="border-4">
              <CardHeader>
                <CardTitle className="text-2xl">
                  Welcome to Cronker Kontry!
                </CardTitle>
                <CardDescription className="text-base">
                  Click to earn gold, build structures, and grow your empire!
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Click Button */}
                <div className="flex flex-col items-center gap-4">
                  <Button
                    size="lg"
                    onClick={handleClick}
                    className="w-48 h-48 rounded-full text-4xl font-bold bg-gradient-to-br from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 shadow-2xl transform hover:scale-105 transition-all"
                  >
                    <div className="flex flex-col items-center">
                      <Coins className="w-16 h-16 mb-2" />
                      <span>Click!</span>
                    </div>
                  </Button>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-gray-700">
                      +{(1 * prestigeMultiplier).toFixed(1)} Gold per click
                    </div>
                    <div className="text-sm text-gray-500">
                      Total clicks: {totalClicks}
                    </div>
                  </div>
                </div>

                <Separator />

                {/* Stats */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-4 bg-purple-50 rounded-lg border-2 border-purple-300">
                    <div className="text-3xl font-bold text-purple-600">
                      {prestigeLevel}
                    </div>
                    <div className="text-sm text-purple-700">
                      Prestige Level
                    </div>
                  </div>
                  <div className="text-center p-4 bg-pink-50 rounded-lg border-2 border-pink-300">
                    <div className="text-3xl font-bold text-pink-600">
                      {(prestigeMultiplier * 100).toFixed(0)}%
                    </div>
                    <div className="text-sm text-pink-700">
                      Production Bonus
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Buildings Tab */}
          <TabsContent value="buildings" className="space-y-4">
            {buildings.map((building) => {
              const cost = getBuildingCost(building);
              const canAfford = gold >= cost;

              return (
                <Card
                  key={building.id}
                  className={`border-4 ${canAfford ? "border-green-400" : "border-gray-300"}`}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-blue-100 rounded-lg">
                          {building.icon}
                        </div>
                        <div>
                          <CardTitle className="text-xl">
                            {building.name}
                          </CardTitle>
                          <CardDescription>
                            {building.description}
                          </CardDescription>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-lg font-bold">
                        Owned: {building.owned}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between flex-wrap gap-4">
                      <div className="space-y-1 text-sm">
                        <div className="flex items-center gap-2">
                          <Coins className="w-4 h-4 text-yellow-600" />
                          <span>
                            +{building.goldPerSec.toFixed(1)} gold/sec
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Wheat className="w-4 h-4 text-green-600" />
                          <span>
                            +{building.foodPerSec.toFixed(1)} food/sec
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Zap className="w-4 h-4 text-blue-600" />
                          <span>
                            +{building.powerPerSec.toFixed(1)} power/sec
                          </span>
                        </div>
                      </div>
                      <Button
                        onClick={() => purchaseBuilding(building.id)}
                        disabled={!canAfford}
                        className="font-bold"
                      >
                        <Coins className="w-4 h-4 mr-2" />
                        Buy for {cost}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </TabsContent>

          {/* Upgrades Tab */}
          <TabsContent value="upgrades" className="space-y-4">
            {upgrades.map((upgrade) => {
              const canAfford = gold >= upgrade.cost && !upgrade.purchased;

              return (
                <Card
                  key={upgrade.id}
                  className={`border-4 ${upgrade.purchased ? "border-green-400 bg-green-50" : canAfford ? "border-yellow-400" : "border-gray-300"}`}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-xl flex items-center gap-2">
                          <TrendingUp className="w-5 h-5" />
                          {upgrade.name}
                          {upgrade.purchased && (
                            <Badge className="bg-green-600">Purchased</Badge>
                          )}
                        </CardTitle>
                        <CardDescription>{upgrade.description}</CardDescription>
                        <div className="text-sm text-gray-500 mt-1">
                          Requires: {upgrade.requirement}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div className="text-lg font-bold text-purple-600">
                        {upgrade.multiplier}x Multiplier
                      </div>
                      <Button
                        onClick={() => purchaseUpgrade(upgrade.id)}
                        disabled={!canAfford || upgrade.purchased}
                        className="font-bold"
                      >
                        <Coins className="w-4 h-4 mr-2" />
                        {upgrade.purchased
                          ? "Owned"
                          : `Buy for ${upgrade.cost}`}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </TabsContent>

          {/* Achievements Tab */}
          <TabsContent value="achievements" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {achievements.map((achievement) => (
                <Card
                  key={achievement.id}
                  className={`border-4 ${achievement.unlocked ? "border-yellow-400 bg-yellow-50" : "border-gray-300"}`}
                >
                  <CardHeader>
                    <CardTitle className="text-lg flex items-center gap-2">
                      <Award
                        className={`w-5 h-5 ${achievement.unlocked ? "text-yellow-600" : "text-gray-400"}`}
                      />
                      {achievement.name}
                      {achievement.unlocked && (
                        <Badge className="bg-yellow-600">Unlocked!</Badge>
                      )}
                    </CardTitle>
                    <CardDescription>{achievement.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="text-sm text-gray-600">
                      Requirement: {achievement.requirement}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Prestige Tab */}
          <TabsContent value="prestige" className="space-y-4">
            <Card className="border-4 border-purple-400 bg-gradient-to-br from-purple-50 to-pink-50">
              <CardHeader>
                <CardTitle className="text-2xl flex items-center gap-2">
                  <Sparkles className="w-6 h-6 text-purple-600" />
                  Prestige System
                </CardTitle>
                <CardDescription className="text-base">
                  Reset your progress for permanent bonuses!
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-4">
                  <div className="p-4 bg-white rounded-lg border-2 border-purple-300">
                    <div className="text-sm text-gray-600 mb-2">
                      Current Prestige Level
                    </div>
                    <div className="text-4xl font-bold text-purple-600">
                      {prestigeLevel}
                    </div>
                  </div>

                  <div className="p-4 bg-white rounded-lg border-2 border-pink-300">
                    <div className="text-sm text-gray-600 mb-2">
                      Current Production Bonus
                    </div>
                    <div className="text-4xl font-bold text-pink-600">
                      +{((prestigeMultiplier - 1) * 100).toFixed(0)}%
                    </div>
                  </div>

                  <div className="p-4 bg-white rounded-lg border-2 border-orange-300">
                    <div className="text-sm text-gray-600 mb-2">
                      Next Prestige Bonus
                    </div>
                    <div className="text-4xl font-bold text-orange-600">
                      +10%
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-4">
                  <div className="text-center">
                    <div className="text-lg font-bold text-gray-700 mb-2">
                      Prestige Cost: 100,000 Gold
                    </div>
                    <Progress value={(gold / 100000) * 100} className="h-4" />
                    <div className="text-sm text-gray-500 mt-1">
                      {Math.floor(gold)} / 100,000
                    </div>
                  </div>

                  <Button
                    onClick={handlePrestige}
                    disabled={gold < 100000}
                    className="w-full h-16 text-xl font-bold bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                  >
                    <RotateCcw className="w-6 h-6 mr-2" />
                    Prestige & Restart
                  </Button>

                  <div className="text-sm text-gray-600 text-center">
                    ⚠️ This will reset all progress except prestige bonuses!
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </GameLayout>
  );
}
