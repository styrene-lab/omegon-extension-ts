import { describe, it } from "node:test";
import * as assert from "node:assert/strict";

import {
  ErrorCode,
  JSONRPC_VERSION,
  METHOD_ACTIONS_EXECUTE,
  METHOD_BOOTSTRAP_SECRETS,
  METHOD_EXECUTE_TOOL,
  METHOD_GET_TOOLS,
  METHOD_INITIALIZE,
  METHOD_TOOLS_CALL,
  METHOD_TOOLS_LIST,
  NOTIFICATION_TOOLS_LIST_CHANGED,
  NOTIFICATION_TOOLS_PROGRESS,
  NOTIFICATION_WIDGETS_UPDATED,
  PROTOCOL_VERSION,
  SDK_CONTRACT,
  SDK_CONTRACT_VERSION,
} from "../src/index.js";

interface SdkContract {
  sdk_contract_version: string;
  protocol_version: number;
  jsonrpc_version: string;
  methods: {
    host_to_extension: string[];
    extension_to_host: string[];
  };
  error_codes: Record<string, number>;
  capabilities: {
    fields: string[];
    default_true: string[];
    default_false: string[];
  };
}

const contract = SDK_CONTRACT as SdkContract;

describe("SDK contract", () => {
  it("matches exported version constants", () => {
    assert.equal(contract.sdk_contract_version, SDK_CONTRACT_VERSION);
    assert.equal(contract.protocol_version, PROTOCOL_VERSION);
    assert.equal(contract.jsonrpc_version, JSONRPC_VERSION);
  });

  it("matches exported method constants", () => {
    assert.deepEqual(contract.methods.host_to_extension, [
      METHOD_INITIALIZE,
      METHOD_GET_TOOLS,
      METHOD_TOOLS_LIST,
      METHOD_EXECUTE_TOOL,
      METHOD_TOOLS_CALL,
      METHOD_BOOTSTRAP_SECRETS,
    ]);
    assert.deepEqual(contract.methods.extension_to_host, [
      METHOD_ACTIONS_EXECUTE,
      NOTIFICATION_TOOLS_PROGRESS,
      NOTIFICATION_TOOLS_LIST_CHANGED,
      NOTIFICATION_WIDGETS_UPDATED,
    ]);
  });

  it("matches exported error codes", () => {
    const actual = Object.fromEntries(
      Object.entries(ErrorCode).filter(([, value]) => typeof value === "number"),
    );
    assert.deepEqual(actual, contract.error_codes);
  });

  it("matches capability defaults", () => {
    const defaults: Record<string, boolean> = { tools: true };
    for (const field of contract.capabilities.fields) {
      defaults[field] ??= false;
    }
    assert.deepEqual(Object.keys(defaults), contract.capabilities.fields);
    for (const field of contract.capabilities.default_true) {
      assert.equal(defaults[field], true);
    }
    for (const field of contract.capabilities.default_false) {
      assert.equal(defaults[field], false);
    }
  });
});
