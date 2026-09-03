# Yange 2.0 — Bring This Look Home

## One-line Summary

Say “bring this look home” on an outfit page. Yange’s WebMCP agent carries the inspiration into your real wardrobe, asks you for physical truth it cannot know, compares safe paths, and commits only the plan you approve.

## Tagline

The web can see the outfit. Only you can see the shirt on your chair. Yange lets the agent stop, ask, and continue.

## Problem

Online inspiration and the clothes we own live in separate worlds.

I might find the perfect outfit on Pinterest, but recreating it means saving a screenshot, opening another app, remembering which similar pieces I own, checking what is clean, decoding care labels, accounting for weather, and rebuilding the plan by hand. A browser agent can understand the inspiration page, but it cannot know whether my trousers are actually available or whether an uncertain care label makes a wash plan unsafe. My wardrobe app knows my clothes, but before this rework it could not receive and complete an intention that began elsewhere on the web.

That gap is personal. I built the original Yange alone in Kampala after repeatedly losing as much as 30 minutes to a wardrobe that had clothes but no memory. In Luganda, *yange* means **mine**. The promise is not another generic outfit generator; it is a system grounded in my clothes, my evidence, and my final say.

## Solution

Yange 2.0 turns “bring this look home” into one visible collaboration between a person, a browser agent, and a physical wardrobe.

1. While viewing a compatible public outfit page, the person asks the browser agent to bring the look home with Yange.
2. `import_current_outfit_inspiration` carries the public image URL and source attribution into Yange. No screenshot is required for cooperative publishers or Pinterest image URLs.
3. Yange first fetches without cookies or referrer. When Pinterest blocks browser CORS, a same-origin Vercel function accepts only `i.pinimg.com`, rejects private DNS and unsafe redirects, enforces a 12 MB limit, and validates both MIME type and actual file signature. Arbitrary hosts are rejected rather than turning Yange into an open proxy.
4. Gemini extracts reviewable Look DNA: palette, silhouette, key pieces, layering, styling, and occasion cues.
5. The agent opens a bounded mission and inspects a privacy-filtered projection of the Wardrobe Digital Twin—names, state, and evidence quality, never raw photos or the event ledger.
6. Deterministic policy compares exactly three futures: **wear now**, **wash first**, and **verified fallback**.
7. When the plan reaches something the internet cannot know, `request_missing_evidence` remains pending. Yange visibly asks the person to inspect the real garment or photograph its care label. The same tool execution resumes after confirmation or decline.
8. The agent may prepare one feasible path, but approval is not a tool argument. The person approves the exact plan in Yange; only then can the agent commit it once.
9. Yange returns the same evidence and operation receipt to both participants.

The result is not “AI clicks my wardrobe app.” It is shared work divided by authority: the agent handles cross-page context and multi-step planning; the person supplies reality and consent; Yange’s deterministic domain protects truth.

