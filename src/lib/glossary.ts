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
  // Page in the Learn area that explains the term.
  learn?: string;
};

export const glossaryCategories = [
  "Architecture practice",
  "Building blocks",
  "Application design",
  "Communication",
  "Data",
  "Reliability",
  "Scale and speed",
  "Operations",
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
    learn: "deployment",
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
    learn: "boundaries",
    term: "Service",
    category: "Building blocks",
    definition: "A program that runs on its own and that other programs call through the network.",
    example: "The 'Booking + payments' service in the Tutor Marketplace answer.",
    match: [],
    wiki: "Service_(systems_architecture)",
  },
  {
    id: "monolith",
    learn: "distributed",
    term: "Monolith",
    category: "Building blocks",
    definition: "A system that is built and released as one deployment.",
    example: "The Payment System answer is a monolith with four modules.",
    match: ["monolith"],
    wiki: "Monolithic_application",
  },
  {
    id: "module",
    learn: "modularity",
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
    learn: "microkernel",
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
    learn: "api-design",
    term: "API",
    category: "Building blocks",
    definition:
      "The set of operations that a program offers to other programs, and the rules to call them.",
    example: "startRun(agentId, input) in the Agent Triggers question is an API.",
    match: [],
    wiki: "API",
  },
  {
    id: "api-gateway",
    learn: "api-design",
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
    learn: "scalability",
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
    learn: "sync-async",
    term: "Synchronous call",
    category: "Communication",
    definition:
      "A request where the caller waits for the answer before it continues. A solid arrow in the diagrams.",
    example: "The app asks the booking service to reserve a slot and waits for yes or no.",
    match: ["synchronous", "call that waits"],
    wiki: "Synchronization_(computer_science)",
  },
  {
    id: "asynchronous",
    learn: "sync-async",
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
    learn: "messaging",
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
    learn: "messaging",
    term: "Message broker",
    category: "Communication",
    definition:
      "A system that receives messages from senders and delivers each one to all the parts that asked for it.",
    example: "The message broker in the Chat Messaging answer.",
    match: ["broker"],
    wiki: "Message_broker",
  },
  {
    id: "event",
    learn: "messaging",
    term: "Event",
    category: "Communication",
    definition:
      "A message that says something occurred, for example 'order placed'. The sender does not know who reacts.",
    example: "'Post created' in the News Feed answer.",
    match: [],
    wiki: "Event-driven_architecture",
  },
  {
    id: "publish-subscribe",
    learn: "messaging",
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
    definition:
      "A request that an external system sends to your system when something occurs there.",
    example: "Gmail tells the trigger system that an inbox changed.",
    match: ["webhook", "change notice"],
    wiki: "Webhook",
  },
  {
    id: "polling",
    learn: "sync-async",
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
    definition:
      "A short message that Apple or Google delivers to a phone, also when the app is closed.",
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
    learn: "consistency",
    term: "Database transaction",
    category: "Data",
    definition:
      "A group of changes that the database applies as a whole. All of them occur, or none of them.",
    example: "'Change the payment state and add the ledger records' in the Payment System answer.",
    match: ["transaction"],
    wiki: "Database_transaction",
  },
  {
    id: "key-value-store",
    learn: "data-stores",
    term: "Key-value store",
    category: "Data",
    definition:
      "A simple database that finds a record by one key. It is fast and easy to split across many servers.",
    example: "The link store in the Link Shortener answer: the key is the short code.",
    match: ["key-value"],
    wiki: "Key–value_database",
  },
  {
    id: "cache",
    learn: "caching",
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
    learn: "scaling-data",
    term: "Partition (shard)",
    category: "Data",
    definition:
      "One part of a data set that is split across several servers, because it is too large for one.",
    example: "The link store in the Link Shortener answer holds 6 billion links on many servers.",
    match: ["partition", "shard", "split across"],
    wiki: "Shard_(database_architecture)",
  },
  {
    id: "replication",
    learn: "scaling-data",
    term: "Replication",
    category: "Data",
    definition:
      "To keep live copies of the same data on more than one server, so one failure does not lose it.",
    example: "A second seat unit holds a live copy in the Front Row answer.",
    match: ["replicat", "live copy"],
    wiki: "Replication_(computing)",
  },
  {
    id: "eventual-consistency",
    learn: "consistency",
    term: "Eventual consistency",
    category: "Data",
    definition:
      "Copies of data that agree only after a short delay. For a moment, two users can see different values.",
    example:
      "The search index is some minutes behind the calendars in the Tutor Marketplace answer.",
    match: ["eventual consistency", "after a delay", "after a short delay"],
    wiki: "Eventual_consistency",
  },
  {
    id: "index",
    learn: "data-stores",
    term: "Search index",
    category: "Data",
    definition:
      "A copy of data that is arranged so a search is fast. It is updated after the original data changes.",
    example: "The search index in the Tutor Marketplace answer.",
    match: ["index"],
    wiki: "Search_engine_indexing",
  },
  {
    id: "object-storage",
    learn: "data-stores",
    term: "Object storage",
    category: "Data",
    definition: "A store for large files, such as videos and images. Each file is found by a name.",
    example: "The source storage in the Video Streaming answer.",
    match: ["source storage", "video storage", "image storage", "object storage"],
    wiki: "Object_storage",
  },
  {
    id: "ledger",
    learn: "cqrs-event-sourcing",
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
    definition:
      "A saved position in a list of changes. It answers 'what is new since my last visit?'.",
    example:
      "The sync worker asks Gmail for all changes since its cursor in the Agent Triggers answer.",
    match: ["cursor"],
  },
  {
    id: "cdn",
    learn: "caching",
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
    learn: "resilience",
    term: "Single point of failure",
    category: "Reliability",
    definition: "One part whose failure stops the full system.",
    example: "The core in a microkernel design.",
    match: ["single point of failure", "one point of failure"],
    wiki: "Single_point_of_failure",
  },
  {
    id: "failover",
    learn: "scaling-data",
    term: "Failover",
    category: "Reliability",
    definition: "An automatic change to a spare part when the main part fails.",
    example: "The SMS plug-in changes to a second provider in the Notification Service answer.",
    match: ["failover", "second provider", "take over"],
    wiki: "Failover",
  },
  {
    id: "retry",
    learn: "resilience",
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
    learn: "distributed-transactions",
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
    learn: "messaging",
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
    learn: "messaging",
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
    learn: "distributed-transactions",
    term: "Reconciliation",
    category: "Reliability",
    definition: "A regular comparison of two records of the same facts, to find differences.",
    example: "The shop compares its ledger with the report of the card provider each day.",
    match: ["reconcil", "daily comparison"],
    wiki: "Reconciliation_(accounting)",
  },
  {
    id: "rate-limit",
    learn: "resilience",
    term: "Rate limit",
    category: "Reliability",
    definition: "A limit on how many requests one caller can make in a period of time.",
    example: "Each product has a limit for urgent messages in the Notification Service answer.",
    match: ["rate limit", "send rate", "limit for each"],
    wiki: "Rate_limiting",
  },
  {
    id: "timeout",
    learn: "resilience",
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
    learn: "observability",
    term: "Canary check",
    category: "Reliability",
    definition:
      "A small test that runs all the time in the real system and shows a failure before customers see it.",
    example: "A test inbox that gets an email every few minutes in the Agent Triggers answer.",
    match: ["canary"],
  },

  // Scale and speed
  {
    id: "load-balancer",
    learn: "scalability",
    term: "Load balancer",
    category: "Scale and speed",
    definition:
      "A part that spreads incoming requests across several identical copies of an application.",
    example: "The box in front of the link application in the Link Shortener answer.",
    match: ["load balancer"],
    wiki: "Load_balancing_(computing)",
  },
  {
    id: "horizontal-scaling",
    learn: "scalability",
    term: "Horizontal scaling",
    category: "Scale and speed",
    definition: "To handle more load with more copies of a program, not with a larger machine.",
    example: "More 'Convert' workers when the queue grows in the Video Streaming answer.",
    match: ["identical copies", "more copies", "workers added"],
    wiki: "Scalability",
  },
  {
    id: "latency",
    learn: "scalability",
    term: "Latency",
    category: "Scale and speed",
    definition: "The time between a request and its answer.",
    example: "'The feed opens in less than 200 milliseconds' in the News Feed question.",
    match: ["latency", "milliseconds"],
    wiki: "Latency_(engineering)",
  },
  {
    id: "throughput",
    learn: "estimation",
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
    learn: "security",
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
    learn: "security",
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
    definition:
      "A short, fixed-size value calculated from any input. The same input always gives the same value.",
    example: "The alternative answer for the Link Shortener makes codes from a hash of the URL.",
    match: ["hash"],
    wiki: "Hash_function",
  },

  // Terms from the Learn pages
  {
    id: "architecture-characteristic",
    term: "Architecture characteristic",
    category: "Architecture practice",
    definition:
      "A quality that a system must have, such as availability. It is not a feature. Also named non-functional requirement or quality attribute.",
    example: "'Payment works during the lunch peak' is elasticity.",
    match: [],
    wiki: "Non-functional_requirement",
    learn: "characteristics",
  },
  {
    id: "architecture-style",
    term: "Architecture style",
    category: "Architecture practice",
    definition:
      "The overall shape of a system: how many deployable parts it has and how they talk.",
    example: "Microservices, event-driven, and modular monolith are styles.",
    match: [],
    wiki: "Architectural_pattern",
    learn: "styles",
  },
  {
    id: "trade-off",
    term: "Trade-off",
    category: "Architecture practice",
    definition: "A choice where a gain in one quality costs something in another.",
    example: "A cache gives speed and makes data old.",
    match: [],
    wiki: "Trade-off",
    learn: "trade-offs",
  },
  {
    id: "adr",
    term: "Architecture decision record (ADR)",
    category: "Architecture practice",
    definition: "A short document with one decision, its context, and its consequences.",
    example: "'7. Use a queue between orders and notifications.'",
    match: [],
    wiki: "Architectural_decision",
    learn: "decision-records",
  },
  {
    id: "cohesion",
    term: "Cohesion",
    category: "Architecture practice",
    definition: "How strongly the things in one part belong together. High is good.",
    example: "A part that only calculates prices has high cohesion.",
    match: [],
    wiki: "Cohesion_(computer_science)",
    learn: "modularity",
  },
  {
    id: "coupling",
    term: "Coupling",
    category: "Architecture practice",
    definition: "How much one part depends on another. Low is good.",
    example: "Two services that write the same table are strongly coupled.",
    match: [],
    wiki: "Coupling_(computer_programming)",
    learn: "modularity",
  },
  {
    id: "bounded-context",
    term: "Bounded context",
    category: "Architecture practice",
    definition:
      "An area of the business where each word has one exact meaning. A natural boundary for a module or a service.",
    example:
      "'Product' means a box with a weight in the warehouse and a page with a price in the shop.",
    match: [],
    wiki: "Domain-driven_design",
    learn: "bounded-contexts",
  },
  {
    id: "distributed-monolith",
    term: "Distributed monolith",
    category: "Architecture practice",
    definition: "Many deployments that are so coupled that they must change and release together.",
    example: "Five services that share tables and call each other in a chain.",
    match: [],
    learn: "modularity",
  },
  {
    id: "fallacies",
    term: "Fallacies of distributed computing",
    category: "Architecture practice",
    definition: "A list of wrong assumptions about networks, such as 'the network is reliable'.",
    example: "Code that calls another service with no timeout assumes this.",
    match: [],
    wiki: "Fallacies_of_distributed_computing",
    learn: "distributed",
  },
  {
    id: "conways-law",
    term: "Conway's law",
    category: "Architecture practice",
    definition: "Organizations build systems that copy their own communication structure.",
    example: "Three teams produce a system with three main parts.",
    match: [],
    wiki: "Conway's_law",
    learn: "teams",
  },
  {
    id: "c4-model",
    term: "C4 model",
    category: "Architecture practice",
    definition:
      "A way to draw software at four levels of zoom: context, container, component, code.",
    example: "The diagrams in the worked examples are container diagrams.",
    match: [],
    wiki: "C4_model",
    learn: "diagrams",
  },
  {
    id: "sequence-diagram",
    term: "Sequence diagram",
    category: "Architecture practice",
    definition: "A diagram that shows the messages between parts in time order, for one action.",
    example: "What occurs, step by step, when a payment times out.",
    match: [],
    wiki: "Sequence_diagram",
    learn: "diagrams",
  },
  {
    id: "strangler-fig",
    term: "Strangler fig",
    category: "Architecture practice",
    definition:
      "A way to replace a system in steps: new functions take over requests one at a time, until the old system is empty.",
    example:
      "A layer in front sends 'search' to the new system and all other requests to the old one.",
    match: [],
    wiki: "Strangler_fig_pattern",
    learn: "evolution",
  },
  {
    id: "fitness-function",
    term: "Fitness function",
    category: "Architecture practice",
    definition: "An automatic test of an architecture rule.",
    example: "The build fails if a module reads the tables of another module.",
    match: [],
    learn: "measuring-characteristics",
  },
  {
    id: "technical-debt",
    term: "Technical debt",
    category: "Architecture practice",
    definition: "A shortcut that saves time now and costs more work later.",
    example: "A hard-coded list of countries that each new market must change.",
    match: [],
    wiki: "Technical_debt",
    learn: "evolution",
  },
  {
    id: "estimation",
    term: "Back-of-the-envelope estimate",
    category: "Architecture practice",
    definition: "A quick calculation with rounded numbers, to find the order of magnitude.",
    example: "1 million actions each day is about 12 each second.",
    match: [],
    wiki: "Back-of-the-envelope_calculation",
    learn: "estimation",
  },
  {
    id: "application-architecture",
    term: "Application architecture",
    category: "Application design",
    definition:
      "How the code inside one deployable part is organized. It is a different level from system architecture.",
    example: "Hexagonal structure inside one microservice.",
    match: [],
    learn: "code-architecture",
  },
  {
    id: "hexagonal-architecture",
    term: "Hexagonal architecture",
    category: "Application design",
    definition:
      "A code structure where the business logic talks to the outside only through ports, and adapters connect the ports to technology. Also named ports and adapters.",
    example: "The core defines OrderRepository. A PostgreSQL adapter implements it.",
    match: [],
    wiki: "Hexagonal_architecture_(software)",
    learn: "hexagonal",
  },
  {
    id: "port",
    term: "Port",
    category: "Application design",
    definition:
      "An interface at the edge of the application core. An input port offers a use case. An output port states what the core needs.",
    example: "OrderRepository, PaymentGateway.",
    match: [],
    learn: "hexagonal",
  },
  {
    id: "adapter",
    term: "Adapter",
    category: "Application design",
    definition: "Code that connects a port to a real technology.",
    example: "An HTTP controller (driving), a database repository (driven).",
    match: [],
    wiki: "Adapter_pattern",
    learn: "hexagonal",
  },
  {
    id: "dependency-inversion",
    term: "Dependency inversion",
    category: "Application design",
    definition:
      "Business code defines the interface it needs, and technical code implements it. The technical code then depends on the business code.",
    example: "The database adapter imports the core. The core does not import the adapter.",
    match: [],
    wiki: "Dependency_inversion_principle",
    learn: "code-architecture",
  },
  {
    id: "clean-architecture",
    term: "Clean architecture",
    category: "Application design",
    definition:
      "Rings around the business rules: entities, use cases, interface adapters, frameworks. Dependencies point to the center.",
    example: "A use case receives plain data, not a web request.",
    match: [],
    learn: "clean-onion",
  },
  {
    id: "onion-architecture",
    term: "Onion architecture",
    category: "Application design",
    definition:
      "The same idea as clean architecture with different names for the rings: domain model in the center, infrastructure outside.",
    example: "Infrastructure implements interfaces that the inner rings define.",
    match: [],
    learn: "clean-onion",
  },
  {
    id: "dependency-injection",
    term: "Dependency injection",
    category: "Application design",
    definition:
      "A part receives the parts it needs from outside, usually as constructor or function parameters, instead of creating them itself.",
    example:
      "createRenderService({ compiler, clock, slots }) receives a compiler. It does not call new TypstCompiler().",
    match: ["dependency injection"],
    wiki: "Dependency_injection",
    learn: "dependencies",
  },
  {
    id: "composition-root",
    term: "Composition root",
    category: "Application design",
    definition:
      "The one place, usually at startup, that creates the real adapters and connects them to the core. It has no business logic.",
    example:
      "main.ts creates the Typst adapter, the clock, and the render service, and passes them to the HTTP app.",
    match: ["composition root"],
    learn: "dependencies",
  },
  {
    id: "inversion-of-control",
    term: "Inversion of control",
    category: "Application design",
    definition:
      "A framework or a caller controls the flow and calls your code. Dependency injection is one form of it.",
    example: "A web framework calls your route handler when a request arrives.",
    match: ["inversion of control"],
    wiki: "Inversion_of_control",
    learn: "dependencies",
  },
  {
    id: "program-to-an-interface",
    term: "Program to an interface",
    category: "Application design",
    definition:
      "Depend on a contract, not on a concrete class. Then a test or a new implementation can replace the part.",
    example:
      "The service depends on the TypstCompiler interface, not on the TypstCliCompiler class.",
    match: ["program to an interface"],
    learn: "dependencies",
  },
  {
    id: "driving-driven",
    term: "Driving and driven side",
    category: "Application design",
    definition:
      "The driving side calls the application, for example an HTTP controller. The driven side is called by the application, for example a database. Also named primary and secondary, or in and out.",
    example: "adapter/in/http drives the core. adapter/out/typst is driven by it.",
    match: ["driving adapter", "driven adapter"],
    learn: "hexagonal",
  },
  {
    id: "factory-pattern",
    term: "Factory",
    category: "Application design",
    definition:
      "A function or object whose job is to create another object. The caller does not need to know how it is built.",
    example: "createRenderService(deps) returns a ready service.",
    match: [],
    wiki: "Factory_method_pattern",
    learn: "dependencies",
  },
  {
    id: "strategy-pattern",
    term: "Strategy",
    category: "Application design",
    definition:
      "Behind one interface, several interchangeable behaviors. The caller selects one without changing its own code.",
    example: "A real clock in production, a fixed clock in tests.",
    match: [],
    wiki: "Strategy_pattern",
    learn: "dependencies",
  },
  {
    id: "errors-as-values",
    term: "Errors as values",
    category: "Application design",
    definition:
      "Expected failures are returned as data, such as { ok: false, error }, and not thrown. The type shows every possible error. Exceptions stay for real faults.",
    example: "A template that does not compile returns compile_failed. A missing binary throws.",
    match: ["errors as values", "result type"],
    wiki: "Result_type",
  },
  {
    id: "test-double",
    term: "Test double",
    category: "Application design",
    definition:
      "Any object that replaces a real dependency in a test. Stubs, fakes, mocks, and spies are kinds of test doubles.",
    example: "A fake compiler that returns a small PDF in memory.",
    match: ["test double"],
    wiki: "Test_double",
    learn: "dependencies",
  },
  {
    id: "stub",
    term: "Stub",
    category: "Application design",
    definition: "A test double that returns fixed answers and has no logic.",
    example: "A clock that always returns 09:00.",
    match: [],
    wiki: "Test_stub",
    learn: "dependencies",
  },
  {
    id: "fake",
    term: "Fake",
    category: "Application design",
    definition: "A test double with a working but simplified implementation.",
    example: "A repository that keeps orders in a list in memory.",
    match: [],
    learn: "dependencies",
  },
  {
    id: "mock",
    term: "Mock",
    category: "Application design",
    definition:
      "A test double that records the calls, so the test can check how it was called. Many mocks make tests break on refactors.",
    example: "Check that the service called compile exactly once.",
    match: ["mock object"],
    wiki: "Mock_object",
    learn: "dependencies",
  },
  {
    id: "unit-test",
    term: "Unit test",
    category: "Application design",
    definition:
      "A test of one part, with its dependencies replaced by test doubles. It is fast and needs no real tools.",
    example: "Test the render service with a fake compiler and a fixed clock.",
    match: ["unit test"],
    wiki: "Unit_testing",
    learn: "dependencies",
  },
  {
    id: "integration-test",
    term: "Integration test",
    category: "Application design",
    definition:
      "A test of real parts together, for example an adapter with the real tool or database.",
    example: "Run the Typst adapter with the real typst binary.",
    match: ["integration test"],
    wiki: "Integration_testing",
    learn: "dependencies",
  },
  {
    id: "import-boundary-rule",
    term: "Import boundary rule",
    category: "Architecture practice",
    definition:
      "A lint rule that fails when a file imports from a layer it must not use. It checks the dependency rule in the editor, while you type.",
    example:
      "eslint-plugin-boundaries or dependency-cruiser forbids imports from adapter in the core.",
    match: ["import boundary", "eslint-plugin-boundaries", "dependency-cruiser"],
    learn: "dependencies",
  },
  {
    id: "essential-complexity",
    term: "Essential complexity",
    category: "Architecture practice",
    definition:
      "The complexity that the problem itself has. You cannot remove it, only organize it.",
    example: "Tax rules that differ in each country.",
    match: ["essential complexity"],
    wiki: "No_Silver_Bullet",
  },
  {
    id: "accidental-complexity",
    term: "Accidental complexity",
    category: "Architecture practice",
    definition:
      "Complexity that we add and the problem does not need: extra layers, duplicate checks, unused options. AI-written code often adds it.",
    example: "The same request rules written twice, once in JSON Schema and once in Zod.",
    match: ["accidental complexity"],
    wiki: "No_Silver_Bullet",
  },
  {
    id: "use-case",
    term: "Use case",
    category: "Application design",
    definition:
      "One action that the application offers. In code, an application service that coordinates the domain model and the ports.",
    example: "PlaceOrder.",
    match: [],
    wiki: "Use_case",
    learn: "hexagonal",
  },
  {
    id: "vertical-slice",
    term: "Vertical slice",
    category: "Application design",
    definition: "All the code for one feature in one place, through all technical layers.",
    example: "A 'place order' folder with the endpoint, the logic, and the data access.",
    match: [],
    learn: "vertical-slices",
  },
  {
    id: "domain-model",
    term: "Domain model",
    category: "Application design",
    definition: "Code that expresses the business rules in the words of the business.",
    example: "An Order that refuses to be cancelled after it is shipped.",
    match: [],
    wiki: "Domain_model",
    learn: "domain-model",
  },
  {
    id: "entity",
    term: "Entity",
    category: "Application design",
    definition: "An object with an identity that stays the same while its data changes.",
    example: "An order, a customer.",
    match: [],
    learn: "domain-model",
  },
  {
    id: "value-object",
    term: "Value object",
    category: "Application design",
    definition: "An object defined only by its values. It does not change.",
    example: "Money with an amount and a currency.",
    match: [],
    wiki: "Value_object",
    learn: "domain-model",
  },
  {
    id: "aggregate",
    term: "Aggregate",
    category: "Application design",
    definition:
      "A group of objects that changes as one unit, through one root. It is a consistency boundary.",
    example: "An order with its lines.",
    match: [],
    learn: "domain-model",
  },
  {
    id: "repository",
    term: "Repository",
    category: "Application design",
    definition: "An interface that loads and saves whole aggregates. It hides the database.",
    example: "OrderRepository.save(order).",
    match: [],
    learn: "domain-model",
  },
  {
    id: "cqrs",
    term: "CQRS",
    category: "Application design",
    definition:
      "Command query responsibility segregation: one model to change data and a different model to read it.",
    example: "Posts are written in one store, and feeds are read from prepared lists.",
    match: [],
    wiki: "Command_Query_Responsibility_Segregation",
    learn: "cqrs-event-sourcing",
  },
  {
    id: "event-sourcing",
    term: "Event sourcing",
    category: "Application design",
    definition: "To store each change as an event and calculate the current state from the events.",
    example: "An account as a list: opened with 100, withdrew 50, deposited 20.",
    match: [],
    learn: "cqrs-event-sourcing",
  },
  {
    id: "rest",
    term: "REST",
    category: "Communication",
    definition:
      "A style of API where resources have addresses and are changed with the standard HTTP operations.",
    example: "GET /orders/42.",
    match: [],
    wiki: "REST",
    learn: "api-design",
  },
  {
    id: "rpc",
    term: "RPC",
    category: "Communication",
    definition:
      "Remote procedure call: the caller calls a named function on another service, as if it were local. gRPC is a common form.",
    example: "PlaceOrder(request).",
    match: [],
    wiki: "Remote_procedure_call",
    learn: "api-design",
  },
  {
    id: "graphql",
    term: "GraphQL",
    category: "Communication",
    definition: "A query language for APIs where the client asks for exactly the fields it needs.",
    example: "A phone screen gets an order with only the title and the price.",
    match: [],
    wiki: "GraphQL",
    learn: "api-design",
  },
  {
    id: "command",
    term: "Command",
    category: "Communication",
    definition: "A message that asks for an action. The sender expects it to be done.",
    example: "'Send this email.'",
    match: [],
    learn: "messaging",
  },
  {
    id: "topic",
    term: "Topic",
    category: "Communication",
    definition: "A named channel where each subscriber gets each message.",
    example: "'Order placed' goes to billing, to the kitchen, and to analytics.",
    match: [],
    learn: "messaging",
  },
  {
    id: "event-log",
    term: "Event log",
    category: "Communication",
    definition:
      "An ordered list of events that is kept for a period. Each reader has its own position and can read it again.",
    example: "A new service reads the events of the last month to build its data.",
    match: [],
    learn: "messaging",
  },
  {
    id: "acid",
    term: "ACID",
    category: "Data",
    definition:
      "The four promises of a database transaction: atomic, consistent, isolated, durable.",
    example: "Money leaves one account and arrives in the other, or neither occurs.",
    match: [],
    wiki: "ACID",
    learn: "consistency",
  },
  {
    id: "cap-theorem",
    term: "CAP theorem",
    category: "Data",
    definition:
      "When the network between copies breaks, a system must select between consistent data and an answer for each request.",
    example: "A seat store refuses requests. A feed shows old data.",
    match: [],
    wiki: "CAP_theorem",
    learn: "consistency",
  },
  {
    id: "strong-consistency",
    term: "Strong consistency",
    category: "Data",
    definition: "A read always returns the latest confirmed write.",
    example: "After a booking, no user sees the seat as free.",
    match: [],
    wiki: "Strong_consistency",
    learn: "consistency",
  },
  {
    id: "saga",
    term: "Saga",
    category: "Data",
    definition:
      "A sequence of local transactions in several services, with an action that reverses each step if a later step fails.",
    example: "Reserve the slot, charge the card, confirm. If the charge fails, release the slot.",
    match: [],
    wiki: "Long-running_transaction",
    learn: "distributed-transactions",
  },
  {
    id: "compensation",
    term: "Compensation",
    category: "Data",
    definition: "An action that reverses a completed step of a saga.",
    example: "A refund reverses a charge.",
    match: [],
    wiki: "Compensating_transaction",
    learn: "distributed-transactions",
  },
  {
    id: "outbox",
    term: "Outbox",
    category: "Data",
    definition:
      "A table where a service writes an event in the same transaction as the data change. A separate process publishes it.",
    example: "The order row and the 'order placed' event are saved together.",
    match: [],
    learn: "distributed-transactions",
  },
  {
    id: "leader-follower",
    term: "Leader and follower",
    category: "Data",
    definition:
      "A form of replication where one server takes all writes and sends them to the copies.",
    example: "Reads go to followers when the leader is busy.",
    match: [],
    learn: "scaling-data",
  },
  {
    id: "hot-key",
    term: "Hot key",
    category: "Data",
    definition: "One key that gets far more traffic than the others and overloads its partition.",
    example: "A link that a famous person shared.",
    match: [],
    learn: "scaling-data",
  },
  {
    id: "relational-database",
    term: "Relational database",
    category: "Data",
    definition:
      "A database of tables with rows and columns, joins between tables, and transactions.",
    example: "Orders and their lines in two tables.",
    match: [],
    wiki: "Relational_database",
    learn: "data-stores",
  },
  {
    id: "document-database",
    term: "Document database",
    category: "Data",
    definition: "A database that stores each record as one document with a flexible shape.",
    example: "A product with its own set of attributes.",
    match: [],
    wiki: "Document-oriented_database",
    learn: "data-stores",
  },
  {
    id: "circuit-breaker",
    term: "Circuit breaker",
    category: "Reliability",
    definition:
      "After several failed calls to a part, stop calling it for a period and fail immediately.",
    example: "The shop stops calls to a recommendation service that is down.",
    match: [],
    wiki: "Circuit_breaker_design_pattern",
    learn: "resilience",
  },
  {
    id: "bulkhead",
    term: "Bulkhead",
    category: "Reliability",
    definition:
      "A separate, limited share of resources for each dependency, so one slow dependency cannot use everything.",
    example: "Ten connections for the payment provider, ten for the email provider.",
    match: [],
    learn: "resilience",
  },
  {
    id: "backpressure",
    term: "Backpressure",
    category: "Reliability",
    definition:
      "A full system tells its callers to slow down, instead of accepting work it cannot finish. A bounded queue that answers 503 is one form.",
    example: "When the render queue is full, the worker answers 503 with Retry-After at once.",
    match: ["backpressure"],
    learn: "resilience",
  },
  {
    id: "graceful-degradation",
    term: "Graceful degradation",
    category: "Reliability",
    definition: "To continue with fewer functions when a part fails.",
    example: "A plain product list when recommendations are down.",
    match: [],
    wiki: "Fault_tolerance",
    learn: "resilience",
  },
  {
    id: "redundancy",
    term: "Redundancy",
    category: "Reliability",
    definition: "More than one copy of a part, so the loss of one does not stop the system.",
    example: "Three copies of the application in two data centers.",
    match: [],
    wiki: "Redundancy_(engineering)",
    learn: "resilience",
  },
  {
    id: "chaos-engineering",
    term: "Chaos engineering",
    category: "Reliability",
    definition:
      "To cause failures deliberately, in a controlled way, to see how the system reacts.",
    example: "Stop one server during work hours and watch the alerts.",
    match: [],
    wiki: "Chaos_engineering",
    learn: "resilience",
  },
  {
    id: "vertical-scaling",
    term: "Vertical scaling",
    category: "Scale and speed",
    definition: "To handle more load with a larger machine.",
    example: "Move the database to a server with more memory.",
    match: [],
    wiki: "Scalability",
    learn: "scalability",
  },
  {
    id: "elasticity",
    term: "Elasticity",
    category: "Scale and speed",
    definition: "How fast capacity follows a sudden change in load, up and down.",
    example: "Seat units start in seconds when a sale opens.",
    match: [],
    wiki: "Elasticity_(system_resource)",
    learn: "scalability",
  },
  {
    id: "percentile",
    term: "Percentile",
    category: "Scale and speed",
    definition:
      "A value that a given share of measurements is below. It shows the slow cases that an average hides.",
    example: "99% of requests finish in less than 300 milliseconds.",
    match: [],
    wiki: "Percentile",
    learn: "scalability",
  },
  {
    id: "cache-stampede",
    term: "Cache stampede",
    category: "Scale and speed",
    definition: "Many requests rebuild the same expired cache entry at the same moment.",
    example: "A popular page expires and 5,000 requests reach the database.",
    match: [],
    wiki: "Cache_stampede",
    learn: "caching",
  },
  {
    id: "observability",
    term: "Observability",
    category: "Operations",
    definition: "The ability to understand what a running system does from the data it produces.",
    example: "Metrics, logs, and traces.",
    match: [],
    wiki: "Observability_(software)",
    learn: "observability",
  },
  {
    id: "metric",
    term: "Metric",
    category: "Operations",
    definition: "A number measured over time.",
    example: "Requests each second, error share, queue length.",
    match: [],
    learn: "observability",
  },
  {
    id: "log",
    term: "Log",
    category: "Operations",
    definition: "A record of each event, with details.",
    example: "'Payment 4711 refused: card expired.'",
    match: [],
    wiki: "Logging_(computing)",
    learn: "observability",
  },
  {
    id: "trace",
    term: "Trace",
    category: "Operations",
    definition: "The path of one request through all the parts, with the time in each part.",
    example: "A slow order page: 2 seconds were in the price service.",
    match: [],
    wiki: "Tracing_(software)",
    learn: "observability",
  },
  {
    id: "slo",
    term: "Service level objective (SLO)",
    category: "Operations",
    definition:
      "A target for a measurement of what users experience. The measurement is the indicator (SLI).",
    example: "99.9% of redirects answer in less than 100 milliseconds, each month.",
    match: [],
    wiki: "Service-level_objective",
    learn: "observability",
  },
  {
    id: "sla",
    term: "Service level agreement (SLA)",
    category: "Operations",
    definition: "A promise to a customer about a service level, with a penalty.",
    example: "99.5% availability, or the customer gets money back.",
    match: [],
    wiki: "Service-level_agreement",
    learn: "observability",
  },
  {
    id: "error-budget",
    term: "Error budget",
    category: "Operations",
    definition:
      "The amount of failure that an objective permits. When it is used, reliability work comes before new features.",
    example: "99.9% each month permits about 43 minutes of failure.",
    match: [],
    learn: "observability",
  },
  {
    id: "ci-cd",
    term: "CI/CD",
    category: "Operations",
    definition:
      "Continuous integration and delivery: each change is built, tested, and deployed by automatic steps.",
    example: "A merged change is in production in 20 minutes.",
    match: [],
    wiki: "CI/CD",
    learn: "deployment",
  },
  {
    id: "blue-green",
    term: "Blue-green deployment",
    category: "Operations",
    definition:
      "Start a full second environment with the new version, then move all traffic to it.",
    example: "Return to the old version in seconds if the new one fails.",
    match: [],
    wiki: "Blue–green_deployment",
    learn: "deployment",
  },
  {
    id: "canary-release",
    term: "Canary release",
    category: "Operations",
    definition:
      "Send a small share of users to a new version and watch the measurements before all users get it.",
    example: "5% of traffic for one hour.",
    match: [],
    learn: "deployment",
  },
  {
    id: "feature-flag",
    term: "Feature flag",
    category: "Operations",
    definition: "A switch that turns a function on or off with no deployment.",
    example: "New checkout for employees only.",
    match: [],
    wiki: "Feature_toggle",
    learn: "deployment",
  },
  {
    id: "infrastructure-as-code",
    term: "Infrastructure as code",
    category: "Operations",
    definition: "Servers, networks, and settings described in files and applied automatically.",
    example: "A test environment created from the same files as production.",
    match: [],
    wiki: "Infrastructure_as_code",
    learn: "deployment",
  },
  {
    id: "authentication",
    term: "Authentication",
    category: "Security",
    definition: "To prove who a user or a system is.",
    example: "A password and a code on a phone.",
    match: [],
    wiki: "Authentication",
    learn: "security",
  },
  {
    id: "authorization",
    term: "Authorization",
    category: "Security",
    definition: "To decide what an identified user can do.",
    example: "This user can read this order and cannot refund it.",
    match: [],
    wiki: "Authorization",
    learn: "security",
  },
  {
    id: "least-privilege",
    term: "Least privilege",
    category: "Security",
    definition: "Each part gets only the access it needs.",
    example: "The notification service cannot read payment tables.",
    match: [],
    wiki: "Principle_of_least_privilege",
    learn: "security",
  },
  {
    id: "trust-boundary",
    term: "Trust boundary",
    category: "Security",
    definition:
      "A line in a design where data crosses from a less trusted part to a more trusted part.",
    example: "The public internet to the API gateway.",
    match: [],
    wiki: "Trust_boundary",
    learn: "security",
  },
  {
    id: "threat-model",
    term: "Threat model",
    category: "Security",
    definition:
      "A structured list of what can go wrong with a design, and the decision for each item.",
    example: "'A bot can buy all tickets': prevent it with a waiting room.",
    match: [],
    wiki: "Threat_model",
    learn: "security",
  },
  {
    id: "encryption",
    term: "Encryption",
    category: "Security",
    definition: "To convert data to a form that only a holder of the key can read.",
    example: "Data is encrypted between services and in the database.",
    match: [],
    wiki: "Encryption",
    learn: "security",
  },
  {
    id: "functional-requirement",
    term: "Functional requirement",
    category: "Architecture practice",
    definition:
      "Something the system must do. It decides which components exist. An architecture characteristic says how well the system must do it.",
    example: "'A customer pays online' is a functional requirement.",
    match: [],
    wiki: "Functional_requirement",
    learn: "method",
  },

  // Architecture practice: structure, domains, teams, risk, and styles
  {
    id: "architecture-quantum",
    term: "Architecture quantum",
    category: "Architecture practice",
    definition:
      "The smallest part of a system that deploys on its own, with high functional cohesion and the parts it calls synchronously. Each quantum can have its own characteristics.",
    example:
      "In the ticket seller, seat search and checkout share one database, so they are one quantum.",
    match: ["architecture quantum", "architecture quanta"],
    learn: "architecture-quantum",
  },
  {
    id: "static-coupling",
    term: "Static coupling",
    category: "Architecture practice",
    definition:
      "How parts are connected before they run: the databases, libraries, brokers, and other parts that each one needs to deploy and start.",
    example:
      "Two services of the parcel service that use one database are one quantum through static coupling.",
    match: ["static coupling"],
    learn: "architecture-quantum",
  },
  {
    id: "dynamic-coupling",
    term: "Dynamic coupling",
    category: "Architecture practice",
    definition:
      "How parts depend on each other at run time: synchronous or asynchronous calls, atomic or eventual consistency, and orchestration or choreography.",
    example:
      "The booking service of the tutor marketplace waits for the payment service on each booking.",
    match: ["dynamic coupling"],
    learn: "architecture-quantum",
  },
  {
    id: "connascence",
    term: "Connascence",
    category: "Architecture practice",
    definition:
      "Two parts are connascent when a change in one forces a change in the other. Static forms show in the code, and dynamic forms show only at run time.",
    example:
      "Two lunch shop services that both depend on the field order of one CSV file have connascence of position.",
    match: ["connascence"],
    wiki: "Connascence",
    learn: "modularity",
  },
  {
    id: "afferent-coupling",
    term: "Afferent coupling (Ca)",
    category: "Architecture practice",
    definition:
      "The number of parts outside a module that depend on it. A high value means that a change to the module affects many parts.",
    example: "Twenty modules of the parcel service import the address module.",
    match: ["afferent coupling"],
    wiki: "Software_package_metrics",
    learn: "modularity",
  },
  {
    id: "efferent-coupling",
    term: "Efferent coupling (Ce)",
    category: "Architecture practice",
    definition:
      "The number of parts outside a module that the module depends on. A high value means that many changes elsewhere can break it.",
    example: "The lunch shop checkout module imports menu, payments, and loyalty, so its Ce is 3.",
    match: ["efferent coupling"],
    wiki: "Software_package_metrics",
    learn: "modularity",
  },
  {
    id: "cyclomatic-complexity",
    term: "Cyclomatic complexity",
    category: "Architecture practice",
    definition:
      "The number of independent paths through a function, counted from its decisions. A high value makes the code hard to test and to change.",
    example: "A delivery price function in the parcel service with 15 if branches.",
    match: ["cyclomatic complexity"],
    wiki: "Cyclomatic_complexity",
    learn: "measuring-characteristics",
  },
  {
    id: "granularity-disintegrator",
    term: "Granularity disintegrator",
    category: "Architecture practice",
    definition:
      "A force that pushes to split a service: a different scope, code volatility, scalability, fault tolerance, security, or extensibility.",
    example:
      "The ticket seller splits seat search from payment, because search gets 50 times more load.",
    match: ["granularity disintegrator", "disintegrators"],
    learn: "service-granularity",
  },
  {
    id: "granularity-integrator",
    term: "Granularity integrator",
    category: "Architecture practice",
    definition:
      "A force that pushes to keep functions in one service: a shared database transaction, a tight workflow, shared code, or close data relationships.",
    example:
      "Seat hold and payment stay in one service, because they must change in one transaction.",
    match: ["granularity integrator"],
    learn: "service-granularity",
  },
  {
    id: "branch-by-abstraction",
    term: "Branch by abstraction",
    category: "Architecture practice",
    definition:
      "Put an interface in front of the code that you replace, and build the new code behind it. Then move the callers to it and delete the old code.",
    example:
      "The lunch shop puts a PaymentGateway interface in front of its old card code before it changes provider.",
    match: ["branch by abstraction"],
    learn: "decomposing-a-monolith",
  },
  {
    id: "parallel-run",
    term: "Parallel run",
    category: "Architecture practice",
    definition:
      "Send the same input to the old and the new implementation and compare the results. Only the old result goes to users until the two agree.",
    example:
      "The parcel service calculates prices in both systems for one month and logs each difference.",
    match: ["parallel run"],
    learn: "decomposing-a-monolith",
  },
  {
    id: "ubiquitous-language",
    term: "Ubiquitous language",
    category: "Architecture practice",
    definition:
      "One exact vocabulary that developers and business experts use in talk, in documents, and in code, inside one bounded context.",
    example:
      "In the ticket seller, 'hold' means a seat kept for 10 minutes, in the code and in meetings.",
    match: ["ubiquitous language"],
    wiki: "Domain-driven_design",
    learn: "bounded-contexts",
  },
  {
    id: "context-map",
    term: "Context map",
    category: "Architecture practice",
    definition:
      "A diagram of the bounded contexts and of the relationship between each pair, such as conformist or anticorruption layer.",
    example: "The ticket seller map shows seat inventory as an open host service for ordering.",
    match: ["context map"],
    learn: "bounded-contexts",
  },
  {
    id: "anticorruption-layer",
    term: "Anticorruption layer",
    category: "Architecture practice",
    definition:
      "A translation layer that converts the model of another system into your own model. The outside model then cannot leak into your code.",
    example:
      "The parcel service translates the status codes of a carrier API into its own Shipment model.",
    match: ["anticorruption layer", "anti-corruption layer"],
    learn: "bounded-contexts",
  },
  {
    id: "shared-kernel",
    term: "Shared kernel",
    category: "Architecture practice",
    definition:
      "A small part of a model that two teams share. Neither team changes it without the agreement of the other.",
    example: "Two tutor marketplace teams share one library for Money and TimeSlot.",
    match: ["shared kernel"],
    learn: "bounded-contexts",
  },
  {
    id: "conformist",
    term: "Conformist",
    category: "Architecture practice",
    definition:
      "A downstream context that uses the model of an upstream context as it is, with no translation.",
    example:
      "The ticket seller uses the status names of its payment provider directly in ordering.",
    match: [],
    learn: "bounded-contexts",
  },
  {
    id: "core-domain",
    term: "Core domain",
    category: "Architecture practice",
    definition:
      "The part of the business that makes the company different from its competitors. It gets the best people and a custom design, and supporting and generic subdomains get simpler solutions.",
    example: "Route planning is the core domain of the parcel service. Invoicing is generic.",
    match: ["core domain"],
    learn: "bounded-contexts",
  },
  {
    id: "stream-aligned-team",
    term: "Stream-aligned team",
    category: "Architecture practice",
    definition:
      "A team that owns one stream of business change from idea to production, such as one product or one user journey.",
    example: "The buyer checkout team of the ticket seller.",
    match: ["stream-aligned"],
    learn: "team-topologies",
  },
  {
    id: "platform-team",
    term: "Platform team",
    category: "Architecture practice",
    definition:
      "A team that offers internal services as a self-service product. Stream-aligned teams use them and need less specialist knowledge.",
    example:
      "A ticket seller team that gives every team deployment, logs, and metrics with no ticket.",
    match: ["platform team"],
    learn: "team-topologies",
  },
  {
    id: "enabling-team",
    term: "Enabling team",
    category: "Architecture practice",
    definition:
      "A team of specialists that helps other teams learn a new skill or practice for a limited time, then steps back.",
    example: "A team that helps the ticket seller teams adopt load tests before a big sale.",
    match: ["enabling team"],
    learn: "team-topologies",
  },
  {
    id: "complicated-subsystem-team",
    term: "Complicated-subsystem team",
    category: "Architecture practice",
    definition:
      "A team that owns a part which needs deep specialist knowledge, so that the other teams do not need it.",
    example: "The dynamic pricing engine of the ticket seller.",
    match: ["complicated-subsystem", "complicated subsystem"],
    learn: "team-topologies",
  },
  {
    id: "team-interaction-modes",
    term: "Team interaction modes",
    category: "Architecture practice",
    definition:
      "The three ways that two teams work together: collaboration for a limited time, X-as-a-Service through a clear interface, and facilitating to teach a skill.",
    example:
      "Sender and courier teams of the parcel service collaborate for one quarter, then use X-as-a-Service.",
    match: ["x-as-a-service", "interaction mode"],
    learn: "team-topologies",
  },
  {
    id: "cognitive-load",
    term: "Cognitive load",
    category: "Architecture practice",
    definition:
      "The mental effort that a team needs to understand and change what it owns. Team Topologies limits the scope of each team to what it can hold.",
    example:
      "One tutor marketplace team that owns search, payments, and video calls is overloaded.",
    match: ["cognitive load"],
    wiki: "Cognitive_load",
    learn: "team-topologies",
  },
  {
    id: "risk-storming",
    term: "Risk storming",
    category: "Architecture practice",
    definition:
      "A workshop where each person first marks risks on the architecture diagram alone. Then the group compares the marks and agrees on the risks.",
    example: "Three developers each mark the payment provider of the lunch shop as a high risk.",
    match: ["risk storming", "risk-storming"],
    learn: "risk-assessment",
  },
  {
    id: "risk-matrix",
    term: "Risk matrix",
    category: "Architecture practice",
    definition:
      "A grid that rates each risk by its likelihood and its impact, often from 1 to 3. The product of the two numbers gives its priority.",
    example: "Impact 3 and likelihood 2 give the on-sale peak of the ticket seller a risk of 6.",
    match: ["risk matrix"],
    wiki: "Risk_matrix",
    learn: "risk-assessment",
  },
  {
    id: "atam",
    term: "Architecture tradeoff analysis method (ATAM)",
    category: "Architecture practice",
    definition:
      "A structured review that tests an architecture against quality scenarios in priority order. It finds risks, sensitivity points, and trade-offs.",
    example:
      "Stakeholders of the parcel service rank 'show a parcel status in 1 second at peak' as the first scenario.",
    match: ["tradeoff analysis method", "trade-off analysis method"],
    wiki: "Architecture_tradeoff_analysis_method",
    learn: "risk-assessment",
  },
  {
    id: "layered-architecture",
    term: "Layered architecture",
    category: "Architecture practice",
    definition:
      "A style that divides the code into technical layers, such as presentation, business rules, and data access. Each layer calls only the layer below it.",
    example: "A small lunch shop application with screens, rules, and a data access layer.",
    match: ["layered architecture", "n-tier"],
    wiki: "Multitier_architecture",
    learn: "layered",
  },
  {
    id: "modular-monolith",
    term: "Modular monolith",
    category: "Architecture practice",
    definition:
      "One deployment divided into modules by business area. Each module owns its data and hides its inside behind a public interface.",
    example: "Orders, menu, and payments as three modules in one lunch shop application.",
    match: ["modular monolith"],
    learn: "modular-monolith",
  },
  {
    id: "microkernel-architecture",
    term: "Microkernel architecture",
    category: "Architecture practice",
    definition:
      "A style with a small core system and plug-ins that add features through a fixed contract.",
    example: "The Notification Service answer, with one plug-in for each channel.",
    match: ["microkernel"],
    learn: "microkernel",
  },
  {
    id: "service-based-architecture",
    term: "Service-based architecture",
    category: "Architecture practice",
    definition:
      "A style with one user interface, a few large domain services, and usually one shared database.",
    example: "The tutor marketplace as four services: search, booking, payments, and lessons.",
    match: ["service-based architecture"],
    learn: "service-based",
  },
  {
    id: "event-driven-architecture",
    term: "Event-driven architecture",
    category: "Architecture practice",
    definition:
      "A style where parts react to events asynchronously and do not call each other directly. It scales well and has loose coupling, but a workflow is hard to follow.",
    example:
      "'Order placed' in the lunch shop starts the kitchen, billing, and notifications at the same time.",
    match: ["event-driven"],
    wiki: "Event-driven_architecture",
    learn: "event-driven",
  },
  {
    id: "microservices",
    term: "Microservices",
    category: "Architecture practice",
    definition:
      "A style of many small services that deploy independently. Each service owns one business function and its own data.",
    example:
      "The parcel service with separate services for booking, routing, tracking, and billing.",
    match: ["microservice"],
    wiki: "Microservices",
    learn: "microservices",
  },
  {
    id: "space-based-architecture",
    term: "Space-based architecture",
    category: "Architecture practice",
    definition:
      "A style where processing units keep the data in replicated memory and update the database asynchronously. It handles extreme, sudden peaks of load.",
    example: "The ticket seller at the moment a big concert goes on sale.",
    match: ["space-based"],
    wiki: "Space-based_architecture",
    learn: "space-based",
  },
  {
    id: "pipeline-architecture",
    term: "Pipeline architecture",
    category: "Architecture practice",
    definition:
      "A style where data flows through a chain of filters connected by pipes, and each filter does one transformation. Also named pipes and filters.",
    example: "Upload, transcode, make thumbnails, and publish in the video platform.",
    match: ["pipeline architecture", "pipes and filters", "pipe and filter"],
    wiki: "Pipeline_(software)",
    learn: "pipeline",
  },

  // Application design: module depth and tests
  {
    id: "deep-module",
    term: "Deep module",
    category: "Application design",
    definition:
      "A module with a simple interface that hides a large implementation. It gives much function for little to learn.",
    example:
      "One send(notification) call that hides channels, templates, retries, and provider failover.",
    match: ["deep module"],
    learn: "deep-modules",
  },
  {
    id: "shallow-module",
    term: "Shallow module",
    category: "Application design",
    definition:
      "A module whose interface is almost as complex as its implementation. It adds a cost and hides little.",
    example:
      "A CustomerService in the lunch shop that only wraps each database call in one method.",
    match: ["shallow module"],
    learn: "deep-modules",
  },
  {
    id: "information-hiding",
    term: "Information hiding",
    category: "Application design",
    definition:
      "Each module keeps its design decisions inside, so other modules cannot depend on them. Then you can change a decision in one place.",
    example:
      "Only the pricing module of the parcel service knows how the fuel surcharge is calculated.",
    match: ["information hiding"],
    wiki: "Information_hiding",
    learn: "deep-modules",
  },
  {
    id: "information-leakage",
    term: "Information leakage",
    category: "Application design",
    definition:
      "One design decision shows in more than one module. A change to that decision then forces a change in all of them.",
    example: "Two services that read the same order table both know its columns.",
    match: ["information leakage"],
    learn: "deep-modules",
  },
  {
    id: "test-pyramid",
    term: "Test pyramid",
    category: "Application design",
    definition:
      "A guide for the mix of tests: many fast unit tests, fewer integration tests, and few slow end-to-end tests.",
    example:
      "The lunch shop has 800 unit tests, 60 integration tests, and 5 end-to-end checkout tests.",
    match: ["test pyramid", "testing pyramid"],
    learn: "testing-strategy",
  },
  {
    id: "end-to-end-test",
    term: "End-to-end test",
    category: "Application design",
    definition:
      "A test of the whole running system through its real interface, as a user uses it. It is slow and breaks easily, so keep few of them.",
    example: "A browser test that books and pays for a lesson in the tutor marketplace.",
    match: ["end-to-end test"],
    learn: "testing-strategy",
  },
  {
    id: "consumer-driven-contract",
    term: "Consumer-driven contract",
    category: "Application design",
    definition:
      "The consumer writes tests of what it needs from a provider. The provider runs these tests in its build, so a breaking change fails before release.",
    example:
      "The tracking app gives the routing team of the parcel service a contract for GET /parcels/{id}.",
    match: ["consumer-driven contract", "contract test"],
    learn: "testing-strategy",
  },

  // Communication: logs, contracts, and formats
  {
    id: "consumer-group",
    term: "Consumer group",
    category: "Communication",
    definition:
      "A set of consumers that share the partitions of a topic. Each message goes to one member of the group, and each group gets all messages.",
    example: "Five billing workers in one group share the 10 partitions of 'order placed'.",
    match: ["consumer group"],
    learn: "message-queue",
  },
  {
    id: "offset",
    term: "Offset",
    category: "Communication",
    definition:
      "The position of a message in one partition of a log. A consumer commits its offset to record how far it has processed.",
    example: "After a crash, the billing worker starts again from its committed offset 4,120.",
    match: ["committed offset", "consumer offset"],
    learn: "message-queue",
  },
  {
    id: "backward-compatibility",
    term: "Backward compatibility",
    category: "Communication",
    definition: "New code can read data that old code wrote.",
    example: "The new tracking service reads parcel events that were written last year.",
    match: ["backward compatib", "backwards compatib"],
    wiki: "Backward_compatibility",
    learn: "encoding-and-evolution",
  },
  {
    id: "forward-compatibility",
    term: "Forward compatibility",
    category: "Communication",
    definition:
      "Old code can read data that new code wrote, and it ignores the fields that it does not know.",
    example: "Old billing workers still read 'order placed' events that have the new 'tip' field.",
    match: ["forward compatib"],
    wiki: "Forward_compatibility",
    learn: "encoding-and-evolution",
  },
  {
    id: "schema-registry",
    term: "Schema registry",
    category: "Communication",
    definition:
      "A service that stores each version of a message schema. It refuses a new version that breaks the compatibility rule of the topic.",
    example: "The registry refuses an 'order placed' schema that removes a required field.",
    match: ["schema registry"],
    learn: "encoding-and-evolution",
  },
  {
    id: "protocol-buffers",
    term: "Protocol Buffers",
    category: "Communication",
    definition:
      "A binary encoding with a schema, from Google. Each field has a number tag, so you can add or rename fields and old readers still work.",
    example: "The ticket seller sends seat holds as Protocol Buffers over gRPC.",
    match: ["protocol buffers", "protobuf"],
    wiki: "Protocol_Buffers",
    learn: "encoding-and-evolution",
  },
  {
    id: "tolerant-reader",
    term: "Tolerant reader",
    category: "Communication",
    definition:
      "A consumer that reads only the fields it needs and ignores the others. The provider can then add fields freely.",
    example:
      "The kitchen display of the lunch shop reads only the items and the table number of an order.",
    match: ["tolerant reader"],
    learn: "api-design",
  },
  {
    id: "expand-and-contract",
    term: "Expand and contract",
    category: "Communication",
    definition:
      "Change a contract or a schema in steps: add the new form, move all users to it, then remove the old form. Also named parallel change.",
    example:
      "The tutor marketplace adds hourlyPrice, sends both fields, moves the clients, then removes price.",
    match: ["expand and contract", "expand-and-contract", "parallel change"],
    learn: "api-design",
  },
  {
    id: "long-polling",
    term: "Long polling",
    category: "Communication",
    definition:
      "The client sends a request, and the server holds it open until new data arrives or a timeout occurs. Then the client sends the next request.",
    example: "A file sync client waits on a long poll for changes to its folders.",
    match: ["long poll"],
    learn: "chat-system",
  },

  // Data: storage engines and analysis
  {
    id: "lsm-tree",
    term: "LSM-tree",
    category: "Data",
    definition:
      "A storage engine that collects writes in memory, writes them to disk as sorted files, and merges the files in the background. Writes are fast.",
    example: "A store for ad clicks uses an LSM-tree, because it gets many more writes than reads.",
    match: ["lsm-tree", "lsm tree", "log-structured merge"],
    wiki: "Log-structured_merge-tree",
    learn: "storage-engines",
  },
  {
    id: "sstable",
    term: "SSTable",
    category: "Data",
    definition:
      "Sorted string table: a file of key-value pairs, sorted by key, that does not change after it is written. An LSM-tree stores its data in SSTables.",
    example: "Compaction merges small SSTables of click counts into one larger SSTable.",
    match: ["sstable", "sorted string table"],
    learn: "storage-engines",
  },
  {
    id: "b-tree",
    term: "B-tree",
    category: "Data",
    definition:
      "A balanced tree of fixed-size pages on disk. The database changes pages in place, and a lookup reads only a few pages.",
    example: "The index on the order ID in the lunch shop database.",
    match: ["b-tree", "b+tree", "b+ tree"],
    wiki: "B-tree",
    learn: "storage-engines",
  },
  {
    id: "write-ahead-log",
    term: "Write-ahead log (WAL)",
    category: "Data",
    definition:
      "An append-only file where the database writes each change before it applies the change. After a crash, the database uses the log to return to a correct state.",
    example: "PostgreSQL replays its WAL after a power failure.",
    match: ["write-ahead log", "write ahead log"],
    wiki: "Write-ahead_logging",
    learn: "storage-engines",
  },
  {
    id: "bloom-filter",
    term: "Bloom filter",
    category: "Data",
    definition:
      "A small bit array that says if a key is surely absent or possibly present. It can give false positives but never false negatives.",
    example:
      "An LSM-tree does not read an SSTable when its Bloom filter says that the key is absent.",
    match: ["bloom filter"],
    wiki: "Bloom_filter",
    learn: "storage-engines",
  },
  {
    id: "column-oriented-storage",
    term: "Column-oriented storage",
    category: "Data",
    definition:
      "Store all the values of each column together, not each row together. A query reads only the columns it needs, and the data compresses well.",
    example: "A report of ticket revenue reads only the date and price columns of a billion rows.",
    match: ["column-oriented", "columnar"],
    wiki: "Column-oriented_DBMS",
    learn: "storage-engines",
  },
  {
    id: "oltp-olap",
    term: "OLTP and OLAP",
    category: "Data",
    definition:
      "OLTP serves many small reads and writes for users. OLAP serves few large queries that scan many rows for analysis.",
    example:
      "The ticket seller sells seats in an OLTP database and reports monthly sales from an OLAP store.",
    match: ["oltp", "olap"],
    wiki: "Online_analytical_processing",
    learn: "storage-engines",
  },
  {
    id: "data-warehouse",
    term: "Data warehouse",
    category: "Data",
    definition:
      "A separate database for analysis. It collects data from many operational systems, cleans it, and stores it in a schema for queries.",
    example:
      "The parcel service loads bookings, routes, and invoices into its warehouse each night.",
    match: ["data warehouse"],
    wiki: "Data_warehouse",
    learn: "analytical-data",
  },
  {
    id: "star-schema",
    term: "Star schema",
    category: "Data",
    definition:
      "A warehouse schema with one large fact table of events in the center and smaller dimension tables around it.",
    example:
      "A fact table of ticket sales, with dimension tables for show, venue, customer, and date.",
    match: ["star schema"],
    wiki: "Star_schema",
    learn: "storage-engines",
  },
  {
    id: "data-lake",
    term: "Data lake",
    category: "Data",
    definition:
      "A store that keeps raw data in its original format, often as files in object storage. The reader applies a schema when it reads the data.",
    example: "The raw view logs of the video platform, as files in object storage.",
    match: ["data lake"],
    wiki: "Data_lake",
    learn: "analytical-data",
  },
  {
    id: "data-mesh",
    term: "Data mesh",
    category: "Data",
    definition:
      "Each domain team owns its analytical data and publishes it as a product. A self-serve platform and shared governance rules support the teams.",
    example:
      "The routing team of the parcel service publishes a data set of delivery times for the other teams.",
    match: ["data mesh"],
    wiki: "Data_mesh",
    learn: "analytical-data",
  },
  {
    id: "data-product",
    term: "Data product",
    category: "Data",
    definition:
      "A data set that a domain team publishes for others, with an owner, a documented schema, quality targets, and access rules.",
    example: "'Daily lessons by subject' from the booking team of the tutor marketplace.",
    match: ["data product"],
    learn: "analytical-data",
  },

  // Data: transactions and isolation
  {
    id: "read-committed",
    term: "Read committed",
    category: "Data",
    definition:
      "An isolation level with no dirty reads and no dirty writes. A transaction sees only committed data and overwrites only committed data.",
    example: "PostgreSQL uses read committed as its default level.",
    match: ["read committed"],
    wiki: "Isolation_(database_systems)",
    learn: "transactions-isolation",
  },
  {
    id: "snapshot-isolation",
    term: "Snapshot isolation",
    category: "Data",
    definition:
      "Each transaction reads from a consistent snapshot of the database at its start. Changes that others commit while it runs stay invisible to it.",
    example:
      "A long sales report of the lunch shop sees the totals of 09:00 while new orders arrive.",
    match: ["snapshot isolation"],
    wiki: "Snapshot_isolation",
    learn: "transactions-isolation",
  },
  {
    id: "mvcc",
    term: "Multi-version concurrency control (MVCC)",
    category: "Data",
    definition:
      "The database keeps several versions of each row. Readers see an old version, so they do not block writers.",
    example: "PostgreSQL gives snapshot isolation with MVCC.",
    match: ["mvcc", "multi-version concurrency", "multiversion concurrency"],
    wiki: "Multiversion_concurrency_control",
    learn: "transactions-isolation",
  },
  {
    id: "lost-update",
    term: "Lost update",
    category: "Data",
    definition:
      "Two transactions read the same value, change it, and write it back. The second write removes the change of the first.",
    example:
      "Two lunch shop staff members add stock at the same moment, and one addition disappears.",
    match: ["lost update"],
    learn: "transactions-isolation",
  },
  {
    id: "write-skew",
    term: "Write skew",
    category: "Data",
    definition:
      "Two transactions read the same data, each makes a decision from it, and each writes a different row. Together they break a rule that each one checked.",
    example:
      "Two dispatchers each see free space in a parcel van and each assign one more parcel to it.",
    match: ["write skew"],
    learn: "transactions-isolation",
  },
  {
    id: "phantom",
    term: "Phantom",
    category: "Data",
    definition:
      "A write in one transaction changes the result of a search in another transaction. A lock on existing rows cannot stop it, because the new row did not exist.",
    example: "Two bookings for the same tutor slot both find no booking, and then both insert one.",
    match: ["phantom read", "phantoms"],
    learn: "transactions-isolation",
  },
  {
    id: "serializable-isolation",
    term: "Serializable isolation",
    category: "Data",
    definition:
      "The strongest isolation level: the result is the same as if the transactions ran one at a time. Databases use serial execution, two-phase locking, or serializable snapshot isolation.",
    example: "The hotel reservation system uses it so that two guests cannot book the last room.",
    match: ["serializable isolation", "serializability"],
    wiki: "Serializability",
    learn: "transactions-isolation",
  },
  {
    id: "optimistic-locking",
    term: "Optimistic locking",
    category: "Data",
    definition:
      "Write only if the row still has the version that you read, and retry if not. Pessimistic locking instead locks the row when it reads it.",
    example: "UPDATE rooms SET booked = booked + 1, version = 8 WHERE id = 12 AND version = 7.",
    match: ["optimistic lock", "pessimistic lock", "optimistic concurrency"],
    wiki: "Optimistic_concurrency_control",
    learn: "hotel-reservation",
  },

  // Data: replication, consensus, and agreement
  {
    id: "linearizability",
    term: "Linearizability",
    category: "Data",
    definition:
      "The system behaves as if there is one copy of the data, and each operation takes effect at one moment. After a write completes, every read sees it.",
    example:
      "The lock service of the ticket seller must be linearizable, so two buyers never hold the same seat.",
    match: ["linearizab"],
    wiki: "Linearizability",
    learn: "consensus",
  },
  {
    id: "two-phase-commit",
    term: "Two-phase commit (2PC)",
    category: "Data",
    definition:
      "A coordinator asks all participants to prepare, then tells all of them to commit or abort. A participant that prepared must wait for the decision.",
    example:
      "One transaction across the order database and the payment database blocks both if the coordinator crashes.",
    match: ["two-phase commit", "2pc"],
    wiki: "Two-phase_commit_protocol",
    learn: "consensus",
  },
  {
    id: "consensus-algorithm",
    term: "Consensus algorithm",
    category: "Data",
    definition:
      "A protocol that lets a group of nodes agree on one value or one order of a log, while a majority of them works. Raft and Paxos are examples.",
    example: "etcd uses Raft to keep the configuration of a cluster on three nodes.",
    match: ["consensus algorithm", "consensus protocol", "paxos"],
    wiki: "Consensus_(computer_science)",
    learn: "consensus",
  },
  {
    id: "quorum",
    term: "Quorum",
    category: "Data",
    definition:
      "The minimum number of replicas that must answer for an operation to succeed. With N replicas, W + R > N makes each read include a replica with the latest write.",
    example: "N = 3, W = 2, and R = 2 in the key-value store.",
    match: ["quorum"],
    wiki: "Quorum_(distributed_computing)",
    learn: "key-value-store",
  },
  {
    id: "sloppy-quorum",
    term: "Sloppy quorum",
    category: "Data",
    definition:
      "When the usual replicas of a key are down, other available nodes accept its writes. The store stays available, but a quorum read can miss the latest value.",
    example:
      "During a rack failure, the writes for one cart go to two nodes outside its usual set.",
    match: ["sloppy quorum"],
    learn: "key-value-store",
  },
  {
    id: "hinted-handoff",
    term: "Hinted handoff",
    category: "Data",
    definition:
      "A node that accepts a write for a node that is down keeps a note with it. When that node returns, the write goes back to it.",
    example: "Node D sends the cart writes back to node B after B restarts.",
    match: ["hinted handoff"],
    learn: "key-value-store",
  },
  {
    id: "read-repair",
    term: "Read repair",
    category: "Data",
    definition:
      "During a read, the coordinator finds the replicas with an old value and sends them the latest value.",
    example:
      "A read of a cart finds version 7 on two replicas and version 6 on one, and updates the third.",
    match: ["read repair"],
    learn: "key-value-store",
  },
  {
    id: "merkle-tree",
    term: "Merkle tree",
    category: "Data",
    definition:
      "A tree of hashes where each parent is the hash of its children. Two replicas compare the roots and look further only into the parts that differ.",
    example:
      "Two replicas of the key-value store find 10 different keys among a million with few compares.",
    match: ["merkle tree"],
    wiki: "Merkle_tree",
    learn: "key-value-store",
  },
  {
    id: "vector-clock",
    term: "Vector clock",
    category: "Data",
    definition:
      "A list of counters, one for each node, attached to a value. It shows if one version came after another or if the two are concurrent.",
    example:
      "Two phones change a cart offline, and the store keeps both versions for the client to merge.",
    match: ["vector clock"],
    wiki: "Vector_clock",
    learn: "key-value-store",
  },
  {
    id: "last-write-wins",
    term: "Last write wins (LWW)",
    category: "Data",
    definition:
      "A conflict rule that keeps the value with the latest timestamp and silently discards the others. Clock skew can make it discard the real latest write.",
    example:
      "Two edits to a tutor profile arrive at the same time, and one disappears with no error.",
    match: ["last write wins", "last-write-wins"],
    learn: "clocks-and-failures",
  },

  // Data: changes across services and streams
  {
    id: "saga-orchestration",
    term: "Saga orchestration",
    category: "Data",
    definition:
      "An orchestrator tells each participant of a saga what to do and keeps the state of the saga. The full flow is visible in one place.",
    example:
      "A booking orchestrator in the tutor marketplace reserves the slot, charges the card, and releases the slot on a failure.",
    match: ["orchestrated saga", "saga orchestrat"],
    learn: "distributed-transactions",
  },
  {
    id: "saga-choreography",
    term: "Saga choreography",
    category: "Data",
    definition:
      "Each participant of a saga reacts to the events of the others, with no central coordinator. The coupling is low, but the full flow is hard to see.",
    example:
      "In the lunch shop, 'payment taken' starts the kitchen, and 'order ready' starts the notification.",
    match: ["choreograph"],
    learn: "distributed-transactions",
  },
  {
    id: "change-data-capture",
    term: "Change data capture (CDC)",
    category: "Data",
    definition:
      "Read the changes from the log of a database and publish them as a stream of events.",
    example: "Each new row in the orders table goes to the search index through CDC.",
    match: ["change data capture"],
    wiki: "Change_data_capture",
    learn: "batch-and-stream",
  },
  {
    id: "dual-write",
    term: "Dual write",
    category: "Data",
    definition:
      "Application code writes the same change to two systems, such as a database and a broker. If one write fails, the two systems disagree.",
    example: "The service saves an order, crashes, and never publishes 'order placed'.",
    match: ["dual write", "dual-write"],
    learn: "batch-and-stream",
  },
  {
    id: "watermark",
    term: "Watermark",
    category: "Data",
    definition:
      "A point in a stream that says that no more events older than a given event time are expected. It tells a window when it can close.",
    example: "Ad click aggregation closes the 10:00 window when the watermark passes 10:01.",
    match: ["watermark"],
    learn: "batch-and-stream",
  },
  {
    id: "tumbling-window",
    term: "Tumbling window",
    category: "Data",
    definition:
      "Time windows of a fixed length with no overlap. Each event belongs to exactly one window.",
    example: "Count the ad clicks for each minute: 10:00 to 10:01, then 10:01 to 10:02.",
    match: ["tumbling window"],
    learn: "batch-and-stream",
  },
  {
    id: "lambda-architecture",
    term: "Lambda architecture",
    category: "Data",
    definition:
      "A batch layer gives correct results and a stream layer gives fast, approximate results. Reads merge the two.",
    example:
      "Ad clicks are counted in a stream for the dashboard and again each night for billing.",
    match: ["lambda architecture"],
    wiki: "Lambda_architecture",
    learn: "batch-and-stream",
  },
  {
    id: "kappa-architecture",
    term: "Kappa architecture",
    category: "Data",
    definition:
      "Use only stream processing over a durable log. To calculate the results again, replay the log through a new version of the job.",
    example: "After a bug fix, the ad click counter replays the events of the last 7 days.",
    match: ["kappa architecture"],
    learn: "batch-and-stream",
  },
  {
    id: "database-per-service",
    term: "Database per service",
    category: "Data",
    definition:
      "Each service owns its tables, and no other service reads or writes them directly. Other services get the data through an API or events.",
    example:
      "Billing in the parcel service gets parcel weights from events, not from the routing tables.",
    match: ["database per service", "database-per-service"],
    learn: "data-ownership",
  },

  // Data: structures in the system design cases
  {
    id: "double-entry",
    term: "Double-entry bookkeeping",
    category: "Data",
    definition:
      "Record each money movement as at least two entries, a debit and a credit of the same amount. The entries of each movement add up to zero.",
    example: "A lesson payment debits the student account 40 and credits the tutor account 40.",
    match: ["double-entry"],
    wiki: "Double-entry_bookkeeping",
    learn: "payment-system",
  },
  {
    id: "sorted-set",
    term: "Sorted set",
    category: "Data",
    definition:
      "A set where each member has a score and the members stay in score order. It finds the rank of a member and the top members in logarithmic time.",
    example:
      "A Redis sorted set holds the score of each player of the leaderboard. A large set uses a skip list inside.",
    match: ["sorted set"],
    learn: "leaderboard",
  },
  {
    id: "trie",
    term: "Trie",
    category: "Data",
    definition:
      "A tree where each node is one character, so all words with the same prefix share one path. It finds the completions of a prefix fast.",
    example:
      "The autocomplete trie keeps the top 5 queries at each node, such as 'pizza near me' under 'piz'.",
    match: ["prefix tree"],
    wiki: "Trie",
    learn: "autocomplete",
  },
  {
    id: "geohash",
    term: "Geohash",
    category: "Data",
    definition:
      "A code that turns a latitude and a longitude into a short string. Places with a longer shared prefix are usually nearer, but neighbors can have different prefixes at a cell border.",
    example: "A search for lunch shops reads the geohash cell of the user and its eight neighbors.",
    match: ["geohash"],
    wiki: "Geohash",
    learn: "proximity-service",
  },
  {
    id: "quadtree",
    term: "Quadtree",
    category: "Data",
    definition:
      "A tree that divides a map into four squares, and divides again each square that holds too many places.",
    example: "A city center gets many small squares, and an empty area stays one large square.",
    match: ["quadtree", "quad tree"],
    wiki: "Quadtree",
    learn: "proximity-service",
  },
  {
    id: "time-series-database",
    term: "Time-series database",
    category: "Data",
    definition:
      "A database for measurements with a timestamp, stored in time order and compressed. It writes fast and summarizes data over time ranges.",
    example: "Prometheus stores the request count of each service every 15 seconds.",
    match: ["time-series database", "time series database", "tsdb"],
    wiki: "Time_series_database",
    learn: "metrics-monitoring",
  },
  {
    id: "snowflake-id",
    term: "Snowflake ID",
    category: "Data",
    definition:
      "A 64-bit ID made from a timestamp, a machine number, and a sequence number. Each machine makes unique IDs, sorted roughly by time, with no coordination.",
    example: "41 bits of milliseconds, 10 bits of machine ID, and 12 bits of sequence.",
    match: ["snowflake id", "snowflake-style"],
    wiki: "Snowflake_ID",
    learn: "unique-ids",
  },
  {
    id: "delta-sync",
    term: "Delta sync",
    category: "Data",
    definition: "When a file changes, send only the changed blocks, not the whole file.",
    example: "A small edit in a 200 MB file uploads one 4 MB block.",
    match: ["delta sync"],
    learn: "file-sync",
  },
  {
    id: "cache-aside",
    term: "Cache-aside",
    category: "Data",
    definition:
      "The application reads the cache first. On a miss, the application reads the database and puts the result in the cache. In strict read-through, the cache does this load itself.",
    example:
      "The link application looks for a short code in the cache, then in the link store on a miss.",
    match: ["cache-aside"],
    learn: "caching",
  },
  {
    id: "write-through",
    term: "Write-through cache",
    category: "Data",
    definition:
      "Each write goes to the cache and to the database together, so the cache stays fresh. A write-back cache writes to the database later, and can lose data.",
    example:
      "The leaderboard writes a new score to the cache and to the database in the same request.",
    match: ["write-through", "write-back", "write-behind"],
    wiki: "Cache_(computing)",
    learn: "caching",
  },

  // Reliability: clocks, failures, and stability
  {
    id: "fencing-token",
    term: "Fencing token",
    category: "Reliability",
    definition:
      "A number that increases each time a lock or a lease is granted. The protected resource refuses a write with a number lower than one it has seen.",
    example:
      "A paused worker with token 33 wakes up, and storage refuses it because token 34 already wrote.",
    match: ["fencing token"],
    learn: "clocks-and-failures",
  },
  {
    id: "lease",
    term: "Lease",
    category: "Reliability",
    definition:
      "A lock that expires after a fixed time unless the holder renews it. If the holder crashes, the lock becomes free again.",
    example: "A crawler worker holds a 30-second lease on the URL queue of one host.",
    match: [],
    learn: "clocks-and-failures",
  },
  {
    id: "partial-failure",
    term: "Partial failure",
    category: "Reliability",
    definition:
      "Some parts of a distributed system fail while others work. A node often cannot know which parts failed.",
    example:
      "A call to the card provider times out, and the lunch shop does not know if the charge occurred.",
    match: ["partial failure"],
    learn: "clocks-and-failures",
  },
  {
    id: "clock-skew",
    term: "Clock skew",
    category: "Reliability",
    definition:
      "The difference between the clocks of two machines. NTP makes it smaller but cannot remove it, so timestamps from different machines do not give a safe order.",
    example:
      "A server whose clock is 200 ms behind makes its newer edit look older, and last write wins drops it.",
    match: ["clock skew"],
    wiki: "Clock_skew",
    learn: "clocks-and-failures",
  },
  {
    id: "split-brain",
    term: "Split brain",
    category: "Reliability",
    definition:
      "Two nodes both believe that they are the leader, and both accept writes. The two copies of the data then diverge.",
    example: "The network between two database servers breaks, and each server promotes itself.",
    match: ["split brain", "split-brain"],
    wiki: "Split-brain_(computing)",
    learn: "consensus",
  },
  {
    id: "leader-election",
    term: "Leader election",
    category: "Reliability",
    definition:
      "The nodes of a cluster choose one node to coordinate the work. A consensus algorithm makes sure that each term has at most one leader.",
    example: "The three etcd nodes elect a new leader when the old one stops answering.",
    match: ["leader election"],
    wiki: "Leader_election",
    learn: "consensus",
  },
  {
    id: "gossip-protocol",
    term: "Gossip protocol",
    category: "Reliability",
    definition:
      "Each node regularly sends its state to a few random nodes, so information spreads to the whole cluster in a few rounds.",
    example:
      "Nodes of the key-value store share heartbeat counters and mark a node down when its counter stops.",
    match: ["gossip"],
    wiki: "Gossip_protocol",
    learn: "key-value-store",
  },
  {
    id: "circuit-breaker-states",
    term: "Circuit breaker states",
    category: "Reliability",
    definition:
      "Closed lets calls through, and open fails them at once. After a wait, half-open lets a few test calls through and closes again if they succeed.",
    example: "After 30 seconds open, the lunch shop sends one test call to the card provider.",
    match: ["half-open"],
    learn: "resilience",
  },
  {
    id: "load-shedding",
    term: "Load shedding",
    category: "Reliability",
    definition:
      "Refuse a part of the incoming requests on purpose when a system is overloaded, so that it still serves the rest well.",
    example:
      "At the on-sale peak, the ticket seller answers 503 to new visitors and keeps checkout working.",
    match: ["load shedding", "shed load"],
    learn: "stability-antipatterns",
  },
  {
    id: "cascading-failure",
    term: "Cascading failure",
    category: "Reliability",
    definition:
      "A failure in one part overloads or blocks the parts that call it, and the failure spreads through the system.",
    example:
      "A slow address check holds all checkout threads, and then the whole parcel booking site stops.",
    match: ["cascading failure"],
    wiki: "Cascading_failure",
    learn: "stability-antipatterns",
  },
  {
    id: "retry-storm",
    term: "Retry storm",
    category: "Reliability",
    definition:
      "Many clients retry failed calls at the same time and multiply the load on a part that is already in trouble.",
    example: "Three layers each try three times, so one failed call becomes 27 calls.",
    match: ["retry storm"],
    learn: "stability-antipatterns",
  },
  {
    id: "deadline-propagation",
    term: "Deadline propagation",
    category: "Reliability",
    definition:
      "The caller sends its remaining time with each request. Each part downstream stops its work when that time is used.",
    example:
      "Checkout has 2 seconds left, so the price service gets 1.5 seconds and stops after that.",
    match: ["deadline propagation"],
    learn: "resilience",
  },
  {
    id: "erasure-coding",
    term: "Erasure coding",
    category: "Reliability",
    definition:
      "Split data into k data pieces and add m parity pieces. Any k of the k + m pieces can build the data again.",
    example:
      "8 + 4 coding survives the loss of any 4 nodes and uses 1.5 times the space, not 3 times.",
    match: ["erasure cod"],
    wiki: "Erasure_code",
    learn: "object-storage",
  },

  // Scale and speed: distribution, limits, feeds, and markets
  {
    id: "consistent-hashing",
    term: "Consistent hashing",
    category: "Scale and speed",
    definition:
      "Put servers and keys on a hash ring, and give each key to the next server on the ring. A change of servers moves only about 1/N of the keys.",
    example:
      "A fifth cache server takes about one fifth of the keys, and the other servers keep theirs.",
    match: ["consistent hashing", "hash ring"],
    wiki: "Consistent_hashing",
    learn: "consistent-hashing",
  },
  {
    id: "virtual-node",
    term: "Virtual node",
    category: "Scale and speed",
    definition:
      "Each physical server takes many positions on the hash ring. The load is more even, and the keys of a removed server spread over many servers.",
    example: "Each cache server has 200 virtual nodes, and a larger server gets more.",
    match: ["virtual node", "vnode"],
    learn: "consistent-hashing",
  },
  {
    id: "token-bucket",
    term: "Token bucket",
    category: "Scale and speed",
    definition:
      "A bucket fills with tokens at a fixed rate up to a maximum, and each request takes one token. It permits short bursts up to the bucket size.",
    example:
      "10 tokens each second and a size of 20: a client can send 20 at once, then 10 each second.",
    match: ["token bucket"],
    wiki: "Token_bucket",
    learn: "rate-limiter",
  },
  {
    id: "leaky-bucket",
    term: "Leaky bucket",
    category: "Scale and speed",
    definition:
      "Requests go into a queue that a worker empties at a fixed rate. When the queue is full, new requests are dropped.",
    example: "A notification sender passes exactly 50 SMS each second to its provider.",
    match: ["leaky bucket", "leaking bucket"],
    wiki: "Leaky_bucket",
    learn: "rate-limiter",
  },
  {
    id: "fixed-window-counter",
    term: "Fixed window counter",
    category: "Scale and speed",
    definition:
      "Count the requests in fixed time windows, such as each minute, and refuse requests above the limit. A burst at the edge of two windows can double the rate.",
    example: "100 requests at 10:00:59 and 100 at 10:01:00 all pass a limit of 100 each minute.",
    match: ["fixed window"],
    learn: "rate-limiter",
  },
  {
    id: "sliding-window-log",
    term: "Sliding window log",
    category: "Scale and speed",
    definition:
      "Keep a timestamp for each request and count the timestamps inside the last window. It is exact, but it uses memory for each request.",
    example: "A sorted set of timestamps for each API key, cut to the last 60 seconds.",
    match: ["sliding window log"],
    learn: "rate-limiter",
  },
  {
    id: "fanout-on-write",
    term: "Fanout on write",
    category: "Scale and speed",
    definition:
      "When a user posts, copy the post ID into the feed of each follower at once. Reads are fast, but a celebrity post causes millions of writes.",
    example: "A post by a user with 300 followers adds one ID to 300 cached feeds.",
    match: ["fanout on write", "fan-out on write"],
    learn: "news-feed",
  },
  {
    id: "fanout-on-read",
    term: "Fanout on read",
    category: "Scale and speed",
    definition:
      "Build a feed when the user opens it, from the latest posts of the accounts that the user follows. Writes are cheap, but reads are slow.",
    example:
      "The news feed uses fanout on read only for celebrities, and fanout on write for all others.",
    match: ["fanout on read", "fan-out on read"],
    learn: "news-feed",
  },
  {
    id: "littles-law",
    term: "Little's law",
    category: "Scale and speed",
    definition:
      "The average number of requests in a system equals the arrival rate multiplied by the average time that each request stays.",
    example: "1,000 requests each second that take 0.2 seconds each give 200 requests in progress.",
    match: ["little's law"],
    wiki: "Little's_law",
    learn: "scalability",
  },
  {
    id: "base-62",
    term: "Base 62 encoding",
    category: "Scale and speed",
    definition:
      "Write a number with the characters 0-9, a-z, and A-Z. Seven characters give about 3.5 trillion codes.",
    example: "The unique ID 11157 becomes the short code '2TX'.",
    match: ["base 62", "base62", "base-62"],
    learn: "url-shortener",
  },
  {
    id: "url-frontier",
    term: "URL frontier",
    category: "Scale and speed",
    definition:
      "The store of URLs that a crawler fetches next. Front queues set the priority, and back queues keep each host on one queue for politeness.",
    example: "The frontier waits 2 seconds between two fetches from the same site.",
    match: ["url frontier"],
    learn: "web-crawler",
  },
  {
    id: "pre-signed-url",
    term: "Pre-signed URL",
    category: "Scale and speed",
    definition:
      "A temporary URL, signed by the server, that lets a client upload or download one object directly in object storage.",
    example:
      "The app of the video platform uploads a 2 GB file to storage, not through the API servers.",
    match: ["pre-signed url", "presigned url", "signed url"],
    learn: "video-platform",
  },
  {
    id: "order-book",
    term: "Order book",
    category: "Scale and speed",
    definition:
      "The list of all open buy and sell orders for one stock, sorted by price and then by arrival time.",
    example:
      "An order to buy 100 shares at 10.02 waits in the book until a seller asks 10.02 or less.",
    match: ["order book"],
    learn: "stock-exchange",
  },
  {
    id: "sequencer",
    term: "Sequencer",
    category: "Scale and speed",
    definition:
      "A part that gives each incoming message one sequence number with no gaps before processing. All later steps then see the same order.",
    example:
      "The exchange sequencer numbers each order, so the matching engine and its replicas use the same order.",
    match: ["sequencer"],
    learn: "stock-exchange",
  },
  {
    id: "matching-engine",
    term: "Matching engine",
    category: "Scale and speed",
    definition:
      "The part of an exchange that matches buy orders with sell orders in the order book, by price and then by time. It is deterministic, so a replica that replays the same input makes the same trades.",
    example: "A market order to buy 500 shares fills against the lowest sell orders first.",
    match: ["matching engine"],
    learn: "stock-exchange",
  },

  // Operations: signals, incidents, and delivery
  {
    id: "burn-rate",
    term: "Burn rate",
    category: "Operations",
    definition:
      "How fast a service uses its error budget, compared with the planned speed. A burn rate of 1 uses the full budget in exactly one window.",
    example: "A burn rate of 14.4 uses 2% of a 30-day budget in one hour.",
    match: ["burn rate", "burn-rate"],
    learn: "observability",
  },
  {
    id: "golden-signals",
    term: "Four golden signals",
    category: "Operations",
    definition:
      "Latency, traffic, errors, and saturation: the four measures to watch first for any service that users call.",
    example:
      "The tracking API of the parcel service shows p99 latency, requests each second, error share, and CPU use.",
    match: ["golden signals"],
    learn: "observability",
  },
  {
    id: "toil",
    term: "Toil",
    category: "Operations",
    definition:
      "Manual, repeated operations work that a machine could do. It grows with the service and leaves no lasting value.",
    example: "Each morning, an engineer restarts the stuck export job of the lunch shop by hand.",
    match: [],
    learn: "incident-response",
  },
  {
    id: "blameless-postmortem",
    term: "Blameless postmortem",
    category: "Operations",
    definition:
      "A written review of an incident that looks for the causes in systems and processes, not in people. It ends with actions that have owners.",
    example:
      "After the on-sale outage, the ticket seller adds a queue limit and does not blame one engineer.",
    match: ["postmortem", "post-mortem"],
    learn: "incident-response",
  },
  {
    id: "incident-commander",
    term: "Incident commander",
    category: "Operations",
    definition:
      "The one person who coordinates the response to an incident. Other people do the technical work, the communication, and the notes.",
    example:
      "During the payment outage, the incident commander gives one engineer the provider and one the status page.",
    match: ["incident commander"],
    wiki: "Incident_Command_System",
    learn: "incident-response",
  },
  {
    id: "lead-time-for-changes",
    term: "Lead time for changes",
    category: "Operations",
    definition: "The time from a code commit to that code running in production.",
    example: "A parcel service fix committed at 10:00 is live at 11:30: a lead time of 90 minutes.",
    match: ["lead time for changes"],
    learn: "delivery-performance",
  },
  {
    id: "deployment-frequency",
    term: "Deployment frequency",
    category: "Operations",
    definition: "How often a team deploys to production.",
    example: "The lunch shop team deploys several times each day.",
    match: ["deployment frequency"],
    learn: "delivery-performance",
  },
  {
    id: "change-failure-rate",
    term: "Change failure rate",
    category: "Operations",
    definition:
      "The share of deployments that cause a failure in production and need a fix, a rollback, or a patch.",
    example: "3 failed deployments of 60 in one month give a change failure rate of 5%.",
    match: ["change failure rate"],
    learn: "delivery-performance",
  },
  {
    id: "time-to-restore",
    term: "Time to restore service",
    category: "Operations",
    definition:
      "How long it takes to bring service back after a failure that affects users. Later DORA reports name it failed deployment recovery time.",
    example: "A bad release of the ticket seller is rolled back in 12 minutes.",
    match: ["time to restore", "mttr"],
    learn: "delivery-performance",
  },

  // Building blocks: infrastructure and providers
  {
    id: "service-mesh",
    term: "Service mesh",
    category: "Building blocks",
    definition:
      "A layer of proxies, usually a sidecar next to each service, that handles the traffic between services: encryption, retries, timeouts, and metrics.",
    example: "The mesh gives each parcel service mutual TLS with no change to the service code.",
    match: ["service mesh", "sidecar"],
    wiki: "Service_mesh",
    learn: "microservices",
  },
  {
    id: "psp",
    term: "Payment service provider (PSP)",
    category: "Building blocks",
    definition:
      "A company that processes card payments for a merchant and connects it to the card networks and the banks.",
    example: "The lunch shop sends each charge to its PSP and never sees the card number.",
    match: ["payment service provider", "psp"],
    wiki: "Payment_service_provider",
    learn: "payment-system",
  },

  // Security: trust between services
  {
    id: "zero-trust",
    term: "Zero trust",
    category: "Security",
    definition:
      "No request gets trust because of its network location. Each request must prove its identity and its permission, also inside the company network.",
    example:
      "The billing service of the tutor marketplace checks a token on each call, also from internal services.",
    match: ["zero trust", "zero-trust"],
    learn: "security",
  },
  {
    id: "jwt",
    term: "JSON Web Token (JWT)",
    category: "Security",
    definition:
      "A signed token that carries claims about a user, such as an ID and an expiry time. A service can check it with no call to the issuer, but it is hard to cancel early.",
    example:
      "The API gateway of the parcel service checks the JWT signature and passes the user ID downstream.",
    match: ["jwt", "json web token"],
    wiki: "JSON_Web_Token",
    learn: "security",
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
