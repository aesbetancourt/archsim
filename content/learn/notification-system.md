## The question

Try the [Notification Service kata](/kata/notification-service) before you read this page.

"Design a notification system. Many services in the company send messages to users by mobile push, SMS, and email. Some messages are urgent, such as a login code. Some are bulk, such as a weekly digest."

The sending is the easy part. External providers do the last step. The hard part is everything around them: providers that fail and limit the rate, a campaign that floods the system while a login code waits, a user who gets the same message three times, and a user who said "no more email" and still gets email. Alex Xu describes this case in System Design Interview, the chapter on a notification system. This page uses its own numbers.

## Questions to ask first

Functional questions:

- **Which channels?** Assume iOS push, Android push, SMS, and email. Ask if more channels, such as a chat app, will come.
- **Who sends?** Internal services only, or also customers through a public API?
- **Which types?** Transactional messages (a login code, a receipt, a delivery update) and marketing messages (a sale, a digest) have different rules for urgency, consent, and law.
- **User control.** Can a user turn off a type of message, or a channel? Can a user set quiet hours?
- **Scheduling.** Can a sender ask for a delivery at a later time, or in the local morning of each user?
- **Tracking.** Does the sender need to know if a message was delivered, opened, or clicked?

Non-functional questions:

- **Scale and bursts.** How many messages each day, and what is the largest burst?
- **Latency.** Which messages have a time target, and what is it? A login code is useless after a minute.
- **Delivery promise.** Can a message be lost? Can it arrive twice? These two answers pull in opposite directions.
- **Cost.** SMS costs real money for each message. Email and push are almost free for each message.

The questions that change the design most are the delivery promise and the mix of urgent and bulk messages.

## Estimates

Assume these answers: 50 million notifications each day. 30 million push, 15 million email, 5 million SMS. A marketing campaign can create 3 million messages in five minutes.

| Quantity            | Arithmetic               | Result                                         |
| ------------------- | ------------------------ | ---------------------------------------------- |
| Average rate        | 50 million ÷ 100,000 s   | About 500 each second                          |
| Campaign burst      | 3 million ÷ 300 s        | About 10,000 each second, 20 times the average |
| SMS rate            | 5 million ÷ 100,000 s    | About 50 each second                           |
| Log of each message | 50 million × 1 KB        | About 50 GB each day                           |
| Log for 90 days     | 50 GB × 90               | About 4.5 TB                                   |
| SMS cost (rough)    | 5 million × 1 to 5 cents | About 50,000 to 250,000 dollars each day       |

What the numbers say:

- The average load is small. The burst is the design problem. A queue must absorb it.
- The burst is bulk mail. If urgent and bulk messages share one queue, a login code waits behind 3 million marketing emails. They must not share one queue.
- SMS cost makes duplicates and wasted sends a money problem, not only a user problem.
- The log is too large for a small database after some months. Keep recent records in a fast store and move old ones to cheap storage.

## The first design

```diagram
{
  "nodes": [
    { "id": "svc", "label": "Calling services\n(orders, login, marketing)", "shape": "box", "col": 0, "row": 0 },
    { "id": "api", "label": "Notification servers\n(API, checks, render)", "shape": "box", "col": 1, "row": 0 },
    { "id": "db", "label": "Users, devices,\nsettings, templates", "shape": "store", "col": 1, "row": 1.2 },
    { "id": "qpush", "label": "Push queues\n(urgent, bulk)", "shape": "pipe", "col": 2, "row": 0 },
    { "id": "qmail", "label": "Email and SMS queues\n(urgent, bulk)", "shape": "pipe", "col": 2, "row": 1.2 },
    { "id": "workers", "label": "Channel workers\n(send, retry)", "shape": "box", "col": 3, "row": 0.6 },
    { "id": "prov", "label": "Providers\n(APNs, FCM, SMS, email)", "shape": "external", "col": 3, "row": 1.8 },
    { "id": "log", "label": "Notification log\nand events", "shape": "store", "col": 2, "row": 2.4 },
    { "id": "user", "label": "User device", "shape": "device", "col": 3, "row": 3 }
  ],
  "edges": [
    { "from": "svc", "to": "api", "label": "send(user, type, data)" },
    { "from": "api", "to": "db", "label": "read (cached)" },
    { "from": "api", "to": "qpush", "async": true },
    { "from": "api", "to": "qmail", "async": true },
    { "from": "qpush", "to": "workers" },
    { "from": "qmail", "to": "workers" },
    { "from": "workers", "to": "prov", "label": "send" },
    { "from": "workers", "to": "log", "label": "status" },
    { "from": "prov", "to": "user", "label": "deliver" }
  ]
}
```