[![An inspiration image becomes reviewable Look DNA inside Yange](https://raw.githubusercontent.com/NestroyMusoke/Yange-2.0/main/docs/submission-assets/02-inspiration-to-look-dna.png)](https://github.com/NestroyMusoke/Yange-2.0/blob/main/docs/submission-assets/02-inspiration-to-look-dna.png)

*The journey begins with a look found elsewhere on the web. Yange turns it into reviewable palette, silhouette and styling cues—never imaginary wardrobe inventory.*

## Why This Matters

WebMCP makes Yange materially better.

I did not add WebMCP simply to make an existing project eligible. Yange is close to my heart, so the integration had to remove a real piece of friction or it did not belong. It does: the idea now moves from the page where I discover it into the wardrobe that can act on it, without the screenshot → download → upload → explain-again ritual. More importantly, WebMCP lets the collaboration pause at the boundary between web knowledge and physical truth, ask me, and continue. That capability completes a product interaction I could not express honestly before.

**It removes the handoff tax.** The intention begins where inspiration is found. A compatible outfit image—including a Pinterest image that blocks browser CORS—travels directly into Yange with attribution instead of forcing the person through screenshot, download, upload, and re-explanation.

**It gives the agent useful access without giving it everything.** The agent can inspect a narrow wardrobe projection, discover missing evidence, simulate alternatives, and prepare a plan. It cannot read private image bytes, dump the event ledger, rewrite garment facts, purchase clothing, or bypass approval.

**It lets the web admit where it ends.** Whether a garment is on the chair, in the basket, or already clean is a physical fact. Yange does not hide that boundary behind model confidence. It turns uncertainty into a visible request, keeps the tool call pending, and resumes from the person’s answer.

This interaction was difficult before because neither side had the whole truth. WebMCP provides the semantic contract through which the browser agent and live Yange page cooperate while the person remains present.

## The Heart Of Yange: A Presence That Learns

I wanted Yange to feel less like a static utility and more like a friend who notices the small things. Style Aura is that idea made visible: a living WebGL atmosphere behind the interface that gradually reflects the colours associated with confident, repeated wears.

It does not snap to a new palette after one tap and pretend to know the person. Each accepted interaction can move the Aura only a small step—at most 8%—using exact colour feedback, recency and repeated confidence as evidence. Familiarity is earned over time. The Aura is deliberately human-facing rather than exposed as an agent tool: WebMCP carries the work, while Style Aura lets the person *feel* that Yange is becoming theirs.

[![Yange live product loop showing Style Aura learning alongside the wardrobe](https://raw.githubusercontent.com/NestroyMusoke/Yange-2.0/main/docs/submission-assets/00-yange-live-product.gif)](https://github.com/NestroyMusoke/Yange-2.0/blob/main/docs/submission-assets/00-yange-live-product.gif)

*A wardrobe state change is immediate; learned familiarity is gradual. Style Aura makes that difference visible.*

## What Existed Before And What I Added

Yange is an existing project. I preserved the submitted foundation at commit `bc3ae05` and built this WebMCP edition afterward in a separate repository and deployment.

| Existing Yange foundation | Added during the WebMCP Challenge |
| --- | --- |
| Event-sourced Wardrobe Digital Twin | “Bring this look home” mission surface |
| Garment, care-label, and inspiration capture | Direct attributed public-image handoff |
| Gemini Look DNA extraction | Open-web input treated as untrusted evidence |
| Deterministic outfit, laundry, and WearCast policy | Eight imperative WebMCP tools |
| Existing domain commands as mutation authority | Phase-aware tool discovery and unregistration |
| Human interface | Real pending tool execution during physical evidence capture |
| Replay-safe operations | Prepare → visible approval → revision-bound commit → shared receipt |

The original Agentic Hackathon repository and deployment were left unchanged during judging. Yange 2.0 lives at `github.com/NestroyMusoke/Yange-2.0` and `web-jet-one-21.vercel.app`.

## WebMCP Leverage

Yange registers eight outcome-level tools with `document.modelContext.registerTool()`:

- `import_current_outfit_inspiration`
- `open_wardrobe_mission`
- `inspect_mission_readiness`
- `request_missing_evidence`
- `simulate_plan_paths`
- `prepare_shared_plan`
- `commit_approved_plan`
- `get_mission_receipt`

This is intentionally not a tool for every button. Tool availability changes with mission phase. Obsolete actions are unregistered through `AbortController`; reads declare `readOnlyHint`; inspiration-derived output declares `untrustedContentHint`; the open-web import declares `openWorldHint`; schemas reject additional properties.

The deepest WebMCP behavior is the pending human handoff. `request_missing_evidence` creates a Promise-backed interaction connected to the execution `AbortSignal`. The page visibly asks for one physical fact. Confirmation, decline, cancellation, and unmount each settle exactly once. After confirmation, the same native execution returns person-supplied evidence and the tool set advances to simulation.

Approval cannot be smuggled in by an agent. `commit_approved_plan` accepts no approval argument. The UI stores human approval separately and binds it to the exact plan digest and wardrobe revision. If anything changes, commit returns `STALE_PLAN` and produces no mutation. Replaying a successful operation returns the original receipt instead of repeating effects.

## Architecture

```text
Public outfit page
  → browser agent carries source page + main image
  → import_current_outfit_inspiration
  → HTTPS / MIME / size / signature validation
  → private prepared copy + visible source attribution
  → human-reviewed Gemini Look DNA
  → privacy-filtered wardrobe inspection
  → missing physical fact?
       yes → pending WebMCP execution → person confirms/declines → same call resumes
       no  → continue
  → deterministic wear-now / wash-first / fallback simulation
  → prepare against current revision + digest
  → visible human approval
  → existing Yange domain command commits once
  → shared evidence + operation receipt
```

The WebMCP layer never writes directly to garment or outfit state. Existing Yange commands remain the sole mutation boundary.

[![Confirmed care evidence becomes an explained, conflict-safe laundry plan](https://raw.githubusercontent.com/NestroyMusoke/Yange-2.0/main/docs/submission-assets/03-care-safe-laundry.png)](https://github.com/NestroyMusoke/Yange-2.0/blob/main/docs/submission-assets/03-care-safe-laundry.png)

*The physical handoff has a consequence: once care evidence is confirmed, deterministic rules block unsafe pairings and build explained wash groups. If the evidence is uncertain, Yange holds the garment for review instead of guessing.*

## How I Used AI

AI has two deliberately different roles.

**Inside the product**, Gemini handles ambiguity: it extracts typed garment, care-label, and inspiration evidence and explains bounded results. It does not decide whether an unavailable garment can be worn, whether laundry is safe, whether a plan is stale, or whether mutation may commit. Deterministic TypeScript policy owns those decisions.

**Inside the WebMCP experience**, the browser agent interprets the person’s outcome, selects semantic tools, carries public inspiration into Yange, and coordinates the mission. The agent receives only a bounded projection and structured results.

## How I Used Codex

I built Yange independently as a solo developer, with Codex as my continuous engineering collaborator. Every line of code in this WebMCP edition was written, reviewed, or tested with help from Codex.

Codex helped me research the emerging WebMCP surface, challenge an early integration that felt like tools added for their own sake, narrow the product to one coherent mission, write the state machine and schemas, connect pending human interactions to cancellation, generate adversarial tests, diagnose native Chrome execution races, and document exactly what existed before the challenge. I made the product decisions, supplied the lived problem, tested the physical wardrobe flows, and remained the sole developer and submitter.

## Key Features

- Direct, attributed open-web inspiration handoff, including a locked-down Pinterest server fallback rather than an open image proxy
- Eight narrow, phase-aware WebMCP tools instead of DOM scraping or button wrappers
- Privacy-filtered inspection that excludes raw images and the event ledger
- A genuine pending tool call crossing from web context into physical evidence
- Exactly three reversible paths compared before state changes
- Human approval stored outside agent arguments and bound to plan digest + revision
- Replay-safe commit and a shared receipt explaining evidence, rejected paths, and effects
- Full manual experience in browsers without WebMCP support

## Evidence And Verification

- Native Chrome 151 exercised the real `document.modelContext`, `getTools()`, and `executeTool()` surface—not direct React handler calls.
- The native run observed dynamic tool replacement, one pending human handoff, exactly three plan families, a visible approval boundary, one commit, and a durable receipt.
- That run exposed and led to fixes for optional execution contexts, registration rotation races, inappropriate shoe care-label requests, and human-friendly deadline parsing.
- 54 web tests pass across registration, server-import security, mission rules, privacy, stale plans, duplicate replay, media validation, navigation, and regressions.
- Strict TypeScript checking and the production Vite build pass.
- WebMCP eval fixtures cover open-web import, mission success, missing evidence, decline, stale state, and replay.

[Read the native browser proof](https://github.com/NestroyMusoke/Yange-2.0/blob/main/docs/hackathon-build/native-browser-proof.md) · [Inspect the tool registry](https://github.com/NestroyMusoke/Yange-2.0/blob/main/apps/web/src/features/webmcp/registerYangeTools.ts) · [Inspect the tests](https://github.com/NestroyMusoke/Yange-2.0/tree/main/apps/web/src/features/webmcp)

## Testing Instructions

No account or credentials are required.

1. Open `https://web-jet-one-21.vercel.app/?view=mission` in ChatGPT’s in-app browser or Google Chrome with WebMCP enabled.
2. Open **Mission** from **More** if it is not already selected.
3. On a compatible public outfit page, ask: **“Bring this look home with Yange.”** The agent should call `import_current_outfit_inspiration`, pass the current page and main image, then open Yange.
4. Review the source attribution and image. Pinterest should cross the restricted same-origin importer automatically when browser CORS fails. Extract and save Look DNA. Other blocked publishers use the visible upload fallback.
5. Ask: **“Help me wear this inspiration look on Friday without buying anything or ruining my clothes.”**
6. Let the agent inspect the wardrobe. When Yange asks for a physical fact, confirm it or use the care-label demo capture.
7. Compare all three paths, prepare a feasible path, approve it in Yange, and commit it.
8. Open **Technical proof** to inspect registered tools and timeline. Read the final shared receipt.

Manual controls reproduce the same domain flow when WebMCP is unavailable.

## Public Demo Link

https://web-jet-one-21.vercel.app/?view=mission

## Public Repository Link

https://github.com/NestroyMusoke/Yange-2.0

## Demo Video

TODO: Add the final public YouTube URL. It must be under three minutes and include audio.

## Screenshot Shot List

1. Mission thesis plus browser-agent status.
2. Attributed outfit source after `import_current_outfit_inspiration`.
3. Inspiration beside the extracted, reviewable Look DNA.
4. Physical evidence card while the native tool execution remains pending.
5. Three futures, separate human approval, and the shared receipt.
6. Style Aura moving gradually behind the live wardrobe experience.

The image sequence tells one story: inspiration enters, the agent reaches uncertainty, the person supplies truth, a safe action is prepared, and Yange visibly becomes more personal over time.

## Known Limitations

- WebMCP requires ChatGPT’s in-app browser or Chrome with WebMCP enabled.
- Pinterest browser CORS is handled through a restricted `i.pinimg.com` same-origin importer. Other blocked publishers receive local upload; Yange does not bypass authentication, paywalls, or publisher access controls.
- The Vercel edition demonstrates browser collaboration; the original Google Cloud services remain documented as the pre-challenge foundation.
- Direct ingestion supports public JPEG, PNG, and WebP images up to 12 MB.

## TODO Official Form Fields

| Official field | Draft answer |
| --- | --- |
| Submitter Type | Individual |
| Country | Uganda |
| App Status | Existing |
| Existing-project update | I preserved Yange’s pre-challenge foundation at commit `bc3ae05`, then added a separate “Bring this look home” WebMCP edition: direct attributed open-web inspiration transfer, eight imperative and phase-aware tools, privacy-filtered inspection, a real pending human evidence handoff, three deterministic paths, visible approval, stale/replay protection, shared receipts, eval fixtures, tests, documentation, a new repository, and a separate Vercel deployment. |
| Live URL | https://web-jet-one-21.vercel.app/?view=mission |
| Testing instructions | Use the eight-step testing flow above. No credentials required. |
| Public repository | https://github.com/NestroyMusoke/Yange-2.0 |
| Agents/clients tested | Google Chrome 151 with WebMCPTesting and DevToolsWebMCPSupport enabled, exercising native `document.modelContext.getTools()` and `executeTool()`. Designed for ChatGPT’s in-app browser; unsupported browsers retain the manual path. |
| AI tools leveraged | OpenAI Codex as a continuous engineering collaborator; Gemini 3.5 Flash Lite and Gemini 3.5 Flash through Vertex AI in the Yange foundation; browser agents through WebMCP in the challenge edition. |
| Learning derived | Significant |
| AI career value | Yes |

## Submission Readiness Notes

- Live URL: verified `200 OK` on September 3, 2026.
- Public repository: verified `200 OK` on September 3, 2026.
- MIT license: present at repository root.
- Devpost registration: confirmed for The WebMCP Challenge.
- Remaining blocker: final public YouTube demo URL under three minutes.
