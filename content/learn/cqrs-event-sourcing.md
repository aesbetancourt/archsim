## Two patterns that are often confused

CQRS and event sourcing are separate patterns. They are often used together, and each can be used alone. Both add real complexity. Use them for a specific problem in a specific part of a system, never as the default for everything.

## CQRS

Command query responsibility segregation: use one model to change data and a different model to read it.

- A **command** changes something and returns little: "place this order".
- A **query** returns data and changes nothing: "show my orders".

```diagram
{
  "nodes": [
    { "id": "client", "label": "Client", "col": 0, "row": 0.55 },
    { "id": "write", "label": "Command side\n(rules, write model)", "col": 1, "row": 0 },
    { "id": "read", "label": "Query side\n(read model)", "col": 1, "row": 1.1 },
    { "id": "wstore", "label": "Write store", "col": 2, "row": 0 },
    { "id": "rstore", "label": "Read store\n(shaped for screens)", "col": 2, "row": 1.1 }
  ],
  "edges": [
    { "from": "client", "to": "write", "label": "commands" },
    { "from": "client", "to": "read", "label": "queries" },
    { "from": "write", "to": "wstore" },
    { "from": "read", "to": "rstore" },
    { "from": "wstore", "to": "rstore", "label": "changes", "async": true }
  ]
}
```

It has levels. Use the lowest one that solves your problem.

| Level | What is separate | Cost |
|---|---|---|
| 1 | Only the code: commands use the [domain model](/learn/domain-model), queries read the same database directly | Low. Often a good idea |
| 2 | Also the tables: read tables or views in the same database, shaped for the screens | Medium |
| 3 | Also the store: the read side has its own database, updated from the write side with a delay | High: the read side is [eventually consistent](/learn/consistency) |

The reason for it: the best structure to check business rules is rarely the best structure to fill a screen. A rich aggregate is good for "can this order be cancelled?" and bad for "list 50 orders with customer names". With one model for both, each side gets worse.

You have already seen level 3 in this app. In the News Feed worked example, posts are written in one place, and each feed is read from a prepared list.

## Event sourcing

Normally a database stores the current state: the balance is 70. With event sourcing, it stores every change as an event, and never changes or deletes one: opened with 100, withdrew 50, deposited 20. The current state is calculated by replaying the events.

| You get | You pay |
|---|---|
| A full history: what occurred, and when | Reads need a prepared view. So you also need CQRS |
| The state at any past moment | The format of old events must be supported forever |
| New views built from old events | Developers must learn a different way to think |
| A natural source of events for other parts | "Delete this personal data" becomes a hard problem |

A [ledger](/glossary#ledger) is event sourcing in a form that accountants have used for centuries. The Payment System worked example uses that idea for money, and normal tables for everything else. That is the right scale for it: one part where history is the product.

## Not the same as event-driven

| Term | Level | Meaning |
|---|---|---|
| [Event-driven architecture](/learn/event-driven) | System | Parts tell each other what occurred, through messages |
| Event sourcing | Storage in one part | The stored data is a list of events |

A system can have either without the other.

## When to say no

- The application mostly creates, reads, updates, and deletes records.
- The team has not used these patterns before, and the deadline is close.
- The reason is "it scales" with no number behind it.

If only one area needs it, apply it to that area. Good [boundaries](/learn/boundaries) make this possible.

## Further reading

- [CQRS](https://martinfowler.com/bliki/CQRS.html) and [Event sourcing](https://martinfowler.com/eaaDev/EventSourcing.html), by Martin Fowler
