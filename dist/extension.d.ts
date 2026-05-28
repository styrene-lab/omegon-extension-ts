/**
 * Extension base class and JSON-RPC serve loops.
 *
 * v1: `serve()` — simple request/response.
 * v2: `serveV2()` — bidirectional with HostProxy.
 */
import type { Capabilities, ToolDefinition, ToolHandler, ToolResult } from "./types.js";
/**
 * Base class for omegon extensions.
 *
 * Use {@link defineTool} to register tools, or override {@link handleRpc}
 * for full control over the RPC dispatch.
 */
export declare class Extension {
    readonly name: string;
    readonly version: string;
    private tools;
    private secrets;
    /** Capabilities this extension supports. Override in subclass. */
    capabilities: Capabilities;
    /** SDK version this extension targets. */
    sdkVersion: string;
    /** Host proxy for v2 bidirectional messaging. Set by serveV2(). */
    host: HostProxy | null;
    constructor(name: string, version: string);
    /** Register a tool with its definition and handler. */
    defineTool(definition: ToolDefinition, handler: ToolHandler): this;
    /** Retrieve a bootstrapped secret by name. */
    getSecret(name: string): string | undefined;
    /** Return all tool definitions. Override for custom behavior. */
    getTools(): ToolDefinition[];
    /** Store bootstrapped secrets. Override for custom behavior. */
    bootstrapSecrets(secrets: Record<string, string>): Record<string, unknown>;
    /** Execute a tool by name. Override for custom dispatch. */
    executeTool(name: string, args: Record<string, unknown>): Promise<ToolResult>;
    /** Called after v2 initialize handshake. Override to use host proxy. */
    onInitialized(_host: HostProxy): Promise<void>;
    /** Handle a notification from the host. Override for custom behavior. */
    handleNotification(_method: string, _params: Record<string, unknown>): Promise<void>;
    /**
     * Handle an incoming RPC call. Override for full control.
     *
     * Default dispatches: initialize, get_tools, tools/list, tools/call,
     * execute_tool, bootstrap_secrets.
     */
    handleRpc(method: string, params: Record<string, unknown>): Promise<unknown>;
}
/**
 * Proxy for sending messages from an extension back to the host.
 * Available after v2 initialization via onInitialized().
 */
export declare class HostProxy {
    private write;
    private nextId;
    private pending;
    constructor(write: (msg: string) => void);
    /** Send a notification to the host (fire-and-forget). */
    notify(method: string, params?: Record<string, unknown>): void;
    /** Send a request to the host and await the response. */
    request(method: string, params?: Record<string, unknown>): Promise<unknown>;
    /** Route an incoming response to the pending request. Internal use. */
    _routeResponse(id: string, result?: unknown, error?: {
        message: string;
    }): boolean;
}
/**
 * Run the JSON-RPC serve loop over stdin/stdout — v1 protocol.
 * Simple request/response. Exits cleanly on EOF.
 */
export declare function serve(ext: Extension): Promise<void>;
/**
 * Run the bidirectional JSON-RPC serve loop — v2 protocol.
 * Supports extension-initiated notifications and requests to the host.
 */
export declare function serveV2(ext: Extension): Promise<void>;
//# sourceMappingURL=extension.d.ts.map