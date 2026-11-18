## The question

Try the [Game Leaderboard kata](/kata/game-leaderboard) before you read this page.

"Design the leaderboard of a mobile puzzle game. A player gets points for each match won. The game shows the top 10 players of the month, and each player sees their own rank and the players just above and below. The leaderboard starts again each month."

The data is small and the operations are simple. The hard part is one query: "What is my rank among 30 million players?" A relational table answers it slowly, and the answer changes many times each second. The vocabulary that interviewers expect: sorted set, skip list, O(log n), scatter-gather, ties, and recovery from the source of truth.

## Questions to ask first

| Question                                             | Why it changes the design                                                                   |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------- |
| How are points earned: a fixed amount or a variable? | A fixed amount for each win is simple. Variable points change only the increment.           |
| Who sends the score: the client or the game server?  | A score from the client can be faked. The game server must be the source.                   |
| One global board, or boards by country or friends?   | Each extra board is a separate sorted structure, and more memory.                           |
| How fresh must a rank be?                            | Real time needs an in-memory structure. A rank that is an hour old allows a batch job.      |
| How are ties broken?                                 | Equal points need a rule, such as "first to reach the score ranks higher".                  |
| Do we keep old months?                               | History needs storage outside the in-memory structure.                                      |
| Does every player need an exact rank?                | Exact for the top players, and "top 12%" for the rest, is much cheaper at very large scale. |

For this page, assume: one global board for each month, one point for each win, scores sent by the game server, real-time ranks, ties broken by time, and old months kept for a year.

Non-functional requirements:

- **Freshness:** a win shows in the rank within a second or two.
- **Latency:** the top 10 and "my rank" return in tens of milliseconds.
- **Correctness:** a match is counted once. A score cannot come from the client.
- **Durability:** a crash of the in-memory store must not lose the month.

## Estimates

Rough numbers, my own. See [Estimation](/learn/estimation) for the method.

- 30 million players play at least once a month. 6 million play each day.
- Each daily player wins about 8 matches a day: 48 million score updates a day. 48 million ÷ 86,400 ≈ 560 updates each second. Take a peak of five times: about 2,800 each second.
- Each daily player opens the leaderboard about 3 times a day: 18 million reads a day, about 210 each second, and about 1,000 at the peak.
- Memory for one month: 30 million entries. An entry has a player ID of about 16 bytes and a score of 8 bytes. With the overhead of the index structures, count roughly 100 bytes for each entry. 30 million × 100 bytes = 3 GB.
- Source of truth: each win is one event of about 50 bytes. 48 million × 50 bytes ≈ 2.4 GB a day, or about 72 GB a month.

One in-memory server holds 3 GB easily and handles tens of thousands of simple operations each second. **The board fits on one server. The design question is the data structure, then durability, and only then sharding.**

## The first design

```diagram
{
  "nodes": [
    { "id": "app", "label": "Player app", "shape": "actor", "col": 0, "row": 0 },
    { "id": "game", "label": "Game servers\n(decide the winner)", "shape": "box", "col": 0, "row": 1.2 },
    { "id": "lb", "label": "Leaderboard service", "shape": "box", "col": 1, "row": 0.6 },
    { "id": "redis", "label": "Sorted set\n(Redis, one key\neach month)", "shape": "store", "col": 2, "row": 0 },
    { "id": "db", "label": "Score DB\n(win events)", "shape": "store", "col": 2, "row": 1.2 },
    { "id": "profile", "label": "Profile cache\n(names, avatars)", "shape": "store", "col": 3, "row": 0 },
    { "id": "archive", "label": "Monthly archive", "shape": "store", "col": 3, "row": 1.2 }
  ],
  "edges": [
    { "from": "app", "to": "lb", "label": "top 10,\nmy rank" },
    { "from": "game", "to": "lb", "label": "win\n(match ID)" },
    { "from": "lb", "to": "db", "label": "insert event" },
    { "from": "lb", "to": "redis", "label": "ZINCRBY,\nZREVRANK" },
    { "from": "lb", "to": "profile", "label": "names" },
    { "from": "db", "to": "archive", "label": "end of\nmonth", "async": true }
  ]
}
```