- **Calling services.** They know the event, not the channel. They send a user ID, a notification type, and the data for the template. They do not know the email address or the device token.
- **Notification servers.** A stateless API. They authenticate the caller, validate the request, check the settings of the user, find the contact details, render the template, and put one message on the right queue for each channel. Then they answer the caller.
- **Users, devices, settings, templates.** The data that the servers need on each request. It changes rarely, so the servers read it through a cache.
- **Queues for each channel.** One queue for each channel and each priority. A slow email provider then fills only the email queue, and push messages continue.
- **Channel workers.** They take messages from a queue, call the provider, and handle the answer: done, retry later, or give up.
- **Providers.** Apple Push Notification service (APNs) for iOS, Firebase Cloud Messaging (FCM) for Android, and commercial SMS and email providers. They are [integration points](/learn/resilience) outside your control.
- **Notification log and events.** A record of each message and each change of its status.

## Deep dives

### Contact info gathering and the providers

The system can send only to addresses that it knows. It collects them at three moments:

1. **Sign-up.** The user gives an email address and a phone number. Store them in the user record, with a flag for "confirmed".
2. **App install and login.** The phone operating system gives the app a device token. The app sends the token to your API. One user can have many devices, so store a separate device table: `device_id`, `user_id`, `platform`, `token`, `last_seen`.
3. **Change.** The user changes a phone number, or a token changes after a reinstall. The app must send the new value each time it starts.

Each provider has its own contract:

| Channel      | Provider                    | What you send                                  | Notes                                               |
| ------------ | --------------------------- | ---------------------------------------------- | --------------------------------------------------- |
| iOS push     | APNs                        | Device token, payload, credentials of your app | The payload has a small size limit                  |
| Android push | FCM                         | Registration token, payload, credentials       | FCM can also send to iOS and the web                |
| SMS          | A commercial SMS provider   | Phone number, text                             | Cost for each message, rules for each country       |
| Email        | A commercial email provider | Address, subject, body                         | Sender reputation decides if mail reaches the inbox |

A token becomes invalid when the user deletes the app. The provider then answers with an error that says the token is unknown. Delete that token at once. Sends to dead tokens waste capacity, and some providers treat many of them as a sign of a bad sender.

### Queues, workers, and retries

The notification servers do not call providers. They put a message on a queue and return. This separation gives three benefits:

- **Bursts.** The queue absorbs a campaign of 3 million messages. The workers drain it at the rate that the providers accept.
- **Isolation.** Each channel has its own queue and its own workers. Each priority has its own queue too. An urgent queue has its own workers, so a login code never waits behind a digest.
- **Failure.** When a provider is down, messages wait in the queue. Nothing is lost, and the API still answers.

A worker classifies each provider answer:

| Answer                                    | Action                                                  |
| ----------------------------------------- | ------------------------------------------------------- |
| Success                                   | Mark the message as sent                                |
| Temporary error, timeout, rate limit      | Retry later, with exponential backoff and random jitter |
| Permanent error (bad address, dead token) | Do not retry. Mark as failed. Clean the address.        |
| Too many attempts                         | Move to a dead-letter queue for a person to look at     |

