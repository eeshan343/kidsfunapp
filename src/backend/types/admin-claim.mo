// Domain types for the one-time admin-claim flow.
//
// The admin-claim domain stores a single admin Principal in backend state.
// First claim wins — once an admin Principal is set, subsequent claims are
// rejected unless reset. There is no multiple-admin support.

module {
  // Result of attempting to claim admin. Returned by claimAdmin so the
  // frontend can distinguish "claimed" from "already-claimed" without trapping.
  public type ClaimResult = {
    #claimed;
    #alreadyClaimed : { admin : Principal };
  };

  // Result of attempting to reset the claimed admin. Returned by resetAdmin so
  // the frontend can distinguish "reset" from "no-admin-to-reset".
  public type ResetResult = {
    #reset;
    #noAdmin;
  };
};
