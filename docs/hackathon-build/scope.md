# Project Scope

## Project Name

**Yange — WebMCP Edition**

This is a meaningful extension of the existing Yange product, not a separate product concept. The final public repository must identify base commit `bc3ae05` and distinguish every WebMCP-era change.

## One-Line Summary

Yange lets a person bring an outfit they found anywhere on the web home to the wardrobe they already own: the agent translates inspiration, Yange matches real inventory, and the person supplies the physical evidence the internet cannot know.

## Time Budget

- Working window: less than two days before September 3, 2026 at 11:00 PM Africa/Kampala.
- Scope ruler: one complete, deeply tested collaboration mission; no site-wide tool coverage.

## Target User

A person who owns enough clothes to lose track of readiness, care constraints and future outfit dependencies, but who does not want to surrender personal judgment or physical truth to an opaque autonomous agent.

## Problem

Yange already understands garments, care labels, weather, planned outfits and laundry state. A conventional agent still has two bad options:

1. scrape and click through a rich human interface, losing semantic intent and reliability; or
2. operate through a detached backend interface, hiding its work from the person and missing real-time human evidence.

The physical wardrobe also contains facts an agent cannot safely infer: whether a garment is actually available, what a care label says when evidence is missing, and whether a proposed outfit feels acceptable to the person.

## Signature Workflow — Bring This Look Home

The user starts with an online outfit or screenshot and asks:

> Help me wear this inspiration look on Friday without buying anything or ruining my clothes.

1. The person uploads the inspiration image; Yange's existing Gemini pipeline extracts palette, silhouette and styling cues as untrusted data.
2. The agent opens a visible mission and matches those cues against the person's actual Yange wardrobe.
3. It identifies the smallest physical evidence gap blocking a trustworthy recreation.
4. The same WebMCP call visibly pauses while the person photographs a care label or checks the real garment.
5. Yange's existing private capture pipeline extracts the evidence, the person confirms it, the actual wardrobe twin is updated, and the pending tool resumes.
6. The agent simulates wear-now, wash-first and verified-fallback paths.
7. The person edits constraints or approves one prepared plan in the same interface.
8. The agent commits only the approved reservation and staged laundry action.
9. Yange produces one receipt containing evidence used, assumptions, rejected paths, operations and resulting state.

## What We Are Building

- A native “Bring this look home” journey inside the existing Yange interface, using its real Look DNA, private capture and care-label pipelines.
- A focused imperative WebMCP tool surface:
  - `open_wardrobe_mission`
  - `inspect_mission_readiness`
  - `request_missing_evidence`
  - `simulate_plan_paths`
  - `prepare_shared_plan`
  - `commit_approved_plan`
  - `get_mission_receipt`
- Dynamic tool registration based on current mission state.
- Read-only and untrusted-content annotations where applicable.
- A genuine human boundary implemented as a pending async tool execution: Yange renders the physical-evidence or approval card, resolves the tool promise from the person's response, and honours cancellation through the execution `AbortSignal`.
- Two-phase prepare/commit semantics with operation IDs and replay protection.
- Visible per-call receipts and a compact collaboration timeline.
- Deterministic unit tests for tool logic and WebMCP eval cases for discovery, ordering, arguments and refusal paths.
- A judge-ready mission that can use a demo capture but performs the same pipeline as a real local photo.
- A separate deployment and public repository that cannot alter the Agentic Hackathon submission.

## What We Are Not Building

- A generic chatbot embedded inside Yange.
- Tool wrappers for every tab, button or CRUD operation.
- Agent control over Style Aura, profile settings, Mirror or navigation.
- Open-web shopping or product search.
- Calendar authentication as a demo dependency.
- Automatic claims that a physical garment was worn, washed or available without human evidence.
- A second recommendation engine; existing deterministic Yange policies remain authoritative.
- A detached developer console or abstract tool dashboard.

## Product And Safety Rules

- The agent sees a minimal structured projection, never raw private media or the full event ledger.
- Imported inspiration and external text are labelled untrusted.
- Inspection and simulation cannot mutate wardrobe state.
- A prepared plan expires if the underlying wardrobe revision changes.
- A consequential commit requires a matching prepared-plan digest and explicit human approval.
- Duplicate calls return the original receipt.
- Unsupported WebMCP browsers still expose the human Mission Desk and explain how to enable agent tools.

## Inspiration And References

- Chrome WebMCP: explicit purpose, shared live page state and visible tool execution.
- WebMCP security guidance: narrow exposure, read-only/untrusted annotations and explicit interaction boundaries.
- WebMCP eval guidance: test tool choice, order, arguments, output and complete journeys.
- Cooperative games demonstrate complementary roles, but Yange applies that relationship to a consequential physical-world workflow rather than entertainment.
- Existing Yange architecture contributes typed commands, event-sourced state, deterministic scoring, care safety and replay-aware orchestration.

## Demo Path

1. Open the deployed Yange Mission Desk with a seeded Friday mission.
2. Ask the browser agent the outcome-level prompt.
3. Show WebMCP tool discovery—no DOM clicking or selectors.
4. Watch the agent inspect the wardrobe and surface one missing care fact.
5. Complete the requested human evidence card.
6. Watch the agent resume and render three counterfactual paths.
7. Change one preference directly in the UI and ask the agent to re-simulate from live page state.
8. Approve the safe plan.
9. Show the structured commit receipt, changed wardrobe reservation and rejected unsafe path.
10. Show the WebMCP inspector/eval result and the dated diff from base Yange.

## Submission Story

Yange already gave a wardrobe memory. WebMCP gives that memory a trustworthy way to collaborate with a person in the browser.

The central innovation is not that an agent can control Yange. It is the closed loop from open-web inspiration to owned wardrobe to a physical garment in the person's hand. The human provides embodied truth and taste; the agent handles translation, breadth and simulation; deterministic policy protects shared state. Every handoff remains visible.

## Definition Of Done

- The signature mission completes in ChatGPT's in-app browser or Chrome with WebMCP enabled.
- At least one tool is dynamically revealed by mission state.
- At least one tool visibly pauses for human interaction and resumes from the response.
- The agent compares multiple paths before any mutation.
- Commit replay is idempotent and stale prepared plans are rejected.
- WebMCP-specific tests and eval fixtures pass.
- The public README distinguishes pre-existing Yange from new WebMCP work.
- The live URL, public licensed repository and sub-three-minute demo are ready before the deadline.
