import { Principal } from "@icp-sdk/core/principal";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useEffect } from "react";
import { toast } from "sonner";
import type {
  AccessibilitySettings,
  ActivityEvent as BackendActivityEvent,
  UserProfile as BackendUserProfile,
  VirtualPetHub as BackendVirtualPetHub,
  ClaimResult,
  ModuleBanResult,
  ModuleStatus,
  RewardResult,
} from "../backend";
import { UserRole } from "../backend";
import { useActor } from "./useActor";
import { useInternetIdentity } from "./useInternetIdentity";

// Types not generated into backend.d.ts — defined locally
export type ApprovalStatus =
  | { approved: null }
  | { pending: null }
  | { rejected: null };
export interface UserApprovalInfo {
  principal: Principal;
  status: ApprovalStatus;
}

// Re-export backend types
export type { BackendUserProfile as UserProfile };
export type { BackendVirtualPetHub as VirtualPetHub };

// Local type definitions for types not in backend interface
export interface ActivityEvent {
  id: number;
  userId: string;
  activityType: {
    game_played?: { gameId: string; gameName: string };
    user_created?: null;
  };
  timestamp: number;
}

export interface StoryProject {
  id: string;
  owner: string;
  title: string;
  scenes: Scene[];
  createdAt: number;
  published: boolean;
  approved: boolean;
}

export interface Scene {
  background: string;
  characters: Character[];
  props: Prop[];
  animations: string[];
  textBubbles: TextBubble[];
}

export interface Character {
  name: string;
  position: { x: number; y: number };
  avatarConfig: AvatarConfig;
}

export interface Prop {
  name: string;
  position: { x: number; y: number };
  type: string;
}

export interface TextBubble {
  content: string;
  position: { x: number; y: number };
  character: string;
  style: string;
}

export interface VideoChannel {
  channelId: string;
  name: string;
  description: string;
  playlistUrl: string;
  iconUrl: string;
  categoryId: string;
  safe: boolean;
  approved: boolean;
  createdAt: bigint;
  lastUpdated?: bigint;
  lastPlayed?: bigint;
  isFavorite: boolean;
  totalVideos: bigint;
  views: bigint;
}

export interface ScaryHubGameEntry {
  id: string;
  title: string;
  description: string;
  category: string;
  isScary: boolean;
  difficulty: string;
  theme: string;
  instructions: string;
  assets: string[];
  highScore: bigint;
  lastPlayed: bigint;
  isFavorite: boolean;
}

export interface BadgeProof {
  badge: {
    name: string;
    description: string;
    category: string;
    requirement: string;
    rewardPoints: bigint;
  };
  proof: string;
  timestamp: bigint;
}

export interface MusicRemixStudio {
  id: string;
  creator: Principal;
  title: string;
  tempo: bigint;
  pitch: bigint;
  volume: bigint;
  reverb: bigint;
  delay: bigint;
}

export interface AvatarConfig {
  body: string;
  head: string;
  hair: string;
  pants: string;
  headwear: string;
  shoes: string;
}

export interface GameState {
  id: string;
  gameName: string;
  score: number;
  highScore: number;
  achievements: string[];
  lastPlayed: number;
}

export enum FeedbackType {
  generalFeedback = "general",
  bugReport = "bug",
  featureRequest = "feature",
  safetyConcern = "safety",
  parentFeedback = "parent",
}

export interface Feedback {
  id: string;
  submitter: string;
  feedbackType: FeedbackType;
  content: string;
  timestamp: number;
  response?: string;
  anonymous: boolean;
  resolved?: boolean;
}

export interface OnlineUser {
  userId: string;
  lastSeen: number;
  isOnline: boolean;
}

export interface Event {
  id: string;
  owner: string;
  eventType: string;
  title: string;
  date: number;
  description: string;
  rsvps: string[];
  photos: string[];
  checklist: string[];
  isSeasonal: boolean;
  seasonalType?: string;
}

export interface SpinReward {
  rewardType: string;
  value: string;
  timestamp: number;
}

export interface LocalSticker {
  id: string;
  creator: string;
  name: string;
  imageDataUrl: string;
  isModerated: boolean;
  approved: boolean;
}

export interface Sticker {
  id: string;
  creator: string;
  name: string;
  image: {
    getDirectURL: () => string;
  };
  isModerated: boolean;
  approved: boolean;
}

export interface MusicRemix {
  id: string;
  creator: string;
  title: string;
  audio: {
    getDirectURL: () => string;
  };
  duration: bigint;
  isPublic: boolean;
  approved: boolean;
}

export interface InventionStory {
  id: string;
  title: string;
  content: string;
  author: string;
  category: string;
  discoveryLevel: string;
  funFacts: string[];
}

export interface Reward {
  userId: string;
  points: number;
  badges: string[];
  achievements: string[];
  virtualPetLevel: number;
}

export interface Certificate {
  id: string;
  userId: string;
  achievement: string;
  date: number;
}

export enum AdminUserStatus {
  active = "active",
  restricted = "restricted",
  suspended = "suspended",
  banned = "banned",
}

export interface AdminDashboardData {
  totalUsers: number;
  activeUsers: number;
  pendingApprovals: number;
  recentActivity: any[];
  overview: {
    userStats: {
      total: number;
      active: number;
      restricted: number;
      suspended: number;
      banned: number;
    };
  };
  manageUsers: BackendUserProfile[];
  safetyAlerts: string[];
}

export interface Joke {
  id: string;
  category: string;
  content: string;
  submittedBy?: string;
  approved: boolean;
  rating: number;
}

export interface ArtworkSubmission {
  id: string;
  owner: string;
  title: string;
  artworkUrl: string;
  category: string;
  createdAt: number;
  isPublic: boolean;
  approved: boolean;
}

// User Profile Hooks
export function useGetCallerUserProfile() {
  const { actor, isFetching: actorFetching } = useActor();

  const query = useQuery<BackendUserProfile | null>({
    queryKey: ["currentUserProfile"],
    queryFn: async () => {
      if (!actor) throw new Error("Actor not available");
      return actor.getCallerUserProfile();
    },
    enabled: !!actor && !actorFetching,
    retry: false,
  });

  return {
    ...query,
    isLoading: actorFetching || query.isLoading,
    isFetched: !!actor && query.isFetched,
  };
}

