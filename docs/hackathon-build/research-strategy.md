# WebMCP Strategy — Yange

## Constraint

Yange remains the product. The Agentic Hackathon repository remains untouched while this repository preserves its committed history and documents all WebMCP work from base commit `bc3ae05`.

## What is already crowded

The current WebMCP landscape already contains:

- storefront search, filtering, carts and checkout;
- travel, reservation and form completion;
- CRUD productivity and developer tools;
- creative editors controlled through semantic primitives;
- cooperative games where the agent becomes a second player;
- accessibility layers that expose spatial or interface state.

Repeating those patterns as `search_wardrobe`, `pick_outfit` and `mark_worn` would be functional but generic. It would expose Yange to an agent without making Yange meaningfully better for a person and agent working together.

## Recommended thesis

**Yange becomes a shared evidence room between a person, an agent and a physical wardrobe.**

The person owns what only a person can know or do:

- photograph or physically inspect a garment;
- confirm a care label, current availability or comfort constraint;
- decide whether a proposed plan feels right;
- authorize consequential changes.

The agent owns what software is better at:

- inspect state across the wardrobe without screen scraping;
- identify missing evidence and ask for exactly what blocks the plan;
- simulate outfit and laundry paths against weather and future commitments;
- compare tradeoffs and prepare a reversible plan;
- leave a compact, structured receipt of every assumption and action.

WebMCP is the protocol that lets both participants work in the same live Yange session. The agent does not imitate clicks, receive unrestricted internal state or bypass Yange's deterministic safety rules.

## Signature journey

The demonstration prompt is deliberately outcome-level:

> Help me wear this inspiration look on Friday without buying anything or ruining my clothes.

The agent then:

1. opens a shared mission using semantic WebMCP tools;
2. inspects only authorized wardrobe readiness and inspiration evidence;
3. discovers that one candidate lacks confirmed care evidence;
4. requests a human interaction inside Yange: photograph or confirm the physical care label;
5. resumes with the new evidence and simulates the viable paths;
6. presents a visual comparison of wear-now, wash-first and verified-fallback plans;
7. asks the human to approve one plan;
8. commits the approved reservation and staged laundry intervention once;
9. returns an evidence receipt that both the human UI and agent can inspect.

The collaboration cannot be completed by the agent alone because the missing physical evidence and personal approval are real boundaries. It cannot be completed efficiently by the human alone because the cross-feature state, forecast and counterfactual planning are the agent's work.

## WebMCP mechanics worth demonstrating

- Imperative `document.modelContext.registerTool()` tools with narrow JSON schemas.
- Dynamic tool availability based on mission state rather than one flat permanent tool list.
- Read-only annotations for inspection and simulation tools.
- Untrusted-content annotations for imported inspiration text or external evidence.
- A genuinely pending async tool execution while Yange renders a human-only evidence or approval card; the tool resumes from the person's response and respects the execution `AbortSignal`.
- Visible UI updates for every tool execution so the person can follow the agent's work.
- Operation IDs and two-phase proposal/commit semantics for replay safety.
- Structured outputs under the recommended response budget.
- Deterministic unit tests plus WebMCP evals for tool selection, ordering and argument accuracy.

## Minimum winning surface

Build one complete mission, not WebMCP wrappers for every Yange tab:

- `open_wardrobe_mission`
- `inspect_mission_readiness`
- `request_missing_evidence`
- `simulate_plan_paths`
- `prepare_shared_plan`
- `commit_approved_plan`
- `get_mission_receipt`

The rest of Yange remains human-accessible and proves this is a coherent product rather than a protocol demo.

## Explicitly cut

- Agent control over profile settings, Style Aura, Mirror or every navigation destination.
- Shopping, price comparison and open-web product search.
- Calendar authentication as a prerequisite for judging.
- Autonomous marking of physical garments as washed or worn without human evidence.
- Dozens of tiny tools that mirror buttons or DOM elements.

## Research references

- WebMCP overview and API model: https://developer.chrome.com/docs/ai/webmcp
- WebMCP security guidance: https://developer.chrome.com/docs/ai/webmcp/secure-tools
- WebMCP eval guidance: https://developer.chrome.com/docs/ai/webmcp/evals
- WebMCP specification: https://webmachinelearning.github.io/webmcp/
- OpenAI showcase: https://developers.openai.com/showcase
- GoogleChromeLabs demos: https://github.com/GoogleChromeLabs/webmcp-tools/tree/main/demos
