## The question

"Design a file storage and sync service. A user puts files in a folder on a computer. The files appear on the user's other devices, and the user can share a folder with other people. Old versions can be restored."

A sync service looks like storage plus a copy job. The hard parts are elsewhere. Files are large, but each change is small. Many devices change the same files while they are offline. And a user who loses a file stops trusting the service at once. So the design must send few bytes, keep one true record of each file, and never silently drop a version.

## Questions to ask first

| Question                                       | Why it changes the design                                                                               |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Which clients: desktop, phone, web?            | A desktop client watches a folder and syncs in the background. A web client only uploads and downloads. |
| What is the largest file?                      | Large files need blocks, resumable transfer, and delta sync.                                            |
| Shared folders, and how many members?          | Sharing means many writers for one file, so conflicts become normal.                                    |
| How long do we keep old versions?              | Sets the storage cost and the need for cold storage.                                                    |
| Do we need collaborative editing in real time? | That is a different system, with operational transforms or CRDTs. Leave it out if you can.              |
| Encryption: at rest only, or client-side?      | Client-side encryption stops deduplication across users.                                                |
| How fast must a change reach other devices?    | Seconds is normal. It decides between long polling and a slower sync loop.                              |

For this page, assume: desktop and phone clients, files up to 10 GB, shared folders with up to about 50 members, versions kept for 30 days, no real-time co-editing, and encryption at rest.

Non-functional requirements:

- **Reliability:** a file that the service confirmed is never lost or corrupted. This is the first requirement.
- **Fast sync:** a change shows on the user's other devices within some seconds.
- **Low bandwidth:** a small change to a large file sends only a small amount of data.
- **Scale:** many millions of users, and petabytes of data.

## Estimates

Rough numbers, my own. See [Estimation](/learn/estimation) for the method.

- 30 million users, of which 6 million are active each day. Each user has 1.5 devices on average.
- Storage: an average of 3 GB for each user gives 30 million × 3 GB = 90 PB of logical data. Deduplication and compression reduce this. Replication, often three copies or erasure coding, increases it again.
- Uploads: each daily user changes 3 files a day. That is 18 million uploads a day, or about 210 each second. Take a peak of three times: about 630 each second.
- Downloads: each change goes to the other devices of the user and to the members of shared folders. Assume two receivers for each change: 36 million downloads a day.
- Bytes for each change: with 4 MB blocks and delta sync, a small edit sends one or two blocks, not the full file.
- Open notification connections: if 40% of 9 million daily devices are online at the peak, that is about 3.6 million open long-poll connections.

The estimates show: metadata operations are frequent and small, block transfers are less frequent and large, and the number of idle open connections is large.

## The first design

```diagram
{
  "nodes": [
    { "id": "client", "label": "Desktop or\nphone client", "shape": "actor", "col": 0, "row": 1 },
    { "id": "block", "label": "Block servers\n(split, hash,\ncompress, encrypt)", "shape": "box", "col": 1, "row": 0 },
    { "id": "obj", "label": "Block storage\n(object store)", "shape": "store", "col": 2, "row": 0 },
    { "id": "cold", "label": "Cold storage", "shape": "store", "col": 3, "row": 0 },
    { "id": "api", "label": "API servers\n(metadata)", "shape": "box", "col": 1, "row": 1 },
    { "id": "meta", "label": "Metadata DB\n(strong consistency)", "shape": "store", "col": 2, "row": 1 },
    { "id": "cache", "label": "Metadata cache", "shape": "store", "col": 3, "row": 1 },
    { "id": "notify", "label": "Notification\nservice (long poll)", "shape": "box", "col": 1, "row": 2 },
    { "id": "offline", "label": "Offline queue", "shape": "pipe", "col": 2, "row": 2 }
  ],
  "edges": [
    { "from": "client", "to": "block", "label": "blocks" },
    { "from": "block", "to": "obj" },
    { "from": "obj", "to": "cold", "label": "old blocks", "async": true },
    { "from": "client", "to": "api", "label": "file changes" },
    { "from": "api", "to": "meta" },
    { "from": "meta", "to": "cache" },
    { "from": "api", "to": "notify", "label": "change", "async": true },
    { "from": "notify", "to": "client", "label": "something\nchanged" },
    { "from": "notify", "to": "offline", "async": true }
  ]
}
```

- **The client** watches the local folder. It splits changed files into blocks, keeps a small local database of known files and blocks, and talks to the servers.
- **Block servers** receive blocks, compress and encrypt them, and write them to block storage. In some designs the client does the splitting, and the block servers only check and store.
- **Block storage** is an object store. Each block is an object, named by the hash of its content.
- **API servers** handle all metadata: files, folders, versions, sharing, and devices.
- **The metadata DB** is the truth for "which version of which file is made of which blocks". It needs strong consistency.
- **The notification service** tells online clients that something changed. An **offline queue** keeps the changes for clients that are not connected.
- **Cold storage** keeps old and rarely read blocks at a lower price.

