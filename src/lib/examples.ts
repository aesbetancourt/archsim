import { interviewExamples } from "./interview-katas";

export type DiagramNode = {
  id: string;
  label: string;
  col: number;
  row: number;
  external?: boolean;
};

export type DiagramGroup = {
  id: string;
  label: string;
  col: number;
  row: number;
  cols: number;
  rows: number;
};

export type DiagramEdge = {
  from: string;
  to: string;
  label?: string;
  async?: boolean;
  both?: boolean;
};

export type DiagramSpec = { nodes: DiagramNode[]; groups?: DiagramGroup[]; edges: DiagramEdge[] };

export type WorkedExample = {
  kataId: string;
  hardParts: { quote: string; meaning: string }[];
  // For an open prompt: the scope and numbers the answer assumes.
  assumptions?: string[];
  characteristics: { name: string; why: string }[];
  style: { name: string; why: string; rejected: { name: string; why: string }[] };
  diagram: DiagramSpec;
  walkthrough: string[];
  tradeoffs: string[];
  risks: string[];
  operations?: string[];
  reviewQuestions: string[];
  alternative: { title: string; body: string };
};

export const workedExamples: WorkedExample[] = [
  {
    kataId: "lunch-rush",
    hardParts: [
      {
        quote: "Most orders arrive between 11:30 and 13:30.",
        meaning:
          "The load is a daily peak that everyone can predict. The system must be up in those two hours. It can be quiet for the other 22.",
      },
      {
        quote: "A shop must continue to take orders when its internet connection is slow.",
        meaning:
          "The kitchen screen cannot depend on a live connection for each action. This is the hardest sentence in the kata.",
      },
      {
        quote: "The company has a team of four developers.",
        meaning: "Four people cannot operate many services. This sentence removes the expensive styles.",
      },
      {
        quote: "The owner wants to add delivery partners next year.",
        meaning: "The design needs a clear place to connect partners later. It does not need them now.",
      },
    ],
    characteristics: [
      {
        name: "Availability",
        why: "A failure at 12:15 loses the sales of the day in 40 shops. Ties to the lunch peak.",
      },
      {
        name: "Fault tolerance",
        why: "Each shop must work through a slow or lost connection. Ties to the internet constraint.",
      },
      {
        name: "Simplicity",
        why: "Four developers must build and operate everything. Ties to the team constraint.",
      },
    ],
    style: {
      name: "Modular monolith",
      why: "One deployment is the only thing four developers can operate well. Modules by business area (orders, menu, payments, notifications) keep each change in one place. They also give delivery partners a clear place to connect next year. A few thousand orders in two hours is a small load for one application with two or three copies behind a load balancer.",
      rejected: [
        {
          name: "Microservices",
          why: "They solve uneven load and team autonomy. This kata has neither problem, and the team cannot pay the operating cost.",
        },
        {
          name: "Layered",
          why: "It is as cheap, but it splits by technical role. Adding delivery partners would touch every layer.",
        },
      ],
    },
    diagram: {
      nodes: [
        { id: "customer", label: "Customer\nweb app", col: 0, row: 0 },
        { id: "kitchen", label: "Kitchen screen\n+ local order queue", col: 1, row: 0 },
        { id: "admin", label: "Head office\nadmin", col: 2, row: 0 },
        { id: "orders", label: "Orders", col: 0.5, row: 1.6 },
        { id: "menu", label: "Menu", col: 2, row: 1.6 },
        { id: "payments", label: "Payments", col: 0, row: 2.6 },
        { id: "notifications", label: "Notifications", col: 1, row: 2.6 },
        { id: "provider", label: "Payment\nprovider", col: 0, row: 3.9, external: true },
        { id: "messages", label: "Message\nprovider", col: 1, row: 3.9, external: true },
        { id: "db", label: "Database\n(tables owned per module)", col: 2, row: 3.9 },
      ],
      groups: [
        { id: "app", label: "One deployment", col: 0, row: 1.6, cols: 3, rows: 2 },
      ],
      edges: [
        { from: "customer", to: "orders", label: "place order" },
        { from: "kitchen", to: "orders", label: "sync orders", both: true },
        { from: "admin", to: "menu", label: "edit menu, prices" },
        { from: "orders", to: "payments", label: "charge" },
        { from: "orders", to: "notifications", label: "order ready", async: true },
        { from: "payments", to: "provider", label: "card payment" },
        { from: "notifications", to: "messages", label: "send", async: true },
        { from: "app", to: "db", label: "read, write" },
      ],
    },
    walkthrough: [
      "The large box is one deployment. The four boxes in it are modules, not services. They call each other in memory.",
      "A solid arrow is a call that waits for an answer. A dashed arrow is a message that does not wait.",
      "The kitchen screen keeps its own order queue in the browser. It gets new orders when the connection allows, and it works on the orders it already has when the connection is slow.",
      "Customers do not wait for the notification. That is why 'order ready' is a dashed arrow.",
      "Payment and message providers are external. The design buys those functions and does not build them.",
    ],
    tradeoffs: [
      "One deployment means one fault can stop ordering for all 40 shops. This is acceptable because two or three copies run at the same time, and the alternative costs more than the team can operate.",
      "The kitchen screen can show an order a short time after the customer placed it. This is acceptable because pickup times are minutes away, not seconds.",
      "One database is a shared limit. This is acceptable at this load, and each module owns its tables, so a later split is possible.",
    ],
    risks: [
      "A shop that is fully offline gets no new online orders. The design must stop selling pickup slots for a shop that has not synced for some minutes.",
      "The payment provider can be slow at peak. The design offers 'pay at pickup' as the fallback.",
      "A bad release at 11:00 hits the lunch peak. The team releases only in the afternoon.",
    ],
    reviewQuestions: [
      "A shop loses its connection for 20 minutes at 12:30. What does a customer who orders from that shop see?",
      "What stops a developer from reading the payments tables directly from the menu module?",
      "Where exactly does a delivery partner connect next year, and what changes?",
    ],
    alternative: {
      title: "A different, valid answer: service-based",
      body: "Split the system into three services: ordering, shop operations, and menu. The shop service can then fail or deploy without an effect on customer ordering. The cost is more deployments and more monitoring for four developers. This answer is better if shop outages become the main business problem. Neither answer is correct. Each one buys a different quality at a different price.",
    },
  },
  {
    kataId: "front-row",
    hardParts: [
      {
        quote: "Up to 2 million buyers when a major tour goes on sale.",
        meaning:
          "Load jumps 400 times in a few seconds, then falls. A system sized for the peak is idle almost always. A system sized for normal days fails at the peak.",
      },
      {
        quote: "The system must never sell one seat to two buyers.",
        meaning:
          "This is a hard correctness rule in the middle of the busiest path. Speed and correctness pull in opposite directions here.",
      },
      {
        quote: "Bots try to buy tickets in bulk.",
        meaning: "Part of the peak is hostile. The design needs a control point before the seat logic.",
      },
      {
        quote: "Venue scanners must work when the venue network fails.",
        meaning: "Ticket checks cannot call the central system. The scanner needs the data locally.",
      },
    ],
    characteristics: [
      {
        name: "Elasticity",
        why: "The jump from 5,000 to 2 million buyers decides everything else. Ties to the user numbers.",
      },
      {
        name: "Data consistency",
        why: "One seat, one buyer, with no exception. Ties to the double-sale rule.",
      },
      {
        name: "Availability",
        why: "A failed sale is front-page news. Ties to the last constraint.",
      },
    ],
    style: {
      name: "Space-based",
      why: "At the peak, a database in the request path becomes the limit. Space-based keeps the seat map in memory in the processing units, so seat selection and holds do not touch the database. Units start in seconds when a sale opens and stop after it. To keep consistency, each event belongs to exactly one unit at a time, so one seat has one owner and a hold is a single in-memory operation. Completed sales go to the database in the background through events.",
      rejected: [
        {
          name: "Microservices",
          why: "Independent services help, but each seat hold would still go to a database. The database is the part that fails at 2 million buyers.",
        },
        {
          name: "Modular monolith",
          why: "Correct and cheap on a normal day. It cannot grow 400 times in seconds.",
        },
      ],
    },
    diagram: {
      nodes: [
        { id: "buyer", label: "Buyer\nbrowser", col: 0, row: 0 },
        { id: "queue", label: "Bot filter +\nwaiting room", col: 1, row: 0 },
        { id: "seats", label: "Seat units\n(seat map in memory)", col: 2, row: 0 },
        { id: "pay", label: "Payment\nservice", col: 3, row: 0 },
        { id: "provider", label: "Payment\nprovider", col: 3, row: 1.1, external: true },
        { id: "promoter", label: "Promoter\nadmin", col: 1, row: 1.1 },
        { id: "writer", label: "Order writer", col: 2, row: 1.1 },
        { id: "db", label: "Database", col: 2, row: 2.2 },
        { id: "tickets", label: "Ticket service", col: 3, row: 2.2 },
        { id: "scanner", label: "Venue scanners\n(local ticket list)", col: 3, row: 3.3 },
      ],
      edges: [
        { from: "buyer", to: "queue", label: "enter sale" },
        { from: "queue", to: "seats", label: "let in slowly" },
        { from: "seats", to: "pay", label: "hold + pay" },
        { from: "pay", to: "provider", label: "charge" },
        { from: "promoter", to: "seats", label: "release seats" },
        { from: "seats", to: "writer", label: "seat sold", async: true },
        { from: "writer", to: "db", label: "write" },
        { from: "writer", to: "tickets", label: "confirmed", async: true },
        { from: "tickets", to: "scanner", label: "signed tickets", async: true },
      ],
    },
    walkthrough: [
      "Read from left to right. That is the path of a buyer during a sale.",
      "The waiting room is the control point. It blocks bots and lets buyers in at a rate the seat units can handle.",
      "The seat units hold the seat map in memory. A hold marks a seat for some minutes and expires if the buyer does not pay.",
      "The order writer and the database are below the seat units, after a dashed arrow. No buyer waits for them.",
      "Tickets are signed and copied to the scanners before the doors open. A scanner checks the signature without a network.",
    ],
    tradeoffs: [
      "A sale that is confirmed in memory is not in the database for a short time. This is acceptable only because 'seat sold' events are stored in a durable log first, so a unit that fails can be rebuilt.",
      "One unit owns each event, so the unit for a huge event is a hot spot. This is acceptable because one seat map fits in memory, and a second unit holds a live copy.",
      "The design is expensive and hard to test. This is acceptable because one failed major sale costs more than the system.",
      "Buyers wait in a queue. This is acceptable because a visible queue is better than an error page.",
    ],
    risks: [
      "The owner unit fails during a sale. The copy must take over with all the holds, or seats are sold twice.",
      "The payment provider is slower than the hold time. Holds expire for buyers who are in the payment step.",
      "A scanner with an old ticket list rejects a late purchase. Scanners must sync again when the network returns.",
    ],
    reviewQuestions: [
      "Two buyers click the same seat in the same millisecond. Follow both requests through your diagram.",
      "The unit that owns the event fails 30 seconds into the sale. Which seats are in doubt, and how do you resolve them?",
      "How does this system cost almost nothing in the weeks between major sales?",
    ],
    alternative: {
      title: "A different, valid answer: reduce the load, do not absorb it",
      body: "Keep a simple service-based design with a normal database, and make the waiting room strict. If it admits only 2,000 buyers at a time, the database sees a load it can handle, and normal transactions prevent double sales. This costs far less and is much easier to test. The price is a longer wait for buyers. This answer is better if the company cannot staff a team for an in-memory data grid.",
    },
  },
  {
    kataId: "tutor-marketplace",
    hardParts: [
      {
        quote: "How would you design the Preply platform?",
        meaning:
          "The prompt has no scope and no numbers. The first task is to select the core flows and state assumptions. An answer that designs everything designs nothing well.",
      },
      {
        quote: "connecting tutors to learners all around the globe",
        meaning:
          "This is a two-sided marketplace. Tutors and learners are in different time zones and use different currencies. A lesson is a slot in a calendar plus a payment, and both must be correct.",
      },
      {
        quote: "a machine-learning algorithm that recommends the best tutors",
        meaning:
          "Recommendation is the first step of the main flow. Models are trained offline on past behavior and served online. That part changes on a different schedule from the rest, and the platform must still work when it fails.",
      },
    ],
    assumptions: [
      "Core flow: find a tutor, book a lesson, pay, and take the lesson by video. Reviews, chat, and tutor onboarding are out of scope.",
      "Scale: about 50,000 active tutors, a few million learners, and tens of thousands of lessons at the same time at peak.",
      "The platform buys video and card payments from providers. It does not build them.",
      "Searches are far more frequent than bookings. A booking is rare but must be exact.",
    ],
    characteristics: [
      {
        name: "Data consistency",
        why: "One tutor slot goes to one learner, and each lesson is paid once. Ties to the marketplace: calendar and money.",
      },
      {
        name: "Availability",
        why: "A lesson has a fixed start time. If the classroom is down at that time, the product has failed for two people. Ties to live lessons across time zones.",
      },
      {
        name: "Deployability",
        why: "The recommendation models change each week. Booking and payments change with care. Ties to the machine-learning sentence.",
      },
    ],
    style: {
      name: "Service-based",
      why: "The platform has four areas with different needs: search and recommendations (read-heavy, changes often), tutor profiles and calendars, booking and payments (exact, changes with care), and the classroom (live, must be up). A few coarse services let each area deploy and scale on its own. Booking and payments stay in one service with one database, so 'reserve the slot and record the payment' is one local transaction. The recommendation side learns from the other services through events, so it never slows a booking.",
      rejected: [
        {
          name: "Microservices",
          why: "A split between booking and payments forces a distributed transaction on the one path that must be exact. The assumed scale does not justify that cost.",
        },
        {
          name: "Modular monolith",
          why: "A good answer for an early company. It is weaker here because model serving and live video have very different load and release schedules from the rest.",
        },
      ],
    },
    diagram: {
      nodes: [
        { id: "learner", label: "Learner app", col: 1, row: 0 },
        { id: "tutor", label: "Tutor app", col: 2, row: 0 },
        { id: "gateway", label: "API gateway", col: 1.5, row: 1 },
        { id: "search", label: "Search +\nrecommendations", col: 0, row: 2.1 },
        { id: "profiles", label: "Tutor profiles + calendar\n(own database)", col: 1, row: 2.1 },
        { id: "booking", label: "Booking + payments\n(own database)", col: 2, row: 2.1 },
        { id: "classroom", label: "Classroom", col: 3, row: 2.1 },
        { id: "index", label: "Search index\n+ served model", col: 0, row: 3.3 },
        { id: "stream", label: "Event stream", col: 1, row: 3.3 },
        { id: "pay", label: "Payment\nprovider", col: 2, row: 3.3, external: true },
        { id: "video", label: "Video\nprovider", col: 3, row: 3.3, external: true },
        { id: "training", label: "Model training\n(offline)", col: 0.5, row: 4.5 },
      ],
      edges: [
        { from: "learner", to: "gateway", label: "search, book, join" },
        { from: "tutor", to: "gateway", label: "calendar, teach" },
        { from: "gateway", to: "search" },
        { from: "gateway", to: "profiles" },
        { from: "gateway", to: "booking" },
        { from: "gateway", to: "classroom" },
        { from: "search", to: "index", label: "query" },
        { from: "booking", to: "profiles", label: "reserve slot" },
        { from: "booking", to: "pay", label: "charge, pay out" },
        { from: "classroom", to: "video", label: "video rooms" },
        { from: "profiles", to: "stream", label: "changes", async: true },
        { from: "booking", to: "stream", label: "booked, completed", async: true },
        { from: "stream", to: "training", label: "behavior", async: true },
        { from: "training", to: "index", label: "new model, index", async: true },
      ],
    },
    walkthrough: [
      "Read the middle row first. Those four boxes are the services. Each one owns its data.",
      "A search goes left: gateway, search service, index. It never touches the booking database, so heavy search load cannot slow a booking.",
      "A booking is the one path with solid arrows only. The booking service reserves the slot and charges the card before it confirms.",
      "The dashed arrows are the learning loop. Bookings and completed lessons flow to offline training, and training publishes a new model and index.",
      "The classroom depends only on the video provider at lesson time. A failure in search or payments does not stop a lesson that is already booked.",
    ],
    tradeoffs: [
      "The search index is some minutes behind the calendars. A learner can see a slot that was just taken. This is acceptable because the booking service checks the slot again, in a transaction, before it confirms.",
      "A new tutor or learner has no history, so recommendations for them are weak. This is acceptable with a fallback ranking by language, price, and rating.",
      "'Reserve slot' is a call between two services. This is acceptable only because the calendar service is the single owner of slots and the reservation is one atomic write there.",
      "The video provider is a dependency the platform cannot fix. This is acceptable because live video is not the business, and a second provider can be added behind the classroom service.",
    ],
    risks: [
      "The payment succeeds but the booking is not confirmed, or the reverse. The booking service needs a pending state and a job that resolves each pending booking against the provider.",
      "The recommendation service is down. The gateway must fall back to a plain search, so learners can still find tutors.",
      "A time zone or daylight-saving error puts the lesson at the wrong hour. The system stores each slot in UTC and converts only for display.",
    ],
    reviewQuestions: [
      "Two learners book the last slot of one tutor in the same second. Follow both requests. Who gets the slot, and what does the other learner see?",
      "How do you know a new recommendation model is better before all learners get it?",
      "The card is charged, and then the booking service fails. What state is the lesson in, and who repairs it?",
    ],
    alternative: {
      title: "A different, valid answer: start as a modular monolith",
      body: "Build profiles, calendar, booking, and payments as modules in one deployment. Keep only two things separate: the recommendation service, because it has its own data and release schedule, and the video provider. This is cheaper and faster to change for a young company. It becomes the wrong answer when teams block each other on releases. In an interview, saying which stage of the company you design for is part of the answer.",
    },
  },
  {
    kataId: "agent-triggers",
    hardParts: [
      {
        quote: "that becomes exactly one run",
        meaning:
          "Providers send a notification twice, late, or never. Exactly-once delivery does not exist. You get the same result with at-least-once delivery plus a unique key for each event, so a repeat is rejected.",
      },
      {
        quote: "These triggers run unattended for months.",
        meaning:
          "Access tokens expire. Provider subscriptions expire after some days and must be renewed. An admin can revoke access. Each of these stops a trigger with no error on the screen of anyone.",
      },
      {
        quote: "Later, the same should work for Slack messages, Google Sheet rows and Jira tickets.",
        meaning:
          "The core must know nothing about email. Each source needs to be a plug-in behind one contract.",
      },
      {
        quote: "startRun(agentId, input) queues a run and returns its ID",
        meaning:
          "This is the boundary of the design. The dangerous moment is a crash after startRun succeeds and before the run ID is saved.",
      },
      {
        quote: "how you'd know it's working, and how you'd find out when it isn't",
        meaning:
          "A quiet inbox and a broken connection look the same: no events. The design needs an active check that tells them apart.",
      },
    ],
    characteristics: [
      {
        name: "Data consistency",
        why: "One email is one run. Not zero, not two. Ties to 'exactly one run'.",
      },
      {
        name: "Fault tolerance",
        why: "Providers, tokens, and subscriptions fail over months, and the system must recover without a person. Ties to 'unattended for months'.",
      },
      {
        name: "Extensibility",
        why: "Slack, Sheets, and Jira come next. Ties to the 'later' sentence.",
      },
    ],
    style: {
      name: "Event-driven",
      why: "The sources send changes at their own pace, and a webhook must be answered in seconds. So the receiving step only stores a job in a queue and answers. All real work occurs in the background, where it can be retried. Each source is a connector plug-in with one contract: connect, subscribe, renew, fetch changes since a cursor, and convert to a common event. Notifications are treated as hints. The worker always asks the provider 'what changed since my cursor?', so a lost or repeated notification does no harm.",
      rejected: [
        {
          name: "One synchronous handler",
          why: "The webhook handler calls startRun directly. This is the simplest design, but a crash or a slow startRun loses the event, and nothing retries it.",
        },
        {
          name: "Microservices, one for each source",
          why: "It gives isolation between sources, at a high operating cost. A plug-in contract in one worker gives the same extension point for much less.",
        },
      ],
    },
    diagram: {
      nodes: [
        { id: "ui", label: "Customer\nsetup UI", col: 0, row: 0 },
        { id: "conn", label: "Connections + triggers\n(tokens, config, health)", col: 1, row: 0 },
        { id: "provider", label: "Gmail / Outlook", col: 2, row: 0, external: true },
        { id: "events", label: "Event store\n(unique event key)", col: 0, row: 1.2 },
        { id: "worker", label: "Sync worker\n+ source connectors", col: 1, row: 1.2 },
        { id: "ingest", label: "Webhook ingest", col: 2, row: 1.2 },
        { id: "dispatcher", label: "Dispatcher", col: 0, row: 2.4 },
        { id: "sched", label: "Scheduler\n(poll + renew)", col: 1, row: 2.4 },
        { id: "queue", label: "Sync queue", col: 2, row: 2.4 },
        { id: "run", label: "startRun(agentId, input)", col: 0, row: 3.6, external: true },
      ],
      edges: [
        { from: "ui", to: "conn", label: "connect" },
        { from: "conn", to: "provider", label: "subscribe" },
        { from: "provider", to: "ingest", label: "change notice" },
        { from: "ingest", to: "queue", label: "sync job", async: true },
        { from: "sched", to: "queue", label: "poll, renew", async: true },
        { from: "queue", to: "worker", label: "job", async: true },
        { from: "worker", to: "provider", label: "fetch changes" },
        { from: "worker", to: "conn", label: "tokens, cursor" },
        { from: "worker", to: "events", label: "insert" },
        { from: "events", to: "dispatcher", label: "pending" },
        { from: "dispatcher", to: "run", label: "one run" },
      ],
    },
    walkthrough: [
      "Top row: setup. The customer signs in to Gmail or Outlook, selects the inbox and the agent, and the system subscribes to changes for that inbox.",
      "Right column: a change notice arrives. The ingest step checks it, puts a sync job in the queue, and answers the provider immediately.",
      "Middle: the sync worker takes the job, asks the provider for all changes since the saved cursor, and inserts one event for each new email. The key is (trigger, provider message ID). A repeat insert fails, and that is the duplicate protection.",
      "Left column: the dispatcher reads pending events, calls startRun, and saves the run ID on the event.",
      "The scheduler adds the same sync job for each connection every few minutes, with or without a notice. Webhooks give speed. The poll gives correctness.",
      "A new source, such as Slack, is a new connector in the sync worker. No other box changes.",
    ],
    tradeoffs: [
      "A run can start seconds or minutes after the email arrives, not immediately. This is acceptable for operational work, and it is the price of retries.",
      "The poll calls each provider for each connection even when nothing changed. This costs API quota. It is acceptable because it is the only protection against a silent missed notice.",
      "The event store keeps a record for each email forever, or duplicates return after cleanup. A retention period longer than any possible provider replay is acceptable.",
      "If startRun does not accept an idempotency key, a crash between the call and the save can start a second run. The clean fix is to ask the owner of startRun to accept the event ID as a key.",
    ],
    risks: [
      "A refresh token is revoked. The connection must change to 'needs sign-in', all its triggers must show that state, and the customer must get a message.",
      "The cursor is too old and the provider refuses it. The connector must do a full resync from a safe time and rely on the unique key to drop repeats.",
      "One customer receives 50,000 emails in an hour. Jobs need a limit for each customer, so one inbox cannot delay all the others.",
      "An event fails each time, for example an agent that was deleted. After some retries it goes to a dead-letter list that a person can inspect and replay.",
    ],
    operations: [
      "Measure the delay from 'email received' (provider time) to 'run started'. Alert on the slowest cases, not the average.",
      "For each connection, record the last successful sync. Alert when a connection has not synced for some poll periods.",
      "Run a canary: a test inbox that gets an email every few minutes and must produce a run. This finds a failure when no customer event is in flow.",
      "Alert on subscriptions close to expiry, on token refresh failures, and on the size of the dead-letter list.",
      "Show each customer a trigger status and an activity log: event received, run started, or skipped and why. Customers then find and report problems with exact data.",
    ],
    reviewQuestions: [
      "The dispatcher calls startRun, gets the run ID, and crashes before it saves the ID. What occurs on restart?",
      "A webhook for one email arrives twice, and the poll finds the same email. Show where each of the three paths ends.",
      "A shared inbox gets no email for five days. How do you know that the trigger still works?",
      "What exactly do you write to add Jira tickets as a source?",
    ],
    alternative: {
      title: "A different, valid answer: poll only",
      body: "Remove the webhooks. The scheduler polls each connection every minute and the rest of the design stays the same. This removes subscription renewal, webhook security, and the ingest step, which are a large part of the failure modes. The price is a delay of up to one minute and more provider API calls. For a finance inbox, one minute is probably fine. This is a strong first version, with webhooks added later only for the sources that need speed.",
    },
  },
  ...interviewExamples,
];

export function getWorkedExample(kataId: string): WorkedExample | undefined {
  return workedExamples.find((example) => example.kataId === kataId);
}
