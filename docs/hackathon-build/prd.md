# Product Requirements Document

## Product Summary

Yange — WebMCP Edition turns online outfit inspiration into an executable plan made only from clothes the person already owns. A person gives Yange a screenshot or saved look; a WebMCP browser agent translates it across the live wardrobe; Yange pauses at physical facts the web cannot know; and the person uses the existing camera/care-label pipeline to let the same agent call resume from confirmed evidence.

The signature outcome is specific: prepare a real wardrobe for a future look without buying unnecessary clothes, inventing inventory or violating confirmed care constraints.

## Target User

The primary user:

- owns clothes whose availability and care state changes over time;
- may save an inspiration look or have a future occasion in mind;
- wants help across multiple Yange features without manually navigating each tab;
- expects the agent to explain uncertainty rather than silently guess;
- wants final authority over physical facts, personal comfort and consequential actions.

The judge is also a first-run user. A seeded mission must make the collaboration understandable without account creation, private uploads or prior knowledge of Yange.

## Experience Principles

1. **One continuous journey.** Inspiration, owned matches, physical evidence and approval remain visible in the same surface.
2. **Complementary authority.** The agent handles breadth and simulation; the person handles physical evidence, taste and approval.
3. **Evidence before action.** Missing information becomes a request, not a hallucinated default.
4. **Preview before commit.** Inspection and simulation remain reversible until a person approves a prepared plan.
5. **Receipts over reassurance.** Every step reports what changed, what did not, and why.
6. **Yange becomes more useful.** WebMCP connects capabilities Yange already had into an outcome that starts outside the app and crosses the physical world; it is not a developer console or pasted chatbot.

## Core User Journey

### First view

The journey opens with:

- one plain-language explanation of what the human controls and what the agent can do;
- a clear WebMCP connection state;
- one clear invitation to upload an outfit found anywhere online;
- a prompt the user can copy into the browser agent;
- a live timeline initially showing no agent actions;
- a human-editable constraint strip for occasion, deadline, weather preference and “buy nothing.”

### Collaboration

The inspiration image first passes through Yange's real Look DNA pipeline. Extracted visual cues are explicitly untrusted and cannot create inventory. The resulting look is saved to the same inspiration memory used by the rest of Yange.

The browser agent opens the mission and receives a compact mission identifier. The page visibly records that the agent joined. Inspection returns garment readiness, known constraints, the planned deadline and evidence gaps—but no raw private images or unrestricted event history.

When the plan is blocked by missing evidence, Yange presents a human card naming:

- the exact garment;
- the exact missing fact;
- why the fact matters;
- the acceptable ways to resolve it;
- the option to decline.

After the user supplies or confirms the evidence, the agent re-inspects current state and simulates three paths:

- wear now;
- wash first;
- use a verified fallback.

Each path shows feasibility, blocked reasons, garments, care impact, weather assumption and reversibility. The agent prepares one path, but the person may alter a visible constraint before approval. Any change invalidates the prepared plan and requires re-simulation.

Approval creates a short-lived approval token tied to the plan digest. The agent can then commit once. The UI shows the resulting reservation, staged laundry intervention and final evidence receipt.

## Epics And User Stories

### Epic 1: Understand the collaboration immediately

- As a first-time user, I want to see what the agent can and cannot do so that I know whether it is safe to involve it.
- As a judge, I want a seeded mission and copyable prompt so that I can test the central experience within seconds.
- As a user without WebMCP support, I want a clear compatibility state and a usable human surface so that the page does not appear broken.

Acceptance criteria:

- The Mission Desk labels the human and agent responsibilities in plain language.
- The WebMCP state reads `available`, `registered`, `in use` or `unsupported`; it never shows an indefinite spinner.
- The seeded mission can be reset without resetting the rest of Yange.
- The copyable prompt describes the outcome, not tool names.
- Unsupported browsers show enablement guidance while preserving the human mission view.

### Epic 2: Open and inspect a bounded mission

- As an agent, I want to open one mission and inspect only the state relevant to it so that I can reason without scraping the DOM or receiving unnecessary private data.
- As a user, I want each inspection to appear in the timeline so that agent access is visible.

Acceptance criteria:

- Opening returns a mission ID, revision and allowed next actions.
- Inspection output contains the deadline, constraints, readiness summary, candidate garment IDs/names and evidence gaps.
- Inspection returns no image bytes, signed URLs, raw ledger or unrelated profile fields.
- The tool and UI use the same mission revision.
- Repeating a read-only inspection does not change wardrobe or mission state.
- Every successful or rejected tool call creates a visible timeline entry with timestamp, intent and result category.

### Epic 3: Ask the person for physical truth

- As an agent, I want to request the smallest missing fact so that I can proceed without inventing wardrobe evidence.
- As a person, I want to understand why Yange is interrupting me and retain the ability to decline.

Acceptance criteria:

- The request names one missing fact and explains its consequence for the current plan.
- Only evidence gaps returned by the current inspection can be requested.
- The user can photograph the real care label with Yange's existing private capture pipeline, review the Gemini extraction, confirm the exact facts into the real wardrobe twin, or decline.
- Declining returns a structured `declined` result and keeps all unsafe paths blocked.
- Confirming evidence increments the mission/wardrobe revision and visibly resolves the gap.
- A stale evidence request is rejected if the underlying garment or mission changes.
- The WebMCP execution remains pending while the visible card awaits a response, resumes when the person answers, and returns a structured cancellation result if the execution `AbortSignal` fires.