export function useSaveCallerUserProfile() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (profile: BackendUserProfile) => {
      if (!actor) throw new Error("Actor not available");
      return actor.saveCallerUserProfile(profile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currentUserProfile"] });
    },
  });
}

// Avatar Config Hook
//
// Saves the caller's avatarConfig. The previous implementation fetched the
// existing profile via getCallerUserProfile before merging — but that call
// TRAPS for unregistered callers (the backend rejects with "Unauthorized" /
// profile-not-found before auto-registration runs), which surfaced to the
// user as "Failed to save avatar".
//
// The backend's saveCallerUserProfile now auto-registers the caller with the
// #user role if they are not yet registered, then persists the profile. So we
// can recover from the trap gracefully: if the profile fetch fails, build a
// default UserProfile carrying the new avatarConfig and call
// saveCallerUserProfile directly — the backend will register + save in one
// step. A success toast confirms the save to the user.
export function useSaveAvatarConfig() {
  const { actor } = useActor();
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (avatarConfig: AvatarConfig) => {
      if (!actor) throw new Error("Actor not available");

      // Try to fetch the existing profile. For unregistered callers this
      // traps on the backend, so we swallow the error and fall back to a
      // default profile that saveCallerUserProfile will auto-register.
      let profile: BackendUserProfile | null = null;
      try {
        profile = await actor.getCallerUserProfile();
      } catch {
        profile = null;
      }

      if (profile) {
        // Registered user — merge the new avatarConfig into the existing
        // profile and save.
        return actor.saveCallerUserProfile({ ...profile, avatarConfig });
      }

      // Unregistered user — build a default profile. The backend will
      // auto-register the caller with the #user role and persist it.
      const defaultAccessibility: AccessibilitySettings = {
        readAloudEnabled: false,
        highContrastMode: false,
        largeText: false,
      };
      const fallbackProfile: BackendUserProfile = {
        name: "New Explorer",
        age: BigInt(10),
        parentPrincipal:
          identity?.getPrincipal() ??
          (Principal.fromText("2vxsx-fae") as Principal),
        approvedContacts: [],
        screenTimeLimit: BigInt(120),
        contentFilterLevel: "moderate",
        avatarUrl: "",
        theme: "default",
        mascotPreference: "friendly",
        accessibilitySettings: defaultAccessibility,
        avatarConfig,
      };

      return actor.saveCallerUserProfile(fallbackProfile);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currentUserProfile"] });
      toast.success("Avatar saved successfully! 🎉");
    },
    onError: (error) => {
      console.error("useSaveAvatarConfig failed:", error);
      toast.error("Failed to save avatar. Please try again.");
    },
  });
}

// Authorization Hooks
export function useIsCallerAdmin() {
  const { actor, isFetching } = useActor();

  return useQuery<boolean>({
    queryKey: ["isAdmin"],
    queryFn: async () => {
      if (!actor) return false;
      return actor.isClaimedAdmin();
    },
    enabled: !!actor && !isFetching,
  });
}

// Admin Principal claim — one-time, first-claim-wins (backend enforces).
// Backend claimAdmin() returns a ClaimResult variant (#claimed | #alreadyClaimed),
// NOT a boolean — callers must inspect `__kind__` to distinguish outcomes.
interface AdminClaimActor {
  claimAdmin: (password: string) => Promise<ClaimResult>;
  getAdminPrincipal: () => Promise<Principal | null>;
  isClaimedAdmin: () => Promise<boolean>;
}

export function useGetAdminPrincipal() {
  const { actor, isFetching } = useActor();

  return useQuery<Principal | null>({
    queryKey: ["adminPrincipal"],
    queryFn: async () => {
      if (!actor) return null;
      const a = actor as unknown as AdminClaimActor;
      if (typeof a.getAdminPrincipal !== "function") return null;
      return a.getAdminPrincipal();
    },
    enabled: !!actor && !isFetching,
  });
}

export function useClaimAdmin() {
  const queryClient = useQueryClient();
  const { actor } = useActor();

  return useMutation<ClaimResult, Error, string>({
    mutationFn: async (password: string) => {
      if (!actor) throw new Error("Backend actor not ready");
      const a = actor as unknown as AdminClaimActor;
      if (typeof a.claimAdmin !== "function") {
        throw new Error("Admin claim is not available on this backend");
      }
      return a.claimAdmin(password);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminPrincipal"] });
      queryClient.invalidateQueries({ queryKey: ["isAdmin"] });
    },
  });
}

// Ensures the caller has the #user access-control role required by
// saveCallerUserProfile. Initializes access control if needed and assigns
// the user role to the caller when their current role is not "user".
export function useEnsureUserAccess() {
  const { actor } = useActor();
  const { identity } = useInternetIdentity();
  const queryClient = useQueryClient();

  return useMutation<void, Error, void>({
    mutationFn: async () => {
      if (!actor) throw new Error("Backend actor not ready");
      if (!identity) throw new Error("Not authenticated");

      // Initialize access control (idempotent on the backend).
      try {
        await actor.initializeAccessControl();
      } catch {
        // Already initialized — safe to ignore.
      }

      const role = await actor.getCallerUserRole();
      if (role !== UserRole.user) {
        await actor.assignCallerUserRole(
          identity.getPrincipal(),
          UserRole.user,
        );
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["currentUserProfile"] });
    },
  });
}

export function useIsCallerApproved() {
  return useQuery<boolean>({
    queryKey: ["isApproved"],
    queryFn: async () => false,
  });
}

export function useRequestApproval() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      // approval not available on this backend
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["isApproved"] });
    },
  });
}

export function useListApprovals() {
  return useQuery<UserApprovalInfo[]>({
    queryKey: ["approvals"],
    queryFn: async () => [],
  });
}

export function useSetApproval() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (_args: { user: Principal; status: ApprovalStatus }) => {
      // approval not available on this backend
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["approvals"] });
    },
  });
}

// Story Builder Hooks - localStorage based (backend methods not available)
export function useGetCallerStoryProjects() {
  return useQuery<StoryProject[]>({
    queryKey: ["callerStoryProjects"],
    queryFn: async () => {
      try {
        const stored = localStorage.getItem("storyProjects");
        return stored ? JSON.parse(stored) : [];
      } catch {
        return [];
      }
    },
  });
}

