import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertCircle, Gamepad2, Lock, Sparkles } from "lucide-react";
import type { ModulePage } from "../App";
import HomepageFeatures from "../components/HomepageFeatures";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

interface PreLoginExperiencePageProps {
  onNavigate: (page: ModulePage) => void;
  redirectMessage?: string;
}

export default function PreLoginExperiencePage({
  onNavigate,
  redirectMessage,
}: PreLoginExperiencePageProps) {
  const { login, isLoading } = useInternetIdentity();

  const isLoggingIn = isLoading;

  const handleLogin = async () => {
    try {
      await login();
    } catch (error: any) {
      console.error("Login error:", error);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-100 via-pink-100 to-blue-100">
      {/* Hero Section */}
      <section className="py-16 px-4">
        <div className="container mx-auto max-w-6xl text-center space-y-8">
          <div className="flex justify-center">
            <Sparkles className="w-20 h-20 text-neon-pink animate-neon-pulse" />
          </div>

          <h1 className="text-5xl md:text-7xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-blue-600 bg-clip-text text-transparent">
            Welcome to Kids Fun App! 🎉
          </h1>

          <p className="text-2xl md:text-3xl text-gray-700 max-w-3xl mx-auto">
            A magical world of games, learning, and creativity awaits you!
          </p>

          {/* Redirect Message */}
          {redirectMessage && (
            <Card className="bg-yellow-50 border-4 border-yellow-400 max-w-2xl mx-auto">
              <CardContent className="py-6">
                <div className="flex items-center justify-center gap-3 text-yellow-800">
                  <AlertCircle className="w-6 h-6" />
                  <p className="text-lg font-semibold">{redirectMessage}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Login CTA */}
          <div className="bg-white/90 backdrop-blur-md border-4 border-purple-400 shadow-2xl rounded-3xl p-8 max-w-2xl mx-auto">
            <div className="flex justify-center mb-4">
              <Lock className="w-12 h-12 text-purple-600" />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-purple-600 mb-4">
              Login to Unlock Everything!
            </h2>
            <p className="text-lg text-gray-700 mb-6">
              Sign in with Internet Identity to access all features, save your
              progress, and join the fun!
            </p>
            <Button
              onClick={handleLogin}
              disabled={isLoggingIn}
              size="lg"
              className="text-xl px-10 py-6 font-bold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 bg-gradient-to-r from-purple-600 to-pink-600"
            >
              {isLoggingIn ? (
                <>
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                  Logging in...
                </>
              ) : (
                <>
                  <Sparkles className="w-6 h-6 mr-2" />
                  Login Now
                </>
              )}
            </Button>
          </div>

          {/* Trial Games CTA */}
          <div className="bg-gradient-to-r from-green-50 to-blue-50 border-4 border-green-400 shadow-xl rounded-3xl p-8 max-w-2xl mx-auto">
            <div className="flex justify-center mb-4">
              <Gamepad2 className="w-12 h-12 text-green-600" />
            </div>
            <h2 className="text-3xl md:text-4xl font-bold text-green-600 mb-4">
              Try Some Games First!
            </h2>
            <p className="text-lg text-gray-700 mb-6">
              Play a selection of trial games without logging in. Experience the
              fun before you join!
            </p>
            <Button
              onClick={() => onNavigate("games")}
              size="lg"
              variant="outline"
              className="text-xl px-10 py-6 font-bold border-4 border-green-600 hover:bg-green-600 hover:text-white transition-all duration-300 hover:scale-105"
            >
              <Gamepad2 className="w-6 h-6 mr-2" />
              Explore Trial Games
            </Button>
          </div>
        </div>
      </section>

      {/* Features Preview */}
      <HomepageFeatures onGetStarted={handleLogin} />

      {/* Footer */}
      <footer className="py-8 px-4 bg-white/50 backdrop-blur-md border-t-4 border-purple-300">
        <div className="container mx-auto text-center space-y-4">
          <p className="text-gray-600">
            Built with ❤️ using{" "}
            <a
              href={`https://caffeine.ai/?utm_source=Caffeine-footer&utm_medium=referral&utm_content=${encodeURIComponent(window.location.hostname)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-purple-600 hover:text-purple-800 font-semibold underline"
            >
              caffeine.ai
            </a>
          </p>
          <p className="text-sm text-gray-500">
            © {new Date().getFullYear()} Kids Fun App. All rights reserved.
          </p>
        </div>
      </footer>
    </div>
  );
}