### Epic 4: Compare futures before acting

- As a user, I want to see multiple plausible paths so that the agent does not present one opaque answer as inevitable.
- As an agent, I want structured feasibility and blocked reasons so that I can explain the tradeoff accurately.

Acceptance criteria:

- Simulation produces exactly three named path families: wear now, wash first and verified fallback.
- Each path reports `feasible`, `blocked` or `needs evidence`.
- A blocked path exposes machine-readable reason codes and short human explanations.
- Simulation cannot mutate garments, outfits, laundry queues or the event ledger.
- The Mission Desk visualizes all three paths simultaneously.
- Changing a human constraint updates the mission revision and marks previous simulations stale.
- External inspiration content is labelled untrusted and cannot create inventory or instructions.

### Epic 5: Prepare, approve and commit safely

- As an agent, I want to prepare a validated plan so that the person can review one concrete proposal.
- As a person, I want the final decision to remain mine and to know exactly what approval will change.
- As the system, I want duplicate or stale commits to be harmless.

Acceptance criteria:

- Prepare accepts only a feasible path from the current simulation.
- The prepared plan lists every intended mutation and every non-action.
- Approval is explicit, visible and tied to the prepared plan digest and current revision.
- Commit fails with a structured stale-plan result if relevant state changed after preparation.
- Commit without approval cannot mutate state.
- The same operation ID and plan digest return the original receipt instead of duplicating effects.
- A successful commit updates the existing Yange state through domain commands, not direct object mutation.
- The final timeline distinguishes proposal, human approval and committed actions.

### Epic 6: Inspect a durable receipt

- As a user or judge, I want one concise receipt so that I can verify the collaboration without trusting narration.
- As an agent, I want a bounded structured result so that I can accurately summarize completion.

Acceptance criteria:

- The receipt includes mission ID, base and final revisions, evidence used, rejected paths, approved path, operation IDs and resulting garment/outfit state.
- The receipt identifies which facts came from the person, which were computed by deterministic policy and which text was generated or imported.
- The same receipt appears in the human UI and structured tool output.
- Individual WebMCP tool outputs remain concise enough for the recommended agent budget.
- Resetting the seeded mission creates a new mission ID and does not rewrite the previous receipt.

### Epic 7: Prove the WebMCP implementation

- As a technical judge, I want to inspect registrations, schemas, annotations and evals so that I can verify this is a non-trivial WebMCP implementation.

Acceptance criteria:

- Tools use `document.modelContext.registerTool()` rather than simulated global functions.
- Tool availability changes with mission state and unavailable actions are unregistered.
- Read-only inspection/simulation tools carry the correct read-only hint.
- Inspiration-derived output carries an untrusted-content hint.
- Test fixtures cover correct selection, incorrect order, invalid arguments, stale state, declined interaction and duplicate commit.
- The README contains a dated pre-existing/new-work boundary beginning at `bc3ae05`.

## Edge Cases

### No wardrobe items

Inspection returns an empty-state result and allows only evidence capture guidance. It does not produce placeholder outfits presented as real.

### One garment or no complete outfit

Simulation may return all paths blocked. The Mission Desk explains the smallest missing category but does not turn the demo into shopping.

### Missing care evidence

Wash-first remains blocked until the person confirms the relevant care fact. Wear-now or fallback may remain available if independently safe.

### User changes a constraint during agent work

The mission revision changes. Any prepared plan becomes stale, the UI labels it visibly and commit requires re-simulation.

### Agent calls tools out of order

The tool returns a structured next-valid-actions response. It does not silently perform prerequisite actions.

### Agent or browser repeats a write

The original operation receipt is returned and the timeline labels the call as a replay.

### User declines evidence or approval

The mission remains open, records the decline and offers only paths that do not require the declined authority.

### WebMCP disappears or is unsupported

Registered tools are cleaned up where possible. The human surface remains usable and clearly indicates that agent collaboration is unavailable.

### External inspiration contains malicious instructions

The system treats it as data, labels it untrusted, extracts only allowed visual/style fields and never promotes its text into tool instructions.

## What We Are Building

- One responsive Mission Desk integrated into Yange navigation.
- Seven semantic WebMCP tools with runtime validation and lifecycle management.
- One seeded judge mission with deterministic reset.
- One human interaction/resume path.
- One three-way simulation and two-phase commit.
- One shared visual/structured receipt.
- WebMCP unit tests, lifecycle tests and eval fixtures.
- Deployment, README delta documentation and a sub-three-minute demo path.

## What We Would Add With More Time

- Cross-device mission handoff.
- Signed multi-person household approvals.
- Calendar-originated missions.
- Live camera streaming during a guided closet audit.
- Multiple concurrent missions and conflict resolution.
- A reusable package that turns other event-sourced web products into shared WebMCP mission surfaces.

## Submission Proof Points

1. A human changes a physical-world fact and the agent visibly resumes from it.
2. Tool availability changes as the mission advances.
3. Three counterfactual paths prove that the agent reasons before mutation.
4. A stale plan is rejected after a human UI edit.
5. A duplicate commit returns the same receipt and creates no second effect.
6. The same receipt is legible to the person and machine-readable to the agent.
7. Inspector and eval outputs verify schemas, annotations, ordering and failure behavior.
8. Git history proves all WebMCP work occurred after the preserved Yange base commit.
