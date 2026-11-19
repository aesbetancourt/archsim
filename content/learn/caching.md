## What a cache is for

A cache keeps a copy of data that is expensive to get, in a place where it is cheap to get. It trades fresh data for speed and lower load. It helps when the same data is read many times between changes.

Before you add a cache, ask: is the read too slow or too frequent, and can this data be a little old? If the answer to the second question is no, a cache will cause faults.

The value of a cache depends on its hit rate: the share of reads that the cache answers. With a hit rate of 80%, the database gets one read in five. The average read time is a mix of the two paths. With rough numbers, 80% of reads at 1 ms and 20% at 50 ms give about 11 ms. A cache with a low hit rate adds a network call to each read and saves little. Measure the hit rate, and remove a cache that does not earn its place.

A cache also adds a second copy of the data, and a second copy can be wrong. Kleppmann describes a cache as derived data: data that you can build again from the main store (DDIA, the part on derived data). That view gives the main rule of this page. The main store is the truth, and the cache is a copy that you can throw away.

## A cache, step by step

Follow one shop from a slow page to a cache that works, and then see the two ways it fails. Use the buttons or the arrow keys.

```walkthrough
{
  "title": "A cache for a product page",
  "metrics": [
    {
      "id": "time",
      "label": "Page time",
      "unit": "ms",
      "better": "lower"
    },
    {
      "id": "reads",
      "label": "Database reads",
      "unit": "/s",
      "better": "lower"
    },
    {
      "id": "hit",
      "label": "Hit rate",
      "unit": "%",
      "better": "higher"
    },
    {
      "id": "age",
      "label": "Data age"
    }
  ],
  "diagram": {
    "nodes": [
      {
        "id": "users",
        "label": "Users",
        "col": 0,
        "row": 1
      },
      {
        "id": "app",
        "label": "Application\n(3 copies)",
        "shape": "box",
        "col": 1,
        "row": 1
      },
      {
        "id": "cache",
        "label": "Cache\n(products, 5 min)",
        "shape": "store",
        "col": 2,
        "row": 0
      },
      {
        "id": "db",
        "label": "Database",
        "shape": "store",
        "col": 2,
        "row": 2
      },
      {
        "id": "admin",
        "label": "Admin",
        "shape": "person",
        "col": 0,
        "row": 2.3
      }
    ],
    "edges": [
      {
        "from": "users",
        "to": "app",
        "label": "page view"
      },
      {
        "from": "app",
        "to": "cache",
        "label": "look up"
      },
      {
        "from": "app",
        "to": "db",
        "label": "read"
      },
      {
        "from": "admin",
        "to": "app",
        "label": "change price"
      }
    ]
  },
  "steps": [
    {
      "kind": "problem",
      "title": "Pages are slow at noon",
      "text": "A shop shows product pages. Each page view reads the product, its price, and its stock from the database.\n\nAt noon, 2,000 reads each second reach the database. It is at its limit, and a page takes 450 ms to load.",
      "key": "Before you add a part, find out if the read is too slow or too frequent.",
      "show": [
        "users",
        "app",
        "db"
      ],
      "flow": [
        "users>app",
        "app>db"
      ],
      "focus": [
        "db"
      ],
      "notes": {
        "db": "2,000 reads/s"
      },
      "metrics": {
        "time": 450,
        "reads": 2000,
        "hit": 0,
        "age": "0 s"
      }
    },
    {
      "kind": "idea",
      "title": "The same products, again and again",
      "text": "Look at what the reads ask for. The 100 most popular products get 80% of the reads. A product changes only a few times each day.\n\nSo the database sends the same answer many times between two changes. This is the case where a cache helps.",
      "key": "A cache helps when the same data is read many times between changes.",
      "show": [
        "users",
        "app",
        "db"
      ],
      "focus": [
        "db"
      ],
      "notes": {
        "db": "80% of reads: 100 products"
      },
      "changes": [
        "Found: most reads are for a few products"
      ]
    },
    {
      "kind": "technique",
      "title": "A cache hit",
      "text": "Add a shared cache server next to the database. The application looks in the cache first. When the product is there, the answer comes from memory in about 1 ms, and the database does not see the read.\n\nThe three copies of the application use the same cache, so a product read by one copy is ready for the others.",
      "key": "A cache trades fresh data for speed and lower load. Write on the box what it holds and how old it can be.",
      "show": [
        "users",
        "app",
        "cache",
        "db"
      ],
      "flow": [
        "users>app",
        "app>cache"
      ],
      "focus": [
        "cache"
      ],
      "notes": {
        "cache": "hit: 1 ms"
      },
      "metrics": {
        "time": 40,
        "reads": 400,
        "hit": 80,
        "age": "up to 5 min"
      }
    },
    {
      "kind": "technique",
      "title": "A miss: cache-aside",
      "text": "When the product is not in the cache, the application reads the database. Then it puts the result in the cache with a time limit of 5 minutes. The next read of that product is a hit.\n\nThis method is cache-aside: the application does the load. It is the usual method. 20% of the reads are misses, so the database still gets 400 reads each second.",
      "key": "The application decides what goes in the cache. Only data that somebody reads takes space in it.",
      "show": [
        "users",
        "app",
        "cache",
        "db"
      ],
      "flow": [
        "app>cache",
        "app>db"
      ],
      "notes": {
        "cache": "miss",
        "db": "read, then fill cache"
      }
    },
    {
      "kind": "problem",
      "title": "A price changes",
      "text": "An admin changes the price of a product. The database has the new price. The cache still has the old one, and it sends the old price until the entry expires.\n\nFor a product description, 5 minutes of old data is acceptable. For a price that a customer pays, it is not.",
      "key": "The hard problem of caching is to know when the copy is wrong.",
      "show": [
        "users",
        "app",
        "cache",
        "db",
        "admin"
      ],
      "flow": [
        "admin>app",
        "app>db"
      ],
      "focus": [
        "cache"
      ],
      "notes": {
        "cache": "old price",
        "db": "new price"
      }
    },
    {
      "kind": "technique",
      "title": "Remove the entry on change",
      "text": "When the application saves a change, it also removes the entry from the cache. The next read is a miss, and it gets the new price from the database.\n\nKeep the 5-minute time limit. It is a safety net for a place in the code that forgets to remove the entry. The checkout reads the price from the database, because there an old price is a fault.",
      "key": "Use a time limit as a safety net, and removal on change where fresh data matters.",
      "show": [
        "users",
        "app",
        "cache",
        "db",
        "admin"
      ],
      "flow": [
        "admin>app",
        "app>cache"
      ],
      "focus": [
        "cache"
      ],
      "notes": {
        "cache": "entry removed"
      },
      "metrics": {
        "age": "seconds"
      },
      "changes": [
        "Checkout reads the price from the database"
      ]
    },
    {
      "kind": "failure",
      "title": "A popular entry expires",
      "text": "At 12:00, the entry of the most popular product expires. In the same second, 500 requests miss. All of them read the database to build the same entry. This is a cache stampede.\n\nThe protection: only one request rebuilds the entry. The others wait for it, or get the old value for a moment.",
      "key": "A popular entry that expires sends a burst of identical reads to the database.",
      "show": [
        "users",
        "app",
        "cache",
        "db",
        "admin"
      ],
      "flow": [
        "users>app",
        "app>db"
      ],
      "focus": [
        "db"
      ],
      "notes": {
        "cache": "miss: top product",
        "db": "500 reads at once"
      },
      "metrics": {
        "time": 900,
        "reads": 900,
        "hit": 55
      }
    },
    {
      "kind": "failure",
      "title": "The cache server stops",
      "text": "Now the cache server stops. All 2,000 reads each second go to the database again. But the team made the database smaller after the cache came, because it got only 400 reads. Pages time out.\n\nThe protection: the database must survive the full load for a short time, or the application limits the requests. Measure the database without the cache, so the cache does not hide a slow database.",
      "key": "A cache must never be the only place where data lives, and the system must survive while the cache is empty.",
      "show": [
        "users",
        "app",
        "cache",
        "db",
        "admin"
      ],
      "flow": [
        "users>app",
        "app>db"
      ],
      "down": [
        "cache"
      ],
      "notes": {
        "db": "2,000 reads/s"
      },
      "metrics": {
        "time": 3000,
        "reads": 2000,
        "hit": 0
      }
    },
    {
      "kind": "recap",
      "title": "What you built",
      "text": "A shared cache in front of the database, filled by cache-aside. Each entry has a time limit of 5 minutes, and a change removes the entry at once. The checkout does not use the cache.\n\nYou also know the two failures to plan for: a stampede when a popular entry expires, and the full load on the database when the cache stops.",
      "key": "In a kata, label the cache with what it holds and how old it can be. Then say what occurs when it is empty.",
      "show": [
        "users",
        "app",
        "cache",
        "db",
        "admin"
      ],
      "notes": {
        "cache": "products, 5 min, removed on change"
      },
      "metrics": {
        "time": 40,
        "reads": 400,
        "hit": 80
      }
    }
  ]
}
```

