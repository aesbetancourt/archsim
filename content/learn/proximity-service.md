## The question

Try the [Proximity Search kata](/kata/proximity-search) before you read this page.

"Design a service that finds businesses near a user. The user opens a city guide app and asks for lunch shops within 2 km. The app shows a list, nearest first. Business owners add, change, and remove their businesses."

The core problem is a search in two dimensions. A normal database index sorts values on one line. A location has two values, latitude and longitude, and "near" is a circle on a map. The design turns two dimensions into one, so that a normal index or a cache can answer fast. Alex Xu and Sahn Lam describe this case in System Design Interview, volume 2, the chapter on a proximity service. This page uses its own numbers and its own example.

## Questions to ask first

Functional questions:

- **What does the user give?** Assume a location (latitude and longitude) and a radius. Ask which radius values the app offers. Assume 500 m, 2 km, and 10 km.
- **What comes back?** A list of businesses with name, distance, and rating. Ask for the maximum number of results. Assume 30, with more on a "show more" button.
- **Filters.** Can the user ask for a category, "open now", or a minimum rating?
- **Owner changes.** How fast must a new or changed business show in search? This answer changes the design a lot. Assume "the next day" is acceptable.
- **Does the user move?** A search from a still user is a different problem from a live map that follows a moving car.

Non-functional questions:

- **Latency.** Assume a search answers in less than 200 ms at the 99th percentile.
- **Availability.** Search must stay up during a traffic peak. An owner change can wait.
- **Scale.** How many users, how many searches each user, and how many businesses?
- **Privacy.** A user location is personal data. Ask if the law requires data to stay in a region.

The questions that change the design most are the freshness of owner changes and the read-to-write ratio.

## Estimates

Assume these answers: 60 million daily users, 5 searches each day, 40 million businesses. Use 100,000 seconds for one day. See [Estimation](/learn/estimation) for the method.

| Quantity            | Arithmetic                       | Result                   |
| ------------------- | -------------------------------- | ------------------------ |
| Searches each day   | 60 million × 5                   | 300 million              |
| Average search rate | 300 million ÷ 100,000 s          | About 3,000 each second  |
| Lunch peak          | 3,000 × 4                        | About 12,000 each second |
| Business records    | 40 million × 1 KB                | About 40 GB              |
| Owner changes       | 100,000 each day ÷ 100,000 s     | About 1 each second      |
| Geo index in memory | 40 million × 3 precisions × 24 B | About 3 GB               |

What the numbers say:

- Reads are about 3,000 times more frequent than writes, and about 12,000 times at the lunch peak. The design must make reads cheap. It can make writes slow.
- All business data fits on one large database server. The data size is not the problem. The search rate and the geometry are the problem.
- The index fits in memory with room to spare. A cache or an in-memory tree can hold it on each server.

## The first design

```diagram
{
  "nodes": [
    { "id": "user", "label": "User app", "shape": "actor", "col": 0, "row": 0 },
    { "id": "owner", "label": "Owner app", "shape": "actor", "col": 0, "row": 2 },
    { "id": "lb", "label": "Load balancer", "shape": "box", "col": 1, "row": 1 },
    { "id": "lbs", "label": "Location-based\nservice (search)", "shape": "box", "col": 2, "row": 0 },
    { "id": "biz", "label": "Business service\n(CRUD)", "shape": "box", "col": 2, "row": 2 },
    { "id": "cache", "label": "Cache\n(geohash cells,\nbusinesses)", "shape": "store", "col": 3, "row": 0 },
    { "id": "primary", "label": "Primary DB", "shape": "store", "col": 3, "row": 2 },
    { "id": "replica", "label": "Read replicas", "shape": "store", "col": 3, "row": 1 }
  ],
  "edges": [
    { "from": "user", "to": "lb", "label": "search(lat, lng, r)" },
    { "from": "owner", "to": "lb", "label": "add, change" },
    { "from": "lb", "to": "lbs" },
    { "from": "lb", "to": "biz" },
    { "from": "lbs", "to": "cache", "label": "read" },
    { "from": "lbs", "to": "replica", "label": "on miss" },
    { "from": "biz", "to": "primary", "label": "write" },
    { "from": "primary", "to": "replica", "label": "replicate", "async": true }
  ]
}
```

