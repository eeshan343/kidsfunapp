// Public API surface for the one-time admin-claim flow.
//
// Exposes claimAdmin (password-gated), getAdminPrincipal, isClaimedAdmin, and
// resetAdmin. The isClaimedAdmin here is the Principal-match admin check for
// the admin-claim flow — it returns true only when the caller matches the
// stored admin Principal. The composition root (main.mo) includes BOTH this
// mixin AND MixinAuthorization (accessControlState); MixinAuthorization
// provides the platform-required isCallerAdmin (AccessControl-based), while
// this mixin's isClaimedAdmin checks the admin-claim Principal. The two names
// are distinct so both mixins can be composed without a duplicate-public-
// function conflict.

import AdminClaimLib "../lib/admin-claim";
import Types "../types/admin-claim";

mixin (adminClaimState : AdminClaimLib.State) {
  // One-time admin claim gated by a password. First caller to invoke this
  // with the correct password when no admin is set becomes the sole admin.
  // Subsequent calls return #alreadyClaimed. An incorrect or missing password
  // traps with a clear error.
  public shared ({ caller }) func claimAdmin(password : Text) : async Types.ClaimResult {
    AdminClaimLib.claim(adminClaimState, caller, password);
  };

  // Return the stored admin Principal, or null if unclaimed. Lets the
  // frontend show claim status without attempting a claim.
  public query func getAdminPrincipal() : async ?Principal {
    AdminClaimLib.getAdmin(adminClaimState);
  };

  // Returns true only when the caller matches the stored admin Principal.
  // Returns false when no admin is claimed yet. This is the Principal-match
  // admin check for the admin-claim flow, distinct from MixinAuthorization's
  // AccessControl-based isCallerAdmin.
  public query ({ caller }) func isClaimedAdmin() : async Bool {
    AdminClaimLib.isAdmin(adminClaimState, caller);
  };

  // Reset the claimed admin so the claim can be taken again. Returns #reset
  // when an admin was previously set, #noAdmin when nothing was set.
  public shared func resetAdmin() : async Types.ResetResult {
    AdminClaimLib.reset(adminClaimState);
  };
};
