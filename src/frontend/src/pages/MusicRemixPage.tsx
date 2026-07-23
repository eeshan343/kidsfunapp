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
import { Slider } from "@/components/ui/slider";
import { Music, Pause, Play, Radio, Save } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import {
  useGetMusicRemixStudios,
  useSaveRemixStudio,
} from "../hooks/useQueries";

export default function MusicRemixPage() {
  const [remixTitle, setRemixTitle] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [tempo, setTempo] = useState(120);
  const [pitch, setPitch] = useState(0);
  const [volume, setVolume] = useState(70);
  const [reverb, setReverb] = useState(0);
  const [delay, setDelay] = useState(0);

  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);

  const saveRemixMutation = useSaveRemixStudio();
  const { data: savedRemixes = [], isLoading: remixesLoading } =
    useGetMusicRemixStudios();

  useEffect(() => {
    return () => {
      if (oscillatorRef.current) {
        oscillatorRef.current.stop();
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, []);

  const initAudio = () => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (
        window.AudioContext || (window as any).webkitAudioContext
      )();
    }
    return audioContextRef.current;
  };

  const playPreview = () => {
    const audioContext = initAudio();

    if (oscillatorRef.current) {
      oscillatorRef.current.stop();
    }

    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.type = "sine";
    oscillator.frequency.setValueAtTime(
      440 + pitch * 10,
      audioContext.currentTime,
    );
    gainNode.gain.setValueAtTime(volume / 100, audioContext.currentTime);

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.start();
    oscillatorRef.current = oscillator;
    gainNodeRef.current = gainNode;

    setIsPlaying(true);

    setTimeout(() => {
      if (oscillatorRef.current) {
        oscillatorRef.current.stop();
        setIsPlaying(false);
      }
    }, 2000);
  };

  const stopPreview = () => {
    if (oscillatorRef.current) {
      oscillatorRef.current.stop();
      oscillatorRef.current = null;
      setIsPlaying(false);
    }
  };

  const handleSaveRemix = async () => {
    if (!remixTitle.trim()) {
      toast.error("Please enter a title for your remix");
      return;
    }

    try {
      await saveRemixMutation.mutateAsync({
        title: remixTitle,
        tempo: BigInt(tempo),
        pitch: BigInt(pitch),
        volume: BigInt(volume),
        reverb: BigInt(reverb),
        delay: BigInt(delay),
      });

      toast.success("Remix saved successfully!");
      setRemixTitle("");
    } catch (error: any) {
      toast.error(error.message || "Failed to save remix");
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-pink-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">
          Music Remix Studio 🎵
        </h1>
        <p className="text-xl text-gray-700">
          Create and remix your own music!
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Controls */}
        <Card className="border-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Music className="w-5 h-5" />
              Remix Controls
            </CardTitle>
            <CardDescription>
              Adjust the settings to create your remix
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label>Remix Title</Label>
              <Input
                placeholder="Enter remix title..."
                value={remixTitle}
                onChange={(e) => setRemixTitle(e.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Tempo: {tempo} BPM</Label>
              <Slider
                min={60}
                max={200}
                step={1}
                value={[tempo]}
                onValueChange={([val]) => setTempo(val)}
              />
            </div>

            <div className="space-y-2">
              <Label>Pitch: {pitch > 0 ? `+${pitch}` : pitch}</Label>
              <Slider
                min={-12}
                max={12}
                step={1}
                value={[pitch]}
                onValueChange={([val]) => setPitch(val)}
              />
            </div>

            <div className="space-y-2">
              <Label>Volume: {volume}%</Label>
              <Slider
                min={0}
                max={100}
                step={1}
                value={[volume]}
                onValueChange={([val]) => setVolume(val)}
              />
            </div>

            <div className="space-y-2">
              <Label>Reverb: {reverb}%</Label>
              <Slider
                min={0}
                max={100}
                step={1}
                value={[reverb]}
                onValueChange={([val]) => setReverb(val)}
              />
            </div>

            <div className="space-y-2">
              <Label>Delay: {delay}%</Label>
              <Slider
                min={0}
                max={100}
                step={1}
                value={[delay]}
                onValueChange={([val]) => setDelay(val)}
              />
            </div>

            <div className="flex gap-3">
              <Button
                onClick={isPlaying ? stopPreview : playPreview}
                variant="outline"
                className="flex-1"
              >
                {isPlaying ? (
                  <>
                    <Pause className="w-4 h-4 mr-2" />
                    Stop Preview
                  </>
                ) : (
                  <>
                    <Play className="w-4 h-4 mr-2" />
                    Preview
                  </>
                )}
              </Button>

              <Button
                onClick={handleSaveRemix}
                disabled={saveRemixMutation.isPending || !remixTitle.trim()}
                className="flex-1"
              >
                {saveRemixMutation.isPending ? (
                  "Saving..."
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Remix
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Saved Remixes */}
        <Card className="border-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Radio className="w-5 h-5" />
              Browse Remixes
            </CardTitle>
            <CardDescription>Your saved remix configurations</CardDescription>
          </CardHeader>
          <CardContent>
            {remixesLoading ? (
              <div className="text-center py-8">
                <p className="text-gray-600">Loading remixes...</p>
              </div>
            ) : savedRemixes.length === 0 ? (
              <div className="text-center py-8">
                <Music className="w-16 h-16 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-600">No saved remixes yet</p>
                <p className="text-sm text-gray-500 mt-2">
                  Create and save your first remix!
                </p>
              </div>
            ) : (
              <div className="space-y-3 max-h-[500px] overflow-y-auto">
                {savedRemixes.map((remix) => (
                  <Card key={remix.id} className="border-2">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h3 className="font-semibold">{remix.title}</h3>
                      </div>
                      <div className="grid grid-cols-2 gap-1 text-sm text-gray-600">
                        <span>Tempo: {Number(remix.tempo)} BPM</span>
                        <span>
                          Pitch:{" "}
                          {Number(remix.pitch) > 0
                            ? `+${Number(remix.pitch)}`
                            : Number(remix.pitch)}
                        </span>
                        <span>Volume: {Number(remix.volume)}%</span>
                        <span>Reverb: {Number(remix.reverb)}%</span>
                        <span>Delay: {Number(remix.delay)}%</span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
