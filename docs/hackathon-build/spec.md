# Yange for WebMCP — Technical Specification

## Overview

This project is a reworked edition of the existing Yange wardrobe intelligence system, not a separate product concept. The existing wardrobe twin, care-label evidence, outfit planning, Laundry Lab, WearCast, Style Aura and deterministic domain commands remain intact. The WebMCP extension adds a standards-based collaboration surface through which an external agent can inspect a wardrobe mission, discover evidence gaps, pause visibly for the person's physical-world input, compare safe plans and commit one explicitly approved plan through Yange's existing command boundary.

The signature mission is:

> Help me wear this inspiration look on Friday without buying anything or ruining my clothes.

The design goal is to demonstrate the purpose of WebMCP: an agent can understand and operate a rich website through semantic tools while the person remains present, sees the same state and retains authority over consequential actions.

This specification implements the epics in `prd.md`, especially the shared mission surface, evidence-aware inspection, human handoff, deterministic planning, two-phase approval, replay safety and visible proof.

## Stack

- React 19, TypeScript 5.9 and Vite 7 in `apps/web`.
- Existing `@yange/domain` types and commands remain the trusted state/mutation layer.
- The WebMCP imperative API, `document.modelContext.registerTool()`, is used as progressive enhancement.
- The official `webmcp-types` package supplies experimental browser API types. Runtime feature detection remains mandatory because TypeScript support does not imply browser support.
- Vitest covers pure mission rules, registration lifecycle, cancellation, stale-plan rejection and idempotency.
- Existing local event repository and optional Google Cloud mirror remain unchanged.
- Mission coordination state and receipts are stored in a separate versioned local repository so WebMCP experiments cannot corrupt the wardrobe event ledger.

Primary references:

