import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle, Clock, MessageSquare, Send } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import {
  FeedbackType,
  useGetMyFeedback,
  useSubmitFeedback,
} from "../hooks/useQueries";

export default function FeedbackPage() {
  const { identity } = useInternetIdentity();
  const { data: feedbackList = [] } = useGetMyFeedback();
  const submitFeedbackMutation = useSubmitFeedback();

  const [feedbackType, setFeedbackType] = useState<FeedbackType>(
    FeedbackType.generalFeedback,
  );
  const [feedbackText, setFeedbackText] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(false);

  const feedbackTypes = [
    {
      value: FeedbackType.generalFeedback,
      label: "General Feedback",
      emoji: "💬",
    },
    { value: FeedbackType.bugReport, label: "Bug Report", emoji: "🐛" },
    {
      value: FeedbackType.featureRequest,
      label: "Feature Request",
      emoji: "💡",
    },
    { value: FeedbackType.safetyConcern, label: "Safety Concern", emoji: "🛡️" },
    {
      value: FeedbackType.parentFeedback,
      label: "Parent Feedback",
      emoji: "👨‍👩‍👧",
    },
  ];

  const handleSubmit = async () => {
    if (!feedbackText.trim()) {
      toast.error("Please enter your feedback");
      return;
    }

    try {
      await submitFeedbackMutation.mutateAsync({
        submitter: identity?.getPrincipal().toString() || "anonymous",
        feedbackType,
        content: feedbackText,
        anonymous: isAnonymous,
        resolved: false,
      });

      toast.success("Thank you for your feedback!");
      setFeedbackText("");
      setFeedbackType(FeedbackType.generalFeedback);
      setIsAnonymous(false);
    } catch (error: any) {
      toast.error(error.message || "Failed to submit feedback");
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-pink-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">
          Feedback & Suggestions 💭
        </h1>
        <p className="text-xl text-gray-700">
          Help us make the platform better!
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="border-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Send className="w-5 h-5" />
              Submit Feedback
            </CardTitle>
            <CardDescription>
              Share your thoughts, ideas, or report issues
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>Feedback Type</Label>
              <Select
                value={feedbackType}
                onValueChange={(value) =>
                  setFeedbackType(value as FeedbackType)
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {feedbackTypes.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.emoji} {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Your Feedback</Label>
              <Textarea
                placeholder="Tell us what you think..."
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                rows={6}
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="anonymous"
                checked={isAnonymous}
                onChange={(e) => setIsAnonymous(e.target.checked)}
                className="w-4 h-4"
              />
              <Label htmlFor="anonymous">Submit anonymously</Label>
            </div>

            <Button
              onClick={handleSubmit}
              disabled={
                submitFeedbackMutation.isPending || !feedbackText.trim()
              }
              className="w-full"
            >
              {submitFeedbackMutation.isPending
                ? "Submitting..."
                : "Submit Feedback"}
            </Button>
          </CardContent>
        </Card>

        <Card className="border-4">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="w-5 h-5" />
              Your Feedback History
            </CardTitle>
            <CardDescription>Track your submitted feedback</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {feedbackList.length === 0 ? (
                <p className="text-center text-gray-500 py-8">
                  No feedback submitted yet
                </p>
              ) : (
                feedbackList.map((feedback) => (
                  <div key={feedback.id} className="border-2 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-semibold">
                        {
                          feedbackTypes.find(
                            (t) => t.value === feedback.feedbackType,
                          )?.label
                        }
                      </span>
                      <div className="flex items-center gap-2">
                        {feedback.resolved ? (
                          <CheckCircle className="w-4 h-4 text-green-600" />
                        ) : (
                          <Clock className="w-4 h-4 text-yellow-600" />
                        )}
                        <span className="text-sm text-gray-600">
                          {feedback.resolved ? "Resolved" : "Pending"}
                        </span>
                      </div>
                    </div>
                    <p className="text-sm">{feedback.content}</p>
                    {feedback.response && (
                      <div className="mt-2 p-2 bg-blue-50 rounded">
                        <p className="text-sm font-semibold text-blue-900">
                          Response:
                        </p>
                        <p className="text-sm text-blue-800">
                          {feedback.response}
                        </p>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
