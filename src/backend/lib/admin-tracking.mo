// Domain logic for the admin user-tracking domain.
//
// Records per-user and platform-wide activity events and exposes admin-only
// read views.

import Map "mo:core/Map";
import List "mo:core/List";
import Time "mo:core/Time";
import Types "../types/admin-tracking";

module {
  // Cap for the global recent-activity feed.
  let RECENT_ACTIVITY_CAP : Nat = 200;
  // Cap for per-user activity history.
  let USER_ACTIVITY_CAP : Nat = 100;

  // Record an activity event for `user` and append it to the global recent
  // activity feed (capped at a fixed size by the lib).
  public func record(
    state : Types.State,
    user : Principal,
    eventType : Text,
    metadata : Text,
  ) : () {
    let event : Types.ActivityEvent = {
      principal = user;
      eventType;
      metadata;
      timestamp = Time.now();
    };
    // Append to per-user history (capped)
    let userEvents = switch (state.userActivity.get(user)) {
      case (?evts) { evts };
      case null { [] };
    };
    let updatedUserEvents = userEvents.concat([event]);
    // Trim to cap (keep most recent)
    let trimmedUserEvents = if (updatedUserEvents.size() > USER_ACTIVITY_CAP) {
      let dropCount = updatedUserEvents.size() - USER_ACTIVITY_CAP;
      updatedUserEvents.sliceToArray(dropCount, updatedUserEvents.size());
    } else {
      updatedUserEvents;
    };
    state.userActivity.add(user, trimmedUserEvents);
    // Append to global recent activity (capped)
    state.recentActivity.add(event);
    if (state.recentActivity.size() > RECENT_ACTIVITY_CAP) {
      // Drop oldest (front) by rebuilding from index 1 onward
      let kept = state.recentActivity.sliceToArray(1, state.recentActivity.size());
      state.recentActivity.clear();
      state.recentActivity.addAll(kept.vals());
    };
  };

  // Build the admin-facing view of all registered users with name, status,
  // lastSeen, and avatarConfig. `profileOf` resolves a Principal to its
  // UserProfile, `statusOf` to its AdminUserStatus text, `lastSeenOf` to its
  // last-seen Int (0 if never seen).
  public func allUsers(
    state : Types.State,
    profiles : () -> [(Principal, { name : Text; avatarConfig : ?{ body : Text; head : Text; hair : Text; pants : Text; headwear : Text; shoes : Text } })],
    statusOf : Principal -> Text,
    lastSeenOf : Principal -> Int,
  ) : [Types.AdminUserView] {
    let allProfiles = profiles();
    allProfiles.map<(Principal, { name : Text; avatarConfig : ?{ body : Text; head : Text; hair : Text; pants : Text; headwear : Text; shoes : Text } }), Types.AdminUserView>(
      func(p : Principal, profile : { name : Text; avatarConfig : ?{ body : Text; head : Text; hair : Text; pants : Text; headwear : Text; shoes : Text } }) : Types.AdminUserView = {
        principal = p;
        name = profile.name;
        status = statusOf(p);
        lastSeen = lastSeenOf(p);
        avatarConfig = profile.avatarConfig;
      },
    );
  };

  // List the activity history for a single user (admin only).
  public func userActivity(state : Types.State, user : Principal) : [Types.ActivityEvent] {
    switch (state.userActivity.get(user)) {
      case (?evts) { evts };
      case null { [] };
    };
  };

  // List the platform-wide recent activity feed (admin only).
  public func recentActivity(state : Types.State) : [Types.ActivityEvent] {
    state.recentActivity.toArray();
  };
};
