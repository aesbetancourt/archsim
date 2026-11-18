## The question

"Design a web crawler. It starts from a list of URLs, downloads the pages, finds the links in them, and continues. A search engine uses the pages to build its index."

A crawler looks simple: download, extract links, repeat. The hard part is the scale and the manners. The crawler must not hit one site too hard, must not download the same page twice, must not get lost in sites that make pages with no end, and must come back to pages that change. Alex Xu describes the parts of a crawler in System Design Interview, the chapter on a web crawler. The design of the URL frontier comes from the Mercator crawler, a research system from the late 1990s. This page uses its own numbers.

## Questions to ask first

Functional questions:

- **What is the purpose?** A search index, a web archive, a price monitor, and a copyright scanner need different crawlers. Assume a search index.
- **Which content?** HTML only, or also PDF files and images? Assume HTML only, with room to add types.
- **New pages, changed pages, or both?** A search index needs both. Ask how fresh the index must be.
- **Pages that need JavaScript?** Many modern pages make their content in the browser. A crawler that runs JavaScript costs far more for each page.
- **Duplicates?** Must the crawler skip pages whose content it already has?

Non-functional questions:

- **Scale.** How many pages each month, and how long must the crawler keep them?
- **Politeness.** The crawler must not overload any site. It must obey `robots.txt`.
- **Robustness.** The web is full of broken HTML, slow servers, huge files, and traps. One bad page must not stop a worker.
- **Extensibility.** A new content type must be a new module, not a new crawler.

The questions that change the design most are the purpose and the freshness target. A one-time archive crawl and a search index that must see news within minutes are two different systems.

## Estimates

Assume these answers: 3 billion pages each month, an average page of 100 KB, pages kept for one year.

| Quantity           | Arithmetic                              | Result                                  |
| ------------------ | --------------------------------------- | --------------------------------------- |
| Pages each second  | 3 billion ÷ 30 days ÷ 100,000 s         | About 1,000 each second                 |
| Peak               | 1,000 × 2, a rough factor               | About 2,000 each second                 |
| Bandwidth          | 1,000 × 100 KB                          | About 100 MB each second, or 0.8 Gbit/s |
| Storage, one month | 3 billion × 100 KB                      | About 300 TB                            |
| Storage, one year  | 300 TB × 12                             | About 3.6 PB, before compression        |
| URL-seen set       | 10 billion URLs × 8 bytes for each hash | About 80 GB as exact hashes             |

What the numbers say:

- 1,000 pages each second is many machines, not one. Most time goes to waiting on the network, so each machine runs many downloads at the same time.
- Petabytes of pages go to blob storage, compressed, not to a database.
- An exact set of all seen URLs is large. A probabilistic set is much smaller, at the cost of a few mistakes.
- A download is often 100 ms to several seconds. To reach 1,000 each second, the system must have thousands of downloads open at the same time.

## The first design

```diagram
{
  "nodes": [
    { "id": "seeds", "label": "Seed URLs", "shape": "store", "col": 0, "row": 0 },
    { "id": "frontier", "label": "URL frontier\n(priority, per-host queues)", "shape": "pipe", "col": 1, "row": 0 },
    { "id": "dl", "label": "HTML downloader", "shape": "box", "col": 2, "row": 0 },
    { "id": "dns", "label": "DNS resolver\n(cache)", "shape": "external", "col": 3, "row": 0 },
    { "id": "parse", "label": "Content parser", "shape": "box", "col": 2, "row": 1.2 },
    { "id": "seen", "label": "Content seen?\n(fingerprints)", "shape": "store", "col": 3, "row": 1.2 },
    { "id": "pages", "label": "Page storage\n(blobs)", "shape": "store", "col": 3, "row": 2.4 },
    { "id": "links", "label": "Link extractor\nand URL filter", "shape": "box", "col": 2, "row": 2.4 },
    { "id": "urlseen", "label": "URL seen?\n(Bloom filter)", "shape": "store", "col": 1, "row": 2.4 }
  ],
  "edges": [
    { "from": "seeds", "to": "frontier" },
    { "from": "frontier", "to": "dl", "label": "next URL" },
    { "from": "dl", "to": "dns", "label": "host to IP" },
    { "from": "dl", "to": "parse", "label": "HTML" },
    { "from": "parse", "to": "seen", "label": "check" },
    { "from": "seen", "to": "pages", "label": "new content" },
    { "from": "parse", "to": "links", "label": "new page" },
    { "from": "links", "to": "urlseen", "label": "check" },
    { "from": "urlseen", "to": "frontier", "label": "new URLs" }
  ]
}
```

