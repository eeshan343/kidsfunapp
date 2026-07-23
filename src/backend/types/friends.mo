// Domain types for the friends system.
//
// The friends domain manages pending friend requests and accepted friendships
// between registered users. State is keyed by Principal and persisted in the
// backend canister. This module re-exports the shared types from common.mo so
// the friends lib/mixin can reference them by a single import.

import Map "mo:core/Map";
import Set "mo:core/Set";
import Common "./common";

module {
  public type FriendRequest = Common.FriendRequest;
  public type Friend = Common.Friend;
  public type FriendResult = Common.FriendResult;

  // State slice for the friends domain. The mixin receives these maps by
  // reference and mutates them in place.
  //
  // - friendRequests: keyed by recipient Principal, value is the list of
  //   pending requests addressed to that recipient.
  // - friendships: keyed by user Principal, value is the set of friend
  //   Principals (symmetric — both parties store each other).
  public type State = {
    friendRequests : Map.Map<Principal, [FriendRequest]>;
    friendships : Map.Map<Principal, Set.Set<Principal>>;
  };
};
