## An API is a promise

An API is the part of a service that other teams depend on. The code behind it can change each day. The API cannot, because each change can break a caller that you do not control. For this reason, the API is an architecture decision and the code behind it is not.

The promise has more parts than the list of operations. It includes the format of each message, the error codes, the speed, the limits, and the behavior when something fails. Callers depend on all of these, including the parts that you did not write down.

**Hyrum's law** states this risk: with enough callers, each behavior that callers can see becomes something that one of them depends on. A list that is always sorted, by accident, becomes a list that must stay sorted. Document what you promise, and make the rest of the behavior vary or stay hidden.

## The main forms

| Form                  | How it works                                                                    | Good for                                             |
| --------------------- | ------------------------------------------------------------------------------- | ---------------------------------------------------- |
| REST over HTTP        | Resources with addresses, and standard operations: read, create, change, delete | Public APIs, web and mobile clients                  |
| RPC, for example gRPC | The caller calls a named function with typed data                               | Calls between internal services, where speed matters |
| GraphQL               | The client asks for exactly the fields it needs, in one request                 | Clients with many different screens                  |
| Events                | The service publishes facts. See [Messaging](/learn/messaging)                  | Reactions that do not need an answer                 |

The form matters less than the rules below.

### REST over HTTP

REST models the domain as **resources**: `/orders/123`, `/tutors/42/lessons`. The HTTP method gives the operation. The HTTP status code gives the result.