- **Seed URLs.** The start points. Good seeds reach much of the web in few steps: large portals, popular sites in each country, and each topic.
- **URL frontier.** The list of URLs to download. It decides which URL comes next. It holds the rules for priority and politeness. It is the most important part of the design.
- **HTML downloader.** Many workers that fetch pages over HTTP. They read `robots.txt` first, set timeouts, and limit the size of each page.
- **DNS resolver.** It turns a host name into an IP address. A DNS lookup can take tens of milliseconds, so the crawler keeps its own cache.
- **Content parser.** It reads the HTML, rejects broken or empty pages, and extracts the text. Parse in separate workers, so a slow parse does not hold a download slot.
- **Content seen.** It finds pages whose content the crawler already has, under another URL.
- **Link extractor and URL filter.** It finds the links, makes each one absolute and normal, and drops the ones the crawler must not follow.
- **URL seen.** It drops URLs that are already in the frontier or already downloaded.
- **Page storage.** Compressed pages in blob storage, with an index from URL to the stored copy.

## Deep dives

### The URL frontier: politeness and priority

The order of the crawl is a graph search. The web is a graph: pages are nodes and links are edges.

**DFS or BFS.** A depth-first search follows one path to its end. On the web, a path can be very deep, so DFS gets stuck in one site. A breadth-first search with a FIFO queue is the usual base. Plain BFS has two problems:

- **It is not polite.** Most links on a page point to the same host. A FIFO queue then sends hundreds of requests to one site in a short time. The site owner sees an attack and blocks the crawler.
- **It has no priority.** A FIFO queue treats the home page of a large news site and a forgotten guest book as equal.

The Mercator design answers both with two layers of queues.

1. **Front queues give priority.** A prioritizer scores each URL, for example by the importance of the page (PageRank or a similar score), the traffic of the site, and how often the page changes. It puts the URL in one of _n_ front queues, one for each priority level. A selector takes URLs from the high-priority queues more often.
2. **Back queues give politeness.** Each back queue holds URLs of one host only. A table maps each host to its queue. A worker takes URLs from one back queue, one at a time, with a delay between two downloads from the same host.
3. **A heap of ready times.** For each back queue, keep the earliest time that the host can take the next request. A worker takes the queue whose time has passed. After the download, set the next time to now plus a delay. A common rule makes the delay a multiple of the time of the last download, so a slow site gets fewer requests.

The frontier is too large for memory. Keep most of it on disk, with buffers in memory at each end of the queues for reads and writes.

### Seen URLs and seen content

Two different checks prevent repeat work.

**URL seen.** Before a URL enters the frontier, check if the crawler already knows it. First, normalize the URL: lower-case the host, remove the default port, remove the `#fragment`, sort the query parameters, and remove known tracking parameters. Then check a set of all known URLs.

