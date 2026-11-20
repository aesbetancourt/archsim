import { styleLessons } from "./learn";

export type WikiPage = {
  slug: string;
  title: string;
  summary: string;
  // A custom page is drawn by a component. An article is a Markdown file in content/learn.
  kind: "article" | "method" | "characteristics" | "styles" | "style" | "blocks";
  related?: string[];
  // The slug of a page that this page belongs under in the sidebar. The reading order does not change.
  parent?: string;
};

export type WikiSection = { title: string; pages: WikiPage[] };

const article = (
  slug: string,
  title: string,
  summary: string,
  related: string[] = [],
): WikiPage => ({
  slug,
  title,
  summary,
  kind: "article",
  related,
});

// The sections and pages of the Learn area, in reading order.
export const wikiSections: WikiSection[] = [
  {
    title: "Start here",
    pages: [
      article(
        "architect-role",
        "What a software architect does",
        "The job, the decisions that are yours, and the way architects think.",
        ["trade-offs", "teams"],
      ),
      {
        slug: "method",
        title: "How to do a kata",
        summary: "Five steps from a problem text to a design you can defend.",
        kind: "method",
        related: ["characteristics", "styles", "interview-format"],
      },
      article(
        "trade-offs",
        "How to analyze a trade-off",
        "A repeatable way to compare options and explain the choice.",
        ["decision-records", "characteristics"],
      ),
      article(
        "decision-records",
        "Architecture decision records",
        "A short document format that keeps the reason for each decision.",
        ["trade-offs", "evolution"],
      ),
      article(
        "interview-format",
        "The system design interview",
        "How to use 45 minutes: questions, numbers, design, and deep dives.",
        ["method", "estimation"],
      ),
      article(
        "behavioral-interviews",
        "Behavioral interviews",
        "The questions about your past work, and how to answer them with true stories.",
        ["interview-format", "teams", "architect-role"],
      ),
    ],
  },
  {
    title: "Characteristics",
    pages: [
      {
        slug: "characteristics",
        title: "Architecture characteristics",
        summary: "The qualities a system must have, and how to find them in a problem.",
        kind: "characteristics",
        related: ["trade-offs", "observability"],
      },
      article(
        "measuring-characteristics",
        "Measure and protect characteristics",
        "Turn a quality into a number, and check it with fitness functions.",
        ["characteristics", "evolution", "observability"],
      ),
    ],
  },
  {
    title: "Structure",
    pages: [
      article(
        "modularity",
        "Modularity, cohesion, and coupling",
        "How to judge if the parts of a system are well divided.",
        ["boundaries", "distributed"],
      ),
      article(
        "boundaries",
        "How to find component boundaries",
        "Divide by business area, and decide how large each part must be.",
        ["modularity", "teams"],
      ),
      article(
        "bounded-contexts",
        "Bounded contexts and context maps",
        "Where a model is valid, and the patterns that connect two models.",
        ["boundaries", "domain-model", "teams"],
      ),
      article(
        "distributed",
        "One deployment or many",
        "What you pay when parts talk through a network, and when it is worth it.",
        ["styles", "resilience"],
      ),
      article(
        "architecture-quantum",
        "Architecture quanta",
        "The smallest part that deploys alone, and why it decides the characteristics.",
        ["distributed", "styles", "service-granularity"],
      ),
      article(
        "service-granularity",
        "How large a service must be",
        "The forces that split a service and the forces that keep it together.",
        ["architecture-quantum", "boundaries", "data-ownership"],
      ),
      article(
        "decomposing-a-monolith",
        "How to split a monolith",
        "Find the parts, move them out one at a time, and keep the system running.",
        ["service-granularity", "evolution", "data-ownership"],
      ),
      {
        slug: "styles",
        title: "Architecture styles",
        summary: "The eight common shapes of a system, compared.",
        kind: "styles",
        related: ["distributed", "characteristics"],
      },
      ...styleLessons.map((lesson): WikiPage => ({
        slug: lesson.id,
        title: lesson.name,
        summary: lesson.idea,
        kind: "style",
        related: ["styles"],
        parent: "styles",
      })),
      {
        slug: "building-blocks",
        title: "Building blocks",
        summary: "The standard pieces of a design, and what each one costs you.",
        kind: "blocks",
        related: ["diagrams", "trade-offs", "data-stores", "messaging"],
      },
    ],
  },
  {
    title: "Inside one application",
    pages: [
      article(
        "code-architecture",
        "Architecture inside one application",
        "System architecture and application architecture are two levels. How to tell them apart.",
        ["hexagonal", "styles", "modularity"],
      ),
      article(
        "deep-modules",
        "Complexity and deep modules",
        "What makes code hard to change, and modules that hide it.",
        ["modularity", "code-architecture", "hexagonal"],
      ),
      article(
        "hexagonal",
        "Hexagonal architecture",
        "Ports and adapters: business logic in the center, technology at the edge.",
        ["clean-onion", "domain-model", "code-architecture"],
      ),
      article(
        "clean-onion",
        "Clean and onion architecture",
        "Two relatives of hexagonal, and how their names map to each other.",
        ["hexagonal", "layered"],
      ),
      article(
        "dependencies",
        "Dependency injection and wiring",
        "Who creates the parts, the composition root, test doubles, and how to keep the direction.",
        ["hexagonal", "clean-onion", "evolution"],
      ),
      article(
        "vertical-slices",
        "Vertical slices",
        "Organize code by feature and not by technical layer.",
        ["hexagonal", "modularity"],
      ),
      article(
        "domain-model",
        "Domain model patterns",
        "Entities, value objects, aggregates, and repositories.",
        ["boundaries", "hexagonal", "cqrs-event-sourcing"],
      ),
      article(
        "cqrs-event-sourcing",
        "CQRS and event sourcing",
        "Separate models to write and to read, and events as the stored data.",
        ["domain-model", "consistency", "event-driven"],
      ),
    ],
  },
  {
    title: "Data",
    pages: [
      article(
        "data-stores",
        "How to select a data store",
        "The main types of database and the questions that select one.",
        ["consistency", "scaling-data"],
      ),
      article(
        "storage-engines",
        "How databases store and find data",
        "Logs, B-trees, LSM-trees, indexes, and stores for analysis.",
        ["data-stores", "scaling-data", "batch-and-stream"],
      ),
      article(
        "consistency",
        "Consistency, transactions, and CAP",
        "What 'correct data' means, and what it costs in a distributed system.",
        ["distributed-transactions", "data-stores"],
      ),
      article(
        "transactions-isolation",
        "Isolation levels and their anomalies",
        "What each isolation level allows, and the faults it lets through.",
        ["consistency", "distributed-transactions", "storage-engines"],
      ),
      article(
        "distributed-transactions",
        "Changes across services",
        "Sagas, the outbox, and idempotency: correct results with no shared transaction.",
        ["consistency", "messaging"],
      ),
      article(
        "data-ownership",
        "Split the data with the services",
        "Who owns each table, and how other services get the data they need.",
        ["distributed-transactions", "service-granularity", "decomposing-a-monolith"],
      ),
      article(
        "caching",
        "Caching",
        "Where to put a cache, how to keep it fresh, and how it fails.",
        ["scalability", "scaling-data"],
      ),
      article(
        "scaling-data",
        "Replication and partitioning",
        "Copies for safety and read load. Splits for size and write load.",
        ["data-stores", "consistency"],
      ),
      article(
        "clocks-and-failures",
        "Partial failure, clocks, and pauses",
        "Why a distributed system cannot know what is true, and how to design for it.",
        ["consensus", "distributed", "resilience"],
      ),
      article(
        "consensus",
        "Leaders, consensus, and coordination",
        "Linearizability, leader election, fencing, and the tools that agree for you.",
        ["clocks-and-failures", "scaling-data", "consistency"],
      ),
      article(
        "batch-and-stream",
        "Batch and stream processing",
        "Process data in large runs or as it arrives, and keep derived data correct.",
        ["messaging", "storage-engines", "cqrs-event-sourcing"],
      ),
      article(
        "analytical-data",
        "Analytical data",
        "Warehouses, lakes, and data mesh: how a company reads its data for analysis.",
        ["batch-and-stream", "storage-engines", "data-ownership"],
      ),
    ],
  },
  {
    title: "Communication",
    pages: [
      article(
        "sync-async",
        "Synchronous and asynchronous communication",
        "Wait for the answer or not: the choice that shapes a distributed design.",
        ["messaging", "resilience"],
      ),
      article(
        "messaging",
        "Messaging: queues, events, and delivery",
        "Queues, topics, delivery promises, and order.",
        ["sync-async", "distributed-transactions"],
      ),
      article(
        "api-design",
        "API design and contracts",
        "Interfaces that other teams can depend on, and how to change them.",
        ["sync-async", "security"],
      ),
      article(
        "encoding-and-evolution",
        "Data formats and schema evolution",
        "How data is encoded, and how to change a format while old and new code run.",
        ["api-design", "messaging", "deployment"],
      ),
    ],
  },
  {
    title: "Reliability and operations",
    pages: [
      article(
        "resilience",
        "Design for failure",
        "Timeouts, retries, circuit breakers, and limits on the damage of a fault.",
        ["distributed", "observability"],
      ),
      article(
        "stability-antipatterns",
        "How production systems fail",
        "The patterns that turn one fault into an outage, and the patterns that stop them.",
        ["resilience", "scalability", "incident-response"],
      ),
      article(
        "scalability",
        "Scalability and performance",
        "Where systems run out of capacity, and the standard ways to add more.",
        ["estimation", "caching"],
      ),
      article(
        "estimation",
        "Capacity estimation",
        "Quick arithmetic that shows which part of a design is the hard one.",
        ["scalability", "interview-format"],
      ),
      article(
        "observability",
        "Observability and service levels",
        "How to know that a system works: signals, targets, and alerts.",
        ["resilience", "deployment"],
      ),
      article(
        "incident-response",
        "On-call, incidents, and postmortems",
        "How a team responds to an outage and learns from it.",
        ["observability", "stability-antipatterns", "delivery-performance"],
      ),
      article(
        "deployment",
        "Deployment and release",
        "How to change a running system safely and often.",
        ["observability", "evolution"],
      ),
      article(
        "delivery-performance",
        "Delivery performance",
        "The four key metrics, and the practices that make delivery fast and safe.",
        ["deployment", "incident-response", "teams"],
      ),
      article(
        "testing-strategy",
        "Testing strategy",
        "What to test at each level, contract tests, and tests in production.",
        ["deployment", "api-design", "delivery-performance"],
      ),
      article(
        "security",
        "Security for architects",
        "The structural security decisions: identity, access, data, and trust boundaries.",
        ["api-design", "resilience"],
      ),
    ],
  },
  {
    title: "The architect at work",
    pages: [
      article(
        "diagrams",
        "Diagrams and the C4 model",
        "How to draw a system so that other people read it correctly.",
        ["method", "decision-records"],
      ),
      article(
        "risk-assessment",
        "Risk assessment",
        "Find, rate, and reduce the risks of an architecture, with a team.",
        ["diagrams", "trade-offs", "measuring-characteristics"],
      ),
      article(
        "evolution",
        "Evolution and migration",
        "How to change the architecture of a system that is in use.",
        ["deployment", "decision-records"],
      ),
      article(
        "teams",
        "Teams and communication",
        "Conway's law, stakeholders, and how an architect gets a decision accepted.",
        ["architect-role", "boundaries"],
      ),
      article(
        "team-topologies",
        "Team types and interaction modes",
        "Four team types, three ways to work together, and the limit of cognitive load.",
        ["teams", "bounded-contexts", "service-granularity"],
      ),
      article(
        "reading-list",
        "Reading list",
        "The books that the field treats as standard, and what each one gives you.",
        ["architect-role"],
      ),
    ],
  },
  {
    title: "Product and decisions",
    pages: [
      article(
        "decision-making",
        "How decisions are made",
        "Who decides what, how fast, and how a group reaches a decision that sticks.",
        ["decision-records", "raci", "trade-offs"],
      ),
      article(
        "raci",
        "The RACI matrix",
        "Who does the work, who answers for it, who gives input, and who is told.",
        ["decision-making", "teams", "team-topologies"],
      ),
      article(
        "prioritization",
        "Prioritization",
        "Decide what to do first, what to do later, and what not to do, and explain why.",
        ["product-thinking", "estimation", "risk-assessment"],
      ),
      article(
        "product-thinking",
        "Product thinking",
        "How product teams work, and how architecture serves the product and its users.",
        ["prioritization", "measuring-characteristics", "architect-role"],
      ),
    ],
  },
  {
    title: "AI systems",
    pages: [
      article(
        "llm-systems",
        "Building with language models",
        "A model as a part of a system: what it is good at, where it fails, and how to contain it.",
        ["ai-agents", "llm-evals", "llm-cost-latency"],
      ),
      article(
        "ai-agents",
        "Agents and tools",
        "The agent loop, tools, state, guardrails, and when a person must take over.",
        ["llm-systems", "llm-evals", "resilience"],
      ),
      article(
        "llm-evals",
        "Evaluating AI systems",
        "Test sets, graders, simulated users, and how you know that a change made it better.",
        ["llm-systems", "ai-agents", "testing-strategy"],
      ),
      article(
        "llm-cost-latency",
        "Cost and latency of AI systems",
        "Estimate the token cost, set a latency budget, and make both smaller.",
        ["estimation", "llm-systems", "caching"],
      ),
      article(
        "voice-agents",
        "Voice agents",
        "Speech in, speech out: the pipeline, turn-taking, the latency budget, and handoff.",
        ["ai-agents", "llm-cost-latency", "llm-evals"],
      ),
    ],
  },
  {
    title: "System design cases",
    pages: [
      article(
        "scale-step-by-step",
        "From one server to millions of users",
        "The usual order of changes as load grows, and the reason for each one.",
        ["scalability", "caching", "scaling-data"],
      ),
      article(
        "rate-limiter",
        "Design a rate limiter",
        "Algorithms, where the limiter goes, and how many servers share one count.",
        ["resilience", "api-design", "key-value-store"],
      ),
      article(
        "consistent-hashing",
        "Consistent hashing",
        "Spread keys over servers so that a change of servers moves few keys.",
        ["scaling-data", "key-value-store", "caching"],
      ),
      article(
        "key-value-store",
        "Design a key-value store",
        "Partitions, replicas, quorums, and repair in a store that stays available.",
        ["consistent-hashing", "consensus", "storage-engines"],
      ),
      article(
        "unique-ids",
        "Unique IDs at scale",
        "Make IDs that are unique, sortable, and fast, with no central counter.",
        ["clocks-and-failures", "scaling-data", "url-shortener"],
      ),
      article(
        "url-shortener",
        "Design a URL shortener",
        "Short codes, redirects, and a read load that is much larger than the write load.",
        ["unique-ids", "caching", "estimation"],
      ),
      article(
        "web-crawler",
        "Design a web crawler",
        "Fetch billions of pages politely, without repeats, and without traps.",
        ["batch-and-stream", "messaging", "rate-limiter"],
      ),
      article(
        "notification-system",
        "Design a notification system",
        "Send push, email, and text messages reliably, once, and at the right time.",
        ["messaging", "resilience", "distributed-transactions"],
      ),
      article(
        "news-feed",
        "Design a news feed",
        "Build feeds when posts are written or when feeds are read, and mix the two.",
        ["caching", "messaging", "scale-step-by-step"],
      ),
      article(
        "autocomplete",
        "Design search autocomplete",
        "Suggest the top completions of a prefix within a few milliseconds.",
        ["caching", "batch-and-stream", "storage-engines"],
      ),
      article(
        "chat-system",
        "Design a chat system",
        "Real-time delivery, message order, online status, and group chats.",
        ["messaging", "sync-async", "unique-ids"],
      ),
      article(
        "video-platform",
        "Design a video platform",
        "Upload, transcode, store, and stream video to millions of viewers.",
        ["batch-and-stream", "caching", "scalability"],
      ),
      article(
        "file-sync",
        "Design file storage and sync",
        "Store files in blocks, sync changes across devices, and resolve conflicts.",
        ["storage-engines", "consistency", "encoding-and-evolution"],
      ),
      article(
        "payment-system",
        "Design a payment system",
        "Move money correctly with external providers, idempotency, and a ledger.",
        ["distributed-transactions", "consistency", "resilience"],
      ),
      article(
        "proximity-service",
        "Design a proximity service",
        "Find nearby places fast with geohash, quadtrees, and a read-heavy design.",
        ["storage-engines", "caching", "scaling-data"],
      ),
      article(
        "message-queue",
        "Design a distributed message queue",
        "Partitions, replicas, consumer groups, offsets, and delivery promises.",
        ["messaging", "consensus", "storage-engines"],
      ),
      article(
        "metrics-monitoring",
        "Design a metrics and alerting system",
        "Collect, store, query, and alert on millions of time series.",
        ["observability", "storage-engines", "batch-and-stream"],
      ),
      article(
        "ad-click-aggregation",
        "Design ad click aggregation",
        "Count billions of events in time windows, exactly, and reconcile them.",
        ["batch-and-stream", "message-queue", "analytical-data"],
      ),
      article(
        "hotel-reservation",
        "Design a hotel reservation system",
        "Sell rooms without double booking, with idempotency and the right locks.",
        ["transactions-isolation", "distributed-transactions", "payment-system"],
      ),
      article(
        "leaderboard",
        "Design a real-time leaderboard",
        "Rank millions of players and show each one their place in real time.",
        ["caching", "key-value-store", "scaling-data"],
      ),
      article(
        "object-storage",
        "Design object storage",
        "Store immutable objects durably with metadata, data nodes, and erasure coding.",
        ["storage-engines", "scaling-data", "file-sync"],
      ),
      article(
        "stock-exchange",
        "Design a stock exchange",
        "Match orders with very low latency, in order, and recover from any failure.",
        ["consensus", "encoding-and-evolution", "clocks-and-failures"],
      ),
    ],
  },
];

// Make the anchor ID of a heading. This file has no file-system import, so the browser can use it.
export function headingId(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}
