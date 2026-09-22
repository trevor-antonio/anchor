## 2026-08-20

### Concept: Optional chaining ('?.')
**What confused me: ** Thought it validated wether a value exists.
**What it actually means: **It's crash prevention, not validation. If the thing on the left is undefined or null, it short-circuits and returns undefined instead of throwing an error. Still need an explicit check if you actually want to validate.

### Concept: User enumeration prevention
**What confused me:** Returning "user not found" vs "invalid credentials" seemed like it didn't matter, just error message wording.
**What it actually means:** Different error messages for "no such user" vs "wrong password" let an attacker script through emails and build a list of valid accounts without ever guessing a password. Auth endpoints should always return the same generic message ("Invalid credentials") regardless of which check failed, so the app never confirms or denies whether an email is registered.

## 2026-08-23

## Journal Entry — Express Middleware (Deeper Pass)


Where I'm at
Coming back to middleware after having used it before — this time it's landing more deeply.

My explanation (in my own words)
1. Client (browser) makes the HTTP request — kicks off the API call.
2. Express passes it through a chain of middleware in registration order — each one's a bouncer checking something before passing it on.
   - app.use(express.json()) — parses incoming data as JSON.
   - app.use(session({ secret, resave, saveUninitialized })) — sets up session handling.
   - Eventually a bouncer handles the request and sends a response.
3. Response depends on what happens server-side: success → data, auth failure → 401, missing resource → 404, server error → 500.

Corrections to remember
- 401 = Unauthorized, 404 = Not Found, 500 = Server Error — easy to blur since all three are "didn't succeed," distinction is why.

The bouncer analogy
Each middleware is a checkpoint in order before reaching the route handler. A bouncer can stop the request right there if something's wrong.

Next to connect
- How next() moves a request to the next bouncer
- How error-handling middleware (4 params) only fires on next(error)

Note: Architecture vs. syntax
Solid on individual pieces (middleware functions, express.json(), session() config, status codes). Still developing: architecting how pieces fit together across the full request lifecycle. Normal at this stage, not a gap.

## WebAuthn/OIDC Architecture, August 30, 2026

Out sick most of the week with a cold, first real coding day back. Made a real architecture decision: Anchor's auth is locking in as OIDC (Google/Microsoft) + native WebAuthn passkeys, no password auth at all — dropped bcrypt/password_hash entirely. Landed on this after walking through the security tradeoffs (passkeys = strongest, phishing-resistant, no shared secret; OIDC = strong but trust shifts to the provider; passwords = weakest) and specifically reasoning through Anchor's population — unhoused folks and people with SUD lose/sell devices often, so OIDC needed to stay in as a recovery path rather than going passkey-only.

Had ChatGPT scaffold a right-sized server.js auth template (after an earlier 728-line version was scoped way too big) — OIDC config via express-openid-connect, WebAuthn registration + authentication route pairs via @simplewebauthn/server, a shared requireAuthentication middleware covering both auth paths. Fixed a real syntax bug in the old /login route (unclosed try block) while reviewing.

Architecture vs. syntax note: Walked through the first ~100 lines line-by-line and could explain roughly 80-85% cold — Express fundamentals (middleware, async routes, destructuring vs. plain requires) are solid, no gaps there. What's still developing is library-specific vocabulary layered on top of Express, not Express itself — RP name/RP ID (WebAuthn's terms for "relying party," i.e. Anchor), what verification.registrationInfo actually holds, why the WebAuthn counter matters for replay protection. That's new terminology sitting on a structure you already understand, not a structural gap.

Shipped today: Hand-typed the top of server.js from scratch (no copy/paste except comments) — imports, dotenv config, session, OIDC destructure. Caught two real bugs on review: a duplicate const express declaration and a typo in the @simplewebauthn/server require path (( instead of /). Good evidence the hand-typing approach is doing its job — these are exactly the kind of small, real mistakes that build debugging instinct.

Still open: database schema rework (drop password_hash, add tables for OIDC identity + WebAuthn credential linkage — scope still needs defining), user-lookup logic in the WebAuthn login routes (left as TODOs deliberately), React frontend for testing register/login flows (deferred).

## Date: September 18, 2026
## Journal Entry — WebAuthn/OIDC Auth Flow: Ceremonies, Middleware & Session Config (Anchor)


What I worked through today:

Spent this session building a solid mental model of WebAuthn before touching more code, then walked the actual Anchor auth template line-by-line.

WebAuthn conceptually:

Two ceremonies: registration and authentication (aka login)
Public/private key pair generated together at registration; public key stored server-side, private key never leaves the device's secure hardware
The challenge is a fresh, random, server-generated value per attempt — this is what prevents replay attacks, since a signed challenge can only be used once
generateRegistrationOptions doesn't create a passkey — it builds the instructions/challenge that get sent to the browser. navigator.credentials.create() is the actual browser API call (frontend, not yet built) that triggers the device's native passkey modal and generates the key pair
verifyRegistrationResponse checks the signed response is legit — it does NOT store to DB on its own; storage is a separate step my code still has to do (currently a TODO in the template)
generateAuthenticationOptions / verifyAuthenticationResponse = the login-time pair, checking whether a presented passkey matches what's on file
Real sequence: options generated → browser API creates key pair on device → response sent to server → server verifies → server stores in DB

Architecture decision reconfirmed: OIDC (Auth0) is the required foundation for every account. WebAuthn is strictly an optional convenience layer added AFTER a valid OIDC session exists — never a standalone path to account creation or access.

Express/session concepts:

Middleware = code that runs in the window between a request arriving and a response going out; not inherently about responses
express.json() parses incoming request bodies into req.body — nothing to do with outgoing data
session secret signs the session cookie so it can't be forged; lives in .env, never committed to repo, fine to live in a cloud secrets manager in production
resave: false — don't rewrite a session if nothing changed (library book analogy: don't re-stamp a due date if the loan didn't change)
saveUninitialized: false — don't create a session record at all until something is actually written to it (analogy: don't open a library card for someone who never checked anything out)