The key separation: **content is immutable blocks, and the meaning lives in metadata.** A file version is only a list of block hashes.

## Deep dives

### Blocks, deduplication, and delta sync

**Blocks.** Split each file into blocks of a fixed maximum size. A size of a few megabytes is common, for example 4 MB. A 1 GB file becomes about 256 blocks. Each block has a strong hash, such as SHA-256, as its ID.

Blocks give four benefits:

1. **Resumable transfer.** Each block uploads on its own. A lost connection costs at most one block.
2. **Parallel transfer.** The client can send several blocks at the same time.
3. **Deduplication.** Before an upload, the client asks "which of these hashes do you already have?" It sends only the new blocks. Two copies of the same file, or the same file in two users' folders, use the same blocks.
4. **Delta sync.** When a file changes, only the blocks that changed get a new hash. The client uploads those blocks and a new list of hashes.

**The shift problem.** With fixed block boundaries, one byte inserted at the start of a file moves every later byte. Then every block changes, and delta sync sends the whole file. **Content-defined chunking** fixes this. A rolling hash over a small window chooses the boundaries from the content itself, so an insertion changes only the blocks near it. The rsync tool uses a rolling hash for a related purpose. The price is more CPU on the client and blocks of variable size.

**Deduplication and privacy.** If the service deduplicates across users, a user can learn whether another user stores a given file, from how fast an upload completes. Many services deduplicate only inside one user or one team for this reason.

### Compression, encryption, and the upload flow

**Compression.** Compress each block before storage, with a fast algorithm. Text and documents compress well. Photos and videos are already compressed, so skip them, for example by file type or by a test on the first block.

**Encryption.** Encrypt each block at rest, and use TLS for every transfer. Keep the keys in a key management service, not next to the data. If the product needs client-side encryption, the server cannot read the content. Then server-side deduplication across users and server-side search do not work. See [Security](/learn/security).

**The upload flow.** One file save on Ana's laptop:

1. The client sees the change, splits the file, and calculates the hash of each block.
2. The client sends the new file version to the API: the list of hashes, and the version it was based on. The API stores the version in the state "pending" and answers with the hashes that the store does not have.
3. The client uploads the missing blocks to the block servers. The block servers compress, encrypt, and store each one.
4. When all blocks are stored, the API marks the version "committed" in one transaction.
5. The API publishes a change event to the notification service.

A version becomes visible only at step 4. A crash in the middle leaves a pending version and some unused blocks. A cleanup job removes them later. Readers never see a half-written file.

**The download flow.** On Ana's phone:

1. The notification service tells the phone "something changed in your folders".
2. The phone asks the API for all changes after its cursor, a position in the change log for the user.
3. For each changed file, the phone gets the new list of hashes and compares it with its local list.
4. It downloads only the blocks that it does not have, checks each hash, and builds the file.
5. It moves its cursor forward.

### The metadata database and consistency

Metadata is small, but it is where correctness lives. Typical tables:

| Table            | Holds                                                                  |
| ---------------- | ---------------------------------------------------------------------- |
| `user`, `device` | Accounts, devices, and each device's sync cursor                       |
| `namespace`      | A root folder: a user's own space or a shared folder                   |
| `file`           | Path, owner namespace, latest version, deleted flag                    |
| `file_version`   | One row for each version: the list of block hashes, size, author, time |
| `block`          | Hash, size, storage location, reference count                          |

This data needs **strong consistency**. Two devices must never both believe that their version is the latest. A version must never point to a block that is not stored. A relational database gives transactions and unique constraints, which make these rules simple to enforce. See [Transactions and isolation](/learn/transactions-isolation).

At scale, one database is not enough. **Partition by namespace.** A user's folders, or one shared folder, live on one partition, so most transactions stay on one partition. A cache in front of the database serves hot metadata. It must be invalidated when the database changes, or clients see a stale file list.

Blocks are different. They are immutable and named by their content, so they are easy to replicate and cache. A block can never be "out of date". Only the metadata can be.

### Notification with long polling

Clients must learn about changes fast, but a change to a user's files is rare compared with the time a client is online. Each client opens a **long poll** to the notification service. The server holds the request open until a change comes or a timeout passes, for example 60 seconds. Then the client opens a new one.

Why long polling and not WebSocket:

- The traffic goes one way, from server to client, and it is rare. WebSocket's two-way channel is not necessary.
- The message carries no data, only "something changed". The client then fetches the changes through the normal API.
- Long polling works through almost all proxies and firewalls.

WebSocket is also a valid choice, for example if the product adds chat or live presence later. See [Design a chat system](/learn/chat-system).

The notification service holds millions of idle connections, so it is stateful like the chat servers. When one notification server fails, its clients reconnect to others. Add backoff with a random part, so that the reconnects do not arrive all at once. The cursor in the metadata DB means that a lost notification only delays a sync. It never loses a change.

### Conflicts, revisions, and storage tiers

