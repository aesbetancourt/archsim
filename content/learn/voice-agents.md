## What a voice agent is

A voice agent is an AI agent that talks with a person in real time, by phone or in an app. It listens, decides, uses tools, and answers with speech. For the agent loop and tools, see [Agents and tools](/learn/ai-agents).

Voice is harder than text in three ways:

- **Time.** A person on a call expects an answer as fast as from another person. In conversation, the usual gap between two turns is about 200 milliseconds. A silence of two seconds sounds like a broken line.
- **Turns.** The agent must know when the caller has finished, and it must stop when the caller interrupts.
- **No screen.** The caller cannot scroll back. Each answer must be short, clear, and easy to hear.

So the design questions are about the full path of audio, not only the model. A model step of 300 milliseconds is not the latency of the agent. The caller hears the sum of all steps.

## Two architectures

### The cascade

A cascade is a chain of three parts. Each part streams its output to the next one.

1. **Speech to text (STT).** It turns the caller's audio into text. It is also called automatic speech recognition (ASR).
2. **The model.** It reads the text and the conversation, calls tools, and writes the answer as text.
3. **Text to speech (TTS).** It turns the answer into audio.

```diagram
{
  "nodes": [
    { "id": "caller", "label": "Caller", "shape": "person", "col": 0, "row": 1 },
    { "id": "phone", "label": "Phone network\nor WebRTC", "shape": "external", "col": 1, "row": 1 },
    { "id": "stt", "label": "VAD, end of turn,\nspeech to text", "shape": "box", "col": 2, "row": 0 },
    { "id": "llm", "label": "Model\n(streams text)", "shape": "box", "col": 3, "row": 1 },
    { "id": "api", "label": "Booking API", "shape": "external", "col": 3, "row": 0 },
    { "id": "tts", "label": "Text to speech\n(streams audio)", "shape": "box", "col": 2, "row": 2 },
    { "id": "human", "label": "Support person", "shape": "person", "col": 3, "row": 2.3 }
  ],
  "edges": [
    { "from": "caller", "to": "phone", "label": "audio", "both": true },
    { "from": "phone", "to": "stt", "label": "audio in" },
    { "from": "stt", "to": "llm", "label": "text" },
    { "from": "llm", "to": "api", "label": "tool call", "both": true },
    { "from": "llm", "to": "tts", "label": "text" },
    { "from": "tts", "to": "phone", "label": "audio out" },
    { "from": "llm", "to": "human", "label": "handoff with summary" }
  ]
}
```

Frameworks such as Pipecat or LiveKit Agents connect these parts. They also handle voice activity detection, interruptions, and the audio transport. You can change one part, for example the speech-to-text provider, without a change to the others.

### Speech-to-speech models

A speech-to-speech model takes audio in and gives audio out, in one model. Several providers offer such models through a real-time API. The model hears the tone of the caller, and it can answer with a natural voice and rhythm. It has fewer handoffs between parts, so it can start to answer sooner.

| Concern         | Cascade                                                       | Speech-to-speech                                              |
| --------------- | ------------------------------------------------------------- | ------------------------------------------------------------- |
| Control         | You see the text at each step, and can check it before speech | Less control between hearing and speaking                     |
| Tools           | Any text model with tool calls                                | Supported by some models, with fewer models to choose from    |
| Latency         | Under 1 second is possible with streaming at each step        | Often lower, because there is one step                        |
| Cost            | The sum of three parts, each priced on its own                | Audio tokens are priced differently. Often higher (Uncertain) |
| Voice quality   | Good voices. Tone of the caller is lost in the transcript     | Hears tone and answers with natural rhythm                    |
| Debugging       | A transcript and a log for each step                          | Fewer points to inspect                                       |
| Change one part | Easy                                                          | You change the whole model                                    |

### Choose with a reason

Do not choose a stack because a demo sounded good. Write the reason in a [decision record](/learn/decision-records). Choose from the requirements:

