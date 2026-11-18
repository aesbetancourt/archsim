## The question

Try the [News Feed kata](/kata/news-feed) before you read this page.

"Design the news feed of a social app. A user posts text and photos. Each user has a home feed with the recent posts of the people they follow."

The feed is a read of many writes. Each feed mixes posts from hundreds of authors, and each post goes to hundreds of feeds. The central question is when to do that mixing: when a post is written, or when a feed is read. Alex Xu describes the two paths in System Design Interview, the chapter on a news feed. Kleppmann uses a well-known example of a home timeline to show the same choice (DDIA, the part on describing load). This page uses its own numbers.

## Questions to ask first

Functional questions:

- **Who is in the feed?** Only people that the user follows, or also groups, pages, and advertisements? Assume only followed accounts.
- **What is in a post?** Text, images, and video? Assume text and up to four images.
- **Order.** Reverse chronological, or ranked by a model? Start with reverse chronological. Name ranking as an extension.
- **Follow model.** One-way follow, like a public profile, or two-way friendship? One-way follow allows accounts with tens of millions of followers. That changes the design.
- **Interaction.** Likes and comments shown in the feed? Assume counts are shown.

Non-functional questions:

- **Scale.** Daily active users, feed reads for each user, posts each day, and the average and the maximum number of followers.
- **Latency.** How fast must the feed open? Assume 200 ms at the 99th percentile.
- **Freshness.** How soon must a new post show in the feeds of followers? Assume within 1 minute. A feed a few seconds old is acceptable.

The question that changes the design most is the maximum follower count. With two-way friendships and a limit of a few thousand friends, fanout on write is simple. With one-way follows and celebrities, it is not.

## Estimates

Assume these answers: 100 million daily active users. Each user opens the feed 10 times each day. 20 million posts each day. An average account has 300 followers. The largest accounts have 30 million followers.

| Quantity                          | Arithmetic                                 | Result                       |
| --------------------------------- | ------------------------------------------ | ---------------------------- |
| Feed reads                        | 100 million × 10 ÷ 100,000 s               | About 10,000 each second     |
| Feed reads at peak                | 10,000 × 3, a rough factor                 | About 30,000 each second     |
| New posts                         | 20 million ÷ 100,000 s                     | About 200 each second        |
| Feed inserts with fanout on write | 20 million × 300 ÷ 100,000 s               | About 60,000 each second     |
| One celebrity post                | 30 million inserts                         | Minutes of work for one post |
| Feed cache                        | 100 million users × 500 entries × 16 bytes | About 800 GB                 |

What the numbers say:

- Reads are 50 times more frequent than posts. A fast read path is worth extra work on the write path.
- Fanout on write multiplies 200 posts each second into 60,000 inserts each second. That is large, but a cluster of in-memory stores can take it.
- One celebrity post is 30 million inserts. At 100,000 inserts each second, that is 5 minutes, and it delays all other posts in the same workers. This is the hard part of the problem.
- The feed cache holds only post IDs and author IDs, not posts. In that form, 800 GB fits in a cache cluster.

## The first design

```diagram
{
  "nodes": [
    { "id": "user", "label": "App", "shape": "actor", "col": 0, "row": 0.6 },
    { "id": "web", "label": "Web servers\n(auth, rate limit)", "shape": "box", "col": 1, "row": 0.6 },
    { "id": "post", "label": "Post service", "shape": "box", "col": 2, "row": 0 },
    { "id": "fan", "label": "Fanout service\nand workers", "shape": "box", "col": 3, "row": 0 },
    { "id": "graph", "label": "Graph store\n(followers)", "shape": "store", "col": 3, "row": 1.2 },
    { "id": "feedsvc", "label": "Feed service", "shape": "box", "col": 2, "row": 1.2 },
    { "id": "feedcache", "label": "Feed cache\n(post IDs per user)", "shape": "store", "col": 2, "row": 2.4 },
    { "id": "content", "label": "Post and user caches,\npost store", "shape": "store", "col": 1, "row": 2.4 },
    { "id": "cdn", "label": "CDN\n(images)", "shape": "external", "col": 0, "row": 2.4 }
  ],
  "edges": [
    { "from": "user", "to": "web", "label": "post, read feed" },
    { "from": "web", "to": "post", "label": "publish" },
    { "from": "post", "to": "fan", "label": "new post", "async": true },
    { "from": "fan", "to": "graph", "label": "followers" },
    { "from": "fan", "to": "feedcache", "label": "add post ID" },
    { "from": "web", "to": "feedsvc", "label": "read" },
    { "from": "feedsvc", "to": "feedcache", "label": "IDs" },
    { "from": "feedsvc", "to": "content", "label": "hydrate" },
    { "from": "user", "to": "cdn", "label": "images" }
  ]
}
```

