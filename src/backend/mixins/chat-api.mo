// Public API surface for the friends-only 1:1 chat system.
//
// Exposes sendChatMessage, getChatMessages, and getChatThreads. Messaging is
// gated to accepted friends only — the mixin delegates friendship and ban
// checks to callbacks supplied by the composition root.

import Principal "mo:core/Principal";
import ChatLib "../lib/chat";
import ChatTypes "../types/chat";
import Common "../types/common";

mixin (
  chatState : ChatTypes.State,
  areFriends : (Principal, Principal) -> Bool,
  isBanned : Principal -> Bool,
  nameOf : Principal -> ?Text,
) {
  // Send a chat message from the caller to `toPrincipal`. Returns #sent,
  // #notFriends, or #banned.
  public shared ({ caller }) func sendChatMessage(toPrincipal : Principal, text : Text) : async ChatTypes.ChatResult {
    ChatLib.sendMessage(chatState, caller, toPrincipal, text, areFriends, isBanned);
  };

  // List all messages in the thread between the caller and `withPrincipal`.
  // Returns the empty list if they are not friends.
  public query ({ caller }) func getChatMessages(withPrincipal : Principal) : async [ChatTypes.Message] {
    ChatLib.listMessages(chatState, caller, withPrincipal, areFriends);
  };

  // List the caller's chat threads — one per friend with whom messages
  // exist — with friend name, last message text, and last message timestamp.
  public query ({ caller }) func getChatThreads() : async [ChatTypes.ChatThread] {
    ChatLib.listThreads(chatState, caller, nameOf);
  };
};
