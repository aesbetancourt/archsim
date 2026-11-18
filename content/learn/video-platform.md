## The question

Try the [Video Streaming kata](/kata/video-streaming) before you read this page.

"Design a video platform. Creators upload videos. Viewers watch them on phones, computers, and televisions. Playback must start fast, and quality must adapt to the network."

This case has two halves that are almost separate systems. The upload half is a batch pipeline: large files, heavy computation, and minutes of time are acceptable. The watch half is a delivery problem: petabytes of bytes to many places, where cost and start time are the main concerns. A strong answer keeps the two halves apart and says where the money goes.

## Questions to ask first

| Question                                | Why it changes the design                                                               |
| --------------------------------------- | --------------------------------------------------------------------------------------- |
| Which devices and networks?             | Each device class needs its own set of resolutions and formats.                         |
| How large can an upload be? How long?   | Large files need direct, resumable upload to object storage.                            |
| How fast must a new video be ready?     | "In minutes" lets you transcode in a queue. "Live" is a different system.               |
| Is the audience global?                 | A global audience needs a CDN with points of presence in many regions.                  |
| Is live streaming in scope?             | Live needs latency of seconds and no time for a full pipeline. Leave it out if you can. |
| Do we need protection of content (DRM)? | DRM adds encryption and a license server to the playback path.                          |
| What is the budget?                     | Delivery cost is the largest cost. It decides how much you put on the CDN.              |

For this page, assume: video on demand only (no live), all devices, a global audience, uploads up to a few gigabytes, ready within about 15 minutes, and no DRM.

Non-functional requirements:

- Playback starts in less than about 2 seconds, and rarely stops to buffer.
- The upload service is highly available. The pipeline can be slower but must not lose a video.
- The design keeps delivery cost under control.

## Estimates

Rough numbers, my own. See [Estimation](/learn/estimation) for the method.

**Watch side:**

- 20 million daily viewers. Each watches 4 videos a day, for an average of 8 minutes each.
- Watch time: 20 million × 4 × 8 minutes = 640 million minutes a day, or about 38.4 billion seconds.
- Average bitrate: about 2 Mbit/s, a mix of phone and television quality.
- Bytes out: 38.4 billion s × 2 Mbit/s = 76.8 billion Mbit, or about 9.6 PB a day.
- Average egress: 9.6 PB in 86,400 seconds is about 110 GB/s, or about 0.9 Tbit/s. The peak is perhaps twice that.
- Cost: if CDN delivery costs about $0.01 for each GB (a rough, high-volume price), that is about $96,000 a day. This number dominates all others.

**Upload side:**

- 200,000 new videos a day, with an average source file of 500 MB.
- Source storage: 200,000 × 500 MB = 100 TB a day.
- The encoded versions together are often about the same size as the source again. So plan for about 200 TB a day, or about 70 PB a year before replication.
- Upload rate: 200,000 in 86,400 seconds is about 2.3 uploads each second. The count is small. The bytes and the CPU for transcoding are large.

The estimates say: optimize the watch side for cost and the upload side for throughput.

## The first design

```diagram
{
  "nodes": [
    { "id": "creator", "label": "Creator app", "shape": "actor", "col": 0, "row": 0 },
    { "id": "api", "label": "API servers", "shape": "box", "col": 1, "row": 0 },
    { "id": "meta", "label": "Metadata DB\n+ cache", "shape": "store", "col": 2, "row": 0 },
    { "id": "raw", "label": "Raw videos\n(object storage)", "shape": "store", "col": 1, "row": 1.2 },
    { "id": "queue", "label": "Transcode queue", "shape": "pipe", "col": 2, "row": 1.2 },
    { "id": "workers", "label": "Transcoding\npipeline (DAG)", "shape": "box", "col": 3, "row": 1.2 },
    { "id": "out", "label": "Encoded videos\n(origin storage)", "shape": "store", "col": 3, "row": 2.4 },
    { "id": "cdn", "label": "CDN", "shape": "external", "col": 2, "row": 2.4 },
    { "id": "viewer", "label": "Viewer player", "shape": "actor", "col": 0, "row": 2.4 }
  ],
  "edges": [
    { "from": "creator", "to": "api", "label": "1. ask for\nupload URL" },
    { "from": "creator", "to": "raw", "label": "2. upload parts" },
    { "from": "api", "to": "meta" },
    { "from": "raw", "to": "queue", "label": "3. upload done", "async": true },
    { "from": "queue", "to": "workers" },
    { "from": "workers", "to": "out", "label": "renditions" },
    { "from": "workers", "to": "meta", "label": "4. ready", "async": true },
    { "from": "cdn", "to": "out", "label": "cache miss" },
    { "from": "viewer", "to": "cdn", "label": "segments" },
    { "from": "viewer", "to": "api", "label": "manifest URL" }
  ]
}
```

