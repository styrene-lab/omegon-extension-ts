/**
 * Extension base class and JSON-RPC serve loops.
 *
 * v1: `serve()` — simple request/response.
 * v2: `serveV2()` — bidirectional with HostProxy.
 */

import { createInterface } from "node:readline";
import {
  JSONRPC_VERSION,
  METHOD_BOOTSTRAP_SECRETS,
  METHOD_EXECUTE_TOOL,
  METHOD_GET_TOOLS,
  METHOD_INITIALIZE,
  METHOD_TOOLS_CALL,
  METHOD_TOOLS_LIST,
  PROTOCOL_VERSION,
  SDK_CONTRACT_VERSION,
} from "./contract.js";
import type {
  Capabilities,
  ContentBlock,
  RegisteredTool,
  RpcNotification,
  RpcRequest,
  RpcResponse,
  ToolDefinition,
  ToolHandler,
  ToolResult,
} from "./types.js";
import { ErrorCode, RpcError, errorLabel } from "./types.js";

/**
 * Base class for omegon extensions.
 *
 * Use {@link defineTool} to register tools, or override {@link handleRpc}
 * for full control over the RPC dispatch.
 */
export class Extension {
  private tools = new Map<string, RegisteredTool>();
  private secrets = new Map<string, string>();

  /** Capabilities this extension supports. Override in subclass. */
  capabilities: Capabilities = { tools: true };

  /** SDK version this extension targets. */
  sdkVersion = SDK_CONTRACT_VERSION;

  /** Host proxy for v2 bidirectional messaging. Set by serveV2(). */
  host: HostProxy | null = null;

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

  /** Called after v2 initialize handshake. Override to use host proxy. */
  async onInitialized(_host: HostProxy): Promise<void> {
    // Default: no-op. Override to store the host proxy.
  }

  /** Handle a notification from the host. Override for custom behavior. */
  async handleNotification(_method: string, _params: Record<string, unknown>): Promise<void> {
    // Default: ignore
  }

  /**
   * Handle an incoming RPC call. Override for full control.
   *
   * Default dispatches: initialize, get_tools, tools/list, tools/call,
   * execute_tool, bootstrap_secrets.
   */
  async handleRpc(method: string, params: Record<string, unknown>): Promise<unknown> {
    switch (method) {
      // v2: initialize handshake
      case METHOD_INITIALIZE:
        return {
          protocol_version: PROTOCOL_VERSION,
          extension_info: {
            name: this.name,
            version: this.version,
            sdk_version: this.sdkVersion,
          },
          capabilities: this.capabilities,
          tools: this.getTools(),
        };

      // v1 + v2: tool discovery
      case METHOD_GET_TOOLS:
      case METHOD_TOOLS_LIST:
        return this.getTools();

      // v1 + v2: secret delivery
      case METHOD_BOOTSTRAP_SECRETS:
        return this.bootstrapSecrets(params as Record<string, string>);

      // v1: execute_tool
      case METHOD_EXECUTE_TOOL: {
        const toolName = (params.name as string) ?? "";
        const toolArgs = (params.args as Record<string, unknown>) ?? {};
        return this.executeTool(toolName, toolArgs);
      }

      // v2: tools/call
      case METHOD_TOOLS_CALL: {
        const toolName = (params.name as string) ?? "";
        const toolArgs = (params.arguments as Record<string, unknown>) ?? {};
        return this.executeTool(toolName, toolArgs);
      }

      default:
        throw RpcError.methodNotFound(method);
    }
  }
}

/**
 * Proxy for sending messages from an extension back to the host.
 * Available after v2 initialization via onInitialized().
 */
export class HostProxy {
  private nextId = 1;
  private pending = new Map<string, { resolve: (v: unknown) => void; reject: (e: Error) => void }>();

  constructor(private write: (msg: string) => void) {}

  /** Send a notification to the host (fire-and-forget). */
  notify(method: string, params: Record<string, unknown> = {}): void {
    const msg: RpcNotification = { jsonrpc: JSONRPC_VERSION, method, params };
    this.write(JSON.stringify(msg));
  }

