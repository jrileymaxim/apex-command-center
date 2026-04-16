---
name: context-mode
description: Use when working with large files or long sessions. Prevents stale data overwrites. Always refetch before editing.
---
## Rules
1. Refetch file immediately before every edit
2. Never use cached version from earlier in session  
3. Update SHA after every push
4. Verify target string exists before replace
5. One change per push cycle
