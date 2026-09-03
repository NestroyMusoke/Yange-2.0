# Live Vercel Release Audit — September 3, 2026

## Decision

**Conditional go.** The deployed artifact is healthy, byte-identical to the passing local production build, and contains the intended WebMCP surface. One final native WebMCP run against the public Vercel URL is still required before claiming the entire live agent journey is proven end to end.

## Confirmed

- `https://web-jet-one-21.vercel.app/?view=mission` returned `200 OK` over HTTPS.
- The deployed HTML references `index-DgD3jXkO.js` and `index-D299mexj.css`.
- Both deployed assets match the freshly built local assets byte for byte.
- The deployed JavaScript contains `import_current_outfit_inspiration`, `open_wardrobe_mission`, `request_missing_evidence`, `commit_approved_plan`, and the visible `Technical proof` surface.
- The manifest, application icon, JavaScript, CSS, and ONNX cutout model all return `200`.
- The deployed cutout model is 4,574,861 bytes with SHA-256 `309c8469258dda742793dce0ebea8e6dd393174f89934733ecc8b14c76f4ddd8`, matching the model verified during the production build.
- All 123 automated tests pass across API, web, cloud, contracts, domain, and orchestration workspaces.
- All TypeScript workspace checks pass.
- The web production build and API production package both pass. The first API packaging attempt was denied by local filesystem isolation; the identical command passed with normal filesystem access.

## Important coverage

| Area | Evidence |
| --- | --- |
| WebMCP lifecycle | Phase-valid tool discovery and AbortSignal unregistration tests |
| Open-web handoff | HTTPS-only references, bounded input, credential omission, MIME and media-signature validation |
| Privacy | Inspection returns bounded garment projections without private image IDs or the raw event ledger |
| Human boundary | Mission cannot simulate until current person-supplied evidence resolves the gap |
| Safe planning | Exactly three paths: wear now, wash first, and verified fallback |
| Consent | Approval is stored in the visible UI, not accepted as a tool argument |
| Transaction safety | Stale revisions fail closed; duplicate commits return the original receipt |
| Style Aura | Evidence-ranked palette, negative preference, recency, and maximum 8% visual movement tests |
| Background removal | Image validation, saliency normalization, soft edges, foreground bounds, and invalid-mask fallback tests |
| Laundry and WearCast | Care-evidence holds, conflict-free groups, rain-safe drying, idempotent intervention and notification tests |

## Native WebMCP evidence

The complete seven-tool mission was previously exercised in Chrome 151 through the real `document.modelContext.getTools()` and `executeTool()` APIs. That run proved dynamic registration, a genuinely pending human tool call, three-path simulation, visible approval, one commit, and a replay-safe receipt. It also found four defects that now have regression tests.

The direct `import_current_outfit_inspiration` tool was added afterward and is covered by registration and media-boundary tests. During this audit, the controlled browser runtime could not initialize, so the import tool and complete mission were not re-executed natively against the public Vercel URL. The final recording must close that exact evidence gap.

## Final release gate

Do not record the final take until all of these are visible on the public URL:

1. The Browser agent badge reads `registered` or `in use`, never `unsupported`.
2. `import_current_outfit_inspiration` brings an attributed image into Yange without a screenshot on a compatible source.
3. Saving Look DNA resolves the same pending import execution.
4. `request_missing_evidence` stays pending while Yange asks for one physical fact.
5. Confirming that fact resolves the same call and changes the available tool set.
6. Simulation returns exactly three paths.
7. `commit_approved_plan` is unavailable before visible approval and available afterward.
8. Commit produces one shared receipt; replay produces no second wardrobe effect.

Use the tested Pinterest Pin for the final run after deployment. Other publishers that block cross-origin delivery still use the honest upload fallback.

## Pinterest importer correction

The first real Pinterest probe returned a valid public JPEG but no `Access-Control-Allow-Origin` header, proving that the browser-only path could not deliver the promised screenshot-free flow. Yange now retains direct browser fetch as the default and adds a same-origin serverless fallback restricted to `i.pinimg.com`.

The server importer rejects credentials, non-HTTPS URLs, nonstandard ports, arbitrary hosts, private DNS results, unsafe redirect destinations, unsupported media types, images over 12 MB, and bytes that do not match the declared image signature. Responses are `no-store` and `nosniff`.

Local verification against the actual Pinterest image succeeded with `200`, `image/jpeg`, and exactly 50,022 validated bytes. The full web suite increased to 54 passing tests and the production build passes. This corrected artifact must still be pushed, deployed by Vercel, and exercised once on the public URL before the conditional-go decision becomes a full go.
