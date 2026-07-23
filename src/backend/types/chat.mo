// Domain types for the friends-only 1:1 chat system.
//
// Chat messages persist in the backend canister. Messaging is gated to
// accepted friends only — non-friend users cannot send or read messages.
// Messages are keyed by a deterministic thread id derived from the two
// participants so both parties read the same thread.

import Map "mo:core/Map";
import Common "./common";

module {
  public type ChatThread = Common.ChatThread;
  public type ChatResult = Common.ChatResult;

  // A persisted chat message between two friends. `threadId` is a stable
  // ordering of the two participant Principals (smaller-toText first) so both
  // parties map to the same thread.
  public type Message = {
    id : Nat;
    threadId : Text;
    sender : Principal;
    recipient : Principal;
    content : Text;
    timestamp : Int;
  };

  // State slice for the chat domain.
  //
  // - messages: keyed by threadId (Text), value is the ordered list of
  //   messages in that thread (oldest first).
  // - nextMessageId: monotonic counter for message ids.
  public type State = {
    messages : Map.Map<Text, [Message]>;
    var nextMessageId : Nat;
  };
};
