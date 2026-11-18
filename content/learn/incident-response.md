## Why an architect cares

Every production system has incidents. An incident is an unplanned event that breaks or degrades a service for its users. The design decides how often incidents occur. The people and the process decide how long each one lasts, and whether the team learns from it.

An architect needs this topic for three reasons:

- **Design for the person at 03:00.** The person on call must understand the system fast. Clear boundaries, good [observability](/learn/observability), and safe [rollbacks](/learn/deployment#release-strategies) make an incident short.
- **Time to restore is a key metric.** It is one of the four [delivery performance](/learn/delivery-performance) metrics. A system that is hard to diagnose has a long restore time.
- **Senior interviews ask about it.** "Tell me about an outage" is a standard behavioral question. "How do you run an incident?" is common for staff and principal roles.

Most of the practice on this page comes from Site Reliability Engineering, the book from Google. Other companies use the same ideas with different names.

## On-call

On call means that one engineer answers alerts for a service during a shift, usually with a second engineer as backup. The goal is a fast, calm response, not heroics.

### A healthy rotation

The SRE book gives targets for a healthy rotation. Treat the numbers as Google's practice, not as a law.

| Practice               | Google's target, roughly                                                                        |
| ---------------------- | ----------------------------------------------------------------------------------------------- |
| Time on operations     | At most 50% of an engineer's time. The rest is engineering work.                                |
| Time on call           | At most about 25% of an engineer's time.                                                        |
| Incidents in one shift | On average at most two in a 12-hour shift, because each incident and its follow-up takes hours. |
| Team size              | About eight engineers for one site, or about six for each of two sites, for week-long shifts.   |
| Response time          | Minutes for a service that users see. Longer for a service that is less time-critical.          |

Each limit has a reason. An incident is not finished when the alert stops. The engineer must find the cause, write the postmortem, and fix the bugs. If the shift has more incidents than that, the follow-up does not happen, and the same incidents return.

### Too much on-call

Operational overload occurs when the on-call load is above these limits. The signs:

- Engineers stop the follow-up work, so the same alerts fire again and again.
- People get tired and make mistakes during an incident. Stress pushes people to act on instinct instead of on evidence.
- Good engineers leave the team.

The fix is not "work harder". Remove noisy alerts. Alert on symptoms that users feel, not on every cause (see [Alerts](/learn/observability#alerts)). Move work back to the development team when a service sends too many pages. Google's SRE teams can give the pager back to the developers of a service that is too unstable.

### Too little on-call

Operational underload is also a risk. When a team gets almost no pages, its skills fade. The first real incident then takes much longer. Teams counter this with practice: they replay old incidents as a role-play exercise, and they run planned failure tests. The SRE book calls the role-play the "Wheel of Misfortune".

### What makes on-call bearable

- A clear escalation path: who to call when you are stuck.
- A runbook for each alert: what it means and the first steps. A runbook is a short document of steps for a known problem.
- Fair pay or time off for the shifts.
- A culture where asking for help early is normal.

## Effective troubleshooting

Troubleshooting is a skill that you can learn. The SRE book describes it as a loop of hypothesis and test:

1. **Problem report.** Write down what is wrong: what you expected, what you saw, and how to reproduce it.
2. **Triage.** Decide how bad it is. In a serious outage, your first job is to make the system work, not to find the cause.
3. **Examine.** Look at metrics, logs, and traces for each component. Ask what is different now.
4. **Diagnose.** Form a hypothesis about the cause. Simplify: divide the system in half, and test which half has the problem.
5. **Test and treat.** Test the hypothesis. Change one thing at a time, and write down what you changed.
6. **Cure.** Fix the cause, and confirm that the symptoms are gone.

### Stop the bleeding first

During an outage, mitigation comes before diagnosis. Roll back the last deploy. Turn off a feature flag. Move traffic to another region. Add capacity. Then find the cause, while users are no longer affected. Keep the evidence when you can: save the logs, and keep one broken server aside for study.

### Common traps

| Trap                                  | What to do instead                                                              |
| ------------------------------------- | ------------------------------------------------------------------------------- |
| Look at symptoms that are not related | Start from the user-visible symptom and follow the request path.                |
| Chase a rare cause first              | Check the common causes first. A recent change is the most common cause of all. |
| Confuse correlation and cause         | Two graphs that move together can both follow a third cause. Test the link.     |
| Change many things at once            | Change one thing, then observe. Otherwise you do not know what worked.          |
| Ignore a negative result              | A test that rules out a cause is useful. Write it in the incident document.     |

The question "what changed?" finds the cause of many incidents. Make it easy to answer: keep a log of deploys, configuration changes, and flag changes, with times.

## Emergency response

The SRE book groups emergencies by their origin:

- **Change-induced.** A deploy or configuration change broke the system. This is the largest group. Staged rollouts and fast rollbacks limit it.
- **Test-induced.** A planned failure test went further than expected. Plan a rollback for each test before you start it.
- **Process-induced.** Automation did something wrong at scale. Release It! calls automation that spreads a mistake a [force multiplier](/learn/stability-antipatterns#the-twelve-antipatterns).

In all three cases, the same rules help. Do not panic. Ask for help early. Write down what you do. After the event, ask what would have made it shorter, and what would make it impossible next time.

## Managing incidents

A small incident needs one person. A large one needs a structure. Without one, several engineers change the system at the same time, nobody tells the customers, and nobody knows who decides.

The SRE book adapts the Incident Command System, a method that fire services use. It separates the roles:

```diagram
{
  "nodes": [
    { "id": "ic", "label": "Incident commander\n(decides, delegates)", "shape": "person", "col": 1.5, "row": 0 },
    { "id": "ops", "label": "Operations lead\n(changes the system)", "shape": "person", "col": 0, "row": 1.5 },
    { "id": "comms", "label": "Communications lead\n(updates people)", "shape": "person", "col": 1.5, "row": 1.5 },
    { "id": "plan", "label": "Planning lead\n(tickets, handoffs)", "shape": "person", "col": 3, "row": 1.5 },
    { "id": "sys", "label": "Production system", "shape": "box", "col": 0, "row": 3 },
    { "id": "status", "label": "Status page,\nsupport, leaders", "shape": "external", "col": 1.5, "row": 3 },
    { "id": "doc", "label": "Incident document", "shape": "store", "col": 3, "row": 3 }
  ],
  "edges": [
    { "from": "ic", "to": "ops" },
    { "from": "ic", "to": "comms" },
    { "from": "ic", "to": "plan" },
    { "from": "ops", "to": "sys", "label": "only ops changes it" },
    { "from": "comms", "to": "status", "label": "regular updates" },
    { "from": "plan", "to": "doc", "label": "keeps it current" }
  ]
}
```

| Role                | Job                                                                                                 |
| ------------------- | --------------------------------------------------------------------------------------------------- |
| Incident commander  | Holds the full picture. Assigns the roles, sets priorities, and decides. Does not debug.            |
| Operations lead     | Leads the responders who change the system. Only this group makes changes to production.            |
| Communications lead | Sends updates at fixed times to support, leaders, and customers, for example through a status page. |
| Planning lead       | Handles the longer tasks: tickets for follow-up work, the next shift, food, and handoffs.           |

In a small incident, one person holds several roles. The incident commander holds every role that nobody else has.

Three other parts complete the structure:

- **One place to talk.** A dedicated chat channel or call. Everyone knows where the incident is.
- **A live incident document.** It holds the current state, the timeline, what was tried, and who has which role. It becomes the input to the postmortem.
- **A clear handoff.** When the incident commander changes, the old one says it explicitly: "You are now the incident commander." Then the new one confirms.

### Declare early

Teams often wait too long to call something an incident. They think the problem is small, and they do not want to make noise. The SRE book recommends that you declare an incident when one of these is true:

- You need a second team to help.
- Customers can see the outage.
- The problem is not solved after about an hour of focused work.

It is better to declare an incident and close it after 10 minutes than to start the process two hours late. Make declaring cheap: a single command that opens the channel, the document, and the page.

### A sequence for the first minutes

1. Acknowledge the alert, so that nobody else starts in parallel.
2. Decide if this is an incident. If so, declare it and take the incident commander role.
3. Open the channel and the incident document.
4. Check what changed recently. If a change is a likely cause, roll it back.
5. Ask for help: an operations lead, and a communications lead if customers are affected.
6. Send the first status update, even if you know very little.

## Blameless postmortems

A postmortem is a written record of an incident: what happened, the impact, the causes, and the actions that prevent a repeat. The goal is learning, not punishment.

**Blameless** means that the postmortem looks at systems and processes, not at the mistakes of a person. Assume that each person acted well with the information they had. If a person could break production with one command, the problem is the system that allowed it. When people fear blame, they hide information, and the organization cannot learn.

### When to write one

The SRE book suggests triggers like these. Each team sets its own thresholds.

- Downtime or degradation that users see, above a limit.
- Any data loss.
- An on-call engineer had to intervene, for example with a rollback or a traffic change.
- The time to resolve was above a limit.
- Monitoring did not detect the problem, and a person found it.

### The parts of a postmortem

| Part                    | Content                                                                       |
| ----------------------- | ----------------------------------------------------------------------------- |
| Summary                 | Two or three sentences: what broke, for how long, and for whom.               |
| Impact                  | Users affected, failed requests, revenue, error budget used.                  |
| Timeline                | Times of the trigger, detection, each action, mitigation, and resolution.     |
| Root causes and trigger | The conditions that made the failure possible, and the event that started it. |
| Detection               | How the team found out, and how to find out sooner.                           |
| Resolution              | What stopped the impact.                                                      |
| Action items            | Each with an owner, a priority, and a ticket.                                 |
| Lessons                 | What went well, what went badly, and where the team was lucky.                |

"Where we were lucky" is a useful section. It finds the risks that did not cause damage this time.

Usually there is more than one cause. A deploy was the trigger, but the missing test, the missing alert, and the slow rollback are also causes. Fix several of them. A review by senior engineers makes sure that the action items are real and that they get done. A postmortem with action items that nobody completes is only a story.

## Eliminating toil

Toil is operational work with these properties:

- It is manual and repetitive.
- A machine could do it.
- It reacts to events, instead of following a plan.
- It has no lasting value. The service is not better afterwards.
- It grows in proportion to the service. Twice the traffic means twice the toil.

Examples: restart a stuck worker by hand each week, copy a new customer's settings into three systems, resize a disk when an alert fires.

Not all operational work is toil. Incident response, careful capacity planning, and postmortems all have lasting value.

**The 50% rule.** Google's SRE teams keep toil and other operations work at or below 50% of their time. The other half goes to engineering work that reduces future toil or improves the service. When toil goes above the limit, the team escalates. The fix can be automation, a design change, or work that goes back to the development team.

For an architect, toil is a design signal. A manual step that repeats with each customer or each deploy shows a missing part in the design.

## Handling overload

Many incidents are overload: more requests than the system can serve. The response during the incident is load shedding: refuse some requests fast, so that the others succeed. The design work before the incident matters more:

- Give requests a priority, so that the system sheds the least important ones first.
- Put [rate limits](/learn/rate-limiter) on each client.
- Make clients back off when the server says "busy". The SRE book also describes client-side throttling, where the client stops sending when most of its recent requests failed.
- Plan [degraded modes](/learn/resilience#degrade-do-not-fail) for functions that are not essential.

The [stability antipatterns](/learn/stability-antipatterns) lesson shows how overload spreads, and [Design for failure](/learn/resilience) has the standard tools.

## Trade-offs and failure modes

| Choice                               | Benefit                      | Cost                                                         |
| ------------------------------------ | ---------------------------- | ------------------------------------------------------------ |
| Developers on call for their service | Fast feedback, better design | Load on developers. It needs good alerts and runbooks.       |
| Central operations team              | Developers stay focused      | Slow feedback. The authors of the code do not feel the pain. |
| Strict incident roles                | Order in a large incident    | Overhead in a small one. Scale the process to the incident.  |
| Many postmortems                     | More learning                | Fatigue, if the action items are never done.                 |

Common failure modes of the process:

- **The hero.** One expert fixes everything. The knowledge stays in one head, and that person burns out.
- **Too many cooks.** Several people change production at once, without a commander.
- **Silence.** Nobody updates the support team, so customers learn about the outage from social media.
- **The blame trap.** The postmortem names a person. Next time, people hide what they did.
- **Postmortem theater.** The document is written, but the action items stay open for months.

## In a kata

Incidents appear in a kata in two places.

- **In the risks.** Name the most likely incident, how you detect it, and how you restore service. "If the payment provider is down, the circuit opens, the shop offers pay at pickup, and an alert pages the on-call engineer."
- **In the operational model.** Say who runs the system. A team of four developers, as in [Lunch Rush](/kata/lunch-rush), cannot staff a 24-hour rotation of eight people. Prefer managed services and a design with few moving parts. For [Waiting Room](/kata/waiting-room), clinics must work during an outage, so describe the offline mode and the switch back.

Show that you think about the people who run the design, not only the boxes.

## Interview questions

**Tell me about a significant outage you handled.**

- Use a structure: context, impact, what you did, the outcome, what changed afterwards.
- Show that you mitigated first and diagnosed second.
- Describe the blameless postmortem and the action items that got done.
- Say what you would do differently.

**How do you run a large incident?**

- Declare early, and name an incident commander who coordinates and does not debug.
- Separate operations, communications, and planning roles.
- Use one channel and one live document. Only the operations group changes production.
- Send status updates at fixed times. Hand off roles explicitly.

**What makes a postmortem useful?**

- It is blameless and focuses on systems and process.
- It has a timeline, the impact, several contributing causes, and action items with owners.
- It records what went well and where the team was lucky.
- Someone tracks the action items until they are done.

**Your team gets paged twenty times a week. What do you do?**

- Measure: which alerts fire, and which ones needed action.
- Delete or change alerts that need no action. Alert on user-visible symptoms and SLOs.
- Fix the top recurring causes, and automate the repeated manual fixes.
- If the service is too unstable, stop feature work or move the load back to the developers.

**What is toil, and why limit it?**

- Manual, repetitive, automatable work with no lasting value, which grows with the service.
- It takes time from engineering, so the system never gets better.
- Google's SRE teams cap operations work at about 50% of their time.

## Go deeper

- **Site Reliability Engineering** (Beyer and others), the parts on being on call, effective troubleshooting, emergency response, managing incidents, postmortem culture, and eliminating toil: the main source for this page, with Google's practice and examples.
- **Release It!** (Michael Nygard), the parts on stability and on operations: why systems fail in production, and what the people who run them need from the design.
- **Accelerate** (Forsgren, Humble, Kim), the parts on the key metrics and on culture: why time to restore matters, and why a culture without blame gives better results.
- **The Software Architect Elevator** (Gregor Hohpe): why the architect must stay connected to how the system runs, not only how it is drawn.

## Further reading

- [Being on-call](https://sre.google/sre-book/being-on-call/), [Managing incidents](https://sre.google/sre-book/managing-incidents/), [Postmortem culture](https://sre.google/sre-book/postmortem-culture/), and [Eliminating toil](https://sre.google/sre-book/eliminating-toil/), from the Google SRE book
- [Incident Command System](https://en.wikipedia.org/wiki/Incident_Command_System) on Wikipedia
- See also [Observability and service levels](/learn/observability) and [Delivery performance](/learn/delivery-performance)