A [Bloom filter](https://en.wikipedia.org/wiki/Bloom_filter) is the usual tool. It is a bit array with several hash functions. It answers "certainly not seen" or "probably seen".

| Error type     | What the crawler does   | Effect                                     |
| -------------- | ----------------------- | ------------------------------------------ |
| False negative | Not possible            | The crawler never repeats a URL by mistake |
| False positive | Skips a URL that is new | A small share of new pages is missed       |

With about 10 bits for each URL, the false-positive rate is near 1% (rough, it depends on the number of hash functions). For 10 billion URLs, that is about 12 GB of memory, against about 80 GB for exact hashes. For a search index, missing 1% of new URLs is often acceptable. For a legal archive it is not. Say which case you have.

**Content seen.** Different URLs often show the same page: mirrors, print versions, and the same page with other parameters. Compute a fingerprint of the page content, such as a 64-bit hash of the normalized text, and look it up. If the fingerprint exists, skip the store and do not extract links again.

An exact hash finds only exact copies. Two pages that differ only in a date or an advertisement get different hashes. Near-duplicate detection uses a similarity hash, such as SimHash: pages with similar text get fingerprints that differ in few bits. It is more complex, and it is a good point to mention, not to design in full.

### The downloader: robots.txt, DNS, and robustness

**robots.txt.** Each site can publish a file at `/robots.txt` that says which paths a crawler must not fetch. The format is now an IETF standard (RFC 9309). The crawler must fetch the file before it fetches any page of the host, and obey it. Cache the file for each host, for example for one day, so the crawler does not fetch it before each page. Some sites also ask for a crawl delay in the file. Not all crawlers support that field, but a polite crawler respects it.

**DNS.** DNS lookups are often slow and many DNS clients block the thread. At 1,000 pages each second, the public resolvers become a bottleneck. Run a local resolver with a cache, and refresh popular hosts in the background.

**Robustness.** Each part of the web is hostile to a naive client:

- Set a connect timeout and a read timeout. A server that sends one byte each minute must not hold a worker.
- Limit the size of a page. Stop the download above the limit.
- Treat broken HTML as normal. The parser must accept it and continue.
- Save the frontier state often. A crash must not lose a month of crawl.
- Run downloads close to the sites. A crawler in each large region cuts the delay of each download.

### Spider traps

A spider trap is a site that makes an infinite number of URLs. Some are deliberate. Most are accidents.

| Trap                     | Example                                        | Defense                                          |
| ------------------------ | ---------------------------------------------- | ------------------------------------------------ |
| Calendar with no end     | A "next month" link on each month, forever     | A limit on the pages for each host in each crawl |
| Session ID in the URL    | `?sid=8f3a...` on each link, new on each visit | Remove known session parameters at normalization |
| Paths that repeat        | `/a/b/a/b/a/b/...` from relative links         | Reject URLs with repeated path segments          |
| Very long URLs           | Thousands of characters                        | A maximum URL length                             |
| Pages made from a search | Each filter combination is a new URL           | A maximum link depth from the seed               |

No rule finds all traps. The page budget for each host is the safety net: a host can never use more than its share of the crawl. Add a way for an operator to block a host by hand.

### Freshness and recrawl

The web changes. A search index with old pages gives wrong results. The crawler must come back.

- **Adaptive intervals.** Track how often each page changed in the past. Fetch a news home page every few minutes, and an old blog post every few weeks or months.
- **Importance.** An important page that is a little old costs more than an obscure page that is very old. Combine change rate and importance into the priority score in the front queues.
- **Conditional requests.** Send `If-Modified-Since` or `If-None-Match` with the time or ETag of the last copy. A server that supports them answers `304 Not Modified` with no body. This saves bandwidth for both sides.
- **Sitemaps.** Many sites publish a sitemap file with each URL and its last change time. Read it to find new and changed pages.

### Distributed crawling

At this scale, the crawl runs on many servers. Partition the work by host. A hash of the host name chooses the server that owns it, with [consistent hashing](/learn/consistent-hashing) so a new server moves few hosts.

- **Politeness stays local.** One server owns all URLs of a host, so it alone controls the request rate to that host.
- **Links cross servers.** A link extractor sends each URL to the server that owns its host. Send them in batches, not one by one.
- **The URL-seen set is partitioned the same way.** Each server keeps the set for its hosts.
- **Hot hosts.** A very large host, such as a big encyclopedia, can be too much work for one server, even at a polite rate. It is rare. Give it a server of its own.

The downloaded pages feed batch jobs: index building, link analysis, and duplicate removal across the full set. See [Batch and stream processing](/learn/batch-and-stream).

### Storage

| Data            | Size (rough)        | Store                                                                           |
| --------------- | ------------------- | ------------------------------------------------------------------------------- |
| Page content    | Petabytes           | Compressed blobs in object storage, grouped into large files                    |
| URL metadata    | Billions of records | A partitioned key-value store: last fetch, status, fingerprint, next fetch time |
| Frontier        | Billions of URLs    | Disk-based queues with memory buffers                                           |
| URL-seen set    | Gigabytes           | Bloom filter in memory, saved to disk                                           |
| robots.txt, DNS | Millions of hosts   | Cache in memory with a time limit                                               |

Group many small pages into large files, as archive formats do. Object stores and batch jobs work best with a smaller number of large files.

## Trade-offs and alternatives

| Decision         | Choice here                           | When the choice changes                                              |
| ---------------- | ------------------------------------- | -------------------------------------------------------------------- |
| Crawl order      | BFS with priority and per-host queues | A focused crawl of one topic needs a stronger relevance score        |
| URL seen         | Bloom filter                          | An exact set when no page can be missed, at about 7 times the memory |
| Content seen     | Exact hash, near-duplicates later     | SimHash from the start when duplicates are a large share             |
| Partitioning     | By host                               | By URL hash gives a better spread, but breaks local politeness       |
| JavaScript pages | Plain HTTP fetch                      | A separate pool of headless browsers for sites that need it          |
| Recrawl          | Adaptive intervals                    | A fixed full recrawl for an archive with a fixed schedule            |

A crawler with JavaScript rendering is a much more expensive system. Each page needs a browser engine, which takes far more CPU and memory than an HTTP fetch. Most designs send only the hosts that need it to a separate rendering queue.

## What interviewers probe

1. **"How do you keep from overloading one site?"**
   - One queue for each host, one download at a time from each queue, and a delay between two downloads.
   - Make the delay grow with the response time of the host.
   - Obey `robots.txt` and cache it.
2. **"How do you avoid downloading the same thing twice?"**
   - Normalize URLs, then a URL-seen check with a Bloom filter. Explain the false-positive trade-off.
   - A content fingerprint for the same page at another URL.
3. **"Your crawler is stuck in one site. Why, and what do you do?"**
   - A spider trap. Limit pages for each host, the URL length, and the depth.
   - Remove session parameters and reject repeated path segments.
4. **"How do you keep the index fresh?"**
   - Recrawl by change rate and importance. Use conditional requests and sitemaps.
5. **"How does this run on 100 servers?"**
   - Partition by host with consistent hashing, so politeness stays on one server. Forward links in batches.

## Go deeper

- **System Design Interview** (Alex Xu), the chapter on a web crawler: the parts of the design, the frontier, and the traps.
- **Designing Data-Intensive Applications** (Martin Kleppmann), the part on batch processing: how a crawl output becomes an index with large batch jobs.
- **Designing Data-Intensive Applications**, the part on partitioning: how to spread keys over servers, and the problem of skew and hot keys.

## Further reading

- [Web crawler](https://en.wikipedia.org/wiki/Web_crawler) on Wikipedia, with the politeness and recrawl policies
- [robots.txt](https://en.wikipedia.org/wiki/Robots.txt) and [Spider trap](https://en.wikipedia.org/wiki/Spider_trap) on Wikipedia
- [Bloom filter](https://en.wikipedia.org/wiki/Bloom_filter) and [SimHash](https://en.wikipedia.org/wiki/SimHash) on Wikipedia
- [Introduction to Information Retrieval](https://nlp.stanford.edu/IR-book/), the free book by Manning, Raghavan, and Schütze, with a chapter on web crawling
