## The part that is architecture

Much of security is detailed work for specialists. Some decisions are structural, and they are yours: where the trust boundaries are, who can call what, where sensitive data lives, and what an attacker gets after one part is broken.

Richards and Ford list security as an architecture characteristic (Fundamentals of Software Architecture, the part on architecture characteristics). It is a cross-cutting characteristic: it does not live in one box of the diagram, but it puts rules on all of them. Like other characteristics, it competes with the rest. More checks add delay. More isolation adds cost. Stricter access slows the teams. The architect decides how much security each part needs, from the value of what it holds. See [Architecture characteristics](/learn/characteristics).

A distributed system has more to protect than a monolith. Each call over the network is a place where data can be read or changed. Each service has its own credentials, its own dependencies, and its own logs. Sam Newman calls this a larger attack surface, and he also notes the benefit: a well-split system can limit what one broken part exposes (Building Microservices, the part on security).

## Two words to keep apart

- **Authentication:** who are you? A password, a code on a phone, a sign-in through another system.
- **Authorization:** what can you do? This user can read this order and cannot refund it.

Most serious faults are authorization faults: the system knows who the user is and does not check that the record belongs to them. Check access for each record, in the service that owns the data. Do not trust a check that only the screen makes.

The OWASP list calls this fault broken access control, and it is at the top of the list. The usual form is simple: change the order number in the address, and see another customer's order. Authentication cannot prevent it. Only a check of ownership on each request can.

Machines need both too. A service that calls another service must prove who it is, and the receiver must decide what that caller can do. This is the subject of the sections on zero trust and tokens below.

## Principles

| Principle                        | Meaning                                                   | In a design                                            |
| -------------------------------- | --------------------------------------------------------- | ------------------------------------------------------ |
| Least privilege                  | Each part gets only the access it needs                   | The notification service cannot read payment tables    |
| Defense in depth                 | More than one barrier                                     | Check identity at the gateway and again in the service |
| Trust boundaries                 | Mark where data crosses from less trusted to more trusted | Validate all input at each boundary                    |
| Fail closed                      | When a check cannot be made, refuse                       | If the permission service is down, deny, do not permit |
| Do not hold what you do not need | Data you do not store cannot be stolen                    | Card numbers stay with the payment provider            |

Least privilege applies in several directions:

- **In scope.** A credential gives access to one service or one table, not to all of them.
- **In time.** A credential lasts minutes or hours, not years. A stolen credential that expires soon is worth less.
- **In people.** An engineer gets production access for a task, with a record, and loses it after.

The question that tests a design is: if an attacker controls this one box, what else can they reach? With least privilege, the answer is a short list.

## The five functions

Newman organizes security work with the five functions of the NIST Cybersecurity Framework. The functions remind you that prevention is only one part. Version 2.0 of the framework added a sixth function, govern, for the policy and the roles around the others.

| Function | Question                              | Examples in a design                                                 |
| -------- | ------------------------------------- | -------------------------------------------------------------------- |
| Identify | What do we have, and what is at risk? | A list of services and data stores, data classes, a threat model     |
| Protect  | How do we stop an attack?             | Access control, encryption, patches, least privilege                 |
| Detect   | How do we know that an attack occurs? | Audit logs, alerts on unusual access, scans of dependencies          |
| Respond  | What do we do during an attack?       | A plan, revocation of credentials, contact with users and regulators |
| Recover  | How do we get back to normal?         | Backups that the attacker cannot delete, a rebuild from code         |

Many designs stop at "protect". A senior design also says how an attack is detected, and how the system recovers. Backups help only if a person with stolen administrator rights cannot delete them too. See [Incident response](/learn/incident-response).

## Zero trust and implicit trust

Newman compares two models for the traffic inside a system.

- **Implicit trust.** Everything inside the network perimeter trusts everything else. Calls between services have no encryption and no authentication. It is simple. When one service is broken, the attacker can call all the others.
- **Zero trust.** No call is trusted because of where it comes from. Each service authenticates each caller and checks each request, as if the network is hostile. It costs more work, but one broken service gives the attacker much less.

