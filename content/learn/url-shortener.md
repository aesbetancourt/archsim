## The question

Try the [Link Shortener kata](/kata/link-shortener) before you read this page.

"Design a service like a URL shortener. A user gives a long URL and gets a short link back. A person who opens the short link goes to the long URL."

The product is small, so the interview is about the details. The interviewer wants to see how you make codes that never collide, how you keep a redirect fast under a large read load, and what you do about the people who use short links for harm. Alex Xu uses this case to show the full method in a small space (System Design Interview, the chapter on a URL shortener). This page uses its own numbers, and they are different from the numbers in the kata.

## Questions to ask first

Functional questions:

- **What are the operations?** Usually two: make a short link, and follow a short link. Ask if users can also edit or delete a link.
- **How short is short?** Ask if there is a fixed length, or "as short as possible".
- **Which characters?** Letters and digits are safe in a URL and easy to type. Ask if the code must avoid characters that look alike, such as `0` and `O`.
- **Custom aliases?** Can a user ask for `/spring-sale` instead of a random code?
- **Expiry?** Do links last forever, or until a date that the user sets?
- **Analytics?** Does the owner see click counts, and in how much detail: total only, or by country, day, and referrer?
- **The same long URL twice?** Does it get the same code, or a new code each time?

Non-functional questions:

- **Scale.** How many new links each day, and how many redirects for each new link?
- **Latency.** A redirect is a delay before the page that the user wants. Ask for a target, for example 50 ms at the 99th percentile inside one region.
- **Availability.** A link can be printed on a poster. If the service is down, each copy of that poster fails. Availability of the redirect is more important than availability of link creation.
- **Lifetime.** How many years must a link work? This number sets the size of the code.

The two questions that change the design most are the analytics detail (it decides the redirect status code) and the lifetime (it decides the code length and the storage).

## Estimates

