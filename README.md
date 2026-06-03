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

Add to `~/.claude.json` under `mcpServers` (this is where Claude Code stores user-level MCP servers):

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

---

## Publishing to npm

Once the local test works, publish `@0xnatal/coros-mcp` so it can be used via `npx` from any machine.

### First time

1. Create an account on [npmjs.com](https://www.npmjs.com) with username `0xnatal`
2. Generate an npm access token: npmjs.com → Avatar → Access Tokens → Generate New Token (Automation)
3. Add it as a GitHub secret: Repository → Settings → Secrets → Actions → `NPM_TOKEN`

### Release (automated via GitHub Actions)

```bash
# 1. Bump the version in packages/mcp/package.json (e.g. 0.1.0 → 0.2.0)
# 2. Commit
git add packages/mcp/package.json
git commit -m "chore(mcp): bump version to 0.2.0"

# 3. Tag and push — the GitHub Actions workflow publishes automatically
git tag v0.2.0
git push && git push --tags
```

The workflow (`.github/workflows/publish.yml`) runs `pnpm build`, `pnpm test`, bundles the MCP server, and publishes to npm.

### Release (manual)

```bash
pnpm build
pnpm --filter @0xnatal/coros-mcp bundle
cd packages/mcp
npm publish --access public
```

### After publishing

Users (and you on other machines) can connect without a local checkout:

```json
{
  "mcpServers": {
    "coros": {
      "type": "stdio",
      "command": "npx",
      "args": ["-y", "@0xnatal/coros-mcp"],
      "env": {
        "COROS_EMAIL": "you@example.com",
        "COROS_PASSWORD": "yourpassword",
        "COROS_REGION": "eu"
      }
    }
  }
}
```