Most real systems are between the two. Newman's advice is to choose the level from the value of the data. A service with health records gets zero trust. An internal tool with public menus can trust more. Make the choice on purpose, and write it in a [decision record](/learn/decision-records).

```diagram
{
  "nodes": [
    { "id": "user", "label": "Customer", "shape": "actor", "col": 0, "row": 0 },
    { "id": "gw", "label": "Gateway\n(checks session,\nissues JWT)", "shape": "box", "col": 1, "row": 0 },
    { "id": "orders", "label": "Order service\n(checks JWT\nand ownership)", "shape": "box", "col": 2, "row": 0 },
    { "id": "pay", "label": "Payment service", "shape": "box", "col": 3, "row": 0 },
    { "id": "db", "label": "Orders\n(own credentials)", "shape": "store", "col": 2, "row": 1.3 },
    { "id": "vault", "label": "Secret store", "shape": "store", "col": 3, "row": 1.3 }
  ],
  "groups": [{ "id": "inside", "label": "Inside the network: still no implicit trust", "col": 1, "row": 0, "cols": 3, "rows": 2.3 }],
  "edges": [
    { "from": "user", "to": "gw", "label": "HTTPS" },
    { "from": "gw", "to": "orders", "label": "mTLS + JWT" },
    { "from": "orders", "to": "pay", "label": "mTLS + JWT" },
    { "from": "orders", "to": "db" },
    { "from": "orders", "to": "vault", "label": "short-lived\ncredentials" }
  ]
}
```

### Mutual TLS

TLS is the encryption that HTTPS uses. In normal TLS, only the server shows a certificate, so the client knows the server. In mutual TLS (mTLS), the client shows a certificate too. Both sides then know who the other is, and the traffic is encrypted.

mTLS answers "which service is calling?". It does not answer "on behalf of which user?". For that, the call needs a token too.

The hard part of mTLS is the certificates: each service needs one, and each one must be replaced before it expires. A service mesh can do this automatically. It puts a small proxy next to each service, and the proxies handle the certificates and the encryption.

## Tokens and JWT

A token is a piece of data that a caller presents to prove who it is and what it can do. A JSON Web Token (JWT) is a common format. It has three parts: a header, a set of claims, and a signature. The claims say who the user is, which roles they have, and when the token expires.

How a typical flow works:

