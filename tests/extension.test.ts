import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  Extension,
  RpcError,
  ErrorCode,
  METHOD_INITIALIZE,
  METHOD_GET_TOOLS,
  METHOD_EXECUTE_TOOL,
  SDK_CONTRACT_VERSION,
  PROTOCOL_VERSION,
} from "../src/index.js";

function createTestExtension(): Extension {
  const ext = new Extension("test-ext", "0.1.0");

  ext.defineTool(
    {
      name: "hello",
      label: "Hello",
      description: "Greet someone",
      parameters: {
        type: "object",
        properties: { name: { type: "string" } },
        required: ["name"],
      },
    },
    async ({ name }) => `Hello, ${name ?? "World"}!`,
  );

  ext.defineTool(
    {
      name: "add",
      label: "Add",
      description: "Add two numbers",
      parameters: {
        type: "object",
        properties: {
          a: { type: "number" },
          b: { type: "number" },
        },
        required: ["a", "b"],
      },
    },
    ({ a, b }) => `${(a as number) + (b as number)}`,
  );

  ext.defineTool(
    {
      name: "raw",
      label: "Raw",
      description: "Return raw dict",
      parameters: { type: "object", properties: {} },
    },
    () => ({ content: [{ type: "text" as const, text: "raw" }], extra: true }),
  );

  ext.defineTool(
    {
      name: "fail",
      label: "Fail",
      description: "Always fails",
      parameters: { type: "object", properties: {} },
    },
    () => {
      throw RpcError.invalidParams("intentional failure");
    },
  );

  return ext;
}

describe("Tool Discovery", () => {
  it("discovers registered tools", () => {
    const ext = createTestExtension();
    const tools = ext.getTools();
    const names = tools.map((t) => t.name);
    assert.ok(names.includes("hello"));
    assert.ok(names.includes("add"));
    assert.ok(names.includes("fail"));
  });

  it("has correct tool definition shape", () => {
    const ext = createTestExtension();
    const tools = ext.getTools();
    const hello = tools.find((t) => t.name === "hello")!;
    assert.equal(hello.label, "Hello");
    assert.equal(hello.description, "Greet someone");
    assert.deepEqual((hello.parameters as any).required, ["name"]);
  });
});

describe("Tool Execution", () => {
  it("executes async tool", async () => {
    const ext = createTestExtension();
    const result = await ext.executeTool("hello", { name: "Alice" });
    assert.equal(result.content[0].text, "Hello, Alice!");
  });

  it("executes sync tool", async () => {
    const ext = createTestExtension();
    const result = await ext.executeTool("add", { a: 2, b: 3 });
    assert.equal(result.content[0].text, "5");
  });

  it("passes through dict results", async () => {
    const ext = createTestExtension();
    const result = await ext.executeTool("raw", {});
    assert.equal(result.content[0].text, "raw");
    assert.equal((result as any).extra, true);
  });

  it("throws on unknown tool", async () => {
    const ext = createTestExtension();
    await assert.rejects(
      () => ext.executeTool("nonexistent", {}),
      (err: any) => err instanceof RpcError && err.code === ErrorCode.MethodNotFound,
    );
  });

  it("propagates tool errors", async () => {
    const ext = createTestExtension();
    await assert.rejects(
      () => ext.executeTool("fail", {}),
      (err: any) => err instanceof RpcError && err.code === ErrorCode.InvalidParams,
    );
  });
});

describe("RPC Dispatch", () => {
  it("handles initialize with contract version", async () => {
    const ext = createTestExtension();
    const result = (await ext.handleRpc(METHOD_INITIALIZE, {})) as {
      protocol_version: number;
      extension_info: { sdk_version: string };
    };
    assert.equal(result.protocol_version, PROTOCOL_VERSION);
    assert.equal(result.extension_info.sdk_version, SDK_CONTRACT_VERSION);
  });

  it("handles get_tools", async () => {
    const ext = createTestExtension();
    const result = (await ext.handleRpc(METHOD_GET_TOOLS, {})) as any[];
    assert.ok(Array.isArray(result));
    assert.equal(result.length, 4);
  });

  it("handles bootstrap_secrets", async () => {
    const ext = createTestExtension();
    const result = (await ext.handleRpc("bootstrap_secrets", {
      MY_TOKEN: "secret123",
    })) as any;
    assert.equal(result.acknowledged, true);
    assert.equal(ext.getSecret("MY_TOKEN"), "secret123");
    assert.equal(ext.getSecret("MISSING"), undefined);
  });

  it("handles execute_tool", async () => {
    const ext = createTestExtension();
    const result = (await ext.handleRpc(METHOD_EXECUTE_TOOL, {
      name: "hello",
      args: { name: "Bob" },
    })) as any;
    assert.ok(result.content[0].text.includes("Bob"));
  });

  it("rejects unknown methods", async () => {
    const ext = createTestExtension();
    await assert.rejects(
      () => ext.handleRpc("nonexistent", {}),
      (err: any) => err instanceof RpcError && err.code === ErrorCode.MethodNotFound,
    );
  });
});

describe("RpcError", () => {
  it("serializes to JSON", () => {
    const err = RpcError.methodNotFound("foo");
    const json = err.toJSON();
    assert.equal(json.code, ErrorCode.MethodNotFound);
    assert.equal(json.label, "MethodNotFound");
    assert.ok(json.message.includes("foo"));
    assert.equal(json.data, null);
  });

  it("has constructor helpers", () => {
    assert.equal(RpcError.methodNotFound("x").code, ErrorCode.MethodNotFound);
    assert.equal(RpcError.invalidParams("x").code, ErrorCode.InvalidParams);
    assert.equal(RpcError.internalError("x").code, ErrorCode.InternalError);
    assert.equal(RpcError.notImplemented("x").code, ErrorCode.NotImplemented);
  });
});
