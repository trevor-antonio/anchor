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