  /** Send a request to the host and await the response. */
  async request(method: string, params: Record<string, unknown> = {}): Promise<unknown> {
    const id = `ext-${this.nextId++}`;
    return new Promise((resolve, reject) => {
      this.pending.set(id, { resolve, reject });
      const msg = { jsonrpc: JSONRPC_VERSION, id, method, params };
      this.write(JSON.stringify(msg));
    });
  }

  /** Route an incoming response to the pending request. Internal use. */
  _routeResponse(id: string, result?: unknown, error?: { message: string }): boolean {
    const entry = this.pending.get(id);
    if (!entry) return false;
    this.pending.delete(id);
    if (error) {
      entry.reject(new Error(error.message));
    } else {
      entry.resolve(result);
    }
    return true;
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
 * Run the JSON-RPC serve loop over stdin/stdout — v1 protocol.
 * Simple request/response. Exits cleanly on EOF.
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
        jsonrpc: JSONRPC_VERSION,
        id: null,
        error: {
          code: ErrorCode.ParseError,
          label: errorLabel(ErrorCode.ParseError),
          message: "invalid JSON",
        },
      };
      process.stdout.write(JSON.stringify(response) + "\n");
      continue;
    }

    // Skip notifications (no id)
    if (msg.id === undefined || msg.id === null) continue;

    let response: RpcResponse;
    try {
      const result = await ext.handleRpc(msg.method, msg.params ?? {});
      response = { jsonrpc: JSONRPC_VERSION, id: msg.id, result };
    } catch (err) {
      if (err instanceof RpcError) {
        response = { jsonrpc: JSONRPC_VERSION, id: msg.id, error: err.toJSON() };
      } else {
        response = {
          jsonrpc: JSONRPC_VERSION,
          id: msg.id,
          error: RpcError.internalError(String(err)).toJSON(),
        };
      }
    }

    process.stdout.write(JSON.stringify(response) + "\n");
  }
}

/**
 * Run the bidirectional JSON-RPC serve loop — v2 protocol.
 * Supports extension-initiated notifications and requests to the host.
 */
export async function serveV2(ext: Extension): Promise<void> {
  const rl = createInterface({ input: process.stdin });

  const writeLine = (msg: string) => process.stdout.write(msg + "\n");
  const host = new HostProxy(writeLine);
  ext.host = host;
  await ext.onInitialized(host);

  for await (const line of rl) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    let msg: Record<string, unknown>;
    try {
      msg = JSON.parse(trimmed);
    } catch {
      continue;
    }

    const hasMethod = "method" in msg;
    const hasId = "id" in msg && msg.id != null;
    const hasResult = "result" in msg;
    const hasError = "error" in msg;

    if (hasMethod && hasId) {
      // Request from host — dispatch and respond
      const reqId = msg.id as string | number;
      const method = msg.method as string;
      const params = (msg.params as Record<string, unknown>) ?? {};

      let response: RpcResponse;
      try {
        const result = await ext.handleRpc(method, params);
        response = { jsonrpc: JSONRPC_VERSION, id: reqId, result };
      } catch (err) {
        if (err instanceof RpcError) {
          response = { jsonrpc: JSONRPC_VERSION, id: reqId, error: err.toJSON() };
        } else {
          response = {
            jsonrpc: JSONRPC_VERSION,
            id: reqId,
            error: RpcError.internalError(String(err)).toJSON(),
          };
        }
      }
      writeLine(JSON.stringify(response));
    } else if ((hasResult || hasError) && !hasMethod) {
      // Response to one of our pending ext→host requests
      const respId = msg.id as string;
      if (typeof respId === "string") {
        host._routeResponse(
          respId,
          msg.result,
          msg.error as { message: string } | undefined,
        );
      }
    } else if (hasMethod && !hasId) {
      // Notification from host
      const method = msg.method as string;
      const params = (msg.params as Record<string, unknown>) ?? {};
      ext.handleNotification(method, params).catch(() => {});
    }
  }
}
