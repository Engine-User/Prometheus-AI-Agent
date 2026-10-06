# Connect it to your life

Everything here is opt-in and behind its own extra. None of it changes the
loop — a gateway moves text in and out, an integration is a tool the agent
may call. The four pillars work with none of this installed.

Moved out of the README, which had grown to 569 lines for a project whose
promise is that you can read it in an afternoon. Nothing was rewritten.

## Talk to it

```bash
uv pip install -e '.[voice]'
prometheus voice        # hands-free: always-listening for "prometheus prometheus"
```

**Hands-free by default.** `prometheus voice` listens for the wake word **"prometheus prometheus"** — a tiny
Whisper model scans the mic; when it hears the phrase, the big model takes over for your
command and speaks the reply. Change or disable it:

```bash
PROMETHEUS_WAKE_WORD="hey prometheus"  prometheus voice     # any phrase, no training
PROMETHEUS_WAKE_WORD=""          prometheus voice     # push-to-talk instead (Enter, speak, Enter)
```

The matcher is ~15 transparent lines with a deterministic eval; it accepts cross-script
variants (`"prometheus prometheus,わくわく"`). A trained openWakeWord model is the efficient v2 upgrade.

**A beautiful voice.** Out of the box it uses macOS `say` — and Prometheus auto-picks the nicest
voice you have, preferring a downloaded Premium/Enhanced one (System Settings ▸ Accessibility
▸ Spoken Content ▸ System Voice) over the robotic built-ins. For the real neural upgrade,
install [Kokoro](https://github.com/hexgrad/kokoro) — a fully local, offline British-butler
voice that's picked up automatically, no env var needed:

```bash
uv pip install '.[voice-neural]'          # neural Kokoro (bm_george); pulls torch (~2GB)
```

Override either engine with `PROMETHEUS_VOICE` (a `say` voice name, or a Kokoro voice like `bf_emma`).

## Phone to laptop

```bash
pip install -e '.[telegram]'
# message @BotFather, /newbot, put the token in .env, then:
make telegram
```

Text your bot from anywhere and your laptop runs the turn — long-polling, so no
public URL or webhook. Set `TELEGRAM_ALLOWED_USER` to lock it to just you.

## Brief me on my week (Apple Calendar + Mail)

```bash
PROMETHEUS_APPLE_TOOLS=1 make brief      # macOS; grant the permission prompts once
```

Prometheus reads your **real** Calendar.app (including events invited by email) and
recent Apple Mail, cross-references your memory, and writes a focus-first briefing
with clickable `message://` links. Cron it for a morning greeting:

```
30 7 * * *  cd ~/waku-agent && make brief
```

It runs through the normal harness, so it animates on the dashboard like any turn.

## Mirror created events to Google Calendar

The local SQLite database and `calendar.ics` stay authoritative. To also write
`create_event` results to Google Calendar, install the opt-in extra and configure
[Application Default Credentials](https://cloud.google.com/docs/authentication/provide-credentials-adc):

```bash
pip install -e '.[gcal]'
# Keep the downloaded client file OUTSIDE the repo — it is only an input to
# gcloud, which stores the resulting credentials in ~/.config/gcloud/.
gcloud auth application-default login \
  --client-id-file=~/.config/prometheus/gcal-client.json \
  --scopes=https://www.googleapis.com/auth/calendar.events
PROMETHEUS_GOOGLE_CALENDAR=1 prometheus
```

Nothing secret ever needs to live in the repo: the client file is read once by
`gcloud`, and the credentials it mints land in `~/.config/gcloud/`. (`.gitignore`
also blocks `credentials.json` and `*token*.json` as a second line of defence.)

The target defaults to the signed-in user's `primary` calendar; set
`PROMETHEUS_GOOGLE_CALENDAR_ID` for another calendar. `list_events` still reads the
local database. Google failures never roll back the local event, and attendee
notifications are suppressed (`sendUpdates=none`).

## Share one memory with your other agents (Prometheus Memory)

Prometheus's own memory is local. Each fact is also written to `~/.prometheus/memory/`,
one file per fact, the layout the Prometheus Memory importer already uploads for
Claude Code; episodes, `MEMORY.md` and `state.db` are never written there.
[Prometheus Memory](https://waku.one) is a hosted memory that several agents share
over MCP: save something in one agent, and recall it in another.

```bash
pip install -e '.[mcp]'
prometheus connect waku-memory     # or /connect waku-memory in the dashboard chat
```

That adds Prometheus Memory to `~/.prometheus/mcp.json`, next to any servers already there,
and opens your browser once to sign in. Restart Prometheus and its tools appear as
`waku_memory_*`; `prometheus mcp` shows which account you are signed in as. A config
still pointing at Prometheus Memory's old address is moved to the current one.
From then on, each fact consolidation keeps is also sent to Prometheus Memory
(spec 006). Facts kept before you connected stay in `~/.prometheus/memory/` for the
importer.

The same memory, in your other agents:

| Agent | How it connects |
|---|---|
| Claude Code, Codex, Hermes | the steps on [waku.one/docs](https://www.waku.one/docs) |
| Grok Bot | Settings → Plugins → custom connector: URL `https://api.waku.one/mcp`, header `Authorization: Bearer <key>`, with a key from waku.one → Account → Keys |
| Muse Code, or any MCP client | a remote (streamable HTTP) server at `https://api.waku.one/mcp` in its MCP settings |

Grok Bot and Muse Code are not yet tested by us. Grok Bot runs in the cloud,
and its connector form takes a URL and a header rather than a browser sign-in,
which is why it needs a key. Keep that key in Grok Bot's own form, never in a
file in this repo.

### Carry your skills too

```bash
prometheus skill export --to claude,codex    # ~/.claude/skills/ and ~/.codex/skills/
prometheus skill export --project            # ./.claude/skills/, which Muse Code also reads
```

Each skill folder is copied as it is. A copy you changed in the other agent is
kept unless you pass `--force`. Skills that call Prometheus's own tools (a calendar
skill calls `create_event`) arrive as instructions without those tools behind
them. Saving skills into Prometheus Memory, so a cloud agent like Grok Bot can recall
them, waits until Prometheus Memory has a place for skills.

## Live data for research (treg)

[treg](https://treg.to) is an MCP server with thousands of endpoints behind
it: search results, keyword data, companies and people, social profiles, ad
libraries, web pages. With it connected, a question like "research the
competitors of mem0" is answered from live sources rather than the model's
memory.

```bash
pip install -e '.[mcp]'
prometheus connect treg            # or /connect treg in the dashboard chat
```

That adds `{"name": "treg", "url": "https://treg.to/mcp/", "oauth": true}` to
`~/.prometheus/mcp.json`, next to any servers already there, and opens treg's own
sign-in page once. Restart Prometheus and its tools appear as `treg_*`. Running it
again adds nothing; a server you named `treg` that points somewhere else is
left alone, and the command says so. On your own machine treg is your own
account and bills you directly. The **Connections** page shows treg as
connected, not signed in or not added, with a Connect button that runs the
same `/connect treg` in the chat.

A hosted Prometheus Agent on waku.one needs none of this: its container reaches treg
through the platform's relay, and the calls are charged to its credits
([hosted/README.md](../hosted/README.md)). To use your own treg account there
instead, click Configure on the treg card and paste an org-scoped treg key:
calls then go straight to `https://treg.to/mcp/` and treg bills your account,
not your credits. Clear the key to go back to the relay.

`TREG_API_KEY` works the same on your own machine: when it is set in `.env`,
Prometheus reaches the `treg` server in `mcp.json` at treg.to with that key instead
of the sign-in, and the key is sent only to treg.

## Let Jev decide which memories earn a slot

```bash
TYPESAFE_API_KEY=...      # typesafe.ai
PROMETHEUS_SLOT_GATE=jev
```

With both set, Jev scores every retrieved memory against your message and only
the ones that change the answer go into the prompt; it also scores facts before
consolidation stores them. One call per turn, about a quarter of a second. Leave
either unset, or let TypeSafe be unreachable, and Prometheus behaves as before. The
TypeSafe card on Connections sets both.

## Connect MCP servers

```bash
pip install -e '.[mcp]'
```

Create `~/.prometheus/mcp.json` and any Model Context Protocol server's tools appear to
the agent, namespaced `<server>_<tool>` (and in the dashboard's Tools ▸ MCP tab):

```json
{"servers": [{"name": "fs", "command": "npx",
  "args": ["-y", "@modelcontextprotocol/server-filesystem", "/tmp"]}]}
```

**Node-free demo** — a tiny self-contained Python MCP server ships in the repo:

```bash
cp examples/mcp.demo.json .prometheus/mcp.json   # points at evals/fixtures/mcp_demo_server.py
make dashboard                               # demo_word_count / demo_reverse_text appear in Tools
```

Same pattern scales to any server, yours or a vendor's — no changes to Prometheus's code.

### Remote servers (Streamable HTTP)

A server that is already running somewhere else is named by `url` instead of
`command`. This is the MCP spec's transport for remote servers; the older
HTTP+SSE transport is deprecated and is not supported.

```json
{"servers": [{"name": "waku_memory",
              "url": "https://your-host/mcp",
              "auth_env": "PROMETHEUS_MEMORY_API_KEY"}]}
```

`auth_env` names an **environment variable**; its value is sent as
`Authorization: Bearer <value>`. The credential never goes in `mcp.json` —
that file gets pasted into bug reports, and a bearer token in one is a leaked
credential. If the variable is not exported, Prometheus says so by name rather than
connecting anonymously and letting the server's 401 look like an outage.

A remote server that restarts forgets every session it had, and answers the
next call with HTTP 404 "Session not found". Prometheus then opens a new session and
sends that call once more, as the MCP spec asks of a client. Calls that find
the session gone at the same moment share one new session.

### Signing in instead of holding a key

A server that speaks MCP's authorization spec needs no key at all. Say so, and
Prometheus opens your browser on first use:

```json
{"servers": [{"name": "waku_memory",
              "url": "https://your-host/mcp",
              "oauth": true}]}
```

Nothing is issued out of band and nothing is pasted anywhere. Prometheus registers
itself with the server, catches the redirect on `127.0.0.1:41765`, and keeps
the result in `~/.prometheus/mcp-auth/<server>.json`, written `0600` — one file per
server, so a corrupt one costs a single connection rather than all of them.
Delete that file to sign out.

`oauth` and `auth_env` are two answers to one question, so naming both is
refused rather than resolved by precedence.

### Which account am I signed in as?

```bash
prometheus mcp                      # every server, and the account each knows you as
prometheus mcp login waku_memory    # sign in again — as someone else, or after expiry
prometheus mcp logout waku_memory   # forget the token
```

Two agents pointed at the same server as two different people look exactly
like a broken server: you write something in one and the other cannot find it.
`prometheus mcp` prints the email, so the mismatch is visible in one line instead of
inferred from missing memories.

`login` signs out first on purpose. Without that the stored token is still
valid, the server never asks who you are, and "sign in as someone else"
silently keeps the account you were trying to leave.

Headless or over SSH there is no browser to open: the authorization URL is
printed, and you can finish the sign-in from any machine that has one.

Try it against the demo server, no remote host required:

```bash
python evals/fixtures/mcp_demo_server.py --http --port 8931
# .prometheus/mcp.json → {"servers": [{"name": "demo", "url": "http://127.0.0.1:8931/mcp"}]}
```

Requires `mcp>=2.1` (`pip install -e '.[mcp]'`). The 1.x SDK spelled this
transport differently and the remote branch does not work on it.

