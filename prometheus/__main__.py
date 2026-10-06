"""Entrypoints — installed as the `prometheus` command (and `python -m prometheus`):

prometheus                  chat in the terminal (default)
prometheus dashboard        the browser cockpit → localhost:7777 (+ Telegram if configured)
prometheus connections      list configured integrations and their health
prometheus connect google   sign in to Google Calendar (opens your browser)
prometheus connect waku-memory  one memory shared with your other agents (opens your browser)
prometheus connect treg     live data for research, on your own treg account (opens your browser)
prometheus mcp              MCP servers, and which account each knows you as
prometheus mcp login <name> sign in again — as someone else, or after expiry
prometheus voice            talk to it (needs the [voice] extra)
prometheus telegram         phone → laptop (needs TELEGRAM_BOT_TOKEN)
prometheus discord          Discord → laptop (needs DISCORD_BOT_TOKEN)
prometheus whatsapp         WhatsApp → laptop (needs WHATSAPP_TOKEN, public URL)
prometheus brief            morning briefing (calendar + mail + memory) — as a LOOP
prometheus gather           same job as a GRAPH: github, web, calendar and
                            memory fetched together, then one digest
prometheus skill install <url>  install a community skill
prometheus skill export     copy Prometheus's skills to Claude Code / Codex (--to claude,codex)
prometheus evals turns      grade your own traced turns with the five turn checks (--window today|7d|all)
"""

from __future__ import annotations

import sys


def _tolerant_stdio() -> None:
    """Windows consoles default to a legacy codepage (cp1252) that cannot
    encode the arrows and middots in our output — printing the dashboard
    banner would crash with UnicodeEncodeError before the server even
    started. Keep the console's encoding but replace what it can't show."""
    for stream in (sys.stdout, sys.stderr):
        try:
            stream.reconfigure(errors="replace")
        except (AttributeError, ValueError):
            pass  # not a real console stream (tests, pipes) — leave it alone


def main() -> None:
    _tolerant_stdio()
    args = sys.argv[1:]
    if not args:
        from prometheus.gateway.cli import main as cli_main

        cli_main()
    elif args[0] == "dashboard":
        from prometheus.ops.dashboard import main as dash_main

        dash_main()
    elif args[0] == "connections":
        from prometheus.integrations import cli_main

        sys.exit(cli_main())
    elif args[0] == "connect":
        from prometheus.connect import cli_main as connect_main

        sys.exit(connect_main(args[1:]))
    elif args[0] == "voice":
        from prometheus.gateway.voice import main as voice_main

        voice_main()
    elif args[0] == "telegram":
        from prometheus.gateway.telegram import main as tg_main

        tg_main()
    elif args[0] == "discord":
        from prometheus.gateway.discord import main as discord_main

        discord_main()
    elif args[0] == "whatsapp":
        from prometheus.gateway.whatsapp import main as wa_main

        wa_main()
    elif args[0] == "brief":
        from prometheus.ops.brief import main as brief_main

        brief_main()
    elif args[0] == "gather":
        from prometheus.ops.gather import main as gather_main

        gather_main()
    elif args[0] == "mcp":
        from prometheus.tools.mcp_cli import cli_main as mcp_main

        sys.exit(mcp_main())
    elif args[0] == "skill" and len(args) >= 2 and args[1] == "export":
        from prometheus.memory.procedural.exporter import cli_main as export_main

        sys.exit(export_main(args[2:]))
    elif args[0] == "evals" and len(args) >= 2 and args[1] == "turns":
        from prometheus.ops.turn_evals import cli_main as turns_main

        sys.exit(turns_main(args[2:]))
    elif args[0] == "skill" and len(args) >= 3 and args[1] == "install":
        from prometheus.memory.procedural.installer import install

        install(args[2])
    else:
        print(__doc__)
        sys.exit(1)


if __name__ == "__main__":
    main()
