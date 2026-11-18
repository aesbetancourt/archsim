## The question

"You have one server, and the product starts to grow. Take it from a few thousand users to millions. Tell me what you change, and in what order."

This question tests whether you know the standard parts of a web system and why each one exists. A weak answer lists boxes. A strong answer names the problem that each box solves, the price of the box, and the signal that tells you it is time to add it.

The order on this page is the usual one. It follows Alex Xu's chapter on scaling from zero to millions of users (System Design Interview), with depth from DDIA. Real systems do not always follow it. Use it as a default, and change it when the numbers say so. For the general vocabulary, see [Scalability and performance](/learn/scalability).

### The rules of the game

- Add a part only when a measured problem asks for it. Each part adds cost, failure modes, and work for the team.
- For each step, say three things: the problem, the fix, and the new problem that the fix brings.
- Keep numbers rough. The point is the order of magnitude, not the exact value. See [Estimation](/learn/estimation).

## The steps

The example is a tutor marketplace. Students search for tutors, read profiles, and book lessons. The numbers are rough and are only for this example.

### 1. One server

**The design.** One machine runs the web application and the database. The users find it through DNS (the Domain Name System, which turns a name into an IP address).

**What it solves.** It is the fastest way to start. There is one thing to deploy, one thing to back up, and one place to look when something breaks.

**What it costs.** The web code and the database fight for the same CPU, memory, and disk. If the machine stops, the product stops. You can make the machine bigger (vertical scaling), but there is a top size, and the price grows faster than the capacity.

**The signal to move on.** The database and the web code slow each other down, or one outage is too expensive.

### 2. A separate database

**The design.** Move the database to its own machine. The web server talks to it over the network.

**What it solves.** Each tier now scales on its own. The database gets fast disks and much memory. The web server gets CPU. A heavy query no longer takes the CPU that serves pages.

**What it costs.** Each query now crosses the network, and adds roughly half a millisecond inside one data center. You now have two single points of failure, not one.

**The choice of store.** Most products start with a relational database. Pick another store only for a clear reason, such as very low latency, no relations, or a huge volume of simple data. See [Data stores](/learn/data-stores).

### 3. A load balancer and many web servers

**The design.** Put a load balancer in front of two or more web servers. The users connect to the load balancer's public address. The web servers have private addresses only.

**What it solves.** When one web server stops, the load balancer sends traffic to the others. To get more capacity, you add a server (horizontal scaling). You can deploy one server at a time, with no outage.

**What it costs.** The load balancer is a new part. A managed load balancer, or a pair of them, keeps it from being a single point of failure. The web servers must now behave the same way for each request, which leads to step 6.

### 4. Database replication

**The design.** Keep one primary database that takes all writes. Add replicas (copies) that receive the changes from the primary and serve reads. DDIA calls this leader-based replication.

**What it solves.** Most web products read much more than they write. A ratio of 10 reads to 1 write is common. Replicas take the read load. When the primary fails, you promote a replica, so the data survives the loss of a machine.

