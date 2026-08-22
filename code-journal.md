## 8/20

### Concept: Optional chaining ('?.')
**What confused me: ** Thought it validated wether a value exists.
**What it actually means: **It's crash prevention, not validation. If the thing on the left is undefined or null, it short-circuits and returns undefined instead of throwing an error. Still need an explicit check if you actually want to validate.

### Concept: User enumeration prevention
**What confused me:** Returning "user not found" vs "invalid credentials" seemed like it didn't matter, just error message wording.
**What it actually means:** Different error messages for "no such user" vs "wrong password" let an attacker script through emails and build a list of valid accounts without ever guessing a password. Auth endpoints should always return the same generic message ("Invalid credentials") regardless of which check failed, so the app never confirms or denies whether an email is registered.

### Concept: Function calls execute immediately, even inside a variable assignment
**What confused me:** Thought `const passwordMatch = await bcrypt.compare(...)` was "just" a variable assignment that would happen later, not something that runs right away.
**What it actually means:** Assigning a function's return value to a variable doesn't delay the function call — `bcrypt.compare(...)` executes the moment the line runs, top to bottom, same as anywhere else in the file. `await` doesn't control *when* it starts, it controls whether the rest of the function pauses until it resolves. This is why ordering matters: a guard clause (`if (!user) return...`) written *before* a line that calls a function is what actually prevents that function from running with bad data — moving the assignment later doesn't "delay" anything, moving the guard clause earlier does.

### Note: Architecture vs. syntax
Understand the individual pieces (destructuring, async/await, guard clauses, bcrypt) solidly. What's still developing is architecting how pieces fit together in sequence — normal at this stage, not a knowledge gap.