1. **Latency target.** State it as a number, from the end of the caller's speech to the first audio.
2. **Tools and rules.** Many write actions, such as bookings and refunds, favor a cascade. You can check each action in text.
3. **Languages and accents.** Test the speech-to-text part on your callers' audio, not on a demo.
4. **Channel.** Phone audio is low quality. Choose models that do well on it.
5. **Cost per minute.** Compute it as a sum of parts. See [Cost per minute](#cost-per-minute).
6. **Data rules.** Where the audio is processed and kept, and for how long.

A common start is a cascade in a framework, with streaming at each step. Change to a speech-to-speech model when your test calls show a gain that matters to callers.

## Turn-taking

### Voice activity detection

Voice activity detection (VAD) decides, for each short frame of audio, if it contains speech. A frame is often 10 to 30 milliseconds long. VAD is the first filter. It tells the system when the caller starts and stops making sound.

VAD alone does not know if the caller has finished. People pause in the middle of a sentence: "My appointment is on… Tuesday."

### End of turn

Turn detection, also called endpointing, decides that the caller has finished the turn. The two common methods:

- **Silence.** The turn ends after a fixed silence, for example 500 milliseconds. A short silence cuts callers off. A long silence makes each answer slow.
- **A turn model.** A small model looks at the words and the audio, and predicts if the sentence is complete. "Book me for Tuesday at" is not complete. "Book me for Tuesday at three" is complete. With a turn model, the system can end the turn after a short silence when the words are complete, and wait longer when they are not.

Some frameworks start the model on the partial transcript before the turn ends. If the caller continues, they discard that answer. This saves time, but costs more model calls.

### Barge-in

Barge-in is when the caller talks while the agent talks. A person stops at once when interrupted, and the agent must do the same.

1. Detect the caller's speech while the agent's audio plays.
2. Stop the audio within about 200 milliseconds, and discard the audio in the queue.
3. Cut the agent's last turn in the conversation history to the words that the caller actually heard. If not, the model thinks it said things that the caller never heard.
4. Listen to the new turn.

Not every sound is an interruption. "Mm-hm" and "yes" while the agent talks often mean "go on". A cough or a television is noise. Require a minimum length of speech, or real words, before you stop. Echo cancellation removes the agent's own voice from the incoming audio. Without it, the agent can interrupt itself on a speakerphone.

## Stream every step

Each part must start its work before the part before it has finished.

- **Speech to text** sends partial transcripts while the caller talks. At the end of the turn, only the last words remain.
- **The model** streams tokens. The first sentence is ready long before the whole answer.
- **Text to speech** starts on the first sentence, and sends audio in small chunks.
- **The transport** plays each chunk when it arrives.

Without streaming, the steps add up in full: a complete transcript, then a complete answer, then complete audio. That gives several seconds of silence. With streaming, the caller hears the first sentence while the model still writes the second. For time to first token, see [Cost and latency of AI systems](/learn/llm-cost-latency#latency).

## The latency budget

The key number is the time from the end of the caller's speech to the first audio of the agent. A common aim is less than about 800 milliseconds to 1 second at p50. Set a p95 target too, for example 1.5 seconds.

Here is an example budget for a cascade. The values are assumptions for practice. Measure your own.

| Step                                 | Example budget (ms) |
| ------------------------------------ | ------------------- |
| Audio from the caller to the server  | 100                 |
| End-of-turn decision                 | 200                 |
| Final transcript from speech to text | 100                 |
| Model: time to the first sentence    | 300                 |
| Text to speech: first audio chunk    | 100                 |
| Audio from the server to the caller  | 100                 |
| Total                                | 900                 |

The 300 milliseconds for the model assumes a fast model tuned for low latency and a short first sentence. A model with 0.5 seconds to the first token cannot meet it, so the model choice is part of the latency budget.

What the table shows:

- The model is only a third of the total. A team that measures only the model step misses two thirds of the wait.
- A fixed silence of 500 milliseconds alone uses more than half the budget. A turn model is often the largest single saving.
- The phone network adds delay that you cannot remove. Put the servers near the telephony provider and near the model provider.
- A tool call is not in this budget. Plan for it separately. See [Tools during the call](#tools-during-the-call).

Each step has its own p95, and a slow step on one turn makes a long silence. See the latency budget in [Cost and latency of AI systems](/learn/llm-cost-latency#latency).

### Measure from the caller's ear

Logs on the server show when each step started and ended. They do not show what the caller heard. Record both sides of test calls. Measure the gap from the end of the caller's speech to the start of the agent's audio, for each turn. Report the p50 and the p95 of that gap.

Add a trace with one span for each step, so that you can see which step was slow on a slow turn. See [Logs, correlation IDs, and traces](/learn/observability#logs-correlation-ids-and-traces).

## Telephony basics

A phone call reaches the agent through a telephony provider. The provider owns the phone number and connects the public phone network to the internet.

1. The caller dials the number. The phone network sends the call to the provider.
2. The provider tells your system about the call, often with a webhook.
3. Audio flows both ways. The provider connects with SIP (Session Initiation Protocol, which sets up the call), or streams audio frames over a WebSocket.
4. Your system starts one agent session for the call. The session holds the conversation state until the call ends.
5. To hand off, the agent asks the provider to transfer the call to a queue of people.

Phone audio is narrow. The classic codec, G.711, samples at 8,000 times each second. Speech-to-text accuracy is lower than on clear app audio, so test on real phone audio.

WebRTC is the standard for real-time audio in browsers and apps. It gives better audio and lower delay than the phone network. Use it when the caller is already in your app.

Plan for calls at the same time, not only calls each day. With 600 calls each hour at the peak and 5 minutes for each call, about 600 × 5 ÷ 60 = 50 calls run at once. See [From requests to servers](/learn/estimation#from-requests-to-servers).

Laws in some places require consent from all parties before a recording. Tell the caller at the start, and check the law where you operate.

## Tools during the call

A support agent needs tools: find the customer, find free slots, book, change, or cancel an appointment. Each tool call adds time to the turn. The caller must not hear silence while it runs.

- **Say a filler first.** "Let me check the free times for Tuesday." The filler plays while the tool runs. A short fixed phrase can be ready as audio in advance.
- **Set a timeout on each tool.** After the timeout, say so: "The booking system is slow. I will try again." See the timeouts in [The stability patterns](/learn/resilience#the-stability-patterns).
- **Confirm before a write.** "I will move your appointment to Tuesday at 3 in the afternoon. Is that correct?" Book only after a clear yes.
- **Make writes safe to retry.** Send an idempotency key with each booking, so a retry does not book twice. See the idempotency deep dive in [Design a payment system](/learn/payment-system#deep-dives).
- **Check identity before a change.** Caller ID can be faked. Ask for a second fact, such as the date of birth or a booking code.
- **Start slow lookups early.** Look up the customer by phone number when the call starts, not when the caller asks.

## Conversation design

- **Short turns.** One or two sentences, then stop. A long answer is hard to hear and easy to interrupt.
- **One question at a time.** "What day suits you?" Then "Morning or afternoon?"
- **Confirm key facts.** Read back dates, times, names, and numbers. Spell a name when it matters.
- **Write for the ear.** Say "three thirty in the afternoon", not "15:30". Say "about ten minutes", not "10 min".
- **Never read internal labels aloud.** No IDs, field names, JSON, or Markdown. The agent must never say "slot ID 4471" or "asterisk".
- **Handle silence.** Ask again after a few seconds of silence. After two tries, offer a call-back and end the call politely.
- **Say what the agent can do.** At the start, in one sentence: "I can book, move, or cancel appointments."

## Hand off to a person

The agent must hand off when:

- The caller asks for a person. Do not argue.
- The agent fails twice on the same request.
- The topic is high risk: a complaint, a billing dispute, a legal or safety question.
- The caller sounds angry or upset.

Use a warm transfer. The person gets a short summary before the call connects: who the caller is, the identity check, the goal, and what the agent tried. The caller must not repeat the story.

Outside work hours, create a call-back request with the same summary, and tell the caller when to expect the call.

Measure the share of calls handed off. A rate near zero can mean that callers cannot reach a person, not that the agent is perfect. For the general pattern, see [Agents and tools](/learn/ai-agents).

## Test before launch

A voice agent needs tests at the level of the whole call, through the audio path. See [Evaluating AI systems](/learn/llm-evals).

1. **Write scenarios.** Each scenario has a goal and an expected result. Example: "Move the appointment from Monday to Wednesday."
2. **Add personas.** A model plays the caller with a persona: in a hurry, slow and unsure, a strong accent, a noisy street, a caller who interrupts, a caller who changes their mind, a caller who asks for a person.
3. **Run them as audio.** The simulated caller speaks through text to speech, with noise added. This tests the speech-to-text part and the turn detection, not only the model.
4. **Grade the result.** Check the booking in a test copy of the booking API. Check that the agent confirmed before it booked. Check the handoffs.
5. **Measure each turn.** Report the p50 and p95 of the gap, and the share of turns where the agent cut the caller off.
6. **Add real calls.** With consent, and with personal data removed, turn failed real calls into new scenarios.

Launch in steps: first with staff as callers, then a small share of real calls in work hours, with people ready to take over.

## Cost per minute

Compute the cost of one minute of a call as a sum of parts. All prices here are assumptions for practice. Check each provider.

| Part                      | Assumption                                               | Cost each minute |
| ------------------------- | -------------------------------------------------------- | ---------------- |
| Telephony                 | Assume $0.01 each minute                                 | $0.010           |
| Speech to text            | Assume $0.01 each minute of audio                        | $0.010           |
| Model, input              | 4 calls each minute × 3,500 tokens × $3 for each million | $0.042           |
| Model, output             | 4 calls each minute × 50 tokens × $15 for each million   | $0.003           |
| Text to speech            | Assume $0.02 for each minute of call                     | $0.020           |
| Hosting and the framework | Assume $0.005 each minute                                | $0.005           |
| Total                     |                                                          | $0.090           |

A call of 5 minutes costs about 5 × $0.09 = $0.45.

The model input is the largest part, because each turn sends the instructions, the tools, and all earlier turns again. That prefix repeats, so prompt caching helps here. Assume that 90% of the input is cached at a tenth of the price. The input cost then falls from $0.042 to about $0.008 each minute, and the total falls to about $0.056.

Compare with a person. Assume that a support person costs $1 each minute, so a 5-minute call costs $5. Each call that the agent hands off costs both. With 30% of calls handed off, the expected cost of a call is $0.45 + 0.3 × $5 = $1.95. That is still less than $5, and the caller waits less. See [Cost per task and value per task](/learn/llm-cost-latency#cost-per-task-and-value-per-task).

## Common mistakes

- **Only the model step measured.** The caller hears the sum of all steps.
- **A stack with no reason.** "It sounded good in a demo" is not a reason. State the latency, tools, and cost that decided it.
- **A fixed long silence for the end of turn.** Each answer starts late.
- **No barge-in.** The agent talks over the caller, or keeps words in its history that the caller never heard.
- **Silence during a tool call.** The caller thinks that the line is dead.
- **Long, written-style answers.** Lists, codes, and IDs read aloud.
- **No way to reach a person.** Callers who are stuck hang up angry.
- **Tests on text only.** The speech-to-text part and the turn detection fail on real audio.
- **Cost for the model only.** Telephony, speech to text, and text to speech can cost as much as the model.

## In a kata

For a voice kata, put these items in the design:

1. **The architecture.** Cascade or speech-to-speech, with the reason.
2. **The latency budget.** A table of steps from the end of speech to the first audio, with a p50 and a p95 target.
3. **Turn-taking.** How the end of turn is detected, and what happens on barge-in.
4. **Tools.** Which tools the agent calls, the filler while each one runs, and the confirm step before each write.
5. **Handoff.** The rules, and the summary that the person gets.
6. **Tests and launch.** The personas, the grades, and the steps to launch.
7. **Cost per minute.** A sum of parts, compared with the cost of a person.

The triggers and the queue of [Agent Triggers](/kata/agent-triggers) apply to call-backs too: a missed call or a call-back request becomes exactly one run.

To practice this lesson, do [Voice Support Agent](/kata/voice-support-agent) with the 45-minute clock.

## In an interview

Interviewers who build voice products ask for the end-to-end number. Give it from the caller's point of view: "about 900 milliseconds from the end of speech to the first audio, at p50". Then show the table of steps. If you measured only the model, say so, and say how you would measure the rest.

Expect "why this stack?". Answer with the requirements and the numbers, not with the names of products. Then name what would make you change: "If our test calls showed that callers interrupt less with a speech-to-speech model, and our tools still work, I would test it on 5% of calls."

## Interview questions

**"Walk me through the latency of your voice agent, from the end of the caller's speech to the first audio."**

- Name every step: audio in, end of turn, final transcript, model to the first sentence, first audio chunk, audio out.
- Give an example budget, for example 100 + 200 + 100 + 300 + 100 + 100 = 900 milliseconds.
- The model is only about a third of the total.
- Measure the gap in recordings of both sides, and report p50 and p95.

**"Why did you choose a cascade and not a speech-to-speech model?"**

- Start from the requirements: the latency target, the tools, the languages, the channel, the cost.
- A cascade gives text at each step, so you can check actions and debug.
- A speech-to-speech model can be faster and more natural, with less control.
- Say what result in your tests would change the choice.

**"How does the agent take turns with the caller?"**

- VAD finds speech in each short frame of audio.
- Turn detection decides that the caller has finished, with silence and a turn model.
- On barge-in, stop the audio fast, and cut the history to what the caller heard.
- Ignore short sounds such as "mm-hm" and noise.

**"The booking API takes two seconds. What does the caller hear?"**

- A short filler while the tool runs: "Let me check that for you."
- A timeout, and a clear message if the tool fails.
- A confirm step before the write, and an idempotency key on the booking.

**"When does the agent hand off to a person, and how?"**

- When the caller asks, after two failures, on high-risk topics, or when the caller is upset.
- A warm transfer with a summary, so the caller does not repeat the story.
- A call-back request outside work hours.
- Measure the handoff rate, and look at a rate near zero with suspicion.

**"How do you test a voice agent before launch?"**

- Scenarios with a goal, played by simulated callers with personas.
- Run them as audio with noise, to test speech to text and turn detection.
- Grade the result in a test copy of the API, and measure the gap on each turn.
- Launch in steps, with people ready to take over.

**"What does one minute of a call cost?"**

- Sum the parts: telephony, speech to text, model, text to speech, hosting.
- With the example assumptions: 0.01 + 0.01 + 0.045 + 0.02 + 0.005 = $0.09 each minute.
- The model input is the largest part, because each turn sends the history again. Prompt caching cuts it.
- Compare with a person: $0.45 + 30% × $5 = $1.95 for each call, against $5.

## Go deeper

- **AI Engineering**, Chip Huyen, the parts on agents and on inference optimization. It adds how the serving system sets time to first token and speed.
- **Designing Voice User Interfaces**, Cathy Pearl, the parts on confirmations and on errors. It adds how to design a conversation for the ear.
- **Conversational Design**, Erika Hall, the whole short book. It adds the principles of human conversation that a system must follow.

## Further reading

- [Pipecat documentation](https://docs.pipecat.ai), an open-source framework for voice agents, one example among others
- [LiveKit Agents documentation](https://docs.livekit.io/agents/), another framework for real-time voice agents
- [Voice activity detection](https://en.wikipedia.org/wiki/Voice_activity_detection) on Wikipedia
- [Session Initiation Protocol](https://en.wikipedia.org/wiki/Session_Initiation_Protocol) on Wikipedia
- [G.711](https://en.wikipedia.org/wiki/G.711) on Wikipedia
- [WebRTC](https://webrtc.org), the project site
- "Universals and cultural variation in turn-taking in conversation", Tanya Stivers and others, PNAS, 2009
- "Voice AI & Voice Agents: An Illustrated Primer", Kwindla Hultquist Kramer
