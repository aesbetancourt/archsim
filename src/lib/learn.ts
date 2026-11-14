import type { DiagramSpec } from "./examples";

type Level = "low" | "medium" | "high";

export type StyleLesson = {
  id: string;
  name: string;
  idea: string;
  how: string;
  diagram: DiagramSpec;
  strengths: string[];
  costs: string[];
  useWhen: string;
  avoidWhen: string;
  example: string;
  ratings: { simplicity: Level; scalability: Level; faultTolerance: Level; cost: Level };
};

export const styleLessons: StyleLesson[] = [
  {
    id: "layered",
    name: "Layered",
    idea: "One application, split into horizontal layers by technical role.",
    how: "Each request goes down through the layers: user interface, business rules, data access, database. A layer talks only to the layer below it. The full application is built and deployed as one unit.",
    diagram: {
      nodes: [
        { id: "ui", label: "Presentation\n(screens, API)", shape: "module", col: 0, row: 0 },
        { id: "rules", label: "Business rules", shape: "module", col: 0, row: 1 },
        { id: "access", label: "Data access", shape: "module", col: 0, row: 2 },
        { id: "db", label: "Database", col: 0, row: 3 },
      ],
      edges: [
        { from: "ui", to: "rules" },
        { from: "rules", to: "access" },
        { from: "access", to: "db" },
      ],
    },
    strengths: [
      "Simple to understand, build, and deploy.",
      "Low cost. A small team can own all of it.",
      "Most developers know it already.",
    ],
    costs: [
      "One change to a business feature often touches every layer.",
      "The full application scales as one unit. You cannot scale only the busy part.",
      "One serious fault can stop the full application.",
    ],
    useWhen: "The team is small, the budget is tight, or the problem is not yet well understood.",
    avoidWhen: "Parts of the system have very different load, or many teams must release independently.",
    example: "An internal tool for 200 employees to submit and approve expenses.",
    ratings: { simplicity: "high", scalability: "low", faultTolerance: "low", cost: "low" },
  },
  {
    id: "modular-monolith",
    name: "Modular monolith",
    idea: "One application, split into modules by business area.",
    how: "Each module owns one business area, such as orders or payments, with its code and its tables. Modules talk through explicit interfaces. The full application is still deployed as one unit.",
    diagram: {
      nodes: [
        { id: "orders", label: "Orders\n(module)", col: 0, row: 0.4 },
        { id: "menu", label: "Menu\n(module)", col: 1, row: 0.4 },
        { id: "payments", label: "Payments\n(module)", col: 2, row: 0.4 },
        { id: "db", label: "Database", col: 1, row: 1.9 },
      ],
      groups: [{ id: "app", label: "One deployment", col: 0, row: 0.4, cols: 3, rows: 1 }],
      edges: [{ from: "app", to: "db", label: "one database" }],
    },
    strengths: [
      "A change to one business feature stays in one module.",
      "As simple to deploy and operate as a layered application.",
      "A module can become a separate service later, if it must.",
    ],
    costs: [
      "The boundaries hold only if the team has the discipline to keep them.",
      "It still scales and fails as one unit.",
      "One shared database makes it easy to couple modules by accident.",
    ],
    useWhen: "You want clear business boundaries without the operating cost of a distributed system.",
    avoidWhen: "Some parts need independent scaling or independent uptime now.",
    example: "An online shop for one company, built by a team of six.",
    ratings: { simplicity: "high", scalability: "low", faultTolerance: "low", cost: "low" },
  },
  {
    id: "microkernel",
    name: "Microkernel",
    idea: "A small core system, extended by plug-ins.",
    how: "The core has only the minimum logic to run. Each plug-in adds one feature or one variation and connects to the core through a fixed contract. You add or remove plug-ins without a change to the core.",
    diagram: {
      nodes: [
        { id: "a", label: "Plug-in A", col: 0, row: 0 },
        { id: "b", label: "Plug-in B", col: 1, row: 0 },
        { id: "c", label: "Plug-in C", col: 2, row: 0 },
        { id: "core", label: "Core system\n(fixed contract)", shape: "module", col: 1, row: 1.3 },
      ],
      edges: [
        { from: "a", to: "core" },
        { from: "b", to: "core" },
        { from: "c", to: "core" },
      ],
    },
    strengths: [
      "Easy to add custom rules for each customer, country, or device.",
      "The core stays small and stable.",
      "Simple and cheap to deploy.",
    ],
    costs: [
      "The plug-in contract is hard to change after plug-ins exist.",
      "The core is one point of failure and one scaling unit.",
      "A poor fit when features depend strongly on each other.",
    ],
    useWhen: "The product has a stable core and many variations around it.",
    avoidWhen: "The system needs high scalability, or there is no natural core.",
    example: "A tax application with one rule plug-in for each country.",
    ratings: { simplicity: "high", scalability: "low", faultTolerance: "low", cost: "low" },
  },
  {
    id: "service-based",
    name: "Service-based",
    idea: "A few large services, one for each business area, that usually share a database.",
    how: "The system has four to twelve coarse services, each deployed separately. A user interface calls them. Most designs keep one shared database, so transactions stay simple.",
    diagram: {
      nodes: [
        { id: "ui", label: "User interface", col: 1, row: 0 },
        { id: "a", label: "Service A", col: 0, row: 1.2 },
        { id: "b", label: "Service B", col: 1, row: 1.2 },
        { id: "c", label: "Service C", col: 2, row: 1.2 },
        { id: "db", label: "Shared database", col: 1, row: 2.4 },
      ],
      edges: [
        { from: "ui", to: "a" },
        { from: "ui", to: "b" },
        { from: "ui", to: "c" },
        { from: "a", to: "db" },
        { from: "b", to: "db" },
        { from: "c", to: "db" },
      ],
    },
    strengths: [
      "Each service deploys, scales, and fails on its own.",
      "Much less operating work than microservices.",
      "The shared database keeps data consistent with normal transactions.",
    ],
    costs: [
      "A change to the database schema can affect every service.",
      "The database is a shared point of failure and a scaling limit.",
      "Each service is still large, so it scales in large steps.",
    ],
    useWhen: "You need some independence between business areas, and the team cannot afford microservices.",
    avoidWhen: "Load is extreme or very uneven, or many teams need full autonomy.",
    example: "An insurance claims system with intake, assessment, and payment services.",
    ratings: { simplicity: "medium", scalability: "medium", faultTolerance: "medium", cost: "medium" },
  },
  {
    id: "event-driven",
    name: "Event-driven",
    idea: "Components react to events and do not call each other directly.",
    how: "A component publishes an event, such as 'order placed', to a broker. Other components subscribe and react in their own time. The publisher does not know who listens, and does not wait for them.",
    diagram: {
      nodes: [
        { id: "producer", label: "Producer", col: 0, row: 0 },
        { id: "broker", label: "Broker", col: 1, row: 0 },
        { id: "a", label: "Consumer A", col: 2, row: 0 },
        { id: "b", label: "Consumer B", col: 2, row: 1.1 },
      ],
      edges: [
        { from: "producer", to: "broker", label: "event", async: true },
        { from: "broker", to: "a", async: true },
        { from: "broker", to: "b", async: true },
      ],
    },
    strengths: [
      "Absorbs load peaks. The broker holds events until consumers catch up.",
      "Very responsive, because the sender does not wait.",
      "You can add a new consumer without a change to the producers.",
    ],
    costs: [
      "The flow is hard to follow, test, and debug.",
      "Data is consistent only after a delay (eventual consistency).",
      "You must design for lost, repeated, and out-of-order events.",
    ],
    useWhen: "Work arrives in bursts, or one occurrence must start many independent reactions.",
    avoidWhen: "The user needs an immediate, certain answer, or steps must occur in one strict transaction.",
    example: "After an order is placed: charge the card, tell the kitchen, and send a message, each independently.",
    ratings: { simplicity: "low", scalability: "high", faultTolerance: "high", cost: "medium" },
  },
  {
    id: "microservices",
    name: "Microservices",
    idea: "Many small services. Each one does one job and owns its data.",
    how: "Each service covers one narrow business capability and has its own database. No service reads the data of another service directly. Services talk through APIs or events, usually behind an API gateway.",
    diagram: {
      nodes: [
        { id: "gateway", label: "API gateway", col: 1, row: 0 },
        { id: "a", label: "Service A", col: 0, row: 1.2 },
        { id: "b", label: "Service B", col: 1, row: 1.2 },
        { id: "c", label: "Service C", col: 2, row: 1.2 },
        { id: "da", label: "Database A", col: 0, row: 2.3 },
        { id: "db", label: "Database B", col: 1, row: 2.3 },
        { id: "dc", label: "Database C", col: 2, row: 2.3 },
      ],
      edges: [
        { from: "gateway", to: "a" },
        { from: "gateway", to: "b" },
        { from: "gateway", to: "c" },
        { from: "a", to: "da" },
        { from: "b", to: "db" },
        { from: "c", to: "dc" },
      ],
    },
    strengths: [
      "Each service scales and deploys independently.",
      "One failed service does not have to stop the others.",
      "Many teams can work and release in parallel.",
    ],
    costs: [
      "High operating cost: deployment automation, monitoring, and tracing are mandatory.",
      "A transaction across services is hard. You need sagas or eventual consistency.",
      "Network calls add latency and new failure modes.",
    ],
    useWhen: "The system is large, load is uneven between parts, and many teams need autonomy.",
    avoidWhen: "The team is small, or the business boundaries are not yet clear.",
    example: "A streaming platform with separate services for catalog, playback, billing, and recommendations.",
    ratings: { simplicity: "low", scalability: "high", faultTolerance: "high", cost: "high" },
  },
  {
    id: "space-based",
    name: "Space-based",
    idea: "Keep the data in memory, next to the code, to survive extreme load peaks.",
    how: "Identical processing units each hold the working data in memory and replicate it to each other. Requests do not touch the database. The database is updated in the background. Units start and stop as load changes.",
    diagram: {
      nodes: [
        { id: "lb", label: "Load balancer", col: 1, row: 0 },
        { id: "a", label: "Processing unit\n(data in memory)", col: 0, row: 1.2 },
        { id: "b", label: "Processing unit\n(data in memory)", col: 1, row: 1.2 },
        { id: "c", label: "Processing unit\n(data in memory)", col: 2, row: 1.2 },
        { id: "db", label: "Database", col: 1, row: 2.4 },
      ],
      edges: [
        { from: "lb", to: "a" },
        { from: "lb", to: "b" },
        { from: "lb", to: "c" },
        { from: "a", to: "b", label: "copy", both: true },
        { from: "b", to: "c", label: "copy", both: true },
        { from: "b", to: "db", label: "later", async: true },
      ],
    },
    strengths: [
      "Handles very high and sudden load, because the database is not in the request path.",
      "Elastic: units are added and removed in seconds.",
      "Very fast responses.",
    ],
    costs: [
      "Complex and expensive to build, test, and operate.",
      "Replicated memory can collide, so two units can disagree for a short time.",
      "A poor fit for large data sets that do not fit in memory.",
    ],
    useWhen: "Load peaks are extreme and hard to predict, such as a major ticket sale.",
    avoidWhen: "Load is steady, or the data is large and relational.",
    example: "Seat selection when a major concert goes on sale.",
    ratings: { simplicity: "low", scalability: "high", faultTolerance: "high", cost: "high" },
  },
  {
    id: "pipeline",
    name: "Pipeline",
    idea: "Data flows in one direction through a chain of small steps.",
    how: "Each step (filter) does one task: read, clean, transform, or write. A step gets input from the step before it and passes output to the next step (through a pipe). Steps do not know about each other.",
    diagram: {
      nodes: [
        { id: "source", label: "Source", col: 0, row: 0 },
        { id: "f1", label: "Filter\n(check)", col: 1, row: 0 },
        { id: "f2", label: "Filter\n(convert)", col: 2, row: 0 },
        { id: "sink", label: "Sink\n(write result)", col: 3, row: 0 },
      ],
      edges: [
        { from: "source", to: "f1" },
        { from: "f1", to: "f2" },
        { from: "f2", to: "sink" },
      ],
    },
    strengths: [
      "Each step is small, simple, and easy to test.",
      "Easy to add, remove, or reorder steps.",
      "Low cost.",
    ],
    costs: [
      "A poor fit for interactive work, where the user waits for an answer.",
      "Usually deployed as one unit, so it scales as one unit.",
      "A fault in one step stops the chain.",
    ],
    useWhen: "The problem is one-way data processing: import, convert, enrich, export.",
    avoidWhen: "Users interact with the system in many different ways.",
    example: "A nightly job that reads clinic billing records, checks them, and sends them to insurers.",
    ratings: { simplicity: "high", scalability: "low", faultTolerance: "low", cost: "low" },
  },
];

