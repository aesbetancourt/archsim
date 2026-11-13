export type GlossaryTerm = {
  id: string;
  term: string;
  category: string;
  definition: string;
  example: string;
  // Words that identify this term in a text. Lowercase.
  match: string[];
  // Title of the English Wikipedia article.
  wiki?: string;
};

export const glossaryCategories = [
  "Building blocks",
  "Communication",
  "Data",
  "Reliability",
  "Scale and speed",
  "Security",
];

export const glossary: GlossaryTerm[] = [
  // Building blocks
  {
    id: "component",
    term: "Component",
    category: "Building blocks",
    definition: "A part of the system with one clear job. A box in a diagram is a component.",
    example: "The 'Orders' box in the Lunch Rush answer.",
    match: [],
    wiki: "Component-based_software_engineering",
  },
  {
    id: "deployment",
    term: "Deployment",
    category: "Building blocks",
    definition:
      "A unit of software that is installed and started as a whole. Also the act of releasing a new version of it.",
    example: "A modular monolith is one deployment. Microservices are many deployments.",
    match: [],
    wiki: "Software_deployment",
  },
  {
    id: "service",
    term: "Service",
    category: "Building blocks",
    definition: "A program that runs on its own and that other programs call through the network.",
    example: "The 'Booking + payments' service in the Tutor Marketplace answer.",
    match: [],
    wiki: "Service_(systems_architecture)",
  },
  {
    id: "monolith",
    term: "Monolith",
    category: "Building blocks",
    definition: "A system that is built and released as one deployment.",
    example: "The Payment System answer is a monolith with four modules.",
    match: ["monolith"],
    wiki: "Monolithic_application",
  },
  {
    id: "module",
    term: "Module",
    category: "Building blocks",
    definition:
      "A part of one application that owns one business area. Modules call each other in memory, not through the network.",
    example: "Payments, ledger, payouts, and reconciliation in the Payment System answer.",
    match: [],
    wiki: "Modular_programming",
  },
  {
    id: "plug-in",
    term: "Plug-in",
    category: "Building blocks",
    definition:
      "A part that adds one feature to a core system through a fixed contract. You can add or remove it without a change to the core.",
    example: "The SMS plug-in in the Notification Service answer.",
    match: ["plug-in", "connector"],
    wiki: "Plug-in_(computing)",
  },
  {
    id: "api",
    term: "API",
    category: "Building blocks",
    definition: "The set of operations that a program offers to other programs, and the rules to call them.",
    example: "startRun(agentId, input) in the Agent Triggers question is an API.",
    match: [],
    wiki: "API",
  },
  {
    id: "api-gateway",
    term: "API gateway",
    category: "Building blocks",
    definition:
      "One entry point in front of several services. It checks who the caller is and sends each request to the correct service.",
    example: "The box between the apps and the four services in the Tutor Marketplace answer.",
    match: ["gateway"],
    wiki: "API_management",
  },
  {
    id: "stateless",
    term: "Stateless",
    category: "Building blocks",
    definition:
      "A program that keeps no data in its own memory between requests. All data is in a database or a cache. Any copy can then answer any request.",
    example: "The link application in the Link Shortener answer.",
    match: ["stateless", "keeps no state"],
    wiki: "Stateless_protocol",
  },
  {
    id: "external-provider",
    term: "External provider",
    category: "Building blocks",
    definition:
      "A system that another company operates and that the design uses but does not control. In the diagrams it is a dashed box.",
    example: "The card provider in the Payment System answer.",
    match: [],
  },

  // Communication
  {
    id: "synchronous",
    term: "Synchronous call",
    category: "Communication",
    definition: "A request where the caller waits for the answer before it continues. A solid arrow in the diagrams.",
    example: "The app asks the booking service to reserve a slot and waits for yes or no.",
    match: ["synchronous", "call that waits"],
    wiki: "Synchronization_(computer_science)",
  },
  {
    id: "asynchronous",
    term: "Asynchronous message",
    category: "Communication",
    definition:
      "A message where the sender does not wait for the result. The work occurs later, in the background. A dashed arrow in the diagrams.",
    example: "'Order ready' in the Lunch Rush answer.",
    match: ["asynchronous", "does not wait", "in the background"],
    wiki: "Asynchrony_(computer_programming)",
  },
  {
    id: "queue",
    term: "Message queue",
    category: "Communication",
    definition:
      "A store that holds messages in order until a worker is ready to read them. It lets a fast sender and a slow receiver work at different speeds.",
    example: "The job queue in the Video Streaming answer.",
    match: ["queue"],
    wiki: "Message_queue",
  },
  {
    id: "broker",
    term: "Message broker",
    category: "Communication",
    definition: "A system that receives messages from senders and delivers each one to all the parts that asked for it.",
    example: "The message broker in the Chat Messaging answer.",
    match: ["broker"],
    wiki: "Message_broker",
  },
  {
    id: "event",
    term: "Event",
    category: "Communication",
    definition: "A message that says something occurred, for example 'order placed'. The sender does not know who reacts.",
    example: "'Post created' in the News Feed answer.",
    match: [],
    wiki: "Event-driven_architecture",
  },
  {
    id: "publish-subscribe",
    term: "Publish and subscribe",
    category: "Communication",
    definition:
      "A pattern where senders publish messages to a topic and receivers subscribe to the topics they want. Senders and receivers do not know each other.",
    example: "Connection servers subscribe to new messages in the Chat Messaging answer.",
    match: ["publish", "subscribe"],
    wiki: "Publish–subscribe_pattern",
  },
  {
    id: "webhook",
    term: "Webhook",
    category: "Communication",
    definition: "A request that an external system sends to your system when something occurs there.",
    example: "Gmail tells the trigger system that an inbox changed.",
    match: ["webhook", "change notice"],
    wiki: "Webhook",
  },
  {
    id: "polling",
    term: "Polling",
    category: "Communication",
    definition: "To ask another system again and again, at a fixed interval, if something changed.",
    example: "The scheduler in the Agent Triggers answer checks each inbox every few minutes.",
    match: ["poll"],
    wiki: "Polling_(computer_science)",
  },
  {
    id: "open-connection",
    term: "Open connection (WebSocket)",
    category: "Communication",
    definition:
      "A connection between a device and a server that stays open, so the server can send data at any time without a request.",
    example: "Each online phone in the Chat Messaging answer.",
    match: ["open connection", "websocket"],
    wiki: "WebSocket",
  },
  {
    id: "push-notification",
    term: "Push notification",
    category: "Communication",
    definition: "A short message that Apple or Google delivers to a phone, also when the app is closed.",
    example: "The push notifier wakes the phone of an offline user in the Chat Messaging answer.",
    match: ["push notif", "wake the phone", "wake phone"],
    wiki: "Push_technology",
  },
  {
    id: "fan-out",
    term: "Fan-out",
    category: "Communication",
    definition: "One input that spreads to many outputs.",
    example: "One new post is added to the feed list of each follower in the News Feed answer.",
    match: ["fan-out"],
    wiki: "Fan-out_(software)",
  },

  // Data
  {
    id: "transaction",
    term: "Database transaction",
    category: "Data",
    definition: "A group of changes that the database applies as a whole. All of them occur, or none of them.",
    example: "'Change the payment state and add the ledger records' in the Payment System answer.",
    match: ["transaction"],
    wiki: "Database_transaction",
  },
  {
    id: "key-value-store",
    term: "Key-value store",
    category: "Data",
    definition: "A simple database that finds a record by one key. It is fast and easy to split across many servers.",
    example: "The link store in the Link Shortener answer: the key is the short code.",
    match: ["key-value"],
    wiki: "Key–value_database",
  },
  {
    id: "cache",
    term: "Cache",
    category: "Data",
    definition:
      "A fast copy of data that is read often, usually in memory. It can be a little old, and it can be built again from the real data.",
    example: "The feed cache in the News Feed answer.",
    match: ["cache"],
    wiki: "Cache_(computing)",
  },
  {
    id: "partition",
    term: "Partition (shard)",
    category: "Data",
    definition: "One part of a data set that is split across several servers, because it is too large for one.",
    example: "The link store in the Link Shortener answer holds 6 billion links on many servers.",
    match: ["partition", "shard", "split across"],
    wiki: "Shard_(database_architecture)",
  },
  {
    id: "replication",
    term: "Replication",
    category: "Data",
    definition: "To keep live copies of the same data on more than one server, so one failure does not lose it.",
    example: "A second seat unit holds a live copy in the Front Row answer.",
    match: ["replicat", "live copy"],
    wiki: "Replication_(computing)",
  },
  {
    id: "eventual-consistency",
    term: "Eventual consistency",
    category: "Data",
    definition: "Copies of data that agree only after a short delay. For a moment, two users can see different values.",
    example: "The search index is some minutes behind the calendars in the Tutor Marketplace answer.",
    match: ["eventual consistency", "after a delay", "after a short delay"],
    wiki: "Eventual_consistency",
  },
  {
    id: "index",
    term: "Search index",
    category: "Data",
    definition: "A copy of data that is arranged so a search is fast. It is updated after the original data changes.",
    example: "The search index in the Tutor Marketplace answer.",
    match: ["index"],
    wiki: "Search_engine_indexing",
  },
  {
    id: "object-storage",
    term: "Object storage",
    category: "Data",
    definition: "A store for large files, such as videos and images. Each file is found by a name.",
    example: "The source storage in the Video Streaming answer.",
    match: ["source storage", "video storage", "image storage", "object storage"],
    wiki: "Object_storage",
  },
  {
    id: "ledger",
    term: "Ledger",
    category: "Data",
    definition:
      "A list of money movements where records are only added and never changed. A balance is the sum of the records.",
    example: "The ledger module in the Payment System answer.",
    match: ["ledger"],
    wiki: "Ledger",
  },
  {
    id: "cursor",
    term: "Cursor",
    category: "Data",
    definition: "A saved position in a list of changes. It answers 'what is new since my last visit?'.",
    example: "The sync worker asks Gmail for all changes since its cursor in the Agent Triggers answer.",
    match: ["cursor"],
  },
  {
    id: "cdn",
    term: "CDN",
    category: "Data",
    definition:
      "Content delivery network. Servers around the world that keep copies of files near the users, so downloads are fast.",
    example: "Video segments in the Video Streaming answer.",
    match: ["cdn"],
    wiki: "Content_delivery_network",
  },

  // Reliability
  {
    id: "single-point-of-failure",
    term: "Single point of failure",
    category: "Reliability",
    definition: "One part whose failure stops the full system.",
    example: "The core in a microkernel design.",
    match: ["single point of failure", "one point of failure"],
    wiki: "Single_point_of_failure",
  },
  {
    id: "failover",
    term: "Failover",
    category: "Reliability",
    definition: "An automatic change to a spare part when the main part fails.",
    example: "The SMS plug-in changes to a second provider in the Notification Service answer.",
    match: ["failover", "second provider", "take over"],
    wiki: "Failover",
  },
  {
    id: "retry",
    term: "Retry with backoff",
    category: "Reliability",
    definition:
      "To try a failed operation again, with a longer wait before each new attempt, so a system in trouble is not overloaded.",
    example: "A plug-in repeats a failed send in the Notification Service answer.",
    match: ["retry", "retries", "repeats", "growing wait"],
    wiki: "Exponential_backoff",
  },
  {
    id: "idempotency-key",
    term: "Idempotency key",
    category: "Reliability",
    definition:
      "A unique value sent with a request. If the same request arrives again with the same key, the system returns the first result and does not do the work twice.",
    example: "The unique key on each payment in the Payment System answer.",
    match: ["idempoten", "unique key", "unique event key"],
    wiki: "Idempotence",
  },
  {
    id: "delivery-guarantee",
    term: "At-least-once delivery",
    category: "Reliability",
    definition:
      "A promise that each message arrives one or more times. Duplicates are possible, so the receiver must detect them. 'Exactly once' is this promise plus duplicate detection.",
    example: "'Exactly one run' in the Agent Triggers answer.",
    match: ["at-least-once", "exactly-once", "exactly one run", "duplicate"],
    wiki: "Reliability_(computer_networking)",
  },
  {
    id: "dead-letter",
    term: "Dead-letter list",
    category: "Reliability",
    definition:
      "A place for messages that failed after all attempts. A person can inspect them and send them again.",
    example: "An event for a deleted agent in the Agent Triggers answer.",
    match: ["dead-letter"],
    wiki: "Dead_letter_queue",
  },
  {
    id: "reconciliation",
    term: "Reconciliation",
    category: "Reliability",
    definition: "A regular comparison of two records of the same facts, to find differences.",
    example: "The shop compares its ledger with the report of the card provider each day.",
    match: ["reconcil", "daily comparison"],
    wiki: "Reconciliation_(accounting)",
  },
  {
    id: "rate-limit",
    term: "Rate limit",
    category: "Reliability",
    definition: "A limit on how many requests one caller can make in a period of time.",
    example: "Each product has a limit for urgent messages in the Notification Service answer.",
    match: ["rate limit", "send rate", "limit for each"],
    wiki: "Rate_limiting",
  },
  {
    id: "timeout",
    term: "Timeout",
    category: "Reliability",
    definition:
      "The longest time a caller waits for an answer. After a timeout, the caller does not know if the work was done.",
    example: "A request to the card provider in the Payment System answer.",
    match: ["time out", "timeout", "time limit"],
    wiki: "Timeout_(computing)",
  },
  {
    id: "canary",
    term: "Canary check",
    category: "Reliability",
    definition: "A small test that runs all the time in the real system and shows a failure before customers see it.",
    example: "A test inbox that gets an email every few minutes in the Agent Triggers answer.",
    match: ["canary"],
  },

  // Scale and speed
  {
    id: "load-balancer",
    term: "Load balancer",
    category: "Scale and speed",
    definition: "A part that spreads incoming requests across several identical copies of an application.",
    example: "The box in front of the link application in the Link Shortener answer.",
    match: ["load balancer"],
    wiki: "Load_balancing_(computing)",
  },
  {
    id: "horizontal-scaling",
    term: "Horizontal scaling",
    category: "Scale and speed",
    definition: "To handle more load with more copies of a program, not with a larger machine.",
    example: "More 'Convert' workers when the queue grows in the Video Streaming answer.",
    match: ["identical copies", "more copies", "workers added"],
    wiki: "Scalability",
  },
  {
    id: "latency",
    term: "Latency",
    category: "Scale and speed",
    definition: "The time between a request and its answer.",
    example: "'The feed opens in less than 200 milliseconds' in the News Feed question.",
    match: ["latency", "milliseconds"],
    wiki: "Latency_(engineering)",
  },
  {
    id: "throughput",
    term: "Throughput",
    category: "Scale and speed",
    definition: "The amount of work a system completes in a period of time.",
    example: "'4,000 redirects each second' in the Link Shortener question.",
    match: ["throughput", "each second"],
    wiki: "Network_throughput",
  },
  {
    id: "adaptive-streaming",
    term: "Adaptive streaming",
    category: "Scale and speed",
    definition:
      "A video is stored in several qualities and cut into short segments. The player selects the quality again for each segment.",
    example: "The Video Streaming answer.",
    match: ["adaptive streaming", "segments"],
    wiki: "Adaptive_bitrate_streaming",
  },
  {
    id: "transcoding",
    term: "Transcoding",
    category: "Scale and speed",
    definition: "To convert a video file to a different format or quality.",
    example: "The 'Convert' step in the Video Streaming answer.",
    match: ["transcod", "convert each chunk"],
    wiki: "Transcoding",
  },

  // Security
  {
    id: "oauth",
    term: "OAuth",
    category: "Security",
    definition:
      "A standard that lets a user give an application access to their account in another system, without sharing the password.",
    example: "A customer connects a Gmail inbox in the Agent Triggers answer.",
    match: ["oauth", "signs in to"],
    wiki: "OAuth",
  },
  {
    id: "access-token",
    term: "Access token",
    category: "Security",
    definition:
      "A secret value that proves an application has permission to act for a user. It expires, and a refresh token gets a new one.",
    example: "The tokens in the 'Connections + triggers' box in the Agent Triggers answer.",
    match: ["access token", "refresh token", "tokens"],
    wiki: "Access_token",
  },
  {
    id: "card-token",
    term: "Card token",
    category: "Security",
    definition:
      "A reference that a payment provider gives in place of a card number. It is useless outside that provider, so it is safe to store.",
    example: "The shop stores only a token in the Payment System answer.",
    match: ["a token, a reference", "only a token"],
    wiki: "Tokenization_(data_security)",
  },
  {
    id: "hash",
    term: "Hash",
    category: "Security",
    definition: "A short, fixed-size value calculated from any input. The same input always gives the same value.",
    example: "The alternative answer for the Link Shortener makes codes from a hash of the URL.",
    match: ["hash"],
    wiki: "Hash_function",
  },
];

export function wikiUrl(title: string): string {
  return `https://en.wikipedia.org/wiki/${encodeURIComponent(title)}`;
}

// Find the glossary terms that a text uses.
export function termsIn(text: string): GlossaryTerm[] {
  const lower = text.toLowerCase();
  return glossary.filter((entry) => entry.match.some((word) => lower.includes(word)));
}
