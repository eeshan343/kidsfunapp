// Public API surface for the admin user-tracking domain.
//
// Exposes getAllUsers (admin), getUserActivity (admin), getRecentActivity
// (admin), and recordActivity (public — called internally on user actions
// and also callable from the frontend to log custom events).

import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import AdminTrackingLib "../lib/admin-tracking";
import AdminTrackingTypes "../types/admin-tracking";
import Common "../types/common";

mixin (
  trackingState : AdminTrackingTypes.State,
  isAdmin : Principal -> Bool,
  profiles : () -> [(Principal, { name : Text; avatarConfig : ?{ body : Text; head : Text; hair : Text; pants : Text; headwear : Text; shoes : Text } })],
  statusOf : Principal -> Text,
  lastSeenOf : Principal -> Int,
) {
  // Admin-only: list all registered users with name, principal, status,
  // lastSeen, and avatarConfig.
  public query ({ caller }) func getAllUsers() : async [Common.AdminUserView] {
    if (not isAdmin(caller)) {
      Runtime.trap("Unauthorized: Only admins can list all users");
    };
    AdminTrackingLib.allUsers(trackingState, profiles, statusOf, lastSeenOf);
  };

  // Admin-only: list the activity history for a single user.
  public query ({ caller }) func getUserActivity(userPrincipal : Principal) : async [Common.ActivityEvent] {
    if (not isAdmin(caller)) {
      Runtime.trap("Unauthorized: Only admins can view user activity");
    };
    AdminTrackingLib.userActivity(trackingState, userPrincipal);
  };

  // Admin-only: list the platform-wide recent activity feed.
  public query ({ caller }) func getRecentActivity() : async [Common.ActivityEvent] {
    if (not isAdmin(caller)) {
      Runtime.trap("Unauthorized: Only admins can view recent activity");
    };
    AdminTrackingLib.recentActivity(trackingState);
  };

  // Public: record an activity event for the caller. Called internally on
  // user actions (registration, spin, avatar edit, friend added) and also
  // callable from the frontend to log custom events.
  public shared ({ caller }) func recordActivity(eventType : Text, metadata : Text) : async () {
    AdminTrackingLib.record(trackingState, caller, eventType, metadata);
  };
};
