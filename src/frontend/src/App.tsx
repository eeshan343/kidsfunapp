import { Toaster } from "@/components/ui/sonner";
import { ThemeProvider } from "next-themes";
import { useEffect, useRef, useState } from "react";
import Header from "./components/Header";
import { useInternetIdentity } from "./hooks/useInternetIdentity";
import { useGetBannedModules, useIsCallerAdmin } from "./hooks/useQueries";
import AdminClaimPage from "./pages/AdminClaimPage";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import ArtGalleryPage from "./pages/ArtGalleryPage";
import AvatarCreatorPage from "./pages/AvatarCreatorPage";
import CertificatesPage from "./pages/CertificatesPage";
import ChatPage from "./pages/ChatPage";
import CraftDIYPage from "./pages/CraftDIYPage";
import CreativeFunHub from "./pages/CreativeFunHub";
import DanceChallengePage from "./pages/DanceChallengePage";
import Dashboard from "./pages/Dashboard";
import EventCardsPage from "./pages/EventCardsPage";
import EventsPage from "./pages/EventsPage";
import FeedbackPage from "./pages/FeedbackPage";
import FunnyFartHub from "./pages/FunnyFartHub";
import GamesHub from "./pages/GamesHub";
import GreenScreenFunPage from "./pages/GreenScreenFunPage";
import InteractiveShortsPage from "./pages/InteractiveShortsPage";
import JokesPage from "./pages/JokesPage";
import KaraokeModePage from "./pages/KaraokeModePage";
import LearnHubPage from "./pages/LearnHubPage";
import MusicRemixPage from "./pages/MusicRemixPage";
import PreLoginExperiencePage from "./pages/PreLoginExperiencePage";
import ProfileCustomization from "./pages/ProfileCustomization";
import RewardsPage from "./pages/RewardsPage";
import SeasonalEventsPage from "./pages/SeasonalEventsPage";
import SmartHubPage from "./pages/SmartHubPage";
import SpinWheelPage from "./pages/SpinWheelPage";
import StickerCreatorPage from "./pages/StickerCreatorPage";
import StoryBuilderPage from "./pages/StoryBuilderPage";
import VideoGeneratorPage from "./pages/VideoGeneratorPage";
import VideoHubPage from "./pages/VideoHubPage";
import VirtualPetHubPage from "./pages/VirtualPetHubPage";

