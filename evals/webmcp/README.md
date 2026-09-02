# Yange WebMCP evaluations

These datasets follow the Chrome WebMCP evaluation shape: natural-language `messages` plus the expected semantic tool call and arguments.

- `mission-success.json` tests outcome-level discovery, bounded inspection and simulation-before-action.
- `open-web-import.json` tests the no-screenshot handoff from the current public outfit page into Yange with source attribution.
- `missing-evidence.json` tests the human authority boundary and decline recovery.
- `stale-and-replay.json` tests re-inspection after a human edit and receipt retrieval instead of duplicate mutation.

Deterministic behavior—privacy projection, state order, stale revisions, approval binding and replay—is covered by Vitest in `apps/web/src/features/webmcp/`. Model-facing call selection can be run with GoogleChromeLabs WebMCP Evals by providing the registered tool list for the corresponding Mission Desk phase.
