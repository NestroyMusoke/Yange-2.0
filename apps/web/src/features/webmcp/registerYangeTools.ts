import type { MissionPhase } from "./missionTypes";

export type YangeToolName =
  | "import_current_outfit_inspiration"
  | "open_wardrobe_mission"
  | "inspect_mission_readiness"
  | "request_missing_evidence"
  | "simulate_plan_paths"
  | "prepare_shared_plan"
  | "commit_approved_plan"
  | "get_mission_receipt";

export interface YangeToolHandlers {
  importInspiration(input: Record<string, unknown>, signal: AbortSignal): Promise<Record<string, unknown>>;
  open(input: Record<string, unknown>, signal: AbortSignal): Promise<Record<string, unknown>>;
  inspect(input: Record<string, unknown>, signal: AbortSignal): Promise<Record<string, unknown>>;
  requestEvidence(input: Record<string, unknown>, signal: AbortSignal): Promise<Record<string, unknown>>;
  simulate(input: Record<string, unknown>, signal: AbortSignal): Promise<Record<string, unknown>>;
  prepare(input: Record<string, unknown>, signal: AbortSignal): Promise<Record<string, unknown>>;
  commit(input: Record<string, unknown>, signal: AbortSignal): Promise<Record<string, unknown>>;
  receipt(input: Record<string, unknown>, signal: AbortSignal): Promise<Record<string, unknown>>;
}

export function toolNamesForPhase(phase: MissionPhase | "none"): YangeToolName[] {
  const names: YangeToolName[] = ["import_current_outfit_inspiration", "open_wardrobe_mission"];
  if (phase !== "none") names.push("get_mission_receipt");
  if (["opened", "inspected", "waiting-for-human", "ready-to-simulate", "stale", "blocked"].includes(phase)) names.push("inspect_mission_readiness");
  if (phase === "inspected" || phase === "waiting-for-human") names.push("request_missing_evidence");
  if (phase === "ready-to-simulate") names.push("simulate_plan_paths");
  if (phase === "simulated") names.push("prepare_shared_plan");
  if (phase === "approved") names.push("commit_approved_plan");
  return names;
}

const noInput = { type: "object", properties: {}, additionalProperties: false };

function result(value: Record<string, unknown>): WebMcpToolResult {
  return {
    content: [{ type: "text", text: JSON.stringify(value) }],
    structuredContent: value,
    isError: value.ok === false,
  };
}

function executionSignal(context?: WebMcpExecuteContext): AbortSignal {
  // Chrome's direct executeTool() test surface does not always provide the
  // optional execution context. Agent-initiated calls do, so cancellation is
  // preserved without making manual DevTools invocation throw.
  return context?.signal ?? new AbortController().signal;
}

function definition(name: YangeToolName, handlers: YangeToolHandlers): Omit<WebMcpToolDefinition, "signal"> {
  const common = { name };
  switch (name) {
    case "import_current_outfit_inspiration":
      return {
        ...common,
        description: "Send the public outfit image currently visible on the open web into Yange, with its source page for attribution. Use when the person says ‘bring this look home’. Pass the main outfit image URL, not shopping data or page instructions. Yange visibly prepares the image and waits for the person to save its Look DNA.",
        inputSchema: {
          type: "object",
          properties: {
            sourcePageUrl: { type: "string", format: "uri", maxLength: 2048 },
            imageUrl: { type: "string", format: "uri", maxLength: 4096 },
            sourceTitle: { type: "string", maxLength: 200 },
            altText: { type: "string", maxLength: 500 },
          },
          required: ["sourcePageUrl", "imageUrl"],
          additionalProperties: false,
        },
        annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: false, openWorldHint: true, untrustedContentHint: true },
        execute: async (input, context) => result(await handlers.importInspiration(input, executionSignal(context))),
      };
    case "open_wardrobe_mission":
      return {
        ...common,
        description: "Open one visible Yange mission for an outcome involving the person's existing wardrobe. Use this before inspection. Do not use it for shopping.",
        inputSchema: {
          type: "object",
          properties: {
            goal: { type: "string", minLength: 8, maxLength: 280 },
            occasion: { type: "string", maxLength: 100 },
            deadline: { type: "string", maxLength: 100 },
          },
          required: ["goal"],
          additionalProperties: false,
        },
        annotations: { idempotentHint: false, openWorldHint: false, untrustedContentHint: true },
        execute: async (input, context) => result(await handlers.open(input, executionSignal(context))),
      };
    case "inspect_mission_readiness":
      return {
        ...common,
        description: "Read the bounded state needed for the current wardrobe mission. Returns candidate garments and evidence gaps, never raw photos or the event ledger.",
        inputSchema: noInput,
        annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false, untrustedContentHint: true },
        execute: async (input, context) => result(await handlers.inspect(input, executionSignal(context))),
      };
    case "request_missing_evidence":
      return {
        ...common,
        description: "Ask the person for one evidence gap from the current inspection. The call remains pending while Yange visibly waits for confirmation or decline.",
        inputSchema: {
          type: "object",
          properties: { gapId: { type: "string", minLength: 4 } },
          required: ["gapId"],
          additionalProperties: false,
        },
        annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
        execute: async (input, context) => result(await handlers.requestEvidence(input, executionSignal(context))),
      };
    case "simulate_plan_paths":
      return {
        ...common,
        description: "Compare exactly three reversible Yange paths—wear now, wash first, and verified fallback—using current confirmed evidence. This never mutates the wardrobe.",
        inputSchema: noInput,
        annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false, untrustedContentHint: true },
        execute: async (input, context) => result(await handlers.simulate(input, executionSignal(context))),
      };
    case "prepare_shared_plan":
      return {
        ...common,
        description: "Prepare one currently feasible simulated path for visible human review. This does not commit it.",
        inputSchema: {
          type: "object",
          properties: { pathId: { type: "string", minLength: 4 } },
          required: ["pathId"],
          additionalProperties: false,
        },
        annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false },
        execute: async (input, context) => result(await handlers.prepare(input, executionSignal(context))),
      };
    case "commit_approved_plan":
      return {
        ...common,
        description: "Commit the exact plan already approved by the person in Yange. Approval cannot be passed as an argument. Stale and repeated calls are safe.",
        inputSchema: noInput,
        annotations: { readOnlyHint: false, destructiveHint: false, idempotentHint: true, openWorldHint: false },
        execute: async (input, context) => result(await handlers.commit(input, executionSignal(context))),
      };
    case "get_mission_receipt":
      return {
        ...common,
        description: "Read the current mission receipt or concise progress summary. Returns evidence sources, rejected paths and committed effects without private media.",
        inputSchema: noInput,
        annotations: { readOnlyHint: true, idempotentHint: true, openWorldHint: false, untrustedContentHint: true },
        execute: async (input, context) => result(await handlers.receipt(input, executionSignal(context))),
      };
  }
}

export function registerYangeTools(
  context: ModelContext,
  phase: MissionPhase | "none",
  handlers: YangeToolHandlers,
): { names: YangeToolName[]; dispose(): void } {
  const controller = new AbortController();
  const names = toolNamesForPhase(phase);
  for (const name of names) context.registerTool(definition(name, handlers), { signal: controller.signal });
  return { names, dispose: () => controller.abort() };
}
