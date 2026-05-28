/**
 * Core types for the omegon extension protocol.
 * Zero dependencies — Node.js stdlib only.
 *
 * v2 protocol: numeric error codes, capabilities, bidirectional messaging.
 */
/** RPC error codes — JSON-RPC 2.0 numeric codes with string labels. */
export declare enum ErrorCode {
    ParseError = -32700,
    InvalidRequest = -32600,
    MethodNotFound = -32601,
    InvalidParams = -32602,
    InternalError = -32603,
    Timeout = -32000,
    NotImplemented = -32001,
    ManifestError = -32002,
    VersionMismatch = -32003,
    Cancelled = -32004,
    ResourceNotFound = -32005,
    SamplingDenied = -32006
}
/** Get the string label for an error code. */
export declare function errorLabel(code: ErrorCode): string;
/** JSON-RPC error response. */
export declare class RpcError extends Error {
    readonly code: ErrorCode;
    readonly data?: unknown | undefined;
    constructor(code: ErrorCode, message: string, data?: unknown | undefined);
    toJSON(): {
        code: ErrorCode;
        label: string;
        message: string;
        data: {} | null;
    };
    static methodNotFound(method: string): RpcError;
    static invalidParams(reason: string): RpcError;
    static internalError(reason: string): RpcError;
    static notImplemented(method: string): RpcError;
    static cancelled(): RpcError;
}
/** A tool definition exposed to the LLM. */
export interface ToolDefinition {
    /** Machine identifier (used in tools/call). */
    name: string;
    /** Human-readable display name. */
    label: string;
    /** What the tool does (shown to LLM). */
    description: string;
    /** JSON Schema for the tool's parameters. */
    parameters: Record<string, unknown>;
}
/** A content block in a tool response. */
export interface ContentBlock {
    type: "text" | "markdown";
    text: string;
}
/** Tool execution result. */
export interface ToolResult {
    content: ContentBlock[];
    [key: string]: unknown;
}
/** JSON-RPC request. */
export interface RpcRequest {
    jsonrpc: "2.0";
    id?: string | number | null;
    method: string;
    params: Record<string, unknown>;
}
/** JSON-RPC response. */
export interface RpcResponse {
    jsonrpc: "2.0";
    id: string | number | null;
    result?: unknown;
    error?: {
        code: number;
        label?: string;
        message: string;
        data?: unknown;
    };
}
/** JSON-RPC notification. */
export interface RpcNotification {
    jsonrpc: "2.0";
    method: string;
    params?: Record<string, unknown>;
}
/** Tool handler function signature. */
export type ToolHandler = (args: Record<string, unknown>) => unknown | Promise<unknown>;
/** Tool registration metadata. */
export interface RegisteredTool {
    definition: ToolDefinition;
    handler: ToolHandler;
}
/** Protocol capability flags. */
export interface Capabilities {
    tools?: boolean;
    widgets?: boolean;
    mind?: boolean;
    vox?: boolean;
    resources?: boolean;
    prompts?: boolean;
    sampling?: boolean;
    elicitation?: boolean;
    streaming?: boolean;
    voice?: boolean;
    host_actions?: boolean;
    host_action_execution?: boolean;
}
//# sourceMappingURL=types.d.ts.map