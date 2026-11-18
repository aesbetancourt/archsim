## The question

Try the [Chat Messaging kata](/kata/chat-messaging) before you read this page.

"Design a chat application. Users send text messages to one person or to a small group. A message to an online user must arrive almost at once. A user who was offline must get all missed messages."

A chat system looks simple, but it joins three hard problems. The server must push data to a phone that did not ask for it. The system must keep one order of messages for all members. And it must never lose a message, on networks that drop the connection all the time. An architect who can explain these three problems can explain most real-time systems.

## Questions to ask first

Ask these questions before you draw. Each answer changes the design.

| Question                                              | Why it changes the design                                                      |
| ----------------------------------------------------- | ------------------------------------------------------------------------------ |
| One-to-one only, or groups too? How large is a group? | A group of 50 can copy each message to each member. A group of 50,000 cannot.  |
| Phone, web, or both? Can one user have many devices?  | Many devices need a read position for each device, not for each user.          |
| Text only, or also photos and files?                  | Media goes to object storage and a CDN, not to the message store.              |
| Do we keep the history forever?                       | This sets the size of the store and the choice of database.                    |
| Do we show "online" and "last seen"?                  | Presence is a second system with its own traffic, often larger than messages.  |
| Do we need "delivered" and "read" marks?              | Each mark is a small message back to the sender.                               |
| End-to-end encryption?                                | The server cannot read or search the text. Search and moderation change a lot. |

For this page, assume: one-to-one and groups of up to 100 members, phones and computers, text only, history kept forever, presence for contacts, and no end-to-end encryption.

Non-functional requirements:

- Latency: a message reaches an online receiver in less than about 500 ms.
- Durability: after the sender sees "sent", the message is never lost.
- Order: all members of a conversation see the messages in the same order.
- Availability: the service accepts messages when parts of it fail.

## Estimates

These numbers are rough and my own. See [Estimation](/learn/estimation) for the method.

- 20 million daily active users. Each sends 50 messages a day.
- Messages: 20 million × 50 = 1 billion a day. One day has about 86,400 seconds, so about 12,000 messages each second on average. Take a peak of three times the average: about 36,000 each second.
- Size: about 100 bytes of text, plus about 100 bytes of IDs and timestamps. That is 200 bytes a message, or 200 GB a day, or about 73 TB a year before replication. The store must grow without limit, so it must partition.
- Open connections: assume 25% of daily users are online at the peak. That is 5 million open connections. A well-tuned server can hold on the order of 100,000 idle connections. So about 50 chat servers, and more for headroom and failures.
- Groups: a message to a group of 100 becomes 100 deliveries. If 10% of messages go to groups with an average of 20 members, the deliveries are about three times the messages.

The estimates show two things. Write throughput is high but steady. The number of open connections, not the CPU, sets the number of chat servers.

## The first design

```diagram
{
  "nodes": [
    { "id": "phone", "label": "Phone or\ncomputer", "shape": "actor", "col": 0, "row": 0.6 },
    { "id": "api", "label": "API servers\n(stateless)", "shape": "box", "col": 1, "row": 0 },
    { "id": "disc", "label": "Service discovery", "shape": "box", "col": 2, "row": 0 },
    { "id": "chat", "label": "Chat servers\n(WebSocket)", "shape": "box", "col": 1, "row": 1.2 },
    { "id": "msg", "label": "Message service\n(IDs, order)", "shape": "box", "col": 2, "row": 1.2 },
    { "id": "kv", "label": "Message store\n(key-value)", "shape": "store", "col": 3, "row": 1.2 },
    { "id": "presence", "label": "Presence servers", "shape": "box", "col": 0, "row": 2.4 },
    { "id": "queue", "label": "Inbox queues\n(by user)", "shape": "pipe", "col": 2, "row": 2.4 },
    { "id": "push", "label": "Push notifier", "shape": "box", "col": 3, "row": 2.4 },
    { "id": "apns", "label": "Apple / Google\npush service", "shape": "external", "col": 3, "row": 3.6 }
  ],
  "edges": [
    { "from": "phone", "to": "api", "label": "login, profile" },
    { "from": "api", "to": "disc", "label": "pick a\nchat server" },
    { "from": "phone", "to": "chat", "label": "WebSocket", "both": true },
    { "from": "chat", "to": "msg", "label": "new message" },
    { "from": "msg", "to": "kv", "label": "write first" },
    { "from": "msg", "to": "queue", "label": "fan out", "async": true },
    { "from": "queue", "to": "chat", "label": "deliver", "async": true },
    { "from": "queue", "to": "push", "label": "receiver\noffline", "async": true },
    { "from": "push", "to": "apns" },
    { "from": "phone", "to": "presence", "label": "heartbeat" }
  ]
}
```

