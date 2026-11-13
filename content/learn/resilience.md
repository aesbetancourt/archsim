## The starting point

In a system with many parts, something is always broken. A resilient design does not try to prevent each failure. It limits how far a failure spreads, and it recovers without a person.

For each arrow in your diagram, ask: what occurs if the box at the end is slow, or gives no answer? "Slow" is worse than "down". A part that is down fails fast. A part that is slow holds its callers until they have no capacity left, and the failure moves backward through the system.

## The standard tools

| Tool | What it does | Protects against |
|---|---|---|
| Timeout | Stops waiting after a fixed time | A slow part that holds its callers |
| Retry with backoff | Tries again, with a longer wait each time | Short faults |
| Circuit breaker | After several failures, stops calling for a period and fails immediately | Repeated calls to a part that is down |
| Bulkhead | Gives each dependency its own limited share of resources | One slow dependency that uses all capacity |
| Rate limit | Refuses requests above a limit | Overload from one caller |
| Queue | Holds work until a worker is ready | Bursts, and a receiver that is down for a short time |
| Fallback | Gives a simpler answer when the full one is not available | A dependency that is not essential |
| Redundancy | Runs several copies in separate places | Loss of a machine or a data center |

## Rules for retries

Retries are useful and dangerous.

- Retry only when the operation is [safe to repeat](/learn/distributed-transactions).
- Wait longer before each attempt, and add a random part, so that many callers do not all retry in the same moment.
- Set a maximum number of attempts.
- Retry at one level only. If three levels each retry three times, one failure becomes 27 calls to a part that is already in trouble.

## Degrade, do not fail

Decide for each function if it is essential. When the recommendation service is down, show a plain list. When the payment provider is slow, offer "pay at pickup". A user accepts a product with fewer functions much more easily than an error page. The Tutor Marketplace and Lunch Rush worked examples both do this.

## Single points of failure

Find each box of which there is only one: one database server, one gateway, one scheduler, one external provider. For each, either add a second, or state that you accept the risk and why.

## Test it

A recovery path that never runs does not work when you need it. Teams that depend on resilience cause failures deliberately, in a controlled way, to see what occurs. At minimum, test the restore of a backup.

## In a kata

The "risks" part of the rationale is this page in practice. Name the first thing that fails and what the design does about it. See also [Observability and service levels](/learn/observability).

## Further reading

- [Circuit breaker](https://martinfowler.com/bliki/CircuitBreaker.html), by Martin Fowler
- [Exponential backoff](https://en.wikipedia.org/wiki/Exponential_backoff) and [Chaos engineering](https://en.wikipedia.org/wiki/Chaos_engineering) on Wikipedia
