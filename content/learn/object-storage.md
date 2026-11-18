## The question

Try the [Object Store kata](/kata/object-store) before you read this page.

"Design an object storage service, like the storage service of a cloud provider. A customer creates buckets and puts files of any size into them. The service must keep each file safe for years and return it on request."

An object store looks like a file server with an HTTP API. The hard parts are elsewhere. It must keep billions of objects safe on disks that fail every day, at a low storage cost. And it must handle a 2 KB thumbnail and a 50 GB backup with the same API. The vocabulary that interviewers expect: bucket, object, immutable, metadata store, data node, placement, replication, erasure coding, checksum, multipart upload, and versioning.

## Questions to ask first

| Question                                       | Why it changes the design                                                                         |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------- |
| Which operations: put, get, delete, list?      | Listing by prefix is a different access pattern from get by name, and changes the metadata store. |
| Can an object change after it is written?      | If not, there is no in-place update, and the design is much simpler.                              |
| What is the size range of objects?             | Many small objects stress the metadata and the file system. Large objects need multipart upload.  |
| What durability and availability are required? | This decides replication or erasure coding, and how many failure domains.                         |
| Do we need versioning?                         | Versions keep old data, add a version ID to the metadata, and change what delete means.           |
| Who can access what?                           | Users, roles, and policies on each bucket, and signed requests.                                   |

For this page, assume: put, get, delete, and list by prefix; objects that never change after the write; sizes from a few KB to many GB; versioning as an option for each bucket; one region with three availability zones; and very high durability.

Non-functional requirements:

- **Durability:** a stored object is not lost or corrupted. This is the first requirement.
- **Availability:** reads and writes work when a disk, a server, or one zone fails.
- **Cost:** the storage overhead for the safety is as low as possible.
- **Scale:** tens of petabytes and billions of objects, with growth each year.

## Estimates

Rough numbers, my own. See [Estimation](/learn/estimation) for the method.

- Stored user data: 40 PB after the first year.
- Object sizes: 60% are small, about 200 KB. 35% are medium, about 16 MB. 5% are large, about 500 MB. The average is 0.6 × 0.2 + 0.35 × 16 + 0.05 × 500 ≈ 31 MB.
- Number of objects: 40 PB ÷ 31 MB ≈ 1.3 billion.
- Metadata: about 1 KB for each object gives about 1.3 TB. That is too much to keep comfortably on one database server with room to grow. It must be partitioned.
- Raw disk with three copies: 120 PB. With erasure coding at 50% overhead: 60 PB. With 20 TB disks, that is 6,000 disks or 3,000 disks. The method of durability is a large part of the cost.
- Traffic: say 20,000 gets and 4,000 puts each second at the peak. Large objects carry most bytes, and small ones most requests.

**The estimates show two separate problems: a metadata problem (billions of small records) and a data problem (petabytes of bytes). Separate them.**

## The first design

```diagram
{
  "nodes": [
    { "id": "client", "label": "Client\n(SDK or HTTP)", "shape": "actor", "col": 0, "row": 0 },
    { "id": "lb", "label": "Load balancer", "shape": "box", "col": 1, "row": 0 },
    { "id": "api", "label": "API service\n(stateless)", "shape": "box", "col": 2, "row": 0 },
    { "id": "iam", "label": "Identity and\naccess", "shape": "box", "col": 3, "row": 0 },
    { "id": "meta", "label": "Metadata store\n(buckets, objects)", "shape": "store", "col": 3, "row": 1 },
    { "id": "route", "label": "Data routing\nservice", "shape": "box", "col": 2, "row": 1 },
    { "id": "place", "label": "Placement service\n(cluster map,\nconsensus)", "shape": "box", "col": 1, "row": 1 },
    { "id": "n1", "label": "Data node\n(primary)", "shape": "store", "col": 1, "row": 2.2 },
    { "id": "n2", "label": "Data node\n(zone B)", "shape": "store", "col": 2, "row": 2.2 },
    { "id": "n3", "label": "Data node\n(zone C)", "shape": "store", "col": 3, "row": 2.2 }
  ],
  "edges": [
    { "from": "client", "to": "lb", "label": "PUT, GET" },
    { "from": "lb", "to": "api" },
    { "from": "api", "to": "iam", "label": "allowed?" },
    { "from": "api", "to": "meta", "label": "name to\nobject ID" },
    { "from": "api", "to": "route", "label": "bytes" },
    { "from": "route", "to": "place", "label": "which nodes?" },
    { "from": "route", "to": "n1", "label": "write" },
    { "from": "n1", "to": "n2", "label": "copy" },
    { "from": "n1", "to": "n3", "label": "copy" }
  ]
}
```

