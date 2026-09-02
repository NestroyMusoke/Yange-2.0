# Native WebMCP Browser Proof

## Environment

- Date: 2026-09-02
- Browser: Google Chrome 151
- API: native `document.modelContext`
- Flags: `WebMCPTesting`, `DevToolsWebMCPSupport`, experimental web-platform features
- Page: local production candidate at `/?view=mission`

This was a Chrome DevTools Protocol run against the real page. It did not call the React handlers directly and did not substitute a fake `ModelContext`.

## Observed signature journey

1. Chrome discovered `open_wardrobe_mission`, `inspect_mission_readiness` and `get_mission_receipt` from `document.modelContext.getTools()`.
2. Native `executeTool()` ran `inspect_mission_readiness`. The result exposed six bounded garment projections and one physical-availability gap while excluding `imageAssetId`, `careLabelAssetId`, private media and the raw event ledger.
3. `request_missing_evidence` remained pending while the page visibly rendered “The internet ends here. Your wardrobe begins.”
4. A visible person action confirmed that the chocolate trousers were physically available. The same native tool call then resolved with `source: "person"` and phase `ready-to-simulate`.
5. Chrome replaced the evidence tool with `simulate_plan_paths`. The native call returned exactly three families: `wear-now`, `wash-first` and `verified-fallback`. Their statuses were `feasible`, `needs-evidence` and `feasible`.
6. `prepare_shared_plan` returned three explicit non-actions: no purchase, no agent rewrite of garment facts and no raw photo shared through WebMCP.
7. The person approved the exact prepared plan in the visible Yange interface. Only then did Chrome expose `commit_approved_plan`.
8. The native commit reserved one existing outfit and produced operation `mission-commit-ffff48d0-114b-4dab-9619-3484368d95da`.
9. The page remained rendered with a shared receipt, two cited facts and replay safety. The post-commit tool set contracted to `open_wardrobe_mission` and `get_mission_receipt`.

## Defects the native run caught

- Chrome's manual `executeTool()` path can omit the optional execution context. The adapter now supplies a safe fallback signal while preserving agent-call cancellation.
- Rotating phase-scoped registrations in the same turn as resolving a pending human handoff caused Chrome to reject a successful result as a transient failure. Yange now persists the answer, resolves the tool call, then rotates registrations.
- The first inspection could request wash-method evidence for shoes. Care-label gaps are now restricted to tops, bottoms and outerwear; accessories can still be considered for style without pretending they belong in a wash load.
- The human label `Friday · 7:00 PM` reached WearCast as an invalid timestamp after commit. The mission boundary now converts human weekday labels to a valid planning timestamp while keeping the original label visible.

These corrections are covered by deterministic regression tests in addition to this native-browser run. This document proves local browser integration; it does not claim that the separate public WebMCP deployment has already occurred.