- **The game servers** decide who won a match. Only they report wins, with the match ID. The client never sends a score.
- **The leaderboard service** records each win and answers the two queries. It keeps no state.
- **The sorted set** keeps every player of the month in score order, in memory.
- **The score DB** stores each win event. It is the source of truth, and the sorted set is a fast index over it.
- **The profile cache** gives the names and avatars for the players on a page of the board.
- **The monthly archive** keeps the final board of each month.

The API, in short:

| Method and path                     | Purpose                                                   |
| ----------------------------------- | --------------------------------------------------------- |
| `POST /v1/scores` (internal)        | A game server reports a win: player ID, match ID, points  |
| `GET /v1/leaderboard?month=2026-11` | The top 10, with names and scores                         |
| `GET /v1/leaderboard/players/{id}`  | The rank and score of one player, and 4 above and 4 below |

## Deep dives

### Why a relational table with ORDER BY does not scale

The obvious first design is a table `score(player_id, month, points)` with an index on `(month, points)`.

The top 10 is cheap: the index gives the first 10 rows in order.

```sql
SELECT player_id, points FROM score
  WHERE month = '2026-11' ORDER BY points DESC LIMIT 10;
```

The rank of one player is not cheap:

```sql
SELECT COUNT(*) + 1 FROM score
  WHERE month = '2026-11' AND points > 1234;
```

A B-tree index finds where 1234 is, but it does not know how many rows come before it. The database must count them, one by one. For a player in the middle of 30 million, that is 15 million index entries for one request. At 1,000 requests each second, the database does nothing else.

The updates make it worse. Each win changes `points`, so the index entry moves. Thousands of moves each second compete with the long counts for the same index pages.

Common workarounds and their limits:

- **Cache the ranks and refresh them every few minutes.** The ranks are old, and a player who just won does not move.
- **Compute the ranks in a batch job each night.** Fine for a weekly board, not for a live one.
- **Show only the top 10.** It does not answer "my rank".

The missing piece is an index that also stores counts, so that a rank costs O(log n) and not O(n).

### The sorted set and the skip list

A Redis **sorted set** is a set of unique members, each with a numeric score, kept in score order. Inside, it has two structures:

- A **hash table** from member to score. "What is the score of player 42?" is O(1).
- A **skip list** ordered by score. A skip list is a sorted linked list with extra levels of links. Each higher level skips over more nodes, like an express train that stops at fewer stations. A search starts on the top level and drops down, so it takes O(log n) steps on average.

Redis also stores, on each link, how many nodes the link skips. A walk from the top to a member adds those counts, so the walk gives the rank as well as the position. That is why a rank costs O(log n).

The commands for this design:

| Command                               | What it does                                           | Cost         |
| ------------------------------------- | ------------------------------------------------------ | ------------ |
| `ZADD lb:2026-11 1234 player:42`      | Set the score of a member                              | O(log n)     |
| `ZINCRBY lb:2026-11 1 player:42`      | Add to the score, and create the member if needed      | O(log n)     |
| `ZREVRANGE lb:2026-11 0 9 WITHSCORES` | The 10 highest members, with scores                    | O(log n + m) |
| `ZREVRANK lb:2026-11 player:42`       | The position of a member, counted from the top, from 0 | O(log n)     |
| `ZSCORE lb:2026-11 player:42`         | The score of a member                                  | O(1)         |

`ZREVRANGE` is deprecated since Redis 6.2. The newer form is `ZRANGE key 0 9 REV WITHSCORES`. Both work, and interviewers know both.

**The flows:**

1. **A win.** The game server sends the win with the match ID. The service inserts the event in the score DB. The match ID is unique, so a repeated report fails the insert and stops there. Then the service calls `ZINCRBY`.
2. **The top 10.** `ZREVRANGE ... 0 9 WITHSCORES`, then one batch read of the 10 names from the profile cache.
3. **My rank and neighbors.** `ZREVRANK` gives the rank r. Then `ZREVRANGE ... r-4 r+4` gives the 9 players around it. Handle r below 4 at the top of the board.

The order of the two writes matters. `ZINCRBY` is not idempotent: a retry adds the point twice. The insert with a unique match ID is the deduplication step. If the service crashes between the insert and the `ZINCRBY`, the sorted set is one point low. A small repair job can compare a sample of players with the DB, or the next rebuild fixes it.

