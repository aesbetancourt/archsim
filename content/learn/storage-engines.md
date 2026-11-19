## Why an architect needs to know this

A storage engine is the part of a database that writes data to disk and finds it again. You do not write one. But you select a database, and the engine inside it decides how fast it writes, how fast it reads, and how it behaves when the data grows.

Two families of engines do most of the work today. **Log-structured** engines, such as the LSM-trees in Cassandra, RocksDB, and ScyllaDB, add new data at the end of files and never change a file in place. **Page-oriented** engines, such as the B-trees in PostgreSQL, MySQL InnoDB, and Oracle, keep data in fixed blocks and change those blocks in place. Kleppmann describes both in DDIA, in the part on storage and retrieval.

A third question is the shape of the work. A shop that takes orders reads and writes a few rows at a time. An analyst who asks "what did each shop sell each week this year" reads millions of rows and a few columns. These two loads need different storage layouts. A design that puts both on one database often serves both badly.

This page explains the mechanisms so that you can say why a database fits a load. For the choice between database types, see [Selecting data stores](/learn/data-stores).

## The simplest database: a log

Start with the simplest store that works. To write a key and a value, add a line at the end of a file. To read a key, scan the file and keep the last value for that key.

- **Writes are fast.** Adding to the end of a file is the cheapest disk operation. Disks and SSDs both do sequential writes much faster than random writes.
- **Reads are slow.** A read must scan the whole file. The cost grows with the size of the data.

A **log** in this sense is a file to which you only add records. Many real engines have a log at their center. To make reads fast, an engine adds an **index**: an extra structure, built from the data, that tells the engine where to find a key. Each index makes reads faster and writes slower, because each write must also change the index. This is the basic trade-off of storage. A database does not index everything by default. You select the indexes from the queries that the application runs.

## Hash indexes

The first index is a hash map in memory. For each key, it keeps the position (the byte offset) of the latest value in the log file. A read looks up the key in the map, goes to that position, and reads one record.

The log grows without limit, so the engine cuts it into **segments**. When a segment reaches a fixed size, the engine closes it and starts a new one. A background process then does **compaction**: it reads old segments, keeps only the latest value for each key, and writes a new, smaller segment. To delete a key, the engine writes a special record, a **tombstone**, that tells compaction to drop the key.

This design is fast and simple. Bitcask, the default engine of Riak, works this way. But it has two limits:

1. All keys must fit in memory.
2. A range query, such as "all orders from 10:00 to 11:00", must look up each key one at a time. The hash map does not keep keys in order.

## SSTables and LSM-trees

A **Sorted String Table (SSTable)** is a segment file in which the records are sorted by key, and each key occurs once. The sort order solves both limits of the hash index:

- Merging segments is efficient, as in a merge sort. The engine reads the files side by side, in order.
- The index can be sparse. The engine keeps one key for each few kilobytes of the file. To find a key, it goes to the closest indexed key before it and scans forward a short distance.
- Range queries are cheap, because keys that are near in order are near on disk.

But writes arrive in random key order. How does the engine write a sorted file? It sorts them in memory first.

1. A write goes to a **memtable**, a sorted structure in memory, such as a red-black tree or a skip list.
2. The engine also adds the write to a **write-ahead log** on disk. If the server crashes, the engine rebuilds the memtable from this log.
3. When the memtable reaches a size limit, the engine writes it to disk as a new SSTable. It then starts an empty memtable and drops the old log.
4. In the background, compaction merges SSTables into larger ones and removes old values and tombstones.

A read looks in the memtable first, then in the SSTables from newest to oldest. This design is the **Log-Structured Merge-tree (LSM-tree)**. LevelDB, RocksDB, Cassandra, HBase, and ScyllaDB use it. Full-text search engines such as Lucene, the engine in Elasticsearch, use a similar idea for their term dictionaries.

