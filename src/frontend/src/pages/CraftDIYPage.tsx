import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  type CraftProjectData,
  craftDiyProjects,
} from "@/content/craftDiyProjects";
import { useMarkCraftProjectCompleted } from "@/hooks/useQueries";
import { useNavigate } from "@tanstack/react-router";
import { AlertTriangle, ArrowLeft, CheckCircle, Sparkles } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export default function CraftDIYPage() {
  const navigate = useNavigate();
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [selectedProject, setSelectedProject] =
    useState<CraftProjectData | null>(null);

  const markCompletedMutation = useMarkCraftProjectCompleted();

  const categories = ["All", "Art", "Science", "Cooking", "Seasonal"];

  const filteredProjects =
    selectedCategory === "All"
      ? craftDiyProjects
      : craftDiyProjects.filter((p) => p.category === selectedCategory);

  const handleMarkCompleted = async (projectId: string) => {
    try {
      const result = await markCompletedMutation.mutateAsync(projectId);
      // Backend returns [boolean, BadgeProof[]]
      const wasNewCompletion = result[0];
      const badgesEarned = result[1];

      if (wasNewCompletion) {
        if (badgesEarned.length > 0) {
          toast.success("Project Completed!", {
            description: `You earned ${badgesEarned.length} new badge${badgesEarned.length > 1 ? "s" : ""}! 🎉`,
          });
        } else {
          toast.success("Project Completed!", {
            description: "Great job finishing this craft project!",
          });
        }
      } else {
        toast.info("Already Completed", {
          description: "You have already completed this project.",
        });
      }
    } catch (error: any) {
      console.error("Error marking project completed:", error);
      toast.error("Error", {
        description: error.message || "Failed to mark project as completed",
      });
    }
  };

  if (selectedProject) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 p-4 md:p-8">
        <div className="max-w-4xl mx-auto">
          <Button
            onClick={() => setSelectedProject(null)}
            variant="ghost"
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Projects
          </Button>

          <Card className="border-2 border-purple-300 shadow-lg">
            <CardHeader className="bg-gradient-to-r from-purple-100 to-pink-100">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-2xl md:text-3xl font-bold text-purple-900">
                    {selectedProject.title}
                  </CardTitle>
                  <div className="flex gap-2 mt-2">
                    <Badge variant="secondary">
                      {selectedProject.category}
                    </Badge>
                    <Badge
                      variant={
                        selectedProject.difficulty === "Easy"
                          ? "default"
                          : selectedProject.difficulty === "Medium"
                            ? "secondary"
                            : "destructive"
                      }
                    >
                      {selectedProject.difficulty}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardHeader>

            <CardContent className="p-6 space-y-6">
              {/* Materials Section */}
              <div>
                <h3 className="text-lg font-semibold text-purple-900 mb-2">
                  Materials Needed
                </h3>
                <ul className="list-disc list-inside space-y-1">
                  {selectedProject.materials.map((material, idx) => (
                    // biome-ignore lint/suspicious/noArrayIndexKey: positional list
                    <li key={idx} className="text-gray-700">
                      {material}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Steps Section */}
              <div>
                <h3 className="text-lg font-semibold text-purple-900 mb-2">
                  Step-by-Step Instructions
                </h3>
                <ol className="space-y-3">
                  {selectedProject.steps.map((step, idx) => (
                    // biome-ignore lint/suspicious/noArrayIndexKey: positional list
                    <li key={idx} className="flex gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-purple-500 text-white flex items-center justify-center text-sm font-bold">
                        {idx + 1}
                      </span>
                      <span className="text-gray-700 pt-0.5">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>

              {/* Safety Tips Section */}
              <div className="bg-yellow-50 border-2 border-yellow-300 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-yellow-900 mb-2 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  Safety Tips
                </h3>
                <ul className="list-disc list-inside space-y-1">
                  {selectedProject.safetyTips.map((tip, idx) => (
                    // biome-ignore lint/suspicious/noArrayIndexKey: positional list
                    <li key={idx} className="text-yellow-900">
                      {tip}
                    </li>
                  ))}
                </ul>
              </div>

              {/* Badges Section */}
              <div className="bg-purple-50 border-2 border-purple-300 rounded-lg p-4">
                <h3 className="text-lg font-semibold text-purple-900 mb-2 flex items-center gap-2">
                  <Sparkles className="w-5 h-5" />
                  Badges You Can Earn
                </h3>
                <div className="flex flex-wrap gap-2">
                  {selectedProject.badges.map((badge, idx) => (
                    // biome-ignore lint/suspicious/noArrayIndexKey: positional list
                    <Badge key={idx} variant="outline" className="text-sm">
                      {badge}
                    </Badge>
                  ))}
                </div>
              </div>

              {/* Complete Button */}
              <Button
                onClick={() => handleMarkCompleted(selectedProject.id)}
                disabled={markCompletedMutation.isPending}
                className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-3"
              >
                {markCompletedMutation.isPending ? (
                  "Marking Complete..."
                ) : (
                  <>
                    <CheckCircle className="w-5 h-5 mr-2" />
                    Mark as Completed
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-pink-50 via-purple-50 to-blue-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <Button
          onClick={() => navigate({ to: "/dashboard" })}
          variant="ghost"
          className="mb-4"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Dashboard
        </Button>

        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold text-purple-900 mb-2">
            Craft & DIY Ideas
          </h1>
          <p className="text-lg text-gray-700">
            Explore fun projects with step-by-step guides!
          </p>
        </div>

        <Tabs
          value={selectedCategory}
          onValueChange={setSelectedCategory}
          className="mb-6"
        >
          <TabsList className="grid grid-cols-5 w-full max-w-2xl mx-auto">
            {categories.map((cat) => (
              <TabsTrigger key={cat} value={cat}>
                {cat}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredProjects.map((project) => (
            <Card
              key={project.id}
              className="border-2 border-purple-200 hover:border-purple-400 transition-all cursor-pointer hover:shadow-lg"
              onClick={() => setSelectedProject(project)}
            >
              <CardHeader className="bg-gradient-to-r from-purple-100 to-pink-100">
                <CardTitle className="text-xl font-bold text-purple-900">
                  {project.title}
                </CardTitle>
                <div className="flex gap-2 mt-2">
                  <Badge variant="secondary">{project.category}</Badge>
                  <Badge
                    variant={
                      project.difficulty === "Easy"
                        ? "default"
                        : project.difficulty === "Medium"
                          ? "secondary"
                          : "destructive"
                    }
                  >
                    {project.difficulty}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <p className="text-sm text-gray-600 mb-3">
                  {project.steps.length} steps • {project.materials.length}{" "}
                  materials
                </p>
                <div className="flex flex-wrap gap-1">
                  {project.badges.slice(0, 2).map((badge, idx) => (
                    // biome-ignore lint/suspicious/noArrayIndexKey: positional list
                    <Badge key={idx} variant="outline" className="text-xs">
                      {badge}
                    </Badge>
                  ))}
                  {project.badges.length > 2 && (
                    <Badge variant="outline" className="text-xs">
                      +{project.badges.length - 2} more
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
}
