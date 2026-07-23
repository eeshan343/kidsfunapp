// Domain logic for the friends system.
//
// Pure-ish functions over the friends state slice. The mixin delegates to
// these.

import Map "mo:core/Map";
import Set "mo:core/Set";
import Principal "mo:core/Principal";
import Time "mo:core/Time";
import Types "../types/friends";

module {
  // Send a friend request from `caller` to `toPrincipal`. Returns a
  // FriendResult variant. The lib validates: not self, recipient exists,
  // not already friends, not already requested.
  public func sendRequest(
    state : Types.State,
    caller : Principal,
    toPrincipal : Principal,
    userExists : Principal -> Bool,
  ) : Types.FriendResult {
    if (Principal.equal(caller, toPrincipal)) {
      return #selfRequest;
    };
    if (not userExists(toPrincipal)) {
      return #notFound;
    };
    if (areFriends(state, caller, toPrincipal)) {
      return #alreadyFriends;
    };
    // Check if there is already a pending request from caller to toPrincipal
    let existing = switch (state.friendRequests.get(toPrincipal)) {
      case (?reqs) { reqs };
      case null { [] };
    };
    let alreadyRequested = existing.find(func(r : Types.FriendRequest) : Bool {
      Principal.equal(r.from, caller);
    });
    switch (alreadyRequested) {
      case (?_) { return #alreadyRequested };
      case null {};
    };
    let newRequest : Types.FriendRequest = {
      from = caller;
      to = toPrincipal;
      createdAt = Time.now();
    };
    state.friendRequests.add(toPrincipal, existing.concat([newRequest]));
    #sent;
  };

  // Accept a pending friend request from `fromPrincipal` addressed to
  // `caller`. Adds the symmetric friendship edge and removes the request.
  public func acceptRequest(
    state : Types.State,
    caller : Principal,
    fromPrincipal : Principal,
  ) : Types.FriendResult {
    let existing = switch (state.friendRequests.get(caller)) {
      case (?reqs) { reqs };
      case null { return #notFound };
    };
    let found = existing.find(func(r : Types.FriendRequest) : Bool {
      Principal.equal(r.from, fromPrincipal);
    });
    switch (found) {
      case null { return #notFound };
      case (?_) {};
    };
    // Add symmetric friendship edges
    addFriendship(state, caller, fromPrincipal);
    addFriendship(state, fromPrincipal, caller);
    // Remove the accepted request
    let remaining = existing.filter(func(r : Types.FriendRequest) : Bool {
      not Principal.equal(r.from, fromPrincipal);
    });
    state.friendRequests.add(caller, remaining);
    #accepted;
  };

  // Decline (remove) a pending friend request from `fromPrincipal` addressed
  // to `caller`.
  public func declineRequest(
    state : Types.State,
    caller : Principal,
    fromPrincipal : Principal,
  ) : Types.FriendResult {
    let existing = switch (state.friendRequests.get(caller)) {
      case (?reqs) { reqs };
      case null { return #notFound };
    };
    let found = existing.find(func(r : Types.FriendRequest) : Bool {
      Principal.equal(r.from, fromPrincipal);
    });
    switch (found) {
      case null { return #notFound };
      case (?_) {};
    };
    let remaining = existing.filter(func(r : Types.FriendRequest) : Bool {
      not Principal.equal(r.from, fromPrincipal);
    });
    state.friendRequests.add(caller, remaining);
    #declined;
  };

  // List incoming pending friend requests for `caller`.
  public func listRequests(state : Types.State, caller : Principal) : [Types.FriendRequest] {
    switch (state.friendRequests.get(caller)) {
      case (?reqs) { reqs };
      case null { [] };
    };
  };

  // List accepted friends for `caller` with display name and online status.
  // `nameOf` resolves a Principal to a display name; `isOnline` reports
  // online status from the OnlineUser map.
  public func listFriends(
    state : Types.State,
    caller : Principal,
    nameOf : Principal -> ?Text,
    isOnline : Principal -> Bool,
  ) : [Types.Friend] {
    switch (state.friendships.get(caller)) {
      case (?friends) {
        friends.toArray().map(
          func(p : Principal) : Types.Friend = {
            principal = p;
            name = switch (nameOf(p)) {
              case (?n) { n };
              case null { "Unknown" };
            };
            online = isOnline(p);
          },
        );
      };
      case null { [] };
    };
  };

  // Remove an existing friendship between `caller` and `friendPrincipal`
  // (symmetric — both sides are cleared).
  public func removeFriend(
    state : Types.State,
    caller : Principal,
    friendPrincipal : Principal,
  ) : Types.FriendResult {
    if (not areFriends(state, caller, friendPrincipal)) {
      return #notFound;
    };
    removeFriendship(state, caller, friendPrincipal);
    removeFriendship(state, friendPrincipal, caller);
    #removed;
  };

  // Auto-friend the admin with `user` — creates a symmetric friendship edge
  // directly (no request/accept round-trip). Used at registration time so
  // every user is friends with admin.
  public func autoFriendAdmin(
    state : Types.State,
    admin : Principal,
    user : Principal,
  ) : () {
    if (Principal.equal(admin, user)) {
      return;
    };
    addFriendship(state, admin, user);
    addFriendship(state, user, admin);
  };

  // Returns true iff `a` and `b` are accepted friends (symmetric check).
  public func areFriends(state : Types.State, a : Principal, b : Principal) : Bool {
    switch (state.friendships.get(a)) {
      case (?friends) { friends.contains(b) };
      case null { false };
    };
  };

  // --- helpers ---

  func addFriendship(state : Types.State, a : Principal, b : Principal) : () {
    let current = switch (state.friendships.get(a)) {
      case (?s) { s };
      case null { Set.empty<Principal>() };
    };
    current.add(b);
    state.friendships.add(a, current);
  };

  func removeFriendship(state : Types.State, a : Principal, b : Principal) : () {
    switch (state.friendships.get(a)) {
      case (?s) {
        s.remove(b);
        state.friendships.add(a, s);
      };
      case null {};
    };
  };
};