1. The user signs in at the gateway, or at an identity provider through [OAuth](/glossary#oauth) and OpenID Connect.
2. The gateway gets or creates a JWT for that user.
3. The gateway sends the JWT with each call to the services behind it.
4. Each service checks the signature and the expiry, with no call to a central service.
5. Each service makes its own decision about access, from the claims and its own data.

Facts to keep in mind:

- **A JWT is signed, not encrypted.** Anyone who has the token can read its claims. Do not put secrets or sensitive personal data in it.
- **A JWT is difficult to cancel.** A service that checks only the signature accepts the token until it expires. Give tokens a short life, for example minutes, and use a refresh token to get a new one.
- **Check the algorithm and the issuer.** Accept only the signing algorithm and the issuer that you expect. Libraries that accept any algorithm have caused serious faults.
- **Keep the scope narrow.** A token for the order service must not work at the payment service. The audience claim names the receiver.

See also [access tokens](/glossary#access-token).

## Sign-in, passwords, and the browser

Interviewers often ask how a user signs in, how you store passwords, and where a browser app keeps its token. These are the standard answers.

### OAuth 2.0 and OpenID Connect

**OAuth 2.0** is delegated authorization. A user lets an app (the client) call an API for them, without giving the app their password. It has four roles:

- **The resource owner:** the user.
- **The client:** the app that wants access.
- **The authorization server:** the service where the user signs in and gives consent. It issues the tokens.
- **The resource server:** the API that accepts the tokens.

**OpenID Connect (OIDC)** adds sign-in on top of OAuth. The difference is in the tokens:

| Token         | For whom                 | What it says                                                                                                      |
| ------------- | ------------------------ | ----------------------------------------------------------------------------------------------------------------- |
| ID token      | The client               | Who the user is, and when they signed in. It is a JWT.                                                            |
| Access token  | The API                  | What the client can do for the user. Its audience is the API. The client must not use it as proof of identity.    |
| Refresh token | The authorization server | Gets a new access token when the old one expires. It lives longer, so store it safely and replace it on each use. |

The flow for a web or mobile app is the **authorization code flow with PKCE** (proof key for code exchange):

1. The app makes a random secret, the code verifier. It sends a hash of it, the code challenge, with the redirect to the authorization server.
2. The user signs in and gives consent at the authorization server, not in the app.
3. The authorization server sends the browser back to the app with a short-lived authorization code.
4. The app sends the code and the code verifier to the token endpoint.
5. The authorization server checks that the hash of the verifier matches the challenge. Then it returns the tokens.

An attacker who steals the code cannot use it, because they do not have the verifier. The current OAuth security guidance (RFC 9700) recommends PKCE for all clients. The older implicit flow, which put the token in the URL, is no longer recommended. Also send a random `state` value and check it on return, so that another site cannot start the flow for the user.

For a call from one service to another, with no user, use the **client credentials flow**: the service proves its own identity and gets a token for itself.

### Passwords

Never store a password, and never store a plain hash of it. A fast hash such as SHA-256 lets an attacker with a stolen table test billions of guesses each second on graphics cards.

- **Use a slow password hash** with a random salt for each user: Argon2id first, or scrypt or bcrypt. The salt makes two equal passwords give different hashes. The libraries store the salt in the hash string.
- **Slow down guessing at sign-in:** rate limits, a growing delay after failures, and multi-factor authentication.
- **Follow current guidance (NIST SP 800-63B):** check new passwords against lists of breached passwords, and do not force a change every few months without a reason.
- **Or do not store passwords at all:** sign-in through an identity provider, or passkeys.

### The browser: XSS, CSRF, and cookies

Two attacks decide where a browser app keeps its session:

- **Cross-site scripting (XSS).** The attacker's script runs in your page, usually from user input that the page shows without escaping. The script can do anything that your page can do. It can read any token in `localStorage`. Controls: escape output for its context (React does this by default), a Content Security Policy that blocks unknown scripts, and cookies that script cannot read.
- **Cross-site request forgery (CSRF).** Another site makes the user's browser send a request to your site. The browser adds your cookies, so the request looks real. Controls: the `SameSite` cookie attribute (`Lax` or `Strict`), a CSRF token in each form or request that changes data, and a check of the `Origin` header.

| Where the session lives                          | Safe from XSS reading it               | Safe from CSRF                                                   |
| ------------------------------------------------ | -------------------------------------- | ---------------------------------------------------------------- |
| Cookie with `HttpOnly`, `Secure`, and `SameSite` | Yes, script cannot read it             | Mostly, with `SameSite`. Add a CSRF token for strong protection. |
| Token in `localStorage`, sent in a header        | No, any script on the page can read it | Yes, the browser does not send it by itself                      |

For most web apps, the usual answer is a session cookie with `HttpOnly`, `Secure`, and `SameSite=Lax`, plus XSS controls. XSS is the more dangerous attack, because a script in your page can also send requests as the user.

## The confused deputy

The confused deputy problem occurs when a service with authority is tricked into using that authority for a caller who does not have it. Newman discusses it for calls between services.

An example from a parcel service:

1. A customer is signed in. The gateway knows that she is customer 17.
2. She asks for the delivery address of parcel 9001. That parcel belongs to customer 42.
3. The gateway forwards the request to the parcel service with the gateway's own credentials.
4. The parcel service trusts the gateway, so it returns the address.

The parcel service is the deputy. It had the authority to read all addresses, and it used that authority for a person who had no right to this one. Authentication worked at each step. Authorization failed, because nobody asked whether customer 17 can read parcel 9001.

The fixes:

- **Pass the user's identity downstream,** in a token, not only the caller service's identity.
- **Check ownership in the service that owns the data.** The parcel service compares the customer in the token with the owner of the parcel.
- **Do not give a central part broad authority.** A gateway that can read everything is the most valuable target in the system.

## Data

- **Classify it.** Which data is public, internal, personal, or secret? The design depends on the answer.
- **Encrypt it** when it moves between parts and when it is stored.
- **Keep secrets out of the code.** Passwords and keys live in a secret store, with a way to replace them.
- **Know the law.** Personal data, health data, and payment data each have rules on where data can be and who can see it. The Waiting Room kata has such a constraint.
- **Record access.** For sensitive data, keep a record of who read and changed what. See auditability in [Architecture characteristics](/learn/characteristics).

Encryption at rest protects against a stolen disk or a stolen backup. It does not protect against a person who has access to the running database. For the most sensitive fields, encrypt in the application, with a key that the database does not hold.

### Secrets

A secret is a value that gives access: a database password, an API key, a private key for a certificate. Each secret has a life with several stages, and each stage needs a plan.

1. **Create** it with enough randomness, and never reuse it in two places.
2. **Distribute** it to the service that needs it, and to no other.
3. **Store** it in a secret store, such as HashiCorp Vault or a cloud key service. Never put it in the code, the image, or a log.
4. **Rotate** it on a schedule, so a stolen copy stops working.
5. **Revoke** it at once when you suspect a leak.
6. **Monitor** its use, so an unusual use raises an alert.

The best secret is one with a short life. A secret store can create a database credential for one service, for one hour. Then a leak has a small effect, and rotation happens with no work.

## Threat modeling

A threat model is a structured way to ask "what can go wrong?". A short version for a design:

1. Draw the diagram and mark the trust boundaries.
2. For each arrow that crosses a boundary, ask: can somebody pretend to be the sender? Change the data? Read it? Deny that they sent it? Overload the receiver? Get more access than they have?
3. For each real threat, decide: prevent it, detect it, or accept it.

### STRIDE

The six questions in step 2 are a named method, STRIDE, from Microsoft. Each letter is a kind of threat, and each threat attacks one security property.

| Threat                     | Property it attacks | Example in a ticket seller                        | Typical control                              |
| -------------------------- | ------------------- | ------------------------------------------------- | -------------------------------------------- |
| **S**poofing               | Authentication      | A bot signs in with stolen passwords              | Multi-factor sign-in, rate limits            |
| **T**ampering              | Integrity           | A client changes the price in the request         | Take prices from the server, sign messages   |
| **R**epudiation            | Non-repudiation     | A buyer says they never bought the tickets        | An audit log that cannot be changed          |
| **I**nformation disclosure | Confidentiality     | An error page shows another buyer's email address | Ownership checks, no data in errors          |
| **D**enial of service      | Availability        | A flood of requests when the sale opens           | A waiting room, rate limits                  |
| **E**levation of privilege | Authorization       | A buyer calls an admin endpoint to cancel a show  | Role checks in each service, least privilege |

Use STRIDE on each arrow that crosses a trust boundary, not on each box. The boundaries are where most threats enter. Rank each threat by how likely it is and how much damage it does. Fix the top few. A long list with no order helps nobody.

## Other systems and people

- **Access for other systems:** use [OAuth](/glossary#oauth) and [access tokens](/glossary#access-token) with a short life and a narrow scope. Never store the password of a user for another system.
- **Abuse:** bots, bulk purchases, harmful content. Put a control point before the valuable logic, as in the Front Row worked example.
- **Dependencies:** each library and each provider is part of your attack surface.

For dependencies, the controls are simple and often missing:

- Keep a list of each library and its version in each service. This list is called a software bill of materials (SBOM).
- Scan the list automatically in the pipeline, and fail the build on a known serious fault.
- Update libraries often, in small steps. A service that is two years behind cannot take an urgent fix quickly.
- Pin versions, and build from a trusted registry, so a changed package cannot enter silently.

People are part of the system too. Most attacks start with a stolen password or a message that tricks a staff member. Multi-factor sign-in for staff, and narrow production access, remove the most common paths.

## In a kata

If the problem has money, personal data, or bots, say where identity is checked, which part holds the sensitive data, and what you chose not to store.

A complete security part of a kata answer has four short points:

1. **Trust boundaries.** Mark them on the diagram. Say where users, partners, and staff enter.
2. **Identity and access.** Say how users sign in, how services know each other, and where ownership is checked.
3. **Sensitive data.** Say which data is sensitive, where it lives, and what you chose not to store.
4. **The top threat.** Use STRIDE on the most exposed arrow, and give the one threat that matters most, with its control.

In the [Waiting Room kata](/kata/waiting-room), health data puts rules on where data can be stored. In the [Payment System kata](/kata/payment-system), a payment provider holds the card numbers, so the system never stores them.

## Interview questions

**"How do services in your design trust each other?"**

- Choose between implicit trust and zero trust, from the value of the data.
- Use mTLS so each service knows which service calls it.
- Pass the user's identity in a short-lived token.
- Check ownership in the service that owns the data.

**"What is the confused deputy problem, and how do you prevent it?"**

- A service with broad authority uses it for a caller who has no right.
- Pass the end user's identity downstream, not only the caller's.
- Make the owning service check access for each record.

**"Your JWTs last 24 hours, and one leaks. What occurs?"**

- The attacker can use it until it expires, because services check only the signature.
- Use short lives and refresh tokens.
- Keep a list of revoked tokens for urgent cases, at a cost of a lookup.

**"Walk me through how a user signs in to your app with an outside identity provider."**

- Use OpenID Connect with the authorization code flow and PKCE.
- The user signs in at the identity provider, not in the app.
- The app exchanges the short-lived code and the code verifier for the tokens.
- The ID token tells the app who the user is. The access token is for the API, with the API as its audience.
- Check the `state` value on return, and keep the tokens short-lived.

**"How do you store passwords?"**

- Never store the password or a fast hash of it.
- Use a slow password hash with a salt for each user: Argon2id, scrypt, or bcrypt.
- Limit sign-in attempts, and offer multi-factor authentication.
- Check new passwords against breached lists. Better still, use an identity provider or passkeys.

**"Where does your browser app keep the session, and why?"**

- Name the two attacks: XSS reads what script can reach, and CSRF uses the cookies that the browser sends by itself.
- A cookie with `HttpOnly`, `Secure`, and `SameSite=Lax` is safe from script and mostly safe from CSRF.
- A token in `localStorage` is safe from CSRF but any injected script can read it.
- Choose the cookie for most web apps, add a CSRF token for changes, and add XSS controls such as a Content Security Policy.

**"Walk me through a threat model of this design."**

- Draw the trust boundaries.
- Apply STRIDE to each arrow that crosses one.
- Rank the threats, and give a control for the top few.
- Say which threats you accept and why.

**"An attacker controls one of your services. What can they reach?"**

- With least privilege, only that service's own data and the calls it is allowed to make.
- Credentials with a short life limit how long the access lasts.
- Detection: unusual calls or data access raise an alert.

## Go deeper

- **Building Microservices** (Sam Newman), the part on security: the five functions, zero trust and implicit trust, mTLS, secrets, JWT, and the confused deputy.
- **Fundamentals of Software Architecture** (Mark Richards, Neal Ford), the part on architecture characteristics: security as a cross-cutting characteristic, with trade-offs against the others.
- **Release It!** (Michael Nygard), the part on security: common attacks against production systems, and the effect of a large attack surface.

## Further reading

- [OWASP Top Ten](https://owasp.org/www-project-top-ten/), the most common security risks in web applications
- [Threat model](https://en.wikipedia.org/wiki/Threat_model) and [Principle of least privilege](https://en.wikipedia.org/wiki/Principle_of_least_privilege) on Wikipedia
- [STRIDE](https://en.wikipedia.org/wiki/STRIDE_model) and [Confused deputy problem](https://en.wikipedia.org/wiki/Confused_deputy_problem) on Wikipedia
- [NIST Cybersecurity Framework](https://www.nist.gov/cyberframework), the source of the five functions
- [JSON Web Token](https://en.wikipedia.org/wiki/JSON_Web_Token) on Wikipedia
- [OAuth 2.0 Security Best Current Practice (RFC 9700)](https://www.rfc-editor.org/rfc/rfc9700)
- [OWASP Password Storage Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html) and [Cross-Site Request Forgery Prevention Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Cross-Site_Request_Forgery_Prevention_Cheat_Sheet.html)