### Ties

Two players with 1,234 points need an order. Redis orders members with equal scores by the member name, in byte order. `ZREVRANGE` uses descending byte order. That is stable, but it is not fair: "player:9" beats "player:10" for no reason.

A common business rule is "first to reach the score ranks higher". Two ways to build it:

1. **Put the time in the score.** A Redis score is a 64-bit floating-point number. It holds integers exactly up to 2^53. Use `score = points × 2^22 + (2^22 − 1 − seconds_since_month_start)`. A month has about 2.7 million seconds, which fits in 22 bits. Points up to about 2 billion still fit in the remaining 31 bits. A higher score wins first, and for equal points an earlier time gives a larger number. The application decodes the points with a division.
2. **Break ties in the application.** Store the time of the last change in a hash. After `ZREVRANGE`, sort equal scores by that time. This is correct for one page, but a rank from `ZREVRANK` still uses the name order.

Option 1 is the better choice: one number gives one order everywhere. Its cost is that each update must set the full score with `ZADD`, not add a point with `ZINCRBY`, because the time part changes too. The service reads the current points, adds the new ones, and writes the composed score. Use a small Lua script, which Redis runs as one step, so two wins for the same player cannot interleave.

### The monthly reset

Do not delete 30 million members at midnight. Use one key for each month: `lb:2026-11`, then `lb:2026-12`.

1. At the start of the month, writes go to the new key. The first `ZINCRBY` or `ZADD` creates it.
2. The old key stays for reads of last month's board.
3. A job writes the final board of the old month to the archive.
4. Set an expiry on the old key, for example 60 days, with `EXPIRE`.

Be clear about the time zone of "a month". A global game often uses UTC. Wins that arrive late, with a match end time in the old month, need a rule: count them by match end time, or by arrival time. Pick one and state it.

### Durability and recovery

Redis keeps data in memory. It has two persistence options: **RDB**, a snapshot of the data at intervals, and **AOF**, a log of each write command. A replica on another server, with automatic failover, covers the loss of one machine. These reduce the risk. They do not make Redis the source of truth.

The source of truth is the score DB, an append-only table of win events. The sorted set is a derived view, like a materialized index. To rebuild it after a total loss:

1. Sum the points of each player for the month from the score DB, with one query or a batch job.
2. Load the totals into a new key with `ZADD`, in batches of some thousand members, with pipelining.
3. Switch the service to the new key.