import AmbulanceRescue from "./pages/games/AmbulanceRescue";
// Game imports
import BalloonPop from "./pages/games/BalloonPop";
import BibbleAdventure from "./pages/games/BibbleAdventure";
import BirthdayCakeMaker from "./pages/games/BirthdayCakeMaker";
import BossesLearnHabits from "./pages/games/BossesLearnHabits";
import ControlEnemies from "./pages/games/ControlEnemies";
import CronkerKontry from "./pages/games/CronkerKontry";
import DelayedControls from "./pages/games/DelayedControls";
import EclipseNowSolo from "./pages/games/EclipseNowSolo";
import EnemiesPlatforms from "./pages/games/EnemiesPlatforms";
import EnemyControlsCamera from "./pages/games/EnemyControlsCamera";
import EscapeRoomUniverse from "./pages/games/EscapeRoomUniverse";
import EverythingBreaks from "./pages/games/EverythingBreaks";
import EverythingIsButton from "./pages/games/EverythingIsButton";
import FamousPlaces from "./pages/games/FamousPlaces";
import ForestNight from "./pages/games/ForestNight";
import GadgetCombat from "./pages/games/GadgetCombat";
import GrandmaSecretArcade from "./pages/games/GrandmaSecretArcade";
import LiesAndTruths from "./pages/games/LiesAndTruths";
import MemoryMatch from "./pages/games/MemoryMatch";
import MindMazePuzzle from "./pages/games/MindMazePuzzle";
import MonsterMaze from "./pages/games/MonsterMaze";
import NumberRunner from "./pages/games/NumberRunner";
import OneRoomInfiniteGames from "./pages/games/OneRoomInfiniteGames";
import PacMan from "./pages/games/PacMan";
import PauseMechanic from "./pages/games/PauseMechanic";
import PoliceBuddyChase from "./pages/games/PoliceBuddyChase";
import PumpkinSmash from "./pages/games/PumpkinSmash";
import ReverseProgression from "./pages/games/ReverseProgression";
import ScreenIsEnemy from "./pages/games/ScreenIsEnemy";
import ShapeShiftingWorld from "./pages/games/ShapeShiftingWorld";
import SoundBasedWorld from "./pages/games/SoundBasedWorld";
import SpaceInvaders from "./pages/games/SpaceInvaders";
import SpaceStationLife from "./pages/games/SpaceStationLife";
import SpiderWebPuzzle from "./pages/games/SpiderWebPuzzle";
import SuperSpeedyRacer from "./pages/games/SuperSpeedyRacer";
import SuperpowerTraining from "./pages/games/SuperpowerTraining";
import Tetris from "./pages/games/Tetris";
import ThemeParkBuilder from "./pages/games/ThemeParkBuilder";
import TicTacToe from "./pages/games/TicTacToe";
import TimeControlAdventure from "./pages/games/TimeControlAdventure";
import TinyHeroGiantWorld from "./pages/games/TinyHeroGiantWorld";
import TutorialIsVillain from "./pages/games/TutorialIsVillain";
import WordWizard from "./pages/games/WordWizard";
import YouCanOnlyMoveWhenYouBlink from "./pages/games/YouCanOnlyMoveWhenYouBlink";
import YoureLateAlways from "./pages/games/YoureLateAlways";

export type ModulePage =
  | "pre-login"
  | "dashboard"
  | "games"
  | "profile"
  | "events"
  | "seasonal-events"
  | "avatar-creator"
  | "story-builder"
  | "craft-diy"
  | "art-gallery"
  | "video-generator"
  | "chat"
  | "event-cards"
  | "jokes"
  | "rewards"
  | "feedback"
  | "spin-wheel"
  | "sticker-creator"
  | "music-remix"
  | "certificates"
  | "creative-fun-hub"
  | "interactive-shorts"
  | "green-screen-fun"
  | "karaoke-mode"
  | "dance-challenge"
  | "learn-hub"
  | "virtual-pet-hub"
  | "smart-hub"
  | "admin-dashboard"
  | "admin-claim"
  | "funny-fart-hub"
  | "video-hub"
  | "game:balloon-pop"
  | "game:super-speedy-racer"
  | "game:ambulance-rescue"
  | "game:eclipse-now-solo"
  | "game:forest-night"
  | "game:memory-match"
  | "game:birthday-cake-maker"
  | "game:famous-places"
  | "game:word-wizard"
  | "game:police-buddy-chase"
  | "game:number-runner"
  | "game:bibble-adventure"
  | "game:shape-shifting-world"
  | "game:time-control-adventure"
  | "game:theme-park-builder"
  | "game:mind-maze-puzzle"
  | "game:space-station-life"
  | "game:superpower-training"
  | "game:escape-room-universe"
  | "game:gadget-combat"
  | "game:grandma-secret-arcade"
  | "game:screen-is-enemy"
  | "game:control-enemies"
  | "game:everything-breaks"
  | "game:sound-based-world"
  | "game:reverse-progression"
  | "game:enemies-platforms"
  | "game:pause-mechanic"
  | "game:youre-late-always"
  | "game:lies-and-truths"
  | "game:tiny-hero-giant-world"
  | "game:tic-tac-toe"
  | "game:monster-maze"
  | "game:spider-web-puzzle"
  | "game:pumpkin-smash"
  | "game:cronker-kontry"
  | "game:pac-man"
  | "game:tetris"
  | "game:space-invaders"
  | "game:floor-is-liar"
  | "game:inventory-is-enemy"
  | "game:speed-is-health"
  | "game:enemy-controls-camera"
  | "game:one-room-infinite-games"
  | "game:move-when-blink"
  | "game:bosses-learn-habits"
  | "game:everything-is-button"
  | "game:delayed-controls"
  | "game:tutorial-is-villain";