## Where a cache can be

| Place               | Holds                                          | Example                              |
| ------------------- | ---------------------------------------------- | ------------------------------------ |
| Browser or app      | Files and answers for one user                 | Images, the last feed                |
| CDN                 | Files and public pages, near the users         | Video segments, product images       |
| In the application  | Results that one process uses often            | Settings, price rules                |
| Shared cache server | Results that all copies of the application use | Sessions, popular links, ready feeds |
| In the database     | Recently used data pages                       | Automatic                            |

A request can pass through several of these layers. Each layer has its own time limit, and the ages add up. A product image with 5 minutes in the CDN and 5 minutes in the browser can be 10 minutes old. When you set a time limit, think about the full path.

An in-process cache is the fastest: no network call at all. Each copy of the application has its own cache, so the copies can disagree for up to the time limit. A removal on change must reach each copy, usually through a message that all copies receive. A shared cache server, such as Redis or Memcached, costs one network call (roughly a millisecond) and gives one answer to all copies.

## How data gets in

- **Cache-aside (often called read-through):** the application looks in the cache. If the data is not there, it reads the database and puts the result in the cache. This is the usual method.
- **Write-through:** each write updates the database and the cache together. Reads are always fast. Writes are slower.
- **Prepared in the background:** a worker builds the data before anyone asks. The News Feed worked example does this.
- **Write-back (write-behind):** the write goes to the cache only, and the cache writes it to the database later. See the section below.

