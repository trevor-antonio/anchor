## 8/20

### Concept: Optional chaining ('?.')
**What confused me: ** Thought it validated wether a value exists.
**What it actually means: **It's crash prevention, not validation. If the thing on the left is undefined or null, it short-circuits and returns undefined instead of throwing an error. Still need an explicit check if you actually want to validate.