export function useSaveStoryProject() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (story: StoryProject) => {
      const existing: StoryProject[] = JSON.parse(
        localStorage.getItem("storyProjects") || "[]",
      );
      const idx = existing.findIndex((s) => s.id === story.id);
      if (idx >= 0) {
        existing[idx] = story;
      } else {
        existing.push(story);
      }
      localStorage.setItem("storyProjects", JSON.stringify(existing));
      return story;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["callerStoryProjects"] });
    },
  });
}

// Virtual Pet Hooks
export function useGetCallerVirtualPet() {
  const { actor, isFetching } = useActor();

  return useQuery<BackendVirtualPetHub | null>({
    queryKey: ["callerVirtualPet"],
    queryFn: async () => {
      if (!actor) return null;
      return actor.getVirtualPetHub();
    },
    enabled: !!actor && !isFetching,
  });
}

export const useGetVirtualPetHub = useGetCallerVirtualPet;

export function useSaveCallerVirtualPet() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (pet: BackendVirtualPetHub) => {
      if (!actor) throw new Error("Actor not available");
      return actor.saveVirtualPetHub(pet);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["callerVirtualPet"] });
    },
  });
}

export const useSaveVirtualPetHub = useSaveCallerVirtualPet;

export function useGetUserTrophies() {
  const { actor, isFetching } = useActor();

  return useQuery<number>({
    queryKey: ["userTrophies"],
    queryFn: async () => {
      if (!actor) return 70;
      const pet = await actor.getVirtualPetHub();
      return pet ? Number(pet.trophies) : 70;
    },
    enabled: !!actor && !isFetching,
  });
}

export function useUpdateGamesTrophies() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      // No-op: backend method not available
      return;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["callerVirtualPet"] });
      queryClient.invalidateQueries({ queryKey: ["userTrophies"] });
    },
  });
}

export function useWelcomeBackReward() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      // No-op: backend method not available
      return;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["callerVirtualPet"] });
      queryClient.invalidateQueries({ queryKey: ["userTrophies"] });
    },
  });
}

// Game States Hook - localStorage based
export function useGetMyGameStates() {
  return useQuery<GameState[]>({
    queryKey: ["myGameStates"],
    queryFn: async () => {
      try {
        const stored = localStorage.getItem("gameStates");
        return stored ? JSON.parse(stored) : [];
      } catch {
        return [];
      }
    },
  });
}

// Alias for backward compatibility
export const useGetMyGameStatesAlias = useGetMyGameStates;

// User Rewards Hook - uses backend getCallerRewards
export function useGetUserRewards() {
  const { actor, isFetching } = useActor();

  return useQuery<Reward | null>({
    queryKey: ["userRewards"],
    queryFn: async () => {
      if (!actor) return null;
      const backendReward = await actor.getCallerRewards();
      if (!backendReward) return null;
      return {
        userId: backendReward.userId.toString(),
        points: Number(backendReward.points),
        badges: backendReward.badges,
        achievements: backendReward.achievements,
        virtualPetLevel: Number(backendReward.virtualPetLevel),
      };
    },
    enabled: !!actor && !isFetching,
  });
}

// Craft Project Hooks - localStorage based
export function useMarkCraftProjectCompleted() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (projectId: string) => {
      const completed: string[] = JSON.parse(
        localStorage.getItem("completedCraftProjects") || "[]",
      );
      if (!completed.includes(projectId)) {
        completed.push(projectId);
        localStorage.setItem(
          "completedCraftProjects",
          JSON.stringify(completed),
        );
      }
      return [true, []] as [boolean, BadgeProof[]];
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userBadgeProofs"] });
    },
  });
}

export function useGetUserBadgeProofs() {
  return useQuery<BadgeProof[]>({
    queryKey: ["userBadgeProofs"],
    queryFn: async () => {
      const proofs = localStorage.getItem("badgeProofs");
      return proofs ? JSON.parse(proofs) : [];
    },
  });
}

// Video Channel Hooks - localStorage based
export function useGetVideoChannels() {
  return useQuery<VideoChannel[]>({
    queryKey: ["videoChannels"],
    queryFn: async () => {
      try {
        const stored = localStorage.getItem("videoChannels");
        return stored ? JSON.parse(stored) : [];
      } catch {
        return [];
      }
    },
  });
}

export function useUpdateVideoChannelViews() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (channelId: string) => {
      const channels: VideoChannel[] = JSON.parse(
        localStorage.getItem("videoChannels") || "[]",
      );
      const idx = channels.findIndex((c) => c.channelId === channelId);
      if (idx >= 0) {
        channels[idx] = {
          ...channels[idx],
          views: channels[idx].views + BigInt(1),
        };
        localStorage.setItem("videoChannels", JSON.stringify(channels));
      }
      return channelId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["videoChannels"] });
    },
  });
}

// Admin Activity Hooks - localStorage based
export function useGetRecentActivityEvents() {
  return useQuery<ActivityEvent[]>({
    queryKey: ["recentActivityEvents"],
    queryFn: async () => {
      try {
        const stored = localStorage.getItem("activityEvents");
        return stored ? JSON.parse(stored) : [];
      } catch {
        return [];
      }
    },
    refetchInterval: 5000,
  });
}

export function useRecordGamePlay() {
  return useMutation({
    mutationFn: async ({
      gameId,
      gameName,
    }: { gameId: string; gameName: string }) => {
      const events: ActivityEvent[] = JSON.parse(
        localStorage.getItem("activityEvents") || "[]",
      );
      const newEvent: ActivityEvent = {
        id: Date.now(),
        userId: "local",
        activityType: { game_played: { gameId, gameName } },
        timestamp: Date.now(),
      };
      events.unshift(newEvent);
      localStorage.setItem(
        "activityEvents",
        JSON.stringify(events.slice(0, 50)),
      );
      return newEvent;
    },
  });
}

// Admin User Management Hooks
export function useSetUserStatus() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      status,
    }: { userId: Principal; status: AdminUserStatus }) => {
      const statuses = JSON.parse(localStorage.getItem("userStatuses") || "{}");
      statuses[userId.toString()] = status;
      localStorage.setItem("userStatuses", JSON.stringify(statuses));
      return status;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminDashboard"] });
    },
  });
}

