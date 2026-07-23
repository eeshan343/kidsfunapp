// Cross-cutting types shared across the new domain modules (friends, chat,
// admin-tracking, module-ban, admin-rewards). These types are referenced by
// multiple lib/ and mixins/ modules, so they live in a single common module to
// avoid circular imports.

module {
  // A pending friend request between two registered users. `from` is the
  // sender, `to` is the recipient. `createdAt` is the request timestamp in
  // nanoseconds since epoch (Time.now()).
  public type FriendRequest = {
    from : Principal;
    to : Principal;
    createdAt : Int;
  };

  // An accepted friend, returned to the caller with display fields. `online`
  // is derived from the OnlineUser map (lastSeen within a freshness window).
  public type Friend = {
    principal : Principal;
    name : Text;
    online : Bool;
  };

  // A 1:1 chat thread summary for the caller. `friend` is the other party,
  // `lastMessage` is the most recent message text (truncated if long), and
  // `lastMessageAt` is its timestamp.
  public type ChatThread = {
    friend : Principal;
    name : Text;
    lastMessage : Text;
    lastMessageAt : Int;
  };

  // Admin-facing view of a registered user. `status` is a Text rendering of
  // the AdminUserStatus variant (#active/#restricted/#suspended/#banned) so
  // it serializes cleanly over Candid. `lastSeen` is the most recent
  // OnlineUser.lastSeen value, or 0 if never seen.
  public type AdminUserView = {
    principal : Principal;
    name : Text;
    status : Text;
    lastSeen : Int;
    avatarConfig : ?AvatarConfigRef;
  };

  // AvatarConfig is defined inline in main.mo; this reference type mirrors the
  // shared subset needed by AdminUserView so the admin-tracking module does
  // not depend on main.mo's internal type.
  public type AvatarConfigRef = {
    body : Text;
    head : Text;
    hair : Text;
    pants : Text;
    headwear : Text;
    shoes : Text;
  };

  // A platform-wide or per-user activity event for the admin feed. The
  // `eventType` is a free-form Text tag (e.g. "user_created", "game_played",
  // "avatar_edit", "spin", "friend_added"); `metadata` is a free-form Text
  // payload (e.g. a game id or a friend principal as text).
  public type ActivityEvent = {
    principal : Principal;
    eventType : Text;
    metadata : Text;
    timestamp : Int;
  };

  // Admin-facing status of a single app module: its id and whether it is
  // currently banned (hidden from regular users).
  public type ModuleStatus = {
    moduleId : Text;
    banned : Bool;
  };

  // Result variants for the friends domain.
  public type FriendResult = {
    #sent;
    #alreadyFriends;
    #alreadyRequested;
    #selfRequest;
    #notFound;
    #accepted;
    #alreadyAccepted;
    #declined;
    #removed;
  };

  // Result variants for the chat domain.
  public type ChatResult = {
    #sent;
    #notFriends;
    #banned;
  };

  // Result variants for the module-ban domain.
  public type ModuleBanResult = {
    #banned;
    #alreadyBanned;
    #unbanned;
    #notBanned;
  };

  // Result variants for the admin-rewards domain.
  public type RewardResult = {
    #sent;
    #notFound;
    #notAdmin;
  };
};
