/**
 * Extension base class and JSON-RPC serve loop.
 * Zero dependencies — Node.js stdlib only.
 */

import { createInterface } from "node:readline";
import type {
  ContentBlock,
  RegisteredTool,
  RpcRequest,
  RpcResponse,
  ToolDefinition,
  ToolHandler,
  ToolResult,
} from "./types.js";
import { RpcError } from "./types.js";

/**
 * Base class for omegon extensions.
 *
 * Use {@link defineTool} to register tools, or override {@link handleRpc}
 * for full control over the RPC dispatch.
 *
 * @example
 * ```ts
 * const ext = new Extension("my-ext", "0.1.0");
 *
 * ext.defineTool({
 *   name: "hello",
 *   label: "Hello",
 *   description: "Greet someone",
 *   parameters: {
 *     type: "object",
 *     properties: { name: { type: "string" } },
 *     required: ["name"],
 *   },
 * }, async (args) => {
 *   return `Hello, ${args.name ?? "World"}!`;
 * });
 *
 * serve(ext);
 * ```
 */
export class Extension {
  private tools = new Map<string, RegisteredTool>();
  private secrets = new Map<string, string>();

  constructor(
    public readonly name: string,
    public readonly version: string,
  ) {}

  /** Register a tool with its definition and handler. */
  defineTool(definition: ToolDefinition, handler: ToolHandler): this {
    this.tools.set(definition.name, { definition, handler });
    return this;
  }

  /** Retrieve a bootstrapped secret by name. */
  getSecret(name: string): string | undefined {
    return this.secrets.get(name);
  }

  /** Return all tool definitions. Override for custom behavior. */
  getTools(): ToolDefinition[] {
    return Array.from(this.tools.values()).map((t) => t.definition);
  }

  /** Store bootstrapped secrets. Override for custom behavior. */
  bootstrapSecrets(secrets: Record<string, string>): Record<string, unknown> {
    for (const [key, value] of Object.entries(secrets)) {
      this.secrets.set(key, value);
    }
    return { acknowledged: true };
  }

  /** Execute a tool by name. Override for custom dispatch. */
  async executeTool(name: string, args: Record<string, unknown>): Promise<ToolResult> {
    const tool = this.tools.get(name);
    if (!tool) {
      throw RpcError.methodNotFound(`tool '${name}'`);
    }

    const result = await tool.handler(args);
    return wrapResult(result);
  }

  /**
   * Handle an incoming RPC call. Override for full control.
   *
   * The default implementation dispatches to getTools, bootstrapSecrets,
   * executeTool, and throws MethodNotFound for anything else.
   */
  async handleRpc(method: string, params: Record<string, unknown>): Promise<unknown> {
    switch (method) {
      case "get_tools":
        return this.getTools();
      case "bootstrap_secrets":
        return this.bootstrapSecrets(params as Record<string, string>);
      case "execute_tool": {
        const toolName = (params.name as string) ?? "";
        const toolArgs = (params.args as Record<string, unknown>) ?? {};
        return this.executeTool(toolName, toolArgs);
      }
      default:
        throw RpcError.methodNotFound(method);
    }
  }
}

/** Wrap a tool return value in the content block format. */
function wrapResult(result: unknown): ToolResult {
  if (result !== null && typeof result === "object" && "content" in result) {
    return result as ToolResult;
  }
  if (Array.isArray(result)) {
    return { content: result as ContentBlock[] };
  }
  if (typeof result === "string") {
    return { content: [{ type: "text", text: result }] };
  }
  return { content: [{ type: "text", text: String(result) }] };
}

/**
 * Run the JSON-RPC serve loop over stdin/stdout.
 *
 * Reads line-delimited JSON-RPC requests from stdin, dispatches to the
 * extension, and writes responses to stdout. Exits cleanly on EOF.
 */
export async function serve(ext: Extension): Promise<void> {
  const rl = createInterface({ input: process.stdin });

  for await (const line of rl) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    let msg: RpcRequest;
    try {
      msg = JSON.parse(trimmed);
    } catch {
      const response: RpcResponse = {
        jsonrpc: "2.0",
        id: null,
        error: { code: "ParseError", message: "invalid JSON", data: null },
      };
      process.stdout.write(JSON.stringify(response) + "\n");
      continue;
    }

    // Skip notifications (no id)
    if (msg.id === undefined) continue;

    let response: RpcResponse;
    try {
      const result = await ext.handleRpc(msg.method, msg.params ?? {});
      response = { jsonrpc: "2.0", id: msg.id, result };
    } catch (err) {
      if (err instanceof RpcError) {
        response = { jsonrpc: "2.0", id: msg.id, error: err.toJSON() };
      } else {
        response = {
          jsonrpc: "2.0",
          id: msg.id,
          error: RpcError.internalError(String(err)).toJSON(),
        };
      }
    }

    process.stdout.write(JSON.stringify(response) + "\n");
  }

  // EOF — omegon closed stdin, exit cleanly
}