Strictly, "read-through" names the case where the cache itself loads from the database on a miss, and "cache-aside" the case where the application does it. Many teams use the two names for the same thing. In an interview, describe who does the load.

| Method        | Read speed                | Write speed | Risk                                           |
| ------------- | ------------------------- | ----------- | ---------------------------------------------- |
| Cache-aside   | Fast after the first miss | Normal      | Old data until the entry expires or is removed |
| Write-through | Fast                      | Slower      | The cache fills with data that nobody reads    |
| Background    | Always fast               | Normal      | Work for data that nobody reads                |
| Write-back    | Fast                      | Very fast   | Loss of writes if the cache fails              |

## Write-back

In write-back, the application writes to the cache and gets a confirmation at once. The cache sends the changes to the database later, often in groups.

It is useful in two cases. Writes come in bursts that the database cannot take, such as view counters on a popular video. Or many writes change the same value, and only the last one matters, such as the position of a parcel van every second.

The cost is durability. A confirmed write lives only in the cache until it is copied. If the cache server fails, those writes are gone. Use write-back only for data that you can lose, or put the cache on replicated, persisted storage and accept the extra cost. Never use it for money, bookings, or anything that a user was told is saved.

## How data gets out

The hard problem of caching is to know when the copy is wrong.

- **Time limit:** each entry expires after a fixed time. It is simple, and data can be old for up to that time.
- **Removal on change:** when the data changes, the application removes the entry. Data is fresher, and each place that changes the data must remember to do this.
- **Size limit:** when the cache is full, it drops the entries that were not used for the longest time.

Most designs use a time limit as a safety net and removal on change where fresh data matters.

Remove the entry. Do not write the new value into it. With two writers, the cache updates can arrive in the wrong order, and the older value stays in the cache. A removal has no order problem: the next read gets the current value. A small race remains. A read that started before the change can put the old value back after the removal. A short time limit limits the damage.

The usual drop rule for a full cache is LRU (least recently used). LFU (least frequently used) keeps entries that are read often, even if not in the last minute. Watch the eviction rate. A high rate means that the cache is too small for its working set.

## Protect against a stampede

