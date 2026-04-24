# @omegon/extension

TypeScript SDK for building [Omegon](https://github.com/styrene-lab/omegon) extensions.

## Install

```bash
npm install @omegon/extension
```

## Quick start

```ts
import { Extension, serve } from "@omegon/extension";

const ext = new Extension("weather", "0.1.0");

ext.defineTool({
  name: "get_weather",
  label: "Get Weather",
  description: "Get current weather for a city",
  parameters: {
    type: "object",
    properties: {
      city: { type: "string", description: "City name" },
    },
    required: ["city"],
  },
}, async ({ city }) => {
  return `Weather in ${city}: 22°C, sunny`;
});

ext.defineTool({
  name: "list_cities",
  label: "List Cities",
  description: "List supported cities",
  parameters: { type: "object", properties: {} },
}, () => "Supported: London, Tokyo, New York, Sydney");

serve(ext);
```

Save as `weather.ts`, create a `manifest.toml`:

```toml
[extension]
name = "weather"
version = "0.1.0"
description = "Weather information for agents"
sdk_version = "0.15"

[runtime]
type = "native"
binary = "npx tsx weather.ts"

[startup]
ping_method = "get_tools"
timeout_ms = 5000
```

Install and test:

```bash
omegon extension install .
```

## API

### Extension

```ts
const ext = new Extension("my-ext", "0.1.0");
```

### defineTool

```ts
ext.defineTool({
  name: "my_tool",
  label: "My Tool",
  description: "What it does",
  parameters: {
    type: "object",
    properties: {
      arg: { type: "string", description: "An argument" },
    },
    required: ["arg"],
  },
}, async (args) => {
  return `Result: ${args.arg}`;
});
```

Return values are auto-wrapped:
- `string` → `{ content: [{ type: "text", text: "..." }] }`
- object with `content` key → returned as-is
- array → `{ content: [...] }`

### Secrets

```ts
ext.defineTool({ ... }, async (args) => {
  const token = ext.getSecret("API_TOKEN");
  if (!token) return "No API token configured";
  // use token...
});
```

### Custom RPC handling

Override `handleRpc` for full control:

```ts
class MyExtension extends Extension {
  async handleRpc(method: string, params: Record<string, unknown>) {
    if (method === "my_custom") return { custom: true };
    return super.handleRpc(method, params);
  }
}
```

### Errors

```ts
import { RpcError } from "@omegon/extension";

ext.defineTool({ ... }, async ({ divisor }) => {
  if (divisor === 0) throw RpcError.invalidParams("cannot divide by zero");
  return `${100 / divisor}`;
});
```

## Protocol

Implements the [Omegon Extension Protocol](https://github.com/styrene-lab/omegon/blob/main/docs/extension-protocol.md) — JSON-RPC 2.0 over stdin/stdout.

## SDKs

| Language | Package | Status |
|----------|---------|--------|
| **Rust** | `omegon-extension` (crates.io) | Stable — canonical |
| **Python** | `omegon-extension` (PyPI) | Stable |
| **TypeScript** | `@omegon/extension` (npm) | Stable |
| **Go** | planned | — |
| **C/Swift** | planned | — |

## License

MIT
