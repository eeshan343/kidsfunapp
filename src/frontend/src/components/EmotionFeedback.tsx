import { useEffect, useState } from "react";
import { createPortal } from "react-dom";

interface FeedbackMessage {
  id: string;
  message: string;
  emoji: string;
}

let feedbackQueue: FeedbackMessage[] = [];
let triggerFeedback: ((message: FeedbackMessage) => void) | null = null;

const encouragingMessages = [
  { message: "Great job!", emoji: "🌟" },
  { message: "You're amazing!", emoji: "✨" },
  { message: "Keep going!", emoji: "💪" },
  { message: "Fantastic work!", emoji: "🎉" },
  { message: "You're learning so much!", emoji: "📚" },
  { message: "Awesome!", emoji: "🚀" },
  { message: "You're a star!", emoji: "⭐" },
  { message: "Brilliant!", emoji: "💡" },
  { message: "Super cool!", emoji: "😎" },
  { message: "You rock!", emoji: "🎸" },
];

export function showEmotionFeedback(customMessage?: string) {
  const feedback = customMessage
    ? { message: customMessage, emoji: "🎉" }
    : encouragingMessages[
        Math.floor(Math.random() * encouragingMessages.length)
      ];

  const feedbackMessage: FeedbackMessage = {
    id: Date.now().toString(),
    ...feedback,
  };

  if (triggerFeedback) {
    triggerFeedback(feedbackMessage);
  } else {
    feedbackQueue.push(feedbackMessage);
  }
}

export default function EmotionFeedback() {
  const [messages, setMessages] = useState<FeedbackMessage[]>([]);

  useEffect(() => {
    triggerFeedback = (message: FeedbackMessage) => {
      setMessages((prev) => [...prev, message]);
      setTimeout(() => {
        setMessages((prev) => prev.filter((m) => m.id !== message.id));
      }, 3000);
    };

    for (const message of feedbackQueue) {
      triggerFeedback?.(message);
    }
    feedbackQueue = [];

    return () => {
      triggerFeedback = null;
    };
  }, []);

  if (messages.length === 0) return null;

  return createPortal(
    <div className="fixed top-20 right-4 z-40 space-y-2 pointer-events-none">
      {messages.map((msg, index) => (
        <div
          key={msg.id}
          className="bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-full shadow-lg animate-slide-in-right flex items-center gap-3"
          style={{ animationDelay: `${index * 0.1}s` }}
        >
          <span className="text-2xl">{msg.emoji}</span>
          <span className="font-bold text-lg">{msg.message}</span>
        </div>
      ))}
      <style>{`
        @keyframes slide-in-right {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .animate-slide-in-right {
          animation: slide-in-right 0.3s ease-out forwards;
        }
      `}</style>
    </div>,
    document.body,
  );
}