A stampede occurs when a popular entry expires and many requests rebuild it at the same moment. The walkthrough shows the effect. Four protections, often used together:

| Protection                       | How                                                                                                                | Cost                                     |
| -------------------------------- | ------------------------------------------------------------------------------------------------------------------ | ---------------------------------------- |
| One rebuild (request coalescing) | The first miss takes a short lock and rebuilds. The others wait for its result                                     | Waiting requests are slower for a moment |
| Serve old while it rebuilds      | The entry has a soft limit and a hard limit. After the soft one, serve the old value and rebuild in the background | Users see data that is a little older    |
| Early refresh                    | Each read has a small chance to rebuild before the entry expires. The chance grows as the limit comes nearer       | Some extra rebuilds                      |
| Random time limits (jitter)      | Add a random part, for example 5 minutes plus 0 to 60 seconds                                                      | Less exact ages                          |

Jitter matters when many entries are filled at the same time, for example after a deploy or a cache restart. Without it, they all expire in the same second.

The lock for one rebuild must have its own time limit. If the request that holds it crashes, the others must not wait forever.

## Negative caching

A request for something that does not exist also costs a database read. "Tutor 99999 not found" is a valid answer, and it can be cached too. This is negative caching.

It matters for two reasons. A bug or a bot can ask for the same missing key many times each second. And an attacker can ask for random keys that are never in the cache, so every request goes to the database.

Rules:

