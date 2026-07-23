import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { ArrowLeft, Mic, Pause, Play, Volume2 } from "lucide-react";
import { useRef, useState } from "react";
import type { ModulePage } from "../App";

interface KaraokeModePageProps {
  onNavigate: (page: ModulePage) => void;
}

interface Song {
  id: string;
  title: string;
  artist: string;
  lyrics: string[];
  duration: number;
}

const songs: Song[] = [
  {
    id: "twinkle",
    title: "Twinkle Twinkle Little Star",
    artist: "Traditional",
    lyrics: [
      "Twinkle, twinkle, little star",
      "How I wonder what you are",
      "Up above the world so high",
      "Like a diamond in the sky",
      "Twinkle, twinkle, little star",
      "How I wonder what you are",
    ],
    duration: 30,
  },
  {
    id: "happy",
    title: "If You're Happy",
    artist: "Traditional",
    lyrics: [
      "If you're happy and you know it, clap your hands",
      "If you're happy and you know it, clap your hands",
      "If you're happy and you know it",
      "Then your face will surely show it",
      "If you're happy and you know it, clap your hands",
    ],
    duration: 25,
  },
  {
    id: "wheels",
    title: "The Wheels on the Bus",
    artist: "Traditional",
    lyrics: [
      "The wheels on the bus go round and round",
      "Round and round, round and round",
      "The wheels on the bus go round and round",
      "All through the town",
    ],
    duration: 20,
  },
];

export default function KaraokeModePage({ onNavigate }: KaraokeModePageProps) {
  const [selectedSong, setSelectedSong] = useState<Song | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentLine, setCurrentLine] = useState(0);
  const [vocalVolume, setVocalVolume] = useState([50]);
  const [musicVolume, setMusicVolume] = useState([70]);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  const handleSongSelect = (song: Song) => {
    setSelectedSong(song);
    setIsPlaying(false);
    setCurrentLine(0);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
    }
  };

  const handlePlayPause = () => {
    if (!selectedSong) return;

    if (isPlaying) {
      setIsPlaying(false);
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    } else {
      setIsPlaying(true);
      const lineInterval =
        (selectedSong.duration * 1000) / selectedSong.lyrics.length;
      intervalRef.current = setInterval(() => {
        setCurrentLine((prev) => {
          if (prev >= selectedSong.lyrics.length - 1) {
            setIsPlaying(false);
            if (intervalRef.current) {
              clearInterval(intervalRef.current);
            }
            return 0;
          }
          return prev + 1;
        });
      }, lineInterval);
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-pink-600 to-red-600 bg-clip-text text-transparent">
          Karaoke Mode
        </h1>
        <Button
          variant="outline"
          onClick={() => onNavigate("creative-fun-hub")}
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Hub
        </Button>
      </div>

      <p className="text-xl text-gray-700">
        Sing along to your favorite kid songs with on-screen lyrics!
      </p>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="border-4">
          <CardHeader>
            <CardTitle>Song Library</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {songs.map((song) => (
              <Button
                key={song.id}
                variant={selectedSong?.id === song.id ? "default" : "outline"}
                className="w-full justify-start"
                onClick={() => handleSongSelect(song)}
              >
                <Mic className="mr-2 h-4 w-4" />
                <div className="text-left">
                  <div className="font-semibold">{song.title}</div>
                  <div className="text-xs opacity-70">{song.artist}</div>
                </div>
              </Button>
            ))}
          </CardContent>
        </Card>

        <Card className="lg:col-span-2 border-4">
          <CardHeader>
            <CardTitle>Now Playing</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {selectedSong ? (
              <>
                <div className="bg-gradient-to-br from-purple-100 via-pink-100 to-blue-100 rounded-lg p-8 min-h-[300px] flex flex-col items-center justify-center">
                  <h2 className="text-3xl font-bold text-center mb-8 text-purple-600">
                    {selectedSong.title}
                  </h2>
                  <div className="space-y-4 w-full">
                    {selectedSong.lyrics.map((line, index) => (
                      <p
                        // biome-ignore lint/suspicious/noArrayIndexKey: positional list
                        key={index}
                        className={`text-2xl text-center transition-all duration-300 ${
                          index === currentLine && isPlaying
                            ? "text-pink-600 font-bold scale-110"
                            : "text-gray-600"
                        }`}
                      >
                        {line}
                      </p>
                    ))}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <Button
                      onClick={handlePlayPause}
                      size="lg"
                      className="flex-1"
                    >
                      {isPlaying ? (
                        <>
                          <Pause className="mr-2 h-5 w-5" />
                          Pause
                        </>
                      ) : (
                        <>
                          <Play className="mr-2 h-5 w-5" />
                          Play
                        </>
                      )}
                    </Button>
                  </div>

                  <div className="space-y-4 pt-4 border-t">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium flex items-center gap-2">
                          <Mic className="h-4 w-4" />
                          Vocal Volume
                        </span>
                        <span className="text-sm text-gray-600">
                          {vocalVolume[0]}%
                        </span>
                      </div>
                      <Slider
                        value={vocalVolume}
                        onValueChange={setVocalVolume}
                        max={100}
                        step={1}
                      />
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium flex items-center gap-2">
                          <Volume2 className="h-4 w-4" />
                          Music Volume
                        </span>
                        <span className="text-sm text-gray-600">
                          {musicVolume[0]}%
                        </span>
                      </div>
                      <Slider
                        value={musicVolume}
                        onValueChange={setMusicVolume}
                        max={100}
                        step={1}
                      />
                    </div>
                  </div>
                </div>

                {!isPlaying && currentLine === 0 && (
                  <div className="text-center text-gray-500 py-4">
                    🎤 Press Play to start singing! 🎤
                  </div>
                )}

                {!isPlaying && currentLine > 0 && (
                  <div className="text-center py-4">
                    <p className="text-2xl font-bold text-purple-600 mb-2">
                      🎉 Great job! 🎉
                    </p>
                    <p className="text-gray-600">You finished the song!</p>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center text-gray-500 py-20">
                Select a song from the library to start singing!
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