- [WebMCP imperative API](https://developer.chrome.com/docs/ai/webmcp/imperative-api)
- [Secure WebMCP tools](https://developer.chrome.com/docs/ai/webmcp/secure-tools)
- [WebMCP evaluations](https://developer.chrome.com/docs/ai/webmcp/evals)
- [WebMCP community specification](https://webmachinelearning.github.io/webmcp/)

## Architecture

```text
External agent / browser assistant
              │ semantic WebMCP calls
              ▼
┌──────────────────────────────────────────────────────────────┐
│ Yange Mission Desk                                           │
│                                                              │
│ tool registry ── mission state machine ── visible timeline   │
│      │                 │                    │                 │
│      │                 ├── pending human evidence card       │
│      │                 ├── prepared-plan approval card       │
│      │                 └── operation receipts                │
└──────┼─────────────────┼────────────────────┼─────────────────┘
       │ reads           │ proposes           │ person answers
       ▼                 ▼                    ▼
 Existing Yange Twin   Pure simulation      Human authority
       │                                      │
       └──────────── approved command ─────────┘
                              │
                              ▼
               Existing deterministic Yange actions
                `planCandidate` / `queueLaundry`
                              │
                              ▼
                  Event ledger + optional cloud mirror
```

The WebMCP layer never writes directly to garment or outfit state. It may inspect, explain and prepare. The final commit calls the same Yange action functions used by the visible interface. The domain layer therefore remains the single authority for validation, idempotency and state transitions.

## Product And Visual Design Plan

The existing Yange identity remains canonical. This is a new collaboration room inside Yange, not a microsite with a new visual language.

### Tokens

- Deep wardrobe green `#07130f`: page atmosphere and agent-side field.
- Yange emerald `#008a70`: active connection and verified progress.
- Champagne `#c9a15f`: headings, fine rules and approved states; never gradient-filled running text.
- Warm paper `#e7dfd1`: primary body text and human-side field.
- Mulberry `#6f3f68`: the restrained Style Aura learning signal.
- Failure clay `#b96b63`: blocked or stale evidence only.
- Fraunces, lower optical range and light weights, for mission thesis and decisive states.
- General Sans for controls, evidence, status and explanations.

### Layout

Desktop:

```text
┌──────────────── Yange shell + existing navigation ────────────────┐
│ MISSION THESIS                      WEBMCP · CONNECTED / MANUAL    │
├──────────────────────────────┬────────────────────────────────────┤
│ AGENT'S WORK                 │ YOUR PART                           │
│ inspect → gaps → paths       │ photograph / confirm / approve     │
│                              │                                    │
│     ───── stitched evidence handoff line ─────▶                   │
├──────────────────────────────┴────────────────────────────────────┤
│ SHARED RECEIPT / exactly what changed                             │
└───────────────────────────────────────────────────────────────────┘
```

Mobile stacks the agent work, human request and receipt in chronological order. The visible timeline remains the reading spine.

### Signature

The memorable element is a single stitched handoff line that moves between the agent and human columns as authority changes. It is structural: it shows who owns the next action. Motion is limited to one controlled transfer and respects `prefers-reduced-motion`.

### Design Critique

An earlier direction risked becoming another dark dashboard with glowing cards. That would be interchangeable with generic agent demos. The revised direction borrows from garment construction: a seam, evidence tags and a shared worktable. Glass and Aura remain ambient parts of Yange, but the mission surface is quieter so the handoff itself carries the visual idea.

## File Structure

```text
apps/web/src/features/webmcp/
  missionTypes.ts             Mission, evidence, plan, receipt and tool result contracts
  missionDomain.ts            Pure state transitions, inspection, simulation and validation
  missionStorage.ts           Versioned local persistence for missions and receipts
  registerYangeTools.ts       WebMCP registration helpers and lifecycle control
  useYangeWebMcp.ts           React bridge to current TwinState and existing Yange actions
  MissionDesk.tsx             Inspiration-to-owned-wardrobe journey, approval and receipt UI
  CareEvidenceCapture.tsx     Existing private capture + Gemini care extraction at the human boundary
  mission.css                 Responsive, accessible collaboration-room presentation
  missionDomain.test.ts       State-machine and safety tests
  registerYangeTools.test.ts  Fake ModelContext integration and cancellation tests
apps/web/src/webmcp.d.ts       Narrow browser augmentation only if package types require it
evals/webmcp/
  mission-success.json        Complete Friday inspiration mission
  missing-evidence.json       Human handoff and resume
  stale-and-replay.json       Stale plan and duplicate commit protection
```

Existing files changed:

- `apps/web/src/App.tsx`: instantiate the bridge, render `MissionDesk`, and pass existing action functions.
- `apps/web/src/features/judge/JudgeMode.tsx`: extend `YangeView` with `mission`.
- `apps/web/src/features/navigation/YangeNavigation.tsx`: add a plainly named `Mission` destination under More.
- `apps/web/src/features/navigation/ViewIcon.tsx`: add a mission handoff icon.
- `apps/web/src/main.tsx` or existing style entry: import `mission.css`.
- `apps/web/package.json` and lockfile: add official WebMCP types if installation is required.
- `README.md`: distinguish the pre-existing Yange system from the post-August-25 WebMCP rework with commit dates and proof.

## Data Flow

1. The person opens the Mission Desk. If `document.modelContext` is unavailable, the same mission remains usable manually and the page explains how to enable a compatible WebMCP browser.
2. `useYangeWebMcp` holds refs to the latest `TwinState`, ledger revision and existing action functions so registered tool callbacks never close over stale React state.
3. `open_wardrobe_mission` accepts the goal, date and constraints, creates one mission and returns a concise mission ID plus next recommended tool.
4. Tool availability changes with mission phase. Obsolete tools are unregistered by aborting their registration controllers.
5. `inspect_mission_readiness` reads the current twin and inspiration memory, identifies candidate garments and produces explicit evidence gaps. No mutation occurs.
6. When a physical-world fact is missing, `request_missing_evidence` creates a visible card and returns a pending Promise. The person answers in Yange; the resolver completes the same tool call. The execute callback's `AbortSignal` cancels the wait cleanly.
7. `simulate_plan_paths` creates up to three deterministic paths: wear now, wash first, and verified fallback. Every path cites garment IDs, availability, care evidence and constraints.
8. `prepare_shared_plan` freezes the chosen path with `baseRevision`, a stable content digest and an `operationId`. It renders an approval card but performs no domain mutation.
9. The person approves or edits in Yange. Approval is recorded separately from the agent's proposal.
10. `commit_approved_plan` rejects unapproved, altered or stale plans. A valid plan calls existing `planCandidate` and, only when required, `queueLaundry`. The same operation ID cannot produce a second effect.
11. `get_mission_receipt` returns a concise, durable record of evidence used, human decisions, domain actions and resulting revision.

## Components And Responsibilities

### Mission domain

Implements PRD epics 1–6 as pure functions. Mission phases are:

`idle → opened → inspected → waiting-for-human → ready-to-simulate → simulated → prepared → approved → committed`

`cancelled`, `blocked` and `stale` are terminal or recovery states. Transitions outside the defined graph return structured errors and never mutate stored state.

The domain calculates a `WardrobeRevision` from the ledger length and latest event identity. A prepared plan contains the exact revision and digest it was built from. Any later wardrobe event invalidates the prepared plan until it is prepared again.

### Tool registry

Registers eight semantic tools. The first bridges the current public outfit page into Yange; the other seven coordinate the owned-wardrobe mission:

1. `import_current_outfit_inspiration`
2. `open_wardrobe_mission`
3. `inspect_mission_readiness`
4. `request_missing_evidence`
5. `simulate_plan_paths`
6. `prepare_shared_plan`
7. `commit_approved_plan`
8. `get_mission_receipt`

The registry uses small JSON Schemas with `additionalProperties: false`, concise descriptions, and enums wherever the domain is closed. Read-only inspection tools declare `readOnlyHint: true`. Results that reproduce user-provided inspiration text or label notes declare `untrustedContentHint: true`. Consequential tools do not claim to be read-only.

Only tools valid in the current phase are exposed. An `AbortController` owns every registration group so phase changes and unmounting reliably unregister tools.

### Human handoff controller

Maintains resolver records keyed by interaction ID. It supports availability confirmation, care-evidence confirmation, plan edit and final approval. A tool call waits on its own Promise; resolving the visible card resumes it. Cancellation removes the resolver, updates the UI and returns a typed cancelled result. There is no invented `requestUserInteraction()` dependency.

### Mission Desk

Implements the shared visual state required by PRD epics 1, 3, 5 and 7:

- exact user goal and constraints;
- WebMCP capability/connection state;
- current owner: Yange, agent or person;
- compact tool-call timeline;
- evidence gaps with why each matters;
- side-by-side plan paths with cited wardrobe facts;
- final approval card naming every effect;
- receipt that explains what changed and what did not.

Copy uses user language—`Confirm this care label`, `Compare safe paths`, `Approve this plan`—not transport language such as schemas, RPCs or callbacks.

### Existing Yange action adapter

The adapter is intentionally narrow:

- `planCandidate(candidate)` reserves the approved outfit through the existing domain command.
- `queueLaundry(garmentIds)` queues only the garments named by the approved path.
- `updateWardrobeItem` is never exposed as a general agent mutation. The UI may apply one scoped edit only after the person reviews and confirms extracted care facts; that confirmed evidence improves the actual wardrobe twin before the agent re-inspects.

If either existing action returns false, the mission records a failed commit and produces no success receipt.

## External APIs And Dependencies

The WebMCP extension itself requires no new server secret and sends no wardrobe photos to a new third party. It depends on:

- a browser implementing `document.modelContext` for live agent use;
- the official WebMCP types package at build time;
- the existing Yange runtime for wardrobe and Gemini features;
- local browser persistence for the mission journal.

The interface remains useful without WebMCP. Unsupported browsers receive a manual demonstration path rather than a broken page.

## AI Usage

Gemini continues to perform the roles already present in Yange: multimodal garment/care-label extraction and explanation of ambiguous style evidence. The WebMCP rework does not grant Gemini or the external agent authority to invent wardrobe facts or bypass domain rules.

Within the mission:

- the external agent decides which semantic tool to call and explains the person's goal;
- Gemini may help explain or interpret evidence already admitted by Yange;
- deterministic functions decide availability, care compatibility, revision validity, mutation eligibility and idempotency;
- the person supplies physical evidence and final approval.

This division is a central proof point: AI handles ambiguity; deterministic policy protects truth.

## Risks And Verification

### Stale closures or stale plans

Mitigation: tool callbacks read from current React refs; prepared plans bind to a ledger-derived revision and digest. Test that any intervening event produces `STALE_PLAN` and no mutation.

### Duplicate or replayed commit

Mitigation: operation receipts are keyed by operation ID. Repeating a completed commit returns the existing receipt. Test two identical calls and assert one ledger effect.

### Agent bypasses approval

Mitigation: approval exists only in visible UI state, is bound to the plan digest and cannot be supplied as a tool argument. Test commit-before-approval and changed-after-approval.

### Human interaction never resolves

Mitigation: listen to the execution `AbortSignal`, clear pending resolvers on unmount and render cancellation state. Test abort during an evidence wait.

### Tool injection through user content

Mitigation: descriptions never treat wardrobe text as instructions; user-derived output is annotated untrusted; tool schemas allow only expected fields. Test an inspiration title containing instruction-like text and ensure it remains data.

### Unsupported browser

Mitigation: feature detection, visible compatibility badge and manual mission controls. Test rendering with no `document.modelContext`.

### Over-broad integration

Mitigation: only mission-critical tools are registered. Style Aura, Mirror, navigation, profile, shopping and arbitrary garment editing remain outside the tool surface.

Verification commands must cover:

- web typecheck and Vitest suite;
- production web build;
- WebMCP lifecycle tests using a fake model context;
- the three WebMCP evaluation scenarios;
- manual Chrome/WebMCP run showing visible tool execution, human handoff and one receipt;
- regression pass of wardrobe capture, background removal, Laundry Lab and WearCast.

## Demo And Submission Flow

The under-three-minute demo uses one continuous story:

1. Show the existing Yange wardrobe and inspiration look to establish this is a reworked product.
2. State the Friday goal in the agent.
3. The agent opens a mission and inspects the real wardrobe through semantic WebMCP tools.
4. Yange identifies one fact the browser cannot know. The call pauses while the person confirms the garment or care label in the visible page.
5. The agent resumes and compares three safe paths without shopping.
6. The person approves one prepared plan.
7. One commit reserves the outfit/queues necessary laundry and produces a replay-safe receipt.
8. End on the shared timeline: the agent did the cross-wardrobe work, the person supplied reality and consent, and Yange's existing domain rules protected the result.

The submission must state plainly:

- what existed before August 25, 2026;
- what was added specifically for the WebMCP Challenge;
- the dated branch/commits containing the extension;
- how to reproduce the mission in a supported browser;
- why WebMCP is essential rather than decorative: without semantic tools, an agent cannot inspect this living wardrobe state, visibly pause for physical evidence and safely resume a prepared transaction inside the same web experience.
