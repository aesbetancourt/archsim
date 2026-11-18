## Why estimate

A quick calculation tells you which part of a design is hard. Twelve payments each second need a careful design for correctness and no special design for load. Forty thousand redirects each second need the opposite. Without the number, you cannot know where to spend your time.

The goal is the order of magnitude: is it 10, 1,000, or 100,000? Round hard, and say your assumptions aloud. An interviewer does not check your arithmetic to the last digit. The interviewer checks that you can go from a vague prompt to a number, and from the number to a design decision.

Alex Xu calls this a back-of-the-envelope estimate (System Design Interview). The name tells you the precision: the numbers must fit on the back of an envelope. If a calculation needs a spreadsheet, it is too detailed for a design discussion.

## Numbers to remember

| Fact                       | Rounded value                     |
| -------------------------- | --------------------------------- |
| Seconds in a day           | About 100,000 (exact: 86,400)     |
| Seconds in a month         | About 2.5 million                 |
| Seconds in a year          | About 30 million                  |
| 1 million actions each day | About 12 each second              |
| 1 billion actions each day | About 12,000 each second          |
| Peak load                  | Often 2 to 10 times the average   |
| 1 kilobyte                 | A short text record               |
| 1 megabyte                 | A photo of medium quality         |
| 1 gigabyte                 | About an hour of compressed video |

The value of 100,000 seconds in a day is about 15% too high. That error is small against the other guesses in an estimate, and it makes the division easy.

### Powers of two

Storage and memory sizes grow in powers of two. Each step of 2¹⁰ is close to a step of 1,000.

| Power | Approximate value | Unit name     |
| ----- | ----------------- | ------------- |
| 2¹⁰   | 1 thousand        | Kilobyte (KB) |
| 2²⁰   | 1 million         | Megabyte (MB) |
| 2³⁰   | 1 billion         | Gigabyte (GB) |
| 2⁴⁰   | 1 trillion        | Terabyte (TB) |
| 2⁵⁰   | 1 quadrillion     | Petabyte (PB) |

Two more facts help with identifiers. A 32-bit number has about 4 billion values. A 64-bit number has about 18 quintillion values, which is enough for any count of events in a real system. See [Unique IDs](/learn/unique-ids).

### Delays, as orders of magnitude

Jeff Dean, at Google, made a list of latency numbers popular among engineers. Xu repeats it as "latency numbers every programmer should know". The exact values change with each generation of hardware. The gaps between the groups stay large, and the gaps are the lesson.

| Operation                            | Rough time              |
| ------------------------------------ | ----------------------- |
| Read from a processor cache          | About 1 nanosecond      |
| Read from main memory                | About 100 nanoseconds   |
| Random read from a fast disk (SSD)   | About 0.1 milliseconds  |
| A round trip in the same data center | About 0.5 milliseconds  |
| A simple database query              | 1 to 10 milliseconds    |
| A seek on a spinning disk            | About 10 milliseconds   |
| A round trip between continents      | 100 to 200 milliseconds |

These depend on hardware and change over time. Use them to compare options, not as exact facts.

What the table tells you:

- Memory is about 1,000 times faster than a fast disk. This is why a [cache](/learn/caching) in memory helps so much.
- A call over the network costs more than many reads from memory. Ten calls in a chain, each one waiting for the one before, add up fast.
- Light in fiber travels about 200 kilometers each millisecond. A round trip across an ocean cannot be fast, whatever the hardware. Put the data near the users when the delay matters.
- Compression costs processor time but saves network time. For large answers over slow links, compress.

### Availability and downtime

An availability target is a share of time. Turn it into minutes, because minutes are easier to feel.

| Availability        | Downtime each year | Downtime each month |
| ------------------- | ------------------ | ------------------- |
| 99% ("two 9s")      | About 3.65 days    | About 7.2 hours     |
| 99.9% ("three 9s")  | About 8.8 hours    | About 43 minutes    |
| 99.99% ("four 9s")  | About 53 minutes   | About 4.3 minutes   |
| 99.999% ("five 9s") | About 5.3 minutes  | About 26 seconds    |

Each added 9 divides the permitted downtime by ten. At four 9s, a person cannot even start to fix a fault before the month's budget is gone. Only automatic recovery can meet it. See [Observability and service levels](/learn/observability#service-levels) for how a team uses this budget.

Two rules combine the availability of parts:

- **Parts in a chain multiply.** If a request needs three parts, each at 99.9%, the result is 0.999 × 0.999 × 0.999 ≈ 99.7%. That is about 26 hours of downtime each year, three times more than one part alone.
- **Copies in parallel multiply the failures.** Two copies, each at 99%, fail together only 1% × 1% = 0.01% of the time. The result is 99.99%, if the two failures are independent. They often are not: a shared network, a shared release, or a shared bug fails both at once.