30 million members at roughly 100,000 writes each second is about 5 minutes. During that time, the board can show "updating" or serve the last snapshot. This rebuild also fixes any drift between the DB and the sorted set. See [Rebuilding a read model](/learn/cqrs-event-sourcing#rebuilding-a-read-model).

### Sharding, when one server is not enough

Grow the numbers: 500 million players, or many boards for each country and game mode. Memory or write load passes the limit of one server. Two ways to split:

**By score range.** Shard 1 holds scores 0 to 99, shard 2 holds 100 to 999, and so on.

- The top 10 is on the highest shard. One read.
- A rank is the rank inside the player's shard, plus the count of all members of the higher shards. `ZCARD` gives each count in O(1).
- When a player's score crosses a boundary, the service removes the member from one shard and adds it to the next. A small table maps each player to their current shard.
- The risk: scores are rarely uniform. Most players have low scores, so the low shards are large. The ranges need tuning as the game changes. See [Partitioning](/learn/scaling-data#partitioning).

**By hash of the player ID.** Redis Cluster places each key on one shard, so one sorted set cannot span shards. The service splits the board into keys such as `lb:2026-11:7`, and picks the key from a hash of the player ID. Writes are even.

- The top 10 needs **scatter-gather**: ask each shard for its top 10, then merge the lists. The cost grows with the number of shards.
- A rank needs a count from each shard: `ZCOUNT key (score +inf` gives the number of higher scores in O(log n). The sum over all shards is the rank. Each rank request touches every shard, so the slowest shard sets the latency. See [Measure the slow requests](/learn/scalability#measure-the-slow-requests).

| Option             | Top 10         | My rank                  | Writes           | Main risk                      |
| ------------------ | -------------- | ------------------------ | ---------------- | ------------------------------ |
| One server         | One read       | One read                 | One server       | Memory and write limits        |
| Score range shards | One shard      | One shard plus counts    | Moves at borders | Uneven shards, retuning ranges |
| Hash shards        | Scatter-gather | Scatter-gather of counts | Even             | Fan-out on every read          |

**The choice.** Stay on one server, with a replica, as long as you can. A single sorted set of a few GB is simple and fast. Before you shard, ask if every player needs an exact rank. A common answer: exact ranks for the top 100,000, and a percentile for the rest, from a histogram of scores that a job updates each minute.

### A NoSQL alternative

A managed key-value or wide-column store with a sorted secondary index can also keep a board. The table has the player and month as the key, and an index sorted by score.

The trap is a hot partition. If all players of the month share one partition key, one partition takes every write. The fix is **write sharding**: add a shard number to the key, such as `2026-11#17`, from a hash of the player ID. The top 10 is then a scatter-gather over the shards, as above. An exact rank for any player is hard, so these designs usually give exact ranks for the top and approximate ranks for the rest.

This option trades the speed and simple rank of the sorted set for managed durability and no memory limit. It fits a team that already runs on such a store and accepts approximate ranks.

## Trade-offs and alternatives

| Decision        | This design                            | Alternative                                  | When the alternative wins                                  |
| --------------- | -------------------------------------- | -------------------------------------------- | ---------------------------------------------------------- |
| Rank structure  | Redis sorted set                       | Relational table with an index               | Small boards, or ranks that can be hours old               |
| Source of truth | Win events in a DB, sorted set derived | Redis with AOF as the only copy              | A game where a lost month is acceptable                    |
| Ties            | Time in the score                      | Order by member name                         | A game where ties are rare and do not matter               |
| Scale-out       | One server with a replica              | Score range or hash shards                   | Hundreds of millions of members, or many boards            |
| Exactness       | Exact ranks for everyone               | Exact top, percentile for the rest           | Very large boards, where most players care about a band    |
| Write path      | Synchronous call from the game server  | A queue between game servers and the service | Bursts after events, where a few seconds of delay are fine |

The central idea is that the sorted set is an index, not the database. It is fast because it is in memory and keeps counts on its links. The event table makes it safe.

## What interviewers probe

**"Why not just use SQL?"**

- The top 10 is cheap with an index. The rank of one player is a count of all higher rows: O(n).
- Constant updates move index entries and compete with the counts.
- A sorted set gives a rank in O(log n).

**"How does a sorted set give a rank in log time?"**

- A hash table for member to score, and a skip list for the order.
- Each link of the skip list stores how many nodes it skips.
- The sum of the spans on the search path is the rank.

**"What happens if Redis loses its data?"**

- Replicas and AOF reduce the risk, but the source of truth is the win events.
- Rebuild by summing per player and loading with pipelined `ZADD`.
- A deduplicated event table also protects against counting a match twice.

**"How do you scale to 500 million players?"**

- First ask if everyone needs an exact rank. A percentile is often enough.
- Score range shards: cheap reads, uneven shards. Hash shards: even writes, scatter-gather reads.
- Name the tail latency cost of a fan-out.

**"Two players have the same score. Who is first?"**

- Ask the business. Often the first to reach the score.
- Encode the time in the score, within the 53 bits of exact integers.
- Update atomically, with a script, because the score is no longer a plain increment.

## Go deeper

- System Design Interview (Alex Xu and Sahn Lam), Volume 2, the chapter on a real-time gaming leaderboard: the sorted set, the memory estimate, and sharding by score range or by hash.
- Designing Data-Intensive Applications (Martin Kleppmann), the part on storage and retrieval: indexes, in-memory databases, and why an index is a derived structure.
- DDIA, the part on partitioning: key range and hash partitioning, skew, and scatter-gather queries on secondary indexes.
- DDIA, the part on derived data: a fast view rebuilt from a log of events.

## Further reading

- [Skip list](https://en.wikipedia.org/wiki/Skip_list) on Wikipedia
- [Redis sorted sets](https://redis.io/docs/latest/develop/data-types/sorted-sets/) in the Redis documentation
- [Storage engines](/learn/storage-engines) and [Scaling data](/learn/scaling-data) in this wiki
