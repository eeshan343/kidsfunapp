import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import type { Principal } from "@icp-sdk/core/principal";
import {
  Activity,
  AlertTriangle,
  Ban,
  Clock,
  Eye,
  Gift,
  Lock,
  Package,
  Settings,
  Shield,
  TrendingUp,
  Unlock,
  UserPlus,
  Users,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import type { ModulePage } from "../App";
import {
  AdminUserStatus,
  useAdminSendReward,
  useBanModule,
  useGetAllModuleStatuses,
  useGetAllUsers,
  useGetRecentActivity,
  useGetUserActivity,
  useIsCallerAdmin,
  useSetUserStatus,
  useUnbanModule,
} from "../hooks/useQueries";
import type { AdminActivityEvent, AdminUserView } from "../hooks/useQueries";

// Full list of app module ids — drives the Modules section.
const MODULE_IDS = [
  "games",
  "funny-fart-hub",
  "video-hub",
  "smart-hub",
  "virtual-pet-hub",
  "learn-hub",
  "creative-fun-hub",
  "events",
  "video-generator",
  "chat",
  "event-cards",
  "jokes",
  "rewards",
  "spin-wheel",
  "sticker-creator",
  "music-remix",
  "certificates",
  "seasonal-events",
  "avatar-creator",
  "story-builder",
  "craft-diy",
  "art-gallery",
];

type SectionId =
  | "overview"
  | "users"
  | "modules"
  | "activity"
  | "rewards"
  | "friends";

const SECTIONS: {
  id: SectionId;
  label: string;
  icon: typeof Activity;
  color: string;
}[] = [
  { id: "overview", label: "Overview", icon: Activity, color: "neon-purple" },
  { id: "users", label: "Users", icon: Users, color: "neon-cyan" },
  { id: "modules", label: "Modules", icon: Package, color: "neon-green" },
  { id: "activity", label: "Activity", icon: TrendingUp, color: "neon-orange" },
  { id: "rewards", label: "Rewards", icon: Gift, color: "neon-pink" },
  { id: "friends", label: "Friends", icon: UserPlus, color: "neon-purple" },
];

// Format a bigint/number nanosecond timestamp into a relative time string.
function formatRelativeTime(timestamp: bigint | number): string {
  const ms =
    typeof timestamp === "bigint"
      ? Number(timestamp) / 1_000_000
      : typeof timestamp === "number"
        ? timestamp > 1e15
          ? timestamp / 1_000_000
          : timestamp
        : 0;
  if (!ms || Number.isNaN(ms)) return "—";
  const diff = Date.now() - ms;
  if (diff < 0) return "just now";
  if (diff < 60_000) return "just now";
  if (diff < 3_600_000) {
    const mins = Math.floor(diff / 60_000);
    return `${mins}m ago`;
  }
  if (diff < 86_400_000) {
    const hrs = Math.floor(diff / 3_600_000);
    return `${hrs}h ago`;
  }
  const days = Math.floor(diff / 86_400_000);
  return `${days}d ago`;
}

// Truncate a principal string for compact display.
function truncatePrincipal(p: Principal | string): string {
  const s = typeof p === "string" ? p : p.toString();
  return s.length > 14 ? `${s.slice(0, 8)}…${s.slice(-4)}` : s;
}

// Render a status badge with the appropriate neon color.
function StatusBadge({ status }: { status: string }) {
  const normalized = status?.toLowerCase() ?? "active";
  const map: Record<
    string,
    { color: string; icon: typeof Unlock; label: string }
  > = {
    active: { color: "bg-green-500", icon: Unlock, label: "Active" },
    restricted: {
      color: "bg-yellow-500",
      icon: AlertTriangle,
      label: "Restricted",
    },
    suspended: { color: "bg-orange-500", icon: Lock, label: "Suspended" },
    banned: { color: "bg-red-500", icon: Ban, label: "Banned" },
  };
  const entry = map[normalized] ?? map.active;
  const Icon = entry.icon;
  return (
    <Badge
      className={`${entry.color} text-white flex items-center gap-1 w-fit`}
    >
      <Icon className="w-3 h-3" />
      {entry.label}
    </Badge>
  );
}

export default function AdminDashboardPage({
  onNavigate,
}: {
  onNavigate: (page: ModulePage) => void;
}) {
  const { data: isAdmin, isLoading: isAdminLoading } = useIsCallerAdmin();
  const { data: allUsers = [], isLoading: usersLoading } = useGetAllUsers();
  const { data: recentActivity = [], isLoading: activityLoading } =
    useGetRecentActivity();
  const { data: moduleStatuses = [], isLoading: modulesLoading } =
    useGetAllModuleStatuses();

  const banModuleMutation = useBanModule();
  const unbanModuleMutation = useUnbanModule();
  const sendRewardMutation = useAdminSendReward();
  const setUserStatusMutation = useSetUserStatus();

  const [activeSection, setActiveSection] = useState<SectionId>("overview");
  const [userSearch, setUserSearch] = useState("");
  const [selectedUser, setSelectedUser] = useState<AdminUserView | null>(null);
  const [rewardTarget, setRewardTarget] = useState<string>("");
  const [rewardPoints, setRewardPoints] = useState<string>("");

  // Redirect non-admins to the admin-claim flow once admin status resolves.
  useEffect(() => {
    if (!isAdmin && !isAdminLoading) {
      onNavigate("admin-claim");
    }
  }, [isAdmin, isAdminLoading, onNavigate]);

  const filteredUsers = useMemo(() => {
    const q = userSearch.trim().toLowerCase();
    if (!q) return allUsers;
    return allUsers.filter(
      (u) =>
        u.name.toLowerCase().includes(q) ||
        u.principal.toString().toLowerCase().includes(q),
    );
  }, [allUsers, userSearch]);

  const moduleStatusMap = useMemo(() => {
    const m = new Map<string, boolean>();
    for (const s of moduleStatuses) m.set(s.moduleId, s.banned);
    return m;
  }, [moduleStatuses]);

  if (isAdminLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <Shield className="w-16 h-16 text-neon-purple mx-auto animate-neon-pulse" />
          <p className="text-2xl font-bold text-neon-pink text-shadow-neon-md">
            Loading Admin Dashboard...
          </p>
        </div>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Card className="max-w-md border-4 border-neon-pink shadow-neon-pink rounded-3xl">
          <CardHeader className="text-center">
            <Ban className="w-16 h-16 text-neon-pink mx-auto mb-4 animate-neon-pulse" />
            <CardTitle className="text-3xl text-neon-pink text-shadow-neon-lg">
              Access Denied
            </CardTitle>
            <CardDescription className="text-lg">
              You do not have permission to access the Admin Dashboard.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            <p className="text-base text-muted-foreground text-center">
              No admin has been claimed yet. If you are the designated owner,
              you can claim the admin role for your account.
            </p>
            <Button
              onClick={() => onNavigate("admin-claim")}
              data-ocid="admin_dashboard.access_denied.claim_button"
              className="bg-admin-claim hover:bg-admin-claim/90 text-white border-2 border-admin-claim admin-claim-border admin-claim-glow"
            >
              <Shield className="w-4 h-4 mr-2" />
              Claim Admin Role
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleModuleToggle = (moduleId: string, currentlyBanned: boolean) => {
    if (currentlyBanned) {
      unbanModuleMutation.mutate(moduleId, {
        onSuccess: () => toast.success(`Module "${moduleId}" unbanned`),
        onError: (err) =>
          toast.error(err.message || `Failed to unban "${moduleId}"`),
      });
    } else {
      banModuleMutation.mutate(moduleId, {
        onSuccess: () => toast.success(`Module "${moduleId}" banned`),
        onError: (err) =>
          toast.error(err.message || `Failed to ban "${moduleId}"`),
      });
    }
  };

  const handleUserStatusToggle = (user: AdminUserView) => {
    const isBanned = user.status?.toLowerCase() === "banned";
    const next = isBanned ? AdminUserStatus.active : AdminUserStatus.banned;
    setUserStatusMutation.mutate(
      { userId: user.principal, status: next },
      {
        onSuccess: () =>
          toast.success(
            `${user.name} ${isBanned ? "unbanned" : "banned"} (local view)`,
          ),
        onError: (err) =>
          toast.error(err.message || "Failed to update user status"),
      },
    );
  };

  const handleSendReward = () => {
    const points = Number(rewardPoints);
    if (!rewardTarget) {
      toast.error("Please select a user to reward");
      return;
    }
    if (!points || points <= 0) {
      toast.error("Please enter a valid points amount");
      return;
    }
    const target = allUsers.find(
      (u) => u.principal.toString() === rewardTarget,
    );
    if (!target) {
      toast.error("Selected user not found");
      return;
    }
    sendRewardMutation.mutate(
      { toPrincipal: target.principal, points: BigInt(points) },
      {
        onSuccess: (result) => {
          if (result === "sent") {
            toast.success(`Sent ${points} points to ${target.name}`);
          } else if (result === "notFound") {
            toast.error("User not found on backend");
          } else {
            toast.error("Not authorized to send rewards");
          }
          setRewardPoints("");
        },
        onError: (err) => toast.error(err.message || "Failed to send reward"),
      },
    );
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <div className="flex items-center justify-center gap-3 mb-4">
          <Shield className="w-12 h-12 text-neon-purple animate-neon-pulse" />
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-neon-purple via-neon-pink to-neon-cyan bg-clip-text text-transparent text-shadow-neon-lg">
            Admin Control Panel
          </h1>
        </div>
        <p className="text-xl text-foreground/80">
          Complete platform management and monitoring
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Sidebar navigation */}
        <div className="lg:col-span-3">
          <Card className="border-4 border-neon-purple shadow-neon-purple rounded-3xl sticky top-4">
            <CardHeader>
              <CardTitle className="text-neon-purple flex items-center gap-2">
                <Settings className="w-5 h-5" />
                Navigation
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {SECTIONS.map((section) => {
                const Icon = section.icon;
                const active = activeSection === section.id;
                return (
                  <Button
                    key={section.id}
                    variant={active ? "default" : "outline"}
                    data-ocid={`admin_dashboard.nav.${section.id}`}
                    className={`w-full justify-start ${
                      active
                        ? `bg-${section.color} text-white`
                        : `border-${section.color} text-${section.color} hover:bg-${section.color} hover:text-white`
                    }`}
                    onClick={() => setActiveSection(section.id)}
                  >
                    <Icon className="w-4 h-4 mr-2" />
                    {section.label}
                  </Button>
                );
              })}
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-9 space-y-6">
          {activeSection === "overview" && (
            <OverviewSection
              allUsers={allUsers}
              recentActivity={recentActivity}
              activityLoading={activityLoading}
              usersLoading={usersLoading}
            />
          )}

          {activeSection === "users" && (
            <UsersSection
              users={filteredUsers}
              allUsersCount={allUsers.length}
              searchQuery={userSearch}
              onSearchChange={setUserSearch}
              loading={usersLoading}
              onToggleStatus={handleUserStatusToggle}
              onSelectUser={setSelectedUser}
              statusPending={setUserStatusMutation.isPending}
            />
          )}

          {activeSection === "modules" && (
            <ModulesSection
              moduleIds={MODULE_IDS}
              moduleStatusMap={moduleStatusMap}
              loading={modulesLoading}
              onToggle={handleModuleToggle}
              pendingId={
                banModuleMutation.isPending || unbanModuleMutation.isPending
                  ? (banModuleMutation.variables ??
                    unbanModuleMutation.variables ??
                    null)
                  : null
              }
            />
          )}

          {activeSection === "activity" && (
            <ActivitySection
              events={recentActivity}
              loading={activityLoading}
            />
          )}

          {activeSection === "rewards" && (
            <RewardsSection
              users={allUsers}
              rewardTarget={rewardTarget}
              rewardPoints={rewardPoints}
              onTargetChange={setRewardTarget}
              onPointsChange={setRewardPoints}
              onSend={handleSendReward}
              sending={sendRewardMutation.isPending}
            />
          )}

          {activeSection === "friends" && (
            <FriendsSection
              friends={allUsers}
              loading={usersLoading}
              onSelectUser={setSelectedUser}
            />
          )}
        </div>
      </div>

      {/* User detail dialog — shared by Users and Friends sections */}
      <UserDetailDialog
        user={selectedUser}
        onClose={() => setSelectedUser(null)}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// Overview section — stat cards + recent activity feed
// ---------------------------------------------------------------------------

function OverviewSection({
  allUsers,
  recentActivity,
  activityLoading,
  usersLoading,
}: {
  allUsers: AdminUserView[];
  recentActivity: AdminActivityEvent[];
  activityLoading: boolean;
  usersLoading: boolean;
}) {
  const activeCount = allUsers.filter(
    (u) => u.status?.toLowerCase() === "active",
  ).length;
  const bannedCount = allUsers.filter(
    (u) => u.status?.toLowerCase() === "banned",
  ).length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-4 border-neon-purple shadow-neon-purple rounded-3xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-neon-purple flex items-center gap-2">
              <Users className="w-4 h-4" />
              Total Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-neon-pink">
              {usersLoading ? "—" : allUsers.length}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Registered accounts
            </p>
          </CardContent>
        </Card>

        <Card className="border-4 border-neon-green shadow-neon-green rounded-3xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-neon-green flex items-center gap-2">
              <Activity className="w-4 h-4" />
              Active Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-neon-cyan">
              {usersLoading ? "—" : activeCount}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Currently active
            </p>
          </CardContent>
        </Card>

        <Card className="border-4 border-neon-orange shadow-neon-orange rounded-3xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-neon-orange flex items-center gap-2">
              <TrendingUp className="w-4 h-4" />
              Recent Activity
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-neon-orange">
              {recentActivity.length}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Events logged</p>
          </CardContent>
        </Card>

        <Card className="border-4 border-neon-pink shadow-neon-pink rounded-3xl">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm text-neon-pink flex items-center gap-2">
              <Ban className="w-4 h-4" />
              Banned Users
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-4xl font-bold text-neon-purple">
              {usersLoading ? "—" : bannedCount}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Suspended accounts
            </p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-4 border-neon-cyan shadow-neon-cyan rounded-3xl">
        <CardHeader>
          <CardTitle className="text-neon-cyan flex items-center gap-2">
            <Clock className="w-5 h-5" />
            Recent Activity Feed
            {activityLoading && (
              <span className="text-xs text-muted-foreground ml-2">
                (Updating...)
              </span>
            )}
          </CardTitle>
          <CardDescription>
            Latest platform-wide activity events (auto-refreshes every 10s)
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[300px]">
            {recentActivity.length === 0 ? (
              <div
                className="flex flex-col items-center justify-center h-[250px] text-center"
                data-ocid="admin_dashboard.overview.activity.empty_state"
              >
                <Activity className="w-12 h-12 text-muted-foreground mb-3" />
                <p className="text-lg font-medium text-muted-foreground">
                  No activity yet
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Platform events will appear here as users interact
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentActivity
                  .slice()
                  .reverse()
                  .map((event, index) => (
                    <ActivityRow
                      key={`overview-activity-${event.timestamp}-${event.eventType}`}
                      event={event}
                      index={index}
                    />
                  ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Users section — searchable list with status toggle + detail dialog
// ---------------------------------------------------------------------------

function UsersSection({
  users,
  allUsersCount,
  searchQuery,
  onSearchChange,
  loading,
  onToggleStatus,
  onSelectUser,
  statusPending,
}: {
  users: AdminUserView[];
  allUsersCount: number;
  searchQuery: string;
  onSearchChange: (v: string) => void;
  loading: boolean;
  onToggleStatus: (u: AdminUserView) => void;
  onSelectUser: (u: AdminUserView) => void;
  statusPending: boolean;
}) {
  return (
    <Card className="border-4 border-neon-cyan shadow-neon-cyan rounded-3xl">
      <CardHeader>
        <CardTitle className="text-neon-cyan flex items-center gap-2">
          <Users className="w-5 h-5" />
          User Management
        </CardTitle>
        <CardDescription>
          Search, view activity, and ban/unban registered users
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Input
          placeholder="Search by name or principal..."
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          data-ocid="admin_dashboard.users.search_input"
        />
        <p className="text-sm text-muted-foreground">
          Showing {users.length} of {allUsersCount} user(s)
        </p>

        {loading ? (
          <div className="space-y-2">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-16 rounded-lg bg-muted/40 animate-pulse"
              />
            ))}
          </div>
        ) : users.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center py-12 text-center"
            data-ocid="admin_dashboard.users.empty_state"
          >
            <Users className="w-12 h-12 text-muted-foreground mb-3" />
            <p className="text-lg font-medium text-muted-foreground">
              No users found
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Try a different search term
            </p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {users.map((user, index) => {
              const isBanned = user.status?.toLowerCase() === "banned";
              return (
                <div
                  key={user.principal.toString()}
                  data-ocid={`admin_dashboard.users.item.${index + 1}`}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3 bg-card/50 rounded-lg border-2 border-neon-cyan/30"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="w-10 h-10 rounded-full bg-neon-cyan/20 flex items-center justify-center text-neon-cyan font-bold flex-shrink-0">
                      {user.name.charAt(0).toUpperCase() || "?"}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">{user.name}</p>
                      <p className="text-xs text-muted-foreground font-mono truncate">
                        {truncatePrincipal(user.principal)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Last seen: {formatRelativeTime(user.lastSeen)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <StatusBadge status={user.status} />
                    <Button
                      variant="outline"
                      size="sm"
                      data-ocid={`admin_dashboard.users.view_button.${index + 1}`}
                      onClick={() => onSelectUser(user)}
                    >
                      <Eye className="w-3 h-3 mr-1" />
                      View
                    </Button>
                    <div className="flex items-center gap-2">
                      <Label
                        htmlFor={`ban-toggle-${index}`}
                        className="text-xs text-muted-foreground hidden sm:block"
                      >
                        Ban
                      </Label>
                      <Switch
                        id={`ban-toggle-${index}`}
                        checked={isBanned}
                        disabled={statusPending}
                        data-ocid={`admin_dashboard.users.ban_toggle.${index + 1}`}
                        onCheckedChange={() => onToggleStatus(user)}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Modules section — list every module with ban/unban toggle
// ---------------------------------------------------------------------------

function ModulesSection({
  moduleIds,
  moduleStatusMap,
  loading,
  onToggle,
  pendingId,
}: {
  moduleIds: string[];
  moduleStatusMap: Map<string, boolean>;
  loading: boolean;
  onToggle: (moduleId: string, currentlyBanned: boolean) => void;
  pendingId: string | null;
}) {
  const bannedCount = moduleIds.filter(
    (id) => moduleStatusMap.get(id) ?? false,
  ).length;

  return (
    <Card className="border-4 border-neon-green shadow-neon-green rounded-3xl">
      <CardHeader>
        <CardTitle className="text-neon-green flex items-center gap-2">
          <Package className="w-5 h-5" />
          Module Management
        </CardTitle>
        <CardDescription>
          Ban or unban app modules. Banned modules are hidden from regular users
          but remain previewable here for admins.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-4 text-sm">
          <span className="text-muted-foreground">
            Total modules: <strong>{moduleIds.length}</strong>
          </span>
          <span className="text-muted-foreground">
            Banned: <strong className="text-red-500">{bannedCount}</strong>
          </span>
        </div>

        {loading ? (
          <div className="space-y-2">
            {[0, 1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-14 rounded-lg bg-muted/40 animate-pulse"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2 max-h-[500px] overflow-y-auto">
            {moduleIds.map((moduleId, index) => {
              const banned = moduleStatusMap.get(moduleId) ?? false;
              const isPending = pendingId === moduleId;
              return (
                <div
                  key={moduleId}
                  data-ocid={`admin_dashboard.modules.item.${index + 1}`}
                  className={`flex items-center justify-between p-3 rounded-lg border-2 ${
                    banned
                      ? "border-red-500/40 bg-red-500/5"
                      : "border-neon-green/30 bg-card/50"
                  }`}
                >
                  <div className="min-w-0 flex-1">
                    <p className="font-medium truncate">{moduleId}</p>
                    <p className="text-xs text-muted-foreground">
                      {banned ? "Banned" : "Active"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <Label
                      htmlFor={`module-toggle-${index}`}
                      className="text-xs text-muted-foreground"
                    >
                      {banned ? "Unban" : "Ban"}
                    </Label>
                    <Switch
                      id={`module-toggle-${index}`}
                      checked={banned}
                      disabled={isPending}
                      data-ocid={`admin_dashboard.modules.ban_toggle.${index + 1}`}
                      onCheckedChange={() => onToggle(moduleId, banned)}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Activity section — platform-wide activity feed
// ---------------------------------------------------------------------------

function ActivitySection({
  events,
  loading,
}: {
  events: AdminActivityEvent[];
  loading: boolean;
}) {
  return (
    <Card className="border-4 border-neon-orange shadow-neon-orange rounded-3xl">
      <CardHeader>
        <CardTitle className="text-neon-orange flex items-center gap-2">
          <TrendingUp className="w-5 h-5" />
          Platform Activity
        </CardTitle>
        <CardDescription>
          All recent activity events across the platform (auto-refreshes every
          10s)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[500px]">
          {loading && events.length === 0 ? (
            <div className="space-y-2">
              {[0, 1, 2, 3, 4, 5].map((i) => (
                <div
                  key={i}
                  className="h-16 rounded-lg bg-muted/40 animate-pulse"
                />
              ))}
            </div>
          ) : events.length === 0 ? (
            <div
              className="flex flex-col items-center justify-center h-[400px] text-center"
              data-ocid="admin_dashboard.activity.empty_state"
            >
              <Activity className="w-12 h-12 text-muted-foreground mb-3" />
              <p className="text-lg font-medium text-muted-foreground">
                No activity recorded yet
              </p>
              <p className="text-sm text-muted-foreground mt-1">
                Events will appear here as users interact with the platform
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {events
                .slice()
                .reverse()
                .map((event, index) => (
                  <ActivityRow
                    key={`activity-${event.timestamp}-${event.eventType}`}
                    event={event}
                    index={index}
                  />
                ))}
            </div>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Rewards section — send points to a user
// ---------------------------------------------------------------------------

function RewardsSection({
  users,
  rewardTarget,
  rewardPoints,
  onTargetChange,
  onPointsChange,
  onSend,
  sending,
}: {
  users: AdminUserView[];
  rewardTarget: string;
  rewardPoints: string;
  onTargetChange: (v: string) => void;
  onPointsChange: (v: string) => void;
  onSend: () => void;
  sending: boolean;
}) {
  return (
    <Card className="border-4 border-neon-pink shadow-neon-pink rounded-3xl">
      <CardHeader>
        <CardTitle className="text-neon-pink flex items-center gap-2">
          <Gift className="w-5 h-5" />
          Send Reward
        </CardTitle>
        <CardDescription>
          Award points to a single user. The recipient&apos;s reward balance
          updates immediately on the backend.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4 max-w-md">
        <div className="space-y-2">
          <Label htmlFor="reward-user">Recipient</Label>
          <Select value={rewardTarget} onValueChange={onTargetChange}>
            <SelectTrigger
              id="reward-user"
              data-ocid="admin_dashboard.rewards.user_select"
            >
              <SelectValue placeholder="Select a user..." />
            </SelectTrigger>
            <SelectContent>
              {users.map((user) => (
                <SelectItem
                  key={user.principal.toString()}
                  value={user.principal.toString()}
                >
                  {user.name} ({truncatePrincipal(user.principal)})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="reward-points">Points to award</Label>
          <Input
            id="reward-points"
            type="number"
            min="1"
            placeholder="e.g. 100"
            value={rewardPoints}
            onChange={(e) => onPointsChange(e.target.value)}
            data-ocid="admin_dashboard.rewards.points_input"
          />
        </div>

        <Button
          onClick={onSend}
          disabled={sending}
          data-ocid="admin_dashboard.rewards.send_button"
          className="bg-neon-pink hover:bg-neon-pink/90 text-white border-2 border-neon-pink"
        >
          <Gift className="w-4 h-4 mr-2" />
          {sending ? "Sending..." : "Send Reward"}
        </Button>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Friends section — admin view of all users and friend status
// ---------------------------------------------------------------------------

function FriendsSection({
  friends,
  loading,
  onSelectUser,
}: {
  friends: AdminUserView[];
  loading: boolean;
  onSelectUser: (u: AdminUserView) => void;
}) {
  return (
    <Card className="border-4 border-neon-purple shadow-neon-purple rounded-3xl">
      <CardHeader>
        <CardTitle className="text-neon-purple flex items-center gap-2">
          <UserPlus className="w-5 h-5" />
          Friends Directory
        </CardTitle>
        <CardDescription>
          All registered users and their friend status. Click any user to view
          their activity history.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="space-y-2">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="h-16 rounded-lg bg-muted/40 animate-pulse"
              />
            ))}
          </div>
        ) : friends.length === 0 ? (
          <div
            className="flex flex-col items-center justify-center py-12 text-center"
            data-ocid="admin_dashboard.friends.empty_state"
          >
            <UserPlus className="w-12 h-12 text-muted-foreground mb-3" />
            <p className="text-lg font-medium text-muted-foreground">
              No users registered yet
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Registered users will appear here once they join the platform
            </p>
          </div>
        ) : (
          <div className="space-y-2 max-h-[500px] overflow-y-auto">
            {friends.map((user, index) => {
              const isOnline =
                user.status?.toLowerCase() === "active" &&
                Date.now() - Number(user.lastSeen) / 1_000_000 < 5 * 60_000;
              return (
                <div
                  key={user.principal.toString()}
                  data-ocid={`admin_dashboard.friends.item.${index + 1}`}
                  className="flex items-center justify-between gap-3 p-3 bg-card/50 rounded-lg border-2 border-neon-purple/30"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <div className="relative flex-shrink-0">
                      <div className="w-10 h-10 rounded-full bg-neon-purple/20 flex items-center justify-center text-neon-purple font-bold">
                        {user.name.charAt(0).toUpperCase() || "?"}
                      </div>
                      <span
                        className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-card ${
                          isOnline ? "bg-green-500" : "bg-muted-foreground/60"
                        }`}
                        aria-label={isOnline ? "Online" : "Offline"}
                      />
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="font-medium truncate">{user.name}</p>
                      <p className="text-xs text-muted-foreground font-mono truncate">
                        {truncatePrincipal(user.principal)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {isOnline
                          ? "Online"
                          : `Last seen: ${formatRelativeTime(user.lastSeen)}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 flex-shrink-0">
                    <StatusBadge status={user.status} />
                    <Button
                      variant="outline"
                      size="sm"
                      data-ocid={`admin_dashboard.friends.view_button.${index + 1}`}
                      onClick={() => onSelectUser(user)}
                    >
                      <Eye className="w-3 h-3 mr-1" />
                      View
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Shared activity row — used by Overview and Activity sections
// ---------------------------------------------------------------------------

function ActivityRow({
  event,
  index,
}: {
  event: AdminActivityEvent;
  index: number;
}) {
  const principalStr = event.principal.toString();
  return (
    <div
      data-ocid={`admin_dashboard.activity.item.${index + 1}`}
      className="flex items-center justify-between p-3 bg-card/50 rounded-lg border-2 border-neon-purple/30"
    >
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className="w-2 h-2 rounded-full bg-neon-cyan flex-shrink-0" />
        <div className="min-w-0 flex-1">
          <p className="font-medium truncate">{event.eventType}</p>
          <p className="text-sm text-muted-foreground font-mono truncate">
            {truncatePrincipal(principalStr)}
          </p>
          {event.metadata && (
            <p className="text-xs text-muted-foreground truncate">
              {event.metadata}
            </p>
          )}
        </div>
      </div>
      <p className="text-xs text-muted-foreground flex-shrink-0 ml-2">
        {formatRelativeTime(event.timestamp)}
      </p>
    </div>
  );
}

// ---------------------------------------------------------------------------
// User detail dialog — shows per-user activity history
// ---------------------------------------------------------------------------

function UserDetailDialog({
  user,
  onClose,
}: {
  user: AdminUserView | null;
  onClose: () => void;
}) {
  const { data: activity = [], isLoading } = useGetUserActivity(
    user?.principal ?? null,
  );

  return (
    <Dialog open={!!user} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="max-w-2xl max-h-[80vh] overflow-hidden"
        data-ocid="admin_dashboard.user_detail.dialog"
      >
        <DialogHeader>
          <DialogTitle className="text-neon-cyan flex items-center gap-2">
            <Users className="w-5 h-5" />
            {user?.name ?? "User Details"}
          </DialogTitle>
          <DialogDescription>
            User profile and activity history
          </DialogDescription>
        </DialogHeader>

        {user && (
          <div className="space-y-4 overflow-y-auto">
            <div className="grid grid-cols-2 gap-4 p-4 bg-muted/30 rounded-lg">
              <div>
                <p className="text-xs text-muted-foreground">Name</p>
                <p className="font-medium">{user.name}</p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Status</p>
                <StatusBadge status={user.status} />
              </div>
              <div className="col-span-2">
                <p className="text-xs text-muted-foreground">Principal</p>
                <p className="font-mono text-xs break-all">
                  {user.principal.toString()}
                </p>
              </div>
              <div>
                <p className="text-xs text-muted-foreground">Last seen</p>
                <p className="font-medium">
                  {formatRelativeTime(user.lastSeen)}
                </p>
              </div>
            </div>

            <div>
              <h4 className="font-medium mb-2 flex items-center gap-2">
                <Activity className="w-4 h-4 text-neon-purple" />
                Activity History
              </h4>
              {isLoading ? (
                <div className="space-y-2">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="h-14 rounded-lg bg-muted/40 animate-pulse"
                    />
                  ))}
                </div>
              ) : activity.length === 0 ? (
                <div
                  className="flex flex-col items-center justify-center py-8 text-center"
                  data-ocid="admin_dashboard.user_detail.activity.empty_state"
                >
                  <Activity className="w-10 h-10 text-muted-foreground mb-2" />
                  <p className="text-sm text-muted-foreground">
                    No activity recorded for this user
                  </p>
                </div>
              ) : (
                <ScrollArea className="h-[300px]">
                  <div className="space-y-2 pr-2">
                    {activity
                      .slice()
                      .reverse()
                      .map((event, index) => (
                        <ActivityRow
                          key={`user-activity-${event.timestamp}-${event.eventType}`}
                          event={event}
                          index={index}
                        />
                      ))}
                  </div>
                </ScrollArea>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