**The publish path.**

1. The app sends the post to the web servers. They authenticate the user and apply a rate limit.
2. The post service writes the post to the post store and to the post cache. It uploads images to object storage behind the CDN. It answers the app.
3. The post service sends a "new post" event to the fanout service through a queue.
4. The fanout service gets the follower IDs from the graph store. It removes followers who muted the author or who are inactive.
5. Fanout workers add the post ID to the feed list of each remaining follower in the feed cache.

**The read path.**

1. The app asks for the feed. The web servers send the request to the feed service.
2. The feed service reads the list of post IDs for this user from the feed cache.
3. It hydrates the IDs: it reads the posts, the author names and photos, and the counts from their caches.
4. It returns a page of complete posts, with image URLs that point to the CDN.

The feed cache holds IDs only. A post exists in one place. An edit or a delete then changes one record, and the feed shows the change at the next read.

## Deep dives

### Fanout on write or fanout on read

This is the main decision.

| Property              | Fanout on write (push)                   | Fanout on read (pull)                                  |
| --------------------- | ---------------------------------------- | ------------------------------------------------------ |
| When the work happens | When a post is written                   | When a feed is read                                    |
| Read cost             | One list read, then hydration            | Read recent posts of each followed account, then merge |
| Read latency          | Low and steady                           | Grows with the number of followed accounts             |
| Write cost            | One insert for each follower             | One insert                                             |
| Waste                 | Inserts for users who never open the app | None                                                   |
| Celebrity post        | Millions of inserts, a hot spot          | No problem                                             |
| Freshness             | Seconds after the fanout                 | Immediate                                              |

Neither is good alone at this scale. Fanout on write fails on the celebrity. Fanout on read makes each feed read do 300 lookups and a merge at 30,000 reads each second.

**The hybrid.** Push for most authors, pull for celebrities.

1. Mark an account as a celebrity above a threshold, for example 1 million followers. The threshold is a tuning value.
2. For normal authors, fan out on write.
3. For celebrities, do not fan out. Keep their recent posts in a small cache that is easy to read.
4. On a feed read, take the precomputed list. Then read the recent posts of the celebrities that the user follows, which is usually a small number. Merge the two by time.

The same idea removes waste on the other side. Do not fan out to users who have not opened the app for 30 days. When such a user returns, build the feed once by pull, and then go back to push.

### The feed cache

The feed cache is a list of entries for each user. Each entry holds a post ID and an author ID, about 16 bytes.

- **Length.** Keep a fixed number of the newest entries, for example 500. Few users scroll further. A request for older posts goes to a slower path that pulls from the post store.
- **Store.** An in-memory store with list or sorted-set types, partitioned by user ID.
- **Loss.** The feed cache is derived data. If a node is lost, rebuild the feeds of its users by pull on their next read. It is slow for those users for one read, and nothing is lost.
- **New follow.** When a user follows an account, add its recent posts to the feed list, or wait for the next posts. When a user unfollows, filter at read time, and let the old entries age out.

### The graph store

The graph store answers two questions: "who follows A?" for the fanout, and "whom does B follow?" for the pull path and for the profile page.

- Store two lists for each user: followers and following. Each follow writes to both.
- A relational table with an index on both columns works at first. At scale, an adjacency list in a partitioned key-value store is common.
- A graph database is useful for questions about friends of friends, such as suggestions of new people to follow. A feed needs only one hop, so it does not need a graph database.
- The follower list of a celebrity has 30 million entries. Read it in pages, and spread the fanout over many workers.

### The content cache tiers

Hydration reads many small records for each feed page. Each kind of data has its own cache, because each has a different size, change rate, and load.

