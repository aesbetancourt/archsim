## Why estimate

A quick calculation tells you which part of a design is hard. Twelve payments each second need a careful design for correctness and no special design for load. Forty thousand redirects each second need the opposite. Without the number, you cannot know where to spend your time.

The goal is the order of magnitude: is it 10, 1,000, or 100,000? Round hard, and say your assumptions aloud.

## Numbers to remember

| Fact | Rounded value |
|---|---|
| Seconds in a day | About 100,000 (exact: 86,400) |
| 1 million actions each day | About 12 each second |
| 1 billion actions each day | About 12,000 each second |
| Peak load | Often 2 to 10 times the average |
| 1 kilobyte | A short text record |
| 1 megabyte | A photo of medium quality |
| 1 gigabyte | About an hour of compressed video |

Typical delays, as rough guides:

| Operation | Time |
|---|---|
| Read from memory | Far less than a microsecond |
| Read from a fast disk | About 0.1 milliseconds |
| A call in the same data center | About 1 millisecond |
| A simple database query | 1 to 10 milliseconds |
| A call between continents | 100 to 200 milliseconds |

These depend on hardware and change over time. Use them to compare options, not as exact facts.

## The four calculations

1. **Requests each second.** Users × actions for each user each day ÷ 100,000. Then multiply by the peak factor.
2. **Reads against writes.** The ratio decides the design. Many reads for each write point to a [cache](/learn/caching) and prepared data. Many writes point to queues and [partitioning](/learn/scaling-data).
3. **Storage.** Records each day × size of a record × days to keep.
4. **Bandwidth,** when files are large. Requests each second × size of an answer.

## Example: the Link Shortener

- Writes: 100 million links each month ÷ 30 days ÷ 100,000 seconds ≈ 40 each second. Small.
- Reads: 100 for each write ≈ 4,000 each second, and 40,000 at peak. This is the hard number.
- Storage: 100 million × 12 months × 5 years = 6 billion links. At 500 bytes each, that is 3 terabytes. Too large for one comfortable database server.
- Code length: 62 letters and digits, 7 positions: 62⁷ ≈ 3.5 trillion codes. Enough.

Conclusion: design the read path first, use a cache, and split the store. The worked example does exactly this.

## Rules

- Write units on each number.
- Do the calculation in the first ten minutes, not at the end.
- State what the result means for the design. A number with no conclusion is wasted time.
- If the result says the load is small, say that too. "One server handles this" is a strong, senior statement when the numbers support it.

## Further reading

- [Back-of-the-envelope calculation](https://en.wikipedia.org/wiki/Back-of-the-envelope_calculation) on Wikipedia
