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
import { Principal } from "@icp-sdk/core/principal";
import { useState } from "react";
import { toast } from "sonner";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useSaveCallerUserProfile } from "../hooks/useQueries";

export default function ProfileSetup() {
  const { identity } = useInternetIdentity();
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const saveProfile = useSaveCallerUserProfile();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Please enter your name");
      return;
    }

    const ageNum = Number.parseInt(age);
    if (!age || ageNum < 5 || ageNum > 12) {
      toast.error("Age must be between 5 and 12");
      return;
    }

    try {
      await saveProfile.mutateAsync({
        name: name.trim(),
        age: BigInt(ageNum),
        parentPrincipal: identity?.getPrincipal() || Principal.anonymous(),
        approvedContacts: [],
        screenTimeLimit: BigInt(120),
        contentFilterLevel: "medium",
        avatarUrl: "😊",
        theme: "purple",
        mascotPreference: "friendly",
        accessibilitySettings: {
          readAloudEnabled: false,
          highContrastMode: false,
          largeText: false,
        },
      });
      toast.success("Profile created! Welcome to Kids Fun App! 🎉");
    } catch (error) {
      toast.error("Failed to create profile. Please try again.");
      console.error(error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-100 via-pink-100 to-yellow-100 p-4">
      <Card className="w-full max-w-md shadow-2xl border-4 border-primary">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-yellow-600 bg-clip-text text-transparent">
            Welcome! 🎉
          </CardTitle>
          <CardDescription className="text-lg">
            Let's set up your profile to get started!
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="name" className="text-lg font-semibold">
                What's your name?
              </Label>
              <Input
                id="name"
                type="text"
                placeholder="Enter your name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="text-lg h-12"
                maxLength={50}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="age" className="text-lg font-semibold">
                How old are you?
              </Label>
              <Input
                id="age"
                type="number"
                placeholder="Enter your age (5-12)"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                min="5"
                max="12"
                className="text-lg h-12"
              />
            </div>

            <Button
              type="submit"
              className="w-full text-lg h-12 font-bold"
              disabled={saveProfile.isPending}
            >
              {saveProfile.isPending ? "Creating Profile..." : "Let's Go! 🚀"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
