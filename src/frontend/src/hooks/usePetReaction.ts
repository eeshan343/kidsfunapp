import { useEffect, useRef, useState } from "react";

export type PetReactionType = "feed" | "play" | null;

export interface UsePetReactionReturn {
  reaction: PetReactionType;
  triggerReaction: (type: "feed" | "play") => void;
}

export function usePetReaction(): UsePetReactionReturn {
  const [reaction, setReaction] = useState<PetReactionType>(null);
  const [_reactionKey, setReactionKey] = useState(0);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const triggerReaction = (type: "feed" | "play") => {
    // Clear any existing timeout to prevent stuck states
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    // Set the new reaction and increment key to force restart
    setReaction(type);
    setReactionKey((prev) => prev + 1);

    // Auto-clear after 1.5 seconds
    timeoutRef.current = setTimeout(() => {
      setReaction(null);
    }, 1500);
  };

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

  return {
    reaction,
    triggerReaction,
  };
}
