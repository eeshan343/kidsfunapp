// Domain logic for the admin-rewards domain.
//
// Admin can grant points to a single registered user. Points are added to the
// user's existing Reward record. Bulk distribution to multiple users at once
// is intentionally NOT supported (per doNotBuild).

import Types "../types/admin-rewards";

module {
  // Grant `points` to `toPrincipal` on behalf of `caller`. Returns #sent on
  // success, #notFound if the recipient has no profile, #notAdmin if the
  // caller is not an admin. `isAdmin` and `addPoints` callbacks supply the
  // authorization check and the actual points mutation on the rewards map.
  public func sendReward(
    caller : Principal,
    toPrincipal : Principal,
    points : Nat,
    isAdmin : Principal -> Bool,
    userExists : Principal -> Bool,
    addPoints : (Principal, Nat) -> (),
  ) : Types.RewardResult {
    if (not isAdmin(caller)) {
      return #notAdmin;
    };
    if (not userExists(toPrincipal)) {
      return #notFound;
    };
    addPoints(toPrincipal, points);
    #sent;
  };
};
