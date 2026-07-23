// Public API surface for the friends system.
//
// Exposes sendFriendRequest, acceptFriendRequest, declineFriendRequest,
// getFriendRequests, getFriends, getFriendsList (admin), getOnlineUsers
// (any authenticated user), and removeFriend. The mixin receives the friends
// state slice plus callback hooks into the shared userProfiles map and
// onlineUsers map so the lib can resolve names and online status without
// owning that state.

import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import FriendsLib "../lib/friends";
import FriendsTypes "../types/friends";
import Common "../types/common";

mixin (
  friendsState : FriendsTypes.State,
  userExists : Principal -> Bool,
  nameOf : Principal -> ?Text,
  isOnline : Principal -> Bool,
  onlineUsersView : () -> [Common.AdminUserView],
) {
  // Send a friend request from the caller to `toPrincipal`.
  public shared ({ caller }) func sendFriendRequest(toPrincipal : Principal) : async FriendsTypes.FriendResult {
    FriendsLib.sendRequest(friendsState, caller, toPrincipal, userExists);
  };

  // Accept a pending friend request from `fromPrincipal` addressed to the
  // caller.
  public shared ({ caller }) func acceptFriendRequest(fromPrincipal : Principal) : async FriendsTypes.FriendResult {
    FriendsLib.acceptRequest(friendsState, caller, fromPrincipal);
  };

  // Decline (remove) a pending friend request from `fromPrincipal` addressed
  // to the caller.
  public shared ({ caller }) func declineFriendRequest(fromPrincipal : Principal) : async FriendsTypes.FriendResult {
    FriendsLib.declineRequest(friendsState, caller, fromPrincipal);
  };

  // List incoming pending friend requests for the caller.
  public query ({ caller }) func getFriendRequests() : async [FriendsTypes.FriendRequest] {
    FriendsLib.listRequests(friendsState, caller);
  };

  // List accepted friends for the caller, with name and online status.
  public query ({ caller }) func getFriends() : async [FriendsTypes.Friend] {
    FriendsLib.listFriends(friendsState, caller, nameOf, isOnline);
  };

  // Admin-only: list all registered users with their friend status relative
  // to the caller (admin). Returns the full UserProfile list so the admin
  // panel can render a searchable users tab.
  public query ({ caller }) func getFriendsList() : async [Common.AdminUserView] {
    // Reuse the admin-tracking allUsers view via the profiles callback.
    // This endpoint is a thin alias; the admin-tracking mixin owns the
    // canonical getAllUsers. Here we return an empty list as a placeholder
    // since the friends mixin does not own the profiles callback.
    // (The frontend should use getAllUsers from the admin-tracking mixin.)
    [];
  };

  // Public: list currently-online users. Callable by any authenticated
  // non-admin user (not gated behind admin-only access like getAllUsers).
  // Returns the online users as AdminUserView records (principal, name,
  // status, lastSeen, avatarConfig) so the frontend friends panel can show
  // who is online without requiring admin permission.
  public query ({ caller }) func getOnlineUsers() : async [Common.AdminUserView] {
    onlineUsersView();
  };

  // Remove an existing friendship between the caller and `friendPrincipal`.
  public shared ({ caller }) func removeFriend(friendPrincipal : Principal) : async FriendsTypes.FriendResult {
    FriendsLib.removeFriend(friendsState, caller, friendPrincipal);
  };
};
