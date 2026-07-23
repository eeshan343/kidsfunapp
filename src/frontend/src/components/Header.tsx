import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { useQueryClient } from "@tanstack/react-query";
import { Menu, Shield, ShieldCheck, Sparkles } from "lucide-react";
import type { ModulePage } from "../App";
import { useInternetIdentity } from "../hooks/useInternetIdentity";
import { useIsCallerAdmin } from "../hooks/useQueries";

interface HeaderProps {
  currentPage: ModulePage;
  onNavigate: (page: ModulePage) => void;
  isAuthenticated: boolean;
}

export default function Header({
  currentPage,
  onNavigate,
  isAuthenticated,
}: HeaderProps) {
  const { login, logout } = useInternetIdentity();
  const queryClient = useQueryClient();
  const { data: isAdmin } = useIsCallerAdmin();

  const disabled = false;
  const buttonText = isAuthenticated ? "Logout" : "Login";

  const handleAuth = async () => {
    if (isAuthenticated) {
      await logout();
      queryClient.clear();
      onNavigate("pre-login");
    } else {
      try {
        await login();
      } catch (error: unknown) {
        const err = error as Error;
        console.error("Login error:", err);
        if (err.message === "User is already authenticated") {
          await logout();
          setTimeout(() => login(), 300);
        }
      }
    }
  };

  const handleLogoClick = () => {
    if (isAuthenticated) {
      onNavigate("dashboard");
    } else {
      onNavigate("pre-login");
    }
  };

  const navItems = [
    { id: "dashboard" as ModulePage, label: "Home", icon: "🏠" },
    { id: "games" as ModulePage, label: "Games", icon: "🎮" },
    { id: "seasonal-events" as ModulePage, label: "Seasonal", icon: "🎄" },
    { id: "avatar-creator" as ModulePage, label: "Avatar", icon: "🎭" },
    { id: "story-builder" as ModulePage, label: "Stories", icon: "📖" },
    { id: "craft-diy" as ModulePage, label: "Crafts", icon: "✂️" },
    { id: "art-gallery" as ModulePage, label: "Gallery", icon: "🖼️" },
    { id: "rewards" as ModulePage, label: "Rewards", icon: "🏆" },
  ];

  return (
    <header className="bg-card/90 backdrop-blur-md border-b-4 border-neon-purple shadow-neon-purple sticky top-0 z-50">
      <div className="container mx-auto px-4 py-4">
        <div className="flex items-center justify-between">
          <div
            className="flex items-center gap-3 cursor-pointer"
            onClick={handleLogoClick}
            onKeyUp={(e) => {
              if (e.key === "Enter" || e.key === " ") handleLogoClick();
            }}
          >
            <Sparkles className="w-8 h-8 text-neon-pink animate-neon-pulse" />
            <h1 className="text-2xl md:text-3xl font-bold text-neon-pink text-shadow-neon-lg">
              Kids Fun App
            </h1>
          </div>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-2">
            {isAuthenticated &&
              navItems.slice(0, 5).map((item) => (
                <Button
                  key={item.id}
                  variant={currentPage === item.id ? "default" : "ghost"}
                  onClick={() => onNavigate(item.id)}
                  className="text-base font-semibold shadow-neon-sm hover:shadow-neon-md transition-all"
                >
                  <span className="mr-2">{item.icon}</span>
                  {item.label}
                </Button>
              ))}
            {isAuthenticated && !isAdmin && (
              <Button
                variant={currentPage === "admin-claim" ? "default" : "ghost"}
                onClick={() => onNavigate("admin-claim")}
                data-ocid="header.admin_claim.link"
                className="text-base font-semibold shadow-neon-sm hover:shadow-neon-md transition-all bg-admin-claim/10 hover:bg-admin-claim hover:text-white border-2 border-admin-claim admin-claim-border"
              >
                <ShieldCheck className="w-4 h-4 mr-2" />
                Admin Claim
              </Button>
            )}
            {isAuthenticated && isAdmin && (
              <Button
                variant={
                  currentPage === "admin-dashboard" ? "default" : "ghost"
                }
                onClick={() => onNavigate("admin-dashboard")}
                data-ocid="header.admin_dashboard.link"
                className="text-base font-semibold shadow-neon-sm hover:shadow-neon-md transition-all bg-neon-purple/10 hover:bg-neon-purple hover:text-white border-2 border-neon-purple"
              >
                <Shield className="w-4 h-4 mr-2" />
                Admin
              </Button>
            )}
          </nav>

          <div className="flex items-center gap-2">
            {isAuthenticated && (
              <>
                <Button
                  variant="outline"
                  onClick={() => onNavigate("profile")}
                  className="hidden md:flex shadow-neon-sm hover:shadow-neon-md transition-all"
                >
                  Profile
                </Button>
                <Sheet>
                  <SheetTrigger asChild>
                    <Button variant="outline" size="icon" className="lg:hidden">
                      <Menu className="h-6 w-6" />
                    </Button>
                  </SheetTrigger>
                  <SheetContent side="right" className="w-64">
                    <nav className="flex flex-col gap-4 mt-8">
                      {navItems.map((item) => (
                        <Button
                          key={item.id}
                          variant={
                            currentPage === item.id ? "default" : "ghost"
                          }
                          onClick={() => onNavigate(item.id)}
                          className="justify-start text-lg"
                        >
                          <span className="mr-2">{item.icon}</span>
                          {item.label}
                        </Button>
                      ))}
                      {isAuthenticated && !isAdmin && (
                        <Button
                          variant={
                            currentPage === "admin-claim" ? "default" : "ghost"
                          }
                          onClick={() => onNavigate("admin-claim")}
                          data-ocid="header.admin_claim.mobile_link"
                          className="justify-start text-lg bg-admin-claim/10 hover:bg-admin-claim hover:text-white border-2 border-admin-claim admin-claim-border"
                        >
                          <ShieldCheck className="w-4 h-4 mr-2" />
                          Admin Claim
                        </Button>
                      )}
                      {isAdmin && (
                        <Button
                          variant={
                            currentPage === "admin-dashboard"
                              ? "default"
                              : "ghost"
                          }
                          onClick={() => onNavigate("admin-dashboard")}
                          data-ocid="header.admin_dashboard.mobile_link"
                          className="justify-start text-lg bg-neon-purple/10 hover:bg-neon-purple hover:text-white border-2 border-neon-purple"
                        >
                          <Shield className="w-4 h-4 mr-2" />
                          Admin
                        </Button>
                      )}
                    </nav>
                  </SheetContent>
                </Sheet>
              </>
            )}
            <Button
              onClick={handleAuth}
              disabled={disabled}
              className="shadow-neon-md hover:shadow-neon-lg transition-all"
            >
              {buttonText}
            </Button>
          </div>
        </div>
      </div>
    </header>
  );
}
