import type { WorkedExample } from "./examples";
import type { Kata } from "./katas";

// Classic system design interview questions.
// The numbers are invented for practice. They are not the figures of a real company.
export const interviewKatas: Kata[] = [
  {
    id: "link-shortener",
    title: "Link Shortener",
    difficulty: "starter",
    interview: true,
    context:
      "Design a link shortener. A user gives a long URL and gets a short link. Anyone who opens the short link goes to the long URL.",
    users:
      "100 million new links each month. 100 reads for each write. About 4,000 redirects each second on average, with peaks ten times higher.",
    requirements: [
      "A short link must be as short as possible and must never point to two URLs.",
      "A redirect must be fast, anywhere in the world.",
      "A user can set a custom alias and an expiry date.",
      "The owner sees how many times a link was opened.",
    ],
    constraints: [
      "Links must work for at least five years.",
      "A redirect that fails loses the trust of the customer who shared the link.",
    ],
  },
  {
    id: "chat-messaging",
    title: "Chat Messaging",
    difficulty: "medium",
    interview: true,
    context:
      "Design a chat application for phones. Users send text messages to one person or to a group.",
    users:
      "50 million users each day. Each user sends 40 messages each day. Groups have up to 200 members.",
    requirements: [
      "A message arrives in less than one second when the receiver is online.",
      "A user who is offline gets all missed messages on return.",
      "Messages in one conversation show in the same order for all members.",
      "The sender sees if a message was sent, delivered, and read.",
    ],
    constraints: [
      "Phones change networks and lose the connection often.",
      "A message must never be lost after the sender sees 'sent'.",
    ],
  },
  {
    id: "news-feed",
    title: "News Feed",
    difficulty: "hard",
    interview: true,
    context:
      "Design the home feed of a social network. A user posts short messages. Each user sees a feed with recent posts from the people they follow.",
    users:
      "200 million users each day. A typical user follows 200 people. A few accounts have more than 50 million followers. Users read the feed far more often than they post.",
    requirements: [
      "The feed opens in less than 200 milliseconds.",
      "A new post shows in the feeds of followers within one minute.",
      "Posts have text and one image.",
    ],
    constraints: [
      "A post from an account with 50 million followers must not slow the system for other users.",
      "A feed that is a few seconds old is acceptable.",
    ],
  },
  {
    id: "video-streaming",
    title: "Video Streaming",
    difficulty: "hard",
    interview: true,
    context:
      "Design a video platform. Creators upload videos. Viewers watch them on phones, computers, and televisions.",
    users: "500 hours of video are uploaded each minute. 100 million viewers each day.",
    requirements: [
      "A viewer can start a video in less than two seconds.",
      "Video quality adapts to the network speed of the viewer.",
      "An uploaded video is ready to watch within some minutes.",
      "An upload of a large file can continue after a lost connection.",
    ],
    constraints: [
      "Video files are large. One hour of source video can be several gigabytes.",
      "Most views go to a small number of popular videos.",
    ],
  },
  {
    id: "notification-service",
    title: "Notification Service",
    difficulty: "medium",
    interview: true,
    context:
      "Design a notification service for a company with many products. A product team sends one request, and the service delivers the message to the user by push, SMS, or email.",
    users:
      "10 million notifications each day. Some are urgent, such as login codes. Most are not, such as weekly summaries.",
    requirements: [
      "A login code arrives in less than 10 seconds.",
      "A user selects which notifications to receive and on which channel.",
      "A user must not receive the same notification twice.",
      "Product teams can add a new channel, such as a chat app, without a change to their code.",
    ],
    constraints: [
      "The service sends through external providers that fail and limit the send rate.",
      "A marketing campaign can create 2 million notifications in one minute.",
    ],
  },
  {
    id: "payment-system",
    title: "Payment System",
    difficulty: "hard",
    interview: true,
    context:
      "Design the payment system of an online shop. A customer pays for an order by card. The shop pays the money out to sellers later.",
    users:
      "One million payments each day. About 12 each second on average, and 100 each second during sales.",
    requirements: [
      "A customer is never charged twice for one order.",
      "Each movement of money is recorded and can be explained later.",
      "A payment can be refunded in full or in part.",
      "The shop finds out when its records and the records of the card provider do not agree.",
    ],
    constraints: [
      "The card provider is an external system. A request to it can time out with no answer.",
      "Card data must not be stored by the shop.",
    ],
  },
];