- **API servers** handle all work that is a normal request and answer: sign-up, login, profile, contact lists, group settings. They keep no state, so you add copies behind a load balancer.
- **Service discovery** picks a chat server for a device at login. It knows which chat servers are healthy and how full each one is. ZooKeeper or a similar registry can hold this list.
- **Chat servers** keep one long-lived connection to each online device. They receive messages from senders and push messages to receivers.
- **The message service** gives each message its ID and its place in the conversation. It writes the message to the store before anything else.
- **Inbox queues** hold each stored message until it is delivered to each receiver. You can make one queue for each user, or one topic partitioned by user.
- **The message store** keeps every message. A key-value store fits, as the deep dive explains.
- **Presence servers** keep the online state of each user from heartbeats.
- **The push notifier** sends a notification through the Apple and Google push services to a phone that is not connected. See [Design a notification system](/learn/notification-system).

## Deep dives

### The connection: polling, long polling, or WebSocket

Normal HTTP starts from the client. The client asks, and the server answers. But a chat server must send a message to a receiver that did not ask. There are three ways to do this.

| Method       | How it works                                                                                        | Cost                                                                                                                        |
| ------------ | --------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------- |
| Polling      | The client asks "anything new?" every few seconds.                                                  | Most answers are "no". Short gaps waste server work. Long gaps make messages late.                                          |
| Long polling | The client asks, and the server holds the request open until a message comes or a timeout passes.   | Fewer empty answers. But each message needs a new request, and the server must know which server holds the waiting request. |
| WebSocket    | The client opens one connection that starts as HTTP and upgrades. Then both sides send at any time. | One connection for each online device, kept for hours. The server is now stateful.                                          |

**The choice:** WebSocket, for both send and receive. It gives the lowest latency and the least overhead for each message. It uses ports 80 and 443, so most firewalls let it pass. Keep long polling as a fallback for networks that block WebSocket.

A phone connection breaks often: the phone changes from Wi-Fi to mobile data, or goes into a tunnel. The client must reconnect with backoff and a random part. If all clients of a failed server reconnect in the same second, they overload the next servers. This is a "thundering herd", and the random part spreads it.

### Stateless and stateful servers

Most of the system is stateless: any API server can answer any request. The chat servers are different. A chat server holds open connections, so it is the only server that can push to those devices. This state has three consequences:

1. **Placement.** At login, service discovery picks a chat server near the user and not too full. The client then connects to that server directly.
2. **Routing.** To deliver a message, the system must know which chat server holds the receiver's connection. Keep a session registry: user and device to chat server. Store it in a fast key-value store such as Redis, with an expiry that heartbeats renew.
3. **Deploys and failures.** When a chat server stops, all its connections break. The clients reconnect to other servers. To deploy, drain a server slowly: stop new connections, then close the old ones in small batches.

Keep the chat servers thin. They hold connections and forward messages. They do not own the order of messages or the store. Then a lost chat server loses no data, only connections.

### The message flow

Follow one message from Ana to Ben. Each message carries a **client message ID**: a random ID that the sender's device makes before the first send.