| Method   | Use                        | Safe to repeat?                                         |
| -------- | -------------------------- | ------------------------------------------------------- |
| `GET`    | Read                       | Yes. It also changes nothing                            |
| `PUT`    | Replace the full resource  | Yes: the second call gives the same state               |
| `DELETE` | Remove                     | Yes: the resource stays removed                         |
| `PATCH`  | Change some fields         | Not always. "Add 1" is not safe; "set to 5" is          |
| `POST`   | Create, or start an action | No. Add an [idempotency key](/glossary#idempotency-key) |

REST gets much from HTTP: caches, proxies, standard tools, and clients in each language. Its weak points are many small requests for one screen, and no typed contract unless you add one, for example OpenAPI.

### gRPC

gRPC sends typed messages, defined in Protocol Buffers, over HTTP/2. A tool generates the client and server code from the definition. It is fast, compact, and supports streams in both directions. Its costs: a browser cannot call it directly without a proxy, and the binary messages are harder to read when you debug. Newman notes that RPC can hide the network. A call looks like a local function, but it can be slow or fail (Building Microservices, the part on implementing communication).

### GraphQL

The client sends a query that names the fields it needs. One request can collect data from several sources. This suits a mobile screen that needs a little of many things. Its costs:

- HTTP caches help less, because most queries go to one address.
- A client can write a very expensive query. The server must limit the depth and the cost of each query.
- A naive server makes one database call for each item in a list. Batch the calls, for example with a data loader.

### Message formats

JSON is readable and universal, but large and loosely typed. Protocol Buffers and Avro are compact and typed, and have clear rules for adding fields. For how each format handles old and new versions, see [Encoding and evolution](/learn/encoding-and-evolution).

## Rules for a good API

- **Design it from the side of the caller.** Offer the operation the caller needs, such as "cancel the order". Do not expose your tables.
- **Hide the inside.** A caller must not need to know how you store data. Then you can change it.
- **Make changes safe to repeat.** Accept an [idempotency key](/glossary#idempotency-key) on each operation that creates or changes something.
- **Return lists in pages.** A list with no limit works in the test and fails in production. Use a [cursor](/glossary#cursor).
- **Give clear errors.** The caller must know: was it my fault, was it yours, and can I try again?
- **Limit each caller.** See [rate limit](/glossary#rate-limit).

### Pages: offset or cursor

| Method | Request                       | Problem                                                                 |
| ------ | ----------------------------- | ----------------------------------------------------------------------- |
| Offset | `?offset=200&limit=50`        | Slow for deep pages. A new item moves the list, so items repeat or skip |
| Cursor | `?after=eyJpZCI6...&limit=50` | No jump to page 40. Usually not needed                                  |

A cursor is an opaque value that marks the last item the client saw. The server reads from that point with an index. Use a cursor for each list that can grow.

### Errors

| Status class | Meaning              | Can the caller retry?                       |
| ------------ | -------------------- | ------------------------------------------- |
| `4xx`        | The request is wrong | No, except `429` after the wait it asks for |
| `5xx`        | The server failed    | Yes, if the operation is safe to repeat     |

Return a body with a stable error code, a message for a person, and the field at fault. RFC 9457, "Problem Details for HTTP APIs", gives a standard shape. For `429` and `503`, send a `Retry-After` header.

### Long operations

If the work takes more than some seconds, do not hold the request open. Return `202 Accepted` and the address of a status resource. See [Synchronous and asynchronous](/learn/sync-async).

## Strict and loose contracts

Hard Parts describes contracts on a range from strict to loose (Software Architecture: The Hard Parts, the part on contracts).

|           | Strict contract                                       | Loose contract                                      |
| --------- | ----------------------------------------------------- | --------------------------------------------------- |
| Example   | A gRPC definition, a JSON Schema with required fields | A JSON document with name-value pairs, read by name |
| Advantage | The contract is exact. Tools find errors early        | Parts can change with less coordination             |
| Cost      | Each change needs a version and a coordinated release | Errors appear at run time, in production            |
| Coupling  | High                                                  | Low                                                 |

A practical reading of the trade-off: use strict contracts where exact data is essential, for example money between a payment service and a ledger. Use looser contracts between services that change at different speeds. A loose contract needs another way to find a break before production. Consumer-driven contracts are that way.

### Stamp coupling

**Stamp coupling** occurs when a service sends a large data structure, and the receiver uses only a small part of it. The tutor service sends the full tutor profile to the booking service, which needs only the name and the hourly price.

- The receiver now depends on a structure much larger than it uses. A change to any field can break it.
- Each call sends more data than necessary. At high volume, the bandwidth is a real cost.

The fix is a contract for each use: send only the fields the receiver needs. Hard Parts notes one good use of stamp coupling. In a choreographed workflow, the message can carry the state of the workflow from part to part.

## How to change an API

| Change                             | Safe for old callers?                                           |
| ---------------------------------- | --------------------------------------------------------------- |
| Add an optional field to a request | Yes                                                             |
| Add a field to an answer           | Yes, if callers ignore fields they do not know                  |
| Add a new operation                | Yes                                                             |
| Remove or rename a field           | No                                                              |
| Change the meaning of a field      | No, and it is the most dangerous, because nothing fails visibly |

Make only safe changes when you can. For a change that is not safe, offer a new version next to the old one, tell the callers, measure who still uses the old one, and remove it only when nobody does. This takes months. Plan for it.

### Expand and contract

The **expand and contract** pattern makes an unsafe change in safe steps. Example: rename `price` to `hourlyPrice`.

1. **Expand.** Add `hourlyPrice`. Send both fields. Accept both fields.
2. **Migrate.** Move each caller to `hourlyPrice`. Measure the calls that still use `price`.
3. **Contract.** When no caller uses `price`, remove it.

Each step is a safe change. The pattern also works for database columns and message formats.

### Versions

Newman gives the options for a change that breaks callers (Building Microservices, the part on handling change between services):

| Option                       | How it works                                                    | Cost                                                             |
| ---------------------------- | --------------------------------------------------------------- | ---------------------------------------------------------------- |
| Lockstep release             | The service and all callers deploy together                     | Loses independent deployment. The main reason for services       |
| Two versions of the service  | Old and new versions run side by side. The router selects one   | Two deployments to operate. A fix goes into both. Data can split |
| Two endpoints in one service | `/v1/orders` and `/v2/orders` in the same code. Old maps to new | Some extra code. One deployment, one set of data                 |

Newman prefers the third option, coexisting endpoints in one service. The old endpoint converts each request to the new form, so there is one implementation to fix.

**Semantic versioning** gives each version three numbers: `MAJOR.MINOR.PATCH`. A change to `MAJOR` breaks callers. A change to `MINOR` adds functions that are compatible. A change to `PATCH` fixes faults only. Callers can then tell from the number if an upgrade is safe.

### Postel's law and its limits

**Postel's law**, also called the robustness principle, says: be strict in what you send, and tolerant in what you accept. Newman applies it as the **tolerant reader**: a caller reads only the fields it needs, and ignores the fields it does not know. Then the provider can add fields without a break.

The principle has limits.

- **Tolerance spreads errors.** If each reader accepts bad data, the bad data travels far before it fails.
- **Tolerance becomes the contract.** Once a reader accepts a mistake, the sender can never correct it. This is Hyrum's law again.
- **Tolerance can be a security risk.** Two parts that read the same ambiguous input in different ways can be exploited.

The IETF wrote these limits down in RFC 9413, "Maintaining Robust Protocols". A good balance: ignore unknown fields, but reject data that breaks the rules of the fields you use.

### Consumer-driven contracts

In a **consumer-driven contract**, each caller writes a test of what it needs from the provider. The provider runs all these tests in its build. If a change breaks a test, the provider knows which caller breaks, before the release. Pact is a common tool for this.

Newman and Hard Parts both recommend this, for different reasons. Newman uses it to keep independent deployment safe. Hard Parts uses it to make loose contracts safe. A contract test is a kind of [fitness function](/learn/evolution).

## The API gateway

When there are several services, an [API gateway](/glossary#api-gateway) gives clients one address. It checks identity, applies limits, and sends each request to the right service. Keep business rules out of it. A gateway with business rules becomes a part that each team must change.

### Backend for frontend

Newman describes the **backend for frontend** (BFF) pattern. Each kind of client, for example the mobile app and the web app, gets its own small server-side API. The team that owns the client also owns its BFF. The BFF collects data from several services and shapes it for its screens. This keeps one shared gateway from collecting the special needs of each client. GraphQL is one way to give a similar result with one server.

## In a kata

For the main arrows from a client, be ready to name the operation: "POST /orders, with an idempotency key, returns the order with status pending". One exact example shows more than a general statement.

Also be ready to say how the API changes. In the [Payment System kata](/kata/payment-system), the contract with the ledger is strict, and each request carries an idempotency key. In the [Link Shortener kata](/kata/link-shortener), the read path is one `GET` that can be cached at the edge. In the [Tutor Marketplace kata](/kata/tutor-marketplace), the mobile app can have a BFF.

## Interview questions

**"How do you make a breaking change to a public API?"**

- First, try to avoid it: add fields, add operations, use expand and contract.
- If it must break: a new major version next to the old one, in the same service if you can.
- Tell callers, measure the use of the old version, and set a date.
- Remove the old version only when its traffic is near zero.

**"REST, gRPC, or GraphQL for this system?"**

- REST for public and browser clients: universal, cacheable, simple.
- gRPC between internal services: typed, fast, streams.
- GraphQL, or a BFF, when many client screens need different shapes of data.
- Several forms in one system is normal.

**"How does a client safely retry a payment request?"**

- The client sends an idempotency key, generated once for each intent to pay.
- The server stores the key with the result, in the same transaction.
- A repeat with the same key returns the stored result, not a second charge.

**"How do you know that a change does not break any consumer?"**

- Consumer-driven contract tests, run in the build of the provider.
- A schema check that compares the old and new definitions.
- Tolerant readers, so added fields never break callers.

**"What is stamp coupling, and why does it matter?"**

- A service sends a large structure, and the receiver uses a small part.
- The receiver depends on fields it does not use. Bandwidth is wasted.
- Fix it with a contract for each use, with only the needed fields.

## Go deeper

- **Building Microservices**, Sam Newman, the parts on implementing communication and on handling change: REST, gRPC, GraphQL, versions, expand and contract, tolerant readers, and consumer-driven contracts.
- **Software Architecture: The Hard Parts**, Ford, Richards, Sadalage, and Dehghani, the part on contracts: strict and loose contracts, stamp coupling, and consumer-driven contracts.
- **Designing Data-Intensive Applications**, Martin Kleppmann, the part on encoding and evolution: how JSON, Protocol Buffers, and Avro handle old and new versions.
- **A Philosophy of Software Design**, John Ousterhout, the part on deep modules: a small interface that hides a large implementation, which also applies to an API.

## Further reading

- [REST](https://en.wikipedia.org/wiki/REST), [gRPC](https://en.wikipedia.org/wiki/GRPC), and [OpenAPI Specification](https://en.wikipedia.org/wiki/OpenAPI_Specification) on Wikipedia
- [Consumer-Driven Contracts](https://martinfowler.com/articles/consumerDrivenContracts.html), by Ian Robinson, on martinfowler.com
- [Tolerant Reader](https://martinfowler.com/bliki/TolerantReader.html), by Martin Fowler, and [Parallel Change](https://martinfowler.com/bliki/ParallelChange.html), by Danilo Sato, on martinfowler.com
- [Robustness principle](https://en.wikipedia.org/wiki/Robustness_principle) on Wikipedia
- [Backends for Frontends](https://samnewman.io/patterns/architectural/bff/), by Sam Newman