The basic concepts:

- **A bucket** is a named container for objects. Its name is unique. It carries the owner, the access policy, versioning, and lifecycle rules.
- **An object** is the bytes plus metadata: the name (also called the key), the size, the content type, a checksum, and custom tags. A name can contain "/", so it looks like a path. There are no real folders: "photos/2026/cat.jpg" is one flat name.
- **Immutable data.** An object is never changed in place. A new put with the same name replaces the whole object, or adds a new version. This removes in-place updates, partial writes, and most locking from the data path.

The parts:

- **The API service** is stateless. It receives each request, checks it with identity and access, and calls the metadata store and the data store. It also streams the bytes.
- **Identity and access** answers "can this caller do this action on this bucket and name?" It checks the signature of the request and evaluates the policies.
- **The metadata store** maps a bucket and a name to an object ID, with the size, the checksum, and the version. It is small per record, but there are billions of records.
- **The data store** keeps the bytes. It knows nothing about buckets or names, only object IDs. It has three parts: the data routing service, the placement service, and the data nodes.

The API, in short:

| Method and path                           | Purpose                                   |
| ----------------------------------------- | ----------------------------------------- |
| `PUT /{bucket}`                           | Create a bucket                           |
| `PUT /{bucket}/{name}`                    | Upload an object                          |
| `GET /{bucket}/{name}`                    | Download an object                        |
| `DELETE /{bucket}/{name}`                 | Delete an object, or add a delete marker  |
| `GET /{bucket}?prefix=photos/&cursor=...` | List names with a prefix, one page a call |

## Deep dives

### Identity, access, and the API service

Each request carries a signature, computed from the request and the caller's secret key. The service computes it again. A match proves the sender and that nobody changed the request. A time in the signature stops the replay of old requests.

Access is decided by policies:

- **Identity policies** say what a user or a role can do, for example "read bucket `reports`".
- **Bucket policies** say who can access one bucket, for example "public read for names under `public/`".
- **Default deny.** A request is refused unless a policy allows it, and an explicit deny wins over an allow.

Cache the policies in the API service with a short time-to-live, because each request needs them. A policy change then takes some seconds to apply. For direct uploads from a browser, give a **pre-signed URL**: a signature for one action, one name, and a short time. See the [Video platform](/learn/video-platform) case and [Security](/learn/security).

### The metadata store

Two tables carry most of the work:

| Table    | Key                           | Main columns                                                         |
| -------- | ----------------------------- | -------------------------------------------------------------------- |
| `bucket` | `bucket_name`                 | `bucket_id`, owner, versioning, policy                               |
| `object` | `bucket_id, name, version_id` | `object_id`, size, checksum, content type, created at, delete marker |

The bucket table is small: millions of rows at most. Cache it.

The object table has billions of rows, so it must be partitioned. The choice of key decides which queries are cheap:

| Partition by             | Get by name   | List by prefix                               | Risk                                          |
| ------------------------ | ------------- | -------------------------------------------- | --------------------------------------------- |
| Hash of bucket and name  | One partition | Scatter-gather to all partitions, then merge | Listing is slow for large buckets             |
| Range of bucket and name | One partition | One or a few partitions, in order            | Hot spots when many writes have similar names |