1. Ana's phone sends the message on its WebSocket to chat server 1.
2. Chat server 1 forwards the message to the message service. The service gives it the next sequence number of the conversation.
3. The message service writes the message to the store. Only after a durable write does it send "sent" back to Ana. If the write fails or the answer is lost, Ana's phone sends again with the same client message ID, and the store drops the repeat. This is an [idempotent](/learn/distributed-transactions#idempotency) write.
4. The message goes into Ben's inbox queue.
5. The delivery step looks up Ben's devices in the session registry. If Ben is online on chat server 2, server 2 pushes the message to his phone.
6. Ben's phone sends an acknowledgement. The system marks the message "delivered" and sends this mark back to Ana.
7. If Ben has no connection, the push notifier sends a push notification instead.

The store is the truth. Delivery to an online device is only the fast path. If a push fails or a connection drops, the device gets the message at the next sync.

**Small groups.** For a group of up to about 100 members, copy each message into the inbox queue of each member (fan-out on write). Each receiver then reads only one inbox, which is simple and fast. For 100 members, one message becomes 100 inbox writes, which is acceptable. For very large groups or channels, this cost is too high. Store the message once in the conversation, and let each member read the conversation when they open it (fan-out on read). This is the same choice as in [Design a news feed](/learn/news-feed).

### Message IDs, order, and storage

**Order.** Phone clocks are wrong by seconds or more, so the sender's time cannot set the order. Two messages from two members can also arrive at two servers in the same millisecond. The order must come from the server.

Two options:

- **A global ID that grows with time**, such as a Snowflake-style ID: time, machine number, and a counter. It sorts by time across the whole system. But two IDs from two machines in the same millisecond are not in a strict order. See [Unique IDs](/learn/unique-ids).
- **A sequence number for each conversation.** The conversation's owner gives the next number: 1, 2, 3. It is exact and easy to sort. It needs one writer for each conversation, which you get if you partition by conversation ID.

**The choice:** a sequence number for each conversation, plus a unique message ID for deduplication. Order only matters inside one conversation, so you do not need a global order. A global order is expensive, as DDIA explains in the part on ordering and consensus.

**Storage.** Look at the access pattern:

- Writes are high and steady. Reads are mostly of recent messages in one conversation.
- Nearly all reads ask for "messages in conversation C after sequence N".
- Data is never updated, only added. Old messages are read rarely.
- There are no joins between messages.

A wide-column key-value store, such as Cassandra or HBase, fits this pattern. Use the conversation ID as the partition key and the sequence number as the sort key. Then "the next 50 messages after N" is one read from one partition. These stores use an LSM-tree, which is good at a high rate of writes (see [Storage engines](/learn/storage-engines)). They also scale out by adding nodes, with [consistent hashing](/learn/consistent-hashing) to place partitions.

Keep users, contacts, and groups in a relational database. That data is small, changes often, and needs constraints. See [Design a key-value store](/learn/key-value-store) for how such a store works inside.

One risk: a very busy group puts all its writes on one partition. For groups of 100, this is acceptable. For large channels, add a time bucket to the partition key, for example conversation ID plus week.

### Many devices, presence, and offline users

**Sync with a cursor for each device.** Ana uses a phone and a laptop. Each device keeps its own cursor: the highest sequence number it has, for each conversation. When a device connects, it sends its cursors. The server returns all messages after each cursor. Then the device moves its cursor forward.

Because of the cursor, the design does not need to know which device "missed" what. A device that was off for a week asks for everything after its cursor. A message that the fast path pushed twice is ignored, because its sequence number is not above the cursor. The "read" mark works the same way: a read cursor for each user and conversation.

**Online presence.** A device connected to a chat server is online. But a broken connection often does not close cleanly, so the server cannot rely on a "close" event. Use heartbeats instead:

1. Each online device sends a small heartbeat every few seconds, for example every 5 seconds.
2. The presence server records the time of the last heartbeat.
3. If no heartbeat comes for a longer period, for example 30 seconds, the user is offline.

