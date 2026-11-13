## The part that is architecture

Much of security is detailed work for specialists. Some decisions are structural, and they are yours: where the trust boundaries are, who can call what, where sensitive data lives, and what an attacker gets after one part is broken.

## Two words to keep apart

- **Authentication:** who are you? A password, a code on a phone, a sign-in through another system.
- **Authorization:** what can you do? This user can read this order and cannot refund it.

Most serious faults are authorization faults: the system knows who the user is and does not check that the record belongs to them. Check access for each record, in the service that owns the data. Do not trust a check that only the screen makes.

## Principles

| Principle | Meaning | In a design |
|---|---|---|
| Least privilege | Each part gets only the access it needs | The notification service cannot read payment tables |
| Defense in depth | More than one barrier | Check identity at the gateway and again in the service |
| Trust boundaries | Mark where data crosses from less trusted to more trusted | Validate all input at each boundary |
| Fail closed | When a check cannot be made, refuse | If the permission service is down, deny, do not permit |
| Do not hold what you do not need | Data you do not store cannot be stolen | Card numbers stay with the payment provider |

## Data

- **Classify it.** Which data is public, internal, personal, or secret? The design depends on the answer.
- **Encrypt it** when it moves between parts and when it is stored.
- **Keep secrets out of the code.** Passwords and keys live in a secret store, with a way to replace them.
- **Know the law.** Personal data, health data, and payment data each have rules on where data can be and who can see it. The Waiting Room kata has such a constraint.
- **Record access.** For sensitive data, keep a record of who read and changed what. See auditability in [Architecture characteristics](/learn/characteristics).

## Threat modeling

A threat model is a structured way to ask "what can go wrong?". A short version for a design:

1. Draw the diagram and mark the trust boundaries.
2. For each arrow that crosses a boundary, ask: can somebody pretend to be the sender? Change the data? Read it? Deny that they sent it? Overload the receiver? Get more access than they have?
3. For each real threat, decide: prevent it, detect it, or accept it.

## Other systems and people

- **Access for other systems:** use [OAuth](/glossary#oauth) and [access tokens](/glossary#access-token) with a short life and a narrow scope. Never store the password of a user for another system.
- **Abuse:** bots, bulk purchases, harmful content. Put a control point before the valuable logic, as in the Front Row worked example.
- **Dependencies:** each library and each provider is part of your attack surface.

## In a kata

If the problem has money, personal data, or bots, say where identity is checked, which part holds the sensitive data, and what you chose not to store.

## Further reading

- [OWASP Top Ten](https://owasp.org/www-project-top-ten/), the most common security risks in web applications
- [Threat model](https://en.wikipedia.org/wiki/Threat_model) and [Principle of least privilege](https://en.wikipedia.org/wiki/Principle_of_least_privilege) on Wikipedia
