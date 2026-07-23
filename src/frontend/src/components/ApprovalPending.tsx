import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { ReactNode } from "react";
import { toast } from "sonner";
import {
  type UserProfile,
  useIsCallerApproved,
  useRequestApproval,
} from "../hooks/useQueries";

interface ApprovalPendingProps {
  children: ReactNode;
  userProfile: UserProfile;
}

export default function ApprovalPending({
  children,
  userProfile,
}: ApprovalPendingProps) {
  const { data: isApproved, isLoading } = useIsCallerApproved();
  const requestApproval = useRequestApproval();

  const handleRequestApproval = async () => {
    try {
      await requestApproval.mutateAsync();
      toast.success("Approval requested! Please wait for admin approval.");
    } catch (error) {
      toast.error("Failed to request approval. Please try again.");
      console.error(error);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-100 via-pink-100 to-yellow-100">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-lg font-semibold text-primary">
            Checking approval status...
          </p>
        </div>
      </div>
    );
  }

  if (!isApproved) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-purple-100 via-pink-100 to-yellow-100 p-4">
        <Card className="w-full max-w-md shadow-2xl border-4 border-primary">
          <CardHeader className="text-center">
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-purple-600 via-pink-600 to-yellow-600 bg-clip-text text-transparent">
              Almost There! 🎈
            </CardTitle>
            <CardDescription className="text-lg">
              Your account needs approval to access the app
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-center text-gray-700">
              Hi{" "}
              <span className="font-bold text-primary">{userProfile.name}</span>
              ! 👋
            </p>
            <p className="text-center text-gray-600">
              Please request approval from an admin to start using Kids Fun App.
            </p>
            <Button
              onClick={handleRequestApproval}
              disabled={requestApproval.isPending}
              className="w-full text-lg h-12 font-bold"
            >
              {requestApproval.isPending ? "Requesting..." : "Request Approval"}
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return <>{children}</>;
}