export function useAddRestriction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      feature,
      reason,
    }: { userId: Principal; feature: string; reason: string }) => {
      const restrictions = JSON.parse(
        localStorage.getItem("userRestrictions") || "{}",
      );
      if (!restrictions[userId.toString()]) {
        restrictions[userId.toString()] = [];
      }
      restrictions[userId.toString()].push({
        feature,
        reason,
        timestamp: Date.now(),
      });
      localStorage.setItem("userRestrictions", JSON.stringify(restrictions));
      return { userId, feature, reason };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminDashboard"] });
    },
  });
}

export function useRemoveRestriction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      userId,
      feature,
    }: { userId: Principal; feature: string }) => {
      const restrictions = JSON.parse(
        localStorage.getItem("userRestrictions") || "{}",
      );
      if (restrictions[userId.toString()]) {
        restrictions[userId.toString()] = restrictions[
          userId.toString()
        ].filter((r: { feature: string }) => r.feature !== feature);
        localStorage.setItem("userRestrictions", JSON.stringify(restrictions));
      }
      return { userId, feature };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminDashboard"] });
    },
  });
}

export function useGetAdminDashboard() {
  const { actor, isFetching } = useActor();

  return useQuery<AdminDashboardData>({
    queryKey: ["adminDashboard"],
    queryFn: async () => {
      const statuses = JSON.parse(localStorage.getItem("userStatuses") || "{}");
      const statusValues = Object.values(statuses) as AdminUserStatus[];

      let manageUsers: BackendUserProfile[] = [];
      if (actor) {
        try {
          // listApprovals not available on this backend
          manageUsers = [];
        } catch {
          manageUsers = [];
        }
      }

      return {
        totalUsers: statusValues.length,
        activeUsers: statusValues.filter((s) => s === AdminUserStatus.active)
          .length,
        pendingApprovals: 0,
        recentActivity: [],
        overview: {
          userStats: {
            total: statusValues.length,
            active: statusValues.filter((s) => s === AdminUserStatus.active)
              .length,
            restricted: statusValues.filter(
              (s) => s === AdminUserStatus.restricted,
            ).length,
            suspended: statusValues.filter(
              (s) => s === AdminUserStatus.suspended,
            ).length,
            banned: statusValues.filter((s) => s === AdminUserStatus.banned)
              .length,
          },
        },
        manageUsers,
        safetyAlerts: [],
      };
    },
    enabled: !!actor && !isFetching,
  });
}

// Spin Wheel Hooks
export function useGetSpinRewards() {
  const { actor, isFetching } = useActor();

  return useQuery<SpinReward[]>({
    queryKey: ["spinRewards"],
    queryFn: async () => {
      if (!actor) return [];
      const rewards = await actor.getSpinRewards();
      return rewards.map((r) => ({
        rewardType: r.rewardType,
        value: r.value,
        timestamp: Number(r.timestamp),
      }));
    },
    enabled: !!actor && !isFetching,
  });
}

export function useRecordSpinReward() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (reward: {
      rewardType: string;
      value: string;
      timestamp: bigint;
    }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.recordSpinReward(reward);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["spinRewards"] });
    },
  });
}

// claimSpinReward: adds points to Virtual Pet and enforces 20-min cooldown
export function useClaimSpinReward() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (points: number) => {
      if (!actor) throw new Error("Actor not available");
      return actor.claimSpinReward(BigInt(points));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["virtualPetHub"] });
      queryClient.invalidateQueries({ queryKey: ["callerVirtualPet"] });
      queryClient.invalidateQueries({ queryKey: ["spinCooldown"] });
    },
  });
}

// addTrophiesFromSpin: no-op (backend method removed; trophies are tracked locally)
export function useAddTrophiesFromSpin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (_trophies: number) => {
      // No-op: addTrophiesFromSpin is not available in the backend interface.
      return;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["callerVirtualPet"] });
      queryClient.invalidateQueries({ queryKey: ["userTrophies"] });
    },
  });
}

// addPointsFromSpin: no-op (use useClaimSpinReward instead)
export function useAddPointsFromSpin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (_points: number) => {
      // No-op: use useClaimSpinReward (actor.claimSpinReward) to add points to Virtual Pet.
      return;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["callerVirtualPet"] });
      queryClient.invalidateQueries({ queryKey: ["virtualPetHub"] });
    },
  });
}

// Feedback Hooks - localStorage based
export function useGetMyFeedback() {
  return useQuery<Feedback[]>({
    queryKey: ["myFeedback"],
    queryFn: async () => {
      try {
        const stored = localStorage.getItem("myFeedback");
        return stored ? JSON.parse(stored) : [];
      } catch {
        return [];
      }
    },
  });
}

export function useSubmitFeedback() {
  const queryClient = useQueryClient();
  const { identity } = useInternetIdentity();

  return useMutation({
    mutationFn: async (feedback: Omit<Feedback, "id" | "timestamp">) => {
      const newFeedback: Feedback = {
        ...feedback,
        id: `feedback_${Date.now()}`,
        timestamp: Date.now(),
        submitter: identity?.getPrincipal().toString() || "anonymous",
      };
      const existing: Feedback[] = JSON.parse(
        localStorage.getItem("myFeedback") || "[]",
      );
      existing.unshift(newFeedback);
      localStorage.setItem("myFeedback", JSON.stringify(existing));
      return newFeedback;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["myFeedback"] });
    },
  });
}

// Friends + Chat Hooks — backend-backed (persisted in canister state)
//
// The friends/chat feature is fully backed by the canister. The admin is
// auto-friended with every newly registered user on the backend side, so the
// admin's friends list will contain all users automatically.
//
// The previous localStorage chat hooks (useGetChatMessages/useSendChatMessage)
// have been replaced by these backend-backed versions. ChatPage now consumes
// them via the friends/chat flow.
import type {
  AdminUserView,
  ChatThread,
  Friend,
  FriendRequest,
  Message,
} from "../backend";
import { ChatResult, FriendResult } from "../backend";
// Re-export backend types for convenience in pages.
export type { AdminUserView, ChatThread, Friend, FriendRequest, Message };