Bug flagged for later: delete req.session.currentChallenge sits inside the try block in both verify routes, after the verification call. If verification throws instead of returning verified: false, execution skips to catch and the challenge never gets cleared. Fix: move the delete into a finally block.

.env fixed today: Renamed Auth0 env vars to match what the template's process.env calls actually expect (AUTH0_ISSUER_BASE_URL → OIDC_ISSUER_URL, etc.), and added missing vars: SESSION_SECRET, DATABASE_URL, WEBAUTHN_RP_ID, WEBAUTHN_ORIGIN.

Next up: Wire up the actual DB insert in verifyRegistrationResponse (currently commented-out TODO), then continue the line-by-line walkthrough through the rest of the template.

## Date: September 19, 2026

## Journal Entry — Anchor DB Schema Redesign: Auth0 Identity vs. Profile Split, WebAuthn Provisioning

Biggest structural decision today: Split users into two tables. users is now pure identity — just what Auth0/OIDC gives you at login (auth0_sub, email, is_active, email_verified, timestamps). A new user_profiles table holds everything Auth0 doesn't provide (first_name, zip_code, age, primary_language, demographic fields), created later during a separate service-registration step, not at login. This resolves a real conflict: NOT NULL is enforced at the database level the instant any insert runs, so a single users table can't require fields that don't exist yet at login time — splitting into two tables lets each one honestly enforce what it actually needs, when it needs it.

Why this came up: Building ensureUserProvisioned, a middleware that runs after requireAuthentication and creates a users row the first time someone logs in via Auth0 (checks for an existing row by auth0_sub, inserts one if not found, attaches it to req.dbUser). This is the piece that makes the webauthn_credentials insert possible, since it needs a real user_id to attach to.

Other schema decisions locked in today:

Dropped username entirely — Auth0/email is the only login path, no separate username needed
Dropped local-auth columns from users (password_hash, totp_secret, totp_enabled, failed_login_attempts, locked_until) — dead weight now that Auth0 owns credential storage
Added auth0_sub TEXT NOT NULL UNIQUE to users as the link to Auth0 identity
webauthn_credentials links via user_id (foreign key), not user_sub directly, matching the pattern consent and needs_assessments already use
Defaults set: is_active → TRUE, email_verified → FALSE, created_at/updated_at → now()
Full schema rewritten as clean CREATE TABLE statements rather than layered ALTER TABLE patches, for clarity

Auth architecture reconfirmed: OIDC (Auth0) is the sole login path, no local email/password system ever. WebAuthn passkeys are strictly optional, added only after an OIDC session exists — never a standalone path to account access. Also locked in: userVerification: 'required' should be added to both generateRegistrationOptions and generateAuthenticationOptions calls, so a passkey ceremony fails unless real PIN/biometric/password verification happened, not just device possession.

WebAuthn conceptual reinforcement: Walked through Android's biometric Class 1/2/3 tiers — only Class 3 (BIOMETRIC_STRONG) sensors are permitted to unlock cryptographic keys like passkeys; weaker sensors are blocked from that entirely at the OS level, so no app-side code is needed to handle "insecure biometric" devices, the platform already gates it. Same protection doesn't have an equivalent gap on iOS (Face ID/Touch ID are the only passkey biometric options there).

Decision on scope: Deliberately not building deeper protections for lost/stolen/shared devices (session timeouts, credential revocation) right now — scoped as a V2 concern, reasoned that Anchor's primary users are likely to be case managers running assessments via the LLM, not unhoused individuals self-installing at scale, so this edge case is lower-priority for the current build phase.

Still open, not yet built: The actual INSERT INTO webauthn_credentials in verifyRegistrationResponse — schema is now unblocked and ready for it, but the insert itself hasn't been written yet. That's the very next step.

