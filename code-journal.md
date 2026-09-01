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