Assume these answers: 10 million new links each day, 50 redirects for each new link, links kept for 10 years. Use the rounded day of 100,000 seconds from the [estimation lesson](/learn/estimation#numbers-to-remember).

| Quantity           | Arithmetic                               | Result                           |
| ------------------ | ---------------------------------------- | -------------------------------- |
| Writes             | 10 million ÷ 100,000 s                   | About 100 each second            |
| Reads (average)    | 100 × 50                                 | About 5,000 each second          |
| Reads (peak)       | 5,000 × 5, a rough peak factor           | About 25,000 each second         |
| Links in 10 years  | 10 million × 365 × 10                    | About 36.5 billion               |
| Storage            | 36.5 billion × 300 bytes for each record | About 11 terabytes               |
| Redirect bandwidth | 25,000 × 500 bytes for each response     | About 12.5 megabytes each second |

### Code length arithmetic

A code of length _n_ over an alphabet of 62 characters (a–z, A–Z, 0–9) has 62ⁿ values.

| Length | Values (rounded) | Enough for 36.5 billion links?   |
| ------ | ---------------- | -------------------------------- |
| 5      | 916 million      | No                               |
| 6      | 56.8 billion     | Yes, but only 1.5 times the need |
| 7      | 3.5 trillion     | Yes, about 100 times the need    |

Six characters fit, but the margin is thin. A hash method collides more often as the space fills, and growth can be faster than the estimate. Choose 7 characters. Each extra character multiplies the space by 62, at the cost of one character for the user.

What the numbers say:

- The write load is small. One database server can take 100 inserts each second.
- The read load is 50 times larger and comes in bursts. Design the read path first.
- 11 terabytes is too much for one comfortable server. The store must be [partitioned](/learn/scaling-data#partitioning).
- The bandwidth is small, because a redirect has no body of interest.

## The first design

```diagram
{
  "nodes": [
    { "id": "user", "label": "Browser", "shape": "actor", "col": 0, "row": 0 },
    { "id": "lb", "label": "Load balancer", "shape": "box", "col": 1, "row": 0 },
    { "id": "redir", "label": "Redirect service\n(stateless)", "shape": "box", "col": 2, "row": 0 },
    { "id": "cache", "label": "Cache\n(hot codes)", "shape": "store", "col": 3, "row": 0 },
    { "id": "create", "label": "Create service\n(stateless)", "shape": "box", "col": 2, "row": 1.2 },
    { "id": "ids", "label": "ID generator", "shape": "box", "col": 1, "row": 1.2 },
    { "id": "store", "label": "Link store\n(key-value, partitioned)", "shape": "store", "col": 3, "row": 1.2 },
    { "id": "clicks", "label": "Click events", "shape": "pipe", "col": 2, "row": 2.4 },
    { "id": "stats", "label": "Analytics store", "shape": "store", "col": 3, "row": 2.4 }
  ],
  "edges": [
    { "from": "user", "to": "lb", "label": "GET /code\nPOST /links" },
    { "from": "lb", "to": "redir" },
    { "from": "lb", "to": "create" },
    { "from": "redir", "to": "cache", "label": "look up" },
    { "from": "redir", "to": "store", "label": "on a miss" },
    { "from": "create", "to": "ids", "label": "next ID" },
    { "from": "create", "to": "store", "label": "insert" },
    { "from": "redir", "to": "clicks", "label": "click", "async": true },
    { "from": "clicks", "to": "stats", "label": "batches", "async": true }
  ]
}
```

- **The API.** Two endpoints are enough:
  - `POST /api/v1/links` with the long URL, an optional alias, and an optional expiry date. It returns the short URL.
  - `GET /{code}` returns a redirect, with the status code and a `Location` header that holds the long URL.
- **Load balancer.** It spreads requests over copies of the two services. The services keep no state, so you add copies when load grows.
- **Redirect service.** It finds the long URL for a code and sends the redirect. It looks in the cache first, then in the store. It never waits for analytics.
- **Create service.** It checks the long URL, gets a new code, and writes the record. It is a separate deployment because its load, its rules, and its risks are different. The two can also be one application with two paths. Say which, and why.
- **ID generator.** It gives each new link a number that no other link has. See [Unique IDs at scale](/learn/unique-ids).
- **Link store.** A key-value store, partitioned by code. Each redirect is a lookup by one key, which is the access pattern that a key-value store is best at.
- **Cache.** It holds the popular codes in memory. Most redirects end here.
- **Click events.** The redirect service writes a small event and continues. A consumer adds the events to the analytics store in batches.

## Deep dives

### 301 or 302, and the cost of analytics

The redirect status code decides where the load goes.

| Status | Meaning           | Browser behavior                                                     | Effect                                             |
| ------ | ----------------- | -------------------------------------------------------------------- | -------------------------------------------------- |
| 301    | Moved permanently | The browser can keep the answer and skip the service next time       | Less load. The service does not see repeat clicks. |
| 302    | Found (temporary) | The browser asks the service each time, unless headers allow a cache | Each click reaches the service. Full analytics.    |

Choose 302 when the owner pays for click analytics, or when the owner can change the target. Choose 301 when the load is the main problem and counts are not part of the product. A middle path is a 302 with a `Cache-Control` header that allows a short cache time. That gives you most clicks and removes the fast repeats from one browser.

A redirect must not wait for the click record. Write the event to a queue or to a local buffer and return. If the event is lost, a count is a little low. If the redirect waits, every user pays for it. Most teams accept counts that are close but not exact. Say that aloud, because it is a deliberate choice. See [Messaging](/learn/messaging#delivery-promises) for what each delivery promise costs.

### Hash and resolve collisions, or encode a unique ID

There are two main ways to make the code.

**Option A: hash the long URL.** Take a hash such as SHA-256 of the long URL, encode it in base 62, and keep the first 7 characters. Two different URLs can give the same 7 characters, so you must check:

1. Compute the code from the URL.
2. Look up the code in the store.
3. If the code is free, insert the record.
4. If the code belongs to a different URL, add a fixed salt to the URL, hash again, and go back to step 2.

Two servers can pass step 2 at the same moment with the same code. Make step 3 a conditional insert ("insert if the key does not exist"), so the store refuses the second one. The extra lookup on each write costs time. A [Bloom filter](https://en.wikipedia.org/wiki/Bloom_filter) in memory can answer "this code is certainly free" with no store read. The good property of a hash is that the same URL always gives the same code, with no extra index.

**Option B: base 62 of a unique ID.** Get a number from the ID generator and write it in base 62. The number 125 is `21` in base 62, because 2 × 62 + 1 = 125. Codes never collide, because the numbers never repeat. There is no lookup before the insert.

| Property             | Hash + collision check            | Base 62 of a unique ID                             |
| -------------------- | --------------------------------- | -------------------------------------------------- |
| Collisions           | Possible, more as the space fills | None                                               |
| Write cost           | Lookup and conditional insert     | One insert                                         |
| Code length          | Fixed (7)                         | Grows with the ID; pad to a fixed length if needed |
| Same URL, same code  | Yes, with no extra work           | Only with a second index on the long URL           |
| Codes can be guessed | No                                | Yes, if IDs are sequential                         |
| Extra part to run    | None                              | An ID generator                                    |

**The choice:** base 62 of a unique ID, for most cases. The write path is simple and correct at any scale. Two problems need an answer.

- **Guessable codes.** Sequential codes let a person walk through all links and find private ones. Mix the bits of the ID before you encode it, for example with a small reversible cipher. The codes look random and still never collide.
- **The ID generator as a single point.** Do not call a central counter for each link. Give each create server a block of numbers, for example 10,000 at a time. A server that stops loses the rest of its block. Gaps in the codes are harmless.

A third option is a key service that makes random codes in advance and hands out unused ones. It moves the collision check out of the request path, but it is one more stateful part to run.

### The data model and the store

One record for each link:

| Field        | Type                  | Note                                      |
| ------------ | --------------------- | ----------------------------------------- |
| `code`       | string, 7 to 30 chars | The key. Partition by this field.         |
| `long_url`   | string, up to 2 KB    | Limit the length at creation.             |
| `owner_id`   | ID                    | Empty for anonymous links, if they exist. |
| `created_at` | time                  |                                           |
| `expires_at` | time or empty         |                                           |
| `is_alias`   | boolean               | True for a custom alias.                  |

The redirect needs only `code` → `long_url` and `expires_at`. The owner page needs "all links of one owner", which is a second index or a second table keyed by `owner_id`. Keep click counts out of this record. A counter that changes on each click turns a read-only record into a hot write.

A relational database works for the first years. At 11 terabytes and growing, a partitioned key-value store is the natural fit. DDIA explains how hash partitioning spreads keys evenly, and why range queries become hard after it (DDIA, the part on partitioning). The redirect never needs a range query, so hash partitioning costs nothing here.

### A cache for a read-heavy load

Clicks on links are very uneven. A link in a viral post can get millions of clicks in one day, and most links get almost none. Rough rule: a small share of codes gets most of the clicks.

- **Size.** Assume that 100 million codes are hot at one time. At about 300 bytes each, that is 30 gigabytes. A small cache cluster holds it.
- **Policy.** Cache-aside with least-recently-used eviction. See [Caching](/learn/caching).
- **Time limit.** A link rarely changes, so the time limit can be long. It must never be longer than the time to the expiry date of the link.
- **Misses for codes that do not exist.** People and bots try random codes. Cache the "not found" answer for a short time, or each attempt reaches the store.
- **One code with a huge load.** A single hot key lands on one cache server. Keep a small copy in the memory of each redirect server for the top codes, with a time limit of a few seconds.
- **The edge.** A CDN or an edge function can answer redirects near the user. This gives the lowest latency, and it hides clicks from your servers unless the edge sends events.

Read [how a cache fails](/learn/caching#how-a-cache-fails) and say what occurs when the cache cluster restarts. The link store must survive the full read load for a short time, or the service must limit requests until the cache is warm.

### Custom aliases, expiry, and abuse

**Custom aliases** share the namespace with generated codes. Two rules prevent a conflict:

1. Make the alias format different from generated codes. For example, an alias is at least 8 characters, or it must contain a `-`. A generated code never matches that format.
2. Insert the alias with a conditional insert. The first user to ask for `/spring-sale` gets it, and the second gets an error.

Keep a list of reserved words, such as `api`, `login`, and `admin`, and of brand names that a person can abuse.

**Expiry.** Store `expires_at` and check it on each redirect. Return 404 or 410 after the date. A background job deletes old records later. Do not hand an expired code to a new link. A person who clicks an old link on an old web page must not arrive at a stranger's page.

**Abuse.** A short link hides its target, so attackers use it for phishing and malware.

- Check each new long URL against lists of known bad sites at creation, and again later, because a good site can turn bad.
- Limit link creation for each user and each IP address. See [Design a rate limiter](/learn/rate-limiter).
- Give a way to report a link, and a way to disable it at once. A disabled link must leave the cache too.
- Show a warning page for links that look suspicious, instead of a direct redirect.
- Do not let the redirect send users to `javascript:` or `data:` URLs. Allow only `http` and `https`.

## Trade-offs and alternatives

| Decision        | Choice here                                | When the choice changes                                               |
| --------------- | ------------------------------------------ | --------------------------------------------------------------------- |
| Redirect status | 302                                        | 301 when analytics is not part of the product and load is the problem |
| Code generation | Base 62 of a mixed unique ID               | Hash when the same URL must give the same code with no extra index    |
| Code length     | 7                                          | 6 when the lifetime or the volume is much smaller                     |
| Store           | Partitioned key-value                      | One relational database while the data fits on one server             |
| Analytics       | Asynchronous events, counts close to exact | Synchronous writes only if counts are billed and must be exact        |
| Same URL twice  | New code each time                         | Same code when the product wants one link for each target             |

The design is deliberately boring. The services keep no state. The only coordination is the ID generator, and the block method removes it from the request path. The real risks are a cold cache, a hot key, and abuse.

## What interviewers probe

1. **"Two servers make a code at the same moment. What stops a collision?"**
   - With IDs: the ID ranges do not overlap, so the codes cannot match.
   - With hashes: a conditional insert in the store refuses the second write.
   - A check in application code alone is not enough, because two checks can pass at the same moment.
2. **"Why not 301?"**
   - A 301 lets the browser skip the service, so repeat clicks are not counted and the target cannot change.
   - It is correct when load matters more than counts. Name the trade-off.
3. **"The cache cluster restarts at peak. What occurs?"**
   - 25,000 reads each second go to the store. Say if the store can take it.
   - Protect it: warm the cache from a list of hot codes, let only one request load each code, and limit requests for a short time.
4. **"How do you count clicks without slowing the redirect?"**
   - Write an event to a queue, and return. Count in batches.
   - Accept a small loss or a duplicate. If counts are billed, make events idempotent with an event ID.
5. **"A criminal uses your links for phishing. What do you do?"**
   - Check at creation and again later, limit creation rates, give a report path, and disable links at once in the store and in the cache.

## Go deeper

- **System Design Interview** (Alex Xu), the chapter on a URL shortener: the full interview method on a small case, with both code methods.
- **Designing Data-Intensive Applications** (Martin Kleppmann), the part on partitioning: hash and range partitioning, and the hot key problem.
- **Designing Data-Intensive Applications**, the part on stream processing: how click events become counts, and what delivery promises cost.

## Further reading

- [URL shortening](https://en.wikipedia.org/wiki/URL_shortening) on Wikipedia, with the history of abuse
- [HTTP 301](https://en.wikipedia.org/wiki/HTTP_301) and [HTTP 302](https://en.wikipedia.org/wiki/HTTP_302) on Wikipedia
- [Bloom filter](https://en.wikipedia.org/wiki/Bloom_filter) on Wikipedia
- Related lessons: [Unique IDs at scale](/learn/unique-ids), [Caching](/learn/caching), [Estimation](/learn/estimation)