export const interviewExamples: WorkedExample[] = [
  {
    kataId: "link-shortener",
    hardParts: [
      {
        quote: "100 reads for each write",
        meaning:
          "The redirect is the system. Design the read path first and make it as short as possible. Link creation can be slower and simpler.",
      },
      {
        quote: "must never point to two URLs",
        meaning:
          "Many servers create codes at the same time, and no two of them can produce the same code. The method that generates codes is the main design decision.",
      },
      {
        quote: "Links must work for at least five years.",
        meaning:
          "100 million links each month for five years is 6 billion links. That is a few terabytes, too much for one database server. A code of 7 letters and digits gives 3.5 trillion values, which is enough.",
      },
      {
        quote: "The owner sees how many times a link was opened.",
        meaning:
          "Each redirect creates a count. If the redirect waits for the count to be written, the fast path becomes a slow path.",
      },
    ],
    characteristics: [
      {
        name: "Performance",
        why: "A redirect is a delay before the page the user wants. Ties to 'a redirect must be fast'.",
      },
      {
        name: "Availability",
        why: "A dead short link breaks each place where it was shared. Ties to the trust constraint.",
      },
      {
        name: "Scalability",
        why: "6 billion links and peaks of 40,000 redirects each second. Ties to the numbers.",
      },
    ],
    style: {
      name: "Layered",
      why: "The application has two operations: create a link and follow a link. One small application with normal layers is enough. It keeps no state in memory, so many identical copies run behind a load balancer. The hard parts are in the data: a cache for popular links, a key-value store split across many servers, and an ID service that gives each copy its own block of numbers. A copy converts the next number in its block to a short code, so two copies can never produce the same code.",
      rejected: [
        {
          name: "Microservices",
          why: "There are two operations. A split gives more network calls and more to operate, and no benefit.",
        },
        {
          name: "Event-driven",
          why: "A redirect needs an immediate answer. Only the click count is a natural event, and the design does use a queue for that one part.",
        },
      ],
    },
    diagram: {
      nodes: [
        { id: "browser", label: "Browser", col: 0, row: 0 },
        { id: "lb", label: "Load balancer", col: 1, row: 0 },
        { id: "app", label: "Link application\n(many identical copies)", col: 2, row: 0 },
        { id: "cache", label: "Cache\n(popular links)", col: 3, row: 0 },
        { id: "ids", label: "ID service\n(gives number blocks)", col: 1, row: 1.2 },
        { id: "store", label: "Link store\n(key-value, many servers)", col: 2, row: 1.2 },
        { id: "queue", label: "Click queue", col: 3, row: 1.2 },
        { id: "counter", label: "Click counter\n(statistics database)", col: 3, row: 2.4 },
      ],
      edges: [
        { from: "browser", to: "lb", label: "open, create" },
        { from: "lb", to: "app" },
        { from: "app", to: "cache", label: "look up" },
        { from: "app", to: "store", label: "read, write" },
        { from: "app", to: "ids", label: "next block" },
        { from: "app", to: "queue", label: "click", async: true },
        { from: "queue", to: "counter", label: "in batches", async: true },
      ],
    },
    walkthrough: [
      "Follow a redirect first: browser, load balancer, application, cache. For a popular link, the request ends there. The link store is read only when the cache does not have the code.",
      "The application sends the click to a queue with a dashed arrow and answers the browser immediately. A separate counter reads the queue and adds up the clicks.",
      "To create a link, the application takes the next number from its block, converts it to a short code, and writes the code and the URL to the link store.",
      "The ID service is used rarely. Each copy asks for a block of, for example, 10,000 numbers and uses it for a long time.",
      "The link store finds a record by its code. That is the only query, so a simple key-value store split across servers is enough.",
    ],
    tradeoffs: [
      "Click counts are some seconds late, and a crash can lose a few. This is acceptable because the count is a statistic and the redirect is the product.",
      "Codes made from a counter are easy to guess in sequence. The design scrambles the number before it becomes a code. This is acceptable if links are not secrets.",
      "A changed or deleted link stays in the cache for a short time. A cache lifetime of some minutes is acceptable for a rare operation.",
      "The redirect uses a temporary redirect, so browsers ask again each time. This gives correct click counts and costs more requests.",
    ],
    risks: [
      "The cache fails and all reads go to the link store. The store must have the capacity to carry the full read load for a short time.",
      "The ID service is down. The copies continue with the blocks they already have, so the service has hours to recover.",
      "People use the service to hide harmful links. A check against a block list at creation is necessary before launch.",
    ],
    reviewQuestions: [
      "Two copies of the application create a link in the same millisecond. Show why they cannot produce the same code.",
      "A famous person shares one link, and it gets 50,000 opens each second. Which box carries that load?",
      "A user asks for a custom alias that is equal to a code the counter will generate next year. What occurs?",
    ],
    alternative: {
      title: "A different, valid answer: codes from a hash",
      body: "Calculate a hash of the long URL and use its first 7 characters as the code. This removes the ID service, and the same URL always gets the same code. The price is a check on each creation, because two URLs can produce the same 7 characters, and two users cannot have separate links, with separate statistics, to one URL. It is a good answer when you want fewer moving parts and statistics are not important.",
    },
  },
  {
    kataId: "chat-messaging",
    hardParts: [
      {
        quote: "arrives in less than one second when the receiver is online",
        meaning:
          "The server must push the message to the phone. Each online phone keeps one connection open to a server. The system must know which server holds the connection of which user.",
      },
      {
        quote: "A user who is offline gets all missed messages on return.",
        meaning:
          "Store first, deliver second. Delivery to an online phone is only a fast path. The stored conversation is the truth, and each phone remembers the last message it has.",
      },
      {
        quote: "show in the same order for all members",
        meaning:
          "Phone clocks are not reliable. The server gives each message the next sequence number of its conversation, and all phones sort by that number.",
      },
      {
        quote: "A message must never be lost after the sender sees 'sent'.",
        meaning:
          "The server confirms only after the message is written to durable storage. The phone sends again until it gets the confirmation, with the same message ID, so a repeat is dropped.",
      },
    ],
    characteristics: [
      {
        name: "Performance",
        why: "One second from sender to receiver. Ties to the first requirement.",
      },
      {
        name: "Fault tolerance",
        why: "Connections drop all the time, and that must be a normal case. Ties to 'phones change networks'.",
      },
      {
        name: "Data consistency",
        why: "No lost message and one order for all members. Ties to the order requirement and the 'never lost' constraint.",
      },
    ],
    style: {
      name: "Event-driven",
      why: "A message is an event with several independent reactions: store it, push it to each online member, wake the phone of each offline member, update the 'delivered' and 'read' marks. The message service stores the message and publishes it to a broker. Connection servers and the push notifier react on their own. A slow or failed reaction does not block the sender, and the stored message lets each reaction be repeated.",
      rejected: [
        {
          name: "Layered, with phones that ask for new messages",
          why: "If each phone asks every second, the servers answer 'nothing new' millions of times. If phones ask less often, messages are late.",
        },
        {
          name: "Space-based",
          why: "It keeps data in memory for speed. That conflicts with 'never lost', and the load here is steady, not a sudden peak.",
        },
      ],
    },
    diagram: {
      nodes: [
        { id: "sender", label: "Sender phone", col: 0, row: 0 },
        { id: "conn", label: "Connection servers\n(open connections)", col: 1, row: 0 },
        { id: "service", label: "Message service\n(order, then store)", col: 2, row: 0 },
        { id: "store", label: "Message store\n(by conversation)", col: 3, row: 0 },
        { id: "receiver", label: "Receiver phone", col: 0, row: 1.2 },
        { id: "registry", label: "Session registry\n(user to server)", col: 1, row: 1.2 },
        { id: "broker", label: "Message broker", col: 2, row: 1.2 },
        { id: "notifier", label: "Push notifier", col: 2, row: 2.4 },
        { id: "push", label: "Apple / Google\npush service", col: 3, row: 2.4, external: true },
      ],
      edges: [
        { from: "sender", to: "conn", label: "send" },
        { from: "conn", to: "service", label: "message" },
        { from: "service", to: "store", label: "write first" },
        { from: "service", to: "broker", label: "new message", async: true },
        { from: "broker", to: "conn", label: "deliver", async: true },
        { from: "conn", to: "receiver", label: "push" },
        { from: "conn", to: "registry", label: "who is where" },
        { from: "broker", to: "notifier", label: "user offline", async: true },
        { from: "notifier", to: "push", label: "wake phone" },
      ],
    },
    walkthrough: [
      "Top row, left to right: the sender phone sends on its open connection. The message service gives the message a sequence number and writes it to the store. Only then does the sender see 'sent'.",
      "The message service publishes the message to the broker with a dashed arrow. From here, nothing blocks the sender.",
      "The broker gives the message to the connection server that holds the connection of the receiver. The session registry knows which server that is.",
      "If the receiver has no connection, the push notifier asks Apple or Google to wake the phone. The phone then connects and asks for all messages after the last one it has.",
      "'Delivered' and 'read' marks go the same way in the opposite direction, as small events.",
    ],
    tradeoffs: [
      "A message can reach a phone twice, for example after a reconnect. This is acceptable because each message has an ID and the phone ignores an ID it already has.",
      "One sequence per conversation means one writer for each conversation at a time. This is acceptable because one conversation has little traffic, and different conversations are independent.",
      "Millions of open connections make deployments slow, because each restart disconnects phones. This is acceptable with a slow restart of a few servers at a time.",
    ],
    risks: [
      "A connection server fails with 100,000 open connections. All those phones reconnect in the same second. Phones must wait a random time before they reconnect.",
      "The session registry has old data and the broker sends to the wrong server. The message is not lost, because the phone gets it from the store on the next sync.",
      "A group of 200 members creates 200 deliveries for each message. A few very active groups can fill the broker. Delivery needs a limit for each group.",
    ],
    reviewQuestions: [
      "The sender has a weak network and sends the same message three times. How many messages does the receiver see, and why?",
      "A user has a phone and a tablet. Both were offline. Follow what each device does on return.",
      "Two members of a group send at the same moment. Who decides the order, and what do the two senders see?",
    ],
    alternative: {
      title: "A different, valid answer: no broker",
      body: "The message service reads the session registry and calls the correct connection server directly. This removes one component and one hop, so it is simpler and a little faster. The price is that the message service must handle retries and slow connection servers itself, and each new reaction, such as a search index, needs a code change in the message service. It is a good first version for a smaller product.",
    },
  },
  {
    kataId: "news-feed",
    hardParts: [
      {
        quote: "Users read the feed far more often than they post.",
        meaning:
          "Do the work when a post is written, not when a feed is read. Each user gets a list that is prepared in advance.",
      },
      {
        quote: "The feed opens in less than 200 milliseconds.",
        meaning:
          "There is no time to collect posts from 200 authors and sort them. The read must be one lookup of a ready list in memory.",
      },
      {
        quote: "A few accounts have more than 50 million followers.",
        meaning:
          "Prepared lists break here. One post would cause 50 million list updates. These accounts need a different path.",
      },
      {
        quote: "A feed that is a few seconds old is acceptable.",
        meaning:
          "This sentence permits background work and caches. Without it, the design would be much harder.",
      },
    ],
    characteristics: [
      {
        name: "Performance",
        why: "200 milliseconds for the most frequent operation. Ties to the first requirement.",
      },
      {
        name: "Scalability",
        why: "200 million users, each with a prepared feed. Ties to the user numbers.",
      },
      {
        name: "Elasticity",
        why: "One post from a very large account is a sudden burst of work. Ties to the 50 million followers constraint.",
      },
    ],
    style: {
      name: "Service-based",
      why: "Three areas have clear and different jobs: posts (write and store), follows (who follows whom), and feeds (a ready list for each user). Each is one coarse service with its data. A queue and a group of workers connect them: when a post is created, workers add its ID to the feed list of each follower. For accounts with millions of followers, the workers do nothing. The feed service adds the recent posts of those accounts when the feed is read.",
      rejected: [
        {
          name: "Layered with one database",
          why: "The feed becomes one large query over follows and posts on each read. It is correct and far too slow at this size.",
        },
        {
          name: "Microservices",
          why: "Three services and a worker group already separate the load. Smaller services add calls to the 200 millisecond path.",
        },
      ],
    },
    diagram: {
      nodes: [
        { id: "app", label: "Phone app", col: 0, row: 0 },
        { id: "gateway", label: "API gateway", col: 1, row: 0 },
        { id: "posts", label: "Post service\n(posts database)", col: 2, row: 0 },
        { id: "images", label: "Image storage\n+ CDN", col: 3, row: 0 },
        { id: "feed", label: "Feed service", col: 1, row: 1.2 },
        { id: "queue", label: "Fan-out queue", col: 2, row: 1.2 },
        { id: "follows", label: "Follow service\n(who follows whom)", col: 3, row: 1.2 },
        { id: "cache", label: "Feed cache\n(one list for each user)", col: 1, row: 2.4 },
        { id: "workers", label: "Fan-out workers", col: 2, row: 2.4 },
      ],
      edges: [
        { from: "app", to: "gateway", label: "post, read" },
        { from: "gateway", to: "posts", label: "new post" },
        { from: "posts", to: "images", label: "image" },
        { from: "gateway", to: "feed", label: "get feed" },
        { from: "feed", to: "cache", label: "read list" },
        { from: "feed", to: "posts", label: "post details" },
        { from: "posts", to: "queue", label: "post created", async: true },
        { from: "queue", to: "workers", label: "job", async: true },
        { from: "workers", to: "follows", label: "followers?" },
        { from: "workers", to: "cache", label: "add post ID" },
      ],
    },
    walkthrough: [
      "Read path: app, gateway, feed service, feed cache. The cache holds a list of post IDs for each user. The feed service then gets the text of those posts from the post service.",
      "Write path: app, gateway, post service. The post is stored, and the user gets an answer. All other work is behind the dashed arrow.",
      "The fan-out workers take each new post, ask the follow service for the followers, and add the post ID to the list of each follower. 'Fan-out' means one input that spreads to many outputs.",
      "For an account with millions of followers, the workers skip the fan-out. The feed service reads the recent posts of those accounts directly and merges them into the list at read time.",
      "Images go to storage with a CDN, a network of servers that keeps copies near the users. The services handle only text and IDs.",
    ],
    tradeoffs: [
      "A post reaches the feeds after seconds, not immediately. The kata permits this, and the author sees the post immediately on their own device.",
      "The feed cache stores a list for each user, also for users who do not open the app for weeks. Lists of inactive users are removed and built again on return.",
      "Two paths, prepared lists and read-time merge, mean two sets of faults. This is acceptable because neither path alone meets both the speed and the large-account requirements.",
    ],
    risks: [
      "The fan-out queue grows faster than the workers empty it. Feeds become minutes old. The delay of the queue must be measured, and workers added automatically.",
      "The feed cache loses its data. Each list must be built again from the follow and post services. The rebuild needs a rate limit, or it overloads those services.",
      "The limit that separates large accounts from normal ones is wrong. Too low gives slow reads. Too high gives fan-out bursts. It must be a setting that can change without a release.",
    ],
    reviewQuestions: [
      "A user with 50 million followers posts. Follow the post to the screen of one follower.",
      "A user follows a new account. When do the old posts of that account show in the feed, and who puts them there?",
      "A post is deleted. Its ID is in millions of lists. What do you do?",
    ],
    alternative: {
      title: "A different, valid answer: build each feed at read time",
      body: "Store nothing for each user. When a feed is read, get the recent posts of each followed account from a fast index and merge them. This removes the fan-out workers, the queue, and the large cache, and a new post is visible immediately. The price is a much heavier read, so it works only with a strong cache of recent posts for each author, and it gets slow for users who follow thousands of accounts. It is a good answer for a network with fewer users or fewer follows.",
    },
  },
  {
    kataId: "video-streaming",
    hardParts: [
      {
        quote: "Video quality adapts to the network speed of the viewer.",
        meaning:
          "Each video is stored in several qualities, and each quality is cut into segments of a few seconds. The player selects the quality again for each segment. This is called adaptive streaming.",
      },
      {
        quote: "500 hours of video are uploaded each minute.",
        meaning:
          "Conversion to several qualities needs a lot of computing power, and the work never stops. It must be a line of jobs with many workers, not a task in the upload request.",
      },
      {
        quote: "Most views go to a small number of popular videos.",
        meaning:
          "Copies of the popular segments near the viewers serve most of the traffic. A CDN, a network of servers around the world, does this. The application servers never send video data.",
      },
      {
        quote: "An upload of a large file can continue after a lost connection.",
        meaning:
          "The file is sent in parts, and the storage keeps the parts that arrived. After a failure, only the missing parts are sent again.",
      },
    ],
    characteristics: [
      {
        name: "Performance",
        why: "Two seconds to the first picture, on any network. Ties to the first two requirements.",
      },
      {
        name: "Scalability",
        why: "A constant flow of very large files in, and 100 million viewers out. Ties to the numbers.",
      },
      {
        name: "Fault tolerance",
        why: "A conversion job runs for minutes on many machines. One failed step must repeat alone. Ties to 'ready to watch within some minutes'.",
      },
    ],
    style: {
      name: "Pipeline",
      why: "The hard part is the upload processing, and it is data that flows in one direction: check the file, split it into chunks, convert each chunk to each quality, package the segments, publish. Each step is a small worker that reads from the step before it. Steps scale on their own, and a failed step repeats without a restart of the full job. The viewing side is a simple read path: a catalog service gives the player a list of segments, and the CDN delivers them.",
      rejected: [
        {
          name: "Layered",
          why: "One application that converts video in the upload request cannot survive a file of several gigabytes. The request would run for many minutes.",
        },
        {
          name: "Microservices",
          why: "Independent services do not help with the main problem. The steps depend on each other in a fixed order, which is exactly what a pipeline describes.",
        },
      ],
    },
    diagram: {
      nodes: [
        { id: "creator", label: "Creator", col: 0, row: 0 },
        { id: "upload", label: "Upload service\n(file in parts)", col: 1, row: 0 },
        { id: "source", label: "Source storage", col: 2, row: 0 },
        { id: "queue", label: "Job queue", col: 3, row: 0 },
        { id: "vstore", label: "Video storage\n(segments)", col: 0, row: 1.2 },
        { id: "package", label: "Package\n(segments + list)", col: 1, row: 1.2 },
        { id: "transcode", label: "Convert\n(each quality)", col: 2, row: 1.2 },
        { id: "split", label: "Check + split\n(into chunks)", col: 3, row: 1.2 },
        { id: "cdn", label: "CDN\n(copies near viewers)", col: 0, row: 2.4 },
        { id: "viewer", label: "Viewer", col: 1, row: 2.4 },
        { id: "catalog", label: "Catalog service\n(titles, segment lists)", col: 2, row: 2.4 },
      ],
      edges: [
        { from: "creator", to: "upload", label: "file parts" },
        { from: "upload", to: "source", label: "store" },
        { from: "source", to: "queue", label: "new upload", async: true },
        { from: "queue", to: "split", label: "job", async: true },
        { from: "split", to: "transcode", label: "chunks", async: true },
        { from: "transcode", to: "package", label: "converted", async: true },
        { from: "package", to: "vstore", label: "write" },
        { from: "package", to: "catalog", label: "video ready", async: true },
        { from: "vstore", to: "cdn", label: "copy" },
        { from: "cdn", to: "viewer", label: "segments" },
        { from: "viewer", to: "catalog", label: "find, play" },
      ],
    },
    walkthrough: [
      "The diagram is one long line. Top row, left to right: the upload. Middle row, right to left: the processing. Bottom row: the viewing.",
      "The creator sends the file in parts. When the last part arrives, the source storage puts a job in the queue.",
      "'Check + split' cuts the video into chunks. Many 'Convert' workers process the chunks at the same time, one output for each quality. This is why a long video is ready in minutes.",
      "'Package' cuts the result into segments of a few seconds and writes a list of them. Then it tells the catalog that the video is ready.",
      "A viewer asks the catalog for the list, and then gets each segment from the CDN. The player selects a lower quality when the network is slow.",
    ],
    tradeoffs: [
      "A video is not available immediately after upload. The kata permits 'some minutes', and the creator sees a progress status.",
      "Each video is stored many times, once for each quality. Storage cost is high. This is acceptable because computing each quality at view time is slower and costs more.",
      "A pipeline has a fixed order. A new step, such as subtitle creation, is easy to add, but a step that needs a decision from a person does not fit well.",
    ],
    risks: [
      "One chunk fails to convert each time, for example a damaged file. After some attempts, the job must stop with a clear message to the creator and not block the workers.",
      "A new video becomes popular in minutes, before the CDN has copies. The first viewers all reach the video storage. The CDN must fetch each segment once and share it.",
      "Uploads double during a large event. The queue grows and videos are ready late. The number of 'Convert' workers must follow the queue length.",
    ],
    reviewQuestions: [
      "The 'Convert' worker for chunk 37 of 200 fails. What is repeated, and what is not?",
      "A viewer on a train goes from a fast network to a slow one. Which box reacts, and how fast?",
      "How do you make the first seconds of a video start fast, when the full video has hundreds of segments?",
    ],
    alternative: {
      title: "A different, valid answer: convert only what is watched",
      body: "Convert each upload to one or two common qualities only. Create the other qualities the first time a viewer needs them, and keep the result. Most videos get very few views, so this saves a large part of the computing and storage cost. The price is a slow start for the first viewer of a rare quality, and a more complex viewing path. It is a good answer when cost matters more than a perfect first view.",
    },
  },
  {
    kataId: "notification-service",
    hardParts: [
      {
        quote: "add a new channel, such as a chat app, without a change to their code",
        meaning:
          "Product teams must name the type of message, for example 'login code', and not the channel. Each channel must be a part that plugs in behind one contract.",
      },
      {
        quote: "external providers that fail and limit the send rate",
        meaning:
          "The service cannot send at its own speed. It needs a queue in front of each provider, repeats with a growing wait, and a second provider for the important channels.",
      },
      {
        quote: "A marketing campaign can create 2 million notifications in one minute.",
        meaning:
          "A login code must not wait behind two million marketing messages. Urgent and bulk traffic need separate queues.",
      },
      {
        quote: "A user must not receive the same notification twice.",
        meaning:
          "Repeats after a failure create duplicates. Each notification needs a unique key, and the service must record the key before it sends.",
      },
    ],
    characteristics: [
      {
        name: "Extensibility",
        why: "New channels and new products arrive all the time. Ties to the 'new channel' requirement.",
      },
      {
        name: "Fault tolerance",
        why: "Providers fail and slow down, and messages must still arrive. Ties to the provider constraint.",
      },
      {
        name: "Elasticity",
        why: "Two million messages in one minute, then almost nothing. Ties to the campaign constraint.",
      },
    ],
    style: {
      name: "Microkernel",
      why: "The service has a stable core and a part that varies. The core accepts a request, reads the choices of the user, selects the channel, fills the message template, and puts the result in a queue. Each channel is a plug-in with one contract: send this message, and report the result. A new channel is a new plug-in and a new template. The product teams change nothing. Queues between the core and the plug-ins absorb the bursts and the provider failures.",
      rejected: [
        {
          name: "Layered, with a direct call to the provider",
          why: "The product service waits while the provider answers. A slow provider then slows each product, and a failed send is lost.",
        },
        {
          name: "Microservices, one for each channel",
          why: "It gives the same extension point at a much higher operating cost. The channels share almost all their logic.",
        },
      ],
    },
    diagram: {
      nodes: [
        { id: "products", label: "Product services", col: 0, row: 0 },
        { id: "api", label: "Notification API\n(accept, check key)", col: 1, row: 0 },
        { id: "core", label: "Core\n(rules, templates, log)", col: 2, row: 0 },
        { id: "prefs", label: "User choices", col: 3, row: 0 },
        { id: "queues", label: "Queues\n(urgent, bulk)", col: 2, row: 1.2 },
        { id: "pushp", label: "Push plug-in", col: 1, row: 2.4 },
        { id: "smsp", label: "SMS plug-in", col: 2, row: 2.4 },
        { id: "emailp", label: "Email plug-in", col: 3, row: 2.4 },
        { id: "pushx", label: "Apple / Google", col: 1, row: 3.6, external: true },
        { id: "smsx", label: "SMS provider", col: 2, row: 3.6, external: true },
        { id: "emailx", label: "Email provider", col: 3, row: 3.6, external: true },
      ],
      edges: [
        { from: "products", to: "api", label: "send request" },
        { from: "api", to: "core", label: "accepted" },
        { from: "core", to: "prefs", label: "read" },
        { from: "core", to: "queues", label: "message", async: true },
        { from: "queues", to: "pushp", async: true },
        { from: "queues", to: "smsp", label: "urgent first", async: true },
        { from: "queues", to: "emailp", async: true },
        { from: "pushp", to: "pushx", label: "send" },
        { from: "smsp", to: "smsx", label: "send" },
        { from: "emailp", to: "emailx", label: "send" },
      ],
    },
    walkthrough: [
      "A product service sends one request with a user, a message type, the data, and a unique key. The API answers immediately. The product does not wait for the delivery.",
      "The core reads the choices of the user. If the user turned this message type off, the work stops here. If not, the core selects the channel and fills the template.",
      "The message goes to the urgent queue or the bulk queue. Plug-ins always empty the urgent queue first.",
      "Each plug-in knows one provider. It sends at the rate the provider permits, repeats after a failure, and writes the result to the log in the core.",
      "A new channel is a fourth box in the plug-in row and a provider below it. No other box changes.",
    ],
    tradeoffs: [
      "The product service does not know if the message arrived. It can only ask for the status later. This is acceptable because a delivery can take minutes, and no request can wait that long.",
      "A bulk message can wait a long time behind a campaign. This is acceptable for weekly summaries. A message type that cannot wait must be declared urgent.",
      "A provider can accept a message and then fail to deliver it. The service records what the provider reports and cannot do more.",
    ],
    risks: [
      "The plug-in sends, and then fails before it records the result. On repeat, the user gets the message twice. The plug-in must give the unique key to the provider when the provider supports that.",
      "The SMS provider is down during a login peak. The plug-in must change to a second provider after a few failures.",
      "A product sends two million urgent messages by mistake. Each product needs a limit for urgent traffic.",
    ],
    reviewQuestions: [
      "A campaign of two million emails starts. Ten seconds later, a user asks for a login code by SMS. Follow both.",
      "The email provider answers 'too many requests' for ten minutes. What does a waiting message do?",
      "What exactly must a developer write to add a chat app as a channel?",
    ],
    alternative: {
      title: "A different, valid answer: event-driven with no core",
      body: "Products publish events such as 'login code requested' to a shared stream. Each channel service listens and decides alone if and how to send. This gives full independence between channels. The price is that the user choices, the duplicate check, and the templates are now spread across the channel services, and it is hard to answer 'what did this user receive?'. It fits a company where separate teams own the channels.",
    },
  },
  {
    kataId: "payment-system",
    hardParts: [
      {
        quote: "A request to it can time out with no answer.",
        meaning:
          "After a timeout, the shop does not know if the card was charged. It must never guess. It asks the provider for the status, or repeats the request with the same unique key.",
      },
      {
        quote: "A customer is never charged twice for one order.",
        meaning:
          "Customers click twice, and networks repeat requests. Each payment attempt has one unique key that goes from the checkout page to the card provider. A second request with the same key returns the first result.",
      },
      {
        quote: "Each movement of money is recorded and can be explained later.",
        meaning:
          "This asks for a ledger: a list of money movements where records are only added, never changed. A balance is the sum of the records, not a number that is overwritten.",
      },
      {
        quote: "finds out when its records and the records of the card provider do not agree",
        meaning:
          "The system must not trust itself. Each day, a job compares the ledger with the report from the provider and lists each difference.",
      },
    ],
    characteristics: [
      {
        name: "Data consistency",
        why: "The payment state and the ledger must always agree. Ties to 'never charged twice'.",
      },
      {
        name: "Auditability",
        why: "Each movement must be explained later. Ties to the ledger requirement.",
      },
      {
        name: "Fault tolerance",
        why: "The provider times out, and the system must reach a known state without a person. Ties to the provider constraint.",
      },
    ],
    style: {
      name: "Modular monolith",
      why: "Twelve payments each second is a small load. The problem is correctness, not size. One application with one database can change the state of a payment and add the ledger records in a single transaction, so they can never disagree. The modules are payments (the states of one payment), ledger (the money records), payouts (money to sellers), and reconciliation (the daily comparison). Each module owns its tables and talks to the others through explicit functions.",
      rejected: [
        {
          name: "Microservices",
          why: "A split between payments and ledger removes the single transaction. The system would then need extra machinery to repair the cases where one write succeeded and the other failed.",
        },
        {
          name: "Event-driven",
          why: "Data that agrees only after a delay is hard to audit when the data is money. Events are still useful at the edge, to tell the order system that a payment is complete.",
        },
      ],
    },
    diagram: {
      nodes: [
        { id: "checkout", label: "Checkout\n(order service)", col: 1, row: 0 },
        { id: "ledger", label: "Ledger\n(records only added)", col: 0, row: 1.6 },
        { id: "payments", label: "Payments\n(states of a payment)", col: 1, row: 1.6 },
        { id: "provider", label: "Card provider", col: 2.3, row: 1.6, external: true },
        { id: "payouts", label: "Payouts", col: 0, row: 2.6 },
        { id: "recon", label: "Reconciliation\n(daily comparison)", col: 1, row: 2.6 },
        { id: "bank", label: "Bank", col: 0, row: 3.9, external: true },
        { id: "db", label: "Database", col: 1, row: 3.9 },
      ],
      groups: [{ id: "app", label: "One deployment", col: 0, row: 1.6, cols: 2, rows: 2 }],
      edges: [
        { from: "checkout", to: "payments", label: "pay, with key" },
        { from: "payments", to: "provider", label: "charge" },
        { from: "payments", to: "ledger", label: "records" },
        { from: "payouts", to: "ledger", label: "records" },
        { from: "provider", to: "recon", label: "daily report", async: true },
        { from: "payouts", to: "bank", label: "transfers" },
        { from: "app", to: "db", label: "one transaction" },
      ],
    },
    walkthrough: [
      "The large box is one deployment. The four boxes in it are modules that share one database.",
      "The checkout sends 'pay' with a unique key. The payments module saves the payment as 'started' before it calls the card provider. This record is what makes a repeat safe.",
      "When the provider answers, the payments module changes the state and adds the ledger records in one transaction. If the provider does not answer, the payment stays 'unknown', and a job asks the provider for the status.",
      "The card number never reaches this system. The customer types it into a form from the provider, and the shop gets only a token, a reference that is useless to a thief.",
      "Each day, the reconciliation module gets the report from the provider and compares it with the ledger, record by record.",
    ],
    tradeoffs: [
      "One deployment means a fault in payouts can stop payments. This is acceptable because several copies run, and the single transaction is worth more than the isolation.",
      "A payment can stay 'unknown' for some minutes after a timeout, and the customer waits. This is acceptable because the other option is a guess, and a wrong guess is a double charge or a free order.",
      "Ledger records are never changed, so a mistake is corrected with a new, opposite record. The ledger grows forever. This is the price of a history that can be trusted.",
    ],
    risks: [
      "The provider charged the card, but the answer was lost and the status job has a fault. The daily reconciliation finds this case. It is the last safety net, so its report must go to a person.",
      "A refund is requested twice. Refunds need the same unique key rule as payments.",
      "A sale raises the load to 100 payments each second, and the provider slows down. Open requests fill the application. Each call to the provider needs a time limit and a limit on parallel calls.",
    ],
    reviewQuestions: [
      "The customer clicks 'pay' twice in one second. Follow both requests.",
      "The provider call times out. Five minutes later, the customer tries again with a different card. What must the system do first?",
      "The reconciliation finds a charge at the provider that is not in the ledger. What are the possible causes, and what do you do?",
    ],
    alternative: {
      title: "A different, valid answer: a separate ledger service",
      body: "Make the ledger its own service with its own database, used by payments, payouts, and each future product that moves money. A large company needs this, because one trusted ledger for all products is worth a lot. The price is that a payment and its ledger records are no longer one transaction. The payments service must save each ledger request and send it again until the ledger confirms it. It is the better answer when several teams and products move money.",
    },
  },
];
