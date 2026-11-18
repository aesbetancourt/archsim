## The question

"Design search autocomplete. While a user types in the search box, show the five most popular queries that start with the text so far."

The answer must arrive before the next key press, so the read path has a budget of a few tens of milliseconds. A fast answer needs data that is prepared in advance. The design therefore has two halves: a query service that only reads, and a data gathering service that builds the data in batches. Alex Xu describes this split in System Design Interview, the chapter on search autocomplete. This page uses its own numbers.

## Questions to ask first

Functional questions:

- **Prefix only, or also the middle of a phrase?** Assume a match at the start of the query only: "pizz" matches "pizza near me", not "cheap pizza".
- **How many suggestions?** Assume 5.
- **Ranked by what?** Assume popularity: how often people searched for the query in a recent period.
- **Spell correction?** Assume no, at first.
- **Languages and characters?** Assume English, lower case, letters, digits, and spaces. Name other languages as an extension.
- **Personal suggestions?** Assume no. Everyone with the same prefix sees the same list.
- **Fresh trends?** Must a breaking news query show within minutes, or is a daily update enough? Assume daily or weekly at first.

Non-functional questions:

- **Latency.** A suggestion must arrive in less than about 100 ms end to end, or it is late for the next key press.
- **Safety.** The list must not show offensive, dangerous, or illegal suggestions.
- **Availability.** A failed suggestion is a small loss. The search box must still work without it.

The question that changes the design most is freshness. A daily update allows a simple batch pipeline. A target of minutes needs a stream pipeline next to it.

## Estimates

Assume these answers: 20 million daily active users. Each user searches 8 times each day. A query has about 20 characters. The client waits briefly between key presses, so a query sends about 10 requests, not 20.

| Quantity              | Arithmetic                              | Result                           |
| --------------------- | --------------------------------------- | -------------------------------- |
| Searches              | 20 million × 8                          | 160 million each day             |
| Suggestion requests   | 160 million × 10 ÷ 100,000 s            | About 16,000 each second         |
| Peak                  | 16,000 × 2, a rough factor              | About 32,000 each second         |
| New query text        | 160 million × 20% new × 20 bytes        | About 640 MB each day            |
| Distinct queries, all | Hundreds of millions (rough)            | Too many to keep in full         |
| Kept queries          | 10 million above a popularity threshold | A few GB to tens of GB as a trie |

What the numbers say:

- 32,000 small reads each second is a read-heavy load. It needs prepared answers in memory and a cache in front.
- The log grows by less than a gigabyte each day. The batch jobs that read it are cheap.
- Most distinct queries are searched once and never again. They must not enter the data that the query service reads.

## The first design

```diagram
{
  "nodes": [
    { "id": "user", "label": "Browser\n(cache, debounce)", "shape": "actor", "col": 0, "row": 0 },
    { "id": "query", "label": "Query service", "shape": "box", "col": 1, "row": 0 },
    { "id": "filter", "label": "Filter layer\n(blocked terms)", "shape": "module", "col": 2, "row": 0 },
    { "id": "cache", "label": "Trie cache\n(in memory)", "shape": "store", "col": 3, "row": 0 },
    { "id": "logs", "label": "Query logs", "shape": "pipe", "col": 0, "row": 1.5 },
    { "id": "agg", "label": "Aggregators\n(batch jobs)", "shape": "box", "col": 1, "row": 1.5 },
    { "id": "freq", "label": "Frequency table", "shape": "store", "col": 2, "row": 1.5 },
    { "id": "build", "label": "Trie builders", "shape": "box", "col": 2, "row": 2.7 },
    { "id": "triedb", "label": "Trie store\n(snapshots)", "shape": "store", "col": 3, "row": 1.5 }
  ],
  "groups": [
    { "id": "gq", "label": "Query service (reads)", "col": 1, "row": 0, "cols": 3, "rows": 1 },
    { "id": "gd", "label": "Data gathering service (batch)", "col": 0, "row": 1.5, "cols": 4, "rows": 2.2 }
  ],
  "edges": [
    { "from": "user", "to": "query", "label": "GET ?q=pizz" },
    { "from": "query", "to": "filter" },
    { "from": "filter", "to": "cache", "label": "top 5" },
    { "from": "user", "to": "logs", "label": "searches", "async": true },
    { "from": "logs", "to": "agg", "label": "weekly or daily" },
    { "from": "agg", "to": "freq" },
    { "from": "freq", "to": "build" },
    { "from": "build", "to": "triedb", "label": "new snapshot" },
    { "from": "triedb", "to": "cache", "label": "load" }
  ]
}
```

