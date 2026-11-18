export type Level = "basic" | "intermediate" | "advanced";

export type LessonMeta = { level: Level; objectives: string[] };

export const levelLabel: Record<Level, string> = {
  basic: "Basic",
  intermediate: "Intermediate",
  advanced: "Advanced",
};

// The level and the learning objectives of each Learn page, by slug.
// basic: needs no earlier lesson. intermediate: uses ideas from basic lessons.
// advanced: combines several areas, or is about hard trade-offs in distributed systems.
// Each objective completes the sentence "After this lesson, you can ...".
export const lessonMeta: Record<string, LessonMeta> = {
  "architect-role": {
    level: "basic",
    objectives: [
      "Place a decision on the spectrum between architecture and design.",
      "Name the eight expectations of an architect and the two laws.",
      "Explain the knowledge pyramid and why an architect grows in breadth.",
      "Use the elevator and options ideas to explain decisions to executives.",
    ],
  },
  method: {
    level: "basic",
    objectives: [
      "Find the sentences that make a kata difficult, and set the scope.",
      "Select three driving characteristics and the simplest style that supports them.",
      "Draw components with one responsibility, clear data owners, and labeled arrows.",
      "State what your design gives up and where it fails first.",
    ],
  },
  "trade-offs": {
    level: "intermediate",
    objectives: [
      "Analyze a decision with the five-step method and a MECE list of options.",
      "Walk real domain cases through each option to find the deciding cost.",
      "Tell when to use qualitative analysis and when to use numbers.",
      "Present the bottom line: the choice, the cost, and the review signal.",
    ],
  },
  "decision-records": {
    level: "intermediate",
    objectives: [
      "Write an ADR with context, decision, consequences, compliance, and notes.",
      "Use the ADR statuses, and supersede an accepted ADR with a new one.",
      "Find and fix covering your assets, groundhog day, and email-driven architecture.",
      "Govern a decision with an automated check that links to its ADR.",
    ],
  },
  "interview-format": {
    level: "intermediate",
    objectives: [
      "Plan a 45-minute system design interview with the four-step framework.",
      "Set the scope with questions that change the design.",
      "Get buy-in on a first design, then go deep on the hardest part.",
      "Give senior answers that name the need, the option, and the cost.",
    ],
  },
  "behavioral-interviews": {
    level: "basic",
    objectives: [
      "Explain what a behavioral panel scores for senior and architect roles.",
      "Structure an answer with STAR and a reflection in three minutes.",
      "Build a story bank that covers each competency with true stories.",
      'Avoid the common mistakes: all "we", no result, blame, and hero stories.',
    ],
  },
  characteristics: {
    level: "basic",
    objectives: [
      "Tell an architecture characteristic apart from a feature.",
      "Explain the meaning of twelve common architecture characteristics.",
      "Find the signals in a kata text that point to each characteristic.",
      "Explain how the selected characteristics decide the style.",
    ],
  },
  "measuring-characteristics": {
    level: "intermediate",
    objectives: [
      "Tell explicit characteristics apart from implicit ones in a requirements text.",
      "Sort a measure as operational, structural, or process.",
      "Turn a vague quality into a percentile target at a stated load.",
      "Write fitness functions for cycles, layer rules, and latency.",
    ],
  },
  modularity: {
    level: "intermediate",
    objectives: [
      "Rank the types of cohesion from functional to coincidental.",
      "Calculate instability and distance from the main sequence for a component.",
      "Classify coupling with connascence, and judge it by strength, locality, and degree.",
      "Name domain, pass-through, common, and content coupling between services.",
    ],
  },
  boundaries: {
    level: "intermediate",
    objectives: [
      "Compare technical partitioning with domain partitioning.",
      "Find first components with actor/actions, event storming, or workflows.",
      "Improve components with the identification flow, and avoid the entity trap.",
      "Use information hiding and bounded contexts to place service boundaries.",
    ],
  },
  "bounded-contexts": {
    level: "intermediate",
    objectives: [
      "Explain a bounded context and how it differs from a microservice.",
      "Find candidate contexts with language shifts and pivotal events from event storming.",
      "Draw a context map and name the pattern on each relationship.",
      "Separate core, supporting, and generic subdomains, and decide what to build.",
    ],
  },
  distributed: {
    level: "advanced",
    objectives: [
      "List the eight fallacies of distributed computing, and the design answer to each.",
      "Explain partial failure, and why a timeout cannot tell slow from dead.",
      "Name the costs of distribution: logging, transactions, and contract maintenance.",
      "Tell when a distributed design or microservices are a bad idea.",
    ],
  },
  "architecture-quantum": {
    level: "advanced",
    objectives: [
      "Define an architecture quantum with its four properties.",
      "Tell static coupling apart from dynamic coupling between services.",
      "Explain why a shared database makes several services one quantum.",
      "Count the quanta in a design and scope characteristics to each.",
    ],
  },
  "service-granularity": {
    level: "advanced",
    objectives: [
      "Name the six disintegrators and the four integrators of service granularity.",
      "Turn each granularity force into a business result for a product owner.",
      "Recognize nano-services and explain how to join them.",
      "Justify each split and each join in a design with a named force.",
    ],
  },
  "decomposing-a-monolith": {
    level: "advanced",
    objectives: [
      "Apply the six component-based decomposition patterns in order.",
      "Select component-based decomposition or tactical forking for a codebase.",
      "Use the strangler fig, branch by abstraction, and parallel run to migrate.",
      "Plan the order of code and data moves, and select the first part.",
    ],
  },
  styles: {
    level: "intermediate",
    objectives: [
      "Decide between a monolithic and a distributed style from the characteristics.",
      "Name the usual partitioning of each style, technical or domain.",
      "Explain what service-oriented architecture taught about reuse and coupling.",
      "Select a style with a procedure, and name the trigger to change it.",
    ],
  },
  layered: {
    level: "basic",
    objectives: [
      "Explain closed and open layers, and the isolation that closed layers give.",
      "Add a layer for shared code, and mark it open or closed.",
      "Find the sinkhole anti-pattern with the rough 80-20 rule.",
      "Explain why a feature change touches every layer, and how to evolve.",
    ],
  },
  "modular-monolith": {
    level: "intermediate",
    objectives: [
      "Divide one deployment into modules with interfaces, internals, and own schemas.",
      "Enforce module boundaries with fitness functions, package rules, and database users.",
      "Choose direct calls, in-process events, or a mediator between modules.",
      "Plan the move of one module to a service, and avoid a distributed monolith.",
    ],
  },
  microkernel: {
    level: "intermediate",
    objectives: [
      "Separate a core system from plug-ins, and find the line between them.",
      "Design a plug-in registry and a versioned contract.",
      "Compare plug-ins at compile time, at run time, and remote.",
      "Name the limits of a microkernel, and when another style fits better.",
    ],
  },
  "service-based": {
    level: "intermediate",
    objectives: [
      "Compare the user interface and database variants of service-based architecture.",
      "Explain how coarse services keep ACID transactions inside one service.",
      "Partition a shared database and its entity libraries to limit schema changes.",
      "Plan how a service-based system evolves toward microservices, one service at a time.",
    ],
  },
  "event-driven": {
    level: "advanced",
    objectives: [
      "Compare the broker and mediator topologies and select one for a flow.",
      "Prevent data loss at the producer, the broker, and the consumer.",
      "Handle failed messages with the workflow event pattern and dead-letter queues.",
      "Choose between request-based and event-based models, including request-reply over messaging.",
    ],
  },
  microservices: {
    level: "intermediate",
    objectives: [
      "Draw service boundaries from bounded contexts, transactions, and communication patterns.",
      "Explain data isolation, the API layer, and sidecars in a service mesh.",
      "Compare choreography and orchestration for a flow across services.",
      "Tell when microservices are a poor choice and name a simpler alternative.",
    ],
  },
  "space-based": {
    level: "advanced",
    objectives: [
      "Explain processing units, the virtualized middleware, data pumps, writers, and readers.",
      "Estimate the data collision rate and name ways to remove collisions.",
      "Choose between a replicated and a distributed cache for each kind of data.",
      "Tell when extreme, sudden load peaks justify a space-based design.",
    ],
  },
  pipeline: {
    level: "basic",
    objectives: [
      "Name the four kinds of filter and the role of each.",
      "Design a one-way pipeline for ETL or EDI, with a plan for bad records.",
      "Explain how a pipeline relates to distributed stream processing.",
      "Name the limits of a pipeline for interactive work and feedback.",
    ],
  },
  "building-blocks": {
    level: "basic",
    objectives: [
      "Name the standard pieces of a system design and what each does.",
      "Select a piece from the signal in a problem that calls for it.",
      "Tell what each piece costs when you add it to a design.",
      "Tell a synchronous call from an asynchronous message on a diagram.",
    ],
  },
  "code-architecture": {
    level: "basic",
    objectives: [
      "Tell system architecture from application architecture, and place decisions on one spectrum.",
      "Compare technical partitioning with domain partitioning of a code base.",
      "Explain how dependency inversion makes dependencies point toward the business logic.",
      "Tell strategic from tactical programming, and select the simplest suitable structure.",
    ],
  },
  "deep-modules": {
    level: "intermediate",
    objectives: [
      "Name the three symptoms of complexity and its two causes.",
      "Tell a deep module from a shallow one, and explain the difference.",
      "Find information leakage, temporal decomposition, and pass-through methods in a design.",
      "Apply deep-module rules to service boundaries and their error handling.",
    ],
  },
  hexagonal: {
    level: "intermediate",
    objectives: [
      "Name the ports, adapters, and other parts of hexagonal architecture.",
      "Test a hexagonal application through its ports, with contract tests for adapters.",
      "Place transaction boundaries and messaging adapters, and avoid the dual write.",
      "Decide where mapping is worth its cost, and when hexagonal is over-engineering.",
    ],
  },
  "clean-onion": {
    level: "intermediate",
    objectives: [
      "Explain the dependency rule, and how control crosses a boundary outward.",
      "Translate names between hexagonal, onion, and clean architecture.",
      "Weigh the cost of mapping data between rings against what it protects.",
      "Find over-engineering in a clean code base, and reduce the rings.",
    ],
  },
  dependencies: {
    level: "intermediate",
    objectives: [
      "Explain dependency injection and the role of the composition root.",
      "Find a dependency that is a concrete class and not an interface.",
      "Tell a stub, a fake, a mock, and a spy apart.",
      "Select a way to check the direction of dependencies automatically.",
    ],
  },
  "vertical-slices": {
    level: "intermediate",
    objectives: [
      "Compare code grouped by feature with code grouped by layer.",
      "Tell real duplication from accidental duplication, and decide what to share.",
      "Use a small shared kernel without a growing common folder.",
      "Map slices to bounded contexts and to stream-aligned teams.",
    ],
  },
  "domain-model": {
    level: "intermediate",
    objectives: [
      "Use entities, value objects, domain services, factories, and repositories correctly.",
      "Draw small aggregate boundaries from the invariants that must stay consistent.",
      "Handle a rule that spans aggregates with events, constraints, or a new aggregate.",
      "Find an anemic domain model, and move rules into the entities.",
    ],
  },
  "cqrs-event-sourcing": {
    level: "advanced",
    objectives: [
      "Tell CQRS, event sourcing, change data capture, and event-driven architecture apart.",
      "Build projections, and rebuild a read model with no downtime.",
      "Use snapshots and event versioning to keep an event store usable.",
      "Weigh the costs of event sourcing, and tell when to say no.",
    ],
  },
  "data-stores": {
    level: "intermediate",
    objectives: [
      "Select a data store from its access patterns and the relations in the data.",
      "Compare the relational, document, and graph models, and schema-on-read with schema-on-write.",
      "Tell OLTP from OLAP workloads, and keep reports away from the live store.",
      "Rate store types against characteristics, and justify a database for each service.",
    ],
  },
  "storage-engines": {
    level: "intermediate",
    objectives: [
      "Explain how an LSM-tree writes, reads, and compacts data.",
      "Compare LSM-trees and B-trees for writes, reads, space, and latency.",
      "Select primary, secondary, and covering indexes for the main queries.",
      "Explain why analytic loads use warehouses, star schemas, and column storage.",
    ],
  },
  consistency: {
    level: "intermediate",
    objectives: [
      "Explain the four ACID promises, and why consistency is the application's job.",
      "Compare linearizable, causal, and the guarantees for one user, such as read-your-writes.",
      "Use CAP and PACELC to state the trade-off for each kind of data.",
      "Name where a design needs linearizability, and keep that part small.",
    ],
  },
  "transactions-isolation": {
    level: "advanced",
    objectives: [
      "Name the anomalies that each isolation level prevents and allows.",
      "Explain how MVCC gives each transaction a consistent snapshot.",
      "Prevent lost updates with atomic writes, locks, or compare-and-set.",
      "Recognize write skew and phantoms, and select a fix for each.",
    ],
  },
  "distributed-transactions": {
    level: "advanced",
    objectives: [
      "Explain how two-phase commit works, and why it blocks.",
      "Classify the eight saga patterns by communication, consistency, and coordination.",
      "Design a saga with compensations, ordered steps, and named states.",
      "Use an outbox and idempotency keys to make each step safe to repeat.",
    ],
  },
  "data-ownership": {
    level: "advanced",
    objectives: [
      "Weigh data disintegrators against integrators to decide if data must split.",
      "Split a monolithic database in five steps, from data domains to servers.",
      "Assign an owner to each table with single, common, or joint ownership.",
      "Choose a pattern to read data that another service owns.",
    ],
  },
  caching: {
    level: "intermediate",
    objectives: [
      "Select where a cache goes, how data gets in, and how it leaves.",
      "Protect a cache against stampedes, hot keys, and a cold restart.",
      "Design cache keys with versions, and negative caching for missing records.",
      "Set CDN caching with HTTP headers, versioned file names, and purges.",
    ],
  },
  "scaling-data": {
    level: "advanced",
    objectives: [
      "Compare single-leader, multi-leader, and leaderless replication, and their failure modes.",
      "Explain quorums, sloppy quorums, and hinted handoff, and their limits.",
      "Select key-range or hash partitioning, and local or global secondary indexes.",
      "Select a rebalancing strategy and a way to route requests to partitions.",
    ],
  },
  "clocks-and-failures": {
    level: "advanced",
    objectives: [
      "Explain why a caller cannot tell a slow node from a failed one.",
      "Use monotonic clocks for durations, and avoid ordering events by timestamps.",
      "Protect a resource from paused lease holders with fencing tokens.",
      "Describe the usual system model and the difference between safety and liveness.",
    ],
  },
  consensus: {
    level: "advanced",
    objectives: [
      "Tell linearizability apart from serializability, and state its costs.",
      "Explain why total order broadcast solves uniqueness and Lamport timestamps do not.",
      "Compare two-phase commit with consensus when a node fails.",
      "Select tasks for ZooKeeper or etcd, and tasks to keep out of them.",
    ],
  },
  "batch-and-stream": {
    level: "advanced",
    objectives: [
      "Explain how MapReduce and dataflow engines run batch jobs and joins.",
      "Choose between a traditional message broker and a log-based broker.",
      "Keep derived stores correct with change data capture instead of dual writes.",
      "Select a window type and handle late events with event time and watermarks.",
    ],
  },
  "analytical-data": {
    level: "advanced",
    objectives: [
      "Separate operational and analytical data, and explain why reports need a copy.",
      "Compare ETL and ELT, and choose how each service publishes data.",
      "Compare the data warehouse, data lake, and data mesh with their trade-offs.",
      "Design data product quanta that connect services to analytics without coupling.",
    ],
  },
  "sync-async": {
    level: "intermediate",
    objectives: [
      "Tell blocking from nonblocking calls, and request-response from event-driven collaboration.",
      "Calculate the availability and latency of a chain of synchronous calls.",
      "Explain temporal coupling, and what a queue removes and does not remove.",
      "Design an asynchronous answer with a status resource, webhook, or open connection.",
    ],
  },
  messaging: {
    level: "intermediate",
    objectives: [
      "Compare a message broker with a log-based broker, and select one.",
      "Explain partitions, consumer groups, offsets, and replay, and how they limit order.",
      "Design receivers safe to repeat, with dead-letter queues for poison messages.",
      "Select drop, buffer, or backpressure when producers are faster than consumers.",
    ],
  },
  "api-design": {
    level: "intermediate",
    objectives: [
      "Compare REST, gRPC, GraphQL, and events, and select one for a use.",
      "Tell strict contracts from loose contracts, and find stamp coupling.",
      "Change an API safely with expand and contract and coexisting endpoints.",
      "Explain Postel's law, its limits, and how consumer-driven contracts find breaks.",
    ],
  },
  "encoding-and-evolution": {
    level: "intermediate",
    objectives: [
      "Define backward and forward compatibility, and say when each is necessary.",
      "Compare JSON, Protocol Buffers, Thrift, and Avro for a given dataflow.",
      "Tell safe schema changes from unsafe ones, such as a reused field tag.",
      "Explain why a network call is not like a local function call.",
    ],
  },
  resilience: {
    level: "advanced",
    objectives: [
      "Explain why a slow part is worse than a part that is down.",
      "Select the stability patterns of Release It! for each risk in a design.",
      "Set safe rules for retries, with backoff, jitter, budgets, and limits.",
      "Tell load shedding from back pressure, and design fallbacks for each dependency.",
    ],
  },
  "stability-antipatterns": {
    level: "intermediate",
    objectives: [
      "Explain how a fault becomes an error and then a failure.",
      "Name the twelve stability antipatterns and the symptom of each one.",
      "Select the stability pattern that stops each antipattern in a design.",
      "Find shared resources and unbalanced capacities that let a crack spread.",
    ],
  },
  scalability: {
    level: "intermediate",
    objectives: [
      "Tell performance, scalability, and elasticity apart, and select the one a problem needs.",
      "Describe load with load parameters, and performance with percentiles.",
      "Calculate tail latency amplification, and name ways to reduce it.",
      "Find the part that reaches its limit first, and select the move for it.",
    ],
  },
  estimation: {
    level: "basic",
    objectives: [
      "Calculate peak requests each second and storage over years with rounded numbers.",
      "Use powers of two and latency orders of magnitude to compare design options.",
      "Turn an availability target into downtime, and combine parts in chains.",
      "Describe load with the right load parameters, and state what each number means.",
    ],
  },
  observability: {
    level: "intermediate",
    objectives: [
      "Select the four golden signals and SLIs as ratios of good to valid events.",
      "Explain SLI, SLO, and SLA, and apply an error budget with a policy.",
      "Design alerts on symptoms, with burn rates, and detect silent failures.",
      "Connect logs and traces across services with correlation IDs and spans.",
    ],
  },
  "incident-response": {
    level: "basic",
    objectives: [
      "Describe a healthy on-call rotation and the cost of operational overload.",
      "Run an incident with a commander and separate operations and communication roles.",
      "Write a blameless postmortem with a timeline, causes, and owned action items.",
      "Identify toil and explain why SRE teams limit operations work to 50%.",
    ],
  },
  deployment: {
    level: "intermediate",
    objectives: [
      "Apply the five deployment principles and keep deploy and release apart.",
      "Compare rolling, blue-green, canary, and feature flag release strategies.",
      "Judge a canary against a control group with a few SLIs.",
      "Change a database with expand and contract so that two versions run together.",
    ],
  },
  "delivery-performance": {
    level: "intermediate",
    objectives: [
      "Define the four key metrics and measure them from your own tools.",
      "Explain why speed and stability improve together instead of trading off.",
      "Show how coupling in the architecture hurts each delivery metric.",
      "Tell pathological, bureaucratic, and generative cultures apart.",
    ],
  },
  "testing-strategy": {
    level: "intermediate",
    objectives: [
      "Choose the right level for each test: unit, service, or end-to-end.",
      "Explain why end-to-end tests become flaky, brittle, and a coupling between teams.",
      "Use consumer-driven contracts to test each service alone.",
      "Plan safe tests in production and cross-functional tests with misbehaving harnesses.",
    ],
  },
  security: {
    level: "intermediate",
    objectives: [
      "Choose between zero trust and implicit trust, using mTLS and short-lived tokens.",
      "Prevent the confused deputy problem with ownership checks in the owning service.",
      "Manage secrets through their life, from creation to revocation.",
      "Model threats with STRIDE on each arrow that crosses a trust boundary.",
    ],
  },
  diagrams: {
    level: "basic",
    objectives: [
      "Name the four C4 levels and the three supporting C4 diagrams.",
      "Draw a container diagram with titles, labeled lines, consistent shapes, and a key.",
      "Select the correct diagram type for a question about the system.",
      "Present a design with incremental builds, and tell an infodeck from a talk.",
    ],
  },
  "risk-assessment": {
    level: "intermediate",
    objectives: [
      "Rate a risk with the risk matrix of impact and likelihood.",
      "Build a risk assessment by characteristic and area, with risk direction.",
      "Run a risk storming session through identification, consensus, and mitigation.",
      "Present the high risks and mitigation options to business stakeholders.",
    ],
  },
  evolution: {
    level: "advanced",
    objectives: [
      "Plan a migration with strangler fig, branch by abstraction, and parallel run.",
      "Select decorating collaborator or change data capture when old code cannot change.",
      "Write atomic, holistic, triggered, and continual fitness functions for architecture rules.",
      "Sort technical debt by type, and argue for a change in business terms.",
    ],
  },
  teams: {
    level: "intermediate",
    objectives: [
      "Use Conway's law and the inverse Conway maneuver to match teams and design.",
      "Set the right level of control for a team, between control freak and armchair.",
      "Negotiate with business stakeholders, other architects, and developers.",
      "Use the architect elevator to connect strategy with the technology.",
    ],
  },
  "team-topologies": {
    level: "intermediate",
    objectives: [
      "Name the four team types and the purpose of each.",
      "Select an interaction mode for two teams, and say when it changes.",
      "Use cognitive load to limit what one team owns.",
      "Use Conway's law and fracture planes to assign teams to components.",
    ],
  },
  "reading-list": {
    level: "basic",
    objectives: [
      "Select the two core books to read first.",
      "Find the book parts and the app lessons for each topic.",
      "Follow a seven-week reading plan with lessons and katas for interviews.",
      "Change the reading plan to match the role and your weakest areas.",
    ],
  },
  "scale-step-by-step": {
    level: "basic",
    objectives: [
      "Grow a web system from one server to many regions in a clear order.",
      "Name the problem that each new part solves and the problem it brings.",
      "Explain replica lag, stateless web servers, and when to shard.",
      "Find the single points of failure in a growing design.",
    ],
  },
  "rate-limiter": {
    level: "intermediate",
    objectives: [
      "Compare the five rate limiting algorithms and pick one for a use case.",
      "Choose where a rate limiter runs and what key it counts.",
      "Prevent race conditions on a shared counter with atomic operations.",
      "Design limits across many data centers and state the accepted overshoot.",
    ],
  },
  "consistent-hashing": {
    level: "intermediate",
    objectives: [
      "Explain why modulo hashing moves most keys when servers change.",
      "Place keys and replicas on a hash ring with virtual nodes.",
      "Calculate how many keys move when a server is added or removed.",
      "Compare the ring with fixed partitions and rendezvous hashing.",
    ],
  },
  "key-value-store": {
    level: "advanced",
    objectives: [
      "Design a leaderless key-value store with partitions and replicas.",
      "Tune N, W, and R, and explain the limits of quorums.",
      "Detect and merge conflicting writes with vector clocks.",
      "Explain gossip, hinted handoff, Merkle trees, and the LSM write path.",
    ],
  },
  "unique-ids": {
    level: "intermediate",
    objectives: [
      "Compare auto-increment, UUID, ticket server, and Snowflake-style IDs.",
      "Calculate the capacity and lifetime of a 64-bit ID layout.",
      "Protect an ID generator against clock steps and duplicate machine IDs.",
      "Explain how the ID order affects index locality and hot ranges.",
    ],
  },
  "url-shortener": {
    level: "basic",
    objectives: [
      "Calculate the code length from the link volume and the lifetime.",
      "Compare hash codes with collision checks against base 62 of unique IDs.",
      "Choose between 301 and 302 redirects from the analytics needs.",
      "Design a cached read path, custom aliases, expiry, and abuse controls.",
    ],
  },
  "web-crawler": {
    level: "intermediate",
    objectives: [
      "Design a URL frontier with priority queues and polite per-host queues.",
      "Explain how a Bloom filter and content fingerprints prevent repeat work.",
      "Name common spider traps and the limits that stop them.",
      "Plan recrawl intervals and partition the crawl across servers by host.",
    ],
  },
  "notification-system": {
    level: "intermediate",
    objectives: [
      "Design queues for each channel and priority, so urgent messages never wait.",
      "Explain why delivery is at least once, and how deduplication limits repeats.",
      "Handle provider failures with retries, dead-letter queues, and a second provider.",
      "Apply user settings, opt-out rules, rate limits, and queue-age monitoring.",
    ],
  },
  "news-feed": {
    level: "advanced",
    objectives: [
      "Describe the publish path and the read path of a news feed.",
      "Compare fanout on write with fanout on read, using estimated numbers.",
      "Design the hybrid fanout that handles accounts with millions of followers.",
      "Use cache tiers and cursor pagination to keep feed reads fast.",
    ],
  },
  autocomplete: {
    level: "intermediate",
    objectives: [
      "Explain how a trie with top k at each node gives fast answers.",
      "Limit the trie size with prefix limits and popularity thresholds.",
      "Build and publish the trie from query logs with batch jobs.",
      "Shard the data by prefix with an even spread, and filter unsafe suggestions.",
    ],
  },
  "chat-system": {
    level: "intermediate",
    objectives: [
      "Choose between polling, long polling, and WebSocket for real-time delivery.",
      "Route a message to the stateful chat server that holds the receiver.",
      "Keep one message order with a sequence number for each conversation.",
      "Sync many devices with cursors, and show presence with heartbeats.",
    ],
  },
  "video-platform": {
    level: "advanced",
    objectives: [
      "Design a resumable upload with pre-signed URLs to object storage.",
      "Model transcoding as a DAG of tasks that run in parallel.",
      "Explain adaptive bitrate streaming with HLS and DASH segments.",
      "Reduce delivery cost with the CDN for popular videos and origin for others.",
    ],
  },
  "file-sync": {
    level: "advanced",
    objectives: [
      "Explain how blocks, hashes, and delta sync reduce bandwidth and storage.",
      "Keep file metadata strongly consistent while blocks stay immutable.",
      "Notify devices of changes with long polling and per-device cursors.",
      "Resolve concurrent edits with first writer wins and a conflicted copy.",
    ],
  },
  "payment-system": {
    level: "advanced",
    objectives: [
      "Prevent double charges with idempotency keys and idempotent receivers.",
      "Handle PSP timeouts, retries, and webhooks without guessing the state.",
      "Record money movements in an append-only double-entry ledger.",
      "Find mismatches with daily reconciliation against the PSP settlement file.",
    ],
  },
  "proximity-service": {
    level: "intermediate",
    objectives: [
      "Explain why a normal index cannot answer a two-dimensional range search.",
      "Select a geohash length for a radius, and handle cell boundary issues.",
      "Compare geohash, quadtree, and S2, and select one for a design.",
      "Design the search path with cells in a cache, filtering, and ranking.",
    ],
  },
  "message-queue": {
    level: "advanced",
    objectives: [
      "Explain how a broker stores partitions as segmented append-only logs.",
      "Describe the producer flow, batching, pull consumers, and group rebalancing.",
      "Select ACK settings and a minimum ISR size for a durability target.",
      "Match producer and commit settings to each delivery promise.",
    ],
  },
  "metrics-monitoring": {
    level: "intermediate",
    objectives: [
      "Describe the time-series data model and the danger of high cardinality.",
      "Compare pull and push collection, and place a queue before the store.",
      "Explain why a time-series database fits, with compression and downsampling.",
      "Design an alerting flow with rules, deduplication, grouping, and channels.",
    ],
  },
  "ad-click-aggregation": {
    level: "advanced",
    objectives: [
      "Design a map, aggregate, and reduce graph for counts and top ads.",
      "Use event-time windows and watermarks, and select a policy for late events.",
      "Get exactly-once counts with click IDs, committed offsets, and idempotent writes.",
      "Handle hot ads, snapshots, and a daily reconciliation with batch.",
    ],
  },
  "hotel-reservation": {
    level: "intermediate",
    objectives: [
      "Model hotel inventory by room type and date.",
      "Prevent double bookings with idempotency keys, locks, and database constraints.",
      "Treat overbooking as a business rule that the system still enforces.",
      "Keep reservations, inventory, and payments consistent across service boundaries.",
    ],
  },
  leaderboard: {
    level: "intermediate",
    objectives: [
      "Explain why a rank query on a relational table does not scale.",
      "Design a real-time leaderboard with a Redis sorted set.",
      "Break ties, reset boards each month, and rebuild them from events.",
      "Compare score range and hash sharding, and their read costs.",
    ],
  },
  "object-storage": {
    level: "advanced",
    objectives: [
      "Separate object metadata from object data, and partition each store.",
      "Describe the write and read paths through data nodes and placement.",
      "Calculate the storage overhead of replication and erasure coding.",
      "Explain checksums, merged small files, multipart upload, versioning, and garbage collection.",
    ],
  },
  "stock-exchange": {
    level: "advanced",
    objectives: [
      "Trace an order from the broker to the matching engine and back.",
      "Explain the order book, price-time priority, and the role of the sequencer.",
      "Design a low-latency critical path on one server and one thread.",
      "Recover and fail over a matching engine with event sourcing and consensus.",
    ],
  },
};
