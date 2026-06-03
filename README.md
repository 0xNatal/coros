# coros

TypeScript client and MCP server for the unofficial [COROS Training Hub](https://trainingHub.coros.com) web API.

> Unofficial. Not affiliated with COROS.

## Packages

| Package | Description |
|---|---|
| `packages/client` | Pure TypeScript API client (`@coros/client`) |
| `packages/cli` | Auth + debug CLI (`coros`) |
| [`packages/mcp`](./packages/mcp/README.md) | MCP server — setup and available tools |

---

## Local development

### 1. Install and build

```bash
pnpm install
pnpm build
```

### 2. Bundle the MCP server

```bash
pnpm --filter @0xnatal/coros-mcp bundle
```

This creates `packages/mcp/dist/index.js` — the standalone binary.

### 3. Connect to Claude Code

Add the server to `~/.claude.json` under `mcpServers`:

```json
{
  "mcpServers": {
    "coros": {
      "type": "stdio",
      "command": "node",
      "args": ["/absolute/path/to/coros/packages/mcp/dist/index.js"],
      "env": {
        "COROS_EMAIL": "you@example.com",
        "COROS_PASSWORD": "yourpassword",
        "COROS_REGION": "eu"
      }
    }
  }
}
```

Reload the VSCode window — the `coros` MCP server should appear under `/mcp`.

### 4. Test individual endpoints

```bash
# Authenticate once
pnpm --filter @coros/cli run dev auth

# Debug any endpoint directly
pnpm --filter @coros/cli run dev debug daily-metrics --weeks 2
pnpm --filter @coros/cli run dev debug activities --weeks 4
pnpm --filter @coros/cli run dev debug activity-detail --label-id <id> --sport-type <n>
pnpm --filter @coros/cli run dev debug training-schedule --weeks 2
```

### Other commands

```bash
pnpm test       # run all tests
pnpm lint       # biome check
```
