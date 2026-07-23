import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Home, Shuffle, Sparkles, Volume2, VolumeX } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import type { ModulePage } from "../App";

interface FunnyFartHubProps {
  onNavigate: (page: ModulePage) => void;
}

interface FartSound {
  id: string;
  name: string;
  color: string;
  type:
    | "short"
    | "long"
    | "reverb"
    | "echo"
    | "wet"
    | "squeaky"
    | "meme"
    | "bassy"
    | "rhythmic";
  emoji: string;
}

const fartSounds: FartSound[] = [
  {
    id: "classic-toot",
    name: "Classic Toot",
    color: "from-yellow-400 to-orange-400",
    type: "short",
    emoji: "💨",
  },
  {
    id: "squeaky-door",
    name: "Squeaky Door",
    color: "from-pink-400 to-red-400",
    type: "squeaky",
    emoji: "🚪",
  },
  {
    id: "thunder-rumble",
    name: "Thunder Rumble",
    color: "from-purple-400 to-indigo-400",
    type: "long",
    emoji: "⚡",
  },
  {
    id: "bubble-pop",
    name: "Bubble Pop",
    color: "from-cyan-400 to-blue-400",
    type: "wet",
    emoji: "🫧",
  },
  {
    id: "trumpet-blast",
    name: "Trumpet Blast",
    color: "from-red-500 to-orange-500",
    type: "bassy",
    emoji: "🎺",
  },
  {
    id: "echo-canyon",
    name: "Echo Canyon",
    color: "from-teal-400 to-green-400",
    type: "echo",
    emoji: "🏔️",
  },
  {
    id: "reverb-chamber",
    name: "Reverb Chamber",
    color: "from-indigo-500 to-purple-500",
    type: "reverb",
    emoji: "🎵",
  },
  {
    id: "rapid-fire",
    name: "Rapid Fire",
    color: "from-orange-500 to-red-600",
    type: "rhythmic",
    emoji: "💥",
  },
  {
    id: "whoopee-cushion",
    name: "Whoopee Cushion",
    color: "from-pink-500 to-purple-500",
    type: "meme",
    emoji: "🎈",
  },
  {
    id: "bass-drop",
    name: "Bass Drop",
    color: "from-blue-600 to-purple-600",
    type: "bassy",
    emoji: "🔊",
  },
  {
    id: "tiny-squeak",
    name: "Tiny Squeak",
    color: "from-yellow-300 to-pink-300",
    type: "squeaky",
    emoji: "🐭",
  },
  {
    id: "long-whistle",
    name: "Long Whistle",
    color: "from-green-400 to-cyan-400",
    type: "long",
    emoji: "🎶",
  },
  {
    id: "wet-splat",
    name: "Wet Splat",
    color: "from-teal-500 to-blue-500",
    type: "wet",
    emoji: "💦",
  },
  {
    id: "double-trouble",
    name: "Double Trouble",
    color: "from-red-400 to-pink-400",
    type: "rhythmic",
    emoji: "👯",
  },
  {
    id: "mega-reverb",
    name: "Mega Reverb",
    color: "from-purple-600 to-indigo-600",
    type: "reverb",
    emoji: "🌊",
  },
  {
    id: "quick-puff",
    name: "Quick Puff",
    color: "from-orange-300 to-yellow-300",
    type: "short",
    emoji: "☁️",
  },
  {
    id: "echo-valley",
    name: "Echo Valley",
    color: "from-cyan-500 to-teal-500",
    type: "echo",
    emoji: "🗻",
  },
  {
    id: "squeaky-toy",
    name: "Squeaky Toy",
    color: "from-pink-600 to-red-600",
    type: "squeaky",
    emoji: "🧸",
  },
  {
    id: "deep-rumble",
    name: "Deep Rumble",
    color: "from-gray-700 to-gray-900",
    type: "bassy",
    emoji: "🌋",
  },
  {
    id: "bubbly-bath",
    name: "Bubbly Bath",
    color: "from-blue-300 to-cyan-300",
    type: "wet",
    emoji: "🛁",
  },
  {
    id: "meme-horn",
    name: "Meme Horn",
    color: "from-yellow-500 to-orange-500",
    type: "meme",
    emoji: "📯",
  },
  {
    id: "long-drone",
    name: "Long Drone",
    color: "from-indigo-400 to-blue-400",
    type: "long",
    emoji: "🎹",
  },
  {
    id: "triple-beat",
    name: "Triple Beat",
    color: "from-green-500 to-teal-500",
    type: "rhythmic",
    emoji: "🥁",
  },
  {
    id: "super-reverb",
    name: "Super Reverb",
    color: "from-purple-700 to-pink-700",
    type: "reverb",
    emoji: "🎤",
  },
  {
    id: "tiny-toot",
    name: "Tiny Toot",
    color: "from-yellow-400 to-green-400",
    type: "short",
    emoji: "🌟",
  },
  {
    id: "mountain-echo",
    name: "Mountain Echo",
    color: "from-blue-600 to-cyan-600",
    type: "echo",
    emoji: "⛰️",
  },
  {
    id: "rubber-duck",
    name: "Rubber Duck",
    color: "from-yellow-500 to-orange-400",
    type: "squeaky",
    emoji: "🦆",
  },
  {
    id: "bass-boom",
    name: "Bass Boom",
    color: "from-red-700 to-orange-700",
    type: "bassy",
    emoji: "💣",
  },
  {
    id: "splash-zone",
    name: "Splash Zone",
    color: "from-cyan-600 to-blue-600",
    type: "wet",
    emoji: "🌊",
  },
  {
    id: "comedy-horn",
    name: "Comedy Horn",
    color: "from-pink-500 to-red-500",
    type: "meme",
    emoji: "🤡",
  },
  {
    id: "endless-wind",
    name: "Endless Wind",
    color: "from-teal-600 to-green-600",
    type: "long",
    emoji: "🌬️",
  },
  {
    id: "drum-roll",
    name: "Drum Roll",
    color: "from-orange-600 to-red-600",
    type: "rhythmic",
    emoji: "🥁",
  },
  {
    id: "cave-reverb",
    name: "Cave Reverb",
    color: "from-indigo-700 to-purple-700",
    type: "reverb",
    emoji: "🦇",
  },
  {
    id: "pop-fizz",
    name: "Pop Fizz",
    color: "from-yellow-600 to-pink-600",
    type: "short",
    emoji: "🥤",
  },
  {
    id: "canyon-echo",
    name: "Canyon Echo",
    color: "from-orange-700 to-red-700",
    type: "echo",
    emoji: "🏜️",
  },
  {
    id: "balloon-squeak",
    name: "Balloon Squeak",
    color: "from-pink-700 to-purple-700",
    type: "squeaky",
    emoji: "🎈",
  },
];