## Load parameters

Martin Kleppmann says that you cannot discuss scalability until you describe the load with a few numbers (DDIA, the part on describing load). He calls these numbers load parameters. The correct parameters depend on the system.

| System                         | Useful load parameters                                           |
| ------------------------------ | ---------------------------------------------------------------- |
| A web shop                     | Requests each second, and the ratio of reads to writes           |
| A chat service                 | Users connected at the same time, and messages each second       |
| A social feed                  | Posts each second, and the number of followers of a popular user |
| A cache in front of a database | The hit rate                                                     |
| A file service                 | Uploads each second, and the size distribution of the files      |

The average often hides the problem. One account with ten million followers changes the design of a feed more than a million accounts with a hundred followers each. Ask for the distribution, and ask about the largest case.

Kleppmann also separates throughput from response time. Throughput is the work done each second. Response time is how long one user waits. Describe response time with percentiles, not with the average. The 99th percentile (p99) is the time that 99% of requests beat. When one page needs answers from many services, the slowest answer decides the time, so a rare slow call becomes a common slow page.

## The four calculations

1. **Requests each second.** Users × actions for each user each day ÷ 100,000. Then multiply by the peak factor. Xu calls these QPS (queries per second) and peak QPS. A peak factor of 2 is a common default. Use a larger one when the traffic has a known rush, such as lunch time or a sale that opens at a fixed hour.
2. **Reads against writes.** The ratio decides the design. Many reads for each write point to a [cache](/learn/caching) and prepared data. Many writes point to queues and [partitioning](/learn/scaling-data).
3. **Storage.** Records each day × size of a record × days to keep. Then multiply by the number of copies. Three copies is a common choice for durability. Add indexes and free space, and round up.
4. **Bandwidth,** when files are large. Requests each second × size of an answer. Compare the result with the capacity of one network connection, for example 1 or 10 gigabits each second.

## From requests to servers

A request rate becomes a number of servers through two more steps.

1. **Requests in flight.** Requests each second × seconds for each request = requests in progress at one time. This relation is Little's law. At 4,000 requests each second and 50 milliseconds each, about 200 requests are in progress at any moment.
2. **Servers.** Peak requests each second ÷ requests that one server handles. A rough guide for a simple web service is a few hundred to a few thousand requests each second for each server. The real value depends on the work in each request. Then add spare capacity, so that the loss of one server or one zone does not overload the others.

Say that the per-server number is an assumption. In a real project, you get it from a load test, not from a guess.

## Example: the Link Shortener

- Writes: 100 million links each month ÷ 30 days ÷ 100,000 seconds ≈ 40 each second. Small.
- Reads: 100 for each write ≈ 4,000 each second, and 40,000 at peak. This is the hard number.
- Storage: 100 million × 12 months × 5 years = 6 billion links. At 500 bytes each, that is 3 terabytes. Too large for one comfortable database server.
- Code length: 62 letters and digits, 7 positions: 62⁷ ≈ 3.5 trillion codes. Enough.

Conclusion: design the read path first, use a cache, and split the store. The worked example does exactly this. The [URL shortener case](/learn/url-shortener) and the [Link Shortener kata](/kata/link-shortener) use these numbers.

## Example: a parcel tracking service

A parcel service delivers 2 million parcels each day. Each parcel gets a scan at each step: pickup, sorting centers, the van, and the door. Assume 10 scans for each parcel.

**Writes.**

- 2 million parcels × 10 scans = 20 million scan events each day.
- 20 million ÷ 100,000 seconds = 200 events each second on average.
- Most scans occur in work hours, and the evening sort is busy. Assume a peak factor of 5: 1,000 events each second.

**Reads.**

- Assume each customer checks a parcel 3 times. That is 6 million checks each day.
- 6 million ÷ 100,000 = 60 checks each second, and perhaps 300 at peak.

**Storage.**

- One scan event: parcel ID, place, time, status, and a device ID. Assume 200 bytes.
- 20 million × 200 bytes = 4 gigabytes each day.
- 4 GB × 365 ≈ 1.5 terabytes each year. Keep 3 years: about 4.5 TB.
- With 3 copies: about 13 TB.

**What the numbers mean.**

- This system has more writes than reads. That is unusual, and it changes the design. A cache helps little.
- 1,000 small writes each second is within reach of one well-tuned database server, but with little spare room. Data that only grows, keyed by parcel ID, is easy to partition by that key.
- Old events are almost never read. Move events older than a few months to cheaper storage, and keep only the current status of each parcel in the main store.
- A customer who checks a parcel wants the latest status, not the full history. Keep a small "current status" table, updated by each scan.