**The query service** reads only.

1. The browser sends the prefix after a short pause in typing, for example 50 ms.
2. The query service finds the prefix in the trie cache and gets its top 5 list.
3. The filter layer removes blocked terms.
4. The answer goes back with a cache header, so the browser can reuse it.

**The data gathering service** writes only, in batches.

1. Search servers write each completed search to a log: the query text and the time.
2. Aggregators read the logs on a schedule and count each query in a time window.
3. The counts go to a frequency table: `query`, `window`, `count`.
4. Trie builders read the table and build a new trie with the top 5 at each node.
5. The new trie goes to the trie store as a snapshot. The trie cache loads it and replaces the old one.

The two halves meet only at the trie store. The query service never waits for a write, and a slow batch job never slows a suggestion.

## Deep dives

### The trie with the top k at each node

A [trie](https://en.wikipedia.org/wiki/Trie), or prefix tree, is a tree where each edge is one character. The path from the root to a node spells a prefix. A node that ends a known query holds its count.

A plain trie answers "top 5 for `pi`" in three steps:

1. Walk down the prefix: `p`, then `i`. The cost grows with the prefix length _p_.
2. Visit all nodes below it to find each complete query. The cost grows with the size of the subtree, which can be millions of nodes for a short prefix.
3. Sort the results by count and take 5.

Step 2 is far too slow at 32,000 requests each second. The fix is to do it in advance: **store the top 5 list at each node.** The node for `pi` holds `pizza`, `pinterest`, `pie recipe`, `pi day`, `pilates`, with their counts. A request then costs only step 1, a walk of a few characters, followed by one list read.

| Version             | Time for each request               | Extra space                         |
| ------------------- | ----------------------------------- | ----------------------------------- |
| Plain trie          | Prefix walk + subtree search + sort | None                                |
| Top k at each node  | Prefix walk + one list read         | k entries at each node              |
| Prefix length limit | A fixed small walk                  | None. Long prefixes are not served. |

This is the standard trade of space for time. The builder pays the cost once, and each read is cheap.

### The size problem and limits on prefix length

Top k at each node multiplies the size of the trie. Three limits keep it small:

- **Limit the prefix length.** Users rarely type more than about 50 characters before they choose a suggestion or press enter. Do not build nodes deeper than that. The walk then has a fixed upper cost.
- **Keep only popular queries.** Drop queries below a count threshold in the window. Most queries are searched once and add nodes that no one reads. In the estimate above, this step takes hundreds of millions of distinct queries down to 10 million.
- **Store references, not text.** At each node, keep the top 5 as IDs or as pointers to the end nodes, and keep each full query string once.

With these limits, the trie for 10 million queries is a few to tens of gigabytes (rough). That fits in the memory of one large server, and it can be copied to many.

### Building the trie from logs

Do not update the trie on each search. At 160 million searches each day, each search changes the counts of up to 20 nodes and their top 5 lists. Those writes would compete with the reads. Instead, build it in batches. See [Batch and stream processing](/learn/batch-and-stream).

1. **Collect.** Each search server appends to a log. The log is the source of truth. You can rebuild all derived data from it.
2. **Aggregate.** A batch job groups the log by query and counts each one in the window, for example the last 7 days. Weight recent days more if you want newer queries to rise faster.
3. **Build.** A job reads the counts, builds the trie, and computes the top 5 for each node from the bottom up. The top 5 of a node comes from the top 5 lists of its children and its own count.
4. **Publish.** Write the new trie as a versioned snapshot. Servers load the new version and switch to it in one step. Keep the last version, so a bad build can roll back.

Two schedules are common: a full rebuild each week, and smaller daily updates. A full rebuild is simple and removes old data. An in-place update must change a node and each of its ancestors, because a new count can change the top 5 of each prefix above it.

### Storing the trie

The trie store holds the snapshots and lets new servers start quickly. Two forms are common:

| Form            | How                                                                                          | Good at                                                    |
| --------------- | -------------------------------------------------------------------------------------------- | ---------------------------------------------------------- |
| Document store  | Serialize the full trie, or each shard of it, as one document. Load it into memory at start. | Simple snapshots and versions                              |
| Key-value store | One key for each prefix. The value is its top 5 list: `pi` → `[pizza, pinterest, ...]`.      | Direct lookups with no tree in memory; even spread by hash |

The key-value form turns the trie into a map from prefix to answer. The query service can then read the store directly, with a cache in front, and no tree code. It uses more space, because each prefix is a key, but it is very easy to partition and replicate. See [Storage engines](/learn/storage-engines) for how key-value stores keep reads fast.

### Browser caching, sharding, and filtering

**Browser caching.** The same prefix comes back often: the user deletes a character, or types the same query again later. Return suggestions with a `Cache-Control` header that allows a private cache for some time, for example an hour. The browser then answers repeats with no request. Two more client steps cut load:

- **Debounce.** Wait about 50 ms after the last key press before the request. A fast typist then sends fewer requests.
- **Reuse.** The list for `pizz` often already holds the best answers for `pizza`. The client can show them while the next request runs.

**Sharding by prefix.** When one server is not enough, split the data. A split by the first letter is simple and uneven: far more English queries start with `s` than with `x`. Two methods give an even spread:

1. **A shard map from real counts.** Look at the historical load for each prefix range. Give a heavy range its own shard, for example `s`, and group light ranges, for example `u` to `z`. A small shard map service tells the query service which shard holds a prefix.
2. **Hash the prefix.** With the key-value form, a hash of the prefix spreads keys evenly with no map. This works because each request reads one key and never a range.

For read load alone, replication is often enough before sharding. Each server holds a full copy of a trie of a few gigabytes. Shard when the trie no longer fits in one server's memory.

**Filtering unsafe results.** Some popular queries are hateful, sexual, violent, or defamatory, and some appear because people try to push a term into the list. Put a filter layer between the cache and the user. It removes entries that match a blocklist or that a classifier marks. The filter acts at once. Then remove the entries from the source data too, so the next build does not add them again. Legal requests to remove a suggestion follow the same path.

### Real-time trends, as an extension

A daily build misses a news event that started an hour ago. To show trends:

1. Read the search events from a stream, not from daily files.
2. Count queries in short sliding windows, for example 5 minutes and 1 hour.
3. Find queries whose recent count is much higher than their usual rate.
4. Merge a small trending list into the answer at read time, or update only the affected nodes in a separate in-memory layer.

Keep the filter in front of the trend path. A new trend has not been reviewed, so it is the easiest way to show an offensive suggestion. Other extensions: a trie for each language and country, personal history merged on the client, and spell correction.

## Trade-offs and alternatives

| Decision       | Choice here                               | When the choice changes                                          |
| -------------- | ----------------------------------------- | ---------------------------------------------------------------- |
| Data structure | Trie with top 5 at each node              | A key-value map from prefix to list, when you want no tree code  |
| Update         | Weekly rebuild, daily updates             | A stream path, when trends must show in minutes                  |
| Ranking        | Count in a window, recent days weighted   | A model with more signals, such as location and personal history |
| Scale out      | Replicate full copies                     | Shard by prefix, when the trie no longer fits in memory          |
| Shard method   | Map from real load, or hash of the prefix | A first-letter split only for a small, even data set             |
| Matching       | Prefix of the full query                  | An index of each word in the query, for matches in the middle    |

The full design rests on one idea: the answer to each prefix is computed before anyone asks. Everything else follows from it. The cost is freshness. Say how old the suggestions can be, and design the batch schedule to match.

## What interviewers probe

1. **"Why not query the database with `LIKE 'pizz%'`?"**
   - It must scan and sort many rows for each key press. At 32,000 requests each second, that is too slow and too expensive.
   - Precompute the top 5 for each prefix.
2. **"How large is the trie, and how do you keep it small?"**
   - Limit the prefix length, drop queries below a count threshold, and store references in the top k lists.
3. **"How does a new popular query get into the suggestions?"**
   - Through the logs, the aggregation, and the next build. It takes a day or a week.
   - A stream path for trends, if the product needs minutes.
4. **"How do you shard it?"**
   - Not by first letter alone, because the load is uneven. Use a shard map from real counts, or hash the prefix in a key-value form.
5. **"A suggestion is offensive. Remove it now."**
   - The filter layer removes it at once. Then delete it from the source, so the next build does not bring it back.

## Go deeper

- **System Design Interview** (Alex Xu), the chapter on search autocomplete: the trie, the top k cache, the two services, and sharding by prefix.
- **Designing Data-Intensive Applications** (Martin Kleppmann), the part on batch processing: how logs become derived data, and why you can rebuild it.
- **Designing Data-Intensive Applications**, the part on stream processing: windows and the counts that a trend path needs.

## Further reading

- [Trie](https://en.wikipedia.org/wiki/Trie) and [Autocomplete](https://en.wikipedia.org/wiki/Autocomplete) on Wikipedia
- Related lessons: [Caching](/learn/caching), [Batch and stream processing](/learn/batch-and-stream), [Storage engines](/learn/storage-engines)
