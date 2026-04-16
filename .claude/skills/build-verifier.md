---
name: build-verifier
description: Use after every code push to verify the build succeeded before continuing. Never assume a push means a working build.
---
# Build Verifier — Never Ship Broken Code

## After Every Push
1. Wait 15-20 seconds for Vercel to start building
2. Check commit statuses: GET /repos/{owner}/{repo}/commits/main/statuses
3. If state is "failure" — READ the build logs immediately, fix the exact error
4. If state is "success" — continue to next task
5. If state is "pending" — wait and check again

## Common JSX Build Errors
- "Expected > but found +" → bare string concat in label prop → wrap in {}
- "Expected ) but found :" → nested ternary → convert to if/else
- "Expected } but found ;" → doubled sort fragment → remove extra .slice().sort()
- "Unexpected token" → missing closing bracket/paren → count depth

## Zero Tolerance Rule
Never start building the next feature until the current push shows a green build.
A broken build means the user's app is broken. Fix it before moving on.
