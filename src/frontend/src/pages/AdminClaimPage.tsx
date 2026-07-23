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
import {
  CheckCircle2,
  KeyRound,
  Loader2,
  Lock,
  Shield,
  ShieldAlert,
} from "lucide-react";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import type { ModulePage } from "../App";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useClaimAdmin, useGetAdminPrincipal } from "../hooks/useQueries";

// Admin claim password — must match this exact value for the claim to proceed.
const ADMIN_CLAIM_PASSWORD = "sigma67eeshan";

interface AdminClaimPageProps {
  onNavigate: (page: ModulePage) => void;
}

export default function AdminClaimPage({ onNavigate }: AdminClaimPageProps) {
  const { principal } = useInternetIdentity();
  const { data: adminPrincipal, isLoading: principalLoading } =
    useGetAdminPrincipal();
  const claimMutation = useClaimAdmin();

  const [claimed, setClaimed] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState<string | null>(null);

  // Reflect backend state: an admin Principal is already set.
  useEffect(() => {
    if (adminPrincipal) setClaimed(true);
  }, [adminPrincipal]);

  const handleClaim = async () => {
    // Validate the admin claim password before hitting the backend.
    if (password !== ADMIN_CLAIM_PASSWORD) {
      setPasswordError("Incorrect admin claim password.");
      toast.error("Claim failed", {
        description: "The admin claim password you entered is incorrect.",
      });
      return;
    }
    setPasswordError(null);

    try {
      const result = await claimMutation.mutateAsync(password);
      if (result.__kind__ === "claimed") {
        setClaimed(true);
        toast.success("Admin access claimed!", {
          description: "You are now the sole admin for this app.",
        });
      } else {
        // alreadyClaimed — another account got there first.
        setClaimed(true);
        toast.error("Admin already claimed", {
          description: "Another account has already claimed admin access.",
        });
      }
    } catch (error: unknown) {
      const message =
        error instanceof Error ? error.message : "Failed to claim admin access";
      toast.error("Claim failed", { description: message });
    }
  };

  const isClaiming = claimMutation.isPending;
  const buttonDisabled = claimed || isClaiming || principalLoading;

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4 md:p-8 bg-background">
      <div className="w-full max-w-lg">
        <Card className="admin-claim-border rounded-3xl border-2 border-admin-claim/60 bg-card overflow-hidden">
          <CardHeader className="text-center space-y-4 pb-6">
            <div className="mx-auto w-20 h-20 rounded-full bg-admin-claim/15 flex items-center justify-center admin-claim-pulse">
              <Shield className="w-10 h-10 text-admin-claim admin-claim-glow" />
            </div>
            <div className="space-y-2">
              <CardTitle className="text-3xl md:text-4xl font-bold text-admin-claim admin-claim-glow">
                Claim Admin Access
              </CardTitle>
              <CardDescription className="text-base text-muted-foreground">
                One-time, first-claim-wins. Enter the admin claim password to
                become the sole admin Principal.
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Read-only Principal ID */}
            <div className="space-y-2">
              <Label
                htmlFor="admin-claim-principal"
                className="text-sm font-medium text-foreground/80"
              >
                Your Principal ID
              </Label>
              <Input
                id="admin-claim-principal"
                value={principal ?? ""}
                readOnly
                data-ocid="admin_claim.principal_input"
                className="font-mono text-xs bg-muted/40 border-admin-claim/30"
                placeholder="Not signed in"
              />
            </div>

            {/* Admin claim password */}
            <div className="space-y-2">
              <Label
                htmlFor="admin-claim-password"
                className="text-sm font-medium text-foreground/80"
              >
                Admin Claim Password
              </Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                <Input
                  id="admin-claim-password"
                  type="password"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    if (passwordError) setPasswordError(null);
                  }}
                  disabled={claimed}
                  data-ocid="admin_claim.password_input"
                  aria-invalid={!!passwordError}
                  className="pl-10 bg-muted/40 border-admin-claim/30 focus-visible:border-admin-claim"
                  placeholder="Enter admin claim password"
                  autoComplete="off"
                />
              </div>
              {passwordError && (
                <p
                  data-ocid="admin_claim.password.field_error"
                  className="text-sm text-destructive"
                  role="alert"
                >
                  {passwordError}
                </p>
              )}
            </div>

            {/* Status */}
            <div className="min-h-[1.5rem] text-center">
              {principalLoading ? (
                <p className="text-sm text-muted-foreground flex items-center justify-center gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Checking admin status...
                </p>
              ) : claimed ? (
                <p className="text-sm font-medium text-admin-claim flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  Admin already claimed
                </p>
              ) : (
                <p className="text-sm text-muted-foreground">
                  No admin claimed yet — enter the password to claim it now.
                </p>
              )}
            </div>

            {/* CTA */}
            <Button
              size="lg"
              onClick={handleClaim}
              disabled={buttonDisabled}
              data-ocid="admin_claim.claim_button"
              className="w-full h-12 text-lg font-bold bg-gradient-to-r from-admin-claim to-admin-claim-glow text-admin-claim-foreground hover:opacity-90 transition-opacity shadow-admin-claim-md disabled:opacity-60"
            >
              {isClaiming ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Claiming...
                </>
              ) : claimed ? (
                <>
                  <ShieldAlert className="w-5 h-5 mr-2" />
                  Admin Already Claimed
                </>
              ) : (
                <>
                  <KeyRound className="w-5 h-5 mr-2" />
                  Claim Admin
                </>
              )}
            </Button>

            {/* Footer note */}
            <p className="text-xs text-muted-foreground text-center">
              Once claimed, admin access cannot be transferred or revoked from
              this page. The admin Principal is stored in backend state.
            </p>

            {/* Back link */}
            <Button
              variant="ghost"
              onClick={() => onNavigate("dashboard")}
              data-ocid="admin_claim.back_link"
              className="w-full text-muted-foreground hover:text-foreground"
            >
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
