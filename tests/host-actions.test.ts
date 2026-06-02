import { describe, it } from "node:test";
import * as assert from "node:assert/strict";

import {
  PACKAGE_INSTALL_V1,
  RESOURCE_OPEN_V1,
  ResourceOpenParams,
  ResourceOpenResult,
  SDK_CONTRACT,
  TERMINAL_CREATE_V1,
  TerminalCreateParams,
  TerminalCreateResult,
  resourceOpenAction,
  terminalCreateAction,
} from "../src/index.js";

interface HostActionContract {
  types: string[];
  terminal_create_params_fields: string[];
  terminal_create_placement_values: string[];
  terminal_create_result_fields: string[];
  resource_open_params_fields: string[];
  resource_open_intent_values: string[];
  resource_open_kind_values: string[];
  resource_open_placement_values: string[];
  resource_open_result_fields: string[];
}

const hostActions = (SDK_CONTRACT as { host_actions: HostActionContract }).host_actions;

function keys(value: object): string[] {
  return Object.keys(JSON.parse(JSON.stringify(value))).sort();
}

function contractFields(fields: readonly string[]): string[] {
  return [...fields].sort();
}

describe("HostAction helpers", () => {
  it("exports action type constants from contract", () => {
    assert.deepEqual(hostActions.types, [TERMINAL_CREATE_V1, PACKAGE_INSTALL_V1, RESOURCE_OPEN_V1]);
  });

  it("matches terminal.create@1 shapes", () => {
    const params: TerminalCreateParams = {
      command: "bookokrat",
      args: ["/tmp/book.epub"],
      cwd: "/workspace",
      env: { BOOKOKRAT_THEME: "dark" },
      title: "Reader",
      placement: "background_session",
      reuse_key: "reader",
    };
    assert.deepEqual(keys(params), contractFields(hostActions.terminal_create_params_fields));
    assert.ok(hostActions.terminal_create_placement_values.includes(params.placement!));

    const result: TerminalCreateResult = {
      terminal_id: "term_123",
      backend: "zellij",
      actual_placement: "background_session",
      warnings: ["fallback used"],
    };
    assert.deepEqual(keys(result), contractFields(hostActions.terminal_create_result_fields));

    assert.deepEqual(terminalCreateAction("open-reader", params), {
      id: "open-reader",
      type: TERMINAL_CREATE_V1,
      params,
    });
  });

  it("matches resource.open@1 shapes", () => {
    const params: ResourceOpenParams = {
      uri: "file:///workspace/docs/architecture.md",
      intent: "view",
      kind: "markdown",
      placement: "main_tab",
      reuse_key: "docs/architecture.md",
      title: "Architecture",
    };
    assert.deepEqual(keys(params), contractFields(hostActions.resource_open_params_fields));
    assert.ok(hostActions.resource_open_intent_values.includes(params.intent!));
    assert.ok(hostActions.resource_open_kind_values.includes(params.kind!));
    assert.ok(hostActions.resource_open_placement_values.includes(params.placement!));

    const result: ResourceOpenResult = {
      resource_id: "res_123",
      backend: "flynt",
      actual_placement: "main_tab",
      handle: { tab_id: "tab-1" },
      warnings: ["fallback used"],
    };
    assert.deepEqual(keys(result), contractFields(hostActions.resource_open_result_fields));

    assert.deepEqual(resourceOpenAction("open-doc", params), {
      id: "open-doc",
      type: RESOURCE_OPEN_V1,
      params,
    });
  });
});

describe("Package HostAction helpers", () => {
  it("matches package.install@1 shapes", async () => {
    const sdk = await import("../src/index.js");
    const params: import("../src/index.js").PackageInstallParams = {
      activation: "enable",
      digest: "sha256:abc",
      dry_run: true,
      package: "omegon-nex-rs",
      reuse_key: "nex",
      source: "registry",
      version: "0.1.0",
    };
    assert.deepEqual(keys(params), contractFields(hostActions.package_install_params_fields));
    assert.ok(hostActions.package_install_source_values.includes(params.source));
    assert.ok(hostActions.package_activation_values.includes(params.activation!));

    const result: import("../src/index.js").PackageInstallResult = {
      dry_run: true,
      effects: ["omegon/extensions/omegon-nex-rs"],
      handle: { registry: "omegon" },
      install_id: "install_123",
      package: "omegon-nex-rs",
      plan: ["download package", "verify digest"],
      source: "registry",
      status: "planned",
      version: "0.1.0",
      warnings: ["manual approval required"],
    };
    assert.deepEqual(keys(result), contractFields(hostActions.package_install_result_fields));

    assert.deepEqual(sdk.packageInstallAction("install-nex", params), {
      id: "install-nex",
      type: sdk.PACKAGE_INSTALL_V1,
      params,
    });
  });
});
