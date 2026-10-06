# Prometheus — UI Navigator

Every page of the local control-plane UI, captured live from the running app.

| Application | http://localhost:7777  (hash-routed SPA, single port) |
| --- | --- |
| Repository | C:\\Users\\archi\\Desktop\\Testing\\Code\\Local-Claw-Agent\\agent-main |
| Data root | C:\\Users\\archi\\.prometheus  (state.db, MEMORY.md, SOUL.md, skills/) |
| Captured | 6 October 2026, headless Chrome 145, 1920 px viewport, one capture per route |
| Coverage | 29 screenshots — 15 nav pages plus 14 sub-tabs, across 5 groups |

## Index

| # | Section | Route |
| --- | --- | --- |
| A · Overview & Chat |  |  |
| 1 | Overview — reference capture | http://localhost:7777/#overview |
| 2 | Overview | http://localhost:7777/#overview |
| 3 | Gateway | http://localhost:7777/#gateway |
| 4 | Loop | http://localhost:7777/#loop |
| B · System |  |  |
| 5 | Graph workflows | http://localhost:7777/#graph |
| 6 | Tools — catalogue | http://localhost:7777/#tools |
| 7 | Tools — results | http://localhost:7777/#tools/results |
| 8 | Tools — MCP | http://localhost:7777/#tools/mcp |
| 9 | Database | http://localhost:7777/#database |
| 10 | Database — facts / episodes | http://localhost:7777/#database/facts |
| 11 | Database — chat_log | http://localhost:7777/#database/chat_log |
| 12 | Database — SQL console | http://localhost:7777/#database/query |
| 13 | Observability | http://localhost:7777/#observability |
| 14 | Observability — tools | http://localhost:7777/#observability/tools |
| 15 | Observability — memory | http://localhost:7777/#observability/memory |
| 16 | Observability — spend | http://localhost:7777/#observability/spend |
| 17 | Evals | http://localhost:7777/#evals |
| C · Memory deep-dive |  |  |
| 18 | Memory — overview | http://localhost:7777/#memory |
| 19 | Memory — semantic | http://localhost:7777/#memory/semantic |
| 20 | Memory — episodic | http://localhost:7777/#memory/episodic |
| 21 | Memory — skills | http://localhost:7777/#memory/skills |
| 22 | Memory — SOUL | http://localhost:7777/#memory/soul |
| 23 | Memory — consolidation | http://localhost:7777/#memory/consolidation |
| D · Arena |  |  |
| 24 | Model race | http://localhost:7777/#compare/models |
| 25 | Memory race | http://localhost:7777/#compare/memory |
| 26 | Judgment race | http://localhost:7777/#judgment |
| E · Setup |  |  |
| 27 | Models | http://localhost:7777/#models |
| 28 | Connections | http://localhost:7777/#connections |
| 29 | Behaviour | http://localhost:7777/#settings |

## A · Overview & Chat (UI)

### 1. Overview — reference capture

http://localhost:7777/#overview

The app's home screen as first shipped: live counters, the retrieval-gate split, the clickable architecture diagram, and the chat dock (browser chrome included).

![Screenshot 1: 1. Overview — reference capture](Prometheus_Guide_images/screenshot-01.png)

CLI --

![Screenshot 2: 1. Overview — reference capture](Prometheus_Guide_images/screenshot-02.png)

### 2. Overview

http://localhost:7777/#overview

Dashboard: six live counters (spend, avg turn, turns, tool calls, facts, events), the 100%/0% retrieval-gate split bar, and the clickable Harness / Loop / Memory / LLM-Ops architecture diagram.

![Screenshot 1: 2. Overview](Prometheus_Guide_images/screenshot-01.png)

### 3. Gateway

http://localhost:7777/#gateway

Cross-channel inbox — web, phone (Telegram) and voice all answered by the same brain; every conversation is listed with channel badge, timestamp and reply.

![Screenshot 3: 3. Gateway](Prometheus_Guide_images/screenshot-03.png)

### 4. Loop

http://localhost:7777/#loop

The agent turn itself: user message, the GATE · SKIP decision with its reason, the reply, and the per-turn latency and cost.

![Screenshot 4: 4. Loop](Prometheus_Guide_images/screenshot-04.png)

## B · System

### 5. Graph workflows

http://localhost:7777/#graph

Structure around the loop — live DAG topologies for the triage and gather workflows, drawn from the engine's own describe() so the picture cannot drift from the code, plus a one-click run.

![Screenshot 5: 5. Graph workflows](Prometheus_Guide_images/screenshot-05.png)

### 6. Tools — catalogue

http://localhost:7777/#tools

The 8 capabilities the agent can call, grouped into flagship tasks, web search, self-management and experimental, each with the exact description the model reads.

![Screenshot 6: 6. Tools — catalogue](Prometheus_Guide_images/screenshot-06.png)

### 7. Tools — results

http://localhost:7777/#tools/results

What tool calls actually wrote: calendar events from create_event (also mirrored to calendar.ics) and drafted messages sitting in the outbox.

![Screenshot 7: 7. Tools — results](Prometheus_Guide_images/screenshot-07.png)

### 8. Tools — MCP

http://localhost:7777/#tools/mcp

Model Context Protocol status and a 30-second connect recipe — install the extra, write .mcp.json, restart — to borrow tools from any external server.

![Screenshot 8: 8. Tools — MCP](Prometheus_Guide_images/screenshot-08.png)

### 9. Database

http://localhost:7777/#database

The raw persistence layer: the state.db path and size on disk, per-table row counts with what each table holds, and the 14 FTS5 tables behind keyword top-k retrieval.

![Screenshot 9: 9. Database](Prometheus_Guide_images/screenshot-09.png)

