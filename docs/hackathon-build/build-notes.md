# Build Notes

## 2026-09-01 — Onboarding

- Musoke explicitly corrected the framing: this is a reworked Yange submission, not a new product idea.
- The original submitted Yange repository is frozen. A local clone was created on `codex/webmcp-challenge` from base commit `bc3ae05`, and its remote to the original repository was removed before edits.
- Official rules were reviewed and acknowledged. Existing work must be distinguished from new WebMCP work with dated commit evidence.
- Current strategic thesis: WebMCP should let the human and agent hold different, complementary responsibilities in one visible wardrobe workflow. The agent must not merely expose buttons or reproduce Yange's navigation through tools.
- Deepening rounds completed: 0. Scope interview is next.

## 2026-09-01 — Scope

- The earlier conversation supplied the brain dump, lived problem, product identity, aesthetic direction and technical background, so those questions were not repeated.
- Research reaction: storefront, reservation, form, CRUD, creative-editor, cooperative-game and accessibility patterns are already represented. Yange will differentiate through a mixed-authority physical-world workflow.
- Time budget confirmed from the participant: less than two days.
- Scope cut to one signature Friday-readiness mission and seven semantic tools.
- Explicitly rejected a broad `search_wardrobe` / `pick_outfit` wrapper because it would demonstrate access, not collaboration.
- Deepening rounds completed: 1, using the existing product and submission conversation as source material.

## 2026-09-01 — PRD

- Expanded the single mission into seven observable user stories with explicit acceptance criteria.
- Kept product behavior separate from implementation decisions.
- Added critical edge cases: empty wardrobe, no feasible outfit, declined evidence, out-of-order tools, constraint changes, replay and prompt injection through inspiration content.
- The submission wow moment is the interrupted-and-resumed plan: the agent asks for a physical fact, the person supplies it, and the same visible mission continues.
- Deepening rounds completed: 1, focused on state changes during agent work and proof that a commit is safe.

## 2026-09-01 — Standards correction

- Official WebMCP documentation confirmed that `requestUserInteraction()` is future/draft discussion, not a current normative API.
- Replaced it with a standards-aligned pattern: an async tool execution visibly pauses on a Yange human-interaction card, resumes from the person's response and honours the execution `AbortSignal`.
- Completed the technical specification. The implementation preserves the existing Yange domain as the sole mutation authority and adds a separate Mission Desk, a seven-tool dynamic WebMCP surface, pending human handoffs, two-phase approval, revision binding and replay-safe receipts.
- Design direction: keep the canonical Yange identity and use one garment-construction metaphor—a stitched handoff line—to show authority moving between the agent and the person. Removed the risk of presenting the extension as a generic glowing agent dashboard.
- Build planning was handed off based on the participant's repeated request to start immediately and finish quickly. Autonomous speed-run selected with automated verification, no routine pauses and no automatic git commits.
- The participant had already defined the wow moment: a WebMCP call reaches a physical fact it cannot know, visibly hands control to the person, resumes from that evidence and commits one approved, replay-safe plan. No redundant planning question was asked.
- Checklist locked to ten sequenced items: trusted mission core first, WebMCP lifecycle and human handoff next, native interface after the contract is real, then evals, separate deployment and submission proof.
- Build started in autonomous speed-run mode. The original Yange repository remains untouched; all implementation is under the separate `yange-webmcp` clone.
- Completed checklist items 1–6: isolated mission persistence, deterministic phase machine, privacy-filtered inspection, evidence gating, three-path simulation, revision/digest binding, visible approval, replay-safe receipt, seven imperative WebMCP tools, dynamic registration and a pending human response controller.
- Integrated the first Mission Desk UI and added official-shape WebMCP evaluation datasets. The full web suite passes: 10 test files and 41 tests; TypeScript typecheck and the production Vite build also pass.
- Visual QA is still open. The local app compiled and served, but the in-app browser test harness could not initialize its browser assets. No screenshot-review claim was made.
- README now opens with an explicit old/new boundary at base commit `bc3ae05`, preserving Yange as the product and describing the WebMCP layer as the challenge-specific rework.
- Active safety correction: existing outfit reservation and laundry queue commands are separate transactions. The challenge proof does not claim false atomicity. Wash-first is compared but remains non-committable until WearCast supplies a verified drying window; currently feasible commit paths perform one approved reservation.
- This correction prevents an unverifiable submission claim and makes cancellation behavior part of the proof.

