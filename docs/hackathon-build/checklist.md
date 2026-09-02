# Build Checklist

> Product pivot (September 2): the abstract Mission Desk has been replaced by “Bring this look home”—a concrete open-web inspiration → owned wardrobe → physical evidence → approved plan journey. Existing safety/tool work remains, but UI and evidence wiring must use Yange's real capture pipelines.

## Build Preferences

- **Build mode:** Autonomous speed-run
- **Comprehension checks:** N/A during implementation; explain the finished system plainly at handoff
- **Git:** Do not commit or push automatically; preserve the base commit and leave one reviewed WebMCP change set for Musoke to commit
- **Verification:** Run automated checks continuously and one visual/judge-path verification after the MVP is integrated
- **Check-in cadence:** Only at a genuine blocker or completed MVP; no routine pauses
- **Wow moment:** The agent reaches a fact it cannot safely know, Yange visibly hands authority to the person, the same tool call resumes from that physical evidence, and one approved plan commits with a replay-safe receipt

## Checklist

- [x] **1. Establish typed mission contracts and persistence**
  Spec ref: `spec.md > Components And Responsibilities > Mission domain`
  What to build: Add mission, evidence-gap, simulated-path, prepared-plan, approval, timeline and receipt contracts plus a versioned, resettable local mission repository that is isolated from Yange's wardrobe ledger.
  Acceptance: Seed reset creates a fresh mission ID without resetting Yange; stored mission state contains no image bytes, signed URLs or raw event ledger.
  Verify: Run focused mission storage/domain tests and inspect persisted JSON shape.

- [x] **2. Build the deterministic mission state machine**
  Spec ref: `spec.md > Components And Responsibilities > Mission domain`
  What to build: Implement valid phase transitions, current-revision calculation, bounded wardrobe inspection, evidence-gap selection and structured out-of-order errors.
  Acceptance: Repeated inspection is read-only; only current gaps can be requested; invalid phase calls return next valid actions and no state mutation.
  Verify: Run `missionDomain.test.ts` covering empty, partial and seeded wardrobes plus invalid ordering.

- [x] **3. Implement three-path simulation and stale binding**
  Spec ref: `spec.md > Data Flow`
  What to build: Produce wear-now, wash-first and verified-fallback results from current Yange evidence, bind results to a stable revision, and invalidate them on constraint or wardrobe changes.
  Acceptance: Exactly three path families appear with feasibility/reason codes; simulation never mutates the event ledger; stale simulations cannot be prepared.
  Verify: Unit-test path count, care-label blocking, fallback behavior and a revision change.

- [x] **4. Implement prepare, human approval and idempotent commit**
  Spec ref: `spec.md > Components And Responsibilities > Existing Yange action adapter`
  What to build: Freeze a feasible path with digest/operation ID, keep approval outside tool arguments, route approved effects through `planCandidate` and `queueLaundry`, and persist one durable receipt.
  Acceptance: Commit-before-approval and altered/stale plans fail safely; duplicate commits return the original receipt and produce one domain effect.
  Verify: Test approval binding, stale rejection, adapter failure and duplicate operation replay.

- [x] **5. Register the seven state-aware WebMCP tools**
  Spec ref: `spec.md > Components And Responsibilities > Tool registry`
  What to build: Add imperative `document.modelContext.registerTool()` registrations, narrow schemas, annotations, runtime feature detection and AbortController-based dynamic unregistration.
  Acceptance: Only phase-valid tools are exposed; reads are annotated read-only; inspiration-derived content is marked untrusted; unsupported browsers remain functional.
  Verify: Run fake-ModelContext lifecycle tests and inspect registered names, schemas, annotations and cleanup.

- [x] **6. Build the real pending human handoff**
  Spec ref: `spec.md > Components And Responsibilities > Human handoff controller`
  What to build: Let `request_missing_evidence` remain pending while a visible evidence card awaits confirmation/decline, resolve the same execution from the response and cancel it through the execution AbortSignal.
  Acceptance: Confirm, decline, stale request, abort and unmount all settle exactly once; unsafe paths remain blocked after decline.
  Verify: Automated resolver tests plus a manual browser call that visibly pauses and resumes.

- [x] **7. Integrate the native “Bring this look home” journey**
  Spec ref: `spec.md > Product And Visual Design Plan`
  What to build: Add the Mission destination and a responsive inspiration → wardrobe match → physical evidence → approved plan journey, with compatibility state, copyable prompt, constraints, timeline, three paths and shared receipt.
  Acceptance: The responsibilities and next action are immediately understandable; mobile works; keyboard focus and reduced motion are respected; the existing Yange wordmark/type/palette remain canonical.
  Verify: Run navigation/component tests, production build and visual checks at desktop and phone breakpoints.

- [x] **8. Add WebMCP eval fixtures and security regressions**
  Spec ref: `spec.md > Risks And Verification`
  What to build: Add success, missing-evidence and stale/replay eval cases plus tests for malicious inspiration text, invalid arguments, wrong order and private-data leakage.
  Acceptance: Fixtures cover tool choice, order, arguments, decline, stale state and replay; output never exposes raw images or the full ledger.
  Verify: Run the WebMCP eval workflow available in the target browser and the full web test/typecheck suite.

- [x] **8b. Add direct open-web inspiration handoff**
  What to build: Let a browser agent send the current public outfit image and its source page directly into Yange, show the attribution visibly, run the image through the existing private preparation pipeline, and wait for the person to save the extracted Look DNA. Keep local upload as an honest fallback when a publisher blocks cross-origin image access.
  Acceptance: No screenshot is required for compatible public images; only HTTPS image references are accepted; remote credentials are omitted; size and media signatures are revalidated; untrusted page text is never treated as an instruction; the WebMCP execution settles once after save, decline, cancellation, or unmount.
  Verify: Focused URL/fetch/registration tests, full web checks, and one native browser execution with a public image.

- [ ] **9. Deploy and prove the separate WebMCP edition**
  Spec ref: `spec.md > External APIs And Dependencies`
  What to build: Create a separate public deployment and repository/remote for the WebMCP branch, preserving the original Agentic Hackathon repo and service unchanged; verify compatible headers and live Mission Desk behavior.
  Acceptance: Public URL loads, live tools register in the target browser, human handoff completes, and no original Yange deployment/repository reference was changed.
  Verify: Health/header checks, live signature mission, git remote inspection and comparison to base `bc3ae05`.

- [ ] **10. Prepare Devpost handoff**
  Spec ref: `spec.md > Demo And Submission Flow`
  What to build: Update README with a dated old/new boundary, WebMCP architecture, reproduction steps, proof receipts, evaluation evidence, license, public URL and a concise under-three-minute demo plan.
  Acceptance: The submission makes clear this is a meaningful rework of Yange, not a new unrelated idea; every challenge requirement has a checkable artifact and enough material exists to run `$prepare-submission`.
  Verify: Review the public repo from a signed-out browser, replay the demo path and confirm the next command is `$prepare-submission`.