```diagram
{
  "nodes": [
    { "id": "w", "label": "Write", "shape": "actor", "col": 0, "row": 0 },
    { "id": "wal", "label": "Write-ahead log\n(append only)", "shape": "store", "col": 1, "row": 0 },
    { "id": "mem", "label": "Memtable\n(sorted, in memory)", "shape": "module", "col": 1, "row": 1 },
    { "id": "l0", "label": "New SSTables\n(small, recent)", "shape": "store", "col": 2, "row": 1 },
    { "id": "ln", "label": "Merged SSTables\n(large, older)", "shape": "store", "col": 3, "row": 1 },
    { "id": "bloom", "label": "Bloom filter\n(one per SSTable)", "shape": "module", "col": 2, "row": 2 },
    { "id": "r", "label": "Read", "shape": "actor", "col": 0, "row": 2 }
  ],
  "edges": [
    { "from": "w", "to": "wal", "label": "1. append" },
    { "from": "w", "to": "mem", "label": "2. insert" },
    { "from": "mem", "to": "l0", "label": "3. flush\nwhen full" },
    { "from": "l0", "to": "ln", "label": "4. compaction", "async": true },
    { "from": "r", "to": "mem", "label": "look here first" },
    { "from": "r", "to": "bloom", "label": "then ask" },
    { "from": "bloom", "to": "l0", "label": "read only if\nkey can be there" }
  ]
}
```

### Bloom filters

A read for a key that does not exist is expensive in an LSM-tree. The engine must look in each SSTable before it can say "not found". A **Bloom filter** prevents most of this work. It is a small bit array for each SSTable that answers "this key is surely not here" or "this key can be here". It gives false positives but no false negatives. So the engine opens a file only when the filter says the key can be there.

### Compaction strategies

Compaction has two common strategies:

| Strategy    | How it works                                                                    | Good for                                     |
| ----------- | ------------------------------------------------------------------------------- | -------------------------------------------- |
| Size-tiered | Merges SSTables of similar size into one larger table                           | Heavy writes                                 |
| Leveled     | Keeps levels of fixed total size; each level has tables with no overlap of keys | Reads and range queries, and less disk space |

Cassandra offers both. RocksDB and LevelDB use leveled compaction by default.

## B-trees

The **B-tree** is the most common index. Almost every relational database uses it. It also keeps keys sorted, but it uses a different structure.

- The engine divides the disk into **pages** of fixed size, often 4 KB to 16 KB.
- Each page holds a range of keys. An inner page holds keys and references to child pages. A leaf page holds the values, or references to them.
- A read starts at the root page and follows references down to the leaf that holds the key.
- To change a value, the engine overwrites the page in place.
- When a page is full, the engine splits it into two half-full pages and updates the parent page.

The number of child references in a page is the **branching factor**. It is usually several hundred. So a B-tree with four levels below the root can hold a very large number of keys, and a read touches only a few pages. As a rough number, take a branching factor of 500 and 4 KB pages. Four levels of branching below the root give 500 × 500 × 500 × 500 leaf pages, about 250 TB.

### Crash safety

