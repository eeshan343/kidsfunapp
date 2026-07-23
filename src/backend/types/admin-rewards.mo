// Domain types for the admin-rewards domain.
//
// Admin can send point grants to any registered user. Points are added to the
// user's existing Reward record (the same record surfaced by
// getCallerRewards / getTotalScore). This domain does NOT support bulk
// distribution to multiple users at once (per doNotBuild).

import Common "./common";

module {
  public type RewardResult = Common.RewardResult;
};
