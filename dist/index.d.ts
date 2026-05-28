/**
 * Omegon Extension SDK for TypeScript/Node.js.
 *
 * Build omegon extensions using the same patterns as the Rust and Python SDKs.
 *
 * v1 (unidirectional):
 * ```ts
 * import { Extension, serve } from "@omegon/extension";
 * const ext = new Extension("my-ext", "0.1.0");
 * ext.defineTool({ ... }, async (args) => "result");
 * serve(ext);
 * ```
 *
 * v2 (bidirectional):
 * ```ts
 * import { Extension, serveV2 } from "@omegon/extension";
 * const ext = new Extension("my-ext", "0.1.0");
 * ext.defineTool({ ... }, async (args) => "result");
 * serveV2(ext);
 * ```
 *
 * @module
 */
export * from "./contract.js";
export { Extension, HostProxy, serve, serveV2 } from "./extension.js";
export { ErrorCode, RpcError, errorLabel, type Capabilities, type ContentBlock, type ToolDefinition, type ToolResult, type ToolHandler, type RpcRequest, type RpcResponse, type RpcNotification, } from "./types.js";
//# sourceMappingURL=index.d.ts.map