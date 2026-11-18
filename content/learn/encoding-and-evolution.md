## What this is and why it matters

A program keeps data in memory as objects, lists, and pointers. To store the data or to send it over the network, the program must turn it into bytes. This is **encoding**, also called serialization. The reverse is **decoding**.

The format looks like a detail. It is not, because data lives longer than code. A row written today is read by the code of next year. A message sent by version 7 of a service is read by version 6 on a server that is not yet updated.

So the real question is **evolution**: how do you change the shape of the data while old and new code run at the same time? Kleppmann treats this as a core property of a system that can change (DDIA, the part on encoding and evolution). An architect needs it for each database, each API, and each topic in a design.

## Two directions of compatibility

During a rolling upgrade, some servers run the new code and some run the old code. Mobile apps are worse: some users never update. So data goes in both directions.

- **Backward compatibility:** new code can read data that old code wrote.
- **Forward compatibility:** old code can read data that new code wrote.

Backward compatibility is the easier one, because the author of the new code knows the old format. Forward compatibility is harder, because old code must ignore things that did not exist when it was written.

```diagram
{
  "nodes": [
    { "id": "v1", "label": "Parcel service\nversion 1", "shape": "box", "col": 0, "row": 0 },
    { "id": "v2", "label": "Parcel service\nversion 2", "shape": "box", "col": 0, "row": 2 },
    { "id": "db", "label": "Parcels\n(rows of v1 and v2)", "shape": "store", "col": 2, "row": 1 }
  ],
  "groups": [{ "id": "up", "label": "Rolling upgrade", "col": 0, "row": 0, "cols": 1, "rows": 3 }],
  "edges": [
    { "from": "v1", "to": "db", "label": "reads v2 rows:\nforward", "both": true },
    { "from": "v2", "to": "db", "label": "reads v1 rows:\nbackward", "both": true }
  ]
}
```

Many tools, such as schema registries, use the same names for their compatibility checks. Read their definitions, because some also check older versions of the schema, not only the last one.

## Language-specific formats

Java has `Serializable`, Python has `pickle`, and Ruby has `Marshal`. They are easy: one call saves an object. DDIA lists their dangers:

- **One language only.** Another service in another language cannot read the data.
- **Security.** To decode, the library creates objects of classes named in the bytes. An attacker who controls the bytes can make the program run code. Many real attacks used this.
- **Versions.** These formats give little help when a class changes.
- **Efficiency.** Some of them are slow and large.

Use them only for data that lives a few seconds inside one process. Never decode such bytes from a source that you do not trust.

## JSON, XML, and CSV

Text formats are the usual choice between organizations. People can read them, and every language supports them. They also have limits:

| Problem              | Detail                                                                                                                                   |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| Numbers              | JSON does not separate integers from decimals. JavaScript reads integers above 2^53 with errors, so large IDs are often sent as strings. |
| Binary data          | Text cannot hold bytes. Base64 is the usual fix, and it makes the data about one third larger.                                           |
| Schemas are optional | JSON Schema and XML Schema exist, but many teams do not use them. Then the code holds the format, and nothing checks it.                 |
| CSV has no types     | A column has no type and no name in the data itself. Commas and line breaks in values cause errors.                                      |
| Size                 | Each record repeats every field name.                                                                                                    |

Binary versions of JSON, such as MessagePack, make the data a little smaller. They still put each field name in each record.

For a public API, JSON is usually correct, because the reach is more important than the size. Inside one organization, between services that you own, a binary format with a schema gives more.

## Binary formats with a schema

Protocol Buffers (from Google), Thrift (from Facebook), and Avro (from the Hadoop project) all use a **schema**: a written description of the fields and their types. Code generators make classes from it in many languages.

### Field tags: Protocol Buffers and Thrift

In Protocol Buffers and Thrift, each field has a number, the **field tag**. The encoded bytes hold the tag and the value, not the field name.

```proto
message Parcel {
  string tracking_id = 1;
  int64 weight_grams = 2;
  string note = 3;
}
```

The tag is the identity of the field. This gives the rules:

- **You can rename a field.** The name is not in the data.
- **You can add a field with a new tag.** Old code sees an unknown tag and skips it. This gives forward compatibility.
- **A new field must be optional or have a default.** New code that reads an old record finds no value. This gives backward compatibility.
- **You can remove a field only if it is optional.** Never use its tag again, because old data still holds values with that tag. Protocol Buffers has a `reserved` statement for this.
- **Changing a type is risky.** From a 32-bit integer to a 64-bit one works for new readers. Old readers cut large values.

Proto2 had `required` fields. A required field can never be removed safely, so proto3 removed the keyword.

### Writer's and reader's schema: Avro