- Give a "not found" entry a shorter time limit than a normal entry, for example 30 seconds. The record can be created soon.
- Remove the negative entry when the record is created.
- Against random keys, a cache does not help, because each key is new. Use a [rate limit](/glossary#rate-limit), or a Bloom filter. A Bloom filter is a small structure that can say "this key is surely not in the database" without a read.

## Cache keys and versioning

A cache key must contain every input that changes the answer. A product page in two languages needs the language in the key. A price that depends on the customer's region needs the region. A missing input is a bug that shows the wrong data to the wrong user. The worst form shows one user's private data to another.

A good key has a clear structure: `product:42:en:v3`. The parts are the kind of object, its ID, the inputs, and a version.

The version helps in two ways:

- **A change of format.** A new release stores the product with a new field. Old entries have the old shape. Put a format version in the key. The new code reads only new entries, and the old entries expire.
- **Removal of many entries at once.** Keep a version number for a group, for example "catalog version 17". Each key contains it. To make all catalog entries old, increase the number to 18. The old keys are never read again, and they leave by the size limit.

Do not put values in a key that change on each request, such as a timestamp. The hit rate falls to zero.

## CDN caching

A CDN (content delivery network) is a set of cache servers in many cities. A user gets the file from a nearby server, not from your origin server. For images, video, scripts, and public pages, a CDN takes most of the load.

The origin controls the CDN mostly with HTTP headers:

| Header                    | What it does                                                                             |
| ------------------------- | ---------------------------------------------------------------------------------------- |
| `Cache-Control: max-age`  | How long a browser or CDN can keep the response                                          |
| `Cache-Control: s-maxage` | The same, for shared caches such as a CDN only                                           |
| `Cache-Control: private`  | Only the user's browser can keep it. A CDN must not                                      |
| `Cache-Control: no-store` | Nobody keeps it                                                                          |
| `ETag`                    | A version tag. The client asks "changed since this tag?" and gets a short "not modified" |
| `Vary`                    | Which request headers change the answer, for example `Accept-Encoding`                   |

Practical rules:

- **Give static files a name with a version,** such as `app.4f2c.js`, and a very long time limit. A new release uses a new name, so no removal is needed.
- **Purge for the rest.** CDNs can remove an object on request. Some can remove all objects with a tag. A purge takes seconds to reach all cities, so do not depend on it for data that must be fresh.
- **Mark private responses `private`.** A CDN that keeps a page with one user's name shows it to the next user.
- **Use an origin shield.** One CDN layer sits between the cities and the origin. A miss in many cities becomes one request to the origin.

For video, the CDN holds each short segment of each quality. See the [Video Streaming kata](/kata/video-streaming).

## Hot keys

A hot key is one entry that gets a very large share of the reads. A celebrity's profile, the final of a sports event, or the front page of a shop at the start of a sale. A shared cache is split over several servers by key, so one key lives on one server. That server can reach its limit while the others are idle.

Ways to handle a hot key:

1. **A local cache in each application copy** for the few hottest keys, with a time limit of a few seconds. The shared cache sees one read for each copy, not one for each user.
2. **Several copies of the key.** Store it as `event:7:copy0` to `event:7:copy9`. Each read picks one at random. A change must update all ten.
3. **Find hot keys early.** Count reads by key, and alert when one key passes a share of the traffic.

The same problem exists in the database. See [Replication and partitioning](/learn/scaling-data#partitioning).

## How a cache fails

| Failure                         | What occurs                                               | Protection                                                                        |
| ------------------------------- | --------------------------------------------------------- | --------------------------------------------------------------------------------- |
| The cache server is down        | All reads go to the database at once                      | The database must survive the full load for a short time, or requests are limited |
| A popular entry expires         | Thousands of requests rebuild it at the same moment       | Only one request rebuilds, the others wait or get the old value                   |
| The cache hides a slow database | Nobody sees the problem until the cache fails             | Measure the database without the cache                                            |
| The data is wrong and stays     | Users see old data for the full time limit                | A way to remove an entry by hand                                                  |
| A cold cache after a restart    | The hit rate is zero, and the database gets the full load | Warm the cache before it takes traffic, or let traffic in slowly                  |
| One key is very hot             | One cache server is overloaded                            | A local cache, or several copies of the key                                       |
| A key misses an input           | One user sees another user's data                         | Review the key for each input. Never cache private data in a shared layer         |

A cache must never be the only place where data lives.

The cold cache is a common cause of a second outage. The system recovers from a fault and restarts. The caches are empty. The database gets the full load and fails again. The Google SRE book discusses this effect, in the part on cascading failures. Plan the restart, not only the failure.

## Interview questions

**"Where would you add a cache in this design, and what goes in it?"**

- Find the reads that are frequent and change rarely.
- Name the layer: CDN, local, or shared. Say what it holds and how old it can be.
- Say what is not cached, such as the price at checkout.

**"How do you keep the cache consistent with the database?"**

- A time limit as a safety net, and removal on change where it matters.
- Remove, do not update, to avoid the order problem with two writers.
- Name the remaining race, and the data that must read the database directly.

**"What is a cache stampede, and how do you prevent it?"**

- Many misses rebuild one popular entry at the same moment.
- One rebuild with a lock, serve old while it rebuilds, early refresh, and jitter.

**"The cache cluster goes down. What happens?"**

- The database gets the full read load.
- It must survive it for a short time, or the application sheds load.
- After recovery, warm the cache, so a cold cache does not cause a second outage.

## In a kata

Write on the box what the cache holds and how old it can be: "Cache (popular links, 5 minutes)". Then say what occurs when it is empty. See [Scalability and performance](/learn/scalability).

In the [Link Shortener kata](/kata/link-shortener), the redirect is a classic cache-aside case: many reads, almost no changes. Add negative caching for short codes that do not exist. In the [News Feed kata](/kata/news-feed), the ready feed is a cache prepared in the background, and a celebrity post is a hot key.

## Go deeper

- **System Design Interview** (Alex Xu), the part on scaling from one user to millions: where the cache tier and the CDN fit, and what to consider for each.
- **Designing Data-Intensive Applications** (Martin Kleppmann), the parts on derived data: a cache as one form of derived data, kept in step with the main store.
- **Site Reliability Engineering** (Beyer and others), the part on cascading failures: why a cache can hide a capacity problem, and the danger of a cold cache.
- **Release It!** (Michael Nygard), the parts on stability and capacity: why each cache needs a memory limit, and why you must watch its hit rate.

## Further reading

- [Cache](<https://en.wikipedia.org/wiki/Cache_(computing)>) and [Cache stampede](https://en.wikipedia.org/wiki/Cache_stampede) on Wikipedia
- [Bloom filter](https://en.wikipedia.org/wiki/Bloom_filter) and [Content delivery network](https://en.wikipedia.org/wiki/Content_delivery_network) on Wikipedia
- [HTTP caching](https://developer.mozilla.org/en-US/docs/Web/HTTP/Caching), on MDN
- [Addressing cascading failures](https://sre.google/sre-book/addressing-cascading-failures/), in the Google SRE book
