## What a cache is for

A cache keeps a copy of data that is expensive to get, in a place where it is cheap to get. It trades fresh data for speed and lower load. It helps when the same data is read many times between changes.

Before you add a cache, ask: is the read too slow or too frequent, and can this data be a little old? If the answer to the second question is no, a cache will cause faults.

## Where a cache can be

| Place | Holds | Example |
|---|---|---|
| Browser or app | Files and answers for one user | Images, the last feed |
| CDN | Files and public pages, near the users | Video segments, product images |
| In the application | Results that one process uses often | Settings, price rules |
| Shared cache server | Results that all copies of the application use | Sessions, popular links, ready feeds |
| In the database | Recently used data pages | Automatic |

## How data gets in

- **Read-through (cache-aside):** the application looks in the cache. If the data is not there, it reads the database and puts the result in the cache. This is the usual method.
- **Write-through:** each write updates the database and the cache together. Reads are always fast. Writes are slower.
- **Prepared in the background:** a worker builds the data before anyone asks. The News Feed worked example does this.

## How data gets out

The hard problem of caching is to know when the copy is wrong.

- **Time limit:** each entry expires after a fixed time. It is simple, and data can be old for up to that time.
- **Removal on change:** when the data changes, the application removes the entry. Data is fresher, and each place that changes the data must remember to do this.
- **Size limit:** when the cache is full, it drops the entries that were not used for the longest time.

Most designs use a time limit as a safety net and removal on change where fresh data matters.

## How a cache fails

| Failure | What occurs | Protection |
|---|---|---|
| The cache server is down | All reads go to the database at once | The database must survive the full load for a short time, or requests are limited |
| A popular entry expires | Thousands of requests rebuild it at the same moment | Only one request rebuilds, the others wait or get the old value |
| The cache hides a slow database | Nobody sees the problem until the cache fails | Measure the database without the cache |
| The data is wrong and stays | Users see old data for the full time limit | A way to remove an entry by hand |

A cache must never be the only place where data lives.

## In a kata

Write on the box what the cache holds and how old it can be: "Cache (popular links, 5 minutes)". Then say what occurs when it is empty. See [Scalability and performance](/learn/scalability).

## Further reading

- [Cache](https://en.wikipedia.org/wiki/Cache_(computing)) and [Cache stampede](https://en.wikipedia.org/wiki/Cache_stampede) on Wikipedia