// useGetFriends — accepted friends of the caller, with online status.
export function useGetFriends() {
  const { actor, isFetching } = useActor();

  return useQuery<Friend[]>({
    queryKey: ["friends"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getFriends();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 10000,
  });
}

// useGetFriendRequests — incoming pending friend requests for the caller.
export function useGetFriendRequests() {
  const { actor, isFetching } = useActor();

  return useQuery<FriendRequest[]>({
    queryKey: ["friendRequests"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getFriendRequests();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 10000,
  });
}

// useGetFriendsList — admin view of all users (used to search users to friend).
export function useGetFriendsList() {
  const { actor, isFetching } = useActor();

  return useQuery<AdminUserView[]>({
    queryKey: ["friendsList"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getFriendsList();
    },
    enabled: !!actor && !isFetching,
  });
}

// useSendFriendRequest — send a friend request to a principal.
export function useSendFriendRequest() {
  const queryClient = useQueryClient();
  const { actor } = useActor();

  return useMutation<FriendResult, Error, Principal>({
    mutationFn: async (toPrincipal: Principal) => {
      if (!actor) throw new Error("Actor not available");
      return actor.sendFriendRequest(toPrincipal);
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["friendRequests"] });
      queryClient.invalidateQueries({ queryKey: ["friends"] });
      const msg = friendResultMessage(result);
      if (result === FriendResult.sent || result === FriendResult.accepted) {
        toast.success(msg);
      } else {
        toast.error(msg);
      }
    },
    onError: (error) => {
      toast.error(error.message || "Failed to send friend request");
    },
  });
}

// useAcceptFriendRequest — accept an incoming friend request.
export function useAcceptFriendRequest() {
  const queryClient = useQueryClient();
  const { actor } = useActor();

  return useMutation<FriendResult, Error, Principal>({
    mutationFn: async (fromPrincipal: Principal) => {
      if (!actor) throw new Error("Actor not available");
      return actor.acceptFriendRequest(fromPrincipal);
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["friendRequests"] });
      queryClient.invalidateQueries({ queryKey: ["friends"] });
      const msg = friendResultMessage(result);
      if (result === FriendResult.accepted) {
        toast.success(msg);
      } else {
        toast.error(msg);
      }
    },
    onError: (error) => {
      toast.error(error.message || "Failed to accept friend request");
    },
  });
}

// useDeclineFriendRequest — decline an incoming friend request.
export function useDeclineFriendRequest() {
  const queryClient = useQueryClient();
  const { actor } = useActor();

  return useMutation<FriendResult, Error, Principal>({
    mutationFn: async (fromPrincipal: Principal) => {
      if (!actor) throw new Error("Actor not available");
      return actor.declineFriendRequest(fromPrincipal);
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["friendRequests"] });
      const msg = friendResultMessage(result);
      if (result === FriendResult.declined) {
        toast.success(msg);
      } else {
        toast.error(msg);
      }
    },
    onError: (error) => {
      toast.error(error.message || "Failed to decline friend request");
    },
  });
}

// useRemoveFriend — remove an existing friend.
export function useRemoveFriend() {
  const queryClient = useQueryClient();
  const { actor } = useActor();

  return useMutation<FriendResult, Error, Principal>({
    mutationFn: async (friendPrincipal: Principal) => {
      if (!actor) throw new Error("Actor not available");
      return actor.removeFriend(friendPrincipal);
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["friends"] });
      queryClient.invalidateQueries({ queryKey: ["chatThreads"] });
      const msg = friendResultMessage(result);
      if (result === FriendResult.removed) {
        toast.success(msg);
      } else {
        toast.error(msg);
      }
    },
    onError: (error) => {
      toast.error(error.message || "Failed to remove friend");
    },
  });
}

// useGetChatThreads — list of chat threads (one per friend with messages).
export function useGetChatThreads() {
  const { actor, isFetching } = useActor();

  return useQuery<ChatThread[]>({
    queryKey: ["chatThreads"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getChatThreads();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 10000,
  });
}

// useGetChatMessagesBackend — message thread with a specific friend principal.
export function useGetChatMessagesBackend(withPrincipal: Principal | null) {
  const { actor, isFetching } = useActor();

  return useQuery<Message[]>({
    queryKey: ["chatMessages", withPrincipal?.toString() ?? null],
    queryFn: async () => {
      if (!actor || !withPrincipal) return [];
      return actor.getChatMessages(withPrincipal);
    },
    enabled: !!actor && !isFetching && !!withPrincipal,
    refetchInterval: 5000,
  });
}

// useSendChatMessageBackend — send a chat message to a friend principal.
export function useSendChatMessageBackend() {
  const queryClient = useQueryClient();
  const { actor } = useActor();

  return useMutation<
    ChatResult,
    Error,
    { toPrincipal: Principal; text: string }
  >({
    mutationFn: async ({ toPrincipal, text }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.sendChatMessage(toPrincipal, text);
    },
    onSuccess: (result, variables) => {
      if (result === ChatResult.sent) {
        queryClient.invalidateQueries({
          queryKey: ["chatMessages", variables.toPrincipal.toString()],
        });
        queryClient.invalidateQueries({ queryKey: ["chatThreads"] });
      } else {
        const msg =
          result === ChatResult.notFriends
            ? "You can only message friends"
            : "You are banned from sending messages";
        toast.error(msg);
      }
    },
    onError: (error) => {
      toast.error(error.message || "Failed to send message");
    },
  });
}

// friendResultMessage — map a FriendResult variant to a user-facing message.
function friendResultMessage(result: FriendResult): string {
  switch (result) {
    case FriendResult.sent:
      return "Friend request sent";
    case FriendResult.accepted:
      return "Friend request accepted — you are now friends";
    case FriendResult.declined:
      return "Friend request declined";
    case FriendResult.removed:
      return "Friend removed";
    case FriendResult.alreadyFriends:
      return "You are already friends";
    case FriendResult.alreadyRequested:
      return "A friend request is already pending";
    case FriendResult.alreadyAccepted:
      return "Friend request was already accepted";
    case FriendResult.notFound:
      return "User not found";
    case FriendResult.selfRequest:
      return "You cannot send a friend request to yourself";
    default:
      return "Friend operation completed";
  }
}

// useGetOnlineUsers — currently-online users (backend-backed).
//
// Calls the public backend query getOnlineUsers(), which returns an
// AdminUserView[] (principal/name/status/lastSeen/avatarConfig) for every
// user the canister considers online right now. Replaces the previous
// localStorage-only stub. Polled every 10s so the online list stays fresh
// without hammering the canister.
export function useGetOnlineUsers() {
  const { actor, isFetching } = useActor();

  return useQuery<AdminUserView[]>({
    queryKey: ["onlineUsers"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getOnlineUsers();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 10000,
  });
}

export function useUpdateOnlineStatus() {
  const queryClient = useQueryClient();
  const { actor } = useActor();

  return useMutation({
    mutationFn: async ({
      userId,
      isOnline,
    }: { userId: string; isOnline: boolean }) => {
      // Keep the existing localStorage mirror so any code that reads it
      // directly still works. This preserves the hook's return shape and
      // call signature for existing callers.
      const users: OnlineUser[] = JSON.parse(
        localStorage.getItem("onlineUsers") || "[]",
      );
      const idx = users.findIndex((u) => u.userId === userId);
      const updatedUser: OnlineUser = {
        userId,
        isOnline,
        lastSeen: Date.now(),
      };
      if (idx >= 0) {
        users[idx] = updatedUser;
      } else {
        users.push(updatedUser);
      }
      localStorage.setItem("onlineUsers", JSON.stringify(users));

      // Register activity with the backend so the user actually appears
      // online in getOnlineUsers() / isOnline(). updatePresence() records
      // the caller's heartbeat with lastSeen=Time.now(). Best-effort: a
      // backend failure should not break the localStorage write above.
      if (actor) {
        try {
          await actor.updatePresence();
        } catch (err) {
          console.error("updatePresence failed:", err);
        }
      }

      return updatedUser;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["onlineUsers"] });
    },
  });
}

