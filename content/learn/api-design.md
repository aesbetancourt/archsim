## An API is a promise

An API is the part of a service that other teams depend on. The code behind it can change each day. The API cannot, because each change can break a caller that you do not control. For this reason, the API is an architecture decision and the code behind it is not.

## The main forms

| Form | How it works | Good for |
|---|---|---|
| REST over HTTP | Resources with addresses, and standard operations: read, create, change, delete | Public APIs, web and mobile clients |
| RPC, for example gRPC | The caller calls a named function with typed data | Calls between internal services, where speed matters |
| GraphQL | The client asks for exactly the fields it needs, in one request | Clients with many different screens |
| Events | The service publishes facts. See [Messaging](/learn/messaging) | Reactions that do not need an answer |

The form matters less than the rules below.

## Rules for a good API

- **Design it from the side of the caller.** Offer the operation the caller needs, such as "cancel the order". Do not expose your tables.
- **Hide the inside.** A caller must not need to know how you store data. Then you can change it.
- **Make changes safe to repeat.** Accept an [idempotency key](/glossary#idempotency-key) on each operation that creates or changes something.
- **Return lists in pages.** A list with no limit works in the test and fails in production. Use a [cursor](/glossary#cursor).
- **Give clear errors.** The caller must know: was it my fault, was it yours, and can I try again?
- **Limit each caller.** See [rate limit](/glossary#rate-limit).

## How to change an API

| Change | Safe for old callers? |
|---|---|
| Add an optional field to a request | Yes |
| Add a field to an answer | Yes, if callers ignore fields they do not know |
| Add a new operation | Yes |
| Remove or rename a field | No |
| Change the meaning of a field | No, and it is the most dangerous, because nothing fails visibly |

Make only safe changes when you can. For a change that is not safe, offer a new version next to the old one, tell the callers, measure who still uses the old one, and remove it only when nobody does. This takes months. Plan for it.

## The API gateway

When there are several services, an [API gateway](/glossary#api-gateway) gives clients one address. It checks identity, applies limits, and sends each request to the right service. Keep business rules out of it. A gateway with business rules becomes a part that each team must change.

## In a kata

For the main arrows from a client, be ready to name the operation: "POST /orders, with an idempotency key, returns the order with status pending". One exact example shows more than a general statement.

## Further reading

- [REST](https://en.wikipedia.org/wiki/REST), [gRPC](https://en.wikipedia.org/wiki/GRPC), and [OpenAPI Specification](https://en.wikipedia.org/wiki/OpenAPI_Specification) on Wikipedia
