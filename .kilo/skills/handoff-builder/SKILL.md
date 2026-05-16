---
name: Handoff Builder
description: Receive handoff from planner and execute build.
allowed-tools: Read, Edit, Write, Bash
---

# Handoff — Builder

1. Read `.handoff/context.md` and approved plan silently.
2. Execute build per confirmed plan.
3. If blocked, switch to Ask mode immediately.
4. Export context at session end if another handoff is expected.
