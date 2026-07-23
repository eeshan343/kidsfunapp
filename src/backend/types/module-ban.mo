// Domain types for the admin module-ban/unban domain.
//
// Banned modules are hidden from regular users and direct navigation to a
// banned module redirects regular users back to the Dashboard. Admins can
// still access and preview banned modules from the admin panel. The ban
// state persists in the backend canister.

import Set "mo:core/Set";
import Common "./common";

module {
  public type ModuleStatus = Common.ModuleStatus;
  public type ModuleBanResult = Common.ModuleBanResult;

  // State slice for the module-ban domain. A single set of banned module ids
  // (Text). The mixin receives this set by reference and mutates it in place.
  public type State = {
    bannedModules : Set.Set<Text>;
  };
};
