import { styleLessons } from "./learn";

export type WikiPage = {
  slug: string;
  title: string;
  summary: string;
  // A custom page is drawn by a component. An article is a Markdown file in content/learn.
  kind: "article" | "method" | "characteristics" | "styles" | "style";
  related?: string[];
};

export type WikiSection = { title: string; pages: WikiPage[] };

const article = (slug: string, title: string, summary: string, related: string[] = []): WikiPage => ({
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
      article("architect-role", "What a software architect does", "The job, the decisions that are yours, and the way architects think.", ["trade-offs", "teams"]),
      { slug: "method", title: "How to do a kata", summary: "Five steps from a problem text to a design you can defend.", kind: "method", related: ["characteristics", "styles", "interview-format"] },
      article("trade-offs", "How to analyze a trade-off", "A repeatable way to compare options and explain the choice.", ["decision-records", "characteristics"]),
      article("decision-records", "Architecture decision records", "A short document format that keeps the reason for each decision.", ["trade-offs", "evolution"]),
      article("interview-format", "The system design interview", "How to use 45 minutes: questions, numbers, design, and deep dives.", ["method", "estimation"]),
    ],
  },
  {
    title: "Characteristics",
    pages: [
      { slug: "characteristics", title: "Architecture characteristics", summary: "The qualities a system must have, and how to find them in a problem.", kind: "characteristics", related: ["trade-offs", "observability"] },
    ],
  },
  {
    title: "Structure",
    pages: [
      article("modularity", "Modularity, cohesion, and coupling", "How to judge if the parts of a system are well divided.", ["boundaries", "distributed"]),
      article("boundaries", "How to find component boundaries", "Divide by business area, and decide how large each part must be.", ["modularity", "teams"]),
      article("distributed", "One deployment or many", "What you pay when parts talk through a network, and when it is worth it.", ["styles", "resilience"]),
      { slug: "styles", title: "Architecture styles", summary: "The eight common shapes of a system, compared.", kind: "styles", related: ["distributed", "characteristics"] },
      ...styleLessons.map(
        (lesson): WikiPage => ({ slug: lesson.id, title: lesson.name, summary: lesson.idea, kind: "style", related: ["styles"] }),
      ),
    ],
  },
  {
    title: "Inside one application",
    pages: [
      article("code-architecture", "Architecture inside one application", "System architecture and application architecture are two levels. How to tell them apart.", ["hexagonal", "styles", "modularity"]),
      article("hexagonal", "Hexagonal architecture", "Ports and adapters: business logic in the center, technology at the edge.", ["clean-onion", "domain-model", "code-architecture"]),
      article("clean-onion", "Clean and onion architecture", "Two relatives of hexagonal, and how their names map to each other.", ["hexagonal", "layered"]),
      article("vertical-slices", "Vertical slices", "Organize code by feature and not by technical layer.", ["hexagonal", "modularity"]),
      article("domain-model", "Domain model patterns", "Entities, value objects, aggregates, and repositories.", ["boundaries", "hexagonal", "cqrs-event-sourcing"]),
      article("cqrs-event-sourcing", "CQRS and event sourcing", "Separate models to write and to read, and events as the stored data.", ["domain-model", "consistency", "event-driven"]),
    ],
  },
  {
    title: "Data",
    pages: [
      article("data-stores", "How to select a data store", "The main types of database and the questions that select one.", ["consistency", "scaling-data"]),
      article("consistency", "Consistency, transactions, and CAP", "What 'correct data' means, and what it costs in a distributed system.", ["distributed-transactions", "data-stores"]),
      article("distributed-transactions", "Changes across services", "Sagas, the outbox, and idempotency: correct results with no shared transaction.", ["consistency", "messaging"]),
      article("caching", "Caching", "Where to put a cache, how to keep it fresh, and how it fails.", ["scalability", "scaling-data"]),
      article("scaling-data", "Replication and partitioning", "Copies for safety and read load. Splits for size and write load.", ["data-stores", "consistency"]),
    ],
  },
  {
    title: "Communication",
    pages: [
      article("sync-async", "Synchronous and asynchronous communication", "Wait for the answer or not: the choice that shapes a distributed design.", ["messaging", "resilience"]),
      article("messaging", "Messaging: queues, events, and delivery", "Queues, topics, delivery promises, and order.", ["sync-async", "distributed-transactions"]),
      article("api-design", "API design and contracts", "Interfaces that other teams can depend on, and how to change them.", ["sync-async", "security"]),
    ],
  },
  {
    title: "Reliability and operations",
    pages: [
      article("resilience", "Design for failure", "Timeouts, retries, circuit breakers, and limits on the damage of a fault.", ["distributed", "observability"]),
      article("scalability", "Scalability and performance", "Where systems run out of capacity, and the standard ways to add more.", ["estimation", "caching"]),
      article("estimation", "Capacity estimation", "Quick arithmetic that shows which part of a design is the hard one.", ["scalability", "interview-format"]),
      article("observability", "Observability and service levels", "How to know that a system works: signals, targets, and alerts.", ["resilience", "deployment"]),
      article("deployment", "Deployment and release", "How to change a running system safely and often.", ["observability", "evolution"]),
      article("security", "Security for architects", "The structural security decisions: identity, access, data, and trust boundaries.", ["api-design", "resilience"]),
    ],
  },
  {
    title: "The architect at work",
    pages: [
      article("diagrams", "Diagrams and the C4 model", "How to draw a system so that other people read it correctly.", ["method", "decision-records"]),
      article("evolution", "Evolution and migration", "How to change the architecture of a system that is in use.", ["deployment", "decision-records"]),
      article("teams", "Teams and communication", "Conway's law, stakeholders, and how an architect gets a decision accepted.", ["architect-role", "boundaries"]),
      article("reading-list", "Reading list", "The books that the field treats as standard, and what each one gives you.", ["architect-role"]),
    ],
  },
];