Get is much more frequent than list. A common choice is hash partitioning, plus a separate listing index for each bucket, sorted by name. The index can lag behind the writes, unless the product promises that a list shows a new object at once. Ask. See [Partitioning](/learn/scaling-data#partitioning).

### The data store: data nodes and placement

**A data node** is a server with many disks. It stores the bytes of objects, and a small local index that maps each object ID to a file, an offset, and a size. It sends a heartbeat to the placement service every few seconds, with its disks, their free space, and their health.

**The placement service** keeps the **cluster map**: which data nodes exist, in which rack and zone, and which are healthy. When a new object needs a home, it picks nodes in different **failure domains**: different zones, or at least different racks. If heartbeats from a node stop, the placement service marks it down and starts repair: new copies of its data on other nodes.

The placement service is small but critical. Two instances that disagree about the map can place data badly. Run it as a cluster of 5 or 7 servers with a consensus protocol such as Raft. See [Consensus](/learn/consensus).

**The data routing service** is stateless. For a write, it asks the placement service for a set of nodes, sends the bytes, and returns a new object ID (a UUID) to the API service. For a read, it finds the nodes that hold the object ID and reads from one of them.

### The write path and the read path

**A write** (PUT):

1. The client sends the request. The API service checks the signature and the policy.
2. The API service streams the bytes to the data routing service.
3. The routing service gets three nodes, in three zones, from the placement service. It writes to the primary node.
4. The primary stores the bytes and sends them to the two other nodes. Each node computes the checksum and compares it with the one the client sent.
5. When all three copies are on disk, the primary answers. The routing service returns the object ID.
6. The API service writes the metadata row: bucket, name, version, object ID, size, checksum.
7. The client gets a success answer with the ETag, a tag computed from the content.

The order is **data first, then metadata**. If the process crashes after step 5, there are bytes with no name. That is harmless, and garbage collection removes them later. The opposite order is dangerous: a name with no bytes gives errors on read.

**When to answer.** After the first copy is faster, but a node failure in the next second loses the object. For a store whose first promise is durability, wait for all copies, or for a majority.

**A read** (GET):

1. The API service checks the signature and the policy.
2. It reads the metadata: bucket and name to object ID. With versioning, the latest version, unless the request names one.
3. The routing service picks a healthy node that holds the object, often the nearest one.
4. The node reads the bytes from file, offset, and size, and checks the checksum.
5. The bytes stream to the client.

### Durability: replication or erasure coding

**Replication** keeps full copies on different nodes. Three copies in three zones survive the loss of any two copies. The overhead is 200%: 1 PB of data needs 3 PB of disk. Reads are simple and fast: read any copy.

**Erasure coding** splits an object into k data fragments and computes m parity fragments, with a code such as Reed-Solomon. Any k of the k + m fragments rebuild the object. Each fragment goes to a different node.

The arithmetic of overhead, with my own examples:

| Method                | Fragments stored | Survives the loss of | Disk for 1 PB of data | Overhead |
| --------------------- | ---------------- | -------------------- | --------------------- | -------- |
| 3 copies              | 3                | any 2                | 3 PB                  | 200%     |
| Erasure coding 6 + 3  | 9                | any 3                | 1.5 PB                | 50%      |
| Erasure coding 10 + 4 | 14               | any 4                | 1.4 PB                | 40%      |

The overhead of erasure coding is m ÷ k. With 6 + 3, it survives more failures than three copies and uses half the disk. So why use replication at all?

| Aspect            | Replication                      | Erasure coding                                               |
| ----------------- | -------------------------------- | ------------------------------------------------------------ |
| Disk cost         | High                             | Low                                                          |
| Read of an object | One node                         | Several nodes, or one rebuild when a fragment is missing     |
| Repair of a disk  | Copy the lost data from one copy | Read k fragments to rebuild each lost fragment: more traffic |
| Latency           | Low                              | Higher, because a read waits for the slowest fragment        |

**The choice.** Erasure coding for most data, because the cost difference at petabyte scale is very large. Replication for very hot data, or as the first stage: write three copies for a fast, safe acknowledgement, and convert to erasure coding in the background once the object is some hours old.

Durability also depends on **repair time**. Data is lost only if more fragments fail than the code can survive, before repair completes. Fast detection and fast repair matter as much as the number of copies. Spread the fragments of each disk over many other disks, so that many disks share the repair work.

### Correctness with checksums

Disks and networks corrupt data silently: a bit flips, or a firmware bug writes the wrong block. A wrong copy is worse than a missing copy, because nothing reports it.

A **checksum** is a short value computed from the bytes, such as CRC32C or MD5. If the bytes change, the checksum changes. Use it at every stage:

1. **On upload.** The client sends a checksum of the content. The service computes it again and refuses the upload if they differ.
2. **On disk.** Each data node stores the checksum next to the object in its file.
3. **On read.** The node computes the checksum again before it sends the bytes. On a mismatch, it reads another copy or rebuilds from fragments, and replaces the bad copy.
4. **In the background.** A **scrubber** reads all data on a slow schedule and checks each checksum. It finds corruption in data that nobody has read for months.

### Small files merged into larger files

One file for each of a billion small objects fails. Each file costs an inode and file system metadata, and a 2 KB object can use a full disk block.

The fix is to **append small objects into a large file**:

1. A data node keeps one open file for writes. New objects are appended at the end.
2. The local index records the object ID, the file name, the start offset, and the size.
3. When the file reaches a limit, for example a few GB, the node seals it as read-only and opens a new one.
4. A read is one seek to the offset, then a read of the size.

Appends to one file are serial, so keep one open file for each disk or CPU core. Sealed files are also the unit for erasure coding, which avoids tiny fragments.

This is the same idea as a log-structured store: append only, and an index that points into the log. See [The simplest database: a log](/learn/storage-engines#the-simplest-database-a-log).

### Multipart upload

A 50 GB upload in one request fails often, and a failure at 49 GB means starting again. **Multipart upload** splits it:

1. **Start.** The client asks to start an upload for a name. The service returns an upload ID.
2. **Parts.** The client uploads the parts, each with a part number. Parts can go in parallel, and a failed part is sent again alone. Each part returns an ETag.
3. **Complete.** The client sends the list of part numbers and ETags. The service checks the list and writes the metadata of the full object. The object becomes visible only now.
4. **Abort.** The client, or a lifecycle rule, cancels an upload that did not complete. The parts become garbage.

S3, as a known example, requires parts of at least 5 MB except the last one, and allows at most 10,000 parts. Many uploads are never completed. Without a cleanup rule, their parts use storage forever.

### Versioning

With versioning on for a bucket, a put does not replace an object. It adds a row with a new **version ID**, a value that sorts by time. A get returns the latest version, or the version that the request names.

A delete does not remove data. It adds a **delete marker**: a version that says "deleted". A get without a version ID then answers "not found", but the old versions are still there and can be restored. To remove data for real, delete a specific version, or set a lifecycle rule such as "remove versions that are older than 90 days and not current".

Versioning protects against mistakes. Its cost is storage, because each overwrite keeps the old bytes.

### Garbage collection

Many paths create bytes that nobody can reach:

- Deleted objects and old versions removed by a lifecycle rule.
- Data written before a crash, with no metadata row.
- Parts of multipart uploads that were never completed.
- Bad copies replaced after a checksum mismatch.

Delete is lazy. The metadata row goes, or the object is marked deleted, and the bytes stay in their sealed file. A **compaction** job then:

1. Finds sealed files with a high share of dead objects.
2. Copies the live objects into a new file.
3. Updates the local index to the new offsets.
4. Deletes the old file.

Compaction must apply to every copy or set of fragments, and must not take the disk bandwidth that reads need. For orphan bytes, a job removes object IDs that have no metadata row and are older than some hours. The age limit protects writes in progress.

## Trade-offs and alternatives

| Decision                | This design                               | Alternative                            | When the alternative wins                                                                     |
| ----------------------- | ----------------------------------------- | -------------------------------------- | --------------------------------------------------------------------------------------------- |
| Durability method       | Erasure coding, with replication at first | Three copies only                      | Small clusters, hot data, or when simplicity matters most                                     |
| When a write succeeds   | All copies on disk                        | First copy on disk                     | Data that can be lost, such as caches or temporary files                                      |
| Object table partitions | Hash, plus a listing index                | Range by bucket and name               | Workloads where listing is frequent and names are spread out                                  |
| Placement               | A placement service with a cluster map    | Consistent hashing with no central map | Systems that avoid a central component, as in [Consistent hashing](/learn/consistent-hashing) |

The central trade-off is cost against latency and simplicity. Erasure coding saves most of the disk, but each read, write, and repair touches more nodes. Separate stores for metadata and data scale independently, but a write spans both. The order of writes and garbage collection keep them consistent.

## What interviewers probe

**"Why separate the metadata from the data?"**

- Different shapes: billions of small records against petabytes of bytes.
- Different stores: a partitioned database against data nodes with large files.
- Immutable bytes make the data store simple: no in-place updates.

**"How do you get eleven nines of durability?"**

- Fragments or copies in separate failure domains.
- Fast detection with heartbeats, and fast repair spread over many disks.
- Checksums everywhere, and a background scrubber for silent corruption.

**"Replication or erasure coding? Give me the numbers."**

- Three copies: 200% overhead, survives two losses.
- 6 + 3 coding: 50% overhead, survives three losses.
- Coding costs more CPU, more nodes on each read, and more repair traffic.

**"What happens when the upload of a 50 GB file fails at 49 GB?"**

- Multipart upload: only the failed part is sent again.
- The object becomes visible only on "complete".
- A lifecycle rule removes incomplete uploads.

## Go deeper

- System Design Interview (Alex Xu and Sahn Lam), Volume 2, the chapter on S3-like object storage: the split of metadata and data, data nodes and placement, merged small files, erasure coding, versioning, and multipart upload.
- Designing Data-Intensive Applications (Martin Kleppmann), the part on storage and retrieval: append-only logs, indexes into them, and compaction.
- DDIA, the part on batch processing: distributed file systems, and why they use replication or erasure coding.

## Further reading

- [Erasure code](https://en.wikipedia.org/wiki/Erasure_code) and [Reed–Solomon error correction](https://en.wikipedia.org/wiki/Reed%E2%80%93Solomon_error_correction) on Wikipedia
- [Object storage](https://en.wikipedia.org/wiki/Object_storage) on Wikipedia
- [File sync](/learn/file-sync) and [Key-value store](/learn/key-value-store) in this wiki
