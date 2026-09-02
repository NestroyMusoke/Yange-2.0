import { describe, expect, it, vi } from "vitest";
import { registerYangeTools, toolNamesForPhase, type YangeToolHandlers } from "./registerYangeTools";

const handlers: YangeToolHandlers = {
  importInspiration: vi.fn(async () => ({ ok: true })),
  open: vi.fn(async () => ({ ok: true })),
  inspect: vi.fn(async () => ({ ok: true })),
  requestEvidence: vi.fn(async () => ({ ok: true })),
  simulate: vi.fn(async () => ({ ok: true })),
  prepare: vi.fn(async () => ({ ok: true })),
  commit: vi.fn(async () => ({ ok: true })),
  receipt: vi.fn(async () => ({ ok: true })),
};

describe("Yange WebMCP registration", () => {
  it("reveals only phase-valid semantic tools", () => {
    expect(toolNamesForPhase("none")).toContain("import_current_outfit_inspiration");
    expect(toolNamesForPhase("inspected")).toContain("request_missing_evidence");
    expect(toolNamesForPhase("inspected")).not.toContain("commit_approved_plan");
    expect(toolNamesForPhase("approved")).toContain("commit_approved_plan");
  });

  it("registers real definitions and unregisters through AbortSignal", () => {
    const tools: Array<{ tool: WebMcpToolDefinition; signal?: AbortSignal }> = [];
    const context: ModelContext = {
      registerTool: vi.fn((tool, options) => tools.push({ tool, signal: options?.signal })),
      getTools: vi.fn(async () => []),
    };
    const registration = registerYangeTools(context, "simulated", handlers);
    expect(registration.names).toContain("prepare_shared_plan");
    const importer = tools.find(({ tool }) => tool.name === "import_current_outfit_inspiration")!.tool;
    expect(importer.annotations?.openWorldHint).toBe(true);
    expect(importer.annotations?.untrustedContentHint).toBe(true);
    expect(importer.inputSchema).toMatchObject({ required: ["sourcePageUrl", "imageUrl"], additionalProperties: false });
    const inspect = tools.find(({ tool }) => tool.name === "get_mission_receipt")!.tool;
    expect(inspect.annotations?.readOnlyHint).toBe(true);
    expect(tools.every(({ signal }) => signal?.aborted === false)).toBe(true);
    registration.dispose();
    expect(tools.every(({ signal }) => signal?.aborted === true)).toBe(true);
  });
});