The grace period stops the state from flickering. A phone that goes into a tunnel for 10 seconds stays "online".

Presence changes must reach the contacts who care. Publish each change to a channel for the user, and let online contacts subscribe. This is cheap for a user with 100 contacts. For a large group, do not push presence to all members. Fetch it only when a member opens the member list. Presence traffic can be larger than message traffic, so ask if the product needs it in real time.

**Offline users.** When a receiver has no open connection, the push notifier sends a notification through the platform push service. The notification is a hint, not the message itself. Platform push services can delay, merge, or drop notifications. When the user opens the app, the device syncs from its cursors and gets the real messages.

## Trade-offs and alternatives

| Decision            | This design                    | Alternative                         | When the alternative wins                                         |
| ------------------- | ------------------------------ | ----------------------------------- | ----------------------------------------------------------------- |
| Connection          | WebSocket                      | Long polling                        | Networks that block WebSocket, or very few messages for each user |
| Group delivery      | Fan-out on write to inboxes    | Fan-out on read from a conversation | Groups of thousands, or broadcast channels                        |
| Order               | Sequence for each conversation | Global time-ordered ID              | You need one order across conversations, for example for search   |
| Message store       | Wide-column key-value store    | Relational database                 | Small scale, or a team with no experience of the key-value store  |
| Server-side history | Store all text on the server   | End-to-end encryption, device store | Privacy is the main requirement                                   |

The main trade-off is fast delivery against simple recovery. The design accepts that the fast path can push a message twice or not at all. It makes the stored conversation and the device cursors the truth. This choice makes every failure into a normal sync.

Failure modes to name:

- **A chat server crashes.** Its connections break, the clients reconnect elsewhere, and the cursors fill the gap.
- **The session registry is wrong** after a crash. A delivery goes to a server that no longer holds the user. The heartbeat expiry cleans the registry, and the sync covers the lost push.
- **A hot partition** from one very busy group. Bucket the partition key by time.
- **A reconnect storm** after a deploy or an outage. Use backoff with a random part, and drain servers slowly.

## What interviewers probe

**"How does server A send a message to a user on server B?"**

- Keep a session registry from user and device to chat server.
- Route through a queue or a pub/sub topic, not through direct calls between all servers.
- Say what occurs when the registry is stale: the push fails, and the sync delivers later.

**"How do you make sure that a message is never lost?"**

- Confirm "sent" only after a durable, replicated write.
- The client retries until it gets the confirmation, with the same client message ID.
- The store deduplicates by that ID. At-least-once delivery plus idempotent receivers gives the effect of exactly once.

**"How do you keep the same order for all members?"**

- Do not use the client clock.
- Give a sequence number for each conversation from a single writer, with the conversation as the partition key.
- Explain why a global order is not necessary and costs more.

**"How does the system know a user is online?"**

- Heartbeats with a timeout, not connection events.
- A grace period stops flicker.
- Fan-out of presence is limited for large groups.

**"What changes for a group of 100,000 members?"**

- Fan-out on read instead of fan-out on write.
- No real-time presence for all members.
- A time bucket in the partition key, and a separate path for broadcast channels if the product has them.

## Go deeper

- System Design Interview (Alex Xu), Volume 1, the chapter on a chat system: the base design with stateless and stateful servers, service discovery, and message sync.
- Designing Data-Intensive Applications (Martin Kleppmann), the part on partitioning: how a partition key spreads load, and how hot keys break it.
- DDIA, the part on ordering and consensus: why a total order is expensive, and what sequence numbers give you.
- DDIA, the part on stream processing: logs and consumers, which match the inbox queues here.

## Further reading

- [WebSocket](https://en.wikipedia.org/wiki/WebSocket) and [Push technology](https://en.wikipedia.org/wiki/Push_technology) on Wikipedia
- [Messaging](/learn/messaging) and [Synchronous and asynchronous calls](/learn/sync-async) in this wiki
- [Unique IDs](/learn/unique-ids) and [Design a notification system](/learn/notification-system)