**Conflicts.** Ana and Ben edit the same shared file while both are offline. Both upload a new version, each based on version 7.

Use **first writer wins**. The API commits a new version only if the version it was based on is still the latest. This is a compare-and-set in the metadata transaction. Ana's upload commits first and becomes version 8. Ben's upload says "based on 7", but the latest is now 8, so it is refused.

Ben's client then keeps both: it saves his file as a **conflicted copy**, with a name like "report (Ben's conflicted copy).docx". It downloads version 8 as the main file. Ben merges the two by hand. This is not elegant, but it never loses a change. An automatic merge is possible only for file types that the service understands.

DDIA describes this problem in the part on replication with many leaders: concurrent writes need detection, and "last write wins" silently drops data. A file sync service must not drop data, so it detects the conflict and gives it to a person.

**Revisions.** Each committed version is a row in `file_version`. Restoring an old version is a metadata change: make a new version with the old list of hashes. It costs almost no storage, because the blocks are shared. Delete is also a version, a "deleted" marker, so a deleted file can be restored within the retention period.

Set a retention rule, for example 30 days or a maximum number of versions. A garbage collector removes expired versions, lowers the reference count of their blocks, and deletes blocks that reach zero. Garbage collection is dangerous: a bug deletes user data. Run it with a delay, and keep a deleted block for some days before the final removal.

**Storage tiers.** Most data is written once and read rarely after the first weeks.

| Tier | Holds                                            | Cost of storage | Cost and time to read |
| ---- | ------------------------------------------------ | --------------- | --------------------- |
| Hot  | Recent files, and files read often               | Highest         | Low, fast             |
| Warm | Files not read for some weeks                    | Lower           | Higher                |
| Cold | Old versions, and files not read for many months | Lowest          | Highest, can be slow  |

Move blocks between tiers by age and by the last read. Keep metadata in the hot tier at all times, so that a file list is fast even when the content is cold.

## Trade-offs and alternatives

| Decision            | This design                          | Alternative                 | When the alternative wins                                          |
| ------------------- | ------------------------------------ | --------------------------- | ------------------------------------------------------------------ |
| Block boundaries    | Content-defined chunking             | Fixed-size blocks           | Simpler client, files that change mostly at the end                |
| Deduplication scope | Inside a user or team                | Across all users            | Storage cost matters more than the privacy risk                    |
| Metadata store      | Relational, partitioned by namespace | Wide-column key-value store | Extreme scale, with a team that builds its own transactions        |
| Notification        | Long polling                         | WebSocket                   | The product also needs real-time two-way features                  |
| Conflicts           | First writer wins, conflicted copy   | Automatic merge             | The service understands the file format, such as its own documents |
| Encryption          | At rest, server-held keys            | Client-side, user-held keys | Privacy is the main requirement, and deduplication is not          |

The central trade-off is bandwidth and storage against complexity on the client. Blocks, hashes, and chunking save a lot of bytes. But they move logic to the client, and an old client version with a bug is hard to fix in the field.

## What interviewers probe

**"Why split files into blocks?"**

- Resumable and parallel transfer.
- Deduplication by content hash.
- Delta sync: send only changed blocks. Mention the shift problem and content-defined chunking.

**"Why does the metadata need strong consistency, but the blocks do not?"**

- Metadata decides what the latest version is. Two answers would mean lost data.
- Blocks are immutable and named by their hash, so any copy is correct.
- Commit a version only after all its blocks are stored.

**"Two people edit the same file offline. What happens?"**

- A version records the version it was based on.
- The first commit wins, through compare-and-set.
- The second becomes a conflicted copy. No data is lost.

**"How do other devices learn about a change?"**

- Long polling to a notification service, with "something changed" only.
- The client fetches changes after its cursor.
- A lost notification delays a sync but loses nothing.

**"How do you keep storage cost down?"**

- Deduplication, compression, and shared blocks between versions.
- A retention rule, and safe garbage collection with a delay.
- Tiers: move old and unread blocks to cold storage.

## Go deeper

- System Design Interview (Alex Xu), Volume 1, the chapter on a cloud file service like Google Drive: block servers, the metadata database, the notification service, and the upload and download flows.
- Designing Data-Intensive Applications (Martin Kleppmann), the part on replication, on concurrent writes: why "last write wins" loses data, and how to detect conflicts.
- DDIA, the part on transactions: the guarantees that make "commit a version only if it is still the latest" safe.
- DDIA, the part on storage and retrieval: immutable data and compaction, which match blocks and garbage collection.

## Further reading

- [Data deduplication](https://en.wikipedia.org/wiki/Data_deduplication), [Rolling hash](https://en.wikipedia.org/wiki/Rolling_hash), and [rsync](https://en.wikipedia.org/wiki/Rsync) on Wikipedia
- [Push technology](https://en.wikipedia.org/wiki/Push_technology) on Wikipedia, for long polling
- [Consistency](/learn/consistency), [Caching](/learn/caching), and [Scaling data](/learn/scaling-data) in this wiki