- **API servers** handle everything except video bytes: the video record, upload URLs, titles, search, comments, and the manifest address for playback.
- **The metadata DB** keeps one record for each video: owner, title, state, the list of renditions, and the storage location. A cache in front of it serves the hot reads.
- **Raw object storage** keeps the source file exactly as the creator sent it. Keep it, so that you can transcode again later with a better codec.
- **The transcode queue and pipeline** turn one source file into many encoded files.
- **Origin storage** keeps the encoded files. It is the source for the CDN.
- **The CDN** keeps copies near viewers, in many regions. The player fetches video bytes from the CDN, never from the API servers.

## Deep dives

### Upload: pre-signed URLs and resumable upload

A video file of several gigabytes must not pass through the API servers. They would spend their time and memory moving bytes, and a deploy would break all uploads in progress.

Use a **pre-signed URL** instead:

1. The creator app asks the API for an upload. The API makes a video record in the state "uploading".
2. The API asks object storage for a pre-signed URL. This URL gives permission to write one object, for a short time, with no other credential.
3. The app uploads the file directly to object storage with that URL.
4. Object storage sends an event when the upload is complete. This event starts the pipeline.

For **resumable upload**, split the file into parts, for example of 10 MB each. Object storage services support this as multipart upload. Each part has its own pre-signed URL and its own retry. The app records which parts are done. After a lost connection, the app asks which parts the store has and sends only the rest. A lost connection at 90% then costs 10 MB, not the full file.

Also check the file before you accept it: its size, its type, and that the creator has quota. Clean up uploads that never complete, with an expiry rule on the bucket.

### The transcoding pipeline as a DAG

**Transcoding** decodes the source and encodes it again into other formats, resolutions, and bitrates. One source becomes many **renditions**: for example 240p, 480p, 720p, and 1080p, each in one or two codecs.

The work is a set of tasks with dependencies, so model it as a **DAG** (a directed acyclic graph: tasks with arrows, and no cycles). The DAG for one video can be:

```diagram
{
  "nodes": [
    { "id": "src", "label": "Source video", "shape": "store", "col": 0, "row": 1 },
    { "id": "inspect", "label": "Inspect\n(format, length)", "shape": "box", "col": 1, "row": 0 },
    { "id": "split", "label": "Split into\nsegments", "shape": "box", "col": 1, "row": 1 },
    { "id": "audio", "label": "Encode audio", "shape": "box", "col": 1, "row": 2 },
    { "id": "encode", "label": "Encode each segment\n(each rendition)", "shape": "box", "col": 2, "row": 1 },
    { "id": "thumb", "label": "Thumbnails", "shape": "box", "col": 2, "row": 0 },
    { "id": "mark", "label": "Watermark", "shape": "box", "col": 2, "row": 2 },
    { "id": "pack", "label": "Package\n(HLS, DASH)", "shape": "box", "col": 3, "row": 1 }
  ],
  "edges": [
    { "from": "src", "to": "inspect" },
    { "from": "src", "to": "split" },
    { "from": "src", "to": "audio" },
    { "from": "inspect", "to": "thumb" },
    { "from": "split", "to": "encode" },
    { "from": "split", "to": "mark" },
    { "from": "mark", "to": "encode" },
    { "from": "audio", "to": "pack" },
    { "from": "encode", "to": "pack" }
  ]
}
```