An overwrite of a page is dangerous. A page split changes several pages. If the server crashes between those writes, the tree is broken. So the engine first writes each change to a **write-ahead log (WAL)**, also called a redo log. After a crash, the engine replays the log to repair the tree. The WAL is also the base of [replication](/learn/scaling-data#replication) in many databases, because a replica can apply the same log.

### Write amplification

**Write amplification** is the number of bytes written to disk for each byte that the application writes. Both families have it:

- A B-tree writes each change at least twice: once to the WAL and once to the page. A small change rewrites a full page.
- An LSM-tree writes each value again each time compaction merges it into a larger file.

Write amplification matters on SSDs, which wear out after a fixed number of writes, and on any disk whose bandwidth is the limit.

## LSM-tree or B-tree

| Point        | LSM-tree                                                                    | B-tree                                                        |
| ------------ | --------------------------------------------------------------------------- | ------------------------------------------------------------- |
| Writes       | Usually faster: sequential writes, often lower write amplification          | Slower: random page writes, a full page for a small change    |
| Reads        | Can be slower: a read can check several SSTables                            | Predictable: one path from root to leaf                       |
| Disk space   | Compact: files have no empty space, and compression works well              | Some space stays empty after page splits                      |
| Latency      | Compaction runs in the background and can slow requests at high percentiles | More stable                                                   |
| Risk         | If writes are faster than compaction, old files pile up and reads slow down | Fragmentation over time                                       |
| Transactions | Possible, but harder                                                        | Each key is in one place, so range locks are simple to attach |

Rules that hold most of the time:

- Select an LSM-tree for a load with many writes: event logs, metrics, messages, sensor data, a [key-value store](/learn/key-value-store).
- Select a B-tree for a load with many reads, range queries, and transactions: orders, accounts, bookings.
- Measure with your own data. Kleppmann notes that the benchmarks are sensitive to the load.

## Secondary and covering indexes

A **primary key** index finds a row by its unique key. A **secondary index** finds rows by another column, such as all orders of one customer. Secondary key values are not unique, so each entry holds a list of matching row IDs, or the engine adds the row ID to the key to make it unique. Both B-trees and LSM-trees can hold secondary indexes.

Where the row itself lives is a separate choice:

| Option          | What the index holds                                   | Effect                                                       |
| --------------- | ------------------------------------------------------ | ------------------------------------------------------------ |
| Heap file       | A reference to the row, which lives in a separate file | No copy of the data; each index points to one place          |
| Clustered index | The row itself, in the leaf pages of the primary index | Fast reads by primary key; InnoDB does this                  |
| Covering index  | Some extra columns, next to the key                    | Some queries read only the index; writes and space cost more |

A **covering index** answers a query from the index alone. For example, an index on `(shop_id, pickup_time)` that also includes `status` answers "open orders for shop 12 this hour" without a read of the table.

### Multi-column and full-text indexes

A **concatenated index** joins several columns into one key, in a fixed order. An index on `(last_name, first_name)` finds all people with one last name, but it does not help a search by first name alone. Put the column that queries always filter on first.

A **full-text index** finds documents that contain words, including similar words and misspellings. Lucene and the search engines built on it do this. This is usually a separate store, fed from the main database.

## In-memory databases

When the data fits in RAM, a database can keep it all in memory. Redis, Memcached, and VoltDB are examples. Some write a log or snapshots to disk for durability. Memcached does not, and it loses data on restart.

The main gain is not that the engine avoids disk reads. A disk-based engine also keeps hot pages in memory, through the operating system cache. The gain is that the engine does not need to encode the data in a form that suits the disk. So it can offer data structures that are hard to keep on disk, such as the sorted sets and queues of Redis.

Use an in-memory store when the data set is small enough, or when you can rebuild it, as in a [cache](/learn/caching). State what occurs to the data on a restart.

## OLTP and OLAP

The two shapes of work have names.

| Point          | OLTP (online transaction processing) | OLAP (online analytical processing)            |
| -------------- | ------------------------------------ | ---------------------------------------------- |
| Who uses it    | Customers, through an application    | Analysts, reports, dashboards                  |
| A typical read | A few rows, found by a key           | Many rows, a few columns, with sums and counts |
| Writes         | Small, frequent, random              | Large batch loads or a stream of events        |
| Data           | The current state                    | The history of events over time                |
| Size           | Gigabytes to terabytes               | Terabytes to petabytes                         |
| Limit          | Disk seek time and latency           | Disk bandwidth                                 |

An analytic query on an OLTP database scans large tables. It uses the disk and the cache that customer requests need, and it slows them down. So companies copy the data to a separate system.

## Data warehouses and star schemas

A **data warehouse** is a separate database for analysis. It holds a read-only copy of the data from many OLTP systems. A process called **Extract-Transform-Load (ETL)** reads the source systems, cleans the data, and loads it. Today this is often a stream of changes instead of a nightly batch. See [Batch and stream processing](/learn/batch-and-stream). Snowflake, BigQuery, Redshift, and ClickHouse are examples of analytic databases.

Most warehouses use a **star schema**:

- A **fact table** holds one row for each event. For a parcel service, each row is one delivery: the time, the parcel, the depot, the driver, the weight, the price.
- Most columns of a fact table are foreign keys to **dimension tables**. These describe the who, what, where, and when: the depot with its city and region, the driver, the date with its weekday and holiday flag.

The fact table is very large and narrow per column. Dimension tables are small. When the dimension tables are split again into sub-tables, the result is a **snowflake schema**. The star schema is simpler for analysts.

## Column-oriented storage

A fact table can have 100 columns or more, but a query reads only a few. In a row-oriented store, the engine loads whole rows from disk and drops most of each row. That wastes most of the disk bandwidth.

A **column-oriented** store keeps all the values of each column together, in a separate file or block. A query that needs three columns reads three files. Each file holds the values in the same row order, so the engine joins them again by position.

### Compression

A column holds many values of one type, and often many repeats. For example, the `depot_id` column of a delivery table has only a few hundred distinct values in millions of rows. This compresses very well.

- **Bitmap encoding:** for each distinct value, keep one bit for each row: 1 if the row has that value.
- **Run-length encoding:** a long run of the same bit becomes one count. A sorted column compresses best.

The compressed data also makes queries faster. More of it fits in the CPU cache, and the CPU can process blocks of values in tight loops. This is called vectorized processing.

### Sort order and writes

A column store can sort all rows by one or two columns, such as date and then depot. A query on a date range then reads one short part of the files. Some stores keep several copies of the data, each sorted in a different order.

Writes are harder. An insert in the middle of sorted, compressed columns rewrites many files. So column stores use the LSM idea: new rows go to a store in memory, and a background process merges them into the column files.

A **materialized view** stores the result of a frequent query. A **data cube** is one that stores sums grouped by several dimensions. It answers its own questions fast, and no others.

## Failure modes and traps

- **No index for the main query.** The database scans the full table. It is fast with test data and slow in production.
- **Too many indexes.** Each write updates each index. A table with ten indexes writes slowly.
- **Analysis on the OLTP database.** A heavy report slows the checkout. Send reports to a replica or a warehouse.
- **Compaction that falls behind.** In an LSM store, reads slow down and disk use grows. Watch pending compactions and disk space.
- **An in-memory store as the only copy.** A restart or a failure loses the data, unless the store writes to disk and you tested the restore.

## In a kata

You do not name the storage engine in most katas. You name the database, and you can say why it fits.

- For a store of orders, seats, or bookings, a relational database with B-tree indexes is the default. Name the indexes that the main queries need.
- For a stream of writes, such as bids in [Gavel](/kata/gavel) or truck locations in [Tow Line](/kata/tow-line), an LSM-based store takes high write rates. Say how old data leaves the store.
- For reports, such as response times for the insurer in Tow Line, add a separate analytic store. Do not run reports on the database that serves customers.

## Interview questions

**Why are writes faster in an LSM-tree than in a B-tree?**

- An LSM-tree writes sequentially: to the log and then whole sorted files.
- A B-tree overwrites pages in random places, and a small change rewrites a full page.
- The LSM-tree pays later, in compaction, and on reads that check several files.

**What does a Bloom filter do in an LSM-tree?**

- It tells the engine that a key is surely not in an SSTable.
- So a read skips most files, especially for keys that do not exist.
- It can give false positives, never false negatives.

**What is a covering index, and what does it cost?**

- An index that holds the extra columns a query needs, so the query does not read the table.
- It makes those reads faster.
- It costs disk space, and each write must update more data.

**Why do analytic databases store data by column?**

- Analytic queries read a few columns of very many rows.
- Column storage reads only those columns from disk.
- Values in one column are similar, so they compress well, and compressed data is faster to process.
- The cost is slower writes, so these stores buffer new rows in memory first.

## Go deeper

- Designing Data-Intensive Applications, Martin Kleppmann: the part on storage and retrieval. It builds the engines from a log to LSM-trees and B-trees, and it explains column storage.
- System Design Interview, Alex Xu: the case of a key-value store. It applies the LSM write path, Bloom filters, and SSTables to a design question.

## Further reading

- [Log-structured merge-tree](https://en.wikipedia.org/wiki/Log-structured_merge-tree), [B-tree](https://en.wikipedia.org/wiki/B-tree), and [Bloom filter](https://en.wikipedia.org/wiki/Bloom_filter) on Wikipedia
- [Column-oriented DBMS](https://en.wikipedia.org/wiki/Column-oriented_DBMS) and [Star schema](https://en.wikipedia.org/wiki/Star_schema) on Wikipedia
- [RocksDB documentation](https://github.com/facebook/rocksdb/wiki), the wiki of a widely used LSM-tree engine