Avro has no tags. The bytes hold only the values, one after the other, so the data is very small. To decode, the reader needs the exact schema that the writer used.

Avro uses two schemas:

- The **writer's schema**: the one the writer used to encode the data.
- The **reader's schema**: the one the reading code expects.

The library compares them by field name. A field that only the writer has is ignored. A field that only the reader has gets its default value. So the rule is: add or remove only fields that have a default value. In Avro, `null` is not a default for every field. A field that can be empty is a union type, `["null", "string"]`, with `null` as its default.

How does the reader know the writer's schema? It depends on the dataflow:

| Context                 | Where the writer's schema is                                                      |
| ----------------------- | --------------------------------------------------------------------------------- |
| A large file of records | Once, at the start of the file                                                    |
| A database or a topic   | A schema version number in each record, and a registry that maps it to the schema |
| A network connection    | The two sides agree on the schema when the connection starts                      |

Avro is good when schemas are generated. For example, a tool can make one Avro schema for each database table and update it when a column changes. With tags, someone must assign the numbers by hand.

### The three compared

| Property                 | JSON (no schema)         | Protocol Buffers and Thrift           | Avro                                  |
| ------------------------ | ------------------------ | ------------------------------------- | ------------------------------------- |
| Field identity           | The name, in each record | The tag number                        | The name, matched between two schemas |
| Size                     | Large                    | Small                                 | Smallest                              |
| People can read it       | Yes                      | No                                    | No                                    |
| Needs the schema to read | No                       | No, but unknown fields are only bytes | Yes, the writer's schema              |
| Generated schemas        | Not applicable           | Hard: tags by hand                    | Easy                                  |

DDIA makes a further point. A schema is also documentation that cannot go out of date, and a tool can check compatibility before a deploy.

## Safe and unsafe changes

This table is for Protocol Buffers and Thrift. Avro follows the same idea with names and defaults in place of tags.

| Change                                       | Safe? | Why                                                                |
| -------------------------------------------- | ----- | ------------------------------------------------------------------ |
| Add an optional field with a new tag         | Yes   | Old code skips it. New code uses the default for old data.         |
| Rename a field and keep its tag              | Yes   | The name is not in the data. Generated code must change.           |
| Remove an optional field and reserve its tag | Yes   | Old code gets the default. The tag never comes back.               |
| Add a required field                         | No    | New code rejects all old data, which has no value.                 |
| Remove a required field                      | No    | Old code rejects all new data.                                     |
| Reuse the tag of a removed field             | No    | Old data is read as the new field, with the wrong meaning.         |
| Change the tag of a field                    | No    | It is a removal and an addition. Old data loses the value.         |
| Change int32 to int64                        | Risky | Old readers cut values above the 32-bit range.                     |
| Change the meaning of a field, same type     | No    | No tool can find it. Readers make wrong decisions with valid data. |
| Add a value to an enum                       | Risky | Old code must handle a value it does not know.                     |

The last two rows are the most dangerous, because no compatibility check sees them. "weight" that changes from grams to kilograms passes every check.

## Dataflow through databases

In a database, the process that writes is the past version of the process that reads. So a database needs backward compatibility. With several versions of the application at the same time, it also needs forward compatibility.

DDIA points to a quiet failure. Version 2 adds a field. Version 1 reads a row, changes one value, and writes the full row back. If version 1 does not keep the unknown field, the value from version 2 is lost. Make sure your data layer keeps fields it does not know.

**Data outlives code.** A deploy replaces all the code in minutes. The rows stay. A rewrite of all rows into the new format is a large, slow job, so most databases let old rows keep their old form. Adding a column with a null default is cheap in most relational databases. Code must handle both forms for a long time.

Backups and exports to a data warehouse are a good place to change the format. They are written once, so you can write them in the latest schema.

## Dataflow through services

### REST and RPC

With services, the client and the server are often owned by different teams and deployed at different times. A common assumption: you update the servers first and the clients later. Then the server needs backward compatibility for requests and forward compatibility for responses.

Two styles exist:

- **REST** uses HTTP as it is: URLs for resources, methods for actions, and status codes. It is usually JSON. See [API design](/learn/api-design).
- **RPC** (remote procedure call) makes a call to another service look like a call to a local function. gRPC, Thrift, and older systems such as CORBA work this way.

### The problems of RPC

DDIA explains why a network call is not like a local call, and why to hide the difference is a mistake:

