// Public API surface for the admin module-ban/unban domain.
//
// Exposes getBannedModules (public — frontend hides banned modules),
// banModule (admin), unbanModule (admin), and getAllModuleStatuses (admin).

import Principal "mo:core/Principal";
import Runtime "mo:core/Runtime";
import ModuleBanLib "../lib/module-ban";
import ModuleBanTypes "../types/module-ban";
import Common "../types/common";

mixin (
  moduleBanState : ModuleBanTypes.State,
  isAdmin : Principal -> Bool,
  allModuleIds : () -> [Text],
) {
  // Public: list all currently banned module ids. The frontend uses this to
  // hide banned modules from regular users and redirect direct navigation
  // back to the Dashboard.
  public query func getBannedModules() : async [Text] {
    ModuleBanLib.bannedModules(moduleBanState);
  };

  // Admin-only: ban a module by id.
  public shared ({ caller }) func banModule(moduleId : Text) : async ModuleBanTypes.ModuleBanResult {
    if (not isAdmin(caller)) {
      Runtime.trap("Unauthorized: Only admins can ban modules");
    };
    ModuleBanLib.ban(moduleBanState, moduleId);
  };

  // Admin-only: unban a module by id.
  public shared ({ caller }) func unbanModule(moduleId : Text) : async ModuleBanTypes.ModuleBanResult {
    if (not isAdmin(caller)) {
      Runtime.trap("Unauthorized: Only admins can unban modules");
    };
    ModuleBanLib.unban(moduleBanState, moduleId);
  };

  // Admin-only: list the banned status of every known module id.
  public query ({ caller }) func getAllModuleStatuses() : async [Common.ModuleStatus] {
    if (not isAdmin(caller)) {
      Runtime.trap("Unauthorized: Only admins can view all module statuses");
    };
    ModuleBanLib.allStatuses(moduleBanState, allModuleIds());
  };
};