**What it costs.** Replication is usually asynchronous, so a replica can be behind the primary. A student books a lesson, reloads the page, and does not see the booking. This is a "read your own writes" problem. A common fix is to read from the primary for a short time after a user writes. Failover also has risks: a replica that was behind can lose the last writes when you promote it. See [Consistency](/learn/consistency) and [Scaling data](/learn/scaling-data#replication).

### 5. A cache and a CDN

**The design.** Put a cache (an in-memory key-value store, such as Redis or Memcached) between the web tier and the database. Put a CDN (content delivery network) in front of the static files: images, scripts, style sheets, and videos.

**What it solves.** The cache answers popular reads in about a millisecond, and the database does not see them. The CDN serves files from a location near each user, so a user far from your data center gets the files fast, and your servers do not send them at all.

**What it costs.**

- A cache holds copies, so the data can be old. You must decide how old it can be, and how an entry goes out: a time limit, removal on change, or both.
- When the cache stops, all reads go to the database at once. The database must survive this for a short time.
- A CDN costs money for each gigabyte. A file change must reach the CDN, so put a version in the file name, for example `app.v42.js`.

See [Caching](/learn/caching) for the details and the failure modes.

### 6. A stateless web tier and a shared session store

**The design.** Move the session data (who is logged in, what is in the cart) out of the web servers' memory, into a shared store. The cache cluster, or a separate key-value store, can hold it. Each web server now keeps no state between requests.

**What it solves.** Before this step, a user had to go back to the same server each time ("sticky sessions"). If that server stopped, the user lost the session. Now any server can answer any request. You can add or remove servers at any time, also automatically when the load changes (autoscaling).

**What it costs.** Each request reads the session from the network. The session store must be fast and replicated, because all logins depend on it. An alternative is a signed token that the client holds, such as a JWT. It needs no store, but you cannot easily cancel a token before it expires.

### 7. Many data centers with geo routing

**The design.** Run a full copy of the stack in a second region. A DNS service with geo routing sends each user to the nearest healthy region. Data replicates between the regions.

**What it solves.** Users far from the first region get lower latency. When a region fails, DNS sends all users to the other region.

**What it costs.** This step is much harder than the others.

- **Data.** Each region needs the data. Replication between regions is slow (tens to hundreds of milliseconds), so it is almost always asynchronous. You must decide which region owns a write, or how to merge two writes to the same record. See [Consistency](/learn/consistency#the-cap-theorem).
- **Capacity.** Each region must be able to take the full load when the other fails. So you pay for spare capacity.
- **Tests and deployment.** You must deploy to all regions and test the failover. A failover that nobody tested usually fails when you need it.

### 8. A message queue

**The design.** For slow work, the web server puts a message in a queue and answers the user at once. Separate workers take the messages and do the work: send emails, resize photos, make invoices.

**What it solves.** The user does not wait for slow work. A burst of work waits in the queue and does not overload the workers. You scale the web tier and the workers apart. When a worker stops, the messages wait for the next one.

**What it costs.** The result is no longer immediate, so the product must show "processing". A message can arrive twice, so the workers must be safe to repeat (idempotent). The queue is one more system to run and to watch. See [Messaging](/learn/messaging).

### 9. Logs, metrics, and automation

**The design.** Send logs from all servers to one central place. Collect metrics at three levels: the host (CPU, memory, disk), the tiers (database load, cache hit rate), and the business (bookings each hour, sign-ups). Add alerts and automatic deployment.

**What it solves.** With one server, you can read its log file. With fifty servers in two regions, you cannot. Without metrics, you find problems when users complain. With them, you see the cache hit rate fall before the database fails.

**What it costs.** Storage for logs grows fast, so set a retention time. Alerts that fire too often teach people to ignore them. See [Observability](/learn/observability).

This step is not really the ninth. In a real team, basic metrics come at step 3 at the latest. Interviewers like it when you say so.

### 10. Sharding the database

**The design.** When the primary cannot take the writes, or the data does not fit on one machine, split the data into shards. Each shard holds a part of the rows and has its own primary and replicas. A shard key decides where a row goes, for example the tutor ID.

**What it solves.** Write capacity and storage grow with the number of shards.

**What it costs.** Sharding is the most expensive step on this page. Do it last.

- **The shard key.** A bad key makes hot shards. If one famous tutor gets half the traffic, that tutor's shard is overloaded (the "celebrity" problem).
- **Joins and transactions.** A query that needs rows from many shards is slow and complex. A transaction across shards needs extra protocols. See [Distributed transactions](/learn/distributed-transactions).
- **Resharding.** When a shard is full, you must move data. Consistent hashing moves fewer keys. See [Consistent hashing](/learn/consistent-hashing).

Many teams move some data to a NoSQL store at this point, because those stores shard automatically. That only moves the trade-offs. It does not remove them. See [Scaling data](/learn/scaling-data#partitioning).

### The ladder in one table

| Step               | Main problem it solves          | Main new problem                        |
| ------------------ | ------------------------------- | --------------------------------------- |
| Separate database  | Web and data fight for capacity | Network calls, two failure points       |
| Load balancer      | One web server is a limit       | The web tier must be the same each time |
| Replication        | Read load, loss of the database | Replica lag, failover risk              |
| Cache and CDN      | Repeated reads, far users       | Old data, cache-down load               |
| Stateless web tier | Sticky sessions, slow scaling   | Session store is critical               |
| Many data centers  | Far users, region outage        | Data between regions, spare capacity    |
| Message queue      | Slow work in the request        | Delayed results, duplicates             |
| Logs and metrics   | No view of many servers         | Storage cost, alert noise               |
| Sharding           | Write and storage limit         | Hot keys, joins, resharding             |

## A walkthrough

Follow the tutor marketplace from one machine to many regions on one diagram. Use the buttons or the arrow keys.

```walkthrough
{
  "title": "A tutor marketplace grows",
  "metrics": [
    { "id": "users", "label": "Daily users", "better": "higher" },
    { "id": "time", "label": "Page time", "unit": "ms", "better": "lower" },
    { "id": "spof", "label": "Single points of failure", "better": "lower" }
  ],
  "diagram": {
    "nodes": [
      { "id": "cdn", "label": "CDN\n(images, scripts)", "shape": "external", "col": 0, "row": 0 },
      { "id": "users", "label": "Users", "shape": "actor", "col": 0, "row": 1.5 },
      { "id": "dc2", "label": "Data center 2\n(full copy)", "shape": "box", "col": 0, "row": 3 },
      { "id": "logs", "label": "Logs and\nmetrics", "shape": "store", "col": 1, "row": 0 },
      { "id": "lb", "label": "Load balancer", "shape": "box", "col": 1, "row": 1.5 },
      { "id": "cache", "label": "Cache and\nsession store", "shape": "store", "col": 2, "row": 0 },
      { "id": "web", "label": "Web servers", "shape": "box", "col": 2, "row": 1.5 },
      { "id": "queue", "label": "Queue and\nworkers", "shape": "pipe", "col": 2, "row": 3 },
      { "id": "db", "label": "Database\nprimary", "shape": "store", "col": 3, "row": 1 },
      { "id": "replicas", "label": "Read\nreplicas", "shape": "store", "col": 3, "row": 2.2 }
    ],
    "groups": [
      { "id": "dc1", "label": "Data center 1", "col": 1, "row": 0, "cols": 3, "rows": 4 }
    ],
    "edges": [
      { "from": "users", "to": "web", "label": "HTTPS" },
      { "from": "users", "to": "lb", "label": "HTTPS" },
      { "from": "users", "to": "cdn", "label": "static files" },
      { "from": "users", "to": "dc2", "label": "geo DNS" },
      { "from": "lb", "to": "web" },
      { "from": "web", "to": "db", "label": "writes" },
      { "from": "web", "to": "replicas", "label": "reads" },
      { "from": "db", "to": "replicas", "label": "replicate", "async": true },
      { "from": "web", "to": "cache", "label": "look up" },
      { "from": "web", "to": "queue", "label": "slow jobs", "async": true },
      { "from": "web", "to": "logs", "label": "events", "async": true }
    ]
  },
  "steps": [
    {
      "kind": "problem",
      "title": "One machine does everything",
      "text": "The marketplace starts on one server. It runs the web code and the database. 2,000 people use it each day, and pages load in about 120 ms.\n\nThis is the correct start. But the web code and the database share the same CPU and disk. When the machine stops, the product stops.",
      "key": "Start simple. Add a part only when a measured problem asks for it.",
      "show": ["users", "web"],
      "flow": ["users>web"],
      "focus": ["web"],
      "notes": { "web": "web code + database" },
      "metrics": { "users": 2000, "time": 120, "spof": 1 }
    },
    {
      "kind": "technique",
      "title": "Give the database its own machine",
      "text": "Search queries now slow down the pages. Move the database to a separate machine with fast disks and much memory.\n\nEach tier now scales on its own. The price: each query crosses the network, and there are now two machines that can stop the product.",
      "key": "Separate tiers that need different resources.",
      "show": ["users", "web", "db"],
      "flow": ["users>web", "web>db"],
      "focus": ["db"],
      "notes": { "web": "1 server" },
      "metrics": { "users": 20000, "time": 150, "spof": 2 }
    },
    {
      "kind": "technique",
      "title": "Many web servers behind a load balancer",
      "text": "One web server is at its limit at peak hours. Put a load balancer in front, and run three web servers.\n\nWhen one server stops, the load balancer sends its traffic to the other two. You can deploy one server at a time with no outage. The load balancer is a managed pair, so it is not a new single point of failure.",
      "key": "Horizontal scaling: add servers, not a bigger server.",
      "show": ["users", "lb", "web", "db"],
      "hide": ["users>web"],
      "flow": ["users>lb", "lb>web", "web>db"],
      "focus": ["lb"],
      "notes": { "web": "3 servers" },
      "metrics": { "users": 100000, "spof": 1 }
    },
    {
      "kind": "technique",
      "title": "Replicas take the reads",
      "text": "The database is now the limit, and it is the last single point of failure. Students read profiles about 20 times for each booking.\n\nAdd two read replicas. The primary takes the writes and sends the changes to the replicas. If the primary fails, you promote a replica.\n\nThe price: a replica can be a little behind. Read from the primary just after a user writes, so a student sees the booking at once.",
      "key": "Replicas scale reads and protect the data. They do not scale writes.",
      "show": ["users", "lb", "web", "db", "replicas"],
      "hide": ["users>web"],
      "flow": ["users>lb", "lb>web", "web>replicas", "db>replicas"],
      "focus": ["replicas"],
      "notes": { "db": "writes only", "replicas": "2 copies, lag < 1 s" },
      "metrics": { "time": 110, "spof": 0 }
    },
    {
      "kind": "technique",
      "title": "A cache for data, a CDN for files",
      "text": "Most reads ask for the same popular tutor profiles. Put a cache in front of the database with a time limit of 5 minutes. About 85% of the profile reads now come from memory.\n\nPhotos and scripts are most of the bytes. Move them to a CDN, so users get them from a location near them, and the web servers do not send them.",
      "key": "Cache the data that is read many times between changes. Write on the box what it holds and how old it can be.",
      "show": ["users", "cdn", "lb", "web", "cache", "db", "replicas"],
      "hide": ["users>web"],
      "flow": ["users>cdn", "users>lb", "lb>web", "web>cache"],
      "focus": ["cache", "cdn"],
      "notes": { "cache": "hit rate 85%", "cdn": "90% of bytes" },
      "metrics": { "users": 1000000, "time": 60 }
    },
    {
      "kind": "technique",
      "title": "Make the web tier stateless",
      "text": "Each web server keeps the logins in its own memory. So the load balancer must send each user to the same server, and a server that stops logs out its users.\n\nMove the sessions to the shared store. Now any server can answer any request. The team turns on autoscaling: 3 servers at night, 12 at the evening peak.",
      "key": "A stateless server can be added or removed at any time. The state goes to a shared store.",
      "show": ["users", "cdn", "lb", "web", "cache", "db", "replicas"],
      "hide": ["users>web"],
      "flow": ["users>lb", "lb>web", "web>cache"],
      "focus": ["web", "cache"],
      "notes": { "web": "3 to 12, no state", "cache": "now holds sessions" },
      "changes": ["Sessions moved from the web servers to the shared store"]
    },
    {
      "kind": "technique",
      "title": "A second data center",
      "text": "The marketplace opens on another continent. Users there see 300 ms of extra latency. A region outage also stops the whole product.\n\nRun a full copy of the stack in a second region. Geo DNS sends each user to the nearest healthy region. The data replicates between the regions, asynchronously, so you must decide which region owns each write.\n\nEach region must be able to take all the traffic when the other fails. Test the failover often.",
      "key": "A second region gives latency and survival. It costs spare capacity and hard data problems.",
      "show": ["users", "cdn", "dc1", "dc2", "lb", "web", "cache", "db", "replicas"],
      "hide": ["users>web"],
      "flow": ["users>lb", "users>dc2"],
      "focus": ["dc2"],
      "notes": { "dc2": "same stack, other continent" },
      "metrics": { "users": 5000000 }
    },
    {
      "kind": "technique",
      "title": "A queue for slow work, metrics for all",
      "text": "A booking sends emails and makes an invoice, which takes 2 seconds. Put these jobs in a queue. The web server answers at once, and workers do the jobs. The workers must be safe to repeat, because a message can arrive twice.\n\nThe system now has more than 40 servers. Send all logs and metrics to one place, and alert on the numbers that matter: error rate, latency, and bookings each hour.",
      "key": "A queue takes slow work out of the request. Metrics let you see a problem before users do.",
      "show": ["users", "cdn", "dc1", "dc2", "lb", "web", "cache", "db", "replicas", "queue", "logs"],
      "hide": ["users>web"],
      "flow": ["lb>web", "web>queue", "web>logs"],
      "focus": ["queue", "logs"],
      "notes": { "queue": "emails, invoices", "logs": "alerts on errors" },
      "metrics": { "time": 55 }
    },
    {
      "kind": "recap",
      "title": "Shard when writes outgrow one primary",
      "text": "At 20 million users, the primary cannot take the writes, and the data is too big for one machine. Split the data into 8 shards by tutor ID. Each shard has its own primary and replicas.\n\nThis is the last step because it costs the most. A popular tutor can make one shard hot, and a query across shards is slow. Look back: each step solved one measured problem and brought one new problem.",
      "key": "Shard last. For each part in the design, name the problem it solves and the problem it brings.",
      "show": ["users", "cdn", "dc1", "dc2", "lb", "web", "cache", "db", "replicas", "queue", "logs"],
      "hide": ["users>web"],
      "flow": ["web>db", "db>replicas"],
      "focus": ["db", "replicas"],
      "notes": { "db": "8 shards, by tutor ID", "replicas": "2 for each shard" },
      "metrics": { "users": 20000000 }
    }
  ]
}
```

## What interviewers probe

**"Why not shard from day one?"**

- Sharding makes each query, transaction, and schema change harder.
- One modern database machine handles a lot. Many products never need to shard.
- Replicas and a cache usually buy years. Shard when the write load or the data size says so.

**"Your cache server stops. What happens?"**

- All reads go to the database at the same moment. The database must survive this for a short time, or the system must refuse some requests.
- Run the cache as a cluster with replicas, so the loss of one node empties only part of it.
- Watch the database load without the cache, so you know the real margin.

**"How do you keep the web tier stateless when users log in?"**

- Put sessions in a shared, replicated store, or give the client a signed token.
- Compare the two: a store lets you end a session at once, and a token needs no lookup.
- Files that users upload go to object storage, not to the disk of a web server.

**"A user writes and then does not see the change. Why?"**

- The read went to a replica that is behind the primary.
- Fixes: read from the primary for a short time after a write, or read from a replica that has the user's last write.
- Name the guarantee: "read your own writes". DDIA explains it in the part on replication lag.

**"What changes when you add a second region?"**

- Decide active-passive (one region takes writes) or active-active (both take writes).
- Active-active needs a rule for conflicting writes, or a home region for each user.
- Plan the capacity for a full failover, and test it.

**"Where are your single points of failure now?"**

- Walk the diagram box by box: DNS, the load balancer, the primary, the session store, the queue.
- For each, say how it fails over, or say that you accept the risk and why.
- See [Resilience](/learn/resilience).

## Go deeper

- **System Design Interview, Alex Xu**, the chapter on scaling from zero to millions of users: the same ladder of steps, with a short note on each part.
- **Designing Data-Intensive Applications, Martin Kleppmann**, the parts on replication and partitioning: why replica lag occurs, the guarantees you can give, and how to choose a shard key.
- **Site Reliability Engineering, Beyer and others**, the chapters on load balancing at the front end and in the data center: how Google spreads traffic over regions and servers.
- **Release It!, Michael Nygard**, the parts on stability patterns: what to do when one of the new parts is slow or down.

## Further reading

- [Load balancing in the data center](https://sre.google/sre-book/load-balancing-datacenter/) and [Load balancing at the frontend](https://sre.google/sre-book/load-balancing-frontend/), from the SRE book
- [Content delivery network](https://en.wikipedia.org/wiki/Content_delivery_network) and [Shard (database architecture)](<https://en.wikipedia.org/wiki/Shard_(database_architecture)>) on Wikipedia
- Practice the steps in the [Link Shortener kata](/kata/link-shortener) and the [News Feed kata](/kata/news-feed)
