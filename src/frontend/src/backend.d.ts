import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export interface ModuleStatus {
    moduleId: string;
    banned: boolean;
}
export interface VirtualPetHub {
    growthStage: bigint;
    accessories: Array<string>;
    userId: Principal;
    warnedAboutExtremeChanges: boolean;
    happinessLevel: bigint;
    petName: string;
    trophies: bigint;
    homeStyle: string;
    decorations: Array<string>;
}
export interface Reward {
    userId: Principal;
    badges: Array<string>;
    achievements: Array<string>;
    totalTrophies: bigint;
    virtualPetLevel: bigint;
    points: bigint;
}
export interface SpinWheelResult {
    remainingCooldown: bigint;
    pointsAdded: bigint;
    message: string;
}
export type ClaimResult = {
    __kind__: "claimed";
    claimed: null;
} | {
    __kind__: "alreadyClaimed";
    alreadyClaimed: {
        admin: Principal;
    };
};
export interface Friend {
    principal: Principal;
    name: string;
    online: boolean;
}
export interface SpinReward {
    value: string;
    rewardType: string;
    timestamp: bigint;
}
export interface UserApprovalInfo {
    status: ApprovalStatus;
    principal: Principal;
}
export interface FriendRequest {
    to: Principal;
    from: Principal;
    createdAt: bigint;
}
export interface ChatThread {
    lastMessageAt: bigint;
    name: string;
    lastMessage: string;
    friend: Principal;
}
export interface AvatarConfigRef {
    body: string;
    hair: string;
    head: string;
    headwear: string;
    shoes: string;
    pants: string;
}
export interface AdminUserView {
    status: string;
    principal: Principal;
    name: string;
    lastSeen: bigint;
    avatarConfig?: AvatarConfigRef;
}
export interface Message {
    id: bigint;
    content: string;
    recipient: Principal;
    sender: Principal;
    timestamp: bigint;
    threadId: string;
}
export interface AvatarConfig {
    body: string;
    hair: string;
    head: string;
    headwear: string;
    shoes: string;
    pants: string;
}
export interface ActivityEvent {
    principal: Principal;
    metadata: string;
    timestamp: bigint;
    eventType: string;
}
export interface AccessibilitySettings {
    highContrastMode: boolean;
    largeText: boolean;
    readAloudEnabled: boolean;
}
export interface UserProfile {
    age: bigint;
    mascotPreference: string;
    theme: string;
    approvedContacts: Array<Principal>;
    parentPrincipal: Principal;
    name: string;
    screenTimeLimit: bigint;
    avatarUrl: string;
    contentFilterLevel: string;
    avatarConfig?: AvatarConfig;
    accessibilitySettings: AccessibilitySettings;
}
export enum ApprovalStatus {
    pending = "pending",
    approved = "approved",
    rejected = "rejected"
}
export enum ChatResult {
    sent = "sent",
    banned = "banned",
    notFriends = "notFriends"
}
export enum FriendResult {
    alreadyFriends = "alreadyFriends",
    sent = "sent",
    alreadyRequested = "alreadyRequested",
    notFound = "notFound",
    selfRequest = "selfRequest",
    accepted = "accepted",
    declined = "declined",
    alreadyAccepted = "alreadyAccepted",
    removed = "removed"
}
export enum ModuleBanResult {
    banned = "banned",
    unbanned = "unbanned",
    notBanned = "notBanned",
    alreadyBanned = "alreadyBanned"
}
export enum ResetResult {
    reset = "reset",
    noAdmin = "noAdmin"
}
export enum RewardResult {
    sent = "sent",
    notFound = "notFound",
    notAdmin = "notAdmin"
}
export enum UserRole {
    admin = "admin",
    user = "user",
    guest = "guest"
}
export interface backendInterface {
    acceptFriendRequest(fromPrincipal: Principal): Promise<FriendResult>;
    adminSendReward(toPrincipal: Principal, points: bigint): Promise<RewardResult>;
    assignCallerUserRole(user: Principal, role: UserRole): Promise<void>;
    banModule(moduleId: string): Promise<ModuleBanResult>;
    claimAdmin(password: string): Promise<ClaimResult>;
    claimSpinReward(points: bigint): Promise<SpinWheelResult>;
    declineFriendRequest(fromPrincipal: Principal): Promise<FriendResult>;
    getAdminPrincipal(): Promise<Principal | null>;
    getAllModuleStatuses(): Promise<Array<ModuleStatus>>;
    getAllUsers(): Promise<Array<AdminUserView>>;
    getBannedModules(): Promise<Array<string>>;
    getCallerRewards(): Promise<Reward | null>;
    getCallerUserProfile(): Promise<UserProfile | null>;
    getCallerUserRole(): Promise<UserRole>;
    getChatMessages(withPrincipal: Principal): Promise<Array<Message>>;
    getChatThreads(): Promise<Array<ChatThread>>;
    getFriendRequests(): Promise<Array<FriendRequest>>;
    getFriends(): Promise<Array<Friend>>;
    getFriendsList(): Promise<Array<AdminUserView>>;
    getLastSpinTime(): Promise<bigint | null>;
    getOnlineUsers(): Promise<Array<AdminUserView>>;
    getRecentActivity(): Promise<Array<ActivityEvent>>;
    getRemainingSpinCooldown(): Promise<bigint>;
    getSpinRewards(): Promise<Array<SpinReward>>;
    getTotalScore(): Promise<bigint>;
    getUserActivity(userPrincipal: Principal): Promise<Array<ActivityEvent>>;
    getUserProfile(user: Principal): Promise<UserProfile | null>;
    getVirtualPetHub(): Promise<VirtualPetHub | null>;
    initializeAccessControl(): Promise<void>;
    isCallerAdmin(): Promise<boolean>;
    isCallerApproved(): Promise<boolean>;
    isClaimedAdmin(): Promise<boolean>;
    listApprovals(): Promise<Array<UserApprovalInfo>>;
    recordActivity(eventType: string, metadata: string): Promise<void>;
    recordSpinReward(reward: SpinReward): Promise<void>;
    removeFriend(friendPrincipal: Principal): Promise<FriendResult>;
    requestApproval(): Promise<void>;
    resetAdmin(): Promise<ResetResult>;
    saveCallerRewards(reward: Reward): Promise<void>;
    saveCallerUserProfile(profile: UserProfile): Promise<void>;
    saveVirtualPetHub(pet: VirtualPetHub): Promise<void>;
    sendChatMessage(toPrincipal: Principal, text: string): Promise<ChatResult>;
    sendFriendRequest(toPrincipal: Principal): Promise<FriendResult>;
    setApproval(user: Principal, status: ApprovalStatus): Promise<void>;
    unbanModule(moduleId: string): Promise<ModuleBanResult>;
    updatePresence(): Promise<void>;
}