// usePresenceHeartbeat — broadcasts the caller's presence to the backend on
// a regular cadence so they stay marked online as long as the app is open.
//
// Calls actor.updatePresence() on mount and every 2 minutes thereafter.
// The backend uses a 4-minute freshness window, so a 2-minute heartbeat
// keeps the user comfortably inside the window even if one tick is missed.
// The interval is cleaned up on unmount. Only runs when the actor is ready.
// Failures are swallowed (best-effort) — presence is non-critical and the
// next tick will retry automatically.
export function usePresenceHeartbeat(intervalMs = 120_000) {
  const { actor, isFetching } = useActor();

  useEffect(() => {
    if (!actor || isFetching) return;

    let cancelled = false;

    const beat = async () => {
      try {
        await actor.updatePresence();
      } catch (err) {
        if (!cancelled) {
          console.error("presence heartbeat failed:", err);
        }
      }
    };

    // Fire once immediately on mount so the user is marked online right away.
    beat();
    const id = setInterval(beat, intervalMs);

    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [actor, isFetching, intervalMs]);
}

// Events Hooks - localStorage based
export function useGetTodaysEvents() {
  return useQuery<Event[]>({
    queryKey: ["todaysEvents"],
    queryFn: async () => {
      try {
        const stored = localStorage.getItem("events");
        const events: Event[] = stored ? JSON.parse(stored) : [];
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);
        return events.filter(
          (e) => e.date >= today.getTime() && e.date < tomorrow.getTime(),
        );
      } catch {
        return [];
      }
    },
  });
}

export function useDismissEventNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (eventId: string) => {
      const dismissed: string[] = JSON.parse(
        localStorage.getItem("dismissedEvents") || "[]",
      );
      if (!dismissed.includes(eventId)) {
        dismissed.push(eventId);
        localStorage.setItem("dismissedEvents", JSON.stringify(dismissed));
      }
      return eventId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["todaysEvents"] });
    },
  });
}

export function useGetActiveSeasonalEvents() {
  return useQuery<Event[]>({
    queryKey: ["activeSeasonalEvents"],
    queryFn: async () => {
      try {
        const stored = localStorage.getItem("seasonalEvents");
        const events: Event[] = stored ? JSON.parse(stored) : [];
        const now = Date.now();
        return events.filter((e) => e.isSeasonal && e.date >= now);
      } catch {
        return [];
      }
    },
  });
}

// Jokes Hooks - localStorage based
export function useGetAllJokes() {
  return useQuery<Joke[]>({
    queryKey: ["allJokes"],
    queryFn: async () => {
      try {
        const stored = localStorage.getItem("jokes");
        return stored ? JSON.parse(stored) : getDefaultJokes();
      } catch {
        return getDefaultJokes();
      }
    },
  });
}

function getDefaultJokes(): Joke[] {
  return [
    {
      id: "1",
      category: "animals",
      content:
        "Why don't scientists trust atoms? Because they make up everything!",
      approved: true,
      rating: 5,
    },
    {
      id: "2",
      category: "food",
      content: "What do you call a fake noodle? An impasta!",
      approved: true,
      rating: 4,
    },
    {
      id: "3",
      category: "school",
      content:
        "Why did the math book look so sad? Because it had too many problems!",
      approved: true,
      rating: 5,
    },
    {
      id: "4",
      category: "animals",
      content: "What do you call a sleeping dinosaur? A dino-snore!",
      approved: true,
      rating: 4,
    },
    {
      id: "5",
      category: "food",
      content:
        "Why did the banana go to the doctor? Because it wasn't peeling well!",
      approved: true,
      rating: 3,
    },
  ];
}

export function useSubmitJoke() {
  const queryClient = useQueryClient();
  const { identity } = useInternetIdentity();

  return useMutation({
    mutationFn: async (joke: Omit<Joke, "id" | "approved">) => {
      const newJoke: Joke = {
        ...joke,
        id: `joke_${Date.now()}`,
        approved: false,
        submittedBy: identity?.getPrincipal().toString(),
      };
      const existing: Joke[] = JSON.parse(
        localStorage.getItem("jokes") || JSON.stringify(getDefaultJokes()),
      );
      existing.push(newJoke);
      localStorage.setItem("jokes", JSON.stringify(existing));
      return newJoke;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allJokes"] });
    },
  });
}

