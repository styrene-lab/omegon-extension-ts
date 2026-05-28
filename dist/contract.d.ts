/** Canonical Omegon extension SDK contract constants.
 *
 * This module is intentionally pegged to the Rust SDK contract artifact. Keep
 * `src/schema/sdk-contract.json` byte-for-byte aligned with
 * `omegon-extension-rs/schema/sdk-contract.json`.
 */
import sdkContract from "./schema/sdk-contract.json";
export declare const SDK_CONTRACT_VERSION = "0.24";
export declare const PROTOCOL_VERSION = 2;
export declare const JSONRPC_VERSION = "2.0";
export declare const METHOD_INITIALIZE = "initialize";
export declare const METHOD_GET_TOOLS = "get_tools";
export declare const METHOD_TOOLS_LIST = "tools/list";
export declare const METHOD_EXECUTE_TOOL = "execute_tool";
export declare const METHOD_TOOLS_CALL = "tools/call";
export declare const METHOD_BOOTSTRAP_SECRETS = "bootstrap_secrets";
export declare const METHOD_ACTIONS_EXECUTE = "actions/execute";
export declare const NOTIFICATION_TOOLS_PROGRESS = "notifications/tools/progress";
export declare const NOTIFICATION_TOOLS_LIST_CHANGED = "notifications/tools/list_changed";
export declare const NOTIFICATION_WIDGETS_UPDATED = "notifications/widgets/updated";
export { sdkContract as SDK_CONTRACT };
//# sourceMappingURL=contract.d.ts.map