| Tier         | Holds                                 | Note                                                                     |
| ------------ | ------------------------------------- | ------------------------------------------------------------------------ |
| Feed         | Post IDs for each user                | Precomputed by the fanout                                                |
| Content      | Post bodies                           | Hot posts get extra copies, because one post can be in millions of feeds |
| Social graph | Followers and following               | Read by the fanout and by the pull path                                  |
| Actions      | Did this user like this post?         | One small record for each user and post                                  |
| Counters     | Likes, comments, shares for each post | Updated often. Batch the increments.                                     |

A post from a celebrity is read by millions of users in a few minutes. That is a hot key on one cache node. Keep a copy of very hot posts in the memory of each feed server for a few seconds, or replicate the key to several nodes. See [Caching](/learn/caching).

### Ranking and pagination with cursors

**Ranking.** A ranked feed changes only the read path. The feed service takes a larger set of candidate posts, for example the newest 500 IDs, scores each with a model that predicts interest, and returns the top ones. The data and the fanout stay the same. In an interview, mention ranking and its cost: more data read for each request, and a model to serve. Do not design the model.

**Pagination.** The feed is long and changes while the user scrolls. Offset pagination ("give me items 20 to 40") breaks: when 5 new posts arrive, items move down, and the next page shows 5 posts again.

Use a cursor instead:

1. The first request returns a page of posts and a `next_cursor`. The cursor holds the ID of the last post on the page.
2. The next request sends the cursor. The service returns posts older than that ID.
3. New posts at the top do not move the cursor.

This works well when post IDs sort by time. See [Unique IDs at scale](/learn/unique-ids). For a ranked feed, the order is not by ID. Store the ranked list for the session for a short time, and let the cursor hold a position in that list.

## Trade-offs and alternatives

| Decision           | Choice here                          | When the choice changes                                                     |
| ------------------ | ------------------------------------ | --------------------------------------------------------------------------- |
| Fanout             | Hybrid: push, pull for celebrities   | Push only, when friendships are two-way and limited in size                 |
| Inactive users     | No push, build on return             | Push to all, when the active share is very high                             |
| Feed cache content | IDs only, hydrate on read            | Full posts in the feed, when hydration is the bottleneck and edits are rare |
| Order              | Reverse chronological                | Ranked, when engagement matters more than a simple rule                     |
| Pagination         | Cursor with a sortable post ID       | A stored session list, for a ranked feed                                    |
| Graph store        | Adjacency lists in a key-value store | A graph database, when the product needs many hops                          |

The hybrid has a cost: two paths to build, test, and monitor, and a threshold to tune. The cost is worth it only when the follower distribution has a long tail. Say that, and show the number that proves it.

## What interviewers probe

1. **"An account with 30 million followers posts. Walk me through it."**
   - With push only: 30 million inserts, minutes of work, a delay for all other posts.
   - With the hybrid: no fanout. Followers pull the post at read time and merge it.
2. **"Why store IDs in the feed and not the posts?"**
   - A post lives in one place. Edits and deletes show at once. The cache is much smaller.
   - The cost is hydration on each read, which the content caches make fast.
3. **"The feed cache cluster loses a node."**
   - The data is derived. Rebuild by pull on the next read of each user.
   - Watch the load on the post store during the rebuild.
4. **"How do you page through a feed that changes?"**
   - A cursor with the last post ID, not an offset. Sortable IDs make it simple.
5. **"How fresh is the feed, and what limits it?"**
   - The time of the fanout queue. Measure the age of the oldest event in that queue, and add workers when it grows.

## Go deeper

- **System Design Interview** (Alex Xu), the chapter on a news feed: the publish path, the read path, and the cache tiers.
- **Designing Data-Intensive Applications** (Martin Kleppmann), the part on describing load: the home timeline example and the hybrid of the two methods.
- **Designing Data-Intensive Applications**, the part on derived data: why a feed is a precomputed view that you can rebuild.

## Further reading

- [News feed](https://en.wikipedia.org/wiki/News_feed) on Wikipedia
- Related lessons: [Caching](/learn/caching), [Messaging](/learn/messaging), [From one server to millions of users](/learn/scale-step-by-step)
