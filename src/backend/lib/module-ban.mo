// Domain logic for the admin module-ban/unban domain.
//
// Maintains a set of banned module ids. Banned modules are hidden from
// regular users; admins can still preview them.

import Set "mo:core/Set";
import Text "mo:core/Text";
import Types "../types/module-ban";

module {
  // Ban a module by id. Returns #banned on success, #alreadyBanned if it was
  // already banned.
  public func ban(state : Types.State, moduleId : Text) : Types.ModuleBanResult {
    if (state.bannedModules.contains(moduleId)) {
      return #alreadyBanned;
    };
    state.bannedModules.add(moduleId);
    #banned;
  };

  // Unban a module by id. Returns #unbanned on success, #notBanned if it was
  // not banned.
  public func unban(state : Types.State, moduleId : Text) : Types.ModuleBanResult {
    if (not state.bannedModules.contains(moduleId)) {
      return #notBanned;
    };
    state.bannedModules.remove(moduleId);
    #unbanned;
  };

  // List all currently banned module ids (public — used by the frontend to
  // hide banned modules from regular users).
  public func bannedModules(state : Types.State) : [Text] {
    state.bannedModules.toArray();
  };

  // List the banned status of every module id in `allModuleIds` (admin only).
  public func allStatuses(state : Types.State, allModuleIds : [Text]) : [Types.ModuleStatus] {
    allModuleIds.map(
      func(id : Text) : Types.ModuleStatus = {
        moduleId = id;
        banned = state.bannedModules.contains(id);
      },
    );
  };

  // Returns true iff `moduleId` is currently banned.
  public func isBanned(state : Types.State, moduleId : Text) : Bool {
    state.bannedModules.contains(moduleId);
  };
};