export function useRateJoke() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      jokeId,
      rating,
    }: { jokeId: string; rating: number }) => {
      const jokes: Joke[] = JSON.parse(
        localStorage.getItem("jokes") || JSON.stringify(getDefaultJokes()),
      );
      const idx = jokes.findIndex((j) => j.id === jokeId);
      if (idx >= 0) {
        jokes[idx] = { ...jokes[idx], rating };
        localStorage.setItem("jokes", JSON.stringify(jokes));
      }
      return { jokeId, rating };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["allJokes"] });
    },
  });
}

export function useGetJokeFavorites() {
  return useQuery<string[]>({
    queryKey: ["jokeFavorites"],
    queryFn: async () => {
      try {
        const stored = localStorage.getItem("jokeFavorites");
        return stored ? JSON.parse(stored) : [];
      } catch {
        return [];
      }
    },
  });
}

export function useAddJokeToFavorites() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (jokeId: string) => {
      const favorites: string[] = JSON.parse(
        localStorage.getItem("jokeFavorites") || "[]",
      );
      if (!favorites.includes(jokeId)) {
        favorites.push(jokeId);
        localStorage.setItem("jokeFavorites", JSON.stringify(favorites));
      }
      return jokeId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jokeFavorites"] });
    },
  });
}

export function useRemoveJokeFromFavorites() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (jokeId: string) => {
      const favorites: string[] = JSON.parse(
        localStorage.getItem("jokeFavorites") || "[]",
      );
      const updated = favorites.filter((id) => id !== jokeId);
      localStorage.setItem("jokeFavorites", JSON.stringify(updated));
      return jokeId;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["jokeFavorites"] });
    },
  });
}

// Art Gallery Hooks
export function useGetCallerArtwork() {
  const { identity } = useInternetIdentity();

  return useQuery<ArtworkSubmission[]>({
    queryKey: ["callerArtwork"],
    queryFn: async () => {
      try {
        const stored = localStorage.getItem("artGallery");
        const all: ArtworkSubmission[] = stored ? JSON.parse(stored) : [];
        const callerId = identity?.getPrincipal().toString();
        return callerId ? all.filter((a) => a.owner === callerId) : [];
      } catch {
        return [];
      }
    },
    enabled: !!identity,
  });
}

export function useGetPublicArtwork() {
  return useQuery<ArtworkSubmission[]>({
    queryKey: ["publicArtwork"],
    queryFn: async () => {
      try {
        const stored = localStorage.getItem("artGallery");
        const all: ArtworkSubmission[] = stored ? JSON.parse(stored) : [];
        return all.filter((a) => a.isPublic && a.approved);
      } catch {
        return [];
      }
    },
  });
}

export function useSubmitArtwork() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (artwork: ArtworkSubmission) => {
      // Public uploads appear immediately — approved flag set to true so the
      // public gallery (useGetPublicArtwork filters by isPublic && approved)
      // shows new artworks without a moderation step.
      const publicArtwork: ArtworkSubmission = { ...artwork, approved: true };
      const existing: ArtworkSubmission[] = JSON.parse(
        localStorage.getItem("artGallery") || "[]",
      );
      existing.push(publicArtwork);
      localStorage.setItem("artGallery", JSON.stringify(existing));
      return publicArtwork;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["callerArtwork"] });
      queryClient.invalidateQueries({ queryKey: ["publicArtwork"] });
    },
  });
}

// Music Remix Hooks - localStorage based
export function useGetMusicRemixStudios() {
  return useQuery<MusicRemixStudio[]>({
    queryKey: ["musicRemixStudios"],
    queryFn: async () => {
      try {
        const stored = localStorage.getItem("musicRemixStudios");
        return stored ? JSON.parse(stored) : [];
      } catch {
        return [];
      }
    },
  });
}

// Alias for backward compatibility
export const useGetSavedRemixStudios = useGetMusicRemixStudios;

export function useSaveRemixStudio() {
  const queryClient = useQueryClient();
  const { identity } = useInternetIdentity();

  return useMutation({
    mutationFn: async (studio: Omit<MusicRemixStudio, "id" | "creator">) => {
      const newStudio: MusicRemixStudio = {
        ...studio,
        id: `studio_${Date.now()}`,
        creator: identity?.getPrincipal() as Principal,
      };
      const existing: MusicRemixStudio[] = JSON.parse(
        localStorage.getItem("musicRemixStudios") || "[]",
      );
      existing.push(newStudio);
      localStorage.setItem("musicRemixStudios", JSON.stringify(existing));
      return newStudio;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["musicRemixStudios"] });
    },
  });
}

// Sticker Hooks - localStorage based
export function useGetApprovedStickers() {
  return useQuery<Sticker[]>({
    queryKey: ["approvedStickers"],
    queryFn: async () => {
      try {
        const stored = localStorage.getItem("stickers");
        const stickers: LocalSticker[] = stored ? JSON.parse(stored) : [];
        return stickers
          .filter((s) => s.approved)
          .map((s) => ({
            id: s.id,
            creator: s.creator,
            name: s.name,
            image: {
              getDirectURL: () => s.imageDataUrl,
            },
            isModerated: s.isModerated,
            approved: s.approved,
          }));
      } catch {
        return [];
      }
    },
  });
}

export function useCreateSticker() {
  const queryClient = useQueryClient();
  const { identity } = useInternetIdentity();

  return useMutation({
    mutationFn: async ({
      name,
      image,
    }: { name: string; image: Uint8Array }) => {
      // Cast to Uint8Array<ArrayBuffer> to satisfy the Blob constructor's BlobPart type requirement
      const safeImage =
        image.buffer instanceof ArrayBuffer
          ? (image as Uint8Array<ArrayBuffer>)
          : (new Uint8Array(image) as Uint8Array<ArrayBuffer>);

      const blob = new Blob([safeImage], { type: "image/png" });
      const dataUrl = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result as string);
        reader.readAsDataURL(blob);
      });

      const newSticker: LocalSticker = {
        id: `sticker_${Date.now()}`,
        creator: identity?.getPrincipal().toString() || "anonymous",
        name,
        imageDataUrl: dataUrl,
        isModerated: false,
        approved: false,
      };

      const existing: LocalSticker[] = JSON.parse(
        localStorage.getItem("stickers") || "[]",
      );
      existing.push(newSticker);
      localStorage.setItem("stickers", JSON.stringify(existing));
      return newSticker;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["approvedStickers"] });
    },
  });
}

