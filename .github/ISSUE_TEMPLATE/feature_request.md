---
name: Feature request
about: A capability waku doesn't have yet
---

**What you're trying to do** — the goal, not the implementation. What are you
trying to get waku to do for you?

**Where it belongs on the [footprint ladder](../../docs/context/conventions.md#3-where-new-capability-goes-the-footprint-ladder)** — every
registered tool ships in every prompt, so the core stays narrow. Could this be:

- [ ] a skill (`SKILL.md`, no Python)?
- [ ] a CLI + a README the model reads when it needs it?
- [ ] a tool behind an optional extra?
- [ ] a gateway (one file, text in and out)?
- [ ] something that genuinely has to live in the core?

**Who else needs this?** Speculative abstractions with no second caller get
declined — see [conventions §2](../../docs/context/conventions.md#2-how-much-process-a-change-needs). A concrete use case is worth more than a design.

**Would you want to build it?** Say so and it gets assigned to you.