export function getStyleLesson(name: string): StyleLesson | undefined {
  return styleLessons.find((lesson) => lesson.name === name);
}

export type Characteristic = { name: string; meaning: string; signal: string };

export const characteristics: Characteristic[] = [
  {
    name: "Availability",
    meaning: "The system is up when users need it.",
    signal: "\"Must continue to work when…\", a business that loses money each minute it is down.",
  },
  {
    name: "Scalability",
    meaning: "The system handles more users or data as the business grows.",
    signal: "Large or growing user numbers, plans to expand.",
  },
  {
    name: "Elasticity",
    meaning: "The system handles sudden peaks, then releases the capacity.",
    signal: "Load that jumps: a sale opens, a storm, the lunch hour.",
  },
  {
    name: "Performance",
    meaning: "The system answers fast.",
    signal: "\"Real time\", \"immediately\", users who wait on a screen.",
  },
  {
    name: "Fault tolerance",
    meaning: "The system continues, possibly with fewer functions, when one part fails.",
    signal: "Weak networks, external systems that go offline.",
  },
  {
    name: "Data consistency",
    meaning: "All users see the same, correct data.",
    signal: "\"Must never sell one seat twice\", money, stock, legal records.",
  },
  {
    name: "Security",
    meaning: "Only the right people get access to data and functions.",
    signal: "Payments, health data, personal data, bots.",
  },
  {
    name: "Auditability",
    meaning: "The system can prove who did what, and when.",
    signal: "Law, regulators, disputes, \"records each…\".",
  },
  {
    name: "Deployability",
    meaning: "The team can release changes often and safely.",
    signal: "Frequent changes, many teams, staged rollouts.",
  },
  {
    name: "Extensibility",
    meaning: "New features or partners are easy to add later.",
    signal: "\"Next year we want to add…\", new countries, new partners.",
  },
  {
    name: "Interoperability",
    meaning: "The system exchanges data with other systems.",
    signal: "Existing systems, partners, several external parties.",
  },
  {
    name: "Simplicity",
    meaning: "The system is cheap to build and to operate.",
    signal: "A small team, a small budget, a short deadline.",
  },
];

export const kataSteps = [
  {
    title: "Read for what is hard, and set the scope",
    body: "Most requirements are ordinary. Find the two or three sentences that make this problem difficult. They are usually in the user numbers and the constraints. Then write the two or three functions that the design must do well, and what you leave out. These are the functional requirements that matter. If the problem gives no list, extract them from the text.",
  },
  {
    title: "Select the driving characteristics",
    body: "An architecture characteristic is a quality the system must have, such as availability. It is not a feature. Select the few that drive the design, and tie each one to a sentence in the kata. Three is the usual number, and the app lets you select up to five. A design that tries to be good at everything is good at nothing.",
  },
  {
    title: "Select a style",
    body: "An architecture style is the overall shape of the system: how many deployable parts it has, and how they talk. Select the simplest style that supports your three characteristics at a cost the constraints allow.",
  },
  {
    title: "Draw the components",
    body: "Give each box one clear responsibility. Show where the data is stored and who owns it. Put a label on each arrow: is it a direct call that waits, or a message that does not wait?",
  },
  {
    title: "State the trade-offs",
    body: "Each decision gives something up. Write what your design is bad at, why that is acceptable here, and where it fails first. This is the part that reviewers value most.",
  },
];