Each creator or product can have a different DAG. A short clip can skip the watermark. A premium video can add a high-quality codec. Keep the DAG as configuration, not as code.

The parts of the pipeline:

- **A scheduler** reads the DAG for the video, puts ready tasks on a task queue, and starts the next tasks when their inputs are done.
- **Workers** take tasks from the queue. Use separate pools for separate task types, so that a long queue of encodes does not block thumbnails.
- **Temporary storage** keeps the outputs of each step, so that a failed step can run again from its inputs.

**Splitting gives parallel work.** A one-hour video takes a long time to encode on one machine. Split it into segments of a few seconds, at keyframe boundaries, and encode the segments on many workers at the same time. Then the time to "ready" depends on the segment, not on the length of the video.

The pipeline is a batch dataflow, as DDIA describes in the part on batch processing. Each task reads immutable input and writes new output. So a task that fails can run again safely, and the result is the same.

### Adaptive bitrate streaming

The network of a viewer changes all the time. A fixed quality either buffers on a slow network or looks bad on a fast one. **Adaptive bitrate streaming** solves this:

1. Each rendition is cut into short segments, typically a few seconds each.
2. A **manifest** lists the renditions and the address of each segment.
3. The player downloads the manifest, then the segments one by one, over normal HTTP.
4. The player measures its download speed and the size of its buffer. Before each segment, it picks the rendition that fits.

Two formats do this:

| Format | Origin           | Manifest     | Notes                                                     |
| ------ | ---------------- | ------------ | --------------------------------------------------------- |
| HLS    | Apple            | `.m3u8` text | Required for native playback on Apple devices             |
| DASH   | MPEG, a standard | `.mpd` XML   | Codec-neutral. Wide support on Android and in web players |

Many platforms produce both, or use a common segment format that both manifests can point to.

To **start in less than 2 seconds**: begin with a low rendition and move up, keep the first segment short, serve the manifest and first segments from the CDN, and fetch the first segment before the user presses play when the app can predict it.

Because the segments are normal HTTP files, any CDN can cache them. This is the main reason that HTTP-based streaming replaced special streaming servers.

### The CDN, the long tail, and cost

The views follow a **long tail**: a small share of videos gets most views, and most videos get very few. This shape decides the delivery plan.

- **Popular videos:** serve from the CDN. A segment that thousands watch is fetched from origin once for each edge and then served from the cache. The cost of each view is low, and the start time is fast.
- **Long-tail videos:** a video watched twice a month gets no use from a CDN cache. It falls out of the cache before the next view. Serve it from your own origin servers, perhaps with a regional cache. Origin capacity is often cheaper for this traffic than CDN delivery.
- **Regional popularity:** a video popular in one country does not need to be at CDN edges in other countries.

Other levers on cost:

- **Encode less for unpopular videos.** Produce only a few renditions at upload. Produce more, or a more efficient codec, when a video gets popular. A newer codec such as AV1 needs more CPU to encode but sends fewer bytes. That is a good trade only for videos that many people watch.
- **Encode on demand** for very short or very unpopular videos, if the start time allows.
- **Partner with network providers** to place caches in their networks. Very large platforms do this.

The order of costs, roughly: delivery is first, storage is second, and transcoding is third. Say this order in the interview, and then optimize the first item.

### Metadata, state, and errors

**The metadata store.** Video records are small, structured, and read far more than written. A relational database fits, with read replicas and a cache. Partition by video ID when one primary is not enough (see [Scaling data](/learn/scaling-data)). View counts and likes change very often. Do not update the video row for each view. Count views in a stream, and add them to the record in batches.

Give each video a clear state machine:

`uploading → uploaded → processing → ready`, with `failed` from any step.

The player and the creator's page show this state. The pipeline moves it forward with each event.

**Error handling.** Sort errors into two kinds:

| Error                                            | Kind            | Response                                                                |
| ------------------------------------------------ | --------------- | ----------------------------------------------------------------------- |
| Upload part fails                                | Recoverable     | Retry that part with backoff                                            |
| A worker crashes during an encode                | Recoverable     | The task times out and goes back to the queue. Another worker takes it. |
| Split or encode fails for one segment            | Recoverable     | Retry the task a few times, then mark the video failed                  |
| The file is not a video, or the format is broken | Not recoverable | Stop at once, mark the video failed, and tell the creator               |
| API server fails                                 | Recoverable     | The servers are stateless. The load balancer sends to another.          |
| Metadata primary fails                           | Recoverable     | Promote a replica                                                       |
| A CDN region has problems                        | Recoverable     | Send viewers to another region or to origin                             |

Each task must be safe to run twice, because a worker can crash after it writes its output and before it reports success. Write outputs to a path that depends on the video, the task, and the rendition. A second run then replaces the same file.

## Trade-offs and alternatives

| Decision         | This design                          | Alternative                   | When the alternative wins                              |
| ---------------- | ------------------------------------ | ----------------------------- | ------------------------------------------------------ |
| Upload path      | Pre-signed URL to object storage     | Upload through API servers    | Very small files, or strict inspection before storage  |
| Transcoding      | Own pipeline on own workers          | A managed cloud media service | Small team, moderate volume, or a need to go live fast |
| Renditions       | Few at upload, more when popular     | All renditions at upload      | Small catalog, or content that is always popular       |
| Delivery         | CDN for popular, origin for the tail | All from a CDN                | Smaller scale, where the CDN bill is not yet large     |
| Streaming format | HLS and DASH                         | One format only               | One device family only                                 |

The central trade-off is cost against start time for rarely watched videos. Origin delivery is cheaper but slower for a viewer far away. Most platforms accept a slower start for the long tail.

## What interviewers probe

**"Why not upload through the API servers?"**

- The servers would move gigabytes and hold connections for minutes.
- A pre-signed URL gives limited, short-lived permission to write one object.
- Multipart upload makes the upload resumable.

**"How do you make a one-hour video ready in minutes?"**

- Split at keyframes into segments, and encode them in parallel.
- Use a DAG of tasks with a scheduler and separate worker pools.
- Tasks read immutable inputs, so retries are safe.

**"How does the quality adapt to the network?"**

- Renditions cut into short segments, with a manifest.
- The player chooses each next segment from its measured speed and buffer.
- Name HLS and DASH.

**"What is the largest cost, and how do you reduce it?"**

- Delivery bandwidth, by a wide margin.
- Use the long tail: CDN for popular videos, origin for the rest.
- Encode efficient codecs only for videos that many people watch.

**"What occurs when a worker dies in the middle of an encode?"**

- The task lease expires, and the task returns to the queue.
- Output paths are fixed for each task, so a repeat replaces the file.
- Bad input fails fast and tells the creator.

## Go deeper

- System Design Interview (Alex Xu), Volume 1, the chapter on a video platform like YouTube: the upload flow, the transcoding DAG, and the cost optimizations for the long tail.
- Designing Data-Intensive Applications (Martin Kleppmann), the part on batch processing: dataflow with immutable inputs, and why that makes retries safe.
- DDIA, the part on partitioning: how to split the metadata and the view counts when one database is not enough.

## Further reading

- [Adaptive bitrate streaming](https://en.wikipedia.org/wiki/Adaptive_bitrate_streaming), [HTTP Live Streaming](https://en.wikipedia.org/wiki/HTTP_Live_Streaming), and [Dynamic Adaptive Streaming over HTTP](https://en.wikipedia.org/wiki/Dynamic_Adaptive_Streaming_over_HTTP) on Wikipedia
- [Content delivery network](https://en.wikipedia.org/wiki/Content_delivery_network) and [Long tail](https://en.wikipedia.org/wiki/Long_tail) on Wikipedia
- [Caching](/learn/caching), [Pipeline architecture](/learn/pipeline), and [Batch and stream processing](/learn/batch-and-stream) in this wiki
