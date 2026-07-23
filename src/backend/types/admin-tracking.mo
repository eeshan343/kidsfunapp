// Domain types for the admin user-tracking domain.
//
// Admin tracking exposes a searchable list of all registered users with
// status and last-seen, per-user activity history, and a platform-wide
// recent-activity feed. All tracking data persists in backend canister state
// (not localStorage).

import Map "mo:core/Map";
import List "mo:core/List";
import Common "./common";

module {
  public type AdminUserView = Common.AdminUserView;
  public type ActivityEvent = Common.ActivityEvent;

  // State slice for the admin-tracking domain.
  //
  // - userActivity: keyed by user Principal, value is the list of that user's
  //   activity events (oldest first).
  // - recentActivity: a single global list of recent platform-wide activity
  //   events (capped at a reasonable size by the lib).
  public type State = {
    userActivity : Map.Map<Principal, [ActivityEvent]>;
    recentActivity : List.List<ActivityEvent>;
  };
};