// Certificate Hooks
export function useGetUserCertificates() {
  const { identity } = useInternetIdentity();

  return useQuery<Certificate[]>({
    queryKey: ["userCertificates"],
    queryFn: async () => {
      try {
        const stored = localStorage.getItem("certificates");
        const all: Certificate[] = stored ? JSON.parse(stored) : [];
        const userId = identity?.getPrincipal().toString();
        return userId ? all.filter((c) => c.userId === userId) : [];
      } catch {
        return [];
      }
    },
    enabled: !!identity,
  });
}

export function useCreateCertificate() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (certificate: Certificate) => {
      const existing: Certificate[] = JSON.parse(
        localStorage.getItem("certificates") || "[]",
      );
      existing.push(certificate);
      localStorage.setItem("certificates", JSON.stringify(existing));
      return certificate;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["userCertificates"] });
    },
  });
}

// Invention Stories Hooks - localStorage based
export function useGetAllInventionStories() {
  return useQuery<InventionStory[]>({
    queryKey: ["inventionStories"],
    queryFn: async () => {
      try {
        const stored = localStorage.getItem("inventionStories");
        return stored ? JSON.parse(stored) : [];
      } catch {
        return [];
      }
    },
  });
}

// ---------------------------------------------------------------------------
// Admin Tracking & Module Ban Hooks (backend-backed)
// ---------------------------------------------------------------------------
// These hooks call the real backend canister methods added for admin user
// tracking, activity feeds, and per-module ban/unban. They replace the
// localStorage-only stubs above for admin flows.

// Re-export the backend ActivityEvent shape so pages can import a single
// canonical type for admin activity feeds.
export type AdminActivityEvent = BackendActivityEvent;

// All registered users with status, principal, name, lastSeen, avatarConfig.
// Admin-only on the backend.
export function useGetAllUsers() {
  const { actor, isFetching } = useActor();

  return useQuery<AdminUserView[]>({
    queryKey: ["adminAllUsers"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllUsers();
    },
    enabled: !!actor && !isFetching,
  });
}

// Per-user activity history (games played, spins, avatar edits, friend activity).
export function useGetUserActivity(principal: Principal | null) {
  const { actor, isFetching } = useActor();

  return useQuery<AdminActivityEvent[]>({
    queryKey: ["adminUserActivity", principal?.toString() ?? null],
    queryFn: async () => {
      if (!actor || !principal) return [];
      return actor.getUserActivity(principal);
    },
    enabled: !!actor && !isFetching && !!principal,
  });
}

// Platform-wide recent activity feed (admin overview + Activity tab).
export function useGetRecentActivity() {
  const { actor, isFetching } = useActor();

  return useQuery<AdminActivityEvent[]>({
    queryKey: ["adminRecentActivity"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getRecentActivity();
    },
    enabled: !!actor && !isFetching,
    refetchInterval: 10000,
  });
}

// Record an activity event for the caller. Used by feature modules to log
// games played, spins, avatar edits, friend activity, etc.
export function useRecordActivity() {
  const queryClient = useQueryClient();
  const { actor } = useActor();

  return useMutation({
    mutationFn: async ({
      eventType,
      metadata,
    }: {
      eventType: string;
      metadata: string;
    }) => {
      if (!actor) throw new Error("Actor not available");
      await actor.recordActivity(eventType, metadata);
      return { eventType, metadata };
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminRecentActivity"] });
    },
  });
}

// Public hook: returns the list of banned module ids. Used by the Dashboard
// to hide banned modules from regular users (no "under maintenance" notice).
export function useGetBannedModules() {
  const { actor, isFetching } = useActor();

  return useQuery<string[]>({
    queryKey: ["bannedModules"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getBannedModules();
    },
    enabled: !!actor && !isFetching,
  });
}

// Admin hook: returns the full module status list (every module id + banned
// flag), used by the admin Modules section to render ban/unban toggles.
export function useGetAllModuleStatuses() {
  const { actor, isFetching } = useActor();

  return useQuery<ModuleStatus[]>({
    queryKey: ["adminModuleStatuses"],
    queryFn: async () => {
      if (!actor) return [];
      return actor.getAllModuleStatuses();
    },
    enabled: !!actor && !isFetching,
  });
}

// Ban a module by id. Invalidates both the admin status list and the public
// banned-modules list so the Dashboard updates immediately.
export function useBanModule() {
  const queryClient = useQueryClient();
  const { actor } = useActor();

  return useMutation<ModuleBanResult, Error, string>({
    mutationFn: async (moduleId: string) => {
      if (!actor) throw new Error("Actor not available");
      return actor.banModule(moduleId);
    },
    onSuccess: (_data, moduleId) => {
      queryClient.invalidateQueries({ queryKey: ["adminModuleStatuses"] });
      queryClient.invalidateQueries({ queryKey: ["bannedModules"] });
      queryClient.invalidateQueries({
        queryKey: ["adminModuleStatus", moduleId],
      });
    },
  });
}

// Unban a module by id. Mirrors useBanModule invalidations.
export function useUnbanModule() {
  const queryClient = useQueryClient();
  const { actor } = useActor();

  return useMutation<ModuleBanResult, Error, string>({
    mutationFn: async (moduleId: string) => {
      if (!actor) throw new Error("Actor not available");
      return actor.unbanModule(moduleId);
    },
    onSuccess: (_data, moduleId) => {
      queryClient.invalidateQueries({ queryKey: ["adminModuleStatuses"] });
      queryClient.invalidateQueries({ queryKey: ["bannedModules"] });
      queryClient.invalidateQueries({
        queryKey: ["adminModuleStatus", moduleId],
      });
    },
  });
}

// Admin hook: send points to a user. Used by the Rewards section.
export function useAdminSendReward() {
  const queryClient = useQueryClient();
  const { actor } = useActor();

  return useMutation<
    RewardResult,
    Error,
    { toPrincipal: Principal; points: bigint }
  >({
    mutationFn: async ({ toPrincipal, points }) => {
      if (!actor) throw new Error("Actor not available");
      return actor.adminSendReward(toPrincipal, points);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminAllUsers"] });
      queryClient.invalidateQueries({ queryKey: ["userRewards"] });
    },
  });
}
