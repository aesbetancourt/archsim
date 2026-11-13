## Start with the questions, not the product

A data store is selected by how the data is read and written, not by its popularity. Ask these questions first:

1. **How do you find a record?** By one key, by many different fields, by text search, by relations between records?
2. **How much data, and how fast does it grow?** Does it fit on one server?
3. **How many reads and writes each second?** See [Capacity estimation](/learn/estimation).
4. **Must several records change together?** If yes, you need [transactions](/learn/consistency).
5. **How bad is old or lost data?** Money is different from a view counter.

## The main types

| Type | Finds data by | Strong at | Weak at | Example use |
|---|---|---|---|---|
| Relational | Any column, joins between tables | Transactions, flexible queries | Very large size on many servers | Orders, payments, accounts |
| Key-value | One key | Speed, simple split across servers | Any query that is not by key | Sessions, short links, caches |
| Document | One key, plus fields in the document | Records with a flexible shape | Joins between documents | Product catalogs, profiles |
| Wide-column | A key and a range in that key | Very large write volume | Flexible queries | Message history, sensor data |
| Search index | Words and filters | Text search, ranking | It is not a safe main store | Product search |
| Graph | Relations between records | "Friends of friends" queries | Simple bulk operations | Social graphs, fraud detection |
| Object storage | A file name | Large files, low cost | Changes inside a file | Images, video, backups |
| Time series | Time ranges | Measurements over time | General data | Metrics, monitoring |

## Rules that hold most of the time

- **A relational database is the default.** It is flexible, well understood, and handles more load than most systems ever get. Select another type when you can say what the relational one cannot do for you.
- **One main store for each piece of data.** A search index or a [cache](/learn/caching) is a copy that can be built again. Never make the copy the only place for the data.
- **One owner for each store.** One service or module writes it. Others ask the owner. See [How to find component boundaries](/learn/boundaries).
- **Design for the query you have.** A store with no join needs the data arranged in the shape of the read. This is the reason the News Feed worked example keeps one ready list for each user.

## In a kata

Do not write "database" on a box and stop. Write what it holds and how it is found: "Link store (by short code)". If the numbers show that the data does not fit on one server, say how it is split. See [Replication and partitioning](/learn/scaling-data).

## Further reading

- [Database](https://en.wikipedia.org/wiki/Database#Classification) classification and [NoSQL](https://en.wikipedia.org/wiki/NoSQL) on Wikipedia
