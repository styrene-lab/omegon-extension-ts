/**
 * Core types for the omegon extension protocol.
 * Zero dependencies — Node.js stdlib only.
 */

/** RPC error codes matching the Rust SDK. */
export enum ErrorCode {
  MethodNotFound = "MethodNotFound",
  InvalidParams = "InvalidParams",
  InternalError = "InternalError",
  NotImplemented = "NotImplemented",
  ParseError = "ParseError",
  Timeout = "Timeout",
  ManifestError = "ManifestError",
  VersionMismatch = "VersionMismatch",
}

/** JSON-RPC error response. */
export class RpcError extends Error {
  constructor(
    public readonly code: ErrorCode,
    message: string,
    public readonly data?: unknown,
  ) {
    super(message);
    this.name = "RpcError";
  }

  toJSON() {
    return { code: this.code, message: this.message, data: this.data ?? null };
  }

  static methodNotFound(method: string): RpcError {
    return new RpcError(ErrorCode.MethodNotFound, `method '${method}' not found`);
  }

  static invalidParams(reason: string): RpcError {
    return new RpcError(ErrorCode.InvalidParams, reason);
  }

  static internalError(reason: string): RpcError {
    return new RpcError(ErrorCode.InternalError, reason);
  }

  static notImplemented(method: string): RpcError {
    return new RpcError(ErrorCode.NotImplemented, `method '${method}' not implemented`);
  }
}

/** A tool definition exposed to the LLM. */
export interface ToolDefinition {
  /** Machine identifier (used in execute_tool). */
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

/** JSON-RPC request from omegon. */
export interface RpcRequest {
  jsonrpc: "2.0";
  id: string | number | null;
  method: string;
  params: Record<string, unknown>;
}

/** JSON-RPC response to omegon. */
export interface RpcResponse {
  jsonrpc: "2.0";
  id: string | number | null;
  result?: unknown;
  error?: { code: string; message: string; data: unknown };
}

/** Tool handler function signature. */
export type ToolHandler = (args: Record<string, unknown>) => unknown | Promise<unknown>;

/** Tool registration metadata. */
export interface RegisteredTool {
  definition: ToolDefinition;
  handler: ToolHandler;
}
