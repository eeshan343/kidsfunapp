// Domain logic for the one-time admin-claim flow.
//
// Pure functions over the admin-claim state slice. The state holds a single
// optional Principal — null means unclaimed, ?p means p is the sole admin.
// First claim wins; there is no multiple-admin support. The claim is gated by
// a password. resetAdmin clears the stored admin so the claim can be taken
// again.

import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import Text "mo:core/Text";
import Types "../types/admin-claim";

module {
  // The admin-claim state slice. A single optional Principal — null means
  // unclaimed, ?p means p is the sole admin. Held as a `var` record field so
  // mixins can mutate it by reference.
  public type State = { var admin : ?Principal };

  // The password required to claim admin. Defined here so the lib owns the
  // secret; the mixin delegates the check to this module.
  let ADMIN_CLAIM_PASSWORD : Text = "sigma67eeshan";

  public func newState() : State {
    { var admin = null };
  };

  // Attempt to claim admin for `caller` gated by `password`. First claim
  // wins: if no admin is set AND the password matches, store `caller` and
  // return #claimed. If an admin is already set, return #alreadyClaimed with
  // the stored admin Principal. If the password is missing/incorrect, trap
  // with a clear error so the frontend can surface it.
  public func claim(state : State, caller : Principal, password : Text) : Types.ClaimResult {
    if (not Text.equal(password, ADMIN_CLAIM_PASSWORD)) {
      Runtime.trap("Unauthorized: incorrect admin claim password");
    };
    switch (state.admin) {
      case (?admin) { #alreadyClaimed { admin } };
      case null {
        state.admin := ?caller;
        #claimed;
      };
    };
  };

  // Return the stored admin Principal, or null if unclaimed.
  public func getAdmin(state : State) : ?Principal {
    state.admin;
  };

  // Return true iff `caller` matches the stored admin Principal.
  // Returns false when no admin is claimed yet.
  public func isAdmin(state : State, caller : Principal) : Bool {
    switch (state.admin) {
      case (?admin) { Principal.equal(admin, caller) };
      case null { false };
    };
  };

  // Clear the stored admin Principal so the claim can be taken again. Returns
  // #reset when an admin was previously set, #noAdmin when nothing was set.
  public func reset(state : State) : Types.ResetResult {
    switch (state.admin) {
      case (?_) {
        state.admin := null;
        #reset;
      };
      case null { #noAdmin };
    };
  };
};
