// Domain logic for the friends-only 1:1 chat system.
//
// Messages persist in backend canister state. Messaging is gated to accepted
// friends only — the lib checks friendship via the friends state slice
// (passed in as a callback) before recording a message.

import Map "mo:core/Map";
import Principal "mo:core/Principal";
import Text "mo:core/Text";
import Time "mo:core/Time";
import Types "../types/chat";

module {
  // Compute a stable thread id from two participant Principals: the smaller
  // toText() comes first so both parties map to the same thread.
  public func threadId(a : Principal, b : Principal) : Text {
    let aText = a.toText();
    let bText = b.toText();
    if (Text.compare(aText, bText) == #less) {
      aText.concat("|").concat(bText);
    } else {
      bText.concat("|").concat(aText);
    };
  };

  // Send a chat message from `caller` to `toPrincipal`. Returns #sent on
  // success, #notFriends if the two are not accepted friends, #banned if the
  // recipient's module access is restricted. `areFriends` and `isBanned`
  // callbacks supply the gating decisions.
  public func sendMessage(
    state : Types.State,
    caller : Principal,
    toPrincipal : Principal,
    text : Text,
    areFriends : (Principal, Principal) -> Bool,
    isBanned : Principal -> Bool,
  ) : Types.ChatResult {
    if (isBanned(toPrincipal)) {
      return #banned;
    };
    if (not areFriends(caller, toPrincipal)) {
      return #notFriends;
    };
    let tid = threadId(caller, toPrincipal);
    let id = state.nextMessageId;
    state.nextMessageId := id + 1;
    let message : Types.Message = {
      id;
      threadId = tid;
      sender = caller;
      recipient = toPrincipal;
      content = text;
      timestamp = Time.now();
    };
    let existing = switch (state.messages.get(tid)) {
      case (?msgs) { msgs };
      case null { [] };
    };
    state.messages.add(tid, existing.concat([message]));
    #sent;
  };

  // List all messages in the thread between `caller` and `withPrincipal`.
  // Returns the empty list if they are not friends.
  public func listMessages(
    state : Types.State,
    caller : Principal,
    withPrincipal : Principal,
    areFriends : (Principal, Principal) -> Bool,
  ) : [Types.Message] {
    if (not areFriends(caller, withPrincipal)) {
      return [];
    };
    let tid = threadId(caller, withPrincipal);
    switch (state.messages.get(tid)) {
      case (?msgs) { msgs };
      case null { [] };
    };
  };

  // List the caller's chat threads — one per friend with whom messages
  // exist — with the friend's display name, last message text, and last
  // message timestamp. `nameOf` resolves a Principal to a display name.
  public func listThreads(
    state : Types.State,
    caller : Principal,
    nameOf : Principal -> ?Text,
  ) : [Types.ChatThread] {
    let callerText = caller.toText();
    let threads = state.messages.entries().filter(func((tid, msgs) : (Text, [Types.Message])) : Bool {
      ignore tid;
      // Only threads where caller is a participant
      switch (msgs.find(func(m : Types.Message) : Bool {
        Principal.equal(m.sender, caller) or Principal.equal(m.recipient, caller);
      })) {
        case (?_) { true };
        case null { false };
      };
    });
    threads.map(
      func((tid, msgs) : (Text, [Types.Message])) : Types.ChatThread {
        // Derive the other party from the thread id (split on "|")
        let parts = tid.split(#char '|');
        let arr = parts.toArray();
        let otherText = if (arr.size() >= 2) {
          let first = arr[0];
          let second = arr[1];
          if (Text.equal(first, callerText)) { second } else { first };
        } else {
          callerText;
        };
        let otherPrincipal = Principal.fromText(otherText);
        // Last message is the last in the array (oldest first)
        let last = if (msgs.size() > 0) {
          msgs[msgs.size() - 1];
        } else {
          // Should not happen — threads always have at least one message
          {
            id = 0;
            threadId = tid;
            sender = caller;
            recipient = otherPrincipal;
            content = "";
            timestamp = 0;
          };
        };
        {
          friend = otherPrincipal;
          name = switch (nameOf(otherPrincipal)) {
            case (?n) { n };
            case null { "Unknown" };
          };
          lastMessage = last.content;
          lastMessageAt = last.timestamp;
        };
      },
    ).toArray();
  };
};