- **Load balancer.** It sends `/search` requests to the location-based service and `/businesses` requests to the business service.
- **Location-based service (LBS).** It answers "which businesses are near this point". It is read-only and stateless. It has the high traffic, so it scales by adding servers.
- **Business service.** It lets owners create, change, and delete businesses. It also returns the details of one business to users. Its write traffic is low.
- **Primary database and read replicas.** The primary takes all writes. The replicas copy it and serve reads. Replication lag of some seconds is acceptable, because owner changes can wait a day. See [Replication](/learn/scaling-data#replication).
- **Cache.** It holds the business IDs for each geohash cell, and the business records. Most searches never reach a database.

Two tables hold the data:

| Table       | Key                        | Columns                                  |
| ----------- | -------------------------- | ---------------------------------------- |
| `business`  | `business_id`              | name, address, lat, lng, category, hours |
| `geo_index` | (`geohash`, `business_id`) | lat, lng (copied, so search skips a hop) |

The geo index has one row for each business and each precision. A compound key makes a change simple: delete one row, insert one row. The other option is one row for each cell with a list of IDs in it. That row needs a lock for each change, and a popular cell becomes a hot row.

## Deep dives

### Why a normal index fails

The first idea is a query on two ranges:

```sql
SELECT business_id FROM business
WHERE lat BETWEEN :lat - :d AND :lat + :d
  AND lng BETWEEN :lng - :d AND :lng + :d;
```

An index on `lat` finds all businesses in a horizontal band around the world. An index on `lng` finds a vertical band. The database must intersect two very large sets to find the small square where they cross. A compound index on (`lat`, `lng`) helps only with the first column. With 40 million rows, each search reads hundreds of thousands of index entries.

The fix is a **spatial index**: a structure that keeps points that are near on the map also near in the index. There are two families:

| Family  | How it works                                     | Examples                            |
| ------- | ------------------------------------------------ | ----------------------------------- |
| Hashing | Divide the map into cells. Give each cell a key. | Even grid, geohash, Cartesian tiers |
| Trees   | Divide space where the points are dense.         | Quadtree, Google S2, R-tree         |

### The evenly divided grid

Divide the world into cells of the same size, for example 1 km by 1 km. Give each business the ID of its cell. A search reads the cell of the user and the cells around it.

The grid is simple, but the density of businesses is very uneven. A cell in the center of a big city can have 5,000 lunch shops. A cell in the ocean or the desert has none. A small cell size makes most cells empty and wastes memory. A large cell size makes city cells too full, so each search filters thousands of results. One cell size cannot fit both. The grid also has no simple way to find the neighbors of a cell, unless you number the cells with care.

### Geohash

A **geohash** turns a point into a short string. The algorithm divides the world in two halves again and again.

1. Divide the longitude range in two. Write 0 for the west half and 1 for the east half.
2. Divide the latitude range in two. Write 0 for the south half and 1 for the north half.
3. Repeat with the half that holds the point. Alternate longitude and latitude bits.
4. Group the bits into blocks of 5. Write each block as one character of a base-32 alphabet.

Each extra character makes the cell about 32 times smaller. Two points with a long common prefix are in the same small cell. So a prefix search on a normal string index finds all points in a cell. The table gives rough cell sizes near the equator. Cells get narrower toward the poles.

| Length | Cell size (rough) | Use                        |
| ------ | ----------------- | -------------------------- |
| 4      | 39 km × 20 km     | Search with a 10 km radius |
| 5      | 4.9 km × 4.9 km   | Search with a 2 km radius  |
| 6      | 1.2 km × 0.6 km   | Search with a 500 m radius |
| 7      | 150 m × 150 m     | Too small for this search  |
| 8      | 38 m × 19 m       | Street-level points        |

**How to select the length.** The user can stand anywhere inside the cell, even at its edge. The service always reads the cell of the user and its 8 neighbors, a block of 3 × 3 cells. That block covers the full search circle when the radius is not larger than the short side of one cell. So select the longest geohash whose short side is at least the radius. For 2 km, length 5 gives 4.9 km, and length 6 gives only 0.6 km. Use length 5.

**Boundary issues.** Geohash has two traps that interviewers like:

1. **Close points can have different prefixes.** Two lunch shops 10 m apart, one on each side of a cell edge, are in different cells. At the equator or the prime meridian, they can share no prefix at all, because a bit in their first character differs. A search of only the user cell misses the shop across the street. The 3 × 3 block fixes this. A neighbor of a cell can be computed from its geohash string in constant time.
2. **Not enough results.** A user in a village asks for 30 lunch shops within 2 km, and the 9 cells have 4. The service can remove the last character of the geohash and search the larger cells. It repeats until it has enough results or reaches the largest allowed radius. Tell the user when the results come from farther away.

Geohash cells do not adapt to density. A length 5 cell in a city still holds thousands of businesses. The filter step must handle this (see below). For this problem, it is acceptable, because the cache returns a list of IDs very fast.

### Quadtree

A **quadtree** is a tree in which each node covers a square region and has zero or four children. The algorithm starts with one node for the whole world. If a node holds more than a fixed number of businesses, for example 100, it splits into four equal children. It repeats until each leaf holds 100 or fewer. Dense cities get deep, small leaves. Empty oceans stay as one large leaf.

A search walks from the root to the leaf that holds the user. If that leaf has too few results, it adds the neighbor leaves until it has enough. The cell size adapts to the density, which a geohash cannot do.

A quadtree lives in memory on each LBS server, not in a database. Its size, as a rough estimate:

- 40 million businesses ÷ 100 for each leaf = at least 400,000 leaves. With leaves that are half full, about 800,000.
- A leaf stores up to 100 IDs of 8 bytes and a bounding box of 32 bytes: about 830 bytes. 800,000 × 830 B is about 660 MB.
- Internal nodes are about one third of the leaves, with four child pointers and a box each. That is some tens of MB.
- The total is under 1 GB. It fits on each server.

**The rebuild problem.** A server builds the tree at start-up from all 40 million businesses. That takes minutes, not seconds. During the build, the server cannot answer. Three consequences follow:

1. **Deploys must be slow.** Release the new version to a small part of the fleet at a time. If all servers restart together, search is down until the trees are built.
2. **Changes are hard.** An owner adds a shop, and the tree must change on every server. Updates in place need locks, and a leaf that grows past 100 must split while readers walk the tree. Most teams avoid this. They rebuild the tree each night, or they apply a batch of changes at a quiet time.
3. **Start-up depends on the database.** A full fleet restart reads 40 GB from the replicas at once. Keep a snapshot of the tree in object storage, so a server can load the snapshot and skip the build.

The "next day is acceptable" answer from the first questions is what makes the nightly rebuild possible. If owners need changes in seconds, prefer geohash in a cache or a database.

### Google S2

Google S2 is a library that projects the sphere onto the six faces of a cube. It then numbers the cells on each face along a Hilbert curve, a line that fills a square and keeps near points near on the line. Each cell has a 64-bit ID, and cells nest in levels like a geohash.

S2 has two strong points. It can cover any shape, not only a square, with a set of cells of different levels. This is the **region cover**, and it is useful for geofences, for example "notify the user who enters this park". Its cells also have a more even size across the globe than geohash cells. In an interview, name it and say when you would pick it: for arbitrary shapes and geofences.

### Filtering and ranking

The index returns candidates, not the answer. A search for 2 km with geohash length 5 reads 9 cells of about 4.9 km each, so the block covers about 15 km × 15 km. The circle of 2 km is only a small part of that area.

The LBS takes these steps:

1. **Compute the cells.** Find the geohash of the user at the right length, and its 8 neighbors.
2. **Read the candidates.** Get the business IDs, with lat and lng, for the 9 cells from the cache. On a miss, read the `geo_index` table on a replica.
3. **Filter by exact distance.** Compute the great-circle distance to each candidate. Drop each one outside the radius.
4. **Filter by attributes.** Drop closed businesses, or the wrong category. This needs the business record, so keep the attributes for filters in the cache entry.
5. **Rank.** Sort by distance. A product can blend distance with rating and popularity, but keep the score simple and explain it.
6. **Page.** Return the first 30 IDs and a cursor. The app gets names and photos for those 30 from the business service, through the cache.

A dense city is the expensive case. If 9 cells hold 20,000 candidates, step 3 costs real time. Two fixes: use the next longer geohash for dense areas, or store the IDs in each cell already sorted by a quality score and read only the top part.

### Caching geohash cells

Two caches give most of the speed:

| Cache key        | Value                                    | Size (rough)                         |
| ---------------- | ---------------------------------------- | ------------------------------------ |
| `geohash:<cell>` | List of business IDs with lat, lng, tags | 40 million × 3 lengths × 24 B ≈ 3 GB |
| `business:<id>`  | Business record for the result list      | 40 million × 1 KB ≈ 40 GB            |

Precompute the geohash entries for each length that a radius uses: 4, 5, and 6. Do not cache the search result for each user location. Two users 5 m apart have different coordinates, so the hit rate is near zero. The cell is the right cache key, because many users share one cell.

The geohash cache is small enough to copy to each region. A nightly job rebuilds it from the database, or a change stream from the primary updates the cells of a changed business. The business cache is larger. Partition it across cache nodes with [consistent hashing](/learn/consistent-hashing).

Cache entries for very popular cells, such as a city center at noon, become [hot keys](/learn/caching#hot-keys). Each LBS server can keep a small local copy of the hottest cells for some seconds.

### Scale and regions

The LBS is stateless, so add servers for the lunch peak. Run it in several regions, near the users. A search from Madrid has no reason to cross an ocean. DNS or a global load balancer sends each user to the nearest region. Each region has its own read replicas and its own cache. This also helps when a law requires the data of a country to stay in it.

The business service writes to one primary. At 1 write each second, one primary is enough for a long time. If the data grows past one server, shard the business table by `business_id`. Do not shard by location: a city center would become a hot shard. See [Partitioning](/learn/scaling-data#partitioning).

## Trade-offs and alternatives

| Decision         | Choice here                     | When the choice changes                                                    |
| ---------------- | ------------------------------- | -------------------------------------------------------------------------- |
| Spatial index    | Geohash in a cache and a table  | Quadtree when density varies a lot and changes can wait for a rebuild      |
| Arbitrary shapes | Not needed                      | S2 for geofences and region covers                                         |
| Freshness        | Owner changes show the next day | A change stream to the cache when owners need changes in minutes           |
| Read path        | Cache, then read replicas       | Primary reads only for the owner who just changed a business               |
| Off-the-shelf    | Build the index                 | PostGIS, Redis geo commands, or Elasticsearch geo queries for a small team |

The off-the-shelf row matters in a real project. Redis keeps geo points in a sorted set, with a geohash-like score. PostGIS adds spatial indexes to PostgreSQL. For one city or one country, these tools are often enough. In the interview, the goal is to show that you understand what they do inside.

## What interviewers probe

1. **"Two shops are 10 m apart. Why does your search find only one?"**
   - The user cell holds one shop. The other is across a cell edge, with a different prefix.
   - Always read the 8 neighbor cells too.
2. **"How do you choose the geohash length for a radius?"**
   - The 3 × 3 block must cover the circle, so the short side of a cell must be at least the radius.
   - Precompute one length for each radius option.
3. **"The quadtree is in memory. What happens on a deploy?"**
   - Each server needs minutes to build the tree, and cannot serve during that time.
   - Roll out to a small part of the fleet at a time. Load from a snapshot. Rebuild each night for owner changes.
4. **"The user is in a village, and there are only 3 results."**
   - Shorten the geohash by one character and search again, up to a limit.
   - Say in the result list that the radius grew.
5. **"What do you cache, and why not the search result?"**
   - Cache by cell, not by user location. User coordinates are almost never the same twice.
   - The cell list for all 40 million businesses fits in a few GB.

## Go deeper

- **System Design Interview, volume 2** (Alex Xu, Sahn Lam), the chapter on a proximity service: the comparison of grid, geohash, quadtree, and S2. The chapter on nearby friends adds moving users.
- **Designing Data-Intensive Applications** (Martin Kleppmann), the part on multi-column indexes: why a normal index cannot answer a range on two dimensions, and what spatial indexes do.
- **DDIA**, the parts on replication and partitioning: read replicas, replication lag, and why a partition key by location makes hot spots.

## Further reading

- [Geohash](https://en.wikipedia.org/wiki/Geohash) and [Quadtree](https://en.wikipedia.org/wiki/Quadtree) on Wikipedia
- [S2 Geometry](https://s2geometry.io/), the library site
- Related lessons: [Caching](/learn/caching), [Scaling data](/learn/scaling-data), [Storage engines](/learn/storage-engines)