// Trial games that can be played without authentication - centralized source of truth
export const TRIAL_GAMES: ModulePage[] = [
  "game:balloon-pop",
  "game:memory-match",
  "game:tic-tac-toe",
  "game:birthday-cake-maker",
];

// Pages that can be accessed without authentication
const UNAUTHENTICATED_PAGES: ModulePage[] = [
  "pre-login",
  "games",
  ...TRIAL_GAMES,
];

function AppContent() {
  const [currentPage, setCurrentPage] = useState<ModulePage>("pre-login");
  const [redirectMessage, setRedirectMessage] = useState<string>("");
  const { isAuthenticated, isLoading } = useInternetIdentity();
  const { data: isAdmin } = useIsCallerAdmin();
  const { data: bannedModules } = useGetBannedModules();

  // Keep the latest banned-module list + admin status accessible from the
  // navigation handler without re-creating the handler on every change (so
  // consumers' useCallback deps stay stable). Updated via refs on each render.
  const bannedModulesRef = useRef<string[]>([]);
  const isAdminRef = useRef<boolean>(false);
  bannedModulesRef.current = bannedModules ?? [];
  isAdminRef.current = isAdmin === true;

  // Handle navigation with access gating
  const handleNavigate = (page: ModulePage) => {
    // If not authenticated and trying to access restricted page
    if (!isAuthenticated && !UNAUTHENTICATED_PAGES.includes(page)) {
      setRedirectMessage("Please log in to access this section.");
      setCurrentPage("pre-login");
      return;
    }

    // Banned modules are invisible to regular users. If the current user is
    // NOT an admin and the target module is banned, silently redirect to the
    // Dashboard instead of navigating to the banned module. Admins can still
    // access/preview banned modules from the admin panel.
    if (
      isAuthenticated &&
      !isAdminRef.current &&
      bannedModulesRef.current.includes(page)
    ) {
      setCurrentPage("dashboard");
      return;
    }

    // Clear redirect message on successful navigation
    setRedirectMessage("");
    setCurrentPage(page);
  };

  // Redirect to pre-login if not authenticated and on restricted page
  useEffect(() => {
    if (
      !isLoading &&
      !isAuthenticated &&
      !UNAUTHENTICATED_PAGES.includes(currentPage)
    ) {
      setRedirectMessage("Please log in to access this section.");
      setCurrentPage("pre-login");
    }
  }, [isAuthenticated, isLoading, currentPage]);

  // Banned-module guard: if a non-admin user is currently on a banned module
  // (e.g. the ban was applied while they were viewing it, or they reached it
  // via a stale link before the ban list loaded), silently bounce them back to
  // the Dashboard. Admins are exempt so they can still preview banned modules.
  useEffect(() => {
    if (
      !isLoading &&
      isAuthenticated &&
      !isAdminRef.current &&
      currentPage !== "dashboard" &&
      currentPage !== "pre-login" &&
      (bannedModules ?? []).includes(currentPage)
    ) {
      setCurrentPage("dashboard");
    }
  }, [isLoading, isAuthenticated, currentPage, bannedModules]);

  // Set default page based on authentication status
  useEffect(() => {
    if (!isLoading) {
      if (isAuthenticated && currentPage === "pre-login") {
        setCurrentPage("dashboard");
      } else if (!isAuthenticated && currentPage === "dashboard") {
        setCurrentPage("pre-login");
      }
    }
  }, [isAuthenticated, isLoading, currentPage]);

  const renderPage = () => {
    // Show pre-login for unauthenticated users
    if (!isAuthenticated && currentPage === "pre-login") {
      return (
        <PreLoginExperiencePage
          onNavigate={handleNavigate}
          redirectMessage={redirectMessage}
        />
      );
    }

    // Render authenticated or trial pages
    switch (currentPage) {
      case "pre-login":
        return (
          <PreLoginExperiencePage
            onNavigate={handleNavigate}
            redirectMessage={redirectMessage}
          />
        );
      case "dashboard":
        return <Dashboard onNavigate={handleNavigate} />;
      case "games":
        return (
          <GamesHub
            onNavigate={handleNavigate}
            isAuthenticated={isAuthenticated}
          />
        );
      case "profile":
        return <ProfileCustomization />;
      case "events":
        return <EventsPage />;
      case "seasonal-events":
        return <SeasonalEventsPage />;
      case "avatar-creator":
        return <AvatarCreatorPage />;
      case "story-builder":
        return <StoryBuilderPage />;
      case "craft-diy":
        return <CraftDIYPage />;
      case "art-gallery":
        return <ArtGalleryPage />;
      case "video-generator":
        return <VideoGeneratorPage />;
      case "chat":
        return <ChatPage />;
      case "event-cards":
        return <EventCardsPage />;
      case "jokes":
        return <JokesPage />;
      case "rewards":
        return <RewardsPage />;
      case "feedback":
        return <FeedbackPage />;
      case "spin-wheel":
        return <SpinWheelPage />;
      case "sticker-creator":
        return <StickerCreatorPage />;
      case "music-remix":
        return <MusicRemixPage />;
      case "certificates":
        return <CertificatesPage />;
      case "creative-fun-hub":
        return <CreativeFunHub onNavigate={handleNavigate} />;
      case "interactive-shorts":
        return <InteractiveShortsPage onNavigate={handleNavigate} />;
      case "green-screen-fun":
        return <GreenScreenFunPage onNavigate={handleNavigate} />;
      case "karaoke-mode":
        return <KaraokeModePage onNavigate={handleNavigate} />;
      case "dance-challenge":
        return <DanceChallengePage onNavigate={handleNavigate} />;
      case "learn-hub":
        return <LearnHubPage onNavigate={handleNavigate} />;
      case "virtual-pet-hub":
        return <VirtualPetHubPage />;
      case "smart-hub":
        return <SmartHubPage />;
      case "admin-dashboard":
        return <AdminDashboardPage onNavigate={handleNavigate} />;
      case "admin-claim":
        return <AdminClaimPage onNavigate={handleNavigate} />;
      case "funny-fart-hub":
        return <FunnyFartHub onNavigate={handleNavigate} />;
      case "video-hub":
        return <VideoHubPage />;
      case "game:balloon-pop":
        return <BalloonPop onNavigate={handleNavigate} />;
      case "game:super-speedy-racer":
        return <SuperSpeedyRacer onNavigate={handleNavigate} />;
      case "game:ambulance-rescue":
        return <AmbulanceRescue onNavigate={handleNavigate} />;
      case "game:eclipse-now-solo":
        return <EclipseNowSolo onNavigate={handleNavigate} />;
      case "game:forest-night":
        return <ForestNight onNavigate={handleNavigate} />;
      case "game:memory-match":
        return <MemoryMatch onNavigate={handleNavigate} />;
      case "game:birthday-cake-maker":
        return <BirthdayCakeMaker onNavigate={handleNavigate} />;
      case "game:famous-places":
        return <FamousPlaces onNavigate={handleNavigate} />;
      case "game:word-wizard":
        return <WordWizard onNavigate={handleNavigate} />;
      case "game:police-buddy-chase":
        return <PoliceBuddyChase onNavigate={handleNavigate} />;
      case "game:number-runner":
        return <NumberRunner onNavigate={handleNavigate} />;
      case "game:bibble-adventure":
        return <BibbleAdventure onNavigate={handleNavigate} />;
      case "game:shape-shifting-world":
        return <ShapeShiftingWorld onNavigate={handleNavigate} />;
      case "game:time-control-adventure":
        return <TimeControlAdventure onNavigate={handleNavigate} />;
      case "game:theme-park-builder":
        return <ThemeParkBuilder onNavigate={handleNavigate} />;
      case "game:mind-maze-puzzle":
        return <MindMazePuzzle onNavigate={handleNavigate} />;
      case "game:space-station-life":
        return <SpaceStationLife onNavigate={handleNavigate} />;
      case "game:superpower-training":
        return <SuperpowerTraining onNavigate={handleNavigate} />;
      case "game:escape-room-universe":
        return <EscapeRoomUniverse onNavigate={handleNavigate} />;
      case "game:gadget-combat":
        return <GadgetCombat onNavigate={handleNavigate} />;
      case "game:grandma-secret-arcade":
        return <GrandmaSecretArcade onNavigate={handleNavigate} />;
      case "game:screen-is-enemy":
        return <ScreenIsEnemy onNavigate={handleNavigate} />;
      case "game:control-enemies":
        return <ControlEnemies onNavigate={handleNavigate} />;
      case "game:everything-breaks":
        return <EverythingBreaks onNavigate={handleNavigate} />;
      case "game:sound-based-world":
        return <SoundBasedWorld onNavigate={handleNavigate} />;
      case "game:reverse-progression":
        return <ReverseProgression onNavigate={handleNavigate} />;
      case "game:enemies-platforms":
        return <EnemiesPlatforms onNavigate={handleNavigate} />;
      case "game:pause-mechanic":
        return <PauseMechanic onNavigate={handleNavigate} />;
      case "game:youre-late-always":
        return <YoureLateAlways onNavigate={handleNavigate} />;
      case "game:lies-and-truths":
        return <LiesAndTruths onNavigate={handleNavigate} />;
      case "game:tiny-hero-giant-world":
        return <TinyHeroGiantWorld onNavigate={handleNavigate} />;
      case "game:tic-tac-toe":
        return <TicTacToe onNavigate={handleNavigate} />;
      case "game:monster-maze":
        return <MonsterMaze onNavigate={handleNavigate} />;
      case "game:spider-web-puzzle":
        return <SpiderWebPuzzle onNavigate={handleNavigate} />;
      case "game:pumpkin-smash":
        return <PumpkinSmash onNavigate={handleNavigate} />;
      case "game:cronker-kontry":
        return <CronkerKontry onNavigate={handleNavigate} />;
      case "game:pac-man":
        return <PacMan onNavigate={handleNavigate} />;
      case "game:tetris":
        return <Tetris onNavigate={handleNavigate} />;
      case "game:space-invaders":
        return <SpaceInvaders onNavigate={handleNavigate} />;
      case "game:floor-is-liar":
      case "game:inventory-is-enemy":
      case "game:speed-is-health":
      case "game:one-room-infinite-games":
        return <OneRoomInfiniteGames onNavigate={handleNavigate} />;
      case "game:move-when-blink":
        return <YouCanOnlyMoveWhenYouBlink onNavigate={handleNavigate} />;
      case "game:bosses-learn-habits":
        return <BossesLearnHabits onNavigate={handleNavigate} />;
      case "game:everything-is-button":
        return <EverythingIsButton onNavigate={handleNavigate} />;
      case "game:delayed-controls":
        return <DelayedControls onNavigate={handleNavigate} />;
      case "game:tutorial-is-villain":
        return <TutorialIsVillain onNavigate={handleNavigate} />;
      case "game:enemy-controls-camera":
        return <EnemyControlsCamera onNavigate={handleNavigate} />;
      default:
        return isAuthenticated ? (
          <Dashboard onNavigate={handleNavigate} />
        ) : (
          <PreLoginExperiencePage
            onNavigate={handleNavigate}
            redirectMessage={redirectMessage}
          />
        );
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header
        currentPage={currentPage}
        onNavigate={handleNavigate}
        isAuthenticated={isAuthenticated}
      />
      {renderPage()}
      <Toaster />
    </div>
  );
}

function App() {
  return (
    <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
      <AppContent />
    </ThemeProvider>
  );
}

export default App;
