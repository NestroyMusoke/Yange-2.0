interface WebMcpContent {
  type: "text";
  text: string;
}

interface WebMcpToolResult {
  content: WebMcpContent[];
  structuredContent?: Record<string, unknown>;
  isError?: boolean;
}

interface WebMcpExecuteContext {
  signal: AbortSignal;
}

interface WebMcpToolDefinition {
  name: string;
  description: string;
  inputSchema: Record<string, unknown>;
  annotations?: {
    readOnlyHint?: boolean;
    destructiveHint?: boolean;
    idempotentHint?: boolean;
    openWorldHint?: boolean;
    untrustedContentHint?: boolean;
  };
  execute(input: Record<string, unknown>, context?: WebMcpExecuteContext): Promise<WebMcpToolResult> | WebMcpToolResult;
}

interface ModelContext {
  registerTool(tool: WebMcpToolDefinition, options?: { signal?: AbortSignal }): void;
  getTools(): Promise<Array<{
    name: string;
    description: string;
    inputSchema: string;
    annotations?: WebMcpToolDefinition["annotations"];
  }>>;
}

interface Document {
  modelContext?: ModelContext;
}
