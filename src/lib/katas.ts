import { interviewKatas } from "./interview-katas";

export type Kata = {
  id: string;
  title: string;
  difficulty: "starter" | "medium" | "hard";
  context: string;
  users?: string;
  requirements: string[];
  constraints: string[];
  // Set for a real interview prompt.
  interview?: boolean;
  // More paragraphs of the problem text.
  details?: string[];
  // Set for a kata from an external collection.
  source?: { name: string; url: string; credit?: string };
  // Set for a problem that the user added.
  custom?: boolean;
  // Extra guidance for the person and the reviewer.
  note?: string;
};

export const katas: Kata[] = [
  {
    id: "lunch-rush",
    title: "Lunch Rush",
    difficulty: "starter",
    context:
      "A regional chain of 40 sandwich shops wants online ordering. Today, customers order at the counter only.",
    users: "Thousands of customers each day. Most orders arrive between 11:30 and 13:30.",
    requirements: [
      "Customers order online and select a pickup time.",
      "Each shop sees its incoming orders on a kitchen screen.",
      "Head office changes menus and prices. Shops can add local specials.",
      "Customers pay online or at pickup.",
      "Customers get a message when the order is ready.",
    ],
    constraints: [
      "The company has a team of four developers.",
      "A shop must continue to take orders when its internet connection is slow.",
      "The owner wants to add delivery partners next year.",
    ],
  },
  {
    id: "gavel",
    title: "Gavel",
    difficulty: "medium",
    context:
      "An auction house wants to open its live auctions to online bidders across the country.",
    users: "Up to 500 bidders in the room. Up to 50,000 online bidders for one auction.",
    requirements: [
      "Online bidders watch a live video stream of the auction.",
      "Online bidders place bids in real time against bidders in the room.",
      "The auctioneer sees the highest bid from all sources immediately.",
      "Bidders register with a payment card before the auction starts.",
      "The system records each bid for legal audit.",
    ],
    constraints: [
      "A bid that arrives late or out of order has legal consequences.",
      "Auctions occur a few times each month. Traffic is near zero between them.",
      "The company expects to expand to other countries.",
    ],
  },
  {
    id: "tow-line",
    title: "Tow Line",
    difficulty: "medium",
    context:
      "An insurer wants a roadside assistance service. Drivers request help, and the nearest partner truck gets the job.",
    users: "Two million policy holders. 3,000 independent tow operators.",
    requirements: [
      "A driver requests help from a phone and shares a location.",
      "The system assigns the job to an available operator near the driver.",
      "The driver follows the truck on a map.",
      "Operators accept or reject jobs from a mobile app.",
      "The insurer pays operators and reports on response times.",
    ],
    constraints: [
      "Requests increase sharply during storms.",
      "Drivers are often in areas with weak mobile coverage.",
      "The insurer already has a policy system that is offline for two hours each night.",
    ],
  },
  {
    id: "front-row",
    title: "Front Row",
    difficulty: "hard",
    context:
      "A ticket seller handles concerts for large venues. Popular shows sell out in minutes.",
    users: "Usually 5,000 buyers online. Up to 2 million buyers when a major tour goes on sale.",
    requirements: [
      "Buyers select seats on a venue map.",
      "The system holds selected seats for a short time during payment.",
      "The system must never sell one seat to two buyers.",
      "Promoters set prices and release more seats at any time.",
      "Buyers receive digital tickets that venue scanners can check.",
    ],
    constraints: [
      "Bots try to buy tickets in bulk.",
      "Venue scanners must work when the venue network fails.",
      "A failed sale for a major tour is front-page news.",
    ],
  },
  {
    id: "waiting-room",
    title: "Waiting Room",
    difficulty: "hard",
    context:
      "A group of 120 clinics wants one system for appointments, check-in, and visit notes. Each clinic uses different software today.",
    users: "900 doctors, 2,500 staff, and 1.5 million patients.",
    requirements: [
      "Patients book and change appointments online.",
      "Patients check in at a kiosk or on a phone.",
      "Doctors read and write visit notes during the appointment.",
      "A patient record is available at each clinic in the group.",
      "The group sends billing data to several insurers.",
    ],
    constraints: [
      "Health data law requires access audit and data residency in the country.",
      "Clinics must continue to see patients during a system outage.",
      "The clinics move to the new system one at a time over two years.",
    ],
  },
  {
    id: "tutor-marketplace",
    title: "Tutor Marketplace",
    difficulty: "medium",
    interview: true,
    context:
      "A company runs an online language learning marketplace, connecting tutors to learners all around the globe. Its engine is powered by a machine-learning algorithm that recommends the best tutors for each learner. How would you design the platform?",
    requirements: [],
    constraints: [],
    note: "This is an open interview prompt. It gives no numbers and no scope. State your assumptions on scale, select the core flows you design for, and say what you leave out.",
  },
  {
    id: "agent-triggers",
    title: "Agent Triggers",
    difficulty: "hard",
    interview: true,
    context:
      "Our customers build AI agents that do operational work. They want to say: \"when something happens in one of my tools, run my agent on it\". Design everything that occurs before the run starts.",
    requirements: [
      "Start with one case: when an email arrives in a shared finance inbox (Gmail or Outlook), run the agent on it.",
      "Customers connect their accounts, and we keep those connections working.",
      "A customer sets up a trigger.",
      "We find out something happened, and that becomes exactly one run.",
      "Tell us how you would operate this over time: how you would know it is working, and how you would find out when it is not.",
    ],
    constraints: [
      "Running the agent is solved: startRun(agentId, input) queues a run and returns its ID.",
      "Later, the same should work for Slack messages, Google Sheet rows, and Jira tickets.",
      "These triggers run unattended for months.",
    ],
    note: "This is an interview prompt. In the interview, you sketch the design as you talk.",
  },
  ...interviewKatas,
];

export function getKata(id: string): Kata | undefined {
  return katas.find((kata) => kata.id === id);
}
