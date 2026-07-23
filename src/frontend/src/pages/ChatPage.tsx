import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  useAcceptFriendRequest,
  useDeclineFriendRequest,
  useGetCallerUserProfile,
  useGetChatMessagesBackend,
  useGetChatThreads,
  useGetFriendRequests,
  useGetFriends,
  useGetFriendsList,
  useGetOnlineUsers,
  usePresenceHeartbeat,
  useRemoveFriend,
  useSendChatMessageBackend,
  useSendFriendRequest,
} from "@/hooks/useQueries";
import type {
  AdminUserView,
  ChatThread,
  Friend,
  FriendRequest,
  Message,
} from "@/hooks/useQueries";
import { Principal } from "@icp-sdk/core/principal";
import {
  Check,
  MessageCircle,
  Search,
  Send,
  UserMinus,
  UserPlus,
  Users,
  X,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { toast } from "sonner";
import { useInternetIdentity } from "../hooks/useInternetIdentity";

// A URL-shaped avatarUrl (http/https/data:) is rendered as an image; anything
// else (e.g. an emoji) is rendered as the fallback content. This matches how
// the profile preview in ProfileCustomization treats avatarUrl.
function isImageUrl(url: string): boolean {
  return /^https?:\/\//i.test(url) || /^data:image\//i.test(url);
}

// Small inline avatar used in chat message bubbles. For the current user it
// shows their profile avatarUrl (emoji or image) — consistent with the
// ProfileCustomization preview. For other users it falls back to the
// principal slice, matching the existing online-users list behavior.
function ChatAvatar({
  isOwn,
  avatarUrl,
  principalSlice,
}: {
  isOwn: boolean;
  avatarUrl?: string;
  principalSlice: string;
}) {
  const fallback = isOwn
    ? avatarUrl && !isImageUrl(avatarUrl)
      ? avatarUrl
      : principalSlice
    : principalSlice;

  return (
    <Avatar
      className={`w-9 h-9 shrink-0 border-2 ${
        isOwn ? "border-purple-300" : "border-pink-200"
      }`}
    >
      {isOwn && avatarUrl && isImageUrl(avatarUrl) && (
        <AvatarImage src={avatarUrl} alt="Your avatar" />
      )}
      <AvatarFallback
        className={`text-sm font-semibold ${
          isOwn
            ? "bg-gradient-to-br from-purple-100 to-pink-100"
            : "bg-gradient-to-br from-blue-100 to-cyan-100"
        }`}
      >
        {fallback}
      </AvatarFallback>
    </Avatar>
  );
}

// Render a short principal slice for display (e.g. "ab12...cd34").
function shortPrincipal(p: Principal): string {
  const s = p.toString();
  if (s.length <= 12) return s;
  return `${s.slice(0, 4)}...${s.slice(-4)}`;
}

// Format a backend bigint timestamp (nanoseconds) into a locale time string.
function formatTimestamp(ts: bigint): string {
  // Backend timestamps are nanoseconds since epoch — convert to ms.
  return new Date(Number(ts) / 1_000_000).toLocaleTimeString();
}

// Relative "time ago" for chat thread previews.
function timeAgo(ts: bigint): string {
  const ms = Number(ts) / 1_000_000;
  const diff = Date.now() - ms;
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  return `${days}d`;
}

type Tab = "friends" | "requests" | "chat";

export default function ChatPage() {
  const { identity } = useInternetIdentity();
  const { data: currentUserProfile } = useGetCallerUserProfile();

  // Broadcast presence to the backend on mount + every 2 minutes so the
  // caller stays marked online while the chat page is open. The backend
  // uses a 4-minute freshness window; useGetOnlineUsers (below) polls every
  // 10s and will now return real data because the heartbeat populates the
  // backend's presence map.
  usePresenceHeartbeat();

  // Friends + requests + threads
  const { data: friends = [] } = useGetFriends();
  const { data: friendRequests = [] } = useGetFriendRequests();
  const { data: friendsList = [] } = useGetFriendsList();
  const { data: chatThreads = [] } = useGetChatThreads();
  // Currently-online users (backend-backed public query).
  const { data: onlineUsers = [] } = useGetOnlineUsers();

  // Mutations
  const sendFriendRequestMutation = useSendFriendRequest();
  const acceptFriendRequestMutation = useAcceptFriendRequest();
  const declineFriendRequestMutation = useDeclineFriendRequest();
  const removeFriendMutation = useRemoveFriend();

  // Active chat state
  const [activeTab, setActiveTab] = useState<Tab>("friends");
  const [activeFriendPrincipal, setActiveFriendPrincipal] =
    useState<Principal | null>(null);
  const [messageText, setMessageText] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [principalInput, setPrincipalInput] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const currentUserId = identity?.getPrincipal().toString() || "";
  const currentUserName = currentUserProfile?.name?.trim() || "You";
  const currentUserAvatar = currentUserProfile?.avatarUrl;

  // Chat messages for the active friend (backend-backed, polls every 5s).
  const activePrincipalForQuery = activeFriendPrincipal;
  const { data: activeMessages = [] } = useGetChatMessagesBackend(
    activePrincipalForQuery,
  );
  const sendMessageMutation = useSendChatMessageBackend();

  // Auto-scroll to the latest message when the thread updates.
  // biome-ignore lint/correctness/useExhaustiveDependencies: messagesEndRef is a stable ref
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [activeMessages]);

  // Resolve the active friend object (for header display + online status).
  const activeFriend = useMemo<Friend | null>(() => {
    if (!activeFriendPrincipal) return null;
    return (
      friends.find(
        (f) => f.principal.toString() === activeFriendPrincipal.toString(),
      ) ?? null
    );
  }, [friends, activeFriendPrincipal]);

  // Filter the friends-list search by name (case-insensitive). Exclude self.
  const filteredUsers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    return friendsList.filter((u) => {
      if (u.principal.toString() === currentUserId) return false;
      if (!q) return true;
      return u.name.toLowerCase().includes(q);
    });
  }, [friendsList, searchQuery, currentUserId]);

  // Online users available to friend — exclude self and existing friends so
  // the list only shows users you can actually send a new request to.
  const onlineUsersToFriend = useMemo(() => {
    const friendPrincipals = new Set(
      friends.map((f) => f.principal.toString()),
    );
    return onlineUsers.filter((u) => {
      const p = u.principal.toString();
      return p !== currentUserId && !friendPrincipals.has(p);
    });
  }, [onlineUsers, friends, currentUserId]);

  const handleOpenChat = (principal: Principal) => {
    setActiveFriendPrincipal(principal);
    setActiveTab("chat");
  };

  const handleSendByPrincipal = async () => {
    const text = principalInput.trim();
    if (!text) {
      toast.error("Enter a principal to send a friend request");
      return;
    }
    let principal: Principal;
    try {
      principal = Principal.fromText(text);
    } catch {
      toast.error("Invalid principal format");
      return;
    }
    try {
      await sendFriendRequestMutation.mutateAsync(principal);
      setPrincipalInput("");
    } catch (error) {
      // onError toast is already handled in the hook; swallow here.
      console.error(error);
    }
  };

  const handleSendByName = async (user: AdminUserView) => {
    try {
      await sendFriendRequestMutation.mutateAsync(user.principal);
    } catch (error) {
      console.error(error);
    }
  };

  const handleAccept = async (req: FriendRequest) => {
    try {
      await acceptFriendRequestMutation.mutateAsync(req.from);
    } catch (error) {
      console.error(error);
    }
  };

  const handleDecline = async (req: FriendRequest) => {
    try {
      await declineFriendRequestMutation.mutateAsync(req.from);
    } catch (error) {
      console.error(error);
    }
  };

  const handleRemoveFriend = async (friend: Friend) => {
    try {
      await removeFriendMutation.mutateAsync(friend.principal);
      if (
        activeFriendPrincipal &&
        activeFriendPrincipal.toString() === friend.principal.toString()
      ) {
        setActiveFriendPrincipal(null);
        setActiveTab("friends");
      }
    } catch (error) {
      console.error(error);
    }
  };

  const handleSendMessage = async () => {
    if (!messageText.trim() || !activeFriendPrincipal) {
      toast.error("Select a friend and enter a message");
      return;
    }
    try {
      await sendMessageMutation.mutateAsync({
        toPrincipal: activeFriendPrincipal,
        text: messageText,
      });
      setMessageText("");
    } catch (error) {
      console.error(error);
    }
  };

  // Resolve the requester's display name from the friends list (admin view).
  const requesterName = (req: FriendRequest): string => {
    const match = friendsList.find(
      (u) => u.principal.toString() === req.from.toString(),
    );
    return match?.name || shortPrincipal(req.from);
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h1 className="text-4xl md:text-5xl font-bold mb-4 bg-gradient-to-r from-pink-600 via-purple-600 to-blue-600 bg-clip-text text-transparent">
          Friends & Chat 💬
        </h1>
        <p className="text-xl text-muted-foreground">
          Connect with friends and chat safely
        </p>
      </div>

      {/* Tab switcher */}
      <div className="flex flex-wrap gap-2 justify-center">
        <Button
          variant={activeTab === "friends" ? "default" : "outline"}
          onClick={() => setActiveTab("friends")}
          data-ocid="chat.tab.friends"
          className={activeTab === "friends" ? "bg-purple-600 text-white" : ""}
        >
          <Users className="w-4 h-4 mr-2" />
          Friends ({friends.length})
        </Button>
        <Button
          variant={activeTab === "requests" ? "default" : "outline"}
          onClick={() => setActiveTab("requests")}
          data-ocid="chat.tab.requests"
          className={activeTab === "requests" ? "bg-purple-600 text-white" : ""}
        >
          <UserPlus className="w-4 h-4 mr-2" />
          Requests ({friendRequests.length})
        </Button>
        <Button
          variant={activeTab === "chat" ? "default" : "outline"}
          onClick={() => setActiveTab("chat")}
          data-ocid="chat.tab.chat"
          className={activeTab === "chat" ? "bg-purple-600 text-white" : ""}
        >
          <MessageCircle className="w-4 h-4 mr-2" />
          Chat
        </Button>
      </div>

      {/* FRIENDS LIST TAB */}
      {activeTab === "friends" && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Accepted friends */}
          <Card className="border-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="w-5 h-5" />
                Your Friends
              </CardTitle>
              <CardDescription>
                Open a chat with an accepted friend
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                {friends.length === 0 ? (
                  <p
                    className="text-center text-muted-foreground py-8"
                    data-ocid="chat.friends.empty_state"
                  >
                    No friends yet. Send a request to get started!
                  </p>
                ) : (
                  <div className="space-y-2">
                    {friends.map((friend, index) => (
                      <div
                        key={friend.principal.toString()}
                        className={`flex items-center gap-3 p-3 rounded-lg border-2 transition-colors ${
                          activeFriendPrincipal?.toString() ===
                          friend.principal.toString()
                            ? "border-purple-400 bg-purple-50"
                            : "border-border bg-card hover:bg-muted/40"
                        }`}
                        data-ocid={`chat.friends.item.${index + 1}`}
                      >
                        <div className="relative shrink-0">
                          <Avatar className="w-10 h-10 border-2 border-pink-200">
                            <AvatarFallback className="bg-gradient-to-br from-blue-100 to-cyan-100 font-semibold">
                              {friend.name.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <span
                            className={`absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 border-card ${
                              friend.online ? "bg-green-500" : "bg-gray-400"
                            }`}
                            aria-label={friend.online ? "Online" : "Offline"}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold truncate">
                            {friend.name}
                          </p>
                          <p className="text-xs text-muted-foreground truncate">
                            {shortPrincipal(friend.principal)} ·{" "}
                            {friend.online ? "Online" : "Offline"}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => handleOpenChat(friend.principal)}
                          data-ocid={`chat.friends.open_chat.${index + 1}`}
                          className="bg-purple-600 text-white hover:bg-purple-700"
                        >
                          <MessageCircle className="w-4 h-4 mr-1" />
                          Chat
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => handleRemoveFriend(friend)}
                          disabled={removeFriendMutation.isPending}
                          data-ocid={`chat.friends.remove.${index + 1}`}
                          aria-label={`Remove ${friend.name} as friend`}
                        >
                          <UserMinus className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Send friend request */}
          <Card className="border-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <UserPlus className="w-5 h-5" />
                Send Friend Request
              </CardTitle>
              <CardDescription>
                Search by name or enter a principal directly
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Direct principal entry */}
              <div className="flex gap-2">
                <Input
                  placeholder="Paste a user principal..."
                  value={principalInput}
                  onChange={(e) => setPrincipalInput(e.target.value)}
                  data-ocid="chat.request.principal_input"
                />
                <Button
                  onClick={handleSendByPrincipal}
                  disabled={sendFriendRequestMutation.isPending}
                  data-ocid="chat.request.send_principal_button"
                  className="bg-pink-600 text-white hover:bg-pink-700"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>

              <div className="relative">
                <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                  <Search className="w-4 h-4 text-muted-foreground" />
                </div>
                <Input
                  placeholder="Search users by name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-9"
                  data-ocid="chat.request.search_input"
                />
              </div>

              <ScrollArea className="h-[280px] border-2 rounded-lg">
                {filteredUsers.length === 0 ? (
                  <p
                    className="text-center text-muted-foreground py-8"
                    data-ocid="chat.request.empty_state"
                  >
                    {searchQuery
                      ? "No users match your search"
                      : "No users available to friend"}
                  </p>
                ) : (
                  <div className="space-y-1 p-1">
                    {filteredUsers.map((user, index) => (
                      <div
                        key={user.principal.toString()}
                        className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/40"
                        data-ocid={`chat.request.user.${index + 1}`}
                      >
                        <Avatar className="w-9 h-9 border-2 border-blue-200 shrink-0">
                          <AvatarFallback className="bg-gradient-to-br from-blue-100 to-cyan-100 text-sm font-semibold">
                            {user.name.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold truncate">{user.name}</p>
                          <p className="text-xs text-muted-foreground truncate">
                            {shortPrincipal(user.principal)}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleSendByName(user)}
                          disabled={sendFriendRequestMutation.isPending}
                          data-ocid={`chat.request.send.${index + 1}`}
                        >
                          <UserPlus className="w-4 h-4 mr-1" />
                          Add
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>

              {/* Online users — send a friend request to someone currently
                  online. Excludes self and existing friends. */}
              <div className="pt-2 border-t-2 border-border/60">
                <div className="flex items-center gap-2 mb-2">
                  <span className="relative flex h-2.5 w-2.5">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75" />
                    <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-green-500" />
                  </span>
                  <h4 className="text-sm font-semibold text-foreground">
                    Online Now
                  </h4>
                  <span className="text-xs text-muted-foreground">
                    ({onlineUsersToFriend.length})
                  </span>
                </div>
                <ScrollArea className="h-[200px] border-2 rounded-lg">
                  {onlineUsersToFriend.length === 0 ? (
                    <p
                      className="text-center text-muted-foreground py-8"
                      data-ocid="chat.request.online.empty_state"
                    >
                      No other users online right now. Check back soon!
                    </p>
                  ) : (
                    <div className="space-y-1 p-1">
                      {onlineUsersToFriend.map((user, index) => (
                        <div
                          key={user.principal.toString()}
                          className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/40"
                          data-ocid={`chat.request.online.item.${index + 1}`}
                        >
                          <div className="relative shrink-0">
                            <Avatar className="w-9 h-9 border-2 border-green-300">
                              <AvatarFallback className="bg-gradient-to-br from-green-100 to-emerald-100 text-sm font-semibold">
                                {user.name.slice(0, 2).toUpperCase()}
                              </AvatarFallback>
                            </Avatar>
                            <span
                              className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-green-500 border-2 border-card"
                              aria-label="Online"
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="font-semibold truncate">
                              {user.name}
                            </p>
                            <p className="text-xs text-muted-foreground truncate">
                              {shortPrincipal(user.principal)} · Online
                            </p>
                          </div>
                          <Button
                            size="sm"
                            onClick={() => handleSendByName(user)}
                            disabled={sendFriendRequestMutation.isPending}
                            data-ocid={`chat.request.online.send.${index + 1}`}
                            className="bg-green-600 text-white hover:bg-green-700"
                          >
                            <UserPlus className="w-4 h-4 mr-1" />
                            Send
                          </Button>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* FRIEND REQUESTS TAB */}
      {activeTab === "requests" && (
        <Card className="border-4 max-w-2xl mx-auto">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <UserPlus className="w-5 h-5" />
              Incoming Friend Requests
            </CardTitle>
            <CardDescription>
              Accept to become friends and unlock chat
            </CardDescription>
          </CardHeader>
          <CardContent>
            {friendRequests.length === 0 ? (
              <p
                className="text-center text-muted-foreground py-12"
                data-ocid="chat.requests.empty_state"
              >
                No pending friend requests. 🎉
              </p>
            ) : (
              <div className="space-y-2">
                {friendRequests.map((req, index) => (
                  <div
                    key={req.from.toString()}
                    className="flex items-center gap-3 p-3 rounded-lg border-2 border-border bg-card"
                    data-ocid={`chat.requests.item.${index + 1}`}
                  >
                    <Avatar className="w-10 h-10 border-2 border-pink-200 shrink-0">
                      <AvatarFallback className="bg-gradient-to-br from-purple-100 to-pink-100 font-semibold">
                        {requesterName(req).slice(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold truncate">
                        {requesterName(req)}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {shortPrincipal(req.from)}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      onClick={() => handleAccept(req)}
                      disabled={acceptFriendRequestMutation.isPending}
                      data-ocid={`chat.requests.accept.${index + 1}`}
                      className="bg-green-600 text-white hover:bg-green-700"
                    >
                      <Check className="w-4 h-4 mr-1" />
                      Accept
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => handleDecline(req)}
                      disabled={declineFriendRequestMutation.isPending}
                      data-ocid={`chat.requests.decline.${index + 1}`}
                    >
                      <X className="w-4 h-4 mr-1" />
                      Decline
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* CHAT TAB */}
      {activeTab === "chat" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Chat threads sidebar */}
          <Card className="border-4 md:col-span-1">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5" />
                Conversations
              </CardTitle>
              <CardDescription>
                {chatThreads.length} friend
                {chatThreads.length === 1 ? "" : "s"} with messages
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[460px]">
                {chatThreads.length === 0 ? (
                  <p
                    className="text-center text-muted-foreground py-8"
                    data-ocid="chat.threads.empty_state"
                  >
                    No conversations yet. Open a friend to start chatting.
                  </p>
                ) : (
                  <div className="space-y-1">
                    {chatThreads.map((thread, index) => (
                      <ChatThreadItem
                        key={thread.friend.toString()}
                        thread={thread}
                        isActive={
                          activeFriendPrincipal?.toString() ===
                          thread.friend.toString()
                        }
                        onSelect={() => setActiveFriendPrincipal(thread.friend)}
                        index={index}
                      />
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Active chat panel */}
          <Card className="border-4 md:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5" />
                {activeFriend
                  ? `Chat with ${activeFriend.name}`
                  : "Select a conversation"}
              </CardTitle>
              {activeFriend && (
                <CardDescription className="flex items-center gap-2">
                  <span
                    className={`inline-block w-2 h-2 rounded-full ${
                      activeFriend.online ? "bg-green-500" : "bg-gray-400"
                    }`}
                  />
                  {activeFriend.online ? "Online" : "Offline"} ·{" "}
                  {shortPrincipal(activeFriend.principal)}
                </CardDescription>
              )}
            </CardHeader>
            <CardContent>
              {activeFriend ? (
                <div className="space-y-4">
                  <ScrollArea className="h-[360px] border-2 rounded-lg p-4">
                    <div className="space-y-3">
                      {activeMessages.length === 0 ? (
                        <p
                          className="text-center text-muted-foreground"
                          data-ocid="chat.messages.empty_state"
                        >
                          No messages yet. Say hello! 👋
                        </p>
                      ) : (
                        activeMessages.map((message, index) => {
                          const isOwn =
                            message.sender.toString() === currentUserId;
                          const senderName = isOwn
                            ? currentUserName
                            : activeFriend.name;
                          const senderAvatar = isOwn
                            ? currentUserAvatar
                            : undefined;
                          const principalSlice = isOwn
                            ? currentUserId.slice(0, 2).toUpperCase()
                            : activeFriend.principal
                                .toString()
                                .slice(0, 2)
                                .toUpperCase();
                          return (
                            <div
                              key={message.id.toString()}
                              className={`flex items-end gap-2 ${
                                isOwn ? "justify-end" : "justify-start"
                              }`}
                              data-ocid={`chat.messages.item.${index + 1}`}
                            >
                              {!isOwn && (
                                <ChatAvatar
                                  isOwn={false}
                                  principalSlice={principalSlice}
                                />
                              )}
                              <div
                                className={`max-w-[70%] rounded-lg p-3 ${
                                  isOwn
                                    ? "bg-purple-600 text-white"
                                    : "bg-muted text-foreground"
                                }`}
                              >
                                <p className="text-xs font-semibold mb-1">
                                  {senderName}
                                </p>
                                <p className="break-words">{message.content}</p>
                                <p className="text-xs mt-1 opacity-70">
                                  {formatTimestamp(message.timestamp)}
                                </p>
                              </div>
                              {isOwn && (
                                <ChatAvatar
                                  isOwn={true}
                                  avatarUrl={senderAvatar}
                                  principalSlice={principalSlice}
                                />
                              )}
                            </div>
                          );
                        })
                      )}
                      <div ref={messagesEndRef} />
                    </div>
                  </ScrollArea>

                  <div className="flex gap-2">
                    <Input
                      placeholder="Type your message..."
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          handleSendMessage();
                        }
                      }}
                      data-ocid="chat.input"
                    />
                    <Button
                      onClick={handleSendMessage}
                      disabled={
                        sendMessageMutation.isPending || !messageText.trim()
                      }
                      data-ocid="chat.send_button"
                      className="bg-purple-600 text-white hover:bg-purple-700"
                    >
                      <Send className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ) : (
                <div
                  className="flex items-center justify-center h-[400px]"
                  data-ocid="chat.no_selection"
                >
                  <p className="text-muted-foreground">
                    Select a conversation or open a friend from the Friends tab
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

// Chat thread list item — kept as a sub-component to keep the main file
// readable. Renders the friend name, last message preview, and time ago.
function ChatThreadItem({
  thread,
  isActive,
  onSelect,
  index,
}: {
  thread: ChatThread;
  isActive: boolean;
  onSelect: () => void;
  index: number;
}) {
  return (
    <Button
      variant={isActive ? "default" : "ghost"}
      onClick={onSelect}
      className={`w-full justify-start text-left h-auto py-3 ${
        isActive ? "bg-purple-600 text-white" : ""
      }`}
      data-ocid={`chat.threads.item.${index + 1}`}
    >
      <div className="flex items-center gap-3 w-full min-w-0">
        <Avatar className="w-9 h-9 border-2 border-pink-200 shrink-0">
          <AvatarFallback className="bg-gradient-to-br from-blue-100 to-cyan-100 text-sm font-semibold">
            {thread.name.slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <p className="font-semibold truncate">{thread.name}</p>
          <p
            className={`text-xs truncate ${
              isActive ? "text-white/80" : "text-muted-foreground"
            }`}
          >
            {thread.lastMessage || "No messages yet"}
          </p>
        </div>
        <span
          className={`text-xs shrink-0 ${
            isActive ? "text-white/80" : "text-muted-foreground"
          }`}
        >
          {timeAgo(thread.lastMessageAt)}
        </span>
      </div>
    </Button>
  );
}