## 2026-09-02 — Product pivot and native pipeline integration

- Musoke correctly rejected the first Mission Desk as technically sound but too abstract: a user could not immediately say why WebMCP made Yange better.
- Reframed the extension around one concrete desire: “I found this outfit online—can I wear it using only clothes I own?”
- Reused Yange's real Look DNA pipeline for inspiration capture and Gemini extraction. Imported visual cues remain explicitly untrusted and cannot create wardrobe inventory.
- Reused Yange's real private image preparation and care-label analysis at the WebMCP human boundary. The pending tool waits while the person photographs a label, reviews the extraction and confirms a scoped update to the actual Wardrobe Digital Twin.
- Replaced the developer-facing two-column worktable with a native four-beat journey: Look I found → Look I own → Fact only I know → Plan we share. Semantic tool names and receipts remain available in a collapsible technical proof drawer.
- Fresh direct links to `?view=mission` now bypass general onboarding so a judge reaches the signature interaction immediately; normal Yange entry still preserves onboarding.
- Desktop visual QA confirmed the intended Yange identity and clear above-the-fold thesis. Mobile breakpoint QA exposed and corrected the mission container calculation and small-screen headline wrapping.
- Verification after the pivot: full typecheck passes, all 41 web tests pass, all workspace tests pass, the web production build passes, and the complete workspace production build passes outside the filesystem sandbox. The only build warning is the existing >500 KB chunk notice.
- The original Agentic Hackathon checkout was rechecked: tracked diff remains clean. Its pre-existing untracked `h origin main` file remains untouched.

## 2026-09-02 — Native Chrome 151 verification

- Launched Chrome 151 with the WebMCP testing and DevTools support flags against the real local Mission Desk. `document.modelContext`, `registerTool`, `getTools` and `executeTool` were present.
- Added the missing direct open-web entry point after product review: `import_current_outfit_inspiration` accepts only credential-free HTTPS source/image references, marks page content untrusted, fetches without cookies or referrer, revalidates MIME/size/signature, shows attribution in Yange and remains pending until the person saves or declines the Look DNA. Publisher CORS refusal falls back visibly to local upload.
- Verification after the direct handoff: 48 web tests pass, focused WebMCP/security tests pass, TypeScript passes and the production build succeeds. A fresh interactive browser-control attempt was unavailable because the local browser harness could not initialize its assets; the previously recorded native Chrome 151 mission proof remains valid for the seven mission tools, while the new import tool is covered by registration and media-boundary tests pending the final deployment run.
- Completed the signature journey through native tool discovery and execution: bounded inspection → pending visible human handoff → person-sourced availability → exactly three simulations → prepared plan → visible approval → one domain commit → shared receipt.
- Dynamic registration was observed at each authority boundary. The final tool set contained only `open_wardrobe_mission` and `get_mission_receipt`.
- Native testing found and corrected three integration defects: an optional execution-context mismatch, registration cancellation racing a pending tool result, and a human-readable deadline reaching WearCast as an invalid timestamp. It also caught and corrected a care request targeting shoes.
- The exact, reproducible observations and one local operation ID are recorded in `native-browser-proof.md`. No public deployment claim is made yet.
- Final local verification passed: 42 web tests, every workspace test suite, every workspace TypeScript check and the complete production build. The web build retains the existing advisory warning for a JavaScript chunk slightly above 500 KB; it is not a build failure.
