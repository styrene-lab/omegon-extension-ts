/** Canonical Omegon extension SDK contract constants.
 *
 * This module is intentionally pegged to the Rust SDK contract artifact. Keep
 * `src/schema/sdk-contract.json` byte-for-byte aligned with
 * `omegon-extension-rs/schema/sdk-contract.json`.
 */
import sdkContract from "./schema/sdk-contract.json";
export const SDK_CONTRACT_VERSION = "0.24";
export const PROTOCOL_VERSION = 2;
export const JSONRPC_VERSION = "2.0";
export const METHOD_INITIALIZE = "initialize";
export const METHOD_GET_TOOLS = "get_tools";
export const METHOD_TOOLS_LIST = "tools/list";
export const METHOD_EXECUTE_TOOL = "execute_tool";
export const METHOD_TOOLS_CALL = "tools/call";
export const METHOD_BOOTSTRAP_SECRETS = "bootstrap_secrets";
export const METHOD_ACTIONS_EXECUTE = "actions/execute";
export const NOTIFICATION_TOOLS_PROGRESS = "notifications/tools/progress";
export const NOTIFICATION_TOOLS_LIST_CHANGED = "notifications/tools/list_changed";
export const NOTIFICATION_WIDGETS_UPDATED = "notifications/widgets/updated";
export { sdkContract as SDK_CONTRACT };
//# sourceMappingURL=contract.js.map