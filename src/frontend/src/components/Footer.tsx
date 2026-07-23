import { Heart } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-white/80 backdrop-blur-md border-t-4 border-primary mt-auto">
      <div className="container mx-auto px-4 py-6">
        <div className="text-center text-sm text-gray-600">
          <p className="flex items-center justify-center gap-2">
            © 2025. Built with{" "}
            <Heart className="w-4 h-4 text-red-500 fill-red-500" /> using{" "}
            <a
              href="https://caffeine.ai"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline font-semibold"
            >
              caffeine.ai
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}
