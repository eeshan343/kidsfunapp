// Public API surface for the admin-rewards domain.
//
// Exposes adminSendReward (admin-only single-user point grant). Bulk
// distribution to multiple users at once is intentionally NOT supported
// (per doNotBuild).

import Principal "mo:core/Principal";
import AdminRewardsLib "../lib/admin-rewards";
import AdminRewardsTypes "../types/admin-rewards";

mixin (
  isAdmin : Principal -> Bool,
  userExists : Principal -> Bool,
  addPoints : (Principal, Nat) -> (),
) {
  // Admin-only: grant `points` to `toPrincipal`. Returns #sent, #notFound,
  // or #notAdmin.
  public shared ({ caller }) func adminSendReward(toPrincipal : Principal, points : Nat) : async AdminRewardsTypes.RewardResult {
    AdminRewardsLib.sendReward(caller, toPrincipal, points, isAdmin, userExists, addPoints);
  };
};