export default function FunnyFartHub({ onNavigate }: FunnyFartHubProps) {
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [playingSound, setPlayingSound] = useState<string | null>(null);
  const [puffAnimations, setPuffAnimations] = useState<
    Array<{ id: number; x: number; y: number; emoji: string }>
  >([]);
  const audioContextRef = useRef<AudioContext | null>(null);
  const puffIdCounter = useRef(0);

  // Initialize Web Audio API context
  const getAudioContext = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (
        window.AudioContext || (window as any).webkitAudioContext
      )();
    }
    return audioContextRef.current;
  };

  // Generate highly varied fart sounds using Web Audio API
  const generateFartSound = (sound: FartSound) => {
    if (!soundEnabled) return;

    const audioContext = getAudioContext();
    const now = audioContext.currentTime;

    // Create oscillators for complex sound
    const oscillator1 = audioContext.createOscillator();
    const oscillator2 = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    const filterNode = audioContext.createBiquadFilter();

    // Connect nodes
    oscillator1.connect(filterNode);
    oscillator2.connect(filterNode);
    filterNode.connect(gainNode);
    gainNode.connect(audioContext.destination);

    // Sound characteristics based on type
    let duration = 0.3;
    let startFreq1 = 80;
    let endFreq1 = 40;
    let startFreq2 = 120;
    let endFreq2 = 60;
    let waveType1: OscillatorType = "sawtooth";
    let waveType2: OscillatorType = "square";
    let filterFreq = 800;
    let filterQ = 5;

    switch (sound.type) {
      case "short":
        duration = 0.15;
        startFreq1 = 100;
        endFreq1 = 50;
        waveType1 = "square";
        waveType2 = "sawtooth";
        break;
      case "long":
        duration = 0.8;
        startFreq1 = 70;
        endFreq1 = 30;
        startFreq2 = 140;
        endFreq2 = 50;
        waveType1 = "sawtooth";
        waveType2 = "triangle";
        break;
      case "reverb":
        duration = 0.6;
        startFreq1 = 60;
        endFreq1 = 25;
        filterFreq = 1200;
        filterQ = 10;
        waveType1 = "sawtooth";
        waveType2 = "sine";
        break;
      case "echo":
        duration = 0.5;
        startFreq1 = 90;
        endFreq1 = 40;
        filterFreq = 600;
        waveType1 = "triangle";
        waveType2 = "sawtooth";
        break;
      case "wet":
        duration = 0.4;
        startFreq1 = 50;
        endFreq1 = 20;
        startFreq2 = 200;
        endFreq2 = 80;
        filterFreq = 400;
        filterQ = 15;
        waveType1 = "sawtooth";
        waveType2 = "square";
        break;
      case "squeaky":
        duration = 0.25;
        startFreq1 = 300;
        endFreq1 = 150;
        startFreq2 = 600;
        endFreq2 = 300;
        filterFreq = 2000;
        waveType1 = "sine";
        waveType2 = "triangle";
        break;
      case "meme":
        duration = 0.35;
        startFreq1 = 150;
        endFreq1 = 60;
        startFreq2 = 300;
        endFreq2 = 120;
        filterFreq = 1000;
        waveType1 = "square";
        waveType2 = "sawtooth";
        break;
      case "bassy":
        duration = 0.5;
        startFreq1 = 40;
        endFreq1 = 20;
        startFreq2 = 80;
        endFreq2 = 40;
        filterFreq = 300;
        filterQ = 20;
        waveType1 = "sawtooth";
        waveType2 = "sine";
        break;
      case "rhythmic":
        duration = 0.6;
        startFreq1 = 110;
        endFreq1 = 55;
        filterFreq = 700;
        waveType1 = "square";
        waveType2 = "triangle";
        break;
    }

    // Set oscillator types
    oscillator1.type = waveType1;
    oscillator2.type = waveType2;

    // Set filter
    filterNode.type = "lowpass";
    filterNode.frequency.setValueAtTime(filterFreq, now);
    filterNode.Q.setValueAtTime(filterQ, now);

    // Frequency modulation for variation
    oscillator1.frequency.setValueAtTime(startFreq1, now);
    oscillator1.frequency.exponentialRampToValueAtTime(
      endFreq1,
      now + duration,
    );

    oscillator2.frequency.setValueAtTime(startFreq2, now);
    oscillator2.frequency.exponentialRampToValueAtTime(
      endFreq2,
      now + duration,
    );

    // Volume envelope
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(0.3, now + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + duration);

    // Add rhythmic variation for rhythmic type
    if (sound.type === "rhythmic") {
      for (let i = 0; i < 3; i++) {
        const pulseTime = now + (i * duration) / 3;
        gainNode.gain.setValueAtTime(0.3, pulseTime);
        gainNode.gain.exponentialRampToValueAtTime(
          0.05,
          pulseTime + duration / 6,
        );
      }
    }

    // Start and stop
    oscillator1.start(now);
    oscillator2.start(now);
    oscillator1.stop(now + duration);
    oscillator2.stop(now + duration);

    setPlayingSound(sound.id);
    setTimeout(() => setPlayingSound(null), duration * 1000);
  };

  const playSound = (
    sound: FartSound,
    event: React.MouseEvent<HTMLButtonElement>,
  ) => {
    generateFartSound(sound);

    // Show puff animation at click position
    const rect = event.currentTarget.getBoundingClientRect();
    const puffId = puffIdCounter.current++;
    const newPuff = {
      id: puffId,
      x: rect.left + rect.width / 2,
      y: rect.top + rect.height / 2,
      emoji: sound.emoji,
    };

    setPuffAnimations((prev) => [...prev, newPuff]);

    setTimeout(() => {
      setPuffAnimations((prev) => prev.filter((p) => p.id !== puffId));
    }, 1000);
  };

  const playRandomSound = () => {
    const randomSound =
      fartSounds[Math.floor(Math.random() * fartSounds.length)];
    generateFartSound(randomSound);

    // Show random puff in center
    const puffId = puffIdCounter.current++;
    const newPuff = {
      id: puffId,
      x: window.innerWidth / 2,
      y: window.innerHeight / 2,
      emoji: randomSound.emoji,
    };

    setPuffAnimations((prev) => [...prev, newPuff]);

    setTimeout(() => {
      setPuffAnimations((prev) => prev.filter((p) => p.id !== puffId));
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-neon-cyan via-background to-neon-purple p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="text-center space-y-4">
          <div className="text-8xl animate-bounce">💨</div>
          <h1 className="text-5xl md:text-6xl font-bold bg-gradient-to-r from-neon-pink via-neon-orange to-neon-green bg-clip-text text-transparent text-shadow-neon-lg">
            Funny Fart Hub 😂
          </h1>
          <p className="text-xl md:text-2xl text-neon-cyan text-shadow-neon-md">
            Press the buttons for super silly fart sounds!
          </p>

          {/* Controls */}
          <div className="flex flex-wrap justify-center gap-4">
            <Button
              variant="outline"
              size="lg"
              onClick={() => setSoundEnabled(!soundEnabled)}
              className="border-4 border-neon-purple hover:border-neon-cyan bg-white text-purple-900 font-bold text-lg h-14 px-6 shadow-neon-md"
            >
              {soundEnabled ? (
                <>
                  <Volume2 className="w-6 h-6 mr-2" />
                  Sound On
                </>
              ) : (
                <>
                  <VolumeX className="w-6 h-6 mr-2" />
                  Sound Off
                </>
              )}
            </Button>

            <Button
              size="lg"
              onClick={playRandomSound}
              disabled={!soundEnabled}
              className="border-4 border-neon-orange bg-gradient-to-r from-neon-pink to-neon-orange hover:from-neon-orange hover:to-neon-pink text-white font-bold text-lg h-14 px-6 shadow-neon-lg disabled:opacity-50"
            >
              <Shuffle className="w-6 h-6 mr-2" />
              Surprise Me! 🎲
            </Button>

            <Button
              variant="outline"
              size="lg"
              onClick={() => onNavigate("dashboard")}
              className="border-4 border-neon-green hover:border-neon-cyan bg-white text-purple-900 font-bold text-lg h-14 px-6 shadow-neon-md"
            >
              <Home className="w-6 h-6 mr-2" />
              Back to Dashboard
            </Button>
          </div>
        </div>

        {/* Fart Sounds Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {fartSounds.map((sound) => (
            <Card
              key={sound.id}
              className={`border-4 transition-all duration-300 cursor-pointer bg-white ${
                playingSound === sound.id
                  ? "border-neon-pink shadow-neon-lg scale-105 animate-neon-pulse"
                  : "border-neon-purple hover:border-neon-cyan hover:shadow-neon-md hover:scale-105"
              }`}
            >
              <CardHeader className="pb-3">
                <div
                  className={`w-16 h-16 rounded-full bg-gradient-to-r ${sound.color} flex items-center justify-center text-white mb-3 shadow-neon-md mx-auto`}
                >
                  <span className="text-3xl">{sound.emoji}</span>
                </div>
                <CardTitle className="text-lg text-center text-purple-900">
                  {sound.name}
                </CardTitle>
                <CardDescription className="text-center text-purple-600 text-sm capitalize">
                  {sound.type} sound
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  onClick={(e) => playSound(sound, e)}
                  disabled={!soundEnabled}
                  className={`w-full text-base font-bold h-12 bg-gradient-to-r ${sound.color} hover:opacity-90 text-white shadow-md disabled:opacity-50 disabled:cursor-not-allowed`}
                >
                  {playingSound === sound.id ? (
                    <>
                      <Sparkles className="w-5 h-5 mr-2 animate-spin" />
                      Playing...
                    </>
                  ) : (
                    <>Play {sound.emoji}</>
                  )}
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Fun Facts Section */}
        <Card className="border-4 border-neon-green bg-gradient-to-r from-yellow-50 to-green-50 shadow-neon-md">
          <CardHeader>
            <CardTitle className="text-2xl flex items-center gap-2 text-purple-900">
              <span className="text-3xl">😄</span>
              Fun Fart Facts!
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 text-purple-800">
              <p className="text-lg">
                <strong>Did you know?</strong> Everyone farts about 14 times a
                day on average! It's totally normal! 💨
              </p>
              <p className="text-lg">
                <strong>Science fact:</strong> Farts are made of gases like
                nitrogen, oxygen, carbon dioxide, and methane! 🧪
              </p>
              <p className="text-lg">
                <strong>Silly fact:</strong> The word "fart" comes from an Old
                English word meaning "to break wind"! 🌬️
              </p>
              <p className="text-lg">
                <strong>Fun fact:</strong> Farts can travel at about 10 feet per
                second! That's super fast! 🚀
              </p>
              <p className="text-lg">
                <strong>Giggle fact:</strong> Holding in farts can make them
                come out as burps instead! 😂
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Puff Animations */}
        {puffAnimations.map((puff) => (
          <div
            key={puff.id}
            className="fixed pointer-events-none z-50"
            style={{
              left: puff.x,
              top: puff.y,
              transform: "translate(-50%, -50%)",
            }}
          >
            <div className="relative">
              <div className="text-6xl animate-ping opacity-75">
                {puff.emoji}
              </div>
              <div className="absolute inset-0 text-6xl animate-bounce">
                {puff.emoji}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