For email and SMS, keep a second provider. If the first one fails for a period, a circuit breaker sends traffic to the second one. Retries must stop at a deadline: a login code that arrives after 10 minutes is worse than no code, because the user already asked for a new one. Read the [rules for retries](/learn/resilience#rules-for-retries).

### Deduplication and "at least once"

Queues give at-least-once delivery: a message arrives one or more times. A worker can send to the provider, then crash before it removes the message from the queue. Another worker then takes the same message and sends it again. Exactly-once delivery to a person's phone is not possible across these steps, because the provider and the phone are outside your transaction. See [delivery promises](/learn/messaging#delivery-promises).

You can make duplicates rare:

1. **Give each notification an ID at the source.** The calling service makes the ID, for example from the event: `order-8812-shipped`. A retry from the caller then has the same ID.
2. **Check the ID at the API.** If the log already has this ID, return the old result and do not queue again. This is an [idempotency key](/learn/distributed-transactions#idempotency).
3. **Check the ID in the worker.** Before the send, look up the ID in a fast store of recent sends. After the send, write it with a time limit, for example 24 hours. This check is not a lock: two workers can both pass it at the same time. To stop that, claim the ID first with an atomic set-if-absent, for example `SET id NX EX 300`. The claim expires, so another worker can retry the message if the first worker crashes.
4. **Accept the last small window.** A crash between the send and the write still gives a duplicate. Say this aloud.

Push providers also have a collapse feature. APNs and FCM let you mark messages with the same key, and the device shows only the newest one. That is useful for updates such as "your parcel is 3 stops away".

The other choice is at-most-once: remove the message before the send, and lose it if the worker crashes. For a login code, a lost message is worse than a duplicate, because the user waits. For a marketing message, a duplicate is often worse. You can choose for each type.

### Templates, user settings, and opt-out

**Templates.** A calling service sends a type and data, not text. The notification servers keep a template for each type, channel, and language: `order_shipped / email / es`. Templates give a consistent look, let a non-developer change the text, and keep text out of the code of each team. Version the templates, so a change can roll back. Keep the push text short, because the screen and the payload are small.

**User settings.** Store one record for each user, type, and channel:

| Field      | Example         |
| ---------- | --------------- |
| `user_id`  | 4471            |
| `type`     | `weekly_digest` |
| `channel`  | `email`         |
| `opted_in` | false           |

Check the settings on the notification servers, before a message enters a queue. A message that the user does not want must cost nothing further. Add quiet hours in the time zone of the user. Bulk messages wait until the morning. Urgent transactional messages go at once.

**Opt-out.** In many countries, the law requires a way to unsubscribe from marketing messages, and consent before marketing by SMS. Each marketing email needs an unsubscribe link that works with one click. A transactional message, such as a login code, is not marketing. Keep the two categories separate in the type list, so a user who opts out of marketing still gets receipts and login codes.

### Rate limits

Three kinds of limits protect three things:

- **For each user.** No user gets more than a fixed number of bulk messages each day, for example 3. Too many messages lead users to turn off all notifications, or to remove the app.
- **For each provider.** Each provider accepts a maximum rate. The workers must send below it. A token bucket for each provider account is the usual tool. See [Design a rate limiter](/learn/rate-limiter).
- **For each calling service.** One team with a bug must not fill the queues of all teams. Give each caller a quota at the API.

### Tracking events and monitoring the queues

**Events.** Each message moves through states: `created`, `queued`, `sent`, `delivered`, `opened`, `clicked`, `failed`, `unsubscribed`. Write each change as an event to a stream, not as an update in place. An analytics job builds the counts and the funnel for each campaign. Some states come from outside: the email provider calls a webhook for a bounce, and a click arrives through a tracking link. Email opens are measured with a small image in the mail, and many mail apps now block or preload it. Treat open rates as rough.

**Monitoring.** The most important signal is the queue:

- **Queue depth.** The number of messages that wait, for each queue.
- **Age of the oldest message.** This is the delay that the next message will see. It is a better alarm than depth. A depth of 100,000 is fine for the bulk email queue and a disaster for the urgent push queue.
- **Provider error rate and latency,** for each provider.
- **Time from request to send,** for each priority, against a service level. For example: 99% of login codes reach the provider in 5 seconds.

Add workers when the age grows. Alert when the urgent queue is older than its target. See [Observability](/learn/observability).

## Trade-offs and alternatives

| Decision         | Choice here                             | When the choice changes                                                               |
| ---------------- | --------------------------------------- | ------------------------------------------------------------------------------------- |
| Delivery promise | At least once, with deduplication       | At most once for low-value bulk messages                                              |
| Queue layout     | One queue for each channel and priority | One queue only for a small system with one channel                                    |
| Settings check   | On the API, before the queue            | Also in the worker, when a delayed message can wait for hours and settings can change |
| Rendering        | On the API, before the queue            | In the worker, when messages are scheduled for later and must use the newest template |
| Providers        | Two for email and SMS                   | One, when the cost of a second contract is higher than the cost of an outage          |
| Scheduling       | A scheduled store that feeds the queues | No scheduler when all messages go at once                                             |

A note on the rendering choice: render early, and a queued message is complete and simple to send. Render late, and the message uses the current template and the current settings. Both are correct. Pick one and say why.

## What interviewers probe

1. **"A campaign of 3 million emails starts. What happens to login codes?"**
   - Separate queues and separate workers for urgent and bulk messages, for each channel.
   - The age of the oldest urgent message is the alarm.
2. **"How do you make sure that a user does not get the same message twice?"**
   - A notification ID from the source, checked at the API and in the worker.
   - Exactly once is not possible to the phone. The last window between send and record remains.
3. **"The SMS provider is down for 20 minutes."**
   - Messages wait in the queue. Retry with backoff. A circuit breaker sends traffic to a second provider.
   - Drop login codes that are past their deadline, instead of sending them late.
4. **"A user turned off emails and still gets them. Where is the bug?"**
   - Settings checked only at enqueue, and the message waited. Or a cached setting that is old.
   - Check settings again in the worker for delayed messages. Keep the cache time short.
5. **"How do you add a new channel?"**
   - A new queue, a new worker type, and new templates. The API and the callers do not change, because callers send a type and data, not a channel.

## Go deeper

- **System Design Interview** (Alex Xu), the chapter on a notification system: the parts, contact info gathering, and reliability.
- **Designing Data-Intensive Applications** (Martin Kleppmann), the part on stream processing: message brokers, delivery promises, and idempotence.
- **Release It!** (Michael Nygard), the part on stability patterns: integration points, timeouts, circuit breakers, and bulkheads around providers.

## Further reading

- [Apple Push Notification service](https://en.wikipedia.org/wiki/Apple_Push_Notification_service) and [Firebase Cloud Messaging](https://en.wikipedia.org/wiki/Firebase_Cloud_Messaging) on Wikipedia
- [Idempotent Consumer](https://microservices.io/patterns/communication-style/idempotent-consumer.html) on microservices.io
- Related lessons: [Messaging](/learn/messaging), [Resilience](/learn/resilience), [Distributed transactions](/learn/distributed-transactions)