| A local call                        | A network call                                                                                           |
| ----------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Returns a result or an error        | Can also get no answer. You do not know if the action ran.                                               |
| Safe to call again                  | A retry can run the action twice, unless it is [idempotent](/learn/distributed-transactions#idempotency) |
| Takes about the same time each time | Can be fast, slow, or time out, without warning                                                          |
| Passes a pointer to an object       | Must encode all parameters, which is costly for large objects                                            |
| Same types on both sides            | Types must map between languages. Large numbers are a known problem.                                     |

Modern RPC frameworks accept this. gRPC has deadlines, status codes, and streams. They are useful inside an organization. A public API usually stays REST and JSON, because every client can use it.

### Versions of an API

A service cannot force all clients to update. So it must support old clients for a long time. A version in the URL (`/v2/parcels`), a version in a header, or a version stored for each API key are the common ways. For the rules to change an API safely, see [API design](/learn/api-design#how-to-change-an-api).

## Dataflow through messages

A message broker is between the two forms above. The sender does not wait, and it often does not know who reads. So the same rules apply. A consumer that is not yet updated must handle new messages (forward). A consumer that is updated must handle old messages still in the topic (backward).

A log-based broker keeps messages for days or longer, and a consumer can replay them. So a new consumer reads messages that are months old. A schema registry checks each new schema against the old ones before a producer can use it. A consumer must also pass on unknown fields when it forwards a message.

Actor frameworks, such as Akka, Orleans, and Erlang/OTP, send messages between processes on many machines. A rolling upgrade of such a system has the same problem, because old and new nodes exchange messages.

See [Messaging](/learn/messaging) and [Batch and stream processing](/learn/batch-and-stream).

## Failure modes

| Failure                         | What occurs                                                  | Protection                                               |
| ------------------------------- | ------------------------------------------------------------ | -------------------------------------------------------- |
| A required field is added       | All old data and old clients are rejected after the deploy   | Only optional fields with defaults                       |
| A tag is reused                 | Old records decode with a wrong meaning, and no error shows  | Reserve the tags and names of removed fields             |
| Old code drops unknown fields   | A read and write back by old code deletes new data           | Keep unknown fields in the data layer                    |
| A meaning changes               | Values are valid and wrong                                   | A new field with a new name, never a new meaning         |
| Large IDs in JSON               | A JavaScript client rounds the ID and finds the wrong record | Send large IDs as strings                                |
| Decoding untrusted native bytes | Remote code execution                                        | Never use a language-specific format at a trust boundary |

## In a kata

Each arrow and each store in your diagram carries data that will change. Say how. A short line is enough: "Events in Avro with a schema registry. Producers can add only fields with defaults." For a public API, say: "JSON over HTTPS, additive changes only, a new version for a breaking change."

When a kata has a mobile client, say that old app versions stay in use for months. The server must accept their requests. The [payment system kata](/kata/payment-system) and the [notification service kata](/kata/notification-service) both have several producers and consumers of the same events.

## Interview questions

**"What is the difference between backward and forward compatibility?"**

- Backward: new code reads old data. Forward: old code reads new data.
- During a rolling upgrade, you need both.
- Give an example of each from the design.

**"How do you add a field to a message that ten services consume?"**

- Add it as optional, with a default, and a new tag.
- Deploy the consumers in any order. Old ones skip the field.
- Producers start to fill it. A registry checks the change.
- Never make it required later.

**"Why do Protocol Buffers use field numbers?"**

- The number is the identity of the field in the bytes, so names can change.
- The data is smaller than with names.
- The cost: a removed number must never come back.

**"Why not use RPC everywhere?"**

- A network call can fail in ways that a local call cannot: no answer, slow answer, double execution.
- An RPC layer that hides this leads to code without timeouts and retries.
- RPC is fine inside an organization with deadlines and idempotency. REST and JSON reach more clients.

**"What breaks when an old version writes to the same table as a new one?"**

- The old version can drop a new field when it writes a full row back.
- New code must handle old rows for a long time, because data outlives code.

## Go deeper

- **Designing Data-Intensive Applications**, Martin Kleppmann, the part on encoding and evolution: the formats in detail, Avro schema resolution, and the three modes of dataflow.
- **Building Microservices**, Sam Newman, the parts on communication styles and on breaking changes: how to evolve a service interface and support old consumers.
- **Release It!**, Michael Nygard, the part on handling versions: how to change your interface without breaking callers, and how to survive changes in the interfaces you call.

## Further reading

- [Schema evolution in Avro, Protocol Buffers and Thrift](https://martin.kleppmann.com/2012/12/05/schema-evolution-in-avro-protocol-buffers-thrift.html), by Martin Kleppmann
- [Updating a message type](https://protobuf.dev/programming-guides/proto3/#updating), in the Protocol Buffers guide
- [Tolerant reader](https://martinfowler.com/bliki/TolerantReader.html), by Martin Fowler
- [Serialization](https://en.wikipedia.org/wiki/Serialization) on Wikipedia
