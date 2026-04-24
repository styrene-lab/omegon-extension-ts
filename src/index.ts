/**
 * Omegon Extension SDK for TypeScript/Node.js.
 *
 * Build omegon extensions using the same patterns as the Rust and Python SDKs.
 *
 * @example
 * ```ts
 * import { Extension, serve } from "@omegon/extension";
 *
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
 * }, async ({ name }) => `Hello, ${name ?? "World"}!`);
 *
 * serve(ext);
 * ```
 *
 * @module
 */

export { Extension, serve } from "./extension.js";
export {
  ErrorCode,
  RpcError,
  type ContentBlock,
  type ToolDefinition,
  type ToolResult,
  type ToolHandler,
  type RpcRequest,
  type RpcResponse,
} from "./types.js";
