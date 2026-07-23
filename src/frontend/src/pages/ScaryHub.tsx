import { useEffect } from "react";
import type { ModulePage } from "../App";

interface ScaryHubProps {
  onNavigate: (page: ModulePage) => void;
}

/**
 * Scary Hub has been merged into the Games Hub. This component is kept as a
 * redirect stub so any lingering references route users to the Games Hub with
 * the Scary category pre-selected via the `?category=Scary` search param.
 */
export default function ScaryHub({ onNavigate }: ScaryHubProps) {
  useEffect(() => {
    if (typeof window !== "undefined") {
      const url = new URL(window.location.href);
      url.searchParams.set("category", "Scary");
      window.history.replaceState({}, "", url);
    }
    onNavigate("games");
  }, [onNavigate]);

  return null;
}