## Example: a ticket sale that opens at noon

A ticket seller opens sales for a concert with 50,000 seats at 12:00. The seller expects 400,000 people to wait for the start. This is the [Front Row](/kata/front-row) problem.

**Reads at the start.**

- Assume each person refreshes the seat map every 10 seconds while seats remain.
- 400,000 ÷ 10 = 40,000 requests each second. The average for the day is no guide here. The peak is the whole problem.

**Writes.**

- Assume the show sells out in 10 minutes, and each buyer takes 2 seats.
- 50,000 seats ÷ 2 = 25,000 purchases.
- 25,000 ÷ 600 seconds ≈ 40 purchases each second.

**Requests in flight.**

- 40,000 requests each second × 0.05 seconds = 2,000 requests in progress at one time.

**What the numbers mean.**

- The write rate is small. The difficulty is that many buyers want the same few seats at the same moment. This is a contention problem, not a volume problem. See [Transactions and isolation](/learn/transactions-isolation).
- The read rate is large but the data is small: 50,000 seats fit in a few megabytes. Serve the seat map from a cache, and accept that it is a few seconds old.
- A queue in front of the purchase step turns 400,000 people into a steady flow that the store can handle. Tell each person their place in the queue.
- The traffic is near zero before and after the sale. Capacity that grows and shrinks with the load saves most of the cost.

## Common mistakes

- **Precision with no purpose.** "86,400" and "100,000" lead to the same design. Use the easy number.
- **No conclusion.** A list of numbers with no effect on the design wastes the time it took.
- **Only the average.** A system fails at its peak. Always ask what the peak looks like and how long it lasts.
- **Lost units.** "40" means nothing. "40 writes each second" is a fact you can use.
- **Copies forgotten.** Storage with replication and backups is often three or more times the raw size.
- **Too many guesses at once.** If you need five assumptions, state each one. The interviewer can then change one and you can recalculate.

## Rules

- Write units on each number.
- Do the calculation in the first ten minutes, not at the end.
- State what the result means for the design. A number with no conclusion is wasted time.
- If the result says the load is small, say that too. "One server handles this" is a strong, senior statement when the numbers support it.
- Round to one or two significant digits. Then round again.
- Check a result against a known fact. If your chat service needs more storage than a large video platform, an assumption is wrong.

## In a kata

Put four numbers at the top of your design: peak requests each second, the ratio of reads to writes, storage after a few years, and the availability target. Then name the one number that drives the design, and show the part of the diagram that answers it. The [scale step by step](/learn/scale-step-by-step) page shows how each number moves a design from one server to many.

## Interview questions

**"Estimate the storage for five years of this service."**

- State each assumption: users, actions for each user, size of each record.
- Show the multiplication in steps, with units.
- Add copies, indexes, and growth.
- Say what the result means: one server, a partitioned store, or a cold storage tier.

**"How many servers do you need?"**

- Start from peak requests each second, not the average.
- Use Little's law for the requests in flight.
- Say that the requests each server can handle is an assumption, and that a load test gives the real value.
- Add spare capacity for the loss of a server or a zone.

**"Your service calls four other services. What availability can you promise?"**

- Parts in a chain multiply their availability.
- Four parts at 99.9% give about 99.6%.
- To promise more, remove calls from the critical path, add fallbacks, or call in parallel with copies.

**"Why do you use the 99th percentile and not the average?"**

- The average hides the slow requests that users remember.
- When one page waits for many calls, the slowest call sets the time.
- A small share of slow calls becomes a large share of slow pages.

**"The numbers you gave are wrong by a factor of two. Does your design change?"**

- Usually not. The design changes at a factor of ten.
- Say which number has the most effect, and at what value the design changes.

## Go deeper

- **System Design Interview** (Alex Xu), the part on back-of-the-envelope estimation: powers of two, latency numbers, availability numbers, and the habit of a short estimate at the start.
- **Designing Data-Intensive Applications** (Martin Kleppmann), the part on scalability: load parameters, percentiles, and why the tail of the distribution matters.
- **Site Reliability Engineering** (Beyer and others), the part on embracing risk: how an availability target turns into a budget of failure.

## Further reading

- [Back-of-the-envelope calculation](https://en.wikipedia.org/wiki/Back-of-the-envelope_calculation) on Wikipedia
- [Little's law](https://en.wikipedia.org/wiki/Little%27s_law) on Wikipedia
- [High availability](https://en.wikipedia.org/wiki/High_availability) on Wikipedia, with a table of the 9s