Next session: Run the rebuilt schema, then write the webauthn_credentials INSERT, then move to the minimal React/TypeScript test component (using Chrome's virtual authenticator) to actually exercise registration end to end.

## Journal — September 20, 2026

OIDC/OAuth conceptual work (video walkthrough)
Built out full term glossary through dictation and correction: resource owner, client, authorization server, resource server, redirect URI, response type, scope, consent screen, client ID/secret, auth code, token exchange, access token, ID token, client registration. Two real misconceptions caught and fixed:

Thought access tokens were permanent/static — they're opaque, short-lived, revocable, usually paired with a refresh token.
Conflated access token with identity delivery — that's the ID token's job (OIDC-specific JWT, carries the actual identity claims).

Also nailed down why OIDC's security win is credential isolation (the client never touches the raw password), not encryption-in-transit — that's TLS's job and already covered. Took a couple passes to land the distinction cleanly, but it stuck.

Roadmap restructure
Scrapped the horizontal build order (all DB → all auth → all React) for vertical slices — each module gets DB + Express + React/TS built together so nothing sits untested in the abstract. Reasoning: SQL syntax was going stale between passes, and backend-only code can't actually be tested in isolation. Containerization downgraded from mandatory-per-module to a periodic checkpoint. New 5-phase roadmap published (Auth → LLM conversation/Python entry point → resource referral → integration testing → portfolio prep). Target Dec 25, hard deadline Apr 1, ~14wk buffer if on target.

Anchor auth code review
Walked the pre-OIDC-pivot WebAuthn routes line by line and found six real bugs: unclosed try/catch, a challenge-assignment line that reads instead of writes, a res.json call sending nothing usable back to the frontend, a Challange/Challenge typo, an undefined db.saveUserCredential placeholder, and stale req.session.user checks that predate the OIDC-primary decision. Decision: scrap the route bodies, rebuild from scratch block by block rather than patch.

Also audited .env: found a duplicate DATABASE_URL (placeholder silently overriding the real one), and confirmed the OIDC and session secret values are still literal placeholder text — Auth0 setup had been discussed before but never actually finished.

Auth0 setup
Started manual signup (skipped AI-assisted setup — no real time savings for what's already mapped out). Chose Express as the application technology, "Regular Web Application" as the app type. Application named "Anchor." Signed into Auth0 dashboard via GitHub. In progress when the session cut off on rate limit.

Next up
Grab Domain/Client ID/Client Secret from the finished Auth0 app, set the callback URL, populate .env, fix the duplicate DATABASE_URL, generate a real SESSION_SECRET, add explicit cookie config (secure: true), then rebuild the WebAuthn routes with requiresAuth() + ensureUserProvisioned.


## Journal — September 21, 2026

Auth0 fully wired up
Finished the Auth0 application setup that stalled yesterday. Hit a snag where the app was accidentally created as a Single Page Application instead of Regular Web Application — caught it, fixed the type in Basic Information, and Client Secret regenerated correctly once it became a confidential client. Domain, Client ID, and Client Secret all retrieved and dropped into .env, replacing every remaining placeholder. Generated a real SESSION_SECRET via crypto.randomBytes. .env file is now fully populated, no placeholder text left anywhere.

Session cookie hardening
Added explicit cookie config to the session() call: httpOnly: true, secure tied to NODE_ENV === 'production' (false locally, true once deployed), sameSite: 'lax' for CSRF mitigation, and a 24-hour maxAge. Walked through why each setting matters and, notably, why secure can't be hardcoded true yet — it'd break the session over local HTTP.

Security deep-dive: XSS and prompt injection
Wanted a firmer grip on the actual mechanism behind httpOnly's XSS defense, not just the term. Worked through it in stages — injection point, storage, rendering — until the "attacker's code runs in the victim's browser, not their own" distinction landed clearly. Also clarified HTTPS (encrypts transit) vs. XSS (a content-trust problem) are separate layers entirely.

From there, watched part of an IBM Technology video on the OWASP Top 10 for LLM applications and worked through direct vs. indirect prompt injection, correctly distinguishing "model gives bad output" from "model has tool access and gets its actions hijacked." Also explored zero-click vulnerabilities and correctly scoped them as a browser/OS-vendor problem, not something app-level code can cause or defend against. Connected the indirect-injection trust-boundary concept directly to the planned Python sanitization layer for the resource-scraping module — scraped content will be treated as untrusted data before it ever reaches the database, same principle as sanitizing user input against XSS.

Decided against a full week with Network Chuck's ethical-hacking content for now — bookmarked for later, likely closer to the neural net work where it's more directly relevant. The OWASP LLM video will be finished in a follow-up session.

WebAuthn routes
Confirmed ensureUserProvisioned middleware was never actually saved to a file last session — it only existed in conversation. Walked through what it needs to do (look up or create a user row keyed on the OIDC sub claim, attach to req.dbUser) but didn't write it yet — session ended here.

Next up
Rebuild ensureUserProvisioned as an actual file, decide on the users table schema (specifically the OIDC sub-matching column), then rebuild /webauthn/register/options and /webauthn/register/verify from scratch.