### 10. Database — facts / episodes

http://localhost:7777/#database/facts

Raw SQLite tables with column names as sticky headers; this is the uncurated altitude that the Memory tab renders from.

![Screenshot 10: 10. Database — facts / episodes](Prometheus_Guide_images/screenshot-10.png)

### 11. Database — chat_log

http://localhost:7777/#database/chat_log

Every message tagged by session_id — the table consolidation reads from to distil memories.

![Screenshot 11: 11. Database — chat_log](Prometheus_Guide_images/screenshot-11.png)

### 12. Database — SQL console

http://localhost:7777/#database/query

A read-only SQL console over state.db with three runnable example queries; the file is opened read-only so nothing typed here can change your data.

![Screenshot 12: 12. Database — SQL console](Prometheus_Guide_images/screenshot-12.png)

### 13. Observability

http://localhost:7777/#observability

What each turn did, cost and remembered — TODAY / 7 DAYS / ALL window switcher, four metric cards, and an expandable per-turn trace list.

![Screenshot 13: 13. Observability](Prometheus_Guide_images/screenshot-13.png)

### 14. Observability — tools

http://localhost:7777/#observability/tools

Tool-call distribution across the window, split by origin (agent, Waku Memory, local) with the error count.

![Screenshot 14: 14. Observability — tools](Prometheus_Guide_images/screenshot-14.png)

### 15. Observability — memory

http://localhost:7777/#observability/memory

Retrieval counts versus writes kept — how often memory was consulted and how many facts survived the write pass.

![Screenshot 15: 15. Observability — memory](Prometheus_Guide_images/screenshot-15.png)

### 16. Observability — spend

http://localhost:7777/#observability/spend

The spend ledger: total, charged versus estimated dollars, per-model and per-day token usage priced at list price, sourced from usage.jsonl.

![Screenshot 16: 16. Observability — spend](Prometheus_Guide_images/screenshot-16.png)

### 17. Evals

http://localhost:7777/#evals

Five checks grade every turn (spend claim, one report, grounded numbers, errors handled, under budget) and the release gate reports 2,091 deterministic tests in 156 files plus 3 AI-judge suites.

![Screenshot 17: 17. Evals](Prometheus_Guide_images/screenshot-17.png)

## C · Memory deep-dive

### 18. Memory — overview

http://localhost:7777/#memory

The three pillars with live counts — Semantic, Episodic, Procedural — the retrieval-gate bar, and the on-disk files: state.db, MEMORY.md, SOUL.md and skills/.

![Screenshot 18: 18. Memory — overview](Prometheus_Guide_images/screenshot-18.png)

### 19. Memory — semantic

http://localhost:7777/#memory/semantic

Durable, distilled facts about you and your people, each one editable and deletable straight from the UI.

![Screenshot 19: 19. Memory — semantic](Prometheus_Guide_images/screenshot-19.png)

### 20. Memory — episodic

http://localhost:7777/#memory/episodic

One dated summary per consolidation run — the always-small trail of what a session was about.

![Screenshot 20: 20. Memory — episodic](Prometheus_Guide_images/screenshot-20.png)

### 21. Memory — skills

http://localhost:7777/#memory/skills

Procedural memory: 7 SKILL.md files loaded only when a message matches, each editable inline and saved back to its file on disk.

![Screenshot 21: 21. Memory — skills](Prometheus_Guide_images/screenshot-21.png)

### 22. Memory — SOUL

http://localhost:7777/#memory/soul

The persona file — the durable rules about how the agent should behave for this user.

![Screenshot 22: 22. Memory — SOUL](Prometheus_Guide_images/screenshot-22.png)

### 23. Memory — consolidation

http://localhost:7777/#memory/consolidation

Every 6 exchanges a cheap model reads the unconsolidated chat_log and distils it into durable facts plus one episode; shows 2 messages queued against a 12-message trigger threshold.

![Screenshot 23: 23. Memory — consolidation](Prometheus_Guide_images/screenshot-23.png)

## D · Arena

### 24. Model race

http://localhost:7777/#compare/models

One message, every brain at once on the same harness with isolated homes — graded by a referee model, with per-model gate latency, cost and tools as receipts.

![Screenshot 24: 24. Model race](Prometheus_Guide_images/screenshot-24.png)

### 25. Memory race

http://localhost:7777/#compare/memory

One brain, five stores told the same 5 facts then quizzed with 4 questions, showing right versus wrong answers per store — including a deliberately corrected fact.

![Screenshot 25: 25. Memory race](Prometheus_Guide_images/screenshot-25.png)

### 26. Judgment race

http://localhost:7777/#judgment

The same 15 cases (NOUL, CHOICE, SCORE) sent to 7 judge models at once, so you can see which judge is right on your own domain instead of guessing.

![Screenshot 26: 26. Judgment race](Prometheus_Guide_images/screenshot-26.png)

## E · Setup

### 27. Models

http://localhost:7777/#models

Provider card grid for 12 providers with logo, enabled / unconfigured status, and a per-provider EDIT modal for keys.

![Screenshot 27: 27. Models](Prometheus_Guide_images/screenshot-27.png)

### 28. Connections

http://localhost:7777/#connections

Channels (Telegram, Discord, WhatsApp), productivity (Google and Apple Calendar) and memory backends (Notion, Mem0, Zep, LangMem, Supabase), each with a Configure action.

![Screenshot 28: 28. Connections](Prometheus_Guide_images/screenshot-28.png)

### 29. Behaviour

http://localhost:7777/#settings

Runtime switches for how a turn runs: sub-agent delegation, and graph-workflow triage that rebuilds the agent in-process with no restart.

![Screenshot 29: 29. Behaviour](Prometheus_Guide_images/screenshot-29.png)
